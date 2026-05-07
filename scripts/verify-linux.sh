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

physicax_log "Preparing the desktop runtime"
npm --prefix "$PHYSICAX_DESKTOP_DIR" run desktop:prepare-runtime:linux

physicax_log "Running the desktop smoke test"
npm --prefix "$PHYSICAX_DESKTOP_DIR" run desktop:smoke-test

physicax_log "Packaging and verifying the Linux release"
npm --prefix "$PHYSICAX_DESKTOP_DIR" run desktop:package:linux

physicax_log "Release verification summary written to $PHYSICAX_DESKTOP_DIR/dist/linux-release/verification-summary.json"
physicax_log "GitHub release tarball written to $PHYSICAX_DESKTOP_DIR/dist/PhysicaX-0.1.0-linux-release.tar.gz"
physicax_log "Linux verification finished successfully."
