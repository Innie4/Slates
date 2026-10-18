import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { ArrowRight, ChevronRight, RotateCw } from "lucide-react";
import { RouteMap } from "@/components/brand/RouteMap";
import {
  AreaChart, Badge, Button, ButtonLink, DataTable, LiveDot, Page, ProgressBar, Section, Sparkline, StackedBar, StatusBadge, useToast,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { adminAlerts, cities, complaints, contracts, payments, payouts, series, tickets, type Operator } from "@/data";
import { formatNaira, formatNairaShort, formatNumber, formatPercent, formatTime } from "@/lib/format";
import {
  DEMO_NOW, Kicker, OpsBadge, ReassignModal, Score, countToday, expiringDocs, opsRoutes, useCustomers, useLivePickups, useOperators, useOps,
  windowEnded,
} from "./_ops";

const WINDOWS = ["06:00–08:00", "07:00–09:00", "08:00–10:00", "10:00–12:00", "14:00–16:00"];

/**
 * H1, Control centre. Answers "what is going wrong right now?" first:
 * today's sheet live, then the exceptions queue, then the business.
 */
export default function Dashboard() {
  const toast = useToast();
  const today = useLivePickups();
  const ops = useOperators();
  const allCustomers = useCustomers();
  const s = useOps();
  const c = countToday(today);
  const [reassign, setReassign] = useState(false);
  const [retried, setRetried] = useState(false);

  const missedOpen = today.filter((p) => p.status === "Missed" && !s.recoveries[p.id]);
  const recovered = today.filter((p) => p.status === "Missed" && s.recoveries[p.id]);
  const late = today.filter((p) => p.status === "Late");
  const failed = today.filter((p) => p.status === "Failed");
  const breakdown = opsRoutes.find((r) => r.state === "Breakdown")!;
  const lateRoutes = opsRoutes.filter((r) => r.state === "Running late");
  const onRoad = opsRoutes.filter((r) => r.state === "On route" || r.state === "Running late").length;

  const slaBreaches = complaints
    .filter((x) => !["Resolved", "Closed"].includes(x.status) && new Date(x.slaDue) < DEMO_NOW)
    .slice(0, adminAlerts.slaBreaches);
  const failedPayments = payments.filter((p) => p.status === "Failed").slice(0, adminAlerts.failedPayments);
  const failedSum = failedPayments.reduce((a, p) => a + p.amount, 0);
  const expired = expiringDocs().filter((d) => d.status === "Expired");
  const pct = Math.round((c.completed / c.total) * 100);

  const active = ops.filter((o) => o.status === "Active");
  const onboarding = ops.filter((o) => ["Under review", "More information required", "Submitted", "Pending", "Draft"].includes(o.status)).length + 1;
  const suspended = ops.filter((o) => o.status === "Suspended").length;
  const avgScore = Math.round(active.reduce((a, o) => a + o.score, 0) / active.length);
  const customersActive = allCustomers.filter((x) => x.status === "Active").length;
  const newOct = allCustomers.filter((x) => new Date(x.joined) >= new Date("2026-10-01T00:00:00+01:00")).length;
  const cancelled = allCustomers.filter((x) => x.status === "Cancelled").length;
  const openComplaints = complaints.filter((x) => !["Resolved", "Closed"].includes(x.status)).length;
  const openTickets = tickets.filter((t) => ["Open", "Pending", "Waiting", "Escalated"].includes(t.status)).length;
  const outstanding = payments.filter((p) => p.status === "Failed" || p.status === "Pending");
  const payoutsDue = payouts.filter((p) => p.status === "Pending" || p.status === "Processing").reduce((a, p) => a + p.net, 0);
  const mrr = series.mrr[series.mrr.length - 1]!;
  const mrrLast = series.mrr[series.mrr.length - 2]!;
  const gsv = series.gsv[series.gsv.length - 1]!;

  const byWindow = useMemo(
    () =>
      WINDOWS.map((w) => {
        const list = today.filter((p) => p.window === w && p.status !== "Cancelled" && !p.note?.startsWith("Recovery"));
        const done = list.filter((p) => p.status === "Completed").length;
        const bad = list.filter((p) => p.status === "Missed" || p.status === "Failed").length;
        return { w, total: list.length, done, bad, ended: windowEnded(w) };
      }),
    [today],
  );

  return (
    <Page className="gap-10 md:gap-14">
      {/* Header, the date and the clock, not a greeting */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="t-small text-ink-3 tnum">
            {DEMO_NOW.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · {formatTime(DEMO_NOW)} WAT · Uyo
          </p>
          <h1 className="t-h1 text-ink">Control centre</h1>
        </div>
        <div className="flex gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">
          <ButtonLink to="/admin/routes" variant="secondary">Routes</ButtonLink>
          <ButtonLink to="/admin/pickups" trailing={<ArrowRight className="size-4" />}>Pickup control</ButtonLink>
        </div>
      </header>

      {/* RIGHT NOW */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-10">
        <section aria-label="Today's pickups" className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface">
          <div className="relative isolate min-h-[320px] overflow-hidden bg-slate text-slate-ink chalk-grain">
            <RouteMap progress={c.completed / c.total} stops={[0.12, 0.3, 0.52, 0.7, 0.86]} className="absolute inset-0 h-full w-full opacity-90" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate from-35% via-slate/70 to-slate/10 sm:bg-gradient-to-r sm:from-25% sm:via-slate/75 sm:to-transparent" />
            <div className="relative flex h-full flex-col gap-3 p-6 sm:max-w-[30rem] sm:p-8">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex h-7 items-center gap-2 rounded-sm bg-signal px-2.5 text-[12px] font-semibold text-signal-ink">
                  <LiveDot className="[&>span]:bg-signal-ink" />
                  Right now
                </span>
                <span className="t-small text-slate-ink/70 tnum">{onRoad} trucks on the road · {opsRoutes.length} routes today</span>
              </div>
              <p className="mt-3 t-micro text-slate-ink/60">Collected across Uyo</p>
              <p className="t-display-xl tnum">
                {formatNumber(c.completed)}
                <span className="text-slate-ink/40">/{formatNumber(c.total)}</span>
              </p>
              <p className="t-body text-slate-ink/85">
                {pct}% of today’s sheet, eight hours of windows still open.{" "}
                <span className="text-slate-ink">
                  {breakdown.vehicle} broke down on {breakdown.area} at {formatTime(breakdown.breakdownAt!)}
                </span>
                {missedOpen.length ? `, ${missedOpen.length} stops not reached.` : ", all stops reassigned."}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-6 p-5 sm:p-6">
            <StackedBar
              segments={[
                { label: "Completed", value: c.completed, tone: "success" },
                { label: "In progress", value: c.inProgress, tone: "slate" },
                { label: "Scheduled", value: c.scheduled, tone: "muted" },
                { label: "Late", value: c.late, tone: "warning" },
                { label: "Missed", value: c.missed, tone: "danger" },
                { label: "Failed", value: c.failed, tone: "danger" },
              ]}
            />
            {/* Timetable board: each collection window */}
            <div className="-mx-5 overflow-x-auto px-5 scrollbar-none sm:mx-0 sm:px-0">
              <ol className="grid min-w-[520px] grid-cols-5 divide-x divide-line border-y border-line">
                {byWindow.map((b) => {
                  const now = !b.ended && b.done > 0;
                  return (
                    <li key={b.w} className="flex flex-col gap-1.5 px-3 py-3 first:pl-0">
                      <span className={cn("t-mono text-[12px]", now ? "text-ink" : "text-ink-3")}>{b.w}</span>
                      <span className="font-display text-[20px] font-bold leading-none text-ink tnum">
                        {b.done}
                        <span className="text-[14px] font-semibold text-ink-3">/{b.total}</span>
                      </span>
                      <span className={cn("t-micro", b.bad ? "text-danger" : b.ended ? "text-ink-3" : now ? "text-ink-2" : "text-ink-3")}>
                        {b.bad ? `${b.bad} missed or failed` : b.ended ? "Window closed" : now ? "Collecting now" : "Not started"}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </section>

        {/* EXCEPTIONS QUEUE */}
        <section aria-label="Needs you now" className="flex min-w-0 flex-col gap-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="t-h2 text-ink">Needs you now</h2>
              <p className="t-small text-ink-2">Exceptions, worst first. Act here or open the queue.</p>
            </div>
          </div>
          <ul className="divide-y divide-line border-y border-line">
            {missedOpen.length > 0 ? (
              <Exception
                tone="signal"
                count={missedOpen.length}
                title={`Missed on ${breakdown.area}, needs reassignment`}
                detail={`Nwaniba Clean Crew · ${breakdown.vehicle} broke down ${formatTime(breakdown.breakdownAt!)}. Contract CT-UYO-017 recovery SLA is 6h, due 12:52.`}
              >
                <Button size="sm" onClick={() => setReassign(true)}>Reassign {missedOpen.length}</Button>
                <InlineLink to="/admin/pickups?tab=missed">Missed queue</InlineLink>
              </Exception>
            ) : (
              <Exception tone="success" count={recovered.length} title="Missed pickups reassigned" detail={`Recovery pickups booked with ${[...new Set(recovered.map((p) => s.extra.find((x) => x.id === s.recoveries[p.id])?.operatorName))].join(", ")}. Track them until resolved.`}>
                <InlineLink to="/admin/pickups?tab=missed">Track recoveries</InlineLink>
              </Exception>
            )}
            <Exception
              tone="warning"
              count={late.length}
              title="Late, window closed, crews still coming"
              detail={`${lateRoutes.map((r) => `${r.id} (${r.stops - r.done - 1} stops)`).join(", ")}. Customers expect 08:00.`}
            >
              <Button size="sm" variant="secondary" onClick={() => toast.success(`Delay SMS sent to ${late.length} customers`, "“Your crew is running about 30 minutes late today.”")}>
                Notify customers
              </Button>
              <InlineLink to="/admin/pickups?tab=late">Late queue</InlineLink>
            </Exception>
            <Exception tone="danger" count={failed.length} title="Failed at the gate" detail="Gate locked, bins not out, access blocked, refused entry. Rebook or contact the customer.">
              <InlineLink to="/admin/pickups?tab=failed">Review failed</InlineLink>
            </Exception>
            <Exception
              tone="danger"
              count={slaBreaches.length}
              title="Complaints past SLA"
              detail={slaBreaches.map((x) => `${x.id} ${x.customerName}`).join(" · ")}
            >
              <InlineLink to="/admin/complaints?tab=escalated">Open complaints</InlineLink>
            </Exception>
            <Exception
              tone="warning"
              count={failedPayments.length}
              title="Failed payments"
              detail={retried ? `Retry queued for ${failedPayments.length} cards at 18:00 today.` : `${formatNaira(failedSum)} across ${failedPayments.length} customers. Next automatic retry tonight.`}
            >
              <Button size="sm" variant="secondary" disabled={retried} leading={<RotateCw className="size-3.5" />} onClick={() => { setRetried(true); toast.success("Retry queued", `${failedPayments.length} payments · ${formatNaira(failedSum)} · 18:00 today`); }}>
                {retried ? "Retry queued" : "Retry all"}
              </Button>
              <InlineLink to="/admin/payments?tab=failed">Payments</InlineLink>
            </Exception>
            <Exception tone="neutral" count={expired.length + adminAlerts.operatorApplications} title="Operator paperwork" detail={`${expired.length} expired document${expired.length === 1 ? "" : "s"} (Ibom Hauliers driver licences) · ${adminAlerts.operatorApplications} applications waiting.`}>
              <InlineLink to="/admin/operator-verification">Verification</InlineLink>
              <InlineLink to="/admin/operator-applications">Applications</InlineLink>
            </Exception>
          </ul>
        </section>
      </div>

      {/* THE BUSINESS, one board, one row per domain */}
      <Section title="The business" description="Month to date unless noted. Each row opens its workspace.">
        <div className="flex flex-col border-y border-line">
          <BoardRow
            to="/admin/customers"
            label="Customers"
            figure={formatNumber(allCustomers.length)}
            detail={<>{formatNumber(customersActive)} active · <b>{newOct}</b> new in October · {cancelled} cancelled ({formatPercent((cancelled / allCustomers.length) * 100)})</>}
            trend={<Sparkline data={series.customers} />}
          />
          <BoardRow
            to="/admin/operators"
            label="Operators"
            figure={`${active.length} active`}
            detail={<>{onboarding} in onboarding · {suspended} suspended · average score <b>{avgScore}</b> · {formatNumber(active.reduce((a, o) => a + o.capacity - o.assigned, 0))} slots free</>}
            trend={<Score value={avgScore} />}
          />
          <BoardRow
            to="/admin/pickups"
            label="Operations"
            figure={formatPercent(series.completion[series.completion.length - 1]!)}
            detail={<>completion, 30 days · today {formatNumber(c.total)} pickups, {c.completed} completed, <b className="text-danger">{c.missed} missed</b>, {c.failed} failed</>}
            trend={<Sparkline data={series.completion} />}
          />
          <BoardRow
            to="/admin/finance"
            label="Finance"
            figure={formatNairaShort(mrr)}
            detail={<>MRR · GSV {formatNairaShort(gsv)} · operator payouts due {formatNairaShort(payoutsDue)} · outstanding {formatNaira(outstanding.reduce((a, p) => a + p.amount, 0))} on {outstanding.length} payments</>}
            trend={<Sparkline data={series.mrr} />}
          />
          <BoardRow
            to="/admin/complaints"
            label="Support"
            figure={`${openComplaints} open`}
            detail={<>complaints · <b className="text-danger">{adminAlerts.slaBreaches} SLA breaches</b> · {openTickets} support tickets open · median first response 38 min</>}
            trend={<Sparkline data={series.missed14} tone="danger" />}
          />
          <BoardRow
            to="/admin/cities"
            label="Cities"
            figure={`${cities.filter((x) => x.status === "Live").length} live`}
            detail={<>{cities.filter((x) => x.status === "Launching").map((x) => x.name).join(", ")} launching 1 Feb 2027 · {cities.filter((x) => x.status === "Planned").length} planned · 9 of 9 Uyo zones covered</>}
          />
        </div>
      </Section>

      {/* REVENUE */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-10">
        <Section
          title="Monthly recurring revenue"
          description={`${formatNaira(mrr)} in October, up ${formatPercent(((mrr - mrrLast) / mrrLast) * 100)} on September. Dashed line: the plan approved in March.`}
          actions={<Link to="/admin/finance" className="t-small font-medium text-ink-2 hover:text-ink">Finance</Link>}
        >
          <AreaChart data={series.mrr} compare={series.mrrPrev} labels={series.months} format={formatNairaShort} height={240} label="Monthly recurring revenue, April to October 2026" />
        </Section>
        <section className="flex flex-col gap-4">
          <Kicker>October so far</Kicker>
          <dl className="flex flex-col divide-y divide-line border-y border-line">
            {[
              ["Gross service value", formatNaira(gsv), "Everything customers paid for, incl. one-off jobs"],
              ["Operator payouts", formatNaira(payouts.filter((p) => p.period === "September 2026").reduce((a, p) => a + p.net, 0)), "September, net of ₦130,000 deductions, due 7 Oct"],
              ["Slate share after payouts", formatNaira(Math.round(gsv * 0.214)), "21.4% blended take rate"],
              ["Contracts renewing in 60 days", String(contracts.filter((x) => x.status === "Renewal approaching" || x.status === "Expiring").length), "CT-UYO-014 Ibom Hauliers, CT-UYO-017 Nwaniba Clean Crew"],
            ].map(([k, v, hint]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 py-3.5">
                <dt className="flex min-w-0 flex-col">
                  <span className="t-small text-ink">{k}</span>
                  <span className="t-micro text-ink-3">{hint}</span>
                </dt>
                <dd className="shrink-0 t-body font-semibold text-ink tnum">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {/* OPERATOR LEAGUE */}
      <Section
        title="Operator league"
        description="Ranked by Slate score, completion, missed pickups, complaints, response time and ratings over 30 days."
        actions={<Link to="/admin/operators" className="t-small font-medium text-ink-2 hover:text-ink">All operators</Link>}
      >
        <League operators={[...active].sort((a, b) => b.score - a.score)} />
      </Section>

      {/* CITIES */}
      <Section title="Cities" actions={<Link to="/admin/cities" className="t-small font-medium text-ink-2 hover:text-ink">Expansion</Link>}>
        <ul className="flex flex-col divide-y divide-line border-y border-line">
          {cities.map((city) => {
            const live = city.status === "Live";
            return (
              <li key={city.id}>
                <Link to={`/admin/cities/${city.id}`} className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-4 sm:grid-cols-[180px_minmax(0,1fr)_auto_16px]">
                  <span className="flex items-center gap-2.5">
                    <span className="t-body font-medium text-ink">{city.name}</span>
                    <span className="t-small text-ink-3">{city.state}</span>
                  </span>
                  <span className="col-start-1 row-start-2 t-small text-ink-2 tnum sm:col-start-2 sm:row-start-1">
                    {live
                      ? `${formatNumber(city.customers)} customers · ${formatNairaShort(city.revenue)} a month · ${city.operators} operators · ${formatPercent(city.completion)} completion`
                      : `${city.status === "Launching" ? `Launch ${formatLaunch(city.launch)}` : `Planned ${city.launch}`} · demand index ${city.demand} · regulatory readiness ${city.regulatory}%${city.operators ? ` · ${city.operators} operator applying` : ""}`}
                  </span>
                  <span className="row-span-2 sm:row-span-1">
                    <StatusBadge status={city.status} />
                  </span>
                  <ChevronRight className="hidden size-4 text-ink-3 transition-transform group-hover:translate-x-0.5 sm:block" />
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>

      <ReassignModal open={reassign} onClose={() => setReassign(false)} items={missedOpen} />
    </Page>
  );
}

const formatLaunch = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : d);

function Exception({ tone, count, title, detail, children }: { tone: "signal" | "danger" | "warning" | "success" | "neutral"; count: number; title: string; detail: ReactNode; children?: ReactNode }) {
  return (
    <li className="relative flex gap-4 py-4">
      {tone === "signal" && <span className="absolute -left-3 top-4 bottom-4 w-[3px] rounded-full bg-signal sm:-left-4" aria-hidden />}
      <span
        className={cn(
          "w-9 shrink-0 font-display text-[26px] font-bold leading-none tracking-[-0.02em] tnum",
          tone === "signal" && "text-[color:var(--signal-hover)] dark:text-signal",
          tone === "danger" && "text-danger",
          tone === "warning" && "text-warning",
          tone === "success" && "text-success",
          tone === "neutral" && "text-ink-2",
        )}
      >
        {count}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="t-body font-medium leading-snug text-ink">{title}</p>
        <p className="t-small text-ink-2">{detail}</p>
        {children && <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">{children}</div>}
      </div>
    </li>
  );
}

function InlineLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 t-small font-medium text-ink-2 hover:text-ink">
      {children}
      <ArrowRight className="size-3.5" />
    </Link>
  );
}

function BoardRow({ to, label, figure, detail, trend }: { to: string; label: string; figure: string; detail: ReactNode; trend?: ReactNode }) {
  return (
    <Link
      to={to}
      className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1 border-b border-line py-4 last:border-0 sm:grid-cols-[120px_160px_minmax(0,1fr)_120px_16px] [&_b]:font-semibold [&_b]:text-ink"
    >
      <span className="t-small text-ink-3">{label}</span>
      <span className="col-start-2 row-start-1 text-right font-display text-[22px] font-bold leading-tight tracking-[-0.02em] text-ink tnum sm:col-start-2 sm:text-left">{figure}</span>
      <span className="col-span-2 t-small text-ink-2 tnum sm:col-span-1">{detail}</span>
      <span className="hidden sm:block">{trend}</span>
      <ChevronRight className="hidden size-4 text-ink-3 transition-transform group-hover:translate-x-0.5 sm:block" />
    </Link>
  );
}

function League({ operators }: { operators: Operator[] }) {
  const cols: Column<Operator>[] = [
    {
      key: "rank",
      header: "#",
      cell: (o) => <span className="t-mono text-ink-3">{String(operators.indexOf(o) + 1).padStart(2, "0")}</span>,
      hideOnMobile: true,
      className: "w-10",
    },
    { key: "name", header: "Operator", cell: (o) => <span className="flex flex-col"><span className="font-medium text-ink">{o.short}</span><span className="t-micro text-ink-3">{o.focus}</span></span> },
    { key: "score", header: "Score", cell: (o) => <Score value={o.score} />, sortValue: (o) => o.score },
    { key: "completion", header: "Completion", cell: (o) => <span className="tnum">{formatPercent(o.completion)}</span>, sortValue: (o) => o.completion, align: "right" },
    { key: "missed", header: "Missed 30d", cell: (o) => <span className={cn("tnum", o.missed30d >= 8 && "text-danger")}>{o.missed30d}</span>, sortValue: (o) => o.missed30d, align: "right" },
    { key: "complaints", header: "Complaints", cell: (o) => <span className="tnum">{o.complaints30d}</span>, sortValue: (o) => o.complaints30d, align: "right", hideOnMobile: true },
    { key: "response", header: "Response", cell: (o) => <span className="tnum">{o.responseMins} min</span>, sortValue: (o) => o.responseMins, align: "right", hideOnMobile: true },
    { key: "rating", header: "Rating", cell: (o) => <span className="tnum">{o.rating.toFixed(1)}</span>, sortValue: (o) => o.rating, align: "right", hideOnMobile: true },
    {
      key: "load",
      header: "Customers / capacity",
      cell: (o) => (
        <span className="flex min-w-36 items-center gap-2.5">
          <ProgressBar value={o.assigned} max={o.capacity} size="sm" tone={o.assigned / o.capacity > 0.9 ? "warning" : "slate"} label="Capacity used" />
          <span className="whitespace-nowrap t-micro text-ink-2 tnum">
            {formatNumber(o.assigned)}/{formatNumber(o.capacity)}
          </span>
        </span>
      ),
      sortValue: (o) => o.assigned / o.capacity,
    },
    {
      key: "flag",
      header: "",
      cell: (o) =>
        o.id === "op-nwaniba" ? <OpsBadge status="Breakdown" /> : o.docsExpiring > 1 ? <Badge tone="warning" dot>Docs expired</Badge> : <OpsBadge status="On route" />,
    },
  ];
  return (
    <DataTable
      rows={operators}
      columns={cols}
      rowKey={(o) => o.id}
      rowHref={(o) => `/admin/operators/${o.id}`}
      mobile={(o) => (
        <div className="flex items-center gap-3">
          <span className="t-mono w-6 text-ink-3">{String(operators.indexOf(o) + 1).padStart(2, "0")}</span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate t-body font-medium text-ink">{o.short}</span>
              <Score value={o.score} />
            </div>
            <span className="t-small text-ink-2 tnum">
              {formatPercent(o.completion)} completion · {o.missed30d} missed · {formatNumber(o.assigned)} customers
            </span>
          </div>
        </div>
      )}
    />
  );
}
