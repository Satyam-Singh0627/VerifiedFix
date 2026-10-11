import {
  OverviewStats,
  Scan,
  Finding,
  ExploitEvidence,
  PatchProposal,
  VerificationRun,
  AuditEvent,
  DocumentItem,
  User
} from '../types';

const API_BASE = '/api';

// Helper for standard JSON fetch
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('docvault_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = 'API request failed';
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    }
    const err = new Error(errorDetail);
    (err as any).status = res.status;
    throw err;
  }

  return res.json();
}

export const api = {
  // System & Stats
  getStats: () => request<OverviewStats>('/system/stats'),
  resetDemo: () => request<{ status: string; message: string; is_vulnerable: boolean; overall_status: string }>('/system/reset-demo', { method: 'POST' }),

  // Scans & Findings
  getScans: () => request<Scan[]>('/scans'),
  startScan: () => request<Scan>('/scans', { method: 'POST' }),
  getScan: (id: string) => request<Scan>(`/scans/${id}`),
  getScanEvidence: (scanId: string) => request<ExploitEvidence[]>(`/scans/${scanId}/evidence`),
  proposePatch: (scanId: string) => request<PatchProposal>(`/scans/${scanId}/patch-proposals`, { method: 'POST' }),

  // Patches
  getPatches: () => request<PatchProposal[]>('/patches'),
  getPatch: (patchId: string) => request<PatchProposal>(`/patches/${patchId}`),
  approvePatch: (patchId: string, reviewer = 'Lead AppSec Engineer') =>
    request<PatchProposal>(`/patches/${patchId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ reviewer_name: reviewer }),
    }),
  rejectPatch: (patchId: string, reviewer = 'Lead AppSec Engineer') =>
    request<PatchProposal>(`/patches/${patchId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reviewer_name: reviewer }),
    }),
  applyPatch: (patchId: string, reviewer = 'Lead AppSec Engineer') =>
    request<PatchProposal>(`/patches/${patchId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ reviewer_name: reviewer }),
    }),
  rollbackPatch: (patchId: string, reviewer = 'Lead AppSec Engineer') =>
    request<PatchProposal>(`/patches/${patchId}/rollback`, {
      method: 'POST',
      body: JSON.stringify({ reviewer_name: reviewer }),
    }),

  // Verification
  runVerification: (patchId?: string) =>
    request<VerificationRun>('/verification/run', {
      method: 'POST',
      body: JSON.stringify({ patch_id: patchId }),
    }),
  getLatestVerification: () => request<VerificationRun>('/verification/latest'),
  getVerificationHistory: () => request<VerificationRun[]>('/verification/history'),

  // Reports
  getLatestReport: () => request<any>('/reports/latest'),
  downloadJsonReportUrl: () => `${API_BASE}/reports/download/json`,

  // Audit
  getAuditEvents: (limit = 50) => request<AuditEvent[]>(`/audit/events?limit=${limit}`),

  // DocVault Portal Client
  login: async (username: string, password = 'Password123!') => {
    const data = await request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('docvault_token', data.access_token);
    localStorage.setItem('docvault_user', JSON.stringify(data.user));
    return data;
  },
  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('docvault_token');
      localStorage.removeItem('docvault_user');
    }
  },
  getMe: () => request<User>('/auth/me'),
  getDocuments: () => request<DocumentItem[]>('/documents'),
  getDocument: (id: number) => request<DocumentItem>(`/documents/${id}`),
  uploadDocument: (doc: { title: string; filename: string; content_summary: string; file_content: string; is_private: boolean; classification: string }) =>
    request<DocumentItem>('/documents', { method: 'POST', body: JSON.stringify(doc) }),
  deleteDocument: (id: number) => request<{ message: string }>(`/documents/${id}`, { method: 'DELETE' }),
  shareDocument: (id: number, sharedWith: string, permission = 'read') =>
    request<any>(`/documents/${id}/share`, {
      method: 'POST',
      body: JSON.stringify({ shared_with_username: sharedWith, permission }),
    }),
};
