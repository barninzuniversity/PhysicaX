import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");
const releaseDir = path.join(distDir, "linux-release");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf-8"));
const version = packageJson.version || "0.1.0";
const appImageName = `PhysicaX-${version}.AppImage`;
const debName = `physicax-desktop_${version}_amd64.deb`;

const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });

const copyIfPresent = (source, target) => {
  if (!fs.existsSync(source)) return false;
  fs.copyFileSync(source, target);
  return true;
};

const writeFile = (target, content, mode) => {
  fs.writeFileSync(target, content, "utf-8");
  if (mode !== undefined) {
    fs.chmodSync(target, mode);
  }
};

ensureDir(releaseDir);

const staleExtractDir = path.join(releaseDir, "squashfs-root");
if (fs.existsSync(staleExtractDir)) {
  fs.rmSync(staleExtractDir, { recursive: true, force: true });
}

const copiedAppImage = copyIfPresent(path.join(distDir, appImageName), path.join(releaseDir, appImageName));
const copiedDeb = copyIfPresent(path.join(distDir, debName), path.join(releaseDir, debName));

const wslLauncher = `#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APPIMAGE="$SCRIPT_DIR/${appImageName}"
APP_BASENAME="$(basename "$APPIMAGE" .AppImage)"
CACHE_ROOT="\${XDG_CACHE_HOME:-$HOME/.cache}/physicax-desktop/appimage/$APP_BASENAME"
EXTRACT_ROOT="$CACHE_ROOT/squashfs-root"
APP_BIN="$EXTRACT_ROOT/physicax-desktop"
SNAPSHOT_BLOB="$EXTRACT_ROOT/snapshot_blob.bin"
V8_SNAPSHOT="$EXTRACT_ROOT/v8_context_snapshot.bin"

if [ ! -f "$APPIMAGE" ]; then
  echo "Missing AppImage: $APPIMAGE" >&2
  exit 1
fi

chmod +x "$APPIMAGE"

if [ ! -x "$APP_BIN" ] || [ ! -f "$SNAPSHOT_BLOB" ] || [ ! -f "$V8_SNAPSHOT" ] || [ "$APPIMAGE" -nt "$APP_BIN" ]; then
  rm -rf "$CACHE_ROOT"
  mkdir -p "$CACHE_ROOT"
  (
    cd "$CACHE_ROOT"
    "$APPIMAGE" --appimage-extract >/dev/null
  )
fi

if [ ! -x "$APP_BIN" ] || [ ! -f "$SNAPSHOT_BLOB" ] || [ ! -f "$V8_SNAPSHOT" ]; then
  echo "Failed to extract the complete desktop runtime from the AppImage." >&2
  exit 1
fi

cd "$EXTRACT_ROOT"

if [ -z "\${DBUS_SESSION_BUS_ADDRESS:-}" ] && command -v dbus-run-session >/dev/null 2>&1; then
  exec dbus-run-session -- ./physicax-desktop
fi

exec ./physicax-desktop
`;

writeFile(path.join(releaseDir, "run-PhysicaX-wsl.sh"), wslLauncher, 0o755);

const readme = `PhysicaX Linux Release
======================

Folder contents:
- ${appImageName}  (portable)
- ${debName}  (Debian/Ubuntu package)
- run-PhysicaX-wsl.sh  (recommended launcher for WSL)

Run on WSL (recommended):
1) chmod +x run-PhysicaX-wsl.sh
2) ./run-PhysicaX-wsl.sh

Run AppImage directly:
1) chmod +x ${appImageName}
2) ./${appImageName}

Install the Debian package:
sudo apt install ./${debName}

Notes:
- If AppImage fails with "libfuse.so.2", install FUSE2: sudo apt install libfuse2
- On WSL, the wrapper script extracts the AppImage to a cache folder and starts the desktop binary directly.
- On WSL, if no user DBus session is present, the wrapper starts one automatically.
- The app defaults to low GPU mode on WSL for stability. To force high mode: PHYSICAX_GPU_MODE=high ./run-PhysicaX-wsl.sh

Rebuild from the repository root:
cd /path/to/PhysicaX/physicax-web
npm run build
cd ../physicax-desktop
npm run desktop:package:linux
`;

writeFile(path.join(releaseDir, "README.txt"), readme);

const summary = {
  releaseDir,
  appImage: copiedAppImage ? path.join(releaseDir, appImageName) : null,
  deb: copiedDeb ? path.join(releaseDir, debName) : null,
  launcher: path.join(releaseDir, "run-PhysicaX-wsl.sh")
};

console.log(JSON.stringify(summary, null, 2));
