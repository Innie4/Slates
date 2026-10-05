import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { ArrowRight, ArrowUpRight, Building2, Home as HomeIcon, Landmark, Store } from "lucide-react";
import { RouteMap } from "@/components/brand/RouteMap";
import { Avatar, Badge, ButtonLink, LiveDot, ProgressBar, StatusBadge, Timeline } from "@/components/ui";
import { cn } from "@/lib/cn";
import { cities, communityProjects, services } from "@/data";
import { formatNaira, formatNumber } from "@/lib/format";
import {
  AddressChecker, ArrowLink, BranchInvoice, CheckList, CtaSlab, DotRow, EstateMatrix, Eyebrow, FaqSection, LiveBoard, MaterialBars,
  CATEGORY_LABEL, OperatorCard, RECOVERED_KG, RedundancyDemo, SectionHead, Steps, StrataBand, lede, onSlate, scrollToId, type BoardRow, type FaqItem,
} from "./_marketing";

const HERO_STOPS = [0.2, 0.46, 0.74];

export default function Home() {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash === "#check") window.setTimeout(() => scrollToId("check", "address-check"), 200);
  }, [hash]);

  return (
    <>
      <Hero />
      <CheckSection />
      <HowSection />
      <SegmentsSection />
      <ServicesSection />
      <WhySection />
      <NetworkSection />
      <PromiseSection />
      <CommunitySection />
      <RecyclingSection />
      <BusinessSection />
      <EstateSection />
      <OperatorSection />
      <CitiesSection />
      <TestimonialsSection />
      <FaqSection items={FAQS} index="16" title="Questions people in Uyo ask us" />
      <CtaSlab
        title="Your waste gets collected. We handle the rest."
        body="Check your address, pick a plan and Slate assigns a verified operator to your street. Most homes start within five days."
        secondary={{ label: "See pricing", to: "/pricing" }}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 1 · Hero                                                            */
/* ------------------------------------------------------------------ */

function Hero() {
  const [progress, setProgress] = useState(0.34);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const t = window.setInterval(() => setProgress((p) => (p >= 0.96 ? 0.12 : +(p + 0.07).toFixed(2))), 1600);
    return () => window.clearInterval(t);
  }, []);
  const mins = Math.max(1, Math.round((1 - progress) * 22));

  const rows: BoardRow[] = [
    { time: "07:42", place: "Ewet Housing Estate", sub: "Ufok Environmental · 186 homes", status: { label: "Collected", tone: "success" } },
    { time: "08:12", place: "Shelter Afrique Estate", sub: `Ufok Environmental · ${mins} min to Block D`, status: { label: "On the way", tone: "signal" } },
    { time: "09:00", place: "Afang House, Aka Road", sub: "Atlantic Coast · food waste", status: { label: "Scheduled", tone: "info" } },
    { time: "10:30", place: "Ikpa Hills University", sub: "Ibom Hauliers · 7 facilities", status: { label: "Scheduled", tone: "info" } },
  ];

  return (
    <section className="relative isolate overflow-hidden bg-slate text-slate-ink chalk-grain">
      <StrataBand live seed={4} liveIndex={2} className="h-44 sm:h-52 lg:h-64" />
      <div className="container-page grid grid-cols-1 gap-12 pb-28 pt-28 sm:pt-32 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-center lg:gap-14 lg:pb-64 lg:pt-36">
        <div className="flex min-w-0 flex-col gap-7">
          <p className="flex items-center gap-2.5 t-small font-medium text-slate-ink/80">
            <LiveDot />
            Managed waste collection · live in Uyo
          </p>
          <h1 className="t-display-xl">
            Your waste gets collected.
            <span className="block text-slate-ink/45">We handle the rest.</span>
          </h1>
          <p className={cn(lede, "max-w-[34rem] text-slate-ink/80")}>
            Slate sources, verifies and contracts Uyo's waste operators, then gives your home, estate or business one reliable service — one payment and one number to call.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/signup" variant="signal" size="lg" trailing={<ArrowRight className="size-4" />}>
              Get started
            </ButtonLink>
            <button type="button" className={onSlate.ghost} onClick={() => scrollToId("check", "address-check")}>
              Check your address
            </button>
          </div>
          <DotRow className="mt-3" items={["One company", "One payment", "One support channel", "One service standard"]} />
        </div>

        <div className="relative min-w-0 lg:pl-4">
          <div className="relative overflow-hidden rounded-[24px] bg-slate-950/35 ring-1 ring-white/10">
            <RouteMap progress={progress} stops={HERO_STOPS} className="aspect-[4/3] w-full opacity-95 sm:aspect-[16/10] lg:aspect-[5/4]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-5">
              <div className="rounded-md bg-slate-950/55 px-3 py-2 backdrop-blur">
                <p className="text-[12px] font-medium text-slate-ink/70">Uyo · Mon 5 Oct · 08:12</p>
                <p className="font-display text-[22px] font-bold leading-tight tracking-[-0.02em] tnum">412 pickups today</p>
              </div>
            </div>
          </div>
          <LiveBoard rows={rows} title="Today's collections" meta="Live" className="relative -mt-16 ml-3 mr-3 sm:-mt-24 sm:ml-10 sm:mr-0 lg:-ml-14 lg:mr-6" />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 2 · Address checker                                                 */
/* ------------------------------------------------------------------ */

function CheckSection() {
  return (
    <section id="check" className="container-page scroll-mt-20 py-20 lg:py-28">
      <div className="flex flex-col gap-12">
        <SectionHead
          index="02"
          eyebrow="Service availability"
          title="Is Slate on your street?"
          body="Type your street or estate. If we're there, you'll see your collection days and the window your bin is picked up."
        />
        <AddressChecker inputId="address-check" />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3 · How Slate works                                                 */
/* ------------------------------------------------------------------ */

function HowSection() {
  return (
    <section className="border-y border-line bg-surface py-20 lg:py-28">
      <div className="container-page flex flex-col gap-14">
        <SectionHead
          index="03"
          eyebrow="How Slate works"
          title="You tell Slate what you need. Slate does the managing."
          action={<ArrowLink to="/how-it-works">The full picture</ArrowLink>}
        />
        <Steps
          items={[
            { title: "Tell Slate what you need", body: "Your address, the size of your home or site, and how often. Pay once a month, or split it with Smart Sweep." },
            { title: "Slate assigns a verified operator", body: "A contracted Uyo operator with checked permits, vehicles and drivers — held to Slate's service standard." },
            { title: "Collected on schedule", body: "Fixed days, a fixed window and an SMS when the truck is close. Every pickup is logged in your app." },
            { title: "Slate handles the rest", body: "Missed pickups, complaints, payments and operator changes go through Slate. You never chase a driver." },
          ]}
        />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 4 · Customer types                                                  */
/* ------------------------------------------------------------------ */

const SEGMENTS = [
  {
    id: "home",
    label: "Households",
    icon: HomeIcon,
    line: "Your waste gets collected. We handle the rest.",
    body: "Twice-weekly collection for your home, a Slate bin, SMS reminders and a crew within 24 hours if a pickup is ever missed.",
    points: ["Fixed days and a two-hour window", "Pay monthly, or in smaller Smart Sweep charges", "Report a problem once — Slate follows it up"],
    price: "From ₦4,500/month",
    to: "/services/households",
    cta: "Household plans",
  },
  {
    id: "estate",
    label: "Estates",
    icon: Building2,
    line: "One waste-management partner for your entire estate.",
    body: "Slate collects from every home, collects every resident's payment and sends the estate one report each month.",
    points: ["Stop chasing residents for payment", "One schedule for every street", "If an operator fails, Slate replaces them"],
    price: "₦6,500 per household/month",
    to: "/for-estates",
    cta: "Slate for estates",
  },
  {
    id: "business",
    label: "Businesses",
    icon: Store,
    line: "Reliable commercial waste collection without managing contractors yourself.",
    body: "Restaurants, shops, hotels and offices get collection at the frequency they need — up to twice a day — on one invoice.",
    points: ["Custom frequency, including late-night food waste", "All branches on one contract", "Monthly service report for each site"],
    price: "From ₦30,000/month",
    to: "/for-businesses",
    cta: "Slate for businesses",
  },
  {
    id: "institution",
    label: "Institutions",
    icon: Landmark,
    line: "Procurement-ready waste service for schools, hospitals and agencies.",
    body: "Facility-level schedules, compliance documents on file and a contract your procurement team can sign.",
    points: ["Schedules per facility and department", "Permits, insurance and disposal certificates", "Quarterly performance review"],
    price: "Quoted after a facility survey",
    to: "/for-institutions",
    cta: "Slate for institutions",
  },
] as const;

function SegmentsSection() {
  const [active, setActive] = useState<(typeof SEGMENTS)[number]["id"]>("home");
  const seg = SEGMENTS.find((s) => s.id === active)!;
  return (
    <section className="container-page py-20 lg:py-28">
      <div className="flex flex-col gap-12">
        <SectionHead index="04" eyebrow="Who Slate serves" title="One service, shaped to who you are." />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
          <div role="tablist" aria-label="Customer type" className="flex flex-col border-t border-line">
            {SEGMENTS.map((s, i) => {
              const on = s.id === active;
              return (
                <button
                  key={s.id}
                  role="tab"
                  type="button"
                  id={`seg-${s.id}`}
                  aria-selected={on}
                  aria-controls="seg-panel"
                  onClick={() => setActive(s.id)}
                  className={cn("group flex items-center gap-4 border-b border-line py-4 text-left transition-colors sm:py-5", on ? "text-ink" : "text-ink-3 hover:text-ink")}
                >
                  <span className="t-mono w-6 shrink-0 !text-[12px]">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-display text-[30px] font-bold leading-none tracking-[-0.03em] sm:text-[40px]">{s.label}</span>
                  <ArrowRight className={cn("ml-auto size-5 shrink-0 transition-all", on ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-60")} />
                </button>
              );
            })}
          </div>
          <div id="seg-panel" role="tabpanel" aria-labelledby={`seg-${seg.id}`} key={seg.id} className="animate-pop-in flex flex-col gap-6 rounded-[24px] border border-line bg-surface p-6 sm:p-10">
            <div className="flex items-center gap-3 text-ink-2">
              <seg.icon className="size-5" strokeWidth={1.75} />
              <span className="t-small font-medium">{seg.label}</span>
            </div>
            <p className="t-h1 text-ink">{seg.line}</p>
            <p className="t-body text-ink-2">{seg.body}</p>
            <CheckList items={[...seg.points]} />
            <div className="mt-auto flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-display text-[22px] font-semibold tracking-[-0.015em] text-ink tnum">{seg.price}</p>
              <ButtonLink to={seg.to} variant="primary" trailing={<ArrowRight className="size-4" />}>
                {seg.cta}
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 5 · Services                                                        */
/* ------------------------------------------------------------------ */

const DETAIL: Record<string, string> = {
  "Household Waste": "/services/households",
  "Commercial Waste": "/services/businesses",
  "Estate Waste Management": "/services/estates",
  "Institutional Waste": "/services/institutions",
  "Bulk Waste": "/services/bulk-waste",
  Recycling: "/services/recycling",
};

function ServicesSection() {
  const byCategory = services.filter((s, i, all) => all.findIndex((x) => x.category === s.category) === i);
  return (
    <section className="container-page pb-20 lg:pb-28">
      <div className="flex flex-col gap-10">
        <SectionHead index="05" eyebrow="Services" title="Everything that leaves your gate." action={<ArrowLink to="/services">All services</ArrowLink>} />
        <ul className="border-t border-line">
          {byCategory.map((s, i) => (
            <li key={s.id}>
              <Link
                to={DETAIL[s.category] ?? "/services"}
                className="group grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-line py-5 transition-colors hover:bg-surface sm:grid-cols-[40px_minmax(0,1.1fr)_minmax(0,1.4fr)_150px_24px] sm:gap-x-6 sm:px-3"
              >
                <span className="t-mono !text-[12px] text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex items-center gap-2.5">
                  <span className="t-h2 text-ink">{CATEGORY_LABEL[s.category] ?? s.category}</span>
                  {s.availability !== "Available" && <Badge tone="warning">{s.availability}</Badge>}
                </span>
                <span className="col-start-2 row-start-2 t-small text-ink-2 sm:col-start-auto sm:row-start-auto sm:t-body">{s.short}</span>
                <span className="col-start-3 row-span-2 row-start-1 text-right t-small font-medium text-ink tnum sm:col-start-auto sm:row-span-1 sm:row-start-auto sm:t-body">
                  <span className="block t-micro font-normal text-ink-3">from</span>
                  {formatNaira(s.priceFrom)}
                  <span className="text-ink-3">{s.priceUnit.replace("/household/month", "/home")}</span>
                </span>
                <ArrowUpRight className="hidden size-5 text-ink-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink sm:block" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 6 · Why Slate                                                       */
/* ------------------------------------------------------------------ */

function WhySection() {
  const ones = [
    ["One company.", "Slate is responsible for your service, whichever operator's truck turns up. No more three collectors and no receipts."],
    ["One payment.", "A single monthly charge — card, transfer or Smart Sweep. Slate pays the operator only for verified pickups."],
    ["One support channel.", "Call, WhatsApp or report in the app. Slate owns the problem until it's fixed, not the driver."],
    ["One service standard.", "Every operator signs the same SLA: pickup windows, missed-collection limits and response times."],
  ];
  return (
    <section className="border-t border-line py-20 lg:py-28">
      <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <div className="flex flex-col gap-5 lg:sticky lg:top-28 lg:self-start">
          <Eyebrow index="06">Why Slate</Eyebrow>
          <h2 className="t-display text-ink">We manage the waste service. You don't have to.</h2>
          <p className={cn(lede, "text-ink-2")}>Slate sells reliability, not a list of collectors. The operator does the lifting; Slate does everything that makes it dependable.</p>
        </div>
        <ol className="flex flex-col">
          {ones.map(([title, body]) => (
            <li key={title} className="grid grid-cols-1 gap-3 border-t border-line py-8 first:border-t-0 first:pt-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-8">
              <p className="font-display text-[34px] font-bold leading-[1] tracking-[-0.03em] text-ink sm:text-[44px]">{title}</p>
              <p className="t-body text-ink-2 sm:pt-2">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 7 · Operator network (redundancy)                                   */
/* ------------------------------------------------------------------ */

function NetworkSection() {
  return (
    <section className="relative isolate overflow-hidden bg-slate py-20 text-slate-ink chalk-grain lg:py-28">
      <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16">
        <div className="flex flex-col gap-6">
          <Eyebrow index="07" tone="light">
            The operator network
          </Eyebrow>
          <h2 className="t-display">If Operator A misses, Slate moves you to Operator B.</h2>
          <p className={cn(lede, "text-slate-ink/80")}>
            Every Slate zone has a primary operator and crews on standby. When a truck breaks down or a crew doesn't turn up, Slate reassigns the job — you don't make a single call.
          </p>
          <CheckList
            tone="light"
            items={[
              "Four contracted operators in Uyo, 25 trucks between them",
              "Standby crews in neighbouring zones every collection day",
              "Operators who keep missing are warned, penalised, then replaced",
            ]}
          />
        </div>
        <RedundancyDemo />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 8 · Reliability promise                                             */
/* ------------------------------------------------------------------ */

function PromiseSection() {
  return (
    <section className="container-page py-20 lg:py-28">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <div className="flex flex-col gap-6">
          <Eyebrow index="08">The reliability promise</Eyebrow>
          <p aria-hidden className="font-display font-bold leading-[0.8] tracking-[-0.06em] text-ink" style={{ fontSize: "clamp(140px, 24vw, 280px)", fontVariationSettings: '"opsz" 96, "wdth" 80' }}>
            24<span className="text-ink-3">h</span>
          </p>
          <h2 className="t-h1 max-w-md text-ink">A missed pickup is recovered within 24 hours. That's the promise.</h2>
          <p className="t-body max-w-md text-ink-2">
            If we can't recover it in 24 hours, that collection is credited on your next bill — automatically. In September, Slate recovered all 34 missed pickups in Uyo, on average in 5 hours 12 minutes.
          </p>
        </div>
        <div className="flex flex-col gap-6 lg:pt-16">
          <div className="rounded-[24px] border border-line bg-surface p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-3">
              <p className="t-small font-semibold text-ink">Missed pickup, recovered</p>
              <span className="t-mono !text-[12px] text-ink-3">CMP-1182</span>
            </div>
            <Timeline
              items={[
                { title: "Pickup window closes", time: "Thu 09:00", description: "No truck at 22 Osongama Estate Phase 2.", state: "failed" },
                { title: "You report it in the app", time: "09:12", description: "One tap: “Report missed pickup”. No phone calls.", state: "done" },
                { title: "Slate reassigns the job", time: "09:19", description: "Ibom Hauliers is sent from Abak Road.", state: "done" },
                { title: "Collected", time: "13:46", description: "4 hours 34 minutes after the window closed.", state: "done" },
                { title: "Operator penalised", time: "Fri", description: "The missed pickup counts against the operator's SLA, not your bill.", state: "upcoming" },
              ]}
            />
          </div>
          <ArrowLink to="/how-it-works">What happens when an operator fails</ArrowLink>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 9 · Community waste projects                                        */
/* ------------------------------------------------------------------ */

function CommunitySection() {
  const projects = communityProjects.slice(0, 3);
  return (
    <section className="border-y border-line bg-surface py-20 lg:py-28">
      <div className="container-page flex flex-col gap-12">
        <SectionHead
          index="09"
          eyebrow="Community waste projects"
          title="A flooded drain is everyone's problem. Now it's fundable."
          body="Neighbours chip in from ₦500 for drainage clearing, sanitation crews and recycling stations. Money is held until the target is met, then released to a verified crew when the work is checked."
        />
        <ul className="grid grid-cols-1 gap-x-10 gap-y-0 lg:grid-cols-3">
          {projects.map((p) => {
            const pct = Math.round((p.raised / p.target) * 100);
            return (
              <li key={p.id} className="flex flex-col gap-4 border-t border-line py-7">
                <div className="flex items-center justify-between gap-3">
                  <span className="t-small text-ink-3">{p.community}</span>
                  <StatusBadge status={p.status} />
                </div>
                <p className="t-h2 text-ink">{p.title}</p>
                <p className="t-small text-ink-2">{p.description.match(/^[^.]+\./)?.[0]}</p>
                <div className="mt-auto flex flex-col gap-2 pt-2">
                  <ProgressBar value={p.raised} max={p.target} tone={p.status === "Funded" ? "success" : "slate"} label={`${pct}% funded`} />
                  <p className="t-small text-ink-2 tnum">
                    <span className="font-semibold text-ink">{formatNaira(p.raised)}</span> of {formatNaira(p.target)} · {p.contributors} neighbours
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="t-small text-ink-3">Crews are paid by Slate only after the work is verified on site.</p>
          <ArrowLink to="/signup">Start or support a project</ArrowLink>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 10 · Recycling                                                      */
/* ------------------------------------------------------------------ */

function RecyclingSection() {
  return (
    <section className="container-page py-20 lg:py-28">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
        <div className="flex flex-col gap-6">
          <Eyebrow index="10">Recycling</Eyebrow>
          <h2 className="t-display text-ink">Sorted at your gate. Weighed at the partner.</h2>
          <p className={cn(lede, "text-ink-2")}>
            Add a monthly recyclables pickup for ₦1,500. Slate routes plastics, metal, paper, e-waste and organic waste to approved recovery partners in Uyo and tells you what was recovered — in kilograms.
          </p>
          <ArrowLink to="/services/recycling">How recycling works</ArrowLink>
        </div>
        <div className="flex flex-col gap-6 rounded-[24px] border border-line bg-surface p-6 sm:p-8">
          <div className="flex items-end justify-between gap-4 border-b border-line pb-5">
            <div>
              <p className="t-micro text-ink-3">Recovered since April</p>
              <p className="font-display text-[44px] font-bold leading-none tracking-[-0.03em] text-ink tnum">
                {formatNumber(RECOVERED_KG)}
                <span className="ml-1 text-[22px] text-ink-3">kg</span>
              </p>
            </div>
            <span className="t-small text-ink-3">5 recovery partners</span>
          </div>
          <MaterialBars />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 11 · Business                                                       */
/* ------------------------------------------------------------------ */

function BusinessSection() {
  return (
    <section className="border-t border-line bg-sunken/50 py-20 lg:py-28">
      <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
        <div className="flex flex-col gap-6">
          <Eyebrow index="11">For businesses</Eyebrow>
          <h2 className="t-display text-ink">12 branches. One contract, one invoice, one number to call.</h2>
          <p className={cn(lede, "text-ink-2")}>Reliable commercial waste collection without managing waste contractors yourself. Restaurants from ₦30,000 a month, with frequencies up to twice daily.</p>
          <CheckList items={["Late-night food-waste runs for kitchens", "A service report for every site, every month", "Add or close a branch from your dashboard"]} />
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <ButtonLink to="/for-businesses" variant="primary" size="lg" trailing={<ArrowRight className="size-4" />}>
              Slate for businesses
            </ButtonLink>
            <ButtonLink to="/services/businesses" variant="ghost" size="lg">
              Commercial collection
            </ButtonLink>
          </div>
        </div>
        <BranchInvoice className="!shadow-none lg:ml-8" />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 12 · Estates                                                        */
/* ------------------------------------------------------------------ */

function EstateSection() {
  return (
    <section className="container-page py-20 lg:py-28">
      <div className="relative isolate overflow-hidden rounded-[24px] bg-slate text-slate-ink chalk-grain">
        <div className="grid grid-cols-1 gap-10 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-14 lg:p-16">
          <div className="flex flex-col gap-6">
            <Eyebrow index="12" tone="light">
              For estates
            </Eyebrow>
            <h2 className="t-display">One waste-management partner for your entire estate.</h2>
            <p className={cn(lede, "text-slate-ink/80")}>
              Slate collects from every home and collects every resident's payment. You stop chasing households, and get one report on the first of the month.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/for-estates" className={onSlate.light}>
                Slate for estates <ArrowRight className="size-4" />
              </Link>
              <Link to="/services/estates" className={onSlate.ghost}>
                Estate pricing
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-5 rounded-[16px] bg-slate-950/30 p-5 ring-1 ring-white/10 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="text-[14px] font-semibold">Shelter Afrique Estate · October</p>
              <span className="t-mono !text-[12px] text-slate-ink/70">EA-UYO-004</span>
            </div>
            <EstateMatrix />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 13 · Operators                                                      */
/* ------------------------------------------------------------------ */

function OperatorSection() {
  return (
    <section className="border-t border-line py-20 lg:py-28">
      <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
        <OperatorCard className="order-2 lg:order-1" />
        <div className="order-1 flex flex-col gap-6 lg:order-2">
          <Eyebrow index="13">For waste companies</Eyebrow>
          <h2 className="t-display text-ink">You focus on collecting waste. We bring you customers and manage the relationship.</h2>
          <p className={cn(lede, "text-ink-2")}>Predictable contracts, payment for every verified pickup on the 5th of the month, and routes dense enough to keep your trucks full.</p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <ButtonLink to="/for-waste-companies" variant="primary" size="lg" trailing={<ArrowRight className="size-4" />}>
              Join the operator network
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 14 · Cities                                                         */
/* ------------------------------------------------------------------ */

function CitiesSection() {
  const order = ["uyo", "port-harcourt", "eket", "lagos", "abuja"];
  const list = order.map((id) => cities.find((c) => c.id === id)!).filter(Boolean);
  const when = (c: (typeof cities)[number]) =>
    c.status === "Live" ? "Since Apr 2026" : /Q\d/.test(c.launch) ? c.launch.replace(/(\d{4})-(Q\d)/, "$2 $1") : new Date(c.launch).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  return (
    <section className="bg-sunken/50 py-20 lg:py-28">
      <div className="container-page flex flex-col gap-12">
        <SectionHead
          index="14"
          eyebrow="Cities"
          title="Uyo first. Then the next city, done properly."
          body="We launch a city only when its operators are verified and contracted. Port Harcourt is next."
          action={<ArrowLink to="/cities">All cities</ArrowLink>}
        />
        <div className="overflow-hidden rounded-[16px] bg-slate text-slate-ink chalk-grain">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-white/10 px-5 py-3 text-[12px] font-medium text-slate-ink/65 sm:grid-cols-[minmax(0,1.3fr)_140px_140px_minmax(0,1fr)_20px] sm:px-8">
            <span>City</span>
            <span className="hidden sm:block">Status</span>
            <span className="text-right sm:text-left">When</span>
            <span className="hidden sm:block">Today</span>
          </div>
          <ul className="divide-y divide-white/10">
            {list.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/cities/${c.id}`}
                  className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-5 py-5 transition-colors hover:bg-white/[0.04] sm:grid-cols-[minmax(0,1.3fr)_140px_140px_minmax(0,1fr)_20px] sm:px-8"
                >
                  <span className="flex items-baseline gap-3">
                    <span className="font-display text-[28px] font-bold leading-none tracking-[-0.025em] sm:text-[34px]">{c.name}</span>
                    <span className="t-small text-slate-ink/60">{c.state}</span>
                  </span>
                  <span className="col-start-1 row-start-2 sm:col-start-auto sm:row-start-auto">
                    {c.status === "Live" ? (
                      <span className="inline-flex h-6 items-center gap-1.5 rounded-sm bg-signal px-2 text-[12px] font-semibold text-signal-ink">
                        <LiveDot className="size-2 [&>span]:size-2 [&>span]:bg-signal-ink" /> Live
                      </span>
                    ) : (
                      <Badge tone={c.status === "Launching" ? "info" : "neutral"}>{c.status}</Badge>
                    )}
                  </span>
                  <span className="t-mono text-right text-slate-ink/85 sm:text-left">{when(c)}</span>
                  <span className="col-span-2 t-small text-slate-ink/70 sm:col-span-1">
                    {c.status === "Live" ? `${formatNumber(c.customers)} customers · ${c.operators} operators · ${c.completion}% on time` : c.operators ? `${c.operators} operator in verification` : "Operator sourcing begins"}
                  </span>
                  <ArrowRight className="hidden size-4 text-slate-ink/50 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-ink sm:block" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 15 · Testimonials                                                   */
/* ------------------------------------------------------------------ */

const QUOTES = [
  {
    q: "We used to have three collectors and no receipts. Now 312 homes are on one agreement, residents pay Slate directly, and I get one report on the first of the month.",
    name: "Uduak Essien",
    role: "Estate manager, Shelter Afrique Estate",
  },
  {
    q: "When Ufok missed a Thursday, I didn't call anybody. Another truck was at my gate before lunch.",
    name: "Imaobong Akpan",
    role: "Slate Home, Ewet Housing Estate",
  },
  {
    q: "Food waste has to leave every night. The truck comes at 22:30, and if there's a problem I call one number, not a driver.",
    name: "Mfon Bassey",
    role: "Owner, Afang House Restaurant · 3 branches",
  },
  {
    q: "Procurement asked for permits, insurance and disposal certificates. Slate sent everything in one pack the same week.",
    name: "Dr. Nsikak Okon",
    role: "Director of Facilities, Ikpa Hills University",
  },
];

function TestimonialsSection() {
  const [lead, ...rest] = QUOTES;
  return (
    <section className="container-page py-20 lg:py-28">
      <div className="flex flex-col gap-12">
        <Eyebrow index="15">From Uyo</Eyebrow>
        <figure className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <blockquote className="font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[40px]">“{lead!.q}”</blockquote>
          <figcaption className="flex items-center gap-4 border-t border-line pt-6 lg:border-0 lg:pt-0">
            <Avatar name={lead!.name} size="lg" />
            <div>
              <p className="t-body font-semibold text-ink">{lead!.name}</p>
              <p className="t-small text-ink-2">{lead!.role}</p>
            </div>
          </figcaption>
        </figure>
        <div className="grid grid-cols-1 gap-x-10 md:grid-cols-3">
          {rest.map((t) => (
            <figure key={t.name} className="flex flex-col justify-between gap-6 border-t border-line py-7">
              <blockquote className="t-body text-[16px] text-ink">“{t.q}”</blockquote>
              <figcaption className="flex items-center gap-3">
                <Avatar name={t.name} size="sm" />
                <div className="min-w-0">
                  <p className="t-small font-semibold text-ink">{t.name}</p>
                  <p className="t-small truncate text-ink-3">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 16 · FAQ                                                            */
/* ------------------------------------------------------------------ */

const FAQS: FaqItem[] = [
  {
    q: "Who actually collects my waste?",
    a: "A verified Uyo operator under contract to Slate — for example Ufok Environmental in Ewet Housing Estate. Slate checks their registration, permits, vehicles, drivers and disposal arrangements, and holds them to a written service standard.",
  },
  {
    q: "What happens if a pickup is missed?",
    a: "Report it in the app, by WhatsApp or by phone. Slate sends the operator back or reassigns the job to a standby crew. Missed pickups are recovered within 24 hours, or that collection is credited on your next bill.",
  },
  {
    q: "How much does it cost?",
    a: "Slate Home is ₦7,000 a month for two collections a week; Slate Home Lite is ₦4,500 for one. Estates pay ₦6,500 per household. Businesses start at ₦30,000 a month. Bulk pickups are quoted from photos, from ₦15,000.",
  },
  {
    q: "Can I pay in smaller amounts?",
    a: "Yes. Smart Sweep splits your monthly bill into smaller scheduled charges — you choose the maximum per charge and how often. If a charge fails, we retry up to three times, then pause and tell you.",
  },
  {
    q: "What if I'm not happy with the operator?",
    a: "Tell Slate, not the operator. Ratings and complaints feed each operator's SLA score. Operators who keep falling short are warned, penalised and, if needed, replaced — your service continues with another crew.",
  },
  {
    q: "Do you collect recyclables?",
    a: "Yes, as a ₦1,500 monthly add-on. Sorted plastics, cans, paper and e-waste go to approved recovery partners in Uyo, and you see the kilograms recovered in your app.",
  },
];
