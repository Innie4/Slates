import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Tone = "neutral" | "slate" | "success" | "warning" | "danger" | "info" | "signal" | "outline";

const tones: Record<Tone, string> = {
  neutral: "bg-sunken text-ink-2",
  slate: "bg-slate text-slate-ink",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  info: "bg-info-bg text-info",
  signal: "bg-signal-soft text-[color:var(--signal-hover)] dark:text-signal",
  outline: "border border-line-strong text-ink-2",
};

const dots: Record<Tone, string> = {
  neutral: "bg-ink-3",
  slate: "bg-slate-ink",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  signal: "bg-signal",
  outline: "bg-ink-3",
};

export interface BadgeProps {
  tone?: Tone;
  dot?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md";
}

/** Squared stone chip, status is always a word, never colour alone. */
export function Badge({ tone = "neutral", dot, icon, children, className, size = "sm" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-sm font-medium",
        size === "sm" ? "h-6 px-2 text-[12px]" : "h-7 px-2.5 text-[13px]",
        tones[tone],
        "[&_svg]:size-3.5",
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dots[tone])} aria-hidden />}
      {icon}
      {children}
    </span>
  );
}

/** Maps every domain status in the platform to a tone. Unknown statuses fall back to neutral. */
const STATUS_TONES: Record<string, Tone> = {
  // positive
  active: "success", completed: "success", collected: "success", paid: "success", successful: "success", success: "success",
  approved: "success", resolved: "success", verified: "success", accepted: "success", delivered: "success", funded: "success",
  "on time": "success", healthy: "success", live: "success", renewed: "success", released: "success", online: "success", met: "success",
  // in motion
  scheduled: "info", upcoming: "info", "in progress": "info", "en route": "info", assigned: "info", investigating: "info",
  submitted: "info", "under review": "info", processing: "info", negotiation: "info", "sent to operator": "info", open: "info", new: "info",
  sent: "info", "quote accepted": "info", arrived: "info", planned: "info", launching: "info", draft: "neutral", "internal review": "info",
  // needs attention
  pending: "warning", late: "warning", expiring: "warning", "expiring soon": "warning", waiting: "warning", paused: "warning",
  "more information required": "warning", "quote pending": "warning", "renewal approaching": "warning", overdue: "warning",
  partial: "warning", retrying: "warning", "at risk": "warning", "sla warning": "warning", flagged: "warning", "due soon": "warning",
  // negative
  missed: "danger", failed: "danger", rejected: "danger", suspended: "danger", escalated: "danger", declined: "danger",
  terminated: "danger", expired: "danger", chargeback: "danger", breached: "danger", "sla breach": "danger", critical: "danger",
  unpaid: "danger", offline: "danger", lost: "danger",
  // neutral
  cancelled: "neutral", closed: "neutral", refunded: "neutral", inactive: "neutral", archived: "neutral", hidden: "neutral",
  "not started": "neutral", unavailable: "neutral", disputed: "warning", won: "success",
};

export function statusTone(status: string): Tone {
  return STATUS_TONES[status.toLowerCase()] ?? "neutral";
}

export function StatusBadge({ status, className, size }: { status: string; className?: string; size?: "sm" | "md" }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <Badge tone={statusTone(status)} dot className={className} size={size}>
      {label}
    </Badge>
  );
}

/** Small live/unread dot in signal orange */
export function LiveDot({ className, pulse = true }: { className?: string; pulse?: boolean }) {
  return (
    <span className={cn("relative inline-flex size-2.5", className)} aria-hidden>
      {pulse && <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal opacity-60" />}
      <span className="relative inline-flex size-2.5 rounded-full bg-signal" />
    </span>
  );
}
