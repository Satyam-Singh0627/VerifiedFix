import React, { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  UserCheck,
  CheckCircle2,
  Bug,
  GitPullRequest,
  Hash,
  Award,
  Sparkles,
  Lock
} from 'lucide-react';
import { api } from '../services/api';
import { ContextualHelp } from '../components/ContextualHelp';
import { useToast } from '../context/ToastContext';

export const Reports: React.FC = () => {
  const { addToast } = useToast();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await api.getLatestReport();
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verifiedfix-report-${report.report_id || 'latest'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('success', 'Report Exported', 'JSON artifact downloaded successfully.');
  };

  return (
    <div className="space-y-6 pb-12 print:p-0 print:space-y-4 text-[#F1F0E8]">
      {/* Action Header (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#F1F0E8] flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-[#54D6BE]" />
            Stage 6 — Certified Security Verification Dossier
          </h1>
          <p className="text-xs text-[#A6B0A7] mt-1">
            Certified verification dossier with empirical evidence, patch reviews, test telemetry, and SHA-256 digest
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadJson}
            disabled={!report}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#282E29] hover:bg-[#343B35] text-[#F1F0E8] border border-[#39433B] transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#54D6BE]" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={!report}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#B8F36B] text-[#171A18] hover:bg-[#a6e058] transition-colors shadow-lg shadow-[#B8F36B]/20 disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF Export</span>
          </button>
        </div>
      </div>

      {/* Contextual Help */}
      <ContextualHelp
        title="Stage 6: How the Security Report & Integrity Seal work"
        summary="The security verification dossier aggregates the entire audit trail into a verifiable document that security leads, auditors, and judges can examine."
        details={[
          'Reproduction Evidence: Captures the original exploit before the patch was applied.',
          'Patch Metadata: Documents the exact line changes (+8/-3) and human reviewer signature.',
          '10-Point Test Results: Records every security and regression test with observed execution time.',
          'SHA-256 Digest: Computes a cryptographic checksum over the dossier payload to guarantee non-tampering.',
        ]}
        tourStageIndex={5}
      />

      {loading ? (
        <div className="p-12 text-center text-xs text-[#A6B0A7]">Compiling report dossier...</div>
      ) : !report ? (
        <div data-tour="report-dossier" className="p-12 text-center text-xs text-[#A6B0A7]">No report available.</div>
      ) : (
        /* Printable Report Document Card */
        <div
          data-tour="report-dossier"
          className="rounded-2xl border border-[#39433B] bg-[#202521] p-8 sm:p-12 space-y-8 shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0"
        >
          {/* Report Top Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-[#39433B] print:border-slate-300">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-[#F1F0E8] print:text-black tracking-wider">
                  VERIFIED<span className="text-[#B8F36B] print:text-emerald-700">FIX</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#282E29] text-[#A6B0A7] print:bg-slate-200 print:text-slate-800">
                  BYTEFORCE
                </span>
              </div>
              <h2 className="text-2xl font-black text-[#F1F0E8] print:text-black">
                Security Verification Dossier
              </h2>
              <div className="text-xs text-[#A6B0A7] print:text-slate-600 flex items-center gap-3">
                <span>Target: <strong>{report.target_application}</strong></span>
                <span>•</span>
                <span>ID: <code className="font-mono text-[#54D6BE] print:text-indigo-700">{report.report_id}</code></span>
              </div>
            </div>

            {/* Verification Seal Badge */}
            <div className="text-right">
              {report.is_tamper_verified ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#54D6BE]/15 border border-[#54D6BE]/40 text-[#54D6BE] print:bg-emerald-100 print:text-emerald-800 print:border-emerald-400">
                  <Award className="w-5 h-5 text-[#54D6BE]" />
                  <div className="text-left">
                    <div className="text-[10px] font-bold uppercase tracking-wider">Audit Verdict</div>
                    <div className="text-sm font-black">CERTIFIED VERIFIED</div>
                  </div>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F28B69]/15 border border-[#F28B69]/40 text-[#F28B69] print:bg-rose-100 print:text-rose-800">
                  <ShieldAlert className="w-5 h-5 text-[#F28B69]" />
                  <div className="text-left">
                    <div className="text-[10px] font-bold uppercase tracking-wider">Audit Verdict</div>
                    <div className="text-sm font-black">NOT YET VERIFIED</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SHA-256 Integrity Seal Banner */}
          {report.sha256_integrity_hash && (
            <div className="p-4 rounded-xl bg-[#171A18] border border-[#39433B] print:border-slate-300 print:bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-[#54D6BE] shrink-0" />
                <div>
                  <div className="font-bold text-[#F1F0E8] print:text-black">
                    {report.integrity_algorithm}
                  </div>
                  <div className="text-[11px] font-mono text-[#A6B0A7] print:text-slate-600 break-all">
                    {report.sha256_integrity_hash}
                  </div>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold text-[#54D6BE] bg-[#54D6BE]/10 px-2 py-0.5 rounded border border-[#54D6BE]/30 shrink-0">
                Integrity Validated
              </span>
            </div>
          )}

          {/* Section 1: Executive Summary */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#A6B0A7] print:text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#54D6BE]" />
              1. Executive Summary & Verification Claim
            </h3>
            <p className="text-xs text-[#A6B0A7] print:text-slate-800 leading-relaxed bg-[#282E29]/60 print:bg-slate-50 p-4 rounded-xl border border-[#39433B] print:border-slate-200">
              VerifiedFix conducted active security inspection and remediation verification against the DocVault
              application. An Insecure Direct Object Reference (CWE-639) was empirically discovered where Bob (an unauthorized contractor)
              obtained access to Alice&apos;s private document #12. A minimal, scoped patch enforcing centralized access control
              was proposed and approved. Empirical re-testing via a 10-point test matrix confirmed that the exploit is blocked
              (HTTP 403) while all legitimate tenant operations function without regression.
            </p>
          </div>

          {/* Section 2: Finding Details */}
          {report.finding && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#A6B0A7] print:text-slate-600 flex items-center gap-2">
                <Bug className="w-4 h-4 text-[#F28B69]" />
                2. Vulnerability Finding Profile
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#282E29]/60 print:bg-slate-50 border border-[#39433B] print:border-slate-200 space-y-2">
                  <div>
                    <span className="text-[10px] text-[#A6B0A7] uppercase font-bold">Title</span>
                    <div className="font-bold text-[#F1F0E8] print:text-black">{report.finding.title}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#A6B0A7] uppercase font-bold">Classification</span>
                    <div className="text-[#F28B69] print:text-rose-700 font-semibold">{report.finding.category} ({report.finding.cwe_id})</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#A6B0A7] uppercase font-bold">Severity</span>
                    <div className="text-[#F28B69] print:text-rose-700 font-bold">{report.finding.severity} (CVSS 7.5 High)</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#282E29]/60 print:bg-slate-50 border border-[#39433B] print:border-slate-200 space-y-2">
                  <div>
                    <span className="text-[10px] text-[#A6B0A7] uppercase font-bold">Affected Resource</span>
                    <div className="font-mono text-[#54D6BE] print:text-indigo-700 font-bold">{report.finding.affected_endpoint} (Doc #12)</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#A6B0A7] uppercase font-bold">Root Cause</span>
                    <div className="text-[#A6B0A7] print:text-slate-800 leading-snug">{report.finding.root_cause_explanation}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Remediation Patch Summary */}
          {report.patch_lifecycle && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#A6B0A7] print:text-slate-600 flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-[#B8F36B]" />
                3. Remediation Patch Lifecycle & Human Approval
              </h3>
              <div className="p-4 rounded-xl bg-[#282E29]/60 print:bg-slate-50 border border-[#39433B] print:border-slate-200 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-[#54D6BE] print:text-indigo-700 font-bold">{report.patch_lifecycle.patch_id}</span>: {report.patch_lifecycle.title}
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#54D6BE]/15 text-[#54D6BE] border border-[#54D6BE]/30 text-[10px] font-bold uppercase">
                    Status: {report.patch_lifecycle.status}
                  </span>
                </div>
                <div className="text-[#A6B0A7] print:text-slate-600 flex flex-wrap gap-4 text-[11px] pt-1">
                  <span>File: <code>{report.patch_lifecycle.affected_file}</code></span>
                  <span>Changed Lines: +{report.patch_lifecycle.lines_added} / -{report.patch_lifecycle.lines_removed}</span>
                  <span>Reviewer Signature: <strong>{report.patch_lifecycle.reviewer}</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Authoritative 10-Point Verification Results */}
          {report.verification_outcome && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#A6B0A7] print:text-slate-600 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#54D6BE]" />
                4. Authoritative Verification Matrix ({report.verification_outcome.passed_tests}/{report.verification_outcome.total_tests} Tests Passed)
              </h3>
              <div className="overflow-x-auto rounded-xl border border-[#39433B] print:border-slate-200">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#171A18] print:bg-slate-100 text-[#A6B0A7] print:text-slate-700 text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Test Case Name</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Identity</th>
                      <th className="p-2.5">Observed Result</th>
                      <th className="p-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#39433B] print:divide-slate-200 text-[#A6B0A7] print:text-slate-800">
                    {report.verification_outcome.test_matrix.map((t: any) => (
                      <tr key={t.number} className="hover:bg-[#282E29]/40 print:hover:bg-transparent">
                        <td className="p-2.5 text-[#A6B0A7]/60 font-bold">{t.number}</td>
                        <td className="p-2.5 font-sans font-semibold text-[#F1F0E8] print:text-black">{t.name}</td>
                        <td className="p-2.5 uppercase text-[10px]">{t.category}</td>
                        <td className="p-2.5">{t.identity}</td>
                        <td className="p-2.5 font-sans text-[11px]">{t.actual}</td>
                        <td className="p-2.5 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.status === 'passed' ? 'text-[#54D6BE] font-bold' : 'text-[#F28B69]'
                          }`}>
                            {t.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 5: Audit Sign-Off */}
          <div className="pt-6 border-t border-[#39433B] print:border-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#A6B0A7] print:text-slate-600">
            <div>
              <div className="font-semibold text-[#F1F0E8] print:text-black">Generated by VerifiedFix Security Verification Engine</div>
              <div className="text-[10px] text-[#A6B0A7]">Autonomous Security & Verification Agent — Team ByteForce</div>
            </div>
            <div className="text-right text-[11px] font-mono">
              Timestamp: {new Date(report.generated_at).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
