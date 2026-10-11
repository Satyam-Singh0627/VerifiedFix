import sys
import os

backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from sqlalchemy.orm import Session
from app.core.database import Base, engine, SessionLocal
from app.core.security import hash_password
from app.models.models import (
    User, Document, DocumentShare, SystemSecurityState,
    Scan, Finding, ExploitEvidence, PatchProposal,
    VerificationRun, TestCaseResult, AuditEvent
)
from app.security_engine.audit_logger import log_audit_event

DEMO_USERS = [
    {
        "username": "alice",
        "email": "alice@docvault.local",
        "password": "Password123!",
        "full_name": "Alice Johnson (CFO)",
        "role": "user"
    },
    {
        "username": "bob",
        "email": "bob@docvault.local",
        "password": "Password123!",
        "full_name": "Bob Miller (Contractor)",
        "role": "user"
    },
    {
        "username": "carol",
        "email": "carol@docvault.local",
        "password": "Password123!",
        "full_name": "Carol Davis (Marketing Director)",
        "role": "user"
    },
    {
        "username": "admin",
        "email": "admin@docvault.local",
        "password": "Password123!",
        "full_name": "Security Administrator",
        "role": "admin"
    }
]

def seed_database(db: Session):
    """Initializes deterministic demo data for the hackathon baseline."""
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    # 1. Clear existing records to provide clean deterministic state
    db.query(TestCaseResult).delete()
    db.query(VerificationRun).delete()
    db.query(PatchProposal).delete()
    db.query(ExploitEvidence).delete()
    db.query(Finding).delete()
    db.query(Scan).delete()
    db.query(DocumentShare).delete()
    db.query(Document).delete()
    db.query(User).delete()
    db.query(SystemSecurityState).delete()
    db.query(AuditEvent).delete()
    db.commit()

    # 2. Seed Users
    created_users = {}
    for u in DEMO_USERS:
        user_obj = User(
            username=u["username"],
            email=u["email"],
            hashed_password=hash_password(u["password"]),
            full_name=u["full_name"],
            role=u["role"]
        )
        db.add(user_obj)
        db.commit()
        db.refresh(user_obj)
        created_users[u["username"]] = user_obj

    alice = created_users["alice"]
    bob = created_users["bob"]
    carol = created_users["carol"]
    admin = created_users["admin"]

    # 3. Seed Documents (Explicitly ensuring Alice's private doc is ID 12)
    doc_11 = Document(
        id=11,
        title="DocVault Employee Operations Manual",
        filename="operations_manual_2026.pdf",
        content_summary="General internal employee guidelines and remote work procedures.",
        file_content="DocVault Employee Operations Manual (Internal). Guidelines for standard office operations.",
        file_size=2048,
        owner_id=alice.id,
        is_private=False,
        classification="internal"
    )
    db.add(doc_11)

    doc_12 = Document(
        id=12,
        title="Q3 Financial Strategy & M&A Acquisition Roadmap",
        filename="q3_confidential_financials.pdf",
        content_summary="Strictly confidential M&A targets, executive compensation packages, and strategic cash reserves.",
        file_content=(
            "CONFIDENTIAL DOCUMENT #12 - EXECUTIVE BOARD ONLY\n"
            "Subject: Project Apex Enterprise Acquisition\n"
            "Target Valuation: $48,500,000 USD\n"
            "Restricted Escrow: $14,200,000 USD\n"
            "Primary Stakeholder: Alice Johnson (CFO)\n"
            "NOTICE: Unauthorized direct access, copying, or retrieval violates federal security compliance policies."
        ),
        file_size=4096,
        owner_id=alice.id,
        is_private=True,
        classification="confidential"
    )
    db.add(doc_12)

    doc_13 = Document(
        id=13,
        title="Bob's Contractor Daily Worklogs",
        filename="contractor_worklogs.txt",
        content_summary="Routine maintenance and infrastructure logs maintained by Bob.",
        file_content="Daily Worklog: Routine server check, database indexing, and network latency audit.",
        file_size=1024,
        owner_id=bob.id,
        is_private=True,
        classification="internal"
    )
    db.add(doc_13)

    doc_14 = Document(
        id=14,
        title="Joint Marketing Q3 Promotional Budget",
        filename="marketing_budget_shared.xlsx",
        content_summary="Co-developed marketing campaign schedule shared between Alice and Carol.",
        file_content="Marketing Budget Q3: $120,000 allocated across digital outreach, hackathon sponsorships, and collateral.",
        file_size=3120,
        owner_id=alice.id,
        is_private=True,
        classification="internal"
    )
    db.add(doc_14)
    db.commit()

    # 4. Seed Explicit Sharing relationship for Doc 14 (Alice -> Carol)
    share_14 = DocumentShare(
        document_id=doc_14.id,
        shared_with_user_id=carol.id,
        shared_by_user_id=alice.id,
        permission="read"
    )
    db.add(share_14)
    db.commit()

    # 5. Initialize System Security State in Vulnerable Demo Baseline
    state = SystemSecurityState(
        id=1,
        is_vulnerable=True,
        overall_status="Not Scanned",
        active_patch_id=None,
        last_scan_id=None
    )
    db.add(state)
    db.commit()

    # 6. Audit Initial Seed
    log_audit_event(
        db,
        event_type="DEMO_RESET",
        description="Demo database re-initialized to vulnerable baseline state with seeded identities (Alice, Bob, Carol, Admin)",
        actor="system_initializer",
        metadata={"baseline_doc_id": 12, "vulnerable": True}
    )

    print("Database successfully seeded with deterministic hackathon demo state!")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
