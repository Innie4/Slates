/**
 * Page-local helpers for the operator business pages
 * (Company, Verification, Services, Service areas, Contracts, Payments,
 * Invoices, Performance, Complaints, Reviews, Documents).
 */
import { useEffect, useState, type ReactNode } from "react";
import { Eye, Star } from "lucide-react";
import { Badge, Button, FileDrop, Input, Modal, Textarea, useToast, type Tone, type UploadedFile } from "@/components/ui";
import { cn } from "@/lib/cn";
import { DEMO_NOW, formatDate, formatNaira } from "@/lib/format";
import type { CompanyDoc, DocStatus } from "./_bizData";

/* ------------------------------------------------------------------ */
/* Time                                                                */
/* ------------------------------------------------------------------ */

const ymd = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

/** Whole calendar days from the demo date (Mon 5 Oct) to `date` (YYYY-MM-DD or ISO). */
export function daysUntil(date: string): number {
  const target = new Date(date.length === 10 ? `${date}T12:00:00+01:00` : date);
  return Math.round((ymd(target) - ymd(DEMO_NOW)) / 86_400_000);
}

/** Demo clock that starts at DEMO_NOW and ticks in real time. */
export function useDemoNow(intervalMs = 1000): number {
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(() => DEMO_NOW.getTime());
  useEffect(() => {
    const t = setInterval(() => setNow(DEMO_NOW.getTime() + (Date.now() - start)), intervalMs);
    return () => clearInterval(t);
  }, [start, intervalMs]);
  return now;
}

/** "1h 58m left", "42m 10s left", "Breached 3h ago" */
export function formatCountdown(ms: number): string {
  const abs = Math.abs(ms);
  const d = Math.floor(abs / 86_400_000);
  const h = Math.floor((abs % 86_400_000) / 3_600_000);
  const m = Math.floor((abs % 3_600_000) / 60_000);
  const s = Math.floor((abs % 60_000) / 1000);
  const span = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m ${String(s).padStart(2, "0")}s`;
  return ms >= 0 ? `${span} left` : `Overdue ${span}`;
}

/* ------------------------------------------------------------------ */
/* Documents                                                           */
/* ------------------------------------------------------------------ */

/** Current status of a document: review outcome first, then expiry. */
export function docStatus(doc: CompanyDoc): DocStatus {
  const latest = doc.versions[0]!;
  if (latest.status === "Pending review" || latest.status === "Rejected") return latest.status;
  if (doc.expires) {
    const d = daysUntil(doc.expires);
    if (d < 0) return "Expired";
    if (d <= 30) return "Expiring";
  }
  return "Verified";
}

export const DOC_TONE: Record<DocStatus | "Superseded" | "Not uploaded" | "Submitted" | "In review" | "Needs changes", Tone> = {
  Verified: "success",
  Expiring: "warning",
  Expired: "danger",
  "Pending review": "info",
  Rejected: "danger",
  Superseded: "neutral",
  "Not uploaded": "outline",
  Submitted: "info",
  "In review": "info",
  "Needs changes": "warning",
};

export function DocBadge({ status }: { status: keyof typeof DOC_TONE }) {
  return (
    <Badge tone={DOC_TONE[status]} dot={status !== "Not uploaded"}>
      {status}
    </Badge>
  );
}

/** "Expires 31 Oct 2026 · 26 days" with the urgency in words, not colour alone. */
export function ExpiryText({ expires, className }: { expires?: string; className?: string }) {
  if (!expires) return <span className={cn("text-ink-3", className)}>No expiry</span>;
  const d = daysUntil(expires);
  return (
    <span className={cn("tnum", className)}>
      <span className={cn(d < 0 ? "text-danger" : d <= 30 ? "text-warning" : "text-ink-2")}>
        {d < 0 ? "Expired" : "Expires"} {formatDate(expires)}
      </span>
      <span className="text-ink-3"> · {d < 0 ? `${Math.abs(d)} days ago` : d === 0 ? "today" : `${d} days`}</span>
    </span>
  );
}

export const formatBytes = (b: number) => (b >= 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1000))} KB`);

/**
 * Upload a document or a new version. Validates the file and, when the
 * document expires, a future expiry date. Toasts on success.
 */
export function UploadModal({
  open,
  onClose,
  title,
  subject,
  needsExpiry,
  note,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subject: string;
  needsExpiry?: boolean;
  note?: ReactNode;
  onDone: (r: { fileName: string; size: string; expires?: string; comment?: string }) => void;
}) {
  const toast = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [expires, setExpires] = useState("");
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState<{ file?: string; expires?: string }>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setFiles([]);
      setExpires("");
      setComment("");
      setErrors({});
      setBusy(false);
    }
  }, [open]);

  const submit = () => {
    const e: typeof errors = {};
    if (!files.length) e.file = "Choose the file to upload.";
    else if (files[0]!.size > 10_000_000) e.file = "That file is over 10 MB. Upload a smaller scan.";
    if (needsExpiry) {
      if (!expires) e.expires = "Enter the expiry date printed on the document.";
      else if (daysUntil(expires) <= 0) e.expires = "The expiry date must be after today.";
    }
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setTimeout(() => {
      onDone({ fileName: files[0]!.name, size: formatBytes(files[0]!.size), expires: expires || undefined, comment: comment || undefined });
      setBusy(false);
      onClose();
      toast.success(`${subject} uploaded`, "Slate compliance reviews new documents within 1 working day.");
    }, 700);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={subject}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy}>
            Upload for review
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        {note}
        <FileDrop
          label="File"
          multiple={false}
          files={files}
          onFiles={(f) => {
            setFiles(f);
            setErrors((x) => ({ ...x, file: undefined }));
          }}
          error={errors.file}
        />
        {needsExpiry && (
          <Input
            label="Expiry date"
            type="date"
            min="2026-10-06"
            value={expires}
            onChange={(e) => {
              setExpires(e.target.value);
              setErrors((x) => ({ ...x, expires: undefined }));
            }}
            error={errors.expires}
            hint="As printed on the document. Slate reminds you 30 days before."
          />
        )}
        <Textarea label="Note for the reviewer" optional rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="e.g. Renewed permit, collected from AKSEPA on 2 Oct" />
      </div>
    </Modal>
  );
}

/** Download stand-in: the demo has no files, so tell the user what would happen. */
export function useDownload() {
  const toast = useToast();
  return (name: string, meta = "PDF") => toast.toast({ title: `Downloading ${name}`, description: meta, tone: "info" });
}

/* ------------------------------------------------------------------ */
/* Brand-adjacent bits                                                 */
/* ------------------------------------------------------------------ */

/**
 * Company monogram in the SlabMark idiom — three cut slabs and the
 * initials on slate. Stands in for the operator's logo until one is uploaded.
 */
export function CompanyMark({ src, initials = "UE", size = "md", className }: { src?: string; initials?: string; size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const box = { sm: "size-9 rounded-sm", md: "size-12 rounded-md", lg: "size-16 rounded-md", xl: "size-24 rounded-lg" }[size];
  const font = { sm: 13, md: 17, lg: 22, xl: 32 }[size];
  if (src)
    return (
      <span className={cn("inline-flex shrink-0 overflow-hidden border border-line bg-surface", box, className)}>
        <img src={src} alt="Company logo" className="size-full object-contain" />
      </span>
    );
  return (
    <span className={cn("relative inline-flex shrink-0 overflow-hidden bg-slate text-slate-ink chalk-grain ring-1 ring-inset ring-white/10", box, className)} aria-label="Company monogram">
      <svg viewBox="0 0 64 64" className="absolute inset-0 size-full" aria-hidden>
        <path d="M26 13 60 7v7l-34 6z" fill="currentColor" opacity=".16" />
        <path d="M26 24 60 18v7l-34 6z" fill="currentColor" opacity=".28" />
        <path d="M26 35 60 29v7l-34 6z" fill="currentColor" opacity=".42" />
      </svg>
      <span
        className="absolute bottom-[11%] left-[12%] font-display font-bold leading-none"
        style={{ fontSize: font, letterSpacing: "-0.04em", fontVariationSettings: '"opsz" 48, "wdth" 90' }}
      >
        {initials}
      </span>
    </span>
  );
}

/** Read-only stars with partial fill. */
export function RatingStars({ value, size = "sm", className }: { value: number; size?: "sm" | "md" | "lg"; className?: string }) {
  const s = { sm: "size-3.5", md: "size-[18px]", lg: "size-6" }[size];
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${value} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className={cn("relative inline-flex", s)}>
            <Star className={cn("absolute inset-0 text-line-strong", s)} strokeWidth={1.5} />
            {fill > 0 && (
              <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={cn("fill-ink text-ink", s)} strokeWidth={1.5} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Layout helpers                                                      */
/* ------------------------------------------------------------------ */

/**
 * A row of figures separated by hairlines. Phones: a ruled list (label left,
 * value right). Tablet+: columns. Not tiles.
 */
export function Figures({
  items,
  className,
}: {
  items: Array<{ label: ReactNode; value: ReactNode; hint?: ReactNode }>;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid divide-y divide-line border-y border-line md:divide-x md:divide-y-0",
        { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4", 5: "md:grid-cols-5" }[items.length] ?? "md:grid-cols-4",
        className,
      )}
    >
      {items.map((it, i) => (
        <div key={i} className={cn("flex items-baseline justify-between gap-4 py-3.5 md:flex-col md:justify-start md:gap-1 md:py-5 md:first:pl-0", items.length >= 5 ? "md:px-4" : "md:px-5")}>
          <dt className="t-small text-ink-2">{it.label}</dt>
          <dd className="flex flex-col items-end text-right md:items-start md:text-left">
            <span className={cn("font-display text-[20px] font-bold leading-tight tracking-[-0.02em] text-ink tnum", items.length >= 5 ? "md:text-[21px] xl:text-[24px]" : "md:text-[26px]")}>{it.value}</span>
            {it.hint && <span className="t-small text-ink-3">{it.hint}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** One line of a money statement. */
export function LedgerRow({
  label,
  sub,
  amount,
  kind = "line",
  className,
}: {
  label: ReactNode;
  sub?: ReactNode;
  amount: number;
  kind?: "line" | "deduction" | "addition" | "subtotal" | "total";
  className?: string;
}) {
  const sign = kind === "deduction" ? "−" : kind === "addition" ? "+" : "";
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4",
        kind === "total" ? "py-4" : kind === "subtotal" ? "py-3" : "py-2.5",
        className,
      )}
    >
      <div className="min-w-0">
        <p className={cn(kind === "total" ? "t-h3 text-ink" : kind === "subtotal" ? "t-small font-semibold text-ink" : "t-small text-ink")}>{label}</p>
        {sub && <p className="t-small text-ink-3">{sub}</p>}
      </div>
      <p
        className={cn(
          "shrink-0 tnum",
          kind === "total" ? "font-display text-[24px] font-bold tracking-[-0.02em] text-ink" : kind === "subtotal" ? "t-small font-semibold text-ink" : "t-mono text-ink",
          kind === "deduction" && "text-danger",
        )}
      >
        {sign}
        {formatNaira(Math.abs(amount))}
      </p>
    </div>
  );
}

/** Dashed "demo preview" strip for state selectors that only exist in the prototype. */
export function PreviewBar({ label = "Preview state", children, className }: { label?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2.5 rounded-md border border-dashed border-line-strong px-3.5 py-3 sm:flex-row sm:items-center sm:gap-4", className)}>
      <span className="inline-flex shrink-0 items-center gap-1.5 t-micro text-ink-3">
        <Eye className="size-3.5" />
        {label}
        <span className="rounded-sm bg-sunken px-1.5 text-ink-3">Demo</span>
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** Plain label/value rows separated by hairlines (inside drawers and panels). */
export function Facts({ items, className }: { items: Array<{ label: ReactNode; value: ReactNode }>; className?: string }) {
  return (
    <dl className={cn("divide-y divide-line", className)}>
      {items.map((it, i) => (
        <div key={i} className="flex items-baseline justify-between gap-6 py-2.5">
          <dt className="t-small shrink-0 text-ink-3">{it.label}</dt>
          <dd className="t-small min-w-0 text-right text-ink">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
