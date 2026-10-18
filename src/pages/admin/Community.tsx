import { useState } from "react";
import { Link } from "react-router";
import { BadgeCheck, Check, Plus, RefreshCw, Send, X } from "lucide-react";
import {
  Badge, Button, ConfirmDialog, CurrencyInput, DatePicker, Drawer, Input, Modal, Page, PageHeader, ProgressBar, Select, StateView,
  StatusBadge, Tabs, Textarea, Timeline, useToast, type TimelineItem,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { AREAS, FIRST, LAST, communityProjects, operators, type CommunityProject } from "@/data";
import { DEMO_NOW, formatDate, formatNaira, formatNairaShort, formatRelative } from "@/lib/format";
import { Facts, Figures, Headline, daysBetween, daysFromNow, operatorIdByName, useParam } from "./_gov";

const verifiedProviders = operators.filter((o) => o.status === "Active");
const isVerified = (provider: string) => verifiedProviders.some((o) => o.short === provider || o.name === provider);

interface AdminProject extends CommunityProject {
  createdAt: string;
  releasedAt?: string;
}

const EXTRA: AdminProject[] = [
  {
    id: "cp-useoffot-sweep", title: "Use Offot street-sweeping fund", community: "Use Offot", description: "Weekly sweeping of the Use Offot Road service lane for three months, so waste stops collecting in the drains.",
    target: 360_000, raised: 360_000, contributors: 88, deadline: daysFromNow(6), status: "Funded", provider: "Mkpok Environmental", failedPayments: 3, category: "Sanitation", createdAt: daysFromNow(-34),
  },
];

const SEED: AdminProject[] = [
  ...communityProjects.map((p, i) => ({
    ...p,
    createdAt: daysFromNow(-[24, 52, 9, 88, 6][i]!),
    releasedAt: p.status === "Completed" ? daysFromNow(-38) : undefined,
  })),
  ...EXTRA,
];

const CATEGORIES = ["Drainage", "Recycling", "Sanitation", "Infrastructure", "Safety", "Clean-up"];

/** Deterministic contributions for the wallet ledger. */
function contributions(p: AdminProject) {
  let s = [...p.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  const amounts = [1000, 2000, 2500, 5000, 5000, 10000, 2500, 20000];
  return Array.from({ length: 7 }, (_, i) => ({
    name: `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]![0]}.`,
    amount: amounts[Math.floor(r() * amounts.length)]!,
    at: new Date(DEMO_NOW.getTime() - (i * 9 + Math.floor(r() * 8) + 1) * 3_600_000).toISOString(),
    status: i < Math.min(2, p.failedPayments) && p.status === "Active" ? (i === 0 ? "Retrying" : "Failed") : "Successful",
  }));
}

function releaseState(p: AdminProject): { label: string; tone: "success" | "warning" | "neutral" | "info" | "danger" } {
  if (p.status === "Completed") return { label: "Released · work verified", tone: "success" };
  if (p.status === "Released") return { label: "Released", tone: "success" };
  if (p.status === "Closed") return { label: "Closed · refunded", tone: "neutral" };
  if (p.raised >= p.target && !isVerified(p.provider)) return { label: "Blocked · provider not verified", tone: "danger" };
  if (p.raised >= p.target) return { label: "Ready for approval", tone: "warning" };
  if (p.status === "Draft") return { label: "Draft", tone: "neutral" };
  return { label: "Collecting", tone: "info" };
}

type TabKey = "active" | "funded" | "released" | "closed";

export default function Community() {
  const toast = useToast();
  const [rows, setRows] = useState<AdminProject[]>(SEED);
  const [tab, setTab] = useState<TabKey>("active");
  const [id, setId] = useParam("id");
  const [isNew, setNew] = useParam("new");

  const inTab = (p: AdminProject, t: TabKey) =>
    t === "active" ? p.status === "Active" || p.status === "Draft" : t === "funded" ? p.status === "Funded" : t === "released" ? p.status === "Released" || p.status === "Completed" : p.status === "Closed";
  const list = rows.filter((p) => inTab(p, tab));
  const held = rows.filter((p) => ["Active", "Funded", "Draft"].includes(p.status));
  const heldTotal = held.reduce((a, p) => a + p.raised, 0);
  const released = rows.filter((p) => p.status === "Released" || p.status === "Completed").reduce((a, p) => a + p.raised, 0);
  const ready = rows.filter((p) => p.status === "Funded");
  const failed = held.reduce((a, p) => a + p.failedPayments, 0);
  const current = id ? rows.find((p) => p.id === id) : undefined;

  const update = (pid: string, patch: Partial<AdminProject>) => setRows((rs) => rs.map((p) => (p.id === pid ? { ...p, ...patch } : p)));

  return (
    <Page>
      <PageHeader
        title="Community projects"
        description="Projects residents fund together. Money sits in a Slate community wallet until the target is met and the provider is verified."
        actions={
          <Button leading={<Plus className="size-4" />} onClick={() => setNew("1")}>
            New project
          </Button>
        }
      />

      <Headline
        kicker="Held in community wallets"
        value={formatNairaShort(heldTotal)}
        unit={`across ${held.length} projects`}
        aside={
          <Figures
            items={[
              { label: "Contributors", value: held.reduce((a, p) => a + p.contributors, 0), hint: "On open projects" },
              { label: "Failed payments", value: failed, tone: failed ? "warning" : undefined, hint: "Retried automatically" },
              { label: "Awaiting release", value: ready.length, hint: formatNairaShort(ready.reduce((a, p) => a + p.raised, 0)) },
              { label: "Released to date", value: formatNairaShort(released), hint: "To verified providers" },
            ]}
          />
        }
      >
        {ready.length > 0 ? (
          <p>
            <span className="font-medium text-ink">{ready.length === 1 ? "One project is" : `${ready.length} projects are`} fully funded</span> and waiting on a release decision.{" "}
            {ready.some((p) => !isVerified(p.provider)) && "One of them can't be released until its provider passes verification."}
          </p>
        ) : (
          <p>No project is waiting for release.</p>
        )}
      </Headline>

      <section className="flex flex-col gap-4">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "active", label: "Collecting", count: rows.filter((p) => inTab(p, "active")).length },
            { value: "funded", label: "Funded", count: rows.filter((p) => inTab(p, "funded")).length },
            { value: "released", label: "Released", count: rows.filter((p) => inTab(p, "released")).length },
            { value: "closed", label: "Closed", count: rows.filter((p) => inTab(p, "closed")).length },
          ]}
        />
        {list.length === 0 ? (
          <StateView state="empty" compact title="No projects here" description={tab === "closed" ? "Closed projects and their refunds appear here." : "Projects move here as their status changes."} />
        ) : (
          <ul className="flex flex-col divide-y divide-line border-y border-line">
            {list.map((p) => {
              const pct = Math.min(100, Math.round((p.raised / p.target) * 100));
              const days = daysBetween(p.deadline);
              const rs = releaseState(p);
              return (
                <li key={p.id}>
                  <button type="button" onClick={() => setId(p.id)} className="group grid w-full gap-3 py-5 text-left md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_220px] md:items-center md:gap-8">
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="t-micro text-ink-3">{p.community} · {p.category}</span>
                      <span className="t-body font-medium text-ink group-hover:underline">{p.title}</span>
                      <span className="flex items-center gap-1.5 t-small text-ink-2">
                        {p.provider}
                        {isVerified(p.provider) ? (
                          <BadgeCheck className="size-4 text-success" aria-label="Verified provider" />
                        ) : (
                          <span className="t-micro text-danger">· not verified</span>
                        )}
                      </span>
                    </span>
                    <span className="flex flex-col gap-2">
                      <ProgressBar value={p.raised} max={p.target} tone={pct >= 100 ? "success" : "slate"} label={`${pct}% funded`} />
                      <span className="flex justify-between gap-3 t-small tnum">
                        <span className="text-ink">
                          <span className="font-medium">{formatNaira(p.raised)}</span> <span className="text-ink-3">of {formatNairaShort(p.target)}</span>
                        </span>
                        <span className="text-ink-3">{pct}%</span>
                      </span>
                    </span>
                    <span className="flex items-center justify-between gap-3 md:flex-col md:items-end md:gap-1.5">
                      <Badge tone={rs.tone} dot>{rs.label}</Badge>
                      <span className="t-small text-ink-3 tnum">
                        {p.contributors} contributors · {p.status === "Active" ? (days >= 0 ? `${days} days left` : "Past deadline") : formatDate(p.deadline).replace(/ \d{4}$/, "")}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {id && !current && (
        <Drawer open onClose={() => setId(null)} title="Project not found">
          <StateView state="not-found" title="We couldn't find that project" />
        </Drawer>
      )}
      {current && <ProjectDrawer project={current} onClose={() => setId(null)} onUpdate={update} />}

      <NewProjectModal
        open={isNew === "1"}
        onClose={() => setNew(null)}
        onCreate={(p) => {
          setRows((rs) => [p, ...rs]);
          setTab("active");
          setNew(null);
          setId(p.id);
          toast.success("Project published", `${p.community} residents can contribute from today.`);
        }}
      />
    </Page>
  );
}

/* ------------------------------------------------------------------ */

function ProjectDrawer({ project: p, onClose, onUpdate }: { project: AdminProject; onClose: () => void; onUpdate: (id: string, patch: Partial<AdminProject>) => void }) {
  const toast = useToast();
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const funded = p.raised >= p.target;
  const verified = isVerified(p.provider);
  const open = ["Active", "Funded", "Draft"].includes(p.status);
  const canRelease = open && funded && verified;
  const remaining = Math.max(0, p.target - p.raised);
  const rs = releaseState(p);
  const ledger = contributions(p);
  const opId = operatorIdByName(p.provider);
  const blockReason = !funded ? `Target not reached, ${formatNaira(remaining)} to go` : !verified ? `${p.provider} hasn't passed verification` : "";

  return (
    <>
      <Drawer
        open
        onClose={onClose}
        width="lg"
        title={p.title}
        description={`${p.community} · ${p.category} · created ${formatRelative(p.createdAt)}`}
        footer={
          open ? (
            <>
              <Button variant="ghost" onClick={() => setConfirmClose(true)}>Close project</Button>
              <Button disabled={!canRelease} onClick={() => setConfirmRelease(true)}>Approve release</Button>
            </>
          ) : p.status === "Released" ? (
            <Button
              onClick={() => {
                onUpdate(p.id, { status: "Completed" });
                toast.success("Work verified", "The project is complete and contributors have been told.");
              }}
            >
              Mark work verified
            </Button>
          ) : undefined
        }
      >
        <div className="flex flex-col gap-8">
          {/* Wallet */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <StatusBadge status={p.status} size="md" />
              <Badge tone={rs.tone} dot size="md">{rs.label}</Badge>
            </div>
            <div className="flex flex-col gap-3">
              <p className="t-micro text-ink-3">Community wallet</p>
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span className="t-display text-ink tnum">{formatNaira(p.raised)}</span>
                <span className="t-body text-ink-2">of {formatNaira(p.target)}</span>
              </p>
              <ProgressBar value={p.raised} max={p.target} tone={funded ? "success" : "slate"} label="Funding progress" />
            </div>
            <Facts
              items={[
                { label: "Total collected", value: <span className="tnum">{formatNaira(p.raised)}</span> },
                { label: "Remaining", value: <span className="tnum">{remaining ? formatNaira(remaining) : "Fully funded"}</span> },
                { label: "Contributors", value: <span className="tnum">{p.contributors}</span> },
                { label: "Failed payments", value: <span className={cn("tnum", p.failedPayments > 0 && open && "text-warning")}>{p.failedPayments}</span> },
                { label: "Deadline", value: formatDate(p.deadline) },
                { label: "Provider", value: opId ? <Link to={`/admin/operators/${opId}`} className="underline decoration-line-strong underline-offset-4 hover:decoration-ink">{p.provider}</Link> : p.provider },
              ]}
            />
          </section>

          {/* Release gate */}
          {open && (
            <section className="flex flex-col gap-3 border-t border-line pt-6">
              <h3 className="t-h3 text-ink">Release conditions</h3>
              <ul className="flex flex-col gap-2.5">
                {[
                  { ok: funded, label: "Target reached", detail: funded ? `${formatNaira(p.raised)} collected` : `${formatNaira(remaining)} still to raise` },
                  { ok: verified, label: "Provider verified by Slate", detail: verified ? `${p.provider}, documents and contract current` : `${p.provider} is still in verification` },
                  { ok: true, label: "Work plan agreed with the community", detail: "Signed off by the residents' association" },
                ].map((c) => (
                  <li key={c.label} className="flex items-start gap-3">
                    <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full", c.ok ? "bg-success-bg text-success" : "bg-danger-bg text-danger")}>
                      {c.ok ? <Check className="size-3" strokeWidth={3} /> : <X className="size-3" strokeWidth={3} />}
                    </span>
                    <span className="flex flex-col">
                      <span className="t-small font-medium text-ink">{c.label}</span>
                      <span className="t-small text-ink-3">{c.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
              {!canRelease && <p className="t-small text-ink-2">Release is locked: {blockReason.charAt(0).toLowerCase() + blockReason.slice(1)}.</p>}
            </section>
          )}

          {/* Ledger */}
          <section className="flex flex-col gap-3 border-t border-line pt-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="t-h3 text-ink">Recent contributions</h3>
              {open && p.failedPayments > 0 && (
                <Button variant="ghost" size="sm" leading={<RefreshCw className="size-3.5" />} onClick={() => toast.success(`Retrying ${p.failedPayments} failed payments`, "Contributors get an SMS if their card fails again.")}>
                  Retry failed
                </Button>
              )}
            </div>
            <ul className="flex flex-col divide-y divide-line">
              {ledger.map((c, i) => (
                <li key={i} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1 t-small text-ink">{c.name}</span>
                  <span className="t-small text-ink-3 tnum">{formatRelative(c.at)}</span>
                  <span className="w-20 text-right t-small font-medium text-ink tnum">{formatNaira(c.amount)}</span>
                  <span className="w-24 text-right">{c.status === "Successful" ? <span className="t-small text-ink-3">Paid</span> : <StatusBadge status={c.status} />}</span>
                </li>
              ))}
            </ul>
            {open && p.status === "Active" && (
              <div>
                <Button variant="secondary" size="sm" leading={<Send className="size-3.5" />} onClick={() => toast.success(`Reminder sent to ${p.community}`, `SMS and in-app to residents who haven't contributed. ${formatNaira(remaining)} to go.`)}>
                  Send reminder to residents
                </Button>
              </div>
            )}
          </section>

          {/* Workflow 9 */}
          <section className="flex flex-col gap-4 border-t border-line pt-6">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="t-h3 text-ink">Community wallet workflow</h3>
              <span className="t-micro text-ink-3">Workflow 9</span>
            </div>
            <Timeline items={walletTimeline(p)} />
          </section>
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirmRelease}
        onClose={() => setConfirmRelease(false)}
        title={`Release ${formatNaira(p.raised)} to ${p.provider}?`}
        description="The wallet balance is paid to the provider's verified account within one working day. This can't be undone from Slate."
        confirmLabel="Approve release"
        onConfirm={() => {
          onUpdate(p.id, { status: "Released", releasedAt: DEMO_NOW.toISOString() });
          toast.success("Release approved", `${formatNaira(p.raised)} to ${p.provider}. ${p.contributors} contributors have been told.`);
        }}
      >
        <p className="t-small text-ink-3">Approved by Idara Umoh · logged in the audit trail with this project's wallet reference.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        variant="destructive"
        title="Close this project?"
        description={`Contributions stop today. ${formatNaira(p.raised)} is refunded to ${p.contributors} contributors' original payment methods within 5 working days.`}
        confirmLabel="Close and refund"
        onConfirm={() => {
          onUpdate(p.id, { status: "Closed" });
          toast.success("Project closed", "Refunds are queued and every contributor has been told.");
        }}
      />
    </>
  );
}

function walletTimeline(p: AdminProject): TimelineItem[] {
  const funded = p.raised >= p.target;
  const verified = isVerified(p.provider);
  const released = p.status === "Released" || p.status === "Completed";
  const done = p.status === "Completed";
  const closed = p.status === "Closed";
  const c = new Date(p.createdAt).getTime();
  const at = (d: number) => formatDate(new Date(c + d * 86_400_000)).replace(/ \d{4}$/, "");
  const items: TimelineItem[] = [
    { title: "Project created", description: `${p.community} · target ${formatNaira(p.target)}`, time: at(0), state: "done" },
    { title: "Provider verified", description: verified ? `${p.provider}, verified operator` : `${p.provider}, verification incomplete`, time: verified ? at(1) : undefined, state: verified ? "done" : "failed" },
    { title: "Published to residents", description: "Shared in-app and by SMS", time: at(1), state: "done" },
    { title: "Contributions collected in wallet", description: `${p.contributors} contributors · ${formatNaira(p.raised)}`, time: funded || released ? at(14) : "Ongoing", state: funded || released || closed ? "done" : "current" },
    { title: "Failed payments retried", description: p.failedPayments ? `${p.failedPayments} retried, contributors notified` : "No failures", state: funded || released || closed ? "done" : "current" },
    { title: "Target reached", description: funded ? "Wallet locked for release" : `${formatNaira(Math.max(0, p.target - p.raised))} to go`, state: funded ? "done" : "upcoming" },
    { title: "Slate approves release", description: released ? "Approved by Idara Umoh" : funded && verified && !closed ? "Waiting for approval" : "Locked until target and verification", time: released && p.releasedAt ? formatDate(p.releasedAt).replace(/ \d{4}$/, "") : undefined, state: released ? "done" : funded && verified && !closed ? "current" : "upcoming" },
    { title: "Funds released to provider", description: released ? `${formatNaira(p.raised)} paid to ${p.provider}` : "Paid within one working day of approval", state: released ? "done" : "upcoming" },
    { title: "Work completed and verified", description: done ? "Photos checked by Slate operations" : "Slate checks the finished work on site", state: done ? "done" : released ? "current" : "upcoming" },
    { title: closed ? "Closed and refunded" : "Project closed", description: closed ? "Contributions refunded to original payment methods" : "Contributors receive the final report", state: done || closed ? "done" : "upcoming" },
  ];
  return items;
}

/* ------------------------------------------------------------------ */

function NewProjectModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (p: AdminProject) => void }) {
  const [title, setTitle] = useState("");
  const [community, setCommunity] = useState("");
  const [category, setCategory] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [provider, setProvider] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const reset = () => {
    setTitle(""); setCommunity(""); setCategory(""); setTarget(""); setDeadline(""); setProvider(""); setDescription(""); setErrors({});
  };
  const amount = Number(target.replace(/[^\d]/g, ""));
  const minDate = new Date(DEMO_NOW.getTime() + 7 * 86_400_000).toISOString().slice(0, 10);
  const maxDate = new Date(DEMO_NOW.getTime() + 120 * 86_400_000).toISOString().slice(0, 10);

  const submit = () => {
    const e: Record<string, string> = {};
    if (title.trim().length < 8) e.title = "Give the project a clear title residents will recognise.";
    if (!community) e.community = "Choose the community.";
    if (!category) e.category = "Choose a category.";
    if (!amount || amount < 50_000) e.target = "Set a target of at least ₦50,000.";
    if (!deadline) e.deadline = "Set a deadline.";
    else if (deadline < minDate || deadline > maxDate) e.deadline = "Deadline must be between 7 and 120 days from today.";
    if (!provider) e.provider = "Choose a verified provider to receive the funds.";
    setErrors(e);
    if (Object.keys(e).length) return;
    onCreate({
      id: `cp-${title.toLowerCase().replace(/[^a-z]+/g, "-").slice(0, 24)}`,
      title: title.trim(), community, category, target: amount, raised: 0, contributors: 0, deadline: new Date(`${deadline}T23:59:00+01:00`).toISOString(),
      status: "Active", provider, failedPayments: 0, description: description.trim(), createdAt: DEMO_NOW.toISOString(),
    });
    reset();
  };

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      size="lg"
      title="New community project"
      description="Residents contribute into a dedicated wallet. Nothing is released until the target is met and you approve it."
      footer={
        <>
          <Button variant="ghost" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button onClick={submit}>Publish project</Button>
        </>
      }
    >
      <div className="grid gap-4 pb-2 sm:grid-cols-2">
        <Input label="Title" fieldClassName="sm:col-span-2" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Clear the Itam junction drainage" error={errors.title} />
        <Select label="Community" placeholder="Choose" value={community} onChange={(e) => setCommunity(e.target.value)} options={AREAS} error={errors.community} />
        <Select label="Category" placeholder="Choose" value={category} onChange={(e) => setCategory(e.target.value)} options={CATEGORIES} error={errors.category} />
        <CurrencyInput
          label="Target"
          value={target}
          onChange={(e) => {
            const n = e.target.value.replace(/[^\d]/g, "");
            setTarget(n ? Number(n).toLocaleString("en-NG") : "");
          }}
          placeholder="850,000"
          error={errors.target}
        />
        <DatePicker label="Deadline"  min={minDate} max={maxDate} value={deadline} onChange={(date) => setDeadline(date)} error={errors.deadline} />
        <Select
          label="Verified service provider"
          fieldClassName="sm:col-span-2"
          placeholder="Choose provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          options={verifiedProviders.map((o) => ({ value: o.short, label: `${o.short}, ${o.focus.toLowerCase()}` }))}
          hint="Only operators that have passed Slate verification can receive community funds."
          error={errors.provider}
        />
        <Textarea label="What the money pays for" optional fieldClassName="sm:col-span-2" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Desilt 420 metres of the channel behind Blocks C–F and haul the debris." />
      </div>
    </Modal>
  );
}
