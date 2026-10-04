import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastTone = "success" | "error" | "info" | "warning";
interface ToastItem {
  id: number;
  title: ReactNode;
  description?: ReactNode;
  tone: ToastTone;
  action?: { label: string; onClick: () => void };
}

interface ToastApi {
  toast: (t: Omit<ToastItem, "id" | "tone"> & { tone?: ToastTone; duration?: number }) => void;
  success: (title: ReactNode, description?: ReactNode) => void;
  error: (title: ReactNode, description?: ReactNode) => void;
  info: (title: ReactNode, description?: ReactNode) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const toast = useCallback<ToastApi["toast"]>(
    ({ duration = 4200, tone = "success", ...t }) => {
      const id = Date.now() + Math.random();
      setItems((xs) => [...xs.slice(-2), { id, tone, ...t }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );
  const api: ToastApi = {
    toast,
    success: (title, description) => toast({ title, description, tone: "success" }),
    error: (title, description) => toast({ title, description, tone: "error" }),
    info: (title, description) => toast({ title, description, tone: "info" }),
  };
  const icons = { success: CheckCircle2, error: AlertCircle, info: Info, warning: AlertTriangle };
  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 pb-[calc(env(safe-area-inset-bottom)+88px)] sm:items-end sm:pb-6 lg:pb-6" aria-live="polite">
          {items.map((t) => {
            const Icon = icons[t.tone];
            return (
              <div
                key={t.id}
                role="status"
                className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md bg-slate-950 px-4 py-3.5 text-white shadow-float animate-toast-in dark:bg-slate-100 dark:text-slate-950"
              >
                <Icon
                  className={cn(
                    "mt-0.5 size-[18px] shrink-0",
                    t.tone === "success" && "text-[#5fd3a5] dark:text-success",
                    t.tone === "error" && "text-[#ff8a7f] dark:text-danger",
                    t.tone === "warning" && "text-[#f2c065] dark:text-warning",
                    t.tone === "info" && "text-slate-300 dark:text-info",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium leading-snug">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-[13px] leading-snug opacity-75">{t.description}</p>}
                </div>
                {t.action && (
                  <button type="button" onClick={t.action.onClick} className="text-[13px] font-semibold text-signal">
                    {t.action.label}
                  </button>
                )}
                <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100">
                  <X className="size-4" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
