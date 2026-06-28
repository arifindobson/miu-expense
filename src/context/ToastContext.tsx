import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
interface Toast { id: number; kind: ToastKind; message: string; }

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const KIND_STYLES: Record<ToastKind, { ring: string; icon: typeof Info; iconColor: string }> = {
  success: { ring: 'border-emerald-200', icon: CheckCircle2, iconColor: 'text-emerald-500' },
  error: { ring: 'border-rose-200', icon: AlertCircle, iconColor: 'text-rose-500' },
  info: { ring: 'border-slate-200', icon: Info, iconColor: 'text-slate-500' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((tt) => tt.id !== id));
  }, []);

  const toast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => remove(id), 3500);
  }, [remove]);

  const value: ToastContextValue = {
    toast,
    success: useCallback((m: string) => toast(m, 'success'), [toast]),
    error: useCallback((m: string) => toast(m, 'error'), [toast]),
    info: useCallback((m: string) => toast(m, 'info'), [toast]),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast stack — anchored within the phone frame */}
      <div role="status" aria-live="polite" className="pointer-events-none absolute inset-x-0 top-0 z-[90] flex flex-col items-center gap-2 px-4 pt-3 pt-safe">
        {toasts.map((tt) => {
          const s = KIND_STYLES[tt.kind];
          const Icon = s.icon;
          return (
            <div
              key={tt.id}
              className={`pointer-events-auto flex w-full max-w-[360px] items-center gap-2.5 rounded-2xl border ${s.ring} bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur animate-in slide-in-from-top-2 duration-200`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${s.iconColor}`} />
              <span className="min-w-0 flex-1 text-xs font-semibold text-slate-700">{tt.message}</span>
              <button onClick={() => remove(tt.id)} className="shrink-0 rounded-full p-0.5 text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
