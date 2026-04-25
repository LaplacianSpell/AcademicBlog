#!/usr/bin/env python3
"""
Dev server for AcademicBlog
Run: python3 serve.py
Then open: http://localhost:3000
"""

import http.server
import socketserver
import os
import sys
import threading
import webbrowser
from pathlib import Path

PORT = 3000
ROOT = Path(__file__).parent


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    # Serve .md and .jsx with correct MIME types
    def guess_type(self, path):
        if str(path).endswith(".md"):
            return "text/plain; charset=utf-8"
        if str(path).endswith(".jsx"):
            return "text/javascript; charset=utf-8"
        return super().guess_type(path)

    # Suppress request logs (comment out to see them)
    def log_message(self, format, *args):
        pass


def open_browser():
    import time
    time.sleep(0.5)
    webbrowser.open(f"http://localhost:{PORT}")


if __name__ == "__main__":
    os.chdir(ROOT)

    print(f"\n  ┌─────────────────────────────────────┐")
    print(f"  │  AcademicBlog dev server             │")
    print(f"  │                                     │")
    print(f"  │  http://localhost:{PORT}               │")
    print(f"  │                                     │")
    print(f"  │  Ctrl+C to stop                     │")
    print(f"  └─────────────────────────────────────┘\n")

    # Open browser automatically (skip with --no-open)
    if "--no-open" not in sys.argv:
        threading.Thread(target=open_browser, daemon=True).start()

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.allow_reuse_address = True
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  Server stopped.")
