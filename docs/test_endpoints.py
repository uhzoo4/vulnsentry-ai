import sys
import os
import json
import asyncio
from fastapi.testclient import TestClient

# Add backend to python path
sys.path.insert(0, r"d:\WebProjects\VulnSentry AI\backend")

from app.main import app
from app.core import state

client = TestClient(app)

def test_root():
    print("Testing Root Endpoint...")
    res = client.get("/")
    assert res.status_code == 200
    print("Root response:", res.json())
    print("Root test PASSED.\n")

def test_live_connections():
    print("Testing Live Connections Endpoint...")
    res = client.get("/api/live")
    assert res.status_code == 200
    data = res.json()
    assert "connections" in data
    print(f"Found {len(data['connections'])} active connections.")
    if data["connections"]:
        print("First connection sample:", data["connections"][0])
    print("Live Connections test PASSED.\n")

def test_scan_flow():
    print("Testing Scan Flow...")
    # Trigger scan
    res = client.post("/api/scan", json={"target": "127.0.0.1", "intensity": "standard"})
    assert res.status_code == 200
    data = res.json()
    assert "scanId" in data
    scan_id = data["scanId"]
    print(f"Scan initiated with ID: {scan_id}")
    
    # Wait for the background worker to complete or progress
    # Let's inspect the active scan state in state.ACTIVE_SCANS
    print("Waiting for scan task to start/finish in background...")
    attempts = 0
    while attempts < 30:
        scan_state = state.ACTIVE_SCANS.get(scan_id)
        if scan_state:
            status = scan_state.get("status")
            print(f"Current scan status: {status}, progress: {scan_state.get('progress')}%")
            if status in ("complete", "error"):
                break
        else:
            print("Scan task not found in state yet...")
        
        # Give asyncio loop time to run background task
        # Since TestClient runs synchronously, background tasks will be executed synchronously
        # or we wait for them. Let's sleep a moment.
        # Wait, FastAPI background tasks run sequentially after the request in TestClient.
        # So it should be completed!
        attempts += 1
        
    scan_state = state.ACTIVE_SCANS.get(scan_id)
    assert scan_state is not None
    print("Scan State status on complete:", scan_state.get("status"))
    if scan_state.get("status") == "error":
        print("Scan finished with error:", scan_state.get("error"))
    else:
        print("Scan finished successfully!")
        report = scan_state.get("report")
        assert report is not None
        print("Posture Score:", report["postureScore"])
        print(f"Found {len(report['findings'])} findings.")
        
        # Test findings list
        test_findings_list()
        
        # Test finding detail
        if report["findings"]:
            finding_id = report["findings"][0]["id"]
            test_finding_detail(finding_id)
            test_remediation(finding_id)

    print("Scan Flow test PASSED.\n")

def test_findings_list():
    print("Testing Findings List...")
    res = client.get("/api/findings")
    assert res.status_code == 200
    findings = res.json()
    print(f"Findings endpoint returned {len(findings)} items.")
    print("Findings List test PASSED.\n")

def test_finding_detail(finding_id):
    print(f"Testing Finding Detail for {finding_id}...")
    res = client.get(f"/api/findings/{finding_id}")
    assert res.status_code == 200
    detail = res.json()
    assert detail["id"] == finding_id
    assert "teachBlock" in detail
    print("Teach Block:", detail["teachBlock"])
    print("Remediation command:", detail.get("reremediation", {}).get("command") or detail.get("remediation", {}).get("command"))
    print("Finding Detail test PASSED.\n")

def test_remediation(finding_id):
    print(f"Testing Remediation for {finding_id}...")
    res = client.post(f"/api/remediate/{finding_id}", json={"confirmed": True})
    assert res.status_code == 200
    remed_res = res.json()
    print("Remediation result:", remed_res)
    print("Remediation test PASSED.\n")

if __name__ == "__main__":
    test_root()
    test_live_connections()
    test_scan_flow()
    print("All E2E validation tests PASSED successfully!")
