import fs from "fs";
import path from "path";

const root = process.cwd();
const srcDir = path.join(root, "node_modules", "pyodide");
const destDir = path.join(root, "public", "pyodide");

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const copyDir = (src, dest) => {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
      continue;
    }
    fs.copyFileSync(srcPath, destPath);
  }
};

if (!fs.existsSync(srcDir)) {
  console.error("pyodide package not found. Run npm install first.");
  process.exit(1);
}

copyDir(srcDir, destDir);
console.log(`Copied pyodide assets to ${destDir}`);
