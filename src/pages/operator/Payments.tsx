import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Check, ChevronDown, Download, Landmark, MessageSquare } from "lucide-react";
import {
  Alert, Button, DataTable, Drawer, Input, Modal, Page, PageHeader, Panel, ProgressBar, Section, Select, StatusBadge, Textarea, useToast,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatDate, formatDay, formatDateTime, formatNaira, formatNumber } from "@/lib/format";
import { Facts, Figures, LedgerRow, useDownload } from "./_biz";
import { BANK, COMPANY, EARLY_PAYOUTS, OCT_RUNNING, OP_INVOICES, SEPT_MISSED, SEPT_STATEMENT, UFOK_PAYOUTS, invoiceTotal } from "./_bizData";

interface PayoutRow {
  id: string;
  period: string;
  jobs: number;
  gross: number;
  deductions: number;
  adjustments: number;
  net: number;
  status: string;
  date: string;
}

const BANKS = ["Access Bank", "First Bank", "Guaranty Trust Bank", "Fidelity Bank", "Polaris Bank", "United Bank for Africa", "Union Bank", "Wema Bank", "Zenith Bank"];

/** G13, what Slate pays Ufok, and why. Leads with the next money in. */
export default function Payments() {
  const toast = useToast();
  const download = useDownload();
  const [showMissed, setShowMissed] = useState(false);
  const [queryOpen, setQueryOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [pendingBank, setPendingBank] = useState<{ bank: string; last4: string } | null>(null);
  const [open, setOpen] = useState<PayoutRow | null>(null);

  const rows: PayoutRow[] = useMemo(
    () => [
      ...UFOK_PAYOUTS.map((p) => ({ ...p, status: p.status === "Pending" ? "Approved" : p.status, date: p.status === "Pending" ? SEPT_STATEMENT.payDate : p.date })),
      ...EARLY_PAYOUTS,
    ],
    [],
  );
  const gross = SEPT_STATEMENT.gross.reduce((a, l) => a + l.qty * l.unit, 0);
  const deductions = SEPT_STATEMENT.deductions.reduce((a, l) => a + l.qty * l.unit, 0);
  const net = gross - deductions;
  const paidYear = rows.filter((r) => r.status === "Paid").reduce((a, r) => a + r.net, 0);
  const deductionsYear = rows.reduce((a, r) => a + r.deductions, 0);
  const adjustmentsYear = rows.reduce((a, r) => a + r.adjustments, 0) + OCT_RUNNING.adjustments.reduce((a, x) => a + x.amount, 0);
  const approvedInvoice = OP_INVOICES.find((i) => i.status === "Approved")!;
  const pendingTotal = net + invoiceTotal(approvedInvoice);
  const octAdj = OCT_RUNNING.adjustments.reduce((a, x) => a + x.amount, 0);
  const octForecast = OCT_RUNNING.forecastGross + octAdj - OCT_RUNNING.deductionsToDate;

  const columns: Column<PayoutRow>[] = [
    { key: "period", header: "Period", cell: (r) => <span className="font-medium text-ink">{r.period}</span>, sortValue: (r) => r.date },
    { key: "id", header: "Statement", cell: (r) => <span className="t-mono text-ink-2">{r.id}</span> },
    { key: "jobs", header: "Collections", align: "right", cell: (r) => <span className="tnum">{formatNumber(r.jobs)}</span>, sortValue: (r) => r.jobs },
    { key: "gross", header: "Gross", align: "right", cell: (r) => <span className="t-mono">{formatNaira(r.gross)}</span>, sortValue: (r) => r.gross },
    { key: "ded", header: "Deductions", align: "right", cell: (r) => <span className={cn("t-mono", r.deductions ? "text-danger" : "text-ink-3")}>{r.deductions ? `−${formatNaira(r.deductions)}` : "Not set"}</span>, sortValue: (r) => r.deductions },
    { key: "adj", header: "Adjustments", align: "right", cell: (r) => <span className={cn("t-mono", r.adjustments ? "text-ink" : "text-ink-3")}>{r.adjustments ? `+${formatNaira(r.adjustments)}` : "Not set"}</span> },
    { key: "net", header: "Net", align: "right", cell: (r) => <span className="t-mono font-semibold text-ink">{formatNaira(r.net)}</span>, sortValue: (r) => r.net },
    { key: "date", header: "Paid on", cell: (r) => <span className="tnum text-ink-2">{r.status === "Paid" ? formatDate(r.date) : `Due ${formatDay(r.date)}`}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <Page>
      <PageHeader
        title="Payments"
        description="What Slate pays Ufok under CT-UYO-011, line by line. Statements close on the last day of the month and are paid on the 7th."
        actions={
          <Button variant="outline" leading={<Download className="size-4" />} onClick={() => download("Ufok-statement-September-2026.pdf", "PO-02600 · 2 pages")}>
            Statement
          </Button>
        }
      />

      {/* Lead: the next money in */}
      <section aria-labelledby="next-payout" className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status="Approved" />
            <span className="t-small text-ink-2">September payout · <span className="t-mono">{SEPT_STATEMENT.id}</span></span>
          </div>
          <h2 id="next-payout" className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="t-display text-ink tnum">{formatNaira(net)}</span>
            <span className="t-h2 text-ink-2">net arriving 7 Oct</span>
          </h2>
          <p className="t-body max-w-2xl text-ink-2">
            Paid on Wednesday to {BANK.bank} •• {BANK.last4}. That is {formatNaira(gross)} earned from {formatNumber(SEPT_STATEMENT.collections)} collections, less{" "}
            {formatNaira(deductions)} for 11 missed pickups not recovered within 24 hours.
          </p>
        </div>
        <PayoutTrack />
      </section>

      <Figures
        items={[
          { label: "Expected for October", value: formatNaira(octForecast), hint: `Forecast, paid ${formatDate(OCT_RUNNING.payDate).replace(/ \d{4}$/, "")}` },
          { label: "Pending", value: formatNaira(pendingTotal), hint: "September + 1 approved invoice" },
          { label: "Paid in 2026", value: formatNaira(paidYear), hint: `${rows.filter((r) => r.status === "Paid").length} payouts since March` },
          { label: "Deductions in 2026", value: `−${formatNaira(deductionsYear)}`, hint: "All for missed pickups" },
          { label: "Adjustments in 2026", value: `+${formatNaira(adjustmentsYear)}`, hint: "Bin delivery, Block D transfer" },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-10">
        {/* Statement, an object, so a Panel */}
        <Panel
          title="September 2026 statement"
          description={`${SEPT_STATEMENT.id} · approved ${formatDateTime(SEPT_STATEMENT.approved)} by Slate finance`}
          actions={
            <Button variant="outline" size="sm" leading={<Download className="size-3.5" />} onClick={() => download("Ufok-statement-September-2026.pdf", "PO-02600 · 2 pages")}>
              <span className="max-sm:sr-only">PDF</span>
            </Button>
          }
          footer={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="t-small text-ink-3">A query doesn't hold up the payout.</p>
              <Button variant="ghost" size="sm" leading={<MessageSquare className="size-3.5" />} onClick={() => setQueryOpen(true)}>
                Query this statement
              </Button>
            </div>
          }
        >
          <div className="flex flex-col">
            <p className="t-micro text-ink-3">Gross from jobs</p>
            <div className="divide-y divide-line">
              {SEPT_STATEMENT.gross.map((l) => (
                <LedgerRow key={l.label} label={l.label} sub={`${formatNumber(l.qty)} ${l.note}`} amount={l.qty * l.unit} />
              ))}
            </div>
            <LedgerRow kind="subtotal" label="Gross" amount={gross} className="border-t border-line-strong" />

            <p className="mt-5 t-micro text-ink-3">Performance deductions</p>
            {SEPT_STATEMENT.deductions.map((l) => (
              <LedgerRow key={l.label} kind="deduction" label={l.label} sub={`${l.qty} ${l.note}`} amount={l.qty * l.unit} />
            ))}
            <button
              type="button"
              onClick={() => setShowMissed((s) => !s)}
              aria-expanded={showMissed}
              className="-mx-2 flex items-center gap-1.5 self-start rounded-sm px-2 py-1 t-small font-medium text-ink-2 hover:bg-sunken hover:text-ink"
            >
              <ChevronDown className={cn("size-4 transition-transform", showMissed && "rotate-180")} />
              {showMissed ? "Hide" : "Show"} the 11 pickups
            </button>
            {showMissed && (
              <ul className="mt-2 divide-y divide-line rounded-md bg-sunken/60 px-3.5 animate-fade-in">
                {SEPT_MISSED.map((m) => (
                  <li key={m.id} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:gap-4">
                    <span className="t-mono shrink-0 text-ink sm:w-28">{m.id}</span>
                    <span className="t-small shrink-0 text-ink-2 tnum sm:w-24">{formatDate(m.date).replace(/ \d{4}$/, "")} · {m.area.split(" ")[0]}</span>
                    <span className="t-small min-w-0 flex-1 text-ink-2">
                      {m.reason}. <span className="text-ink-3">{m.recovered}.</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-5 t-micro text-ink-3">Adjustments</p>
            <p className="py-2.5 t-small text-ink-3">No adjustments this period.</p>

            <LedgerRow kind="total" label="Net payout" sub="Paid Wed 7 Oct" amount={net} className="mt-2 border-t-2 border-ink" />
          </div>
        </Panel>

        <aside className="flex min-w-0 flex-col gap-8">
          <section className="flex flex-col gap-4 border-b border-line pb-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="t-h2 text-ink">Payout account</h2>
              <Button variant="ghost" size="sm" onClick={() => setBankOpen(true)}>
                Change
              </Button>
            </div>
            <div className="flex items-start gap-3">
              <Landmark className="mt-0.5 size-5 shrink-0 text-ink-3" strokeWidth={1.75} />
              <div className="min-w-0">
                <p className="t-body font-medium text-ink">
                  {BANK.bank} <span className="text-ink-2 tnum">•••• {BANK.last4}</span>
                </p>
                <p className="t-small text-ink-2">
                  {BANK.accountName} · verified {formatDate(BANK.verified)}
                </p>
              </div>
            </div>
            {pendingBank && (
              <Alert tone="info" title="Change requested">
                {pendingBank.bank} •• {pendingBank.last4} becomes active after Slate confirms with {COMPANY.contactName} by phone. The 7 Oct payout still goes to {BANK.bank} •• {BANK.last4}.
              </Alert>
            )}
          </section>

          <section className="flex flex-col gap-4 border-b border-line pb-8">
            <h2 className="t-h2 text-ink">October so far</h2>
            <p className="t-body text-ink-2">
              <span className="font-semibold text-ink tnum">{formatNaira(OCT_RUNNING.earnedToDate)}</span> earned in {OCT_RUNNING.daysDone} service days. Forecast{" "}
              <span className="font-semibold text-ink tnum">{formatNaira(octForecast)}</span>, paid 7 Nov. No deductions yet.
            </p>
            <ProgressBar value={OCT_RUNNING.earnedToDate} max={octForecast} label="October earned against forecast" />
            <div>
              <p className="t-micro text-ink-3">Adjustment added</p>
              {OCT_RUNNING.adjustments.map((a) => (
                <LedgerRow key={a.label} kind="addition" label={a.label} sub={a.note} amount={a.amount} />
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="t-h2 text-ink">How payouts work</h2>
            <ol className="flex flex-col gap-2.5 t-small text-ink-2">
              {[
                "Each month closes at midnight on the last day.",
                "Slate checks driver-app records and approves the statement within 4 days.",
                "Money lands on the 7th, or the next working day.",
                "Deductions follow Schedule B of your contract. Every one is itemised.",
              ].map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="t-mono w-4 shrink-0 text-ink-3">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
            <Link to="/operator/invoices" className="mt-1 inline-flex items-center gap-1.5 t-small font-medium text-ink hover:underline">
              Extra pickups and bulk assists are paid by invoice <ArrowRight className="size-3.5" />
            </Link>
          </section>
        </aside>
      </div>

      <Section title="Payout history" description="Every statement since the contract started on 15 March.">
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          onRowClick={setOpen}
          mobile={(r) => (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="t-body font-medium text-ink">{r.period}</p>
                  <p className="t-small text-ink-3 tnum">
                    {formatNumber(r.jobs)} collections · {r.status === "Paid" ? `paid ${formatDate(r.date).replace(/ \d{4}$/, "")}` : `due ${formatDay(r.date)}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="t-mono font-semibold text-ink">{formatNaira(r.net)}</span>
                  <StatusBadge status={r.status} />
                </div>
              </div>
              {r.deductions > 0 && <p className="t-small text-ink-3 tnum">Gross {formatNaira(r.gross)} · deductions −{formatNaira(r.deductions)}{r.adjustments ? ` · +${formatNaira(r.adjustments)}` : ""}</p>}
            </div>
          )}
        />
      </Section>

      <PayoutDrawer row={open} onClose={() => setOpen(null)} onDownload={(r) => download(`Ufok-statement-${r.period.split(" (")[0]!.replace(" ", "-")}.pdf`, `${r.id} · 2 pages`)} />

      <QueryModal open={queryOpen} onClose={() => setQueryOpen(false)} onSent={() => toast.success("Query sent to Slate finance", "Ekaette Archibong replies within 1 working day. The payout on 7 Oct is not held.")} />
      <BankModal
        open={bankOpen}
        onClose={() => setBankOpen(false)}
        onDone={(b) => {
          setPendingBank(b);
          toast.success("Account change requested", "Slate will call to confirm before it takes effect.");
        }}
      />
    </Page>
  );
}

/** Three-step track: period closed → approved → paid. The next step is the live one. */
function PayoutTrack() {
  const steps = [
    { label: "Period closed", time: "Wed 30 Sep, 23:59", state: "done" as const },
    { label: "Statement approved", time: "Sun 4 Oct, 16:20", state: "done" as const },
    { label: "Paid to Zenith •• 4417", time: "Wed 7 Oct, by 10:00", state: "next" as const },
  ];
  return (
    <ol className="grid grid-cols-3 gap-2 sm:max-w-2xl" aria-label="Payout progress">
      {steps.map((s, i) => (
        <li key={s.label} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full",
                s.state === "done" ? "bg-ink text-surface" : "bg-signal ring-4 ring-signal/20",
              )}
            >
              {s.state === "done" && <Check className="size-3" strokeWidth={3} />}
            </span>
            {i < steps.length - 1 && <span className={cn("h-0.5 flex-1 rounded-full", steps[i + 1]!.state === "done" ? "bg-ink" : "bg-line-strong")} />}
          </div>
          <div className="pr-2">
            <p className="t-small font-medium leading-snug text-ink">{s.label}</p>
            <p className="t-micro text-ink-3 tnum">{s.time}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function PayoutDrawer({ row, onClose, onDownload }: { row: PayoutRow | null; onClose: () => void; onDownload: (r: PayoutRow) => void }) {
  return (
    <Drawer
      open={!!row}
      onClose={onClose}
      title={row ? `${row.period.split(" (")[0]} statement` : ""}
      description={row ? `${row.id} · ${formatNumber(row.jobs)} collections` : ""}
      footer={
        row && (
          <Button variant="outline" leading={<Download className="size-4" />} onClick={() => onDownload(row)}>
            Download PDF
          </Button>
        )
      }
    >
      {row && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <StatusBadge status={row.status} />
            <span className="t-small text-ink-2 tnum">{row.status === "Paid" ? `Paid ${formatDate(row.date)}` : `Due ${formatDay(row.date)}`}</span>
          </div>
          <div className="divide-y divide-line">
            <LedgerRow label="Gross from jobs" sub={`${formatNumber(row.jobs)} collections`} amount={row.gross} />
            <LedgerRow kind="deduction" label="Performance deductions" sub={row.deductions ? `${row.deductions / 2500} missed pickups not recovered in 24h × ₦2,500` : "None"} amount={row.deductions} />
            <LedgerRow kind="addition" label="Adjustments" sub={row.adjustments ? "Bin delivery to new Ewet customers" : "None"} amount={row.adjustments} />
            <LedgerRow kind="total" label="Net" amount={row.net} className="border-t-2 border-ink" />
          </div>
          <Facts
            items={[
              { label: "Paid to", value: `${BANK.bank} •• ${BANK.last4}` },
              { label: "Reference", value: <span className="t-mono">{row.status === "Paid" ? `TXN-${row.id.slice(3)}Q` : "Issued on payment"}</span> },
              { label: "Contract", value: <span className="t-mono">CT-UYO-011</span> },
            ]}
          />
        </div>
      )}
    </Drawer>
  );
}

function QueryModal({ open, onClose, onSent }: { open: boolean; onClose: () => void; onSent: () => void }) {
  const [line, setLine] = useState("");
  const [text, setText] = useState("");
  const [err, setErr] = useState<{ line?: string; text?: string }>({});
  const close = () => {
    setLine("");
    setText("");
    setErr({});
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={close}
      title="Query the September statement"
      description="Tell Slate finance which line looks wrong and why."
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button
            onClick={() => {
              const e = { line: line ? undefined : "Choose the line you're querying.", text: text.trim().length >= 15 ? undefined : "Add a few words so finance can check it (15 characters or more)." };
              setErr(e);
              if (e.line || e.text) return;
              close();
              onSent();
            }}
          >
            Send query
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Select
          label="Line"
          value={line}
          onChange={(e) => setLine(e.target.value)}
          placeholder="Choose a line"
          options={["Slate Home customers", "Slate Home Lite customers", "Estate households", "Missed pickup deductions", "Something missing"]}
          error={err.line}
        />
        <Textarea
          label="What's wrong"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. PU-26-07890 to 07902 were missed because the access road flooded. We'd like these reviewed as force majeure."
          error={err.text}
        />
      </div>
    </Modal>
  );
}

function BankModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (b: { bank: string; last4: string }) => void }) {
  const [bank, setBank] = useState("");
  const [acct, setAcct] = useState("");
  const [err, setErr] = useState<{ bank?: string; acct?: string }>({});
  const [busy, setBusy] = useState(false);
  const resolved = acct.length === 10 && bank;
  const close = () => {
    setBank("");
    setAcct("");
    setErr({});
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={close}
      title="Change payout account"
      description="The account must be in the company's registered name."
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button
            loading={busy}
            onClick={() => {
              const e = { bank: bank ? undefined : "Choose the bank.", acct: /^\d{10}$/.test(acct) ? undefined : "Enter the 10-digit NUBAN account number." };
              setErr(e);
              if (e.bank || e.acct) return;
              setBusy(true);
              setTimeout(() => {
                setBusy(false);
                onDone({ bank, last4: acct.slice(-4) });
                close();
              }, 700);
            }}
          >
            Request change
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Select label="Bank" value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Choose a bank" options={BANKS} error={err.bank} />
        <Input
          label="Account number"
          inputMode="numeric"
          maxLength={10}
          value={acct}
          onChange={(e) => setAcct(e.target.value.replace(/\D/g, ""))}
          placeholder="0123456789"
          className="tnum"
          error={err.acct}
          hint={resolved ? undefined : "10 digits"}
        />
        {resolved && (
          <p className="-mt-2 flex items-center gap-2 t-small text-success">
            <Check className="size-4" /> UFOK ENVIRONMENTAL SERVICES LTD
          </p>
        )}
        <Alert tone="neutral">
          For your protection, Slate calls {COMPANY.contactName} on +234 {COMPANY.phone} before the change takes effect. Until then, payouts keep going to {BANK.bank} •• {BANK.last4}.
        </Alert>
      </div>
    </Modal>
  );
}
