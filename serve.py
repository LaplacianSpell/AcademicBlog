#!/usr/bin/env python3
"""
Dev server for AcademicBlog
Run:  python3 serve.py
      python3 serve.py --port 8080
Then open: http://localhost:3000
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

PORT = 3000
ROOT = Path(__file__).parent

args = sys.argv[1:]
for i, arg in enumerate(args):
    if arg == "--port" and i + 1 < len(args):
        PORT = int(args[i + 1])
    elif arg.startswith("--port="):
        PORT = int(arg.split("=")[1])


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def guess_type(self, path):
        if str(path).endswith(".md"):
            return "text/plain; charset=utf-8"
        if str(path).endswith(".jsx"):
            return "text/javascript; charset=utf-8"
        return super().guess_type(path)

    def log_message(self, format, *args):
        print(f"  {args[1]}  {args[0]}")

    def handle_error(self, request, client_address):
        # Silence BrokenPipeError — browser closed connection early, harmless
        import traceback
        if "BrokenPipeError" not in traceback.format_exc():
            super().handle_error(request, client_address)


class Server(socketserver.TCPServer):
    allow_reuse_address = True

    def handle_error(self, request, client_address):
        import traceback
        if "BrokenPipeError" not in traceback.format_exc():
            super().handle_error(request, client_address)


if __name__ == "__main__":
    os.chdir(ROOT)
    print(f"\n  ┌──────────────────────────────────────┐")
    print(f"  │  AcademicBlog dev server              │")
    print(f"  │                                      │")
    print(f"  │  http://localhost:{PORT}                │")
    print(f"  │                                      │")
    print(f"  │  Ctrl+C to stop                      │")
    print(f"  └──────────────────────────────────────┘\n")

    try:
        with Server(("", PORT), Handler) as httpd:
            httpd.serve_forever()
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"  ✗ Port {PORT} is in use. Try:")
            print(f"    kill $(lsof -t -i:{PORT})")
            print(f"    python3 serve.py --port 8080\n")
        else:
            raise
    except KeyboardInterrupt:
        print("\n  Server stopped.")
