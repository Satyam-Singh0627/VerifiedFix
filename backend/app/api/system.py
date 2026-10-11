from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Scan, Finding, PatchProposal, VerificationRun, SystemSecurityState
from app.schemas.schemas import OverviewStats, SecurityStateOut
from app.services.document_service import get_security_state
from app.services.ai_service import ai_service
from app.db.seed import seed_database

router = APIRouter(prefix="/system", tags=["System Management & Demo Controls"])

@router.get("/stats", response_model=OverviewStats)
def get_system_overview(db: Session = Depends(get_db)):
    state = get_security_state(db)
    
    total_scans = db.query(Scan).count()
    confirmed_vulns = db.query(Finding).count()
    awaiting_approval = db.query(PatchProposal).filter(
        PatchProposal.status.in_(["proposed", "Patch Pending Approval", "Awaiting Approval"])
    ).count()
    verified_fixes = db.query(VerificationRun).filter(
        VerificationRun.status.in_(["Fix Verified", "Verified"])
    ).count()

    return OverviewStats(
        total_scans=total_scans,
        confirmed_vulnerabilities=confirmed_vulns,
        patches_awaiting_approval=awaiting_approval,
        verified_fixes=verified_fixes,
        current_security_state=SecurityStateOut.model_validate(state),
        ai_provider=ai_service.get_provider_name(),
        is_vulnerable=state.is_vulnerable
    )

@router.post("/reset-demo")
def handle_reset_demo(db: Session = Depends(get_db)):
    """
    Dedicated Hackathon Demo Reset Action.
    Restores the seeded identities (Alice, Bob, Carol, Admin), synthetic documents,
    and returns the demo to the baseline vulnerable state for live judging presentation.
    """
    seed_database(db)
    state = get_security_state(db)
    return {
        "status": "success",
        "message": "Demo environment reset to initial vulnerable baseline.",
        "is_vulnerable": state.is_vulnerable,
        "overall_status": state.overall_status
    }
