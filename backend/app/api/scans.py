from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Scan, Finding, ExploitEvidence
from app.schemas.schemas import ScanOut, FindingOut, ExploitEvidenceOut, PatchProposalOut
from app.security_engine.scanner import execute_security_scan
from app.security_engine.patch_generator import generate_minimal_patch_proposal

router = APIRouter(prefix="/scans", tags=["Security Scans"])

@router.post("", response_model=ScanOut, status_code=status.HTTP_201_CREATED)
def start_scan(db: Session = Depends(get_db)):
    """Executes a live security scan against the local DocVault application."""
    scan = execute_security_scan(db)
    return scan

@router.get("", response_model=List[ScanOut])
def get_all_scans(db: Session = Depends(get_db)):
    scans = db.query(Scan).order_by(Scan.id.desc()).all()
    return scans

@router.get("/{scan_id}", response_model=ScanOut)
def get_scan(scan_id: str, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.scan_id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")
    return scan

@router.get("/{scan_id}/evidence", response_model=List[ExploitEvidenceOut])
def get_scan_evidence(scan_id: str, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.scan_id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")
    
    findings = db.query(Finding).filter(Finding.scan_id == scan_id).all()
    finding_ids = [f.id for f in findings]
    
    evidences = db.query(ExploitEvidence).filter(ExploitEvidence.finding_id.in_(finding_ids)).all() if finding_ids else []
    return evidences

@router.post("/{scan_id}/patch-proposals", response_model=PatchProposalOut)
def propose_patch_for_scan(scan_id: str, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.scan_id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")

    finding = db.query(Finding).filter(Finding.scan_id == scan_id).first()
    patch = generate_minimal_patch_proposal(db, finding_id=finding.id if finding else None)
    return patch
