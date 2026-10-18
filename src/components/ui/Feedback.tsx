import type { ReactNode } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  Loader2,
  WifiOff,
  Lock,
  SearchX,
  MapPinOff,
  Clock,
  PauseCircle,
  Ban,
  CalendarX,
  Inbox,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Strata } from "@/components/brand/Strata";

/* ------------------------------------------------------------------ */
/* Alert / Banner                                                      */
/* ------------------------------------------------------------------ */

export function Alert({
  tone = "info",
  title,
  children,
  action,
  onDismiss,
  className,
  icon,
}: {
  tone?: "info" | "success" | "warning" | "danger" | "neutral" | "signal";
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
  icon?: ReactNode;
}) {
  const Icon = { info: Info, success: CheckCircle2, warning: AlertTriangle, danger: AlertCircle, neutral: Info, signal: AlertCircle }[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-md px-4 py-3.5",
        tone === "info" && "bg-info-bg text-info",
        tone === "success" && "bg-success-bg text-success",
        tone === "warning" && "bg-warning-bg text-warning",
        tone === "danger" && "bg-danger-bg text-danger",
        tone === "neutral" && "bg-sunken text-ink-2",
        tone === "signal" && "bg-signal text-signal-ink",
        className,
      )}
    >
      <span className="mt-0.5 shrink-0 [&_svg]:size-[18px]">{icon ?? <Icon />}</span>
      <div className="min-w-0 flex-1">
        {title && <p className="t-small font-semibold">{title}</p>}
        {children && <div className={cn("t-small", title && "mt-0.5", tone !== "signal" && "text-ink-2")}>{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="shrink-0 opacity-60 hover:opacity-100">
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
  art = true,
  compact,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
  art?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center", compact ? "gap-3 py-8" : "gap-4 py-14", className)}>
      {art && !icon && (
        <div className="relative h-20 w-32 overflow-hidden rounded-md">
          <Strata tone="on-light" bands={3} seed={11} chalk={false} className="absolute inset-0 h-full w-full opacity-70" />
        </div>
      )}
      {icon && <span className="flex size-12 items-center justify-center rounded-md bg-sunken text-ink-2 [&_svg]:size-6">{icon}</span>}
      <div className="flex max-w-sm flex-col gap-1.5">
        <h3 className="t-h2 text-ink">{title}</h3>
        {description && <p className="t-body text-ink-2">{description}</p>}
      </div>
      {action && <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* StateView, every important system state (Part L)                  */
/* ------------------------------------------------------------------ */

export type SystemState =
  | "loading"
  | "empty"
  | "error"
  | "success"
  | "pending"
  | "failed"
  | "cancelled"
  | "suspended"
  | "expired"
  | "offline"
  | "unauthorized"
  | "not-found"
  | "service-unavailable";

const STATE_META: Record<SystemState, { icon: typeof Info; title: string; description: string; tone: string }> = {
  loading: { icon: Loader2, title: "Loading", description: "Fetching the latest from Slate.", tone: "text-ink-2 bg-sunken" },
  empty: { icon: Inbox, title: "Nothing here yet", description: "When there is activity, it will appear here.", tone: "text-ink-2 bg-sunken" },
  error: { icon: AlertCircle, title: "Something went wrong", description: "We couldn't load this. Check your connection and try again.", tone: "text-danger bg-danger-bg" },
  success: { icon: CheckCircle2, title: "Done", description: "Your request was completed.", tone: "text-success bg-success-bg" },
  pending: { icon: Clock, title: "Submitted and pending", description: "We've received this and will update you once it's complete.", tone: "text-warning bg-warning-bg" },
  failed: { icon: XCircle, title: "That didn't go through", description: "The action failed. Nothing was charged or changed.", tone: "text-danger bg-danger-bg" },
  cancelled: { icon: Ban, title: "Cancelled", description: "This action was cancelled.", tone: "text-ink-2 bg-sunken" },
  suspended: { icon: PauseCircle, title: "Temporarily suspended", description: "This account or service is paused. Contact support to restore it.", tone: "text-warning bg-warning-bg" },
  expired: { icon: CalendarX, title: "Expired", description: "This card, document or contract has expired and needs to be renewed.", tone: "text-warning bg-warning-bg" },
  offline: { icon: WifiOff, title: "You're offline", description: "We'll reconnect automatically. Changes you make will sync when you're back.", tone: "text-ink-2 bg-sunken" },
  unauthorized: { icon: Lock, title: "You don't have access", description: "Ask an admin on your account to give you permission.", tone: "text-ink-2 bg-sunken" },
  "not-found": { icon: SearchX, title: "We couldn't find that", description: "It may have been moved or deleted.", tone: "text-ink-2 bg-sunken" },
  "service-unavailable": { icon: MapPinOff, title: "Slate doesn't serve this area yet", description: "We're live in Uyo and expanding. We'll tell you the day we arrive.", tone: "text-ink-2 bg-sunken" },
};

export function StateView({
  state,
  title,
  description,
  action,
  className,
  compact,
}: {
  state: SystemState;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  const m = STATE_META[state];
  const Icon = m.icon;
  return (
    <div className={cn("flex flex-col items-center text-center", compact ? "gap-3 py-8" : "gap-4 py-14", className)} role={state === "error" || state === "failed" ? "alert" : "status"}>
      <span className={cn("flex size-12 items-center justify-center rounded-md", m.tone)}>
        <Icon className={cn("size-6", state === "loading" && "animate-spin")} />
      </span>
      <div className="flex max-w-sm flex-col gap-1.5">
        <h3 className="t-h2 text-ink">{title ?? m.title}</h3>
        <p className="t-body text-ink-2">{description ?? m.description}</p>
      </div>
      {action && <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Skeletons, spinner, progress                                        */
/* ------------------------------------------------------------------ */

export function Skeleton({ className }: { className?: string }) {
  return (
    <span className={cn("relative block overflow-hidden rounded-sm bg-sunken", className)} aria-hidden>
      <span className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/5" />
    </span>
  );
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col divide-y divide-line" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-4">
          <Skeleton className="size-10 rounded-md" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-5 animate-spin text-ink-3", className)} aria-label="Loading" />;
}

export function ProgressBar({
  value,
  max = 100,
  tone = "slate",
  className,
  label,
  size = "md",
}: {
  value: number;
  max?: number;
  tone?: "slate" | "signal" | "success" | "warning" | "danger";
  className?: string;
  label?: string;
  size?: "sm" | "md";
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cn("w-full overflow-hidden rounded-full bg-sunken", size === "md" ? "h-2" : "h-1.5", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-700 ease-[var(--ease-out-quart)]",
          tone === "slate" && "bg-slate dark:bg-slate-300",
          tone === "signal" && "bg-signal",
          tone === "success" && "bg-success",
          tone === "warning" && "bg-warning",
          tone === "danger" && "bg-danger",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Segmented meter, e.g. SLA score, verification steps */
export function Meter({ value, segments = 10, className }: { value: number; segments?: number; className?: string }) {
  const filled = Math.round((value / 100) * segments);
  return (
    <div className={cn("flex gap-1", className)} aria-label={`${value}%`}>
      {Array.from({ length: segments }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-2 flex-1 rounded-[2px]",
            i < filled ? (value >= 90 ? "bg-success" : value >= 75 ? "bg-slate dark:bg-slate-300" : value >= 60 ? "bg-warning" : "bg-danger") : "bg-sunken",
          )}
        />
      ))}
    </div>
  );
}
