from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import PatchProposal
from app.schemas.schemas import PatchProposalOut, PatchActionRequest
from app.security_engine.patch_applier import (
    approve_patch,
    reject_patch,
    apply_patch,
    rollback_patch
)

router = APIRouter(prefix="/patches", tags=["Patch Review & Management"])

@router.get("", response_model=List[PatchProposalOut])
def get_all_patches(db: Session = Depends(get_db)):
    patches = db.query(PatchProposal).order_by(PatchProposal.id.desc()).all()
    return patches

@router.get("/{patch_id}", response_model=PatchProposalOut)
def get_patch_details(patch_id: str, db: Session = Depends(get_db)):
    patch = db.query(PatchProposal).filter(PatchProposal.patch_id == patch_id).first()
    if not patch:
        raise HTTPException(status_code=404, detail=f"Patch {patch_id} not found")
    return patch

@router.post("/{patch_id}/approve", response_model=PatchProposalOut)
def handle_approve_patch(patch_id: str, req: PatchActionRequest = None, db: Session = Depends(get_db)):
    reviewer = req.reviewer_name if req else "Security Reviewer"
    return approve_patch(db, patch_id, reviewer=reviewer)

@router.post("/{patch_id}/reject", response_model=PatchProposalOut)
def handle_reject_patch(patch_id: str, req: PatchActionRequest = None, db: Session = Depends(get_db)):
    reviewer = req.reviewer_name if req else "Security Reviewer"
    return reject_patch(db, patch_id, reviewer=reviewer)

@router.post("/{patch_id}/apply", response_model=PatchProposalOut)
def handle_apply_patch(patch_id: str, req: PatchActionRequest = None, db: Session = Depends(get_db)):
    reviewer = req.reviewer_name if req else "Security Reviewer"
    return apply_patch(db, patch_id, reviewer=reviewer)

@router.post("/{patch_id}/rollback", response_model=PatchProposalOut)
def handle_rollback_patch(patch_id: str, req: PatchActionRequest = None, db: Session = Depends(get_db)):
    reviewer = req.reviewer_name if req else "Security Reviewer"
    return rollback_patch(db, patch_id, reviewer=reviewer)
