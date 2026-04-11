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

PYTHON="$BACKEND_DIR/.venv/bin/python"

if [[ ! -x "$PYTHON" ]]; then
  echo "Python virtualenv not found at $PYTHON. Creating one..."
  if ! command -v python3 >/dev/null 2>&1; then
    echo "python3 is required to build the backend. Install python3-venv and python3-pip first."
    exit 1
  fi
  python3 -m venv "$BACKEND_DIR/.venv"
  source "$BACKEND_DIR/.venv/bin/activate"
  python3 -m pip install --upgrade pip
  python3 -m pip install -r "$BACKEND_DIR/requirements.txt"
  deactivate || true
fi

PYTHON="$BACKEND_DIR/.venv/bin/python"

if ! "$PYTHON" - <<'PY'
import importlib.util
required = ["fastapi", "uvicorn", "numpy", "trimesh"]
missing = [m for m in required if importlib.util.find_spec(m) is None]
raise SystemExit(0 if not missing else 1)
PY
then
  "$PYTHON" -m pip install --upgrade pip
  "$PYTHON" -m pip install -r "$BACKEND_DIR/requirements.txt"
fi

if ! "$PYTHON" - <<'PY'
import importlib.util
raise SystemExit(0 if importlib.util.find_spec("PyInstaller") else 1)
PY
then
  "$PYTHON" -m pip install --upgrade --default-timeout=120 --retries 10 pyinstaller
fi
mkdir -p "$OUT_DIR" "$WORK_DIR" "$SPEC_DIR"

"$PYTHON" -m PyInstaller \
  --onefile \
  --name physicax-cfd-backend \
  --distpath "$OUT_DIR" \
  --workpath "$WORK_DIR" \
  --specpath "$SPEC_DIR" \
  "$BACKEND_DIR/serve.py"
