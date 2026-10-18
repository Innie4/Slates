/**
 * Admin, quality, insight and governance helpers (Complaints, Support, Reviews,
 * Community, Recycling, Analytics, Reports, Notifications, Marketing, Compliance,
 * Documents, Users, Roles, Audit log, Settings). Page-local; not a shared kit.
 */
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui";
import { DEMO_NOW } from "@/lib/format";
import { complaints, customers, myComplaints, operators, pickupById, type Complaint } from "@/data";

/* ------------------------------------------------------------------ */
/* Demo clock                                                          */
/* ------------------------------------------------------------------ */

const LOADED_AT = Date.now();
const HOUR = 3_600_000;
const MIN = 60_000;

/** The demo clock, advancing in real time from DEMO_NOW so SLA timers visibly tick. */
export function useNow(intervalMs = 15_000): Date {
  const [now, setNow] = useState(() => new Date(DEMO_NOW.getTime() + (Date.now() - LOADED_AT)));
  useEffect(() => {
    const t = setInterval(() => setNow(new Date(DEMO_NOW.getTime() + (Date.now() - LOADED_AT))), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export const hoursAgo = (h: number) => new Date(DEMO_NOW.getTime() - h * HOUR).toISOString();
export const hoursFromNow = (h: number) => new Date(DEMO_NOW.getTime() + h * HOUR).toISOString();
export const daysFromNow = (d: number) => new Date(DEMO_NOW.getTime() + d * 24 * HOUR).toISOString();
export const daysBetween = (a: string | Date, b: string | Date = DEMO_NOW) =>
  Math.round((new Date(a).getTime() - new Date(b).getTime()) / (24 * HOUR));

/** "4h 12m" / "38m" / "2d 3h" */
export function formatSpan(ms: number): string {
  const abs = Math.abs(ms);
  const d = Math.floor(abs / (24 * HOUR));
  const h = Math.floor((abs % (24 * HOUR)) / HOUR);
  const m = Math.max(0, Math.floor((abs % HOUR) / MIN));
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${Math.max(1, m)}m`;
}

/* ------------------------------------------------------------------ */
/* SLA                                                                 */
/* ------------------------------------------------------------------ */

export type SlaState = "running" | "due-soon" | "breached" | "paused" | "met" | "missed";

export function slaState(due: string, now: Date, opts: { done?: boolean; met?: boolean; paused?: boolean; windowMs?: number } = {}): { state: SlaState; ms: number } {
  const ms = new Date(due).getTime() - now.getTime();
  if (opts.done) return { state: opts.met === false ? "missed" : "met", ms };
  if (opts.paused) return { state: "paused", ms };
  if (ms < 0) return { state: "breached", ms };
  if (ms < (opts.windowMs ?? 2 * HOUR)) return { state: "due-soon", ms };
  return { state: "running", ms };
}

/** SLA countdown. Breached is the only red; due-soon is warning. */
export function SlaClock({
  due,
  done,
  met,
  paused,
  className,
  long,
}: {
  due: string;
  done?: boolean;
  met?: boolean;
  paused?: boolean;
  className?: string;
  /** Longer copy for detail views */
  long?: boolean;
}) {
  const now = useNow();
  const { state, ms } = slaState(due, now, { done, met, paused });
  const label = {
    running: `${formatSpan(ms)} left`,
    "due-soon": `${formatSpan(ms)} left`,
    breached: long ? `Breached ${formatSpan(ms)} ago` : `Breached ${formatSpan(ms)}`,
    paused: long ? "Paused while waiting" : "Paused",
    met: "Met",
    missed: "Missed",
  }[state];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap t-small font-medium tnum",
        state === "running" && "text-ink-2",
        state === "due-soon" && "text-warning",
        state === "breached" && "rounded-sm bg-danger-bg px-1.5 text-danger",
        state === "paused" && "text-ink-3",
        state === "met" && "text-success",
        state === "missed" && "text-danger",
        className,
      )}
    >
      {(state === "running" || state === "due-soon" || state === "breached") && (
        <span className={cn("size-1.5 rounded-full", state === "breached" ? "bg-danger" : state === "due-soon" ? "bg-warning" : "bg-ink-3")} aria-hidden />
      )}
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* URL params                                                          */
/* ------------------------------------------------------------------ */

/** A single search param as state (replace navigation, keeps others). */
export function useParam(key: string): [string | null, (v: string | null) => void] {
  const [params, setParams] = useSearchParams();
  const value = params.get(key);
  const set = useCallback(
    (v: string | null) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (v === null || v === "") next.delete(key);
          else next.set(key, v);
          return next;
        },
        { replace: true, preventScrollReset: true },
      );
    },
    [key, setParams],
  );
  return [value, set];
}

export function useMedia(query: string): boolean {
  const get = () => (typeof window !== "undefined" ? window.matchMedia(query).matches : false);
  const [match, setMatch] = useState(get);
  useEffect(() => {
    const m = window.matchMedia(query);
    const h = () => setMatch(m.matches);
    h();
    m.addEventListener("change", h);
    return () => m.removeEventListener("change", h);
  }, [query]);
  return match;
}

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

export type ExportFormat = "CSV" | "PDF" | "Print";

function toCsv(rows: Array<Record<string, string | number>>) {
  const headers = Object.keys(rows[0] ?? {});
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return [headers.map(esc).join(","), ...rows.map((r) => headers.map((h) => esc(r[h] ?? "")).join(","))].join("\n");
}

/** CSV downloads a real file; PDF is "prepared and emailed"; Print opens the print dialog. */
export function useExport() {
  const toast = useToast();
  return useCallback(
    (format: ExportFormat, name: string, rows: Array<Record<string, string | number>>) => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (format === "CSV") {
        try {
          const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" }));
          const a = document.createElement("a");
          a.href = url;
          a.download = `slate-${slug}-2026-10-05.csv`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1500);
        } catch {
          /* download blocked, toast still confirms */
        }
        toast.success(`${name} exported`, `${rows.length} rows · slate-${slug}-2026-10-05.csv`);
      } else if (format === "PDF") {
        toast.success(`${name} PDF is being prepared`, "It will be emailed to idara.umoh@slate.ng in a minute or two.");
      } else {
        toast.info(`Opening print view for ${name.toLowerCase()}`);
        setTimeout(() => window.print(), 300);
      }
    },
    [toast],
  );
}

/* ------------------------------------------------------------------ */
/* Staff & roles                                                       */
/* ------------------------------------------------------------------ */

export type RoleName =
  | "Super Admin"
  | "Operations Admin"
  | "Finance Admin"
  | "Customer Support"
  | "Partnership Manager"
  | "Compliance Admin"
  | "Analyst";

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: RoleName | string;
  status: "Active" | "Invited" | "Deactivated";
  mfa: boolean;
  lastActive: string;
  device: string;
}

export const STAFF: StaffUser[] = [
  { id: "usr-01", name: "Aniekan Etim", email: "aniekan.etim@slate.ng", role: "Super Admin", status: "Active", mfa: true, lastActive: hoursAgo(0.4), device: "Chrome · macOS" },
  { id: "usr-02", name: "Idara Umoh", email: "idara.umoh@slate.ng", role: "Operations Admin", status: "Active", mfa: true, lastActive: hoursAgo(0), device: "Chrome · macOS" },
  { id: "usr-03", name: "Ekaette Archibong", email: "ekaette.archibong@slate.ng", role: "Finance Admin", status: "Active", mfa: true, lastActive: hoursAgo(14), device: "Edge · Windows" },
  { id: "usr-04", name: "Utibe Ekanem", email: "utibe.ekanem@slate.ng", role: "Customer Support", status: "Active", mfa: true, lastActive: hoursAgo(0.2), device: "Chrome · Windows" },
  { id: "usr-05", name: "Emem Obot", email: "emem.obot@slate.ng", role: "Customer Support", status: "Active", mfa: true, lastActive: hoursAgo(1.1), device: "Safari · iOS" },
  { id: "usr-06", name: "Inemesit Ita", email: "inemesit.ita@slate.ng", role: "Customer Support", status: "Active", mfa: false, lastActive: hoursAgo(0.7), device: "Chrome · Android" },
  { id: "usr-07", name: "Itoro Effiong", email: "itoro.effiong@slate.ng", role: "Partnership Manager", status: "Active", mfa: true, lastActive: hoursAgo(20), device: "Chrome · macOS" },
  { id: "usr-08", name: "Mbuotidem Udoh", email: "mbuotidem.udoh@slate.ng", role: "Compliance Admin", status: "Active", mfa: true, lastActive: hoursAgo(26), device: "Firefox · Ubuntu" },
  { id: "usr-09", name: "Unwana Bassey", email: "unwana.bassey@slate.ng", role: "Analyst", status: "Active", mfa: false, lastActive: hoursAgo(50), device: "Chrome · Windows" },
  { id: "usr-10", name: "Nkoyo Edet", email: "nkoyo.edet@slate.ng", role: "Operations Admin", status: "Invited", mfa: false, lastActive: hoursAgo(30), device: "Not set" },
  { id: "usr-11", name: "Kufre Okon", email: "kufre.okon@slate.ng", role: "Finance Admin", status: "Deactivated", mfa: true, lastActive: hoursAgo(24 * 41), device: "Chrome · Windows" },
];

export const SUPPORT_AGENTS = ["Utibe Ekanem", "Emem Obot", "Inemesit Ita", "Idara Umoh"];

export const PERMISSION_ACTIONS = ["view", "create", "edit", "delete", "approve"] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export const RESOURCES = [
  { key: "customers", label: "Customers" },
  { key: "operators", label: "Operators" },
  { key: "pickups", label: "Pickups & routes" },
  { key: "contracts", label: "Contracts" },
  { key: "payments", label: "Payments" },
  { key: "payouts", label: "Payouts & refunds" },
  { key: "complaints", label: "Complaints & support" },
  { key: "community", label: "Community projects" },
  { key: "recycling", label: "Recycling" },
  { key: "analytics", label: "Analytics & reports" },
  { key: "messaging", label: "Notifications & marketing" },
  { key: "compliance", label: "Compliance & documents" },
  { key: "users", label: "Users & roles" },
  { key: "settings", label: "System settings" },
] as const;
export type ResourceKey = (typeof RESOURCES)[number]["key"];
export type PermissionMatrix = Record<ResourceKey, PermissionAction[]>;

const ALL: PermissionAction[] = ["view", "create", "edit", "delete", "approve"];
const V: PermissionAction[] = ["view"];
const VCE: PermissionAction[] = ["view", "create", "edit"];
const VCEA: PermissionAction[] = ["view", "create", "edit", "approve"];
const NONE: PermissionAction[] = [];

function matrix(over: Partial<PermissionMatrix>, base: PermissionAction[] = NONE): PermissionMatrix {
  return Object.fromEntries(RESOURCES.map((r) => [r.key, over[r.key] ?? base])) as PermissionMatrix;
}

export interface RoleDef {
  name: string;
  scope: string;
  description: string;
  system: boolean;
  permissions: PermissionMatrix;
}

export const ROLE_DEFS: RoleDef[] = [
  { name: "Super Admin", scope: "Everything", description: "Full access, including users, roles and system settings. Keep this to two people.", system: true, permissions: matrix({}, ALL) },
  {
    name: "Operations Admin",
    scope: "Operations & operators",
    description: "Runs daily collection: pickups, routes, operators and complaints.",
    system: true,
    permissions: matrix({ customers: VCE, operators: VCEA, pickups: ALL, contracts: V, payments: V, complaints: VCEA, community: V, recycling: VCE, analytics: V, messaging: ["view", "create"], compliance: V }),
  },
  {
    name: "Finance Admin",
    scope: "Payments & finance",
    description: "Payments, payouts, refunds, invoices and chargebacks.",
    system: true,
    permissions: matrix({ customers: V, operators: V, contracts: V, payments: VCEA, payouts: VCEA, community: ["view", "approve"], recycling: V, analytics: V, compliance: V }),
  },
  {
    name: "Customer Support",
    scope: "Customers & complaints",
    description: "Customer accounts, complaints, tickets and service notifications.",
    system: true,
    permissions: matrix({ customers: VCE, operators: V, pickups: V, payments: V, complaints: VCE, community: V, messaging: V }),
  },
  {
    name: "Partnership Manager",
    scope: "Operators & contracts",
    description: "Operator onboarding, contracts and partner relationships.",
    system: true,
    permissions: matrix({ customers: V, operators: VCE, pickups: V, contracts: VCEA, recycling: VCE, analytics: V, compliance: V }),
  },
  {
    name: "Compliance Admin",
    scope: "Verification & compliance",
    description: "Operator verification, documents, data requests and audit records.",
    system: true,
    permissions: matrix({ customers: V, operators: ["view", "approve"], contracts: V, payments: V, compliance: ALL, users: V, analytics: V }),
  },
  { name: "Analyst", scope: "Read-only analytics", description: "Reads analytics and reports. Cannot change anything.", system: true, permissions: matrix({ analytics: V, customers: V, operators: V, pickups: V, payments: V }) },
];

/* ------------------------------------------------------------------ */
/* Lookups                                                             */
/* ------------------------------------------------------------------ */

export const customerIdByName = (name: string) => customers.find((c) => c.name === name)?.id;
export const operatorIdByName = (name: string) => operators.find((o) => o.short === name || o.name === name)?.id;

/* ------------------------------------------------------------------ */
/* Complaints, admin queue with believable SLA clocks                 */
/* ------------------------------------------------------------------ */

export const SLA_HOURS: Record<Complaint["severity"], number> = { Critical: 4, High: 12, Medium: 24, Low: 48 };

export type ComplaintStatus = "New" | "Assigned" | "Investigating" | "Waiting" | "Resolved" | "Closed" | "Escalated";

export interface AdminComplaint extends Omit<Complaint, "status"> {
  status: ComplaintStatus;
  customerId?: string;
  operatorId?: string;
  pickupExists: boolean;
  slaMet?: boolean;
  resolution?: string;
  resolvedAt?: string;
  notes: Array<{ by: string; at: string; text: string }>;
}

/** Age in hours for open complaints, so the queue reads like a real Monday morning. */
const OPEN_AGE: Record<string, number> = {
  "CMP-1158": 1.5, "CMP-1172": 15.2, "CMP-1156": 6.3, "CMP-1161": 9, "CMP-1174": 0.6, "CMP-1157": 3.1, "CMP-1180": 0.4, "CMP-1152": 30,
  "CMP-1164": 9.6, "CMP-1159": 2.9, "CMP-1151": 20, "CMP-1166": 26.4, "CMP-1173": 22, "CMP-1155": 12, "CMP-1168": 5.2, "CMP-1160": 17,
  "CMP-1184": 3.2, "CMP-1175": 7, "CMP-1182": 19.5, "CMP-1150": 23.4, "CMP-1176": 4.1, "CMP-1201": 106,
};

const RESOLUTIONS: Record<Complaint["category"], string> = {
  "Missed pickup": "Recovery pickup completed by the operator the next morning. ₦2,500 penalty applied to the operator's payout.",
  "Late pickup": "Operator moved the route start to 06:30 for this street. Customer confirmed the next two pickups were on time.",
  Spillage: "Crew returned the same day to clean the gate area. Operator retrained the crew on bag handling.",
  Billing: "Duplicate charge refunded to the original card. Receipt resent.",
  Conduct: "Operator issued a written warning to the crew member and apologised to the customer.",
  "Damaged bin": "Replacement bin delivered with the next scheduled collection.",
  Other: "Collection day changed at the customer's request.",
};

const NOTE_SEEDS: Record<Complaint["category"], string> = {
  "Missed pickup": "Driver log shows the truck skipped the street after a blocked gate. Asked operator for photos.",
  "Late pickup": "Route started 2h late because a compactor broke down at Itam. Operator confirmed.",
  Spillage: "Customer sent two photos. Spillage is visible at the gate.",
  Billing: "Paystack shows two successful charges four minutes apart. Second one looks like a retry.",
  Conduct: "Spoke with the customer by phone. Security guard's account matches.",
  "Damaged bin": "Lid hinge snapped. Bins from the June batch have had three similar reports.",
  Other: "Customer wants Saturday collection. Ufok runs Saturdays in this area.",
};

function enrich(c: Complaint, idOverride?: string): AdminComplaint {
  const id = idOverride ?? c.id;
  const status: ComplaintStatus = c.status === "Open" ? "New" : c.status === "In progress" ? "Waiting" : (c.status as ComplaintStatus);
  const open = status !== "Resolved" && status !== "Closed";
  const age = OPEN_AGE[id];
  const created = open && age !== undefined ? hoursAgo(age) : c.created;
  const slaDue = new Date(new Date(created).getTime() + SLA_HOURS[c.severity] * HOUR).toISOString();
  const n = Number(id.slice(4));
  const assignee = status === "New" ? "Unassigned" : c.assignee === "Unassigned" ? "Emem Obot" : c.assignee;
  const resolvedAt = open ? undefined : new Date(new Date(created).getTime() + (n % 5 === 0 ? SLA_HOURS[c.severity] + 3 : SLA_HOURS[c.severity] * 0.55) * HOUR).toISOString();
  return {
    ...c,
    id,
    status,
    created,
    slaDue,
    assignee,
    customerId: customerIdByName(c.customerName),
    operatorId: operatorIdByName(c.operatorName),
    pickupExists: !!(c.pickupId && pickupById(c.pickupId)),
    slaMet: open ? undefined : n % 5 !== 0,
    resolution: open ? undefined : RESOLUTIONS[c.category],
    resolvedAt,
    notes:
      status === "New"
        ? []
        : [{ by: assignee === "Unassigned" ? "Idara Umoh" : assignee, at: new Date(new Date(created).getTime() + 0.6 * HOUR).toISOString(), text: NOTE_SEEDS[c.category] }],
  };
}

export const ADMIN_COMPLAINTS: AdminComplaint[] = [
  ...myComplaints.map((c) => enrich(c)),
  ...complaints.map((c) => enrich(c, c.id === "CMP-1183" ? "CMP-1184" : undefined)),
].sort((a, b) => b.created.localeCompare(a.created));

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */

export function RatingStars({ value, size = "sm", className }: { value: number; size?: "sm" | "md"; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(size === "sm" ? "size-3.5" : "size-[18px]", n <= Math.round(value) ? "fill-ink text-ink" : "fill-none text-line-strong")}
          strokeWidth={1.5}
          aria-hidden
        />
      ))}
    </span>
  );
}

/**
 * The one hero per screen: a big figure and the sentence that explains it.
 * Sits on the canvas, closed by a hairline, never a tinted tile.
 */
export function Headline({
  kicker,
  value,
  unit,
  children,
  aside,
  className,
}: {
  kicker: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("grid gap-6 border-b border-line pb-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] xl:items-end xl:gap-12", className)}>
      <div className="flex min-w-0 flex-col gap-2">
        <p className="t-micro text-ink-3">{kicker}</p>
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="t-display text-ink tnum">{value}</span>
          {unit && <span className="t-h3 text-ink-2">{unit}</span>}
        </p>
        {children && <div className="t-body max-w-xl text-ink-2">{children}</div>}
      </div>
      {aside && <div className="min-w-0">{aside}</div>}
    </section>
  );
}

/** A quiet row of figures separated by hairlines (no boxes). */
export function Figures({ items, className }: { items: Array<{ label: ReactNode; value: ReactNode; hint?: ReactNode; tone?: "danger" | "warning" | "success" }>; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-x-6 gap-y-5 sm:flex sm:divide-x sm:divide-line", className)}>
      {items.map((it, i) => (
        <div key={i} className="flex min-w-0 flex-col gap-1 sm:flex-1 sm:px-5 sm:first:pl-0 sm:last:pr-0">
          <dt className="t-micro text-ink-3">{it.label}</dt>
          <dd
            className={cn(
              "font-display text-[24px] font-bold leading-tight tracking-[-0.02em] tnum",
              it.tone === "danger" ? "text-danger" : it.tone === "warning" ? "text-warning" : it.tone === "success" ? "text-success" : "text-ink",
            )}
          >
            {it.value}
          </dd>
          {it.hint && <dd className="t-small text-ink-3 max-sm:hidden">{it.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}

/** Variable chip used in templates and composers. */
export function VarChip({ name, onClick }: { name: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 items-center rounded-sm border border-line-strong bg-surface px-2 font-mono text-[12px] text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
    >
      {`{{${name}}}`}
    </button>
  );
}

/** Highlight {{variables}} inside a template body. */
export function renderVars(text: string, values?: Record<string, string>): ReactNode[] {
  return text.split(/(\{\{[a-z_]+\}\})/g).map((part, i) => {
    const m = part.match(/^\{\{([a-z_]+)\}\}$/);
    if (!m) return <span key={i}>{part}</span>;
    const v = values?.[m[1]!];
    return v ? (
      <span key={i} className="font-medium text-ink">{v}</span>
    ) : (
      <span key={i} className="rounded-[4px] bg-sunken px-1 font-mono text-[0.92em] text-ink-2">{part}</span>
    );
  });
}

export const SAMPLE_VARS: Record<string, string> = {
  first_name: "Imaobong",
  customer_name: "Imaobong Akpan",
  pickup_window: "Thu 8 Oct, 07:00–09:00",
  pickup_date: "Thu 8 Oct",
  address: "14 Ewet Housing Estate",
  operator_name: "Ufok Environmental",
  amount: "₦7,000",
  plan_name: "Slate Home",
  reference: "TXN-7Q4K2M",
  complaint_id: "CMP-1201",
  card_last4: "4021",
  renewal_date: "1 Nov",
  expiry_date: "31 Oct",
  contract_id: "CT-UYO-017",
  otp: "482913",
  project_name: "Ewet drainage channel",
  support_phone: "0700 752 8300",
};

/** Dense key/value grid, two columns even on phones (drawers, detail panes). */
export function Facts({ items, className, cols = 3 }: { items: Array<{ label: ReactNode; value: ReactNode; full?: boolean }>; className?: string; cols?: 2 | 3 }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-x-6 gap-y-4", cols === 3 && "sm:grid-cols-3", className)}>
      {items.map((it, i) => (
        <div key={i} className={cn("flex min-w-0 flex-col gap-0.5", it.full && "col-span-full")}>
          <dt className="t-micro text-ink-3">{it.label}</dt>
          <dd className="t-body min-w-0 break-words text-ink">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
