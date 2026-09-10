import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-indigo-400 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/30 bg-[#08090E]/95',
    error: 'border-rose-500/30 bg-[#08090E]/95',
    warning: 'border-amber-500/30 bg-[#08090E]/95',
    info: 'border-indigo-500/30 bg-[#08090E]/95',
  };

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl border ${borders[toast.type]} text-white shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-0`}
    >
      <div className="flex items-center gap-3">
        {icons[toast.type]}
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-zinc-400 hover:text-white p-1 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
