import json
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import AuditEvent

def log_audit_event(
    db: Session,
    event_type: str,
    description: str,
    actor: str = "security_engineer",
    ip_address: str = "127.0.0.1",
    metadata: Optional[Dict[str, Any]] = None
) -> AuditEvent:
    """Records an immutable audit event for security and compliance tracking."""
    event = AuditEvent(
        event_type=event_type,
        description=description,
        actor=actor,
        ip_address=ip_address,
        metadata_json=json.dumps(metadata or {})
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
