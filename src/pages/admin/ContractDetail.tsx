import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { Ban, Download, FileText, MoreHorizontal, Pause, Pencil, Play, RefreshCw, Send } from "lucide-react";
import {
  Alert, Button, ConfirmDialog, CurrencyInput, DescriptionList, IconButton, Input, Menu, Modal, Page, PageHeader, Section,
  Segmented, StatusBadge, Textarea, Timeline, useToast, type TimelineItem,
} from "@/components/ui";
import { operatorById, type Contract } from "@/data";
import { cn } from "@/lib/cn";
import { formatDate, formatNaira, formatNairaShort, formatNumber } from "@/lib/format";
import {
  AllocationBar, LIFECYCLE, NotFoundView, SLATE_ENTITY, contractByIdAll, contractVersions, daysUntil, isLive, lifecycleIndex, margin, shiftDays,
  slaTerms, type ContractVersion,
} from "./_money";

type LocalStatus = Contract["status"] | "Suspended";

const iso = (d: string) => new Date(d).toISOString();
const addMonths = (d: string, m: number) => {
  const x = new Date(d);
  x.setMonth(x.getMonth() + m);
  return x.toISOString().slice(0, 10);
};

export default function ContractDetail() {
  const { id = "" } = useParams();
  const location = useLocation();
  const created = (location.state as { created?: Contract } | null)?.created;
  const base = contractByIdAll(id) ?? (created?.id === id ? created : undefined);
  if (!base) return <Page><NotFoundView what="contract" back="/admin/contracts" backLabel="All contracts" /></Page>;
  return <ContractView key={base.id} base={base} fresh={!!created && created.id === id} />;
}

function ContractView({ base, fresh }: { base: Contract; fresh: boolean }) {
  const toast = useToast();
  const [c, setC] = useState<Contract>(base);
  const [status, setStatus] = useState<LocalStatus>(base.status);
  const [versions, setVersions] = useState<ContractVersion[]>(() =>
    fresh ? [{ version: 1, date: "2026-10-05", by: "Idara Umoh", change: "Created from the contract builder, approved by Aniekan Etim and accepted by the operator." }] : contractVersions(base),
  );
  const [renewal, setRenewal] = useState<string | null>(null);
  const [terminatedOn, setTerminatedOn] = useState<string | null>(base.status === "Terminated" ? "2026-09-14" : null);
  const [modal, setModal] = useState<"edit" | "renew" | "send" | "suspend" | "terminate" | null>(null);

  const op = operatorById(c.operatorId);
  const sla = slaTerms(c);
  const m = margin(c.customerPrice, c.operatorPayout);
  const fee = Math.round(c.customerPrice * 0.015);
  const left = daysUntil(c.end);
  const live = isLive({ ...c, status: status === "Suspended" ? "Active" : status });
  const preActive = ["Draft", "Internal review", "Negotiation", "Sent to operator", "Accepted"].includes(status);
  const ended = status === "Terminated" || status === "Expired";
  const monthly = c.monthlyValue || c.customers * c.operatorPayout;
  const atCapacity = c.capacity * c.operatorPayout;
  const termMonths = Math.round((new Date(c.end).getTime() - new Date(c.start).getTime()) / (30.44 * 86_400_000));

  const timeline = useMemo<TimelineItem[]>(() => {
    const cur = status === "Suspended" ? 5 : lifecycleIndex(status);
    const firstVersion = versions[versions.length - 1]?.date;
    const dates = [-19, -15, -12, -9, -6].map((d) => shiftDays(iso(c.start), d));
    if (firstVersion && iso(firstVersion) < dates[0]!) dates[0] = iso(firstVersion);
    const items: TimelineItem[] = LIFECYCLE.slice(0, 6).map((label, i) => ({
      title: label === "Active" && status === "Suspended" ? "Active — suspended" : label,
      time: i < cur || (i === cur && i < 5) ? formatDate(i < 5 ? dates[i]! : iso(c.start)) : i === 5 ? `From ${formatDate(c.start)}` : undefined,
      state: i < cur ? "done" : i === cur ? (status === "Suspended" ? "failed" : "current") : "upcoming",
      description:
        i === 1 ? "Approved by Aniekan Etim, Super Admin" :
        i === 3 ? `Sent to ${op?.contact ?? "the operator"}${op ? ` (${op.email})` : ""}` :
        i === 4 ? (i < cur ? "Signed electronically by the operator" : undefined) :
        i === 5 && status === "Suspended" ? "Collections paused — customers rerouted to standby operators" : undefined,
    }));
    if (ended) {
      items.push({ title: status === "Terminated" ? "Terminated" : "Expired", time: formatDate(terminatedOn ?? c.end), state: "failed", description: status === "Terminated" ? "Customers moved to other contracted operators" : undefined });
    } else {
      items.push({
        title: "Renewal approaching",
        time: formatDate(shiftDays(iso(c.end), -60)),
        state: cur === 6 ? "current" : "upcoming",
        description: cur === 6 ? (renewal ? `Renewal to ${formatDate(renewal)} is in internal review` : `Ends in ${left} days — renew or let it lapse`) : "60 days before the end date",
      });
      items.push({ title: "Renewed, or expired", time: formatDate(c.end), state: "upcoming" });
    }
    return items;
  }, [c, status, ended, terminatedOn, renewal, left, op, versions]);

  const addVersion = (change: string) => {
    setVersions((v) => [{ version: (v[0]?.version ?? 0) + 1, date: "2026-10-05", by: "Idara Umoh", change }, ...v]);
    setC((x) => ({ ...x, version: x.version + 1 }));
  };

  const perf = op && op.completion > 0 ? op : null;
  // fill and target are positions on a 0–100 track; the marker shows the contractual limit.
  const scale = (v: number, limit: number) => Math.min(100, (v / (limit * 1.5)) * 100);
  const perfRows = perf
    ? [
        { label: "Completion", value: `${perf.completion}%`, target: `${c.slaCompletion}% target`, ok: perf.completion >= c.slaCompletion, at: false, fill: perf.completion, mark: c.slaCompletion },
        { label: "Missed pickups, 30 days", value: formatNumber(perf.missed30d), target: `max ${sla.maxMissed}`, ok: perf.missed30d < sla.maxMissed, at: perf.missed30d === sla.maxMissed, fill: scale(perf.missed30d, sla.maxMissed), mark: 66.7 },
        { label: "Average response", value: perf.responseMins < 60 ? `${perf.responseMins} min` : `${(perf.responseMins / 60).toFixed(1)} h`, target: `within ${c.responseHours} h`, ok: perf.responseMins <= c.responseHours * 60, at: false, fill: scale(perf.responseMins, c.responseHours * 60), mark: 66.7 },
        { label: "Complaints, 30 days", value: formatNumber(perf.complaints30d), target: `max 8, each closed within ${sla.complaintHours} h`, ok: perf.complaints30d < 8, at: perf.complaints30d === 8, fill: scale(perf.complaints30d, 8), mark: 66.7 },
      ]
    : [];
  const breaches = perfRows.filter((r) => !r.ok && !r.at).length;

  return (
    <Page>
      <PageHeader
        back={{ to: "/admin/contracts", label: "Contracts" }}
        eyebrow={<span className="t-mono">{c.id} · version {c.version}</span>}
        title={c.operatorName}
        meta={<StatusBadge status={status} size="md" />}
        description={`${c.serviceTypes.join(", ")} in ${c.areas.join(", ")}.`}
        actions={
          <>
            {status === "Expiring" || status === "Renewal approaching" ? (
              <Button leading={<RefreshCw className="size-4" />} onClick={() => setModal("renew")} disabled={!!renewal}>
                {renewal ? "Renewal in review" : "Renew"}
              </Button>
            ) : preActive ? (
              <Button leading={<Send className="size-4" />} onClick={() => setModal("send")} disabled={status === "Sent to operator" || status === "Accepted"}>
                {status === "Sent to operator" ? "Awaiting operator" : status === "Accepted" ? "Accepted" : "Send to operator"}
              </Button>
            ) : ended ? null : (
              <Button variant="secondary" leading={<Pencil className="size-4" />} onClick={() => setModal("edit")}>
                Edit
              </Button>
            )}
            <Button variant="outline" leading={<Download className="size-4" />} onClick={() => toast.success("Agreement downloaded", `${c.id} v${c.version}, signed PDF.`)}>
              Download
            </Button>
            <Menu
              className="!flex-none"
              trigger={(p) => (
                <IconButton label="More actions" variant="outline" {...p}>
                  <MoreHorizontal />
                </IconButton>
              )}
              items={[
                { label: "Edit terms", icon: <Pencil />, onSelect: () => setModal("edit"), disabled: ended },
                { label: preActive ? "Send to operator" : "Send copy to operator", icon: <Send />, onSelect: () => setModal("send"), disabled: ended },
                { label: "Renew", icon: <RefreshCw />, onSelect: () => setModal("renew"), disabled: ended || preActive || !!renewal },
                { divider: true, label: "" },
                status === "Suspended"
                  ? { label: "Resume contract", icon: <Play />, onSelect: () => { setStatus(base.status); toast.success("Contract resumed", "Collections return to this operator from tomorrow's routes."); } }
                  : { label: "Suspend", icon: <Pause />, onSelect: () => setModal("suspend"), disabled: !live },
                { label: "Terminate", icon: <Ban />, danger: true, onSelect: () => setModal("terminate"), disabled: ended },
              ]}
            />
          </>
        }
      />

      {fresh && (
        <Alert tone="success" title="Contract activated">
          {c.operatorName} starts collecting under {c.id} on {formatDate(c.start)}. Customers in these areas will be assigned automatically.
        </Alert>
      )}
      {(status === "Expiring" || status === "Renewal approaching") && !renewal && (
        <Alert tone="warning" title={`Ends in ${left} days, on ${formatDate(c.end)}`} action={<Button size="sm" variant="secondary" onClick={() => setModal("renew")}>Start renewal</Button>}>
          {c.customers > 0 ? `${formatNumber(c.customers)} customers are served under this contract. ` : ""}Renewals go through internal review, then to the operator for acceptance.
        </Alert>
      )}
      {renewal && (
        <Alert tone="info" title="Renewal in internal review">
          Version {c.version} extends the contract to {formatDate(renewal)}. Aniekan Etim has been asked to approve it.
        </Alert>
      )}
      {status === "Suspended" && (
        <Alert tone="warning" title="Contract suspended">
          No new jobs go to {c.operatorName}. Existing customers are on standby operators until you resume or terminate.
        </Alert>
      )}
      {status === "Terminated" && (
        <Alert tone="danger" title={`Terminated on ${formatDate(terminatedOn ?? c.end)}`}>
          {base.status === "Terminated" ? "23 missed pickups in 30 days breached the residential schedule. Customers were moved to Ufok Environmental and Nwaniba Clean Crew." : "Customers will be moved to other contracted operators in the same areas."}
        </Alert>
      )}

      {/* Hero: the economics of the contract */}
      <section className="flex flex-col gap-6 border-b border-line pb-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          <div className="flex flex-col gap-1">
            <span className="t-micro text-ink-3">Customer pays</span>
            <span className="font-display text-[28px] font-bold leading-none tracking-[-0.02em] text-ink tnum sm:text-[34px]">{formatNaira(c.customerPrice)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="t-micro text-ink-3">Operator receives</span>
            <span className="font-display text-[28px] font-bold leading-none tracking-[-0.02em] text-ink tnum sm:text-[34px]">{formatNaira(c.operatorPayout)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="t-micro text-ink-3">Slate keeps</span>
            <span className="font-display text-[28px] font-bold leading-none tracking-[-0.02em] text-ink tnum sm:text-[34px]">{formatNaira(m.amount)}</span>
            <span className="t-small text-ink-3 tnum">{m.pct.toFixed(1)}% before fees</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="t-micro text-ink-3">{live && c.customers > 0 ? "Paid to operator monthly" : "Monthly payout at capacity"}</span>
            <span className="font-display text-[28px] font-bold leading-none tracking-[-0.02em] text-ink tnum sm:text-[34px]">{formatNairaShort(live && c.customers > 0 ? monthly : atCapacity)}</span>
            <span className="t-small text-ink-3 tnum">
              {formatNumber(c.customers)} of {formatNumber(c.capacity)} capacity
            </span>
          </div>
        </div>
        <AllocationBar operator={c.operatorPayout} slate={m.amount - fee} fee={fee} />
      </section>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="flex min-w-0 flex-col gap-10">
          <Section title="Terms">
            <DescriptionList
              items={[
                { label: "Operator", value: op ? <Link to={`/admin/operators/${op.id}`} className="underline decoration-line-strong underline-offset-4 hover:decoration-ink">{op.name}</Link> : c.operatorName },
                { label: "Slate entity", value: SLATE_ENTITY },
                { label: "Service areas", value: c.areas.join(", ") },
                { label: "Service types", value: c.serviceTypes.join(", ") },
                { label: "Pricing", value: `${formatNaira(c.customerPrice)} customer price · ${formatNaira(c.operatorPayout)} operator payout` },
                { label: "Capacity", value: `${formatNumber(c.capacity)} customers or sites` },
                { label: "SLA", value: `${c.slaCompletion}% completion · response within ${c.responseHours} h · max ${sla.maxMissed} missed a month · complaints closed within ${sla.complaintHours} h` },
                { label: "Pickup windows", value: sla.windows.join(", ") },
                { label: "Payment terms", value: c.paymentTerms },
                { label: "Penalties", value: c.penalties },
                { label: "Start", value: formatDate(c.start) },
                { label: "End", value: `${formatDate(c.end)} · ${termMonths}-month term` },
              ]}
            />
          </Section>

          <Section
            title="Performance against SLA"
            description={perf ? `Last 30 days, ${op!.short}. ${breaches ? `${breaches} ${breaches === 1 ? "term" : "terms"} breached.` : "All terms met."}` : undefined}
            actions={perf ? <Link to={`/admin/operators/${op!.id}`} className="t-small font-medium text-ink-2 hover:text-ink">Operator scorecard</Link> : undefined}
          >
            {perf ? (
              <ul className="divide-y divide-line border-y border-line">
                {perfRows.map((r) => {
                  const at = r.at;
                  return (
                    <li key={r.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-3.5 sm:grid-cols-[minmax(0,1fr)_8rem_auto]">
                      <div className="min-w-0">
                        <p className="t-small font-medium text-ink">{r.label}</p>
                        <p className="t-micro text-ink-3">{r.target}</p>
                      </div>
                      <div className="relative col-span-2 row-start-2 h-1.5 rounded-full bg-sunken sm:col-span-1 sm:row-start-auto" aria-hidden>
                        <div className={cn("h-full rounded-full", r.ok ? "bg-slate-400 dark:bg-slate-500" : at ? "bg-warning" : "bg-danger")} style={{ width: `${Math.max(2, r.fill)}%` }} />
                        <span className="absolute -top-1 h-3.5 w-0.5 rounded-full bg-ink" style={{ left: `${r.mark}%` }} />
                      </div>
                      <div className="flex items-center gap-2 justify-self-end">
                        <span className={cn("t-body font-semibold tnum", r.ok ? "text-ink" : at ? "text-warning" : "text-danger")}>{r.value}</span>
                        <StatusBadge status={r.ok ? "Met" : at ? "At risk" : "Breached"} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="t-body border-y border-line py-5 text-ink-2">
                {preActive ? "Performance tracking starts on the day the contract is activated." : "No performance recorded under this contract."}
              </p>
            )}
          </Section>

          <Section title="Version history" description="Every change creates a new version. Active contracts need internal approval and operator acceptance for each version.">
            <ol className="divide-y divide-line border-y border-line">
              {versions.map((v, i) => (
                <li key={v.version} className="flex gap-4 py-3.5">
                  <span className={cn("mt-0.5 flex h-6 min-w-9 items-center justify-center rounded-sm t-mono text-[12px]", i === 0 ? "bg-ink text-surface" : "bg-sunken text-ink-2")}>v{v.version}</span>
                  <div className="min-w-0 flex-1">
                    <p className="t-small text-ink">{v.change}</p>
                    <p className="t-micro text-ink-3">
                      {v.by} · {formatDate(v.date)}
                      {i === 0 && " · current"}
                    </p>
                  </div>
                  <IconButton label={`Download version ${v.version}`} size="sm" onClick={() => toast.success(`Version ${v.version} downloaded`, `${c.id}-v${v.version}.pdf`)}>
                    <Download />
                  </IconButton>
                </li>
              ))}
            </ol>
          </Section>
        </div>

        <aside className="flex min-w-0 flex-col gap-10">
          <Section title="Lifecycle">
            <Timeline items={timeline} />
          </Section>
          <Section title="Documents">
            <ul className="divide-y divide-line border-y border-line">
              {[
                { name: `Waste Service Partner Agreement v${c.version}`, meta: `Signed PDF · ${formatDate(versions[0]?.date ?? c.start)}` },
                { name: "Service area schedule", meta: `${c.areas.length} ${c.areas.length === 1 ? "area" : "areas"} · Annex A` },
                { name: "SLA and penalty schedule", meta: "Annex B" },
              ].map((d) => (
                <li key={d.name}>
                  <button type="button" onClick={() => toast.success("Downloaded", d.name)} className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-md px-2 py-3 text-left hover:bg-sunken/70">
                    <FileText className="size-[18px] shrink-0 text-ink-3" strokeWidth={1.75} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate t-small font-medium text-ink">{d.name}</span>
                      <span className="block t-micro text-ink-3">{d.meta}</span>
                    </span>
                    <Download className="size-4 shrink-0 text-ink-3" />
                  </button>
                </li>
              ))}
            </ul>
            <Link to="/admin/documents" className="t-small font-medium text-ink-2 hover:text-ink">All contract documents</Link>
          </Section>
          {op && (
            <Section title="Operator">
              <div className="flex flex-col gap-1">
                <Link to={`/admin/operators/${op.id}`} className="t-body font-medium text-ink hover:underline">{op.name}</Link>
                <p className="t-small text-ink-2">{op.contact} · {op.phone}</p>
                <p className="t-small text-ink-3">{op.rc} · {op.vehicles} vehicles · {op.staff} staff</p>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <Link to="/admin/payouts" className="t-small font-medium text-ink-2 hover:text-ink">Payouts</Link>
                <Link to="/admin/service-areas" className="t-small font-medium text-ink-2 hover:text-ink">Service areas</Link>
                <Link to="/admin/complaints" className="t-small font-medium text-ink-2 hover:text-ink">Complaints</Link>
              </div>
            </Section>
          )}
        </aside>
      </div>

      <EditModal
        open={modal === "edit"}
        contract={c}
        live={live}
        onClose={() => setModal(null)}
        onSave={(next, change) => {
          setC((x) => ({ ...x, ...next }));
          addVersion(change);
          toast.success(`Version ${c.version + 1} saved`, live ? "Sent to Aniekan Etim for approval, then to the operator to accept." : "The draft has been updated.");
        }}
      />
      <RenewModal
        open={modal === "renew"}
        contract={c}
        onClose={() => setModal(null)}
        onRenew={(end, payout) => {
          setRenewal(end);
          addVersion(`Renewal drafted to ${formatDate(end)}${payout !== c.operatorPayout ? `, payout ${formatNaira(c.operatorPayout)} → ${formatNaira(payout)}` : ", same pricing"}.`);
          toast.success("Renewal sent for internal review", `${c.id} to ${formatDate(end)}.`);
        }}
      />
      <ConfirmDialog
        open={modal === "send"}
        onClose={() => setModal(null)}
        title={preActive ? "Send to the operator?" : "Send a copy to the operator?"}
        description={`${op?.contact ?? "The operator"} gets an email at ${op?.email ?? "their registered address"} and a task in the operator portal${preActive ? " to review and accept version " + c.version : ""}.`}
        confirmLabel="Send"
        onConfirm={() => {
          if (preActive) setStatus("Sent to operator");
          toast.success(preActive ? "Sent for acceptance" : "Copy sent", `${c.id} v${c.version} to ${op?.email ?? c.operatorName}.`);
        }}
      />
      <ConfirmDialog
        open={modal === "suspend"}
        onClose={() => setModal(null)}
        title={`Suspend ${c.id}?`}
        description={`New jobs stop going to ${c.operatorName} today. ${formatNumber(c.customers)} customers move to standby operators until you resume. The operator is told by email and SMS.`}
        confirmLabel="Suspend contract"
        variant="destructive"
        onConfirm={() => {
          setStatus("Suspended");
          toast.success("Contract suspended", "Standby routes take effect from tomorrow 06:00.");
        }}
      />
      <TerminateDialog
        open={modal === "terminate"}
        contract={c}
        onClose={() => setModal(null)}
        onConfirm={() => {
          setStatus("Terminated");
          setTerminatedOn("2026-10-05");
          addVersion("Termination notice issued.");
          toast.success("Contract terminated", `${c.operatorName} has been notified. Final settlement goes to Payouts.`);
        }}
      />
    </Page>
  );
}

function EditModal({ open, contract, live, onClose, onSave }: { open: boolean; contract: Contract; live: boolean; onClose: () => void; onSave: (next: Partial<Contract>, change: string) => void }) {
  const [price, setPrice] = useState(String(contract.customerPrice));
  const [payout, setPayout] = useState(String(contract.operatorPayout));
  const [capacity, setCapacity] = useState(String(contract.capacity));
  const [sla, setSla] = useState(String(contract.slaCompletion));
  const [response, setResponse] = useState(String(contract.responseHours));
  const [tried, setTried] = useState(false);
  const p = Number(price) || 0, o = Number(payout) || 0, cap = Number(capacity) || 0, s = Number(sla) || 0, r = Number(response) || 0;
  const m = margin(p, o);
  const errors = {
    price: p <= 0 ? "Enter a price" : undefined,
    payout: o <= 0 ? "Enter a payout" : o >= p ? "Payout must be less than the customer price" : undefined,
    capacity: cap < contract.customers ? `At least ${formatNumber(contract.customers)} — customers already served` : undefined,
    sla: s < 80 || s > 100 ? "Between 80 and 100" : undefined,
    response: r < 1 || r > 72 ? "Between 1 and 72 hours" : undefined,
  };
  const invalid = Object.values(errors).some(Boolean);
  const num = (v: string) => v.replace(/[^\d]/g, "");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit ${contract.id}`}
      description={live ? "Saving creates a new version. It needs internal approval and the operator's acceptance before it takes effect." : "Changes update the draft."}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              setTried(true);
              if (invalid) return;
              const changes: string[] = [];
              if (p !== contract.customerPrice) changes.push(`price ${formatNaira(contract.customerPrice)} → ${formatNaira(p)}`);
              if (o !== contract.operatorPayout) changes.push(`payout ${formatNaira(contract.operatorPayout)} → ${formatNaira(o)}`);
              if (cap !== contract.capacity) changes.push(`capacity ${formatNumber(contract.capacity)} → ${formatNumber(cap)}`);
              if (s !== contract.slaCompletion) changes.push(`completion SLA ${contract.slaCompletion}% → ${s}%`);
              if (r !== contract.responseHours) changes.push(`response ${contract.responseHours} h → ${r} h`);
              onSave({ customerPrice: p, operatorPayout: o, capacity: cap, slaCompletion: s, responseHours: r }, changes.length ? `Edited: ${changes.join(", ")}.` : "Re-issued with no term changes.");
              onClose();
            }}
          >
            Save new version
          </Button>
        </>
      }
    >
      <div className="grid gap-4 pb-2 sm:grid-cols-2">
        <CurrencyInput label="Customer price" value={price} onChange={(e) => setPrice(num(e.target.value))} error={tried ? errors.price : undefined} />
        <CurrencyInput label="Operator payout" value={payout} onChange={(e) => setPayout(num(e.target.value))} error={tried ? errors.payout : undefined} />
        <p className="t-small text-ink-2 tnum sm:col-span-2">
          Slate keeps <span className={cn("font-semibold", m.amount <= 0 ? "text-danger" : "text-ink")}>{formatNaira(m.amount)}</span> · {m.pct.toFixed(1)}%
        </p>
        <Input label="Capacity" inputMode="numeric" value={capacity} onChange={(e) => setCapacity(num(e.target.value))} error={tried ? errors.capacity : undefined} />
        <Input label="Completion SLA" inputMode="numeric" trailing={<span className="pr-3 t-small">%</span>} value={sla} onChange={(e) => setSla(num(e.target.value))} error={tried ? errors.sla : undefined} />
        <Input label="Response time" inputMode="numeric" trailing={<span className="pr-3 t-small">hours</span>} value={response} onChange={(e) => setResponse(num(e.target.value))} error={tried ? errors.response : undefined} fieldClassName="sm:col-span-2" />
      </div>
    </Modal>
  );
}

function RenewModal({ open, contract, onClose, onRenew }: { open: boolean; contract: Contract; onClose: () => void; onRenew: (end: string, payout: number) => void }) {
  const [term, setTerm] = useState<"6" | "12" | "24">("12");
  const [payout, setPayout] = useState(String(contract.operatorPayout));
  const [note, setNote] = useState("");
  const end = addMonths(contract.end, Number(term));
  const o = Number(payout) || 0;
  const m = margin(contract.customerPrice, o);
  const err = o <= 0 || o >= contract.customerPrice ? "Payout must be above zero and below the customer price" : undefined;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Renew ${contract.id}`}
      description={`Currently ends ${formatDate(contract.end)}. The renewal is a new version: internal review, then operator acceptance.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!!err} onClick={() => { onRenew(end, o); onClose(); }}>
            Send for review
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        <div className="flex flex-col gap-2">
          <span className="t-small font-medium text-ink">Extend by</span>
          <Segmented value={term} onChange={setTerm} options={[{ value: "6", label: "6 months" }, { value: "12", label: "12 months" }, { value: "24", label: "24 months" }]} />
          <p className="t-small text-ink-2">New end date: <span className="font-medium text-ink">{formatDate(end)}</span></p>
        </div>
        <CurrencyInput label="Operator payout" value={payout} onChange={(e) => setPayout(e.target.value.replace(/[^\d]/g, ""))} error={err} hint={`Customer price stays ${formatNaira(contract.customerPrice)}. Slate keeps ${formatNaira(m.amount)} (${m.pct.toFixed(1)}%).`} />
        <Textarea label="Note for the approver" optional rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why renew on these terms" />
      </div>
    </Modal>
  );
}

function TerminateDialog({ open, contract, onClose, onConfirm }: { open: boolean; contract: Contract; onClose: () => void; onConfirm: () => void }) {
  const [reason, setReason] = useState("");
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      title={`Terminate ${contract.id}?`}
      description={`This ends the agreement with ${contract.operatorName} today and can't be undone. ${contract.customers > 0 ? `${formatNumber(contract.customers)} customers will be moved to other operators.` : ""} Outstanding payouts go to final settlement.`}
      confirmLabel="Terminate contract"
      variant="destructive"
      requireText="TERMINATE"
      onConfirm={onConfirm}
    >
      <Textarea label="Reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Recorded in the audit log and sent to the operator" />
    </ConfirmDialog>
  );
}
