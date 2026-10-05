import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";
import { Link } from "react-router";
import { CtaSlab, Eyebrow, FaqSection, RedundancyDemo, SectionHead, StrataBand, lede, type FaqItem } from "./_marketing";

/* The service loop: Customer → Slate → Operator → Collection → Slate → Customer */
const STATIONS = [
  {
    who: "You",
    title: "You tell Slate what you need",
    body: "Your address, the size of your home or site and how often you need collection. You choose a plan and pay Slate — one payment, by card, transfer or Smart Sweep.",
    see: "Plan, collection days and pickup window confirmed in the app.",
  },
  {
    who: "Slate",
    title: "Slate plans the service",
    body: "We match your address to its zone, add you to the zone's route, set your days and your two-hour window, and deliver a Slate bin if your plan includes one.",
    see: "“Your first collection is Thursday, 07:00–09:00.”",
  },
  {
    who: "Operator",
    title: "A contracted operator is assigned",
    body: "The zone's verified operator receives the job on their Slate dispatch screen, with your address, landmark and any access notes. They're bound by Slate's SLA.",
    see: "The operator's name and the truck's progress on collection day.",
  },
  {
    who: "Collection",
    title: "Collected and disposed of properly",
    body: "The crew collects in the window and logs the pickup with a timestamp and photo. Waste goes to an approved disposal site; recyclables go to a recovery partner.",
    see: "An SMS the moment your bin is emptied: “Collected 07:42.”",
  },
  {
    who: "Slate",
    title: "Slate checks the work",
    body: "Every pickup is verified against the route. Misses are recovered within 24 hours, complaints are handled by Slate, and the operator is paid only for verified pickups.",
    see: "Missed-pickup recovery tracked step by step, if it's ever needed.",
  },
  {
    who: "You",
    title: "You get one dependable service",
    body: "Receipts, collection history and ratings in one place, and one number to call. If the operator falls short, Slate replaces them — your service carries on.",
    see: "One company, one payment, one support channel.",
  },
];

export default function HowItWorks() {
  return (
    <>
      <Hero />
      <DirectorySection />
      <BehindSection />
      <ExceptionsSection />
      <PaymentSection />
      <FaqSection items={FAQS} index="05" />
      <CtaSlab
        title="Tell Slate what you need."
        body="We'll match your address to a zone, assign a contracted operator and confirm your collection days — usually within five working days."
        secondary={{ label: "Check your address", to: "/#check" }}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */

function Hero() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const timer = useRef<number>(0);
  useEffect(() => {
    if (!auto || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer.current = window.setInterval(() => setActive((a) => (a + 1) % STATIONS.length), 3800);
    return () => window.clearInterval(timer.current);
  }, [auto]);
  const s = STATIONS[active]!;

  return (
    <section className="relative isolate overflow-hidden bg-slate text-slate-ink chalk-grain">
      <StrataBand seed={8} className="h-40 lg:h-56" />
      <div className="container-page flex flex-col gap-14 pb-48 pt-10 sm:pt-14 lg:gap-20 lg:pb-60 lg:pt-20">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end lg:gap-16">
          <div className="flex flex-col gap-6">
            <Eyebrow tone="light">How it works</Eyebrow>
            <h1 className="t-display-xl">The managing is the service.</h1>
          </div>
          <p className={cn(lede, "text-slate-ink/80")}>
            Slate doesn't hand you a list of waste companies. We source them, verify them, contract them and manage them — and you get one reliable service from one company.
          </p>
        </div>

        {/* The line: six stations, like a timetable board */}
        <div className="flex flex-col gap-8">
          <ol className="relative grid grid-cols-1 gap-0 md:grid-cols-6" aria-label="How a Slate collection flows">
            <span aria-hidden className="absolute bottom-6 left-[21px] top-6 border-l border-dashed border-slate-ink/35 md:bottom-auto md:left-6 md:right-6 md:top-[21px] md:border-l-0 md:border-t" />
            {STATIONS.map((st, i) => {
              const on = i === active;
              const past = i < active;
              return (
                <li key={i} className="relative">
                  <button
                    type="button"
                    aria-current={on ? "step" : undefined}
                    onClick={() => {
                      setAuto(false);
                      setActive(i);
                    }}
                    className="group flex w-full items-center gap-4 py-2.5 text-left md:flex-col md:items-start md:gap-4 md:py-0"
                  >
                    <span
                      className={cn(
                        "relative z-10 flex size-11 shrink-0 items-center justify-center rounded-md border font-mono text-[13px] font-medium transition-colors",
                        on ? "border-signal bg-signal text-signal-ink" : past ? "border-slate-ink/60 bg-slate-ink text-slate-950" : "border-slate-ink/30 bg-slate text-slate-ink group-hover:border-slate-ink/60",
                      )}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex flex-col">
                      <span className={cn("font-display text-[22px] font-bold leading-none tracking-[-0.02em] transition-colors md:text-[24px]", on ? "text-slate-ink" : "text-slate-ink/60 group-hover:text-slate-ink")}>
                        {st.who}
                      </span>
                      <span className={cn("mt-1 text-[13px] md:max-w-[12rem]", on ? "text-slate-ink/80" : "text-slate-ink/60")}>{st.title}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div key={active} className="animate-pop-in grid grid-cols-1 gap-6 rounded-[16px] bg-slate-950/30 p-5 ring-1 ring-white/10 sm:p-7 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:gap-10" aria-live="polite">
            <div className="flex flex-col gap-2">
              <p className="t-micro text-slate-ink/65">
                Step {active + 1} of {STATIONS.length} · {s.who}
              </p>
              <p className="t-h1">{s.title}</p>
              <p className="t-body text-slate-ink/80">{s.body}</p>
            </div>
            <div className="flex flex-col justify-between gap-4 border-t border-white/10 pt-5 md:border-l md:border-t-0 md:pl-8 md:pt-0">
              <div>
                <p className="t-micro text-slate-ink/65">What you see</p>
                <p className="mt-1 t-body font-medium text-slate-ink">{s.see}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setAuto(false); setActive((a) => (a + STATIONS.length - 1) % STATIONS.length); }} className="inline-flex h-10 items-center rounded-md border border-slate-ink/25 px-3.5 text-[14px] font-medium text-slate-ink hover:bg-white/5">
                  Previous
                </button>
                <button type="button" onClick={() => { setAuto(false); setActive((a) => (a + 1) % STATIONS.length); }} className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-ink px-3.5 text-[14px] font-semibold text-slate-950 hover:bg-white">
                  Next step <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function DirectorySection() {
  const directory = [
    "You compare companies you've never heard of",
    "You negotiate price and frequency yourself",
    "You pay the driver, often in cash, often without a receipt",
    "When they miss, you call — and call again",
    "If they disappear, you start from scratch",
  ];
  const managed = [
    "Slate has already verified and contracted the operator",
    "One published price and a written service standard",
    "One payment to Slate, with a receipt every time",
    "Missed pickups recovered within 24 hours",
    "If an operator fails, Slate moves you to another",
  ];
  return (
    <section className="container-page py-20 lg:py-28">
      <div className="flex flex-col gap-12">
        <SectionHead index="01" eyebrow="Directory or managed service" title="Two ways to get your waste collected." body="Most apps stop at the introduction. Slate starts there." />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-6 rounded-[24px] border border-dashed border-line-strong p-6 sm:p-10">
            <p className="t-micro text-ink-3">A directory</p>
            <p className="font-display text-[28px] font-bold leading-[1.1] tracking-[-0.02em] text-ink-2 sm:text-[36px]">“Here are five waste companies. Choose one.”</p>
            <ul className="flex flex-col gap-3 border-t border-line pt-6">
              {directory.map((d) => (
                <li key={d} className="flex items-start gap-3 t-body text-ink-2">
                  <X className="mt-[5px] size-4 shrink-0 text-ink-3" strokeWidth={2.25} />
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-6 rounded-[24px] bg-slate p-6 text-slate-ink chalk-grain sm:p-10">
            <p className="t-micro text-slate-ink/70">Slate, a managed service</p>
            <p className="font-display text-[28px] font-bold leading-[1.1] tracking-[-0.02em] sm:text-[36px]">“Tell Slate what you need.”</p>
            <ul className="flex flex-col gap-3 border-t border-white/15 pt-6">
              {managed.map((d) => (
                <li key={d} className="flex items-start gap-3 t-body text-slate-ink/90">
                  <Check className="mt-[5px] size-4 shrink-0" strokeWidth={2.25} />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

const LIFECYCLE = [
  {
    title: "Sourcing",
    body: "We map every licensed waste company in a city, then visit yards, ride along on routes and speak to their existing customers before inviting them to apply.",
    fact: "31 Uyo companies assessed, 9 invited, 4 contracted.",
  },
  {
    title: "Verification",
    body: "Registration documents, state environmental permits, vehicle papers and roadworthiness, driver licences, insurance where applicable and proof of approved disposal arrangements.",
    fact: "Documents re-checked before they expire, not after.",
  },
  {
    title: "Contracts with SLAs",
    body: "Each operator signs a contract that fixes collection frequency, pickup windows, the maximum number of missed collections, complaint response times and penalties.",
    fact: "Contract CT-UYO-011: 98% completion, 4-hour response.",
  },
  {
    title: "Assignment",
    body: "Customers are assigned by zone and capacity, so routes are dense and trucks run full. A standby operator is named for every zone.",
    fact: "Primary and standby operator for each of 9 Uyo zones.",
  },
  {
    title: "Monitoring",
    body: "Every pickup is logged with a time and photo. Slate's control room watches routes live, and customer ratings feed each operator's monthly SLA score.",
    fact: "96.8% of Uyo pickups on time in September.",
  },
  {
    title: "Exceptions",
    body: "When something goes wrong, Slate acts — from a same-day call to the dispatcher to moving a whole zone to another operator.",
    fact: "Escalation ladder below.",
  },
  {
    title: "Payment",
    body: "Customers pay Slate. Slate pays operators on the 5th of each month for verified pickups, less any SLA penalties. Nobody pays a driver at the gate.",
    fact: "₦21.6m paid to Uyo operators for September.",
  },
];

function BehindSection() {
  return (
    <section className="border-y border-line bg-surface py-20 lg:py-28">
      <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-16">
        <div className="flex flex-col gap-5 lg:sticky lg:top-28 lg:self-start">
          <Eyebrow index="02">Behind every pickup</Eyebrow>
          <h2 className="t-display text-ink">How Slate manages the operators.</h2>
          <p className={cn(lede, "text-ink-2")}>Seven things happen before and after a truck reaches your gate. You only ever see the last one.</p>
          <ButtonLink to="/for-waste-companies" variant="secondary" className="w-fit" trailing={<ArrowRight className="size-4" />}>
            For waste companies
          </ButtonLink>
        </div>
        <ol className="flex flex-col">
          {LIFECYCLE.map((l, i) => (
            <li key={l.title} className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-4 border-t border-line py-7 first:border-t-0 first:pt-0 sm:grid-cols-[56px_minmax(0,1fr)]">
              <span className="t-mono pt-1.5 text-ink-3">{String(i + 1).padStart(2, "0")}</span>
              <div className="flex flex-col gap-2">
                <h3 className="t-h1 text-ink">{l.title}</h3>
                <p className="t-body text-ink-2">{l.body}</p>
                <p className="mt-1 t-small font-medium text-ink">{l.fact}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

const LADDER = [
  { step: "Warning", when: "A pickup misses its window", what: "Slate calls the dispatcher within minutes and logs a warning against the operator." },
  { step: "Penalty", when: "Missed collections pass the SLA limit", what: "A penalty is deducted from that month's payout. The operator's SLA score drops." },
  { step: "Reassign", when: "The crew can't recover in time", what: "The job moves to the zone's standby operator. You're collected the same day." },
  { step: "Activate another operator", when: "Breaches keep happening", what: "Slate moves the zone to another contracted operator and suspends the contract." },
];

function ExceptionsSection() {
  return (
    <section className="relative isolate overflow-hidden bg-slate py-20 text-slate-ink chalk-grain lg:py-28">
      <div className="container-page flex flex-col gap-14">
        <SectionHead
          tone="light"
          index="03"
          eyebrow="When something goes wrong"
          title="Warning, penalty, reassign, replace."
          body="Exceptions are where a directory leaves you on your own. At Slate they follow a written ladder, and you never have to climb it yourself."
        />
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <ol className="flex flex-col">
            {LADDER.map((l, i) => (
              <li key={l.step} className="relative flex gap-5 pb-8 last:pb-0">
                {i < LADDER.length - 1 && <span aria-hidden className="absolute bottom-0 left-[21px] top-11 border-l border-dashed border-slate-ink/35" />}
                <span className="relative z-10 flex size-11 shrink-0 items-center justify-center rounded-md border border-slate-ink/30 bg-slate font-mono text-[13px] font-medium">{String(i + 1).padStart(2, "0")}</span>
                <div className="flex flex-col gap-1 pt-1">
                  <p className="t-h2">{l.step}</p>
                  <p className="t-small font-medium text-slate-ink/70">{l.when}</p>
                  <p className="t-body text-slate-ink/85">{l.what}</p>
                </div>
              </li>
            ))}
          </ol>
          <RedundancyDemo />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function PaymentSection() {
  const split = [
    { label: "Operator, for verified pickups", value: 5180, cls: "bg-slate dark:bg-slate-300" },
    { label: "Slate — management, support, recovery", value: 1470, cls: "bg-slate-400 dark:bg-slate-500" },
    { label: "Payment processing", value: 350, cls: "bg-line-strong" },
  ];
  const total = split.reduce((a, s) => a + s.value, 0);
  return (
    <section className="container-page py-20 lg:py-28">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
        <div className="flex flex-col gap-6">
          <Eyebrow index="04">Payment</Eyebrow>
          <h2 className="t-display text-ink">You pay Slate. Slate pays the operator — for work that was done.</h2>
          <p className={cn(lede, "text-ink-2")}>
            Your monthly payment is held by Slate, not handed to a driver. Operators are paid on the 5th for pickups Slate has verified, so being reliable is how they get paid.
          </p>
          <p className="t-body text-ink-2">
            Prefer smaller amounts? <Link to="/pricing" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">Smart Sweep</Link> splits the bill into scheduled charges you control.
          </p>
        </div>
        <div className="flex flex-col gap-6 rounded-[24px] border border-line bg-surface p-6 sm:p-8">
          <div className="flex items-baseline justify-between gap-4">
            <p className="t-small font-semibold text-ink">Where ₦7,000 goes</p>
            <span className="t-small text-ink-3">Slate Home, one month</span>
          </div>
          <div className="flex h-4 gap-1 overflow-hidden rounded-[4px]" role="img" aria-label={split.map((s) => `${s.label} ${formatNaira(s.value)}`).join(", ")}>
            {split.map((s) => (
              <span key={s.label} className={cn("h-full rounded-[3px]", s.cls)} style={{ width: `${(s.value / total) * 100}%` }} />
            ))}
          </div>
          <ul className="flex flex-col divide-y divide-line border-y border-line">
            {split.map((s) => (
              <li key={s.label} className="flex items-center justify-between gap-4 py-3.5">
                <span className="flex items-center gap-3 t-body text-ink">
                  <span className={cn("size-2.5 shrink-0 rounded-[2px]", s.cls)} />
                  {s.label}
                </span>
                <span className="t-mono text-ink">{formatNaira(s.value)}</span>
              </li>
            ))}
          </ul>
          <p className="t-small text-ink-3">Illustrative split for an Ewet Housing Estate home. Penalties for missed pickups come out of the operator's share, never your bill.</p>
        </div>
      </div>
    </section>
  );
}

const FAQS: FaqItem[] = [
  { q: "Do I ever deal with the operator directly?", a: "Only at your gate. Payments, complaints, schedule changes and missed pickups all go through Slate. The operator's crew collects; Slate manages everything around it." },
  { q: "How do you choose which operator serves me?", a: "By zone. Each Uyo zone has a primary contracted operator with capacity for its customers, and a standby operator from a neighbouring zone." },
  { q: "What does “verified” actually mean?", a: "We've checked the company's registration, state environmental permits, vehicle papers, driver licences, insurance where applicable and where their waste is disposed of — and we re-check before documents expire." },
  { q: "What if the operator damages my bin or is rude?", a: "Report it in the app or call Slate. Conduct and damage complaints are investigated by Slate, count against the operator's SLA score, and damaged Slate bins are replaced." },
  { q: "Where does my waste end up?", a: "At approved disposal sites named in each operator's contract. Sorted recyclables go to Slate's recovery partners in Uyo, and the kilograms recovered appear in your app." },
];
