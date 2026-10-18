/**
 * Customer core, page-local helpers shared by Services, Book, Subscriptions,
 * Pickups, Extra/Bulk requests and Report missed. Not a shared component:
 * lives with the pages (DIRECTION.md §10.10).
 */
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";
import {
  ArrowRight, Building2, Check, Coins, CreditCard, GraduationCap, Home, MessageCircle, MessagesSquare, Package, PartyPopper, Phone, Recycle,
  Plus, Store, Truck, HardHat,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CleanSlate } from "@/components/brand/CleanSlate";
import { RouteMap } from "@/components/brand/RouteMap";
import {
  Badge, Button, ButtonLink, ChoiceCard, ConfirmDialog, Field, LiveDot, Modal, Page, Segmented, Select, StateView, Textarea, useToast,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { DEMO_NOW, formatDay, formatNaira } from "@/lib/format";
import { serviceById, type Pickup, type Service } from "@/data";
import { CANCEL_REASONS, PAUSE_REASONS, WEEKDAYS, type Subscription, type Weekday } from "./_subs";

/* ------------------------------------------------------------------ */
/* Contact                                                             */
/* ------------------------------------------------------------------ */

export const SUPPORT_PHONE = "+234 700 752 8300";
export const SUPPORT_TEL = "tel:+2347007528300";
export const SUPPORT_WHATSAPP = "https://wa.me/2347007528300";

/** Contact Slate, chat, call or WhatsApp. Slate is the one number, never the operator. */
export function ContactSheet({ open, onClose, reference, topic }: { open: boolean; onClose: () => void; reference?: string; topic?: string }) {
  const rows: Array<{ icon: LucideIcon; title: string; sub: string; meta: string; href?: string; to?: string }> = [
    { icon: MessagesSquare, title: "Chat with Slate", sub: "In the app, with your history attached", meta: "Replies in about 4 min", to: "/app/support" },
    { icon: Phone, title: "Call Slate", sub: SUPPORT_PHONE, meta: "06:00–20:00 daily", href: SUPPORT_TEL },
    { icon: MessageCircle, title: "WhatsApp", sub: SUPPORT_PHONE, meta: "Replies in about 10 min", href: SUPPORT_WHATSAPP },
  ];
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Contact Slate"
      description={topic ?? "One team for everything, the operator never needs to be called directly."}
    >
      <div className="flex flex-col gap-4 pb-3">
        {reference && (
          <div className="flex items-center justify-between gap-3 rounded-md bg-sunken px-3.5 py-2.5">
            <span className="t-small text-ink-2">Quote this reference</span>
            <span className="t-mono text-ink">{reference}</span>
          </div>
        )}
        <ul className="flex flex-col divide-y divide-line border-y border-line">
          {rows.map((r) => {
            const inner = (
              <>
                <r.icon className="size-5 shrink-0 text-ink-2" strokeWidth={1.75} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="t-body font-medium text-ink">{r.title}</span>
                  <span className="t-small text-ink-2">{r.sub}</span>
                </span>
                <span className="t-micro shrink-0 text-right text-ink-3">{r.meta}</span>
                <ArrowRight className="size-4 shrink-0 text-ink-3" />
              </>
            );
            const cls = "-mx-2 flex items-center gap-3.5 rounded-md px-2 py-3.5 transition-colors hover:bg-sunken/70";
            return (
              <li key={r.title}>
                {r.to ? (
                  <Link to={r.to} className={cls}>{inner}</Link>
                ) : (
                  <a href={r.href} target={r.href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className={cls}>{inner}</a>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Service catalogue helpers                                           */
/* ------------------------------------------------------------------ */

export const CATEGORY_ICON: Record<Service["category"], LucideIcon> = {
  "Household Waste": Home,
  "Commercial Waste": Store,
  "Estate Waste Management": Building2,
  "Institutional Waste": GraduationCap,
  "Bulk Waste": Package,
  Recycling: Recycle,
  "Special Collection": HardHat,
  "Event Cleanup": PartyPopper,
};
export const CATEGORIES = Object.keys(CATEGORY_ICON) as Service["category"][];

/** Uyo areas → zones on the ServiceAreaMap. */
export const AREA_ZONE: Record<string, string> = {
  "Ewet Housing Estate": "ewet",
  "Shelter Afrique Estate": "shelter",
  "Osongama Estate": "osongama",
  "Aka Road": "aka",
  "Oron Road": "oron",
  "Nwaniba Road": "nwaniba",
  "Ikot Ekpene Road": "nwaniba",
  "Udo Udoma Avenue": "oron",
  "Wellington Bassey Way": "aka",
  "Abak Road": "abak",
  Itam: "itam",
  "Use Offot": "uselga",
};

const HOUSEHOLD_AREAS = ["Ewet Housing Estate", "Shelter Afrique Estate", "Osongama Estate", "Nwaniba Road", "Ikot Ekpene Road", "Aka Road"];
/** Where each service runs today (from live operator contracts), and what's coming. */
export const COVERAGE: Record<string, { areas: string[] | "all"; soon?: { areas: string[]; from: string } }> = {
  "svc-home-weekly": { areas: HOUSEHOLD_AREAS, soon: { areas: ["Use Offot", "Abak Road"], from: "15 Nov" } },
  "svc-home-lite": { areas: HOUSEHOLD_AREAS, soon: { areas: ["Use Offot", "Abak Road"], from: "15 Nov" } },
  "svc-commercial": { areas: ["Aka Road", "Oron Road", "Udo Udoma Avenue", "Wellington Bassey Way"], soon: { areas: ["Itam"], from: "1 Nov" } },
  "svc-estate": { areas: ["Ewet Housing Estate", "Shelter Afrique Estate", "Osongama Estate"] },
  "svc-institution": { areas: ["Itam", "Abak Road", "Use Offot"] },
  "svc-recycling": { areas: ["Ewet Housing Estate", "Shelter Afrique Estate", "Osongama Estate"] },
  "svc-bulk": { areas: "all" },
  "svc-special": { areas: "all" },
  "svc-event": { areas: "all" },
};
export const covers = (serviceId: string, area: string) => {
  const c = COVERAGE[serviceId];
  return !c || c.areas === "all" || c.areas.includes(area);
};
export const coverageLabel = (serviceId: string) => {
  const c = COVERAGE[serviceId];
  if (!c || c.areas === "all") return "All of Uyo";
  return `${c.areas.length} areas in Uyo`;
};

/** Monthly price by frequency. The advertised price is all-in. */
export const FREQ_PRICE: Record<string, Record<string, number>> = {
  "svc-home-weekly": { Weekly: 5000, "Twice weekly": 7000, "Three times weekly": 9500 },
  "svc-home-lite": { Weekly: 4500 },
  "svc-recycling": { Monthly: 1500, "Twice monthly": 2600 },
  "svc-commercial": { "Three times weekly": 30000, Daily: 46500, "Twice daily": 82000 },
  "svc-estate": { "Twice weekly": 6500, "Three times weekly": 8200 },
};
export const priceFor = (s: Service, frequency: string) => FREQ_PRICE[s.id]?.[frequency] ?? s.priceFrom;
export const EXTRA_BIN = 1200;
export const feeFor = (monthly: number) => (monthly >= 4000 ? 250 : 100);

export const FREQ_META: Record<string, { days: number; line: string }> = {
  Weekly: { days: 1, line: "One collection a week, same day each week" },
  "Twice weekly": { days: 2, line: "Two collections a week, on two fixed days" },
  "Three times weekly": { days: 3, line: "Three collections a week, for large households" },
  Monthly: { days: 1, line: "Once a month, on the same weekday" },
  "Twice monthly": { days: 1, line: "Every other week, on the same weekday" },
  Daily: { days: 6, line: "Monday to Saturday" },
  "Twice daily": { days: 6, line: "Morning and evening, Monday to Saturday" },
  "One-time": { days: 1, line: "A single collection on a day you choose" },
};

export const WINDOWS = ["06:00–08:00", "07:00–09:00", "08:00–10:00", "14:00–16:00"] as const;
/** Ewet's route days are Mon & Thu, the truck is already on your street. */
export const ROUTE_DAYS: Weekday[] = ["Mon", "Thu"];

export type SlotState = "open" | "few" | "full";
/** Deterministic demo availability for a weekday × window. */
export function slotState(day: Weekday, window: string): SlotState {
  if (day === "Mon" && window === "06:00–08:00") return "full";
  if (day === "Sat" && window === "14:00–16:00") return "full";
  if (day === "Thu" && window === "08:00–10:00") return "few";
  if (day === "Wed" && window === "06:00–08:00") return "few";
  return "open";
}

const WD_INDEX: Record<number, Weekday | null> = { 0: null, 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" };
export const weekdayOf = (d: Date): Weekday | null => WD_INDEX[d.getDay()] ?? null;

/** Next `count` calendar days starting `from` days after today (DEMO_NOW). */
export function upcomingDays(count: number, from = 1) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(DEMO_NOW);
    d.setHours(7, 0, 0, 0);
    d.setDate(d.getDate() + from + i);
    return d;
  });
}

export const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const fromIsoDay = (s: string) => new Date(`${s}T07:00:00+01:00`);

/* ------------------------------------------------------------------ */
/* Terms                                                               */
/* ------------------------------------------------------------------ */

const TERMS: Array<[string, string]> = [
  ["What Slate provides", "Collection on your agreed days, inside your window, by a verified operator that Slate contracts and supervises. Slate is responsible for the service, not the operator."],
  ["Your part", "Bins at the gate by the start of your window, waste bagged. No medical, chemical or construction waste in household bins, book a special collection for those."],
  ["Missed pickups", "Report within 48 hours. Slate sends a recovery crew within 24 hours of your report. If we miss that, one collection is credited to your next bill."],
  ["Billing", "Monthly in advance on the 1st; your first month is pro-rated. A failed payment is retried three times over three days and your service continues for 7 days."],
  ["Changes and pauses", "Change days, window or frequency at any time, it applies from your next collection. Pause for up to 60 days without losing your route slot."],
  ["Bins", "Slate bins remain Slate property. A lost or burnt bin is replaced for ₦8,500; damage during collection is replaced free."],
];
const CANCELLATION: Array<[string, string]> = [
  ["Cancel any time", "No cancellation fee and no notice period. Cancelling takes effect at the end of the day you cancel."],
  ["Refunds", "Unused days are refunded to the card you paid with within 5 working days. A booking cancelled before its first pickup is refunded in full."],
  ["One-off pickups", "Extra and bulk pickups are free to cancel until 24 hours before the crew is due. After that, 50% of the deposit is kept to pay the crew."],
  ["Your bin", "Slate collects the bin on your last collection day. If it can't be collected, the ₦8,500 replacement charge applies after 14 days."],
];

export function TermsModal({ kind, open, onClose, onAccept }: { kind: "terms" | "cancellation"; open: boolean; onClose: () => void; onAccept?: () => void }) {
  const rows = kind === "terms" ? TERMS : CANCELLATION;
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={kind === "terms" ? "Service terms" : "Cancellation policy"}
      description={kind === "terms" ? "Slate household waste service · version 3, 1 Sep 2026" : "Applies to every Slate subscription and one-off booking"}
      footer={
        onAccept ? (
          <>
            <Button variant="ghost" onClick={onClose}>Close</Button>
            <Button onClick={() => { onAccept(); onClose(); }}>I agree</Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>Close</Button>
        )
      }
    >
      <ol className="flex flex-col divide-y divide-line pb-2">
        {rows.map(([h, b], i) => (
          <li key={h} className="grid grid-cols-[28px_1fr] gap-x-2 py-3.5">
            <span className="t-mono text-ink-3">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <p className="t-h3 text-ink">{h}</p>
              <p className="mt-0.5 t-small text-ink-2">{b}</p>
            </div>
          </li>
        ))}
      </ol>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */

/** Weekday + date tile, as on the dashboard's "Coming up". */
export function DateTile({ date, live, muted, className }: { date: string | Date; live?: boolean; muted?: boolean; className?: string }) {
  const d = typeof date === "string" ? new Date(date) : date;
  return (
    <div
      className={cn(
        "flex w-12 shrink-0 flex-col items-center rounded-md py-1.5",
        live ? "bg-signal text-signal-ink" : "bg-sunken",
        className,
      )}
    >
      <span className={cn("t-micro uppercase", live ? "text-signal-ink/80" : "text-ink-3")}>{d.toLocaleDateString("en-GB", { weekday: "short" })}</span>
      <span className={cn("font-display text-[20px] font-bold leading-none tnum", live ? "text-signal-ink" : muted ? "text-ink-3" : "text-ink")}>{d.getDate()}</span>
    </div>
  );
}

/** "Collected by Ufok Environmental for Slate", the operator, shown modestly. */
export function OperatorLine({ name, verb = "Collected", className }: { name: string | null; verb?: string; className?: string }) {
  if (!name) return <span className={cn("text-ink-2", className)}>Slate is assigning a verified operator</span>;
  return (
    <span className={cn("text-ink-2", className)}>
      {verb} by <span className="text-ink">{name}</span> for Slate
    </span>
  );
}

/** Mobile sticky action bar (sits above the floating tab bar); inline on desktop. */
export function StickyActions({ children, summary, className }: { children: ReactNode; summary?: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "z-30 flex items-center gap-2",
        "max-lg:sticky max-lg:bottom-[calc(max(12px,env(safe-area-inset-bottom))+72px)] max-lg:-mx-2 max-lg:rounded-lg max-lg:border max-lg:border-line max-lg:bg-glass max-lg:p-2 max-lg:shadow-float max-lg:backdrop-blur-xl max-lg:backdrop-saturate-150",
        className,
      )}
    >
      {summary && <div className="min-w-0 flex-1 px-2 lg:px-0">{summary}</div>}
      {children}
    </div>
  );
}

export function NotFound({ title, description, back }: { title: string; description: string; back: { to: string; label: string } }) {
  return (
    <Page narrow>
      <StateView state="not-found" title={title} description={description} action={<ButtonLink to={back.to} variant="secondary">{back.label}</ButtonLink>} />
    </Page>
  );
}

/** A price line in a breakdown. */
export function PriceLine({ label, sub, value, strong, muted }: { label: ReactNode; sub?: ReactNode; value: ReactNode; strong?: boolean; muted?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 py-2.5", strong && "pt-3.5")}>
      <div className="min-w-0">
        <p className={cn(strong ? "t-h3 text-ink" : "t-small text-ink")}>{label}</p>
        {sub && <p className="t-micro text-ink-3">{sub}</p>}
      </div>
      <p className={cn("shrink-0 tnum", strong ? "font-display text-[22px] font-bold text-ink" : muted ? "t-small text-ink-3" : "t-small font-medium text-ink")}>{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Week strip, the schedule, drawn as a timetable                     */
/* ------------------------------------------------------------------ */

export function WeekStrip({
  days,
  window,
  onToggle,
  live,
  className,
  route = ROUTE_DAYS,
  showRoute,
}: {
  days: Weekday[];
  window?: string;
  onToggle?: (d: Weekday) => void;
  /** Highlight a day as happening now (signal). */
  live?: Weekday;
  className?: string;
  route?: Weekday[];
  showRoute?: boolean;
}) {
  const short = window?.replace(/:00/g, "").replace("–", "–");
  const all: Array<Weekday | "Sun"> = [...WEEKDAYS, "Sun"];
  return (
    <div className={cn("grid grid-cols-7 gap-1.5", className)} role={onToggle ? "group" : undefined} aria-label="Collection days">
      {all.map((d) => {
        if (d === "Sun")
          return (
            <div key={d} className="flex flex-col items-center gap-1.5">
              <span className="t-micro text-ink-3">Sun</span>
              <div
                className="flex h-16 w-full items-center justify-center rounded-md border border-dashed border-line-strong text-ink-3"
                title="No collections on Sundays"
              >
                <span className="t-micro">Off</span>
              </div>
              {showRoute && <span className="h-4" />}
            </div>
          );
        const on = days.includes(d);
        const isLive = live === d;
        const body = (
          <>
            <span className={cn("t-micro", on ? "font-semibold text-ink" : "text-ink-3")}>{d}</span>
            <span
              className={cn(
                "relative flex h-16 w-full flex-col items-center justify-center gap-0.5 overflow-hidden rounded-md transition-colors",
                on
                  ? isLive
                    ? "bg-signal text-signal-ink"
                    : "bg-slate text-slate-ink chalk-grain dark:bg-slate-600"
                  : "bg-sunken text-ink-3",
                onToggle && !on && "group-hover:bg-stone",
              )}
            >
              {on ? (
                <>
                  {onToggle ? <Check className="size-4" strokeWidth={2.5} /> : <Truck className="size-4" strokeWidth={1.75} />}
                  {short && <span className="text-[12px] font-medium tnum leading-none">{short}</span>}
                </>
              ) : (
                <span className="t-micro">, </span>
              )}
              {on && !isLive && <span className="absolute inset-x-1.5 bottom-1.5 h-px border-t border-dashed border-white/35" aria-hidden />}
            </span>
            {showRoute && (
              <span className={cn("h-4 t-micro leading-4", route.includes(d) ? "text-ink-2" : "text-transparent")}>{route.includes(d) ? "Route" : "·"}</span>
            )}
          </>
        );
        return onToggle ? (
          <button
            key={d}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(d)}
            className="group flex flex-col items-center gap-1.5 rounded-md outline-offset-2"
          >
            {body}
          </button>
        ) : (
          <div key={d} className="flex flex-col items-center gap-1.5">{body}</div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Live route, same mechanism as the dashboard                        */
/* ------------------------------------------------------------------ */

export const LIVE_STOPS = [0.18, 0.4, 0.78];
export const COLLECTED_AT = "08:19";

/** Truck advances along the route, then the pickup completes (demo clock). */
export function useLiveRoute(enabled = true, start = 0.62) {
  const [progress, setProgress] = useState(start);
  const [collected, setCollected] = useState(false);
  useEffect(() => {
    if (!enabled || collected) return;
    let t: ReturnType<typeof setInterval> | undefined;
    let done: ReturnType<typeof setTimeout> | undefined;
    const s = setTimeout(() => {
      t = setInterval(() => {
        setProgress((p) => {
          const n = Math.min(1, +(p + 0.055).toFixed(3));
          if (n >= 1) {
            clearInterval(t);
            done = setTimeout(() => setCollected(true), 500);
          }
          return n;
        });
      }, 1300);
    }, 2600);
    return () => {
      clearTimeout(s);
      if (t) clearInterval(t);
      if (done) clearTimeout(done);
    };
  }, [enabled, collected]);
  const stopsAway = LIVE_STOPS.filter((x) => x > progress).length + (progress < 1 ? 1 : 0);
  const minutes = Math.max(1, Math.round((1 - progress) * 24));
  return { progress, collected, stopsAway, minutes, arrived: progress >= 1 };
}

/** Pinned live strip for the pickups list. */
export function LiveStrip({ pickup, route, onRate }: { pickup: Pickup; route: ReturnType<typeof useLiveRoute>; onRate: () => void }) {
  return (
    <CleanSlate
      done={route.collected}
      className="rounded-lg"
      after={
        <div className="flex h-full flex-col justify-center gap-3 rounded-lg border border-line bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Badge tone="success" icon={<Check strokeWidth={3} />}>Collected</Badge>
            <div className="min-w-0">
              <p className="font-display text-[22px] font-bold leading-tight tracking-[-0.02em] text-ink">Clean slate.</p>
              <p className="t-small text-ink-2">
                Collected at <span className="font-semibold text-ink tnum">{COLLECTED_AT}</span> by {pickup.driver.split(" ")[0]} from {pickup.operatorName}, for Slate
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={onRate}>Rate</Button>
            <ButtonLink size="sm" variant="ghost" to={`/app/pickups/${pickup.id}`}>Evidence</ButtonLink>
          </div>
        </div>
      }
    >
      <Link
        to={`/app/pickups/${pickup.id}`}
        aria-label={`Track today's pickup, ${pickup.id}`}
        className="group relative isolate flex min-h-[152px] overflow-hidden rounded-lg bg-slate text-slate-ink chalk-grain"
      >
        <div className="absolute inset-y-0 right-0 w-full sm:w-[58%]">
          <RouteMap progress={route.progress} stops={LIVE_STOPS} showLabels={false} className="h-full w-full opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate via-slate/70 to-transparent sm:via-slate/30" />
        </div>
        <div className="relative flex flex-1 flex-col justify-between gap-4 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 items-center gap-2 rounded-sm bg-signal px-2 text-[12px] font-semibold text-signal-ink">
              <LiveDot className="size-2 [&>span]:size-2 [&>span]:bg-signal-ink" />
              {route.arrived ? "Arrived" : "On the way"}
            </span>
            <span className="t-mono text-[12px] text-slate-ink/70">{pickup.id}</span>
          </div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-display text-[30px] font-bold leading-none tracking-[-0.025em]">Today</p>
              <p className="mt-1.5 t-small text-slate-ink/85 tnum">
                <span className="font-semibold text-slate-ink">{pickup.window}</span>
                <span className="mx-1.5 text-slate-ink/40">·</span>
                {route.arrived ? "At your gate" : `${route.stopsAway} ${route.stopsAway === 1 ? "stop" : "stops"} away, about ${route.minutes} min`}
              </p>
            </div>
            <span className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md bg-slate-ink px-3.5 text-[14px] font-semibold text-slate-950 transition group-hover:bg-white">
              Track <ArrowRight className="size-4" />
            </span>
          </div>
        </div>
      </Link>
    </CleanSlate>
  );
}

/* ------------------------------------------------------------------ */
/* Evidence, a designed slate field, never a grey box                 */
/* ------------------------------------------------------------------ */

export function EvidenceField({
  kind,
  stamp,
  coords = "5.0171° N, 7.9187° E · ±6 m",
  by,
  className,
}: {
  kind: "before" | "after";
  stamp: string;
  coords?: string;
  by: string;
  className?: string;
}) {
  const full = kind === "before";
  return (
    <figure className={cn("relative isolate aspect-[4/3] overflow-hidden rounded-md bg-slate text-slate-ink chalk-grain dark:bg-slate-800", className)}>
      {/* chalk drawing: gate, kerb, bin */}
      <svg viewBox="0 0 320 240" className="absolute inset-0 h-full w-full" aria-hidden>
        <g fill="none" stroke="#F2F4F6" strokeLinecap="round" strokeLinejoin="round">
          {/* gate posts and bars */}
          <path d="M34 40 V188 M120 40 V188" strokeOpacity=".5" strokeWidth="2.5" />
          <path d="M34 52 H120 M34 176 H120" strokeOpacity=".35" strokeWidth="1.5" />
          {[48, 62, 76, 90, 104].map((x) => (
            <path key={x} d={`M${x} 52 V176`} strokeOpacity=".22" strokeWidth="1.5" />
          ))}
          {/* wall */}
          <path d="M120 96 H300 M120 120 H300" strokeOpacity=".16" strokeWidth="1.25" strokeDasharray="2 6" />
          {/* ground / kerb */}
          <path d="M0 192 C 80 189, 200 195, 320 190" strokeOpacity=".45" strokeWidth="1.5" />
          <path d="M8 210 C 90 207, 210 213, 312 208" strokeOpacity=".18" strokeWidth="1.25" strokeDasharray="3 7" />
          {/* bin body */}
          <path d="M176 104 L184 190 H236 L244 104 Z" strokeOpacity=".9" strokeWidth="2" />
          <path d="M190 118 L194 178 M210 118 V178 M230 118 L226 178" strokeOpacity=".28" strokeWidth="1.25" />
          {/* wheels */}
          <circle cx="190" cy="194" r="5" strokeOpacity=".7" strokeWidth="1.5" />
          <circle cx="230" cy="194" r="5" strokeOpacity=".7" strokeWidth="1.5" />
          {/* lid: closed+overflowing before, open+empty after */}
          {full ? (
            <>
              <path d="M170 102 H250" strokeOpacity=".9" strokeWidth="2.5" />
              <path d="M178 100 C 182 84, 196 80, 204 88 C 210 76, 228 78, 232 92 C 240 88, 248 94, 246 100" strokeOpacity=".75" strokeWidth="1.75" />
              <path d="M252 186 C 258 178, 270 178, 274 186 Z M150 188 C 152 182, 162 181, 164 188" strokeOpacity=".6" strokeWidth="1.5" />
            </>
          ) : (
            <path d="M172 102 L208 62" strokeOpacity=".9" strokeWidth="2.5" />
          )}
        </g>
        {/* viewfinder corners */}
        <g stroke="#F2F4F6" strokeOpacity=".7" strokeWidth="2" fill="none">
          <path d="M14 30 V14 H30 M290 14 H306 V30 M306 210 V226 H290 M30 226 H14 V210" />
        </g>
      </svg>
      <div className="absolute left-3 top-3 flex items-center gap-1.5">
        <span className={cn("rounded-sm px-1.5 py-0.5 text-[12px] font-semibold", full ? "bg-white/15 text-slate-ink" : "bg-success text-white dark:text-slate-950")}>
          {full ? "Before" : "After"}
        </span>
      </div>
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/50 to-transparent px-3 pb-2.5 pt-8">
        <p className="t-mono text-[12px] leading-tight text-slate-ink">{stamp}</p>
        <p className="t-mono text-[12px] leading-tight text-slate-ink/70">{coords}</p>
        <p className="mt-0.5 text-[12px] leading-tight text-slate-ink/70">{by}</p>
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* SLA countdown, 24 hours to recovery                                */
/* ------------------------------------------------------------------ */

export function SlaCountdown({ startedAt, hours = 24, due }: { startedAt: number; hours?: number; due: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const total = hours * 3600_000;
  const left = Math.max(0, total - (now - startedAt));
  const h = Math.floor(left / 3600_000);
  const m = Math.floor((left % 3600_000) / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  const elapsedHours = (total - left) / 3600_000;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="t-micro text-ink-3">Recovery due in</p>
          <p className="font-mono text-[40px] font-semibold leading-none tracking-[-0.02em] text-ink tnum sm:text-[48px]" aria-live="off">
            {String(h).padStart(2, "0")}
            <span className="text-ink-3">:</span>
            {String(m).padStart(2, "0")}
            <span className="text-ink-3">:</span>
            {String(s).padStart(2, "0")}
          </p>
        </div>
        <p className="t-small text-ink-2">
          by <span className="font-semibold text-ink">{due}</span>
        </p>
      </div>
      <div className="flex gap-[3px]" role="progressbar" aria-label="Time left to recover your pickup" aria-valuemin={0} aria-valuemax={hours} aria-valuenow={Math.round(hours - elapsedHours)}>
        {Array.from({ length: hours }).map((_, i) => {
          const spent = i < Math.floor(elapsedHours);
          const current = i === Math.floor(elapsedHours);
          return (
            <span
              key={i}
              className={cn(
                "h-7 flex-1 rounded-[3px]",
                spent ? "bg-line" : current ? "bg-signal animate-pulse" : "bg-slate dark:bg-slate-500",
              )}
            />
          );
        })}
      </div>
      <div className="flex justify-between t-micro text-ink-3 tnum">
        <span>Report received</span>
        <span>12 h</span>
        <span>24 h</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

export const perMonth = (n: number) => `${formatNaira(n)}/month`;
export const dayLabel = (d: Date | string) => {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Math.round((new Date(isoDay(date)).getTime() - new Date(isoDay(DEMO_NOW)).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return formatDay(date);
};
export const joinDays = (days: string[]) => (days.length <= 1 ? days.join("") : `${days.slice(0, -1).join(", ")} & ${days[days.length - 1]}`);

/* ------------------------------------------------------------------ */
/* Subscription actions, shared by C6 and C7                          */
/* ------------------------------------------------------------------ */

/** Next date (≥ `lead` days from DEMO_NOW) that falls on one of `days`. */
export function nextOn(days: Weekday[], lead = 2) {
  for (let i = lead; i < lead + 14; i++) {
    const d = new Date(DEMO_NOW);
    d.setHours(7, 0, 0, 0);
    d.setDate(d.getDate() + i);
    const wd = weekdayOf(d);
    if (wd && days.includes(wd)) return d;
  }
  return null;
}

export type SubDialog = "modify" | "pause" | "resume" | "cancel" | "payment" | null;

export function SubscriptionDialogs({
  sub,
  dialog,
  onClose,
  onUpdate,
}: {
  sub: Subscription | undefined;
  dialog: SubDialog;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Subscription>) => void;
}) {
  const toast = useToast();
  const svc = sub ? serviceById(sub.serviceId) : undefined;
  const [freq, setFreq] = useState("");
  const [days, setDays] = useState<Weekday[]>([]);
  const [win, setWin] = useState("");
  const [pauseFor, setPauseFor] = useState("2 weeks");
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [method, setMethod] = useState("Visa •• 4021");
  const [modErr, setModErr] = useState("");

  useEffect(() => {
    if (!sub || !dialog) return;
    setFreq(sub.frequency);
    setDays(sub.days);
    setWin(sub.window);
    setReason("");
    setComment("");
    setMethod(sub.paymentMethod);
    setModErr("");
    setPauseFor("2 weeks");
  }, [dialog, sub]);

  if (!sub) return null;
  const need = FREQ_META[freq]?.days ?? 1;
  const unusedDays = 31 - DEMO_NOW.getDate() + 1;
  const refund = sub.status === "Active" ? Math.round((sub.price * unusedDays) / 31 / 10) * 10 : sub.status === "Pending" ? 0 : 0;
  const resumeDate = nextOn(sub.days);
  const pauseUntil = (() => {
    const d = new Date(DEMO_NOW);
    d.setDate(d.getDate() + (pauseFor === "1 week" ? 7 : pauseFor === "2 weeks" ? 14 : pauseFor === "1 month" ? 30 : 60));
    return d;
  })();

  return (
    <>
      {/* Modify */}
      <Modal
        open={dialog === "modify"}
        onClose={onClose}
        title={`Modify ${sub.service}`}
        description={`${sub.address}. Changes apply from your next collection.`}
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => {
                if (days.length !== need) return setModErr(`Choose ${need === 1 ? "one day" : `${need} days`} for ${freq.toLowerCase()}.`);
                const price = svc ? priceFor(svc, freq) + (sub.bins > 1 ? (sub.bins - 1) * EXTRA_BIN : 0) : sub.price;
                const next = nextOn(days);
                onUpdate(sub.id, { frequency: freq, days, window: win, price, nextPickup: sub.status === "Active" && next ? next.toISOString() : sub.nextPickup });
                onClose();
                toast.success("Schedule updated", `${joinDays(days)}, ${win}${next && sub.status === "Active" ? `, from ${formatDay(next)}` : ""}. ${price !== sub.price ? `New price ${formatNaira(price)}/month from 1 Nov.` : ""}`);
              }}
            >
              Save changes
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-5 pb-3">
          {svc && svc.frequencies.length > 1 && (
            <Field label="Frequency">
              <Segmented
                value={freq}
                onChange={(f) => {
                  setFreq(f);
                  setDays((ds) => ds.slice(0, FREQ_META[f]?.days ?? 1));
                  setModErr("");
                }}
                options={svc.frequencies.map((f) => ({ value: f, label: f.replace("Three times weekly", "3× weekly").replace("Twice weekly", "2× weekly") }))}
                className="w-full"
              />
            </Field>
          )}
          <Field label={`Days · choose ${need}`} error={modErr || undefined}>
            <WeekStrip
              days={days}
              window={win}
              onToggle={(d) => {
                setModErr("");
                setDays((ds) => (ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d].slice(-need)).sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b)));
              }}
            />
          </Field>
          <Select label="Time window" value={win} onChange={(e) => setWin(e.target.value)} options={[...WINDOWS]} />
          {svc && freq !== sub.frequency && (
            <p className="t-small text-ink-2 tnum">
              New price: <span className="font-semibold text-ink">{formatNaira(priceFor(svc, freq) + (sub.bins > 1 ? (sub.bins - 1) * EXTRA_BIN : 0))}/month</span> (was {formatNaira(sub.price)}), from 1 Nov.
            </p>
          )}
        </div>
      </Modal>

      {/* Pause */}
      <ConfirmDialog
        open={dialog === "pause"}
        onClose={onClose}
        title={`Pause ${sub.service}?`}
        description="No collections and no charges while paused. Your route slot is held for up to 60 days."
        confirmLabel="Pause subscription"
        onConfirm={() => {
          onUpdate(sub.id, { status: "Paused", nextPickup: null, nextPayment: null, pausedOn: DEMO_NOW.toISOString(), statusNote: pauseFor === "Until I resume" ? "Paused today, resume any time within 60 days" : `Paused until ${formatDay(pauseUntil)}` });
          toast.success("Subscription paused", pauseFor === "Until I resume" ? "Resume any time from Subscriptions." : `Collections restart automatically on ${formatDay(pauseUntil)}.`);
        }}
      >
        <div className="flex flex-col gap-3">
          <Select label="Pause for" value={pauseFor} onChange={(e) => setPauseFor(e.target.value)} options={["1 week", "2 weeks", "1 month", "Until I resume"]} />
          <Select label="Reason" optional value={reason} onChange={(e) => setReason(e.target.value)} options={PAUSE_REASONS} placeholder="Choose a reason" />
        </div>
      </ConfirmDialog>

      {/* Resume */}
      <ConfirmDialog
        open={dialog === "resume"}
        onClose={onClose}
        title={`Resume ${sub.service}?`}
        description={`Collections restart ${resumeDate ? `on ${formatDay(resumeDate)}` : "this week"} at ${sub.address.split(",")[0]}, ${joinDays(sub.days)} ${sub.window}. ${formatNaira(sub.price)}/month, pro-rated for October.`}
        confirmLabel="Resume"
        onConfirm={() => {
          onUpdate(sub.id, { status: "Active", nextPickup: resumeDate?.toISOString() ?? null, nextPayment: new Date("2026-11-01T06:00:00+01:00").toISOString(), statusNote: `Resumed today, first collection ${resumeDate ? formatDay(resumeDate) : "this week"}` });
          toast.success("Subscription resumed", `First collection ${resumeDate ? formatDay(resumeDate) : "this week"}. ${sub.operator ?? "Your operator"} has been notified by Slate.`);
        }}
      />

      {/* Cancel */}
      <ConfirmDialog
        open={dialog === "cancel"}
        onClose={onClose}
        variant="destructive"
        title={`Cancel ${sub.service}?`}
        description={
          sub.status === "Active"
            ? `Collections stop after today. ${formatNaira(refund)} for the ${unusedDays} unused days of October goes back to ${sub.paymentMethod} within 5 working days.`
            : sub.status === "Pending"
              ? "It hasn't started, so nothing has been charged. Nothing will be."
              : "No collections are scheduled and nothing more will be charged."
        }
        confirmLabel="Cancel subscription"
        cancelLabel="Keep it"
        onConfirm={() => {
          onUpdate(sub.id, { status: "Cancelled", nextPickup: null, nextPayment: null, cancelledOn: DEMO_NOW.toISOString(), cancelReason: reason || "No reason given", statusNote: `Cancelled today${reason ? `, ${reason.toLowerCase()}` : ""}` });
          toast.success("Subscription cancelled", refund ? `${formatNaira(refund)} refund on its way to ${sub.paymentMethod}.` : "Nothing further will be charged.");
        }}
      >
        <div className="flex flex-col gap-3">
          <Select label="Why are you cancelling?" value={reason} onChange={(e) => setReason(e.target.value)} options={CANCEL_REASONS} placeholder="Choose a reason" />
          <Textarea label="Anything Slate should know?" optional rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
          {reason === "Service quality" && (
            <p className="t-small text-ink-2">
              Slate can replace the operator instead. <Link to="/app/support" className="font-medium text-ink underline underline-offset-4">Talk to us first</Link>
            </p>
          )}
        </div>
      </ConfirmDialog>

      {/* Payment method */}
      <Modal
        open={dialog === "payment"}
        onClose={onClose}
        title="Change payment method"
        description={`For ${sub.service} · ${formatNaira(sub.price)}/month`}
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => {
                onUpdate(sub.id, { paymentMethod: method });
                onClose();
                toast.success("Payment method updated", method === "Smart Sweep" ? "Your monthly price will be collected in small weekly charges." : `Future charges go to ${method}.`);
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-2.5 pb-3" role="radiogroup">
          <ChoiceCard selected={method === "Visa •• 4021"} onSelect={() => setMethod("Visa •• 4021")} icon={<CreditCard />} title="Visa •• 4021" description="Default · expires 08/28" />
          <ChoiceCard selected={method === "Verve •• 7735"} onSelect={() => setMethod("Verve •• 7735")} icon={<CreditCard />} title="Verve •• 7735" description="Declined 3 times on 1 Sep, check your balance before using" />
          <ChoiceCard selected={method === "Smart Sweep"} onSelect={() => setMethod("Smart Sweep")} icon={<Coins />} title="Smart Sweep" description={`About ${formatNaira(Math.ceil(sub.price / 4 / 50) * 50)} a week, charged automatically. No interest.`} />
          <Link to="/app/payment-methods" className="mt-1 inline-flex w-fit items-center gap-1.5 t-small font-medium text-ink-2 hover:text-ink">
            <Plus className="size-4" /> Add a card in Payment methods
          </Link>
        </div>
      </Modal>
    </>
  );
}
