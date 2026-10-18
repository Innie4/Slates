import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Link } from "react-router";
import { ArrowRight, CreditCard, MoreHorizontal, Pause, Pencil, Play, Plus, RotateCcw, XCircle } from "lucide-react";
import {
  Button, ButtonLink, EmptyState, IconButton, Menu, Page, PageHeader, StatusBadge, Tabs, useTab, type MenuItem,
} from "@/components/ui";
import { formatDate, formatNaira } from "@/lib/format";
import { DateTile, dayLabel, joinDays, OperatorLine, SubscriptionDialogs, type SubDialog } from "./_core";
import { SUBSCRIPTIONS, type SubStatus, type Subscription } from "./_subs";

type TabKey = "active" | "pending" | "paused" | "cancelled";
const TAB_STATUS: Record<TabKey, SubStatus> = { active: "Active", pending: "Pending", paused: "Paused", cancelled: "Cancelled" };

/** C6, everything the customer pays Slate for, by state. */
export default function Subscriptions() {
  const [subs, setSubs] = useState<Subscription[]>(SUBSCRIPTIONS);
  const tab = useTab<TabKey>("tab", "active");
  const [dialog, setDialog] = useState<{ id: string; kind: SubDialog } | null>(null);
  const update = (id: string, patch: Partial<Subscription>) => setSubs((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const count = (k: TabKey) => subs.filter((s) => s.status === TAB_STATUS[k]).length;
  const shown = subs.filter((s) => s.status === TAB_STATUS[tab]);
  const active = subs.filter((s) => s.status === "Active");
  const monthly = active.reduce((a, s) => a + s.price, 0);
  const pending = subs.filter((s) => s.status === "Pending");
  const open = (id: string, kind: SubDialog) => setDialog({ id, kind });
  const charges = subs
    .filter((x) => x.nextPayment && (x.status === "Active" || x.status === "Pending"))
    .flatMap((x) => {
      const first = new Date(x.nextPayment!);
      const second = new Date(first);
      second.setMonth(second.getMonth() + 1);
      return [first, second].map((d, i) => ({
        key: `${x.id}-${i}`,
        date: d,
        service: x.service,
        amount: x.price,
        note: `${x.paymentMethod} · ${x.status === "Pending" && i === 0 ? "first charge, on the start date" : i === 0 ? "monthly, on the " + (d.getDate() === 1 ? "1st" : `${d.getDate()}th`) : "the month after"}`,
      }));
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 4);

  return (
    <Page>
      <PageHeader
        title="Subscriptions"
        description={
          <>
            You pay Slate <span className="font-semibold text-ink tnum">{formatNaira(monthly)}</span> a month for {active.length === 1 ? "one active service" : `${active.length} active services`}
            {pending.length > 0 && (
              <>
                . {pending[0]!.service} adds <span className="font-semibold text-ink tnum">{formatNaira(pending[0]!.price)}</span> from Tue 13 Oct
              </>
            )}
            . One payment, one support line, whoever collects.
          </>
        }
        actions={<ButtonLink to="/app/services" leading={<Plus className="size-4" />}>Add a service</ButtonLink>}
      />

      <div className="flex flex-col gap-6">
        <Tabs<TabKey>
          param="tab"
          items={[
            { value: "active", label: "Active", count: count("active") },
            { value: "pending", label: "Pending", count: count("pending") },
            { value: "paused", label: "Paused", count: count("paused") },
            { value: "cancelled", label: "Cancelled", count: count("cancelled") },
          ]}
        />

        {shown.length === 0 ? (
          <EmptyState
            title={tab === "active" ? "No active services" : tab === "pending" ? "Nothing waiting to start" : tab === "paused" ? "Nothing paused" : "Nothing cancelled"}
            description={
              tab === "active"
                ? "Choose a service and Slate arranges a verified operator for your address."
                : tab === "pending"
                  ? "New bookings show here until their first pickup."
                  : tab === "paused"
                    ? "Pause a subscription when you travel or the house is empty, no charges while paused."
                    : "Cancelled subscriptions stay here for your records."
            }
            action={tab === "active" || tab === "pending" ? <ButtonLink to="/app/services" variant="secondary">Browse services</ButtonLink> : undefined}
            compact
          />
        ) : (
          <div className="flex flex-col gap-4">
            {shown.map((s) => (
              <SubCard key={s.id} s={s} onAction={(k) => open(s.id, k)} />
            ))}
          </div>
        )}
      </div>

      {charges.length > 0 && (
        <section className="flex flex-col gap-3 border-t border-line pt-8">
          <div>
            <h2 className="t-h2 text-ink">Next charges</h2>
            <p className="t-small mt-1 text-ink-2">Taken automatically. Slate pays the operator, you never pay at the gate.</p>
          </div>
          <ul className="divide-y divide-line border-y border-line">
            {charges.map((c) => (
              <li key={c.key} className="flex items-center gap-4 py-3">
                <DateTile date={c.date} />
                <div className="min-w-0 flex-1">
                  <p className="t-body font-medium text-ink">{c.service}</p>
                  <p className="t-small text-ink-2">{c.note}</p>
                </div>
                <span className="t-body font-semibold text-ink tnum">{formatNaira(c.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <SubscriptionDialogs sub={subs.find((s) => s.id === dialog?.id)} dialog={dialog?.kind ?? null} onClose={() => setDialog(null)} onUpdate={update} />
    </Page>
  );
}

function SubCard({ s, onAction }: { s: Subscription; onAction: (k: SubDialog) => void }) {
  const more: MenuItem[] = [
    ...(s.status !== "Cancelled" ? [{ label: "Change payment method", icon: <CreditCard />, onSelect: () => onAction("payment") }] : []),
    ...(s.status === "Active" ? [{ label: "Pause", icon: <Pause />, onSelect: () => onAction("pause") }] : []),
    ...(s.status !== "Cancelled" ? [{ divider: true, label: "" }, { label: "Cancel subscription", icon: <XCircle />, danger: true, onSelect: () => onAction("cancel") }] : []),
  ];
  const isToday = s.nextPickupId === "PU-26-08813";
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface">
      <header className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <Link to={`/app/subscriptions/${s.id}`} className="t-h3 text-ink hover:underline hover:underline-offset-4">{s.service}</Link>
            <StatusBadge status={s.status} />
          </div>
          <p className="mt-1 t-small text-ink-2">
            <span className="text-ink-3">{s.property} · </span>
            {s.address}
          </p>
        </div>
        <p className="shrink-0 text-right">
          <span className="font-display text-[22px] font-bold leading-none text-ink tnum">{formatNaira(s.price)}</span>
          <span className="block t-micro text-ink-3">per month</span>
        </p>
      </header>

      <div className="px-5 py-5 sm:px-6">
        <p className="mb-4 t-small text-ink-2">{s.statusNote}</p>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-[1.3fr_1.2fr_1fr_1.1fr]">
          <Item label="Operator" className="col-span-2 lg:col-span-1">
            <OperatorLine name={s.operator} />
          </Item>
          <Item label="Schedule" className="col-span-2 sm:col-span-1">
            {s.frequency} · {joinDays(s.days)}, <span className="whitespace-nowrap tnum">{s.window}</span>
          </Item>
          <Item label="Next pickup">
            {s.nextPickup ? (
              isToday ? (
                <Link to="/app/pickups/PU-26-08813" className="inline-flex items-center gap-1.5 font-medium text-ink hover:underline">
                  <span className="size-1.5 rounded-full bg-signal" aria-hidden /> Today, on the way
                </Link>
              ) : (
                dayLabel(s.nextPickup)
              )
            ) : (
              <span className="text-ink-3">{s.status === "Cancelled" ? `Ended ${s.cancelledOn ? formatDate(s.cancelledOn).replace(/ \d{4}$/, "") : ""}` : "None while paused"}</span>
            )}
          </Item>
          <Item label="Next payment">
            {s.nextPayment ? (
              <span className="tnum">
                {formatNaira(s.price)} on {formatDate(s.nextPayment).replace(/ \d{4}$/, "")}
                <span className="block text-ink-3">{s.paymentMethod}</span>
              </span>
            ) : (
              <span className="text-ink-3">
                None scheduled<span className="block">{s.paymentMethod} on file</span>
              </span>
            )}
          </Item>
        </dl>
      </div>

      <footer className="mt-auto flex items-center gap-2 border-t border-line px-5 py-3 sm:px-6">
        {s.status === "Paused" && (
          <Button size="sm" leading={<Play className="size-3.5" />} onClick={() => onAction("resume")}>Resume</Button>
        )}
        {s.status === "Cancelled" && (
          <ButtonLink size="sm" variant="secondary" to={`/app/book?service=${s.serviceId}`} leading={<RotateCcw className="size-3.5" />}>Book again</ButtonLink>
        )}
        <ButtonLink size="sm" variant={s.status === "Active" || s.status === "Pending" ? "secondary" : "ghost"} to={`/app/subscriptions/${s.id}`} trailing={<ArrowRight className="size-3.5" />}>
          View
        </ButtonLink>
        {(s.status === "Active" || s.status === "Pending") && (
          <Button size="sm" variant="ghost" leading={<Pencil className="size-3.5" />} onClick={() => onAction("modify")}>Modify</Button>
        )}
        {s.status === "Active" && (
          <Button size="sm" variant="ghost" leading={<Pause className="size-3.5" />} onClick={() => onAction("pause")} className="max-sm:hidden">Pause</Button>
        )}
        {more.length > 0 && (
          <Menu
            className="ml-auto"
            items={more}
            trigger={(p) => (
              <IconButton label="More actions" size="sm" {...p}>
                <MoreHorizontal />
              </IconButton>
            )}
          />
        )}
      </footer>
    </article>
  );
}

function Item({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      <dt className="t-micro text-ink-3">{label}</dt>
      <dd className="t-small text-ink">{children}</dd>
    </div>
  );
}
