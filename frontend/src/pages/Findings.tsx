import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bug,
  ShieldAlert,
  Terminal,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Lock,
  Unlock,
  Info
} from 'lucide-react';
import { api, getTargetHost } from '../services/api';
import { Scan, Finding } from '../types';
import { ContextualHelp } from '../components/ContextualHelp';
import { useToast } from '../context/ToastContext';

export const Findings: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFindings();
  }, []);

  const loadFindings = async () => {
    try {
      setLoading(true);
      const data = await api.getScans();
      let found: Finding | null = null;
      for (const s of data) {
        if (s.findings && s.findings.length > 0) {
          found = s.findings[0];
          break;
        }
      }
      if (!found && data.length === 0) {
        try {
          const newScan = await api.startScan();
          if (newScan.findings && newScan.findings.length > 0) {
            found = newScan.findings[0];
          }
        } catch (e) {
          console.warn('Auto-scan fallback failed', e);
        }
      }
      setSelectedFinding(found);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 text-[#F1F0E8]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#F1F0E8] flex items-center gap-2.5">
            <Bug className="w-6 h-6 text-[#F28B69]" />
            Stages 2 & 3 — Vulnerability Evidence & Root Cause
          </h1>
          <p className="text-xs text-[#A6B0A7] mt-1">
            Empirical evidence of access control breach with precise source code location mapping
          </p>
        </div>

        <button
          onClick={() => navigate('/patches')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#B8F36B] text-[#171A18] hover:bg-[#a6e058] transition-all shadow-lg shadow-[#B8F36B]/20"
        >
          <span>Review Remediation Patch</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Contextual Help */}
      <ContextualHelp
        title="Stages 2 & 3: Understanding Exploit Proof & Root Cause"
        summary="A finding in VerifiedFix is backed by an actual exploit reproduction test, not just an AI opinion or keyword search."
        details={[
          'Plain English: "Bob (an unauthorized user) can view Document #12, which belongs to Alice."',
          'Technical classification: CWE-639 / OWASP A01:2021 (Broken Access Control via Insecure Direct Object Reference).',
          'Evidence shows the exact HTTP request sent by Bob and the confidential metadata returned by the server.',
          'The Root Cause panel points directly to backend/app/services/document_service.py where the ownership check was skipped.',
        ]}
        tourStageIndex={1}
      />

      {loading ? (
        <div className="p-12 text-center text-xs text-[#A6B0A7]">Loading finding telemetry...</div>
      ) : !selectedFinding ? (
        <div className="rounded-2xl border border-[#39433B] bg-[#202521] p-12 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-[#54D6BE] mx-auto" />
          <h3 className="text-base font-bold text-[#F1F0E8]">No Active Vulnerabilities Found</h3>
          <p className="text-xs text-[#A6B0A7] max-w-md mx-auto">
            No unmitigated vulnerabilities detected in recent scans. If you just applied a fix, the target application is secure!
          </p>
          <button
            onClick={() => api.startScan().then(loadFindings)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#282E29] text-[#F1F0E8] hover:bg-[#343B35] border border-[#39433B] transition-colors"
          >
            Run Scan to Re-Evaluate
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Finding Core Overview Card */}
          <div className="rounded-2xl border border-[#F28B69]/50 bg-gradient-to-br from-[#F28B69]/10 via-[#202521] to-[#202521] p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-[#39433B]">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#F28B69]/20 text-[#F28B69] border border-[#F28B69]/40">
                    SEVERITY: {selectedFinding.severity.toUpperCase()}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#282E29] text-[#A6B0A7] border border-[#39433B]">
                    {selectedFinding.cwe_id}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#54D6BE]/15 text-[#54D6BE] border border-[#54D6BE]/30">
                    {selectedFinding.category}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#F1F0E8]">{selectedFinding.title}</h2>
                <div className="text-xs text-[#A6B0A7] flex items-center gap-2">
                  <span>Affected Endpoint:</span>
                  <code className="text-[#B8F36B] font-mono bg-[#171A18] px-2 py-0.5 rounded border border-[#39433B]">
                    {selectedFinding.affected_endpoint}
                  </code>
                </div>
              </div>

              <div className="text-left md:text-right bg-[#282E29] p-3 rounded-xl border border-[#39433B]">
                <span className="text-[10px] text-[#A6B0A7] uppercase font-bold">Affected Resource</span>
                <div className="text-sm font-bold text-[#F1F0E8]">Document ID #{selectedFinding.affected_object_id}</div>
                <div className="text-[11px] text-[#F28B69] font-medium">Alice&apos;s Private M&A Financials</div>
              </div>
            </div>

            {/* Severity Rationale */}
            <div className="pt-6 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#A6B0A7] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#F28B69]" />
                Severity & Risk Impact Analysis
              </h3>
              <p className="text-xs text-[#A6B0A7] leading-relaxed bg-[#171A18]/60 p-4 rounded-xl border border-[#39433B]">
                {selectedFinding.severity_rationale}
              </p>
            </div>
          </div>

          {/* Side-by-side: Exploit Evidence (Stage 2) vs Root Cause (Stage 3) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Exploit Evidence Box (Stage 2: Prove) */}
            <div
              data-tour="exploit-evidence"
              className="rounded-2xl border border-[#39433B] bg-[#202521] p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#F1F0E8] flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#F28B69]" />
                  Stage 2 — Empirical Exploit Evidence
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#F28B69]/15 text-[#F28B69] border border-[#F28B69]/30">
                  Exploit Confirmed
                </span>
              </div>

              <p className="text-xs text-[#A6B0A7] leading-relaxed">
                The scanner executed a controlled reproduction request as <strong className="text-[#F1F0E8]">Bob (attacker)</strong>{' '}
                for <strong className="text-[#F1F0E8]">Document #12</strong> belonging to Alice.
              </p>

              <div className="space-y-3 font-mono text-xs">
                {/* Request */}
                <div className="p-3.5 rounded-xl bg-[#171A18] border border-[#39433B] space-y-1">
                  <div className="text-[10px] text-[#A6B0A7] font-bold uppercase">HTTP Request Sent</div>
                  <div className="text-[#54D6BE] font-semibold">GET /api/documents/12 HTTP/1.1</div>
                  <div className="text-[#A6B0A7] text-[11px]">Authorization: Bearer bob_session_token [REDACTED]</div>
                  <div className="text-[#A6B0A7]/70 text-[11px]">Host: {getTargetHost()}</div>
                </div>

                {/* Response */}
                <div className="p-3.5 rounded-xl bg-[#171A18] border border-[#F28B69]/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#F28B69] font-bold uppercase">HTTP Response Received</span>
                    <span className="text-[11px] font-bold text-[#F28B69]">200 OK (Expected 403 Forbidden)</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#F28B69]/10 text-[#F28B69] text-[11px] leading-relaxed break-all border border-[#F28B69]/20 font-mono">
                    {selectedFinding.evidence && selectedFinding.evidence.length > 0
                      ? selectedFinding.evidence[0].response_preview_redacted
                      : '{"id": 12, "title": "Q3 Financial Strategy", "classification": "confidential", "content_summary": "[REDACTED]"}'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-[#282E29] p-3 rounded-xl border border-[#39433B]">
                <div>
                  <span className="text-[#A6B0A7] text-[10px] uppercase font-bold">Expected Secure Behavior</span>
                  <div className="font-semibold text-[#54D6BE]">{selectedFinding.expected_behavior}</div>
                </div>
                <div>
                  <span className="text-[#A6B0A7] text-[10px] uppercase font-bold">Observed Vulnerable Behavior</span>
                  <div className="font-semibold text-[#F28B69]">{selectedFinding.actual_behavior}</div>
                </div>
              </div>
            </div>

            {/* Root Cause Analysis (Stage 3: Explain) */}
            <div
              data-tour="root-cause"
              className="rounded-2xl border border-[#39433B] bg-[#202521] p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#F1F0E8] flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-[#B8F36B]" />
                  Stage 3 — Root Cause & Code Path
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#B8F36B]/15 text-[#B8F36B] border border-[#B8F36B]/30">
                  Exact Code Location
                </span>
              </div>

              <div className="space-y-3 text-xs text-[#A6B0A7] leading-relaxed">
                <p className="text-[#F1F0E8]">{selectedFinding.root_cause_explanation}</p>

                <div className="p-3.5 rounded-xl bg-[#171A18] border border-[#39433B] space-y-1 font-mono text-xs">
                  <div className="text-[10px] text-[#A6B0A7] uppercase font-bold">Vulnerable Source Code Path</div>
                  <div className="text-[#B8F36B] font-semibold">
                    backend/app/services/document_service.py:get_document_with_auth_check
                  </div>
                  <div className="text-[#F28B69] text-[11px] pt-1">
                    Missing Check: if not (doc.owner_id == user.id or user.role == &apos;admin&apos; or has_share): raise 403
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#282E29] border border-[#39433B] space-y-1">
                  <div className="text-[10px] font-bold text-[#54D6BE] uppercase">Recommended Remediation</div>
                  <p className="text-[#A6B0A7] text-xs">
                    Apply the centralized authorization policy to the document retrieval route. Enforce owner match,
                    admin override, or active document share record before releasing resource data.
                  </p>
                </div>

                <button
                  onClick={() => navigate('/patches')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-[#B8F36B] hover:bg-[#a6e058] text-[#171A18] transition-all shadow-md"
                >
                  <span>Review Proposed Patch</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
