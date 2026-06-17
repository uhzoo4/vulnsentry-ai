import psutil
from app.core.resolver import get_process_name

ALLOWED_STATUSES = {
    "LISTEN",
    "ESTABLISHED"
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
            connections.append(
                {
                    "port": conn.laddr.port,
                    "pid": conn.pid,
                    "process": get_process_name(conn.pid),
                    "status": conn.status,
                    "test": "YOOZHAA"
                }
            )

        except Exception:
            continue

    return connections