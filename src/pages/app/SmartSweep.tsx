import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Check, Pause, Pencil, Play, Plus, Square, X } from "lucide-react";
import { Strata } from "@/components/brand/Strata";
import {
  Alert, Badge, Button, Checkbox, ChoiceCard, ConfirmDialog, CurrencyInput, DatePicker, Field, List, Modal, Page, PageHeader, Ref, Section, Segmented, Select,
  StatusBadge, Switch, useToast,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { DEMO_NOW, formatDay, formatNaira, formatTime } from "@/lib/format";
import { smartSweeps } from "@/data";
import { SWEEP_HISTORY, WEEKDAYS, describePlan, planCharges, type PlannedCharge, type SweepFrequency } from "./_money";

type PlanStatus = "Active" | "Paused" | "Stopped";

interface Plan {
  status: PlanStatus;
  owed: number;
  collected: number;
  max: number;
  freq: SweepFrequency;
  weekday: number;
  next: Date;
  reason: string;
}

const seed = smartSweeps[0]!;
const INITIAL: Plan = {
  status: "Active",
  owed: seed.owed,
  collected: seed.collected,
  max: seed.maxCharge,
  freq: seed.frequency as SweepFrequency,
  weekday: new Date(seed.nextCharge).getDay(),
  next: new Date(seed.nextCharge),
  reason: "June and July Slate Home, carried over when card payments failed",
};

const PAYDAYS = [
  { value: "25", label: "25th of the month" },
  { value: "last", label: "Last working day of the month" },
  { value: "1", label: "1st of the month" },
  { value: "15", label: "15th of the month" },
  { value: "friday", label: "Every Friday (weekly wage)" },
];

const shortDay = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/** C15 / C16 / C17, Smart Sweep: split what you owe into smaller scheduled charges. */
export default function SmartSweep() {
  const toast = useToast();
  const [plan, setPlan] = useState<Plan>(INITIAL);
  const [setup, setSetup] = useState<null | "new" | "edit">(null);
  const [stopOpen, setStopOpen] = useState(false);
  const [autoTiming, setAutoTiming] = useState(true);
  const [payday, setPayday] = useState("25");

  const remaining = Math.max(0, plan.owed - plan.collected);
  const upcoming = useMemo(
    () => (plan.status === "Stopped" ? [] : planCharges(remaining, plan.max, plan.freq, plan.next, plan.freq === "Every 3 days" ? undefined : plan.weekday)),
    [plan, remaining],
  );
  const finish = upcoming[upcoming.length - 1]?.date;
  const firstTry = SWEEP_HISTORY.filter((a) => a.status === "Successful" && !a.note?.startsWith("Retry")).length;
  const charges = SWEEP_HISTORY.filter((a) => !a.note?.startsWith("Retry")).length;

  const pause = () => {
    setPlan((p) => ({ ...p, status: "Paused" }));
    toast.success("Smart Sweep paused", "No charges until you resume. What you owe doesn't change.");
  };
  const resume = () => {
    const d = new Date(DEMO_NOW);
    d.setDate(d.getDate() + 1);
    if (plan.freq !== "Every 3 days") while (d.getDay() !== plan.weekday) d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    setPlan((p) => ({ ...p, status: "Active", next: d }));
    toast.success("Smart Sweep resumed", `Next charge ${formatNaira(Math.min(plan.max, remaining))} on ${formatDay(d)}.`);
  };

  const headerActions =
    plan.status === "Stopped" ? (
      <Button leading={<Plus className="size-4" />} onClick={() => setSetup("new")}>Start Smart Sweep</Button>
    ) : (
      <>
        <Button variant="outline" leading={<Pencil className="size-4" />} onClick={() => setSetup("edit")}>Edit</Button>
        {plan.status === "Active" ? (
          <Button variant="secondary" leading={<Pause className="size-4" />} onClick={pause}>Pause</Button>
        ) : (
          <Button leading={<Play className="size-4" />} onClick={resume}>Resume</Button>
        )}
        <Button variant="ghost" className="text-danger hover:bg-danger-bg hover:text-danger" leading={<Square className="size-3.5" />} onClick={() => setStopOpen(true)}>
          Stop
        </Button>
      </>
    );

  return (
    <Page>
      <PageHeader
        title="Smart Sweep"
        description="Split what you owe into smaller scheduled charges. You choose the limit and the pace."
        actions={headerActions}
      />

      {plan.status === "Stopped" ? (
        <section className="relative isolate flex flex-col gap-5 overflow-hidden rounded-xl border border-line bg-surface p-6 sm:p-8">
          <Strata tone="on-light" bands={3} seed={5} chalk={false} className="absolute inset-x-0 bottom-0 -z-10 h-24 w-full opacity-25" />
          <Badge tone="neutral" className="w-fit">No active plan</Badge>
          <div className="flex max-w-xl flex-col gap-2">
            <h2 className="t-display text-ink">Clear a balance in small steps.</h2>
            <p className="t-body text-ink-2">
              {remaining > 0
                ? `${formatNaira(remaining)} is now due in full with your next bill on 1 Nov. Start a new plan to spread it out instead.`
                : "Nothing owed right now. If a bill ever gets ahead of you, start a plan here."}
            </p>
          </div>
          <Button className="w-fit" leading={<Plus className="size-4" />} onClick={() => setSetup("new")}>Start Smart Sweep</Button>
        </section>
      ) : (
        <PlanHero plan={plan} remaining={remaining} upcoming={upcoming} finish={finish} />
      )}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-10">
          {plan.status !== "Stopped" && (
            <Section
              title="Coming up"
              description={plan.status === "Paused" ? "Paused, these run once you resume." : `${upcoming.length} more ${upcoming.length === 1 ? "charge" : "charges"}, ${formatNaira(remaining)} in total.`}
            >
              <List className="border-y border-line">
                {upcoming.slice(0, 6).map((c, i) => (
                  <div key={c.date.toISOString()} className="flex items-center gap-3.5 py-3">
                    <span
                      className={cn(
                        "flex size-2.5 shrink-0 rounded-full",
                        i === 0 && plan.status === "Active" ? "bg-signal" : "border-2 border-line-strong",
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="t-body font-medium text-ink">{formatDay(c.date)}</p>
                      <p className="t-small text-ink-3">
                        {i === 0 && plan.status === "Active" ? "Next charge · " : ""}09:00 to Visa •• 4021
                      </p>
                    </div>
                    <span className="t-mono text-[14px] text-ink">{formatNaira(c.amount)}</span>
                  </div>
                ))}
              </List>
            </Section>
          )}

          <Section title="Charge history" description={`${formatNaira(plan.collected)} collected in ${SWEEP_HISTORY.filter((a) => a.status === "Successful").length} charges since 27 Aug.`}>
            <List className="border-y border-line">
              {SWEEP_HISTORY.map((a) => (
                <div key={a.id} className="flex items-start gap-3.5 py-3.5">
                  <span
                    className={cn(
                      "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                      a.status === "Successful" ? "bg-success-bg text-success" : "bg-danger-bg text-danger",
                    )}
                    aria-hidden
                  >
                    {a.status === "Successful" ? <Check className="size-3.5" strokeWidth={3} /> : <X className="size-3.5" strokeWidth={3} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="t-body font-medium text-ink">
                      {formatDay(a.date)} <span className="font-normal text-ink-3">· {formatTime(a.date)}</span>
                    </p>
                    <p className="t-small text-ink-2">
                      <Ref>{a.reference}</Ref>
                      {a.note && <span className="text-ink-3"> · {a.note}</span>}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={cn("t-mono text-[14px]", a.status === "Failed" ? "text-ink-3 line-through decoration-ink-3/60" : "text-ink")}>{formatNaira(a.amount)}</span>
                    <StatusBadge status={a.status} />
                  </div>
                </div>
              ))}
            </List>
          </Section>
        </div>

        <aside className="flex min-w-0 flex-col gap-10">
          <Section title="How it works">
            <ol className="flex flex-col divide-y divide-line border-y border-line">
              {[
                ["You set the limit", "Slate never charges more than your maximum in one go."],
                ["You set the pace", "Every 3 days, weekly or fortnightly, on the day you pick."],
                ["Three tries, then pause", "If a charge fails, we retry up to 3 times. After that the plan pauses and we message you, no surprise debits."],
                ["Only Slate's own records", "Timing uses the outcome of Slate's past charges. We never read your bank statement or balance."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-3.5 py-3.5">
                  <span className="t-mono w-5 shrink-0 pt-0.5 text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="t-body font-medium text-ink">{t}</p>
                    <p className="t-small text-ink-2">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Smart payment timing" description="Land charges after you've been paid, not before.">
            <div className="flex flex-col gap-5">
              <Switch
                checked={autoTiming}
                onChange={(v) => {
                  setAutoTiming(v);
                  toast.success(v ? "Automatic timing on" : "Automatic timing off", v ? "Charges move to just after your payday when needed." : "Charges run on your chosen day every time.");
                }}
                label="Automatic timing"
                description="Move a charge to the day after payday if it would fall in the 5 days before it."
              />
              <Select
                label="Your usual payday"
                options={PAYDAYS}
                value={payday}
                disabled={!autoTiming}
                onChange={(e) => {
                  setPayday(e.target.value);
                  toast.success("Payday saved", PAYDAYS.find((p) => p.value === e.target.value)?.label);
                }}
              />
              <div className="flex flex-col gap-3 rounded-md bg-sunken p-4">
                <p className="t-micro text-ink-3">Your last {charges} charges</p>
                <div className="flex gap-1.5" role="img" aria-label={`${firstTry} of ${charges} charges succeeded first time`}>
                  {[...SWEEP_HISTORY].reverse().filter((a) => !a.note?.startsWith("Retry")).map((a) => (
                    <div key={a.id} className="flex flex-1 flex-col items-center gap-1.5">
                      <span className={cn("h-7 w-full rounded-[4px]", a.status === "Successful" ? "bg-slate dark:bg-slate-300" : "bg-danger")} />
                      <span className="t-micro text-ink-3 tnum">{new Date(a.date).getDate()}</span>
                    </div>
                  ))}
                </div>
                <p className="t-small text-ink-2">
                  <span className="font-semibold text-ink">{firstTry} of {charges}</span> succeeded first time. The one failure, on 17 Sept, came 8 days before payday, the retry the next day went through.
                  {autoTiming && payday === "25" && " With automatic timing, a charge due between 20 and 24 Oct will run on 26 Oct instead."}
                </p>
              </div>
            </div>
          </Section>
        </aside>
      </div>

      <SetupModal
        mode={setup}
        plan={plan}
        remaining={remaining}
        onClose={() => setSetup(null)}
        onSave={(next) => {
          const isNew = setup === "new";
          setPlan((p) => ({
            ...p,
            status: "Active",
            owed: isNew ? next.amount : p.collected + next.amount,
            collected: isNew ? 0 : p.collected,
            max: next.max,
            freq: next.freq,
            weekday: next.weekday,
            next: next.first,
          }));
          toast.success(isNew ? "Smart Sweep started" : "Plan updated", `First charge ${formatNaira(Math.min(next.max, next.amount))} on ${formatDay(next.first)}.`);
        }}
      />

      <ConfirmDialog
        open={stopOpen}
        onClose={() => setStopOpen(false)}
        variant="destructive"
        title="Stop Smart Sweep?"
        description={`No more scheduled charges. The ${formatNaira(remaining)} still owed becomes due in full with your next bill on 1 Nov.`}
        confirmLabel="Stop plan"
        cancelLabel="Keep plan"
        onConfirm={() => {
          setPlan((p) => ({ ...p, status: "Stopped" }));
          toast.success("Smart Sweep stopped", `${formatNaira(remaining)} moves to your 1 Nov bill.`);
        }}
      />
    </Page>
  );
}

/* ------------------------------------------------------------------ */
/* Hero, the plan as a run of cut slabs, one per charge                */
/* ------------------------------------------------------------------ */

function PlanHero({ plan, remaining, upcoming, finish }: { plan: Plan; remaining: number; upcoming: PlannedCharge[]; finish?: Date }) {
  const done = SWEEP_HISTORY.filter((a) => a.status === "Successful").reverse();
  const paused = plan.status === "Paused";
  const pct = Math.round((plan.collected / Math.max(1, plan.owed)) * 100);
  const slabs = [
    ...(plan.collected === INITIAL.collected ? done.map((a) => ({ amount: a.amount, state: "done" as const, label: shortDay(new Date(a.date)) })) : plan.collected > 0 ? [{ amount: plan.collected, state: "done" as const, label: "Paid" }] : []),
    ...upcoming.map((c, i) => ({ amount: c.amount, state: i === 0 && !paused ? ("next" as const) : ("todo" as const), label: shortDay(c.date) })),
  ];
  return (
    <section aria-label="Your Smart Sweep plan" className="relative isolate overflow-hidden rounded-xl bg-slate text-slate-ink chalk-grain">
      <div className="flex flex-col gap-7 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {paused ? (
            <span className="inline-flex h-7 items-center gap-1.5 rounded-sm bg-white/12 px-2.5 text-[12px] font-semibold"><Pause className="size-3.5" /> Paused</span>
          ) : (
            <span className="inline-flex h-7 items-center gap-2 rounded-sm bg-white/12 px-2.5 text-[12px] font-semibold">
              <span className="size-1.5 rounded-full bg-success" /> Active
            </span>
          )}
          <span className="t-small text-slate-ink/70">For {plan.reason}</span>
        </div>

        <div className="flex flex-col gap-3">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="t-display tnum">{formatNaira(plan.collected)}</span>
            <span className="t-h2 font-normal text-slate-ink/70 tnum">of {formatNaira(plan.owed)} cleared</span>
          </p>
          <p className="max-w-xl t-body text-slate-ink/85">
            {paused ? (
              <>Paused with <span className="font-semibold text-slate-ink tnum">{formatNaira(remaining)}</span> to go. Nothing will be charged until you resume.</>
            ) : (
              <>
                <span className="font-semibold text-slate-ink tnum">{formatNaira(remaining)}</span> to go, {describePlan(upcoming).replace(/^(\d+)/, "$1 more")}
                {finish && "."}
              </>
            )}
          </p>
        </div>

        {/* Slab track: width follows each charge's amount */}
        <div className="flex flex-col gap-2">
          <div className="flex h-10 gap-1" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct}% cleared`}>
            {slabs.map((s, i) => (
              <span
                key={i}
                title={`${s.label} · ${formatNaira(s.amount)}`}
                style={{ flexGrow: s.amount, clipPath: "polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)" }}
                className={cn(
                  "basis-0 transition-colors",
                  s.state === "done" && "bg-slate-300",
                  s.state === "next" && "bg-signal",
                  s.state === "todo" && "bg-white/14",
                )}
              />
            ))}
          </div>
          <div className="flex justify-between t-micro text-slate-ink/60 tnum">
            <span>Started 27 Aug</span>
            <span className="text-right">{finish ? `${paused ? "Was finishing" : "Finishes"} ${shortDay(finish)}` : "Cleared"}</span>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-white/12 pt-5 sm:grid-cols-4">
          {[
            ["Next charge", paused ? "None while paused" : upcoming[0] ? `${formatNaira(upcoming[0].amount)} · ${formatDay(upcoming[0].date)}` : "Not set"],
            ["Limit", `${formatNaira(plan.max)} per charge`],
            ["Pace", plan.freq === "Every 3 days" ? "Every 3 days" : `${plan.freq}, ${WEEKDAYS[plan.weekday]}s`],
            ["Card", "Visa •• 4021"],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5">
              <dt className="t-micro text-slate-ink/60">{k}</dt>
              <dd className="t-small font-medium tnum">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* C16, Setup / edit                                                   */
/* ------------------------------------------------------------------ */

interface SetupValues {
  amount: number;
  max: number;
  freq: SweepFrequency;
  weekday: number;
  first: Date;
}

const toInputDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const digits = (v: string) => Number(v.replace(/\D/g, "") || 0);
const grouped = (n: number) => (n ? n.toLocaleString("en-NG") : "");

function SetupModal({ mode, plan, remaining, onClose, onSave }: { mode: null | "new" | "edit"; plan: Plan; remaining: number; onClose: () => void; onSave: (v: SetupValues) => void }) {
  return mode ? <SetupForm key={mode} mode={mode} plan={plan} remaining={remaining} onClose={onClose} onSave={onSave} /> : null;
}

function SetupForm({ mode, plan, remaining, onClose, onSave }: { mode: "new" | "edit"; plan: Plan; remaining: number; onClose: () => void; onSave: (v: SetupValues) => void }) {
  const editing = mode === "edit";
  const [amount, setAmount] = useState(grouped(editing ? remaining : 8000));
  const [max, setMax] = useState(grouped(editing ? plan.max : 1500));
  const [freq, setFreq] = useState<SweepFrequency>(editing ? plan.freq : "Weekly");
  const [weekday, setWeekday] = useState(editing ? plan.weekday : 1);
  const [start, setStart] = useState(toInputDate(editing ? plan.next : DEMO_NOW));
  const [authorized, setAuthorized] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"amount" | "max" | "start" | "auth", string>>>({});
  const [busy, setBusy] = useState(false);

  const a = digits(amount);
  const m = digits(max);
  const startDate = new Date(`${start}T09:00:00`);
  const valid = a > 0 && m >= 500 && m <= a && !Number.isNaN(startDate.getTime());
  const preview = valid ? planCharges(a, m, freq, startDate, freq === "Every 3 days" ? undefined : weekday) : [];

  const save = async () => {
    const e: typeof errors = {};
    if (!a) e.amount = "Enter the amount you want to clear.";
    else if (a > 200000) e.amount = "Smart Sweep covers up to ₦200,000. Call Slate for larger balances.";
    if (!m) e.max = "Set the most Slate may charge at once.";
    else if (m < 500) e.max = "The smallest charge is ₦500.";
    else if (m > a) e.max = "Can't be more than the amount owed.";
    if (Number.isNaN(startDate.getTime())) e.start = "Choose a start date.";
    else if (start < toInputDate(DEMO_NOW)) e.start = "Start today or later.";
    if (!authorized) e.auth = "Tick the authorisation to continue.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 900));
    setBusy(false);
    onSave({ amount: a, max: m, freq, weekday, first: preview[0]!.date });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={editing ? "Edit Smart Sweep" : "Set up Smart Sweep"}
      description={editing ? "Changes apply from the next charge. Nothing already collected changes." : "Spread what you owe across smaller charges you control."}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={busy} disabled={!authorized} onClick={save}>
            {editing ? "Save changes" : "Start Smart Sweep"}
          </Button>
        </>
      }
    >
      <div className="grid gap-6 pb-2 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:gap-8">
        <div className="flex flex-col gap-5">
          <CurrencyInput
            label="Amount owed"
            hint={editing ? `${formatNaira(remaining)} is left on your current plan.` : "Your outstanding balance with Slate."}
            value={amount}
            error={errors.amount}
            onChange={(e) => {
              setAmount(grouped(digits(e.target.value)));
              setErrors((x) => ({ ...x, amount: undefined }));
            }}
          />
          <div className="flex flex-col gap-2">
            <CurrencyInput
              label="Maximum per charge"
              value={max}
              error={errors.max}
              onChange={(e) => {
                setMax(grouped(digits(e.target.value)));
                setErrors((x) => ({ ...x, max: undefined }));
              }}
            />
            <div className="flex flex-wrap gap-1.5">
              {[1000, 1500, 2000, 2500].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setMax(grouped(v));
                    setErrors((x) => ({ ...x, max: undefined }));
                  }}
                  className={cn(
                    "h-8 rounded-sm border px-2.5 text-[13px] font-medium tnum transition",
                    m === v ? "border-ink bg-ink text-surface" : "border-line-strong text-ink-2 hover:border-ink-3 hover:text-ink",
                  )}
                >
                  {formatNaira(v)}
                </button>
              ))}
            </div>
          </div>
          <Field label="How often">
            <Segmented<SweepFrequency>
              value={freq}
              onChange={setFreq}
              className="w-full"
              options={[
                { value: "Every 3 days", label: "Every 3 days" },
                { value: "Weekly", label: "Weekly" },
                { value: "Fortnightly", label: "Fortnightly" },
              ]}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Preferred day"
              options={WEEKDAYS.map((d, i) => ({ value: String(i), label: d }))}
              value={String(weekday)}
              disabled={freq === "Every 3 days"}
              onChange={(e) => setWeekday(Number(e.target.value))}
            />
            <DatePicker
              label="Start date"

              min={toInputDate(DEMO_NOW)}
              value={start}
              error={errors.start}
              onChange={(date) => {
                setStart(date);
                setErrors((x) => ({ ...x, start: undefined }));
              }}
            />
          </div>
          <Field label="Payment method">
            <div className="flex flex-col gap-2">
              <ChoiceCard selected onSelect={() => {}} title="Visa •• 4021" description="GTBank · default card" className="py-3" />
              <ChoiceCard selected={false} disabled onSelect={() => {}} title="Verve •• 7735" description="Expired 09/26" className="py-3" />
              <Link to="/app/payment-methods" className="w-fit t-small font-medium text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink">
                Add a card
              </Link>
            </div>
          </Field>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 rounded-lg bg-sunken p-5 md:sticky md:top-0">
            <p className="t-micro text-ink-3">Preview</p>
            {preview.length ? (
              <>
                <p className="t-h2 text-ink">≈ {describePlan(preview)}</p>
                <div className="flex h-7 gap-1" aria-hidden>
                  {preview.slice(0, 24).map((c, i) => (
                    <span
                      key={i}
                      style={{ flexGrow: c.amount, clipPath: "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)" }}
                      className={cn("basis-0", i === 0 ? "bg-signal" : "bg-slate dark:bg-slate-300")}
                    />
                  ))}
                </div>
                <ol className="flex flex-col divide-y divide-line border-y border-line">
                  {preview.slice(0, 4).map((c, i) => (
                    <li key={i} className="flex items-center justify-between py-2 t-small">
                      <span className="text-ink-2">{formatDay(c.date)}</span>
                      <span className="t-mono text-ink">{formatNaira(c.amount)}</span>
                    </li>
                  ))}
                  {preview.length > 4 && (
                    <li className="flex items-center justify-between py-2 t-small text-ink-3">
                      <span>+ {preview.length - 4} more, last on {formatDay(preview[preview.length - 1]!.date)}</span>
                    </li>
                  )}
                </ol>
                <p className="t-small text-ink-2">
                  If a charge fails, Slate retries the next day, up to 3 times. After the third failure the plan pauses and we message you.
                </p>
              </>
            ) : (
              <p className="t-body text-ink-2">Enter an amount and a maximum charge to see your schedule.</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Checkbox
              checked={authorized}
              onChange={(v) => {
                setAuthorized(v);
                setErrors((x) => ({ ...x, auth: undefined }));
              }}
              label="I authorize Slate to make the scheduled charges described above."
              description="You can pause, edit or stop at any time from this page."
            />
            {errors.auth && <p className="t-small text-danger" role="alert">{errors.auth}</p>}
          </div>
          <Alert tone="neutral">Smart Sweep never reads your bank statement or balance, it only uses the outcome of Slate's own charges.</Alert>
        </div>
      </div>
    </Modal>
  );
}
