import { useState } from "react";
import { Link, useParams } from "react-router";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Paperclip, RotateCcw, Send, Truck } from "lucide-react";
import { BrandMark } from "@/components/brand/Logo";
import {
  Avatar, Badge, Button, ButtonLink, ConfirmDialog, FileDrop, Modal, Page, PageHeader, ProgressBar, Section, Select, StateView, Textarea, Timeline,
  statusTone, useToast, type TimelineItem, type UploadedFile,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { me, type Complaint } from "@/data";
import { DEMO_NOW, formatDate, formatDateTime, formatDay } from "@/lib/format";
import {
  COMPLAINT_STEPS, EvidenceArt, careComplaintById, complaintLabel, complaintTab, formatSpan, useDemoClock, type CareComplaint, type ThreadMessage,
} from "./_care";

const H = 3_600_000;

export default function ComplaintDetail() {
  const { id } = useParams();
  const c = id ? careComplaintById(id) : undefined;
  if (!c)
    return (
      <Page>
        <PageHeader title="Complaint not found" back={{ to: "/app/complaints", label: "Complaints" }} />
        <StateView
          state="not-found"
          title={`We couldn't find ${id ?? "that complaint"}`}
          description="Check the reference in your SMS or email, it looks like CMP-1201. Complaints from other accounts aren't visible here."
          action={<ButtonLink to="/app/complaints">All complaints</ButtonLink>}
        />
      </Page>
    );
  return <DetailView key={c.id} base={c} />;
}

function DetailView({ base }: { base: CareComplaint }) {
  const toast = useToast();
  const [status, setStatus] = useState<Complaint["status"]>(base.status);
  const [thread, setThread] = useState<ThreadMessage[]>(base.thread);
  const [steps, setSteps] = useState<Array<string | null>>(base.stepTimes);
  const [resolution, setResolution] = useState(base.resolution);
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [attach, setAttach] = useState(false);
  const [dialog, setDialog] = useState<null | "resolve" | "reopen" | "escalate">(null);
  const [reason, setReason] = useState("");
  const [viewer, setViewer] = useState<number | null>(null);

  const tab = complaintTab(status);
  const label = complaintLabel(status);
  const finished = tab === "resolved" || tab === "closed";
  const nowIso = () => DEMO_NOW.toISOString();
  const system = (body: string): ThreadMessage => ({ id: `s-${Date.now()}`, author: "system", name: "Slate", role: "Automatic", time: nowIso(), body });

  const send = () => {
    if (!comment.trim()) return;
    setThread((t) => [
      ...t,
      { id: `m-${Date.now()}`, author: "you", name: me.household.name, role: "You", time: nowIso(), body: comment.trim(), attachments: files.map((f) => f.name) },
    ]);
    setComment("");
    setFiles([]);
    setAttach(false);
    toast.success("Comment sent", `${base.assignee.split(" ")[0]} at Slate Care will see it straight away.`);
  };

  return (
    <Page>
      <PageHeader
        back={{ to: "/app/complaints", label: "Complaints" }}
        eyebrow={<span className="t-mono text-[13px] text-ink-2">{base.id}</span>}
        title={base.issue}
        meta={
          <Badge tone={statusTone(label)} dot size="md">
            {label}
          </Badge>
        }
        actions={
          finished ? (
            <Button variant="secondary" leading={<RotateCcw className="size-4" />} onClick={() => setDialog("reopen")}>
              Reopen
            </Button>
          ) : (
            <>
              {status !== "Escalated" && (
                <Button variant="outline" leading={<AlertTriangle className="size-4" />} onClick={() => setDialog("escalate")}>
                  Escalate
                </Button>
              )}
              <Button leading={<Check className="size-4" />} onClick={() => setDialog("resolve")}>
                Mark resolved
              </Button>
            </>
          )
        }
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-10">
          <SlaPanel c={base} status={status} resolution={resolution} steps={steps} />

          <Section title="What happened">
            <p className="t-body max-w-2xl text-ink-2">{base.description}</p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 sm:grid-cols-3">
              {[
                ["Service", base.service],
                [
                  base.paymentRef ? "Payment" : "Related pickup",
                  base.paymentRef ? (
                    <span className="t-mono">{base.paymentRef}</span>
                  ) : base.pickupId ? (
                    <Link to={`/app/pickups/${base.pickupId}`} className="t-mono underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                      {base.pickupId}
                    </Link>
                  ) : (
                    "Not set"
                  ),
                ],
                ["Category", base.category],
                ["Reported", formatDateTime(base.created)],
                ["Operator", base.operatorName],
                ["Handled by", `${base.assignee}, Slate Care`],
              ].map(([k, v], i) => (
                <div key={i} className="flex min-w-0 flex-col gap-0.5">
                  <dt className="t-micro text-ink-3">{k}</dt>
                  <dd className="t-small text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section title="Evidence" description={base.evidenceItems.length ? "Tap a photo to see it larger." : undefined}>
            {base.evidenceItems.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {base.evidenceItems.map((e, i) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setViewer(i)}
                    className="group flex flex-col gap-2 text-left"
                    aria-label={`Open photo: ${e.caption}`}
                  >
                    <span className="block aspect-[4/3] overflow-hidden rounded-md border border-line transition group-hover:border-line-strong">
                      <EvidenceArt kind={e.kind} taken={e.taken} className="transition-transform duration-300 group-hover:scale-[1.03]" />
                    </span>
                    <span className="t-small line-clamp-2 text-ink-2">{e.caption}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="t-small text-ink-3">No photos attached. You can add some with a comment below.</p>
            )}
          </Section>

          {resolution && (
            <section
              className={cn("flex flex-col gap-2 rounded-lg p-5 sm:p-6", resolution.state === "done" ? "bg-success-bg" : "border border-line bg-surface")}
              aria-label="Resolution"
            >
              <p className={cn("t-micro", resolution.state === "done" ? "text-success" : "text-ink-3")}>
                {resolution.state === "done" ? "Resolution" : "Agreed fix, not done yet"}
              </p>
              <p className="t-h2 text-ink">{resolution.summary}</p>
              <p className="t-small text-ink-2">{resolution.detail}</p>
              {resolution.state === "proposed" && !finished && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setDialog("resolve")}>
                    It's fixed
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => document.getElementById("reply")?.focus()}>
                    Ask a question
                  </Button>
                </div>
              )}
            </section>
          )}

          <Section title="Conversation" description="Slate Care and the operator's responses, in order.">
            <ol className="flex flex-col border-t border-line">
              {thread.map((m) => (
                <MessageRow key={m.id} m={m} />
              ))}
            </ol>
            <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
              <Textarea
                id="reply"
                aria-label="Add a comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={finished ? "Add a comment. To get this looked at again, reopen it." : `Reply to ${base.assignee.split(" ")[0]} at Slate Care`}
              />
              {attach && <FileDrop images files={files} onFiles={setFiles} hint="JPG or PNG, up to 10 MB each" />}
              <div className="flex items-center justify-between gap-2">
                <Button variant="ghost" size="sm" leading={<Paperclip className="size-4" />} onClick={() => setAttach((a) => !a)}>
                  {attach ? "Hide photos" : "Attach photos"}
                </Button>
                <Button size="sm" leading={<Send className="size-4" />} disabled={!comment.trim()} onClick={send}>
                  Send
                </Button>
              </div>
            </div>
          </Section>
        </div>

        <aside className="flex min-w-0 flex-col gap-8 lg:sticky lg:top-24 lg:self-start">
          <section className="flex flex-col gap-4">
            <h2 className="t-h2 text-ink">Progress</h2>
            <Timeline items={timelineItems(base, steps, status, resolution?.summary)} />
          </section>
          {!finished && status !== "Escalated" && (
            <section className="flex flex-col gap-2 border-t border-line pt-6">
              <h3 className="t-h3 text-ink">Not happy with how this is going?</h3>
              <p className="t-small text-ink-2">Escalating sends it to Slate's operations lead, who replies within 4 hours.</p>
              <div>
                <Button variant="ghost" size="sm" className="-ml-3" onClick={() => setDialog("escalate")}>
                  Escalate this complaint
                </Button>
              </div>
            </section>
          )}
        </aside>
      </div>

      <EvidenceViewer c={base} index={viewer} onChange={setViewer} />

      <ConfirmDialog
        open={dialog === "resolve"}
        onClose={() => setDialog(null)}
        title="Mark this as resolved?"
        description="Tell us it's fixed. We close it after 7 days unless you reopen it."
        confirmLabel="Mark resolved"
        onConfirm={() => {
          const t = nowIso();
          setStatus("Resolved");
          setSteps((s) => s.map((v, i) => (i >= 6 && i <= 7 ? (v ?? t) : v)));
          setResolution((r) => (r ? { ...r, state: "done" } : { summary: "Confirmed fixed by you", detail: "You told us the problem is sorted.", state: "done" }));
          setThread((th) => [...th, system("You marked this resolved. It closes automatically on " + formatDay(new Date(DEMO_NOW.getTime() + 7 * 24 * H)) + ".")]);
          toast.success(`${base.id} resolved`, "Thanks for confirming. Reopen it any time in the next 7 days.");
        }}
      />
      <ConfirmDialog
        open={dialog === "reopen"}
        onClose={() => setDialog(null)}
        title={`Reopen ${base.id}?`}
        description={`It goes back to ${base.assignee} at Slate Care with a new 24-hour reply target.`}
        confirmLabel="Reopen"
        onConfirm={() => {
          const t = nowIso();
          setStatus("Open");
          setSteps((s) => s.map((v, i) => (i === 0 ? v : i === 1 ? t : null)));
          setResolution((r) => (r ? { ...r, state: "proposed", summary: `Previously: ${r.summary.replace(/^Previously: /, "")}` } : r));
          setThread((th) => [...th, system(`Reopened by you${reason ? `: ${reason.toLowerCase()}` : ""}. New reply target ${formatDateTime(new Date(DEMO_NOW.getTime() + 24 * H))}.`)]);
          setReason("");
          toast.success(`${base.id} reopened`, "Slate Care will reply within 24 hours.");
        }}
      >
        <Select label="What's wrong" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Choose a reason" options={["The problem came back", "The fix wasn't done", "I disagree with the outcome", "Something else"]} />
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === "escalate"}
        onClose={() => setDialog(null)}
        variant="destructive"
        title="Escalate to operations?"
        description="Idara Umoh, Slate's operations lead, takes over and replies within 4 hours. The operator's performance record is flagged."
        confirmLabel="Escalate"
        onConfirm={() => {
          setStatus("Escalated");
          setThread((th) => [...th, system(`Escalated to Idara Umoh, Operations lead${reason ? `, ${reason.toLowerCase()}` : ""}. Reply due by ${formatDateTime(new Date(DEMO_NOW.getTime() + 4 * H))}.`)]);
          setReason("");
          toast.success(`${base.id} escalated`, "Idara Umoh will reply within 4 hours.");
        }}
      >
        <Select label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Choose a reason" options={["No reply yet", "The fix is taking too long", "The same problem keeps happening", "Health or safety risk"]} />
      </ConfirmDialog>
    </Page>
  );
}

/* ------------------------------------------------------------------ */

function SlaPanel({ c, status, resolution, steps }: { c: CareComplaint; status: Complaint["status"]; resolution: CareComplaint["resolution"]; steps: Array<string | null> }) {
  const now = useDemoClock(1000);
  const created = new Date(c.created).getTime();
  const due = new Date(c.slaDue).getTime();
  const responded = c.respondedAt ? new Date(c.respondedAt).getTime() : null;
  const left = due - now;
  const pct = Math.min(100, ((now - created) / (due - created)) * 100);
  const tab = complaintTab(status);
  const resolvedAt = steps[6] ? new Date(steps[6]).getTime() : null;
  const resolveTarget = created + 72 * H;
  const hms = (ms: number) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    return `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m ${String(s % 60).padStart(2, "0")}s`;
  };

  return (
    <section aria-label="Service level" className="grid overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 [&>*]:bg-surface gap-px">
      <div className="flex flex-col gap-2 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="t-micro text-ink-3">Reply within 24 hours</p>
          {responded ? (
            <Badge tone={responded <= due ? "success" : "danger"} dot>
              {responded <= due ? "Met" : "Missed"}
            </Badge>
          ) : (
            <Badge tone={left < 4 * H ? "warning" : "info"} dot>
              {left > 0 ? "Running" : "Overdue"}
            </Badge>
          )}
        </div>
        {responded ? (
          <>
            <p className="t-h2 text-ink tnum">Replied in {formatSpan(responded - created)}</p>
            <p className="t-small text-ink-2">
              {c.thread.find((m) => m.author === "slate")?.name ?? c.assignee} replied {formatDateTime(c.respondedAt!)}.
            </p>
          </>
        ) : (
          <>
            <p className="t-h2 text-ink tnum" role="timer">
              {left > 0 ? `${hms(left)} left` : `${formatSpan(-left)} overdue`}
            </p>
            <ProgressBar value={pct} size="sm" tone={left < 4 * H ? "warning" : "slate"} label="Time used of the 24-hour reply target" />
            <p className="t-small text-ink-2">Reply due by {formatDateTime(c.slaDue)}.</p>
          </>
        )}
      </div>
      <div className="flex flex-col gap-2 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="t-micro text-ink-3">Fix agreed within 72 hours</p>
          {tab === "resolved" || tab === "closed" ? (
            <Badge tone="success" dot>
              Done
            </Badge>
          ) : status === "Escalated" ? (
            <Badge tone="danger" dot>
              Escalated
            </Badge>
          ) : resolution ? (
            <Badge tone="success" dot>
              Agreed
            </Badge>
          ) : (
            <Badge tone="neutral" dot>
              Not yet
            </Badge>
          )}
        </div>
        {(tab === "resolved" || tab === "closed") && resolvedAt ? (
          <>
            <p className="t-h2 text-ink tnum">Resolved in {formatSpan(resolvedAt - created)}</p>
            <p className="t-small text-ink-2">{tab === "closed" && steps[8] ? `Closed ${formatDate(steps[8])}.` : "Closes 7 days after resolution unless you reopen it."}</p>
          </>
        ) : resolution ? (
          <>
            <p className="t-h2 text-ink tnum">Agreed in {formatSpan(new Date(c.stepTimes[5] ?? c.created).getTime() - created)}</p>
            <p className="t-small text-ink-2">The fix and its date are below. Mark it resolved once it's done.</p>
          </>
        ) : (
          <>
            <p className="t-h2 text-ink tnum">By {formatDay(new Date(resolveTarget))}</p>
            <p className="t-small text-ink-2">If we can't agree a fix by {formatDateTime(new Date(resolveTarget))}, it's escalated automatically.</p>
          </>
        )}
      </div>
    </section>
  );
}

function timelineItems(c: CareComplaint, steps: Array<string | null>, status: Complaint["status"], resolutionSummary?: string): TimelineItem[] {
  const last = steps.reduce<number>((a, v, i) => (v ? i : a), -1);
  const desc: Record<(typeof COMPLAINT_STEPS)[number], string> = {
    Created: "You reported it in the app.",
    "SLA timer started": "24-hour reply target set.",
    "Operator notified": `${c.operatorName} asked for the crew's account.`,
    "Operations reviewed": `${c.assignee} at Slate Care reviewed your photos.`,
    "Operator responded": "The operator's account and photos are in.",
    "Slate reviewed": "Checked against the truck's GPS and crew photos.",
    Resolution: resolutionSummary?.replace(/^Previously: /, "") ?? "A fix agreed with you.",
    "Customer notified": "You're told what happens and when.",
    Closed: "After you confirm, or 7 days after resolution.",
  };
  return COMPLAINT_STEPS.map((title, i) => {
    const t = steps[i];
    if (t) return { title, time: formatDateTime(t), description: desc[title], state: "done" };
    if (i < last) return { title, description: "Not needed for this complaint.", state: "done", time: "Not set" };
    if (i === last + 1)
      return {
        title,
        description: status === "Escalated" ? `${desc[title]} Escalated to Idara Umoh, Operations lead.` : desc[title],
        state: status === "Escalated" ? "failed" : "current",
      };
    return { title, description: undefined, state: "upcoming" };
  });
}

function MessageRow({ m }: { m: ThreadMessage }) {
  const avatar =
    m.author === "you" ? (
      <Avatar name={m.name} size="sm" />
    ) : m.author === "slate" ? (
      <span className="flex size-8 items-center justify-center rounded-full bg-slate text-slate-ink">
        <BrandMark className="size-4" tone="light" />
      </span>
    ) : m.author === "operator" ? (
      <span className="flex size-8 items-center justify-center rounded-full border border-line-strong text-ink-2">
        <Truck className="size-4" strokeWidth={1.75} />
      </span>
    ) : (
      <span className="flex size-8 items-center justify-center">
        <span className="size-2 rounded-full bg-line-strong" />
      </span>
    );
  return (
    <li className={cn("flex gap-3.5 border-b border-line py-5", m.author === "system" && "py-3.5")}>
      <div className="shrink-0">{avatar}</div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {m.author === "system" ? (
          <p className="t-small text-ink-2">
            {m.body} <span className="whitespace-nowrap text-ink-3">· {formatDateTime(m.time)}</span>
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="t-small font-semibold text-ink">{m.name}</span>
              <span className={cn("t-micro", m.author === "slate" ? "text-ink-2" : "text-ink-3")}>{m.role}</span>
              <span className="t-micro ml-auto text-ink-3 tnum">{formatDateTime(m.time)}</span>
            </div>
            <p className="t-body text-ink">{m.body}</p>
            {m.attachments && m.attachments.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {m.attachments.map((a) => (
                  <span key={a} className="inline-flex max-w-full items-center gap-1.5 rounded-sm bg-sunken px-2 py-1 t-micro text-ink-2">
                    <Paperclip className="size-3 shrink-0" />
                    <span className="truncate">{a}</span>
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </li>
  );
}

function EvidenceViewer({ c, index, onChange }: { c: CareComplaint; index: number | null; onChange: (i: number | null) => void }) {
  const e = index === null ? null : c.evidenceItems[index];
  const n = c.evidenceItems.length;
  return (
    <Modal open={!!e} onClose={() => onChange(null)} size="lg" title={e?.caption} description={e ? `Photo ${index! + 1} of ${n}` : undefined}>
      {e && (
        <div className="flex flex-col gap-4 pb-3">
          <div className="aspect-[4/3] overflow-hidden rounded-md">
            <EvidenceArt kind={e.kind} taken={e.taken} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="t-mono truncate text-[12.5px] text-ink-2">{e.name}</p>
              <p className="t-small text-ink-3">Taken {formatDateTime(e.taken)}</p>
            </div>
            {n > 1 && (
              <div className="flex shrink-0 gap-1">
                <Button variant="outline" size="sm" aria-label="Previous photo" disabled={index === 0} onClick={() => onChange(index! - 1)}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="sm" aria-label="Next photo" disabled={index === n - 1} onClick={() => onChange(index! + 1)}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
