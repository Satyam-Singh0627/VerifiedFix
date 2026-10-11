from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, Document, DocumentShare
from app.schemas.schemas import DocumentCreate, DocumentOut, DocumentShareCreate, DocumentShareOut
from app.services.auth_service import get_current_user
from app.services.document_service import (
    list_user_accessible_documents,
    get_document_with_auth_check,
    create_document,
    delete_document,
    share_document
)
from app.security_engine.audit_logger import log_audit_event

router = APIRouter(prefix="/documents", tags=["DocVault Documents"])

@router.get("", response_model=List[DocumentOut])
def get_documents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = list_user_accessible_documents(db, current_user)
    results = []
    for d in docs:
        d_out = DocumentOut.model_validate(d)
        d_out.owner_username = d.owner.username if d.owner else None
        results.append(d_out)
    return results

@router.post("", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def upload_document(
    doc_in: DocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = create_document(db, current_user, doc_in)
    log_audit_event(
        db,
        "DOCUMENT_UPLOADED",
        f"User '{current_user.username}' uploaded document '{doc.title}' (ID: {doc.id})",
        actor=current_user.username,
        metadata={"document_id": doc.id, "title": doc.title}
    )
    d_out = DocumentOut.model_validate(doc)
    d_out.owner_username = current_user.username
    return d_out

@router.get("/{document_id}", response_model=DocumentOut)
def view_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves document content.
    Demonstrates the baseline IDOR flaw when vulnerable mode is enabled,
    and returns HTTP 403 Forbidden when patched!
    """
    doc = get_document_with_auth_check(db, document_id, current_user, action="view")
    d_out = DocumentOut.model_validate(doc)
    d_out.owner_username = doc.owner.username if doc.owner else None
    
    # Enrich shares
    shares_out = []
    for s in doc.shares:
        s_out = DocumentShareOut(
            id=s.id,
            document_id=s.document_id,
            shared_with_user_id=s.shared_with_user_id,
            shared_with_username=s.shared_with_user.username if s.shared_with_user else None,
            shared_by_user_id=s.shared_by_user_id,
            shared_by_username=s.shared_by_user.username if s.shared_by_user else None,
            permission=s.permission,
            created_at=s.created_at
        )
        shares_out.append(s_out)
    d_out.shares = shares_out
    return d_out

@router.delete("/{document_id}")
def remove_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    delete_document(db, document_id, current_user)
    log_audit_event(
        db,
        "DOCUMENT_DELETED",
        f"User '{current_user.username}' deleted document ID {document_id}",
        actor=current_user.username,
        metadata={"document_id": document_id}
    )
    return {"message": f"Document {document_id} successfully deleted"}

@router.post("/{document_id}/share", response_model=DocumentShareOut)
def share_doc(
    document_id: int,
    share_in: DocumentShareCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    share = share_document(db, document_id, current_user, share_in)
    log_audit_event(
        db,
        "DOCUMENT_SHARED",
        f"User '{current_user.username}' shared document ID {document_id} with '{share_in.shared_with_username}'",
        actor=current_user.username,
        metadata={"document_id": document_id, "recipient": share_in.shared_with_username}
    )
    return DocumentShareOut(
        id=share.id,
        document_id=share.document_id,
        shared_with_user_id=share.shared_with_user_id,
        shared_with_username=share.shared_with_user.username if share.shared_with_user else None,
        shared_by_user_id=share.shared_by_user_id,
        shared_by_username=share.shared_by_user.username if share.shared_by_user else None,
        permission=share.permission,
        created_at=share.created_at
    )
