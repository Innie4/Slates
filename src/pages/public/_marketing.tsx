/**
 * Shared building blocks for Slate's public marketing pages
 * (Home, How it works, Services, service detail, For…, Pricing).
 * Page-local by design (DIRECTION.md §10.10) — not part of the kit.
 */
import { Fragment, useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router";
import { ArrowRight, BellRing, Check, ChevronRight, MapPin, MapPinOff, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import { Strata } from "@/components/brand/Strata";
import { RouteMap } from "@/components/brand/RouteMap";
import { ServiceAreaMap } from "@/components/brand/ServiceAreaMap";
import { CleanSlate } from "@/components/brand/CleanSlate";
import { AddressInput, Badge, Button, ButtonLink, Input, LiveDot, Meter, PhoneInput, Select, Textarea, useToast } from "@/components/ui";
import { cities, operators, recyclingPartners, serviceById, type Service } from "@/data";
import { formatNaira, formatNumber } from "@/lib/format";

/* ------------------------------------------------------------------ */
/* Type + buttons                                                      */
/* ------------------------------------------------------------------ */

/** Marketing lede — a step above body copy. */
export const lede = "text-[17px] leading-[1.6] sm:text-[18px]";

/** Buttons that sit on slate fields (the kit's variants are for canvas). */
export const onSlate = {
  light:
    "inline-flex h-13 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-slate-ink px-6 text-[15px] font-semibold text-slate-950 transition hover:bg-white active:scale-[0.98]",
  ghost:
    "inline-flex h-13 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-slate-ink/25 px-6 text-[15px] font-medium text-slate-ink transition hover:border-slate-ink/55 hover:bg-white/5 active:scale-[0.98]",
};

export function Eyebrow({ index, children, tone = "ink", className }: { index?: string; children: ReactNode; tone?: "ink" | "light"; className?: string }) {
  return (
    <p className={cn("flex items-center gap-3 t-micro", tone === "light" ? "text-slate-ink/70" : "text-ink-3", className)}>
      {index && <span className="t-mono !text-[12px]">{index}</span>}
      <span aria-hidden className={cn("h-px w-8", tone === "light" ? "bg-slate-ink/30" : "bg-line-strong")} />
      <span className="font-medium">{children}</span>
    </p>
  );
}

export function SectionHead({
  index,
  eyebrow,
  title,
  body,
  action,
  tone = "ink",
  className,
  as: As = "h2",
}: {
  index?: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
  tone?: "ink" | "light";
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12", className)}>
      <div className="flex max-w-3xl flex-col gap-4">
        {eyebrow && (
          <Eyebrow index={index} tone={tone}>
            {eyebrow}
          </Eyebrow>
        )}
        <As className={cn("t-display", tone === "light" ? "text-slate-ink" : "text-ink")}>{title}</As>
        {body && <p className={cn(lede, "max-w-2xl", tone === "light" ? "text-slate-ink/75" : "text-ink-2")}>{body}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function ArrowLink({ to, children, tone = "ink", className }: { to: string; children: ReactNode; tone?: "ink" | "light"; className?: string }) {
  return (
    <Link
      to={to}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-sm text-[15px] font-semibold underline-offset-[6px] hover:underline",
        tone === "light" ? "text-slate-ink decoration-slate-ink/40" : "text-ink decoration-line-strong",
        className,
      )}
    >
      {children}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export function CheckList({ items, tone = "ink", className }: { items: ReactNode[]; tone?: "ink" | "light"; className?: string }) {
  return (
    <ul className={cn("flex flex-col gap-3", className)}>
      {items.map((it, i) => (
        <li key={i} className={cn("flex items-start gap-3 t-body", tone === "light" ? "text-slate-ink/85" : "text-ink-2")}>
          <Check className={cn("mt-[5px] size-4 shrink-0", tone === "light" ? "text-slate-ink" : "text-ink")} strokeWidth={2.25} />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

/** Naira figure in display type, e.g. ₦7,000 /month */
export function Price({ amount, unit, prefix, tone = "ink", size = "lg" }: { amount: number; unit?: string; prefix?: string; tone?: "ink" | "light"; size?: "md" | "lg" }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-1.5">
      {prefix && <span className={cn("t-small", tone === "light" ? "text-slate-ink/70" : "text-ink-3")}>{prefix}</span>}
      <span
        className={cn(
          "font-display font-bold tracking-[-0.03em] tnum",
          size === "lg" ? "text-[44px] leading-none" : "text-[30px] leading-none",
          tone === "light" ? "text-slate-ink" : "text-ink",
        )}
      >
        {formatNaira(amount)}
      </span>
      {unit && <span className={cn("t-small", tone === "light" ? "text-slate-ink/70" : "text-ink-2")}>{unit}</span>}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Heroes                                                              */
/* ------------------------------------------------------------------ */

export interface Crumb {
  label: string;
  to?: string;
}

function Crumbs({ items, tone }: { items: Crumb[]; tone: "ink" | "light" }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex flex-wrap items-center gap-1 t-small", tone === "light" ? "text-slate-ink/65" : "text-ink-3")}>
      {items.map((c, i) => (
        <span key={c.label} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="size-3.5" aria-hidden />}
          {c.to ? (
            <Link to={c.to} className={cn("rounded-sm", tone === "light" ? "hover:text-slate-ink" : "hover:text-ink")}>
              {c.label}
            </Link>
          ) : (
            <span aria-current="page" className={tone === "light" ? "text-slate-ink/90" : "text-ink-2"}>
              {c.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

/**
 * Interior page hero. `slate` is a full-bleed slate field (sales + service pages);
 * `light` sits on the chalk canvas (catalog, pricing) for rhythm.
 */
export function PageHero({
  crumbs,
  eyebrow,
  title,
  body,
  actions,
  aside,
  footer,
  tone = "slate",
}: {
  crumbs?: Crumb[];
  eyebrow?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  footer?: ReactNode;
  tone?: "slate" | "light";
}) {
  const light = tone === "slate";
  return (
    <section className={cn("relative isolate overflow-hidden", light ? "bg-slate text-slate-ink chalk-grain" : "bg-canvas text-ink")}>
      <div
        className={cn(
          "container-page relative grid grid-cols-1 gap-12 pb-16 pt-8 sm:pt-12 lg:gap-16 lg:pb-24 lg:pt-16",
          aside && "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center",
        )}
      >
        <div className="flex min-w-0 flex-col gap-6">
          {crumbs && <Crumbs items={crumbs} tone={light ? "light" : "ink"} />}
          {eyebrow && <Eyebrow tone={light ? "light" : "ink"}>{eyebrow}</Eyebrow>}
          <h1 className={cn("t-display-xl", !aside && "max-w-5xl")}>{title}</h1>
          {body && <p className={cn(lede, "max-w-xl", light ? "text-slate-ink/80" : "text-ink-2")}>{body}</p>}
          {actions && <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions}</div>}
        </div>
        {aside && <div className="relative min-w-0">{aside}</div>}
      </div>
      {footer && <div className="container-page relative pb-14 lg:pb-20">{footer}</div>}
    </section>
  );
}

/**
 * Strata laid along the full width of a slate field, anchored to its foot.
 * Strata slices to cover its box; drawing it 4× taller and squashing it keeps the
 * whole stack (including the clear sky above the top slab) in a short, wide strip,
 * so no band is cut flat. Keep height ≥ width × squash ÷ 1.5. Tilt is doubled-up
 * because the squash flattens it — the visible tilt stays ≈ 3°.
 */
export function StrataBand({
  className,
  squash = 0.25,
  live,
  liveIndex = 3,
  seed = 4,
  bands = 4,
  tilt = -12,
}: {
  className?: string;
  tilt?: number;
  squash?: number;
  live?: boolean;
  liveIndex?: number;
  seed?: number;
  bands?: 3 | 4 | 5;
}) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-x-0 bottom-0 -z-10 overflow-hidden", className)}>
      <div className="absolute inset-x-0 bottom-0 origin-bottom" style={{ height: `${100 / squash}%`, transform: `scaleY(${squash})` }}>
        <Strata tone="on-slate" bands={bands} live={live} liveIndex={liveIndex} seed={seed} tilt={tilt} className="h-full w-full" />
      </div>
    </div>
  );
}

/** A dark slab with stone strata at its foot; hero objects rest on it. */
export function SlabStage({ children, live, seed = 5, className }: { children: ReactNode; live?: boolean; seed?: number; className?: string }) {
  return (
    <div className={cn("relative isolate overflow-hidden rounded-[24px] bg-slate-950/30 ring-1 ring-white/10", className)}>
      <Strata tone="on-slate" bands={4} live={live} seed={seed} className="absolute inset-x-0 bottom-0 -z-10 h-[58%] w-full" />
      {children}
    </div>
  );
}

/** Facts in the hero foot: label above value, hairline separated. */
export function HeroFacts({ items, tone = "light" }: { items: Array<{ label: string; value: ReactNode }>; tone?: "ink" | "light" }) {
  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-x-6 gap-y-6 border-t pt-6 sm:grid-cols-4",
        tone === "light" ? "border-slate-ink/15" : "border-line",
      )}
    >
      {items.map((f) => (
        <div key={f.label} className="flex flex-col gap-1">
          <dt className={cn("t-micro", tone === "light" ? "text-slate-ink/65" : "text-ink-3")}>{f.label}</dt>
          <dd className={cn("font-display text-[22px] font-semibold leading-tight tracking-[-0.015em] tnum", tone === "light" ? "text-slate-ink" : "text-ink")}>{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------------ */
/* Steps — numbered, joined by a chalk line                            */
/* ------------------------------------------------------------------ */

export function Steps({ items, tone = "ink", className }: { items: Array<{ title: ReactNode; body: ReactNode }>; tone?: "ink" | "light"; className?: string }) {
  const cols = items.length === 3 ? "md:grid-cols-3" : items.length === 5 ? "md:grid-cols-5" : "md:grid-cols-4";
  return (
    <ol className={cn("grid grid-cols-1 gap-10 md:gap-8", cols, className)}>
      {items.map((s, i) => (
        <li key={i} className="relative flex gap-5 md:flex-col">
          <div className="relative flex self-stretch md:self-auto">
            <span
              className={cn(
                "relative z-10 flex size-11 shrink-0 items-center justify-center rounded-md border font-mono text-[13px] font-medium tnum",
                tone === "light" ? "border-slate-ink/30 bg-slate text-slate-ink" : "border-line-strong bg-canvas text-ink",
              )}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            {i < items.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[21px] top-11 h-[calc(100%-0.25rem)] w-0 border-l border-dashed md:left-11 md:right-[-2rem] md:top-[21px] md:h-0 md:w-auto md:border-l-0 md:border-t",
                  tone === "light" ? "border-slate-ink/35" : "border-line-strong",
                )}
              />
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-1.5 pb-1">
            <h3 className={cn("t-h3 !text-[17px]", tone === "light" ? "text-slate-ink" : "text-ink")}>{s.title}</h3>
            <p className={cn("t-body", tone === "light" ? "text-slate-ink/75" : "text-ink-2")}>{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ accordion                                                       */
/* ------------------------------------------------------------------ */

export interface FaqItem {
  q: string;
  a: ReactNode;
}

export function Faq({ items, defaultOpen = 0, className }: { items: FaqItem[]; defaultOpen?: number | null; className?: string }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const base = useId();
  return (
    <div className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((it, i) => {
        const on = open === i;
        return (
          <div key={it.q}>
            <h3>
              <button
                type="button"
                id={`${base}-q${i}`}
                aria-expanded={on}
                aria-controls={`${base}-a${i}`}
                onClick={() => setOpen(on ? null : i)}
                className="group flex w-full items-start justify-between gap-6 py-5 text-left"
              >
                <span className="t-h3 !text-[17px] text-ink">{it.q}</span>
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-sm border transition-colors",
                    on ? "border-ink bg-ink text-surface" : "border-line-strong text-ink-2 group-hover:border-ink-3 group-hover:text-ink",
                  )}
                  aria-hidden
                >
                  <Plus className={cn("size-4 transition-transform duration-300 ease-[var(--ease-out-quart)]", on && "rotate-45")} />
                </span>
              </button>
            </h3>
            <div
              id={`${base}-a${i}`}
              role="region"
              aria-labelledby={`${base}-q${i}`}
              className={cn("grid grid-cols-1 transition-[grid-template-rows] duration-300 ease-[var(--ease-out-quart)]", on ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
            >
              <div className="overflow-hidden" inert={!on}>
                <div className="t-body max-w-2xl pb-6 pr-10 text-ink-2">{it.a}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** FAQ block: heading on the left, accordion on the right. */
export function FaqSection({ items, title = "Questions, answered", index, body, id }: { items: FaqItem[]; title?: ReactNode; index?: string; body?: ReactNode; id?: string }) {
  return (
    <section id={id} className="container-page scroll-mt-24 py-20 lg:py-28">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <div className="flex flex-col gap-5 lg:sticky lg:top-28 lg:self-start">
          <Eyebrow index={index}>FAQ</Eyebrow>
          <h2 className="t-display text-ink">{title}</h2>
          <p className="t-body max-w-sm text-ink-2">
            {body ?? (
              <>
                Something we haven't covered? Call <span className="font-medium text-ink tnum">+234 700 752 8300</span> or{" "}
                <Link to="/contact" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                  send us a message
                </Link>
                .
              </>
            )}
          </p>
        </div>
        <Faq items={items} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Closing call to action                                              */
/* ------------------------------------------------------------------ */

export function CtaSlab({
  title,
  body,
  primary = { label: "Get started", to: "/signup" },
  secondary,
  className,
}: {
  title: ReactNode;
  body?: ReactNode;
  primary?: { label: string; to: string };
  secondary?: { label: string; to: string };
  className?: string;
}) {
  return (
    <section className={cn("container-page pb-20 lg:pb-28", className)}>
      <div className="relative isolate overflow-hidden rounded-[24px] bg-slate text-slate-ink chalk-grain">
        <StrataBand live seed={19} className="h-40 sm:h-48 lg:h-56" />
        <div className="flex flex-col gap-6 px-6 pb-44 pt-10 sm:px-12 sm:pb-52 sm:pt-14 lg:max-w-[62%] lg:px-16 lg:pb-60 lg:pt-20">
          <h2 className="t-display">{title}</h2>
          {body && <p className={cn(lede, "text-slate-ink/80")}>{body}</p>}
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to={primary.to} variant="signal" size="lg" trailing={<ArrowRight className="size-4" />}>
              {primary.label}
            </ButtonLink>
            {secondary && (
              <Link to={secondary.to} className={onSlate.ghost}>
                {secondary.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Lead form (estates, businesses, institutions)                       */
/* ------------------------------------------------------------------ */

const validPhone = (raw: string) => {
  const d = raw.replace(/\D/g, "");
  return (d.length === 10 && /^[789]/.test(d)) || (d.length === 11 && d.startsWith("0"));
};

export function LeadForm({
  id = "talk-to-us",
  index,
  title,
  body,
  orgLabel,
  orgPlaceholder,
  sizeLabel,
  sizeOptions,
  messagePlaceholder,
  next,
}: {
  id?: string;
  index?: string;
  title: ReactNode;
  body: ReactNode;
  orgLabel: string;
  orgPlaceholder: string;
  sizeLabel: string;
  sizeOptions: string[];
  messagePlaceholder: string;
  next: string[];
}) {
  const toast = useToast();
  const empty = { name: "", org: "", phone: "", size: "", message: "" };
  const [v, setV] = useState(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof empty, string>>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ref, setRef] = useState("");
  const set = (k: keyof typeof empty) => (val: string) => {
    setV((s) => ({ ...s, [k]: val }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err: typeof errors = {};
    if (v.name.trim().length < 2) err.name = "Enter your full name.";
    if (!v.org.trim()) err.org = `Enter the ${orgLabel.toLowerCase()}.`;
    if (!validPhone(v.phone)) err.phone = "Enter a 10-digit number after +234, e.g. 803 412 7765.";
    if (!v.size) err.size = `Choose ${sizeLabel.toLowerCase()}.`;
    setErrors(err);
    if (Object.keys(err).length) {
      toast.error("Check the highlighted fields", "A few details are missing or incorrect.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setRef(`LD-26-${String(4100 + ((v.name.length * 37 + v.org.length * 11) % 900)).padStart(4, "0")}`);
      setDone(true);
      toast.success("Request received", "A Slate account lead will call you within one working day.");
    }, 900);
  };

  return (
    <section id={id} className="scroll-mt-20 border-t border-line bg-sunken/60 py-20 lg:py-28">
      <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <div className="flex flex-col gap-6">
          <Eyebrow index={index}>Talk to Slate</Eyebrow>
          <h2 className="t-display text-ink">{title}</h2>
          <p className={cn(lede, "max-w-lg text-ink-2")}>{body}</p>
          <div className="mt-2 flex flex-col gap-3">
            <p className="t-micro text-ink-3">What happens next</p>
            <ol className="flex flex-col divide-y divide-line border-y border-line">
              {next.map((n, i) => (
                <li key={n} className="flex items-baseline gap-4 py-3.5">
                  <span className="t-mono text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                  <span className="t-body text-ink">{n}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <CleanSlate
          done={done}
          className="rounded-[24px]"
          after={
            <div className="flex h-full flex-col justify-between gap-8 rounded-[24px] border border-line bg-surface p-6 sm:p-10">
              <div className="flex items-center justify-between gap-3">
                <Badge tone="success" icon={<Check strokeWidth={3} />}>
                  Received
                </Badge>
                <span className="t-mono text-ink-3">{ref}</span>
              </div>
              <div className="flex flex-col gap-4">
                <p className="t-display text-ink">Thank you, {v.name.trim().split(/\s+/)[0]}.</p>
                <p className="t-body max-w-md text-ink-2">
                  We'll call <span className="font-medium text-ink tnum">+234 {v.phone.replace(/^0/, "")}</span> within one working day to talk about{" "}
                  <span className="font-medium text-ink">{v.org.trim()}</span>. Quote <span className="t-mono text-ink">{ref}</span> if you call us first.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <ButtonLink to="/how-it-works" variant="secondary">
                  How Slate works
                </ButtonLink>
                <Button
                  variant="ghost"
                  leading={<RotateCcw className="size-4" />}
                  onClick={() => {
                    setDone(false);
                    setV(empty);
                  }}
                >
                  Send another request
                </Button>
              </div>
            </div>
          }
        >
          <form noValidate onSubmit={submit} className="flex flex-col gap-5 rounded-[24px] border border-line bg-surface p-6 sm:p-10" aria-label="Request a proposal">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Input label="Your name" autoComplete="name" placeholder="Uduak Essien" value={v.name} onChange={(e) => set("name")(e.target.value)} error={errors.name} />
              <Input label={orgLabel} autoComplete="organization" placeholder={orgPlaceholder} value={v.org} onChange={(e) => set("org")(e.target.value)} error={errors.org} />
              <PhoneInput label="Phone" value={v.phone} onChange={(e) => set("phone")(e.target.value)} error={errors.phone} />
              <Select label={sizeLabel} placeholder="Choose one" options={sizeOptions} value={v.size} onChange={(e) => set("size")(e.target.value)} error={errors.size} />
            </div>
            <Textarea label="Anything we should know" optional rows={4} placeholder={messagePlaceholder} value={v.message} onChange={(e) => set("message")(e.target.value)} />
            <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="t-small max-w-xs text-ink-3">We use these details only to prepare your proposal. No mailing lists.</p>
              <Button type="submit" size="lg" loading={loading} trailing={<ArrowRight className="size-4" />}>
                Request a proposal
              </Button>
            </div>
          </form>
        </CleanSlate>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Address / service-availability checker                             */
/* ------------------------------------------------------------------ */

const COVERAGE: Array<{ match: string[]; area: string; zone: string; days: string; window: string }> = [
  { match: ["ewet"], area: "Ewet Housing Estate", zone: "ewet", days: "Mon & Thu", window: "07:00–09:00" },
  { match: ["shelter"], area: "Shelter Afrique Estate", zone: "shelter", days: "Mon & Thu", window: "07:00–09:00" },
  { match: ["osongama"], area: "Osongama Estate", zone: "osongama", days: "Tue & Fri", window: "07:00–09:00" },
  { match: ["aka"], area: "Aka Road", zone: "aka", days: "Tue & Fri", window: "06:30–08:30" },
  { match: ["oron"], area: "Oron Road", zone: "oron", days: "Wed & Sat", window: "07:00–09:00" },
  { match: ["nwaniba"], area: "Nwaniba Road", zone: "nwaniba", days: "Wed & Sat", window: "07:30–09:30" },
  { match: ["ikot ekpene"], area: "Ikot Ekpene Road", zone: "nwaniba", days: "Wed & Sat", window: "07:30–09:30" },
  { match: ["udo udoma"], area: "Udo Udoma Avenue", zone: "oron", days: "Tue & Fri", window: "06:30–08:30" },
  { match: ["wellington"], area: "Wellington Bassey Way", zone: "aka", days: "Tue & Fri", window: "06:30–08:30" },
  { match: ["abak"], area: "Abak Road", zone: "abak", days: "Mon & Thu", window: "08:00–10:00" },
  { match: ["itam"], area: "Itam", zone: "itam", days: "Mon & Thu", window: "08:00–10:00" },
  { match: ["use offot", "offot"], area: "Use Offot", zone: "uselga", days: "Wed & Sat", window: "08:00–10:00" },
];

/** Coverage per zone — kept high so labels stay legible in both themes. */
export const ZONE_COVERAGE: Record<string, number> = { ewet: 98, shelter: 96, osongama: 91, aka: 88, oron: 86, nwaniba: 79, abak: 74, itam: 77, uselga: 72 };

type CheckResult =
  | { kind: "served"; area: string; zone: string; days: string; window: string; operator: string }
  | { kind: "unavailable"; place: string; city?: (typeof cities)[number] };

function lookup(raw: string): CheckResult {
  const q = raw.toLowerCase();
  const hit = COVERAGE.find((c) => c.match.some((m) => q.includes(m)));
  if (hit) {
    const op = operators.find((o) => o.status === "Active" && o.areas.some((a) => a.toLowerCase().startsWith(hit.area.toLowerCase().split(" ")[0]!)));
    return { kind: "served", area: hit.area, zone: hit.zone, days: hit.days, window: hit.window, operator: op?.short ?? "a verified Slate operator" };
  }
  const city = cities.find((c) => c.status !== "Live" && q.includes(c.name.toLowerCase()));
  const place = raw.split(",")[0]!.trim() || raw.trim();
  return { kind: "unavailable", place, city };
}

const launchLabel = (launch: string) => {
  if (/Q\d/.test(launch)) return launch.replace(/(\d{4})-(Q\d)/, "$2 $1");
  return new Date(launch).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
};

export function AddressChecker({ inputId, compact }: { inputId?: string; compact?: boolean }) {
  const toast = useToast();
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string>();
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [contact, setContact] = useState("");
  const [contactError, setContactError] = useState<string>();
  const [notified, setNotified] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  // Let the AddressInput's inner <input> carry an id so other CTAs can focus it.
  useEffect(() => {
    if (inputId) wrap.current?.querySelector("input")?.setAttribute("id", inputId);
  }, [inputId]);

  const check = (e?: FormEvent, value = address) => {
    e?.preventDefault();
    if (value.trim().length < 3) {
      setError("Enter a street, estate or area — for example “Ewet Housing Estate”.");
      return;
    }
    setError(undefined);
    setChecking(true);
    setNotified(false);
    setContact("");
    setTimeout(() => {
      setChecking(false);
      setResult(lookup(value));
    }, 650);
  };

  const notify = (e: FormEvent) => {
    e.preventDefault();
    const c = contact.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c);
    if (!isEmail && !validPhone(c)) {
      setContactError("Enter a phone number (0803 412 7765) or an email address.");
      return;
    }
    setContactError(undefined);
    setNotified(true);
    toast.success("You're on the list", `We'll tell you the week Slate arrives in ${result?.kind === "unavailable" ? result.place : "your area"}.`);
  };

  const zone = result?.kind === "served" ? result.zone : undefined;

  return (
    <div className={cn("grid grid-cols-1 gap-8", !compact && "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12")}>
      <div className="flex min-w-0 flex-col gap-6">
        <form onSubmit={check} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div ref={wrap} className="min-w-0 flex-1">
            <AddressInput
              label="Your address"
              value={address}
              onChange={(val) => {
                setAddress(val);
                if (error) setError(undefined);
              }}
              error={error}
              hint="Street, estate or area — we'll match it to a Slate zone."
            />
          </div>
          <Button type="submit" size="lg" loading={checking} className="sm:mt-[26px]">
            Check address
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <span className="t-small mr-1 text-ink-3">Try</span>
          {["Ewet Housing Estate", "51 Aka Road, Uyo", "Lekki, Lagos", "Port Harcourt"].map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => {
                setAddress(x);
                setError(undefined);
                check(undefined, x);
              }}
              className="inline-flex h-8 items-center rounded-sm border border-line-strong bg-surface px-2.5 text-[13px] font-medium text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
            >
              {x}
            </button>
          ))}
        </div>

        <div aria-live="polite" className="min-h-0">
          {!result && !checking && (
            <p className="t-small flex items-center gap-2 text-ink-3">
              <MapPin className="size-4" /> Live across 9 zones in Uyo. Port Harcourt from February 2027.
            </p>
          )}
          {result?.kind === "served" && (
            <div key={result.area} className="animate-pop-in flex flex-col gap-5 rounded-lg border border-line bg-surface p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="success" dot>
                  Available
                </Badge>
                <span className="t-small text-ink-3">Uyo · {result.area}</span>
              </div>
              <p className="t-h1 text-ink">Slate serves {result.area}.</p>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 sm:grid-cols-3">
                <div>
                  <dt className="t-micro text-ink-3">Collection days</dt>
                  <dd className="t-body font-medium text-ink">{result.days}</dd>
                </div>
                <div>
                  <dt className="t-micro text-ink-3">Pickup window</dt>
                  <dd className="t-body font-medium text-ink tnum">{result.window}</dd>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <dt className="t-micro text-ink-3">Home plan from</dt>
                  <dd className="t-body font-medium text-ink tnum">₦4,500/month</dd>
                </div>
              </dl>
              <p className="t-small text-ink-2">
                Collected by {result.operator}, under contract to Slate. If they miss a pickup, Slate sends another crew within 24 hours.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <ButtonLink to="/signup" variant="signal" size="lg" trailing={<ArrowRight className="size-4" />}>
                  Get started
                </ButtonLink>
                <ButtonLink to="/pricing" variant="ghost" size="lg">
                  See pricing
                </ButtonLink>
              </div>
            </div>
          )}
          {result?.kind === "unavailable" && (
            <div key={result.place} className="animate-pop-in flex flex-col gap-5 rounded-lg border border-line bg-surface p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-sunken text-ink-2">
                  <MapPinOff className="size-5" />
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="t-h2 text-ink">Slate isn't in {result.place} yet.</p>
                  <p className="t-body text-ink-2">
                    {result.city
                      ? `${result.city.name} is ${result.city.status === "Launching" ? "launching" : "planned"} for ${launchLabel(result.city.launch)}. We're recruiting operators there now.`
                      : "We're live in nine Uyo zones and adding streets every month. Leave a number and we'll tell you the week we arrive."}
                  </p>
                </div>
              </div>
              {notified ? (
                <div className="flex items-center gap-3 rounded-md bg-success-bg px-4 py-3.5 text-success">
                  <Check className="size-[18px] shrink-0" strokeWidth={2.5} />
                  <p className="t-small font-medium">You're on the list. We'll message {contact.trim()} when Slate arrives.</p>
                </div>
              ) : (
                <form onSubmit={notify} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <Input
                    fieldClassName="flex-1"
                    className="flex-1"
                    aria-label="Phone or email"
                    placeholder="Phone or email"
                    value={contact}
                    onChange={(e) => {
                      setContact(e.target.value);
                      if (contactError) setContactError(undefined);
                    }}
                    error={contactError}
                  />
                  <Button type="submit" size="lg" variant="secondary" leading={<BellRing className="size-4" />}>
                    Notify me when Slate arrives
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
      {!compact && (
        <div className="relative">
          <ServiceAreaMap values={ZONE_COVERAGE} highlight={zone ? [zone] : undefined} legend="Coverage" className="aspect-[4/3] w-full rounded-[16px]" />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Redundancy demo — Operator A fails, Slate moves you to Operator B   */
/* ------------------------------------------------------------------ */

const RECOVERY = [
  { t: "09:00", text: "Window closes. Ufok Environmental hasn't reached 14 Ewet Housing Estate.", tone: "danger" as const },
  { t: "09:04", text: "Slate flags the pickup and calls Ufok's dispatcher. Their truck is down at Itam.", tone: "warning" as const },
  { t: "09:11", text: "Slate reassigns the job to Nwaniba Clean Crew, on standby in the next zone.", tone: "info" as const },
  { t: "12:48", text: "Collected. Ufok's SLA score drops 2 points; you see every step in the app.", tone: "success" as const },
];

export function RedundancyDemo() {
  const [step, setStep] = useState(0); // 0 = normal, 1..4 = recovery revealed
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const run = () => {
    timers.current.forEach(clearTimeout);
    setStep(1);
    timers.current = [2, 3, 4].map((s, i) => window.setTimeout(() => setStep(s), 1100 * (i + 1)));
  };
  const reset = () => {
    timers.current.forEach(clearTimeout);
    setStep(0);
  };

  const opA = step === 0 ? { label: "Assigned", tone: "info" as const } : { label: "Missed", tone: "danger" as const };
  const opB = step < 3 ? { label: "Standby", tone: "neutral" as const } : step === 3 ? { label: "En route", tone: "signal" as const } : { label: "Collected", tone: "success" as const };
  const rows = [
    { key: "A", name: "Ufok Environmental", meta: "Primary · Ewet Housing", s: opA, line: step === 0 ? "solid" : "broken" },
    { key: "B", name: "Nwaniba Clean Crew", meta: "Standby · next zone", s: opB, line: step >= 3 ? "live" : "idle" },
    { key: "C", name: "Ibom Hauliers", meta: "Standby · Itam", s: { label: "Standby", tone: "neutral" as const }, line: "idle" },
  ];
  const addr = step === 0 ? { label: "Scheduled 07:00–09:00", tone: "info" as const } : step < 4 ? { label: "Being recovered", tone: "warning" as const } : { label: "Recovered 12:48", tone: "success" as const };

  return (
    <div className="flex flex-col gap-6 rounded-[24px] bg-slate-950/30 p-5 ring-1 ring-white/10 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="t-micro text-slate-ink/70">Thu 1 Oct · Ewet Housing Estate</p>
        {step === 0 ? (
          <button type="button" onClick={run} className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-ink px-3.5 text-[14px] font-semibold text-slate-950 transition hover:bg-white">
            Simulate a missed pickup
          </button>
        ) : (
          <button type="button" onClick={reset} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-ink/25 px-3.5 text-[14px] font-medium text-slate-ink hover:bg-white/5">
            <RotateCcw className="size-4" /> Reset
          </button>
        )}
      </div>

      <ul className="flex flex-col gap-2.5" aria-label="Operators in the zone">
        {rows.map((r) => (
          <li key={r.key} className={cn("flex items-center gap-3 rounded-md px-3 py-3 transition-colors sm:px-4", r.line === "live" ? "bg-white/[0.07]" : "bg-transparent")}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-slate-ink/25 font-mono text-[13px] font-semibold text-slate-ink">{r.key}</span>
            <div className="min-w-0 shrink">
              <p className="truncate text-[14px] font-semibold text-slate-ink">{r.name}</p>
              <p className="truncate text-[12px] text-slate-ink/65">{r.meta}</p>
            </div>
            <span aria-hidden className="relative mx-1 hidden h-0 min-w-6 flex-1 sm:block">
              {r.line === "solid" && <span className="absolute inset-x-0 top-0 border-t-2 border-slate-ink/70" />}
              {r.line === "broken" && (
                <span className="absolute inset-x-0 top-0 flex items-center justify-between">
                  <span className="w-[44%] border-t-2 border-dashed border-slate-ink/45" />
                  <span className="w-[30%] border-t-2 border-dashed border-slate-ink/15" />
                </span>
              )}
              {r.line === "live" && (
                <svg className="absolute inset-x-0 -top-[2px] h-1 w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 4">
                  <line x1="0" y1="2" x2="100" y2="2" stroke="var(--signal)" strokeWidth="2.5" strokeDasharray="5 4" className="animate-dash" vectorEffect="non-scaling-stroke" />
                </svg>
              )}
              {r.line === "idle" && <span className="absolute inset-x-0 top-0 border-t border-dashed border-slate-ink/20" />}
            </span>
            <span className="ml-auto sm:ml-0">
              <Badge tone={r.s.tone} dot>
                {r.s.label}
              </Badge>
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3 border-y border-slate-ink/15 py-4">
        <MapPin className="size-5 shrink-0 text-slate-ink/80" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-slate-ink">14 Ewet Housing Estate</p>
          <p className="text-[12px] text-slate-ink/65">Slate Home · Mon & Thu</p>
        </div>
        <Badge tone={addr.tone} dot>
          {addr.label}
        </Badge>
      </div>

      <ol className="flex flex-col gap-3" aria-live="polite" aria-label="Recovery log">
        {RECOVERY.map((r, i) => {
          const shown = i < step;
          return (
            <li key={r.t} className={cn("flex gap-4 transition-opacity duration-500", shown ? "opacity-100" : "opacity-35")} aria-hidden={!shown}>
              <span className="t-mono w-11 shrink-0 text-slate-ink/70">{shown ? r.t : "--:--"}</span>
              <span className={cn("t-small", shown ? "text-slate-ink/90" : "text-slate-ink/70")}>{r.text}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Live board — the railway timetable reference (DIRECTION.md §1)      */
/* ------------------------------------------------------------------ */

export interface BoardRow {
  time: string;
  place: string;
  sub: string;
  status: { label: string; tone: "success" | "info" | "signal" | "neutral" | "warning" };
}

export function LiveBoard({ rows, title, meta, className }: { rows: BoardRow[]; title: ReactNode; meta?: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[16px] border border-line bg-surface text-ink shadow-float", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <p className="t-small font-semibold text-ink">{title}</p>
        {meta && <span className="t-mono !text-[12px] text-ink-3">{meta}</span>}
      </div>
      <ul className="divide-y divide-line">
        {rows.map((r) => (
          <li key={r.place + r.time} className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:px-5">
            <span className="t-mono text-ink-2">{r.time}</span>
            <div className="min-w-0">
              <p className="text-[14px] font-medium leading-snug text-ink">{r.place}</p>
              <p className="truncate text-[12px] text-ink-3">{r.sub}</p>
            </div>
            {r.status.tone === "signal" ? (
              <span className="inline-flex h-6 items-center gap-1.5 rounded-sm bg-signal px-2 text-[12px] font-semibold text-signal-ink">
                <LiveDot className="size-2 [&>span]:size-2 [&>span]:bg-signal-ink" />
                {r.status.label}
              </span>
            ) : (
              <Badge tone={r.status.tone} dot>
                {r.status.label}
              </Badge>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero objects                                                        */
/* ------------------------------------------------------------------ */

const ROUTE_STOPS = [0.2, 0.46, 0.74];

/** A household's collection, live on the route map. */
export function PickupStage() {
  return (
    <SlabStage live seed={9} className="aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5] xl:aspect-[1/1]">
      <RouteMap progress={0.58} stops={ROUTE_STOPS} className="absolute inset-x-0 top-0 h-[64%] w-full opacity-90" />
      <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6">
        <div className="rounded-[16px] border border-line bg-surface p-4 text-ink shadow-float sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex h-6 items-center gap-1.5 rounded-sm bg-signal px-2 text-[12px] font-semibold text-signal-ink">
              <LiveDot className="size-2 [&>span]:size-2 [&>span]:bg-signal-ink" /> On the way
            </span>
            <span className="t-mono !text-[12px] text-ink-3">PU-26-08813</span>
          </div>
          <p className="mt-3 font-display text-[30px] font-bold leading-none tracking-[-0.025em]">Today, 07:00–09:00</p>
          <p className="mt-2 t-small text-ink-2">2 stops away · about 9 min · Ufok Environmental for Slate</p>
        </div>
      </div>
    </SlabStage>
  );
}

/** 312 households in one estate agreement, as a dot matrix. */
export function EstateMatrix({ total = 312, tone = "light", className }: { total?: number; tone?: "light" | "ink"; className?: string }) {
  // Deterministic spread of overdue and Smart Sweep homes.
  const state = (i: number) => (i % 47 === 13 || i % 61 === 5 ? "overdue" : i % 23 === 7 ? "sweep" : "paid");
  const counts = Array.from({ length: total }, (_, i) => state(i)).reduce<Record<string, number>>((a, s) => ((a[s] = (a[s] ?? 0) + 1), a), {});
  const L = tone === "light";
  return (
    <div className={className}>
      <div className="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-[3px] sm:gap-1" role="img" aria-label={`${total} households: ${counts.paid} paid, ${counts.sweep ?? 0} on Smart Sweep, ${counts.overdue ?? 0} overdue`}>
        {Array.from({ length: total }, (_, i) => {
          const s = state(i);
          return (
            <span
              key={i}
              className={cn(
                "aspect-square rounded-[2px]",
                s === "paid" && (L ? "bg-slate-ink/85" : "bg-slate dark:bg-slate-300"),
                s === "sweep" && (L ? "bg-slate-ink/35" : "bg-slate-400 dark:bg-slate-600"),
                s === "overdue" && (L ? "ring-1 ring-inset ring-slate-ink/50" : "ring-1 ring-inset ring-ink-3"),
              )}
            />
          );
        })}
      </div>
      <ul className={cn("mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[12px]", L ? "text-slate-ink/75" : "text-ink-2")}>
        <li className="flex items-center gap-2">
          <span className={cn("size-2.5 rounded-[2px]", L ? "bg-slate-ink/85" : "bg-slate dark:bg-slate-300")} /> Paid · {counts.paid}
        </li>
        <li className="flex items-center gap-2">
          <span className={cn("size-2.5 rounded-[2px]", L ? "bg-slate-ink/35" : "bg-slate-400 dark:bg-slate-600")} /> Smart Sweep · {counts.sweep ?? 0}
        </li>
        <li className="flex items-center gap-2">
          <span className={cn("size-2.5 rounded-[2px] ring-1 ring-inset", L ? "ring-slate-ink/50" : "ring-ink-3")} /> Overdue · {counts.overdue ?? 0} — Slate follows up
        </li>
      </ul>
    </div>
  );
}

export function EstateStage() {
  return (
    <SlabStage seed={13} className="p-5 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="t-micro text-slate-ink/70">Shelter Afrique Estate · October</p>
          <p className="mt-1 font-display text-[34px] font-bold leading-none tracking-[-0.03em] text-slate-ink tnum">312 homes</p>
        </div>
        <Badge tone="success" dot>
          One agreement
        </Badge>
      </div>
      <EstateMatrix className="mt-6" />
      <div className="mt-24 sm:mt-32" />
    </SlabStage>
  );
}

const BRANCHES = [
  ["Grand Atlantic — Ikot Ekpene Rd", 31, 96_000],
  ["Grand Atlantic — Oron Rd", 31, 88_500],
  ["Grand Atlantic — Aka Rd", 26, 64_000],
  ["Grand Atlantic — Wellington Bassey", 26, 64_000],
  ["Grand Atlantic — Eket", 13, 46_500],
] as const;

/** One invoice for many branches. */
export function BranchInvoice({ className }: { className?: string }) {
  const shown = BRANCHES.reduce((a, [, , v]) => a + v, 0);
  const total = 842_500;
  return (
    <div className={cn("overflow-hidden rounded-[16px] border border-line bg-surface text-ink shadow-float", className)}>
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <p className="t-small font-semibold">Grand Atlantic Group</p>
          <p className="t-small text-ink-3">October · 12 branches · one invoice</p>
        </div>
        <span className="t-mono !text-[12px] text-ink-3">INV-26-1043</span>
      </div>
      <ul className="divide-y divide-line px-5">
        {BRANCHES.map(([name, pickups, amount]) => (
          <li key={name} className="flex items-center justify-between gap-4 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-[14px] text-ink">{name}</p>
              <p className="text-[12px] text-ink-3 tnum">{pickups} pickups</p>
            </div>
            <span className="t-mono text-ink">{formatNaira(amount)}</span>
          </li>
        ))}
        <li className="flex items-center justify-between gap-4 py-2.5 text-ink-3">
          <span className="text-[14px]">7 more branches</span>
          <span className="t-mono">{formatNaira(total - shown)}</span>
        </li>
      </ul>
      <div className="flex items-baseline justify-between gap-4 border-t border-line bg-sunken/60 px-5 py-4">
        <span className="t-small font-medium text-ink-2">Total due 5 Nov</span>
        <span className="font-display text-[26px] font-bold leading-none tracking-[-0.02em] tnum">{formatNaira(total)}</span>
      </div>
    </div>
  );
}

const FACILITIES = [
  ["Main campus kitchens", "Daily · 05:30", "Food waste"],
  ["Ikpa Hills Medical Centre", "Daily · 06:00", "Non-hazardous clinical"],
  ["Hostels A–D", "Mon, Wed, Fri · 07:00", "General"],
  ["Senate & admin block", "Tue & Fri · 16:00", "Paper, general"],
  ["Sports complex", "Sat · 18:00", "Event, recyclables"],
] as const;

export function FacilitySchedule({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[16px] border border-line bg-surface text-ink shadow-float", className)}>
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <p className="t-small font-semibold">Ikpa Hills University</p>
          <p className="t-small text-ink-3">7 facilities · contract IA-UYO-001</p>
        </div>
        <Badge tone="success" dot>
          Compliant
        </Badge>
      </div>
      <ul className="divide-y divide-line px-5">
        {FACILITIES.map(([name, when, kind]) => (
          <li key={name} className="flex items-center justify-between gap-4 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-[14px] text-ink">{name}</p>
              <p className="truncate text-[12px] text-ink-3">{kind}</p>
            </div>
            <span className="t-mono shrink-0 !text-[12px] text-ink-2">{when}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2 border-t border-line px-5 py-4">
        {["Disposal certificates · Q3", "Operator permits", "Insurance cover", "Monthly report"].map((d) => (
          <Badge key={d} tone="neutral">
            {d}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function BulkQuote({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[16px] border border-line bg-surface text-ink shadow-float", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <p className="t-small font-semibold">Bulk pickup quote</p>
        <span className="t-mono !text-[12px] text-ink-3">BQ-26-0317</span>
      </div>
      <div className="grid grid-cols-3 gap-2 px-5 pt-5">
        {["2-seater sofa", "Old fridge", "6 cartons"].map((x, i) => (
          <div key={x} className="relative aspect-[4/3] overflow-hidden rounded-md bg-sunken">
            <Strata tone="on-light" bands={3} seed={21 + i * 4} chalk={false} className="absolute inset-0 h-full w-full opacity-60" />
            <span className="absolute bottom-1.5 left-2 right-2 truncate rounded-[4px] bg-surface/90 px-1.5 py-0.5 text-[12px] font-medium text-ink">{x}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1 px-5 py-5">
        <p className="t-small text-ink-3">3 photos · 12 Osongama Estate Phase 2 · moving out</p>
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-display text-[34px] font-bold leading-none tracking-[-0.03em] tnum">₦28,500</span>
          <Badge tone="info" dot>
            Quoted in 1h 40m
          </Badge>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line bg-sunken/60 px-5 py-3.5">
        <span className="t-small text-ink-2">Sat 10 Oct · 10:00–12:00 · two-person crew</span>
        <Check className="size-4 text-success" strokeWidth={2.5} />
      </div>
    </div>
  );
}

const MATERIALS = [
  { label: "Organic", partner: "Akwa Compost Works", kg: recyclingPartners[4]!.volumeKg },
  { label: "Paper & cardboard", partner: "PaperLoop Uyo", kg: recyclingPartners[2]!.volumeKg },
  { label: "PET & HDPE plastic", partner: "Itam Recovery", kg: recyclingPartners[0]!.volumeKg },
  { label: "Cans & scrap metal", partner: "Ikot Metal Reclaim", kg: recyclingPartners[1]!.volumeKg },
  { label: "E-waste", partner: "Ewet E-Cycle", kg: recyclingPartners[3]!.volumeKg },
];
export const RECOVERED_KG = MATERIALS.reduce((a, m) => a + m.kg, 0);

/** Recovered kilograms by material — real numbers, not recycling arrows. */
export function MaterialBars({ tone = "ink", className }: { tone?: "ink" | "light"; className?: string }) {
  const max = Math.max(...MATERIALS.map((m) => m.kg));
  const L = tone === "light";
  return (
    <ul className={cn("flex flex-col gap-4", className)}>
      {MATERIALS.map((m) => (
        <li key={m.label} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className={cn("text-[14px] font-medium", L ? "text-slate-ink" : "text-ink")}>
              {m.label} <span className={cn("font-normal", L ? "text-slate-ink/65" : "text-ink-3")}>· {m.partner}</span>
            </span>
            <span className={cn("t-mono shrink-0", L ? "text-slate-ink/85" : "text-ink-2")}>{formatNumber(m.kg)} kg</span>
          </div>
          <div className={cn("h-2.5 overflow-hidden rounded-[3px]", L ? "bg-white/10" : "bg-sunken")}>
            <div className={cn("h-full rounded-[3px]", L ? "bg-slate-ink/80" : "bg-slate dark:bg-slate-300")} style={{ width: `${(m.kg / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** A contracted operator's month with Slate. */
export function OperatorCard({ className }: { className?: string }) {
  const ufok = operators.find((o) => o.id === "op-ufok")!;
  const util = Math.round((ufok.assigned / ufok.capacity) * 100);
  return (
    <div className={cn("flex flex-col rounded-[24px] border border-line bg-surface text-ink", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-line p-6">
        <div>
          <p className="t-small font-semibold text-ink">{ufok.name}</p>
          <p className="t-small text-ink-3">Slate operator since March · {ufok.vehicles} trucks</p>
        </div>
        <Badge tone="success" dot>
          Verified
        </Badge>
      </div>
      <dl className="grid grid-cols-2 divide-x divide-line border-b border-line">
        <div className="p-6">
          <dt className="t-micro text-ink-3">Paid on 5 Sep</dt>
          <dd className="font-display text-[30px] font-bold leading-tight tracking-[-0.02em] text-ink tnum">₦9.42m</dd>
        </div>
        <div className="p-6">
          <dt className="t-micro text-ink-3">Homes assigned</dt>
          <dd className="font-display text-[30px] font-bold leading-tight tracking-[-0.02em] text-ink tnum">{formatNumber(ufok.assigned)}</dd>
        </div>
      </dl>
      <div className="flex flex-col gap-3 p-6">
        <div className="flex items-baseline justify-between">
          <span className="t-small text-ink-2">Fleet utilisation</span>
          <span className="t-mono text-ink">{util}%</span>
        </div>
        <Meter value={util} segments={20} />
        <p className="t-small text-ink-3">Up from 41% before joining Slate. No sales team, no debt collection.</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Service detail template                                             */
/* ------------------------------------------------------------------ */

export interface PlanCard {
  serviceId?: string;
  name?: string;
  price?: number;
  unit?: string;
  prefix?: string;
  blurb?: string;
  included?: string[];
  featured?: boolean;
  breakdown?: Array<[string, string]>;
  cta?: { label: string; to: string };
}

export interface ServicePageConfig {
  crumb: string;
  eyebrow: string;
  title: ReactNode;
  body: string;
  primary?: { label: string; to: string };
  secondary?: { label: string; to: string };
  aside: ReactNode;
  facts: Array<{ label: string; value: ReactNode }>;
  included: { title: ReactNode; body: string; items: Array<{ title: string; body: string }> };
  steps: { title: ReactNode; items: Array<{ title: string; body: string }> };
  extra?: ReactNode;
  plans: { title: ReactNode; body: string; cards: PlanCard[]; note?: ReactNode };
  faqs: FaqItem[];
  related: Array<{ label: string; to: string; body: string }>;
  cta: { title: ReactNode; body: string; primary?: { label: string; to: string }; secondary?: { label: string; to: string } };
}

function resolvePlan(p: PlanCard): Required<Pick<PlanCard, "name" | "price" | "unit" | "included">> & PlanCard {
  const s: Service | undefined = p.serviceId ? serviceById(p.serviceId) : undefined;
  return {
    ...p,
    name: p.name ?? s?.name ?? "",
    price: p.price ?? s?.priceFrom ?? 0,
    unit: p.unit ?? s?.priceUnit ?? "",
    blurb: p.blurb ?? s?.short,
    included: p.included ?? s?.included ?? [],
  };
}

export function PlanGrid({ cards }: { cards: PlanCard[] }) {
  const cols = cards.length >= 3 ? "lg:grid-cols-3" : cards.length === 2 ? "md:grid-cols-2" : "max-w-xl";
  return (
    <div className={cn("grid grid-cols-1 gap-4", cols)}>
      {cards.map((raw) => {
        const p = resolvePlan(raw);
        const F = !!p.featured;
        return (
          <article
            key={p.name}
            className={cn(
              "relative flex flex-col gap-6 overflow-hidden rounded-[16px] p-6 sm:p-7",
              F ? "bg-slate text-slate-ink chalk-grain" : "border border-line bg-surface text-ink",
            )}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="t-h2">{p.name}</h3>
                {F && <span className="rounded-sm bg-white/12 px-2 py-1 text-[12px] font-semibold text-slate-ink">Most chosen</span>}
              </div>
              {p.blurb && <p className={cn("t-small", F ? "text-slate-ink/75" : "text-ink-2")}>{p.blurb}</p>}
            </div>
            <Price amount={p.price} unit={p.unit} prefix={p.prefix ?? "From"} tone={F ? "light" : "ink"} />
            {p.breakdown && (
              <dl className={cn("flex flex-col divide-y rounded-md border text-[14px]", F ? "divide-white/10 border-white/15" : "divide-line border-line")}>
                {p.breakdown.map(([k, val]) => (
                  <div key={k} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                    <dt className={F ? "text-slate-ink/75" : "text-ink-2"}>{k}</dt>
                    <dd className="t-mono">{val}</dd>
                  </div>
                ))}
              </dl>
            )}
            <CheckList items={p.included} tone={F ? "light" : "ink"} className="flex-1" />
            {p.cta &&
              (F ? (
                <ButtonLink to={p.cta.to} variant="signal" size="lg" block trailing={<ArrowRight className="size-4" />}>
                  {p.cta.label}
                </ButtonLink>
              ) : (
                <ButtonLink to={p.cta.to} variant="outline" size="lg" block>
                  {p.cta.label}
                </ButtonLink>
              ))}
          </article>
        );
      })}
    </div>
  );
}

export function ServicePage({ c }: { c: ServicePageConfig }) {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Services", to: "/services" }, { label: c.crumb }]}
        eyebrow={c.eyebrow}
        title={c.title}
        body={c.body}
        actions={
          <>
            <ButtonLink to={c.primary?.to ?? "/signup"} variant="signal" size="lg" trailing={<ArrowRight className="size-4" />}>
              {c.primary?.label ?? "Get started"}
            </ButtonLink>
            <Link to={c.secondary?.to ?? "/pricing"} className={onSlate.ghost}>
              {c.secondary?.label ?? "See pricing"}
            </Link>
          </>
        }
        aside={c.aside}
        footer={<HeroFacts items={c.facts} />}
      />

      {/* What's included */}
      <section className="container-page py-20 lg:py-28">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <SectionHead eyebrow="What's included" index="01" title={c.included.title} body={c.included.body} />
          <dl className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
            {c.included.items.map((it) => (
              <div key={it.title} className="flex flex-col gap-1.5 border-t border-line py-6">
                <dt className="t-h3 !text-[17px] text-ink">{it.title}</dt>
                <dd className="t-body text-ink-2">{it.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* How it works for this segment */}
      <section className="border-y border-line bg-surface py-20 lg:py-28">
        <div className="container-page flex flex-col gap-14">
          <SectionHead eyebrow="How it works" index="02" title={c.steps.title} action={<ArrowLink to="/how-it-works">How Slate manages operators</ArrowLink>} />
          <Steps items={c.steps.items} />
        </div>
      </section>

      {c.extra}

      {/* Pricing */}
      <section className="container-page py-20 lg:py-28">
        <div className="flex flex-col gap-12">
          <SectionHead eyebrow="Pricing" index="03" title={c.plans.title} body={c.plans.body} action={<ArrowLink to="/pricing">All pricing</ArrowLink>} />
          <PlanGrid cards={c.plans.cards} />
          {c.plans.note && <div className="t-small max-w-3xl text-ink-3">{c.plans.note}</div>}
        </div>
      </section>

      <div className="border-t border-line">
        <FaqSection items={c.faqs} index="04" />
      </div>

      {/* Related */}
      <section className="container-page pb-20 lg:pb-28">
        <p className="mb-4 t-micro text-ink-3">Related services</p>
        <div className="grid grid-cols-1 divide-y divide-line border-y border-line md:grid-cols-3 md:divide-x md:divide-y-0">
          {c.related.map((r) => (
            <Link key={r.to} to={r.to} className="group flex flex-col gap-1.5 py-6 md:px-6 md:first:pl-0">
              <span className="flex items-center justify-between gap-3 t-h2 text-ink">
                {r.label}
                <ArrowRight className="size-5 text-ink-3 transition-transform group-hover:translate-x-1 group-hover:text-ink" />
              </span>
              <span className="t-body text-ink-2">{r.body}</span>
            </Link>
          ))}
        </div>
      </section>

      <CtaSlab title={c.cta.title} body={c.cta.body} primary={c.cta.primary} secondary={c.cta.secondary ?? { label: "Talk to us", to: "/contact" }} />
    </>
  );
}

/** Sentence-case labels for service categories. */
export const CATEGORY_LABEL: Record<string, string> = {
  "Household Waste": "Household",
  "Commercial Waste": "Commercial",
  "Estate Waste Management": "Estate",
  "Institutional Waste": "Institutional",
  "Bulk Waste": "Bulk waste",
  Recycling: "Recycling",
  "Special Collection": "Special collection",
  "Event Cleanup": "Event cleanup",
};

/* ------------------------------------------------------------------ */
/* Small shared helpers                                                */
/* ------------------------------------------------------------------ */

/** Scroll to an in-page section and focus a control inside it. */
export function scrollToId(id: string, focusId?: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  if (focusId) window.setTimeout(() => (document.getElementById(focusId) as HTMLInputElement | null)?.focus({ preventScroll: true }), 450);
}

/** A row of words separated by chalk dots — "One company · One payment …". */
export function DotRow({ items, tone = "light", className }: { items: string[]; tone?: "ink" | "light"; className?: string }) {
  return (
    <p className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 t-small font-medium", tone === "light" ? "text-slate-ink/80" : "text-ink-2", className)}>
      {items.map((it, i) => (
        <Fragment key={it}>
          {i > 0 && <span aria-hidden className={cn("size-1 rounded-full", tone === "light" ? "bg-slate-ink/40" : "bg-ink-3")} />}
          <span>{it}</span>
        </Fragment>
      ))}
    </p>
  );
}
