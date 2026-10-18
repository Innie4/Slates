import { useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { api, messageFor } from "@/lib/api";
import { Strata } from "@/components/brand/Strata";
import { Button, Input, Select, Segmented } from "@/components/ui";
import { cities, type City } from "@/data";
import { formatDate } from "@/lib/format";

/* ------------------------------------------------------------------ */
/* Page furniture for the information pages                            */
/* ------------------------------------------------------------------ */

/** Short chalk dash + label above a title. Sentence case, never shouted. */
export function Eyebrow({ children, tone = "ink", className }: { children: ReactNode; tone?: "ink" | "light"; className?: string }) {
  return (
    <p className={cn("flex items-center gap-2.5 t-small font-medium", tone === "light" ? "text-slate-ink/70" : "text-ink-2", className)}>
      <span className={cn("h-px w-6", tone === "light" ? "bg-slate-ink/50" : "bg-ink-3")} aria-hidden />
      {children}
    </p>
  );
}

/** Header for an information page: eyebrow, big title, lede, optional art. */
export function InfoHero({
  eyebrow,
  title,
  lede,
  children,
  art,
  size = "xl",
  className,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
  art?: ReactNode;
  size?: "xl" | "lg";
  className?: string;
}) {
  return (
    <header className={cn("container-page pb-12 pt-10 md:pb-20 md:pt-16", className)}>
      <div className={cn("grid gap-10", art && "lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-end lg:gap-16")}>
        <div className="flex min-w-0 flex-col gap-5 md:gap-6">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className={cn("text-ink", size === "xl" ? "t-display-xl" : "t-display")}>{title}</h1>
          {lede && <div className="t-body max-w-xl text-ink-2 md:text-[18px] md:leading-[1.55]">{lede}</div>}
          {children}
        </div>
        {art}
      </div>
    </header>
  );
}

/** A slate slab with strata, the information pages' only illustration. */
export function SlateSlab({
  children,
  className,
  seed = 7,
  bands = 4,
  live = false,
  strataClassName,
}: {
  children?: ReactNode;
  className?: string;
  seed?: number;
  bands?: 3 | 4 | 5;
  live?: boolean;
  strataClassName?: string;
}) {
  return (
    <div className={cn("relative isolate overflow-hidden rounded-xl bg-slate text-slate-ink chalk-grain", className)}>
      <Strata tone="on-slate" bands={bands} seed={seed} live={live} className={cn("absolute inset-x-0 bottom-0 h-[62%] w-full", strataClassName)} />
      {children && <div className="relative h-full">{children}</div>}
    </div>
  );
}

/** Numbered section heading, like a timetable board: 01, Title. */
export function NumberedHead({ n, title, lede, className, id }: { n: string; title: ReactNode; lede?: ReactNode; className?: string; id?: string }) {
  return (
    <div id={id} className={cn("grid gap-4 border-t border-ink pt-5 md:grid-cols-[120px_minmax(0,1fr)] md:gap-8", className)}>
      <span className="t-mono text-ink-3">{n}</span>
      <div className="flex max-w-3xl flex-col gap-3">
        <h2 className="t-display text-ink">{title}</h2>
        {lede && <p className="t-body text-ink-2 md:text-[17px] md:leading-relaxed">{lede}</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Accordion                                                           */
/* ------------------------------------------------------------------ */

export function AccordionItem({
  id,
  question,
  children,
  open,
  onToggle,
}: {
  id: string;
  question: ReactNode;
  children: ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div id={id} className="scroll-mt-32 border-b border-line">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
          className="group flex w-full items-start justify-between gap-6 py-5 text-left"
        >
          <span className={cn("t-h3 text-[16.5px] transition-colors", open ? "text-ink" : "text-ink group-hover:text-ink-2")}>{question}</span>
          <span
            className={cn(
              "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-sm border transition-[transform,background-color,border-color] duration-200",
              open ? "rotate-180 border-ink bg-ink text-surface" : "border-line-strong text-ink-2 group-hover:border-ink-3",
            )}
            aria-hidden
          >
            <ChevronDown className="size-3.5" strokeWidth={2.25} />
          </span>
        </button>
      </h3>
      <div
        id={`${id}-panel`}
        role="region"
        className={cn("grid transition-[grid-template-rows] duration-300 ease-[var(--ease-out-quart)]", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="max-w-2xl pb-6 pr-10 t-body text-ink-2 [&_p+p]:mt-3 [&_a]:font-medium [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Notify me when Slate arrives                                        */
/* ------------------------------------------------------------------ */

const WHO = [
  { value: "Household", label: "Home" },
  { value: "Estate", label: "Estate" },
  { value: "Business", label: "Business" },
  { value: "Operator", label: "Operator" },
] as const;

export function NotifyForm({ city, className, tone = "light" }: { city?: City; className?: string; tone?: "light" | "slate" }) {
  const waiting = cities.filter((c) => c.status !== "Live");
  const [cityId, setCityId] = useState(city?.id ?? "");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [requestError, setRequestError] = useState("");
  const attempt = useRef<{ body: string; key: string } | null>(null);
  const [area, setArea] = useState("");
  const [who, setWho] = useState<(typeof WHO)[number]["value"]>("Household");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const chosen = cities.find((c) => c.id === cityId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Enter your name.";
    if (!cityId) next.city = "Choose the city you want Slate in.";
    if (!email.trim()) next.email = "Enter an email address so we can tell you.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) next.email = "That email address doesn't look complete.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const body = JSON.stringify({ name: name.trim(), email: email.trim(), category: "Waitlist", message: `Service interest in ${chosen?.name ?? cityId}, ${area.trim() || "area not specified"}, for ${who}.` });
    if (attempt.current?.body !== body) attempt.current = { body, key: crypto.randomUUID() };
    setBusy(true);
    setRequestError("");
    try {
      await api<{ reference: string }>("/enquiries", { method: "POST", body, headers: { "Idempotency-Key": attempt.current.key } });
      setDone(true);
    } catch (cause) {
      setRequestError(messageFor(cause));
    } finally {
      setBusy(false);
    }
  };

  if (done && chosen)
    return (
      <div className={cn("flex flex-col gap-4 animate-pop-in", className)} role="status">
        <span className={cn("flex size-11 items-center justify-center rounded-md", tone === "slate" ? "bg-white/10 text-slate-ink" : "bg-success-bg text-success")}>
          <Check className="size-5" strokeWidth={2.5} />
        </span>
        <div className="flex flex-col gap-1.5">
          <h3 className={cn("t-h2", tone === "slate" ? "text-slate-ink" : "text-ink")}>You're on the {chosen.name} list</h3>
          <p className={cn("t-body", tone === "slate" ? "text-slate-ink/75" : "text-ink-2")}>
            Your interest{area.trim() ? ` in ${area.trim()}` : ""} is saved with <span className={cn("font-medium", tone === "slate" ? "text-slate-ink" : "text-ink")}>{email.trim()}</span>. Collection is subject to launch and address checks.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDone(false)}
          className={cn("w-fit t-small font-medium underline underline-offset-4", tone === "slate" ? "text-slate-ink/80 decoration-white/30 hover:text-slate-ink" : "text-ink-2 decoration-line-strong hover:text-ink")}
        >
          Change details
        </button>
      </div>
    );

  return (
    <form onSubmit={submit} noValidate className={cn("flex flex-col gap-4", className)}>
      {!city && (
        <Select
          label="City"
          value={cityId}
          onChange={(e) => setCityId(e.target.value)}
          placeholder="Choose a city"
          options={waiting.map((c) => ({ value: c.id, label: `${c.name}, ${c.state}` }))}
          error={errors.city}
        />
      )}
      <Input label="Your name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required error={errors.name} />
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />
      <Input
        label="Neighbourhood or estate"
        optional
        placeholder={chosen?.id === "lagos" ? "e.g. Lekki Phase 1" : chosen?.id === "abuja" ? "e.g. Gwarinpa" : chosen?.id === "eket" ? "e.g. Grace Bill Road" : "e.g. GRA Phase 2"}
        value={area}
        onChange={(e) => setArea(e.target.value)}
        hint="Helps us decide where to start."
      />
      <div className="flex flex-col gap-1.5">
        <span className="t-small font-medium text-ink">I'm asking for</span>
        <Segmented value={who} onChange={setWho} options={WHO.map((w) => ({ value: w.value, label: w.label }))} className="w-full" />
      </div>
      {requestError && <p role="alert" className="rounded-md bg-danger-bg p-4 text-danger">{requestError}</p>}
      <Button type="submit" loading={busy} size="lg" className="mt-1">
        Register interest
      </Button>
      <p className="t-micro text-ink-3">One email when we launch. We don't share your address.</p>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* City content                                                        */
/* ------------------------------------------------------------------ */

export interface ZoneInfo {
  id: string;
  name: string;
  operator: string;
  days: string;
  coverage: number;
  homes: number;
  note?: string;
}

/** Uyo zones as served today (keys match UYO_ZONES in ServiceAreaMap). */
export const UYO_ZONE_INFO: ZoneInfo[] = [
  { id: "ewet", name: "Ewet Housing", operator: "Ufok Environmental", days: "Mon & Thu", coverage: 98, homes: 684 },
  { id: "shelter", name: "Shelter Afrique", operator: "Ufok Environmental", days: "Tue & Fri", coverage: 96, homes: 412 },
  { id: "osongama", name: "Osongama", operator: "Ufok Environmental", days: "Mon & Thu", coverage: 91, homes: 371 },
  { id: "aka", name: "Aka Road", operator: "Atlantic Coast · Nwaniba Clean Crew", days: "Daily for shops · Wed & Sat for homes", coverage: 84, homes: 266 },
  { id: "oron", name: "Oron Road", operator: "Atlantic Coast", days: "Daily for shops · Tue & Fri for homes", coverage: 88, homes: 248 },
  { id: "nwaniba", name: "Nwaniba", operator: "Nwaniba Clean Crew", days: "Wed & Sat", coverage: 72, homes: 197 },
  { id: "abak", name: "Abak Road", operator: "Ibom Hauliers", days: "Tue & Fri", coverage: 64, homes: 139 },
  { id: "itam", name: "Itam", operator: "Ibom Hauliers", days: "Mon to Sat for industrial sites", coverage: 58, homes: 102, note: "Industrial layout and institutions" },
  { id: "uselga", name: "Use Offot", operator: "Ibom Hauliers", days: "Wed & Sat", coverage: 41, homes: 58, note: "Second operator joins in November" },
];

export interface CityInfo {
  tagline: string;
  summary: string;
  areas: string[];
  agency: string;
  milestones: Array<{ title: string; time: string; description: string; state: "done" | "current" | "upcoming" }>;
}

export const CITY_INFO: Record<string, CityInfo> = {
  uyo: {
    tagline: "Collecting since 1 April 2026",
    summary:
      "Our pilot city. Four contracted operators collect from homes, estates, shops and institutions across nine zones, on fixed days, in fixed windows. Missed pickups are recovered within 24 hours.",
    areas: ["Ewet Housing Estate", "Shelter Afrique Estate", "Osongama Estate", "Aka Road", "Oron Road", "Ikot Ekpene Road", "Nwaniba Road", "Udo Udoma Avenue", "Wellington Bassey Way", "Abak Road", "Itam", "Use Offot"],
    agency: "Akwa Ibom State Environmental Protection and Waste Management Agency",
    milestones: [
      { title: "First operators contracted", time: "Mar 2026", description: "Ufok Environmental and Atlantic Coast signed, vehicles inspected.", state: "done" },
      { title: "Ewet Housing Estate goes live", time: "1 Apr 2026", description: "182 homes in the first month.", state: "done" },
      { title: "1,000 customers", time: "Jun 2026", description: "Commercial collection opens on Aka Road and Oron Road.", state: "done" },
      { title: "Nine zones served", time: "Oct 2026", description: "2,477 homes and sites, 96.8% on time.", state: "current" },
    ],
  },
  "port-harcourt": {
    tagline: "Launching February 2027",
    summary:
      "Port Harcourt is next. Estates in GRA and along Peter Odili Road asked first, and commercial demand on Trans-Amadi is high. We're verifying operators and completing state registration now.",
    areas: ["GRA Phase 2", "Old GRA", "Trans-Amadi", "Rumuola", "Woji", "D-Line", "Peter Odili Road"],
    agency: "Rivers State Waste Management Agency (RIWAMA)",
    milestones: [
      { title: "Market study", time: "Jun 2026", description: "41 estates and 120 businesses interviewed.", state: "done" },
      { title: "First operator application", time: "Oct 2026", description: "Portside Waste Partners: 11 vehicles, under review.", state: "current" },
      { title: "State registration", time: "Dec 2026", description: "RIWAMA filing and operator permits checked.", state: "upcoming" },
      { title: "Two-estate pilot", time: "Jan 2027", description: "Six weeks of collection before we open to everyone.", state: "upcoming" },
      { title: "Public launch", time: "Feb 2027", description: "Homes, estates and businesses can sign up.", state: "upcoming" },
    ],
  },
  lagos: {
    tagline: "Planned for Q3 2027",
    summary:
      "Lagos has the most demand and the most structure: collection runs through LAWMA-licensed private operators. Slate will contract licensed operators and sell estates and businesses one accountable service on top.",
    areas: ["Lekki Phase 1", "Ikeja GRA", "Magodo", "Gbagada", "Yaba", "Surulere"],
    agency: "Lagos Waste Management Authority (LAWMA)",
    milestones: [
      { title: "Demand research", time: "Aug 2026", description: "Estate associations in Lekki and Magodo surveyed.", state: "done" },
      { title: "LAWMA engagement", time: "Q1 2027", description: "How a managed service sits alongside licensed operators.", state: "upcoming" },
      { title: "Operator partnerships", time: "Q2 2027", description: "Licensed operators verified to Slate's standard.", state: "upcoming" },
      { title: "Estate pilot", time: "Q3 2027", description: "Starting with gated estates.", state: "upcoming" },
    ],
  },
  abuja: {
    tagline: "Planned for Q1 2028",
    summary:
      "Abuja's estates and offices are a strong fit for one managed service. We'll start once Port Harcourt and Lagos are stable, working with operators approved by the AEPB.",
    areas: ["Wuse II", "Garki", "Maitama", "Jabi", "Gwarinpa", "Lokogoma"],
    agency: "Abuja Environmental Protection Board (AEPB)",
    milestones: [
      { title: "Early interest", time: "2026", description: "Estate and office enquiries logged from the waitlist.", state: "done" },
      { title: "Regulatory review", time: "Q3 2027", description: "AEPB operator framework mapped.", state: "upcoming" },
      { title: "Operator sourcing", time: "Q4 2027", description: "Verification against the same standard as Uyo.", state: "upcoming" },
      { title: "Launch", time: "Q1 2028", description: "Estates and offices first.", state: "upcoming" },
    ],
  },
  eket: {
    tagline: "Planned for Q2 2027",
    summary:
      "Eket is in Akwa Ibom, so the state framework we work under in Uyo already applies. The open question is operator capacity: we need a verified operator based in Eket, not trucks driving down from Uyo.",
    areas: ["Marina Road", "Grace Bill Road", "Atabong Road", "Idua", "Afaha Eket", "Ikot Ibiok"],
    agency: "Akwa Ibom State Environmental Protection and Waste Management Agency",
    milestones: [
      { title: "State framework in place", time: "Apr 2026", description: "Same agency as our Uyo operations.", state: "done" },
      { title: "Operator search", time: "Q1 2027", description: "Looking for an Eket-based operator with three or more vehicles.", state: "current" },
      { title: "Launch", time: "Q2 2027", description: "Homes and businesses along the main corridors.", state: "upcoming" },
    ],
  },
};

export const cityLaunchLabel = (c: City) => {
  if (c.status === "Live") return `Live since ${formatDate(c.launch).replace(/^\d+ /, "")}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(c.launch)) return new Date(c.launch).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  return c.launch.replace(/(\d{4})-(Q\d)/, "$2 $1");
};

/* ------------------------------------------------------------------ */
/* Team                                                                */
/* ------------------------------------------------------------------ */

export const TEAM = [
  { name: "Ekemini Etuk", role: "Founder & CEO", bio: "Ran logistics for an FMCG distributor across the South-South for eight years. Started Slate after a year of chasing collectors for his mother's estate in Ewet." },
  { name: "Enobong Ekanem", role: "Operations Lead", bio: "Owns the daily schedule, operator performance and missed-pickup recovery. Previously dispatch manager at a Port Harcourt haulage firm." },
  { name: "Nsikak Archibong", role: "Partnerships Manager", bio: "Signs estates, businesses and institutions, and sources the operators who serve them. Knows most estate chairmen in Uyo by first name." },
  { name: "Abasiama Offiong", role: "Customer Success Lead", bio: "Runs support across the app, phone and WhatsApp. Sets the standard that every complaint gets an owner and a date." },
  { name: "Ifiok Akpabio", role: "Finance & Admin", bio: "Customer billing, operator payouts and Smart Sweep. Chartered accountant, formerly in audit at a Lagos firm." },
  { name: "Chidinma Nwosu", role: "Technology Lead", bio: "Builds the customer, operator and admin products. Before Slate, payments engineering at a Lagos fintech." },
];
