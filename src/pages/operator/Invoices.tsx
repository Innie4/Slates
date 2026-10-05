import { useMemo, useState } from "react";
import { Download, FilePlus2, Plus, RotateCcw, Send, Trash2, Undo2 } from "lucide-react";
import {
  Alert, Button, Checkbox, ConfirmDialog, DataTable, Drawer, EmptyState, Input, List, ListRow, Modal, Page, PageHeader, Section, Select,
  StatusBadge, Tabs, Textarea, Timeline, useToast, type Column, type TimelineItem,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { DEMO_NOW, formatDate, formatDateTime, formatNaira } from "@/lib/format";
import { Figures, useDownload } from "./_biz";
import { BANK, BILLABLE_JOBS, COMPANY, OP_INVOICES, VAT_RATE, invoiceSubtotal, invoiceTotal, type OpInvoice, type OpInvoiceLine, type OpInvoiceStatus } from "./_bizData";

type TabKey = "All" | OpInvoiceStatus;
const TABS: TabKey[] = ["All", "Draft", "Submitted", "Approved", "Paid", "Rejected"];
const NOW = DEMO_NOW.toISOString();

/** G14 — invoices from Ufok to Slate for work outside the monthly statement. */
export default function Invoices() {
  const toast = useToast();
  const download = useDownload();
  const [items, setItems] = useState<OpInvoice[]>(OP_INVOICES);
  const [tab, setTab] = useState<TabKey>("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | { kind: "submit" | "withdraw" | "delete"; id: string }>(null);
  const [invoicedJobs, setInvoicedJobs] = useState<string[]>([]);
  const [seq, setSeq] = useState(17);

  const open = items.find((i) => i.id === openId) ?? null;
  const rows = tab === "All" ? items : items.filter((i) => i.status === tab);
  const count = (s: OpInvoiceStatus) => items.filter((i) => i.status === s).length;
  const sum = (s: OpInvoiceStatus) => items.filter((i) => i.status === s).reduce((a, i) => a + invoiceTotal(i), 0);
  const rejected = items.find((i) => i.status === "Rejected" && !items.some((x) => x.note === `Replaces ${i.id}`));
  const nextId = () => `INV-UFK-${String(seq).padStart(4, "0")}`;

  const patch = (id: string, p: Partial<OpInvoice>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const columns: Column<OpInvoice>[] = [
    {
      key: "id",
      header: "Invoice",
      cell: (i) => (
        <div className="flex flex-col">
          <span className="font-medium text-ink">{i.title}</span>
          <span className="t-mono text-[12px] text-ink-3">{i.id}</span>
        </div>
      ),
      sortValue: (i) => i.id,
    },
    { key: "period", header: "Period", cell: (i) => <span className="text-ink-2">{i.period}</span> },
    { key: "date", header: "Submitted", cell: (i) => <span className="tnum text-ink-2">{i.submitted ? formatDate(i.submitted) : "Not yet"}</span>, sortValue: (i) => i.submitted ?? i.created },
    { key: "amount", header: "Amount", align: "right", cell: (i) => <span className="t-mono font-semibold text-ink">{formatNaira(invoiceTotal(i))}</span>, sortValue: (i) => invoiceTotal(i) },
    { key: "status", header: "Status", cell: (i) => <StatusBadge status={i.status} /> },
  ];

  const createInvoice = (inv: Omit<OpInvoice, "id" | "created">, jobIds: string[]) => {
    const id = nextId();
    setSeq((n) => n + 1);
    setItems((xs) => [{ ...inv, id, created: NOW }, ...xs]);
    setInvoicedJobs((j) => [...j, ...jobIds]);
    return id;
  };

  return (
    <Page>
      <PageHeader
        title="Invoices"
        description="Bill Slate for extra pickups, bulk assists and recovery jobs. Contracted customers are paid automatically on your monthly statement."
        actions={
          <Button leading={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>
            New invoice
          </Button>
        }
      />

      <Figures
        items={[
          { label: "Waiting for approval", value: formatNaira(sum("Submitted")), hint: `${count("Submitted")} submitted · Slate approves within 3 working days` },
          { label: "Approved, not yet paid", value: formatNaira(sum("Approved")), hint: "Paid with the 7 Oct payout" },
          { label: "Paid in 2026", value: formatNaira(sum("Paid")), hint: `${count("Paid")} invoices` },
        ]}
      />

      {rejected && (
        <Alert
          tone="danger"
          title={`${rejected.id} was rejected`}
          action={
            <Button
              size="sm"
              variant="outline"
              leading={<RotateCcw className="size-3.5" />}
              onClick={() => {
                const id = createInvoice(
                  { title: "Bin replacement labour, August", period: rejected.period, status: "Draft", lines: [{ label: "Bin replacement labour", qty: 24, unit: 600 }], note: `Replaces ${rejected.id}` },
                  [],
                );
                setOpenId(id);
                toast.success(`${id} drafted`, "Labour only, 24 bins × ₦600. Check it and submit.");
              }}
            >
              <span className="max-sm:hidden">Correct and resubmit</span>
              <span className="sm:hidden">Fix</span>
            </Button>
          }
        >
          {rejected.decision?.text}
        </Alert>
      )}

      <Section title="All invoices">
        <Tabs<TabKey> items={TABS.map((t) => ({ value: t, label: t, count: t === "All" ? items.length : count(t) }))} value={tab} onChange={setTab} />
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(i) => i.id}
          onRowClick={(i) => setOpenId(i.id)}
          empty={<EmptyState compact title={`No ${tab.toLowerCase()} invoices`} description="Invoices you create or that Slate updates will show here." />}
          mobile={(i) => (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="t-body truncate font-medium text-ink">{i.title}</p>
                <p className="t-small text-ink-3">
                  <span className="t-mono">{i.id}</span> · {i.period}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="t-mono font-semibold text-ink">{formatNaira(invoiceTotal(i))}</span>
                <StatusBadge status={i.status} />
              </div>
            </div>
          )}
        />
      </Section>

      <Section title="Payment history" description="Money received against your invoices. Paid together with the monthly payout.">
        <List>
          {items
            .filter((i) => i.status === "Paid" || i.status === "Approved")
            .map((i) => (
              <ListRow
                key={i.id}
                onClick={() => setOpenId(i.id)}
                title={i.paid ? <span className="tnum">{formatNaira(invoiceTotal(i))} received</span> : <span className="tnum">{formatNaira(invoiceTotal(i))} scheduled</span>}
                subtitle={
                  <>
                    <span className="t-mono">{i.paid ? i.paid.ref : "Wed 7 Oct"}</span> · {i.id} · {i.title}
                  </>
                }
                meta={i.paid ? formatDate(i.paid.at) : "Due 7 Oct"}
                trailing={<StatusBadge status={i.paid ? "Paid" : "Scheduled"} />}
              />
            ))}
        </List>
      </Section>

      <InvoiceDrawer
        inv={open}
        onClose={() => setOpenId(null)}
        onSubmit={(id) => setConfirm({ kind: "submit", id })}
        onWithdraw={(id) => setConfirm({ kind: "withdraw", id })}
        onDelete={(id) => setConfirm({ kind: "delete", id })}
        onDownload={(i) => download(`${i.id}.pdf`, `${i.title} · ${formatNaira(invoiceTotal(i))}`)}
      />

      <CreateInvoiceModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        nextId={nextId()}
        available={BILLABLE_JOBS.filter((j) => !invoicedJobs.includes(j.id))}
        onCreate={(inv, jobIds) => {
          const id = createInvoice(inv, jobIds);
          if (inv.status === "Submitted") toast.success(`${id} submitted to Slate`, `${formatNaira(invoiceTotal(inv))}. Finance approves within 3 working days.`);
          else toast.success(`${id} saved as draft`, "Submit it when you're ready.");
        }}
      />

      <ConfirmDialog
        open={confirm?.kind === "submit"}
        onClose={() => setConfirm(null)}
        title={`Submit ${confirm?.id} to Slate?`}
        description="Finance checks each line against driver-app records. You can withdraw it until it's approved."
        confirmLabel="Submit invoice"
        onConfirm={() => {
          if (!confirm) return;
          patch(confirm.id, { status: "Submitted", submitted: NOW });
          toast.success(`${confirm.id} submitted`, "You'll get a notification when it's approved.");
        }}
      />
      <ConfirmDialog
        open={confirm?.kind === "withdraw"}
        onClose={() => setConfirm(null)}
        title={`Withdraw ${confirm?.id}?`}
        description="It goes back to draft so you can change it. Slate stops reviewing it."
        confirmLabel="Withdraw"
        onConfirm={() => {
          if (!confirm) return;
          patch(confirm.id, { status: "Draft", submitted: undefined });
          toast.info(`${confirm.id} withdrawn`, "Back in drafts.");
        }}
      />
      <ConfirmDialog
        open={confirm?.kind === "delete"}
        onClose={() => setConfirm(null)}
        variant="destructive"
        title={`Delete draft ${confirm?.id}?`}
        description="The jobs on it become available to invoice again."
        confirmLabel="Delete draft"
        onConfirm={() => {
          if (!confirm) return;
          setItems((xs) => xs.filter((x) => x.id !== confirm.id));
          setOpenId(null);
          toast.info(`${confirm.id} deleted`);
        }}
      />
    </Page>
  );
}

function InvoiceDrawer({
  inv,
  onClose,
  onSubmit,
  onWithdraw,
  onDelete,
  onDownload,
}: {
  inv: OpInvoice | null;
  onClose: () => void;
  onSubmit: (id: string) => void;
  onWithdraw: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (i: OpInvoice) => void;
}) {
  if (!inv) return <Drawer open={false} onClose={onClose} />;
  const sub = invoiceSubtotal(inv);
  const vat = Math.round(sub * VAT_RATE);
  const timeline: TimelineItem[] = [
    { title: "Created", time: formatDateTime(inv.created), state: "done" },
    { title: "Submitted to Slate", time: inv.submitted ? formatDateTime(inv.submitted) : undefined, state: inv.submitted ? "done" : "current" },
    inv.status === "Rejected"
      ? { title: "Rejected", time: inv.decision && formatDateTime(inv.decision.at), description: inv.decision && `${inv.decision.by}: ${inv.decision.text}`, state: "failed" }
      : { title: "Approved by finance", time: inv.decision && formatDateTime(inv.decision.at), description: inv.decision?.by, state: inv.decision ? "done" : inv.submitted ? "current" : "upcoming" },
    ...(inv.status === "Rejected" ? [] : [{ title: "Paid", time: inv.paid ? formatDateTime(inv.paid.at) : inv.status === "Approved" ? "Due Wed 7 Oct" : undefined, state: inv.paid ? ("done" as const) : inv.status === "Approved" ? ("current" as const) : ("upcoming" as const) }]),
  ];
  return (
    <Drawer
      open
      onClose={onClose}
      width="lg"
      title={inv.title}
      description={`${inv.id} · ${inv.period}`}
      footer={
        <>
          {inv.status === "Draft" && (
            <>
              <Button variant="ghost" leading={<Trash2 className="size-4" />} onClick={() => onDelete(inv.id)}>
                Delete
              </Button>
              <Button leading={<Send className="size-4" />} onClick={() => onSubmit(inv.id)}>
                Submit to Slate
              </Button>
            </>
          )}
          {inv.status === "Submitted" && (
            <Button variant="ghost" leading={<Undo2 className="size-4" />} onClick={() => onWithdraw(inv.id)}>
              Withdraw
            </Button>
          )}
          {inv.status !== "Draft" && (
            <Button variant="outline" leading={<Download className="size-4" />} onClick={() => onDownload(inv)}>
              Download PDF
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-7">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={inv.status} size="md" />
          {inv.note && <span className="t-small text-ink-3">{inv.note}</span>}
        </div>

        {/* The invoice document */}
        <article className="rounded-lg border border-line bg-surface">
          <div className="grid gap-5 border-b border-line p-5 sm:grid-cols-2">
            <div>
              <p className="t-micro text-ink-3">From</p>
              <p className="t-small font-semibold text-ink">{COMPANY.legalName}</p>
              <p className="t-small text-ink-2">{COMPANY.address}</p>
              <p className="t-small text-ink-3">
                {COMPANY.rc} · TIN {COMPANY.tin}
              </p>
            </div>
            <div>
              <p className="t-micro text-ink-3">To</p>
              <p className="t-small font-semibold text-ink">Slate Technologies Ltd</p>
              <p className="t-small text-ink-2">41 Udo Udoma Avenue, Uyo</p>
              <p className="t-small text-ink-3">accounts@slate.ng</p>
            </div>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="px-5 py-2.5 t-micro font-medium text-ink-3">Item</th>
                <th className="px-2 py-2.5 text-right t-micro font-medium text-ink-3">Qty</th>
                <th className="hidden px-2 py-2.5 text-right t-micro font-medium text-ink-3 sm:table-cell">Rate</th>
                <th className="px-5 py-2.5 text-right t-micro font-medium text-ink-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {inv.lines.map((l, i) => (
                <tr key={i} className="border-b border-line">
                  <td className="px-5 py-3 align-top">
                    <p className="t-small text-ink">{l.label}</p>
                    <p className="t-small text-ink-3 sm:hidden tnum">× {formatNaira(l.unit)}</p>
                    {l.ref && <p className="t-small text-ink-3">{l.ref}</p>}
                  </td>
                  <td className="px-2 py-3 text-right align-top t-small tnum text-ink">{l.qty}</td>
                  <td className="hidden px-2 py-3 text-right align-top t-mono text-ink-2 sm:table-cell">{formatNaira(l.unit)}</td>
                  <td className="px-5 py-3 text-right align-top t-mono text-ink">{formatNaira(l.qty * l.unit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-col gap-1.5 p-5">
            <div className="flex justify-between t-small text-ink-2">
              <span>Subtotal</span>
              <span className="t-mono">{formatNaira(sub)}</span>
            </div>
            <div className="flex justify-between t-small text-ink-2">
              <span>VAT 7.5%</span>
              <span className="t-mono">{formatNaira(vat)}</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
              <span className="t-h3 text-ink">Total</span>
              <span className="font-display text-[24px] font-bold tracking-[-0.02em] text-ink tnum">{formatNaira(sub + vat)}</span>
            </div>
            <p className="mt-2 t-small text-ink-3">
              Pay to {BANK.bank} •••• {BANK.last4}, {BANK.accountName}.
            </p>
          </div>
        </article>

        <section className="flex flex-col gap-4">
          <h3 className="t-h3 text-ink">Status</h3>
          <Timeline items={timeline} />
          {inv.paid && (
            <p className="t-small text-ink-2">
              Payment reference <span className="t-mono text-ink">{inv.paid.ref}</span>
            </p>
          )}
        </section>
      </div>
    </Drawer>
  );
}

function CreateInvoiceModal({
  open,
  onClose,
  nextId,
  available,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  nextId: string;
  available: typeof BILLABLE_JOBS;
  onCreate: (inv: Omit<OpInvoice, "id" | "created">, jobIds: string[]) => void;
}) {
  const [title, setTitle] = useState("October additional services");
  const [period, setPeriod] = useState("October 2026");
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [err, setErr] = useState<{ title?: string; jobs?: string }>({});

  const reset = () => {
    setTitle("October additional services");
    setPeriod("October 2026");
    setPicked([]);
    setNote("");
    setErr({});
  };
  const close = () => {
    reset();
    onClose();
  };

  const lines: OpInvoiceLine[] = useMemo(() => {
    const byKind = new Map<string, { qty: number; unit: number; refs: string[] }>();
    for (const j of available.filter((x) => picked.includes(x.id))) {
      const cur = byKind.get(j.kind) ?? { qty: 0, unit: j.amount, refs: [] };
      cur.qty += 1;
      cur.refs.push(j.id);
      byKind.set(j.kind, cur);
    }
    return [...byKind.entries()].map(([kind, v]) => ({ label: kind === "Bin labour" ? "Bin replacement labour" : `${kind}s`, qty: v.qty, unit: v.unit, ref: v.refs.join(", ") }));
  }, [picked, available]);
  const sub = invoiceSubtotal({ lines });
  const vat = Math.round(sub * VAT_RATE);

  const finish = (status: "Draft" | "Submitted") => {
    const e = { title: title.trim() ? undefined : "Give the invoice a title.", jobs: picked.length ? undefined : "Choose at least one completed job." };
    setErr(e);
    if (e.title || e.jobs) return;
    onCreate({ title: title.trim(), period, status, lines, note: note.trim() || undefined, submitted: status === "Submitted" ? NOW : undefined }, picked);
    close();
  };

  const allOn = available.length > 0 && picked.length === available.length;

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title="New invoice"
      description={`${nextId} · lines come from completed jobs that aren't on another invoice`}
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button variant="secondary" onClick={() => finish("Draft")}>Save draft</Button>
          <Button leading={<Send className="size-4" />} onClick={() => finish("Submitted")}>
            Submit to Slate
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} error={err.title} />
          <Select label="Period" value={period} onChange={(e) => setPeriod(e.target.value)} options={["October 2026", "September 2026"]} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <p className="t-small font-medium text-ink">Completed jobs</p>
            {available.length > 0 && (
              <button type="button" className="t-small font-medium text-ink-2 hover:text-ink" onClick={() => setPicked(allOn ? [] : available.map((j) => j.id))}>
                {allOn ? "Clear all" : `Select all ${available.length}`}
              </button>
            )}
          </div>
          {available.length === 0 ? (
            <EmptyState compact icon={<FilePlus2 />} title="Nothing left to invoice" description="Every completed billable job is already on an invoice." />
          ) : (
            <ul className={cn("divide-y divide-line rounded-md border", err.jobs ? "border-danger" : "border-line")}>
              {available.map((j) => (
                <li key={j.id} className="px-3.5 py-3">
                  <Checkbox
                    checked={picked.includes(j.id)}
                    onChange={(on) => {
                      setPicked((p) => (on ? [...p, j.id] : p.filter((x) => x !== j.id)));
                      setErr((x) => ({ ...x, jobs: undefined }));
                    }}
                    label={
                      <span className="flex w-full flex-wrap items-baseline justify-between gap-x-3">
                        <span>
                          <span className="font-medium">{j.kind}</span> · {j.customer}
                        </span>
                        <span className="t-mono">{formatNaira(j.amount)}</span>
                      </span>
                    }
                    description={
                      <>
                        <span className="t-mono">{j.id}</span> · {formatDate(j.date).replace(/ \d{4}$/, "")} · {j.area}
                      </>
                    }
                    className="[&>span:last-child]:flex-1"
                  />
                </li>
              ))}
            </ul>
          )}
          {err.jobs && (
            <p className="t-small text-danger" role="alert">
              {err.jobs}
            </p>
          )}
        </div>

        {lines.length > 0 && (
          <div className="rounded-md bg-sunken/70 p-4">
            {lines.map((l) => (
              <div key={l.label} className="flex justify-between gap-3 py-1 t-small text-ink">
                <span>
                  {l.label} <span className="text-ink-3 tnum">× {l.qty}</span>
                </span>
                <span className="t-mono">{formatNaira(l.qty * l.unit)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-line pt-2 t-small text-ink-2">
              <span>VAT 7.5%</span>
              <span className="t-mono">{formatNaira(vat)}</span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="t-small font-semibold text-ink">Total</span>
              <span className="font-display text-[20px] font-bold text-ink tnum">{formatNaira(sub + vat)}</span>
            </div>
          </div>
        )}

        <Textarea label="Note to Slate finance" optional rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything finance should know when checking these jobs" />
      </div>
    </Modal>
  );
}
