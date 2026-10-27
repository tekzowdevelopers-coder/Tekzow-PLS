from http.server import BaseHTTPRequestHandler
import json
import sys
import io
import time
import traceback

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        start_time = time.time()
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(post_body) if post_body else {}

            code = data.get('code', '')
            input_data = data.get('input', '')

            # Security screening: block dangerous system modules
            forbidden = [
                'import os', 'import subprocess', 'import shutil', 'import socket',
                'import urllib', 'import requests', 'import http', 'import ctypes',
                'from os', 'from subprocess', 'from shutil', 'from socket',
                'from urllib', 'from requests', 'from http', 'from ctypes',
                '__import__', 'eval(', 'exec('
            ]
            
            code_lower = code.lower()
            violation = None
            for pattern in forbidden:
                if pattern in code_lower:
                    violation = f"Security restriction: Usage of {pattern} is not permitted for platform safety."
                    break

            if violation:
                response = {
                    "stdout": "",
                    "stderr": violation,
                    "exitCode": 1,
                    "executionMs": int((time.time() - start_time) * 1000),
                    "timedOut": False,
                    "securityViolation": violation
                }
                self._send_json(200, response)
                return

            # Setup redirected I/O
            old_stdin = sys.stdin
            old_stdout = sys.stdout
            old_stderr = sys.stderr

            fake_stdin = io.StringIO(input_data)
            fake_stdout = io.StringIO()
            fake_stderr = io.StringIO()

            sys.stdin = fake_stdin
            sys.stdout = fake_stdout
            sys.stderr = fake_stderr

            exit_code = 0
            
            # Isolated execution scope
            exec_globals = {
                "__name__": "__main__",
                "__doc__": None,
                "__package__": None,
            }

            try:
                # Compile to catch syntax errors cleanly with "solution.py" as filename
                compiled = compile(code, "solution.py", "exec")
                exec(compiled, exec_globals)
            except SystemExit as se:
                exit_code = se.code if isinstance(se.code, int) else 0
            except Exception:
                traceback.print_exc(file=fake_stderr)
                exit_code = 1

            # Restore standard I/O
            sys.stdin = old_stdin
            sys.stdout = old_stdout
            sys.stderr = old_stderr

            stdout_val = fake_stdout.getvalue()
            stderr_val = fake_stderr.getvalue()

            execution_ms = int((time.time() - start_time) * 1000)

            response = {
                "stdout": stdout_val,
                "stderr": stderr_val,
                "exitCode": exit_code,
                "executionMs": execution_ms,
                "timedOut": False
            }
            self._send_json(200, response)

        except Exception as e:
            self._send_json(500, {
                "stdout": "",
                "stderr": f"Server execution error: {str(e)}",
                "exitCode": 1,
                "executionMs": int((time.time() - start_time) * 1000),
                "timedOut": False
            })

    def _send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
