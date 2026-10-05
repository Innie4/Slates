import { useState, type ReactNode } from "react";
import { Download, Printer, Share2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button, Modal, Select, StatusBadge, Textarea, useToast } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatDate, formatNaira, formatTime } from "@/lib/format";
import { me, myPayments, smartSweeps, type Payment } from "@/data";

/* ================================================================== */
/* Transactions                                                        */
/* ================================================================== */

export type TxnStatus = "Upcoming" | "Successful" | "Failed" | "Pending" | "Refunded";
export type TxnKind = "plan" | "community" | "bulk" | "extra" | "smart-sweep";

export interface Txn {
  id: string;
  reference: string;
  service: string;
  amount: number;
  date: string;
  method: string;
  processor: "Paystack" | "Flutterwave";
  status: TxnStatus;
  kind: TxnKind;
  attempts: number;
  /** Short explanation shown under the row (why it failed, what's pending, what settled it). */
  note?: string;
  /** Failed charge already settled by another payment — no retry. */
  settledBy?: string;
  failureReason?: string;
}

const kindOf = (service: string): TxnKind =>
  /contribution/i.test(service) ? "community" : /bulk/i.test(service) ? "bulk" : /extra/i.test(service) ? "extra" : "plan";

const fromPayment = (p: Payment): Txn => ({
  id: p.id,
  reference: p.reference,
  service: p.service,
  amount: p.amount,
  date: p.date,
  method: p.method,
  processor: p.processor,
  status: p.status === "Chargeback" ? "Failed" : p.status,
  kind: kindOf(p.service),
  attempts: p.attempts,
});

const sweep = smartSweeps[0]!;

/** Every customer transaction: data + derived upcoming charges + one outstanding failure. */
export function buildTransactions(): Txn[] {
  const base = myPayments.map(fromPayment).map((t): Txn => {
    if (t.reference === "TXN-4C9TBA")
      return { ...t, failureReason: "Card expired", settledBy: "TXN-4C9TBB", note: "Verve •• 7735 had expired. Settled the next day with Visa •• 4021." };
    if (t.status === "Pending") return { ...t, note: "Your bank is confirming this. Saturday's bulk pickup is held for you." };
    if (t.status === "Refunded") return { ...t, note: "Refunded in full on 26 Aug — the crew couldn't access your gate." };
    return t;
  });
  return [
    {
      id: "up-sweep",
      reference: "SWP-8K2Q-06",
      service: "Smart Sweep — charge 7",
      amount: sweep.maxCharge,
      date: sweep.nextCharge,
      method: "Visa •• 4021",
      processor: "Paystack",
      status: "Upcoming",
      kind: "smart-sweep",
      attempts: 0,
      note: `${formatNaira(sweep.owed - sweep.collected)} left on your Smart Sweep plan.`,
    },
    {
      id: "up-nov",
      reference: "INV-26-11-0001",
      service: "Slate Home — November",
      amount: me.household.monthly,
      date: "2026-11-01T06:00:00+01:00",
      method: "Visa •• 4021",
      processor: "Paystack",
      status: "Upcoming",
      kind: "plan",
      attempts: 0,
      note: "Charged automatically. Mon & Thu collection, 07:00–09:00.",
    },
    {
      id: "pay-x1",
      reference: "TXN-8RK2PF",
      service: "Extra pickup — 29 Sept",
      amount: 3500,
      date: "2026-09-29T16:40:00+01:00",
      method: "Verve •• 7735",
      processor: "Paystack",
      status: "Failed",
      kind: "extra",
      attempts: 3,
      failureReason: "Card expired",
      note: "Verve •• 7735 expired in September. The pickup went ahead — this charge is still owed.",
    },
    ...base,
  ];
}

/* ================================================================== */
/* Receipts                                                            */
/* ================================================================== */

export interface ReceiptLine {
  label: string;
  sub?: string;
  amount?: number;
}

export interface ReceiptDoc {
  reference: string;
  kind: "Payment receipt" | "Refund receipt" | "Service receipt" | "Contribution receipt";
  /** Headline amount; omit for service receipts. */
  amount?: number;
  headline?: string;
  status: string;
  date: string;
  dateLabel?: string;
  lines: ReceiptLine[];
  meta: Array<{ label: string; value: ReactNode; mono?: boolean }>;
  footnote?: string;
}

export function receiptForTxn(t: Txn): ReceiptDoc {
  const isRefund = t.status === "Refunded";
  const isCommunity = t.kind === "community";
  const lines: ReceiptLine[] =
    t.kind === "plan"
      ? [{ label: t.service, sub: "Mon & Thu collection, 07:00–09:00 · 1 × 240 L bin", amount: t.amount }]
      : t.kind === "bulk"
        ? [
            { label: "Bulk Waste Pickup — deposit", sub: "Old wardrobe and two mattresses · Sat 10 Oct", amount: t.amount },
            { label: "Balance due after collection", sub: "Quoted total ₦18,000", amount: undefined },
          ]
        : isCommunity
          ? [{ label: t.service, sub: "Held by Slate until the project is verified", amount: t.amount }]
          : [{ label: t.service, sub: "One extra collection, same day", amount: t.amount }];
  if (isRefund) lines.push({ label: "Refunded to Visa •• 4021", sub: "26 Aug 2026", amount: -t.amount });
  return {
    reference: t.reference,
    kind: isRefund ? "Refund receipt" : isCommunity ? "Contribution receipt" : "Payment receipt",
    amount: t.amount,
    status: t.status,
    date: t.date,
    lines,
    meta: [
      { label: "Paid by", value: me.household.name },
      { label: "Method", value: t.method },
      { label: "Processor", value: t.processor },
      { label: "Reference", value: t.reference, mono: true },
      { label: "Service address", value: me.household.address },
      ...(t.kind === "plan" || t.kind === "extra" ? [{ label: "Collected by", value: "Ufok Environmental, for Slate" }] : []),
      ...(isCommunity ? [{ label: "Project", value: "Ewet Housing Estate" }] : []),
    ],
    footnote: isCommunity
      ? "Contributions are released to the provider only when the target is met and Slate verifies the work. If the project doesn't go ahead, you're refunded in full."
      : "Slate collects payment and pays your operator. Questions about this charge? Reply in the app or call 0700 752 8300.",
  };
}

const PRINT_CSS = `@media print {
  body:has([data-receipt]) #root { display: none !important; }
  body:has([data-receipt]) .bg-overlay { display: none !important; }
  [role="dialog"]:has([data-receipt]) { box-shadow: none !important; max-height: none !important; }
  [data-noprint], [role="dialog"]:has([data-receipt]) [data-close] { display: none !important; }
}`;

export function printReceipt() {
  try {
    window.print();
  } catch {
    /* print unavailable */
  }
}

export async function shareReceipt(doc: Pick<ReceiptDoc, "reference" | "kind">, toast: ReturnType<typeof useToast>) {
  const url = `https://slate.ng/r/${doc.reference}`;
  const data = { title: `Slate ${doc.kind.toLowerCase()} ${doc.reference}`, url };
  try {
    if (typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare(data))) {
      await navigator.share(data);
      return;
    }
  } catch (e) {
    if ((e as DOMException)?.name === "AbortError") return;
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Receipt link copied", url.replace("https://", ""));
  } catch {
    toast.info("Share link", url.replace("https://", ""));
  }
}

export function downloadReceipt(doc: Pick<ReceiptDoc, "reference">, toast: ReturnType<typeof useToast>) {
  toast.success("Receipt downloaded", `Slate-${doc.reference}.pdf`);
}

/** C24 — a receipt laid out like the printed slip. Used by Payments and Receipts. */
export function ReceiptModal({ doc, onClose }: { doc: ReceiptDoc | null; onClose: () => void }) {
  const toast = useToast();
  return (
    <Modal
      open={!!doc}
      onClose={onClose}
      size="md"
      footer={
        doc && (
          <div data-noprint className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:justify-end">
            <Button variant="outline" leading={<Download className="size-4" />} onClick={() => downloadReceipt(doc, toast)}>
              <span className="max-sm:sr-only">Download</span>
            </Button>
            <Button variant="outline" leading={<Printer className="size-4" />} onClick={printReceipt}>
              <span className="max-sm:sr-only">Print</span>
            </Button>
            <Button leading={<Share2 className="size-4" />} onClick={() => shareReceipt(doc, toast)}>
              Share
            </Button>
          </div>
        )
      }
    >
      {doc && (
        <div data-receipt className="flex flex-col pb-2">
          <style>{PRINT_CSS}</style>
          <div className="flex items-start justify-between gap-4">
            <Logo to={null} />
            <div className="text-right">
              <p className="t-micro uppercase tracking-wider text-ink-3">{doc.kind}</p>
              <p className="t-mono text-ink">{doc.reference}</p>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-display text-[40px] font-bold leading-none tracking-[-0.03em] text-ink tnum">
                {doc.headline ?? formatNaira(doc.amount ?? 0)}
              </p>
              <StatusBadge status={doc.status} />
            </div>
            <p className="t-small text-ink-2 tnum">
              {doc.dateLabel ?? (doc.status === "Pending" ? "Started" : "Paid")} {formatDate(doc.date)}, {formatTime(doc.date)} WAT
            </p>
          </div>

          <Perforation />

          <table className="w-full text-left">
            <caption className="sr-only">Line items</caption>
            <tbody>
              {doc.lines.map((l, i) => (
                <tr key={i} className="align-top">
                  <td className="py-2 pr-4">
                    <p className="t-small font-medium text-ink">{l.label}</p>
                    {l.sub && <p className="t-micro text-ink-3">{l.sub}</p>}
                  </td>
                  <td className={cn("py-2 text-right t-mono", l.amount !== undefined && l.amount < 0 ? "text-success" : "text-ink")}>
                    {l.amount === undefined ? "—" : l.amount < 0 ? `−${formatNaira(-l.amount)}` : formatNaira(l.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            {doc.amount !== undefined && (
              <tfoot>
                <tr className="border-t border-line">
                  <td className="pt-3 t-small font-semibold text-ink">{doc.status === "Refunded" ? "Net paid" : "Total"}</td>
                  <td className="pt-3 text-right t-mono font-semibold text-ink">
                    {formatNaira(doc.lines.reduce((a, l) => a + (l.amount ?? 0), 0))}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>

          <Perforation />

          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {doc.meta.map((m) => (
              <div key={m.label} className="flex min-w-0 flex-col gap-0.5">
                <dt className="t-micro text-ink-3">{m.label}</dt>
                <dd className={cn("text-ink", m.mono ? "t-mono" : "t-small")}>{m.value}</dd>
              </div>
            ))}
          </dl>

          {doc.footnote && <p className="mt-6 t-small text-ink-2">{doc.footnote}</p>}
          <p className="mt-4 border-t border-line pt-4 t-micro text-ink-3">
            Slate Waste Services Ltd · RC 1928374 · 12 Udo Udoma Avenue, Uyo · help@slate.ng
          </p>
        </div>
      )}
    </Modal>
  );
}

function Perforation() {
  return (
    <div className="relative my-6" aria-hidden>
      <div className="border-t-2 border-dashed border-line-strong" />
    </div>
  );
}

/* ================================================================== */
/* Report a payment issue                                              */
/* ================================================================== */

const ISSUES = ["I was charged twice", "The amount is wrong", "I paid but the service didn't happen", "My refund hasn't arrived", "I don't recognise this charge", "Something else"];

export function ReportIssueModal({ txn, onClose }: { txn: Pick<Txn, "reference" | "service" | "amount" | "date"> | null; onClose: () => void }) {
  const toast = useToast();
  const [issue, setIssue] = useState("");
  const [details, setDetails] = useState("");
  const [errors, setErrors] = useState<{ issue?: string; details?: string }>({});
  const [busy, setBusy] = useState(false);
  const close = () => {
    setIssue("");
    setDetails("");
    setErrors({});
    onClose();
  };
  return (
    <Modal
      open={!!txn}
      onClose={close}
      title="Report a payment issue"
      description={txn ? `${txn.service} · ${formatNaira(txn.amount)} · ${formatDate(txn.date)}` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button
            loading={busy}
            onClick={async () => {
              const e: typeof errors = {};
              if (!issue) e.issue = "Choose what went wrong.";
              if (details.trim().length < 10) e.details = "Add a sentence or two so the billing team can check it.";
              setErrors(e);
              if (e.issue || e.details) return;
              setBusy(true);
              await new Promise((r) => setTimeout(r, 800));
              setBusy(false);
              toast.success("Report sent — CMP-1214", "Slate's billing team replies within one working day.");
              close();
            }}
          >
            Send report
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Select
          label="What went wrong?"
          placeholder="Choose one"
          options={ISSUES}
          value={issue}
          error={errors.issue}
          onChange={(e) => {
            setIssue(e.target.value);
            setErrors((x) => ({ ...x, issue: undefined }));
          }}
        />
        <Textarea
          label="Details"
          rows={4}
          placeholder="For example: I see two ₦7,000 debits from Paystack on 1 Oct."
          value={details}
          error={errors.details}
          onChange={(e) => {
            setDetails(e.target.value);
            setErrors((x) => ({ ...x, details: undefined }));
          }}
        />
        {txn && (
          <p className="t-small text-ink-3">
            We'll attach reference <span className="t-mono text-ink-2">{txn.reference}</span> so you don't need to send a screenshot.
          </p>
        )}
      </div>
    </Modal>
  );
}

/* ================================================================== */
/* Cards                                                               */
/* ================================================================== */

export interface SavedCard {
  id: string;
  brand: "Visa" | "Verve" | "Mastercard";
  last4: string;
  exp: string; // MM/YY
  bank: string;
  holder: string;
  isDefault: boolean;
  expired: boolean;
}

export const INITIAL_CARDS: SavedCard[] = [
  { id: "card-visa", brand: "Visa", last4: me.household.card.last4, exp: me.household.card.exp, bank: "GTBank", holder: "IMAOBONG AKPAN", isDefault: true, expired: false },
  { id: "card-verve", brand: "Verve", last4: "7735", exp: "09/26", bank: "First Bank", holder: "IMAOBONG AKPAN", isDefault: false, expired: true },
];

/** Card brand as set type — a wordmark-like label, not a logo. */
export function BrandMark({ brand, className }: { brand: SavedCard["brand"]; className?: string }) {
  return (
    <span className={cn("font-display text-[15px] font-bold tracking-[-0.01em]", brand === "Visa" && "italic", className)}>
      {brand === "Mastercard" ? "mastercard" : brand.toUpperCase()}
    </span>
  );
}

/* ================================================================== */
/* Smart Sweep                                                         */
/* ================================================================== */

export type SweepFrequency = "Every 3 days" | "Weekly" | "Fortnightly";
export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface PlannedCharge {
  date: Date;
  amount: number;
}

/** Splits `owed` into charges no larger than `max`, starting on/after `start`. */
export function planCharges(owed: number, max: number, freq: SweepFrequency, start: Date, weekday?: number): PlannedCharge[] {
  if (!(owed > 0) || !(max > 0)) return [];
  const out: PlannedCharge[] = [];
  const d = new Date(start);
  d.setHours(9, 0, 0, 0);
  if (freq !== "Every 3 days" && weekday !== undefined) while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
  const step = freq === "Every 3 days" ? 3 : freq === "Weekly" ? 7 : 14;
  let left = owed;
  while (left > 0 && out.length < 60) {
    const amt = Math.min(max, left);
    out.push({ date: new Date(d), amount: amt });
    left -= amt;
    d.setDate(d.getDate() + step);
  }
  return out;
}

/** "5 charges of ₦1,500 then ₦500, finishing 9 Nov" */
export function describePlan(charges: PlannedCharge[]): string {
  if (!charges.length) return "";
  const full = charges.filter((c) => c.amount === charges[0]!.amount);
  const last = charges[charges.length - 1]!;
  const finish = last.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const head = `${full.length} ${full.length === 1 ? "charge" : "charges"} of ${formatNaira(charges[0]!.amount)}`;
  return full.length === charges.length ? `${head}, finishing ${finish}` : `${head} then ${formatNaira(last.amount)}, finishing ${finish}`;
}

export interface SweepAttempt {
  id: string;
  date: string;
  amount: number;
  status: "Successful" | "Failed";
  reference: string;
  note?: string;
}

/** Charge history for smartSweeps[0] — sums to ₦8,500 collected. */
export const SWEEP_HISTORY: SweepAttempt[] = [
  { id: "a7", date: "2026-10-01T09:00:00+01:00", amount: 1500, status: "Successful", reference: "SWP-8K2Q-05" },
  { id: "a6", date: "2026-09-24T09:00:00+01:00", amount: 1500, status: "Successful", reference: "SWP-8K2Q-04" },
  { id: "a5", date: "2026-09-18T09:00:00+01:00", amount: 1500, status: "Successful", reference: "SWP-8K2Q-03", note: "Retry 2 of 3" },
  { id: "a4", date: "2026-09-17T09:00:00+01:00", amount: 1500, status: "Failed", reference: "SWP-8K2Q-03", note: "Insufficient funds · retry 1 of 3 scheduled" },
  { id: "a3", date: "2026-09-10T09:00:00+01:00", amount: 1500, status: "Successful", reference: "SWP-8K2Q-02" },
  { id: "a2", date: "2026-09-03T09:00:00+01:00", amount: 1500, status: "Successful", reference: "SWP-8K2Q-01", note: "Limit raised to ₦1,500 on 1 Sept" },
  { id: "a1", date: "2026-08-27T09:00:00+01:00", amount: 1000, status: "Successful", reference: "SWP-8K2Q-00", note: "First charge" },
];
