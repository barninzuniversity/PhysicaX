#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/_physicax-linux-common.sh"

ensure_repo_layout
require_cmd npm
run_setup_if_enabled

physicax_log "Running the Linux doctor"
npm --prefix "$PHYSICAX_DESKTOP_DIR" run desktop:doctor:linux

physicax_log "Launching the PhysicaX desktop app"
npm --prefix "$PHYSICAX_DESKTOP_DIR" run desktop:run:linux
