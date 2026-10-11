import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  Radar,
  Bug,
  GitPullRequest,
  CheckCircle2,
  FileText,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Activity,
  History,
  Sliders,
  Compass,
  Menu,
  X
} from 'lucide-react';
import { useTour } from '../context/TourContext';

interface NavbarProps {
  onResetClick: () => void;
  systemStatus: string;
  isVulnerable: boolean;
  aiProvider: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onResetClick,
  systemStatus,
  isVulnerable,
  aiProvider,
}) => {
  const { startTour, isTourActive } = useTour();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getStatusBadge = () => {
    switch (systemStatus) {
      case 'Fix Verified':
      case 'Verified':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-[#54D6BE]/15 text-[#54D6BE] border border-[#54D6BE]/30 animate-pulse-subtle">
            <ShieldCheck className="w-3.5 h-3.5" />
            FIX VERIFIED (10/10 PASS)
          </span>
        );
      case 'Vulnerability Detected':
      case 'Vulnerable':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-[#F28B69]/15 text-[#F28B69] border border-[#F28B69]/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            VULNERABILITY DETECTED
          </span>
        );
      case 'Patch Pending Approval':
      case 'Patch Proposed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-[#E9BC65]/15 text-[#E9BC65] border border-[#E9BC65]/30">
            <GitPullRequest className="w-3.5 h-3.5" />
            PATCH PENDING APPROVAL
          </span>
        );
      case 'Patch Applied — Verification Pending':
      case 'Patch Applied':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-[#B8F36B]/15 text-[#B8F36B] border border-[#B8F36B]/30">
            <Activity className="w-3.5 h-3.5" />
            PATCH APPLIED — VERIFY PENDING
          </span>
        );
      case 'Verification Failed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-[#F28B69]/15 text-[#F28B69] border border-[#F28B69]/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            VERIFICATION FAILED
          </span>
        );
      case 'Verification Incomplete':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-[#E9BC65]/15 text-[#E9BC65] border border-[#E9BC65]/30">
            <Activity className="w-3.5 h-3.5" />
            VERIFICATION INCOMPLETE
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-[#202521] text-[#A6B0A7] border border-[#39433B]">
            <Activity className="w-3.5 h-3.5" />
            NOT SCANNED
          </span>
        );
    }
  };

  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/scans', label: 'Security Scans', icon: Radar },
    { to: '/findings', label: 'Findings', icon: Bug },
    { to: '/patches', label: 'Patch Review', icon: GitPullRequest },
    { to: '/verification', label: 'Verification Matrix', icon: CheckCircle2 },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/audit', label: 'Audit Trail', icon: History },
    { to: '/settings', label: 'Settings', icon: Sliders },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#171A18]/95 backdrop-blur border-b border-[#39433B] print:hidden">
      {/* Top Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center gap-4">
            <NavLink to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-[#202521] border border-[#39433B] flex items-center justify-center p-0.5 transition-all group-hover:border-[#B8F36B]">
                <ShieldCheck className="w-5 h-5 text-[#B8F36B]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black tracking-wider text-[#F1F0E8]">
                    VERIFIED<span className="text-[#B8F36B]">FIX</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#282E29] text-[#A6B0A7] border border-[#39433B]">
                    BYTEFORCE
                  </span>
                </div>
                <div className="text-[10px] text-[#A6B0A7] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#54D6BE]"></span>
                  Security Verification Platform
                </div>
              </div>
            </NavLink>

            <div className="hidden lg:flex items-center ml-3 pl-3 border-l border-[#39433B]">
              {getStatusBadge()}
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* Guided Tour Trigger Button */}
            <button
              onClick={() => startTour(0)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isTourActive
                  ? 'bg-[#B8F36B] text-[#171A18] shadow-md shadow-[#B8F36B]/20'
                  : 'bg-[#202521] text-[#B8F36B] hover:bg-[#282E29] border border-[#B8F36B]/40'
              }`}
              title="Launch step-by-step interactive demo tour"
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Guided Tour</span>
            </button>

            {/* DocVault Demo Portal Button */}
            <NavLink
              to="/docvault"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#202521] text-[#F1F0E8] border border-[#39433B] hover:border-[#54D6BE] hover:text-[#54D6BE] transition-all"
              title="Open Target Document Application (DocVault)"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">DocVault Demo</span>
            </NavLink>

            {/* Reset Demo Button */}
            <button
              onClick={onResetClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#202521] text-[#F28B69] border border-[#39433B] hover:border-[#F28B69]/50 hover:bg-[#F28B69]/10 transition-all"
              title="Reset target database to vulnerable baseline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-[#202521] border border-[#39433B] text-[#A6B0A7] hover:text-[#F1F0E8]"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Links Row */}
      <div className="hidden lg:block border-t border-[#39433B]/70 bg-[#171A18]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                      isActive
                        ? 'bg-[#202521] text-[#B8F36B] font-bold border border-[#39433B]'
                        : 'text-[#A6B0A7] hover:text-[#F1F0E8] hover:bg-[#202521]/60'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#39433B] bg-[#202521] px-4 py-3 space-y-1.5 animate-fade-in">
          <div className="py-2 border-b border-[#39433B]/60 mb-2">
            {getStatusBadge()}
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#282E29] text-[#B8F36B] font-bold border border-[#39433B]'
                      : 'text-[#A6B0A7] hover:text-[#F1F0E8]'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </header>
  );
};
