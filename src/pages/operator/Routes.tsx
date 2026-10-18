import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ArrowDown, ArrowUp, ChevronDown, Sparkles, Undo2 } from "lucide-react";
import { RouteMap } from "@/components/brand/RouteMap";
import { Badge, Button, IconButton, LiveDot, Page, PageHeader, Section, StatusBadge, useToast } from "@/components/ui";
import { cn } from "@/lib/cn";
import { DEMO_NOW, formatTime } from "@/lib/format";
import { OPS_DRIVERS, ROUTES, type Job } from "./_opsData";
import { RouteProgress, StopNumber, isLate, replaceRouteOrder, routeStat, stopState, useJobs } from "./_ops";

/**
 * G10, the day's routes, one per truck. The dispatcher sees progress, the map and
 * the stop order, and can reorder what's left without dragging (up/down buttons
 * work with gloves on a phone).
 */
export default function Routes() {
  const toast = useToast();
  const jobs = useJobs();
  const [params, setParams] = useSearchParams();
  const routeId = ROUTES.some((r) => r.id === params.get("route")) ? params.get("route")! : ROUTES[0]!.id;
  const route = ROUTES.find((r) => r.id === routeId)!;
  const stat = routeStat(jobs, routeId);
  const driver = OPS_DRIVERS.find((d) => d.name === route.driver);

  const locked = stat.jobs.filter((j) => j.status !== "Scheduled");
  const initialKey = stat.jobs.filter((j) => j.status === "Scheduled").map((j) => j.id).join("|");
  const initialOrder = useMemo(() => (initialKey ? initialKey.split("|") : []), [initialKey]);
  const [order, setOrder] = useState<string[]>(initialOrder);
  const [km, setKm] = useState<Record<string, number>>({});
  const [optimised, setOptimised] = useState<Record<string, boolean>>({});
  const [showDone, setShowDone] = useState(false);

  // Reset local order when switching route or when the store changes underneath.
  useEffect(() => {
    setOrder(initialOrder);
    setShowDone(false);
  }, [routeId, initialOrder]);

  const byId = new Map(stat.jobs.map((j) => [j.id, j]));
  const pending = order.map((id) => byId.get(id)).filter(Boolean) as Job[];
  const dirty = order.join() !== initialOrder.join();
  const distance = km[routeId] ?? route.distanceKm;
  const attempted = stat.done + stat.failed;
  const rate = attempted ? Math.round((stat.done / attempted) * 1000) / 10 : 100;

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = order.slice();
    [next[i], next[j]] = [next[j]!, next[i]!];
    setOrder(next);
  };

  const optimise = () => {
    if (optimised[routeId]) {
      toast.info("Already the shortest order", `${pending.length} stops left on ${route.vehicle}.`);
      return;
    }
    const num = (a: string) => parseInt(a.match(/\d+/)?.[0] ?? "0", 10);
    const sorted = pending.slice().sort((a, b) => a.area.localeCompare(b.area) || num(a.address) - num(b.address)).map((j) => j.id);
    setOrder(sorted);
    const saved = routeId === "r-ewet" ? 6.2 : Math.round(route.distanceKm * 0.11 * 10) / 10;
    setKm((k) => ({ ...k, [routeId]: Math.round((distance - saved) * 10) / 10 }));
    setOptimised((o) => ({ ...o, [routeId]: true }));
    toast.success(`Saved ${saved} km`, `New order groups stops by street. Publish it to send it to ${route.driver.split(" ")[0]}'s app.`);
  };

  const publish = () => {
    const ids = [...locked.map((j) => j.id), ...order];
    replaceRouteOrder(routeId, ids);
    toast.success(`Route published to ${route.driver.split(" ")[0]}'s app`, `${order.length} remaining stops in the new order.`);
  };

  const mapStops = useMemo(() => Array.from({ length: 6 }, (_, i) => 0.08 + i * 0.15), []);

  return (
    <Page className="gap-6 md:gap-8">
      <PageHeader
        title="Routes"
        description={`${DEMO_NOW.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · ${ROUTES.length} trucks · ${ROUTES.reduce((a, r) => a + routeStat(jobs, r.id).total, 0)} stops`}
      />

      {/* Route selector, one per vehicle */}
      <div className="-mx-5 overflow-x-auto px-5 scrollbar-none md:mx-0 md:px-0" role="tablist" aria-label="Vehicle routes">
        <div className="flex min-w-max gap-2 md:grid md:min-w-0 md:grid-cols-4">
          {ROUTES.map((r) => {
            const s = routeStat(jobs, r.id);
            const active = r.id === routeId;
            return (
              <button
                key={r.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  const next = new URLSearchParams(params);
                  next.set("route", r.id);
                  setParams(next, { replace: true, preventScrollReset: true });
                }}
                className={cn(
                  "flex w-[220px] flex-col gap-2.5 rounded-lg border bg-surface p-4 text-left transition md:w-auto",
                  active ? "border-ink ring-1 ring-ink" : "border-line hover:border-line-strong",
                )}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="t-mono font-semibold text-ink">{r.vehicle}</span>
                  <span className="t-small text-ink tnum">
                    <span className="font-semibold">{s.done}</span>
                    <span className="text-ink-3">/{s.total}</span>
                  </span>
                </span>
                <RouteProgress done={s.done} failed={s.failed} total={s.total} size="sm" />
                <span className="truncate t-small text-ink-2">{r.driver} · {r.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:gap-y-8">
        {/* Map + facts */}
        <div className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-1">
          <section aria-label={`${route.vehicle} on the map`} className="relative isolate flex aspect-[16/11] flex-col overflow-hidden rounded-xl bg-slate text-slate-ink chalk-grain lg:aspect-[5/4]">
            <RouteMap progress={(stat.done + stat.failed) / Math.max(1, stat.total)} stops={mapStops} className="absolute inset-0 h-full w-full opacity-95" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-slate from-30% to-transparent" />
            <div className="relative flex flex-col gap-1.5 p-5">
              <span className="inline-flex h-7 w-fit items-center gap-2 rounded-sm bg-signal px-2.5 text-[12px] font-semibold text-signal-ink">
                <LiveDot className="[&>span]:bg-signal-ink" />
                {route.truckAt}
              </span>
              <p className="t-h2">{route.name}</p>
            </div>
            <div className="relative mt-auto p-5">
              <div className="w-fit rounded-md bg-slate-950/55 px-3 py-2 backdrop-blur">
                <p className="text-[13px] font-semibold">{stat.current ? `At stop ${stat.current.stop}: ${stat.current.customerName}` : "Route finished"}</p>
                <p className="text-[12px] text-slate-ink/75 tnum">Left the yard {formatTime(route.startedAt)}</p>
              </div>
            </div>
          </section>

          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {[
              ["Collected", `${stat.done} of ${stat.total}`],
              ["Completion", `${rate}%`],
              ["Failed", String(stat.failed)],
              ["Distance", `${distance} km`],
            ].map(([k, v]) => (
              <div key={k} className="bg-surface p-4">
                <dt className="t-micro text-ink-3">{k}</dt>
                <dd className={cn("mt-1 font-display text-[22px] font-bold leading-tight tracking-[-0.02em] text-ink tnum", k === "Failed" && stat.failed > 0 && "text-danger")}>{v}</dd>
              </div>
            ))}
          </dl>


        </div>

        {/* Stop order */}
        <Section
          className="lg:col-start-2 lg:row-span-2 lg:row-start-1"
          title="Stop order"
          description={`${pending.length} left to collect. Completed and live stops are locked.`}
          actions={
            <Button variant="secondary" leading={<Sparkles className="size-4" />} onClick={optimise} disabled={pending.length < 2}>
              Optimise order
            </Button>
          }
        >
          <div className="flex flex-col">
            {locked.length > 0 && (
              <button
                type="button"
                onClick={() => setShowDone((v) => !v)}
                aria-expanded={showDone}
                className="flex items-center justify-between gap-3 border-y border-line py-3 text-left"
              >
                <span className="t-small text-ink-2">
                  <span className="font-semibold text-ink">{stat.done + stat.failed}</span> done{stat.failed ? ` (${stat.failed} failed)` : ""}
                  {stat.current ? " · 1 live" : ""}
                </span>
                <span className="inline-flex items-center gap-1 t-small font-medium text-ink-2">
                  {showDone ? "Hide" : "Show"} <ChevronDown className={cn("size-4 transition-transform", showDone && "rotate-180")} />
                </span>
              </button>
            )}
            <ol className="flex flex-col divide-y divide-line border-b border-line">
              {(showDone ? locked : locked.filter((j) => j.status === "Arrived" || j.status === "En route")).map((j) => (
                <li key={j.id}>
                  <Link to={`/operator/jobs/${j.id}`} className={cn("flex items-center gap-3 py-3", (j.status === "Completed" || j.status === "Failed") && "opacity-75")}>
                    <StopNumber n={j.stop!} state={stopState(j)} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate t-body font-medium text-ink">{j.customerName}</span>
                      <span className="truncate t-small text-ink-2">
                        {j.address.replace(/, Uyo$/, "")}
                        {j.completedAt ? ` · ${formatTime(j.completedAt)}` : j.failReason ? ` · ${j.failReason}` : ""}
                      </span>
                    </span>
                    {isLate(j) ? <Badge tone="danger" dot>Late</Badge> : <StatusBadge status={j.status} />}
                  </Link>
                </li>
              ))}
              {pending.map((j, i) => {
                const n = locked.length + i + 1;
                return (
                  <li key={j.id} className="flex items-center gap-3 py-2.5">
                    <StopNumber n={n} state="upcoming" />
                    <Link to={`/operator/jobs/${j.id}`} className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate t-body font-medium text-ink">{j.customerName}</span>
                      <span className="truncate t-small text-ink-2">
                        {j.address.replace(/, Uyo$/, "")} · <span className="tnum">{j.window}</span>
                        {isLate(j) && <span className="text-danger"> · late</span>}
                      </span>
                    </Link>
                    <div className="flex shrink-0 gap-1">
                      <IconButton label={`Move ${j.customerName} up`} variant="outline" disabled={i === 0} onClick={() => move(i, -1)}>
                        <ArrowUp />
                      </IconButton>
                      <IconButton label={`Move ${j.customerName} down`} variant="outline" disabled={i === pending.length - 1} onClick={() => move(i, 1)}>
                        <ArrowDown />
                      </IconButton>
                    </div>
                  </li>
                );
              })}
            </ol>
            {pending.length === 0 && <p className="py-6 text-center t-small text-ink-3">Every stop on this route has been attempted.</p>}
          </div>
        </Section>

        <section className="flex flex-col gap-3 lg:col-start-1 lg:row-start-2">
          <h2 className="t-h3 text-ink">Crew</h2>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="t-body font-medium text-ink">{route.driver}</p>
              <p className="t-small text-ink-2">
                <span className="font-mono">{route.vehicle}</span> · {driver?.status ?? "On shift"} · rated {driver?.rating}
              </p>
            </div>
            <a href={`tel:${driver?.phone.replace(/\s/g, "")}`} className="inline-flex h-11 shrink-0 items-center rounded-md border border-line-strong bg-surface px-4 text-[14px] font-medium text-ink hover:bg-sunken">
              Call {route.driver.split(" ")[0]}
            </a>
          </div>
          <p className="t-small text-ink-3">Areas: {route.areas.length ? route.areas.join(", ") : "Estate collection points across all three estates"}.</p>
        </section>
      </div>

      {dirty && (
        <div className="fixed inset-x-3 bottom-[calc(max(12px,env(safe-area-inset-bottom))+76px)] z-40 flex items-center gap-2 rounded-lg border border-line-strong bg-surface p-2 pl-4 shadow-float animate-toast-in sm:inset-x-auto sm:left-1/2 sm:w-[480px] sm:-translate-x-1/2 lg:bottom-6 lg:left-[calc(50%+128px)]">
          <span className="min-w-0 flex-1 t-small font-medium text-ink">Order changed</span>
          <Button variant="ghost" leading={<Undo2 className="size-4" />} onClick={() => setOrder(initialOrder)}>
            Reset
          </Button>
          <Button onClick={publish}>Publish to driver</Button>
        </div>
      )}
      {dirty && <div className="h-20" aria-hidden />}
    </Page>
  );
}
