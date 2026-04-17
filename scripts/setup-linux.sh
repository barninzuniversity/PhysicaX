#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/_physicax-linux-common.sh"

ensure_repo_layout
require_cmd "$PHYSICAX_PYTHON"
require_cmd npm

activate_venv
physicax_log "Installing Python requirements from $PHYSICAX_ROOT/requirements.txt"
python -m pip install --upgrade pip
python -m pip install -r "$PHYSICAX_ROOT/requirements.txt"

ensure_node_modules "$PHYSICAX_WEB_DIR" "web"
ensure_node_modules "$PHYSICAX_DESKTOP_DIR" "desktop"

physicax_log "Linux setup is ready."
physicax_log "Next steps:"
physicax_log "  bash scripts/run-web-linux.sh"
physicax_log "  bash scripts/run-desktop-linux.sh"
