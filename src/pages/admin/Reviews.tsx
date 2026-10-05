import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { EyeOff, Flag, MessageSquareWarning, MoreHorizontal, RotateCcw, CheckCircle2 } from "lucide-react";
import {
  Badge, ConfirmDialog, IconButton, Menu, Page, PageHeader, Section, Select, StackedBar, StateView, Tabs, useToast,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { activeOperators, reviews as baseReviews, type Review } from "@/data";
import { DEMO_NOW, formatDate, formatRelative } from "@/lib/format";
import { Headline, RatingStars, customerIdByName } from "./_gov";

type Status = Review["status"] | "Escalated";
interface AdminReview extends Omit<Review, "status"> {
  status: Status;
  reason?: string;
}

const SEED_REASONS: Record<string, string> = {
  "rv-6": "Auto-flagged: names a crew member in full",
  "rv-19": "Hidden 3 Sep: contained the customer's phone number",
};

const HIDE_REASONS = ["Personal information (phone, address, full name)", "Abusive or threatening language", "Not about the service", "Duplicate or spam"];

const sentimentOf = (r: number) => (r >= 4 ? "Positive" : r === 3 ? "Neutral" : "Negative");
const THEMES: Array<[string, RegExp]> = [
  ["On time", /on time|7:20|three weeks/i],
  ["Missed-pickup recovery", /recovery|missed/i],
  ["Polite crew", /polite|helped/i],
  ["Spillage", /spillage/i],
  ["Bin lid left open", /lid/i],
  ["Late arrival", /late/i],
];

type TabKey = "all" | "flagged" | "low" | "hidden";

export default function Reviews() {
  const toast = useToast();
  const navigate = useNavigate();
  const [rows, setRows] = useState<AdminReview[]>(() =>
    baseReviews.map((r) => ({ ...r, reason: SEED_REASONS[r.id] })).sort((a, b) => b.date.localeCompare(a.date)),
  );
  const [tab, setTab] = useState<TabKey>("all");
  const [operator, setOperator] = useState("");
  const [hiding, setHiding] = useState<AdminReview | null>(null);
  const [hideReason, setHideReason] = useState(HIDE_REASONS[0]!);

  const visible = rows.filter((r) => r.status !== "Hidden");
  const avg = visible.reduce((a, r) => a + r.rating, 0) / Math.max(1, visible.length);
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, count: visible.filter((r) => r.rating === n).length }));
  const maxDist = Math.max(...dist.map((d) => d.count), 1);
  const sentiment = { Positive: 0, Neutral: 0, Negative: 0 } as Record<string, number>;
  visible.forEach((r) => sentiment[sentimentOf(r.rating)]!++);
  const positivePct = Math.round((sentiment.Positive! / Math.max(1, visible.length)) * 100);
  const themes = THEMES.map(([label, re]) => ({ label, count: visible.filter((r) => re.test(r.comment)).length })).filter((t) => t.count > 0).sort((a, b) => b.count - a.count);

  const byOperator = useMemo(
    () =>
      activeOperators
        .map((o) => {
          const rs = visible.filter((r) => r.operatorName === o.short);
          const mean = (f: (r: AdminReview) => number) => (rs.length ? rs.reduce((a, r) => a + f(r), 0) / rs.length : 0);
          return { op: o, count: rs.length, rating: mean((r) => r.rating), punctuality: mean((r) => r.punctuality), professionalism: mean((r) => r.professionalism), quality: mean((r) => r.quality) };
        })
        .sort((a, b) => b.rating - a.rating),
    [visible],
  );
  const lowest = byOperator[byOperator.length - 1];

  const list = rows
    .filter((r) => (tab === "all" ? r.status !== "Hidden" : tab === "flagged" ? r.status === "Flagged" : tab === "low" ? r.rating <= 2 && r.status !== "Hidden" : r.status === "Hidden"))
    .filter((r) => !operator || r.operatorName === operator);

  const set = (id: string, patch: Partial<AdminReview>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <Page>
      <PageHeader title="Reviews" description="Ratings customers leave after each collection, and what they say about each operator." />

      <Headline
        kicker="Average rating · last 60 days"
        value={avg.toFixed(1)}
        unit={`out of 5 · ${visible.length} reviews`}
        aside={
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5" aria-label="Rating distribution">
              {dist.map((d) => (
                <div key={d.n} className="flex items-center gap-3">
                  <span className="w-3 t-small text-ink-2 tnum">{d.n}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-sunken">
                    <span className={cn("block h-full rounded-full", d.n <= 2 ? "bg-danger/80" : "bg-slate dark:bg-slate-300")} style={{ width: `${(d.count / maxDist) * 100}%` }} />
                  </span>
                  <span className="w-5 text-right t-small text-ink tnum">{d.count}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <p className="t-micro text-ink-3">Customer sentiment</p>
              <StackedBar
                segments={[
                  { label: "Positive", value: sentiment.Positive!, tone: "success" },
                  { label: "Neutral", value: sentiment.Neutral!, tone: "muted" },
                  { label: "Negative", value: sentiment.Negative!, tone: "danger" },
                ]}
              />
            </div>
          </div>
        }
      >
        <p>
          {positivePct}% of reviews are positive.{" "}
          {lowest && (
            <>
              <span className="font-medium text-ink">{lowest.op.short}</span> is the lowest rated at {lowest.rating.toFixed(1)}, mostly for spillage and late arrival.
            </>
          )}
        </p>
      </Headline>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
        {/* Reviews */}
        <Section title="All reviews">
          <div className="flex flex-col gap-4">
            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { value: "all", label: "Published", count: rows.filter((r) => r.status !== "Hidden").length },
                { value: "flagged", label: "Flagged", count: rows.filter((r) => r.status === "Flagged").length },
                { value: "low", label: "1–2 stars", count: rows.filter((r) => r.rating <= 2 && r.status !== "Hidden").length },
                { value: "hidden", label: "Hidden", count: rows.filter((r) => r.status === "Hidden").length },
              ]}
            />
            <div className="flex items-center justify-between gap-3">
              <p className="t-small text-ink-3 tnum">{list.length} reviews</p>
              <Select
                compact
                aria-label="Operator"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="All operators"
                options={activeOperators.map((o) => o.short)}
                className="w-48"
              />
            </div>
            {list.length === 0 ? (
              <StateView state="empty" compact title={tab === "flagged" ? "Nothing flagged" : "No reviews here"} description={tab === "flagged" ? "Flagged reviews wait here until someone checks them against the review policy." : "Try another operator."} />
            ) : (
              <ul className="flex flex-col divide-y divide-line border-y border-line">
                {list.map((r) => {
                  const cid = customerIdByName(r.customerName);
                  return (
                    <li key={r.id} className={cn("flex gap-4 py-5", r.status === "Hidden" && "opacity-75")}>
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <RatingStars value={r.rating} />
                          <span className="t-small font-medium text-ink tnum">{r.rating}.0</span>
                          {r.status !== "Published" && <Badge tone={r.status === "Flagged" ? "warning" : r.status === "Escalated" ? "danger" : "neutral"} dot>{r.status}</Badge>}
                          <Badge tone={sentimentOf(r.rating) === "Positive" ? "success" : sentimentOf(r.rating) === "Negative" ? "danger" : "neutral"} className="sm:hidden">
                            {sentimentOf(r.rating)}
                          </Badge>
                        </div>
                        <p className="t-body text-ink">“{r.comment}”</p>
                        <p className="t-small text-ink-2">
                          {cid ? <Link to={`/admin/customers/${cid}`} className="font-medium text-ink hover:underline">{r.customerName}</Link> : r.customerName} on{" "}
                          <Link to={`/admin/operators/${activeOperators.find((o) => o.short === r.operatorName)?.id}`} className="font-medium text-ink hover:underline">{r.operatorName}</Link>
                          <span className="text-ink-3"> · {formatRelative(r.date)}</span>
                        </p>
                        <p className="t-micro text-ink-3 tnum">
                          Punctuality {r.punctuality} · Professionalism {r.professionalism} · Quality {r.quality}
                        </p>
                        {r.reason && <p className="t-small text-ink-3">{r.reason}</p>}
                      </div>
                      <Menu
                        trigger={(p) => (
                          <IconButton {...p} label="Review actions" size="sm" className="shrink-0">
                            <MoreHorizontal />
                          </IconButton>
                        )}
                        items={[
                          ...(r.status === "Flagged"
                            ? [{ label: "Keep published", icon: <CheckCircle2 />, onSelect: () => { set(r.id, { status: "Published", reason: `Reviewed ${formatDate(DEMO_NOW).replace(/ \d{4}$/, "")} by Idara Umoh — meets policy` }); toast.success("Review kept published", "It meets the review policy."); } }]
                            : []),
                          ...(r.status === "Published" || r.status === "Escalated"
                            ? [{ label: "Flag for review", icon: <Flag />, onSelect: () => { set(r.id, { status: "Flagged", reason: "Flagged by Idara Umoh" }); toast.info("Flagged for review"); } }]
                            : []),
                          ...(r.status !== "Hidden"
                            ? [{ label: "Hide review", icon: <EyeOff />, onSelect: () => { setHideReason(HIDE_REASONS[0]!); setHiding(r); } }]
                            : [{ label: "Restore review", icon: <RotateCcw />, onSelect: () => { set(r.id, { status: "Published", reason: undefined }); toast.success("Review restored", "It's visible to the operator and in ratings again."); } }]),
                          { divider: true, label: "" },
                          {
                            label: "Escalate to complaint",
                            icon: <MessageSquareWarning />,
                            onSelect: () => {
                              set(r.id, { status: "Escalated", reason: "Escalated to complaints for follow-up" });
                              toast.toast({ title: "Escalated to complaints", description: `Log it for ${r.customerName} so the SLA starts.`, tone: "info", action: { label: "Log", onClick: () => navigate("/admin/complaints?new=1") } });
                            },
                          },
                        ]}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Section>

        {/* Operator ratings + themes */}
        <aside className="flex flex-col gap-10">
          <Section title="Operator ratings" description="From published reviews only.">
            <ul className="flex flex-col divide-y divide-line border-y border-line">
              {byOperator.map((o) => (
                <li key={o.op.id}>
                  <Link to={`/admin/operators/${o.op.id}`} className="group flex flex-col gap-3 py-4">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="t-body font-medium text-ink group-hover:underline">{o.op.short}</span>
                      <span className={cn("font-display text-[22px] font-bold leading-none tnum", o.rating < 3.8 ? "text-warning" : "text-ink")}>{o.rating.toFixed(1)}</span>
                    </span>
                    <span className="grid grid-cols-3 gap-3">
                      {(["punctuality", "professionalism", "quality"] as const).map((k) => (
                        <span key={k} className="flex flex-col gap-1">
                          <span className="t-micro capitalize text-ink-3">{k === "professionalism" ? "Conduct" : k}</span>
                          <span className="h-1.5 overflow-hidden rounded-full bg-sunken">
                            <span className="block h-full rounded-full bg-slate dark:bg-slate-300" style={{ width: `${(o[k] / 5) * 100}%` }} />
                          </span>
                          <span className="t-micro text-ink-2 tnum">{o[k].toFixed(1)}</span>
                        </span>
                      ))}
                    </span>
                    <span className="t-micro text-ink-3">{o.count} reviews · {o.op.complaints30d} complaints in 30 days</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="What customers mention">
            <ul className="flex flex-col gap-2.5">
              {themes.map((t) => (
                <li key={t.label} className="flex items-center justify-between gap-3 t-small">
                  <span className="text-ink-2">{t.label}</span>
                  <span className="font-medium text-ink tnum">{t.count}</span>
                </li>
              ))}
            </ul>
          </Section>
        </aside>
      </div>

      <ConfirmDialog
        open={!!hiding}
        onClose={() => setHiding(null)}
        title="Hide this review?"
        description="Slate's review policy allows hiding a review only when it breaks one of the rules below. A low rating or criticism of the service is never a reason to hide it."
        confirmLabel="Hide review"
        onConfirm={() => {
          if (!hiding) return;
          set(hiding.id, { status: "Hidden", reason: `Hidden by Idara Umoh: ${hideReason.split(" (")[0]!.toLowerCase()}` });
          toast.success("Review hidden", "Removed from ratings and the operator's view. The customer is told why.");
        }}
      >
        {hiding && (
          <div className="flex flex-col gap-3">
            <p className="rounded-md bg-sunken px-3.5 py-3 t-small text-ink-2">“{hiding.comment}” — {hiding.customerName}, {hiding.rating}★</p>
            <Select label="Policy reason" value={hideReason} onChange={(e) => setHideReason(e.target.value)} options={HIDE_REASONS} />
          </div>
        )}
      </ConfirmDialog>
    </Page>
  );
}
