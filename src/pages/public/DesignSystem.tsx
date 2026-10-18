import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle, ArrowRight, Bell, Building2, CalendarClock, Check, Clock, CreditCard, Download, FileSignature, Filter, LifeBuoy,
  Link2, MapPin, MessageSquareWarning, Moon, MoreHorizontal, Package, Pencil, Play, Receipt, Recycle, RotateCcw, Route, Search, Settings,
  Share2, ShieldCheck, Star, Sun, Trash2, Truck, Users, Wallet, X, Plus, Bookmark, Sparkles, Leaf,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useSession } from "@/lib/session";
import { Logo } from "@/components/brand/Logo";
import { SlabMark, Strata } from "@/components/brand/Strata";
import { RouteMap } from "@/components/brand/RouteMap";
import { ServiceAreaMap } from "@/components/brand/ServiceAreaMap";
import { CleanSlate } from "@/components/brand/CleanSlate";
import {
  AddressInput, Alert, AreaChart, Avatar, AvatarStack, Badge, BarChart, Breadcrumbs, Button, Checkbox, ChipGroup, ChoiceCard,
  ConfirmDialog, CurrencyInput, DataTable, DescriptionList, Donut, Drawer, EmptyState, FileDrop, FilterBar, Glyph, IconButton, Input,
  Kbd, List, ListRow, LiveDot, Menu, Meter, Modal, OTPInput, Panel, PasswordInput, PhoneInput, Popover, ProgressBar, Ref, SearchInput,
  Segmented, Select, Skeleton, SkeletonRows, Sparkline, Spinner, StackedBar, Stat, StatStrip, StateView, StatusBadge, Stepper, Switch,
  Tabs, Textarea, Timeline, Tooltip, useFilteredRows, useToast, type Column, type SystemState, type Tone, type UploadedFile,
} from "@/components/ui";
import { customers, myPickups, pickups, series, todaysPickups, type Pickup } from "@/data";
import { formatDay, formatNaira, formatNairaShort, formatNumber, formatTime } from "@/lib/format";
import { Eyebrow, SlateSlab, UYO_ZONE_INFO } from "./_info";

/* ================================================================== */
/* Page map                                                            */
/* ================================================================== */

const SECTIONS = [
  { id: "principles", label: "Principles" },
  { id: "logo", label: "Logo" },
  { id: "colour", label: "Colour" },
  { id: "type", label: "Typography" },
  { id: "space", label: "Space & shape" },
  { id: "icons", label: "Iconography" },
  { id: "richness", label: "Richness" },
  { id: "components", label: "Components" },
  { id: "overlays", label: "Overlays" },
  { id: "states", label: "System states" },
  { id: "signature", label: "Signature" },
  { id: "voice", label: "Voice & copy" },
  { id: "layout", label: "Layout" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export default function DesignSystem() {
  const { theme, setTheme } = useSession();
  const [active, setActive] = useState<SectionId>("principles");
  const chipBar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id as SectionId);
      },
      { rootMargin: "-140px 0px -62% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Keep the active chip visible in the mobile bar.
  useEffect(() => {
    const bar = chipBar.current;
    const chip = bar?.querySelector<HTMLElement>(`[data-chip="${active}"]`);
    if (!bar || !chip) return;
    bar.scrollTo({ left: chip.offsetLeft - bar.clientWidth / 2 + chip.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  const go = (id: SectionId) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <div className="pb-24 md:pb-32">
      {/* ---------- Header ---------- */}
      <header className="container-page pb-12 pt-10 md:pb-16 md:pt-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <div className="flex min-w-0 flex-col gap-6">
            <Eyebrow>Slate design system · v1.0</Eyebrow>
            <h1 className="t-display-xl text-ink">
              The slab,
              <br />
              the chalk,
              <br />
              the signal.
            </h1>
            <p className="t-body max-w-xl text-ink-2 md:text-[18px] md:leading-[1.55]">
              Every token, component and rule behind Slate, from the household app to the operations control centre. Everything on this page is the
              real kit, running live. Switch the appearance and watch it hold.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <Segmented
                value={theme}
                onChange={(v) => setTheme(v)}
                options={[
                  { value: "light", label: <span className="inline-flex items-center gap-1.5"><Sun className="size-4" />Light</span> },
                  { value: "dark", label: <span className="inline-flex items-center gap-1.5"><Moon className="size-4" />Dark</span> },
                ]}
              />
              <dl className="flex gap-6">
                <div>
                  <dt className="t-micro text-ink-3">Tokens</dt>
                  <dd className="t-mono text-ink">src/index.css</dd>
                </div>
                <div>
                  <dt className="t-micro text-ink-3">Kit</dt>
                  <dd className="t-mono text-ink">components/ui</dd>
                </div>
              </dl>
            </div>
          </div>
          <SlateSlab live seed={21} bands={5} className="aspect-[4/3] lg:aspect-[5/4.4]" strataClassName="h-[46%]">
            <div className="flex h-full flex-col p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <SlabMark className="size-8 text-slate-ink" />
                <span className="t-mono text-slate-ink/60">Oct 2026</span>
              </div>
              <p className="mt-6 font-display text-[clamp(30px,4.6vw,52px)] font-bold leading-[0.98] tracking-[-0.03em]" style={{ fontVariationSettings: '"opsz" 72, "wdth" 90' }}>
                Dependable.
                <br />
                Composed.
                <br />
                Local.
              </p>
            </div>
          </SlateSlab>
        </div>
      </header>

      {/* ---------- Mobile section chips ---------- */}
      <nav aria-label="Design system sections" className="sticky top-16 z-30 border-y border-line bg-glass backdrop-blur-xl backdrop-saturate-150 lg:hidden">
        <div ref={chipBar} className="flex gap-1.5 overflow-x-auto px-5 py-2.5 scrollbar-none md:px-8">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              data-chip={s.id}
              onClick={() => go(s.id)}
              aria-current={active === s.id ? "location" : undefined}
              className={cn(
                "h-8 shrink-0 whitespace-nowrap rounded-sm px-3 text-[13px] font-medium transition-colors",
                active === s.id ? "bg-ink text-surface" : "text-ink-2 hover:bg-sunken hover:text-ink",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="container-page lg:grid lg:grid-cols-[188px_minmax(0,1fr)] lg:gap-14 xl:gap-20">
        {/* ---------- Desktop rail ---------- */}
        <aside className="hidden lg:block">
          <nav aria-label="Design system sections" className="sticky top-[104px] pt-2">
            <ol className="flex flex-col border-l border-line">
              {SECTIONS.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      go(s.id);
                    }}
                    aria-current={active === s.id ? "location" : undefined}
                    className={cn(
                      "-ml-px flex items-baseline gap-3 border-l-2 py-[7px] pl-4 t-small transition-colors",
                      active === s.id ? "border-ink font-medium text-ink" : "border-transparent text-ink-3 hover:text-ink",
                    )}
                  >
                    <span className="t-mono w-5 text-[12px] text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                    {s.label}
                  </a>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="mt-8 flex items-center gap-2 pl-4 t-small font-medium text-ink-2 hover:text-ink"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              {theme === "dark" ? "Light appearance" : "Dark appearance"}
            </button>
          </nav>
        </aside>

        <div className="min-w-0 pt-12 lg:pt-0">
          <Principles />
          <LogoSection />
          <ColourSection />
          <TypeSection />
          <SpaceSection />
          <IconSection />
          <RichnessSection />
          <ComponentsSection />
          <OverlaysSection />
          <StatesSection />
          <SignatureSection />
          <VoiceSection />
          <LayoutSection />
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Page furniture                                                      */
/* ================================================================== */

function DSSection({ id, n, title, lede, children }: { id: SectionId; n: string; title: string; lede: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-[136px] pb-20 md:pb-28 lg:scroll-mt-[104px]">
      <header className="flex flex-col gap-3 border-t border-ink pt-5">
        <span className="t-mono text-ink-3">{n}</span>
        <h2 className="t-display text-ink">{title}</h2>
        <p className="t-body max-w-2xl text-ink-2 md:text-[17px] md:leading-relaxed">{lede}</p>
      </header>
      <div className="mt-10 flex flex-col gap-14 md:mt-12 md:gap-16">{children}</div>
    </section>
  );
}

function Sub({ title, note, children, api }: { title: string; note?: ReactNode; children: ReactNode; api?: string }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
        <div className="flex max-w-2xl flex-col gap-1">
          <h3 className="t-h2 text-ink">{title}</h3>
          {note && <p className="t-small text-ink-2">{note}</p>}
        </div>
        {api && <code className="t-mono shrink-0 text-[12.5px] text-ink-3">{api}</code>}
      </div>
      {children}
    </div>
  );
}

/** Live example frame. */
function Specimen({ children, className, label, tone = "surface" }: { children: ReactNode; className?: string; label?: string; tone?: "surface" | "canvas" | "slate" }) {
  return (
    <div
      className={cn(
        "relative rounded-lg",
        tone === "surface" && "border border-line bg-surface",
        tone === "canvas" && "border border-dashed border-line-strong",
        tone === "slate" && "bg-slate text-slate-ink chalk-grain",
        className,
      )}
    >
      {label && (
        <p className={cn("px-5 pt-4 t-mono text-[12px] sm:px-6", tone === "slate" ? "text-slate-ink/55" : "text-ink-3")}>{label}</p>
      )}
      <div className={cn("p-5 sm:p-6", label && "pt-3 sm:pt-3")}>{children}</div>
    </div>
  );
}

function Rule({ kind, children }: { kind: "do" | "dont"; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span
        className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm", kind === "do" ? "bg-success-bg text-success" : "bg-danger-bg text-danger")}
        aria-label={kind === "do" ? "Do" : "Don't"}
      >
        {kind === "do" ? <Check className="size-3.5" strokeWidth={3} /> : <X className="size-3.5" strokeWidth={3} />}
      </span>
      <p className="t-small text-ink-2">{children}</p>
    </div>
  );
}

/* ================================================================== */
/* 01 Principles                                                       */
/* ================================================================== */

const REFUSED = [
  ["Leaf-green primary", "Slate grey is the brand. Green only ever means success: collected, paid, approved."],
  ["Recycling arrows and leaves as decoration", "Recycling is a service, shown with real numbers, 38 kg recovered, not a looping arrow."],
  ["Smiling illustrated people holding bins", "Stone strata, chalk lines and Uyo route maps. No people we invented."],
  ["Glassmorphism dashboards", "Flat content on chalk. Blur only on the mobile tab bar and sticky headers."],
  ["“Hello, Name 👋” headers", "The customer home opens with the day of the next pickup."],
  ["Pastel stat tiles in a 2×2 grid", "One accent, one role. Say the fact as a sentence, or one hero number."],
];

function Principles() {
  return (
    <DSSection
      id="principles"
      n="01"
      title="Slate is a clean slate"
      lede="Every pickup wipes the slate clean. The product is a slab of dependable stone, layered, quiet, solid, with one hi-vis signal that tells you where the action is right now: the truck, the next pickup, the thing that needs you."
    >
      <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3">
        {[
          ["Dependable", "Fixed days, fixed windows, a missed pickup recovered within 24 hours. The interface promises nothing the service can't keep."],
          ["Composed", "Calm under load. An ops lead with 34 open complaints sees the worst first, in order, without alarm colours everywhere."],
          ["Local", "Ewet, Aka Road, Itam. Naira, not dollars. Names from the place. A Uyo resident should recognise their street."],
        ].map(([w, d], i) => (
          <div key={w} className="flex flex-col gap-3 bg-surface p-6">
            <span className="t-mono text-ink-3">0{i + 1}</span>
            <p className="font-display text-[30px] font-bold leading-none tracking-[-0.025em] text-ink">{w}.</p>
            <p className="t-small text-ink-2">{d}</p>
          </div>
        ))}
      </div>

      <Sub title="Where the look comes from" note="References from outside software. If a decision can't be traced to one of these, it probably isn't Slate.">
        <ol className="grid gap-6 md:grid-cols-3">
          {[
            ["Roofing slate and school chalk slates", "Layered stone, chalk marks, the matte grey of a board wiped clean. Gives us the palette, the strata and the grain."],
            ["Hi-vis vests and truck beacons at 6am", "The one orange thing on a grey Uyo street is the truck. Gives us signal, and its single job."],
            ["A well-run railway timetable board", "Rows, times, references, nothing extra. Gives us hairline lists, tabular figures and mono references."],
          ].map(([t, d], i) => (
            <li key={t} className="flex flex-col gap-2 border-t border-line pt-4">
              <span className="t-mono text-ink-3">R{i + 1}</span>
              <p className="t-h3 text-ink">{t}</p>
              <p className="t-small text-ink-2">{d}</p>
            </li>
          ))}
        </ol>
      </Sub>

      <Sub title="The category default we refuse" note="Most waste and recycling apps look the same. These are the defaults we deliberately don't use, and what we do instead.">
        <div className="divide-y divide-line border-y border-line">
          {REFUSED.map(([no, yes]) => (
            <div key={no} className="grid gap-1.5 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-8">
              <p className="t-body text-ink-3 line-through decoration-ink-3/60">{no}</p>
              <p className="t-body text-ink">{yes}</p>
            </div>
          ))}
        </div>
      </Sub>

      <Sub title="Working rules" note="The short version of DIRECTION.md §10, what every page in the platform follows.">
        <ol className="grid gap-x-10 gap-y-5 md:grid-cols-2">
          {[
            ["Tokens only", "Semantic utilities for every colour. No raw hex outside illustration. Dark mode comes free."],
            ["One accent, one role", "Signal means live, now or needs-you, plus the single marketing CTA. Never decoration."],
            ["Space and hairlines first", "Panels only for objects: a pickup, an invoice, a contract. No cards inside cards."],
            ["Status is never colour alone", "Every badge carries a word. Every chart carries a label."],
            ["Mobile first, thumb first", "Designed at 390px. Primary actions in the thumb zone. Tables become stacked rows."],
            ["Everything works", "Tabs filter, search searches, forms validate, destructive actions confirm."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-4">
              <span className="font-display text-[22px] font-bold leading-none text-ink-3 tnum">{i + 1}</span>
              <div>
                <p className="t-h3 text-ink">{t}</p>
                <p className="t-small mt-0.5 text-ink-2">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </Sub>
    </DSSection>
  );
}

/* ================================================================== */
/* 02 Logo                                                             */
/* ================================================================== */

function LogoSection() {
  return (
    <DSSection
      id="logo"
      n="02"
      title="Logo"
      lede="A placeholder wordmark until the real mark arrives. Three cut slabs, the lowest one in signal, the only place the accent lives in the brand."
    >
      <Alert tone="neutral" title="Placeholder, this logo will be replaced">
        Every surface renders the brand through one component, <span className="t-mono text-ink">src/components/brand/Logo.tsx</span>. Swap that file and the
        header, footer, auth screens, portals and favicon follow.
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        <Specimen label="<Logo />  on chalk" className="min-h-48">
          <div className="flex h-32 items-center justify-center">
            <Logo to={null} className="scale-[1.6]" />
          </div>
        </Specimen>
        <Specimen tone="slate" label='<Logo tone="light" />  on slate' className="min-h-48">
          <div className="flex h-32 items-center justify-center">
            <Logo to={null} tone="light" className="scale-[1.6]" />
          </div>
        </Specimen>
        <Specimen label='<Logo label="Operator" />  portal lockups'>
          <div className="flex flex-col items-start gap-5 py-2">
            <Logo to={null} label="Operator" />
            <Logo to={null} label="Admin" />
            <Logo to={null} compact />
          </div>
        </Specimen>
        <Specimen label="<SlabMark />  sizes, live and still">
          <div className="flex flex-wrap items-end gap-6 py-2 text-ink">
            {[16, 24, 32, 48, 64].map((s) => (
              <div key={s} className="flex flex-col items-center gap-2">
                <span style={{ width: s, height: s }} className="inline-flex">
                  <SlabMark className="size-full" />
                </span>
                <span className="t-mono text-[12px] text-ink-3">{s}</span>
              </div>
            ))}
            <div className="flex flex-col items-center gap-2">
              <span className="inline-flex size-12">
                <SlabMark className="size-full" live={false} />
              </span>
              <span className="t-mono text-[12px] text-ink-3">still</span>
            </div>
          </div>
        </Specimen>
      </div>

      <div className="grid gap-x-10 gap-y-4 md:grid-cols-3">
        {[
          ["Construction", "Three slabs, each rising 4.2 over a 22-unit run, the same 11° cleft as the strata. Wordmark in Bricolage Grotesque 700, tracking −0.04em."],
          ["Clear space", "Keep one slab height clear on every side. Never place the mark on photography or on a signal field."],
          ["Minimum size", "Mark: 16px on screen. Wordmark lockup: 72px wide. Below that, use the mark alone."],
        ].map(([t, d]) => (
          <div key={t} className="border-t border-line pt-4">
            <p className="t-h3 text-ink">{t}</p>
            <p className="t-small mt-1 text-ink-2">{d}</p>
          </div>
        ))}
      </div>
    </DSSection>
  );
}

/* ================================================================== */
/* 03 Colour                                                           */
/* ================================================================== */

type Token = { name: string; light: string; dark: string; role: string };

const TOKEN_GROUPS: Array<{ title: string; note: string; tokens: Token[] }> = [
  {
    title: "Ground and ink",
    note: "Chalk ground, stone panels, slate-black ink. Secondary text holds 6:1 on canvas; tertiary never drops below 4.5:1.",
    tokens: [
      { name: "canvas", light: "#F2F4F6", dark: "#0E1318", role: "Page ground, chalk" },
      { name: "surface", light: "#FFFFFF", dark: "#161D25", role: "Panels, sheets, inputs" },
      { name: "sunken", light: "#E8ECF0", dark: "#0A0E12", role: "Wells, table headers, tracks" },
      { name: "ink", light: "#111820", dark: "#EDF1F4", role: "Primary text" },
      { name: "ink-2", light: "#46566A", dark: "#A8B4C0", role: "Secondary text" },
      { name: "ink-3", light: "#617185", dark: "#8492A0", role: "Tertiary text, captions" },
      { name: "line", light: "#DAE0E6", dark: "#25303B", role: "Hairlines" },
      { name: "line-strong", light: "#C0CAD4", dark: "#34414E", role: "Input borders" },
    ],
  },
  {
    title: "Brand",
    note: "Slate is primary, stone is secondary. Signal has one job.",
    tokens: [
      { name: "slate", light: "#2B3643", dark: "#232D38", role: "Brand fields, primary buttons, nav selection" },
      { name: "slate-ink", light: "#F2F4F6", dark: "#EDF1F4", role: "Text on slate" },
      { name: "stone", light: "#DCE3EA", dark: "#2A3540", role: "Secondary buttons, chips, selected rows" },
      { name: "stone-ink", light: "#1C242E", dark: "#EDF1F4", role: "Text on stone" },
      { name: "signal", light: "#FF5B1F", dark: "#FF6A33", role: "Live, now, needs you, one role" },
      { name: "signal-ink", light: "#1A0D06", dark: "#1A0D06", role: "Text on signal" },
      { name: "signal-soft", light: "#FFE7DC", dark: "#3A1C10", role: "Signal badge ground" },
    ],
  },
  {
    title: "Status",
    note: "Semantic only. Always paired with a word, never colour alone.",
    tokens: [
      { name: "success", light: "#127A57", dark: "#3FBF8F", role: "Collected, paid, approved" },
      { name: "success-bg", light: "#E1F2EA", dark: "#10291F", role: "Success ground" },
      { name: "warning", light: "#9A6408", dark: "#E3A93B", role: "Pending, expiring, late" },
      { name: "warning-bg", light: "#FBF0D9", dark: "#2B2110", role: "Warning ground" },
      { name: "danger", light: "#BF3328", dark: "#F07A6F", role: "Missed, failed, rejected" },
      { name: "danger-bg", light: "#FBE6E3", dark: "#331614", role: "Danger ground" },
      { name: "info", light: "#2F5D8A", dark: "#7FB0E0", role: "Scheduled, in progress" },
      { name: "info-bg", light: "#E3ECF5", dark: "#13202D", role: "Info ground" },
    ],
  },
];

const RAMP: Array<[string, string]> = [
  ["50", "#F4F6F8"], ["100", "#E8ECF0"], ["200", "#D3DAE1"], ["300", "#B4BFCA"], ["400", "#8C9AA8"], ["500", "#66768A"],
  ["600", "#4D5D70"], ["700", "#3A4859"], ["800", "#2B3643"], ["900", "#1C242E"], ["950", "#111820"],
];

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const luminance = (hex: string) => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
};
const grade = (r: number) => (r >= 7 ? "AAA" : r >= 4.5 ? "AA" : r >= 3 ? "AA large" : "Fail");
const textOn = (hex: string) => (luminance(hex) > 0.36 ? "#111820" : "#F2F4F6");
const tok = (name: string) => TOKEN_GROUPS.flatMap((g) => g.tokens).find((t) => t.name === name)!;

const PAIRS: Array<{ fg: string; bg: string; use: string; darkFg?: string; darkBg?: string }> = [
  { fg: "ink", bg: "canvas", use: "Body text on the page" },
  { fg: "ink-2", bg: "canvas", use: "Secondary text, descriptions" },
  { fg: "ink-3", bg: "canvas", use: "Captions, labels, metadata" },
  { fg: "ink-3", bg: "surface", use: "Captions inside panels" },
  { fg: "slate-ink", bg: "slate", use: "Text on slate fields; primary buttons", darkFg: "#111820", darkBg: "#EDF1F4" },
  { fg: "stone-ink", bg: "stone", use: "Secondary buttons" },
  { fg: "signal-ink", bg: "signal", use: "Live chip, marketing CTA" },
  { fg: "success", bg: "success-bg", use: "Collected, paid" },
  { fg: "warning", bg: "warning-bg", use: "Pending, late" },
  { fg: "danger", bg: "danger-bg", use: "Missed, failed" },
  { fg: "info", bg: "info-bg", use: "Scheduled, in progress" },
];

function Swatch({ t }: { t: Token }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid h-20 grid-cols-2 overflow-hidden rounded-md ring-1 ring-line">
        {(["light", "dark"] as const).map((m) => (
          <div key={m} className="flex flex-col justify-between p-2" style={{ background: t[m], color: textOn(t[m]) }}>
            <span className="text-[12px] font-medium opacity-70">{m === "light" ? "Light" : "Dark"}</span>
            <span className="font-mono text-[12px] font-medium uppercase">{t[m]}</span>
          </div>
        ))}
      </div>
      <div>
        <p className="t-mono text-ink">{t.name}</p>
        <p className="t-small text-ink-2">{t.role}</p>
      </div>
    </div>
  );
}

function ColourSection() {
  return (
    <DSSection
      id="colour"
      n="03"
      title="Colour"
      lede="Slate grey is primary. Lighter stone tints are secondary. Every other colour is there because it has a job. Roles are CSS variables that swap under .dark, each swatch shows both values."
    >
      {TOKEN_GROUPS.map((g) => (
        <Sub key={g.title} title={g.title} note={g.note} api={g.title === "Status" ? "bg-success-bg text-success" : g.title === "Brand" ? "bg-slate text-slate-ink" : "bg-canvas text-ink-2"}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 xl:grid-cols-4">
            {g.tokens.map((t) => (
              <Swatch key={t.name} t={t} />
            ))}
          </div>
        </Sub>
      ))}

      <Sub title="Slate ramp" note="Hue ≈ 212°. Exposed for illustration and data visualisation only, never for UI text or surfaces." api="bg-slate-50 … bg-slate-950">
        <div className="grid overflow-hidden rounded-lg ring-1 ring-line md:grid-cols-11">
          {RAMP.map(([step, hex]) => (
            <div
              key={step}
              className="flex h-11 items-center justify-between px-3 md:h-32 md:flex-col md:items-start md:justify-end md:gap-0.5 md:px-2.5 md:pb-2.5"
              style={{ background: hex, color: textOn(hex) }}
            >
              <span className="text-[13px] font-semibold">{step}</span>
              <span className="font-mono text-[12px] uppercase opacity-80">{hex}</span>
            </div>
          ))}
        </div>
        <p className="t-small text-ink-3">
          <span className="t-mono text-ink-2">800</span> is the light-mode slate. <span className="t-mono text-ink-2">950</span> is ink. Strata draw from 300–800 on slate fields and
          300–800 reversed on chalk.
        </p>
      </Sub>

      <Sub title="Contrast" note="Calculated live from the token values (WCAG 2.2 relative luminance). Body text must reach AA 4.5:1 in both appearances.">
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <div className="hidden grid-cols-[minmax(0,1.3fr)_repeat(2,minmax(0,1fr))_minmax(0,1.4fr)] gap-4 border-b border-line bg-sunken/60 px-5 py-2.5 t-micro text-ink-3 md:grid">
            <span>Pair</span>
            <span>Light</span>
            <span>Dark</span>
            <span>Used for</span>
          </div>
          <ul className="divide-y divide-line">
            {PAIRS.map((p) => {
              const f = tok(p.fg), b = tok(p.bg);
              const lr = contrast(f.light, b.light);
              const dfg = p.darkFg ?? f.dark, dbg = p.darkBg ?? b.dark;
              const dr = contrast(dfg, dbg);
              return (
                <li key={p.fg + p.bg} className="grid grid-cols-2 items-center gap-x-4 gap-y-2 px-5 py-3.5 md:grid-cols-[minmax(0,1.3fr)_repeat(2,minmax(0,1fr))_minmax(0,1.4fr)]">
                  <p className="col-span-2 t-mono text-ink md:col-span-1">
                    {p.fg} <span className="text-ink-3">on</span> {p.bg}
                  </p>
                  {[
                    { r: lr, fg: f.light, bg: b.light, m: "Light" },
                    { r: dr, fg: dfg, bg: dbg, m: "Dark" },
                  ].map((x) => (
                    <div key={x.m} className="flex items-center gap-2.5">
                      <span className="flex h-7 w-9 shrink-0 items-center justify-center rounded-sm text-[13px] font-semibold ring-1 ring-line" style={{ background: x.bg, color: x.fg }}>
                        Aa
                      </span>
                      <span className="t-small font-medium text-ink tnum">{x.r.toFixed(1)}:1</span>
                      <Badge tone={grade(x.r) === "Fail" ? "danger" : grade(x.r) === "AA large" ? "warning" : "neutral"}>{grade(x.r)}</Badge>
                      <span className="sr-only">{x.m}</span>
                    </div>
                  ))}
                  <p className="col-span-2 t-small text-ink-2 md:col-span-1">{p.use}</p>
                </li>
              );
            })}
          </ul>
        </div>
        <p className="t-small text-ink-3">In dark mode the primary button inverts to chalk on ink, so the slate pair is measured as it is actually drawn.</p>
      </Sub>

      <Sub title="Signal, one accent, one role" note="If two things on a screen are orange, one of them is wrong.">
        <div className="grid gap-4 md:grid-cols-2">
          <Specimen label="Use signal for">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex h-7 items-center gap-2 rounded-sm bg-signal px-2.5 text-[12px] font-semibold text-signal-ink">
                  <LiveDot className="[&>span]:bg-signal-ink" /> On the way
                </span>
                <span className="relative inline-flex">
                  <IconButton label="Notifications" variant="outline" badge>
                    <Bell />
                  </IconButton>
                </span>
                <Button variant="signal">Get started</Button>
              </div>
              <div className="flex flex-col gap-2.5">
                <Rule kind="do">The live truck, the next pickup, the current step.</Rule>
                <Rule kind="do">An unread dot. Something that needs you now.</Rule>
                <Rule kind="do">The single primary call to action on a marketing page.</Rule>
              </div>
            </div>
          </Specimen>
          <Specimen label="Never use signal for">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3 opacity-90">
                <span className="font-display text-[22px] font-bold text-signal line-through decoration-ink/60">Our services</span>
                <span className="inline-flex h-7 items-center rounded-sm bg-signal-soft px-2.5 text-[12px] font-medium text-ink-2 line-through">Popular</span>
                <span className="inline-flex size-9 items-center justify-center rounded-md bg-signal/15 text-signal opacity-70">
                  <Star className="size-4" />
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                <Rule kind="dont">Headings, icons or borders for emphasis.</Rule>
                <Rule kind="dont">Errors, that's danger. Signal is not a warning colour.</Rule>
                <Rule kind="dont">Primary actions inside the portals, those are slate.</Rule>
              </div>
            </div>
          </Specimen>
        </div>
      </Sub>
    </DSSection>
  );
}

/* ================================================================== */
/* 04 Typography                                                       */
/* ================================================================== */

const TYPE_STEPS: Array<{ cls: string; family: string; size: string; weight: string; tracking: string; use: string; sample: ReactNode }> = [
  { cls: "t-display-xl", family: "Bricolage Grotesque", size: "44 → 104px / 0.95", weight: "700", tracking: "−0.035em", use: "Marketing hero, the pickup day", sample: "Thursday" },
  { cls: "t-display", family: "Bricolage Grotesque", size: "34 → 60px / 1.0", weight: "700", tracking: "−0.03em", use: "Section heroes, big figures", sample: "₦21.88m this month" },
  { cls: "t-h1", family: "Bricolage Grotesque", size: "28 → 34px / 1.1", weight: "700", tracking: "−0.02em", use: "Page titles", sample: "Pickups" },
  { cls: "t-h2", family: "Bricolage Grotesque", size: "20 → 22px / 1.25", weight: "650", tracking: "−0.01em", use: "Section titles", sample: "Coming up this week" },
  { cls: "t-h3", family: "Geist", size: "16px / 1.4", weight: "600", tracking: "−0.005em", use: "Panel and row titles", sample: "Slate Home · twice weekly" },
  { cls: "t-body", family: "Geist", size: "15px / 1.6", weight: "400", tracking: "0", use: "Running text", sample: "Collected at 07:42 by Aniekan from Ufok Environmental. Next collection is Thursday, 07:00–09:00." },
  { cls: "t-small", family: "Geist", size: "13px / 1.5", weight: "450", tracking: "0", use: "Metadata", sample: "14 Ewet Housing Estate · opposite the estate clinic, blue gate" },
  { cls: "t-micro", family: "Geist", size: "12px / 1.35", weight: "500", tracking: "0.01em", use: "Labels, badges, the floor", sample: "Next charge · 1 Nov" },
  { cls: "t-mono", family: "Geist Mono", size: "13px", weight: "500", tracking: "0", use: "References read out to support", sample: "PU-26-08813   TXN-7Q4K2M   CT-UYO-014" },
];

function TypeSection() {
  return (
    <DSSection
      id="type"
      n="04"
      title="Typography"
      lede="Bricolage Grotesque's ink traps and slightly hand-cut shapes read like chalk signage on a slate board, characterful without being cute. Geist is the calm workhorse with honest tabular figures. Mono is only for things a person might read out on the phone."
    >
      <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3">
        {[
          { f: "font-display", name: "Bricolage Grotesque", role: "Display, h1, h2", glyph: "Ag", weight: "font-bold" },
          { f: "font-sans", name: "Geist", role: "Interface and body", glyph: "Ag", weight: "font-medium" },
          { f: "font-mono", name: "Geist Mono", role: "References and IDs", glyph: "08", weight: "font-medium" },
        ].map((x) => (
          <div key={x.name} className="flex flex-col gap-4 bg-surface p-6">
            <span className={cn(x.f, x.weight, "text-[88px] leading-[0.85] tracking-[-0.03em] text-ink")}>{x.glyph}</span>
            <div>
              <p className="t-h3 text-ink">{x.name}</p>
              <p className="t-small text-ink-2">{x.role}</p>
            </div>
            <p className={cn(x.f, "break-all text-[14px] leading-relaxed text-ink-2")}>ABCDEFGHIJKLM NOPQRSTUVWXYZ abcdefghijklm nopqrstuvwxyz 0123456789 ₦ ·, ‘’</p>
          </div>
        ))}
      </div>

      <Sub title="Type scale" note="Nine styles, applied as utilities. Nothing in the product is set below 12px.">
        <div className="divide-y divide-line border-y border-line">
          {TYPE_STEPS.map((s) => (
            <div key={s.cls} className="grid gap-3 py-6 md:grid-cols-[220px_minmax(0,1fr)] md:gap-10">
              <div className="flex flex-col gap-1">
                <code className="t-mono text-ink">.{s.cls}</code>
                <p className="t-small text-ink-2">{s.use}</p>
                <p className="t-micro text-ink-3 tnum">
                  {s.family} · {s.size} · {s.weight} · {s.tracking}
                </p>
              </div>
              <p className={cn(s.cls, "min-w-0 break-words text-ink")}>{s.sample}</p>
            </div>
          ))}
        </div>
      </Sub>

      <Sub title="Figures" note="Amounts in tables, times and counts use tabular figures so columns line up. Add tnum, or use t-mono for references.">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: "Proportional", cls: "" },
            { label: "Tabular, .tnum", cls: "tnum" },
          ].map((c) => (
            <Specimen key={c.label} label={c.label}>
              <ul className={cn("flex flex-col items-end gap-1 font-display text-[26px] font-bold leading-tight text-ink", c.cls)}>
                {[7000, 141000, 23400, 1111, 9418500].map((n) => (
                  <li key={n}>{formatNaira(n)}</li>
                ))}
              </ul>
            </Specimen>
          ))}
        </div>
      </Sub>
    </DSSection>
  );
}

/* ================================================================== */
/* 05 Space, radius, elevation                                         */
/* ================================================================== */

const SPACE = [2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 56, 72, 96];

function SpaceSection() {
  return (
    <DSSection
      id="space"
      n="05"
      title="Space, shape and depth"
      lede="Tight inside a group, loose between groups, one long rest per screen. Corners are cut stone, not pills. Content is flat; only floating layers cast a shadow."
    >
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Sub title="Spacing scale" note="Thirteen steps in px. Use the scale; don't invent 13px or 18px.">
          <ul className="flex flex-col gap-2.5">
            {SPACE.map((s) => (
              <li key={s} className="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-4">
                <span className="t-mono text-right text-ink-2">{s}</span>
                <span className="flex items-center gap-3">
                  <span className="h-3 rounded-[2px] bg-slate dark:bg-slate-300" style={{ width: s * 2 }} />
                  {[4, 8, 24, 56].includes(s) && (
                    <span className="t-micro text-ink-3">{s === 4 ? "in a group" : s === 8 ? "label to field" : s === 24 ? "between groups" : "the rest"}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Sub>
        <Sub title="Rhythm" note="How the scale is used on a real screen.">
          <Specimen tone="canvas" label="Pickup detail, 390px">
            <div className="flex flex-col">
              <div className="flex flex-col gap-1">
                <p className="t-micro text-ink-3">Mon 5 Oct · 07:00–09:00</p>
                <p className="t-h1 text-ink">Slate Home</p>
              </div>
              <Gap px={24} />
              <div className="flex flex-col gap-2">
                <p className="t-small font-medium text-ink">Address</p>
                <p className="t-body text-ink-2">14 Ewet Housing Estate, Uyo</p>
              </div>
              <Gap px={24} />
              <div className="flex flex-col gap-2">
                <p className="t-small font-medium text-ink">Operator</p>
                <p className="t-body text-ink-2">Ufok Environmental · KTU 482 XA</p>
              </div>
              <Gap px={56} label="56, one rest" />
              <Button block>Track pickup</Button>
            </div>
          </Specimen>
        </Sub>
      </div>

      <Sub title="Margins and widths">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-4">
          {[
            ["20px", "Side margin on phones"],
            ["32px", "Side margin from 768px"],
            ["1240px", "Content maximum"],
            ["680px", "Reading width"],
          ].map(([v, l]) => (
            <div key={v} className="flex flex-col gap-1 bg-surface p-5">
              <span className="font-display text-[28px] font-bold leading-none text-ink tnum">{v}</span>
              <span className="t-small text-ink-2">{l}</span>
            </div>
          ))}
        </div>
      </Sub>

      <Sub title="Radius, cut stone" note="Four radii. Badges are squared chips at 6px, never pills.">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { r: 6, cls: "rounded-sm", use: "Controls, badges, chips", token: "rounded-sm" },
            { r: 10, cls: "rounded-md", use: "Panels' inner parts, buttons, inputs", token: "rounded-md" },
            { r: 16, cls: "rounded-lg", use: "Panels, sheets, hero fields", token: "rounded-lg" },
            { r: 24, cls: "rounded-xl", use: "Marketing slabs, the pickup field", token: "rounded-xl" },
          ].map((x) => (
            <div key={x.r} className="flex flex-col gap-3">
              <div className={cn("relative aspect-square overflow-hidden border border-line-strong bg-stone", x.cls)}>
                <span className="absolute left-3 top-2.5 font-display text-[36px] font-bold leading-none text-stone-ink tnum">{x.r}</span>
              </div>
              <div>
                <p className="t-mono text-ink">{x.token}</p>
                <p className="t-small text-ink-2">{x.use}</p>
              </div>
            </div>
          ))}
        </div>
      </Sub>

      <Sub title="Elevation" note="One shadow token, only for things that float above the page. Glass only where content scrolls beneath.">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-3">
            <div className="flex h-40 items-center justify-center rounded-lg bg-canvas p-6 ring-1 ring-line">
              <div className="w-full rounded-lg border border-line bg-surface p-4">
                <p className="t-h3 text-ink">Invoice INV-26-0412</p>
                <p className="t-small text-ink-2">₦2,028,000 · due 15 Oct</p>
              </div>
            </div>
            <div>
              <p className="t-mono text-ink">flat · border-line</p>
              <p className="t-small text-ink-2">All content. Panels separate with a hairline, not a shadow.</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex h-40 items-center justify-center rounded-lg bg-canvas p-6 ring-1 ring-line">
              <div className="w-full max-w-52 rounded-md border border-line bg-surface py-1.5 shadow-float">
                {["Reschedule", "Share tracking link", "Report a problem"].map((x) => (
                  <p key={x} className="px-3.5 py-2 text-[14px] text-ink">{x}</p>
                ))}
              </div>
            </div>
            <div>
              <p className="t-mono text-ink">shadow-float</p>
              <p className="t-small text-ink-2">Menus, sheets, popovers, toasts.</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="relative flex h-40 items-end overflow-hidden rounded-lg bg-slate chalk-grain p-4">
              <Strata tone="on-slate" bands={5} live seed={33} className="absolute inset-0 h-full w-full" />
              <div className="relative flex w-full justify-around rounded-lg border border-line bg-glass py-2.5 backdrop-blur-xl backdrop-saturate-150">
                {[Truck, CalendarClock, CreditCard, LifeBuoy].map((I, i) => (
                  <I key={i} className={cn("size-5", i === 0 ? "text-ink" : "text-ink-3")} strokeWidth={1.75} />
                ))}
              </div>
            </div>
            <div>
              <p className="t-mono text-ink">bg-glass · backdrop-blur</p>
              <p className="t-small text-ink-2">Mobile tab bar and sticky headers only.</p>
            </div>
          </div>
        </div>
      </Sub>
    </DSSection>
  );
}

function Gap({ px, label }: { px: number; label?: string }) {
  return (
    <div className="relative flex items-center" style={{ height: px }} aria-hidden>
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 border-t border-dashed border-signal/50" />
      <span className="relative ml-auto rounded-sm bg-canvas px-1.5 t-mono text-[12px] text-ink-3">{label ?? px}</span>
    </div>
  );
}

/* ================================================================== */
/* 06 Iconography                                                      */
/* ================================================================== */

const ICONS = [
  ["Truck", Truck], ["CalendarClock", CalendarClock], ["MapPin", MapPin], ["Route", Route], ["Package", Package], ["Recycle", Recycle],
  ["CreditCard", CreditCard], ["Wallet", Wallet], ["Receipt", Receipt], ["MessageSquareWarning", MessageSquareWarning], ["LifeBuoy", LifeBuoy], ["Bell", Bell],
  ["Building2", Building2], ["Users", Users], ["ShieldCheck", ShieldCheck], ["FileSignature", FileSignature], ["Clock", Clock], ["Star", Star],
  ["Search", Search], ["Filter", Filter], ["Download", Download], ["Settings", Settings], ["AlertTriangle", AlertTriangle], ["ArrowRight", ArrowRight],
] as const;

function IconSection() {
  return (
    <DSSection
      id="icons"
      n="06"
      title="Iconography"
      lede="Lucide at a 1.75px stroke, 18 or 20px, in the colour of the text beside it. Icons label; they don't decorate."
    >
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4 md:grid-cols-6">
        {ICONS.map(([name, I]) => (
          <div key={name} className="flex flex-col items-center gap-3 bg-surface px-2 py-5 text-ink">
            <I className="size-5" strokeWidth={1.75} />
            <span className="max-w-full truncate text-[12px] text-ink-3">{name}</span>
          </div>
        ))}
      </div>
      <div className="grid gap-x-10 gap-y-4 md:grid-cols-4">
        {[
          ["Library", "lucide-react"],
          ["Stroke", "1.75px"],
          ["Size", "18px inline · 20px in buttons and nav"],
          ["Colour", "currentColor, inherits ink, ink-2 or ink-3"],
        ].map(([k, v]) => (
          <div key={k} className="border-t border-line pt-3">
            <p className="t-micro text-ink-3">{k}</p>
            <p className="t-body text-ink">{v}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Specimen label="Do, glyphs only in settings-like lists">
          <List>
            <ListRow leading={<Glyph><CreditCard /></Glyph>} title="Payment methods" subtitle="Visa •• 4021, Verve •• 7735" chevron />
            <ListRow leading={<Glyph><Bell /></Glyph>} title="Notifications" subtitle="SMS, WhatsApp and app" chevron />
            <ListRow leading={<Glyph><ShieldCheck /></Glyph>} title="Security" subtitle="Two-factor on" chevron />
          </List>
        </Specimen>
        <Specimen label="Don't, tinted icon chips as decoration">
          <div className="grid grid-cols-3 gap-3 opacity-80" aria-hidden>
            {[
              [Leaf, "bg-success-bg text-success"],
              [Recycle, "bg-info-bg text-info"],
              [Sparkles, "bg-warning-bg text-warning"],
              [Truck, "bg-danger-bg text-danger"],
              [Star, "bg-signal-soft text-signal"],
              [Users, "bg-success-bg text-success"],
            ].map(([I, c], i) => {
              const Icon = I as typeof Leaf;
              return (
                <span key={i} className={cn("flex h-16 items-center justify-center rounded-full", c as string)}>
                  <Icon className="size-6" />
                </span>
              );
            })}
          </div>
          <p className="t-small mt-4 text-ink-2">Leaves, arrows and confetti colour say "eco app", not "your bin is collected on Thursday".</p>
        </Specimen>
      </div>
    </DSSection>
  );
}

/* ================================================================== */
/* 07 Richness                                                         */
/* ================================================================== */

function RichnessSection() {
  const [progress, setProgress] = useState(0.62);
  const [zone, setZone] = useState("ewet");
  const z = UYO_ZONE_INFO.find((x) => x.id === zone)!;
  return (
    <DSSection
      id="richness"
      n="07"
      title="Richness"
      lede="Our illustration is the material itself: layered slabs of slate, chalk lines and stylised Uyo street maps. Always drawn by one hand, the same band rhythm, the same slight tilt. Never blobs, never gradients."
    >
      <Sub title="Strata" note="3–5 bands in a 1 : 1.6 : 2.6 rhythm, tilted 3°, with one chalk line. A slim signal band appears only when something is live." api="<Strata tone bands live seed />">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'tone="on-slate"', tone: "on-slate" as const, live: false, bg: "bg-slate chalk-grain" },
            { label: 'tone="on-light"', tone: "on-light" as const, live: false, bg: "bg-canvas ring-1 ring-line" },
            { label: "live", tone: "on-slate" as const, live: true, bg: "bg-slate chalk-grain" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-2.5">
              <div className={cn("relative aspect-[4/3] overflow-hidden rounded-lg", s.bg)}>
                <Strata tone={s.tone} live={s.live} bands={s.live ? 5 : 4} seed={s.live ? 21 : 7} className="absolute inset-x-0 bottom-0 h-3/4 w-full" />
              </div>
              <p className="t-mono text-ink-2">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[3, 11, 27, 44].map((seed) => (
            <div key={seed} className="relative aspect-[3/2] overflow-hidden rounded-md bg-slate chalk-grain">
              <Strata tone="on-slate" bands={seed % 2 ? 3 : 4} seed={seed} chalk={false} className="absolute inset-0 h-full w-full" />
              <span className="absolute left-2 top-1.5 t-mono text-[12px] text-slate-ink/60">seed {seed}</span>
            </div>
          ))}
        </div>
        <p className="t-small text-ink-3">Same hand, different stone: the seed changes the cleft edges, never the rhythm.</p>
      </Sub>

      <Sub title="Chalk grain and chalk lines" note="Slate fields carry a 5.5% fractal-noise grain, material, not texture for its own sake. Chalk lines are 1.5px, dashed or hand-curved, chalk at 40–55%; the route line turns signal when live." api=".chalk-grain">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-2.5">
            <div className="flex aspect-[4/3] items-end rounded-lg bg-slate p-4">
              <span className="t-small text-slate-ink/70">Without grain</span>
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="flex aspect-[4/3] items-end rounded-lg bg-slate p-4 chalk-grain">
              <span className="t-small text-slate-ink/70">With .chalk-grain</span>
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate chalk-grain">
              <svg viewBox="0 0 240 180" className="absolute inset-0 h-full w-full" aria-hidden>
                <path d="M20 150 C 70 140, 80 70, 130 70 S 200 40, 222 24" fill="none" stroke="#F2F4F6" strokeOpacity=".45" strokeWidth="1.5" strokeDasharray="3 6" strokeLinecap="round" />
                <path d="M20 150 C 70 140, 80 70, 130 70" fill="none" stroke="var(--signal)" strokeWidth="3" strokeLinecap="round" />
                <circle cx="130" cy="70" r="6" fill="var(--signal)" stroke="#2B3643" strokeWidth="2" />
                <path d="M28 40 q 30 -8 62 -2" fill="none" stroke="#F2F4F6" strokeOpacity=".5" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="absolute bottom-4 left-4 t-small text-slate-ink/70">Chalk route, live part in signal</span>
            </div>
          </div>
        </div>
      </Sub>

      <Sub title="Route map" note="Stylised Uyo streets, Aka Road, Oron Road, Ikot Ekpene Road, Abak Road. Drag to move the truck along the route." api="<RouteMap progress stops tone />">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="relative aspect-[16/11] overflow-hidden rounded-lg bg-slate chalk-grain">
            <RouteMap progress={progress} className="absolute inset-0 h-full w-full" />
            <span className="absolute left-4 top-3 t-mono text-[12px] text-slate-ink/60">tone="on-slate"</span>
          </div>
          <div className="flex flex-col gap-4">
            <div className="relative aspect-[16/11] overflow-hidden rounded-lg bg-surface ring-1 ring-line">
              <RouteMap progress={progress} tone="on-light" showLabels={false} className="absolute inset-0 h-full w-full" />
              <span className="absolute left-4 top-3 t-mono text-[12px] text-ink-3">tone="on-light"</span>
            </div>
            <label className="flex flex-col gap-2">
              <span className="flex items-center justify-between t-small text-ink-2">
                <span className="font-medium text-ink">Progress</span>
                <span className="t-mono">{progress.toFixed(2)}</span>
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full accent-[var(--signal)]"
                aria-label="Truck progress along the route"
              />
            </label>
          </div>
        </div>
      </Sub>

      <Sub title="Service-area map" note="Nine Uyo zones as cut-stone polygons; fill intensity carries the value. Select a zone." api="<ServiceAreaMap values selected onSelect />">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <ServiceAreaMap
            className="aspect-[4/3]"
            values={Object.fromEntries(UYO_ZONE_INFO.map((x) => [x.id, x.coverage]))}
            selected={zone}
            onSelect={setZone}
          />
          <div className="flex flex-col justify-end gap-4 border-t border-line pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <p className="t-micro text-ink-3">Selected zone</p>
            <p className="t-h1 text-ink">{z.name}</p>
            <DescriptionList
              columns={1}
              dense
              items={[
                { label: "Coverage", value: `${z.coverage}% of streets` },
                { label: "Operator", value: z.operator },
                { label: "Collection days", value: z.days },
                { label: "Homes and sites", value: formatNumber(z.homes) },
              ]}
            />
          </div>
        </div>
      </Sub>
    </DSSection>
  );
}

/* ================================================================== */
/* 08 Components                                                       */
/* ================================================================== */

const STATUS_SETS: Array<{ tone: string; items: string[] }> = [
  { tone: "Done", items: ["Collected", "Paid", "Active", "Approved", "Resolved", "Verified", "Live"] },
  { tone: "In motion", items: ["Scheduled", "En route", "In progress", "Assigned", "Under review", "Launching", "Planned"] },
  { tone: "Needs attention", items: ["Pending", "Late", "Expiring soon", "Overdue", "Partial", "Retrying", "At risk"] },
  { tone: "Failed", items: ["Missed", "Failed", "Rejected", "Suspended", "Escalated", "Expired", "Chargeback"] },
  { tone: "Neutral", items: ["Cancelled", "Closed", "Refunded", "Draft", "Archived", "Not started"] },
];

const TONES: Tone[] = ["neutral", "slate", "success", "warning", "danger", "info", "signal", "outline"];

function ComponentsSection() {
  return (
    <DSSection
      id="components"
      n="08"
      title="Components"
      lede="The kit every page is composed from, imported from @/components/ui. Every example here is live: type in the fields, sort the table, press the buttons."
    >
      <ButtonsDemo />
      <BadgesDemo />
      <FormsDemo />
      <ChoiceDemo />
      <TabsDemo />
      <TableDemo />
      <StatsDemo />
      <ProgressDemo />
      <ChartsDemo />
      <PeopleAndSurfacesDemo />
      <FeedbackDemo />
    </DSSection>
  );
}

function ButtonsDemo() {
  const toast = useToast();
  const [paying, setPaying] = useState(false);
  return (
    <Sub title="Buttons" note="Slate primary inside the product. Signal only for the single marketing CTA. Destructive always goes through a confirmation." api="<Button variant size loading />">
      <Specimen label="variant">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Book pickup</Button>
          <Button variant="secondary">Receipts</Button>
          <Button variant="outline">Export</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="destructive">Suspend</Button>
          <Button variant="signal">Get started</Button>
          <Button variant="link">All pickups</Button>
        </div>
      </Specimen>
      <div className="grid gap-4 md:grid-cols-2">
        <Specimen label="size · sm  md  lg">
          <div className="flex flex-wrap items-end gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </Specimen>
        <Specimen label="loading · leading · trailing · disabled">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              loading={paying}
              onClick={() => {
                setPaying(true);
                setTimeout(() => {
                  setPaying(false);
                  toast.success("₦7,000 paid", "Receipt TXN-8KD2QW sent to your email.");
                }, 1600);
              }}
            >
              {paying ? "Paying" : "Pay ₦7,000"}
            </Button>
            <Button variant="outline" leading={<Download className="size-4" />}>
              Statement
            </Button>
            <Button variant="secondary" trailing={<ArrowRight className="size-4" />}>
              Continue
            </Button>
            <Button disabled>Unavailable</Button>
          </div>
        </Specimen>
      </div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
        <Specimen label="<IconButton variant />  ghost · outline · secondary · primary · badge">
          <div className="flex flex-wrap items-center gap-3">
            <IconButton label="Search"><Search /></IconButton>
            <IconButton label="Edit" variant="outline"><Pencil /></IconButton>
            <IconButton label="Share" variant="secondary"><Share2 /></IconButton>
            <IconButton label="Add" variant="primary"><Plus /></IconButton>
            <IconButton label="Notifications" variant="outline" badge><Bell /></IconButton>
            <IconButton label="More" size="sm" variant="outline"><MoreHorizontal /></IconButton>
          </div>
        </Specimen>
        <Specimen tone="slate" label="glass, on slate">
          <div className="flex gap-3">
            <IconButton label="Share tracking" variant="glass"><Share2 /></IconButton>
            <IconButton label="Save" variant="glass"><Bookmark /></IconButton>
          </div>
        </Specimen>
      </div>
      <Specimen label="block, full width on phones, thumb zone" className="md:max-w-sm">
        <div className="flex flex-col gap-2">
          <Button block size="lg">Confirm booking</Button>
          <Button block variant="ghost">Back</Button>
        </div>
      </Specimen>
    </Sub>
  );
}

function BadgesDemo() {
  return (
    <Sub title="Badges and status" note="Squared 6px chips. StatusBadge maps every domain status in the platform to a tone, always with the word." api="<StatusBadge status />">
      <Specimen label="<Badge tone />">
        <div className="flex flex-wrap items-center gap-2.5">
          {TONES.map((t) => (
            <Badge key={t} tone={t}>{t}</Badge>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <Badge tone="success" dot>With dot</Badge>
          <Badge tone="info" icon={<Clock />}>With icon</Badge>
          <Badge tone="neutral" size="md">Size md</Badge>
          <span className="inline-flex items-center gap-2 t-small text-ink-2">
            <LiveDot /> LiveDot
          </span>
        </div>
      </Specimen>
      <div className="divide-y divide-line border-y border-line">
        {STATUS_SETS.map((s) => (
          <div key={s.tone} className="grid gap-2.5 py-4 md:grid-cols-[160px_minmax(0,1fr)] md:items-center">
            <p className="t-small font-medium text-ink">{s.tone}</p>
            <div className="flex flex-wrap gap-2">
              {s.items.map((x) => (
                <StatusBadge key={x} status={x} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Sub>
  );
}

function FormsDemo() {
  const toast = useToast();
  const [pw, setPw] = useState("");
  const [otp, setOtp] = useState("");
  const [otpState, setOtpState] = useState<"idle" | "bad" | "ok">("idle");
  const [address, setAddress] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([{ name: "CAC-certificate-RC1482207.pdf", size: 412_000, type: "application/pdf" }]);
  const [photos, setPhotos] = useState<UploadedFile[]>([]);
  const [amount, setAmount] = useState("14,000");
  return (
    <Sub title="Form fields" note="48px controls, labels above, hints below, errors that say what to do. Every field here is live." api="<Input label hint error />">
      <div className="grid gap-4 md:grid-cols-2">
        <Specimen label="Input · hint · optional">
          <div className="flex flex-col gap-5">
            <Input label="Full name" defaultValue="Imaobong Akpan" hint="As it appears on your bank card." />
            <Input label="Landmark" optional leading={<MapPin />} placeholder="Opposite the estate clinic, blue gate" />
          </div>
        </Specimen>
        <Specimen label="error · disabled">
          <div className="flex flex-col gap-5">
            <Input label="Email" defaultValue="imaobong.akpan@gmail" error="That email address is missing its ending, like .com." />
            <Input label="Account number" defaultValue="cus-0001" disabled hint="Set by Slate. Quote it when you call support." />
          </div>
        </Specimen>
        <Specimen label="<Select />  <Textarea />">
          <div className="flex flex-col gap-5">
            <Select label="Collection frequency" defaultValue="Twice weekly" options={["Weekly", "Twice weekly", "Three times weekly"]} />
            <Textarea label="Notes for the crew" optional rows={3} placeholder="Gate code, dog in the compound, bins behind the generator house…" />
          </div>
        </Specimen>
        <Specimen label="<PhoneInput />  <CurrencyInput />  <SearchInput />">
          <div className="flex flex-col gap-5">
            <PhoneInput label="Phone" hint="We send pickup reminders here." />
            <CurrencyInput label="Maximum per charge" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d,]/g, ""))} hint="Smart Sweep never charges more than this at once." />
            <SearchInput placeholder="Search pickups, references, areas" aria-label="Search" />
          </div>
        </Specimen>
        <Specimen label='<PasswordInput showStrength />'>
          <PasswordInput label="New password" value={pw} onChange={(e) => setPw(e.target.value)} showStrength placeholder="At least 8 characters" />
          <p className="t-small mt-3 text-ink-3">Try “ewet” then “Ewet-Estate-14”.</p>
        </Specimen>
        <Specimen label="<OTPInput />">
          <div className="flex flex-col gap-4">
            <p className="t-small text-ink-2">
              Enter the code sent to +234 803 ••• 0951. <span className="text-ink-3">(It's 482913.)</span>
            </p>
            <OTPInput value={otp} onChange={(v) => { setOtp(v); setOtpState("idle"); }} invalid={otpState === "bad"} />
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                disabled={otp.length < 6}
                onClick={() => {
                  if (otp === "482913") {
                    setOtpState("ok");
                    toast.success("Phone verified");
                  } else setOtpState("bad");
                }}
              >
                Verify
              </Button>
              {otpState === "bad" && <p className="t-small text-danger" role="alert">That code doesn't match. Check the SMS and try again.</p>}
              {otpState === "ok" && <Badge tone="success" icon={<Check strokeWidth={3} />}>Verified</Badge>}
            </div>
          </div>
        </Specimen>
        <Specimen label="<AddressInput /> , Uyo suggestions">
          <AddressInput value={address} onChange={setAddress} hint="Type “ewet” or “aka”." />
        </Specimen>
        <Specimen label="<FileDrop />  documents and photos">
          <div className="flex flex-col gap-5">
            <FileDrop label="Company documents" files={files} onFiles={setFiles} />
            <FileDrop label="Photos of the items" images files={photos} onFiles={setPhotos} hint="Up to 6 photos" />
          </div>
        </Specimen>
      </div>
    </Sub>
  );
}

function ChoiceDemo() {
  const [agree, setAgree] = useState(true);
  const [sms, setSms] = useState(true);
  const [wa, setWa] = useState(false);
  const [plan, setPlan] = useState("home");
  const [freq, setFreq] = useState<"weekly" | "twice" | "three">("twice");
  const [types, setTypes] = useState<string[]>(["General household", "PET plastic"]);
  return (
    <Sub title="Choices" note="Checkbox, Switch, ChoiceCard, Segmented and ChipGroup, each for a different kind of decision." api="<ChoiceCard selected onSelect />">
      <div className="grid gap-4 md:grid-cols-2">
        <Specimen label="<Checkbox />  <Switch />">
          <div className="flex flex-col gap-5">
            <Checkbox checked={agree} onChange={setAgree} label="I agree to the waste service terms" description="Collection days, missed-pickup recovery and payments." />
            <Checkbox checked={false} onChange={() => {}} label="Disabled option" disabled />
            <div className="flex flex-col gap-4 border-t border-line pt-5">
              <Switch checked={sms} onChange={setSms} label="SMS reminders" description="The evening before each collection." />
              <Switch checked={wa} onChange={setWa} label="WhatsApp updates" description="Live truck updates on collection day." />
            </div>
          </div>
        </Specimen>
        <Specimen label="<ChoiceCard />  plans">
          <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Plan">
            <ChoiceCard selected={plan === "lite"} onSelect={() => setPlan("lite")} icon={<Truck />} title="Slate Home Lite" description="One collection a week" meta={`${formatNaira(4500)}/mo`} />
            <ChoiceCard selected={plan === "home"} onSelect={() => setPlan("home")} icon={<Truck />} title="Slate Home" description="Twice a week, 240-litre bin" meta={`${formatNaira(7000)}/mo`} />
            <ChoiceCard selected={plan === "estate"} onSelect={() => setPlan("estate")} icon={<Building2 />} title="Estate" description="Every household, one contract" meta="from ₦6,500" disabled />
          </div>
        </Specimen>
        <Specimen label="<Segmented />">
          <div className="flex flex-col gap-4">
            <Segmented
              value={freq}
              onChange={setFreq}
              options={[
                { value: "weekly", label: "Weekly" },
                { value: "twice", label: "Twice weekly" },
                { value: "three", label: "3× weekly" },
              ]}
            />
            <p className="t-small text-ink-2">
              {freq === "weekly" ? "One collection, every Thursday." : freq === "twice" ? "Collections on Monday and Thursday." : "Collections on Monday, Wednesday and Friday."}
            </p>
            <Segmented size="sm" value="7d" onChange={() => {}} options={[{ value: "7d", label: "7 days" }, { value: "30d", label: "30 days" }, { value: "q", label: "Quarter" }]} />
          </div>
        </Specimen>
        <Specimen label="<ChipGroup />  multi-select">
          <ChipGroup options={["General household", "Garden waste", "PET plastic", "Cans", "Paper", "E-waste"]} value={types} onChange={setTypes} />
          <p className="t-small mt-3 text-ink-3 tnum">{types.length} selected</p>
        </Specimen>
      </div>
    </Sub>
  );
}

function TabsDemo() {
  const [tab, setTab] = useState<"all" | "upcoming" | "completed" | "missed">("all");
  const groups = {
    all: myPickups,
    upcoming: myPickups.filter((p) => ["Scheduled", "En route", "In progress"].includes(p.status)),
    completed: myPickups.filter((p) => p.status === "Completed"),
    missed: myPickups.filter((p) => ["Missed", "Failed", "Cancelled"].includes(p.status)),
  };
  return (
    <Sub title="Tabs" note="Underline tabs that scroll sideways on phones. Controlled, or synced to the URL with param." api='<Tabs items value onChange param="tab" />'>
      <Specimen>
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "all", label: "All", count: groups.all.length },
            { value: "upcoming", label: "Upcoming", count: groups.upcoming.length },
            { value: "completed", label: "Completed", count: groups.completed.length },
            { value: "missed", label: "Missed or cancelled", count: groups.missed.length },
          ]}
        />
        <List className="mt-2">
          {groups[tab].slice(0, 4).map((p) => (
            <ListRow key={p.id} title={p.service} subtitle={`${formatDay(p.date)} · ${p.window}`} meta={<Ref>{p.id}</Ref>} trailing={<StatusBadge status={p.status} />} />
          ))}
        </List>
      </Specimen>
    </Sub>
  );
}

function TableDemo() {
  const toast = useToast();
  const rows = useMemo(() => pickups.slice(10, 58), []);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const filtered = useFilteredRows(rows, {
    search,
    searchFields: (r) => `${r.id} ${r.customerName} ${r.area} ${r.operatorName}`,
    filters,
    filterFields: { status: (r) => r.status, operator: (r) => r.operatorName },
  });
  const columns: Column<Pickup>[] = [
    { key: "id", header: "Reference", cell: (r) => <Ref className="text-ink">{r.id}</Ref>, sortValue: (r) => r.id },
    { key: "customer", header: "Customer", cell: (r) => <span className="font-medium text-ink">{r.customerName}</span>, sortValue: (r) => r.customerName },
    { key: "area", header: "Area", cell: (r) => r.area, sortValue: (r) => r.area, mobileLabel: "Area" },
    { key: "operator", header: "Operator", cell: (r) => r.operatorName, sortValue: (r) => r.operatorName },
    { key: "when", header: "When", cell: (r) => <span className="tnum">{formatDay(r.date)} · {formatTime(r.date)}</span>, sortValue: (r) => r.date },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
  ];
  return (
    <Sub title="Data table and filter bar" note="A table from 768px, stacked rows on phones, never sideways scroll for primary data. Filters move into a sheet on small screens." api="<DataTable rows columns />  <FilterBar />">
      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search reference, customer, area"
        filters={[
          { key: "status", label: "Status", options: [...new Set(rows.map((r) => r.status))].sort() },
          { key: "operator", label: "Operator", options: [...new Set(rows.map((r) => r.operatorName))].sort() },
        ]}
        values={filters}
        onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
        onExport={(f) => toast.success(f === "Print" ? "Sent to printer" : `${f} export started`, `${filtered.length} pickups. It will download in a moment.`)}
      />
      <DataTable rows={filtered} columns={columns} rowKey={(r) => r.id} pageSize={6} onRowClick={(r) => toast.info(r.id, `${r.customerName} · ${r.status}`)} />
    </Sub>
  );
}

function StatsDemo() {
  return (
    <Sub title="Stats" note="One hero number, or a strip separated by hairlines. Deltas say which direction is good." api="<StatStrip><Stat /></StatStrip>">
      <StatStrip className="lg:grid-cols-4">
        <Stat label="Monthly recurring revenue" value={formatNairaShort(series.mrr.at(-1)!)} delta={13.5} chart={<Sparkline data={series.mrr} />} />
        <Stat label="Homes and sites" value={formatNumber(series.customers.at(-1)!)} delta={12.1} chart={<Sparkline data={series.customers} />} />
        <Stat label="On time, 30 days" value="96.8%" delta={0.3} chart={<Sparkline data={series.completion} tone="success" />} />
        <Stat label="Missed today" value="5" delta={-16.7} deltaGood="down" chart={<Sparkline data={series.missed14} tone="danger" />} />
      </StatStrip>
      <Specimen label="emphasis">
        <Stat emphasis label="Collected this year from your home" value="96 pickups" hint="1 missed, recovered the same day" />
      </Specimen>
    </Sub>
  );
}

function ProgressDemo() {
  const [step, setStep] = useState(2);
  const steps = ["Address", "Plan", "Schedule", "Payment", "Confirm"];
  return (
    <Sub title="Timeline, stepper, progress" note="The pickup's story, a flow's position, and how far along something is." api="<Timeline />  <Stepper />  <ProgressBar />  <Meter />">
      <div className="grid gap-4 md:grid-cols-2">
        <Specimen label="<Timeline />  PU-26-08813">
          <Timeline
            items={[
              { title: "Scheduled", time: "Sun 18:00", description: "Reminder sent by SMS.", state: "done" },
              { title: "Driver assigned", time: "06:41", description: "Aniekan · KTU 482 XA · Ufok Environmental", state: "done" },
              { title: "On the way", time: "07:52", description: "2 stops away, about 9 minutes.", state: "current" },
              { title: "Collected", description: "Photo and GPS check-in at the gate.", state: "upcoming" },
            ]}
          />
        </Specimen>
        <Specimen label="<Timeline />  failed step">
          <Timeline
            items={[
              { title: "Card charged", time: "1 Sep, 06:01", description: "Verve •• 7735 declined by the bank.", state: "failed" },
              { title: "Retried with Visa •• 4021", time: "2 Sep, 12:30", description: "₦7,000 paid.", state: "done" },
              { title: "Receipt sent", time: "2 Sep, 12:30", state: "done" },
            ]}
          />
        </Specimen>
      </div>
      <Specimen label="<Stepper />">
        <Stepper steps={steps} current={step} onStepClick={setStep} />
        <div className="mt-5 flex gap-2">
          <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</Button>
          <Button size="sm" disabled={step === steps.length - 1} onClick={() => setStep((s) => s + 1)}>Next</Button>
        </div>
      </Specimen>
      <div className="grid gap-4 md:grid-cols-2">
        <Specimen label="<ProgressBar tone />">
          <div className="flex flex-col gap-4">
            {[
              { tone: "slate" as const, v: 72, l: "Ewet drainage channel · ₦612,500 of ₦850,000" },
              { tone: "signal" as const, v: 62, l: "Truck on route · live" },
              { tone: "success" as const, v: 100, l: "Recycling stations · funded" },
              { tone: "warning" as const, v: 40, l: "Smart Sweep · ₦5,600 of ₦14,000" },
              { tone: "danger" as const, v: 18, l: "Capacity left · Ufok Environmental" },
            ].map((p) => (
              <div key={p.tone} className="flex flex-col gap-1.5">
                <div className="flex justify-between t-small">
                  <span className="text-ink-2">{p.l}</span>
                  <span className="font-medium text-ink tnum">{p.v}%</span>
                </div>
                <ProgressBar value={p.v} tone={p.tone} label={p.l} />
              </div>
            ))}
          </div>
        </Specimen>
        <Specimen label="<Meter />  SLA score">
          <div className="flex flex-col gap-4">
            {[
              ["Ufok Environmental", 94],
              ["Atlantic Coast", 88],
              ["Nwaniba Clean Crew", 76],
              ["Obio Sanitation", 58],
            ].map(([n, v]) => (
              <div key={n as string} className="flex flex-col gap-1.5">
                <div className="flex justify-between t-small">
                  <span className="text-ink-2">{n}</span>
                  <span className="font-medium text-ink tnum">{v}</span>
                </div>
                <Meter value={v as number} />
              </div>
            ))}
          </div>
        </Specimen>
      </div>
    </Sub>
  );
}

function ChartsDemo() {
  const byType = (["Household", "Estate", "Business", "Institution"] as const).map((t) => ({ label: `${t}s`, value: customers.filter((c) => c.type === t).length }));
  const count = (s: string[]) => todaysPickups.filter((p) => s.includes(p.status)).length;
  return (
    <Sub title="Charts" note="Hand-built SVG in the slate palette. One series is ink; the highlighted point is signal. Every chart has a label and visible values." api="<AreaChart />  <BarChart />  <Donut />  <StackedBar />  <Sparkline />">
      <div className="grid gap-4 lg:grid-cols-2">
        <Specimen label="<AreaChart compare />  MRR vs. last period">
          <AreaChart data={series.mrr} compare={series.mrrPrev} labels={series.months} format={formatNairaShort} label="Monthly recurring revenue" />
        </Specimen>
        <Specimen label="<BarChart stacked highlight />  pickups and missed, 14 days">
          <BarChart data={series.pickups14} stacked={series.missed14} labels={series.last14} highlight={13} label="Pickups per day" className="pt-6" />
        </Specimen>
        <Specimen label="<Donut />  customers by type">
          <Donut
            segments={byType}
            center={
              <>
                <span className="font-display text-[26px] font-bold leading-none text-ink tnum">{customers.length}</span>
                <span className="t-micro text-ink-3">accounts</span>
              </>
            }
          />
        </Specimen>
        <Specimen label="<StackedBar />  today's pickups">
          <StackedBar
            segments={[
              { label: "Collected", value: count(["Completed"]), tone: "success" },
              { label: "In progress", value: count(["In progress", "En route", "Arrived"]), tone: "slate" },
              { label: "Scheduled", value: count(["Scheduled"]), tone: "muted" },
              { label: "Late", value: count(["Late"]), tone: "warning" },
              { label: "Missed or failed", value: count(["Missed", "Failed"]), tone: "danger" },
            ]}
          />
          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            {(["slate", "signal", "success", "danger"] as const).map((t) => (
              <div key={t} className="flex flex-col gap-1">
                <span className="t-mono text-[12px] text-ink-3">{t}</span>
                <Sparkline data={t === "danger" ? series.missed14 : t === "success" ? series.completion : series.customers} tone={t} />
              </div>
            ))}
          </div>
        </Specimen>
      </div>
    </Sub>
  );
}

function PeopleAndSurfacesDemo() {
  return (
    <Sub title="People, surfaces and lists" note="Avatars use initials in slate tints, no stock faces. Panels are for objects; lists are hairlines." api="<Avatar />  <Panel />  <List />  <DescriptionList />">
      <div className="grid gap-4 md:grid-cols-2">
        <Specimen label="<Avatar size />  <AvatarStack />">
          <div className="flex flex-wrap items-end gap-3">
            {(["xs", "sm", "md", "lg", "xl"] as const).map((s) => (
              <Avatar key={s} name="Aniekan Etim" size={s} />
            ))}
            <Avatar name="Ufok Environmental" size="lg" square />
          </div>
          <div className="mt-5 flex items-center gap-3">
            <AvatarStack names={["Imaobong Akpan", "Uduak Essien", "Mfon Bassey", "Nsikak Okon", "Idara Umoh", "Edidiong Johnson"]} />
            <span className="t-small text-ink-2">141 neighbours contributed</span>
          </div>
        </Specimen>
        <Specimen label="<Breadcrumbs />  <Kbd />  <Ref />">
          <div className="flex flex-col gap-5">
            <Breadcrumbs items={[{ label: "Contracts", to: "/design-system" }, { label: "Ufok Environmental", to: "/design-system" }, { label: "CT-UYO-011" }]} />
            <p className="flex items-center gap-2 t-small text-ink-2">
              Open the command palette with <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </p>
            <p className="t-small text-ink-2">
              Quote <Ref className="text-ink">PU-26-08813</Ref> when you call support.
            </p>
          </div>
        </Specimen>
        <Panel
          title="Contract CT-UYO-011"
          description="Ufok Environmental · residential estates"
          actions={<StatusBadge status="Active" />}
          footer={<p className="t-small text-ink-3">Version 3 · renews 31 Mar 2027</p>}
        >
          <DescriptionList
            items={[
              { label: "Customer price", value: "₦7,000/month" },
              { label: "Operator payout", value: "₦5,500/month" },
              { label: "SLA completion", value: "97%" },
              { label: "Missed-pickup response", value: "24 hours" },
            ]}
          />
        </Panel>
        <div className="flex flex-col gap-4">
          <Panel tone="sunken" title="Panel tone sunken" description="For wells: a summary inside a page." />
          <Panel tone="slate" title="Panel tone slate" description="Brand fields with chalk grain." />
        </div>
      </div>
    </Sub>
  );
}

function FeedbackDemo() {
  const [dismissed, setDismissed] = useState(false);
  return (
    <Sub title="Feedback" note="Alerts say what happened and what to do next. Empty states explain and offer the next step. Skeletons hold the layout while loading." api="<Alert tone />  <EmptyState />  <Skeleton />">
      <div className="flex flex-col gap-3">
        <Alert tone="info" title="Collection window changes from Mon 2 Nov">Ewet Housing Estate moves to 06:30–08:30 so crews finish before school traffic.</Alert>
        <Alert tone="success" title="₦7,000 paid for November">Receipt TXN-8KD2QW is in your email and under Receipts.</Alert>
        <Alert tone="warning" title="Verve •• 7735 expires this month" action={<Button size="sm" variant="outline">Update card</Button>}>
          Add a new card before 1 Nov so your next charge goes through.
        </Alert>
        <Alert tone="danger" title="Thursday's collection was missed">A recovery crew is booked for Fri 9 Oct, 07:00–10:00. Ufok Environmental has been notified.</Alert>
        {!dismissed && (
          <Alert tone="neutral" title="Service paused until Mon 2 Nov" onDismiss={() => setDismissed(true)}>
            You won't be charged while you're away.
          </Alert>
        )}
        <Alert tone="signal" title="Truck 2 stops away">Aniekan should reach your gate in about 9 minutes.</Alert>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Specimen label="<EmptyState />  with strata">
          <EmptyState compact title="No pickups yet" description="Your first collection is Thursday, 07:00–09:00." action={<Button size="sm" variant="secondary">See schedule</Button>} />
        </Specimen>
        <Specimen label="<EmptyState icon />">
          <EmptyState compact icon={<Receipt />} title="No receipts" description="Receipts appear here after each payment." />
        </Specimen>
        <Specimen label="<SkeletonRows />  <Skeleton />  <Spinner />">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-16 w-full rounded-md" />
            </div>
            <SkeletonRows rows={2} />
            <div className="flex items-center gap-2 t-small text-ink-3">
              <Spinner className="size-4" /> Loading pickups
            </div>
          </div>
        </Specimen>
      </div>
    </Sub>
  );
}

/* ================================================================== */
/* 09 Overlays                                                         */
/* ================================================================== */

function OverlaysSection() {
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [suspended, setSuspended] = useState(false);
  const [day, setDay] = useState("Fri 9 Oct");
  return (
    <DSSection
      id="overlays"
      n="09"
      title="Overlays"
      lede="Modals become bottom sheets on phones, with actions in the thumb zone. Drawers slide from the right on desktop. Every floating layer uses the one float shadow, traps focus and closes on Escape."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Specimen label="<Modal />  sheet on phones">
          <p className="t-small text-ink-2">Centred dialog from 640px. Resize the window to see the sheet.</p>
          <Button className="mt-4" onClick={() => setModal(true)} leading={<CalendarClock className="size-4" />}>Reschedule pickup</Button>
        </Specimen>
        <Specimen label="<Drawer />">
          <p className="t-small text-ink-2">Detail without leaving the list. Full-height sheet on phones.</p>
          <Button className="mt-4" variant="outline" onClick={() => setDrawer(true)}>Open PU-26-08813</Button>
        </Specimen>
        <Specimen label='<ConfirmDialog variant="destructive" requireText />'>
          <p className="t-small text-ink-2">Consequential actions ask you to type a word.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="destructive" onClick={() => setConfirm(true)} disabled={suspended}>Suspend operator</Button>
            {suspended && (
              <>
                <StatusBadge status="Suspended" />
                <Button variant="ghost" size="sm" onClick={() => setSuspended(false)}>Undo</Button>
              </>
            )}
          </div>
        </Specimen>
        <Specimen label="<Menu />  <Popover />  <Tooltip />">
          <div className="flex flex-wrap items-center gap-3">
            <Menu
              align="start"
              trigger={(p) => (
                <Button variant="outline" trailing={<MoreHorizontal className="size-4" />} {...p}>
                  Actions
                </Button>
              )}
              items={[
                { label: "Reschedule", icon: <CalendarClock />, onSelect: () => setModal(true) },
                { label: "Share tracking link", icon: <Link2 />, onSelect: () => toast.success("Tracking link copied") },
                { label: "Download receipt", icon: <Download />, onSelect: () => toast.info("Receipt downloading") },
                { divider: true, label: "" },
                { label: "Cancel pickup", icon: <Trash2 />, danger: true, onSelect: () => toast.error("Pickup cancelled", "PU-26-08851 · Thu 8 Oct") },
              ]}
            />
            <Popover
              align="start"
              trigger={(p) => (
                <Button variant="outline" leading={<Share2 className="size-4" />} {...p}>
                  Share
                </Button>
              )}
              className="w-72 p-4"
            >
              {(close) => (
                <div className="flex flex-col gap-3">
                  <p className="t-h3 text-ink">Share live tracking</p>
                  <p className="t-small text-ink-2">Anyone with the link sees the truck until the pickup is collected.</p>
                  <Input readOnly value="slate.ng/t/8813-KTU" aria-label="Tracking link" />
                  <Button size="sm" onClick={() => { close(); toast.success("Link copied"); }}>Copy link</Button>
                </div>
              )}
            </Popover>
            <Tooltip content="Notifications">
              <IconButton label="Notifications" variant="outline"><Bell /></IconButton>
            </Tooltip>
            <Tooltip content="Settings" side="bottom">
              <IconButton label="Settings" variant="outline"><Settings /></IconButton>
            </Tooltip>
          </div>
        </Specimen>
      </div>
      <Specimen label="useToast()  success · error · info · warning">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => toast.success("Pickup booked", "Thu 8 Oct, 07:00–09:00")}>Success</Button>
          <Button variant="secondary" onClick={() => toast.error("Card declined", "Verve •• 7735. Try another card.")}>Error</Button>
          <Button variant="secondary" onClick={() => toast.info("Collection moved", "Public holiday: Thursday moves to Friday.")}>Info</Button>
          <Button
            variant="secondary"
            onClick={() => toast.toast({ tone: "warning", title: "Payment retrying", description: "We'll try Visa •• 4021 again on Wednesday.", action: { label: "Pay now", onClick: () => toast.success("₦7,000 paid") } })}
          >
            Warning with action
          </Button>
        </div>
      </Specimen>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Reschedule pickup"
        description="PU-26-08851 · Slate Home · 14 Ewet Housing Estate"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>Keep Thursday</Button>
            <Button
              onClick={() => {
                setModal(false);
                toast.success(`Moved to ${day}`, "07:00–09:00. Ufok Environmental has the new date.");
              }}
            >
              Move pickup
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-5 pb-2">
          <Segmented value={day} onChange={setDay} options={["Fri 9 Oct", "Sat 10 Oct", "Mon 12 Oct"].map((d) => ({ value: d, label: d }))} className="w-full" />
          <Textarea label="Reason" optional rows={3} placeholder="Travelling, event at home…" />
          <p className="t-small text-ink-3">You can move a pickup up to 18:00 the day before.</p>
        </div>
      </Modal>

      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        title="PU-26-08813"
        description="Slate Home · Mon 5 Oct · 07:00–09:00"
        footer={
          <>
            <Button variant="outline" onClick={() => setDrawer(false)}>Close</Button>
            <Button onClick={() => { setDrawer(false); toast.success("Crew notified"); }}>Message crew</Button>
          </>
        }
      >
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-2">
            <StatusBadge status="En route" />
            <span className="t-small text-ink-2">2 stops away</span>
          </div>
          <DescriptionList
            columns={1}
            items={[
              { label: "Address", value: "14 Ewet Housing Estate, Uyo" },
              { label: "Landmark", value: "Opposite the estate clinic, blue gate" },
              { label: "Operator", value: "Ufok Environmental" },
              { label: "Driver and vehicle", value: "Aniekan · KTU 482 XA" },
            ]}
          />
          <Timeline
            items={[
              { title: "Scheduled", time: "Sun 18:00", state: "done" },
              { title: "Driver assigned", time: "06:41", state: "done" },
              { title: "On the way", time: "07:52", state: "current" },
              { title: "Collected", state: "upcoming" },
            ]}
          />
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        variant="destructive"
        title="Suspend Ufok Environmental?"
        description="1,912 customers move to backup operators from tomorrow's first collection. Payouts are held until the review closes."
        confirmLabel="Suspend operator"
        requireText="SUSPEND"
        onConfirm={() => {
          setSuspended(true);
          toast.toast({ tone: "warning", title: "Ufok Environmental suspended", description: "Backup routes go live at 06:00.", action: { label: "Undo", onClick: () => setSuspended(false) } });
        }}
      />
    </DSSection>
  );
}

/* ================================================================== */
/* 10 System states                                                    */
/* ================================================================== */

const STATES: SystemState[] = ["loading", "empty", "error", "success", "pending", "failed", "cancelled", "suspended", "expired", "offline", "unauthorized", "not-found", "service-unavailable"];

function StatesSection() {
  const action = (s: SystemState) => {
    switch (s) {
      case "error":
      case "failed":
        return <Button size="sm" variant="outline" leading={<RotateCcw className="size-4" />}>Try again</Button>;
      case "suspended":
        return <Button size="sm" variant="secondary">Contact support</Button>;
      case "expired":
        return <Button size="sm" variant="secondary">Renew</Button>;
      case "service-unavailable":
        return <Button size="sm" variant="secondary">Notify me</Button>;
      default:
        return undefined;
    }
  };
  return (
    <DSSection
      id="states"
      n="10"
      title="System states"
      lede="Every major flow handles all thirteen. One component, StateView, with Slate's words for each, override the title and description where the context is specific."
    >
      <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
        {STATES.map((s) => (
          <div key={s} className="flex flex-col bg-surface">
            <p className="px-5 pt-4 t-mono text-[12px] text-ink-3">state="{s}"</p>
            <StateView state={s} compact action={action(s)} className="px-5 pb-6 pt-4" />
          </div>
        ))}
        <div className="hidden flex-col justify-end gap-2 bg-sunken p-6 sm:flex xl:col-span-2">
          <p className="t-h3 text-ink">Override when you know more</p>
          <p className="t-small text-ink-2">
            <span className="t-mono text-ink">{`<StateView state="not-found" title="No pickup PU-26-09999" />`}</span>
          </p>
        </div>
      </div>
    </DSSection>
  );
}

/* ================================================================== */
/* 11 Signature                                                        */
/* ================================================================== */

function SignatureSection() {
  const [progress, setProgress] = useState(0.5);
  const [done, setDone] = useState(false);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const run = () => {
    if (running) return;
    setDone(false);
    setRunning(true);
    setProgress(0.5);
    timer.current = setInterval(() => {
      setProgress((p) => {
        const n = Math.min(1, +(p + 0.1).toFixed(2));
        if (n >= 1) {
          if (timer.current) clearInterval(timer.current);
          setTimeout(() => {
            setDone(true);
            setRunning(false);
          }, 650);
        }
        return n;
      });
    }, 260);
  };
  const reset = () => {
    if (timer.current) clearInterval(timer.current);
    setRunning(false);
    setDone(false);
    setProgress(0.5);
  };

  return (
    <DSSection
      id="signature"
      n="11"
      title="Clean slate"
      lede="The one moment Slate is allowed to perform. When a pickup is marked collected, a chalk-eraser sweep crosses the slate field and leaves a clean surface. It happens once per pickup, and it means exactly one thing."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-4">
          <CleanSlate
            done={done}
            className="rounded-xl"
            after={
              <div className="flex h-full flex-col justify-between gap-6 rounded-xl border border-line bg-surface p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <Badge tone="success" icon={<Check strokeWidth={3} />}>Collected</Badge>
                  <span className="t-mono text-ink-3">PU-26-08813</span>
                </div>
                <div>
                  <p className="t-display text-ink">Clean slate.</p>
                  <p className="t-body mt-3 text-ink-2">
                    Collected at <span className="font-semibold text-ink tnum">07:42</span>. Next collection is <span className="font-semibold text-ink">Thursday, 07:00–09:00</span>.
                  </p>
                </div>
              </div>
            }
          >
            <div className="relative isolate flex min-h-[340px] flex-col overflow-hidden rounded-xl bg-slate text-slate-ink chalk-grain">
              <RouteMap progress={progress} stops={[0.18, 0.4, 0.78]} className="absolute inset-0 h-full w-full" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-slate from-30% to-transparent" />
              <div className="relative flex flex-col gap-2 p-6">
                <span className="inline-flex h-7 w-fit items-center gap-2 rounded-sm bg-signal px-2.5 text-[12px] font-semibold text-signal-ink">
                  <LiveDot className="[&>span]:bg-signal-ink" /> On the way
                </span>
                <p className="t-display">Today</p>
                <p className="t-body text-slate-ink/80 tnum">07:00–09:00 · {progress >= 1 ? "Arriving now" : `${Math.max(1, Math.round((1 - progress) * 24))} min away`}</p>
              </div>
            </div>
          </CleanSlate>
          <div className="flex gap-2">
            <Button onClick={run} loading={running} leading={!running ? <Play className="size-4" /> : undefined}>
              {running ? "Truck arriving" : done ? "Run again" : "Run"}
            </Button>
            <Button variant="ghost" onClick={reset} leading={<RotateCcw className="size-4" />}>Reset</Button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <DescriptionList
            columns={1}
            items={[
              { label: "Trigger", value: "The pickup's status becomes Collected, the operator's photo and GPS check-in are accepted." },
              { label: "Easing", value: <span className="t-mono">cubic-bezier(.2, .8, .2, 1)</span> },
              { label: "Haptic", value: <span><span className="t-mono">navigator.vibrate([10, 30, 14])</span> where supported, after a user gesture.</span> },
              { label: "Reduced motion", value: "A 160 ms crossfade. No sweep, no movement." },
              { label: "Used on", value: "Customer home and the pickup detail live tracker. Nowhere else." },
            ]}
          />
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-6 border-t border-line pt-5">
            <EaseCurve />
            <Haptic />
          </div>
        </div>
      </div>

      <Sub title="Storyboard" note="Four frames, 700 ms in total.">
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: "Trigger", d: "The truck dot reaches the address pin. The field holds still.", frame: "trigger" },
            { t: "0 ms", d: "Collected is confirmed. Haptic fires: 10 ms, pause 30, 14 ms.", frame: "hold" },
            { t: "0–520 ms", d: "The eraser sweeps diagonally; a masked wipe reveals the clean surface.", frame: "wipe" },
            { t: "380–700 ms", d: "“Collected 07:42” settles in from 10px below. The chip turns success.", frame: "settle" },
          ].map((f, i) => (
            <li key={f.t} className="flex flex-col gap-3">
              <StoryFrame kind={f.frame as "trigger" | "hold" | "wipe" | "settle"} />
              <div className="flex items-baseline gap-2.5">
                <span className="t-mono text-ink-3">{i + 1}</span>
                <p className="t-h3 text-ink tnum">{f.t}</p>
              </div>
              <p className="-mt-1.5 t-small text-ink-2">{f.d}</p>
            </li>
          ))}
        </ol>
      </Sub>
    </DSSection>
  );
}

function StoryFrame({ kind }: { kind: "trigger" | "hold" | "wipe" | "settle" }) {
  const slate = (
    <div className="absolute inset-0 bg-slate chalk-grain">
      <svg viewBox="0 0 200 120" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
        <path d="M14 104 C 60 96, 70 50, 120 52 S 170 36, 176 30" fill="none" stroke="#F2F4F6" strokeOpacity=".35" strokeWidth="1.5" strokeDasharray="3 5" />
        <path d={kind === "trigger" ? "M14 104 C 60 96, 70 50, 120 52 S 160 40, 164 36" : "M14 104 C 60 96, 70 50, 120 52 S 170 36, 176 30"} fill="none" stroke="var(--signal)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="176" cy="30" r="6" fill="#F2F4F6" />
        <circle cx={kind === "trigger" ? 164 : 176} cy={kind === "trigger" ? 36 : 30} r="5" fill="var(--signal)" stroke="#2B3643" strokeWidth="1.5" />
      </svg>
      <span className="absolute left-3 top-2.5 rounded-sm bg-signal px-1.5 text-[12px] font-semibold leading-5 text-signal-ink">{kind === "trigger" ? "Arriving" : "Arrived"}</span>
    </div>
  );
  const clean = (
    <div className="absolute inset-0 flex flex-col justify-end gap-1 bg-surface p-3">
      <span className={cn("inline-flex w-fit items-center gap-1 rounded-sm bg-success-bg px-1.5 text-[12px] font-medium leading-5 text-success", kind === "wipe" && "opacity-0")}>
        <Check className="size-3" strokeWidth={3} /> Collected
      </span>
      <span className={cn("font-display text-[18px] font-bold leading-tight text-ink", kind === "wipe" && "translate-y-2 opacity-0")}>Collected 07:42</span>
    </div>
  );
  return (
    <div className="relative aspect-[5/3] overflow-hidden rounded-lg ring-1 ring-line">
      {kind === "settle" ? clean : slate}
      {kind === "wipe" && (
        <>
          <div className="absolute inset-0" style={{ clipPath: "polygon(0 0, 68% 0, 46% 100%, 0 100%)" }}>
            {clean}
          </div>
          <div className="absolute inset-y-[-20%] left-[42%] w-[18%] rotate-[14deg] bg-gradient-to-r from-transparent via-white/80 to-transparent blur-[4px]" aria-hidden />
        </>
      )}
    </div>
  );
}

function EaseCurve() {
  // cubic-bezier(.2,.8,.2,1)
  const W = 160, H = 96, p = 8;
  const x = (t: number) => p + t * (W - 2 * p);
  const y = (t: number) => H - p - t * (H - 2 * p);
  return (
    <figure className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-24 w-full max-w-[200px]" role="img" aria-label="Easing curve cubic-bezier(.2,.8,.2,1)">
        <rect x={p} y={p} width={W - 2 * p} height={H - 2 * p} fill="none" stroke="var(--line)" />
        <line x1={x(0)} y1={y(0)} x2={x(0.2)} y2={y(0.8)} stroke="var(--line-strong)" strokeDasharray="2 3" />
        <line x1={x(1)} y1={y(1)} x2={x(0.2)} y2={y(1)} stroke="var(--line-strong)" strokeDasharray="2 3" />
        <path d={`M${x(0)} ${y(0)} C ${x(0.2)} ${y(0.8)}, ${x(0.2)} ${y(1)}, ${x(1)} ${y(1)}`} fill="none" stroke="var(--ink)" strokeWidth="2" />
        <circle cx={x(0.2)} cy={y(0.8)} r="3" fill="var(--signal)" />
        <circle cx={x(0.2)} cy={y(1)} r="3" fill="var(--signal)" />
      </svg>
      <figcaption className="t-micro text-ink-3">Fast out, long settle</figcaption>
    </figure>
  );
}

function Haptic() {
  const seg = [
    { ms: 10, on: true },
    { ms: 30, on: false },
    { ms: 14, on: true },
  ];
  return (
    <figure className="flex flex-col gap-2">
      <div className="flex h-24 items-end gap-0.5" aria-label="Haptic pattern 10 on, 30 off, 14 on" role="img">
        {seg.map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <span className={cn("rounded-[2px]", s.on ? "bg-ink" : "border border-dashed border-line-strong")} style={{ width: s.ms * 1.6, height: s.on ? 44 + s.ms : 12 }} />
            <span className="t-mono text-[12px] text-ink-3">{s.ms}</span>
          </div>
        ))}
      </div>
      <figcaption className="t-micro text-ink-3">Haptic, ms</figcaption>
    </figure>
  );
}

/* ================================================================== */
/* 12 Voice                                                            */
/* ================================================================== */

const VOICE: Array<{ ctx: string; no: string; yes: string }> = [
  { ctx: "Loading failed", no: "Oops! Something went wrong 😕", yes: "We couldn't load your pickups. Check your connection and try again." },
  { ctx: "Home screen", no: "Hello Imaobong 👋 Welcome back!", yes: "Today · 07:00–09:00 · 2 stops away" },
  { ctx: "Action label", no: "Let us know!", yes: "Report missed pickup" },
  { ctx: "Payment failure", no: "Payment Failed!!! Please Try Again", yes: "Visa •• 4021 was declined. We'll retry on Wednesday, or you can pay now." },
  { ctx: "Confirmation", no: "Your request has been submitted successfully.", yes: "Report sent. A crew will be at your gate by 10:00 tomorrow." },
  { ctx: "Destructive action", no: "Are you sure?", yes: "Suspend Ufok Environmental? 1,912 customers move to backup operators tomorrow." },
  { ctx: "Marketing", no: "Revolutionising waste with smart, AI-powered logistics.", yes: "Your waste gets collected. We handle the rest." },
  { ctx: "Money and references", no: "NGN 7000.00 · ref #pu2608813", yes: "₦7,000 · PU-26-08813" },
];

function VoiceSection() {
  return (
    <DSSection
      id="voice"
      n="12"
      title="Voice and copy"
      lede="Slate sells reliability, not technology. Calm, specific, short. Sentence case. No exclamation marks, no emoji, no greetings. Labels say what things are; errors say what happened and what to do next."
    >
      <div className="divide-y divide-line border-y border-line">
        {VOICE.map((v) => (
          <div key={v.ctx} className="grid gap-3 py-5 md:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)] md:gap-8">
            <p className="t-micro pt-1 text-ink-3">{v.ctx}</p>
            <div className="flex gap-3">
              <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-sm bg-danger-bg text-danger" aria-label="Don't">
                <X className="size-3.5" strokeWidth={3} />
              </span>
              <p className="t-body text-ink-3 line-through decoration-ink-3/50">{v.no}</p>
            </div>
            <div className="flex gap-3">
              <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-sm bg-success-bg text-success" aria-label="Do">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
              <p className="t-body font-medium text-ink">{v.yes}</p>
            </div>
          </div>
        ))}
      </div>
      <Sub title="Formats">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Money", "₦7,000 · ₦1.84m in dense views", "Naira sign, comma thousands, no kobo unless it matters."],
            ["Dates", "Tue 6 Oct · 6 Oct 2026", "Day first. Weekday when it helps someone plan."],
            ["Times", "07:42 · 07:00–09:00", "24-hour, with an en dash for windows."],
            ["References", "PU-26-08813 · TXN-7Q4K2M", "Mono, uppercase, readable over the phone."],
            ["Phone numbers", "+234 803 412 0951", "Country code, grouped in threes and fours."],
            ["Places", "14 Ewet Housing Estate, Uyo", "Real streets and estates, plus a landmark."],
          ].map(([k, v, d]) => (
            <div key={k} className="flex flex-col gap-1 bg-surface p-5">
              <p className="t-micro text-ink-3">{k}</p>
              <p className="t-h3 text-ink tnum">{v}</p>
              <p className="t-small text-ink-2">{d}</p>
            </div>
          ))}
        </div>
      </Sub>
    </DSSection>
  );
}

/* ================================================================== */
/* 13 Layout                                                           */
/* ================================================================== */

const BREAKPOINTS = [
  { bp: "base", min: "0", what: "Phones. 20px gutter, stacked table rows, modals as bottom sheets, floating tab bar with four destinations and More." },
  { bp: "sm", min: "640px", what: "Modals centre on the screen. Toasts move to the bottom-right." },
  { bp: "md", min: "768px", what: "32px gutter. Data tables become real tables. Pagination shows page numbers." },
  { bp: "lg", min: "1024px", what: "Portal sidebar and top bar with ⌘K appear; tab bar goes. Public site shows the full navigation." },
  { bp: "xl", min: "1280px", what: "Wider rails and reading columns. Content stops growing at 1240px." },
];

function LayoutSection() {
  return (
    <DSSection
      id="layout"
      n="13"
      title="Layout"
      lede="Designed at 390px first. On phones the primary action sits in the thumb zone and navigation floats at the bottom. On desktop, a grouped sidebar and a top bar with the command palette."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-end">
        <figure className="flex flex-col gap-3">
          <div className="aspect-[16/10] overflow-hidden rounded-lg border border-line-strong bg-canvas" aria-hidden>
            <div className="grid h-full grid-cols-[22%_minmax(0,1fr)]">
              <div className="flex flex-col gap-2 border-r border-line bg-surface p-3">
                <div className="flex items-center gap-1.5">
                  <SlabMark className="size-4 text-ink" />
                  <span className="h-2 w-10 rounded-full bg-ink/80" />
                </div>
                <div className="mt-2 flex flex-col gap-1.5">
                  <span className="h-5 rounded-[4px] bg-slate dark:bg-stone" />
                  {[70, 55, 62, 48].map((w, i) => (
                    <span key={i} className="h-2 rounded-full bg-line-strong" style={{ width: `${w}%` }} />
                  ))}
                  <span className="mt-2 h-1.5 w-8 rounded-full bg-line" />
                  {[58, 66, 44].map((w, i) => (
                    <span key={i} className="h-2 rounded-full bg-line-strong" style={{ width: `${w}%` }} />
                  ))}
                </div>
              </div>
              <div className="flex min-w-0 flex-col">
                <div className="flex items-center gap-2 border-b border-line bg-glass px-3 py-2">
                  <span className="flex h-5 w-1/3 items-center gap-1 rounded-[4px] border border-line bg-surface px-1.5">
                    <Search className="size-2.5 text-ink-3" />
                    <span className="ml-auto text-[12px] leading-none text-ink-3">⌘K</span>
                  </span>
                  <span className="ml-auto size-4 rounded-full bg-line-strong" />
                  <span className="size-4 rounded-full bg-slate dark:bg-slate-300" />
                </div>
                <div className="grid flex-1 grid-cols-[1.5fr_1fr] gap-3 p-3">
                  <div className="flex flex-col gap-2">
                    <span className="h-3 w-1/3 rounded-full bg-ink/70" />
                    <span className="relative flex-1 overflow-hidden rounded-md bg-slate">
                      <Strata tone="on-slate" bands={4} live seed={9} chalk={false} className="absolute inset-0 h-full w-full" />
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 pt-5">
                    {[1, 2, 3, 4].map((i) => (
                      <span key={i} className="h-6 rounded-[4px] border border-line bg-surface" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <figcaption className="t-small text-ink-2">
            <span className="font-medium text-ink">Desktop portal shell.</span> Grouped sidebar, glass top bar with search and <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>, notifications and account. Admin adds a command bar above.
          </figcaption>
        </figure>
        <figure className="flex flex-col gap-3">
          <div className="mx-auto aspect-[390/700] w-full max-w-[220px] overflow-hidden rounded-[28px] border-[6px] border-slate-900 bg-canvas dark:border-slate-700" aria-hidden>
            <div className="relative flex h-full flex-col gap-2 p-3 pt-5">
              <span className="h-2 w-1/2 rounded-full bg-ink-3/60" />
              <span className="relative h-[42%] overflow-hidden rounded-xl bg-slate">
                <Strata tone="on-slate" bands={4} live seed={9} chalk={false} className="absolute inset-0 h-full w-full" />
                <span className="absolute left-2.5 top-2.5 h-2.5 w-10 rounded-[3px] bg-signal" />
                <span className="absolute left-2.5 top-7 h-4 w-16 rounded-full bg-slate-ink/90" />
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <span key={i} className="h-7 rounded-md border border-line bg-surface" />
                ))}
              </div>
              {[1, 2].map((i) => (
                <span key={i} className="h-8 border-b border-line" />
              ))}
              <div className="absolute inset-x-2.5 bottom-3 flex items-center justify-around rounded-2xl border border-line bg-glass py-2 shadow-float backdrop-blur">
                {[Truck, CalendarClock, CreditCard, LifeBuoy, MoreHorizontal].map((I, i) => (
                  <I key={i} className={cn("size-3.5", i === 0 ? "text-ink" : "text-ink-3")} strokeWidth={2} />
                ))}
              </div>
            </div>
          </div>
          <figcaption className="t-small text-ink-2">
            <span className="font-medium text-ink">Mobile.</span> Edge-to-edge content, floating glass tab bar: four destinations plus More.
          </figcaption>
        </figure>
      </div>

      <Sub title="Breakpoints" note="Tailwind defaults, used mobile-first: style the phone, then add sm, md, lg, xl.">
        <div className="divide-y divide-line border-y border-line">
          {BREAKPOINTS.map((b) => (
            <div key={b.bp} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 py-4 md:grid-cols-[6rem_7rem_minmax(0,1fr)]">
              <span className="t-mono text-ink">{b.bp}</span>
              <span className="t-small text-ink-3 tnum md:order-none">≥ {b.min}</span>
              <p className="col-span-2 t-small text-ink-2 md:col-span-1">{b.what}</p>
            </div>
          ))}
        </div>
      </Sub>

      <div className="grid gap-x-10 gap-y-4 md:grid-cols-3">
        {[
          ["Tables collapse", "Into stacked rows on phones: title, subtitle, status, then a two-column detail grid. Never sideways scroll for primary data."],
          ["Thumb zone", "The primary action of a mobile screen sits in the bottom third. Sheet footers stack full width."],
          ["Hiding buttons", "Use a variant like max-md:hidden, bare hidden loses to the button's own inline-flex."],
        ].map(([t, d]) => (
          <div key={t} className="border-t border-line pt-4">
            <p className="t-h3 text-ink">{t}</p>
            <p className="t-small mt-1 text-ink-2">{d}</p>
          </div>
        ))}
      </div>
    </DSSection>
  );
}
