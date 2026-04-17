#!/usr/bin/env bash
set -euo pipefail

PHYSICAX_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PHYSICAX_ROOT="${PHYSICAX_ROOT:-$(cd "$PHYSICAX_SCRIPT_DIR/.." && pwd)}"
PHYSICAX_WEB_DIR="$PHYSICAX_ROOT/physicax-web"
PHYSICAX_DESKTOP_DIR="$PHYSICAX_ROOT/physicax-desktop"
PHYSICAX_VENV_DIR="${PHYSICAX_VENV_DIR:-$PHYSICAX_ROOT/.venv}"
PHYSICAX_PYTHON="${PHYSICAX_PYTHON:-python3}"

physicax_log() {
  printf '[physicax] %s\n' "$*"
}

physicax_fail() {
  printf '[physicax] %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || physicax_fail "Missing required command: $1"
}

ensure_repo_layout() {
  [[ -f "$PHYSICAX_ROOT/README.md" ]] || physicax_fail "Could not find README.md in $PHYSICAX_ROOT"
  [[ -d "$PHYSICAX_WEB_DIR" ]] || physicax_fail "Could not find physicax-web in $PHYSICAX_ROOT"
  [[ -d "$PHYSICAX_DESKTOP_DIR" ]] || physicax_fail "Could not find physicax-desktop in $PHYSICAX_ROOT"
}

ensure_venv() {
  if [[ ! -x "$PHYSICAX_VENV_DIR/bin/python" ]]; then
    physicax_log "Creating Python virtualenv at $PHYSICAX_VENV_DIR"
    "$PHYSICAX_PYTHON" -m venv "$PHYSICAX_VENV_DIR"
  fi
}

activate_venv() {
  ensure_venv
  # shellcheck disable=SC1090
  source "$PHYSICAX_VENV_DIR/bin/activate"
}

ensure_node_modules() {
  local target_dir="$1"
  local label="$2"
  if [[ "${PHYSICAX_FORCE_INSTALL:-0}" == "1" || ! -d "$target_dir/node_modules" ]]; then
    physicax_log "Installing ${label} npm dependencies"
    npm --prefix "$target_dir" install
  else
    physicax_log "${label} npm dependencies already present"
  fi
}

run_setup_if_enabled() {
  if [[ "${PHYSICAX_SKIP_SETUP:-0}" == "1" ]]; then
    physicax_log "Skipping setup because PHYSICAX_SKIP_SETUP=1"
    return
  fi
  bash "$PHYSICAX_SCRIPT_DIR/setup-linux.sh"
}
