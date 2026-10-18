import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Check, Megaphone } from "lucide-react";
import { CleanSlate } from "@/components/brand/CleanSlate";
import { Badge, Button, ButtonLink, ChipGroup, LiveDot, Modal, Segmented, Textarea, useToast } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";
import { BLOCKS, ESTATE, PER_HOUSEHOLD, blockStats, todayRun, type Block, type BlockRunState } from "./_data";

/* ------------------------------------------------------------------ */
/* Live run: today's block-by-block collection                         */
/* ------------------------------------------------------------------ */

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const PER_BIN = 0.98;
const GAP = 3;
const toHHMM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(Math.round(m) % 60).padStart(2, "0")}`;

/** Simulates the crew working through the blocks from the demo clock (08:12). */
export function useLiveRun(live = true) {
  const [state, setState] = useState<{ run: BlockRunState[]; ticks: number }>({ run: todayRun, ticks: 0 });
  const { run } = state;
  const clock = 8 * 60 + 12 + state.ticks * PER_BIN;
  const complete = run.every((r) => r.finished);
  useEffect(() => {
    if (!live || complete) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      t = setInterval(() => {
        setState((prev) => {
          const i = prev.run.findIndex((r) => !r.finished);
          if (i < 0) return prev;
          const ticks = prev.ticks + 1;
          const now = toHHMM(8 * 60 + 12 + ticks * PER_BIN);
          const next = prev.run.map((r) => ({ ...r }));
          const cur = next[i]!;
          if (!cur.started) cur.started = now;
          cur.done = Math.min(cur.bins, cur.done + 1);
          if (cur.done >= cur.bins) {
            cur.finished = now;
            if (next[i + 1]) next[i + 1]!.started = now;
          }
          return { run: next, ticks };
        });
      }, 1100);
    }, 2400);
    return () => {
      clearTimeout(start);
      if (t) clearInterval(t);
    };
  }, [live, complete]);

  const liveIndex = run.findIndex((r) => !r.finished);
  const current = liveIndex >= 0 ? run[liveIndex]! : null;
  const doneBlocks = run.filter((r) => r.finished).length;
  const binsDone = run.reduce((a, r) => a + r.done, 0);
  const binsTotal = run.reduce((a, r) => a + r.bins, 0);
  // Re-estimate the remaining blocks at ~1 min per bin, plus 3 min between bays.
  const etas = useMemo(() => {
    let t = clock;
    return run.map((r, i) => {
      if (r.finished) return r.finished;
      if (i === liveIndex) {
        t += (r.bins - r.done) * PER_BIN;
        return "now";
      }
      const startAt = t + GAP;
      t = startAt + r.bins * PER_BIN;
      return `~${toHHMM(startAt)}`;
    });
  }, [run, clock, liveIndex]);
  const finishAt = useMemo(() => {
    let t = clock;
    run.forEach((r) => {
      if (!r.finished) t += (r.bins - r.done) * PER_BIN + GAP;
    });
    return toHHMM(t - GAP);
  }, [run, clock]);
  return { run, current, liveIndex, doneBlocks, binsDone, binsTotal, etas, finishAt, complete, clock: toHHMM(clock) };
}

/** The estate's signature field: the crew moving through Blocks A–H. */
export function BlockRunHero({ onUpdateResidents, compact }: { onUpdateResidents: (waiting: Block[], current?: Block) => void; compact?: boolean }) {
  const r = useLiveRun();
  const waiting = r.run.filter((b) => !b.finished && b !== r.current).map((b) => b.block);
  const firstFinish = r.run[0]!.started!;
  const total = r.complete ? toMin(r.run[r.run.length - 1]!.finished!) - toMin(firstFinish) : 0;
  return (
    <CleanSlate
      done={r.complete}
      className="rounded-xl"
      after={
        <div className="flex h-full flex-col justify-between gap-8 rounded-xl border border-line bg-surface p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <Badge tone="success" icon={<Check strokeWidth={3} />}>All blocks collected</Badge>
            <span className="t-mono text-ink-3">{ESTATE.vehicle}</span>
          </div>
          <div>
            <p className="t-display text-ink">Clean slate, Blocks A–H.</p>
            <p className="mt-4 max-w-xl t-body text-ink-2">
              <span className="font-semibold text-ink tnum">{r.binsTotal}</span> bins in {Math.floor(total / 60)} h {total % 60} min, finished at{" "}
              <span className="font-semibold text-ink tnum">{r.run[r.run.length - 1]!.finished}</span>. Next collection is{" "}
              <span className="font-semibold text-ink">Thursday 8 October, from 06:30</span>.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button leading={<Megaphone className="size-4" />} onClick={() => onUpdateResidents([])}>Tell residents</Button>
            <ButtonLink to="/estate/pickups" variant="ghost">See the day's log</ButtonLink>
          </div>
        </div>
      }
    >
      <section aria-label="Today's collection" className={cn("relative isolate flex flex-col overflow-hidden rounded-xl bg-slate text-slate-ink chalk-grain", compact ? "min-h-0" : "min-h-[440px]")}>
        <div className="relative flex flex-col gap-3 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="inline-flex h-7 items-center gap-2 rounded-sm bg-signal px-2.5 text-[12px] font-semibold text-signal-ink">
              <LiveDot className="[&>span]:bg-signal-ink" />
              Collecting now
            </span>
            <span className="t-small text-slate-ink/70">Collection day · {ESTATE.schedule} · {ESTATE.operator}</span>
          </div>
          <h1 className={cn(compact ? "t-display" : "t-display-xl")}>
            Block {r.current?.block}
          </h1>
          <p className="t-body text-slate-ink/85">
            <span className="whitespace-nowrap font-semibold text-slate-ink tnum">{r.current?.done} of {r.current?.bins} bins</span>
            <span className="mx-2 text-slate-ink/40">·</span>
            <span className="whitespace-nowrap tnum">{r.doneBlocks} of 8 blocks done</span>
            <span className="mx-2 text-slate-ink/40">·</span>
            <span className="whitespace-nowrap tnum">finishing around {r.finishAt}</span>
          </p>
        </div>

        <BlockStrip run={r.run} liveIndex={r.liveIndex} etas={r.etas} />

        <div className="relative mt-auto flex flex-wrap items-end justify-between gap-4 p-6 pt-5 sm:p-8 sm:pt-6">
          <div className="rounded-md bg-slate-950/55 px-3 py-2 backdrop-blur">
            <p className="text-[13px] font-semibold">{ESTATE.crewLead}, crew lead</p>
            <p className="t-mono text-[12px] text-slate-ink/70">{ESTATE.vehicle} · {ESTATE.operator}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/estate/pickups" className="inline-flex h-11 items-center rounded-md px-3 text-[14px] font-medium text-slate-ink/85 hover:bg-white/10 hover:text-slate-ink max-sm:hidden">
              Day log
            </Link>
            <button
              type="button"
              onClick={() => onUpdateResidents(waiting, r.current?.block)}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-slate-ink px-4 text-[14px] font-semibold text-slate-950 transition hover:bg-white"
            >
              <Megaphone className="size-4" />
              Update residents
            </button>
          </div>
        </div>
      </section>
    </CleanSlate>
  );
}

/** Eight slabs, one per block. Chalk = collected, signal = the crew is here, outline = waiting. */
export function BlockStrip({ run, liveIndex, etas, tone = "on-slate" }: { run: BlockRunState[]; liveIndex: number; etas: string[]; tone?: "on-slate" | "on-light" }) {
  const onSlate = tone === "on-slate";
  const progress = liveIndex < 0 ? 1 : (liveIndex + run[liveIndex]!.done / run[liveIndex]!.bins) / run.length;
  return (
    <div className="relative px-6 sm:px-8" role="list" aria-label="Blocks A to H">
      <div className="grid grid-cols-8 gap-1.5 sm:gap-2.5">
        {run.map((b, i) => {
          const isLive = i === liveIndex;
          const pct = b.done / b.bins;
          return (
            <div key={b.block} role="listitem" aria-label={`Block ${b.block}: ${b.finished ? `collected ${b.finished}` : isLive ? `in progress, ${b.done} of ${b.bins} bins` : `expected ${etas[i]}`}`} className="flex min-w-0 flex-col gap-2">
              <div
                className={cn(
                  "relative h-20 overflow-hidden rounded-[6px] sm:h-28",
                  onSlate ? (b.finished ? "bg-slate-ink/12" : "border border-dashed border-slate-ink/25") : b.finished ? "bg-sunken" : "border border-dashed border-line-strong",
                )}
              >
                <div
                  className={cn(
                    "absolute inset-x-0 bottom-0 transition-[height] duration-700 ease-[var(--ease-out-quart)]",
                    isLive ? "bg-signal" : onSlate ? "bg-slate-ink/85" : "bg-slate dark:bg-slate-300",
                  )}
                  style={{ height: `${pct * 100}%` }}
                />
                {isLive && <span className="absolute inset-x-0 h-0.5 animate-pulse bg-signal-ink/40" style={{ bottom: `${pct * 100}%` }} aria-hidden />}
                {b.finished && <Check className={cn("absolute left-1/2 top-2 size-3.5 -translate-x-1/2", onSlate ? "text-slate-950/70" : "text-slate-ink dark:text-slate-900")} strokeWidth={3} aria-hidden />}
              </div>
              <div className="flex flex-col items-center leading-none">
                <span className={cn("font-display text-[20px] font-bold sm:text-[24px]", !onSlate && "text-ink", onSlate && !b.finished && !isLive && "text-slate-ink/60")}>{b.block}</span>
                <span className={cn("mt-1 text-[12px] font-medium tnum sm:font-mono", onSlate ? (isLive ? "font-semibold text-signal" : "text-slate-ink/60") : isLive ? "font-semibold text-ink" : "text-ink-3")}>
                  {etas[i]!.replace("~", "").replace(/^0/, "")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {/* route line under the slabs: travelled in signal, the rest in chalk */}
      <div className="relative mt-3 h-px" aria-hidden>
        <div className={cn("absolute inset-0 border-t border-dashed", onSlate ? "border-slate-ink/30" : "border-line-strong")} />
        <div className="absolute inset-y-0 left-0 h-0.5 -translate-y-px rounded-full bg-signal transition-[width] duration-700" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Messages to residents                                               */
/* ------------------------------------------------------------------ */

export function UpdateResidentsModal({ open, onClose, waiting, current }: { open: boolean; onClose: () => void; waiting: Block[]; current?: Block }) {
  const toast = useToast();
  const [audience, setAudience] = useState<"waiting" | "all">("waiting");
  const [channels, setChannels] = useState<string[]>(["SMS", "WhatsApp"]);
  const range = waiting.length ? (waiting.length > 1 ? `${waiting[0]}–${waiting[waiting.length - 1]}` : waiting[0]) : "";
  const defaultMsg = waiting.length
    ? `Shelter Afrique Estate: ${ESTATE.operator} is collecting Block ${current ?? "C"} now. Blocks ${range}, please have your bins at your collection point within the hour., Estate office`
    : `Shelter Afrique Estate: today's collection is complete for Blocks A–H. Next collection Thursday 8 Oct from 06:30., Estate office`;
  const [msg, setMsg] = useState(defaultMsg);
  useEffect(() => {
    if (open) {
      setMsg(defaultMsg);
      setAudience(waiting.length ? "waiting" : "all");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const count = audience === "all" ? ESTATE.households : blockStats.filter((b) => waiting.includes(b.block)).reduce((a, b) => a + b.households, 0);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Update residents"
      description="Sent from the estate office number. Residents can't reply to this message."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!channels.length || msg.trim().length < 10}
            onClick={() => {
              toast.success(`Update sent to ${count} households`, `By ${channels.join(" and ")}.`);
              onClose();
            }}
          >
            Send to {count} households
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        {waiting.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="t-small font-medium text-ink">Who</span>
            <Segmented
              value={audience}
              onChange={setAudience}
              options={[
                { value: "waiting", label: `Blocks ${range}` },
                { value: "all", label: "Whole estate" },
              ]}
            />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <span className="t-small font-medium text-ink">Send by</span>
          <ChipGroup options={["SMS", "WhatsApp", "Slate app"]} value={channels} onChange={setChannels} />
        </div>
        <Textarea label="Message" rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} hint={`${msg.length} characters${msg.length > 160 ? " · sends as 2 SMS" : ""}`} />
      </div>
    </Modal>
  );
}

export function ReminderModal({
  open,
  onClose,
  households,
  amount,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  households: number;
  amount: number;
  onSent?: () => void;
}) {
  const toast = useToast();
  const [channels, setChannels] = useState<string[]>(["SMS", "WhatsApp"]);
  const [tone, setTone] = useState<"gentle" | "firm">("gentle");
  const messages = {
    gentle: `Hello from Shelter Afrique Estate. Your October waste service contribution of ${formatNaira(PER_HOUSEHOLD)} is still open. Pay in the Slate app or by transfer using your unit number. Thank you.`,
    firm: `Shelter Afrique Estate: your October waste contribution is overdue. Please pay ${formatNaira(PER_HOUSEHOLD)} by Friday 9 Oct to keep your association membership in good standing.`,
  };
  const [msg, setMsg] = useState(messages.gentle);
  useEffect(() => {
    if (open) {
      setTone("gentle");
      setMsg(messages.gentle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Remind ${households} household${households === 1 ? "" : "s"}`}
      description={`${formatNaira(amount)} outstanding. Each resident sees their own balance and unit in the message.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!channels.length}
            onClick={() => {
              toast.success(`Reminders sent to ${households} household${households === 1 ? "" : "s"}`, `By ${channels.join(" and ")}. Payments update here as they come in.`);
              onSent?.();
              onClose();
            }}
          >
            Send reminders
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        <div className="flex flex-col gap-2">
          <span className="t-small font-medium text-ink">Tone</span>
          <Segmented
            value={tone}
            onChange={(t) => {
              setTone(t);
              setMsg(messages[t]);
            }}
            options={[
              { value: "gentle", label: "Friendly reminder" },
              { value: "firm", label: "Overdue notice" },
            ]}
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="t-small font-medium text-ink">Send by</span>
          <ChipGroup options={["SMS", "WhatsApp", "Email"]} value={channels} onChange={setChannels} />
        </div>
        <Textarea label="Message" rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} />
        <p className="t-small text-ink-3">Residents who paid in the last hour are skipped automatically.</p>
      </div>
    </Modal>
  );
}

export function BlockLegend() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1.5 t-small text-ink-2">
      <li className="flex items-center gap-2"><span className="size-2.5 rounded-[3px] bg-slate dark:bg-slate-300" />Collected</li>
      <li className="flex items-center gap-2"><span className="size-2.5 rounded-[3px] bg-signal" />Crew here now</li>
      <li className="flex items-center gap-2"><span className="size-2.5 rounded-[3px] border border-dashed border-line-strong" />Waiting</li>
    </ul>
  );
}

export const blockOptions = BLOCKS.map((b) => `Block ${b}`);
