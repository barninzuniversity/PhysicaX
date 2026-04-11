"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const node_child_process_1 = require("node:child_process");
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_http_1 = __importDefault(require("node:http"));
const node_os_1 = __importDefault(require("node:os"));
const uiPort = Number(process.env.PHYSICAX_UI_PORT || 3000);
const backendPort = Number(process.env.PHYSICAX_BACKEND_PORT || 8000);
const backendUrl = `http://localhost:${backendPort}`;
let backendProcess = null;
let nextProcess = null;
let nextExited = false;
let nextExitReason = "";
let isQuitting = false;
const defaultSettings = {
    gpuMode: "high",
    autoUpdate: true
};
const desktopRoot = () => electron_1.app.getAppPath();
const resolveWebRoot = () => {
    const localWeb = node_path_1.default.join(desktopRoot(), "web");
    if (!electron_1.app.isPackaged) {
        if (process.env.PHYSICAX_WEB_ROOT) {
            return process.env.PHYSICAX_WEB_ROOT;
        }
        return node_path_1.default.join(desktopRoot(), "..", "physicax-web");
    }
    if (node_fs_1.default.existsSync(localWeb)) {
        return localWeb;
    }
    if (process.env.PHYSICAX_WEB_ROOT) {
        return process.env.PHYSICAX_WEB_ROOT;
    }
    return node_path_1.default.join(process.resourcesPath, "web");
};
const settingsPath = () => node_path_1.default.join(electron_1.app.getPath("userData"), "settings.json");
const loadSettings = () => {
    try {
        const raw = node_fs_1.default.readFileSync(settingsPath(), "utf-8");
        const parsed = JSON.parse(raw);
        return {
            gpuMode: parsed.gpuMode === "low" ? "low" : "high",
            autoUpdate: parsed.autoUpdate !== false,
            updateDir: parsed.updateDir
        };
    }
    catch {
        return { ...defaultSettings };
    }
};
const saveSettings = (next) => {
    node_fs_1.default.mkdirSync(node_path_1.default.dirname(settingsPath()), { recursive: true });
    node_fs_1.default.writeFileSync(settingsPath(), JSON.stringify(next, null, 2), "utf-8");
};
const isWsl = process.platform === "linux" &&
    (Boolean(process.env.WSL_DISTRO_NAME) ||
        Boolean(process.env.WSL_INTEROP) ||
        node_os_1.default.release().toLowerCase().includes("microsoft"));
const settings = loadSettings();
const envGpuMode = process.env.PHYSICAX_GPU_MODE;
const forceLowGpu = isWsl && envGpuMode !== "high";
if (forceLowGpu) {
    settings.gpuMode = "low";
}
if (forceLowGpu || settings.gpuMode === "low" || envGpuMode === "low") {
    electron_1.app.disableHardwareAcceleration();
    electron_1.app.commandLine.appendSwitch("disable-gpu");
    electron_1.app.commandLine.appendSwitch("disable-gpu-sandbox");
    electron_1.app.commandLine.appendSwitch("disable-gpu-compositing");
    electron_1.app.commandLine.appendSwitch("use-gl", "swiftshader");
    process.env.LIBGL_ALWAYS_SOFTWARE = "1";
    process.env.ELECTRON_DISABLE_GPU = "1";
}
const resolveUpdateDir = () => {
    if (settings.updateDir)
        return settings.updateDir;
    if (process.env.PHYSICAX_UPDATE_DIR)
        return process.env.PHYSICAX_UPDATE_DIR;
    return node_path_1.default.join(desktopRoot(), "updates");
};
const compareVersions = (a, b) => {
    const aParts = a.split(".").map((p) => Number(p) || 0);
    const bParts = b.split(".").map((p) => Number(p) || 0);
    const len = Math.max(aParts.length, bParts.length);
    for (let i = 0; i < len; i += 1) {
        const diff = (aParts[i] ?? 0) - (bParts[i] ?? 0);
        if (diff !== 0)
            return diff;
    }
    return 0;
};
const checkForUpdates = async (silent = false) => {
    const updateDir = resolveUpdateDir();
    const manifestPath = node_path_1.default.join(updateDir, "latest.json");
    if (!node_fs_1.default.existsSync(manifestPath)) {
        if (!silent) {
            electron_1.dialog.showMessageBox({
                type: "info",
                message: "No update manifest found.",
                detail: `Add latest.json in ${updateDir} to enable offline updates.`
            });
        }
        return { available: false };
    }
    try {
        const manifest = JSON.parse(node_fs_1.default.readFileSync(manifestPath, "utf-8"));
        const current = electron_1.app.getVersion();
        const isNewer = compareVersions(manifest.version, current) > 0;
        if (!isNewer) {
            if (!silent) {
                electron_1.dialog.showMessageBox({
                    type: "info",
                    message: "You are up to date.",
                    detail: `Current version: ${current}`
                });
            }
            return { available: false, version: current };
        }
        const filePath = node_path_1.default.isAbsolute(manifest.file)
            ? manifest.file
            : node_path_1.default.join(updateDir, manifest.file);
        const response = await electron_1.dialog.showMessageBox({
            type: "info",
            buttons: ["Install update", "Later"],
            defaultId: 0,
            cancelId: 1,
            message: `PhysicaX ${manifest.version} is available.`,
            detail: manifest.notes || `Current version: ${current}`
        });
        if (response.response === 0) {
            if (!node_fs_1.default.existsSync(filePath)) {
                electron_1.dialog.showErrorBox("Update file missing", `Cannot find update file: ${filePath}`);
                return { available: true, error: "missing-file" };
            }
            (0, node_child_process_1.spawn)(`"${filePath}"`, { shell: true, detached: true, stdio: "ignore" });
            electron_1.app.quit();
        }
        return { available: true, version: manifest.version };
    }
    catch (error) {
        if (!silent) {
            electron_1.dialog.showErrorBox("Update check failed", error instanceof Error ? error.message : "Unknown error");
        }
        return { available: false, error: "invalid-manifest" };
    }
};
const waitForUrl = (url, timeoutMs = 20000) => new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;
    const attempt = () => {
        if (Date.now() > deadline) {
            resolve(false);
            return;
        }
        try {
            const target = new URL(url);
            const req = node_http_1.default.request({
                host: target.hostname,
                port: target.port,
                path: target.pathname,
                method: "GET",
                timeout: 2000
            }, (res) => {
                res.resume();
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) {
                    resolve(true);
                    return;
                }
                setTimeout(attempt, 800);
            });
            req.on("error", () => setTimeout(attempt, 800));
            req.on("timeout", () => {
                req.destroy();
                setTimeout(attempt, 800);
            });
            req.end();
        }
        catch {
            setTimeout(attempt, 800);
        }
    };
    attempt();
});
const ensureLogDir = () => {
    const dir = node_path_1.default.join(electron_1.app.getPath("userData"), "logs");
    node_fs_1.default.mkdirSync(dir, { recursive: true });
    return dir;
};
const ensureNextCacheDir = () => {
    const dir = node_path_1.default.join(electron_1.app.getPath("userData"), "next-cache");
    node_fs_1.default.mkdirSync(dir, { recursive: true });
    return dir;
};
const ensureBackendDataDir = () => {
    const dir = node_path_1.default.join(electron_1.app.getPath("userData"), "backend");
    node_fs_1.default.mkdirSync(dir, { recursive: true });
    return dir;
};
const resolveOpenFoamBashrc = () => {
    const candidates = [
        process.env.CFD_OPENFOAM_BASHRC,
        process.env.CFD_WSL_INIT,
        "/opt/openfoam10/etc/bashrc",
        "/opt/openfoam11/etc/bashrc",
        "/opt/openfoam12/etc/bashrc"
    ].filter(Boolean);
    for (const candidate of candidates) {
        if (node_fs_1.default.existsSync(candidate)) {
            return candidate;
        }
    }
    return "";
};
const attachProcessLogs = (proc, name) => {
    if (!proc)
        return;
    const dir = ensureLogDir();
    const logPath = node_path_1.default.join(dir, `${name}.log`);
    const stream = node_fs_1.default.createWriteStream(logPath, { flags: "a" });
    proc.stdout?.pipe(stream);
    proc.stderr?.pipe(stream);
};
const normalizeBackendBinary = (candidate) => {
    try {
        if (node_fs_1.default.existsSync(candidate) && node_fs_1.default.statSync(candidate).isDirectory()) {
            const inner = node_path_1.default.join(candidate, node_path_1.default.basename(candidate));
            if (node_fs_1.default.existsSync(inner)) {
                return inner;
            }
        }
    }
    catch {
        // ignore stat errors and fall back to the original candidate
    }
    return candidate;
};
const resolveBackendBinary = () => {
    const name = process.platform === "win32" ? "physicax-cfd-backend.exe" : "physicax-cfd-backend";
    if (electron_1.app.isPackaged) {
        return normalizeBackendBinary(node_path_1.default.join(process.resourcesPath, "backend", name));
    }
    return normalizeBackendBinary(node_path_1.default.join(desktopRoot(), "backend", "dist", name));
};
const resolveBackendCwd = (backendBinary) => {
    const dir = node_path_1.default.dirname(backendBinary);
    if (node_fs_1.default.existsSync(dir))
        return dir;
    if (electron_1.app.isPackaged && node_fs_1.default.existsSync(process.resourcesPath))
        return process.resourcesPath;
    return electron_1.app.getPath("userData");
};
const resolvePython = () => {
    const root = resolveWebRoot();
    if (process.platform === "win32") {
        const candidate = node_path_1.default.join(root, "cfd", "backend", ".venv", "Scripts", "python.exe");
        if (node_fs_1.default.existsSync(candidate))
            return candidate;
    }
    else {
        const candidate = node_path_1.default.join(root, "cfd", "backend", ".venv", "bin", "python");
        if (node_fs_1.default.existsSync(candidate))
            return candidate;
    }
    return "";
};
const startBackend = async () => {
    const backendBinary = resolveBackendBinary();
    const backendDataDir = ensureBackendDataDir();
    const openFoamBashrc = resolveOpenFoamBashrc();
    const env = {
        ...process.env,
        PORT: String(backendPort),
        CFD_ALLOW_RUN: process.env.CFD_ALLOW_RUN || "1",
        PHYSICAX_DATA_DIR: backendDataDir,
        CFD_OPENFOAM_BASHRC: openFoamBashrc
    };
    try {
        if (node_fs_1.default.existsSync(backendBinary)) {
            if (process.platform !== "win32") {
                try {
                    node_fs_1.default.chmodSync(backendBinary, 0o755);
                }
                catch {
                    // ignore chmod failures on read-only mounts
                }
            }
            backendProcess = (0, node_child_process_1.spawn)(backendBinary, [], {
                env,
                cwd: resolveBackendCwd(backendBinary),
                stdio: "pipe"
            });
        }
        else {
            const python = resolvePython();
            if (!python) {
                electron_1.dialog.showErrorBox("CFD backend missing", "Could not find a backend binary or Python virtualenv. CFD will be disabled, but the app can still run.");
                return false;
            }
            const backendRoot = node_path_1.default.join(resolveWebRoot(), "cfd", "backend");
            backendProcess = (0, node_child_process_1.spawn)(python, ["-m", "uvicorn", "app:app", "--app-dir", backendRoot, "--host", "127.0.0.1", "--port", String(backendPort)], { env, cwd: backendRoot, stdio: "pipe" });
        }
    }
    catch (error) {
        const detail = error instanceof Error
            ? error.message
            : "Failed to start the CFD backend. Check permissions and relaunch.";
        electron_1.dialog.showErrorBox("CFD backend error", detail);
        return false;
    }
    attachProcessLogs(backendProcess, "backend");
    backendProcess?.on("error", (err) => {
        const hint = process.platform === "win32"
            ? "If Windows Smart App Control or Defender blocked the backend, allow it and relaunch."
            : "Check permissions and relaunch.";
        electron_1.dialog.showErrorBox("CFD backend error", `Failed to start the CFD backend. ${hint}`);
    });
    const ready = await waitForUrl(`${backendUrl}/status`, 20000);
    if (!ready) {
        electron_1.dialog.showErrorBox("CFD backend timeout", "Backend did not respond in time. CFD will be disabled, but the app can still run.");
    }
    return ready;
};
const startNextServer = () => {
    if (process.env.ELECTRON_START_URL && !electron_1.app.isPackaged) {
        return true;
    }
    const webRoot = resolveWebRoot();
    const standaloneServer = node_path_1.default.join(webRoot, ".next", "standalone", "server.js");
    const nextBin = node_path_1.default.join(webRoot, "node_modules", "next", "dist", "bin", "next");
    const nextCacheDir = ensureNextCacheDir();
    const env = {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
        NODE_ENV: electron_1.app.isPackaged ? "production" : "development",
        PORT: String(uiPort),
        CFD_BACKEND_URL: backendUrl,
        NEXT_PUBLIC_CFD_BACKEND_URL: backendUrl,
        NEXT_TELEMETRY_DISABLED: "1",
        NEXT_CACHE_DIR: nextCacheDir,
        TMPDIR: nextCacheDir,
        TEMP: nextCacheDir,
        TMP: nextCacheDir
    };
    if (electron_1.app.isPackaged && node_fs_1.default.existsSync(standaloneServer)) {
        nextProcess = (0, node_child_process_1.spawn)(process.execPath, [standaloneServer], { cwd: webRoot, env, stdio: "pipe" });
    }
    else {
        if (!node_fs_1.default.existsSync(nextBin)) {
            electron_1.dialog.showErrorBox("Next.js not found", "Cannot locate Next.js. Run npm install first.");
            return false;
        }
        const args = [nextBin, electron_1.app.isPackaged ? "start" : "dev", "-p", String(uiPort)];
        nextProcess = (0, node_child_process_1.spawn)(process.execPath, args, { cwd: webRoot, env, stdio: "pipe" });
    }
    attachProcessLogs(nextProcess, "next");
    nextProcess.on("error", () => {
        if (isQuitting)
            return;
        electron_1.dialog.showErrorBox("Next.js error", "Failed to start the Next.js server.");
    });
    nextProcess.on("exit", (code, signal) => {
        nextExited = true;
        nextExitReason = code !== null ? `exit code ${code}` : signal ? `signal ${signal}` : "unknown";
        if (isQuitting)
            return;
        electron_1.dialog.showErrorBox("Next.js stopped", `The UI server exited (${nextExitReason}). Logs are at: ${node_path_1.default.join(electron_1.app.getPath("userData"), "logs")}`);
    });
    return true;
};
const splashHtml = (message) => "data:text/html;charset=utf-8," +
    encodeURIComponent("<html><head><style>" +
        "body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:radial-gradient(circle at 20% 20%,rgba(59,130,246,0.2),transparent 45%),radial-gradient(circle at 80% 30%,rgba(124,58,237,0.18),transparent 50%),#0b0f1a;color:#f8fafc;font-family:'Segoe UI',sans-serif;}" +
        ".card{background:rgba(16,24,38,0.88);padding:36px 40px;border-radius:22px;box-shadow:0 30px 70px rgba(0,0,0,0.4);max-width:540px;text-align:center;border:1px solid rgba(148,163,184,0.2);backdrop-filter:blur(16px) saturate(140%);}" +
        ".logo{display:flex;align-items:center;justify-content:center;gap:12px;font-size:24px;font-weight:700;margin-bottom:10px;}" +
        ".mark{width:46px;height:46px;border-radius:14px;background:#0f172a;display:grid;place-items:center;box-shadow:0 12px 28px rgba(59,130,246,0.3);border:1px solid rgba(96,165,250,0.35);}" +
        ".mark span{color:#e2e8f0;font-weight:700;letter-spacing:-0.04em;}" +
        ".pulse{width:56px;height:56px;border-radius:50%;border:2px solid rgba(125,211,252,0.35);position:absolute;animation:pulse 2.6s ease-out infinite;}" +
        ".loader{width:42px;height:42px;border:3px solid rgba(255,255,255,0.25);border-top-color:#7dd3fc;border-radius:50%;margin:18px auto 10px;animation:spin 1s linear infinite;}" +
        ".bar{height:6px;border-radius:999px;background:rgba(148,163,184,0.2);overflow:hidden;margin:14px 0 6px;}" +
        ".bar span{display:block;height:100%;width:40%;background:linear-gradient(90deg,#60a5fa,#a78bfa);animation:load 2.4s ease-in-out infinite;}" +
        ".muted{color:rgba(248,250,252,0.72);font-size:13px;line-height:1.5;}" +
        "@keyframes spin{to{transform:rotate(360deg)}}" +
        "@keyframes pulse{0%{transform:scale(0.7);opacity:0.7;}70%{transform:scale(1.3);opacity:0;}100%{opacity:0;}}" +
        "@keyframes load{0%{transform:translateX(-100%);}50%{transform:translateX(60%);}100%{transform:translateX(220%);}}" +
        "</style></head><body><div class='card'><div class='logo'><div class='mark'><span>PX</span></div><div>PhysicaX</div></div><div class='loader'></div><div class='bar'><span></span></div><div class='muted'>" +
        message +
        "</div></div></body></html>");
const createWindow = (startUrl, show = true) => {
    const win = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1100,
        minHeight: 700,
        backgroundColor: "#0b0b12",
        webPreferences: {
            preload: node_path_1.default.join(__dirname, "preload.js")
        },
        show
    });
    win.once("ready-to-show", () => {
        if (show)
            win.show();
    });
    win.loadURL(startUrl);
    return win;
};
electron_1.ipcMain.handle("physicax:get-backend-url", () => backendUrl);
electron_1.ipcMain.handle("physicax:get-settings", () => settings);
electron_1.ipcMain.handle("physicax:set-gpu-mode", (_event, mode) => {
    settings.gpuMode = mode;
    saveSettings(settings);
    electron_1.app.relaunch();
    electron_1.app.exit();
    return settings;
});
electron_1.ipcMain.handle("physicax:check-updates", async () => checkForUpdates(false));
electron_1.ipcMain.handle("physicax:get-version", () => electron_1.app.getVersion());
electron_1.ipcMain.handle("physicax:open-update-folder", () => {
    const dir = resolveUpdateDir();
    node_fs_1.default.mkdirSync(dir, { recursive: true });
    electron_1.shell.openPath(dir);
});
electron_1.app.whenReady().then(async () => {
    const startUrl = process.env.ELECTRON_START_URL || `http://localhost:${uiPort}`;
    const win = createWindow(splashHtml("Starting local server..."), false);
    win.show();
    void startBackend().catch(() => { });
    const nextStarted = startNextServer();
    if (!nextStarted) {
        win.loadURL(splashHtml("UI server failed to start. Check logs at:<br/><br/>" + node_path_1.default.join(electron_1.app.getPath("userData"), "logs")));
        return;
    }
    if (settings.autoUpdate) {
        void checkForUpdates(true);
    }
    const ready = await waitForUrl(`http://localhost:${uiPort}`, electron_1.app.isPackaged ? 60000 : 20000);
    if (ready) {
        win.loadURL(startUrl);
        return;
    }
    if (nextExited) {
        win.loadURL(splashHtml("UI server exited. Check logs at:<br/><br/>" +
            node_path_1.default.join(electron_1.app.getPath("userData"), "logs") +
            "<br/><br/>Reason: " +
            nextExitReason));
        return;
    }
    win.loadURL(splashHtml("Still starting. If this takes too long, close and reopen. Logs are at:<br/><br/>" +
        node_path_1.default.join(electron_1.app.getPath("userData"), "logs")));
    // Keep polling silently until the UI becomes ready.
    const interval = setInterval(async () => {
        const ok = await waitForUrl(`http://localhost:${uiPort}`, 8000);
        if (ok) {
            clearInterval(interval);
            win.loadURL(startUrl);
        }
    }, 6000);
    const menu = electron_1.Menu.buildFromTemplate([
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
                            click: () => electron_1.ipcMain.emit("physicax:set-gpu-mode", null, "high")
                        },
                        {
                            label: "Low Power",
                            type: "radio",
                            checked: settings.gpuMode === "low",
                            click: () => electron_1.ipcMain.emit("physicax:set-gpu-mode", null, "low")
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
    electron_1.Menu.setApplicationMenu(menu);
});
electron_1.app.on("before-quit", () => {
    isQuitting = true;
    if (nextProcess) {
        nextProcess.kill();
        nextProcess = null;
    }
    if (backendProcess) {
        backendProcess.kill();
        backendProcess = null;
    }
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
electron_1.app.on("activate", () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        const startUrl = process.env.ELECTRON_START_URL || `http://localhost:${uiPort}`;
        createWindow(startUrl);
    }
});
