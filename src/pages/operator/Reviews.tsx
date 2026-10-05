import { useState } from "react";
import { Flag } from "lucide-react";
import { Badge, Button, ChipGroup, EmptyState, Modal, Page, PageHeader, ProgressBar, Section, Select, Sparkline, Switch, Textarea, useToast } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatDate, formatNumber, formatRelative } from "@/lib/format";
import { RatingStars } from "./_biz";
import { OP_REVIEWS, RATING_SUMMARY, type OpReview } from "./_bizData";

const FILTERS = ["All", "5 stars", "4 stars", "3 stars", "2 stars", "1 star"];

/** G17 — ratings and reviews from Slate customers after collections. */
export default function Reviews() {
  const toast = useToast();
  const [filter, setFilter] = useState("All");
  const [withComments, setWithComments] = useState(false);
  const [flagged, setFlagged] = useState<string[]>([]);
  const [flagging, setFlagging] = useState<OpReview | null>(null);

  const stars = filter === "All" ? null : Number(filter[0]);
  const rows = OP_REVIEWS.filter((r) => (stars ? r.rating === stars : true) && (withComments ? !!r.comment : true));
  const s = RATING_SUMMARY;
  const maxCount = Math.max(...Object.values(s.distribution));

  return (
    <Page>
      <PageHeader title="Reviews" description="What customers rate each collection. Slate asks after every pickup; ratings make up 25% of your partner score." />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
        <section aria-labelledby="avg" className="flex flex-col gap-5">
          <div className="flex items-end gap-4">
            <span id="avg" className="t-display-xl leading-[0.85] text-ink tnum">
              {s.average.toFixed(1)}
            </span>
            <div className="mb-1 flex flex-col gap-1">
              <RatingStars value={s.average} size="md" />
              <span className="t-small text-ink-2 tnum">{formatNumber(s.count)} ratings · last 90 days</span>
            </div>
          </div>
          <ul className="flex flex-col gap-1" aria-label="Rating distribution">
            {[5, 4, 3, 2, 1].map((n) => {
              const label = n === 1 ? "1 star" : `${n} stars`;
              const on = filter === label;
              return (
                <li key={n}>
                  <button
                    type="button"
                    onClick={() => setFilter(on ? "All" : label)}
                    aria-pressed={on}
                    className={cn("-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-sm px-2 py-1.5 text-left transition-colors hover:bg-sunken", on && "bg-sunken")}
                  >
                    <span className="w-14 shrink-0 t-small text-ink-2 tnum">{label}</span>
                    <ProgressBar value={s.distribution[n]!} max={maxCount} size="sm" tone={on ? "signal" : "slate"} label={`${label} share`} />
                    <span className="w-12 shrink-0 text-right t-small text-ink tnum">{formatNumber(s.distribution[n]!)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="cats" className="flex flex-col gap-4">
          <div>
            <h2 id="cats" className="t-h2 text-ink">By category</h2>
            <p className="t-small mt-1 text-ink-2">Customers can rate each part of the visit. Trend shows April to October.</p>
          </div>
          <ul className="divide-y divide-line border-y border-line">
            {s.categories.map((c) => (
              <li key={c.key} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3.5 sm:grid-cols-[1fr_96px_auto]">
                <div className="flex flex-col gap-1">
                  <span className="t-body font-medium text-ink">{c.label}</span>
                  <RatingStars value={c.value} />
                </div>
                <Sparkline data={c.trend} className="hidden h-8 sm:block" fill={false} />
                <span className="font-display text-[24px] font-bold text-ink tnum">{c.value.toFixed(1)}</span>
              </li>
            ))}
          </ul>
          <p className="t-small text-ink-3">Lowest is punctuality, pulled down by Shelter Afrique's early runs and the 14 Sep flooding.</p>
        </section>
      </div>

      <Section title="Monthly average" description="Scale starts at 4.0 so the change is visible. Bars are labelled with the number of ratings.">
        <MonthlyChart />
      </Section>

      <Section title="Recent reviews" description="Written reviews from the last 30 days. Customer names are shortened for privacy.">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ChipGroup options={FILTERS} value={[filter]} onChange={(v) => setFilter(v[v.length - 1] ?? "All")} multiple={false} />
          <div className="shrink-0">
            <Switch checked={withComments} onChange={setWithComments} label={<span className="t-small font-medium">With comments only</span>} />
          </div>
        </div>
        {rows.length === 0 ? (
          <EmptyState compact title={`No ${filter.toLowerCase()} reviews`} description="Try another rating, or include reviews without comments." action={<Button variant="secondary" size="sm" onClick={() => { setFilter("All"); setWithComments(false); }}>Show all</Button>} />
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:gap-6">
                <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:w-44 sm:flex-col sm:items-start sm:justify-start sm:gap-1">
                  <RatingStars value={r.rating} />
                  <span className="t-small text-ink-3 tnum" title={formatDate(r.date)}>
                    {formatRelative(r.date)}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  {r.comment ? <p className="t-body text-ink">{r.comment}</p> : <p className="t-body text-ink-3">No comment</p>}
                  <p className="t-small text-ink-2">
                    {r.customer} · {r.area} · {r.driver.split(" ")[0]}'s crew · <span className="t-mono">{r.pickupId}</span>
                  </p>
                  <p className="t-small text-ink-3 tnum">
                    Punctuality {r.punctuality} · Professionalism {r.professionalism} · Quality {r.quality}
                  </p>
                </div>
                <div className="flex shrink-0 items-start sm:justify-end">
                  {flagged.includes(r.id) ? (
                    <Badge tone="warning" dot>
                      Flagged for review
                    </Badge>
                  ) : (
                    <Button variant="ghost" size="sm" leading={<Flag className="size-3.5" />} onClick={() => setFlagging(r)} className="-ml-3 sm:ml-0">
                      Flag
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <FlagModal
        review={flagging}
        onClose={() => setFlagging(null)}
        onFlag={(id) => {
          setFlagged((f) => [...f, id]);
          toast.success("Review flagged", "Slate's quality team checks it against the pickup record within 2 working days. It stays visible meanwhile.");
        }}
      />
    </Page>
  );
}

/** Columns scaled 4.0–5.0, value and count printed — no hover needed. */
function MonthlyChart() {
  const s = RATING_SUMMARY;
  const last = s.monthly.length - 1;
  return (
    <div className="flex flex-col gap-2" role="img" aria-label={`Monthly average rating: ${s.months.map((m, i) => `${m} ${s.monthly[i]}`).join(", ")}`}>
      <div className="relative flex h-44 items-end gap-2 border-b border-line sm:gap-4">
        {[4.25, 4.5, 4.75].map((g) => (
          <span key={g} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-line" style={{ bottom: `${(g - 4) * 100}%` }} aria-hidden />
        ))}
        {s.monthly.map((v, i) => (
          <div key={i} className="relative flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className={cn("t-small font-semibold tnum", i === last ? "text-ink" : "text-ink-2")}>{v.toFixed(1)}</span>
            <div className={cn("w-full max-w-14 rounded-t-[3px]", i === last ? "bg-ink" : "bg-slate-300 dark:bg-slate-600")} style={{ height: `${(v - 4) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="flex gap-2 sm:gap-4">
        {s.months.map((m, i) => (
          <div key={m} className="flex flex-1 flex-col items-center">
            <span className={cn("t-micro", i === last ? "font-semibold text-ink" : "text-ink-3")}>{m}</span>
            <span className="t-micro text-ink-3 tnum">{s.monthlyCount[i]}</span>
          </div>
        ))}
      </div>
      <p className="t-small text-ink-3">October so far: 38 ratings in 4 days.</p>
    </div>
  );
}

function FlagModal({ review, onClose, onFlag }: { review: OpReview | null; onClose: () => void; onFlag: (id: string) => void }) {
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [err, setErr] = useState<string | undefined>();
  const close = () => {
    setReason("");
    setDetail("");
    setErr(undefined);
    onClose();
  };
  return (
    <Modal
      open={!!review}
      onClose={close}
      title="Flag this review"
      description="Slate removes reviews only when the pickup record shows they're about something else, or they break the review rules."
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button
            onClick={() => {
              if (!reason) return setErr("Choose a reason.");
              onFlag(review!.id);
              close();
            }}
          >
            Flag for review
          </Button>
        </>
      }
    >
      {review && (
        <div className="flex flex-col gap-4 pb-2">
          <div className="rounded-md bg-sunken/70 px-3.5 py-3">
            <RatingStars value={review.rating} />
            <p className="mt-1 t-small text-ink-2">{review.comment ?? "No comment"}</p>
            <p className="mt-1 t-small text-ink-3">
              {review.customer} · <span className="t-mono">{review.pickupId}</span>
            </p>
          </div>
          <Select
            label="Reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setErr(undefined);
            }}
            placeholder="Choose a reason"
            options={["About another operator or service", "Pickup record shows it was collected on time", "Offensive or personal", "Duplicate review"]}
            error={err}
          />
          <Textarea label="Anything Slate should check" optional rows={3} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="e.g. Driver app shows arrival at 07:18 with a photo of the empty bin" />
        </div>
      )}
    </Modal>
  );
}
