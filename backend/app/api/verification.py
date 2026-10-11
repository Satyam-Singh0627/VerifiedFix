from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import VerificationRun
from app.schemas.schemas import VerificationRunOut
from app.security_engine.verification_engine import execute_verification_suite

router = APIRouter(prefix="/verification", tags=["Verification Engine"])

@router.post("/run", response_model=VerificationRunOut)
def run_verification(patch_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Executes the live 10-point test suite and computes authoritative verification state."""
    run = execute_verification_suite(db, patch_id=patch_id)
    return run

@router.get("/latest", response_model=VerificationRunOut)
def get_latest_verification(db: Session = Depends(get_db)):
    run = db.query(VerificationRun).order_by(VerificationRun.id.desc()).first()
    if not run:
        raise HTTPException(status_code=404, detail="No verification runs recorded yet")
    return run

@router.get("/history", response_model=List[VerificationRunOut])
def get_verification_history(db: Session = Depends(get_db)):
    runs = db.query(VerificationRun).order_by(VerificationRun.id.desc()).all()
    return runs
