import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ResetDemoModal } from './components/ResetDemoModal';
import { GuidedTourOverlay } from './components/GuidedTourOverlay';
import { ToastProvider, useToast } from './context/ToastContext';
import { TourProvider } from './context/TourContext';
import { Overview } from './pages/Overview';
import { Scans } from './pages/Scans';
import { Findings } from './pages/Findings';
import { PatchReview } from './pages/PatchReview';
import { Verification } from './pages/Verification';
import { Reports } from './pages/Reports';
import { DocVaultPortal } from './pages/DocVaultPortal';
import { AuditTrail } from './pages/AuditTrail';
import { Settings } from './pages/Settings';
import { api } from './services/api';
import { OverviewStats } from './types';

function AppContent() {
  const { addToast } = useToast();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch system stats', err);
    }
  };

  const handleConfirmReset = async () => {
    try {
      setResetLoading(true);
      await api.resetDemo();
      await loadStats();
      setIsResetModalOpen(false);
      addToast('Demo environment successfully reset to vulnerable baseline!', 'success');
      // Briefly delay or reload window to clean all query states
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (err) {
      addToast('Reset failed: ' + (err as Error).message, 'error');
    } finally {
      setResetLoading(false);
    }
  };

  const systemStatus = stats?.current_security_state?.overall_status || 'Not Scanned';
  const isVulnerable = stats?.is_vulnerable ?? true;
  const aiProvider = stats?.ai_provider || 'Local Deterministic Mode (Offline Ready)';

  return (
    <div className="min-h-screen bg-[#171A18] text-[#F1F0E8] flex flex-col font-sans selection:bg-[#B8F36B] selection:text-[#171A18]">
      {/* Top Navigation */}
      <Navbar
        onResetClick={() => setIsResetModalOpen(true)}
        systemStatus={systemStatus}
        isVulnerable={isVulnerable}
        aiProvider={aiProvider}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Routes>
          <Route path="/" element={<Overview onRefreshStats={loadStats} />} />
          <Route path="/scans" element={<Scans />} />
          <Route path="/findings" element={<Findings />} />
          <Route path="/patches" element={<PatchReview onStateChange={loadStats} />} />
          <Route path="/verification" element={<Verification onStateChange={loadStats} />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/docvault" element={<DocVaultPortal />} />
          <Route path="/audit" element={<AuditTrail />} />
          <Route
            path="/settings"
            element={
              <Settings
                onResetClick={() => setIsResetModalOpen(true)}
                aiProvider={aiProvider}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#39433B] bg-[#202521] py-6 text-center text-xs text-[#A6B0A7] mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#F1F0E8]">VerifiedFix</span>
            <span>— Developed by</span>
            <span className="font-bold text-[#B8F36B]">Team ByteForce</span>
            <span>for</span>
            <span className="font-semibold text-[#54D6BE]">The Verified Fix</span>
          </div>
          <div className="text-[11px] text-[#A6B0A7]/80 font-mono">
            6-Stage Workflow: Detect → Prove → Explain → Patch → Verify → Report
          </div>
        </div>
      </footer>

      {/* Interactive Guided Tour Overlay */}
      <GuidedTourOverlay />

      {/* Reset Confirmation Dialog */}
      <ResetDemoModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
        isLoading={resetLoading}
      />
    </div>
  );
}

export function App() {
  return (
    <Router>
      <ToastProvider>
        <TourProvider>
          <AppContent />
        </TourProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
