from typing import Tuple, Optional
import psutil


def get_process_name(pid: int) -> str:
    try:
        process = psutil.Process(pid)
        return process.name()
    except (psutil.NoSuchProcess, psutil.AccessDenied):
        return "Unknown"


def resolve_process_details(pid: int) -> Tuple[str, Optional[str]]:
    """
    Returns (process_name, process_path) for the given PID.
    Handles AccessDenied and NoSuchProcess gracefully.
    """
    try:
        process = psutil.Process(pid)
        name = process.name()
        try:
            path = process.exe()
        except (psutil.AccessDenied, AttributeError):
            path = "Access Denied"
        return name, path
    except (psutil.NoSuchProcess, psutil.AccessDenied):
        return "Unknown", None