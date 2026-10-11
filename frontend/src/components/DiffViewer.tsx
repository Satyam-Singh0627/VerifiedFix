import React, { useState } from 'react';
import { Columns2, Rows, Code2 } from 'lucide-react';

interface DiffViewerProps {
  beforeCode: string;
  afterCode: string;
  diffContent?: string;
  filename?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  beforeCode,
  afterCode,
  diffContent,
  filename = 'backend/app/services/document_service.py',
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  const beforeLines = beforeCode.split('\n');
  const afterLines = afterCode.split('\n');

  return (
    <div className="rounded-2xl border border-[#39433B] bg-[#202521] overflow-hidden shadow-xl">
      {/* Diff Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#282E29] border-b border-[#39433B]">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-[#B8F36B]" />
          <span className="font-mono text-xs text-[#F1F0E8] font-medium">{filename}</span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#54D6BE]/15 text-[#54D6BE] border border-[#54D6BE]/30">
            Allowlisted Scope
          </span>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-[#202521] p-1 rounded-lg border border-[#39433B] text-xs">
          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'split' ? 'bg-[#282E29] text-[#F1F0E8] font-semibold' : 'text-[#A6B0A7] hover:text-[#F1F0E8]'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            Split View
          </button>
          <button
            onClick={() => setViewMode('unified')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'unified' ? 'bg-[#282E29] text-[#F1F0E8] font-semibold' : 'text-[#A6B0A7] hover:text-[#F1F0E8]'
            }`}
          >
            <Rows className="w-3.5 h-3.5" />
            Unified Diff
          </button>
        </div>
      </div>

      {/* Code Display Area */}
      {viewMode === 'split' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#39433B] font-mono text-xs">
          {/* Before Code (Vulnerable) */}
          <div className="bg-[#171A18]/60">
            <div className="px-4 py-2 bg-[#F28B69]/10 border-b border-[#39433B] text-[#F28B69] font-semibold text-[11px] flex items-center justify-between">
              <span>BEFORE (Vulnerable Access Control)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F28B69]/20 text-[#F28B69] border border-[#F28B69]/40">
                -3 lines
              </span>
            </div>
            <div className="p-4 space-y-1 overflow-x-auto text-[#F1F0E8]">
              {beforeLines.map((line, idx) => (
                <div key={idx} className="flex gap-3 leading-relaxed diff-removed px-2 py-0.5 rounded">
                  <span className="text-[#A6B0A7]/50 select-none w-6 text-right">{idx + 58}</span>
                  <span className="text-[#F28B69] select-none">-</span>
                  <span className="whitespace-pre font-mono">{line}</span>
                </div>
              ))}
            </div>
          </div>

          {/* After Code (Secure Fix) */}
          <div className="bg-[#171A18]/60">
            <div className="px-4 py-2 bg-[#54D6BE]/10 border-b border-[#39433B] text-[#54D6BE] font-semibold text-[11px] flex items-center justify-between">
              <span>AFTER (Centralized Policy Enforced)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#54D6BE]/20 text-[#54D6BE] border border-[#54D6BE]/40">
                +8 lines
              </span>
            </div>
            <div className="p-4 space-y-1 overflow-x-auto text-[#F1F0E8]">
              {afterLines.map((line, idx) => (
                <div key={idx} className="flex gap-3 leading-relaxed diff-added px-2 py-0.5 rounded">
                  <span className="text-[#A6B0A7]/50 select-none w-6 text-right">{idx + 58}</span>
                  <span className="text-[#54D6BE] select-none">+</span>
                  <span className="whitespace-pre font-mono">{line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Unified Diff view */
        <div className="p-4 bg-[#171A18] font-mono text-xs overflow-x-auto">
          <pre className="text-[#F1F0E8] leading-relaxed">
            {diffContent ? (
              diffContent.split('\n').map((line, idx) => {
                let lineClass = 'text-[#A6B0A7]';
                if (line.startsWith('+')) lineClass = 'diff-added px-2 py-0.5 rounded block';
                else if (line.startsWith('-')) lineClass = 'diff-removed px-2 py-0.5 rounded block';
                else if (line.startsWith('@@')) lineClass = 'text-[#B8F36B] font-bold block';
                return (
                  <div key={idx} className={lineClass}>
                    {line}
                  </div>
                );
              })
            ) : (
              <code>{beforeCode}</code>
            )}
          </pre>
        </div>
      )}
    </div>
  );
};
