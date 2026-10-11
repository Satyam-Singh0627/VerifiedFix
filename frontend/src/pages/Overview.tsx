import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Radar,
  Bug,
  GitPullRequest,
  CheckCircle2,
  FileText,
  ArrowRight,
  ExternalLink,
  Lock,
  Unlock,
  AlertTriangle,
  Play,
  Terminal,
  Activity,
  Compass,
  Sparkles,
  Layers,
  Clock,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { OverviewStats, AuditEvent, Scan } from '../types';
import { useTour } from '../context/TourContext';
import { useToast } from '../context/ToastContext';
import { ContextualHelp } from '../components/ContextualHelp';

interface OverviewProps {
  onRefreshStats: () => void;
}

export const Overview: React.FC<OverviewProps> = ({ onRefreshStats }) => {
  const navigate = useNavigate();
  const { startTour } = useTour();
  const { addToast } = useToast();

  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [recentAudits, setRecentAudits] = useState<AuditEvent[]>([]);
  const [recentScans, setRecentScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, auditsData, scansData] = await Promise.all([
        api.getStats(),
        api.getAuditEvents(6),
        api.getScans(),
      ]);
      setStats(statsData);
      setRecentAudits(auditsData);
      setRecentScans(scansData.slice(0, 4));
    } catch (err) {
      console.error('Failed to load overview data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickScan = async () => {
    try {
      setScanning(true);
      const scan = await api.startScan();
      await loadData();
      onRefreshStats();
      addToast('success', 'Security Scan Completed', `Found ${scan.failed_checks} access control vulnerability.`);
      navigate('/scans');
    } catch (err) {
      addToast('error', 'Scan Failed', (err as Error).message);
    } finally {
      setScanning(false);
    }
  };

  const getStatusDisplay = () => {
    const rawStatus = stats?.current_security_state?.overall_status || 'Not Scanned';
    switch (rawStatus) {
      case 'Fix Verified':
      case 'Verified':
        return {
          title: 'Target Secured & Authoritatively Verified',
          desc: 'Centralized document ownership policy is actively enforced. All 10 security and regression tests have executed with zero failures.',
          badge: 'FIX VERIFIED',
          color: 'border-[#54D6BE]/80 bg-[#54D6BE]/10 text-[#54D6BE]',
          icon: ShieldCheck,
          nextAction: 'Export Audit Report',
          nextRoute: '/reports',
        };
      case 'Vulnerability Detected':
      case 'Vulnerable':
        return {
          title: 'Active IDOR Vulnerability Confirmed',
          desc: 'Bob (unauthorized contractor) can access Alice\'s private document (#12) because document retrieval fails to verify ownership or explicit sharing.',
          badge: 'VULNERABILITY DETECTED',
          color: 'border-[#F28B69]/80 bg-[#F28B69]/10 text-[#F28B69]',
          icon: Unlock,
          nextAction: 'Review Finding & Evidence',
          nextRoute: '/findings',
        };
      case 'Patch Pending Approval':
      case 'Patch Proposed':
        return {
          title: 'Remediation Patch Awaiting Human Approval',
          desc: 'A minimal authorization fix has been proposed. Review the diff and authorize patch application.',
          badge: 'PATCH PENDING APPROVAL',
          color: 'border-[#E9BC65]/80 bg-[#E9BC65]/10 text-[#E9BC65]',
          icon: GitPullRequest,
          nextAction: 'Review Proposed Patch',
          nextRoute: '/patches',
        };
      case 'Patch Applied — Verification Pending':
      case 'Patch Applied':
        return {
          title: 'Patch Applied — Empirical Verification Required',
          desc: 'The fix has been applied to the demo sandbox. Run the 10-point test suite to authoritatively verify that the exploit is blocked.',
          badge: 'VERIFICATION PENDING',
          color: 'border-[#B8F36B]/80 bg-[#B8F36B]/10 text-[#B8F36B]',
          icon: Activity,
          nextAction: 'Run Verification Matrix',
          nextRoute: '/verification',
        };
      case 'Verification Failed':
        return {
          title: 'Verification Failed',
          desc: 'One or more required security or regression checks failed. The fix cannot be certified as verified.',
          badge: 'VERIFICATION FAILED',
          color: 'border-[#F28B69]/80 bg-[#F28B69]/10 text-[#F28B69]',
          icon: ShieldAlert,
          nextAction: 'Inspect Failed Checks',
          nextRoute: '/verification',
        };
      default:
        return {
          title: 'Ready for Security Verification',
          desc: 'Target application is running in baseline state. Start the guided tour or run a scan to detect tenant boundaries.',
          badge: 'NOT SCANNED',
          color: 'border-[#39433B] bg-[#202521] text-[#A6B0A7]',
          icon: Lock,
          nextAction: 'Start Guided Tour',
          nextRoute: '/scans',
        };
    }
  };

  const statusInfo = getStatusDisplay();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-8 pb-12 text-[#F1F0E8]">
      {/* Contextual Help for Overview */}
      <ContextualHelp
        title="Welcome to VerifiedFix — How to use this platform"
        summary="VerifiedFix is an AI-assisted application security tool that follows the 6-stage lifecycle: Detect → Prove → Explain → Patch → Verify → Report. It inspects DocVault, an enterprise document repository, proves an IDOR vulnerability, applies a scoped patch with human approval, and verifies the result using 10 deterministic tests."
        details={[
          'The status banner below reflects the true state of the backend database, never hardcoded claims.',
          'Start with the Guided Tour for a step-by-step interactive walkthrough that highlights real buttons.',
          'Open the DocVault Demo anytime to test multi-tenant access as Alice, Bob, Carol, or Admin directly.',
          'Reset Demo at any point in the top bar to return the database to the baseline vulnerable state.',
        ]}
        tourStageIndex={0}
      />

      {/* Hero Status Banner */}
      <div className={`rounded-2xl border p-6 sm:p-8 shadow-xl relative overflow-hidden ${statusInfo.color}`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-[#202521] border border-[#39433B]">
                <StatusIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#A6B0A7]">
                  Authoritative Target State • DocVault Sandbox
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-[#F1F0E8] tracking-tight">
                  {statusInfo.title}
                </h1>
              </div>
            </div>

            <p className="text-xs text-[#A6B0A7] max-w-2xl leading-relaxed">
              {statusInfo.desc}
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => startTour(0)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#B8F36B] hover:bg-[#a6e058] text-[#171A18] transition-all shadow-lg shadow-[#B8F36B]/20"
            >
              <Compass className="w-4 h-4" />
              <span>Start Guided Demo</span>
            </button>

            <button
              onClick={handleQuickScan}
              disabled={scanning}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#282E29] hover:bg-[#343B35] text-[#F1F0E8] border border-[#39433B] transition-colors disabled:opacity-50"
            >
              {scanning ? (
                <span className="animate-spin w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Radar className="w-3.5 h-3.5 text-[#54D6BE]" />
              )}
              <span>Run Security Scan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#202521] border border-[#39433B] space-y-1">
          <div className="flex items-center justify-between text-[#A6B0A7]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Scans Run</span>
            <Radar className="w-4 h-4 text-[#54D6BE]" />
          </div>
          <div className="text-2xl font-black text-[#F1F0E8]">{stats?.total_scans ?? 0}</div>
          <p className="text-[11px] text-[#A6B0A7]">Executed against DocVault API</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#202521] border border-[#39433B] space-y-1">
          <div className="flex items-center justify-between text-[#A6B0A7]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Confirmed Flaws</span>
            <Bug className="w-4 h-4 text-[#F28B69]" />
          </div>
          <div className="text-2xl font-black text-[#F28B69]">
            {stats?.confirmed_vulnerabilities ?? 0}
          </div>
          <p className="text-[11px] text-[#A6B0A7]">CWE-639 Broken Access Control</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#202521] border border-[#39433B] space-y-1">
          <div className="flex items-center justify-between text-[#A6B0A7]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Patches Awaiting</span>
            <GitPullRequest className="w-4 h-4 text-[#E9BC65]" />
          </div>
          <div className="text-2xl font-black text-[#E9BC65]">
            {stats?.patches_awaiting_approval ?? 0}
          </div>
          <p className="text-[11px] text-[#A6B0A7]">Requires human reviewer sign-off</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#202521] border border-[#39433B] space-y-1">
          <div className="flex items-center justify-between text-[#A6B0A7]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Verified Fixes</span>
            <CheckCircle2 className="w-4 h-4 text-[#54D6BE]" />
          </div>
          <div className="text-2xl font-black text-[#54D6BE]">
            {stats?.verified_fixes ?? 0}
          </div>
          <p className="text-[11px] text-[#A6B0A7]">Proven by 10-point test matrix</p>
        </div>
      </div>

      {/* 6-Stage Core Workflow Progress Grid */}
      <div className="rounded-2xl border border-[#39433B] bg-[#202521] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#B8F36B]" />
            <h2 className="text-sm font-bold text-[#F1F0E8]">The VerifiedFix 6-Stage Security Lifecycle</h2>
          </div>
          <span className="text-[10px] uppercase font-bold text-[#A6B0A7] bg-[#282E29] px-2.5 py-1 rounded-md border border-[#39433B]">
            Interactive Stages
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              stage: 1,
              title: 'DETECT',
              desc: 'Inspects endpoints across 7 tenant vectors',
              link: '/scans',
              accent: 'border-[#54D6BE]/40 hover:border-[#54D6BE]',
            },
            {
              stage: 2,
              title: 'PROVE',
              desc: 'Safely reproduces Bob reading Doc #12',
              link: '/findings',
              accent: 'border-[#F28B69]/40 hover:border-[#F28B69]',
            },
            {
              stage: 3,
              title: 'EXPLAIN',
              desc: 'Root cause analysis with exact code lines',
              link: '/findings',
              accent: 'border-[#54D6BE]/40 hover:border-[#54D6BE]',
            },
            {
              stage: 4,
              title: 'PATCH',
              desc: 'Minimal scoped diff with human approval',
              link: '/patches',
              accent: 'border-[#E9BC65]/40 hover:border-[#E9BC65]',
            },
            {
              stage: 5,
              title: 'VERIFY',
              desc: '10-point empirical test matrix execution',
              link: '/verification',
              accent: 'border-[#B8F36B]/40 hover:border-[#B8F36B]',
            },
            {
              stage: 6,
              title: 'REPORT',
              desc: 'Audit dossier with SHA-256 integrity seal',
              link: '/reports',
              accent: 'border-[#A6B0A7]/40 hover:border-[#F1F0E8]',
            },
          ].map((item) => (
            <div
              key={item.stage}
              onClick={() => navigate(item.link)}
              className={`p-4 rounded-xl bg-[#282E29]/70 border cursor-pointer transition-all hover:-translate-y-0.5 space-y-1.5 ${item.accent}`}
            >
              <div className="flex items-center justify-between text-[10px] font-bold text-[#A6B0A7]">
                <span>STAGE {item.stage}</span>
                <ArrowRight className="w-3 h-3 text-[#A6B0A7]" />
              </div>
              <h3 className="text-xs font-black tracking-wide text-[#F1F0E8]">{item.title}</h3>
              <p className="text-[11px] text-[#A6B0A7] leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Two Columns: Recent Scans & Security Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Scans */}
        <div className="rounded-2xl border border-[#39433B] bg-[#202521] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F1F0E8] flex items-center gap-2">
              <Radar className="w-4 h-4 text-[#54D6BE]" />
              Recent Security Scans
            </h3>
            <button
              onClick={() => navigate('/scans')}
              className="text-xs text-[#B8F36B] hover:underline font-semibold"
            >
              View all
            </button>
          </div>

          <div className="space-y-2.5">
            {recentScans.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#A6B0A7]">
                No scans executed yet. Click &quot;Run Security Scan&quot; above to start.
              </div>
            ) : (
              recentScans.map((s) => (
                <div
                  key={s.id}
                  onClick={() => navigate('/scans')}
                  className="p-3.5 rounded-xl bg-[#282E29] border border-[#39433B] hover:border-[#54D6BE] cursor-pointer flex items-center justify-between transition-colors text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#F1F0E8]">{s.scan_id}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#202521] text-[#A6B0A7]">
                        {s.target_name}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#A6B0A7]">
                      Checks: <span className="text-[#54D6BE]">{s.passed_checks} passed</span> /{' '}
                      <span className={s.failed_checks > 0 ? 'text-[#F28B69]' : 'text-[#A6B0A7]'}>
                        {s.failed_checks} failed
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      s.failed_checks > 0
                        ? 'bg-[#F28B69]/15 text-[#F28B69] border border-[#F28B69]/30'
                        : 'bg-[#54D6BE]/15 text-[#54D6BE] border border-[#54D6BE]/30'
                    }`}
                  >
                    {s.failed_checks > 0 ? 'Vulnerable' : 'Secure'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Audit Trail */}
        <div className="rounded-2xl border border-[#39433B] bg-[#202521] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F1F0E8] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#B8F36B]" />
              Recent Security Audit Trail
            </h3>
            <button
              onClick={() => navigate('/audit')}
              className="text-xs text-[#B8F36B] hover:underline font-semibold"
            >
              Full log
            </button>
          </div>

          <div className="space-y-2">
            {recentAudits.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#A6B0A7]">
                No audit events recorded yet.
              </div>
            ) : (
              recentAudits.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-xl bg-[#282E29] border border-[#39433B] text-xs flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-[#54D6BE] font-bold px-1.5 py-0.5 rounded bg-[#202521] border border-[#39433B]">
                        {a.event_type}
                      </span>
                      <span className="text-[#F1F0E8] text-[11px]">{a.description}</span>
                    </div>
                    <div className="text-[10px] text-[#A6B0A7]">Actor: {a.actor}</div>
                  </div>
                  <span className="text-[10px] font-mono text-[#A6B0A7]">
                    {new Date(a.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
