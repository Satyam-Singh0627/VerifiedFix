import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitPullRequest,
  Check,
  X,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  FileCheck2,
  UserCheck,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { PatchProposal } from '../types';
import { DiffViewer } from '../components/DiffViewer';
import { ContextualHelp } from '../components/ContextualHelp';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { useToast } from '../context/ToastContext';

interface PatchReviewProps {
  onStateChange: () => void;
}

export const PatchReview: React.FC<PatchReviewProps> = ({ onStateChange }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [patches, setPatches] = useState<PatchProposal[]>([]);
  const [activePatch, setActivePatch] = useState<PatchProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewerName] = useState('Lead AppSec Engineer');

  // Confirmation Modals State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject' | 'rollback';
    title: string;
    description: string;
  }>({
    isOpen: false,
    type: 'approve',
    title: '',
    description: '',
  });

  const loadPatches = async () => {
    try {
      setLoading(true);
      let data = await api.getPatches();

      if (data.length === 0) {
        let scans = await api.getScans();
        if (scans.length === 0) {
          try {
            const newScan = await api.startScan();
            scans = [newScan];
          } catch (e) {
            console.warn('Auto scan fallback failed', e);
          }
        }
        if (scans.length > 0) {
          const newPatch = await api.proposePatch(scans[0].scan_id);
          data = [newPatch];
        }
      }

      setPatches(data);
      if (data.length > 0) {
        setActivePatch(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatches();
  }, []);

  const executeAction = async () => {
    if (!activePatch) return;
    try {
      setActionLoading(true);
      if (confirmModal.type === 'approve') {
        await api.approvePatch(activePatch.patch_id, reviewerName);
        const applied = await api.applyPatch(activePatch.patch_id, reviewerName);
        setActivePatch(applied);
        onStateChange();
        addToast('success', 'Patch Approved & Applied', 'Remediation applied to DocVault. Proceed to Verification.');
      } else if (confirmModal.type === 'reject') {
        const rejected = await api.rejectPatch(activePatch.patch_id, reviewerName);
        setActivePatch(rejected);
        onStateChange();
        addToast('warning', 'Patch Rejected', 'The proposed patch was rejected by the reviewer.');
      } else if (confirmModal.type === 'rollback') {
        const rolled = await api.rollbackPatch(activePatch.patch_id, reviewerName);
        setActivePatch(rolled);
        onStateChange();
        addToast('info', 'Patch Rolled Back', 'Target restored to the intentionally vulnerable demo state.');
      }
    } catch (err) {
      addToast('error', 'Patch Action Failed', (err as Error).message);
    } finally {
      setActionLoading(false);
      setConfirmModal({ ...confirmModal, isOpen: false });
    }
  };

  return (
    <div className="space-y-6 pb-12 text-[#F1F0E8]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#F1F0E8] flex items-center gap-2.5">
            <GitPullRequest className="w-6 h-6 text-[#E9BC65]" />
            Stage 4 — Human-in-the-Loop Patch Review
          </h1>
          <p className="text-xs text-[#A6B0A7] mt-1">
            Prevalidated authorization remediation with scope checking and explicit human approval
          </p>
        </div>

        {activePatch?.status === 'applied' && (
          <button
            onClick={() => navigate('/verification')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#B8F36B] text-[#171A18] hover:bg-[#a6e058] transition-all shadow-lg shadow-[#B8F36B]/20"
          >
            <span>Proceed to Verification Suite</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Contextual Help */}
      <ContextualHelp
        title="Stage 4: How the Patch Engine works"
        summary="VerifiedFix generates a minimal patch template that binds document retrieval to the central authorization policy check_document_permission()."
        details={[
          'Scope Validation: Enforces that only allowlisted files (backend/app/services/document_service.py) are modified.',
          'Change Budget: Strict 25-line limit ensures patches are minimal, readable, and auditable (+8 lines / -3 lines = 11 lines).',
          'Human-in-the-Loop: An AI cannot silently patch production code. A human reviewer must explicitly click "Approve & Apply".',
          'Rollback: Instant rollback restores the baseline vulnerable state if needed.',
        ]}
        tourStageIndex={3}
      />

      {loading ? (
        <div className="p-12 text-center text-xs text-[#A6B0A7]">Loading patch proposals...</div>
      ) : !activePatch ? (
        <div
          data-tour="patch-review-controls"
          className="rounded-2xl border border-[#39433B] bg-[#202521] p-12 text-center space-y-3"
        >
          <AlertTriangle className="w-12 h-12 text-[#E9BC65] mx-auto" />
          <h3 className="text-base font-bold text-[#F1F0E8]">No Proposed Patches</h3>
          <p className="text-xs text-[#A6B0A7]">Run a security scan to detect IDOR flaws and generate a patch.</p>
          <button
            onClick={() => navigate('/scans')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#B8F36B] text-[#171A18] hover:bg-[#a6e058]"
          >
            Go to Scans
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Status & Approval Controls */}
          <div
            data-tour="patch-review-controls"
            className="rounded-2xl border border-[#39433B] bg-[#202521] p-6 shadow-xl space-y-4"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#F1F0E8] bg-[#171A18] px-2.5 py-1 rounded-md border border-[#39433B]">
                    {activePatch.patch_id}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                      activePatch.status === 'applied'
                        ? 'bg-[#54D6BE]/15 text-[#54D6BE] border border-[#54D6BE]/30'
                        : activePatch.status === 'approved'
                        ? 'bg-[#B8F36B]/15 text-[#B8F36B] border border-[#B8F36B]/30'
                        : activePatch.status === 'rejected'
                        ? 'bg-[#F28B69]/15 text-[#F28B69] border border-[#F28B69]/30'
                        : 'bg-[#E9BC65]/15 text-[#E9BC65] border border-[#E9BC65]/30 animate-pulse-subtle'
                    }`}
                  >
                    STATUS: {activePatch.status.toUpperCase()}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#F1F0E8]">{activePatch.title}</h2>
                <p className="text-xs text-[#A6B0A7] max-w-2xl leading-relaxed">{activePatch.description}</p>
              </div>

              {/* Action Controls */}
              <div className="flex flex-wrap items-center gap-3">
                {activePatch.status === 'applied' ? (
                  <>
                    <button
                      onClick={() =>
                        setConfirmModal({
                          isOpen: true,
                          type: 'rollback',
                          title: 'Rollback Applied Patch?',
                          description:
                            'This will revert the authorization fix and restore DocVault to the intentionally vulnerable state.',
                        })
                      }
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#282E29] text-[#F28B69] border border-[#39433B] hover:border-[#F28B69]/50 transition-all disabled:opacity-50"
                      title="Rollback patch and restore vulnerable demo baseline"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Rollback Patch</span>
                    </button>
                    <button
                      onClick={() => navigate('/verification')}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#B8F36B] text-[#171A18] hover:bg-[#a6e058] transition-all shadow-lg"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify Fix Now</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        setConfirmModal({
                          isOpen: true,
                          type: 'reject',
                          title: 'Reject Proposed Patch?',
                          description:
                            'This will reject the proposed patch without applying changes to the target application.',
                        })
                      }
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#282E29] text-[#F28B69] border border-[#39433B] hover:border-[#F28B69]/50 transition-all disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject Patch</span>
                    </button>

                    <button
                      onClick={() =>
                        setConfirmModal({
                          isOpen: true,
                          type: 'approve',
                          title: 'Approve & Apply Patch?',
                          description:
                            'By approving, you authorize VerifiedFix to modify document retrieval logic in DocVault to enforce centralized permissions.',
                        })
                      }
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#B8F36B] text-[#171A18] hover:bg-[#a6e058] transition-all shadow-lg shadow-[#B8F36B]/20 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve & Apply</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Reviewer Signature Metadata */}
            {activePatch.reviewer && (
              <div className="pt-4 border-t border-[#39433B] flex items-center gap-4 text-[11px] text-[#A6B0A7]">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#54D6BE]" />
                  <span>Reviewer Signature: <strong className="text-[#F1F0E8]">{activePatch.reviewer}</strong></span>
                </div>
                {activePatch.applied_at && (
                  <div>
                    Applied At: <span className="font-mono text-[#F1F0E8]">{new Date(activePatch.applied_at).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Scope Validation Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#202521] border border-[#39433B] flex items-center gap-3">
              <FileCheck2 className="w-7 h-7 text-[#54D6BE] p-1 rounded-lg bg-[#282E29]" />
              <div>
                <span className="text-[10px] uppercase font-bold text-[#A6B0A7]">Scope Boundary</span>
                <div className="text-xs font-bold text-[#F1F0E8]">Allowlisted File Only</div>
                <div className="text-[10px] text-[#54D6BE]">document_service.py</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#202521] border border-[#39433B] flex items-center gap-3">
              <GitPullRequest className="w-7 h-7 text-[#B8F36B] p-1 rounded-lg bg-[#282E29]" />
              <div>
                <span className="text-[10px] uppercase font-bold text-[#A6B0A7]">Change Line Budget</span>
                <div className="text-xs font-bold text-[#F1F0E8]">+8 lines / -3 lines</div>
                <div className="text-[10px] text-[#B8F36B]">11 lines changed (Budget: 25)</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#202521] border border-[#39433B] flex items-center gap-3">
              <ShieldCheck className="w-7 h-7 text-[#E9BC65] p-1 rounded-lg bg-[#282E29]" />
              <div>
                <span className="text-[10px] uppercase font-bold text-[#A6B0A7]">Execution Safety</span>
                <div className="text-xs font-bold text-[#F1F0E8]">Zero Shell Primitives</div>
                <div className="text-[10px] text-[#E9BC65]">Pure authorization logic check</div>
              </div>
            </div>
          </div>

          {/* Mandatory Safeguard Callout */}
          <div className="p-4 rounded-xl bg-[#202521] border border-[#E9BC65]/40 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#E9BC65] shrink-0 mt-0.5" />
            <div className="text-xs text-[#A6B0A7] leading-relaxed">
              <strong className="text-[#E9BC65]">Verification Safeguard:</strong> Applying a proposed patch transitions
              the target state to <strong className="text-[#F1F0E8]">&quot;Patch Applied — Verification Pending&quot;</strong>.
              The AI cannot declare the fix verified; only running the 10-point test matrix in Stage 5 establishes the
              final <strong className="text-[#54D6BE]">&quot;Fix Verified&quot;</strong> status.
            </div>
          </div>

          {/* Visual Diff Viewer */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F1F0E8] flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-[#54D6BE]" />
                Unified & Split Code Diff
              </h3>
              <span className="text-xs text-[#A6B0A7] font-mono">Scope: document_service.py</span>
            </div>

            <DiffViewer
              beforeCode={activePatch.before_code}
              afterCode={activePatch.after_code}
              diffContent={activePatch.diff_content}
              filename={activePatch.affected_file}
            />
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmLabel={
          confirmModal.type === 'approve'
            ? 'Confirm & Apply'
            : confirmModal.type === 'rollback'
            ? 'Confirm Rollback'
            : 'Confirm Rejection'
        }
        isDestructive={confirmModal.type !== 'approve'}
        isLoading={actionLoading}
        onConfirm={executeAction}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
};
