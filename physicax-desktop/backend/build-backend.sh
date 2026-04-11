#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_ROOT="$ROOT_DIR/web"
if [[ ! -d "$WEB_ROOT" ]]; then
  WEB_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/physicax-web"
fi
BACKEND_DIR="$WEB_ROOT/cfd/backend"
OUT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/dist"
WORK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/build"
SPEC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/spec"
BUILD_VENV_ROOT="${PHYSICAX_BACKEND_BUILD_ROOT:-${TMPDIR:-/tmp}/physicax-cfd-builder}"
BUILD_VENV_DIR="$BUILD_VENV_ROOT/.venv"
REQ_STAMP="$BUILD_VENV_ROOT/requirements.sha256"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required to build the backend. Install python3-venv and python3-pip first."
  exit 1
fi

mkdir -p "$BUILD_VENV_ROOT"
PYTHON="$BUILD_VENV_DIR/bin/python"

if [[ ! -x "$PYTHON" ]]; then
  echo "Python build virtualenv not found at $PYTHON. Creating one..."
  python3 -m venv "$BUILD_VENV_DIR"
fi

REQ_HASH="$(
  python3 - "$BACKEND_DIR/requirements.txt" <<'PY'
import hashlib
import pathlib
import sys

print(hashlib.sha256(pathlib.Path(sys.argv[1]).read_bytes()).hexdigest())
PY
)"

if [[ ! -f "$REQ_STAMP" ]] || [[ "$(cat "$REQ_STAMP")" != "$REQ_HASH" ]] || ! "$PYTHON" - <<'PY'
import importlib.util
required = ["fastapi", "uvicorn", "numpy", "trimesh"]
missing = [m for m in required if importlib.util.find_spec(m) is None]
raise SystemExit(0 if not missing else 1)
PY
then
  "$PYTHON" -m pip install --upgrade pip
  "$PYTHON" -m pip install -r "$BACKEND_DIR/requirements.txt"
  printf '%s\n' "$REQ_HASH" > "$REQ_STAMP"
fi

if ! "$PYTHON" - <<'PY'
import importlib.util
raise SystemExit(0 if importlib.util.find_spec("PyInstaller") else 1)
PY
then
  "$PYTHON" -m pip install --upgrade --default-timeout=120 --retries 10 pyinstaller
fi
mkdir -p "$OUT_DIR" "$WORK_DIR" "$SPEC_DIR"

BUILD_ROOT="$(mktemp -d /tmp/physicax-backend-build.XXXXXX)"
BUILD_SRC="$BUILD_ROOT/backend-src"
BUILD_DIST="$BUILD_ROOT/dist"
BUILD_WORK="$BUILD_ROOT/work"
BUILD_SPEC="$BUILD_ROOT/spec"

cleanup() {
  rm -rf "$BUILD_ROOT"
}

trap cleanup EXIT

ln -s "$BACKEND_DIR" "$BUILD_SRC"
mkdir -p "$BUILD_DIST" "$BUILD_WORK" "$BUILD_SPEC"

(
  cd "$BUILD_SRC"
  "$PYTHON" -m PyInstaller \
    --onefile \
    --name physicax-cfd-backend \
    --distpath "$BUILD_DIST" \
    --workpath "$BUILD_WORK" \
    --specpath "$BUILD_SPEC" \
    --paths "$BUILD_SRC" \
    serve.py
)

install -m 755 "$BUILD_DIST/physicax-cfd-backend" "$OUT_DIR/physicax-cfd-backend"
cp "$BUILD_SPEC/physicax-cfd-backend.spec" "$SPEC_DIR/physicax-cfd-backend.spec"
