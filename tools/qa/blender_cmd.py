"""Tiny Blender MCP client for localhost:9876."""
import json
import socket
import sys

HOST, PORT = "127.0.0.1", 9876


def send(cmd_type, params=None, timeout=120):
    payload = json.dumps({"type": cmd_type, "params": params or {}}).encode("utf-8")
    sock = socket.create_connection((HOST, PORT), timeout=timeout)
    sock.settimeout(timeout)
    sock.sendall(payload)
    chunks = []
    while True:
        try:
            buf = sock.recv(65536)
        except socket.timeout:
            break
        if not buf:
            break
        chunks.append(buf)
        try:
            json.loads(b"".join(chunks).decode("utf-8", "replace"))
            break
        except json.JSONDecodeError:
            continue
    sock.close()
    raw = b"".join(chunks).decode("utf-8", "replace")
    return json.loads(raw) if raw else {"status": "empty"}


if __name__ == "__main__":
    kind = sys.argv[1] if len(sys.argv) > 1 else "get_scene_info"
    if kind == "exec":
        code = sys.stdin.read() if len(sys.argv) < 3 else open(sys.argv[2], encoding="utf-8").read()
        out = send("execute_code", {"code": code})
    else:
        out = send(kind)
    print(json.dumps(out, indent=2)[:8000])
