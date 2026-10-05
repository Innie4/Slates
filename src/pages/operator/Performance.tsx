import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { Alert, AreaChart, Badge, DataTable, Meter, Page, PageHeader, ProgressBar, Section, Segmented, type Column } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { AREA_PERF, PERF_SERIES, SCORE_BANDS, SCORE_PARTS, TARGETS, UFOK, WEEKS } from "./_bizData";

type Metric = "score" | "completion" | "missed" | "response";

const METRICS: Record<Metric, { label: string; data: number[]; compare?: number[]; format: (v: number) => string; summary: string }> = {
  score: { label: "Score", data: PERF_SERIES.score, compare: PERF_SERIES.scorePrev, format: (v) => `${v}`, summary: "Up from 88 to 94 over 12 weeks. The dashed line is the 12 weeks before." },
  completion: { label: "Completion", data: PERF_SERIES.completion, format: (v) => `${v.toFixed(1)}%`, summary: "Above the 97% contract target every week since 27 Jul." },
  missed: { label: "Missed", data: PERF_SERIES.missed, format: (v) => `${v} missed`, summary: "Missed pickups not recovered within 24h, per week. 11 in September against a limit of 15." },
  response: { label: "Response", data: PERF_SERIES.response, format: (v) => `${v} min`, summary: "Average minutes to acknowledge a Slate escalation. Target is 2 hours." },
};

const BAND_BAR = { suspend: "bg-danger", warning: "bg-warning", maintain: "bg-slate dark:bg-slate-400", reward: "bg-success" } as const;

/** G15 — the partner score, how it's made, and where it moves. */
export default function Performance() {
  const [metric, setMetric] = useState<Metric>("score");
  const m = METRICS[metric];
  const score = UFOK.score;
  const band = SCORE_BANDS.find((b) => score >= b.min && score <= b.max)!;

  const targetCols: Column<(typeof TARGETS)[number]>[] = [
    { key: "metric", header: "Measure", cell: (r) => <span className="font-medium text-ink">{r.metric}</span> },
    { key: "target", header: "Contract target", cell: (r) => <span className="text-ink-2">{r.target}</span>, mobileLabel: "Target" },
    { key: "actual", header: "September", align: "right", cell: (r) => <span className="font-semibold tnum text-ink">{r.actual}</span>, mobileLabel: "September" },
    { key: "status", header: "Status", cell: (r) => <Badge tone={r.status === "Met" ? "success" : "warning"} dot>{r.status}</Badge> },
  ];

  const areaCols: Column<(typeof AREA_PERF)[number]>[] = [
    { key: "area", header: "Area", cell: (r) => <span className="font-medium text-ink">{r.area}</span>, sortValue: (r) => r.area },
    { key: "customers", header: "Customers", align: "right", cell: (r) => <span className="tnum">{formatNumber(r.customers)}</span>, sortValue: (r) => r.customers },
    { key: "completion", header: "Completion", align: "right", cell: (r) => <span className="tnum">{r.completion}%</span>, sortValue: (r) => r.completion },
    { key: "window", header: "In window", align: "right", cell: (r) => <span className={cn("tnum", r.window < 95 && "text-warning")}>{r.window}%</span>, sortValue: (r) => r.window },
    { key: "missed", header: "Missed", align: "right", cell: (r) => <span className="tnum">{r.missed}</span>, sortValue: (r) => r.missed, mobileLabel: "Missed (24h)" },
    { key: "complaints", header: "Complaints", align: "right", cell: (r) => <span className="tnum">{r.complaints}</span>, sortValue: (r) => r.complaints },
    { key: "rating", header: "Rating", align: "right", cell: (r) => <span className="tnum">{r.rating.toFixed(1)}</span>, sortValue: (r) => r.rating },
    {
      key: "score",
      header: "Score",
      cell: (r) => (
        <span className="flex items-center gap-2.5">
          <span className="w-7 font-semibold tnum text-ink">{r.score}</span>
          <Meter value={r.score} segments={10} className="w-20" />
        </span>
      ),
      sortValue: (r) => r.score,
    },
  ];

  return (
    <Page>
      <PageHeader
        title="Performance"
        description="How Slate scores Ufok each week. The score decides renewals, new areas and payout terms."
        meta={<span className="t-small text-ink-3">Updated Mon 5 Oct, 06:00</span>}
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14">
        {/* The score */}
        <section aria-labelledby="score-h" className="flex flex-col gap-5">
          <p id="score-h" className="t-micro text-ink-3">Partner score, week of 28 Sep</p>
          <div className="flex items-end gap-3">
            <span className="t-display-xl leading-[0.85] text-ink tnum">{score}</span>
            <span className="mb-1 t-h2 text-ink-3">/ 100</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="success" dot size="md">
              {band.label} band
            </Badge>
            <span className="inline-flex items-center gap-1 t-small font-medium text-success tnum">
              <ArrowUp className="size-3.5" />2 on last month
            </span>
          </div>
          <Meter value={score} segments={20} className="[&>span]:h-2.5" />
          <p className="t-body text-ink-2">
            Ufok is Slate's highest-scoring operator in Uyo. In the reward band you get first refusal on new estates in Ewet, Shelter Afrique and Osongama. One measure is below
            contract: pickups inside the window.
          </p>
        </section>

        {/* How it's computed */}
        <section aria-labelledby="how-h" className="flex flex-col gap-4">
          <div>
            <h2 id="how-h" className="t-h2 text-ink">How the score is worked out</h2>
            <p className="t-small mt-1 text-ink-2">Four measures, weighted. Recalculated every Monday from the last 30 days.</p>
          </div>
          <ul className="divide-y divide-line border-y border-line">
            {SCORE_PARTS.map((p) => (
              <li key={p.key} className="flex flex-col gap-2 py-3.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="t-body font-medium text-ink">
                    {p.label} <span className="t-small font-normal text-ink-3">· {p.weight}%</span>
                  </span>
                  <span className="t-small tnum text-ink-2">
                    <span className="font-semibold text-ink">{p.points}</span> / {p.weight}
                  </span>
                </div>
                <ProgressBar value={p.points} max={p.weight} size="sm" label={`${p.label} points`} />
                <p className="t-small text-ink-3">{p.basis}</p>
              </li>
            ))}
            <li className="flex items-baseline justify-between py-3.5">
              <span className="t-body font-semibold text-ink">Total</span>
              <span className="t-body font-semibold tnum text-ink">{SCORE_PARTS.reduce((a, p) => a + p.points, 0).toFixed(0)} / 100</span>
            </li>
          </ul>
        </section>
      </div>

      <Section title="What the score means" description="Slate reviews bands on the first Monday of each month.">
        <ol className="grid gap-2 sm:grid-cols-4">
          {SCORE_BANDS.map((b) => {
            const here = b.key === band.key;
            return (
              <li key={b.key} className={cn("flex flex-col gap-2 rounded-md border p-4", here ? "border-ink bg-surface" : "border-line")}>
                <span className={cn("h-1.5 w-full rounded-full", BAND_BAR[b.key as keyof typeof BAND_BAR], !here && "opacity-40")} />
                <div className="flex items-baseline justify-between gap-2">
                  <span className="t-small font-semibold text-ink">{b.label}</span>
                  <span className="t-mono text-ink-3">
                    {b.min}–{b.max}
                  </span>
                </div>
                <p className="t-small text-ink-2">{b.effect}</p>
                {here && <span className="mt-auto t-micro font-semibold text-ink">Ufok is here · {score}</span>}
              </li>
            );
          })}
        </ol>
      </Section>

      <Section
        title="12-week trend"
        description={m.summary}
        actions={<Segmented<Metric> size="sm" value={metric} onChange={setMetric} options={(Object.keys(METRICS) as Metric[]).map((k) => ({ value: k, label: METRICS[k].label }))} />}
      >
        <AreaChart data={m.data} compare={m.compare} labels={WEEKS} format={m.format} label={`${m.label}, last 12 weeks`} height={240} />
      </Section>

      <Section title="Against contract CT-UYO-011" description="September, measured from driver-app records, customer reports and Slate spot checks.">
        <Alert tone="warning" title="Pickups inside the window: 94.2% against 95%">
          Shelter Afrique's Tuesday and Friday runs average 92.4% because AKS 588 KJ leaves the yard after 06:15. Starting at 05:45 would bring Ufok back over target.
        </Alert>
        <DataTable rows={TARGETS} columns={targetCols} rowKey={(r) => r.metric} />
      </Section>

      <Section title="By area" description="Last 30 days. Missed counts only pickups not recovered within 24 hours.">
        <DataTable
          rows={AREA_PERF}
          columns={areaCols}
          rowKey={(r) => r.id}
          mobile={(r) => (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="t-body font-medium text-ink">{r.area}</span>
                <span className="flex items-center gap-2">
                  <span className="font-semibold tnum text-ink">{r.score}</span>
                  <Meter value={r.score} segments={10} className="w-16" />
                </span>
              </div>
              <p className="t-small text-ink-2 tnum">
                {formatNumber(r.customers)} customers · {r.completion}% completed · <span className={cn(r.window < 95 && "text-warning")}>{r.window}% in window</span>
              </p>
              <p className="t-small text-ink-3 tnum">
                {r.missed} missed · {r.complaints} complaints · rated {r.rating.toFixed(1)}
              </p>
            </div>
          )}
        />
      </Section>
    </Page>
  );
}
