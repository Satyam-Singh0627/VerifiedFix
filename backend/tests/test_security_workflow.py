import pytest
from app.db.seed import seed_database

def get_auth_token(client, username, password):
    res = client.post("/api/auth/login", json={"username": username, "password": password})
    assert res.status_code == 200
    return res.json()["access_token"]

def test_full_security_workflow_end_to_end(client, db_session):
    """
    Complete Security Workflow End-to-End Test:
    1. Verify Vulnerable Baseline: Bob accesses Alice's Document 12 (IDOR confirmed)
    2. Run Security Scan: Finding generated with CWE-639 and exploit evidence
    3. Propose Minimal Patch: Validates diff and line budget
    4. Approve & Apply Patch: Security state transitions
    5. Run Verification Engine: Bob is now blocked (HTTP 403), 10/10 tests pass, status = 'Verified'
    6. Rollback & Reset: Demonstrates safe reversible demo reset
    """
    # Step 0: Ensure baseline is reset
    seed_database(db_session)

    bob_token = get_auth_token(client, "bob", "Password123!")

    # Step 1: Detect & Prove Vulnerability in initial baseline
    # Bob requests Alice's Document 12 directly
    res_vuln = client.get("/api/documents/12", headers={"Authorization": f"Bearer {bob_token}"})
    assert res_vuln.status_code == 200, "In baseline vulnerable state, Bob should access Doc 12 due to IDOR"
    assert "Q3 Financial Strategy" in res_vuln.json()["title"]

    # Step 2: Run Security Scan
    scan_res = client.post("/api/scans")
    assert scan_res.status_code == 201
    scan_data = scan_res.json()
    assert scan_data["status"] == "Completed"
    assert len(scan_data["findings"]) >= 1
    
    finding = scan_data["findings"][0]
    assert "IDOR" in finding["title"] or "Broken Access Control" in finding["category"]
    assert finding["severity"] == "High"
    assert finding["affected_object_id"] == "12"

    # Step 3: Propose Minimal Patch
    patch_res = client.post(f"/api/scans/{scan_data['scan_id']}/patch-proposals")
    assert patch_res.status_code == 200
    patch = patch_res.json()
    assert patch["patch_id"] == "PATCH-IDOR-SEC-01"
    assert "check_document_permission" in patch["after_code"]

    # Step 4: Approve & Apply Patch
    approve_res = client.post(f"/api/patches/{patch['patch_id']}/approve", json={"reviewer_name": "Lead AppSec Engineer"})
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "approved"

    apply_res = client.post(f"/api/patches/{patch['patch_id']}/apply", json={"reviewer_name": "Lead AppSec Engineer"})
    assert apply_res.status_code == 200
    assert apply_res.json()["status"] == "applied"

    # Step 5: Verify Fix
    # Direct check: Bob accessing Doc 12 MUST NOW BE BLOCKED WITH HTTP 403!
    res_patched = client.get("/api/documents/12", headers={"Authorization": f"Bearer {bob_token}"})
    assert res_patched.status_code == 403, "After fix, Bob must receive HTTP 403 Forbidden"

    # Run Authoritative Verification Suite
    verify_res = client.post("/api/verification/run", json={"patch_id": patch["patch_id"]})
    assert verify_res.status_code == 200
    verification = verify_res.json()
    assert verification["status"] in ["Fix Verified", "Verified"]
    assert verification["failed_tests"] == 0
    assert verification["passed_tests"] == 10
    assert len(verification["test_results"]) == 10

    # Step 6: Verify Report Generation
    report_res = client.get("/api/reports/latest")
    assert report_res.status_code == 200
    report = report_res.json()
    assert report["is_tamper_verified"] is True
    assert report["system_status"] in ["Fix Verified", "Verified"]

    # Step 7: Test Rollback
    rollback_res = client.post(f"/api/patches/{patch['patch_id']}/rollback")
    assert rollback_res.status_code == 200
    assert rollback_res.json()["status"] == "rolled_back"

    # Bob should again be able to access in vulnerable mode
    res_reverted = client.get("/api/documents/12", headers={"Authorization": f"Bearer {bob_token}"})
    assert res_reverted.status_code == 200

    # Step 8: Demo Reset
    reset_res = client.post("/api/system/reset-demo")
    assert reset_res.status_code == 200
    assert reset_res.json()["is_vulnerable"] is True
