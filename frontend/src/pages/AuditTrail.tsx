import React, { useEffect, useState } from 'react';
import { History, Shield, RefreshCw, Activity, Terminal, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';
import { api } from '../services/api';
import { AuditEvent } from '../types';
import { useToast } from '../context/ToastContext';
import { ContextualHelp } from '../components/ContextualHelp';
import { formatIstDateTime } from '../utils/date';

export const AuditTrail: React.FC = () => {
  const { addToast } = useToast();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAudits();
  }, []);

  const loadAudits = async (isManual = false) => {
    try {
      setLoading(true);
      const data = await api.getAuditEvents(100);
      setEvents(data);
      if (isManual) {
        addToast(`Refreshed audit trail (${data.length} events logged)`, 'info');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load audit events', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getEventBadge = (eventType: string) => {
    if (eventType.includes('VERIFICATION') || eventType.includes('VERIFIED')) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#54D6BE]/15 text-[#54D6BE] border border-[#54D6BE]/30">
          {eventType}
        </span>
      );
    }
    if (eventType.includes('PATCH_APPROVED') || eventType.includes('PATCH_APPLIED')) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#B8F36B]/15 text-[#B8F36B] border border-[#B8F36B]/30">
          {eventType}
        </span>
      );
    }
    if (eventType.includes('PATCH_REJECTED') || eventType.includes('FAILED')) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F28B69]/15 text-[#F28B69] border border-[#F28B69]/30">
          {eventType}
        </span>
      );
    }
    if (eventType.includes('SCAN')) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#54D6BE]/10 text-[#54D6BE] border border-[#54D6BE]/25">
          {eventType}
        </span>
      );
    }
    if (eventType.includes('RESET')) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#E9BC65]/15 text-[#E9BC65] border border-[#E9BC65]/30">
          {eventType}
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#282E29] text-[#A6B0A7] border border-[#39433B]">
        {eventType}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Contextual Help */}
      <ContextualHelp
        title="Security Audit Trail & Governance"
        defaultExpanded={false}
        tourStepTarget={5}
        items={[
          {
            label: 'Cryptographic Event Logging',
            description: 'Every high-consequence action — scan initiation, patch generation, human approval, sandbox patch application, verification suite execution, and demo resets — is sequentially recorded in SQLite.'
          },
          {
            label: 'Actor Accountability',
            description: 'Events track the executing actor, client IP address, and exact parameters, ensuring a defensible chain of custody for security engineers and auditors.'
          },
          {
            label: 'Report Integrity',
            description: 'The audit trail history is digested alongside verification matrix results when generating authoritative compliance dossiers.'
          }
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#F1F0E8] flex items-center gap-2.5">
            <History className="w-6 h-6 text-[#B8F36B]" />
            Security Audit Trail & Event Ledger
          </h1>
          <p className="text-xs text-[#A6B0A7] mt-1">
            Chronological log of scanning, approval, patch application, and deterministic verification runs
          </p>
        </div>

        <button
          onClick={() => loadAudits(true)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#202521] text-[#F1F0E8] hover:bg-[#282E29] transition-colors border border-[#39433B]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Audit Table Card */}
      <div className="rounded-2xl border border-[#39433B] bg-[#202521] overflow-hidden shadow-xl">
        <div className="px-6 py-4 bg-[#282E29] border-b border-[#39433B] flex items-center justify-between">
          <span className="text-xs font-bold text-[#F1F0E8] uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#B8F36B]" />
            Recorded Audit Events
          </span>
          <span className="text-xs text-[#A6B0A7] font-mono">Total Recorded: {events.length}</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#A6B0A7]">
            <RefreshCw className="w-5 h-5 text-[#B8F36B] animate-spin mx-auto mb-2" />
            Loading cryptographic audit ledger...
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#A6B0A7]">No security audit events recorded yet.</div>
        ) : (
          <div className="divide-y divide-[#39433B] font-mono text-xs">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="p-4 hover:bg-[#282E29]/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {getEventBadge(ev.event_type)}
                    <span className="text-[#F1F0E8] font-sans text-xs">{ev.description}</span>
                  </div>
                  <div className="text-[11px] text-[#A6B0A7] font-sans flex items-center gap-2">
                    <span>Actor: <strong className="text-[#F1F0E8] font-mono">{ev.actor}</strong></span>
                  </div>
                </div>

                <div className="text-[#A6B0A7] text-[11px] whitespace-nowrap bg-[#171A18] px-2.5 py-1 rounded border border-[#39433B]">
                  {formatIstDateTime(ev.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
