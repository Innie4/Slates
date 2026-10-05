import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Check, FileSignature, Truck } from "lucide-react";
import { Badge, ButtonLink, LiveDot, Meter, Page, Sparkline, StatusBadge } from "@/components/ui";
import { cn } from "@/lib/cn";
import { DEMO_NOW, formatNaira, formatNairaShort, formatTime } from "@/lib/format";
import {
  BUDGET, complianceDocs, facilityById, institution, invoices, OPERATORS, RENEWAL, reportSeries, todaysPickups,
  type FacilityId, type InstPickup,
} from "./_data";
import { CampusMap, daysUntil, inDays, shortDate, type FacilityState } from "./_shared";

const START = 4.55; // compactor between the academic block and the senate building

/**
 * Institution overview. The first screen answers "is waste being collected
 * across campus today?" — live, on the campus plan. Then the decisions that
 * need the Director: the renewal, compliance, spend, and service levels.
 */
export default function Dashboard() {
  const [progress, setProgress] = useState(START);
  const [senate, setSenate] = useState<"En route" | "Arrived" | "Completed">("En route");

  // Demo: the compactor reaches the senate building, loads, and the stop is wiped clean.
  useEffect(() => {
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setProgress(4.8), 2400));
    timers.push(window.setTimeout(() => setProgress(5), 4600));
    timers.push(window.setTimeout(() => setSenate("Arrived"), 5800));
    timers.push(window.setTimeout(() => setSenate("Completed"), 10_500));
    return () => timers.forEach(clearTimeout);
  }, []);

  const today: InstPickup[] = useMemo(
    () =>
      todaysPickups.map((p) =>
        p.facilityId === "senate"
          ? { ...p, status: senate === "Completed" ? "Completed" : senate, completedAt: senate === "Completed" ? new Date(DEMO_NOW.getTime() + 4 * 60_000).toISOString() : undefined }
          : p,
      ),
    [senate],
  );

  const done = today.filter((p) => p.status === "Completed").length;
  const live = today.find((p) => p.status === "En route" || p.status === "Arrived");
  const next = today.find((p) => p.status === "Scheduled");

  const states: Partial<Record<FacilityId, FacilityState>> = {};
  const sublabels: Partial<Record<FacilityId, string>> = {};
  for (const p of today) {
    const cur = states[p.facilityId];
    const s: FacilityState = p.status === "Completed" ? "collected" : p.status === "Scheduled" ? "scheduled" : "live";
    // live beats scheduled beats collected — but a later scheduled run doesn't hide a morning collection
    if (s === "live" || !cur || (cur === "collected" && s === "scheduled" && p.facilityId !== "kitchen")) states[p.facilityId] = s;
    if (p.status === "Completed") sublabels[p.facilityId] = `✓ ${formatTime(p.completedAt!)}`;
    else if (!sublabels[p.facilityId] || p.facilityId !== "kitchen") sublabels[p.facilityId] = p.status === "Scheduled" ? p.window.slice(0, 5) : p.status === "Arrived" ? "loading" : "arriving";
  }

  return (
    <Page className="gap-8 md:gap-10">
      <div className="flex flex-col gap-1">
        <p className="t-small text-ink-3">{DEMO_NOW.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · first week of the {institution.session} session</p>
        <p className="t-body font-medium text-ink">{institution.name} · 7 facilities, 2 operators</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-10">
        {/* LEFT — today across campus */}
        <div className="flex min-w-0 flex-col gap-8 md:gap-10">
          <section aria-label="Today's collections across campus" className="relative isolate overflow-hidden rounded-xl bg-slate text-slate-ink chalk-grain">
            <div className="flex flex-col gap-3 p-5 pb-2 sm:p-8 sm:pb-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                {live ? (
                  <span className="inline-flex h-7 items-center gap-2 rounded-sm bg-signal px-2.5 text-[12px] font-semibold text-signal-ink">
                    <LiveDot className="[&>span]:bg-signal-ink" />
                    {live.status === "Arrived" ? "Loading at" : "Arriving at"} {facilityById(live.facilityId).name}
                  </span>
                ) : (
                  <Badge tone="success" icon={<Check strokeWidth={3} />}>Senate collected</Badge>
                )}
                <span className="t-small text-slate-ink/65">Ibom Hauliers · AKS 641 RB</span>
              </div>
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
                <h1 className="t-display tnum">
                  {done} of {today.length} <span className="text-slate-ink/55">collected</span>
                </h1>
              </div>
              <p className="t-body max-w-xl text-slate-ink/80">
                {live
                  ? <>The compactor is {live.status === "Arrived" ? "at" : "two minutes from"} the Senate building. </>
                  : <>Senate building cleared at {formatTime(new Date(DEMO_NOW.getTime() + 4 * 60_000))}. </>}
                {next && (
                  <>Next is the {facilityById(next.facilityId).short.toLowerCase()} at <span className="font-semibold text-slate-ink tnum">{next.window.slice(0, 5)}</span>, with Friday's missed lift added to the run.</>
                )}
              </p>
            </div>

            <div className="px-2 sm:px-5">
              <CampusMap tone="on-slate" states={states} sublabels={sublabels} route={progress} />
            </div>

            {/* the day as a strip of slabs */}
            <div className="flex flex-col gap-2 px-5 pb-5 pt-2 sm:px-8 sm:pb-7">
              <div className="flex gap-1" aria-hidden>
                {today.map((p) => (
                  <span
                    key={p.id}
                    className={cn(
                      "h-2 flex-1 rounded-[2px] transition-colors duration-500",
                      p.status === "Completed" && "bg-slate-ink/85",
                      (p.status === "En route" || p.status === "Arrived") && "bg-signal",
                      p.status === "Scheduled" && "bg-slate-ink/15",
                    )}
                  />
                ))}
              </div>
              <div className="flex justify-between t-micro text-slate-ink/60 tnum">
                <span>06:00</span>
                <span>Last lift 14:30</span>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-end justify-between gap-4">
              <h2 className="t-h2 text-ink">Today's timetable</h2>
              <Link to="/institution/pickups" className="t-small font-medium text-ink-2 hover:text-ink">All pickups</Link>
            </div>
            <ol className="divide-y divide-line border-y border-line">
              {today.map((p) => {
                const f = facilityById(p.facilityId);
                const isLive = p.status === "En route" || p.status === "Arrived";
                return (
                  <li key={p.id}>
                    <Link to={`/institution/pickups?pickup=${p.id}`} className="group -mx-2 grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-x-3 rounded-md px-2 py-3 transition-colors hover:bg-sunken/70 sm:grid-cols-[4rem_minmax(0,1fr)_10rem_6.5rem]">
                      <span className={cn("t-mono", isLive ? "font-semibold text-ink" : p.status === "Completed" ? "text-ink-3" : "text-ink")}>{p.window.slice(0, 5)}</span>
                      <span className="min-w-0">
                        <span className="block truncate t-body font-medium text-ink">{p.facilityId === "halls" || p.facilityId === "kitchen" ? p.label : f.name}</span>
                        <span className="block truncate t-small text-ink-3">{p.streams.join(", ")}<span className="sm:hidden"> · {OPERATORS[p.operator].short}</span></span>
                      </span>
                      <span className="hidden truncate t-small text-ink-2 sm:block">{OPERATORS[p.operator].short}</span>
                      <span className="justify-self-end">
                        {p.status === "Completed" ? (
                          <Badge tone="success" dot><span className="tnum">{formatTime(p.completedAt!)}</span></Badge>
                        ) : isLive ? (
                          <Badge tone="signal" dot>{p.status === "Arrived" ? "Loading" : "Arriving"}</Badge>
                        ) : (
                          <StatusBadge status="Scheduled" />
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        {/* RIGHT — decisions and standing */}
        <aside className="flex min-w-0 flex-col gap-8">
          <RenewalDecision />
          <ComplianceStanding />
          <SpendAgainstBudget />
          <ServiceLevels />
        </aside>
      </div>
    </Page>
  );
}

function RenewalDecision() {
  const due = daysUntil(RENEWAL.decisionDue);
  return (
    <section aria-label="Contract renewal decision" className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 t-micro font-semibold text-ink">
          <span className="size-2 rounded-full bg-signal" aria-hidden />
          Decision needed
        </span>
        <span className="t-mono text-ink-3">{RENEWAL.contract}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <h2 className="t-h2 text-ink">Renew the main contract by {shortDate(RENEWAL.decisionDue)}</h2>
        <p className="t-body text-ink-2">
          Service with Ibom Hauliers ends on <span className="font-medium text-ink">{shortDate(RENEWAL.expires)}</span>. Slate proposes 12 more months at{" "}
          <span className="font-medium text-ink tnum">{formatNaira(RENEWAL.proposedMonthly)}</span> a month, up 6.5%, with Saturday lifts at the medical campus.
        </p>
      </div>
      <ol className="grid grid-cols-3 gap-1.5" aria-label="Renewal steps">
        {["Review", "Approve", "Sign"].map((s, i) => (
          <li key={s} className="flex flex-col gap-1.5">
            <span className={cn("h-1 rounded-full", i === 0 ? "bg-signal" : "bg-line")} />
            <span className={cn("t-micro", i === 0 ? "font-semibold text-ink" : "text-ink-3")}>{s}</span>
          </li>
        ))}
      </ol>
      <p className="t-small text-ink-3">
        {due} days left. The tenders board sits on 22 Oct; budget approval is with the Bursary.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <ButtonLink to="/institution/contracts?contract=CT-UYO-014#renewal" leading={<FileSignature className="size-4" />}>
          Review proposal
        </ButtonLink>
        <ButtonLink to="/institution/procurement" variant="ghost">Procurement status</ButtonLink>
      </div>
    </section>
  );
}

function ComplianceStanding() {
  const verified = complianceDocs.filter((d) => d.status === "Verified").length;
  const attention = complianceDocs
    .filter((d) => d.status !== "Verified")
    .sort((a, b) => (a.status === "Expired" ? -1 : 0) - (b.status === "Expired" ? -1 : 0) || (a.expires ?? "9").localeCompare(b.expires ?? "9"))
    .slice(0, 3);
  const expiring = complianceDocs.filter((d) => d.status === "Expiring").length;
  return (
    <section className="flex flex-col gap-3 border-b border-line pb-8">
      <div className="flex items-center justify-between">
        <h2 className="t-h2 text-ink">Compliance</h2>
        <Link to="/institution/compliance" className="t-small font-medium text-ink-2 hover:text-ink">Register</Link>
      </div>
      <p className="t-body text-ink-2">
        <span className="font-medium text-ink">{verified} of {complianceDocs.length}</span> documents verified. {expiring} expire within 45 days, one has expired and one is waiting on the teaching clinic.
      </p>
      <ul className="divide-y divide-line">
        {attention.map((d) => {
          const n = d.expires ? daysUntil(d.expires) : null;
          return (
            <li key={d.id}>
              <Link to={`/institution/compliance?doc=${d.id}`} className="group -mx-2 flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-sunken/70">
                <span className="min-w-0 flex-1">
                  <span className="block truncate t-small font-medium text-ink">{d.name}</span>
                  <span className="block truncate t-micro text-ink-3">
                    {d.holder} · {d.status === "Pending" ? "due 15 Oct" : n !== null && n < 0 ? `expired ${shortDate(d.expires!)}` : `expires ${shortDate(d.expires!)}, ${inDays(n!)}`}
                  </span>
                </span>
                <StatusBadge status={d.status} />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SpendAgainstBudget() {
  const invoiced = invoices.reduce((a, i) => a + i.amount, 0);
  const outstanding = invoices.reduce((a, i) => a + (i.amount - i.paid), 0);
  const overdue = invoices.filter((i) => i.status === "Overdue" || i.status === "Partial").reduce((a, i) => a + (i.amount - i.paid), 0);
  const total = daysUntil(BUDGET.end) - daysUntil(BUDGET.start);
  const elapsed = -daysUntil(BUDGET.start);
  const usedPct = (invoiced / BUDGET.total) * 100;
  const timePct = (elapsed / total) * 100;
  return (
    <section className="flex flex-col gap-3 border-b border-line pb-8">
      <div className="flex items-center justify-between">
        <h2 className="t-h2 text-ink">Spend</h2>
        <Link to="/institution/billing" className="t-small font-medium text-ink-2 hover:text-ink">Billing</Link>
      </div>
      <p className="t-body text-ink-2">
        <span className="font-medium text-ink tnum">{formatNairaShort(invoiced)}</span> invoiced against the{" "}
        <span className="tnum">{formatNairaShort(BUDGET.total)}</span> waste budget: {Math.round(usedPct)}% used with {Math.round(timePct)}% of the year gone. On course to finish about{" "}
        <span className="font-medium text-ink tnum">{formatNairaShort(BUDGET.total - BUDGET.forecast)}</span> under.
      </p>
      <div className="relative pt-5" aria-label={`${Math.round(usedPct)}% of budget used`}>
        <div className="h-2 overflow-hidden rounded-full bg-sunken">
          <div className="h-full rounded-full bg-slate dark:bg-slate-300" style={{ width: `${usedPct}%` }} />
        </div>
        <div className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: `${timePct}%` }}>
          <span className="t-micro text-ink-3">Today</span>
          <span className="mt-0.5 h-4 w-px bg-ink" />
        </div>
      </div>
      <p className="t-small text-ink-3">
        <span className="tnum">{formatNaira(outstanding)}</span> outstanding, of which <span className="font-medium text-warning tnum">{formatNaira(overdue)}</span> is overdue.
      </p>
    </section>
  );
}

function ServiceLevels() {
  const completion = reportSeries.completion[reportSeries.completion.length - 1]!;
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="t-h2 text-ink">Service levels</h2>
        <Link to="/institution/reports" className="t-small font-medium text-ink-2 hover:text-ink">Reports</Link>
      </div>
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="font-display text-[44px] font-bold leading-none tracking-[-0.03em] text-ink tnum">{completion}%</p>
          <p className="mt-1.5 t-small text-ink-2">of September's 171 collections done. Target 95%.</p>
        </div>
        <div className="w-28 shrink-0"><Sparkline data={reportSeries.completion} /></div>
      </div>
      <Meter value={completion} segments={20} />
      <ul className="flex flex-col divide-y divide-line border-y border-line">
        {[
          { name: "Ibom Hauliers", pct: 96.4, note: "4 missed, 3 recovered in 24 h" },
          { name: "Ufok Environmental", pct: 98.3, note: "1 missed, recovered next morning" },
        ].map((o) => (
          <li key={o.name} className="flex items-center gap-3 py-3">
            <Truck className="size-[18px] shrink-0 text-ink-3" strokeWidth={1.75} />
            <span className="min-w-0 flex-1">
              <span className="block t-small font-medium text-ink">{o.name}</span>
              <span className="block t-micro text-ink-3">{o.note}</span>
            </span>
            <span className="t-small font-semibold text-ink tnum">{o.pct}%</span>
          </li>
        ))}
      </ul>
      <Link to="/institution/pickups?tab=missed" className="group flex items-start gap-2 t-small text-ink-2 hover:text-ink">
        <span>Missed-collection recovery was 4 of 5 within 24 hours, below the contract's standard. Slate has credited ₦18,500 on October's invoice.</span>
        <ArrowRight className="mt-0.5 size-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </section>
  );
}
