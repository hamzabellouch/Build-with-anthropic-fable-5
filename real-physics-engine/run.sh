#!/usr/bin/env sh
# Veritas physics engine — the one command you need.
# Serves the app locally and opens it in your default browser.
# Usage: ./run.sh [port]

DIR="$(cd "$(dirname "$0")" && pwd)"

if command -v python3 >/dev/null 2>&1; then
  exec python3 "$DIR/serve.py" "$@"
elif command -v node >/dev/null 2>&1; then
  exec node "$DIR/server.js" "$@"
else
  echo "error: need python3 or node on PATH to serve the app." >&2
  exit 1
fi
