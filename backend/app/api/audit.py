from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import AuditEvent
from app.schemas.schemas import AuditEventOut

router = APIRouter(prefix="/audit", tags=["Audit Trail"])

@router.get("/events", response_model=List[AuditEventOut])
def get_audit_trail(limit: int = 50, db: Session = Depends(get_db)):
    events = db.query(AuditEvent).order_by(AuditEvent.id.desc()).limit(limit).all()
    return events
