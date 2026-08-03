#!/usr/bin/env python3
"""Zero-dependency static server for the Veritas physics engine.

Picks the first free port starting at 8080 (or uses the one given as argv[1]),
serves this directory, and opens the default browser.
Set NO_OPEN=1 to skip opening the browser.
"""
import functools
import http.server
import os
import socketserver
import sys
import threading
import webbrowser

ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # keep the terminal clean


def main():
    handler = functools.partial(Handler, directory=ROOT)
    socketserver.TCPServer.allow_reuse_address = True

    if len(sys.argv) > 1:
        candidates = [int(sys.argv[1])]
    else:
        candidates = list(range(8080, 8100)) + [0]

    httpd = None
    for port in candidates:
        try:
            httpd = socketserver.TCPServer(("127.0.0.1", port), handler)
            break
        except OSError:
            continue
    if httpd is None:
        print("error: no free port found", file=sys.stderr)
        sys.exit(1)

    url = f"http://localhost:{httpd.server_address[1]}"
    print()
    print("  ⚛  Veritas physics engine")
    print(f"     running at {url}")
    print("     press Ctrl+C to stop")
    print()

    if not os.environ.get("NO_OPEN"):
        threading.Timer(0.4, lambda: webbrowser.open(url)).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  stopped.")


if __name__ == "__main__":
    main()
