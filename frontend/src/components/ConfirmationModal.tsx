import React from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  message?: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  confirmVariant?: 'danger' | 'warning' | 'primary' | string;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  message,
  confirmLabel,
  confirmText,
  cancelLabel = 'Cancel',
  isDestructive = false,
  confirmVariant,
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const descText = description || message || '';
  const btnLabel = confirmLabel || confirmText || 'Confirm';
  const isDanger = isDestructive || confirmVariant === 'danger';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#202521] border border-[#39433B] rounded-2xl max-w-md w-full p-6 shadow-2xl text-[#F1F0E8] relative space-y-4">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-[#A6B0A7] hover:text-[#F1F0E8] transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isDanger
                ? 'bg-[#F28B69]/10 border-[#F28B69]/30 text-[#F28B69]'
                : 'bg-[#B8F36B]/10 border-[#B8F36B]/30 text-[#B8F36B]'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F1F0E8]">{title}</h3>
            <span className="text-[11px] text-[#A6B0A7]">Requires Explicit User Approval</span>
          </div>
        </div>

        <p className="text-xs text-[#A6B0A7] leading-relaxed bg-[#171A18] p-3.5 rounded-xl border border-[#39433B]">
          {descText}
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#282E29] hover:bg-[#39433B] text-[#A6B0A7] hover:text-[#F1F0E8] transition-colors border border-[#39433B]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
              isDanger
                ? 'bg-[#F28B69] hover:bg-[#F28B69]/90 text-[#171A18] shadow-[#F28B69]/20'
                : 'bg-[#B8F36B] hover:bg-[#B8F36B]/90 text-[#171A18] shadow-[#B8F36B]/20'
            }`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{btnLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
