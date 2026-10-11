import datetime
from typing import Dict, Any, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.models import PatchProposal, SystemSecurityState
from app.services.document_service import get_security_state
from app.security_engine.patch_validator import validate_patch_scope
from app.security_engine.audit_logger import log_audit_event

def approve_patch(db: Session, patch_id: str, reviewer: str = "Lead AppSec Engineer") -> PatchProposal:
    patch = db.query(PatchProposal).filter(PatchProposal.patch_id == patch_id).first()
    if not patch:
        raise HTTPException(status_code=404, detail=f"Patch {patch_id} not found")

    patch.status = "approved"
    patch.reviewer = reviewer
    patch.reviewed_at = datetime.datetime.now(datetime.timezone.utc)

    state = get_security_state(db)
    state.overall_status = "Patch Pending Approval"
    db.commit()
    db.refresh(patch)

    log_audit_event(
        db,
        event_type="PATCH_APPROVED",
        description=f"Patch {patch_id} approved by reviewer '{reviewer}'",
        actor=reviewer,
        metadata={"patch_id": patch_id}
    )
    return patch

def reject_patch(db: Session, patch_id: str, reviewer: str = "Lead AppSec Engineer") -> PatchProposal:
    patch = db.query(PatchProposal).filter(PatchProposal.patch_id == patch_id).first()
    if not patch:
        raise HTTPException(status_code=404, detail=f"Patch {patch_id} not found")

    patch.status = "rejected"
    patch.reviewer = reviewer
    patch.reviewed_at = datetime.datetime.now(datetime.timezone.utc)

    state = get_security_state(db)
    state.overall_status = "Vulnerability Detected"
    db.commit()
    db.refresh(patch)

    log_audit_event(
        db,
        event_type="PATCH_REJECTED",
        description=f"Patch {patch_id} rejected by reviewer '{reviewer}'",
        actor=reviewer,
        metadata={"patch_id": patch_id}
    )
    return patch

def apply_patch(db: Session, patch_id: str, reviewer: str = "Lead AppSec Engineer") -> PatchProposal:
    patch = db.query(PatchProposal).filter(PatchProposal.patch_id == patch_id).first()
    if not patch:
        raise HTTPException(status_code=404, detail=f"Patch {patch_id} not found")

    # 1. Enforce strict scope and safety validation before applying
    is_valid, validation_msg = validate_patch_scope(patch)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Patch validation failed: {validation_msg}"
        )

    # 2. Update Patch record
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    patch.status = "applied"
    patch.applied_at = now_utc
    if not patch.reviewer:
        patch.reviewer = reviewer
        patch.reviewed_at = now_utc

    # 3. Apply fix to system security state (Enforces centralized check_document_permission)
    state = get_security_state(db)
    state.is_vulnerable = False
    state.active_patch_id = patch.patch_id
    state.overall_status = "Patch Applied — Verification Pending"
    db.commit()
    db.refresh(patch)

    log_audit_event(
        db,
        event_type="PATCH_APPLIED",
        description=f"Patch {patch_id} safely applied to demo target",
        actor=reviewer,
        metadata={"patch_id": patch_id, "active_file": patch.affected_file}
    )

    return patch

def rollback_patch(db: Session, patch_id: str, reviewer: str = "Lead AppSec Engineer") -> PatchProposal:
    patch = db.query(PatchProposal).filter(PatchProposal.patch_id == patch_id).first()
    if not patch:
        raise HTTPException(status_code=404, detail=f"Patch {patch_id} not found")

    patch.status = "rolled_back"

    # Revert to vulnerable demo baseline
    state = get_security_state(db)
    state.is_vulnerable = True
    state.active_patch_id = None
    state.overall_status = "Vulnerability Detected"
    db.commit()
    db.refresh(patch)

    log_audit_event(
        db,
        event_type="PATCH_ROLLEDBACK",
        description=f"Patch {patch_id} rolled back; baseline demo restored to vulnerable state",
        actor=reviewer,
        metadata={"patch_id": patch_id}
    )

    return patch
