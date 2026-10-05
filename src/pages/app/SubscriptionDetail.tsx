import { useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowRight, CreditCard, MoreHorizontal, Pause, Pencil, Play, RotateCcw, XCircle } from "lucide-react";
import {
  Alert, BarChart, Button, ButtonLink, DescriptionList, IconButton, List, ListRow, Menu, Page, PageHeader, Ref, StatusBadge, type MenuItem,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatDate, formatDay, formatNaira } from "@/lib/format";
import { myComplaints, myPickups, operatorById } from "@/data";
import { DateTile, dayLabel, joinDays, NotFound, OperatorLine, SubscriptionDialogs, WeekStrip, type SubDialog } from "./_core";
import { subById, type Subscription } from "./_subs";

/** C7 — one subscription: service, schedule, billing, and how well it's been delivered. */
export default function SubscriptionDetail() {
  const { id = "" } = useParams();
  const initial = subById(id);
  if (!initial) return <NotFound title="We couldn't find that subscription" description={`No subscription matches “${id}” on your account.`} back={{ to: "/app/subscriptions", label: "All subscriptions" }} />;
  return <Detail key={initial.id} initial={initial} />;
}

function Detail({ initial }: { initial: Subscription }) {
  const [s, setS] = useState(initial);
  const [dialog, setDialog] = useState<SubDialog>(null);
  const op = s.operatorId ? operatorById(s.operatorId) : undefined;
  const isHome = s.id === "sub-1";
  const pickups = isHome ? myPickups.filter((p) => p.service === "Slate Home").sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6) : [];
  const perf = s.performance;

  const more: MenuItem[] = [
    ...(s.status !== "Cancelled" ? [{ label: "Change payment method", icon: <CreditCard />, onSelect: () => setDialog("payment") }] : []),
    ...(s.status !== "Cancelled" ? [{ label: "Cancel subscription", icon: <XCircle />, danger: true, onSelect: () => setDialog("cancel") }] : []),
  ];

  return (
    <Page>
      <PageHeader
        back={{ to: "/app/subscriptions", label: "Subscriptions" }}
        eyebrow={<Ref className="text-ink-3">{s.ref}</Ref>}
        title={s.service}
        meta={<StatusBadge status={s.status} size="md" />}
        description={`${s.property} · ${s.address}`}
        actions={
          <>
            {s.status === "Paused" && <Button leading={<Play className="size-4" />} onClick={() => setDialog("resume")}>Resume</Button>}
            {(s.status === "Active" || s.status === "Pending") && (
              <Button variant="secondary" leading={<Pencil className="size-4" />} onClick={() => setDialog("modify")}>Modify</Button>
            )}
            {s.status === "Active" && <Button variant="ghost" leading={<Pause className="size-4" />} onClick={() => setDialog("pause")}>Pause</Button>}
            {s.status === "Cancelled" && <ButtonLink to={`/app/book?service=${s.serviceId}`} variant="secondary" leading={<RotateCcw className="size-4" />}>Book again</ButtonLink>}
            {more.length > 0 && (
              <Menu
                items={more}
                trigger={(p) => (
                  <IconButton label="More actions" variant="outline" {...p} className="!flex-none">
                    <MoreHorizontal />
                  </IconButton>
                )}
              />
            )}
          </>
        }
      />

      {s.status === "Pending" && (
        <Alert tone="info" title="Starts Tue 13 Oct, 14:00–16:00">
          Slate assigns a verified operator by Mon 12 Oct and delivers three sorting sacks the day before. Nothing is charged until the first pickup.
        </Alert>
      )}
      {s.status === "Paused" && (
        <Alert tone="warning" title={s.statusNote} action={<Button size="sm" variant="secondary" onClick={() => setDialog("resume")}>Resume</Button>}>
          No collections and no charges while paused. Resuming keeps your Saturday route slot with {s.operator}.
        </Alert>
      )}
      {s.status === "Cancelled" && (
        <Alert tone="neutral" title={s.statusNote}>
          Reason given: {s.cancelReason?.toLowerCase()}. {s.history[0]?.status === "Refunded" ? s.history[0].note : "Nothing further will be charged."}
        </Alert>
      )}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-10">
          {/* Schedule */}
          <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="t-h2 text-ink">Schedule</h2>
              <p className="t-small text-ink-2 tnum">
                {s.frequency} · {joinDays(s.days)}, {s.window}
              </p>
            </div>
            <WeekStrip days={s.days} window={s.window} live={s.status === "Active" && isHome ? "Mon" : undefined} className={cn(s.status !== "Active" && s.status !== "Pending" && "opacity-60")} />
            <p className="t-small text-ink-2">
              {s.status === "Cancelled"
                ? "This schedule ended when the subscription was cancelled."
                : s.status === "Paused"
                  ? "Held for you while paused."
                  : `Bin at the gate by ${s.window.slice(0, 5)}. The crew comes any time in the window.`}
            </p>
            {s.nextPickup && (
              <Link
                to={s.nextPickupId ? `/app/pickups/${s.nextPickupId}` : "/app/pickups"}
                className="group flex items-center gap-4 rounded-md border border-line bg-surface p-3.5 transition-colors hover:border-line-strong"
              >
                <DateTile date={s.nextPickup} live={s.nextPickupId === "PU-26-08813"} />
                <div className="min-w-0 flex-1">
                  <p className="t-micro text-ink-3">Next pickup</p>
                  <p className="t-body font-medium text-ink">
                    {dayLabel(s.nextPickup)}, {s.window}
                    {s.nextPickupId === "PU-26-08813" && <span className="text-ink-2"> · on the way, 2 stops away</span>}
                  </p>
                </div>
                <ArrowRight className="size-4 text-ink-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </section>

          {/* Performance */}
          {perf && (
            <section className="flex flex-col gap-5">
              <div>
                <h2 className="t-h2 text-ink">Performance</h2>
                <p className="t-small mt-1 text-ink-2">Since {perf.since}. Slate holds the operator to this — not you.</p>
              </div>
              <div className="grid grid-cols-3 divide-x divide-line border-y border-line">
                {[
                  { v: perf.completed, l: "Completed pickups", sub: `of ${perf.scheduled} scheduled` },
                  { v: perf.missed, l: "Missed pickups", sub: perf.missed ? "recovered next day" : "none" },
                  { v: perf.complaints, l: "Complaints", sub: perf.complaints ? "1 resolved, 1 open" : "none" },
                ].map((x, i) => (
                  <div key={x.l} className={cn("flex flex-col gap-1 py-4", i === 0 ? "pr-3" : "px-3 sm:px-5")}>
                    <span className="font-display text-[34px] font-bold leading-none tracking-[-0.02em] text-ink tnum">{x.v}</span>
                    <span className="t-small font-medium text-ink">{x.l}</span>
                    <span className="t-micro text-ink-3">{x.sub}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="t-small font-medium text-ink">Pickups per week, last 12 weeks</p>
                  <div className="flex gap-4 t-micro text-ink-2">
                    <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] bg-slate dark:bg-slate-400" /> Completed</span>
                    <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] bg-danger/80" /> Missed</span>
                  </div>
                </div>
                <BarChart
                  data={perf.done}
                  stacked={perf.missedByWeek}
                  labels={perf.weeks}
                  height={140}
                  label={`Completed pickups per week since ${perf.since}: ${perf.done.join(", ")}. Missed: ${perf.missedByWeek.join(", ")}.`}
                  format={(v) => `${v} pickup${v === 1 ? "" : "s"}`}
                />
                <p className="t-micro text-ink-3">
                  {isHome
                    ? "Weeks starting 13 Jul – 28 Sep. Week of 17 Aug includes an extra pickup; week of 28 Sep had the Independence Day holiday."
                    : "Weeks starting 20 Apr – 6 Jul, before the pause."}
                </p>
              </div>
              {isHome && (
                <List>
                  {myComplaints.map((c) => (
                    <ListRow key={c.id} to={`/app/complaints/${c.id}`} title={c.issue} subtitle={`${c.id} · ${formatDate(c.created)}`} trailing={<StatusBadge status={c.status} />} />
                  ))}
                </List>
              )}
            </section>
          )}

          {pickups.length > 0 && (
            <section className="flex flex-col gap-2">
              <div className="flex items-end justify-between">
                <h2 className="t-h2 text-ink">Recent pickups</h2>
                <Link to="/app/pickups" className="t-small font-medium text-ink-2 hover:text-ink">All pickups</Link>
              </div>
              <List>
                {pickups.map((p) => (
                  <ListRow
                    key={p.id}
                    to={`/app/pickups/${p.id}`}
                    leading={<DateTile date={p.date} live={p.status === "En route"} muted={p.status === "Cancelled"} />}
                    title={p.status === "Completed" && p.completedAt ? `Collected ${new Date(p.completedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : p.status === "En route" ? "On the way" : p.status === "Cancelled" ? "No collection" : p.status === "Missed" ? "Missed — recovered" : p.window}
                    subtitle={`${p.id} · ${p.note ?? `${p.operatorName}${p.operatorId !== "op-ufok" ? " (recovery crew)" : ""}`}`}
                    trailing={<StatusBadge status={p.status} />}
                  />
                ))}
              </List>
            </section>
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-10">
          <section className="flex flex-col gap-4">
            <h2 className="t-h2 text-ink">Service</h2>
            <DescriptionList
              columns={1}
              dense
              items={[
                { label: "Type", value: `${s.service} · ${s.frequency.toLowerCase()}` },
                {
                  label: "Operator",
                  value: (
                    <span className="flex flex-col">
                      <OperatorLine name={s.operator} />
                      {op && <span className="t-small text-ink-3">Verified and contracted by Slate · rated {op.rating.toFixed(1)}</span>}
                    </span>
                  ),
                },
                { label: "Address", value: <span className="flex flex-col">{s.address}{s.landmark && <span className="t-small text-ink-3">{s.landmark}</span>}</span> },
                { label: "Frequency", value: `${joinDays(s.days)}, ${s.window}` },
                { label: s.serviceId === "svc-recycling" ? "Containers" : "Bins", value: s.bins ? `${s.bins} × 240-litre Slate bin${s.bins > 1 ? "s" : ""}` : "3 sorting sacks (PET, cans, paper)" },
                { label: s.status === "Pending" ? "Starts" : "Started", value: formatDate(s.started) },
              ]}
            />
          </section>

          <section className="flex flex-col gap-4 border-t border-line pt-8">
            <div className="flex items-end justify-between gap-3">
              <h2 className="t-h2 text-ink">Billing</h2>
              {s.status !== "Cancelled" && (
                <button type="button" onClick={() => setDialog("payment")} className="t-small font-medium text-ink-2 hover:text-ink">
                  Change method
                </button>
              )}
            </div>
            <div>
              <p className="flex items-baseline gap-1">
                <span className="font-display text-[34px] font-bold leading-none tracking-[-0.02em] text-ink tnum">{formatNaira(s.price)}</span>
                <span className="t-body text-ink-3">/month</span>
              </p>
              <p className="mt-1.5 t-small text-ink-2">
                {s.nextPayment ? (
                  <>
                    Next charge <span className="font-medium text-ink">{formatDay(s.nextPayment)}</span> to {s.paymentMethod}.{" "}
                    {s.serviceId === "svc-recycling" ? "Billed on the 13th." : "Billed on the 1st."}
                  </>
                ) : (
                  <>Nothing scheduled · {s.paymentMethod} on file</>
                )}
              </p>
            </div>
            <div className="flex flex-col">
              <p className="t-micro text-ink-3">Payment history</p>
              {s.history.length === 0 ? (
                <p className="py-3 t-small text-ink-3">No payments yet. The first is taken on the start date.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {s.history.map((h) => (
                    <li key={h.ref} className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="t-small font-medium text-ink">{h.label}</p>
                        <p className="t-micro text-ink-3">
                          <span className="font-mono">{h.ref}</span> · {formatDate(h.date)} · {h.method}
                        </p>
                        {h.note && <p className="t-micro text-ink-3">{h.note}</p>}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className={cn("t-small font-medium tnum", h.status === "Failed" ? "text-ink-3 line-through" : "text-ink")}>{formatNaira(h.amount)}</span>
                        <StatusBadge status={h.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/app/receipts" className="mt-2 inline-flex w-fit items-center gap-1.5 t-small font-medium text-ink-2 hover:text-ink">
                All receipts <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </section>
        </aside>
      </div>

      <SubscriptionDialogs
        sub={s}
        dialog={dialog}
        onClose={() => setDialog(null)}
        onUpdate={(_, patch) => setS((x) => ({ ...x, ...patch }))}
      />
    </Page>
  );
}
