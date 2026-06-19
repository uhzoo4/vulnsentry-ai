def calculate_posture_score(findings) -> int:
    score = 100
    severity_weights = {
        "critical": 25,
        "high": 15,
        "medium": 8,
        "low": 3
    }
    for finding in findings:
        # Support both dictionary and Pydantic object elements
        if isinstance(finding, dict):
            sev = finding.get("severity", "low").lower()
        else:
            sev = getattr(finding, "severity", "low").lower()
        score -= severity_weights.get(sev, 3)
        
    return max(score, 0)