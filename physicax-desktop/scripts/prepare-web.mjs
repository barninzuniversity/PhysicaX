import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const desktopRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webRoot = process.env.PHYSICAX_WEB_ROOT
  ? path.resolve(process.env.PHYSICAX_WEB_ROOT)
  : path.resolve(desktopRoot, "..", "physicax-web");
const targetRoot = path.resolve(desktopRoot, "web");

const copyDir = (src, dest) => {
  if (!fs.existsSync(src)) {
    throw new Error(`Missing required path: ${src}`);
  }
  let stat;
  try {
    stat = fs.statSync(src);
  } catch {
    stat = fs.lstatSync(src);
  }
  if (!stat.isDirectory()) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    try {
      fs.copyFileSync(src, dest);
    } catch (error) {
      if (error && error.code === "EISDIR") {
        copyDir(src, dest);
      } else {
        throw error;
      }
    }
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === ".venv") {
      continue;
    }
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    let entryStat;
    try {
      entryStat = fs.lstatSync(srcPath);
    } catch {
      continue;
    }

    const inNextDir = srcPath.includes(path.join(".next"));
    const inStandalone = srcPath.includes(path.join(".next", "standalone"));
    const skipNextDev = entry.name === "dev" && inNextDir && !inStandalone;
    const skipNextModules = entry.name === "node_modules" && inNextDir && !inStandalone;
    if (skipNextDev || skipNextModules) {
      continue;
    }

    let effectiveStat;
    try {
      effectiveStat = fs.statSync(srcPath);
    } catch {
      effectiveStat = entryStat;
    }

    if (effectiveStat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      try {
        fs.copyFileSync(srcPath, destPath);
      } catch (error) {
        if (error && error.code === "EISDIR") {
          copyDir(srcPath, destPath);
        } else {
          throw error;
        }
      }
    }
  }
};

const clearDir = (dir) => {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const entry of fs.readdirSync(dir)) {
    const entryPath = path.join(dir, entry);
    if (entry === ".venv") {
      try {
        fs.rmSync(entryPath, { recursive: true, force: true });
      } catch (error) {
        if (error && (error.code === "EACCES" || error.code === "EPERM")) {
          continue;
        }
        throw error;
      }
      continue;
    }
    let stat;
    try {
      stat = fs.lstatSync(entryPath);
    } catch (error) {
      if (error && (error.code === "EACCES" || error.code === "EPERM")) {
        continue;
      }
      throw error;
    }
    if (stat.isDirectory()) {
      try {
        fs.rmSync(entryPath, { recursive: true, force: true });
      } catch (error) {
        if (error && (error.code === "EACCES" || error.code === "EPERM" || error.code === "ENOTEMPTY")) {
          continue;
        }
        throw error;
      }
    } else {
      try {
        fs.unlinkSync(entryPath);
      } catch (error) {
        if (error && (error.code === "EACCES" || error.code === "EPERM")) {
          continue;
        }
        throw error;
      }
    }
  }
};

const ensureCopied = () => {
  const nextBuild = path.join(webRoot, ".next");
  if (!fs.existsSync(nextBuild)) {
    console.error("Next.js build not found. Run `npm run build` in physicax-web first.");
    process.exit(1);
  }

  fs.mkdirSync(targetRoot, { recursive: true });
  clearDir(targetRoot);

  const items = [
    "app",
    "lib",
    "data",
    "public",
    "scripts",
    "cfd",
    "prisma",
    ".env",
    "package.json",
    "package-lock.json",
    "next.config.js",
    "tsconfig.json",
    "proxy.ts",
    "next-env.d.ts",
    "react-plotly.d.ts",
    "three-examples.d.ts"
  ];
  for (const item of items) {
    const srcPath = path.join(webRoot, item);
    if (!fs.existsSync(srcPath)) {
      continue;
    }
    const destPath = path.join(targetRoot, item);
    copyDir(srcPath, destPath);
  }

  const standaloneSrc = path.join(webRoot, ".next", "standalone");
  const staticSrc = path.join(webRoot, ".next", "static");
  if (fs.existsSync(standaloneSrc)) {
    const standaloneDest = path.join(targetRoot, ".next", "standalone");
    copyDir(standaloneSrc, standaloneDest);
    if (fs.existsSync(staticSrc)) {
      copyDir(staticSrc, path.join(standaloneDest, ".next", "static"));
    }
  } else {
    const nextSrc = path.join(webRoot, ".next");
    if (fs.existsSync(nextSrc)) {
      copyDir(nextSrc, path.join(targetRoot, ".next"));
    }
  }
  if (fs.existsSync(staticSrc)) {
    copyDir(staticSrc, path.join(targetRoot, ".next", "static"));
  }
};

ensureCopied();
