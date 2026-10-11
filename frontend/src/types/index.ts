export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
}

export interface DocumentShare {
  id: number;
  document_id: number;
  shared_with_user_id: number;
  shared_with_username?: string;
  shared_by_user_id: number;
  shared_by_username?: string;
  permission: string;
  created_at: string;
}

export interface DocumentItem {
  id: number;
  title: string;
  filename: string;
  content_summary: string;
  file_content?: string;
  file_size: number;
  owner_id: number;
  owner_username?: string;
  is_private: boolean;
  classification: string;
  shares?: DocumentShare[];
  created_at: string;
  updated_at: string;
}

export interface SecurityState {
  is_vulnerable: boolean;
  overall_status: string;
  active_patch_id?: string;
  last_scan_id?: string;
  updated_at: string;
}

export interface ExploitEvidence {
  id: number;
  scenario_name: string;
  request_method: string;
  request_url: string;
  authenticated_as: string;
  target_resource: string;
  response_status: number;
  response_preview_redacted: string;
  leak_confirmed: boolean;
  created_at: string;
}

export interface Finding {
  id: number;
  scan_id: string;
  title: string;
  category: string;
  cwe_id: string;
  severity: string;
  severity_rationale: string;
  affected_endpoint: string;
  affected_object_id: string;
  identity_tested: string;
  expected_behavior: string;
  actual_behavior: string;
  http_status: number;
  root_cause_explanation: string;
  created_at: string;
  evidence: ExploitEvidence[];
}

export interface Scan {
  id: number;
  scan_id: string;
  target_name: string;
  target_url: string;
  started_at: string;
  completed_at?: string;
  status: string;
  summary: string;
  total_checks: number;
  passed_checks: number;
  failed_checks: number;
  findings: Finding[];
}

export interface PatchProposal {
  id: number;
  patch_id: string;
  finding_id?: number;
  title: string;
  description: string;
  security_rationale: string;
  affected_file: string;
  before_code: string;
  after_code: string;
  diff_content: string;
  lines_added: number;
  lines_removed: number;
  status: string; // proposed, approved, rejected, applied, rolled_back
  reviewer?: string;
  reviewed_at?: string;
  applied_at?: string;
  created_at: string;
}

export interface TestCaseResult {
  id: number;
  test_number: number;
  test_name: string;
  category: "security" | "regression";
  identity_tested: string;
  expected_result: string;
  actual_result: string;
  status: "passed" | "failed";
  duration_ms: number;
  error_details?: string;
}

export interface VerificationRun {
  id: number;
  verification_id: string;
  scan_id?: string;
  patch_id?: string;
  run_at: string;
  status: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  duration_ms: number;
  test_results: TestCaseResult[];
}

export interface AuditEvent {
  id: number;
  event_type: string;
  description: string;
  actor: string;
  ip_address: string;
  metadata_json?: string;
  created_at: string;
}

export interface OverviewStats {
  total_scans: number;
  confirmed_vulnerabilities: number;
  patches_awaiting_approval: number;
  verified_fixes: number;
  current_security_state: SecurityState;
  ai_provider: string;
  is_vulnerable: boolean;
}
