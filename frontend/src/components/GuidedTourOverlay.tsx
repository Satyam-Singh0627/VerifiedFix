import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { useTour, TOUR_STEPS } from '../context/TourContext';

export const GuidedTourOverlay: React.FC = () => {
  const navigate = useNavigate();
  const {
    isTourActive,
    currentStepIndex,
    currentStep,
    nextStep,
    prevStep,
    skipTour,
    exitTour,
    isTourComplete,
    setIsTourComplete,
    resetTourProgress,
    startTour,
  } = useTour();

  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties | null>(null);

  // Keyboard shortcut (Escape) to exit tour or completion modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isTourComplete || isTourActive) {
          setIsTourComplete(false);
          exitTour();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourComplete, isTourActive, exitTour, setIsTourComplete]);

  useEffect(() => {
    if (!isTourActive) return;

    // Highlight the target element on the current page
    const updateHighlight = () => {
      const el = document.querySelector(currentStep.targetSelector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('tour-highlight');
      }
    };

    const timer = setTimeout(updateHighlight, 250);

    return () => {
      clearTimeout(timer);
      const el = document.querySelector(currentStep.targetSelector);
      if (el) {
        el.classList.remove('tour-highlight');
      }
    };
  }, [isTourActive, currentStep]);

  if (!isTourActive && !isTourComplete) {
    return null;
  }

  // 1. Tour Completion Screen Modal
  if (isTourComplete) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsTourComplete(false);
            exitTour();
          }
        }}
      >
        <div className="bg-[#202521] border border-[#39433B] rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-[#F1F0E8] space-y-6 relative">
          {/* Top-right close button */}
          <button
            onClick={() => {
              setIsTourComplete(false);
              exitTour();
            }}
            className="absolute top-4 right-4 text-[#A6B0A7] hover:text-[#F1F0E8] p-1.5 rounded-lg hover:bg-[#282E29] transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#54D6BE]/15 text-[#54D6BE] border border-[#54D6BE]/30">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#B8F36B]">
                Guided Tour Complete
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#F1F0E8]">
                You Verified the Fix!
              </h2>
            </div>
          </div>

          <p className="text-xs text-[#A6B0A7] leading-relaxed">
            You walked through the entire 6-stage security verification workflow:
          </p>

          <div className="space-y-2 text-xs bg-[#282E29] p-4 rounded-xl border border-[#39433B]">
            <div className="flex items-center gap-2 text-[#54D6BE]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span><strong>Detect:</strong> Discovered IDOR access control flaw in DocVault.</span>
            </div>
            <div className="flex items-center gap-2 text-[#54D6BE]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span><strong>Prove:</strong> Captured empirical evidence of Bob reading Alice&apos;s private document.</span>
            </div>
            <div className="flex items-center gap-2 text-[#54D6BE]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span><strong>Explain:</strong> Analyzed root cause with exact source line references.</span>
            </div>
            <div className="flex items-center gap-2 text-[#54D6BE]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span><strong>Patch:</strong> Reviewed unified diff & approved scope-validated fix.</span>
            </div>
            <div className="flex items-center gap-2 text-[#54D6BE]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span><strong>Verify:</strong> Ran 10-point test matrix proving Bob is blocked with HTTP 403.</span>
            </div>
            <div className="flex items-center gap-2 text-[#54D6BE]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span><strong>Report:</strong> Generated certified audit dossier with SHA-256 integrity seal.</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={() => {
                setIsTourComplete(false);
                exitTour();
                navigate('/reports');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#B8F36B] hover:bg-[#a6e058] text-[#171A18] transition-all shadow-lg shadow-[#B8F36B]/20"
            >
              <span>View Audit Report</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsTourComplete(false);
                resetTourProgress();
                startTour(0);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#282E29] hover:bg-[#343B35] text-[#F1F0E8] border border-[#39433B] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart Tour</span>
            </button>
            <button
              onClick={() => {
                setIsTourComplete(false);
                exitTour();
              }}
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-semibold text-[#A6B0A7] hover:text-[#F1F0E8] hover:bg-[#282E29] rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Tour Guide Floating Card
  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-fade-in pointer-events-auto">
      <div className="rounded-2xl bg-[#202521] border-2 border-[#B8F36B] p-5 shadow-2xl text-[#F1F0E8] space-y-4 relative">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#B8F36B]/20 text-[#B8F36B] flex items-center justify-center font-bold text-xs border border-[#B8F36B]/40">
              {currentStep.stageNumber}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#B8F36B]">
                STEP {currentStep.stageNumber} OF 6: {currentStep.stageName}
              </span>
              <h3 className="text-sm font-bold text-[#F1F0E8] leading-tight">{currentStep.title}</h3>
            </div>
          </div>

          <button
            onClick={exitTour}
            className="text-[#A6B0A7] hover:text-[#F1F0E8] transition-colors p-1"
            title="Exit tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description & Action */}
        <p className="text-xs text-[#A6B0A7] leading-relaxed">{currentStep.description}</p>

        {/* Why it matters box */}
        <div className="bg-[#282E29] p-3 rounded-xl border border-[#39433B] text-xs space-y-1">
          <div className="text-[10px] uppercase font-bold text-[#54D6BE] flex items-center gap-1">
            <Info className="w-3 h-3" />
            <span>Why this matters</span>
          </div>
          <p className="text-[#F1F0E8] text-[11px] leading-relaxed">{currentStep.whyItMatters}</p>
        </div>

        {/* Action hint banner */}
        <div className="px-3 py-2 rounded-lg bg-[#B8F36B]/10 border border-[#B8F36B]/30 text-[11px] font-medium text-[#B8F36B] flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>{currentStep.actionHint}</span>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-1.5 py-1">
          {TOUR_STEPS.map((s, idx) => (
            <div
              key={s.stageNumber}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStepIndex
                  ? 'w-6 bg-[#B8F36B]'
                  : idx < currentStepIndex
                  ? 'w-2 bg-[#54D6BE]'
                  : 'w-2 bg-[#39433B]'
              }`}
            />
          ))}
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-[#39433B]/80 text-xs">
          <button
            onClick={skipTour}
            className="text-[11px] text-[#A6B0A7] hover:text-[#F1F0E8] font-medium transition-colors"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={prevStep}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#282E29] hover:bg-[#343B35] text-[#F1F0E8] disabled:opacity-40 transition-colors border border-[#39433B]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              onClick={nextStep}
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-bold bg-[#B8F36B] hover:bg-[#a6e058] text-[#171A18] transition-all shadow-md shadow-[#B8F36B]/20"
            >
              <span>{currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next Step'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
