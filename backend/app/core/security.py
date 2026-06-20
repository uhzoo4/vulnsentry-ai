import ipaddress
from fastapi import HTTPException

def validate_target(target: str) -> str:
    """
    Validates that the target IP address is either loopback (127.0.0.1) or falls
    within RFC 1918 private subnets. Raises HTTPException on violation.
    """
    target_lower = target.strip().lower()
    if target_lower in ("127.0.0.1", "localhost", "::1"):
        return "127.0.0.1"
        
    try:
        ip = ipaddress.ip_address(target_lower)
        if ip.is_loopback or ip.is_private:
            return str(ip)
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Scanning external network targets is not permitted."
        )
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid target: Must be 'localhost' or a valid private IP address."
        )
