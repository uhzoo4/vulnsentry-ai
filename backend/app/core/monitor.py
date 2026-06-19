import psutil
import socket
from app.core.resolver import resolve_process_details
from app.core.risk_engine import analyze_port

ALLOWED_STATUSES = {
    "LISTEN",
    "ESTABLISHED"
}

STATUS_MAPPING = {
    "LISTEN": "listening",
    "ESTABLISHED": "established",
    "TIME_WAIT": "time_wait"
}


def get_connections():
    connections = []
    seen = set()

    for conn in psutil.net_connections(kind="inet"):

        if not conn.laddr:
            continue

        if conn.status not in ALLOWED_STATUSES:
            continue

        if conn.pid is None:
            continue

        key = (
            conn.pid,
            conn.laddr.port,
            conn.status
        )

        if key in seen:
            continue

        seen.add(key)

        try:
            risk = analyze_port(conn.laddr.port)
            proc_name, proc_path = resolve_process_details(conn.pid)
            protocol = "tcp" if conn.type == socket.SOCK_STREAM else "udp"
            state = STATUS_MAPPING.get(conn.status, conn.status.lower())

            connections.append(
                {
                    "processName": proc_name,
                    "processPid": conn.pid,
                    "processPath": proc_path,
                    "port": conn.laddr.port,
                    "protocol": protocol,
                    "state": state,
                    "severity": risk["severity"].lower()
                }
            )

        except Exception:
            continue

    return connections