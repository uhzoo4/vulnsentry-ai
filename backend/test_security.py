import json
import time
import requests

BASE_URL = "http://localhost:8000"

def run_tests():
    print("==============================================")
    print("VULNSENTRY AI — PRODUCTION SECURITY TESTING")
    print("==============================================")

    # 1. Test Health and Version Endpoints
    print("\n[+] Testing Health Check:")
    try:
        r = requests.get(f"{BASE_URL}/api/health")
        print(f"Status Code: {r.status_code}")
        print(f"Response: {r.json()}")
    except Exception as e:
        print(f"Error connecting to server: {e}")
        print("Please make sure your FastAPI backend server is running on http://localhost:8000")
        return

    print("\n[+] Testing Version Check:")
    r = requests.get(f"{BASE_URL}/api/version")
    print(f"Status Code: {r.status_code}")
    print(f"Response: {r.json()}")

    # 2. Test Input Validation on /api/analyze
    print("\n[+] Testing Input Validation (Invalid Port -99):")
    invalid_payload = {
        "findings": [
            {"port": -99, "service": "MySQL", "severity": "CRITICAL", "risk_score": 85.0}
        ],
        "posture_score": 10.0
    }
    r = requests.post(f"{BASE_URL}/api/analyze", json=invalid_payload)
    print(f"Status Code (Expected 400): {r.status_code}")
    print(f"Response: {r.json()}")

    print("\n[+] Testing Input Validation (Invalid Severity 'EXPLOIT'):")
    invalid_payload2 = {
        "findings": [
            {"port": 3306, "service": "MySQL", "severity": "EXPLOIT", "risk_score": 85.0}
        ],
        "posture_score": 10.0
    }
    r = requests.post(f"{BASE_URL}/api/analyze", json=invalid_payload2)
    print(f"Status Code (Expected 400): {r.status_code}")
    print(f"Response: {r.json()}")

    print("\n[+] Testing Input Validation (Invalid Score 150.0):")
    invalid_payload3 = {
        "findings": [
            {"port": 3306, "service": "MySQL", "severity": "CRITICAL", "risk_score": 150.0}
        ],
        "posture_score": 10.0
    }
    r = requests.post(f"{BASE_URL}/api/analyze", json=invalid_payload3)
    print(f"Status Code (Expected 400): {r.status_code}")
    print(f"Response: {r.json()}")

    # 3. Test Rate Limiting on /api/analyze (Limit is 15 requests per minute)
    print("\n[+] Testing Rate Limiting on /api/analyze (Triggering 16 requests):")
    valid_payload = {
        "findings": [
            {"port": 3306, "service": "MySQL", "severity": "CRITICAL", "risk_score": 85.0}
        ],
        "posture_score": 10.0
    }
    rate_limited = False
    for i in range(1, 18):
        r = requests.post(f"{BASE_URL}/api/analyze", json=valid_payload)
        if r.status_code == 429:
            print(f"Request #{i}: HTTP 429 Rate limit hit successfully! Response: {r.json()}")
            rate_limited = True
            break
        elif r.status_code == 200:
            print(f"Request #{i}: HTTP 200 Success")
        else:
            print(f"Request #{i}: HTTP {r.status_code} - {r.text}")
    if not rate_limited:
        print("[-] Rate limiter test failed to hit 429 limit.")

    # 4. Test Payload Size Limit (1MB)
    print("\n[+] Testing Payload Size Limit (Sending ~1.1MB body):")
    huge_payload = {
        "findings": [
            {"port": 3306, "service": "MySQL", "severity": "CRITICAL", "risk_score": 85.0}
        ],
        "posture_score": 10.0,
        "dummy_padding": "A" * (1024 * 1024 + 100 * 1024)  # 1.1 MB
    }
    r = requests.post(f"{BASE_URL}/api/analyze", json=huge_payload)
    print(f"Status Code (Expected 400): {r.status_code}")
    print(f"Response: {r.json()}")

    # 5. Test Remediation Authorization
    print("\n[+] Testing Remediation API loopback/secret validation:")
    # Triggering execution without secret
    r = requests.post(f"{BASE_URL}/api/remediate/f-3306", json={"confirmed": True})
    print(f"Status Code without API_SECRET (Expect 403 or 404 depending on session): {r.status_code}")
    print(f"Response: {r.json()}")

if __name__ == "__main__":
    run_tests()
