"use client";

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type ToastTone = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastContextValue {
  push: (toast: { tone: ToastTone; title: string; description?: string }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<ToastTone, { className: string; Icon: typeof CheckCircle2 }> = {
  success: { className: "border-leaf-200 bg-leaf-50 text-leaf-900", Icon: CheckCircle2 },
  error: { className: "border-red-200 bg-red-50 text-red-900", Icon: XCircle },
  warning: { className: "border-amber-200 bg-amber-50 text-amber-900", Icon: AlertTriangle },
  info: { className: "border-clay-200 bg-clay-50 text-clay-900", Icon: Info },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    ({ tone, title, description }: { tone: ToastTone; title: string; description?: string }) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [...prev, { id, tone, title, description }].slice(-4));
      setTimeout(() => remove(id), 5200);
    },
    [remove],
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[70] flex flex-col gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-96">
        {toasts.map((toast) => {
          const { className, Icon } = toneStyles[toast.tone];
          return (
            <div
              key={toast.id}
              className={`ts-animate-in pointer-events-auto flex items-start gap-3 rounded-xl border p-3 shadow-lg ${className}`}
            >
              <Icon className="mt-0.5 size-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-0.5 text-xs leading-relaxed opacity-90">{toast.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => remove(toast.id)}
                className="rounded-md p-1 opacity-60 transition hover:opacity-100"
                aria-label="Tutup notifikasi"
              >
                <X className="size-4" />
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
  if (!ctx) return { push: () => undefined };
  return ctx;
}
