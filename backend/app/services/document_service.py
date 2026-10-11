from typing import Optional, List, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.models import Document, DocumentShare, User, SystemSecurityState
from app.schemas.schemas import DocumentCreate, DocumentShareCreate

def get_security_state(db: Session) -> SystemSecurityState:
    """Retrieve or create the system security state singleton."""
    state = db.query(SystemSecurityState).filter(SystemSecurityState.id == 1).first()
    if not state:
        state = SystemSecurityState(id=1, is_vulnerable=True, overall_status="Not Scanned")
        db.add(state)
        db.commit()
        db.refresh(state)
    return state

def check_document_permission(
    db: Session,
    user: User,
    doc: Document,
    action: str = "view"
) -> Tuple[bool, str]:
    """
    Centralized Authorization Policy Engine.
    Rules:
    - Admin: Allow all operations.
    - Owner: Allow all operations.
    - Authorized recipient (explicit share): Allow 'view' if granted. Deny 'delete' and 'share' by default.
    - Outsider: Deny all operations.
    """
    # 1. Admin rule
    if user.role == "admin":
        return True, "Authorized via Administrator role"

    # 2. Owner rule
    if doc.owner_id == user.id:
        return True, "Authorized via Document Ownership"

    # 3. Explicit Sharing rule for view/read
    if action == "view":
        share = db.query(DocumentShare).filter(
            DocumentShare.document_id == doc.id,
            DocumentShare.shared_with_user_id == user.id
        ).first()
        if share:
            return True, f"Authorized via Explicit Share (Permission: {share.permission})"
        
        # If public document
        if not doc.is_private:
            return True, "Authorized via Public classification"

    # 4. Default Deny
    return False, "Access Denied: Missing document ownership or sharing authorization"

def get_document_with_auth_check(
    db: Session,
    document_id: int,
    user: User,
    action: str = "view"
) -> Document:
    """
    Retrieves document while respecting current patch state.
    In vulnerable demo mode:
      Checks only that the user is logged in, skipping ownership/share verification (IDOR).
    In patched mode:
      Enforces centralized authorization policy strictly.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} was not found"
        )

    state = get_security_state(db)

    # In intentionally vulnerable baseline:
    # Only checks if user is logged in (action == 'view'), failing to verify ownership or share permission!
    if state.is_vulnerable and action == "view":
        # VULNERABLE PATH: Broken Access Control (CWE-639)
        # Note: In educational demo mode, we return the document directly without checking doc.owner_id == user.id
        return doc

    # SECURE PATH / PATCHED PATH:
    allowed, reason = check_document_permission(db, user, doc, action=action)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Forbidden: {reason}"
        )

    return doc

def list_user_accessible_documents(db: Session, user: User) -> List[Document]:
    """Returns documents the user owns or has received shared access to, or all if admin."""
    if user.role == "admin":
        return db.query(Document).order_by(Document.id.asc()).all()

    # User's own documents
    owned = db.query(Document).filter(Document.owner_id == user.id).all()
    
    # Documents shared with user
    shared_ids = [
        s.document_id for s in db.query(DocumentShare).filter(DocumentShare.shared_with_user_id == user.id).all()
    ]
    shared = db.query(Document).filter(Document.id.in_(shared_ids)).all() if shared_ids else []

    all_docs = {d.id: d for d in (owned + shared)}
    return sorted(list(all_docs.values()), key=lambda d: d.id)

def create_document(db: Session, user: User, doc_in: DocumentCreate) -> Document:
    doc = Document(
        title=doc_in.title,
        filename=doc_in.filename,
        content_summary=doc_in.content_summary,
        file_content=doc_in.file_content,
        file_size=len(doc_in.file_content.encode("utf-8")),
        owner_id=user.id,
        is_private=doc_in.is_private,
        classification=doc_in.classification
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

def delete_document(db: Session, document_id: int, user: User) -> bool:
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} was not found"
        )

    # Deletion always strictly enforced: Owner or Admin only
    allowed, reason = check_document_permission(db, user, doc, action="delete")
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Forbidden: {reason}"
        )

    db.delete(doc)
    db.commit()
    return True

def share_document(
    db: Session,
    document_id: int,
    user: User,
    share_in: DocumentShareCreate
) -> DocumentShare:
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} was not found"
        )

    # Sharing always strictly enforced: Owner or Admin only
    allowed, reason = check_document_permission(db, user, doc, action="share")
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Forbidden: {reason}"
        )

    target_user = db.query(User).filter(User.username == share_in.shared_with_username).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipient user '{share_in.shared_with_username}' does not exist"
        )

    if target_user.id == doc.owner_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot share document with its owner"
        )

    existing = db.query(DocumentShare).filter(
        DocumentShare.document_id == doc.id,
        DocumentShare.shared_with_user_id == target_user.id
    ).first()
    if existing:
        existing.permission = share_in.permission
        db.commit()
        db.refresh(existing)
        return existing

    new_share = DocumentShare(
        document_id=doc.id,
        shared_with_user_id=target_user.id,
        shared_by_user_id=user.id,
        permission=share_in.permission
    )
    db.add(new_share)
    db.commit()
    db.refresh(new_share)
    return new_share
