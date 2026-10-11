import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict

# User Schemas
class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    role: str = "user"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(UserBase):
    id: int
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# Document Schemas
class DocumentBase(BaseModel):
    title: str
    filename: str
    content_summary: str
    is_private: bool = True
    classification: str = "confidential"

class DocumentCreate(DocumentBase):
    file_content: str

class DocumentShareCreate(BaseModel):
    shared_with_username: str
    permission: str = "read"

class DocumentShareOut(BaseModel):
    id: int
    document_id: int
    shared_with_user_id: int
    shared_with_username: Optional[str] = None
    shared_by_user_id: int
    shared_by_username: Optional[str] = None
    permission: str
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

class DocumentOut(DocumentBase):
    id: int
    file_size: int
    owner_id: int
    owner_username: Optional[str] = None
    file_content: Optional[str] = None
    shares: List[DocumentShareOut] = []
    created_at: datetime.datetime
    updated_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

# Security Schemas
class SecurityStateOut(BaseModel):
    is_vulnerable: bool
    overall_status: str
    active_patch_id: Optional[str] = None
    last_scan_id: Optional[str] = None
    updated_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

class ExploitEvidenceOut(BaseModel):
    id: int
    scenario_name: str
    request_method: str
    request_url: str
    authenticated_as: str
    target_resource: str
    response_status: int
    response_preview_redacted: str
    leak_confirmed: bool
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

class FindingOut(BaseModel):
    id: int
    scan_id: str
    title: str
    category: str
    cwe_id: str
    severity: str
    severity_rationale: str
    affected_endpoint: str
    affected_object_id: str
    identity_tested: str
    expected_behavior: str
    actual_behavior: str
    http_status: int
    root_cause_explanation: str
    created_at: datetime.datetime
    evidence: List[ExploitEvidenceOut] = []
    model_config = ConfigDict(from_attributes=True)

class ScanOut(BaseModel):
    id: int
    scan_id: str
    target_name: str
    target_url: str
    started_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None
    status: str
    summary: str
    total_checks: int
    passed_checks: int
    failed_checks: int
    findings: List[FindingOut] = []
    model_config = ConfigDict(from_attributes=True)

class PatchProposalOut(BaseModel):
    id: int
    patch_id: str
    finding_id: Optional[int] = None
    title: str
    description: str
    security_rationale: str
    affected_file: str
    before_code: str
    after_code: str
    diff_content: str
    lines_added: int
    lines_removed: int
    status: str
    reviewer: Optional[str] = None
    reviewed_at: Optional[datetime.datetime] = None
    applied_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

class PatchActionRequest(BaseModel):
    reviewer_name: str = "Security Engineer"
    notes: Optional[str] = None

class TestCaseResultOut(BaseModel):
    id: int
    test_number: int
    test_name: str
    category: str
    identity_tested: str
    expected_result: str
    actual_result: str
    status: str
    duration_ms: int
    error_details: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class VerificationRunOut(BaseModel):
    id: int
    verification_id: str
    scan_id: Optional[str] = None
    patch_id: Optional[str] = None
    run_at: datetime.datetime
    status: str
    total_tests: int
    passed_tests: int
    failed_tests: int
    duration_ms: int
    test_results: List[TestCaseResultOut] = []
    model_config = ConfigDict(from_attributes=True)

class AuditEventOut(BaseModel):
    id: int
    event_type: str
    description: str
    actor: str
    ip_address: str
    metadata_json: Optional[str] = None
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

class OverviewStats(BaseModel):
    total_scans: int
    confirmed_vulnerabilities: int
    patches_awaiting_approval: int
    verified_fixes: int
    current_security_state: SecurityStateOut
    ai_provider: str
    is_vulnerable: bool
