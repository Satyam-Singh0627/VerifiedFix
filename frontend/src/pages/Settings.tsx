import React from 'react';
import {
  Sliders,
  RotateCcw,
  Server,
  Shield,
  Cpu,
  Key,
  Compass,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useTour } from '../context/TourContext';
import { useToast } from '../context/ToastContext';
import { ContextualHelp } from '../components/ContextualHelp';

interface SettingsProps {
  onResetClick: () => void;
  aiProvider: string;
}

export const Settings: React.FC<SettingsProps> = ({ onResetClick, aiProvider }) => {
  const { startTour, resetTourProgress } = useTour();
  const { addToast } = useToast();

  const handleRestartTour = () => {
    resetTourProgress();
    startTour(0);
    addToast('Interactive 6-Stage Guided Demo restarted at Stage 1', 'info');
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Contextual Help */}
      <ContextualHelp
        title="Settings, Demo Controls & Model Architecture"
        defaultExpanded={false}
        items={[
          {
            label: 'Interactive Guided Tour Reset',
            description: 'Restart the 6-stage walkthrough (Detect → Prove → Explain → Patch → Verify → Report) anytime to demonstrate the platform to evaluators or team members.'
          },
          {
            label: 'Demo Reset Sandbox',
            description: 'Restores the DocVault SQLite database and security state to the vulnerable baseline (Document #12 owned by Alice, zero authorization enforcement on GET /documents/{id}).'
          },
          {
            label: 'AI Service & Offline Reliability',
            description: 'Runs in 100% offline-ready deterministic mode without requiring external cloud API keys, while retaining pluggable support for OpenAI, Anthropic, or Gemini.'
          }
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#F1F0E8] flex items-center gap-2.5">
          <Sliders className="w-6 h-6 text-[#B8F36B]" />
          Platform Settings & Demonstration Environment
        </h1>
        <p className="text-xs text-[#A6B0A7] mt-1">
          Guided tour orchestration, sandbox replay controls, and deterministic engine configurations
        </p>
      </div>

      {/* Guided Tour Reset Card */}
      <div className="rounded-2xl border border-[#B8F36B]/30 bg-[#202521] p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-[#B8F36B]">
            <Compass className="w-5 h-5" />
            <h2 className="text-sm font-bold text-[#F1F0E8]">Interactive Guided Walkthrough</h2>
          </div>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#B8F36B]/15 text-[#B8F36B] border border-[#B8F36B]/30">
            6-Stage Onboarding
          </span>
        </div>

        <p className="text-xs text-[#A6B0A7] leading-relaxed">
          The interactive guided demo leads evaluators through the complete end-to-end security cycle:
          detecting the IDOR vulnerability, proving the exploit with real HTTP response evidence, inspecting the root cause,
          evaluating the minimal diff in patch review, executing all 10 deterministic verification tests, and generating the SHA-256 digested report.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRestartTour}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#B8F36B] hover:bg-[#B8F36B]/90 text-[#171A18] transition-all shadow-lg shadow-[#B8F36B]/15"
          >
            <Compass className="w-4 h-4" />
            <span>Restart Interactive Guided Demo</span>
          </button>
        </div>
      </div>

      {/* Demo Reset Card */}
      <div className="rounded-2xl border border-[#F28B69]/30 bg-[#202521] p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-[#F28B69]">
            <RotateCcw className="w-5 h-5" />
            <h2 className="text-sm font-bold text-[#F1F0E8]">Reset Demonstration Environment</h2>
          </div>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#F28B69]/15 text-[#F28B69] border border-[#F28B69]/30">
            Live Replay
          </span>
        </div>

        <p className="text-xs text-[#A6B0A7] leading-relaxed">
          Restore the initial vulnerable state and seeded database anytime during presentations. This re-initializes
          Document #12 as private, restores DocVault to vulnerable unpatched mode, clears previous verification runs,
          and resets the audit trail so you can repeat the live hackathon demo from scratch.
        </p>

        <button
          onClick={onResetClick}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#F28B69] hover:bg-[#F28B69]/90 text-[#171A18] transition-all shadow-lg shadow-[#F28B69]/20"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Demo to Vulnerable Baseline</span>
        </button>
      </div>

      {/* AI Service & Deterministic Mode Card */}
      <div className="rounded-2xl border border-[#39433B] bg-[#202521] p-6 space-y-4">
        <div className="flex items-center gap-2.5 text-[#54D6BE]">
          <Cpu className="w-5 h-5" />
          <h2 className="text-sm font-bold text-[#F1F0E8]">AI Service & Fallback Architecture</h2>
        </div>

        <div className="p-4 rounded-xl bg-[#171A18] border border-[#39433B] text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#A6B0A7]">Active Engine Provider:</span>
            <span className="text-[#54D6BE] font-bold font-mono">{aiProvider || 'Local Deterministic Mode (Offline Ready)'}</span>
          </div>
          <p className="text-[#A6B0A7] text-[11px] leading-relaxed">
            VerifiedFix is architected to be 100% provider-independent and fully offline-ready. When external LLM API keys
            are not provided, it generates patches and explains root causes via hardened deterministic rule engines.
            Crucially, verification never relies on AI self-reporting — all 10 security test assertions are executed natively against the live FastAPI sandbox.
          </p>
        </div>
      </div>

      {/* Seeded Credentials Reference */}
      <div className="rounded-2xl border border-[#39433B] bg-[#202521] p-6 space-y-4">
        <div className="flex items-center gap-2.5 text-[#B8F36B]">
          <Key className="w-5 h-5" />
          <h2 className="text-sm font-bold text-[#F1F0E8]">Seeded Demonstration Identities</h2>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#39433B]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#171A18] text-[#A6B0A7] text-[10px] uppercase">
              <tr>
                <th className="p-3">Username</th>
                <th className="p-3">Password</th>
                <th className="p-3">Role</th>
                <th className="p-3 font-sans">Purpose in Demonstration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#39433B] text-[#A6B0A7]">
              <tr>
                <td className="p-3 text-[#F1F0E8] font-bold">alice</td>
                <td className="p-3">Password123!</td>
                <td className="p-3 text-[#54D6BE]">Owner</td>
                <td className="p-3 font-sans text-[#A6B0A7]">Document Owner (Owns confidential Document #12)</td>
              </tr>
              <tr>
                <td className="p-3 text-[#F28B69] font-bold">bob</td>
                <td className="p-3">Password123!</td>
                <td className="p-3 text-[#F28B69]">Contractor</td>
                <td className="p-3 font-sans text-[#A6B0A7]">Attacker (Attempts unauthorized direct object access to #12)</td>
              </tr>
              <tr>
                <td className="p-3 text-[#54D6BE] font-bold">carol</td>
                <td className="p-3">Password123!</td>
                <td className="p-3 text-[#54D6BE]">Collaborator</td>
                <td className="p-3 font-sans text-[#A6B0A7]">Authorized Recipient (Has explicit share on Document #14)</td>
              </tr>
              <tr>
                <td className="p-3 text-[#B8F36B] font-bold">admin</td>
                <td className="p-3">Password123!</td>
                <td className="p-3 text-[#B8F36B]">Admin</td>
                <td className="p-3 font-sans text-[#A6B0A7]">Security Administrator (Authorized system-wide audit access)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
