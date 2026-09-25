import React from 'react';
import { ToastNotification } from '../../types';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        let IconComponent = CheckCircle2;
        let iconColor = 'text-emerald-400';
        let borderColor = 'border-emerald-500/30';
        let bgGradient = 'from-emerald-950/40 to-slate-900/90';

        if (toast.type === 'error') {
          IconComponent = AlertCircle;
          iconColor = 'text-blue-400';
          borderColor = 'border-blue-500/30';
          bgGradient = 'from-blue-950/40 to-slate-900/90';
        } else if (toast.type === 'warning') {
          IconComponent = AlertTriangle;
          iconColor = 'text-amber-400';
          borderColor = 'border-red-500/30';
          bgGradient = 'from-amber-950/40 to-slate-900/90';
        } else if (toast.type === 'info') {
          IconComponent = Info;
          iconColor = 'text-sky-400';
          borderColor = 'border-sky-500/30';
          bgGradient = 'from-sky-950/40 to-slate-900/90';
        }

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto flex items-start gap-3 p-6 rounded-xl bg-gradient-to-r ${bgGradient} backdrop-blur-2xl border ${borderColor} shadow-2xl shadow-black/50 text-slate-100 transition-all duration-300 animate-in slide-in-from-bottom-3`}
          >
            <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-medium text-slate-100">{toast.title}</h4>
              {toast.message && <p className="text-sm text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>}
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    onDismiss(toast.id);
                  }}
                  className="mt-2 text-sm font-semibold text-blue-300 hover:text-blue-200 underline underline-offset-2 transition-colors cursor-pointer"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="p-1 rounded-lg text-white/50 hover:text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
