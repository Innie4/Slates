import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Check, Download, MapPin, Plus } from "lucide-react";
import { Strata } from "@/components/brand/Strata";
import {
  AvatarStack, Badge, Button, CurrencyInput, EmptyState, Input, List, ListRow, Modal, Page, PageHeader, ProgressBar, Select, StatusBadge,
  Tabs, Textarea, useTab, useToast,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { communityProjects, me, type CommunityProject } from "@/data";
import { formatDate, formatNaira, formatNumber } from "@/lib/format";
import { contributorNames, deadlineText, myContributions, projectBadge, projectIsOpen } from "./_care";

type Tab = "active" | "completed" | "mine";

const givenTo = (id: string) => myContributions.filter((c) => c.projectId === id && c.status === "Successful").reduce((a, c) => a + c.amount, 0);

/** C18, community projects. */
export default function Community() {
  const tab = useTab<Tab>("tab", "active");
  const [suggest, setSuggest] = useState(false);
  const toast = useToast();

  const active = communityProjects.filter(projectIsOpen);
  const completed = communityProjects.filter((p) => !projectIsOpen(p));
  const featured = active.find((p) => p.community === me.household.area) ?? active[0]!;
  const totalGiven = myContributions.filter((c) => c.status === "Successful").reduce((a, c) => a + c.amount, 0);
  const projectsBacked = new Set(myContributions.map((c) => c.projectId)).size;

  return (
    <Page>
      <PageHeader
        title="Community"
        description="Neighbours pool money for shared waste and drainage work. Slate holds it in a community wallet and pays a verified crew only when the work is done."
        actions={
          <Button variant="secondary" leading={<Plus className="size-4" />} onClick={() => setSuggest(true)}>
            Suggest a project
          </Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-10">
        <FeaturedProject p={featured} />
        <HowItWorks totalGiven={totalGiven} projectsBacked={projectsBacked} />
      </div>

      <div className="flex flex-col gap-6">
        <Tabs<Tab>
          param="tab"
          items={[
            { value: "active", label: "Active", count: active.length },
            { value: "completed", label: "Completed", count: completed.length },
            { value: "mine", label: "My contributions", count: myContributions.length },
          ]}
        />
        {tab === "active" && <ProjectGrid projects={active} />}
        {tab === "completed" && <ProjectGrid projects={completed} />}
        {tab === "mine" && <MyContributions total={totalGiven} backed={projectsBacked} />}
      </div>

      <SuggestModal
        open={suggest}
        onClose={() => setSuggest(false)}
        onSent={() => {
          setSuggest(false);
          toast.success("Sent to Slate's community team", "We check the need, get a quote from a verified operator and reply within 5 working days.");
        }}
      />
    </Page>
  );
}

function FeaturedProject({ p }: { p: CommunityProject }) {
  const pct = Math.round((p.raised / p.target) * 100);
  const names = contributorNames(p, 5);
  return (
    <section aria-label="Your estate's project" className="relative isolate flex flex-col overflow-hidden rounded-xl bg-slate text-slate-ink chalk-grain">
      <Strata tone="on-slate" bands={4} seed={23} className="absolute inset-x-0 bottom-0 -z-10 h-28 w-full opacity-60 sm:h-36" />
      <div className="flex flex-col gap-5 p-6 pb-32 sm:p-8 sm:pb-40">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1.5 t-small text-slate-ink/75">
            <MapPin className="size-3.5" />
            Your estate · {p.community}
          </span>
          <span className="t-small text-slate-ink/45">{p.category}</span>
        </div>
        <h2 className="t-h1 max-w-lg">{p.title}</h2>
        <div className="flex items-end gap-4">
          <p className="t-display-xl leading-none tnum">
            {pct}
            <span className="text-[0.5em] align-top">%</span>
          </p>
          <p className="pb-2 t-small text-slate-ink/80">
            <span className="block font-semibold text-slate-ink tnum">{formatNaira(p.raised)}</span>
            of {formatNaira(p.target)}
          </p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/12" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Funding progress">
          <div className="h-full rounded-full bg-slate-ink" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex items-center gap-2.5 [&_span.ring-surface]:ring-slate">
            <AvatarStack names={names} max={4} size="sm" />
            <span className="t-small text-slate-ink/80 tnum">{p.contributors} neighbours</span>
          </div>
          <span className="t-small text-slate-ink/80 tnum">{formatNaira(p.target - p.raised)} to go · {deadlineText(p).toLowerCase()}</span>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-6 sm:flex-row sm:items-center sm:p-8">
        <Link
          to={`/app/community/${p.id}?contribute=1`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-ink px-5 text-[14px] font-semibold text-slate-950 transition hover:bg-white"
        >
          Contribute
        </Link>
        <Link
          to={`/app/community/${p.id}`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950/45 px-4 text-[14px] font-medium text-slate-ink backdrop-blur transition hover:bg-slate-950/60"
        >
          See the wallet and plan <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

function HowItWorks({ totalGiven, projectsBacked }: { totalGiven: number; projectsBacked: number }) {
  const steps = [
    { t: "Neighbours contribute", d: "Any amount from ₦1,000, once or spread over weekly Smart Sweep charges." },
    { t: "Slate holds the money", d: "It sits in the project's community wallet. Nobody can draw on it early." },
    { t: "Target reached, crew verified", d: "Slate confirms the operator's documents, quote and insurance." },
    { t: "Work done, funds released", d: "The crew is paid after photo evidence and a resident sign-off." },
  ];
  return (
    <aside className="flex flex-col gap-6">
      <div>
        <h2 className="t-h2 text-ink">How the money moves</h2>
        <p className="t-small mt-1 text-ink-2">If a project misses its target by the deadline, every contribution is refunded in full.</p>
      </div>
      <ol className="relative flex flex-col gap-5">
        <span className="absolute bottom-3 left-[13px] top-3 border-l-[1.5px] border-dashed border-line-strong" aria-hidden />
        {steps.map((s, i) => (
          <li key={s.t} className="relative flex gap-4">
            <span className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border border-line-strong bg-canvas font-display text-[13px] font-bold text-ink tnum">
              {i + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="t-body font-medium text-ink">{s.t}</p>
              <p className="t-small text-ink-2">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
      <Link to="/app/community?tab=mine" className="group flex items-center justify-between gap-3 border-t border-line pt-5">
        <span className="t-small text-ink-2">
          You've given <span className="font-semibold text-ink tnum">{formatNaira(totalGiven)}</span> to {projectsBacked} projects
        </span>
        <ArrowRight className="size-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </aside>
  );
}

function ProjectGrid({ projects }: { projects: CommunityProject[] }) {
  if (!projects.length)
    return <EmptyState title="No projects here yet" description="When neighbours start or finish a project, it shows up here." />;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((p) => (
        <ProjectCard key={p.id} p={p} />
      ))}
    </div>
  );
}

function ProjectCard({ p }: { p: CommunityProject }) {
  const pct = Math.round((p.raised / p.target) * 100);
  const badge = projectBadge(p);
  const given = givenTo(p.id);
  return (
    <Link
      to={`/app/community/${p.id}`}
      className="group flex flex-col rounded-lg border border-line bg-surface transition-colors hover:border-line-strong"
    >
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="t-micro min-w-0 truncate pt-1 text-ink-3">
            {p.category} · {p.community}
          </p>
          <Badge tone={badge.tone} dot>
            {badge.label}
          </Badge>
        </div>
        <h3 className="t-h3 text-ink">{p.title}</h3>
        <div className="mt-auto flex flex-col gap-2">
          <ProgressBar value={p.raised} max={p.target} tone={pct >= 100 ? "success" : "slate"} label={`${pct}% funded`} />
          <div className="flex items-baseline justify-between gap-3 t-small tnum">
            <span className="text-ink-2">
              <span className="font-semibold text-ink">{formatNaira(p.raised)}</span> of {formatNaira(p.target)}
            </span>
            <span className="font-medium text-ink">{pct}%</span>
          </div>
          {given > 0 && (
            <p className="flex items-center gap-1.5 t-small text-ink-2 tnum">
              <Check className="size-3.5 text-ink-3" strokeWidth={2.5} />
              You gave {formatNaira(given)}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <AvatarStack names={contributorNames(p, 3)} max={3} size="sm" />
          <span className="t-small whitespace-nowrap text-ink-2 tnum">{formatNumber(p.contributors)} neighbours</span>
        </div>
        <span className={cn("t-small whitespace-nowrap tnum", projectIsOpen(p) ? "font-medium text-ink" : "text-ink-3")}>{deadlineText(p)}</span>
      </div>
    </Link>
  );
}

function MyContributions({ total, backed }: { total: number; backed: number }) {
  const toast = useToast();
  const rows = useMemo(() => [...myContributions].sort((a, b) => b.date.localeCompare(a.date)), []);
  if (!rows.length)
    return (
      <EmptyState
        title="You haven't contributed yet"
        description="Back a project in your estate from ₦1,000. It's refunded if the target isn't reached."
        action={<Link to="/app/community?tab=active" className="t-small font-medium text-ink underline underline-offset-4">See active projects</Link>}
      />
    );
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-10">
      <List className="border-y border-line">
        {rows.map((c) => {
          const p = communityProjects.find((x) => x.id === c.projectId)!;
          return (
            <ListRow
              key={c.id}
              to={`/app/community/${p.id}`}
              title={p.title}
              subtitle={
                <>
                  <span className="t-mono text-[12.5px]">{c.ref}</span> · {formatDate(c.date)} · {c.method}
                </>
              }
              meta={<span className="font-semibold text-ink">{formatNaira(c.amount)}</span>}
              trailing={<StatusBadge status={c.status} />}
            />
          );
        })}
      </List>
      <aside className="flex flex-col gap-4">
        <p className="t-body text-ink-2">
          You've contributed <span className="font-semibold text-ink tnum">{formatNaira(total)}</span> to {backed} projects since August. Each payment
          appears on your receipts, and Slate publishes every wallet movement on the project page.
        </p>
        <div>
          <Button variant="secondary" size="sm" leading={<Download className="size-4" />} onClick={() => toast.success("Statement downloaded", "Community contributions, Aug–Oct 2026 (PDF).")}>
            Download statement
          </Button>
        </div>
      </aside>
    </div>
  );
}

function SuggestModal({ open, onClose, onSent }: { open: boolean; onClose: () => void; onSent: () => void }) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [tried, setTried] = useState(false);
  const errors = {
    title: title.trim().length < 6 ? "Give the project a short, specific name." : undefined,
    detail: detail.trim().length < 30 ? "Describe what needs doing and where, in a sentence or two." : undefined,
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Suggest a project"
      description="Slate checks the need, gets a quote from a verified operator and opens a wallet if your neighbours agree."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setTried(true);
              if (errors.title || errors.detail) return;
              setTitle("");
              setDetail("");
              setTried(false);
              onSent();
            }}
          >
            Send suggestion
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Input label="Project name" placeholder="e.g. Clear the gutter along Block H" value={title} onChange={(e) => setTitle(e.target.value)} error={tried ? errors.title : undefined} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Community" options={["Ewet Housing Estate", "Shelter Afrique Estate", "Osongama Estate", "Aka Road traders"]} defaultValue="Ewet Housing Estate" />
          <Select label="Kind of work" options={["Drainage", "Sanitation", "Recycling", "Safety", "Infrastructure"]} defaultValue="Drainage" />
        </div>
        <Textarea
          label="What needs doing"
          rows={4}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Where it is, what the problem is, and how many homes it affects."
          error={tried ? errors.detail : undefined}
        />
        <CurrencyInput label="Rough cost, if you know it" optional placeholder="250,000" />
      </div>
    </Modal>
  );
}
