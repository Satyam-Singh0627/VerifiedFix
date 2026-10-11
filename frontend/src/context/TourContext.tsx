import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export interface TourStep {
  stageNumber: number;
  stageName: string;
  path: string;
  targetSelector: string;
  title: string;
  description: string;
  whyItMatters: string;
  actionHint: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    stageNumber: 1,
    stageName: 'DETECT',
    path: '/scans',
    targetSelector: '[data-tour="scan-controls"]',
    title: 'Stage 1 — Detect Weaknesses Across Tenant Boundaries',
    description:
      'VerifiedFix begins by actively testing application authorization boundaries across multiple identities. Start by running a scan against the local DocVault demo target.',
    whyItMatters:
      'Security scans must test actual multi-tenant access controls and response behaviors, not merely perform static text matching.',
    actionHint: 'Click "Initiate Security Scan" to execute empirical checks against the local sandbox.',
  },
  {
    stageNumber: 2,
    stageName: 'PROVE',
    path: '/findings',
    targetSelector: '[data-tour="exploit-evidence"]',
    title: 'Stage 2 — Prove Exploitability with Empirical Evidence',
    description:
      'A vulnerability finding is valuable only when safely verified. Here, the scanner demonstrates that Bob (an unauthorized user) requested Alice\'s private Document #12 and received HTTP 200 OK.',
    whyItMatters:
      'Proving exploitability eliminates false positives and ensures engineering time is spent remediating genuine vulnerabilities.',
    actionHint: 'Inspect the redacted HTTP request and leaked financial document response in the evidence panel.',
  },
  {
    stageNumber: 3,
    stageName: 'EXPLAIN',
    path: '/findings',
    targetSelector: '[data-tour="root-cause"]',
    title: 'Stage 3 — Explain Root Cause with Precise Code References',
    description:
      'Understand the root cause before modifying application code. In DocVault, the document-retrieval route checks user login status but skips document ownership and sharing verification.',
    whyItMatters:
      'Accurate code location mapping (document_service.py) empowers developers to remediate the exact flaw without guessing.',
    actionHint: 'Review the vulnerable code path and recommended authorization guard, then proceed to Patch Review.',
  },
  {
    stageNumber: 4,
    stageName: 'PATCH',
    path: '/patches',
    targetSelector: '[data-tour="patch-review-controls"]',
    title: 'Stage 4 — Human-in-the-Loop Patch Review & Scope Validation',
    description:
      'VerifiedFix proposes a minimal, scoped patch (+8 lines / -3 lines) that binds document retrieval to the central authorization policy. Human approval is strictly required before application.',
    whyItMatters:
      'Automated scope validation checks that only allowlisted files are modified within a 25-line change budget, rejecting arbitrary execution.',
    actionHint: 'Inspect the Split/Unified diff and click "Approve & Apply" to apply the fix to the demo sandbox.',
  },
  {
    stageNumber: 5,
    stageName: 'VERIFY',
    path: '/verification',
    targetSelector: '[data-tour="verification-matrix"]',
    title: 'Stage 5 — Authoritative Empirical Verification',
    description:
      'The AI is NEVER allowed to declare its own patch verified. We execute a repeatable 10-point test matrix against the secured target to prove Bob is blocked while legitimate workflows work.',
    whyItMatters:
      'Verification status is calculated strictly from empirical test results. If any test fails, the fix is rejected.',
    actionHint: 'Click "Execute Verification Suite" to run the test matrix and observe Bob blocked with HTTP 403 Forbidden.',
  },
  {
    stageNumber: 6,
    stageName: 'REPORT',
    path: '/reports',
    targetSelector: '[data-tour="report-dossier"]',
    title: 'Stage 6 — Certified Verification Dossier & Audit Seal',
    description:
      'Compile an authoritative audit report documenting the initial exploit, proposed patch, reviewer signature, empirical test results, and a SHA-256 integrity digest.',
    whyItMatters:
      'Auditors and security leads can verify that the reported findings and test results have not been altered.',
    actionHint: 'Review the report, export the JSON artifact, or print a PDF summary.',
  },
];

interface TourContextType {
  isTourActive: boolean;
  currentStepIndex: number;
  currentStep: TourStep;
  startTour: (stepIndex?: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  exitTour: () => void;
  jumpToStep: (stepIndex: number) => void;
  resetTourProgress: () => void;
  isTourComplete: boolean;
  setIsTourComplete: (complete: boolean) => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isTourActive, setIsTourActive] = useState<boolean>(() => {
    return localStorage.getItem('verifiedfix_tour_active') === 'true';
  });

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(() => {
    const saved = localStorage.getItem('verifiedfix_tour_step');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [isTourComplete, setIsTourComplete] = useState<boolean>(false);

  useEffect(() => {
    if (isTourActive) {
      localStorage.setItem('verifiedfix_tour_active', 'true');
      localStorage.setItem('verifiedfix_tour_step', currentStepIndex.toString());
      
      const step = TOUR_STEPS[currentStepIndex];
      if (step && location.pathname !== step.path) {
        navigate(step.path);
      }
    } else {
      localStorage.removeItem('verifiedfix_tour_active');
    }
  }, [isTourActive, currentStepIndex]);

  const startTour = (stepIndex = 0) => {
    setIsTourComplete(false);
    setCurrentStepIndex(stepIndex);
    setIsTourActive(true);
    localStorage.setItem('verifiedfix_tour_active', 'true');
    localStorage.setItem('verifiedfix_tour_step', stepIndex.toString());
    const step = TOUR_STEPS[stepIndex];
    if (step && location.pathname !== step.path) {
      navigate(step.path);
    }
  };

  const nextStep = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      const step = TOUR_STEPS[nextIdx];
      if (step && location.pathname !== step.path) {
        navigate(step.path);
      }
    } else {
      setIsTourComplete(true);
      setIsTourActive(false);
      localStorage.removeItem('verifiedfix_tour_active');
      localStorage.removeItem('verifiedfix_tour_step');
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      const step = TOUR_STEPS[prevIdx];
      if (step && location.pathname !== step.path) {
        navigate(step.path);
      }
    }
  };

  const jumpToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < TOUR_STEPS.length) {
      setCurrentStepIndex(stepIndex);
      setIsTourActive(true);
      const step = TOUR_STEPS[stepIndex];
      if (step && location.pathname !== step.path) {
        navigate(step.path);
      }
    }
  };

  const skipTour = () => {
    setIsTourActive(false);
    setIsTourComplete(false);
    localStorage.removeItem('verifiedfix_tour_active');
    localStorage.removeItem('verifiedfix_tour_step');
  };

  const exitTour = () => {
    setIsTourActive(false);
    setIsTourComplete(false);
    localStorage.removeItem('verifiedfix_tour_active');
  };

  const resetTourProgress = () => {
    setIsTourActive(false);
    setIsTourComplete(false);
    setCurrentStepIndex(0);
    localStorage.removeItem('verifiedfix_tour_active');
    localStorage.removeItem('verifiedfix_tour_step');
  };

  const currentStep = TOUR_STEPS[currentStepIndex] || TOUR_STEPS[0];

  return (
    <TourContext.Provider
      value={{
        isTourActive,
        currentStepIndex,
        currentStep,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        exitTour,
        jumpToStep,
        resetTourProgress,
        isTourComplete,
        setIsTourComplete,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};
