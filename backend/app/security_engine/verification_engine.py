import datetime
import uuid
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.models import VerificationRun, TestCaseResult, SystemSecurityState
from app.services.document_service import get_security_state
from app.security_engine.test_runner import run_all_security_and_regression_tests
from app.security_engine.audit_logger import log_audit_event

def execute_verification_suite(db: Session, patch_id: str = None) -> VerificationRun:
    """
    Authoritative Verification Engine.
    Executes actual test suite and establishes 'Verified' or 'Verification Failed'
    based solely on empirical test execution.
    """
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    verification_uuid = f"VERIFY-{now_utc.strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    run_at = now_utc

    # Retrieve current state
    state = get_security_state(db)
    active_patch = patch_id or state.active_patch_id

    # Execute all 10 deterministic tests
    results = run_all_security_and_regression_tests(db)

    total_tests = len(results)
    passed_tests = sum(1 for r in results if r["status"] == "passed")
    failed_tests = total_tests - passed_tests
    total_duration_ms = sum(r["duration_ms"] for r in results)

    # Verification status rule: ALL required tests must pass AND patch must be applied
    is_fully_verified = (failed_tests == 0 and not state.is_vulnerable and active_patch is not None)

    if total_tests < 10:
        final_status = "Verification Incomplete"
    elif is_fully_verified:
        final_status = "Fix Verified"
    else:
        final_status = "Verification Failed"

    verification_run = VerificationRun(
        verification_id=verification_uuid,
        scan_id=state.last_scan_id,
        patch_id=active_patch,
        run_at=run_at,
        status=final_status,
        total_tests=total_tests,
        passed_tests=passed_tests,
        failed_tests=failed_tests,
        duration_ms=total_duration_ms
    )
    db.add(verification_run)
    db.commit()
    db.refresh(verification_run)

    # Add individual test results
    for r in results:
        t_result = TestCaseResult(
            verification_run_id=verification_run.id,
            test_number=r["test_number"],
            test_name=r["test_name"],
            category=r["category"],
            identity_tested=r["identity_tested"],
            expected_result=r["expected_result"],
            actual_result=r["actual_result"],
            status=r["status"],
            duration_ms=r["duration_ms"],
            error_details=r["error_details"]
        )
        db.add(t_result)

    # Update system security state
    state.overall_status = final_status
    db.commit()
    db.refresh(verification_run)

    log_audit_event(
        db,
        event_type="VERIFICATION_EXECUTED",
        description=f"Verification suite completed. Status: {final_status} ({passed_tests}/{total_tests} passed)",
        metadata={
            "verification_id": verification_uuid,
            "status": final_status,
            "passed": passed_tests,
            "failed": failed_tests
        }
    )

    return verification_run
