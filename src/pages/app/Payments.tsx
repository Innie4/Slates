import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Copy, Flag, MoreHorizontal, Receipt, RefreshCw, RotateCw } from "lucide-react";
import {
  Alert, Button, ButtonLink, ConfirmDialog, DataTable, EmptyState, IconButton, List, Menu, Page, PageHeader, Ref, StatusBadge, Tabs, useTab, useToast,
  type Column, type MenuItem,
} from "@/components/ui";
import { DEMO_NOW, formatDate, formatDay, formatNaira, formatTime } from "@/lib/format";
import { ReceiptModal, ReportIssueModal, buildTransactions, receiptForTxn, type ReceiptDoc, type Txn, type TxnStatus } from "./_money";

type TabKey = "upcoming" | "successful" | "failed" | "pending" | "refunded";
const TAB_STATUS: Record<TabKey, TxnStatus> = { upcoming: "Upcoming", successful: "Successful", failed: "Failed", pending: "Pending", refunded: "Refunded" };

const shortDate = (d: string) => formatDate(d).replace(/ \d{4}$/, "");

/** C13 — Payment history and upcoming charges. */
export default function Payments() {
  const toast = useToast();
  const tab = useTab<TabKey>("tab", "upcoming");
  const [txns, setTxns] = useState<Txn[]>(buildTransactions);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptDoc | null>(null);
  const [report, setReport] = useState<Txn | null>(null);
  const [payEarly, setPayEarly] = useState<Txn | null>(null);

  const by = (s: TxnStatus) => txns.filter((t) => t.status === s);
  const counts = useMemo(
    () => Object.fromEntries((Object.keys(TAB_STATUS) as TabKey[]).map((k) => [k, txns.filter((t) => t.status === TAB_STATUS[k]).length])) as Record<TabKey, number>,
    [txns],
  );

  const paid = by("Successful");
  const paidTotal = paid.reduce((a, t) => a + t.amount, 0);
  const pending = by("Pending");
  const outstanding = by("Failed").filter((t) => !t.settledBy);
  const upcoming = by("Upcoming").sort((a, b) => a.date.localeCompare(b.date));
  const earliest = paid.map((t) => t.date).sort()[0];

  const retry = async (t: Txn) => {
    setRetrying(t.id);
    await new Promise((r) => setTimeout(r, 1600));
    setRetrying(null);
    const done: Txn = {
      ...t,
      status: "Successful",
      method: "Visa •• 4021",
      date: DEMO_NOW.toISOString(),
      attempts: t.attempts + 1,
      note: `Paid on retry with Visa •• 4021 after ${t.attempts} failed ${t.attempts === 1 ? "attempt" : "attempts"} on Verve •• 7735.`,
      failureReason: undefined,
    };
    setTxns((xs) => xs.map((x) => (x.id === t.id ? done : x)));
    toast.toast({
      title: `${formatNaira(t.amount)} paid`,
      description: `${t.service} · Visa •• 4021`,
      action: { label: "Receipt", onClick: () => setReceipt(receiptForTxn(done)) },
    });
  };

  const copyRef = async (ref: string) => {
    try {
      await navigator.clipboard.writeText(ref);
      toast.success("Reference copied", ref);
    } catch {
      toast.info("Reference", ref);
    }
  };

  const menuFor = (t: Txn): MenuItem[] => [
    ...(t.status === "Successful" || t.status === "Refunded" ? [{ label: "View receipt", icon: <Receipt />, onSelect: () => setReceipt(receiptForTxn(t)) }] : []),
    ...(t.status === "Pending" ? [{ label: "Check status", icon: <RefreshCw />, onSelect: () => toast.info("Still confirming with your bank", "Most confirm within 2 hours. We'll notify you either way.") }] : []),
    { label: "Copy reference", icon: <Copy />, onSelect: () => copyRef(t.reference) },
    { label: "Report an issue", icon: <Flag />, onSelect: () => setReport(t) },
  ];

  const actions = (t: Txn, compact?: boolean) => (
    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
      {t.status === "Failed" && !t.settledBy && (
        <Button size="sm" loading={retrying === t.id} leading={<RotateCw className="size-3.5" />} onClick={() => retry(t)}>
          {retrying === t.id ? "Retrying" : "Retry"}
        </Button>
      )}
      {!compact && (t.status === "Successful" || t.status === "Refunded") && (
        <Button size="sm" variant="ghost" onClick={() => setReceipt(receiptForTxn(t))}>
          Receipt
        </Button>
      )}
      <Menu items={menuFor(t)} trigger={(p) => <IconButton label={`More for ${t.reference}`} size="sm" {...p}><MoreHorizontal /></IconButton>} />
    </div>
  );

  const columns: Column<Txn>[] = [
    {
      key: "date",
      header: "Date",
      sortValue: (t) => t.date,
      className: "w-28",
      cell: (t) => (
        <span className="flex flex-col">
          <span className="text-ink tnum">{shortDate(t.date)}</span>
          <span className="t-micro text-ink-3 tnum">{formatTime(t.date)}</span>
        </span>
      ),
    },
    {
      key: "service",
      header: "Payment",
      cell: (t) => (
        <span className="flex max-w-md flex-col gap-0.5">
          <span className="font-medium text-ink">{t.service}</span>
          {t.note ? <span className="t-small text-ink-3">{t.note}</span> : <span className="t-small text-ink-3">{t.method}</span>}
        </span>
      ),
    },
    { key: "ref", header: "Reference", cell: (t) => <Ref>{t.reference}</Ref> },
    { key: "amount", header: "Amount", align: "right", sortValue: (t) => t.amount, cell: (t) => <span className="t-mono text-[14px] text-ink">{formatNaira(t.amount)}</span> },
    { key: "status", header: "Status", cell: (t) => (t.settledBy ? <span className="flex flex-col items-start gap-1"><StatusBadge status="Failed" /><span className="t-micro text-ink-3">Settled</span></span> : <StatusBadge status={t.status} />) },
    { key: "actions", header: <span className="sr-only">Actions</span>, align: "right", cell: (t) => actions(t) },
  ];

  const mobileRow = (t: Txn) => (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="t-body font-medium text-ink">{t.service}</p>
          <p className="t-small text-ink-2 tnum">
            {shortDate(t.date)}, {formatTime(t.date)} · <Ref className="text-ink-3">{t.reference}</Ref>
          </p>
          <p className="t-small text-ink-3">{t.note ?? t.method}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="t-body font-semibold text-ink tnum">{formatNaira(t.amount)}</span>
          <StatusBadge status={t.status} />
        </div>
        <div className="-mr-1.5 -mt-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Menu items={menuFor(t)} trigger={(p) => <IconButton label={`More for ${t.reference}`} size="sm" {...p}><MoreHorizontal /></IconButton>} />
        </div>
      </div>
      {t.status === "Failed" && !t.settledBy && (
        <div onClick={(e) => e.stopPropagation()}>
          <Button size="sm" loading={retrying === t.id} leading={<RotateCw className="size-3.5" />} onClick={() => retry(t)}>
            {retrying === t.id ? "Retrying" : `Retry ${formatNaira(t.amount)} with Visa •• 4021`}
          </Button>
        </div>
      )}
    </div>
  );

  const rows = by(TAB_STATUS[tab]).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Page>
      <PageHeader
        title="Payments"
        actions={
          <>
            <ButtonLink to="/app/receipts" variant="outline">Receipts</ButtonLink>
            <ButtonLink to="/app/payment-methods" variant="secondary">Payment methods</ButtonLink>
          </>
        }
      />

      {/* The summary is a sentence, not tiles */}
      <section aria-label="Summary" className="-mt-2 flex max-w-3xl flex-col gap-3">
        <p className="t-h2 font-normal text-ink-2">
          You've paid <span className="font-semibold text-ink tnum">{formatNaira(paidTotal)}</span> since {earliest ? shortDate(earliest) : "you joined"} across {paid.length} payments.
          {pending.length > 0 && (
            <>
              {" "}
              <span className="font-semibold text-ink tnum">{formatNaira(pending.reduce((a, t) => a + t.amount, 0))}</span> is pending with your bank
            </>
          )}
          {outstanding.length > 0 ? (
            <>
              {pending.length > 0 ? ", and " : " "}
              <span className="font-semibold text-ink">{outstanding.length === 1 ? "one charge" : `${outstanding.length} charges`}</span> {outstanding.length === 1 ? "needs" : "need"} a retry.
            </>
          ) : (
            "."
          )}
        </p>
        {upcoming.length > 0 && (
          <p className="t-body text-ink-2">
            Next: {upcoming.map((u, i) => (
              <span key={u.id}>
                {i > 0 && (i === upcoming.length - 1 ? ", then " : ", ")}
                <span className="font-medium text-ink tnum">{formatNaira(u.amount)}</span> {u.kind === "smart-sweep" ? "Smart Sweep" : u.service.replace("Slate Home — ", "for ")} on {formatDay(u.date)}
              </span>
            ))}
            , to Visa •• 4021.
          </p>
        )}
      </section>

      {outstanding.map((t) => (
        <Alert
          key={t.id}
          tone="danger"
          title={`${t.service.split(" — ")[0]} charge of ${formatNaira(t.amount)} didn't go through`}
        >
          <p>
            {t.failureReason} — tried {t.attempts} times on {t.method}. Retry with your default card, or{" "}
            <Link to="/app/payment-methods" className="font-medium text-ink underline underline-offset-2">update your cards</Link>.
          </p>
          <Button size="sm" className="mt-3" loading={retrying === t.id} leading={<RotateCw className="size-3.5" />} onClick={() => retry(t)}>
            {retrying === t.id ? "Retrying" : "Retry with Visa •• 4021"}
          </Button>
        </Alert>
      ))}

      <div className="flex flex-col gap-5">
        <Tabs<TabKey>
          param="tab"
          value={tab}
          items={[
            { value: "upcoming", label: "Upcoming", count: counts.upcoming },
            { value: "successful", label: "Successful", count: counts.successful },
            { value: "failed", label: "Failed", count: counts.failed },
            { value: "pending", label: "Pending", count: counts.pending },
            { value: "refunded", label: "Refunded", count: counts.refunded },
          ]}
        />

        {tab === "upcoming" ? (
          upcoming.length ? (
            <List>
              {upcoming.map((u) => (
                <div key={u.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3.5">
                    <div className="flex w-12 shrink-0 flex-col items-center rounded-md bg-sunken py-1.5">
                      <span className="t-micro uppercase text-ink-3">{new Date(u.date).toLocaleDateString("en-GB", { month: "short" })}</span>
                      <span className="font-display text-[20px] font-bold leading-none text-ink tnum">{new Date(u.date).getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="t-body font-medium text-ink">{u.service}</p>
                      <p className="t-small text-ink-2">
                        {formatDay(u.date)} · auto-charge to {u.method}
                      </p>
                      {u.note && <p className="t-small text-ink-3">{u.note}</p>}
                    </div>
                    <span className="t-body font-semibold text-ink tnum sm:hidden">{formatNaira(u.amount)}</span>
                  </div>
                  <span className="hidden w-24 text-right t-mono text-[14px] text-ink sm:block">{formatNaira(u.amount)}</span>
                  <div className="flex gap-2 pl-[62px] sm:w-56 sm:justify-end sm:pl-0">
                    {u.kind === "smart-sweep" ? (
                      <ButtonLink to="/app/smart-sweep" size="sm" variant="outline">Manage plan</ButtonLink>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setPayEarly(u)}>Pay now</Button>
                        <ButtonLink to="/app/payment-methods" size="sm" variant="ghost">Change card</ButtonLink>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </List>
          ) : (
            <EmptyState compact title="Nothing scheduled" description="Your next plan charge appears here a month ahead." />
          )
        ) : (
          <DataTable
            rows={rows}
            columns={columns}
            rowKey={(t) => t.id}
            mobile={mobileRow}
            onRowClick={tab === "successful" || tab === "refunded" ? (t) => setReceipt(receiptForTxn(t)) : undefined}
            empty={
              <EmptyState
                compact
                title={{ successful: "No payments yet", failed: "No failed payments", pending: "Nothing pending", refunded: "No refunds" }[tab]}
                description={
                  {
                    successful: "Payments appear here once your bank confirms them.",
                    failed: "Every charge has gone through. If one fails, Slate retries up to three times and tells you.",
                    pending: "Bank confirmations usually take a few minutes.",
                    refunded: "Refunds for cancelled or failed services appear here.",
                  }[tab]
                }
              />
            }
          />
        )}
      </div>

      <p className="t-small text-ink-3">
        Payments are processed by Paystack. Slate pays your operator from what you pay — you never pay the operator directly.{" "}
        <Link to="/app/support" className="font-medium text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink">Billing help</Link>
      </p>

      <ReceiptModal doc={receipt} onClose={() => setReceipt(null)} />
      <ReportIssueModal txn={report} onClose={() => setReport(null)} />
      <ConfirmDialog
        open={!!payEarly}
        onClose={() => setPayEarly(null)}
        title={payEarly ? `Pay ${formatNaira(payEarly.amount)} now?` : ""}
        description="We'll charge Visa •• 4021 today and skip the automatic charge on 1 Nov. Your collection days don't change."
        confirmLabel="Pay now"
        onConfirm={() => {
          if (!payEarly) return;
          const done: Txn = { ...payEarly, status: "Successful", date: DEMO_NOW.toISOString(), reference: "TXN-9VF3HC", attempts: 1, note: "Paid early." };
          setTxns((xs) => xs.map((x) => (x.id === payEarly.id ? done : x)));
          toast.toast({ title: `${formatNaira(done.amount)} paid`, description: "November is covered.", action: { label: "Receipt", onClick: () => setReceipt(receiptForTxn(done)) } });
        }}
      />
    </Page>
  );
}
