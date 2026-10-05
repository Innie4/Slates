import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Clock, Paperclip, Plus } from "lucide-react";
import {
  Alert, Badge, Button, ChipGroup, EmptyState, FileDrop, Modal, Page, PageHeader, Select, Tabs, Textarea, useTab, useToast, statusTone,
  type UploadedFile,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { me, myPickups, type Complaint } from "@/data";
import { DEMO_NOW, formatDate, formatDay } from "@/lib/format";
import { addCareComplaint, careComplaints, complaintLabel, complaintTab, formatSpan, slaLine, type CareComplaint, type ComplaintTab } from "./_care";

const CATEGORIES: Complaint["category"][] = ["Missed pickup", "Late pickup", "Spillage", "Damaged bin", "Conduct", "Billing", "Other"];

/** C25 — the customer's complaints. */
export default function Complaints() {
  const tab = useTab<ComplaintTab>("tab", "open");
  const [rows, setRows] = useState<CareComplaint[]>(() => [...careComplaints]);
  const [newOpen, setNewOpen] = useState(false);
  const count = (t: ComplaintTab) => rows.filter((c) => complaintTab(c.status) === t).length;
  const shown = rows.filter((c) => complaintTab(c.status) === tab).sort((a, b) => b.created.localeCompare(a.created));
  const last = rows.find((c) => c.id === "CMP-1183")!;
  const lastSpan = formatSpan(new Date(last.stepTimes[6]!).getTime() - new Date(last.created).getTime());

  return (
    <Page>
      <PageHeader
        title="Complaints"
        description="Slate replies within 24 hours and stays on it with the operator until it's fixed. You deal with us, not the crew."
        actions={
          <Button leading={<Plus className="size-4" />} onClick={() => setNewOpen(true)}>
            New complaint
          </Button>
        }
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <Tabs<ComplaintTab>
            param="tab"
            items={[
              { value: "open", label: "Open", count: count("open") },
              { value: "progress", label: "In progress", count: count("progress") },
              { value: "resolved", label: "Resolved", count: count("resolved") },
              { value: "closed", label: "Closed", count: count("closed") },
            ]}
          />
          {shown.length ? (
            <ul className="flex flex-col divide-y divide-line border-b border-line">
              {shown.map((c) => (
                <li key={c.id}>
                  <ComplaintRow c={c} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              compact
              title={tab === "open" ? "Nothing open" : tab === "progress" ? "Nothing in progress" : tab === "resolved" ? "Nothing waiting for your OK" : "No closed complaints"}
              description={tab === "resolved" ? "Resolved complaints close automatically after 7 days unless you reopen them." : "When something needs our attention, it shows up here."}
            />
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          <Alert
            tone="neutral"
            title="Pickup didn't happen today?"
            action={
              <Link to="/app/report-missed" className="inline-flex items-center gap-1 t-small font-semibold text-ink">
                Report <ArrowRight className="size-3.5" />
              </Link>
            }
          >
            Report a missed pickup instead. A recovery crew is booked automatically within 24 hours.
          </Alert>
          <section className="flex flex-col gap-3 border-t border-line pt-6">
            <h2 className="t-h3 text-ink">How Slate handles a complaint</h2>
            <ol className="flex flex-col gap-2.5 t-small text-ink-2">
              {[
                ["24h", "A named person at Slate Care replies."],
                ["48h", "We have the operator's account and photos."],
                ["72h", "A fix is agreed with you, or we escalate."],
              ].map(([k, v]) => (
                <li key={k} className="flex gap-3">
                  <span className="w-10 shrink-0 font-mono text-[13px] font-semibold text-ink">{k}</span>
                  {v}
                </li>
              ))}
            </ol>
            <p className="t-small text-ink-3">Your last complaint was resolved in {lastSpan}.</p>
          </section>
        </aside>
      </div>

      <NewComplaintModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={(c) => {
          addCareComplaint(c);
          setRows((r) => [c, ...r]);
          setNewOpen(false);
        }}
      />
    </Page>
  );
}

function ComplaintRow({ c }: { c: CareComplaint }) {
  const sla = slaLine(c);
  const label = complaintLabel(c.status);
  const latest = c.thread[c.thread.length - 1];
  return (
    <Link to={`/app/complaints/${c.id}`} className="group -mx-2 flex flex-col gap-2 rounded-md px-2 py-4 transition-colors hover:bg-sunken/70">
      <div className="flex items-start justify-between gap-3">
        <p className="t-body min-w-0 font-medium text-ink">{c.issue}</p>
        <Badge tone={statusTone(label)} dot className="mt-0.5">
          {label}
        </Badge>
      </div>
      <p className="t-small flex flex-wrap items-center gap-x-2 gap-y-0.5 text-ink-2">
        <span className="t-mono text-[12.5px] text-ink">{c.id}</span>
        <span className="text-ink-3">·</span>
        <span>{c.category}</span>
        <span className="text-ink-3">·</span>
        <span>{c.service}</span>
        <span className="text-ink-3">·</span>
        <span className="tnum">{formatDate(c.created)}</span>
        {c.evidence > 0 && (
          <span className="inline-flex items-center gap-1 text-ink-3">
            <Paperclip className="size-3.5" />
            {c.evidence}
          </span>
        )}
      </p>
      {latest && (
        <p className="t-small line-clamp-2 border-l-2 border-line-strong pl-3 text-ink-2">
          <span className="font-medium text-ink">{latest.author === "you" ? "You" : latest.name.split(" ")[0]}:</span> {latest.body}
        </p>
      )}
      <p
        className={cn(
          "t-small inline-flex items-center gap-1.5 tnum",
          sla.tone === "late" ? "text-danger" : sla.tone === "warn" ? "text-warning" : sla.tone === "done" ? "text-ink-3" : "text-ink-2",
        )}
      >
        <Clock className="size-3.5 shrink-0" />
        {sla.text}
      </p>
    </Link>
  );
}

function NewComplaintModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (c: CareComplaint) => void }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [service, setService] = useState("Slate Home");
  const [pickup, setPickup] = useState("");
  const [category, setCategory] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const errors = {
    category: category.length ? undefined : "Choose what kind of problem this is.",
    text: text.trim().length < 20 ? "Tell us what happened in a sentence or two — at least 20 characters." : undefined,
  };
  const pickups = myPickups.filter((p) => p.status !== "Scheduled" && p.status !== "En route");
  const reset = () => {
    setService("Slate Home");
    setPickup("");
    setCategory([]);
    setText("");
    setFiles([]);
    setTried(false);
  };

  const submit = () => {
    setTried(true);
    if (errors.category || errors.text) return;
    setBusy(true);
    setTimeout(() => {
      const now = DEMO_NOW.toISOString();
      const id = `CMP-${1219 + Math.floor(Math.random() * 40)}`;
      const p = myPickups.find((x) => x.id === pickup);
      const c: CareComplaint = {
        id,
        customerName: me.household.name,
        customerType: "Household",
        operatorName: p?.operatorName ?? "Ufok Environmental",
        service: service === "Billing and payments" ? "Slate Home" : service,
        pickupId: p?.id,
        issue: text.trim().split(/[.\n]/)[0]!.slice(0, 80),
        category: category[0] as Complaint["category"],
        severity: "Medium",
        status: "New",
        created: now,
        slaDue: new Date(DEMO_NOW.getTime() + 24 * 3_600_000).toISOString(),
        assignee: "Emem Obot",
        evidence: files.length,
        description: text.trim(),
        evidenceItems: [],
        thread: [
          { id: "t1", author: "you", name: me.household.name, role: "You", time: now, body: text.trim(), attachments: files.map((f) => f.name) },
          { id: "t2", author: "system", name: "Slate", role: "Automatic", time: now, body: "Received. Slate Care replies within 24 hours — by 08:12 tomorrow at the latest." },
        ],
        stepTimes: [now, now, null, null, null, null, null, null, null],
      };
      onCreated(c);
      setBusy(false);
      reset();
      toast.toast({
        title: `Complaint ${id} sent`,
        description: "Emem at Slate Care will reply by 08:12 tomorrow.",
        action: { label: "View", onClick: () => navigate(`/app/complaints/${id}`) },
      });
    }, 800);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="New complaint"
      description="Goes to Slate Care, not the crew. We contact the operator for you."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={busy} onClick={submit}>
            Send complaint
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Service" value={service} onChange={(e) => setService(e.target.value)} options={["Slate Home", "Bulk Waste Pickup", "Recycling Pickup", "Billing and payments"]} />
          <Select
            label="Related pickup"
            optional
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
            placeholder="Not about one pickup"
            options={pickups.map((p) => ({ value: p.id, label: `${formatDay(p.date)} · ${p.service} · ${p.id}` }))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="t-small font-medium text-ink">What kind of problem?</p>
          <ChipGroup options={CATEGORIES} value={category} onChange={(v) => setCategory(v.slice(-1))} multiple={false} />
          {tried && errors.category && (
            <p className="t-small text-danger" role="alert">
              {errors.category}
            </p>
          )}
          {category[0] === "Missed pickup" && (
            <p className="t-small text-ink-2">
              For a pickup missed today, <Link to="/app/report-missed" className="font-medium text-ink underline underline-offset-4">report it here</Link> and we book a recovery crew straight away.
            </p>
          )}
        </div>
        <Textarea
          label="What happened"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="When it happened, what you saw, and what you'd like us to do."
          error={tried ? errors.text : undefined}
          hint={`${text.trim().length} characters`}
        />
        <FileDrop label="Photos or screenshots" images files={files} onFiles={setFiles} hint="Up to 5 photos. A timestamp helps." />
      </div>
    </Modal>
  );
}
