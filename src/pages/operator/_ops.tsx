/**
 * Operator portal (part 1), page-local helpers: a tiny session store for jobs
 * (so a stop completed on the job screen shows on Today, Jobs and Routes), and a
 * few operator-specific display pieces composed from the kit.
 */
import { useSyncExternalStore, type ReactNode } from "react";
import { Check, Phone } from "lucide-react";
import { Badge, Button, useToast } from "@/components/ui";
import { cn } from "@/lib/cn";
import { DEMO_NOW, formatDate } from "@/lib/format";
import { JOBS, SLATE_RELAY, type Job } from "./_opsData";

/* ------------------------------------------------------------------ */
/* Jobs store                                                          */
/* ------------------------------------------------------------------ */

let jobsState: Job[] = JOBS;
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const emit = () => listeners.forEach((l) => l());

export function useJobs(): Job[] {
  return useSyncExternalStore(subscribe, () => jobsState, () => jobsState);
}
export function updateJob(id: string, patch: Partial<Job>) {
  jobsState = jobsState.map((j) => (j.id === id ? { ...j, ...patch } : j));
  emit();
}
export function updateJobs(ids: string[], patch: Partial<Job>) {
  const set = new Set(ids);
  jobsState = jobsState.map((j) => (set.has(j.id) ? { ...j, ...patch } : j));
  emit();
}
export function replaceRouteOrder(routeId: string, orderedIds: string[]) {
  const pos = new Map(orderedIds.map((id, i) => [id, i + 1]));
  jobsState = jobsState.map((j) => (j.routeId === routeId && pos.has(j.id) ? { ...j, stop: pos.get(j.id) } : j));
  emit();
}

/** Live-ish statuses first, then what needs action, then the rest. */
export const STATUS_ORDER: Record<Job["status"], number> = { Arrived: 0, "En route": 1, Failed: 2, Scheduled: 3, Completed: 4, Cancelled: 5 };

/* ------------------------------------------------------------------ */
/* Display pieces                                                      */
/* ------------------------------------------------------------------ */

/** Route progress: collected (ink) + failed (danger) over the day's stops. Status carries a word beside it. */
export function RouteProgress({ done, failed, total, className, size = "md" }: { done: number; failed: number; total: number; className?: string; size?: "sm" | "md" }) {
  const pctDone = (done / Math.max(1, total)) * 100;
  const pctFail = (failed / Math.max(1, total)) * 100;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-label={`${done} of ${total} collected, ${failed} failed`}
      className={cn("flex w-full overflow-hidden rounded-full bg-sunken", size === "md" ? "h-2.5" : "h-1.5", className)}
    >
      <span className="h-full bg-ink transition-[width] duration-700 ease-[var(--ease-out-quart)]" style={{ width: `${pctDone}%` }} />
      {failed > 0 && <span className="h-full border-l-2 border-surface bg-danger" style={{ width: `calc(${pctFail}% + 2px)` }} />}
    </div>
  );
}

/** Weekday + date stacked tile, as on the customer home. */
export function DateTile({ date, active, className }: { date: string | Date; active?: boolean; className?: string }) {
  const d = typeof date === "string" ? new Date(date) : date;
  return (
    <div className={cn("flex w-12 shrink-0 flex-col items-center rounded-md py-1.5", active ? "bg-slate text-slate-ink dark:bg-stone dark:text-ink" : "bg-sunken", className)}>
      <span className={cn("t-micro uppercase", active ? "opacity-75" : "text-ink-3")}>{d.toLocaleDateString("en-GB", { weekday: "short" })}</span>
      <span className={cn("font-display text-[20px] font-bold leading-none tnum", !active && "text-ink")}>{d.getDate()}</span>
    </div>
  );
}

/** Stop number chip for route order. */
export function StopNumber({ n, state = "upcoming", className }: { n: number | string; state?: "done" | "failed" | "current" | "upcoming"; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-md font-display text-[15px] font-bold tnum",
        state === "done" && "bg-sunken text-ink-3",
        state === "failed" && "bg-danger-bg text-danger",
        state === "current" && "bg-signal text-signal-ink",
        state === "upcoming" && "border border-line-strong bg-surface text-ink",
        className,
      )}
      aria-label={typeof n === "number" ? `Stop ${n}` : undefined}
    >
      {state === "done" ? <Check className="size-4" strokeWidth={2.5} /> : n}
    </span>
  );
}

export const stopState = (j: Job): "done" | "failed" | "current" | "upcoming" =>
  j.status === "Completed" ? "done" : j.status === "Failed" ? "failed" : j.status === "Arrived" || j.status === "En route" ? "current" : "upcoming";

/** Days until a yyyy-mm-dd date from the demo clock. */
export const daysUntil = (iso: string) => Math.ceil((new Date(`${iso}T00:00:00+01:00`).getTime() - DEMO_NOW.getTime()) / 86400000);

/** Document expiry badge, word + date, never colour alone. */
export function ExpiryBadge({ date, soonDays = 30 }: { date: string; soonDays?: number }) {
  const d = daysUntil(date);
  if (d < 0) return <Badge tone="danger" dot>Expired {formatDate(date)}</Badge>;
  if (d <= soonDays) return <Badge tone="warning" dot>{d === 0 ? "Expires today" : `Expires in ${d} days`}</Badge>;
  return <Badge tone="success" dot>Valid to {formatDate(date).replace(/^\d+ /, "")}</Badge>;
}
export const expiryTone = (date: string, soonDays = 30) => {
  const d = daysUntil(date);
  return d < 0 ? "expired" : d <= soonDays ? "expiring" : "valid";
};

/** Call the customer through Slate's masked relay, operators never see customer numbers. */
export function CallViaSlate({ ext, name, block, size = "md", variant = "outline" }: { ext: string; name: string; block?: boolean; size?: "md" | "lg"; variant?: "outline" | "secondary" }) {
  const toast = useToast();
  return (
    <Button
      variant={variant}
      size={size}
      block={block}
      leading={<Phone className="size-4" />}
      onClick={() => {
        toast.info(`Connecting you to ${name.split(" ")[0]} via Slate`, `${SLATE_RELAY}, extension ${ext}. Calls are recorded for quality.`);
        try {
          window.location.href = `tel:${SLATE_RELAY.replace(/\s/g, "")},${ext}`;
        } catch {
          /* tel: not supported */
        }
      }}
    >
      Call via Slate
    </Button>
  );
}

/** A small labelled figure for compact strips. */
export function Figure({ label, value, hint, tone }: { label: ReactNode; value: ReactNode; hint?: ReactNode; tone?: "danger" | "warning" }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="t-micro text-ink-3">{label}</span>
      <span className={cn("font-display text-[22px] font-bold leading-tight tracking-[-0.02em] tnum", tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "text-ink")}>{value}</span>
      {hint && <span className="t-small text-ink-3">{hint}</span>}
    </div>
  );
}

/** Coordinates captured with completion evidence. */
export const CAPTURED_AT = { lat: "5.0377° N", lng: "7.9128° E", accuracy: "±8 m" };

/* ------------------------------------------------------------------ */
/* Today's route maths                                                 */
/* ------------------------------------------------------------------ */

export interface RouteStat {
  total: number;
  done: number;
  failed: number;
  remaining: number;
  current?: Job;
  next?: Job;
  jobs: Job[];
}
export function routeStat(jobs: Job[], routeId: string): RouteStat {
  const list = jobs.filter((j) => j.routeId === routeId && j.stop && j.status !== "Cancelled" && isTodayIso(j.date)).sort((a, b) => a.stop! - b.stop!);
  const done = list.filter((j) => j.status === "Completed").length;
  const failed = list.filter((j) => j.status === "Failed").length;
  const live = list.filter((j) => j.status === "Arrived" || j.status === "En route");
  return {
    total: list.length,
    done,
    failed,
    remaining: list.length - done - failed,
    current: live[0],
    next: live[1] ?? list.find((j) => j.status === "Scheduled"),
    jobs: list,
  };
}
const todayKey = new Date(DEMO_NOW).toDateString();
/** The demo's wall-clock time in Uyo: 08:12. */
export const NOW_MINUTES = 8 * 60 + 12;
export const isTodayIso = (iso: string) => new Date(iso).toDateString() === todayKey;

/** Window end has passed at the demo clock but the stop isn't done. */
export function isLate(j: Job): boolean {
  if (!isTodayIso(j.date) || !["Scheduled", "En route", "Arrived"].includes(j.status)) return false;
  const [h, m] = j.window.split("–")[1]!.split(":").map(Number);
  return h! * 60 + m! <= NOW_MINUTES;
}
