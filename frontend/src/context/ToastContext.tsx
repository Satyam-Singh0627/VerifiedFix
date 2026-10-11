import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

export interface ToastContextType {
  addToast: (arg1: ToastType | string, arg2?: string, arg3?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (arg1: ToastType | string, arg2?: string, arg3?: string) => {
    let type: ToastType = 'info';
    let title = '';
    let message: string | undefined = undefined;

    const validTypes: ToastType[] = ['success', 'error', 'warning', 'info'];

    if (validTypes.includes(arg1 as ToastType)) {
      // Called as: addToast(type, title, message)
      type = arg1 as ToastType;
      title = arg2 || '';
      message = arg3;
    } else {
      // Called as: addToast(title/message, type)
      title = arg1;
      if (arg2 && validTypes.includes(arg2 as ToastType)) {
        type = arg2 as ToastType;
      }
      message = arg3;
    }

    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-[#54D6BE] shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-[#F28B69] shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-[#E9BC65] shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-[#B8F36B] shrink-0" />;
    }
  };

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-[#54D6BE]/40 bg-[#202521]';
      case 'error':
        return 'border-[#F28B69]/40 bg-[#202521]';
      case 'warning':
        return 'border-[#E9BC65]/40 bg-[#202521]';
      default:
        return 'border-[#39433B] bg-[#202521]';
    }
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl border shadow-2xl flex items-start justify-between gap-3 text-xs text-[#F1F0E8] animate-fade-in ${getBorderColor(
              toast.type
            )}`}
          >
            <div className="flex items-start gap-2.5">
              {getIcon(toast.type)}
              <div>
                <div className="font-semibold">{toast.title}</div>
                {toast.message && (
                  <div className="text-[#A6B0A7] text-[11px] mt-0.5 leading-relaxed">
                    {toast.message}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#A6B0A7] hover:text-[#F1F0E8] transition-colors p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
