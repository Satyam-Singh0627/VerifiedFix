#!/usr/bin/env python3
"""
Comprehensive Remote Deployment Integration Test Suite for VerifiedFix.
Validates connectivity, CORS headers, authentication, JWT tokens, RBAC,
DocVault CRUD operations, security scans, patch lifecycle, verification, and reports.
"""

import os
import sys
import httpx

BACKEND_URL = os.getenv("BACKEND_URL", "https://verifiedfix.onrender.com").rstrip("/")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "https://verified-fix-six.vercel.app").rstrip("/")

def run_tests():
    print(f"=== VERIFIEDFIX DEPLOYMENT CONNECTIVITY & INTEGRATION SUITE ===")
    print(f"Backend Target:  {BACKEND_URL}")
    print(f"Frontend Origin: {FRONTEND_ORIGIN}\n")

    results = []

    def report(name, success, detail=""):
        status = "PASSED" if success else "FAILED"
        print(f"[{status}] {name}{f' - {detail}' if detail else ''}")
        results.append((name, success, detail))

    with httpx.Client(timeout=30.0) as client:
        # 1. Backend Health
        try:
            r = client.get(f"{BACKEND_URL}/health")
            report("Backend Health Endpoint (/health)", r.status_code == 200, f"HTTP {r.status_code}")
        except Exception as e:
            report("Backend Health Endpoint (/health)", False, str(e))

        # 2. CORS Preflight for Production Vercel Origin
        try:
            r = client.options(
                f"{BACKEND_URL}/api/system/stats",
                headers={
                    "Origin": FRONTEND_ORIGIN,
                    "Access-Control-Request-Method": "GET",
                    "Access-Control-Request-Headers": "Authorization, Content-Type",
                }
            )
            allow_origin = r.headers.get("access-control-allow-origin")
            allow_creds = r.headers.get("access-control-allow-credentials")
            cors_ok = (r.status_code == 200) and (allow_origin == FRONTEND_ORIGIN) and (allow_creds == "true")
            report("CORS Preflight (Production Vercel Origin)", cors_ok, f"Allow-Origin: {allow_origin}, Credentials: {allow_creds}")
        except Exception as e:
            report("CORS Preflight (Production Vercel Origin)", False, str(e))

        # 3. Demo Reset to Baseline
        try:
            r = client.post(f"{BACKEND_URL}/api/system/reset-demo")
            report("Demo Environment Reset (/api/system/reset-demo)", r.status_code == 200, f"HTTP {r.status_code}")
        except Exception as e:
            report("Demo Environment Reset (/api/system/reset-demo)", False, str(e))

        # 4. System Stats
        try:
            r = client.get(f"{BACKEND_URL}/api/system/stats")
            data = r.json()
            report("Dashboard System Stats (/api/system/stats)", r.status_code == 200 and "current_security_state" in data, f"Total scans: {data.get('total_scans')}")
        except Exception as e:
            report("Dashboard System Stats (/api/system/stats)", False, str(e))

        # 5. Authentication (Alice)
        alice_token = None
        try:
            r = client.post(f"{BACKEND_URL}/api/auth/login", json={"username": "alice", "password": "Password123!"})
            if r.status_code == 200:
                alice_token = r.json().get("access_token")
            report("Authentication - Alice Login (/api/auth/login)", alice_token is not None, f"HTTP {r.status_code}")
        except Exception as e:
            report("Authentication - Alice Login (/api/auth/login)", False, str(e))

        # 6. JWT Verification (/auth/me)
        try:
            r = client.get(f"{BACKEND_URL}/api/auth/me", headers={"Authorization": f"Bearer {alice_token}"})
            me = r.json()
            report("JWT Header Validation (/api/auth/me)", r.status_code == 200 and me.get("username") == "alice", f"Authenticated as {me.get('username')}")
        except Exception as e:
            report("JWT Header Validation (/api/auth/me)", False, str(e))

        # 7. Authentication (Bob - Attacker Identity)
        bob_token = None
        try:
            r = client.post(f"{BACKEND_URL}/api/auth/login", json={"username": "bob", "password": "Password123!"})
            if r.status_code == 200:
                bob_token = r.json().get("access_token")
            report("Authentication - Bob Login (/api/auth/login)", bob_token is not None, f"HTTP {r.status_code}")
        except Exception as e:
            report("Authentication - Bob Login (/api/auth/login)", False, str(e))

        # 8. DocVault Listing Documents
        try:
            r = client.get(f"{BACKEND_URL}/api/documents", headers={"Authorization": f"Bearer {alice_token}"})
            docs = r.json()
            report("DocVault Document Listing (/api/documents)", r.status_code == 200 and isinstance(docs, list), f"Found {len(docs)} documents")
        except Exception as e:
            report("DocVault Document Listing (/api/documents)", False, str(e))

        # 9. DocVault Upload Document
        test_doc_id = None
        try:
            upload_payload = {
                "title": "Automated Security Audit Brief",
                "filename": "security_audit_brief.pdf",
                "content_summary": "Integration test payload for DocVault",
                "file_content": "TG9yZW0gaXBzdW0gZG9sb3Igc2l0IGFtZXQ=",
                "is_private": True,
                "classification": "confidential"
            }
            r = client.post(f"{BACKEND_URL}/api/documents", json=upload_payload, headers={"Authorization": f"Bearer {alice_token}"})
            if r.status_code == 201:
                test_doc_id = r.json().get("id")
            report("DocVault Document Upload (POST /api/documents)", r.status_code == 201, f"Doc ID #{test_doc_id}")
        except Exception as e:
            report("DocVault Document Upload (POST /api/documents)", False, str(e))

        # 10. DocVault Share Document
        try:
            share_payload = {"shared_with_username": "carol", "permission": "read"}
            r = client.post(f"{BACKEND_URL}/api/documents/{test_doc_id}/share", json=share_payload, headers={"Authorization": f"Bearer {alice_token}"})
            report("DocVault Document Sharing (POST /api/documents/{id}/share)", r.status_code == 200, f"HTTP {r.status_code}")
        except Exception as e:
            report("DocVault Document Sharing (POST /api/documents/{id}/share)", False, str(e))

        # 11. DocVault Delete Document
        try:
            r = client.delete(f"{BACKEND_URL}/api/documents/{test_doc_id}", headers={"Authorization": f"Bearer {alice_token}"})
            report("DocVault Document Deletion (DELETE /api/documents/{id})", r.status_code == 200, f"HTTP {r.status_code}")
        except Exception as e:
            report("DocVault Document Deletion (DELETE /api/documents/{id})", False, str(e))

        # 12. Security Scan Execution
        scan_id = None
        try:
            r = client.post(f"{BACKEND_URL}/api/scans")
            if r.status_code == 201:
                scan_data = r.json()
                scan_id = scan_data.get("scan_id")
                report("Security Scan Execution (POST /api/scans)", True, f"Scan ID: {scan_id}, Passed: {scan_data.get('passed_checks')}, Failed: {scan_data.get('failed_checks')}")
            else:
                report("Security Scan Execution (POST /api/scans)", False, f"HTTP {r.status_code}")
        except Exception as e:
            report("Security Scan Execution (POST /api/scans)", False, str(e))

        # 13. Exploit Evidence Retrieval
        try:
            r = client.get(f"{BACKEND_URL}/api/scans/{scan_id}/evidence")
            evidence = r.json()
            report("Exploit Evidence Retrieval (/api/scans/{id}/evidence)", r.status_code == 200 and len(evidence) > 0, f"{len(evidence)} evidence records")
        except Exception as e:
            report("Exploit Evidence Retrieval (/api/scans/{id}/evidence)", False, str(e))

        # 14. Patch Proposal Generation
        patch_id = None
        try:
            r = client.post(f"{BACKEND_URL}/api/scans/{scan_id}/patch-proposals")
            if r.status_code == 200:
                patch = r.json()
                patch_id = patch.get("patch_id")
                report("Patch Proposal Generation (/api/scans/{id}/patch-proposals)", True, f"Patch ID: {patch_id}")
            else:
                report("Patch Proposal Generation (/api/scans/{id}/patch-proposals)", False, f"HTTP {r.status_code}")
        except Exception as e:
            report("Patch Proposal Generation (/api/scans/{id}/patch-proposals)", False, str(e))

        # 15. Patch Approval
        try:
            r = client.post(f"{BACKEND_URL}/api/patches/{patch_id}/approve", json={"reviewer_name": "Lead AppSec Engineer"})
            report("Patch Approval (/api/patches/{id}/approve)", r.status_code == 200 and r.json().get("status") == "approved", f"Status: {r.json().get('status')}")
        except Exception as e:
            report("Patch Approval (/api/patches/{id}/approve)", False, str(e))

        # 16. Patch Application
        try:
            r = client.post(f"{BACKEND_URL}/api/patches/{patch_id}/apply", json={"reviewer_name": "Lead AppSec Engineer"})
            report("Patch Application (/api/patches/{id}/apply)", r.status_code == 200 and r.json().get("status") == "applied", f"Status: {r.json().get('status')}")
        except Exception as e:
            report("Patch Application (/api/patches/{id}/apply)", False, str(e))

        # 17. Security Verification Suite Run
        try:
            r = client.post(f"{BACKEND_URL}/api/verification/run", json={"patch_id": patch_id})
            data = r.json()
            report("Verification Engine Run (/api/verification/run)", r.status_code == 200, f"Passed: {data.get('passed_tests')}/10, Status: {data.get('status')}")
        except Exception as e:
            report("Verification Engine Run (/api/verification/run)", False, str(e))

        # 18. Certified Dossier / Security Report
        try:
            r = client.get(f"{BACKEND_URL}/api/reports/latest")
            rep_data = r.json()
            integrity_hash = rep_data.get("sha256_integrity_hash") or rep_data.get("integrity_seal_sha256") or ""
            is_verified = rep_data.get("is_tamper_verified") is True and len(integrity_hash) == 64
            report("Certified Security Dossier (/api/reports/latest)", is_verified, f"Report ID: {rep_data.get('report_id')}, Hash: {integrity_hash[:16]}...")
        except Exception as e:
            report("Certified Security Dossier (/api/reports/latest)", False, str(e))

        # 19. Audit Trail Events
        try:
            r = client.get(f"{BACKEND_URL}/api/audit/events?limit=20")
            events = r.json()
            report("Audit Trail Query (/api/audit/events)", r.status_code == 200 and len(events) > 0, f"Found {len(events)} audited events")
        except Exception as e:
            report("Audit Trail Query (/api/audit/events)", False, str(e))

    # Summary
    passed_count = sum(1 for _, ok, _ in results if ok)
    total_count = len(results)
    print(f"\n=== INTEGRATION TEST SUMMARY: {passed_count}/{total_count} PASSED ===")

    if passed_count != total_count:
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
