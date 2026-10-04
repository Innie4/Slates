import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Check, MapPin, MessageSquareWarning, Package, Plus, Star, Truck, CreditCard, Recycle } from "lucide-react";
import { CleanSlate } from "@/components/brand/CleanSlate";
import { RouteMap } from "@/components/brand/RouteMap";
import {
  Alert, Badge, Button, ButtonLink, LiveDot, List, ListRow, Modal, Page, ProgressBar, Section, StatusBadge, Textarea, useToast,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { communityProjects, me, myComplaints, myPayments, myPickups, operatorById } from "@/data";
import { DEMO_NOW, formatDate, formatDay, formatNaira, formatRelative, formatTime, formatWeekday } from "@/lib/format";

const STOPS = [0.18, 0.4, 0.78];

/**
 * Customer home — the core screen (DIRECTION.md §2, §6).
 * The first thing is today's collection, live. When the truck reaches the
 * address, the slate is wiped clean (signature interaction).
 */
export default function Dashboard() {
  const today = myPickups[0]!;
  const next = myPickups[1]!;
  const bulk = myPickups[2]!;
  const operator = operatorById(today.operatorId)!;
  const [progress, setProgress] = useState(0.62);
  const [collected, setCollected] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);

  // Demo: the truck advances along the route, then the pickup completes.
  useEffect(() => {
    if (collected) return;
    const start = setTimeout(() => {
      const t = setInterval(() => {
        setProgress((p) => {
          const n = Math.min(1, +(p + 0.055).toFixed(3));
          if (n >= 1) {
            clearInterval(t);
            setTimeout(() => setCollected(true), 500);
          }
          return n;
        });
      }, 1300);
    }, 2600);
    return () => clearTimeout(start);
  }, [collected]);

  const stopsAway = STOPS.filter((s) => s > progress).length + (progress < 1 ? 1 : 0);
  const minutes = Math.max(1, Math.round((1 - progress) * 24));
  const lastPaid = myPayments[0]!;
  const pending = myPayments.find((p) => p.status === "Pending");
  const project = communityProjects[0]!;
  const activity = [
    { kind: "Payment", title: `${formatNaira(lastPaid.amount)} paid`, sub: lastPaid.service, time: lastPaid.date, to: "/app/payments", status: lastPaid.status },
    { kind: "Report", title: myComplaints[1]!.issue, sub: `${myComplaints[1]!.id} · ${myComplaints[1]!.operatorName}`, time: myComplaints[1]!.created, to: `/app/complaints/${myComplaints[1]!.id}`, status: myComplaints[1]!.status },
    { kind: "Pickup", title: "Collected at 07:42", sub: `${formatDay(myPickups[3]!.date)} · ${myPickups[3]!.service}`, time: myPickups[3]!.completedAt!, to: `/app/pickups/${myPickups[3]!.id}`, status: "Completed" },
    { kind: "Pickup", title: "No collection — public holiday", sub: `${formatDay(myPickups[9]!.date)} · Independence Day`, time: myPickups[9]!.date, to: `/app/pickups/${myPickups[9]!.id}`, status: "Cancelled" },
  ].sort((a, b) => b.time.localeCompare(a.time));

  return (
    <Page className="gap-8 md:gap-10">
      {/* Context line instead of a greeting: the date and the place */}
      <div className="flex flex-col gap-1">
        <p className="t-small text-ink-3">{DEMO_NOW.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
        <p className="flex items-center gap-1.5 t-body font-medium text-ink">
          <MapPin className="size-4 text-ink-3" />
          {me.household.address}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-10">
        {/* LEFT COLUMN */}
        <div className="flex min-w-0 flex-col gap-8 md:gap-10">
          {/* Hero: today's collection */}
          <CleanSlate
            done={collected}
            className="rounded-xl"
            after={
              <div className="flex h-full flex-col justify-between gap-8 rounded-xl border border-line bg-surface p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <Badge tone="success" icon={<Check strokeWidth={3} />}>Collected</Badge>
                  <span className="t-mono text-ink-3">{today.id}</span>
                </div>
                <div>
                  <p className="t-display-xl text-ink">Clean slate.</p>
                  <p className="mt-4 t-body text-ink-2">
                    Collected at <span className="font-semibold text-ink tnum">08:19</span> by {today.driver.split(" ")[0]} from {operator.short}. Next collection is{" "}
                    <span className="font-semibold text-ink">{formatWeekday(next.date)}, {next.window}</span>.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button leading={<Star className="size-4" />} onClick={() => setRateOpen(true)}>
                    Rate this pickup
                  </Button>
                  <ButtonLink to="/app/report-missed" variant="ghost">
                    Something wasn't right
                  </ButtonLink>
                </div>
              </div>
            }
          >
            <section aria-label="Today's collection" className="relative isolate flex min-h-[460px] flex-col overflow-hidden rounded-xl bg-slate text-slate-ink chalk-grain sm:min-h-[420px]">
              <RouteMap progress={progress} stops={STOPS} className="absolute inset-0 h-full w-full opacity-95" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-slate from-40% via-slate/80 to-transparent" />
              <div className="relative flex flex-col gap-3 p-6 sm:p-8">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 items-center gap-2 rounded-sm bg-signal px-2.5 text-[12px] font-semibold text-signal-ink">
                    <LiveDot className="[&>span]:bg-signal-ink" />
                    On the way
                  </span>
                  <span className="t-small text-slate-ink/70">{today.service}</span>
                </div>
                <h1 className="t-display-xl">Today</h1>
                <p className="t-body text-slate-ink/85">
                  <span className="font-semibold text-slate-ink tnum">{today.window}</span>
                  <span className="mx-2 text-slate-ink/40">·</span>
                  {progress < 1 ? (
                    <span className="tnum">
                      {stopsAway} {stopsAway === 1 ? "stop" : "stops"} away, about {minutes} min
                    </span>
                  ) : (
                    "Arriving now"
                  )}
                </p>
              </div>
              <div className="relative mt-auto flex items-end justify-between gap-4 p-6 sm:p-8">
                <div className="rounded-md bg-slate-950/55 px-3 py-2 backdrop-blur">
                  <p className="text-[13px] font-semibold">{today.driver}</p>
                  <p className="t-mono text-[12px] text-slate-ink/70">{today.vehicle} · {operator.short}</p>
                </div>
                <Link
                  to={`/app/pickups/${today.id}`}
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-slate-ink px-4 text-[14px] font-semibold text-slate-950 transition hover:bg-white"
                >
                  Track <ArrowRight className="size-4" />
                </Link>
              </div>
            </section>
          </CleanSlate>

          {/* Actions in context — not tinted chips */}
          <nav aria-label="Quick actions" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Extra pickup", to: "/app/extra-pickup", icon: Plus },
              { label: "Report missed", to: "/app/report-missed", icon: MessageSquareWarning },
              { label: "Bulk waste", to: "/app/bulk-waste", icon: Package },
              { label: "Pay or top up", to: "/app/payments", icon: CreditCard },
            ].map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="group flex items-center gap-3 rounded-md border border-line bg-surface px-3.5 py-3.5 transition-colors hover:border-line-strong hover:bg-sunken/50"
              >
                <a.icon className="size-[18px] shrink-0 text-ink-2 group-hover:text-ink" strokeWidth={1.75} />
                <span className="t-small font-medium text-ink">{a.label}</span>
              </Link>
            ))}
          </nav>

          <Section title="Coming up" actions={<Link to="/app/pickups" className="t-small font-medium text-ink-2 hover:text-ink">All pickups</Link>}>
            <List>
              {[next, bulk].map((p) => (
                <ListRow
                  key={p.id}
                  to={`/app/pickups/${p.id}`}
                  leading={
                    <div className="flex w-12 flex-col items-center rounded-md bg-sunken py-1.5">
                      <span className="t-micro uppercase text-ink-3">{new Date(p.date).toLocaleDateString("en-GB", { weekday: "short" })}</span>
                      <span className="font-display text-[20px] font-bold leading-none text-ink tnum">{new Date(p.date).getDate()}</span>
                    </div>
                  }
                  title={p.service}
                  subtitle={`${p.window}${p.note ? ` · ${p.note}` : ""}`}
                  trailing={<StatusBadge status={p.status} />}
                />
              ))}
            </List>
          </Section>

          <Section title="Recent activity">
            <List>
              {activity.map((a, i) => (
                <ListRow
                  key={i}
                  to={a.to}
                  title={a.title}
                  subtitle={a.sub}
                  meta={formatRelative(a.time)}
                  trailing={<StatusBadge status={a.status} />}
                />
              ))}
            </List>
          </Section>
        </div>

        {/* RIGHT COLUMN */}
        <aside className="flex min-w-0 flex-col gap-8">
          {pending && (
            <Alert tone="warning" title="Bulk pickup deposit pending">
              {formatNaira(pending.amount)} is being confirmed by your bank. Your Saturday booking is held.
            </Alert>
          )}

          <section className="flex flex-col gap-4 border-b border-line pb-8">
            <div className="flex items-center justify-between">
              <h2 className="t-h2 text-ink">Payment</h2>
              <Link to="/app/payment-methods" className="t-small font-medium text-ink-2 hover:text-ink">Manage</Link>
            </div>
            <p className="t-body text-ink-2">
              <span className="font-semibold text-ink">{formatNaira(lastPaid.amount)}</span> paid on {formatDate(lastPaid.date).replace(/ \d{4}$/, "")}. Next charge of{" "}
              <span className="font-semibold text-ink">{formatNaira(me.household.monthly)}</span> on 1 Nov to {me.household.card.brand} •• {me.household.card.last4}.
            </p>
            <div className="flex gap-2">
              <ButtonLink to="/app/receipts" variant="secondary" size="sm">Receipts</ButtonLink>
              <ButtonLink to="/app/smart-sweep" variant="ghost" size="sm">Split into smaller charges</ButtonLink>
            </div>
          </section>

          <section className="flex flex-col gap-4 border-b border-line pb-8">
            <div className="flex items-center justify-between">
              <h2 className="t-h2 text-ink">Your plan</h2>
              <Link to="/app/subscriptions" className="t-small font-medium text-ink-2 hover:text-ink">Change</Link>
            </div>
            <div className="flex items-start gap-3">
              <Truck className="mt-0.5 size-5 shrink-0 text-ink-3" strokeWidth={1.75} />
              <div>
                <p className="t-body font-medium text-ink">
                  {me.household.plan} · {formatNaira(me.household.monthly)}/month
                </p>
                <p className="t-small text-ink-2">
                  {me.household.frequency}, {me.household.window}. Collected by {operator.short} for Slate.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-line bg-line text-center">
              {[
                ["24", "collected"],
                ["1", "missed, recovered"],
                ["98%", "on time"],
              ].map(([v, l]) => (
                <div key={l} className="bg-surface px-2 py-3">
                  <p className="font-display text-[22px] font-bold leading-none text-ink tnum">{v}</p>
                  <p className="mt-1 t-micro text-ink-3">{l}</p>
                </div>
              ))}
            </div>
          </section>

          <Link to={`/app/community/${project.id}`} className="group flex flex-col gap-3 border-b border-line pb-8">
            <div className="flex items-center justify-between">
              <h2 className="t-h2 text-ink">Community</h2>
              <ArrowRight className="size-4 text-ink-3 transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="t-body font-medium text-ink">{project.title}</p>
            <ProgressBar value={project.raised} max={project.target} label="Funding progress" />
            <p className="t-small text-ink-2 tnum">
              {formatNaira(project.raised)} of {formatNaira(project.target)} · {project.contributors} neighbours · you gave ₦2,500
            </p>
          </Link>

          <Link to="/app/recycling" className="group flex items-start gap-3">
            <Recycle className="mt-0.5 size-5 shrink-0 text-ink-3" strokeWidth={1.75} />
            <div className="flex-1">
              <p className="t-body font-medium text-ink">Recyclables pickup on Tue 13 Oct</p>
              <p className="t-small text-ink-2">38 kg recovered from your home this year — mostly PET and cans.</p>
            </div>
            <ArrowRight className="mt-1 size-4 text-ink-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </aside>
      </div>

      <RateModal open={rateOpen} onClose={() => setRateOpen(false)} when={`Today, ${formatTime(new Date(DEMO_NOW.getTime() + 7 * 60000))}`} />
    </Page>
  );
}

/** C26 — rating after a completed service. */
export function RateModal({ open, onClose, when }: { open: boolean; onClose: () => void; when: string }) {
  const toast = useToast();
  const [overall, setOverall] = useState(0);
  const [cats, setCats] = useState<Record<string, number>>({ "Service quality": 0, Punctuality: 0, Professionalism: 0 });
  const [comment, setComment] = useState("");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="How was today's collection?"
      description={`Collected ${when}. Ratings go to Slate, who manage the operator's performance.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Not now</Button>
          <Button
            disabled={!overall}
            onClick={() => {
              onClose();
              toast.success("Thanks — rating sent", "It helps us keep operators to the standard you pay for.");
            }}
          >
            Send rating
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6 pb-2">
        <Stars value={overall} onChange={setOverall} size="lg" label="Overall" />
        <div className="flex flex-col divide-y divide-line border-y border-line">
          {Object.keys(cats).map((k) => (
            <div key={k} className="flex items-center justify-between gap-4 py-3">
              <span className="t-small text-ink">{k}</span>
              <Stars value={cats[k]!} onChange={(v) => setCats((c) => ({ ...c, [k]: v }))} label={k} />
            </div>
          ))}
        </div>
        <Textarea label="Comment" optional rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What went well, or what should change?" />
      </div>
    </Modal>
  );
}

export function Stars({ value, onChange, size = "md", label }: { value: number; onChange?: (v: number) => void; size?: "md" | "lg"; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange?.(n)}
          className={cn("rounded-sm transition-transform active:scale-90", size === "lg" ? "p-1" : "p-0.5")}
        >
          <Star className={cn(size === "lg" ? "size-9" : "size-5", n <= value ? "fill-ink text-ink" : "text-line-strong")} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}
