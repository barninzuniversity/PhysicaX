#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_BIN="${PHYSICAX_BACKEND_BIN:-$ROOT_DIR/backend/dist/physicax-cfd-backend}"
STATUS_FILE="/tmp/cfd_status.json"
LOG_FILE="/tmp/cfd.log"

if [[ ! -x "$BACKEND_BIN" ]]; then
  echo "Missing backend binary at: $BACKEND_BIN"
  exit 1
fi

"$BACKEND_BIN" >"$LOG_FILE" 2>&1 &
PID=$!

for _ in {1..30}; do
  if curl -s http://127.0.0.1:8000/status >"$STATUS_FILE" 2>/dev/null; then
    break
  fi
  sleep 1
done

if [[ -s "$STATUS_FILE" ]]; then
  echo "[status]"
  cat "$STATUS_FILE"
else
  echo "[status] failed"
  echo "Backend log: $LOG_FILE"
fi

echo
echo "[flow]"
curl -s -X POST http://127.0.0.1:8000/flow \
  -H "Content-Type: application/json" \
  -d '{"engine":"lbm","flowSpeed":1.2,"radius":0.35,"resolution":24,"steps":40}'
echo

kill "$PID" >/dev/null 2>&1 || true
