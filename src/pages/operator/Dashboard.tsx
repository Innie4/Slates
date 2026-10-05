import { Link } from "react-router";
import { AlertTriangle, ArrowRight, Clock, FileWarning, MessageSquareWarning, Truck, UserPlus } from "lucide-react";
import { RouteMap } from "@/components/brand/RouteMap";
import { Badge, LiveDot, List, ListRow, Page, Section, StatusBadge, type Tone } from "@/components/ui";
import { cn } from "@/lib/cn";
import { contracts, operatorNotifications } from "@/data";
import { DEMO_NOW, formatNaira, formatNairaShort, formatNumber, formatTime } from "@/lib/format";
import { ROUTES, UFOK, OPS_VEHICLES } from "./_opsData";
import { RouteProgress, STATUS_ORDER, StopNumber, isLate, isTodayIso, routeStat, stopState, useJobs } from "./_ops";

const MAP_STOPS = [0.1, 0.24, 0.38, 0.52, 0.66, 0.8, 0.92];

/**
 * G3 — Today. The operator's first question is "what are today's jobs?", so the
 * page leads with route progress across the fleet, then what needs attention,
 * then the next stops. Business numbers sit last as a compact strip.
 */
export default function Dashboard() {
  const jobs = useJobs();
  const today = jobs.filter((j) => isTodayIso(j.date) && j.routeId && j.stop && j.status !== "Cancelled");
  const done = today.filter((j) => j.status === "Completed").length;
  const failed = today.filter((j) => j.status === "Failed").length;
  const total = today.length;
  const stats = ROUTES.map((r) => ({ route: r, ...routeStat(jobs, r.id) }));
  const lead = stats[0]!;
  const leadProgress = (lead.done + lead.failed) / Math.max(1, lead.total);
  const remaining = total - done - failed;

  const nextJobs = today
    .filter((j) => ["Arrived", "En route", "Scheduled"].includes(j.status))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.stop! - b.stop!)
    .slice(0, 6);

  const late = today.filter(isLate);
  const lateByVehicle = [...new Set(late.map((j) => j.vehicle))];
  const failedJobs = today.filter((j) => j.status === "Failed");
  const unassigned = jobs.filter((j) => !j.driver && j.status === "Scheduled");
  const sla = operatorNotifications.find((n) => n.id === "on2")!;
  const licence = operatorNotifications.find((n) => n.id === "on5")!;

  const warnings: Array<{ key: string; icon: typeof Clock; tone: Tone; tag: string; title: string; body: string; to: string }> = [
    ...(late.length
      ? [{
          key: "late", icon: Clock, tone: "danger" as Tone, tag: "Late",
          title: `${late.length} ${late.length === 1 ? "stop is" : "stops are"} past the 06:00–08:00 window`,
          body: `${lateByVehicle.join(" and ")} still ${late.length === 1 ? "has this stop" : "have these stops"} to do. Slate has told the customers to expect the truck by 09:30.`,
          to: `/operator/routes?route=${ROUTES.find((r) => r.vehicle === lateByVehicle[lateByVehicle.length - 1])?.id ?? ""}`,
        }]
      : []),
    {
      key: "sla", icon: MessageSquareWarning, tone: "warning", tag: "SLA warning",
      title: sla.title.replace(/^SLA warning: /, ""),
      body: sla.body,
      to: sla.to!,
    },
    ...failedJobs.map((j) => ({
      key: j.id, icon: AlertTriangle, tone: "warning" as Tone, tag: "Recover in 24 h",
      title: `Retry ${j.customerName}`,
      body: `Failed at ${formatTime(j.failedAt!)} (${j.failReason?.toLowerCase()}). Not recovered by ${formatTime(new Date(new Date(j.failedAt!).getTime() + 24 * 3600_000))} tomorrow means a ₦2,500 deduction.`,
      to: `/operator/jobs/${j.id}`,
    })),
    ...(unassigned.length
      ? [{
          key: "unassigned", icon: UserPlus, tone: "info" as Tone, tag: "Needs a driver",
          title: `${unassigned.length} Tuesday jobs have no driver`,
          body: "Shelter Afrique Estate Block D, transferred from Nwaniba Clean Crew.",
          to: "/operator/jobs?tab=upcoming",
        }]
      : []),
    {
      key: "licence", icon: FileWarning, tone: "warning", tag: "Due 19 Oct",
      title: licence.title,
      body: licence.body,
      to: licence.to!,
    },
  ];

  const ufokContracts = contracts.filter((c) => c.operatorId === UFOK.id);
  const active = ufokContracts.filter((c) => c.status === "Active").length;
  const awaiting = ufokContracts.filter((c) => c.status === "Sent to operator").length;
  const inShop = OPS_VEHICLES.filter((v) => v.status === "In maintenance").length;

  return (
    <Page className="gap-8 md:gap-10">
      <div className="flex flex-col gap-1">
        <p className="t-small text-ink-3 tnum">
          {DEMO_NOW.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · {formatTime(DEMO_NOW)}
        </p>
        <p className="flex items-center gap-1.5 t-body font-medium text-ink">
          <Truck className="size-4 text-ink-3" strokeWidth={1.75} />
          {ROUTES.length} trucks out · {inShop} in maintenance
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-x-10 lg:gap-y-10">
        {/* Hero: fleet progress, live */}
        <section
          aria-label="Today's route progress"
          className="relative isolate flex min-h-[400px] flex-col overflow-hidden rounded-xl bg-slate text-slate-ink chalk-grain sm:min-h-[420px] lg:col-start-1 lg:row-start-1"
        >
          <RouteMap progress={leadProgress} stops={MAP_STOPS} className="absolute inset-0 h-full w-full opacity-95" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-slate from-40% via-slate/80 to-transparent" />
          <div className="relative flex flex-col gap-3 p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 items-center gap-2 rounded-sm bg-signal px-2.5 text-[12px] font-semibold text-signal-ink">
                <LiveDot className="[&>span]:bg-signal-ink" />
                Live
              </span>
              <span className="t-small text-slate-ink/70">All routes · since 06:04</span>
            </div>
            <h1 className="t-display-xl tnum">
              {done}{" "}
              <span className="align-[0.12em] text-[0.42em] font-semibold tracking-normal text-slate-ink/60">of</span>{" "}
              {total}
            </h1>
            <p className="t-body text-slate-ink/85">
              <span className="font-semibold text-slate-ink">collected</span>
              <span className="mx-2 text-slate-ink/40">·</span>
              <span className="tnum">{failed} failed</span>
              <span className="mx-2 text-slate-ink/40">·</span>
              <span className="tnum">{remaining} to go</span>
            </p>
          </div>
          <div className="relative mt-auto flex flex-wrap items-end justify-between gap-3 p-6 sm:p-8">
            <div className="rounded-md bg-slate-950/55 px-3 py-2 backdrop-blur">
              <p className="text-[13px] font-semibold">
                Truck <span className="font-mono">{lead.route.vehicle}</span> on {lead.route.truckAt}
              </p>
              <p className="text-[12px] text-slate-ink/75 tnum">
                {lead.route.driver} · stop {lead.done + lead.failed + 1} of {lead.total}
              </p>
            </div>
            <Link
              to="/operator/routes"
              className="inline-flex h-11 items-center gap-2 rounded-md bg-slate-ink px-4 text-[14px] font-semibold text-slate-950 transition hover:bg-white"
            >
              Routes <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        {/* Needs you */}
        <Section
          title="Needs attention"
          className="lg:col-start-2 lg:row-start-2"
          actions={<Badge tone="signal">{warnings.length} open</Badge>}
        >
          <List className="border-y border-line">
            {warnings.map((w) => (
              <Link key={w.key} to={w.to} className="group -mx-2 flex gap-3 rounded-md px-2 py-4 transition-colors hover:bg-sunken/70">
                <w.icon
                  className={cn("mt-0.5 size-[18px] shrink-0", w.tone === "danger" ? "text-danger" : w.tone === "warning" ? "text-warning" : "text-info")}
                  strokeWidth={1.75}
                />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="t-body font-medium text-ink">{w.title}</span>
                  </span>
                  <span className="t-small text-ink-2">{w.body}</span>
                  <Badge tone={w.tone} className="mt-1 w-fit">{w.tag}</Badge>
                </span>
                <ArrowRight className="mt-1 size-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </List>
        </Section>

        {/* Next stops */}
        <Section
          title="Next stops"
          className="lg:col-start-1 lg:row-start-2"
          actions={<Link to="/operator/jobs" className="t-small font-medium text-ink-2 hover:text-ink">All {total} jobs</Link>}
        >
          <List>
            {nextJobs.map((j) => (
              <ListRow
                key={j.id}
                to={`/operator/jobs/${j.id}`}
                className="py-4"
                leading={<StopNumber n={j.stop!} state={stopState(j)} />}
                title={j.customerName}
                subtitle={`${j.address.replace(/, Uyo$/, "")} · ${j.window}`}
                meta={<span className="font-mono text-[12.5px]">{j.vehicle}</span>}
                trailing={isLate(j) ? <Badge tone="danger" dot>Late</Badge> : <StatusBadge status={j.status} />}
              />
            ))}
          </List>
        </Section>

        {/* Per-route progress */}
        <Section title="Routes" className="lg:col-start-2 lg:row-start-1" actions={<Link to="/operator/routes" className="t-small font-medium text-ink-2 hover:text-ink">Manage</Link>}>
          <div className="flex flex-col divide-y divide-line border-y border-line">
            {stats.map((s) => (
              <Link key={s.route.id} to={`/operator/routes?route=${s.route.id}`} className="group -mx-2 flex flex-col gap-2.5 rounded-md px-2 py-4 transition-colors hover:bg-sunken/70">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate">
                    <span className="t-mono font-semibold text-ink">{s.route.vehicle}</span>
                    <span className="t-small text-ink-2"> · {s.route.driver}</span>
                  </span>
                  <span className="shrink-0 t-small text-ink tnum">
                    <span className="font-semibold">{s.done}</span>
                    <span className="text-ink-3"> / {s.total}</span>
                  </span>
                </div>
                <RouteProgress done={s.done} failed={s.failed} total={s.total} />
                <p className="t-small text-ink-3">
                  {s.route.name} · {s.failed ? <span className="text-danger">{s.failed} failed</span> : "none failed"} · at {s.route.truckAt}
                </p>
              </Link>
            ))}
          </div>
        </Section>
      </div>

      {/* The numbers */}
      <section aria-label="This month" className="flex flex-col gap-4">
        <h2 className="t-h2 text-ink">October so far</h2>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4 xl:grid-cols-8">
          {[
            { label: "Expected revenue", value: formatNairaShort(UFOK.payoutMonthly), hint: "Before deductions", to: "/operator/payments", title: formatNaira(UFOK.payoutMonthly) },
            { label: "Active contracts", value: active, hint: awaiting ? `${awaiting} to accept` : "All signed", to: "/operator/contracts" },
            { label: "Assigned customers", value: formatNumber(UFOK.assigned), hint: "Households", to: "/operator/customers" },
            { label: "Today's pickups", value: total, hint: `${ROUTES.length} routes`, to: "/operator/jobs" },
            { label: "Completed", value: done, hint: `${Math.round((done / Math.max(1, total)) * 100)}% of today`, to: "/operator/jobs?tab=completed" },
            { label: "Failed", value: failed, hint: "Recover within 24 h", to: "/operator/jobs?tab=failed", danger: failed > 0 },
            { label: "Complaints", value: UFOK.complaints30d, hint: "Last 30 days", to: "/operator/complaints" },
            { label: "Performance", value: UFOK.score, hint: `${UFOK.completion}% completion`, to: "/operator/performance" },
          ].map((f) => (
            <Link key={f.label} to={f.to} title={f.title} className="flex flex-col gap-1 bg-surface p-4 transition-colors hover:bg-sunken/60 sm:p-5">
              <span className="t-micro text-ink-3">{f.label}</span>
              <span className={cn("font-display text-[24px] font-bold leading-tight tracking-[-0.02em] tnum", f.danger ? "text-danger" : "text-ink")}>{f.value}</span>
              <span className="t-small text-ink-3">{f.hint}</span>
            </Link>
          ))}
        </div>
      </section>
    </Page>
  );
}
