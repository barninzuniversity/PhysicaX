import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");

if (!fs.existsSync(distDir)) {
  process.exit(0);
}

const exeFiles = fs
  .readdirSync(distDir)
  .filter((file) => file.toLowerCase().endsWith(".exe") && !file.toLowerCase().includes("setup"));

if (exeFiles.length === 0) {
  process.exit(0);
}

const source = path.join(distDir, exeFiles[0]);
const target = path.join(distDir, "PhysicaX Launcher.exe");

try {
  fs.copyFileSync(source, target);
} catch {
  // ignore
}
