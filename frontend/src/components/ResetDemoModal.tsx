import React from 'react';
import { RotateCcw, X, AlertTriangle } from 'lucide-react';

interface ResetDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export const ResetDemoModal: React.FC<ResetDemoModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#202521] border border-[#39433B] rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-[#F1F0E8] space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#A6B0A7] hover:text-[#F1F0E8] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#F28B69]/15 border border-[#F28B69]/30 text-[#F28B69]">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F1F0E8]">Reset Demonstration Baseline?</h3>
            <p className="text-xs text-[#F28B69]">Restores intentionally vulnerable initial state</p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-[#A6B0A7] leading-relaxed bg-[#282E29] p-4 rounded-xl border border-[#39433B]">
          <p className="font-semibold text-[#F1F0E8]">This will reset your local demo environment:</p>
          <ul className="list-disc pl-4 space-y-1.5">
            <li>Re-seeds demo accounts: <strong className="text-[#F1F0E8]">Alice (Owner), Bob (Attacker), Carol (Shared), Admin</strong>.</li>
            <li>Restores private Document #12 and resets access control to <strong className="text-[#F28B69]">Vulnerable Baseline</strong>.</li>
            <li>Resets scan and verification records so you can run the live demo from Step 1.</li>
          </ul>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-[#A6B0A7] hover:text-[#F1F0E8] bg-[#282E29] hover:bg-[#343B35] rounded-xl border border-[#39433B] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#171A18] bg-[#F28B69] hover:bg-[#e07755] rounded-xl shadow-lg transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <span className="animate-spin w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
            <span>Confirm Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
