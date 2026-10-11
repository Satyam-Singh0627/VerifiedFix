from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import PatchProposal, Finding, SystemSecurityState
from app.services.ai_service import ai_service
from app.services.document_service import get_security_state
from app.security_engine.audit_logger import log_audit_event

BEFORE_CODE_SNIPPET = """# VULNERABLE PATH: Broken Access Control (CWE-639)
# Checks only authentication, failing to verify document ownership or explicit share
if state.is_vulnerable and action == "view":
    return doc"""

AFTER_CODE_SNIPPET = """# SECURE REMEDIATION: Enforce Centralized Authorization Engine
allowed, reason = check_document_permission(db, user, doc, action=action)
if not allowed:
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Forbidden: {reason}"
    )
return doc"""

UNIFIED_DIFF = """--- a/backend/app/services/document_service.py
+++ b/backend/app/services/document_service.py
@@ -58,4 +58,9 @@
-    if state.is_vulnerable and action == "view":
-        # VULNERABLE PATH: Broken Access Control (CWE-639)
-        return doc
+    # SECURE REMEDIATION: Enforce Centralized Authorization Engine
+    allowed, reason = check_document_permission(db, user, doc, action=action)
+    if not allowed:
+        raise HTTPException(
+            status_code=status.HTTP_403_FORBIDDEN,
+            detail=f"Forbidden: {reason}"
+        )
+    return doc"""

def generate_minimal_patch_proposal(db: Session, finding_id: Optional[int] = None) -> PatchProposal:
    """Generates a deterministic, prevalidated minimal authorization fix for the IDOR vulnerability."""
    patch_id = "PATCH-IDOR-SEC-01"

    existing_patch = db.query(PatchProposal).filter(PatchProposal.patch_id == patch_id).first()
    if existing_patch:
        return existing_patch

    finding = None
    if finding_id:
        finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        finding = db.query(Finding).order_by(Finding.id.desc()).first()

    patch_explanation = ai_service.explain_patch(UNIFIED_DIFF)

    patch = PatchProposal(
        patch_id=patch_id,
        finding_id=finding.id if finding else None,
        title="Enforce Centralized Document Access Authorization Policy",
        description=(
            "Adds missing ownership, administrative override, and explicit sharing verification "
            "to document retrieval, blocking unauthorized cross-user access while preserving legitimate access."
        ),
        security_rationale=(
            "Direct Object References (IDs) must not be trusted without verifying the requester's "
            "authorization against the document's ownership and explicit sharing ACLs in the database."
        ),
        affected_file="backend/app/services/document_service.py",
        before_code=BEFORE_CODE_SNIPPET,
        after_code=AFTER_CODE_SNIPPET,
        diff_content=UNIFIED_DIFF,
        lines_added=8,
        lines_removed=3,
        status="proposed"
    )
    db.add(patch)

    state = get_security_state(db)
    state.overall_status = "Patch Pending Approval"
    db.commit()
    db.refresh(patch)

    log_audit_event(
        db,
        event_type="PATCH_PROPOSED",
        description=f"Minimal authorization patch {patch_id} proposed for review",
        metadata={"patch_id": patch_id, "file": patch.affected_file}
    )

    return patch
