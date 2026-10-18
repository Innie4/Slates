import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { Check, Circle, Clock, Download, Link2, Lock, ShieldCheck } from "lucide-react";
import {
  Avatar, AvatarStack, Badge, BarChart, Button, ButtonLink, Checkbox, ChoiceCard, CurrencyInput, List, ListRow, Modal, Page, PageHeader,
  ProgressBar, Section, StateView, Switch, Timeline, useToast, type TimelineItem,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { communityProjects, me, type CommunityProject as Project } from "@/data";
import { DEMO_NOW, formatDate, formatDateTime, formatDay, formatNaira, formatNumber, formatRelative } from "@/lib/format";
import {
  RELEASE_STEPS, contributorNames, myContributions, projectBadge, projectIsOpen, recentContributions, releaseIndex, useDemoClock,
} from "./_care";

const QUICK = [1000, 2500, 5000];
const DAY = 86_400_000;

const METHODS = [
  { id: "visa", label: "Visa •• 4021", detail: "Expires 08/28 · default" },
  { id: "verve", label: "Verve •• 7735", detail: "Expires 02/27" },
  { id: "transfer", label: "Bank transfer", detail: "Pay into a one-time account number. Confirms in minutes." },
] as const;
type MethodId = (typeof METHODS)[number]["id"];

const walletId = (p: Project) => `CW-${p.community.slice(0, 3).toUpperCase()}-${String(([...p.id].reduce((a, c) => a + c.charCodeAt(0), 0) % 90) + 10).padStart(4, "0")}`;

/** C19–C22, a community project, its wallet and the contribution flow. */
export default function CommunityProject() {
  const { id } = useParams();
  const project = communityProjects.find((p) => p.id === id);
  if (!project)
    return (
      <Page>
        <PageHeader title="Project not found" back={{ to: "/app/community", label: "Community" }} />
        <StateView
          state="not-found"
          title="We couldn't find that project"
          description="It may have been withdrawn, or the link is incomplete. Every open project in your area is on the Community page."
          action={<ButtonLink to="/app/community">All community projects</ButtonLink>}
        />
      </Page>
    );
  return <ProjectView key={project.id} base={project} />;
}

interface Recent {
  id: string;
  name: string;
  amount: number;
  time: string;
  sweep?: string;
  anonymous?: boolean;
  you?: boolean;
}

function ProjectView({ base }: { base: Project }) {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [raised, setRaised] = useState(base.raised);
  const [contributors, setContributors] = useState(base.contributors);
  const [mine, setMine] = useState(() => myContributions.filter((c) => c.projectId === base.id && c.status === "Successful").reduce((a, c) => a + c.amount, 0));
  const [recent, setRecent] = useState<Recent[]>(() => recentContributions(base, 16));
  const [allOpen, setAllOpen] = useState(false);
  const open = projectIsOpen(base);
  const contributeOpen = open && params.get("contribute") === "1";
  const setContributeOpen = (v: boolean) => {
    const next = new URLSearchParams(params);
    if (v) next.set("contribute", "1");
    else next.delete("contribute");
    setParams(next, { replace: true, preventScrollReset: true });
  };

  const p = { ...base, raised, contributors };
  const badge = projectBadge(p);
  const pct = Math.min(100, Math.round((raised / base.target) * 100));
  const remaining = Math.max(0, base.target - raised);
  const names = contributorNames(base, 8);

  return (
    <Page>
      <PageHeader
        back={{ to: "/app/community", label: "Community" }}
        eyebrow={`${base.category} · ${base.community}`}
        title={base.title}
        meta={
          <Badge tone={badge.tone} dot size="md">
            {badge.label}
          </Badge>
        }
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        {/* Funding, first on phones, sticky aside on desktop */}
        <aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1 lg:self-start">
          <FundingPanel
            p={p}
            pct={pct}
            remaining={remaining}
            mine={mine}
            onContribute={() => setContributeOpen(true)}
            onShare={() => {
              try {
                void navigator.clipboard?.writeText(window.location.href.split("?")[0]!);
              } catch {
                /* clipboard unavailable */
              }
              toast.success("Link copied", "Share it in your estate WhatsApp group.");
            }}
          />
        </aside>

        <div className="flex min-w-0 flex-col gap-10 lg:col-start-1 lg:row-start-1">
          <Section title="About this project">
            <p className="t-body max-w-2xl text-ink-2">{base.description}</p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 sm:gap-x-8">
              <div className="flex flex-col gap-0.5">
                <dt className="t-micro text-ink-3">Provider</dt>
                <dd className="flex flex-wrap items-center gap-2 t-body text-ink">
                  {base.provider}
                  <Badge tone="success" icon={<ShieldCheck />}>
                    Verified by Slate
                  </Badge>
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="t-micro text-ink-3">{open ? "Closes" : "Closed"}</dt>
                <dd className="t-body text-ink">{formatDateTime(base.deadline)}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="t-micro text-ink-3">Community</dt>
                <dd className="t-body text-ink">{base.community}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="t-micro text-ink-3">Funding target</dt>
                <dd className="t-body text-ink tnum">{formatNaira(base.target)}</dd>
              </div>
            </dl>
          </Section>

          <Section
            title="Contributors"
            description={`${formatNumber(contributors)} neighbours${mine > 0 ? ", including you" : ""}.`}
            actions={<AvatarStack names={names} max={5} />}
          >
            <List className="border-y border-line">
              {recent.slice(0, 6).map((c) => (
                <ContributionRow key={c.id} c={c} />
              ))}
            </List>
            <div>
              <Button variant="ghost" size="sm" className="-ml-3" onClick={() => setAllOpen(true)}>
                See recent contributions
              </Button>
            </div>
          </Section>

          <WalletSection p={p} remaining={remaining} />

          <GuaranteePlanned p={p} pct={pct} remaining={remaining} />
        </div>
      </div>

      <Modal open={allOpen} onClose={() => setAllOpen(false)} title="Recent contributions" description={`${formatNumber(contributors)} neighbours have contributed. Names show only if they chose to.`}>
        <List className="pb-2">
          {recent.map((c) => (
            <ContributionRow key={c.id} c={c} />
          ))}
        </List>
      </Modal>

      {open && (
        <ContributeModal
          open={contributeOpen}
          onClose={() => setContributeOpen(false)}
          p={p}
          remaining={remaining}
          onPaid={(now, total, showName, sweep) => {
            setRaised((r) => r + now);
            if (mine === 0) setContributors((c) => c + 1);
            setMine((m) => m + now);
            setRecent((rs) => [
              {
                id: `you-${Date.now()}`,
                name: showName ? `${me.household.name} (you)` : "A neighbour (you)",
                amount: now,
                time: DEMO_NOW.toISOString(),
                sweep: sweep ? `Smart Sweep, 1 of 4 · ${formatNaira(total)} pledged` : undefined,
                you: true,
              },
              ...rs,
            ]);
          }}
        />
      )}
    </Page>
  );
}

/* ------------------------------------------------------------------ */

function FundingPanel({
  p,
  pct,
  remaining,
  mine,
  onContribute,
  onShare,
}: {
  p: Project;
  pct: number;
  remaining: number;
  mine: number;
  onContribute: () => void;
  onShare: () => void;
}) {
  const open = projectIsOpen(p);
  return (
    <section className="rounded-lg border border-line bg-surface" aria-label="Funding">
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div>
          <p className="t-micro text-ink-3">Raised so far</p>
          <p className="mt-1 t-display text-ink tnum">{formatNaira(p.raised)}</p>
          <p className="t-small mt-1 text-ink-2 tnum">
            of {formatNaira(p.target)} target · <span className="font-semibold text-ink">{pct}%</span>
          </p>
        </div>
        <ProgressBar value={p.raised} max={p.target} tone={pct >= 100 ? "success" : "slate"} label="Funding progress" />
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line">
          <div className="bg-surface px-3.5 py-3">
            <dt className="t-micro text-ink-3">Remaining</dt>
            <dd className="mt-0.5 t-h3 text-ink tnum">{formatNaira(remaining)}</dd>
          </div>
          <div className="bg-surface px-3.5 py-3">
            <dt className="t-micro text-ink-3">Contributors</dt>
            <dd className="mt-0.5 t-h3 text-ink tnum">{formatNumber(p.contributors)}</dd>
          </div>
        </dl>
        {open ? <Countdown deadline={p.deadline} /> : (
          <p className="flex items-center gap-2 t-small text-ink-2">
            <Lock className="size-4 text-ink-3" />
            Contributions closed {formatDate(p.deadline)}.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-3 border-t border-line p-5 sm:p-6">
        {open ? (
          <>
            <Button block size="lg" onClick={onContribute}>
              Contribute
            </Button>
            <p className="t-small text-ink-3">Held by Slate in the community wallet. Refunded in full if the target isn't reached by {formatDay(p.deadline)}.</p>
          </>
        ) : (
          <p className="t-small text-ink-2">
            {p.status === "Completed" ? "This project is finished. The final wallet statement is below." : "Fully funded. Follow the release steps below."}
          </p>
        )}
        <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
          <span className="t-small text-ink-2 tnum">{mine > 0 ? <>You've given <span className="font-semibold text-ink">{formatNaira(mine)}</span></> : "You haven't contributed yet"}</span>
          <Button variant="ghost" size="sm" leading={<Link2 className="size-4" />} onClick={onShare}>
            Share
          </Button>
        </div>
      </div>
    </section>
  );
}

function Countdown({ deadline }: { deadline: string }) {
  const now = useDemoClock(1000);
  const ms = Math.max(0, new Date(deadline).getTime() - now);
  const parts = [
    { v: Math.floor(ms / DAY), l: "days" },
    { v: Math.floor((ms % DAY) / 3_600_000), l: "hrs" },
    { v: Math.floor((ms % 3_600_000) / 60_000), l: "min" },
    { v: Math.floor((ms % 60_000) / 1000), l: "sec" },
  ];
  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-1.5 t-small text-ink-2">
        <Clock className="size-4 text-ink-3" />
        Closes {formatDay(deadline)}, {new Date(deadline).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
      </p>
      <div className="grid grid-cols-4 gap-1.5" role="timer" aria-label={`${parts[0]!.v} days ${parts[1]!.v} hours left`}>
        {parts.map((x) => (
          <div key={x.l} className="flex flex-col items-center rounded-md bg-sunken py-2">
            <span className="font-display text-[22px] font-bold leading-none text-ink tnum">{String(x.v).padStart(2, "0")}</span>
            <span className="mt-1 t-micro text-ink-3">{x.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContributionRow({ c }: { c: Recent }) {
  return (
    <ListRow
      leading={c.anonymous || c.name.startsWith("A neighbour") ? (
        <span className="flex size-8 items-center justify-center rounded-full border border-dashed border-line-strong text-ink-3">
          <Circle className="size-3" />
        </span>
      ) : (
        <Avatar name={c.name.replace(" (you)", "")} size="sm" />
      )}
      title={<span className={cn(c.you && "font-semibold")}>{c.name}</span>}
      subtitle={c.sweep ? `${formatRelative(c.time)} · ${c.sweep}` : formatRelative(c.time)}
      meta={<span className="font-semibold text-ink">{formatNaira(c.amount)}</span>}
    />
  );
}

/* ------------------------------------------------------------------ */
/* C21, community wallet                                              */
/* ------------------------------------------------------------------ */

function WalletSection({ p, remaining }: { p: Project; remaining: number }) {
  const idx = releaseIndex(p);
  const weeks = useMemo(() => {
    const shape = [0.062, 0.1, 0.153, 0.118, 0.144, 0.179, 0.138, 0.106];
    const end = projectIsOpen(p) ? DEMO_NOW.getTime() : new Date(p.deadline).getTime();
    const vals = shape.map((w) => Math.round((w * p.raised) / 500) * 500);
    vals[vals.length - 1]! += p.raised - vals.reduce((a, b) => a + b, 0);
    const labels = shape.map((_, i) => {
      const d = new Date(end - (shape.length - 1 - i) * 7 * DAY);
      return String(d.getDate());
    });
    const first = new Date(end - (shape.length - 1) * 7 * DAY);
    return { vals, labels, first, end: new Date(end) };
  }, [p]);

  const ledger: Array<[string, string, boolean?]> = [
    ["Total target", formatNaira(p.target)],
    ["Total collected", formatNaira(p.raised), true],
    ["Remaining", formatNaira(remaining)],
    ["Contributors", formatNumber(p.contributors)],
    ["Card payments retrying", p.failedPayments ? `${p.failedPayments} · retried daily for 3 days` : "None"],
    ["Project status", projectBadge(p).label],
    ["Release status", idx === 0 ? "Locked until the goal is reached" : idx < 4 ? "Awaiting provider verification" : idx < 7 ? "Released to provider" : "Closed"],
  ];

  const items: TimelineItem[] = RELEASE_STEPS.map((t, i) => {
    const state: TimelineItem["state"] = i < idx ? "done" : i === idx ? "current" : "upcoming";
    const desc: Record<string, string> = {
      Contributions: projectIsOpen(p) ? `Open until ${formatDay(p.deadline)}. ${formatNaira(p.raised)} of ${formatNaira(p.target)} in.` : `Closed with ${formatNaira(p.raised)} from ${formatNumber(p.contributors)} neighbours.`,
      "Goal reached": `The wallet locks at ${formatNaira(p.target)}. No further contributions are taken.`,
      "Provider verified": `Slate re-checks ${p.provider}'s documents, quote and insurance.`,
      "Funds released": "Paid to the provider's verified account. The transfer reference is published here.",
      "Work begins": "Start date agreed with the estate association and posted to contributors.",
      "Completion evidence": "Before-and-after photos and a resident sign-off are posted here.",
      Closed: "Final wallet statement published. Any balance moves to the community's next project.",
    };
    return { title: t, description: desc[t], state, time: i === 0 ? `From ${formatDate(weeks.first).replace(/ \d{4}$/, "")}` : undefined };
  });

  return (
    <Section
      title="Community wallet"
      description={
        <>
          Held by Slate for {p.community}. Wallet <span className="t-mono whitespace-nowrap text-ink">{walletId(p)}</span>
        </>
      }
    >
      <div className="grid gap-8 xl:grid-cols-2">
        <dl className="flex flex-col divide-y divide-line border-y border-line">
          {ledger.map(([k, v, strong]) => (
            <div key={k} className="flex items-baseline justify-between gap-4 py-3">
              <dt className="t-small text-ink-2">{k}</dt>
              <dd className={cn("text-right tnum", strong ? "t-body font-semibold text-ink" : "t-small text-ink")}>{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="t-h3 text-ink">Contribution history</h3>
            <span className="t-micro text-ink-3">Weekly</span>
          </div>
          <BarChart
            data={weeks.vals}
            labels={weeks.labels}
            height={150}
            highlight={projectIsOpen(p) ? weeks.vals.length - 1 : undefined}
            format={(v) => formatNaira(v)}
            label="Weekly contributions"
          />
          <p className="t-small text-ink-3">
            Weeks starting {formatDate(weeks.first).replace(/ \d{4}$/, "")} to {formatDate(weeks.end).replace(/ \d{4}$/, "")}.
            {projectIsOpen(p) && " This week so far is highlighted."}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-4">
        <h3 className="t-h3 text-ink">Release status</h3>
        <Timeline items={items} className="max-w-2xl" />
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* C22, Community Guarantee (planned, disabled)                       */
/* ------------------------------------------------------------------ */

function GuaranteePlanned({ p, pct, remaining }: { p: Project; pct: number; remaining: number }) {
  const checks = [
    { label: "At least 60% funded", ok: pct >= 60, value: `${pct}%` },
    { label: "100 or more contributors", ok: p.contributors >= 100, value: formatNumber(p.contributors) },
    { label: "Provider verified by Slate", ok: true, value: "Yes" },
    { label: "Estate association sign-off", ok: false, value: "Pending" },
  ];
  return (
    <section aria-labelledby="guarantee-title" className="rounded-lg border border-dashed border-line-strong">
      <div className="flex flex-col gap-2 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="guarantee-title" className="t-h2 text-ink">
            Community Guarantee
          </h2>
          <Badge tone="outline">Planned</Badge>
        </div>
        <p className="t-small max-w-xl text-ink-2">
          When a project is close to its target, a lending partner could advance the rest so work starts sooner. Contributors keep paying in, and Slate
          repays the partner from the wallet. This isn't available yet, here's how this project would qualify.
        </p>
      </div>
      <div className="grid gap-6 border-t border-dashed border-line-strong p-5 opacity-70 sm:p-6 md:grid-cols-2" aria-disabled="true">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between t-small">
              <span className="text-ink-2">Funding progress</span>
              <span className="font-medium text-ink tnum">{pct}%</span>
            </div>
            <ProgressBar value={pct} size="sm" label="Funding progress" />
          </div>
          <div className="flex items-baseline justify-between gap-3 t-small">
            <span className="text-ink-2">Remaining to guarantee</span>
            <span className="font-semibold text-ink tnum">{formatNaira(remaining)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 t-small">
            <span className="text-ink-2">Financing status</span>
            <Badge tone="warning" dot>
              Awaiting lender agreement
            </Badge>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="t-micro text-ink-3">Eligibility</p>
          <ul className="flex flex-col gap-2">
            {checks.map((c) => (
              <li key={c.label} className="flex items-start gap-2.5 t-small">
                <span className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full", c.ok ? "bg-ink text-surface" : "border border-line-strong")}>
                  {c.ok && <Check className="size-2.5" strokeWidth={3.5} />}
                </span>
                <span className="flex-1 text-ink">{c.label}</span>
                <span className="text-ink-3 tnum">{c.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex flex-col gap-2 border-t border-dashed border-line-strong p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <p className="t-small text-ink-3">We'll tell contributors when the guarantee launches in Uyo.</p>
        <Button variant="outline" disabled leading={<Lock className="size-4" />}>
          Request guarantee
        </Button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* C20, contribution flow                                             */
/* ------------------------------------------------------------------ */

const refCode = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return `TXN-${Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")}`;
};

function ContributeModal({
  open,
  onClose,
  p,
  remaining,
  onPaid,
}: {
  open: boolean;
  onClose: () => void;
  p: Project;
  remaining: number;
  onPaid: (now: number, total: number, showName: boolean, sweep: boolean) => void;
}) {
  const toast = useToast();
  const [step, setStep] = useState<"amount" | "confirm" | "receipt">("amount");
  const [pick, setPick] = useState<number | "custom">(2500);
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState<MethodId>("visa");
  const [sweep, setSweep] = useState(false);
  const [showName, setShowName] = useState(true);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<{ ref: string; at: string; now: number; pending: boolean } | null>(null);

  const amount = pick === "custom" ? Number(custom.replace(/[^\d]/g, "")) || 0 : pick;
  const error =
    amount < 1000 ? "The smallest contribution is ₦1,000." : amount > remaining ? `Only ${formatNaira(remaining)} is still needed.` : undefined;
  const per = Math.round(amount / 4 / 50) * 50;
  const schedule = useMemo(() => {
    const deadline = new Date(p.deadline).getTime();
    return [0, 1, 2, 3].map((k) => {
      let t = DEMO_NOW.getTime() + k * 7 * DAY;
      let moved = false;
      if (t > deadline - DAY) {
        t = deadline - DAY;
        moved = true;
      }
      return { date: new Date(t), amount: k === 3 ? amount - per * 3 : per, moved };
    });
  }, [amount, per, p.deadline]);
  const moved = schedule.some((s) => s.moved);
  const methodLabel = METHODS.find((m) => m.id === method)!.label;
  const chargeNow = sweep ? schedule[0]!.amount : amount;

  const reset = () => {
    setStep("amount");
    setPick(2500);
    setCustom("");
    setSweep(false);
    setTried(false);
    setReceipt(null);
  };
  const close = () => {
    onClose();
    setTimeout(reset, 250);
  };

  const pay = () => {
    setBusy(true);
    setTimeout(() => {
      const pending = method === "transfer";
      const r = { ref: refCode(), at: DEMO_NOW.toISOString(), now: chargeNow, pending };
      setReceipt(r);
      setBusy(false);
      setStep("receipt");
      if (!pending) onPaid(chargeNow, amount, showName, sweep);
      toast.success(pending ? "Waiting for your transfer" : `${formatNaira(chargeNow)} contributed`, pending ? "We'll confirm as soon as it arrives." : `Receipt ${r.ref}`);
    }, 1100);
  };

  const title = step === "amount" ? "Contribute" : step === "confirm" ? "Check and pay" : undefined;
  const footer =
    step === "amount" ? (
      <>
        <Button variant="ghost" onClick={close}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            setTried(true);
            if (!error) setStep("confirm");
          }}
        >
          Continue
        </Button>
      </>
    ) : step === "confirm" ? (
      <>
        <Button variant="ghost" onClick={() => setStep("amount")} disabled={busy}>
          Back
        </Button>
        <Button loading={busy} onClick={pay}>
          {method === "transfer" ? `Get account number` : `Pay ${formatNaira(chargeNow)}`}
        </Button>
      </>
    ) : (
      <>
        <Button variant="ghost" leading={<Download className="size-4" />} onClick={() => toast.success("Receipt downloaded", `${receipt?.ref}.pdf`)}>
          Download receipt
        </Button>
        <Button onClick={close}>Done</Button>
      </>
    );

  return (
    <Modal open={open} onClose={close} title={title} description={step === "amount" ? p.title : undefined} footer={footer} hideClose={step === "receipt"}>
      {step === "amount" && (
        <div className="flex flex-col gap-6 pb-2">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 t-small font-medium text-ink">Amount</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Amount">
              {[...QUICK, "custom" as const].map((q) => {
                const on = pick === q;
                return (
                  <button
                    key={q}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setPick(q)}
                    className={cn(
                      "flex h-14 items-center justify-center rounded-md border text-[15px] font-semibold tnum transition",
                      on ? "border-ink bg-surface text-ink ring-1 ring-ink" : "border-line-strong text-ink-2 hover:border-ink-3 hover:text-ink",
                    )}
                  >
                    {q === "custom" ? "Custom" : formatNaira(q)}
                  </button>
                );
              })}
            </div>
            {pick === "custom" && (
              <CurrencyInput
                aria-label="Custom amount"
                autoFocus
                placeholder="10,000"
                value={custom}
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^\d]/g, "").slice(0, 7);
                  setCustom(digits ? formatNumber(Number(digits)) : "");
                }}
                fieldClassName="mt-1"
              />
            )}
            {tried && error ? (
              <p className="t-small text-danger" role="alert">
                {error}
              </p>
            ) : (
              <p className="t-small text-ink-3 tnum">{formatNaira(remaining)} still needed.</p>
            )}
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 t-small font-medium text-ink">Pay with</legend>
            {METHODS.map((m) => (
              <ChoiceCard key={m.id} selected={method === m.id} onSelect={() => setMethod(m.id)} title={m.label} description={m.detail} className="py-3.5" />
            ))}
          </fieldset>

          <div className="flex flex-col gap-3 rounded-md bg-sunken p-4">
            <Switch
              checked={sweep}
              onChange={setSweep}
              disabled={method === "transfer"}
              label="Spread it with Smart Sweep"
              description={
                method === "transfer"
                  ? "Smart Sweep works with a saved card."
                  : amount >= 1000
                    ? `${formatNaira(amount)} over 4 weekly charges of about ${formatNaira(per)}.`
                    : "Split your contribution into 4 weekly charges."
              }
            />
            {sweep && method !== "transfer" && amount >= 1000 && (
              <ol className="flex flex-col divide-y divide-line border-t border-line">
                {schedule.map((s, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2 t-small">
                    <span className="text-ink-2">
                      {i === 0 ? "Today" : formatDay(s.date)}
                      {s.moved && <span className="text-ink-3"> · moved earlier</span>}
                    </span>
                    <span className="font-medium text-ink tnum">{formatNaira(s.amount)}</span>
                  </li>
                ))}
              </ol>
            )}
            {sweep && moved && <p className="t-small text-ink-3">The last charge lands the day before the project closes, so your full pledge counts.</p>}
          </div>

          <Checkbox checked={showName} onChange={setShowName} label="Show my name to neighbours" description="Otherwise you appear as “A neighbour”." />
        </div>
      )}

      {step === "confirm" && (
        <div className="flex flex-col gap-5 pb-2">
          <dl className="flex flex-col divide-y divide-line border-y border-line">
            {[
              ["Project", p.title],
              ["Wallet", <><span className="t-mono">{walletId(p)}</span> · {p.community}</>],
              ["Amount", sweep ? `${formatNaira(amount)} in 4 weekly charges` : formatNaira(amount)],
              ["Charged today", formatNaira(chargeNow)],
              ["Pay with", methodLabel],
              ["Processing fee", "₦0, covered by Slate"],
              ["Shown as", showName ? me.household.name : "A neighbour"],
            ].map(([k, v], i) => (
              <div key={i} className="flex items-baseline justify-between gap-4 py-3">
                <dt className="t-small shrink-0 text-ink-2">{k}</dt>
                <dd className="t-small text-right font-medium text-ink tnum">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="t-small text-ink-2">
            If {formatNaira(p.target)} isn't reached by {formatDay(p.deadline)}, you're refunded in full to the same {method === "transfer" ? "bank account" : "card"}
            {sweep ? " and the remaining charges are cancelled" : ""} within 5 working days.
          </p>
        </div>
      )}

      {step === "receipt" && receipt && (
        <div className="flex flex-col items-center gap-5 pb-3 pt-4 text-center">
          <span className={cn("flex size-14 items-center justify-center rounded-full", receipt.pending ? "bg-warning-bg text-warning" : "bg-success-bg text-success")}>
            {receipt.pending ? <Clock className="size-7" /> : <Check className="size-7" strokeWidth={2.5} />}
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="t-h2 text-ink">{receipt.pending ? "Transfer to confirm" : "Contribution received"}</h2>
            <p className="t-small text-ink-2">{p.title}</p>
          </div>
          <p className="t-display text-ink tnum">{formatNaira(receipt.now)}</p>
          {receipt.pending ? (
            <div className="w-full rounded-md bg-sunken p-4 text-left">
              <p className="t-micro text-ink-3">Transfer exactly {formatNaira(receipt.now)} to</p>
              <p className="mt-1 t-mono text-[17px] text-ink">9921 0458 73</p>
              <p className="t-small text-ink-2">Wema Bank · Slate/{walletId(p)} · valid for 30 minutes</p>
            </div>
          ) : null}
          <dl className="w-full divide-y divide-line border-y border-line text-left">
            {[
              ["Reference", <span className="t-mono">{receipt.ref}</span>],
              ["Date", formatDateTime(receipt.at)],
              ["Paid with", methodLabel],
              ...(sweep ? [["Next charges", `${schedule.slice(1).map((s) => formatDay(s.date)).join(", ")}`]] : []),
              ["Wallet now", receipt.pending ? "Updates when your transfer arrives" : `${formatNaira(p.raised)} of ${formatNaira(p.target)}`],
            ].map(([k, v], i) => (
              <div key={i} className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="t-small text-ink-2">{k}</dt>
                <dd className="t-small text-right font-medium text-ink tnum">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </Modal>
  );
}
