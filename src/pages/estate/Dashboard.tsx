import { useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Building2, Send } from "lucide-react";
import { Button, ButtonLink, List, ListRow, Page, Section, StackedBar, StatusBadge } from "@/components/ui";
import { me } from "@/data";
import { DEMO_NOW, formatDate, formatNaira } from "@/lib/format";
import { ComplaintDrawer, ComplaintRow, DateTile, SlaRows, TextLink, isOpen } from "../_org/shared";
import { ESTATE, billing, blockStats, collections, complaintsSeed, owing, properties } from "./_data";
import { BlockRunHero, ReminderModal, UpdateResidentsModal } from "./_shared";
import type { Block } from "./_data";

/**
 * D1, Estate overview. A manager's first question on a Monday morning is
 * "how far along is today's collection?", then "who still owes?", then
 * "is the operator keeping to the standard?". In that order.
 */
export default function Dashboard() {
  const [update, setUpdate] = useState<{ open: boolean; waiting: Block[]; current?: Block }>({ open: false, waiting: [] });
  const [remind, setRemind] = useState(false);
  const [reminded, setReminded] = useState(false);
  const [complaints, setComplaints] = useState(complaintsSeed);
  const [openId, setOpenId] = useState<string | null>(null);

  const open = complaints.filter(isOpen);
  const worstBlocks = [...blockStats].sort((a, b) => b.owing - a.owing).slice(0, 2);
  const upcoming = collections
    .filter((c) => c.date > "2026-10-05" && (c.kind !== "Estate collection" || c.block === "A"))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);
  const vacant = properties.length - ESTATE.households;
  const daysLeft = Math.round((new Date(`${ESTATE.end}T00:00:00+01:00`).getTime() - DEMO_NOW.getTime()) / 86_400_000);

  return (
    <Page className="gap-8 md:gap-10">
      <div className="flex flex-col gap-1">
        <p className="t-small text-ink-3">{DEMO_NOW.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · collection day</p>
        <p className="flex items-center gap-1.5 t-body font-medium text-ink">
          <Building2 className="size-4 text-ink-3" />
          {ESTATE.name} · {ESTATE.households} households
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-10">
          <BlockRunHero onUpdateResidents={(waiting, current) => setUpdate({ open: true, waiting, current })} />

          {/* Money: one sentence, one bar, one action */}
          <section className="flex flex-col gap-5" aria-labelledby="owing">
            <div className="flex flex-col gap-2">
              <p className="t-micro text-ink-3">October contributions · due {formatDate(billing.due).replace(/ \d{4}$/, "")}</p>
              <h2 id="owing" className="t-h1 text-ink">
                <span className="tnum">{formatNaira(billing.outstanding)}</span> outstanding from {owing.length} households
              </h2>
              <p className="t-body text-ink-2">
                {billing.unpaid} haven't paid October and {billing.partial} have paid part. Blocks {worstBlocks[0]!.block} and {worstBlocks[1]!.block} account for{" "}
                {worstBlocks[0]!.owing + worstBlocks[1]!.owing} of them. Slate has collected <span className="font-medium text-ink tnum">{formatNaira(billing.collected)}</span> so far.
              </p>
            </div>
            <StackedBar
              segments={[
                { label: "Paid", value: billing.paid, tone: "slate" },
                { label: "Part paid", value: billing.partial, tone: "warning" },
                { label: "Not paid", value: billing.unpaid, tone: "danger" },
              ]}
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button leading={<Send className="size-4" />} onClick={() => setRemind(true)} variant={reminded ? "secondary" : "primary"}>
                {reminded ? "Remind again" : `Remind ${owing.length} households`}
              </Button>
              <ButtonLink to="/estate/payments" variant="ghost" trailing={<ArrowRight className="size-4" />}>
                See who owes
              </ButtonLink>
            </div>
            {reminded && <p className="t-small text-ink-3">Reminders sent at 08:12 today. Payments appear on the Payments page as they arrive.</p>}
          </section>

          <Section title="Coming up" actions={<TextLink to="/estate/pickups">All pickups</TextLink>}>
            <List>
              {upcoming.map((c) => (
                <ListRow
                  key={c.id}
                  to="/estate/pickups"
                  leading={<DateTile date={c.date} />}
                  title={c.kind === "Estate collection" ? "Estate collection, Blocks A–H" : c.kind === "Bulk pickup" ? `Bulk pickup · ${c.unit}` : "Recyclables collection"}
                  subtitle={c.kind === "Estate collection" ? `From 06:30 · ${ESTATE.operator}` : `${c.window} · ${c.note}`}
                  trailing={<StatusBadge status="Scheduled" />}
                />
              ))}
            </List>
          </Section>
        </div>

        <aside className="flex min-w-0 flex-col gap-8">
          <section className="flex flex-col gap-4 border-b border-line pb-8">
            <div className="flex items-center justify-between">
              <h2 className="t-h2 text-ink">Service standard</h2>
              <TextLink to="/estate/reports">Report</TextLink>
            </div>
            <p className="t-body text-ink-2">
              {ESTATE.operator} met <span className="font-semibold text-ink">4 of 5</span> targets over the last 30 days. The miss is punctuality, which slipped after the Block F breakdown on 24 Sep.
            </p>
            <SlaRows
              rows={[
                { label: "Collection completion", target: "97%", actual: "98.6%", met: true },
                { label: "Missed blocks recovered in 24 h", target: "100%", actual: "1 of 1", met: true },
                { label: "Collected inside the window", target: "95%", actual: "93.1%", met: false },
              ]}
            />
          </section>

          <section className="flex flex-col gap-2 border-b border-line pb-8">
            <div className="flex items-center justify-between">
              <h2 className="t-h2 text-ink">Complaints</h2>
              <TextLink to="/estate/complaints">All</TextLink>
            </div>
            <p className="t-body text-ink-2">
              <span className="font-semibold text-ink">{open.length} open</span>, one past its response time. 2 resolved this week.
            </p>
            <div className="divide-y divide-line">
              {open.slice(0, 3).map((c) => (
                <ComplaintRow key={c.id} c={c} onOpen={() => setOpenId(c.id)} />
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="t-h2 text-ink">The estate</h2>
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-line bg-line text-center">
              {[
                [String(properties.length), "properties"],
                [String(ESTATE.households), "active households"],
                ["98.6%", "completion, 30 days"],
              ].map(([v, l]) => (
                <div key={l} className="bg-surface px-2 py-3">
                  <p className="font-display text-[22px] font-bold leading-none text-ink tnum">{v}</p>
                  <p className="mt-1 t-micro text-ink-3">{l}</p>
                </div>
              ))}
            </div>
            <p className="t-small text-ink-2">
              {vacant} units are vacant or under renovation and aren't billed. 288 households are association members; 9 are waiting for approval.
            </p>
            <Link to="/estate/services" className="group flex items-start gap-3 rounded-md border border-line bg-surface px-4 py-3.5 transition-colors hover:border-line-strong">
              <div className="min-w-0 flex-1">
                <p className="t-small font-medium text-ink">
                  {ESTATE.operatorFull} <span className="t-mono font-normal text-ink-3">· {ESTATE.contract}</span>
                </p>
                <p className="t-small text-ink-2">
                  Operating for Slate under agreement <span className="t-mono">{ESTATE.agreement}</span>, {daysLeft} days left. Your contract is with Slate.
                </p>
              </div>
              <ArrowRight className="mt-1 size-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </section>
        </aside>
      </div>

      <UpdateResidentsModal open={update.open} waiting={update.waiting} current={update.current} onClose={() => setUpdate((u) => ({ ...u, open: false }))} />
      <ReminderModal open={remind} onClose={() => setRemind(false)} households={owing.length} amount={billing.outstanding} onSent={() => setReminded(true)} />
      <ComplaintDrawer
        complaint={complaints.find((c) => c.id === openId) ?? null}
        onClose={() => setOpenId(null)}
        onChange={(c) => setComplaints((xs) => xs.map((x) => (x.id === c.id ? c : x)))}
        me={me.estate.name}
      />
    </Page>
  );
}
