import os
import sys
import socket
import webbrowser
import threading
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler

ROOT = Path(__file__).resolve().parent

class Handler(SimpleHTTPRequestHandler):
    # Explicit MIME types for ES modules — bypass Windows registry
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        '.js': 'application/javascript',
        '.mjs': 'application/javascript',
        '.css': 'text/css',
        '.html': 'text/html',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        msg = format % args
        sys.stdout.write("%s - %s\n" % (self.log_date_time_string(), msg))
        sys.stdout.flush()

    def send_error(self, code, message=None, explain=None):
        # Show what path failed
        sys.stdout.write("  ERROR %d: path=%s\n" % (code, self.path))
        sys.stdout.flush()
        super().send_error(code, message, explain)

def find_free_port(start=8080, end=9000):
    for port in range(start, end):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.1)
            try:
                s.connect(('127.0.0.1', port))
            except (ConnectionRefusedError, OSError, socket.timeout):
                return port
    return 8080

def main():
    # Verify project structure before starting
    errors = []
    if not (ROOT / 'index.html').exists():
        errors.append('index.html 缺失')
    if not (ROOT / 'js').is_dir():
        errors.append('js 目录缺失')
    if not (ROOT / 'css').is_dir():
        errors.append('css 目录缺失')

    print(f'服务目录: {ROOT}')
    if errors:
        for e in errors:
            print(f'  [错误] {e}')
        print('请确保 run.py 与 index.html 在同一目录')
        input('按 Enter 退出...')
        return
    print('  index.html: 存在')
    print('  js/: 存在')
    print('  css/: 存在')

    port = find_free_port()
    url = f'http://127.0.0.1:{port}'

    server = HTTPServer(('127.0.0.1', port), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()

    print(f'已启动: {url}')
    print('按 Ctrl+C 或关闭此窗口退出')
    webbrowser.open(url)

    try:
        threading.Event().wait()
    except KeyboardInterrupt:
        print('\n已退出')
        server.shutdown()

if __name__ == '__main__':
    main()
