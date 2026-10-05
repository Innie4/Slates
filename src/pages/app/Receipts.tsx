import { useMemo, useState } from "react";
import { Download, Eye, FileText, MoreHorizontal, Printer, Share2 } from "lucide-react";
import {
  Button, EmptyState, IconButton, List, Menu, Page, PageHeader, Ref, SearchInput, StatusBadge, Tabs, useTab, useToast,
} from "@/components/ui";
import { formatDate, formatNaira, formatTime } from "@/lib/format";
import { me, myPickups, operatorById } from "@/data";
import { ReceiptModal, buildTransactions, downloadReceipt, printReceipt, receiptForTxn, shareReceipt, type ReceiptDoc } from "./_money";

type TabKey = "payment" | "service" | "community";

interface Row {
  id: string;
  tab: TabKey;
  title: string;
  date: string;
  amount?: number;
  status: string;
  doc: ReceiptDoc;
}

function buildRows(): Row[] {
  const txns = buildTransactions().filter((t) => t.status === "Successful" || t.status === "Refunded");
  const pay: Row[] = txns.map((t) => ({
    id: t.id,
    tab: t.kind === "community" ? "community" : "payment",
    title: t.service,
    date: t.date,
    amount: t.amount,
    status: t.status,
    doc: receiptForTxn(t),
  }));
  const service: Row[] = myPickups
    .filter((p) => p.status === "Completed" && p.completedAt)
    .map((p) => {
      const op = operatorById(p.operatorId);
      const recovery = p.note?.startsWith("Recovery");
      return {
        id: p.id,
        tab: "service" as const,
        title: recovery ? "Recovery collection" : p.service === "Recycling Pickup" ? "Recyclables collection" : "Scheduled collection",
        date: p.completedAt!,
        status: "Completed",
        doc: {
          reference: p.id,
          kind: "Service receipt",
          headline: "Collected",
          status: "Completed",
          date: p.completedAt!,
          dateLabel: "Collected",
          lines: [
            { label: p.service, sub: `Window ${p.window}${p.bins ? ` · ${p.bins} × 240 L ${p.bins === 1 ? "bin" : "bins"}` : ""}` },
            ...(recovery ? [{ label: "Missed pickup recovered", sub: p.note }] : []),
          ],
          meta: [
            { label: "Pickup", value: p.id, mono: true },
            { label: "Address", value: p.address },
            { label: "Collected by", value: `${op?.short ?? p.operatorName}, for Slate` },
            { label: "Crew", value: p.driver },
            { label: "Vehicle", value: p.vehicle, mono: true },
            { label: "Covered by", value: p.service === "Recycling Pickup" ? "Recycling Pickup plan" : `${me.household.plan} plan` },
          ],
          footnote: "Proof of collection by a verified, contracted Slate operator. Useful for your landlord, estate association or environmental inspection.",
        } satisfies ReceiptDoc,
      };
    });
  return [...pay, ...service].sort((a, b) => b.date.localeCompare(a.date));
}

const TAB_LABEL: Record<TabKey, string> = { payment: "Payment receipts", service: "Service receipts", community: "Community contributions" };

/** C24 — Receipts for payments, collections and community contributions. */
export default function Receipts() {
  const toast = useToast();
  const tab = useTab<TabKey>("tab", "payment");
  const rows = useMemo(buildRows, []);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<ReceiptDoc | null>(null);

  const count = (k: TabKey) => rows.filter((r) => r.tab === k).length;
  const visible = rows.filter((r) => r.tab === tab && (!q.trim() || `${r.title} ${r.doc.reference}`.toLowerCase().includes(q.trim().toLowerCase())));
  const paidThisYear = rows.filter((r) => r.tab !== "service" && r.status === "Successful").reduce((a, r) => a + (r.amount ?? 0), 0);

  const print = (doc: ReceiptDoc) => {
    setOpen(doc);
    setTimeout(printReceipt, 350);
  };

  const menu = (r: Row) => [
    { label: "View", icon: <Eye />, onSelect: () => setOpen(r.doc) },
    { label: "Download PDF", icon: <Download />, onSelect: () => downloadReceipt(r.doc, toast) },
    { label: "Print", icon: <Printer />, onSelect: () => print(r.doc) },
    { label: "Share", icon: <Share2 />, onSelect: () => shareReceipt(r.doc, toast) },
  ];

  return (
    <Page>
      <PageHeader
        title="Receipts"
        description={`Every payment, collection and contribution gets a receipt. ${formatNaira(paidThisYear)} paid to Slate in 2026 so far.`}
        actions={
          <Button variant="outline" leading={<FileText className="size-4" />} onClick={() => toast.success("2026 statement downloaded", "Slate-statement-2026-Imaobong-Akpan.pdf")}>
            2026 statement
          </Button>
        }
      />

      <div className="flex flex-col gap-5">
        <Tabs<TabKey>
          param="tab"
          value={tab}
          onChange={() => setQ("")}
          items={(Object.keys(TAB_LABEL) as TabKey[]).map((k) => ({ value: k, label: TAB_LABEL[k], count: count(k) }))}
        />
        <div className="max-w-sm">
          <SearchInput compact placeholder="Search by service or reference" aria-label="Search receipts" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {visible.length === 0 ? (
          <EmptyState
            compact
            title={q ? "No receipts match" : tab === "community" ? "No contributions yet" : "No receipts yet"}
            description={q ? `Nothing in ${TAB_LABEL[tab].toLowerCase()} matches “${q}”.` : "Receipts appear here as soon as a payment or collection is confirmed."}
            action={q ? <Button variant="outline" size="sm" onClick={() => setQ("")}>Clear search</Button> : undefined}
          />
        ) : (
          <List className="border-y border-line">
            {visible.map((r) => (
              <div key={r.id} className="group flex items-center gap-3 py-3.5 sm:gap-4">
                <button type="button" onClick={() => setOpen(r.doc)} className="flex min-w-0 flex-1 items-center gap-3.5 rounded-md text-left">
                  <span className="hidden w-14 shrink-0 flex-col items-center rounded-md bg-sunken py-1.5 sm:flex">
                    <span className="t-micro uppercase text-ink-3">{new Date(r.date).toLocaleDateString("en-GB", { month: "short" })}</span>
                    <span className="font-display text-[20px] font-bold leading-none text-ink tnum">{new Date(r.date).getDate()}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block t-body font-medium text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">{r.title}</span>
                    <span className="block t-small text-ink-2 tnum">
                      {formatDate(r.date)}, {formatTime(r.date)} · <Ref className="text-ink-3">{r.doc.reference}</Ref>
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    {r.amount !== undefined ? <span className="t-body font-semibold text-ink tnum">{formatNaira(r.amount)}</span> : <span className="t-small text-ink-3">Included in plan</span>}
                    <StatusBadge status={r.status} />
                  </span>
                </button>
                <div className="hidden items-center gap-1 md:flex">
                  <IconButton label="Download" size="sm" onClick={() => downloadReceipt(r.doc, toast)}><Download /></IconButton>
                  <IconButton label="Print" size="sm" onClick={() => print(r.doc)}><Printer /></IconButton>
                  <IconButton label="Share" size="sm" onClick={() => shareReceipt(r.doc, toast)}><Share2 /></IconButton>
                </div>
                <div className="md:hidden">
                  <Menu items={menu(r)} trigger={(p) => <IconButton label={`Actions for ${r.doc.reference}`} size="sm" {...p}><MoreHorizontal /></IconButton>} />
                </div>
              </div>
            ))}
          </List>
        )}

        {tab === "community" && visible.length > 0 && (
          <p className="max-w-2xl t-small text-ink-3">
            Contributions are held by Slate and released to the provider only when the target is met and the work is verified. If a project doesn't go ahead, you're refunded in full.
          </p>
        )}
      </div>

      <ReceiptModal doc={open} onClose={() => setOpen(null)} />
    </Page>
  );
}
