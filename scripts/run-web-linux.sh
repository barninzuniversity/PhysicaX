#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/_physicax-linux-common.sh"

ensure_repo_layout
require_cmd npm
run_setup_if_enabled

physicax_log "Building the production web app"
npm --prefix "$PHYSICAX_WEB_DIR" run build

physicax_log "Starting PhysicaX web on http://127.0.0.1:${PHYSICAX_UI_PORT:-3000}"
PORT="${PHYSICAX_UI_PORT:-3000}" npm --prefix "$PHYSICAX_WEB_DIR" run start
