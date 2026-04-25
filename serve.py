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

for arg in sys.argv[1:]:
    if arg.startswith("--port="):
        PORT = int(arg.split("=")[1])
    elif arg == "--port" and sys.argv.index(arg) + 1 < len(sys.argv):
        PORT = int(sys.argv[sys.argv.index(arg) + 1])


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
        # Show requests so you can see what's being fetched
        print(f"  {args[0]}  {args[1]}")


if __name__ == "__main__":
    os.chdir(ROOT)

    print(f"\n  ┌─────────────────────────────────────┐")
    print(f"  │  AcademicBlog dev server             │")
    print(f"  │                                     │")
    print(f"  │  http://localhost:{PORT}               │")
    print(f"  │                                     │")
    print(f"  │  Ctrl+C to stop                     │")
    print(f"  └─────────────────────────────────────┘\n")

    class ReusableTCPServer(socketserver.TCPServer):
        allow_reuse_address = True

    try:
        with ReusableTCPServer(("", PORT), Handler) as httpd:
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
