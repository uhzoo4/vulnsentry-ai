def calculate_posture_score(findings):
    score = 100

    for finding in findings:
        score -= finding["risk_score"]

    return max(score, 0)