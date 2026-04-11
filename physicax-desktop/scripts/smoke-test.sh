#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_ROOT="${PHYSICAX_WEB_ROOT:-$ROOT_DIR/web}"
BACKEND_BIN="${PHYSICAX_BACKEND_BIN:-$ROOT_DIR/backend/dist/physicax-cfd-backend}"
UI_PORT="${PHYSICAX_UI_PORT:-3000}"
BACKEND_PORT="${PHYSICAX_BACKEND_PORT:-8000}"
LOG_DIR="${PHYSICAX_SMOKE_LOG_DIR:-/tmp/physicax-smoke}"
UI_URL="http://127.0.0.1:${UI_PORT}"
BACKEND_URL="http://127.0.0.1:${BACKEND_PORT}"

mkdir -p "$LOG_DIR"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1"
    exit 1
  fi
}

require_cmd curl
require_cmd node

wait_for_url() {
  local url="$1"
  local timeout="${2:-30}"
  local deadline=$((SECONDS + timeout))
  while (( SECONDS < deadline )); do
    if curl -sSf "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

cleanup() {
  if [[ -f "$LOG_DIR/next.pid" ]]; then
    kill "$(cat "$LOG_DIR/next.pid")" >/dev/null 2>&1 || true
  fi
  if [[ -f "$LOG_DIR/backend.pid" ]]; then
    kill "$(cat "$LOG_DIR/backend.pid")" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT

echo "[smoke] starting backend..."
if [[ ! -x "$BACKEND_BIN" ]]; then
  echo "Missing backend binary at: $BACKEND_BIN"
  exit 1
fi
"$BACKEND_BIN" >"$LOG_DIR/backend.log" 2>&1 &
echo $! > "$LOG_DIR/backend.pid"

if ! wait_for_url "${BACKEND_URL}/status" 40; then
  echo "Backend failed to respond. Log: $LOG_DIR/backend.log"
  exit 1
fi

echo "[smoke] starting Next.js standalone server..."
STANDALONE_DIR="$WEB_ROOT/.next/standalone"
if [[ ! -f "$STANDALONE_DIR/server.js" ]]; then
  echo "Missing standalone server at: $STANDALONE_DIR/server.js"
  exit 1
fi
(cd "$STANDALONE_DIR" && PORT="$UI_PORT" NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 node server.js >"$LOG_DIR/next.log" 2>&1 & echo $! > "$LOG_DIR/next.pid")

if ! wait_for_url "$UI_URL" 40; then
  echo "UI server failed to respond. Log: $LOG_DIR/next.log"
  exit 1
fi

INDEX_HTML="$LOG_DIR/index.html"
if ! curl -fsS "$UI_URL" >"$INDEX_HTML"; then
  echo "Failed to fetch homepage HTML from: $UI_URL"
  exit 1
fi

if ! grep -q "PhysicaX" "$INDEX_HTML"; then
  echo "Homepage HTML did not contain the expected PhysicaX marker."
  exit 1
fi

CSS_DIR="$STANDALONE_DIR/.next/static/css"
CSS_FILE=""
if [[ -d "$CSS_DIR" ]]; then
  CSS_FILE="$(ls "$CSS_DIR" | head -n 1 || true)"
fi
if [[ -z "$CSS_FILE" ]]; then
  echo "No CSS file found in $CSS_DIR"
  exit 1
fi

if ! curl -sI "$UI_URL/_next/static/css/$CSS_FILE" | head -n 1 | grep -q "200"; then
  echo "CSS asset not reachable: $UI_URL/_next/static/css/$CSS_FILE"
  exit 1
fi

echo "[smoke] backend ok: ${BACKEND_URL}/status"
echo "[smoke] ui ok: ${UI_URL}"
echo "[smoke] homepage ok: ${UI_URL}"
echo "[smoke] css ok: ${UI_URL}/_next/static/css/${CSS_FILE}"
echo "[smoke] logs: $LOG_DIR"
