RISK_RULES = {
    22: {
        "severity": "MEDIUM",
        "risk_score": 5,
        "reason": "SSH service detected"
    },
    80: {
        "severity": "LOW",
        "risk_score": 2,
        "reason": "HTTP web service detected"
    },
    443: {
        "severity": "LOW",
        "risk_score": 1,
        "reason": "HTTPS web service detected"
    },
    445: {
        "severity": "HIGH",
        "risk_score": 8,
        "reason": "SMB file sharing service listening"
    },
    3306: {
        "severity": "HIGH",
        "risk_score": 8,
        "reason": "MySQL database service exposed"
    },
    5432: {
        "severity": "HIGH",
        "risk_score": 8,
        "reason": "PostgreSQL database service exposed"
    },
    6379: {
        "severity": "CRITICAL",
        "risk_score": 10,
        "reason": "Redis instance detected"
    }
}


def analyze_port(port: int):
    return RISK_RULES.get(
        port,
        {
            "severity": "LOW",
            "risk_score": 1,
            "reason": "No known risk signature"
        }
    )