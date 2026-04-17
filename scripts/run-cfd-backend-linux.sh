#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/_physicax-linux-common.sh"

ensure_repo_layout
require_cmd "$PHYSICAX_PYTHON"
run_setup_if_enabled
activate_venv

physicax_log "Starting the CFD backend on http://127.0.0.1:${PHYSICAX_BACKEND_PORT:-8000}"
cd "$PHYSICAX_WEB_DIR/cfd/backend"
python -m uvicorn app:app --host 0.0.0.0 --port "${PHYSICAX_BACKEND_PORT:-8000}"
