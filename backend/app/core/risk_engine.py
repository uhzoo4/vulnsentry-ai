from typing import Optional

RULES_CATALOG = {
    21: {"service": "FTP", "base_score": 5.0, "reason": "FTP file transmission service exposed", "fix_difficulty": 2, "rule_id": "ftp-exposed"},
    22: {"service": "SSH", "base_score": 5.0, "reason": "SSH shell service detected", "fix_difficulty": 3, "rule_id": "ssh-exposed"},
    23: {"service": "Telnet", "base_score": 9.0, "reason": "Telnet unencrypted terminal service exposed", "fix_difficulty": 2, "rule_id": "telnet-exposed"},
    25: {"service": "SMTP", "base_score": 4.0, "reason": "SMTP mail service running", "fix_difficulty": 3, "rule_id": "smtp-exposed"},
    53: {"service": "DNS", "base_score": 3.0, "reason": "DNS service running", "fix_difficulty": 3, "rule_id": "dns-exposed"},
    80: {"service": "HTTP", "base_score": 2.0, "reason": "HTTP web service detected", "fix_difficulty": 2, "rule_id": "http-exposed"},
    110: {"service": "POP3", "base_score": 4.0, "reason": "POP3 mail service running", "fix_difficulty": 3, "rule_id": "pop3-exposed"},
    111: {"service": "RPCBind", "base_score": 5.0, "reason": "RPCBind service detected", "fix_difficulty": 3, "rule_id": "rpcbind-exposed"},
    135: {"service": "MS-RPC", "base_score": 6.0, "reason": "Microsoft RPC endpoint mapper running", "fix_difficulty": 4, "rule_id": "msrpc-exposed"},
    139: {"service": "NetBIOS", "base_score": 6.0, "reason": "NetBIOS session service running", "fix_difficulty": 4, "rule_id": "netbios-exposed"},
    143: {"service": "IMAP", "base_score": 4.0, "reason": "IMAP mail service running", "fix_difficulty": 3, "rule_id": "imap-exposed"},
    443: {"service": "HTTPS", "base_score": 1.0, "reason": "HTTPS web service detected", "fix_difficulty": 2, "rule_id": "https-exposed"},
    445: {"service": "SMB", "base_score": 8.0, "reason": "SMB file sharing service listening", "fix_difficulty": 4, "rule_id": "smb-exposed"},
    993: {"service": "IMAPS", "base_score": 2.0, "reason": "Secure IMAP service running", "fix_difficulty": 3, "rule_id": "imaps-exposed"},
    995: {"service": "POP3S", "base_score": 2.0, "reason": "Secure POP3 service running", "fix_difficulty": 3, "rule_id": "pop3s-exposed"},
    1433: {"service": "MSSQL", "base_score": 8.0, "reason": "Microsoft SQL Server database exposed", "fix_difficulty": 2, "rule_id": "mssql-exposed"},
    1521: {"service": "Oracle DB", "base_score": 8.0, "reason": "Oracle Database listener exposed", "fix_difficulty": 3, "rule_id": "oracle-exposed"},
    2049: {"service": "NFS", "base_score": 7.0, "reason": "NFS network file share exposed", "fix_difficulty": 4, "rule_id": "nfs-exposed"},
    3000: {"service": "Node Dev", "base_score": 3.0, "reason": "NodeJS development server running", "fix_difficulty": 1, "rule_id": "node-dev-exposed"},
    3306: {"service": "MySQL", "base_score": 8.0, "reason": "MySQL database service exposed", "fix_difficulty": 2, "rule_id": "mysql-exposed"},
    3389: {"service": "RDP", "base_score": 7.0, "reason": "Remote Desktop Protocol (RDP) service exposed", "fix_difficulty": 3, "rule_id": "rdp-exposed"},
    5000: {"service": "Python Dev", "base_score": 3.0, "reason": "Flask/Python development server running", "fix_difficulty": 1, "rule_id": "python-dev-exposed"},
    5432: {"service": "PostgreSQL", "base_score": 8.0, "reason": "PostgreSQL database service exposed", "fix_difficulty": 2, "rule_id": "postgresql-exposed"},
    5900: {"service": "VNC", "base_score": 7.0, "reason": "VNC remote screen sharing exposed", "fix_difficulty": 3, "rule_id": "vnc-exposed"},
    6379: {"service": "Redis", "base_score": 10.0, "reason": "Redis instance detected", "fix_difficulty": 2, "rule_id": "redis-exposed"},
    8000: {"service": "Dev Web", "base_score": 3.0, "reason": "Common development web port exposed", "fix_difficulty": 1, "rule_id": "dev-web-exposed"},
    8080: {"service": "Alt HTTP", "base_score": 3.0, "reason": "Alternative HTTP web service exposed", "fix_difficulty": 2, "rule_id": "alt-http-exposed"},
    8443: {"service": "Alt HTTPS", "base_score": 2.0, "reason": "Alternative secure HTTPS web service exposed", "fix_difficulty": 2, "rule_id": "alt-https-exposed"},
    9000: {"service": "PHP-FPM / Dev", "base_score": 4.0, "reason": "PHP-FPM or development server exposed", "fix_difficulty": 2, "rule_id": "php-fpm-exposed"},
    27017: {"service": "MongoDB", "base_score": 8.0, "reason": "MongoDB database exposed", "fix_difficulty": 2, "rule_id": "mongodb-exposed"}
}


def analyze_port(
    port: int,
    process_name: Optional[str] = None,
    bind_address: Optional[str] = None,
    banner: Optional[str] = None
) -> dict:
    rule = RULES_CATALOG.get(
        port,
        {
            "service": "Unknown",
            "base_score": 1.0,
            "reason": "No known risk signature",
            "fix_difficulty": 1,
            "rule_id": "generic-exposed"
        }
    )

    score = rule["base_score"]
    reason = rule["reason"]

    # Layer 2: Process-aware modifiers
    if process_name:
        proc_lower = process_name.lower()
        if "sql" in proc_lower or "redis" in proc_lower or "mongod" in proc_lower:
            # Check if there is an auth warning in the banner
            if not banner or "unauthorized" not in banner.lower():
                score += 1.0
                reason += " (unauthenticated database process)"
        elif proc_lower not in ["unknown", ""]:
            # Unexpected process name
            expected_processes = {
                22: ["sshd", "ssh"],
                80: ["nginx", "apache", "httpd", "node", "python"],
                443: ["nginx", "apache", "httpd", "node", "python"],
                3306: ["mysqld", "mysql"],
                5432: ["postgres"],
                6379: ["redis-server", "redis"]
            }
            expected = expected_processes.get(port)
            if expected and not any(exp in proc_lower for exp in expected):
                score += 0.5
                reason += f" (running under unexpected process: {process_name})"

    # Layer 3: Exposure modifiers
    if bind_address:
        if bind_address in ("0.0.0.0", "::", "*"):
            score += 2.0
            reason += " - Exposed to the public network"

    score = min(max(score, 0.0), 10.0)

    if score >= 9.0:
        severity = "critical"
    elif score >= 6.0:
        severity = "high"
    elif score >= 3.0:
        severity = "medium"
    else:
        severity = "low"

    return {
        "serviceName": rule["service"],
        "severity": severity,
        "risk_score": round(score, 1),
        "reason": reason,
        "rule_id": rule["rule_id"],
        "fix_difficulty": rule["fix_difficulty"]
    }