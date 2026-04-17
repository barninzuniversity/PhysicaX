import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const standaloneDir = path.join(projectRoot, ".next", "standalone");
const standaloneServer = path.join(standaloneDir, "server.js");
const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const nextBuildDir = path.join(projectRoot, ".next");
const port = process.env.PORT || "3000";
const hostname = process.env.HOSTNAME || "0.0.0.0";

const run = (command, args, cwd, extraEnv = {}) => {
  const child = spawn(command, args, {
    cwd,
    env: {
      ...process.env,
      NODE_ENV: "production",
      NEXT_TELEMETRY_DISABLED: "1",
      PORT: port,
      HOSTNAME: hostname,
      ...extraEnv
    },
    stdio: "inherit"
  });

  child.on("error", (error) => {
    console.error(`[physicax-web] Failed to start production server: ${error.message}`);
    process.exit(1);
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
};

if (fs.existsSync(standaloneServer)) {
  console.log(`[physicax-web] Starting standalone server on http://${hostname}:${port}`);
  run(process.execPath, [standaloneServer], standaloneDir);
} else if (fs.existsSync(nextBin) && fs.existsSync(nextBuildDir)) {
  console.warn("[physicax-web] Standalone output was not found. Falling back to `next start`.");
  run(process.execPath, [nextBin, "start", "-H", hostname, "-p", port], projectRoot);
} else {
  console.error("[physicax-web] Production build not found. Run `npm run build` first.");
  process.exit(1);
}
