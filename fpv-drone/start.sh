#!/usr/bin/env bash
# Serve the sim locally (ES modules need http://, not file://) and open it.
cd "$(dirname "$0")"
PORT="${1:-8000}"

if command -v python3 >/dev/null 2>&1; then
  (python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &)
elif command -v npx >/dev/null 2>&1; then
  (npx --yes serve -l "$PORT" >/dev/null 2>&1 &)
else
  echo "Need python3 or npx to serve. Or use any static file server in this directory."
  exit 1
fi

sleep 0.7
URL="http://localhost:$PORT"
xdg-open "$URL" 2>/dev/null || open "$URL" 2>/dev/null || echo "Open $URL in your browser."
