import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="user", nullable=False)  # "user", "admin"
    full_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    owned_documents = relationship("Document", back_populates="owner", cascade="all, delete-orphan")
    shares_received = relationship("DocumentShare", foreign_keys="DocumentShare.shared_with_user_id", back_populates="shared_with_user")
    shares_created = relationship("DocumentShare", foreign_keys="DocumentShare.shared_by_user_id", back_populates="shared_by_user")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    filename = Column(String(200), nullable=False)
    content_summary = Column(Text, nullable=False)
    file_content = Column(Text, nullable=False)  # Synthetic document text
    file_size = Column(Integer, default=1024)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_private = Column(Boolean, default=True)
    classification = Column(String(50), default="confidential")  # "confidential", "internal", "public"
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    owner = relationship("User", back_populates="owned_documents")
    shares = relationship("DocumentShare", back_populates="document", cascade="all, delete-orphan")

class DocumentShare(Base):
    __tablename__ = "document_shares"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    shared_with_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    shared_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    permission = Column(String(20), default="read")  # "read", "write"
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    document = relationship("Document", back_populates="shares")
    shared_with_user = relationship("User", foreign_keys=[shared_with_user_id], back_populates="shares_received")
    shared_by_user = relationship("User", foreign_keys=[shared_by_user_id], back_populates="shares_created")

class SystemSecurityState(Base):
    __tablename__ = "system_security_state"

    id = Column(Integer, primary_key=True, default=1)
    is_vulnerable = Column(Boolean, default=True)  # True = IDOR vulnerability active
    overall_status = Column(String(50), default="Not Scanned")  # Not Scanned, Vulnerable, Patch Proposed, Awaiting Approval, Patch Applied, Verification Failed, Verified, Needs Review
    active_patch_id = Column(String(50), nullable=True)
    last_scan_id = Column(String(50), nullable=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

def default_target_url():
    import os
    return os.getenv("DOCVAULT_TARGET_URL", "http://localhost:8000")

class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(String(50), unique=True, index=True, nullable=False)
    target_name = Column(String(100), default="DocVault Document Portal")
    target_url = Column(String(200), default=default_target_url)
    started_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="Running")  # "Running", "Completed", "Failed"
    summary = Column(Text, default="")
    total_checks = Column(Integer, default=0)
    passed_checks = Column(Integer, default=0)
    failed_checks = Column(Integer, default=0)

    # Relationships
    findings = relationship("Finding", back_populates="scan", cascade="all, delete-orphan")

class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(String(50), ForeignKey("scans.scan_id"), nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(100), default="Broken Access Control (IDOR)")
    cwe_id = Column(String(50), default="CWE-639 / OWASP A01:2021")
    severity = Column(String(20), default="High")  # "Critical", "High", "Medium", "Low"
    severity_rationale = Column(Text, nullable=False)
    affected_endpoint = Column(String(200), nullable=False)
    affected_object_id = Column(String(50), nullable=False)
    identity_tested = Column(String(50), nullable=False)
    expected_behavior = Column(Text, nullable=False)
    actual_behavior = Column(Text, nullable=False)
    http_status = Column(Integer, nullable=False)
    root_cause_explanation = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    scan = relationship("Scan", back_populates="findings")
    evidence = relationship("ExploitEvidence", back_populates="finding", cascade="all, delete-orphan")
    patch_proposals = relationship("PatchProposal", back_populates="finding", cascade="all, delete-orphan")

class ExploitEvidence(Base):
    __tablename__ = "exploit_evidences"

    id = Column(Integer, primary_key=True, index=True)
    finding_id = Column(Integer, ForeignKey("findings.id"), nullable=False)
    scenario_name = Column(String(100), nullable=False)
    request_method = Column(String(10), default="GET")
    request_url = Column(String(255), nullable=False)
    authenticated_as = Column(String(50), nullable=False)
    target_resource = Column(String(100), nullable=False)
    response_status = Column(Integer, nullable=False)
    response_preview_redacted = Column(Text, nullable=False)
    leak_confirmed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    finding = relationship("Finding", back_populates="evidence")

class PatchProposal(Base):
    __tablename__ = "patch_proposals"

    id = Column(Integer, primary_key=True, index=True)
    patch_id = Column(String(50), unique=True, index=True, nullable=False)
    finding_id = Column(Integer, ForeignKey("findings.id"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    security_rationale = Column(Text, nullable=False)
    affected_file = Column(String(255), nullable=False)
    before_code = Column(Text, nullable=False)
    after_code = Column(Text, nullable=False)
    diff_content = Column(Text, nullable=False)
    lines_added = Column(Integer, default=0)
    lines_removed = Column(Integer, default=0)
    status = Column(String(50), default="proposed")  # proposed, approved, rejected, applied, rolled_back
    reviewer = Column(String(100), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    applied_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    finding = relationship("Finding", back_populates="patch_proposals")

class VerificationRun(Base):
    __tablename__ = "verification_runs"

    id = Column(Integer, primary_key=True, index=True)
    verification_id = Column(String(50), unique=True, index=True, nullable=False)
    scan_id = Column(String(50), nullable=True)
    patch_id = Column(String(50), nullable=True)
    run_at = Column(DateTime, default=utc_now)
    status = Column(String(50), default="Verification Running")  # Verified, Verification Failed, Needs Review
    total_tests = Column(Integer, default=0)
    passed_tests = Column(Integer, default=0)
    failed_tests = Column(Integer, default=0)
    duration_ms = Column(Integer, default=0)

    # Relationships
    test_results = relationship("TestCaseResult", back_populates="verification_run", cascade="all, delete-orphan")

class TestCaseResult(Base):
    __tablename__ = "test_case_results"

    id = Column(Integer, primary_key=True, index=True)
    verification_run_id = Column(Integer, ForeignKey("verification_runs.id"), nullable=False)
    test_number = Column(Integer, nullable=False)
    test_name = Column(String(255), nullable=False)
    category = Column(String(50), default="security")  # "security", "regression"
    identity_tested = Column(String(50), nullable=False)
    expected_result = Column(Text, nullable=False)
    actual_result = Column(Text, nullable=False)
    status = Column(String(20), default="pending")  # "passed", "failed"
    duration_ms = Column(Integer, default=0)
    error_details = Column(Text, nullable=True)

    # Relationships
    verification_run = relationship("VerificationRun", back_populates="test_results")

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(50), nullable=False)  # SCAN_STARTED, SCAN_COMPLETED, PATCH_PROPOSED, PATCH_APPROVED, PATCH_REJECTED, PATCH_APPLIED, VERIFICATION_EXECUTED, DEMO_RESET
    description = Column(Text, nullable=False)
    actor = Column(String(100), default="system")
    ip_address = Column(String(45), default="127.0.0.1")
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
