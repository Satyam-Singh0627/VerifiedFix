import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Play,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Layers,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { VerificationRun } from '../types';
import { ContextualHelp } from '../components/ContextualHelp';
import { useToast } from '../context/ToastContext';

interface VerificationProps {
  onStateChange: () => void;
}

export const Verification: React.FC<VerificationProps> = ({ onStateChange }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [verification, setVerification] = useState<VerificationRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | 'security' | 'regression'>('all');

  useEffect(() => {
    loadLatestVerification();
  }, []);

  const loadLatestVerification = async () => {
    try {
      setLoading(true);
      const data = await api.getLatestVerification();
      setVerification(data);
    } catch {
      try {
        const run = await api.runVerification();
        setVerification(run);
      } catch (err) {
        console.warn('Auto verification run fallback failed', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRunVerification = async () => {
    try {
      setRunning(true);
      const run = await api.runVerification();
      setVerification(run);
      onStateChange();
      addToast(
        run.status === 'Fix Verified' || run.status === 'Verified' ? 'success' : 'error',
        `Verification Verdict: ${run.status}`,
        `${run.passed_tests}/${run.total_tests} test cases passed.`
      );
    } catch (err) {
      addToast('error', 'Verification Failed', (err as Error).message);
    } finally {
      setRunning(false);
    }
  };

  const filteredTests =
    verification?.test_results.filter((t) => {
      if (filterCategory === 'all') return true;
      return t.category === filterCategory;
    }) || [];

  return (
    <div className="space-y-6 pb-12 text-[#F1F0E8]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#F1F0E8] flex items-center gap-2.5">
            <CheckCircle2 className="w-6 h-6 text-[#54D6BE]" />
            Stage 5 — Empirical Verification Matrix
          </h1>
          <p className="text-xs text-[#A6B0A7] mt-1">
            Authoritative 10-point test matrix proving exploit resistance and zero functional regression
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunVerification}
            disabled={running}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#B8F36B] text-[#171A18] hover:bg-[#a6e058] transition-all shadow-lg shadow-[#B8F36B]/20 disabled:opacity-50"
          >
            {running ? (
              <span className="animate-spin w-4 h-4 border-2 border-[#171A18] border-t-transparent rounded-full" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{running ? 'Executing Tests...' : 'Execute Verification Suite'}</span>
          </button>

          {verification && (verification.status === 'Fix Verified' || verification.status === 'Verified') && (
            <button
              onClick={() => navigate('/reports')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#282E29] hover:bg-[#343B35] text-[#F1F0E8] border border-[#39433B] transition-colors"
            >
              <FileText className="w-4 h-4 text-[#54D6BE]" />
              <span>Generate Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Contextual Help */}
      <ContextualHelp
        title="Stage 5: How the 10-Point Verification Matrix works"
        summary="A security verification platform cannot rely on an LLM to claim that code is safe. VerifiedFix executes 10 concrete tests against the modified application to calculate the verdict."
        details={[
          'Security Tests (5): Checks that Bob is rejected with HTTP 403 when requesting Alice\'s private document, unshared documents, deleting, or sharing.',
          'Regression Tests (5): Validates that Alice can still view her own documents, Carol can view shared documents, Admin retains audit access, and document creation works.',
          'Authoritative Verdict: If even one test fails or is skipped, the platform issues "Verification Failed" or "Verification Incomplete".',
          'Only when all 10 tests empirically pass does the system declare "Fix Verified".',
        ]}
        tourStageIndex={4}
      />

      {loading ? (
        <div className="p-12 text-center text-xs text-[#A6B0A7]">Loading test telemetry...</div>
      ) : !verification ? (
        <div
          data-tour="verification-matrix"
          className="rounded-2xl border border-[#39433B] bg-[#202521] p-12 text-center space-y-3"
        >
          <Clock className="w-12 h-12 text-[#B8F36B] mx-auto" />
          <h3 className="text-base font-bold text-[#F1F0E8]">Verification Suite Not Yet Executed</h3>
          <p className="text-xs text-[#A6B0A7] max-w-md mx-auto">
            Click &quot;Execute Verification Suite&quot; to run the empirical test matrix against DocVault.
          </p>
          <button
            onClick={handleRunVerification}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#B8F36B] text-[#171A18] hover:bg-[#a6e058] transition-colors shadow-lg"
          >
            Run 10-Point Verification
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Verdict Banner Card */}
          <div
            className={`rounded-2xl border p-6 sm:p-8 shadow-xl transition-all ${
              verification.status === 'Fix Verified' || verification.status === 'Verified'
                ? 'bg-[#54D6BE]/10 border-[#54D6BE]/60'
                : 'bg-[#F28B69]/10 border-[#F28B69]/60'
            }`}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  {verification.status === 'Fix Verified' || verification.status === 'Verified' ? (
                    <div className="p-2.5 rounded-xl bg-[#54D6BE]/20 text-[#54D6BE] border border-[#54D6BE]/40">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-[#F28B69]/20 text-[#F28B69] border border-[#F28B69]/40">
                      <ShieldAlert className="w-8 h-8" />
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#A6B0A7]">
                      Authoritative Verification Verdict
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-[#F1F0E8] tracking-tight">
                      {verification.status === 'Fix Verified' || verification.status === 'Verified'
                        ? 'FIX VERIFIED: 10/10 TESTS PASSED'
                        : 'VERIFICATION FAILED'}
                    </h2>
                  </div>
                </div>

                <p className="text-xs text-[#A6B0A7] max-w-2xl leading-relaxed">
                  {verification.status === 'Fix Verified' || verification.status === 'Verified'
                    ? 'Every required security and regression test completed with 100% empirical success. Bob is confirmed blocked from private documents, Carol retains explicit shared access, and normal workflows function cleanly.'
                    : 'One or more security or regression checks failed. The fix cannot be certified until all 10 tests pass.'}
                </p>
              </div>

              {/* Stats badges */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-[#202521] border border-[#39433B]">
                  <span className="text-[10px] text-[#A6B0A7] uppercase font-bold">Total Tests</span>
                  <div className="text-xl font-black text-[#F1F0E8]">{verification.total_tests}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#202521] border border-[#39433B]">
                  <span className="text-[10px] text-[#54D6BE] uppercase font-bold">Passed</span>
                  <div className="text-xl font-black text-[#54D6BE]">{verification.passed_tests}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#202521] border border-[#39433B]">
                  <span className="text-[10px] text-[#A6B0A7] uppercase font-bold">Duration</span>
                  <div className="text-xl font-black text-[#B8F36B]">{verification.duration_ms}ms</div>
                </div>
              </div>
            </div>
          </div>

          {/* Test Matrix Table Card */}
          <div
            data-tour="verification-matrix"
            className="rounded-2xl border border-[#39433B] bg-[#202521] overflow-hidden shadow-xl"
          >
            <div className="px-6 py-4 bg-[#282E29] border-b border-[#39433B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-[#F1F0E8] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#54D6BE]" />
                10-Point Deterministic Verification Matrix
              </h3>

              {/* Filters */}
              <div className="flex items-center gap-1.5 bg-[#202521] p-1 rounded-lg border border-[#39433B] text-xs">
                <button
                  onClick={() => setFilterCategory('all')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    filterCategory === 'all' ? 'bg-[#282E29] text-[#F1F0E8]' : 'text-[#A6B0A7] hover:text-[#F1F0E8]'
                  }`}
                >
                  All ({verification.test_results.length})
                </button>
                <button
                  onClick={() => setFilterCategory('security')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    filterCategory === 'security' ? 'bg-[#282E29] text-[#F1F0E8]' : 'text-[#A6B0A7] hover:text-[#F1F0E8]'
                  }`}
                >
                  Security (5)
                </button>
                <button
                  onClick={() => setFilterCategory('regression')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    filterCategory === 'regression' ? 'bg-[#282E29] text-[#F1F0E8]' : 'text-[#A6B0A7] hover:text-[#F1F0E8]'
                  }`}
                >
                  Regression (5)
                </button>
              </div>
            </div>

            {/* Test Matrix List */}
            <div className="divide-y divide-[#39433B]">
              {filteredTests.map((t) => (
                <div key={t.id} className="p-5 hover:bg-[#282E29]/40 transition-colors space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-[#A6B0A7]/60 w-6">#{t.test_number}</span>
                      <h4 className="text-xs font-bold text-[#F1F0E8] tracking-wide">{t.test_name}</h4>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          t.category === 'security'
                            ? 'bg-[#F28B69]/15 text-[#F28B69] border border-[#F28B69]/30'
                            : 'bg-[#54D6BE]/15 text-[#54D6BE] border border-[#54D6BE]/30'
                        }`}
                      >
                        {t.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-[#A6B0A7]">{t.duration_ms}ms</span>
                      <span
                        className={`flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full ${
                          t.status === 'passed'
                            ? 'bg-[#54D6BE]/15 text-[#54D6BE] border border-[#54D6BE]/30'
                            : 'bg-[#F28B69]/15 text-[#F28B69] border border-[#F28B69]/30'
                        }`}
                      >
                        {t.status === 'passed' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            PASSED
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            FAILED
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-[#171A18]/60 p-3 rounded-xl border border-[#39433B]">
                    <div>
                      <span className="text-[10px] text-[#A6B0A7] uppercase font-bold">Identity Tested</span>
                      <div className="font-medium text-[#F1F0E8]">{t.identity_tested}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#A6B0A7] uppercase font-bold">Expected Outcome</span>
                      <div className="font-medium text-[#A6B0A7]">{t.expected_result}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#A6B0A7] uppercase font-bold">Empirical Observation</span>
                      <div
                        className={`font-semibold ${
                          t.status === 'passed' ? 'text-[#54D6BE]' : 'text-[#F28B69]'
                        }`}
                      >
                        {t.actual_result}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
