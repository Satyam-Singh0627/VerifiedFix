import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Compass, Sparkles } from 'lucide-react';
import { useTour } from '../context/TourContext';

export interface ContextualHelpItem {
  label?: string;
  description: string;
}

export interface ContextualHelpProps {
  title: string;
  summary?: string;
  details?: string[];
  items?: ContextualHelpItem[];
  tourStageIndex?: number;
  tourStepTarget?: number;
  defaultExpanded?: boolean;
}

export const ContextualHelp: React.FC<ContextualHelpProps> = ({
  title,
  summary,
  details,
  items,
  tourStageIndex,
  tourStepTarget,
  defaultExpanded = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const { startTour } = useTour();

  const stepTarget = tourStageIndex ?? tourStepTarget;

  return (
    <div className="rounded-xl bg-[#202521] border border-[#39433B] text-xs transition-all overflow-hidden mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#282E29]/60 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <HelpCircle className="w-4 h-4 text-[#B8F36B] shrink-0" />
          <span className="font-semibold text-[#F1F0E8]">{title}</span>
        </div>
        <div className="flex items-center gap-2 text-[#A6B0A7]">
          <span className="text-[11px] hidden sm:inline">{isOpen ? 'Hide explanation' : 'How does this work?'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-[#39433B]/60 bg-[#171A18]/50 animate-fade-in">
          {summary && <p className="text-[#A6B0A7] text-xs leading-relaxed">{summary}</p>}

          {details && details.length > 0 && (
            <ul className="space-y-1.5 text-xs text-[#A6B0A7] pl-4 list-disc marker:text-[#B8F36B]">
              {details.map((detail, idx) => (
                <li key={idx} className="leading-relaxed">
                  {detail}
                </li>
              ))}
            </ul>
          )}

          {items && items.length > 0 && (
            <div className="space-y-2 mt-2">
              {items.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-[#202521] border border-[#39433B] text-xs">
                  {item.label && <div className="font-bold text-[#F1F0E8] mb-1">{item.label}</div>}
                  <div className="text-[#A6B0A7] leading-relaxed">{item.description}</div>
                </div>
              ))}
            </div>
          )}

          {typeof stepTarget === 'number' && (
            <div className="pt-2 flex items-center justify-between border-t border-[#39433B]/40">
              <span className="text-[11px] text-[#A6B0A7]">
                Related guided demo stage: Stage {stepTarget}
              </span>
              <button
                onClick={() => startTour(stepTarget - 1)}
                className="flex items-center gap-1.5 text-[11px] text-[#B8F36B] hover:text-[#B8F36B]/80 font-bold"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Jump to Stage {stepTarget}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
