import React, { useEffect, useState } from 'react';
import {
  FileText,
  Lock,
  Unlock,
  Shield,
  User,
  Users,
  Share2,
  Trash2,
  Upload,
  Eye,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  FolderLock,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Search,
  KeyRound,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { DocumentItem, User as UserType } from '../types';
import { useToast } from '../context/ToastContext';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ContextualHelp } from '../components/ContextualHelp';

export const DocVaultPortal: React.FC = () => {
  const { addToast } = useToast();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Direct IDOR test input state
  const [manualDocId, setManualDocId] = useState<string>('12');
  const [manualAccessResult, setManualAccessResult] = useState<{
    status: number;
    doc?: DocumentItem;
    error?: string;
  } | null>(null);
  const [testingAccess, setTestingAccess] = useState(false);

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFilename, setUploadFilename] = useState('');
  const [uploadSummary, setUploadSummary] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadClassification, setUploadClassification] = useState('internal');
  const [uploadLoading, setUploadLoading] = useState(false);

  // Share modal state
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareDocId, setShareDocId] = useState<number | null>(null);
  const [shareUsername, setShareUsername] = useState('carol');
  const [shareLoading, setShareLoading] = useState(false);

  // Delete modal state
  const [deleteDocId, setDeleteDocId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadDocuments = async () => {
    try {
      const docs = await api.getDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSwitchUser = async (username: string) => {
    try {
      setLoading(true);
      setAuthError(null);
      setSelectedDoc(null);
      setManualAccessResult(null);
      const res = await api.login(username, 'Password123!');
      setCurrentUser(res.user);
      addToast(`Switched active identity to ${res.user.full_name} (${res.user.username})`, 'info');
      await loadDocuments();
    } catch (err) {
      setAuthError((err as Error).message);
      addToast(`Authentication failed: ${(err as Error).message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const initUser = async () => {
    const saved = localStorage.getItem('docvault_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setCurrentUser(u);
        loadDocuments();
        return;
      } catch {
        // fallback
      }
    }
    // Default to Bob so judges immediately experience the IDOR scenario
    handleSwitchUser('bob');
  };

  useEffect(() => {
    initUser();
  }, []);

  const handleTestDirectAccess = async () => {
    const id = parseInt(manualDocId, 10);
    if (isNaN(id)) {
      addToast('Please enter a valid numeric document ID', 'warning');
      return;
    }

    try {
      setTestingAccess(true);
      setManualAccessResult(null);
      const doc = await api.getDocument(id);
      setManualAccessResult({ status: 200, doc });
      addToast(`Unauthorized access permitted to Document #${id} (HTTP 200 OK)`, 'error');
    } catch (err: any) {
      const status = err.status || 403;
      setManualAccessResult({ status, error: err.message });
      addToast(`Access forbidden as intended (HTTP ${status})`, 'success');
    } finally {
      setTestingAccess(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle || !uploadContent) return;
    try {
      setUploadLoading(true);
      await api.uploadDocument({
        title: uploadTitle,
        filename: uploadFilename || `${uploadTitle.toLowerCase().replace(/\s+/g, '_')}.txt`,
        content_summary: uploadSummary || 'User uploaded document',
        file_content: uploadContent,
        is_private: true,
        classification: uploadClassification,
      });
      setIsUploadOpen(false);
      setUploadTitle('');
      setUploadContent('');
      setUploadSummary('');
      setUploadFilename('');
      addToast(`Document "${uploadTitle}" uploaded successfully`, 'success');
      loadDocuments();
    } catch (err) {
      addToast('Upload failed: ' + (err as Error).message, 'error');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteDocId) return;
    try {
      setDeleteLoading(true);
      await api.deleteDocument(deleteDocId);
      setSelectedDoc(null);
      addToast(`Document #${deleteDocId} deleted successfully`, 'info');
      setDeleteDocId(null);
      loadDocuments();
    } catch (err) {
      addToast('Delete failed: ' + (err as Error).message, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareDocId) return;
    try {
      setShareLoading(true);
      await api.shareDocument(shareDocId, shareUsername, 'read');
      setIsShareOpen(false);
      addToast(`Document #${shareDocId} shared with ${shareUsername}`, 'success');
      loadDocuments();
    } catch (err) {
      addToast('Share failed: ' + (err as Error).message, 'error');
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Contextual Help */}
      <ContextualHelp
        title="DocVault Architecture & Multi-Tenant Target"
        defaultExpanded={false}
        tourStepTarget={1}
        items={[
          {
            label: 'Demo Identities',
            description: 'Alice (Finance Director, owns confidential document #12), Bob (Contractor/Attacker, has zero access rights to #12), Carol (Marketing, collaborator), and Admin (Security auditor).'
          },
          {
            label: 'Deliberate Vulnerability (Baseline)',
            description: 'In the unpatched baseline, GET /api/documents/{id} blindly returns any document by primary key without checking if request.user is the owner or in document_shares.'
          },
          {
            label: 'The Proof of Exploit',
            description: 'Log in as Bob, enter Document ID "12" in the IDOR playground below, and click Send Request. Before the fix, Bob receives Alice\'s confidential Q4 financial forecast. After the fix, Bob receives HTTP 403 Forbidden.'
          }
        ]}
      />

      {/* DocVault Banner */}
      <div className="rounded-2xl border border-[#39433B] bg-[#202521] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <FolderLock className="w-5 h-5 text-[#B8F36B]" />
              <span className="text-xs uppercase font-bold tracking-widest text-[#B8F36B]">
                Target Application Under Test
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#F1F0E8]">DocVault Document Portal</h1>
            <p className="text-xs text-[#A6B0A7] max-w-2xl leading-relaxed">
              Real SQLite-backed multi-tenant document repository. Log in as different demo identities to observe
              access control behavior before and after VerifiedFix applies the verified authorization patch.
            </p>
          </div>

          {/* Quick Identity Switcher */}
          <div className="bg-[#171A18] p-3 rounded-xl border border-[#39433B] space-y-2">
            <div className="text-[11px] font-bold text-[#A6B0A7] uppercase tracking-wider flex items-center justify-between">
              <span>Switch Active User</span>
              <span className="text-[#A6B0A7]/70 font-mono text-[10px]">Password: Password123!</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { username: 'alice', label: 'Alice (Owner)', role: 'Finance Dir' },
                { username: 'bob', label: 'Bob (Attacker)', role: 'Contractor' },
                { username: 'carol', label: 'Carol (Shared)', role: 'Marketing Dir' },
                { username: 'admin', label: 'Admin', role: 'Security Admin' },
              ].map((u) => {
                const isActive = currentUser?.username === u.username;
                return (
                  <button
                    key={u.username}
                    onClick={() => handleSwitchUser(u.username)}
                    disabled={loading}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#B8F36B] text-[#171A18] shadow-md shadow-[#B8F36B]/20 font-black'
                        : 'bg-[#282E29] text-[#A6B0A7] hover:text-[#F1F0E8] hover:bg-[#39433B]/40 border border-[#39433B]'
                    }`}
                  >
                    <User className="w-3 h-3" />
                    <span>{u.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Current Active User Info */}
        {currentUser && (
          <div className="mt-6 pt-4 border-t border-[#39433B] flex flex-wrap items-center justify-between gap-3 text-xs text-[#A6B0A7]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#54D6BE] animate-pulse"></span>
              <span>Logged in as:</span>
              <strong className="text-[#F1F0E8] font-mono">{currentUser.full_name}</strong>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#282E29] text-[#A6B0A7] border border-[#39433B]">
                ROLE: {currentUser.role}
              </span>
            </div>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#282E29] hover:bg-[#39433B] text-[#B8F36B] border border-[#39433B] transition-all shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          </div>
        )}
      </div>

      {/* IDOR Test Playground Card (Step 1 in Demo) */}
      <div className="rounded-2xl border border-[#F28B69]/40 bg-[#202521] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#F28B69]" />
            <h2 className="text-sm font-bold text-[#F1F0E8]">Interactive Direct Object Access Test (IDOR Playground)</h2>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#F28B69]/10 text-[#F28B69] border border-[#F28B69]/30">
            Interactive Exploit Test
          </span>
        </div>

        <p className="text-xs text-[#A6B0A7] leading-relaxed">
          Logged in as <strong className="text-[#F1F0E8]">{currentUser?.username}</strong> ({currentUser?.role}). Test whether this identity can
          access private resources by directly requesting the document identifier. (Try Document ID{' '}
          <strong className="text-[#B8F36B] font-mono">12</strong>, which belongs strictly to Alice).
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1 bg-[#171A18] px-3 py-2 rounded-xl border border-[#39433B] font-mono text-xs">
            <span className="text-[#A6B0A7]">GET /api/documents/</span>
            <input
              type="text"
              value={manualDocId}
              onChange={(e) => setManualDocId(e.target.value)}
              className="bg-transparent text-[#B8F36B] font-bold focus:outline-none w-20"
              placeholder="12"
            />
          </div>

          <button
            onClick={handleTestDirectAccess}
            disabled={testingAccess}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#F28B69] hover:bg-[#F28B69]/90 text-[#171A18] transition-all shadow-md shadow-[#F28B69]/20"
          >
            <Eye className="w-4 h-4" />
            <span>{testingAccess ? 'Testing Request...' : `Send Request as ${currentUser?.username}`}</span>
          </button>
        </div>

        {/* Access Result Preview */}
        {manualAccessResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 animate-fade-in ${
              manualAccessResult.status === 200
                ? 'bg-[#F28B69]/10 border-[#F28B69]/40 text-[#F28B69]'
                : 'bg-[#54D6BE]/10 border-[#54D6BE]/40 text-[#54D6BE]'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-2">
                {manualAccessResult.status === 200 ? (
                  <>
                    <Unlock className="w-4 h-4 text-[#F28B69]" />
                    <span>UNAUTHORIZED ACCESS PERMITTED (HTTP 200 OK — VULNERABILITY CONFIRMED)</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-[#54D6BE]" />
                    <span>ACCESS BLOCKED AS INTENDED (HTTP {manualAccessResult.status} FORBIDDEN — SECURE)</span>
                  </>
                )}
              </span>
              <span className="font-mono text-[11px]">HTTP {manualAccessResult.status}</span>
            </div>

            {manualAccessResult.doc ? (
              <div className="bg-[#171A18] p-3 rounded-lg border border-[#39433B] font-mono text-[11px] text-[#A6B0A7] space-y-1">
                <div>Title: <strong className="text-[#F1F0E8]">{manualAccessResult.doc.title}</strong></div>
                <div>Owner ID: {manualAccessResult.doc.owner_id} (Alice) | Classification: {manualAccessResult.doc.classification}</div>
                <div className="text-[#F28B69] font-sans text-xs mt-2 p-2 bg-[#F28B69]/15 rounded border border-[#F28B69]/30">
                  Leaked Content Evidence: {manualAccessResult.doc.file_content || manualAccessResult.doc.content_summary}
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#A6B0A7]">
                Server Response: <code className="text-[#54D6BE] font-mono">{manualAccessResult.error || 'Access denied by authorization policy'}</code>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Accessible Document List */}
      <div className="rounded-2xl border border-[#39433B] bg-[#202521] overflow-hidden shadow-xl">
        <div className="px-6 py-4 bg-[#282E29] border-b border-[#39433B] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#F1F0E8] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#B8F36B]" />
            Documents Accessible to {currentUser?.full_name} ({documents.length})
          </h2>
          <span className="text-xs text-[#A6B0A7]">Policy: Owner + Explicit Shared + Admin</span>
        </div>

        {documents.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#A6B0A7]">No documents returned in user vault.</div>
        ) : (
          <div className="divide-y divide-[#39433B]">
            {documents.map((d) => (
              <div key={d.id} className="p-5 hover:bg-[#282E29]/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#A6B0A7]">#{d.id}</span>
                    <h3 className="text-sm font-bold text-[#F1F0E8]">{d.title}</h3>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        d.classification === 'confidential'
                          ? 'bg-[#F28B69]/10 text-[#F28B69] border border-[#F28B69]/30'
                          : 'bg-[#282E29] text-[#A6B0A7] border border-[#39433B]'
                      }`}
                    >
                      {d.classification}
                    </span>
                    {d.owner_id === currentUser?.id ? (
                      <span className="text-[10px] font-semibold text-[#54D6BE] bg-[#54D6BE]/10 px-2 py-0.5 rounded border border-[#54D6BE]/30">
                        Owner
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-[#B8F36B] bg-[#B8F36B]/10 px-2 py-0.5 rounded border border-[#B8F36B]/30">
                        Shared Access
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#A6B0A7]">{d.content_summary}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      const fullDoc = await api.getDocument(d.id);
                      setSelectedDoc(fullDoc);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#282E29] text-[#F1F0E8] hover:bg-[#39433B] transition-colors border border-[#39433B]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>

                  {d.owner_id === currentUser?.id && (
                    <>
                      <button
                        onClick={() => {
                          setShareDocId(d.id);
                          setIsShareOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#282E29] text-[#54D6BE] hover:bg-[#39433B] border border-[#39433B] transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share</span>
                      </button>
                      <button
                        onClick={() => setDeleteDocId(d.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F28B69]/10 text-[#F28B69] hover:bg-[#F28B69]/20 border border-[#F28B69]/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Document Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#202521] border border-[#39433B] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#39433B] pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#A6B0A7]">DOCUMENT #{selectedDoc.id}</span>
                <h3 className="text-base font-bold text-[#F1F0E8]">{selectedDoc.title}</h3>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-[#A6B0A7] hover:text-[#F1F0E8] text-xs font-bold p-1 bg-[#282E29] border border-[#39433B] rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-[#171A18] p-3 rounded-xl border border-[#39433B]">
                <div>
                  <span className="text-[10px] text-[#A6B0A7]">Filename:</span>
                  <div className="font-mono text-[#F1F0E8]">{selectedDoc.filename}</div>
                </div>
                <div>
                  <span className="text-[10px] text-[#A6B0A7]">Classification:</span>
                  <div className="font-semibold text-[#F28B69] uppercase">{selectedDoc.classification}</div>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-[#A6B0A7] font-bold uppercase">Document Content</span>
                <div className="mt-1 p-4 rounded-xl bg-[#171A18] border border-[#39433B] text-[#F1F0E8] font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {selectedDoc.file_content || selectedDoc.content_summary}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleUpload}
            className="bg-[#202521] border border-[#39433B] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#39433B] pb-3">
              <h3 className="text-base font-bold text-[#F1F0E8] flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#B8F36B]" />
                Upload New Document
              </h3>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="text-[#A6B0A7] hover:text-[#F1F0E8] text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#A6B0A7] block mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full bg-[#171A18] border border-[#39433B] rounded-lg p-2.5 text-[#F1F0E8] focus:border-[#B8F36B] focus:outline-none"
                  placeholder="e.g. Q4 Budget Plan"
                />
              </div>

              <div>
                <label className="text-[#A6B0A7] block mb-1">Classification</label>
                <select
                  value={uploadClassification}
                  onChange={(e) => setUploadClassification(e.target.value)}
                  className="w-full bg-[#171A18] border border-[#39433B] rounded-lg p-2.5 text-[#F1F0E8] focus:border-[#B8F36B] focus:outline-none"
                >
                  <option value="confidential">Confidential</option>
                  <option value="internal">Internal</option>
                  <option value="public">Public</option>
                </select>
              </div>

              <div>
                <label className="text-[#A6B0A7] block mb-1">Document Content</label>
                <textarea
                  rows={4}
                  required
                  value={uploadContent}
                  onChange={(e) => setUploadContent(e.target.value)}
                  className="w-full bg-[#171A18] border border-[#39433B] rounded-lg p-2.5 text-[#F1F0E8] font-mono text-xs focus:border-[#B8F36B] focus:outline-none"
                  placeholder="Document text..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={uploadLoading}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#B8F36B] hover:bg-[#B8F36B]/90 text-[#171A18] transition-colors shadow-lg"
            >
              {uploadLoading ? 'Uploading...' : 'Upload Document'}
            </button>
          </form>
        </div>
      )}

      {/* Share Document Modal */}
      {isShareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleShare}
            className="bg-[#202521] border border-[#39433B] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#39433B] pb-3">
              <h3 className="text-sm font-bold text-[#F1F0E8] flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#54D6BE]" />
                Share Document #{shareDocId}
              </h3>
              <button
                type="button"
                onClick={() => setIsShareOpen(false)}
                className="text-[#A6B0A7] hover:text-[#F1F0E8] text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#A6B0A7] block mb-1">Share with User</label>
                <select
                  value={shareUsername}
                  onChange={(e) => setShareUsername(e.target.value)}
                  className="w-full bg-[#171A18] border border-[#39433B] rounded-lg p-2.5 text-[#F1F0E8] focus:border-[#B8F36B] focus:outline-none"
                >
                  <option value="carol">Carol (carol@docvault.local)</option>
                  <option value="bob">Bob (bob@docvault.local)</option>
                  <option value="alice">Alice (alice@docvault.local)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={shareLoading}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#54D6BE] hover:bg-[#54D6BE]/90 text-[#171A18] transition-colors shadow-lg"
            >
              {shareLoading ? 'Granting Access...' : 'Grant Explicit Access'}
            </button>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteDocId !== null}
        onClose={() => setDeleteDocId(null)}
        onConfirm={handleConfirmDelete}
        title="Confirm Document Deletion"
        message={`Are you sure you want to permanently delete Document #${deleteDocId}? This action cannot be undone.`}
        confirmText="Delete Document"
        confirmVariant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
};
