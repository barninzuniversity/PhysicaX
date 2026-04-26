import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from "electron";
import { spawn, ChildProcess } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";

const uiPort = Number(process.env.PHYSICAX_UI_PORT || 3000);
const backendPort = Number(process.env.PHYSICAX_BACKEND_PORT || 8000);
const backendUrl = `http://127.0.0.1:${backendPort}`;
const desktopAppName = "physicax-desktop";

const resolveUserDataDir = () => {
  if (app.isReady()) {
    return app.getPath("userData");
  }
  if (process.env.PHYSICAX_USER_DATA_DIR) {
    return process.env.PHYSICAX_USER_DATA_DIR;
  }
  const home = os.homedir();
  if (process.platform === "win32") {
    const base = process.env.APPDATA || path.join(home, "AppData", "Roaming");
    return path.join(base, desktopAppName);
  }
  if (process.platform === "darwin") {
    return path.join(home, "Library", "Application Support", desktopAppName);
  }
  const configHome = process.env.XDG_CONFIG_HOME || path.join(home, ".config");
  return path.join(configHome, desktopAppName);
};

const resolveBootstrapLogPath = () => {
  return path.join(resolveUserDataDir(), "logs", "desktop-main.log");
};

const bootstrapLogPath = resolveBootstrapLogPath();

const appendBootstrapLog = (message: string, meta?: Record<string, unknown>) => {
  try {
    fs.mkdirSync(path.dirname(bootstrapLogPath), { recursive: true });
    const line = [
      new Date().toISOString(),
      message,
      meta ? JSON.stringify(meta) : ""
    ]
      .filter(Boolean)
      .join(" ");
    fs.appendFileSync(bootstrapLogPath, `${line}\n`, "utf-8");
  } catch {
    // Avoid crashing if logging itself fails.
  }
};

appendBootstrapLog("desktop-main:module-loaded", {
  pid: process.pid,
  platform: process.platform,
  execPath: process.execPath,
  appPath: app.getAppPath(),
  resourcesPath: process.resourcesPath
});

let backendProcess: ChildProcess | null = null;
let nextProcess: ChildProcess | null = null;
let nextExited = false;
let nextExitReason = "";
let isQuitting = false;

type DesktopSettings = {
  gpuMode: "high" | "low";
  autoUpdate: boolean;
  updateDir?: string;
};

type ReleaseVerifiedFile = {
  path: string;
  fileName?: string;
  relativePath?: string;
  size: number;
  sha256: string;
};

type ReleaseVerificationSummary = {
  releaseDir?: string;
  version?: string;
  generatedAt?: string;
  verifiedFiles?: ReleaseVerifiedFile[];
};

const defaultSettings: DesktopSettings = {
  gpuMode: "high",
  autoUpdate: true
};

const desktopRoot = () => app.getAppPath();

const resolveWebRoot = () => {
  const localWeb = path.join(desktopRoot(), "web");
  if (!app.isPackaged) {
    if (process.env.PHYSICAX_WEB_ROOT) {
      return process.env.PHYSICAX_WEB_ROOT;
    }
    return path.join(desktopRoot(), "..", "physicax-web");
  }
  if (fs.existsSync(localWeb)) {
    return localWeb;
  }
  if (process.env.PHYSICAX_WEB_ROOT) {
    return process.env.PHYSICAX_WEB_ROOT;
  }
  return path.join(process.resourcesPath, "web");
};

const settingsPath = () => path.join(resolveUserDataDir(), "settings.json");

const loadSettings = (): DesktopSettings => {
  try {
    appendBootstrapLog("desktop-main:load-settings:start", { settingsPath: settingsPath() });
    const raw = fs.readFileSync(settingsPath(), "utf-8");
    const parsed = JSON.parse(raw) as Partial<DesktopSettings>;
    appendBootstrapLog("desktop-main:load-settings:success");
    return {
      gpuMode: parsed.gpuMode === "low" ? "low" : "high",
      autoUpdate: parsed.autoUpdate !== false,
      updateDir: parsed.updateDir
    };
  } catch {
    appendBootstrapLog("desktop-main:load-settings:fallback-defaults");
    return { ...defaultSettings };
  }
};

const saveSettings = (next: DesktopSettings) => {
  fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
  fs.writeFileSync(settingsPath(), JSON.stringify(next, null, 2), "utf-8");
};

const isWsl =
  process.platform === "linux" &&
  (Boolean(process.env.WSL_DISTRO_NAME) ||
    Boolean(process.env.WSL_INTEROP) ||
    os.release().toLowerCase().includes("microsoft"));
const settings = loadSettings();
const envGpuMode = process.env.PHYSICAX_GPU_MODE;
const forceLowGpu = isWsl && envGpuMode !== "high";
appendBootstrapLog("desktop-main:settings-loaded", {
  isWsl,
  envGpuMode,
  forceLowGpu,
  gpuMode: settings.gpuMode,
  autoUpdate: settings.autoUpdate
});
if (forceLowGpu) {
  settings.gpuMode = "low";
}

if (forceLowGpu || settings.gpuMode === "low" || envGpuMode === "low") {
  appendBootstrapLog("desktop-main:apply-low-gpu-mode");
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch("disable-gpu");
  app.commandLine.appendSwitch("disable-gpu-sandbox");
  app.commandLine.appendSwitch("disable-gpu-compositing");
  app.commandLine.appendSwitch("use-gl", "swiftshader");
  process.env.LIBGL_ALWAYS_SOFTWARE = "1";
  process.env.ELECTRON_DISABLE_GPU = "1";
}

const resolveUpdateDir = () => {
  if (settings.updateDir) return settings.updateDir;
  if (process.env.PHYSICAX_UPDATE_DIR) return process.env.PHYSICAX_UPDATE_DIR;
  return path.join(desktopRoot(), "updates");
};

const resolveReleaseDirCandidates = () => {
  const candidates = [
    path.join(desktopRoot(), "dist", "linux-release"),
    path.join(desktopRoot(), "..", "dist", "linux-release"),
    path.join(process.resourcesPath, "linux-release"),
    path.join(path.dirname(process.execPath), "linux-release"),
    path.join(path.dirname(process.execPath), "..", "linux-release"),
    path.join(resolveUpdateDir(), "linux-release"),
    resolveUpdateDir()
  ];

  return [...new Set(candidates)];
};

const getReleaseVerification = () => {
  const summaryName = "verification-summary.json";
  const candidateDirs = resolveReleaseDirCandidates();
  const releaseDir =
    candidateDirs.find((candidate) => fs.existsSync(path.join(candidate, summaryName))) ||
    candidateDirs.find((candidate) => fs.existsSync(candidate));
  if (!releaseDir) {
    return {
      summaryExists: false,
      missingFiles: [],
      availableFiles: [],
      error: "No Linux release directory was found from the desktop runtime."
    };
  }

  const summaryPath = path.join(releaseDir, summaryName);
  const availableFiles = fs.existsSync(releaseDir) ? fs.readdirSync(releaseDir).sort() : [];
  if (!fs.existsSync(summaryPath)) {
    return {
      releaseDir,
      summaryPath,
      summaryExists: false,
      missingFiles: [],
      availableFiles,
      error: "verification-summary.json is missing from the current release directory."
    };
  }

  try {
    const summary = JSON.parse(fs.readFileSync(summaryPath, "utf-8")) as ReleaseVerificationSummary;
    const verifiedFiles = (summary.verifiedFiles ?? []).map((file) => {
      const fileName = file.fileName || file.relativePath || path.basename(file.path);
      const actualPath = fileName ? path.join(releaseDir, fileName) : file.path;
      const exists = fs.existsSync(actualPath);
      const actualSize = exists ? fs.statSync(actualPath).size : undefined;
      return {
        ...file,
        fileName,
        actualPath,
        actualSize,
        exists,
        sizeMatches: exists ? actualSize === file.size : false
      };
    });
    const missingFiles = verifiedFiles.filter((file) => !file.exists).map((file) => file.fileName || path.basename(file.path));

    return {
      releaseDir,
      summaryPath,
      summaryExists: true,
      version: summary.version,
      generatedAt: summary.generatedAt,
      verifiedFiles,
      missingFiles,
      availableFiles
    };
  } catch (error) {
    return {
      releaseDir,
      summaryPath,
      summaryExists: false,
      missingFiles: [],
      availableFiles,
      error: error instanceof Error ? error.message : "Could not parse verification summary."
    };
  }
};

const compareVersions = (a: string, b: string) => {
  const aParts = a.split(".").map((p) => Number(p) || 0);
  const bParts = b.split(".").map((p) => Number(p) || 0);
  const len = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < len; i += 1) {
    const diff = (aParts[i] ?? 0) - (bParts[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
};

const checkForUpdates = async (silent = false) => {
  const updateDir = resolveUpdateDir();
  const manifestPath = path.join(updateDir, "latest.json");
  if (!fs.existsSync(manifestPath)) {
    if (!silent) {
      dialog.showMessageBox({
        type: "info",
        message: "No update manifest found.",
        detail: `Add latest.json in ${updateDir} to enable offline updates.`
      });
    }
    return { available: false };
  }
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as {
      version: string;
      file: string;
      notes?: string;
    };
    const current = app.getVersion();
    const isNewer = compareVersions(manifest.version, current) > 0;
    if (!isNewer) {
      if (!silent) {
        dialog.showMessageBox({
          type: "info",
          message: "You are up to date.",
          detail: `Current version: ${current}`
        });
      }
      return { available: false, version: current };
    }
    const filePath = path.isAbsolute(manifest.file)
      ? manifest.file
      : path.join(updateDir, manifest.file);
    const response = await dialog.showMessageBox({
      type: "info",
      buttons: ["Install update", "Later"],
      defaultId: 0,
      cancelId: 1,
      message: `PhysicaX ${manifest.version} is available.`,
      detail: manifest.notes || `Current version: ${current}`
    });
    if (response.response === 0) {
      if (!fs.existsSync(filePath)) {
        dialog.showErrorBox("Update file missing", `Cannot find update file: ${filePath}`);
        return { available: true, error: "missing-file" };
      }
      spawn(`"${filePath}"`, { shell: true, detached: true, stdio: "ignore" });
      app.quit();
    }
    return { available: true, version: manifest.version };
  } catch (error) {
    if (!silent) {
      dialog.showErrorBox("Update check failed", error instanceof Error ? error.message : "Unknown error");
    }
    return { available: false, error: "invalid-manifest" };
  }
};

const waitForUrl = (url: string, timeoutMs = 20000) =>
  new Promise<boolean>((resolve) => {
    const deadline = Date.now() + timeoutMs;
    const attempt = () => {
      if (Date.now() > deadline) {
        resolve(false);
        return;
      }
      try {
        const target = new URL(url);
        const req = http.request(
          {
            host: target.hostname,
            port: target.port,
            path: target.pathname,
            method: "GET",
            timeout: 2000
          },
          (res) => {
            res.resume();
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) {
              resolve(true);
              return;
            }
            setTimeout(attempt, 800);
          }
        );
        req.on("error", () => setTimeout(attempt, 800));
        req.on("timeout", () => {
          req.destroy();
          setTimeout(attempt, 800);
        });
        req.end();
      } catch {
        setTimeout(attempt, 800);
      }
    };
    attempt();
  });

const readUrl = (url: string, timeoutMs = 3000) =>
  new Promise<string>((resolve, reject) => {
    try {
      const target = new URL(url);
      const req = http.request(
        {
          host: target.hostname,
          port: target.port,
          path: target.pathname,
          method: "GET",
          timeout: timeoutMs
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
          res.on("end", () => {
            if (!res.statusCode || res.statusCode >= 500) {
              reject(new Error(`Unexpected status: ${res.statusCode ?? "unknown"}`));
              return;
            }
            resolve(Buffer.concat(chunks).toString("utf-8"));
          });
        }
      );
      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy(new Error("request-timeout"));
      });
      req.end();
    } catch (error) {
      reject(error);
    }
  });

const probeExistingUi = async () => {
  try {
    const html = await readUrl(`http://127.0.0.1:${uiPort}`, 3000);
    return html.includes("PhysicaX") || html.includes("__next");
  } catch {
    return false;
  }
};

const probeExistingBackend = async () => {
  try {
    const payload = await readUrl(`${backendUrl}/status`, 3000);
    return payload.includes("\"status\"") || payload.includes("ready");
  } catch {
    return false;
  }
};

const ensureLogDir = () => {
  const dir = path.join(resolveUserDataDir(), "logs");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const ensureNextCacheDir = () => {
  const dir = path.join(resolveUserDataDir(), "next-cache");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const ensureBackendDataDir = () => {
  const dir = path.join(resolveUserDataDir(), "backend");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const resolveOpenFoamBashrc = () => {
  const candidates = [
    process.env.CFD_OPENFOAM_BASHRC,
    process.env.CFD_WSL_INIT,
    "/opt/openfoam10/etc/bashrc",
    "/opt/openfoam11/etc/bashrc",
    "/opt/openfoam12/etc/bashrc"
  ].filter(Boolean) as string[];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return "";
};

const attachProcessLogs = (proc: ChildProcess | null, name: string) => {
  if (!proc) return;
  const dir = ensureLogDir();
  const logPath = path.join(dir, `${name}.log`);
  const stream = fs.createWriteStream(logPath, { flags: "a" });
  appendBootstrapLog(`desktop-main:attach-process-logs:${name}`, { logPath });
  proc.stdout?.pipe(stream);
  proc.stderr?.pipe(stream);
};

const stopProcess = (name: string, proc: ChildProcess | null) => {
  if (!proc || proc.killed) return;
  try {
    appendBootstrapLog(`desktop-main:stop-process:${name}`, { pid: proc.pid });
    proc.kill("SIGTERM");
  } catch {
    // ignore shutdown errors
  }
};

const cleanupManagedProcesses = (reason: string) => {
  appendBootstrapLog("desktop-main:cleanup-processes", { reason });
  stopProcess("next", nextProcess);
  stopProcess("backend", backendProcess);
  nextProcess = null;
  backendProcess = null;
};

const resolveWindowIcon = () => {
  const candidates = app.isPackaged
    ? [
        path.join(process.resourcesPath, "build", "icons", "512x512.png"),
        path.join(process.resourcesPath, "build", "icon.png")
      ]
    : [
        path.join(desktopRoot(), "build", "icons", "512x512.png"),
        path.join(desktopRoot(), "build", "icon.png"),
        path.join(desktopRoot(), "build", "icon.svg")
      ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
};

const resolveSplashLogoMarkup = () => {
  const candidates = [
    path.join(desktopRoot(), "build", "icon.svg"),
    path.join(process.resourcesPath, "build", "icon.svg")
  ];
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        return fs.readFileSync(candidate, "utf-8").replace(/\s{2,}/g, " ").trim();
      }
    } catch {
      // ignore and fall through to the fallback markup
    }
  }
  return "<span style='font-weight:800;font-size:20px;letter-spacing:-0.04em;color:#f8fafc'>PX</span>";
};

const normalizeBackendBinary = (candidate: string) => {
  try {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      const inner = path.join(candidate, path.basename(candidate));
      if (fs.existsSync(inner)) {
        return inner;
      }
    }
  } catch {
    // ignore stat errors and fall back to the original candidate
  }
  return candidate;
};

const resolveBackendBinary = () => {
  const name = process.platform === "win32" ? "physicax-cfd-backend.exe" : "physicax-cfd-backend";
  if (app.isPackaged) {
    return normalizeBackendBinary(path.join(process.resourcesPath, "backend", name));
  }
  return normalizeBackendBinary(path.join(desktopRoot(), "backend", "dist", name));
};

const resolveBackendCwd = (backendBinary: string) => {
  const dir = path.dirname(backendBinary);
  if (fs.existsSync(dir)) return dir;
  if (app.isPackaged && fs.existsSync(process.resourcesPath)) return process.resourcesPath;
  return app.getPath("userData");
};

const resolvePython = () => {
  const root = resolveWebRoot();
  if (process.platform === "win32") {
    const candidate = path.join(root, "cfd", "backend", ".venv", "Scripts", "python.exe");
    if (fs.existsSync(candidate)) return candidate;
  } else {
    const candidate = path.join(root, "cfd", "backend", ".venv", "bin", "python");
    if (fs.existsSync(candidate)) return candidate;
  }
  return "";
};

const resolveNodeRuntime = () => {
  const envCandidate = process.env.PHYSICAX_NODE_PATH || process.env.NODE_BINARY;
  if (envCandidate && fs.existsSync(envCandidate)) {
    return envCandidate;
  }
  if (process.platform === "win32") {
    return process.execPath;
  }
  const candidates = ["/usr/bin/node", "/usr/local/bin/node", "/bin/node"];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return process.execPath;
};

const startBackend = async () => {
  if (await probeExistingBackend()) {
    appendBootstrapLog("desktop-main:reuse-existing-backend", { backendUrl });
    return true;
  }
  const backendBinary = resolveBackendBinary();
  const backendDataDir = ensureBackendDataDir();
  const openFoamBashrc = resolveOpenFoamBashrc();
  appendBootstrapLog("desktop-main:start-backend", {
    appIsPackaged: app.isPackaged,
    backendBinary,
    backendBinaryExists: fs.existsSync(backendBinary),
    backendDataDir,
    openFoamBashrc
  });
  const env = {
    ...process.env,
    PORT: String(backendPort),
    CFD_ALLOW_RUN: process.env.CFD_ALLOW_RUN || "1",
    PHYSICAX_DATA_DIR: backendDataDir,
    CFD_OPENFOAM_BASHRC: openFoamBashrc
  };
  try {
    if (fs.existsSync(backendBinary)) {
      if (process.platform !== "win32") {
        try {
          fs.chmodSync(backendBinary, 0o755);
        } catch {
          // ignore chmod failures on read-only mounts
        }
      }
      backendProcess = spawn(backendBinary, [], {
        env,
        cwd: resolveBackendCwd(backendBinary),
        stdio: "pipe"
      });
      appendBootstrapLog("desktop-main:backend-spawned-binary", {
        pid: backendProcess.pid,
        cwd: resolveBackendCwd(backendBinary)
      });
    } else {
      const python = resolvePython();
      if (!python) {
        dialog.showErrorBox(
          "CFD backend missing",
          "Could not find a backend binary or Python virtualenv. CFD will be disabled, but the app can still run."
        );
        return false;
      }
      const backendRoot = path.join(resolveWebRoot(), "cfd", "backend");
      backendProcess = spawn(
        python,
        ["-m", "uvicorn", "app:app", "--app-dir", backendRoot, "--host", "127.0.0.1", "--port", String(backendPort)],
        { env, cwd: backendRoot, stdio: "pipe" }
      );
      appendBootstrapLog("desktop-main:backend-spawned-python", {
        pid: backendProcess.pid,
        python,
        backendRoot
      });
    }
  } catch (error) {
    const detail =
      error instanceof Error
        ? error.message
        : "Failed to start the CFD backend. Check permissions and relaunch.";
    appendBootstrapLog("desktop-main:backend-start-error", { detail });
    dialog.showErrorBox("CFD backend error", detail);
    return false;
  }
  attachProcessLogs(backendProcess, "backend");
  backendProcess?.on("exit", (code, signal) => {
    appendBootstrapLog("desktop-main:backend-exit", { code, signal });
  });
  backendProcess?.on("error", (err) => {
    appendBootstrapLog("desktop-main:backend-error", { message: err.message });
    const hint =
      process.platform === "win32"
        ? "If Windows Smart App Control or Defender blocked the backend, allow it and relaunch."
        : "Check permissions and relaunch.";
    dialog.showErrorBox("CFD backend error", `Failed to start the CFD backend. ${hint}`);
  });
  const ready = await waitForUrl(`${backendUrl}/status`, 20000);
  appendBootstrapLog("desktop-main:backend-ready-check", { ready });
  if (!ready) {
    dialog.showErrorBox(
      "CFD backend timeout",
      "Backend did not respond in time. CFD will be disabled, but the app can still run."
    );
  }
  return ready;
};

const startNextServer = async () => {
  if (await probeExistingUi()) {
    appendBootstrapLog("desktop-main:reuse-existing-ui", { uiPort });
    return true;
  }
  if (process.env.ELECTRON_START_URL && !app.isPackaged) {
    appendBootstrapLog("desktop-main:skip-next-server", { reason: "ELECTRON_START_URL" });
    return true;
  }
  const webRoot = resolveWebRoot();
  const standaloneServer = path.join(webRoot, ".next", "standalone", "server.js");
  const nextBin = path.join(webRoot, "node_modules", "next", "dist", "bin", "next");
  const nextCacheDir = ensureNextCacheDir();
  appendBootstrapLog("desktop-main:start-next-server", {
    appIsPackaged: app.isPackaged,
    webRoot,
    standaloneServer,
    standaloneExists: fs.existsSync(standaloneServer),
    nextBin,
    nextBinExists: fs.existsSync(nextBin),
    nextCacheDir
  });
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: app.isPackaged ? "production" : "development",
    PORT: String(uiPort),
    CFD_BACKEND_URL: backendUrl,
    NEXT_PUBLIC_CFD_BACKEND_URL: backendUrl,
    NEXT_TELEMETRY_DISABLED: "1",
    NEXT_CACHE_DIR: nextCacheDir,
    TMPDIR: nextCacheDir,
    TEMP: nextCacheDir,
    TMP: nextCacheDir
  };

  if (app.isPackaged && fs.existsSync(standaloneServer)) {
    const nextRuntime = resolveNodeRuntime();
    const nextEnv = { ...env };
    appendBootstrapLog("desktop-main:next-runtime-selected", {
      nextRuntime,
      usesElectronExecPath: nextRuntime === process.execPath
    });
    if (nextRuntime === process.execPath) {
      nextEnv.ELECTRON_RUN_AS_NODE = "1";
    } else {
      delete nextEnv.ELECTRON_RUN_AS_NODE;
    }
    nextProcess = spawn(nextRuntime, [standaloneServer], { cwd: webRoot, env: nextEnv, stdio: "pipe" });
    appendBootstrapLog("desktop-main:next-spawned-standalone", {
      pid: nextProcess.pid,
      cwd: webRoot
    });
  } else {
    if (!fs.existsSync(nextBin)) {
      appendBootstrapLog("desktop-main:next-missing", { webRoot, nextBin });
      dialog.showErrorBox("Next.js not found", "Cannot locate Next.js. Run npm install first.");
      return false;
    }
    env.ELECTRON_RUN_AS_NODE = "1";
    const args = [nextBin, app.isPackaged ? "start" : "dev", "-p", String(uiPort)];
    nextProcess = spawn(process.execPath, args, { cwd: webRoot, env, stdio: "pipe" });
    appendBootstrapLog("desktop-main:next-spawned-cli", {
      pid: nextProcess.pid,
      cwd: webRoot,
      args
    });
  }
  attachProcessLogs(nextProcess, "next");
  nextProcess.on("error", () => {
    appendBootstrapLog("desktop-main:next-error");
    if (isQuitting) return;
    dialog.showErrorBox("Next.js error", "Failed to start the Next.js server.");
  });
  nextProcess.on("exit", (code, signal) => {
    appendBootstrapLog("desktop-main:next-exit", { code, signal });
    nextExited = true;
    nextExitReason = code !== null ? `exit code ${code}` : signal ? `signal ${signal}` : "unknown";
    if (isQuitting) return;
    dialog.showErrorBox(
      "Next.js stopped",
      `The UI server exited (${nextExitReason}). Logs are at: ${path.join(app.getPath("userData"), "logs")}`
    );
  });
  return true;
};

const splashHtml = (message: string) =>
  "data:text/html;charset=utf-8," +
  encodeURIComponent(
    "<html><head><style>" +
      "body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:radial-gradient(circle at 20% 20%,rgba(59,130,246,0.2),transparent 45%),radial-gradient(circle at 80% 30%,rgba(124,58,237,0.18),transparent 50%),#0b0f1a;color:#f8fafc;font-family:'Segoe UI',sans-serif;}" +
      ".card{background:rgba(16,24,38,0.88);padding:36px 40px;border-radius:22px;box-shadow:0 30px 70px rgba(0,0,0,0.4);max-width:540px;text-align:center;border:1px solid rgba(148,163,184,0.2);backdrop-filter:blur(16px) saturate(140%);}" +
      ".logo{display:flex;align-items:center;justify-content:center;gap:12px;font-size:24px;font-weight:700;margin-bottom:10px;}" +
      ".mark{width:54px;height:54px;border-radius:16px;background:linear-gradient(135deg,#071121,#13274f);display:grid;place-items:center;box-shadow:0 14px 32px rgba(59,130,246,0.26);border:1px solid rgba(96,165,250,0.25);overflow:hidden;}" +
      ".mark svg{width:58px;height:58px;display:block;}" +
      ".pulse{width:56px;height:56px;border-radius:50%;border:2px solid rgba(125,211,252,0.35);position:absolute;animation:pulse 2.6s ease-out infinite;}" +
      ".loader{width:42px;height:42px;border:3px solid rgba(255,255,255,0.25);border-top-color:#7dd3fc;border-radius:50%;margin:18px auto 10px;animation:spin 1s linear infinite;}" +
      ".bar{height:6px;border-radius:999px;background:rgba(148,163,184,0.2);overflow:hidden;margin:14px 0 6px;}" +
      ".bar span{display:block;height:100%;width:40%;background:linear-gradient(90deg,#60a5fa,#a78bfa);animation:load 2.4s ease-in-out infinite;}" +
      ".muted{color:rgba(248,250,252,0.72);font-size:13px;line-height:1.5;}" +
      "@keyframes spin{to{transform:rotate(360deg)}}" +
      "@keyframes pulse{0%{transform:scale(0.7);opacity:0.7;}70%{transform:scale(1.3);opacity:0;}100%{opacity:0;}}" +
      "@keyframes load{0%{transform:translateX(-100%);}50%{transform:translateX(60%);}100%{transform:translateX(220%);}}" +
      "</style></head><body><div class='card'><div class='logo'><div class='mark'>" +
      resolveSplashLogoMarkup() +
      "</div><div>PhysicaX</div></div><div class='loader'></div><div class='bar'><span></span></div><div class='muted'>" +
      message +
      "</div></div></body></html>"
  );

const createWindow = (startUrl: string, show = true) => {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#0b0b12",
    icon: resolveWindowIcon(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    },
    show
  });
  win.once("ready-to-show", () => {
    if (show) win.show();
  });
  win.loadURL(startUrl);
  return win;
};

ipcMain.handle("physicax:get-backend-url", () => backendUrl);
ipcMain.handle("physicax:get-settings", () => settings);
ipcMain.handle("physicax:get-release-verification", () => getReleaseVerification());
ipcMain.handle("physicax:set-gpu-mode", (_event, mode: "high" | "low") => {
  settings.gpuMode = mode;
  saveSettings(settings);
  app.relaunch();
  app.exit();
  return settings;
});
ipcMain.handle("physicax:check-updates", async () => checkForUpdates(false));
ipcMain.handle("physicax:get-version", () => app.getVersion());
ipcMain.handle("physicax:open-update-folder", () => {
  const dir = resolveUpdateDir();
  fs.mkdirSync(dir, { recursive: true });
  shell.openPath(dir);
});
appendBootstrapLog("desktop-main:ipc-handlers-registered");

process.on("uncaughtException", (error) => {
  appendBootstrapLog("desktop-main:uncaught-exception", {
    message: error.message,
    stack: error.stack
  });
  cleanupManagedProcesses("uncaught-exception");
});

process.on("unhandledRejection", (reason) => {
  appendBootstrapLog("desktop-main:unhandled-rejection", {
    reason: reason instanceof Error ? { message: reason.message, stack: reason.stack } : String(reason)
  });
});

process.on("exit", (code) => {
  cleanupManagedProcesses("process-exit");
  appendBootstrapLog("desktop-main:process-exit", { code });
});

process.on("SIGINT", () => {
  cleanupManagedProcesses("sigint");
  process.exit(0);
});

process.on("SIGTERM", () => {
  cleanupManagedProcesses("sigterm");
  process.exit(0);
});

app.on("will-finish-launching", () => {
  appendBootstrapLog("desktop-main:will-finish-launching");
});

app.on("ready", () => {
  appendBootstrapLog("desktop-main:ready-event");
});

app.whenReady().then(async () => {
  appendBootstrapLog("desktop-main:when-ready", {
    appPath: app.getAppPath(),
    userData: app.getPath("userData"),
    resourcesPath: process.resourcesPath
  });
  const startUrl = process.env.ELECTRON_START_URL || `http://localhost:${uiPort}`;
  const win = createWindow(splashHtml("Starting local server..."), false);
  win.show();

  void startBackend().catch(() => {});
  const nextStarted = await startNextServer();
  appendBootstrapLog("desktop-main:next-started-flag", { nextStarted });
  if (!nextStarted) {
    win.loadURL(
      splashHtml(
        "UI server failed to start. Check logs at:<br/><br/>" + path.join(app.getPath("userData"), "logs")
      )
    );
    return;
  }

  if (settings.autoUpdate) {
    void checkForUpdates(true);
  }

  const ready = await waitForUrl(`http://localhost:${uiPort}`, app.isPackaged ? 60000 : 20000);
  appendBootstrapLog("desktop-main:ui-ready-check", { ready });
  if (ready) {
    win.loadURL(startUrl);
    return;
  }

  if (nextExited) {
    win.loadURL(
      splashHtml(
        "UI server exited. Check logs at:<br/><br/>" +
          path.join(app.getPath("userData"), "logs") +
          "<br/><br/>Reason: " +
          nextExitReason
      )
    );
    return;
  }

  win.loadURL(
    splashHtml(
      "Still starting. If this takes too long, close and reopen. Logs are at:<br/><br/>" +
        path.join(app.getPath("userData"), "logs")
    )
  );

  // Keep polling silently until the UI becomes ready.
  const interval = setInterval(async () => {
    const ok = await waitForUrl(`http://localhost:${uiPort}`, 8000);
    if (ok) {
      clearInterval(interval);
      win.loadURL(startUrl);
    }
  }, 6000);
  const menu = Menu.buildFromTemplate([
    {
      label: "PhysicaX",
      submenu: [
        {
          label: "Check for Updates",
          click: () => void checkForUpdates(false)
        },
        { type: "separator" },
        {
          label: "GPU Mode",
          submenu: [
            {
              label: "High Performance",
              type: "radio",
              checked: settings.gpuMode !== "low",
              click: () => ipcMain.emit("physicax:set-gpu-mode", null, "high")
            },
            {
              label: "Low Power",
              type: "radio",
              checked: settings.gpuMode === "low",
              click: () => ipcMain.emit("physicax:set-gpu-mode", null, "low")
            }
          ]
        },
        { type: "separator" },
        { role: "quit" }
      ]
    },
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" }
  ]);
  Menu.setApplicationMenu(menu);
});

app.on("before-quit", () => {
  appendBootstrapLog("desktop-main:before-quit");
  isQuitting = true;
  cleanupManagedProcesses("before-quit");
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const startUrl = process.env.ELECTRON_START_URL || `http://localhost:${uiPort}`;
    createWindow(startUrl);
  }
});
