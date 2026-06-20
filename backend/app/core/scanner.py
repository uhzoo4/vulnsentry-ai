import asyncio
import socket
from typing import AsyncGenerator, List, Dict, Any

DEFAULT_PORTS = list(range(1, 1001))

async def scan_port(target: str, port: int, semaphore: asyncio.Semaphore, timeout: float = 1.0) -> Dict[str, Any]:
    async with semaphore:
        try:
            # Attempt TCP handshake
            conn = asyncio.open_connection(target, port)
            reader, writer = await asyncio.wait_for(conn, timeout=timeout)
            
            banner = None
            try:
                # Attempt to read initial banner if the service sends one on connection (e.g. SSH, FTP)
                # Use a short timeout of 0.5s to avoid stalling the scan
                banner_data = await asyncio.wait_for(reader.read(512), timeout=0.5)
                if banner_data:
                    banner = banner_data.decode("utf-8", errors="ignore").strip()
            except Exception:
                pass
            
            try:
                writer.close()
                await writer.wait_closed()
            except Exception:
                pass
                
            return {
                "port": port,
                "state": "open",
                "banner": banner
            }
        except Exception:
            return {
                "port": port,
                "state": "closed",
                "banner": None
            }

async def scan_target(
    target: str, 
    ports: List[int] = None, 
    semaphore_limit: int = 100, 
    timeout: float = 1.0
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Scans a target IP asynchronously for open ports.
    Yields progress dicts with percentage, current port, and findings in real-time.
    """
    if not ports:
        ports = DEFAULT_PORTS
        
    semaphore = asyncio.Semaphore(semaphore_limit)
    total_ports = len(ports)
    scanned_count = 0
    
    tasks = [scan_port(target, port, semaphore, timeout) for port in ports]
    
    for future in asyncio.as_completed(tasks):
        result = await future
        scanned_count += 1
        progress = (scanned_count / total_ports) * 100
        
        yield {
            "progress": round(progress, 2),
            "currentPort": result["port"],
            "totalPorts": total_ports,
            "result": result
        }
