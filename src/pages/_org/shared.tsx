/**
 * Shared pieces for the organisation portals (estate + business).
 * Invoice document, payment flow, complaint drawer + creation, report blocks,
 * notification preferences and settings rows. Pages stay distinct; these are
 * the objects both portals genuinely share.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { ArrowRight, Building2, Check, CreditCard, Copy, Download, Landmark, Printer } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import {
  Badge, Button, ChoiceCard, ConfirmDialog, CurrencyInput, DescriptionList, Drawer, FileDrop, Input, Modal, Segmented, Select, StatusBadge,
  Switch, Textarea, Timeline, useToast, type UploadedFile,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { DEMO_NOW, formatDate, formatDateTime, formatNaira, formatRelative } from "@/lib/format";

/* ================================================================== */
/* Invoices                                                            */
/* ================================================================== */

export interface OrgInvoice {
  id: string;
  title: string;
  period: string;
  issued: string;
  due: string;
  billTo: { name: string; lines: string[] };
  lines: Array<{ label: string; detail?: string; qty: number; unit: number }>;
  vatRate?: number;
  credits?: Array<{ label: string; amount: number; date?: string }>;
  status: "Paid" | "Unpaid" | "Overdue" | "Partial";
  paidOn?: string;
  reference?: string;
  kind?: string;
}

export function invoiceTotals(inv: OrgInvoice) {
  const subtotal = inv.lines.reduce((a, l) => a + l.qty * l.unit, 0);
  const vat = Math.round(subtotal * (inv.vatRate ?? 0));
  const total = subtotal + vat;
  const credited = (inv.credits ?? []).reduce((a, c) => a + c.amount, 0);
  const balance = Math.max(0, total - credited);
  return { subtotal, vat, total, credited, balance };
}

export const SLATE_BANK = { bank: "Providus Bank", account: "9902 418 336", name: "Slate Services Ltd" };

/** An invoice drawn as the document it is, header slab, lines, totals, how to pay. */
export function InvoiceDocument({ invoice, className }: { invoice: OrgInvoice; className?: string }) {
  const t = invoiceTotals(invoice);
  return (
    <article className={cn("overflow-hidden rounded-lg border border-line bg-surface", className)} aria-label={`Invoice ${invoice.id}`}>
      <header className="relative flex items-start justify-between gap-4 bg-slate px-5 py-5 text-slate-ink chalk-grain sm:px-7">
        <div className="flex flex-col gap-3">
          <Logo to={null} tone="light" />
          <p className="t-micro text-slate-ink/70">Slate Services Ltd · RC 1877420<br />21 Udo Udoma Avenue, Uyo</p>
        </div>
        <div className="text-right">
          <p className="t-micro text-slate-ink/70">Invoice</p>
          <p className="t-mono text-[15px] font-semibold">{invoice.id}</p>
          <p className="mt-1 t-micro text-slate-ink/70">{invoice.period}</p>
        </div>
      </header>

      <div className="relative flex flex-col gap-6 px-5 py-6 sm:px-7">
        {invoice.status === "Paid" && invoice.paidOn && (
          <span
            aria-label={`Paid ${formatDate(invoice.paidOn)}`}
            className="pointer-events-none absolute right-5 top-5 rotate-[-8deg] rounded-sm border-2 border-success px-2.5 py-1 text-center font-display text-[15px] font-bold uppercase leading-tight tracking-wider text-success opacity-80 sm:right-7"
          >
            Paid
            <span className="block t-micro normal-case tracking-normal">{formatDate(invoice.paidOn)}</span>
          </span>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="t-micro text-ink-3">Billed to</p>
            <p className="mt-1 t-small font-semibold text-ink">{invoice.billTo.name}</p>
            {invoice.billTo.lines.map((l) => (
              <p key={l} className="t-small text-ink-2">{l}</p>
            ))}
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:pt-0">
            <dt className="t-micro text-ink-3">Issued</dt>
            <dd className="t-small text-ink tnum">{formatDate(invoice.issued)}</dd>
            <dt className="t-micro text-ink-3">Due</dt>
            <dd className="t-small text-ink tnum">{formatDate(invoice.due)}</dd>
            {invoice.reference && (
              <>
                <dt className="t-micro text-ink-3">Agreement</dt>
                <dd className="t-mono text-ink">{invoice.reference}</dd>
              </>
            )}
            <dt className="t-micro text-ink-3">Status</dt>
            <dd><StatusBadge status={invoice.status} /></dd>
          </dl>
        </div>

        <div>
          <div className="flex items-center justify-between border-b border-line-strong pb-2 t-micro text-ink-3">
            <span>Description</span>
            <span>Amount</span>
          </div>
          <ul className="divide-y divide-line">
            {invoice.lines.map((l) => (
              <li key={l.label} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="t-small font-medium text-ink">{l.label}</p>
                  <p className="t-small text-ink-3">
                    {l.detail ? `${l.detail} · ` : ""}
                    <span className="tnum">{l.qty > 1 ? `${l.qty.toLocaleString("en-NG")} × ${formatNaira(l.unit)}` : formatNaira(l.unit)}</span>
                  </p>
                </div>
                <span className="t-mono shrink-0 text-ink">{formatNaira(l.qty * l.unit)}</span>
              </li>
            ))}
          </ul>
          <dl className="flex flex-col gap-1.5 border-t border-line-strong pt-3">
            {invoice.vatRate ? (
              <>
                <Row label="Subtotal" value={formatNaira(t.subtotal)} />
                <Row label={`VAT ${(invoice.vatRate * 100).toFixed(1)}%`} value={formatNaira(t.vat)} />
              </>
            ) : null}
            <Row label="Total" value={formatNaira(t.total)} strong />
            {(invoice.credits ?? []).map((c) => (
              <Row key={c.label} label={`${c.label}${c.date ? ` · ${formatDate(c.date).replace(/ \d{4}$/, "")}` : ""}`} value={`−${formatNaira(c.amount)}`} muted />
            ))}
          </dl>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4 rounded-md bg-sunken px-4 py-4">
          <div>
            <p className="t-micro text-ink-3">{t.balance > 0 ? "Balance due" : "Balance"}</p>
            <p className="font-display text-[30px] font-bold leading-none tracking-[-0.02em] text-ink tnum">{formatNaira(t.balance)}</p>
          </div>
          {t.balance > 0 && <p className="t-small text-ink-2">by {formatDate(invoice.due)}</p>}
        </div>

        <div className="flex flex-col gap-1 border-t border-dashed border-line-strong pt-4">
          <p className="t-micro text-ink-3">How to pay</p>
          <p className="t-small text-ink-2">
            Pay by card from this portal, or transfer to <span className="font-medium text-ink">{SLATE_BANK.bank} {SLATE_BANK.account}</span> ({SLATE_BANK.name}) with{" "}
            <span className="t-mono text-ink">{invoice.id}</span> as the narration. Questions: billing@slate.ng · 0700 752 8300.
          </p>
        </div>
      </div>
    </article>
  );
}

function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={cn("t-small", strong ? "font-semibold text-ink" : "text-ink-2")}>{label}</dt>
      <dd className={cn("t-mono shrink-0", strong ? "font-semibold text-ink" : muted ? "text-ink-2" : "text-ink")}>{value}</dd>
    </div>
  );
}

/** Drawer wrapper: the document on a sunken desk, actions in the footer. */
export function InvoiceDrawer({ invoice, onClose, onPay }: { invoice: OrgInvoice | null; onClose: () => void; onPay?: (inv: OrgInvoice) => void }) {
  const toast = useToast();
  const t = invoice ? invoiceTotals(invoice) : null;
  return (
    <Drawer
      open={!!invoice}
      onClose={onClose}
      width="lg"
      title={invoice?.title}
      description={invoice ? `${invoice.id} · issued ${formatDate(invoice.issued)}` : undefined}
      footer={
        invoice && (
          <>
            <Button variant="ghost" leading={<Printer className="size-4" />} className="max-sm:hidden" onClick={() => toast.info("Sent to printer", `${invoice.id} is formatted for A4.`)}>
              Print
            </Button>
            <Button variant="secondary" leading={<Download className="size-4" />} onClick={() => toast.success("Invoice downloaded", `${invoice.id}.pdf saved to your device.`)}>
              Download PDF
            </Button>
            {t && t.balance > 0 && onPay && (
              <Button onClick={() => onPay(invoice)}>Pay {formatNaira(t.balance)}</Button>
            )}
          </>
        )
      }
    >
      {invoice && (
        <div className="-mx-5 -my-5 min-h-full bg-sunken px-3 py-4 sm:-mx-6 sm:px-6 sm:py-6">
          <InvoiceDocument invoice={invoice} />
        </div>
      )}
    </Drawer>
  );
}

/** Payment flow for an invoice balance. Card on file or bank transfer. */
export function PayModal({
  invoice,
  onClose,
  onPaid,
  card = "Mastercard •• 5512",
  allowPartial,
}: {
  invoice: OrgInvoice | null;
  onClose: () => void;
  onPaid: (inv: OrgInvoice, amount: number, ref: string) => void;
  card?: string;
  allowPartial?: boolean;
}) {
  const toast = useToast();
  const balance = invoice ? invoiceTotals(invoice).balance : 0;
  const [method, setMethod] = useState<"card" | "transfer">("card");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  useEffect(() => {
    if (invoice) {
      setAmount(String(balance));
      setMethod("card");
      setDone(null);
      setBusy(false);
    }
  }, [invoice, balance]);
  const value = Number(amount.replace(/[^\d]/g, "")) || 0;
  const error = value <= 0 ? "Enter an amount" : value > balance ? `The balance is ${formatNaira(balance)}` : undefined;
  const pay = () => {
    if (error || !invoice) return;
    setBusy(true);
    setTimeout(() => {
      const ref = `TXN-${Math.random().toString(36).slice(2, 8).toUpperCase().replace(/[01IO]/g, "7")}`;
      setBusy(false);
      setDone(ref);
      onPaid(invoice, value, ref);
    }, 1100);
  };
  return (
    <Modal
      open={!!invoice}
      onClose={onClose}
      title={done ? "Payment received" : `Pay ${invoice?.id ?? ""}`}
      description={done ? undefined : invoice?.title}
      footer={
        done ? (
          <Button onClick={onClose}>Done</Button>
        ) : method === "transfer" ? (
          <>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => {
                toast.info("We'll match your transfer", "Transfers usually reflect within 10 minutes. You'll get a receipt by email.");
                onClose();
              }}
            >
              I've sent the transfer
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button loading={busy} disabled={!!error} onClick={pay}>
              Pay {value ? formatNaira(value) : ""}
            </Button>
          </>
        )
      }
    >
      {done ? (
        <div className="flex flex-col items-start gap-4 py-2">
          <span className="flex size-11 items-center justify-center rounded-md bg-success-bg text-success">
            <Check className="size-5" strokeWidth={2.5} />
          </span>
          <p className="t-body text-ink-2">
            <span className="font-semibold text-ink">{formatNaira(value)}</span> paid to {invoice?.id} from {card}. A receipt is on its way to your billing email.
          </p>
          <DescriptionList dense items={[{ label: "Reference", value: done, mono: true }, { label: "Paid", value: formatDateTime(DEMO_NOW) }]} />
        </div>
      ) : (
        <div className="flex flex-col gap-5 pb-2">
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-4">
            <span className="t-small text-ink-2">Balance due {invoice ? `by ${formatDate(invoice.due)}` : ""}</span>
            <span className="font-display text-[24px] font-bold text-ink tnum">{formatNaira(balance)}</span>
          </div>
          <div className="flex flex-col gap-2" role="radiogroup" aria-label="Payment method">
            <ChoiceCard selected={method === "card"} onSelect={() => setMethod("card")} icon={<CreditCard />} title={card} description="Charged now. Receipt by email." />
            <ChoiceCard selected={method === "transfer"} onSelect={() => setMethod("transfer")} icon={<Landmark />} title="Bank transfer" description="Pay from your company account. Matched automatically." />
          </div>
          {method === "card" ? (
            allowPartial ? (
              <CurrencyInput label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} error={amount ? error : undefined} hint="Pay the full balance or part of it now." />
            ) : null
          ) : (
            <TransferDetails reference={invoice?.id ?? ""} amount={balance} />
          )}
        </div>
      )}
    </Modal>
  );
}

export function TransferDetails({ reference, amount }: { reference: string; amount?: number }) {
  const toast = useToast();
  const rows = [
    { label: "Bank", value: SLATE_BANK.bank },
    { label: "Account number", value: SLATE_BANK.account, copy: true },
    { label: "Account name", value: SLATE_BANK.name },
    { label: "Narration", value: reference, copy: true },
    ...(amount ? [{ label: "Amount", value: formatNaira(amount) }] : []),
  ];
  return (
    <dl className="divide-y divide-line rounded-md border border-line">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-3 px-4 py-2.5">
          <dt className="t-small text-ink-3">{r.label}</dt>
          <dd className="flex items-center gap-2">
            <span className={cn("t-small font-medium text-ink", r.copy && "t-mono")}>{r.value}</span>
            {"copy" in r && r.copy && (
              <button
                type="button"
                aria-label={`Copy ${r.label.toLowerCase()}`}
                className="rounded-sm p-1 text-ink-3 hover:bg-sunken hover:text-ink"
                onClick={() => {
                  try {
                    void navigator.clipboard?.writeText(r.value.replace(/\s/g, ""));
                  } catch {
                    /* clipboard unavailable */
                  }
                  toast.success(`${r.label} copied`);
                }}
              >
                <Copy className="size-3.5" />
              </button>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ================================================================== */
/* Complaints                                                          */
/* ================================================================== */

export type OrgComplaintStatus = "New" | "Assigned" | "Investigating" | "Escalated" | "Resolved" | "Closed";
export interface OrgComplaint {
  id: string;
  subject: string;
  subjectLabel: string;
  category: "Missed pickup" | "Late pickup" | "Spillage" | "Billing" | "Conduct" | "Damaged bin" | "Other";
  severity: "Low" | "Medium" | "High";
  status: OrgComplaintStatus;
  issue: string;
  detail: string;
  created: string;
  slaDue: string;
  assignee: string;
  operator: string;
  channel: string;
  evidence: number;
  pickupId?: string;
  events: Array<{ time: string; title: string; body?: string; by: string }>;
}

export const isOpen = (c: OrgComplaint) => !["Resolved", "Closed"].includes(c.status);

export function slaText(c: OrgComplaint) {
  if (!isOpen(c)) return { text: `Closed ${formatRelative(c.events[c.events.length - 1]!.time)}`, late: false };
  const late = new Date(c.slaDue) < DEMO_NOW;
  return { text: late ? `Response overdue since ${formatDateTime(c.slaDue)}` : `Response due ${formatRelative(c.slaDue)}`, late };
}

export const COMPLAINT_CATEGORIES: OrgComplaint["category"][] = ["Missed pickup", "Late pickup", "Spillage", "Billing", "Conduct", "Damaged bin", "Other"];

/** Complaint detail: what happened, who has it, the trail, and what you can do. */
export function ComplaintDrawer({
  complaint,
  onClose,
  onChange,
  me,
  subjectTerm = "Unit",
}: {
  complaint: OrgComplaint | null;
  onClose: () => void;
  onChange: (c: OrgComplaint) => void;
  me: string;
  subjectTerm?: string;
}) {
  const toast = useToast();
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState<"resolve" | "escalate" | null>(null);
  useEffect(() => setNote(""), [complaint?.id]);
  if (!complaint) return <Drawer open={false} onClose={onClose} />;
  const c = complaint;
  const sla = slaText(c);
  const push = (patch: Partial<OrgComplaint>, ev: OrgComplaint["events"][number]) => onChange({ ...c, ...patch, events: [...c.events, ev] });
  return (
    <>
      <Drawer
        open
        onClose={onClose}
        title={c.issue}
        description={`${c.id} · ${c.subjectLabel}`}
        footer={
          isOpen(c) ? (
            <>
              {c.status !== "Escalated" && (
                <Button variant="ghost" onClick={() => setConfirm("escalate")}>Escalate</Button>
              )}
              <Button onClick={() => setConfirm("resolve")}>Mark resolved</Button>
            </>
          ) : (
            <Button
              variant="secondary"
              onClick={() => {
                push({ status: "Investigating" }, { time: DEMO_NOW.toISOString(), title: "Reopened", by: me });
                toast.info(`${c.id} reopened`, "Slate support has been told it isn't fixed.");
              }}
            >
              Reopen complaint
            </Button>
          )
        }
      >
        <div className="flex flex-col gap-7">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={c.status} />
            <Badge tone={c.severity === "High" ? "danger" : c.severity === "Medium" ? "warning" : "neutral"}>{c.severity} priority</Badge>
            <Badge tone="outline">{c.category}</Badge>
          </div>
          <p className={cn("t-small font-medium", sla.late ? "text-danger" : "text-ink-2")}>{sla.text}</p>
          <p className="t-body text-ink">{c.detail}</p>
          <DescriptionList
            dense
            items={[
              { label: subjectTerm, value: c.subjectLabel },
              { label: "Raised", value: formatDateTime(c.created) },
              { label: "Handled by", value: c.assignee === "Unassigned" ? "Waiting for Slate support" : `${c.assignee}, Slate support` },
              { label: "Service by", value: c.operator },
              { label: "Channel", value: c.channel },
              { label: "Evidence", value: c.evidence ? `${c.evidence} photo${c.evidence > 1 ? "s" : ""}` : "None" },
              ...(c.pickupId ? [{ label: "Pickup", value: c.pickupId, mono: true }] : []),
            ]}
          />
          <section className="flex flex-col gap-4 border-t border-line pt-6">
            <h3 className="t-h3 text-ink">Trail</h3>
            <Timeline
              items={c.events.map((e, i) => ({
                title: e.title,
                time: formatDateTime(e.time),
                description: (
                  <>
                    {e.body && <span className="block">{e.body}</span>}
                    <span className="text-ink-3">{e.by}</span>
                  </>
                ),
                state: i === c.events.length - 1 && isOpen(c) ? "current" : "done",
              }))}
            />
          </section>
          {isOpen(c) && (
            <section className="flex flex-col gap-3 border-t border-line pt-6">
              <Textarea label="Add a note for Slate support" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything the crew or support should know" />
              <Button
                variant="secondary"
                className="self-start"
                disabled={note.trim().length < 3}
                onClick={() => {
                  push({}, { time: DEMO_NOW.toISOString(), title: "Note added", body: note.trim(), by: me });
                  setNote("");
                  toast.success("Note added", "Slate support will see it on the complaint.");
                }}
              >
                Add note
              </Button>
            </section>
          )}
        </div>
      </Drawer>
      <ConfirmDialog
        open={confirm === "resolve"}
        onClose={() => setConfirm(null)}
        title="Mark this complaint resolved?"
        description="Do this once the problem is fixed on the ground. The resident or site contact is told, and the complaint can be reopened within 7 days."
        confirmLabel="Mark resolved"
        onConfirm={() => {
          push({ status: "Resolved" }, { time: DEMO_NOW.toISOString(), title: "Resolved", body: "Confirmed fixed on site.", by: me });
          toast.success(`${c.id} resolved`);
        }}
      />
      <ConfirmDialog
        open={confirm === "escalate"}
        onClose={() => setConfirm(null)}
        title="Escalate to a Slate service lead?"
        description="A service lead takes over and must respond within 2 hours. Use this when the first response hasn't fixed the problem."
        confirmLabel="Escalate"
        onConfirm={() => {
          push({ status: "Escalated" }, { time: DEMO_NOW.toISOString(), title: "Escalated to service lead", by: me });
          toast.success(`${c.id} escalated`, "A service lead will respond within 2 hours.");
        }}
      />
    </>
  );
}

/** Raise a complaint. `subjects` are units (estate) or locations (business). */
export function NewComplaintModal({
  open,
  onClose,
  onCreate,
  subjects,
  subjectTerm,
  title = "Raise a complaint",
  description,
  nextId,
  me,
  channel,
  operator,
  extra,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (c: OrgComplaint) => void;
  subjects: Array<{ value: string; label: string }>;
  subjectTerm: string;
  title?: string;
  description?: string;
  nextId: string;
  me: string;
  channel: string;
  operator: string;
  extra?: (subject: string) => ReactNode;
}) {
  const toast = useToast();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<OrgComplaint["category"] | "">("");
  const [issue, setIssue] = useState("");
  const [detail, setDetail] = useState("");
  const [photos, setPhotos] = useState<UploadedFile[]>([]);
  const [severity, setSeverity] = useState<OrgComplaint["severity"]>("Medium");
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (open) {
      setSubject("");
      setCategory("");
      setIssue("");
      setDetail("");
      setPhotos([]);
      setSeverity("Medium");
      setTried(false);
    }
  }, [open]);
  const errors = {
    subject: !subject ? `Choose the ${subjectTerm.toLowerCase()}` : undefined,
    category: !category ? "Choose what went wrong" : undefined,
    issue: issue.trim().length < 6 ? "Give it a short title, e.g. “Bins left full at CP-3”" : undefined,
    detail: detail.trim().length < 15 ? "Describe what happened in a sentence or two" : undefined,
  };
  const valid = !Object.values(errors).some(Boolean);
  const label = subjects.find((s) => s.value === subject)?.label ?? subject;
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              setTried(true);
              if (!valid || !category) return;
              const now = DEMO_NOW.toISOString();
              const hours = severity === "High" ? 4 : severity === "Medium" ? 24 : 48;
              onCreate({
                id: nextId, subject, subjectLabel: label, category, severity, status: "New", issue: issue.trim(), detail: detail.trim(), created: now,
                slaDue: new Date(DEMO_NOW.getTime() + hours * 3600_000).toISOString(), assignee: "Unassigned", operator, channel, evidence: photos.length,
                events: [{ time: now, title: channel === "Via estate manager" ? "Raised by estate manager on behalf of resident" : "Raised", by: me }],
              });
              toast.success(`${nextId} raised`, `Slate support will respond within ${hours} hours.`);
              onClose();
            }}
          >
            Raise complaint
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        <Select label={subjectTerm} value={subject} onChange={(e) => setSubject(e.target.value)} options={subjects} placeholder={`Choose ${subjectTerm.toLowerCase()}`} error={tried ? errors.subject : undefined} />
        {extra && subject && extra(subject)}
        <div className="flex flex-col gap-2">
          <span className="t-small font-medium text-ink">What went wrong</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Category">
            {COMPLAINT_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={category === c}
                onClick={() => setCategory(c)}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-sm border px-3 text-[14px] font-medium transition",
                  category === c ? "border-ink bg-ink text-surface" : "border-line-strong bg-surface text-ink-2 hover:border-ink-3 hover:text-ink",
                )}
              >
                {category === c && <Check className="size-3.5" strokeWidth={2.5} />}
                {c}
              </button>
            ))}
          </div>
          {tried && errors.category && <p className="t-small text-danger" role="alert">{errors.category}</p>}
        </div>
        <Input label="Title" value={issue} onChange={(e) => setIssue(e.target.value)} error={tried ? errors.issue : undefined} placeholder="Bins left full at the Water tank road bay" />
        <Textarea label="What happened" rows={4} value={detail} onChange={(e) => setDetail(e.target.value)} error={tried ? errors.detail : undefined} placeholder="When, where, and what you saw. Mention bin counts or times if you have them." />
        <div className="flex flex-col gap-2">
          <span className="t-small font-medium text-ink">How urgent</span>
          <Segmented
            value={severity}
            onChange={setSeverity}
            options={[
              { value: "Low", label: "Low · 48 h" },
              { value: "Medium", label: "Medium · 24 h" },
              { value: "High", label: "High · 4 h" },
            ]}
            className="w-full sm:w-auto"
          />
        </div>
        <FileDrop label="Photos" images files={photos} onFiles={setPhotos} hint="Up to 6 photos. They help the operator fix it faster." />
      </div>
    </Modal>
  );
}

/** Complaint row used in lists on both portals. */
export function ComplaintRow({ c, onOpen }: { c: OrgComplaint; onOpen: () => void }) {
  const sla = slaText(c);
  return (
    <button type="button" onClick={onOpen} className="group -mx-2 flex w-[calc(100%+1rem)] items-start gap-4 rounded-md px-2 py-4 text-left transition-colors hover:bg-sunken/70">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="t-mono text-ink-3">{c.id}</span>
          <span className="t-small text-ink-3">·</span>
          <span className="t-small text-ink-2">{c.subjectLabel}</span>
        </div>
        <p className="t-body font-medium text-ink">{c.issue}</p>
        <p className={cn("t-small", sla.late ? "font-medium text-danger" : "text-ink-3")}>
          {c.category} · {sla.text}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <StatusBadge status={c.status} />
        {c.severity === "High" && isOpen(c) && <span className="t-micro text-danger">High priority</span>}
      </div>
    </button>
  );
}

/* ================================================================== */
/* Reports                                                             */
/* ================================================================== */

export type Period = "30d" | "quarter" | "ytd";
export const PERIODS: Array<{ value: Period; label: string }> = [
  { value: "30d", label: "30 days" },
  { value: "quarter", label: "Quarter" },
  { value: "ytd", label: "Year to date" },
];

/** A titled figure: headline, one-line reading, then the chart. Separated by hairlines, not boxes. */
export function ReportFigure({
  title,
  value,
  reading,
  children,
  className,
  aside,
}: {
  title: string;
  value?: ReactNode;
  reading?: ReactNode;
  children: ReactNode;
  className?: string;
  aside?: ReactNode;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-4 border-t border-line pt-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <h2 className="t-h3 text-ink">{title}</h2>
          {reading && <p className="t-small mt-0.5 max-w-xl text-ink-2">{reading}</p>}
        </div>
        {value !== undefined && <p className="font-display text-[28px] font-bold leading-none tracking-[-0.02em] text-ink tnum">{value}</p>}
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Horizontal labelled bars, for per-block / per-location comparisons. */
export function HBars({
  rows,
  format = (v) => String(v),
  max,
  tone = "slate",
}: {
  rows: Array<{ label: ReactNode; value: number; note?: ReactNode; highlight?: boolean }>;
  format?: (v: number) => string;
  max?: number;
  tone?: "slate" | "danger" | "warning";
}) {
  const m = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((r, i) => (
        <li key={i} className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-3 sm:grid-cols-[minmax(0,10rem)_1fr_auto]">
          <span className="t-small truncate text-ink-2">{r.label}</span>
          <span className="h-2.5 overflow-hidden rounded-full bg-sunken">
            <span
              className={cn(
                "block h-full rounded-full",
                r.highlight ? "bg-signal" : tone === "danger" ? "bg-danger" : tone === "warning" ? "bg-warning" : "bg-slate dark:bg-slate-300",
              )}
              style={{ width: `${Math.max(r.value ? 2 : 0, (r.value / m) * 100)}%` }}
            />
          </span>
          <span className="t-small min-w-12 text-right font-medium text-ink tnum">
            {format(r.value)}
            {r.note && <span className="ml-1.5 font-normal text-ink-3">{r.note}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** SLA target vs actual, one row per target, the bar shows actual against target. */
export function SlaRows({ rows }: { rows: Array<{ label: string; target: string; actual: string; met: boolean; note?: string }> }) {
  return (
    <ul className="divide-y divide-line">
      {rows.map((r) => (
        <li key={r.label} className="flex items-start justify-between gap-4 py-3">
          <div className="min-w-0">
            <p className="t-small font-medium text-ink">{r.label}</p>
            <p className="t-small text-ink-3">Target {r.target}{r.note ? ` · ${r.note}` : ""}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="t-small font-semibold text-ink tnum">{r.actual}</span>
            <Badge tone={r.met ? "success" : "warning"} dot>{r.met ? "Met" : "Below target"}</Badge>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ExportActions({ name, period }: { name: string; period: string }) {
  const toast = useToast();
  return (
    <>
      <Button variant="outline" size="md" leading={<Download className="size-4" />} onClick={() => toast.success("CSV exported", `${name}, ${period}.csv is downloading.`)}>
        CSV
      </Button>
      <Button size="md" leading={<Download className="size-4" />} onClick={() => toast.success("PDF report ready", `${name}, ${period}.pdf is downloading.`)}>
        PDF report
      </Button>
    </>
  );
}

/* ================================================================== */
/* Settings                                                            */
/* ================================================================== */

/** Settings group: label + description on the left (desktop), controls on the right. */
export function SettingsGroup({ title, description, children, id, actions }: { title: string; description?: ReactNode; children: ReactNode; id?: string; actions?: ReactNode }) {
  return (
    <section id={id} className="grid scroll-mt-24 gap-5 border-t border-line pt-7 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:gap-10">
      <div className="flex flex-col gap-1">
        <h2 className="t-h3 text-ink">{title}</h2>
        {description && <p className="t-small text-ink-2">{description}</p>}
        {actions && <div className="mt-3 flex gap-2">{actions}</div>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export interface NotifyPref {
  key: string;
  label: string;
  description: string;
}
const CHANNELS = ["Email", "SMS", "WhatsApp"] as const;

/** Event × channel matrix. Stacks per event on phones. */
export function NotificationMatrix({ prefs, initial }: { prefs: NotifyPref[]; initial: Record<string, string[]> }) {
  const toast = useToast();
  const [value, setValue] = useState(initial);
  const toggle = (k: string, ch: string) => {
    setValue((v) => {
      const cur = v[k] ?? [];
      const next = cur.includes(ch) ? cur.filter((x) => x !== ch) : [...cur, ch];
      toast.success(`${ch} ${cur.includes(ch) ? "off" : "on"}`, prefs.find((p) => p.key === k)?.label);
      return { ...v, [k]: next };
    });
  };
  return (
    <div className="flex flex-col">
      <div className="hidden grid-cols-[1fr_repeat(3,5.5rem)] border-b border-line pb-2 sm:grid">
        <span />
        {CHANNELS.map((c) => (
          <span key={c} className="text-center t-micro text-ink-3">{c}</span>
        ))}
      </div>
      <ul className="divide-y divide-line">
        {prefs.map((p) => (
          <li key={p.key} className="flex flex-col gap-3 py-4 sm:grid sm:grid-cols-[1fr_repeat(3,5.5rem)] sm:items-center sm:gap-0">
            <div className="min-w-0 pr-4">
              <p className="t-small font-medium text-ink">{p.label}</p>
              <p className="t-small text-ink-3">{p.description}</p>
            </div>
            <div className="flex gap-2 sm:contents">
              {CHANNELS.map((ch) => {
                const on = (value[p.key] ?? []).includes(ch);
                return (
                  <div key={ch} className="sm:flex sm:justify-center">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={on}
                      aria-label={`${p.label} by ${ch}`}
                      onClick={() => toggle(p.key, ch)}
                      className={cn(
                        "inline-flex h-8 items-center gap-1.5 rounded-sm border px-2.5 text-[13px] font-medium transition sm:size-8 sm:justify-center sm:px-0",
                        on ? "border-ink bg-ink text-surface" : "border-line-strong bg-surface text-ink-3 hover:border-ink-3",
                      )}
                    >
                      <Check className={cn("size-3.5", !on && "opacity-0 sm:opacity-0")} strokeWidth={2.5} />
                      <span className="sm:sr-only">{ch}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Save bar for settings forms, appears when a form is dirty. */
export function useDirty<T>(initial: T) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const dirty = useMemo(() => JSON.stringify(value) !== JSON.stringify(saved), [value, saved]);
  return { value, setValue, dirty, save: () => setSaved(value), reset: () => setValue(saved) };
}

export function SaveRow({ dirty, onSave, onReset, label = "Save changes" }: { dirty: boolean; onSave: () => void; onReset: () => void; label?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      {dirty && <span className="mr-auto t-small text-ink-3">Unsaved changes</span>}
      <Button variant="ghost" disabled={!dirty} onClick={onReset}>Discard</Button>
      <Button
        loading={busy}
        disabled={!dirty}
        onClick={() => {
          setBusy(true);
          setTimeout(() => {
            setBusy(false);
            onSave();
          }, 600);
        }}
      >
        {label}
      </Button>
    </div>
  );
}

/* ================================================================== */
/* Small shared atoms                                                  */
/* ================================================================== */

/** Weekday/day tile used in schedules (matches the customer dashboard). */
export function DateTile({ date, tone = "sunken" }: { date: string; tone?: "sunken" | "slate" }) {
  const d = new Date(date.length === 10 ? `${date}T12:00:00+01:00` : date);
  return (
    <div className={cn("flex w-12 shrink-0 flex-col items-center rounded-md py-1.5", tone === "slate" ? "bg-slate text-slate-ink dark:bg-stone dark:text-ink" : "bg-sunken")}>
      <span className={cn("t-micro uppercase", tone === "slate" ? "opacity-70" : "text-ink-3")}>{d.toLocaleDateString("en-GB", { weekday: "short" })}</span>
      <span className={cn("font-display text-[20px] font-bold leading-none tnum", tone === "slate" ? "" : "text-ink")}>{d.getDate()}</span>
    </div>
  );
}

export function TextLink({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={cn("inline-flex items-center gap-1 t-small font-medium text-ink-2 hover:text-ink", className)}>
      {children}
    </Link>
  );
}

export function ArrowLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="group inline-flex items-center gap-1.5 t-small font-medium text-ink hover:underline hover:underline-offset-4">
      {children}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/** "Slate is your one contract; the operator works for Slate", the managed-service line. */
export function ManagedBy({ operator, className }: { operator: string; className?: string }) {
  return (
    <p className={cn("flex items-start gap-2 t-small text-ink-2", className)}>
      <Building2 className="mt-0.5 size-4 shrink-0 text-ink-3" strokeWidth={1.75} />
      <span>
        Collected by <span className="font-medium text-ink">{operator}</span> for Slate. Slate holds the contract, the standard and the support line.
      </span>
    </p>
  );
}

export function SwitchRow({ label, description, initial, onToggle }: { label: string; description?: string; initial: boolean; onToggle?: (v: boolean) => void }) {
  const [on, setOn] = useState(initial);
  return (
    <div className="py-4">
      <Switch
        checked={on}
        onChange={(v) => {
          setOn(v);
          onToggle?.(v);
        }}
        label={label}
        description={description}
      />
    </div>
  );
}
