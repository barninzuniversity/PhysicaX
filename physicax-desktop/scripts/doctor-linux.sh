#!/usr/bin/env bash
set -euo pipefail

DESKTOP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT_DIR="$(cd "$DESKTOP_DIR/.." && pwd)"
WEB_DIR="$ROOT_DIR/physicax-web"
RELEASE_DIR="$DESKTOP_DIR/dist/linux-release"

failures=0
warnings=0

print_status() {
  local level="$1"
  local label="$2"
  local detail="$3"
  printf '[%s] %s: %s\n' "$level" "$label" "$detail"
}

require_cmd() {
  local cmd="$1"
  if command -v "$cmd" >/dev/null 2>&1; then
    print_status ok "$cmd" "$(command -v "$cmd")"
  else
    print_status fail "$cmd" "not installed"
    failures=$((failures + 1))
  fi
}

check_path() {
  local label="$1"
  local path="$2"
  if [[ -e "$path" ]]; then
    print_status ok "$label" "$path"
  else
    print_status fail "$label" "missing: $path"
    failures=$((failures + 1))
  fi
}

warn_if_missing() {
  local label="$1"
  local path="$2"
  local hint="$3"
  if [[ -e "$path" ]]; then
    print_status ok "$label" "$path"
  else
    print_status warn "$label" "$hint"
    warnings=$((warnings + 1))
  fi
}

warn_if_missing_exec() {
  local label="$1"
  local path="$2"
  local hint="$3"
  if [[ -x "$path" ]]; then
    print_status ok "$label" "$path"
  else
    print_status warn "$label" "$hint"
    warnings=$((warnings + 1))
  fi
}

print_status info "root" "$ROOT_DIR"
print_status info "desktop" "$DESKTOP_DIR"

require_cmd node
require_cmd npm
require_cmd python3

check_path "repo root" "$ROOT_DIR/README.md"
check_path "root requirements" "$ROOT_DIR/requirements.txt"
check_path "web package" "$WEB_DIR/package.json"
check_path "desktop package" "$DESKTOP_DIR/package.json"

warn_if_missing "python venv" "$ROOT_DIR/.venv" "optional but recommended: run python3 -m venv .venv"
warn_if_missing "web node_modules" "$WEB_DIR/node_modules" "run: cd \"$WEB_DIR\" && npm install"
warn_if_missing "desktop node_modules" "$DESKTOP_DIR/node_modules" "run: cd \"$DESKTOP_DIR\" && npm install"
warn_if_missing "web production build" "$WEB_DIR/.next/standalone/server.js" "run: cd \"$DESKTOP_DIR\" && npm run desktop:prepare-runtime:linux"
warn_if_missing_exec "bundled CFD backend" "$DESKTOP_DIR/backend/dist/physicax-cfd-backend" "run: cd \"$DESKTOP_DIR\" && npm run desktop:build-backend:linux"
warn_if_missing "linux release folder" "$RELEASE_DIR" "run: cd \"$DESKTOP_DIR\" && npm run desktop:package:linux"
warn_if_missing_exec "linux launcher" "$RELEASE_DIR/run-PhysicaX-linux.sh" "run: cd \"$DESKTOP_DIR\" && npm run desktop:package:linux"
warn_if_missing_exec "wsl launcher" "$RELEASE_DIR/run-PhysicaX-wsl.sh" "run: cd \"$DESKTOP_DIR\" && npm run desktop:package:linux"
warn_if_missing_exec "deb installer helper" "$RELEASE_DIR/install-PhysicaX-deb.sh" "run: cd \"$DESKTOP_DIR\" && npm run desktop:package:linux"
warn_if_missing "release readme" "$RELEASE_DIR/README.txt" "run: cd \"$DESKTOP_DIR\" && npm run desktop:package:linux"
warn_if_missing "linux AppImage" "$RELEASE_DIR/PhysicaX-0.1.0.AppImage" "run: cd \"$DESKTOP_DIR\" && npm run desktop:package:linux"
warn_if_missing "linux deb package" "$RELEASE_DIR/physicax-desktop_0.1.0_amd64.deb" "run: cd \"$DESKTOP_DIR\" && npm run desktop:package:linux"
warn_if_missing "release verification summary" "$RELEASE_DIR/verification-summary.json" "run: cd \"$DESKTOP_DIR\" && npm run desktop:verify-release:linux"

echo
if (( failures > 0 )); then
  print_status fail "summary" "$failures blocking issue(s), $warnings warning(s)"
  exit 1
fi

if (( warnings > 0 )); then
  print_status warn "summary" "core prerequisites are present, but $warnings follow-up step(s) are still recommended"
else
  print_status ok "summary" "Linux desktop prerequisites and artifacts look ready"
fi
