import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radar,
  Play,
  CheckCircle2,
  AlertTriangle,
  Bug,
  ArrowRight,
  ShieldAlert,
  Server,
  Layers,
  Clock,
  Sparkles
} from 'lucide-react';
import { api, getTargetUrl } from '../services/api';
import { Scan } from '../types';
import { useToast } from '../context/ToastContext';
import { ContextualHelp } from '../components/ContextualHelp';

export const Scans: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');

  useEffect(() => {
    loadScans();
  }, []);

  const loadScans = async () => {
    try {
      setLoading(true);
      const data = await api.getScans();
      setScans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartScan = async () => {
    try {
      setScanning(true);
      setScanStep('Testing Alice owner permissions on Doc #12...');
      await new Promise((r) => setTimeout(r, 350));
      setScanStep('Running controlled IDOR exploit reproduction as Bob...');
      await new Promise((r) => setTimeout(r, 450));
      setScanStep('Checking Carol shared boundaries & Admin override...');
      await new Promise((r) => setTimeout(r, 350));
      setScanStep('Compiling empirical telemetry and registering findings...');

      const newScan = await api.startScan();
      await loadScans();
      setScanStep('');
      addToast(
        newScan.failed_checks > 0 ? 'warning' : 'success',
        'Security Scan Complete',
        `Evaluated 7 access control checks. ${newScan.failed_checks} issues found.`
      );
    } catch (err) {
      addToast('error', 'Scan Execution Failed', (err as Error).message);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 text-[#F1F0E8]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#F1F0E8] flex items-center gap-2.5">
            <Radar className="w-6 h-6 text-[#54D6BE]" />
            Stage 1 — Security Scans & Boundary Inspector
          </h1>
          <p className="text-xs text-[#A6B0A7] mt-1">
            Active multi-tenant authorization testing against the DocVault target application
          </p>
        </div>

        <button
          onClick={handleStartScan}
          disabled={scanning}
          data-tour="scan-controls"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#B8F36B] text-[#171A18] hover:bg-[#a6e058] transition-all shadow-lg shadow-[#B8F36B]/20 disabled:opacity-50"
        >
          {scanning ? (
            <span className="animate-spin w-4 h-4 border-2 border-[#171A18] border-t-transparent rounded-full" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span>{scanning ? 'Scanning Target...' : 'Initiate Security Scan'}</span>
        </button>
      </div>

      {/* Contextual Help */}
      <ContextualHelp
        title="Stage 1: How the Security Scanner works"
        summary="VerifiedFix does not scan arbitrary websites. It inspects the local DocVault demo target by submitting controlled HTTP requests under different identities (Alice, Bob, Carol, Admin, and unauthenticated)."
        details={[
          'It checks whether Bob can retrieve Alice\'s private document (#12) by changing the ID in the request.',
          'In the vulnerable baseline, the server returns HTTP 200 with Alice\'s document content, confirming the IDOR flaw.',
          'After the patch is applied, the same scan confirms that Bob is rejected with HTTP 403 Forbidden.',
          'All scan checks test real HTTP responses from the backend, never simulated static data.',
        ]}
        tourStageIndex={0}
      />

      {/* Target Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#202521] border border-[#39433B] flex items-center gap-3">
          <Server className="w-8 h-8 text-[#54D6BE] p-1.5 rounded-lg bg-[#282E29]" />
          <div>
            <div className="text-[10px] text-[#A6B0A7] uppercase font-bold">Target Application</div>
            <div className="text-xs font-bold text-[#F1F0E8]">DocVault Enterprise Portal</div>
            <div className="text-[10px] text-[#54D6BE] font-mono">{getTargetUrl()} (Isolated Sandbox)</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#202521] border border-[#39433B] flex items-center gap-3">
          <Layers className="w-8 h-8 text-[#B8F36B] p-1.5 rounded-lg bg-[#282E29]" />
          <div>
            <div className="text-[10px] text-[#A6B0A7] uppercase font-bold">Scope of Checks</div>
            <div className="text-xs font-bold text-[#F1F0E8]">7 Authorization Vectors</div>
            <div className="text-[10px] text-[#A6B0A7]">Owner, Attacker, Recipient, Admin, Auth</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#202521] border border-[#39433B] flex items-center gap-3">
          <Clock className="w-8 h-8 text-[#E9BC65] p-1.5 rounded-lg bg-[#282E29]" />
          <div>
            <div className="text-[10px] text-[#A6B0A7] uppercase font-bold">Detection Principle</div>
            <div className="text-xs font-bold text-[#F1F0E8]">Empirical Verification</div>
            <div className="text-[10px] text-[#A6B0A7]">Real HTTP response status & body checks</div>
          </div>
        </div>
      </div>

      {/* Live Scanning Progress */}
      {scanning && (
        <div className="p-5 rounded-xl bg-[#282E29] border border-[#B8F36B]/60 space-y-3 animate-pulse">
          <div className="flex items-center justify-between text-xs font-medium text-[#F1F0E8]">
            <span>Executing Security Scan against DocVault target...</span>
            <span className="font-mono text-[#B8F36B]">{scanStep}</span>
          </div>
          <div className="w-full bg-[#171A18] h-2 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#B8F36B] to-[#54D6BE] animate-pulse rounded-full w-3/4" />
          </div>
        </div>
      )}

      {/* Scans List Card */}
      <div className="rounded-2xl border border-[#39433B] bg-[#202521] overflow-hidden shadow-xl">
        <div className="px-6 py-4 bg-[#282E29] border-b border-[#39433B] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#F1F0E8]">Scan History & Empirical Findings</h2>
          <span className="text-xs text-[#A6B0A7]">Total Scans: {scans.length}</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#A6B0A7]">Loading scan history...</div>
        ) : scans.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Radar className="w-10 h-10 text-[#A6B0A7]/40 mx-auto" />
            <p className="text-xs text-[#A6B0A7]">No security scans on record.</p>
            <button
              onClick={handleStartScan}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#B8F36B] text-[#171A18] hover:bg-[#a6e058] transition-colors"
            >
              Start First Scan
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#39433B]">
            {scans.map((s) => (
              <div key={s.id} className="p-6 space-y-4 hover:bg-[#282E29]/40 transition-colors">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-sm font-bold text-[#F1F0E8]">{s.scan_id}</span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          s.failed_checks > 0
                            ? 'bg-[#F28B69]/15 text-[#F28B69] border border-[#F28B69]/30'
                            : 'bg-[#54D6BE]/15 text-[#54D6BE] border border-[#54D6BE]/30'
                        }`}
                      >
                        {s.failed_checks > 0 ? 'VULNERABILITY DETECTED' : 'ALL CHECKS SECURE'}
                      </span>
                    </div>
                    <div className="text-xs text-[#A6B0A7]">
                      Started: {new Date(s.started_at).toLocaleString()} • Target: {s.target_name}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {s.findings && s.findings.length > 0 && (
                      <button
                        onClick={() => navigate('/findings')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F28B69]/15 text-[#F28B69] border border-[#F28B69]/30 hover:bg-[#F28B69]/25 transition-all"
                      >
                        <Bug className="w-3.5 h-3.5" />
                        <span>View Finding ({s.findings.length})</span>
                      </button>
                    )}
                    <button
                      onClick={() => navigate('/patches')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#282E29] text-[#F1F0E8] hover:bg-[#343B35] transition-all border border-[#39433B]"
                    >
                      <span>Review Patch</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#171A18]/60 p-3 rounded-xl border border-[#39433B]">
                  <div>
                    <span className="text-[#A6B0A7] text-[10px] uppercase font-bold">Total Checks</span>
                    <div className="font-bold text-[#F1F0E8]">{s.total_checks}</div>
                  </div>
                  <div>
                    <span className="text-[#A6B0A7] text-[10px] uppercase font-bold">Passed Checks</span>
                    <div className="font-bold text-[#54D6BE]">{s.passed_checks}</div>
                  </div>
                  <div>
                    <span className="text-[#A6B0A7] text-[10px] uppercase font-bold">Failed Checks</span>
                    <div className="font-bold text-[#F28B69]">{s.failed_checks}</div>
                  </div>
                  <div>
                    <span className="text-[#A6B0A7] text-[10px] uppercase font-bold">Scan Verdict</span>
                    <div className="font-bold text-[#B8F36B]">{s.status}</div>
                  </div>
                </div>

                <p className="text-xs text-[#A6B0A7] leading-relaxed">{s.summary}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
