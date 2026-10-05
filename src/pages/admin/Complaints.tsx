import { useMemo, useState } from "react";
import { Link } from "react-router";
import { BellRing, ImageIcon, Plus, Send, ShieldAlert } from "lucide-react";
import {
  Avatar, Badge, Button, Checkbox, ChipGroup, DataTable, Drawer, FileDrop, FilterBar, Modal, Page, PageHeader, Ref,
  Select, StateView, StatusBadge, Tabs, Textarea, Timeline, useFilteredRows, useTab, useToast, type Column, type TimelineItem, type Tone,
  type UploadedFile,
} from "@/components/ui";
import { customers, pickups, type Complaint } from "@/data";
import { formatDateTime, formatRelative } from "@/lib/format";
import {
  ADMIN_COMPLAINTS, Facts, Figures, Headline, SLA_HOURS, SUPPORT_AGENTS, SlaClock, customerIdByName, formatSpan, operatorIdByName, slaState, useExport,
  useNow, useParam, type AdminComplaint, type ComplaintStatus,
} from "./_gov";

const HOUR = 3_600_000;
const OPEN: ComplaintStatus[] = ["New", "Assigned", "Investigating", "Waiting", "Escalated"];
const STATUSES: ComplaintStatus[] = ["New", "Assigned", "Investigating", "Waiting", "Escalated", "Resolved", "Closed"];
const CATEGORIES: Complaint["category"][] = ["Missed pickup", "Late pickup", "Spillage", "Billing", "Conduct", "Damaged bin", "Other"];
const SEVERITIES: Complaint["severity"][] = ["Critical", "High", "Medium", "Low"];
const SEVERITY_TONE: Record<Complaint["severity"], Tone> = { Critical: "danger", High: "warning", Medium: "neutral", Low: "outline" };
const RESOLUTION_TYPES = ["Recovery pickup completed", "Account credit applied", "Refund issued", "Bin replaced", "Operator warned", "Schedule changed", "No fault found"];

const isOpen = (c: AdminComplaint) => OPEN.includes(c.status);

type TabKey = "open" | "new" | "assigned" | "investigating" | "waiting" | "escalated" | "resolved" | "closed" | "all";

export default function Complaints() {
  const toast = useToast();
  const now = useNow();
  const doExport = useExport();
  const [rows, setRows] = useState<AdminComplaint[]>(ADMIN_COMPLAINTS);
  const tab = useTab<TabKey>("tab", "open");
  const [openId, setOpenId] = useParam("id");
  const [isNew, setNew] = useParam("new");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});

  const slaLabel = (c: AdminComplaint) => {
    const s = slaState(c.slaDue, now, { done: !isOpen(c), met: c.slaMet, paused: c.status === "Waiting" }).state;
    return { running: "On track", "due-soon": "Due soon", breached: "Breached", paused: "Paused", met: "Met", missed: "Missed" }[s];
  };

  const open = rows.filter(isOpen);
  const breached = open.filter((c) => slaLabel(c) === "Breached");
  const dueSoon = open.filter((c) => slaLabel(c) === "Due soon");
  const unassigned = open.filter((c) => c.assignee === "Unassigned");
  const closed30 = rows.filter((c) => !isOpen(c));
  const metPct = Math.round((closed30.filter((c) => c.slaMet).length / Math.max(1, closed30.length)) * 100);

  const byOperator = open.reduce<Record<string, number>>((a, c) => ({ ...a, [c.operatorName]: (a[c.operatorName] ?? 0) + 1 }), {});
  const topOperator = Object.entries(byOperator).sort((a, b) => b[1] - a[1])[0];

  const counts = Object.fromEntries(STATUSES.map((s) => [s, rows.filter((c) => c.status === s).length])) as Record<ComplaintStatus, number>;
  const tabRows = useMemo(() => {
    const list = tab === "open" ? rows.filter(isOpen) : tab === "all" ? rows : rows.filter((c) => c.status.toLowerCase() === tab);
    // Open queues are worked by SLA; history by date.
    return tab === "open" || OPEN.map((s) => s.toLowerCase()).includes(tab)
      ? [...list].sort((a, b) => (a.status === "Waiting" ? 1 : 0) - (b.status === "Waiting" ? 1 : 0) || a.slaDue.localeCompare(b.slaDue))
      : list;
  }, [rows, tab]);

  const filtered = useFilteredRows(tabRows, {
    search,
    searchFields: (c) => `${c.id} ${c.customerName} ${c.operatorName} ${c.issue} ${c.pickupId ?? ""}`,
    filters,
    filterFields: { category: (c) => c.category, severity: (c) => c.severity, operator: (c) => c.operatorName, assignee: (c) => c.assignee, sla: slaLabel },
  });

  const current = openId ? rows.find((c) => c.id === openId) : undefined;
  const update = (id: string, patch: Partial<AdminComplaint>, note?: string) =>
    setRows((rs) =>
      rs.map((c) =>
        c.id === id ? { ...c, ...patch, notes: note ? [...(patch.notes ?? c.notes), { by: "Idara Umoh", at: now.toISOString(), text: note }] : patch.notes ?? c.notes } : c,
      ),
    );

  const columns: Column<AdminComplaint>[] = [
    {
      key: "issue",
      header: "Complaint",
      sortValue: (c) => c.id,
      cell: (c) => (
        <div className="flex min-w-0 max-w-[300px] flex-col gap-0.5">
          <span className="flex items-center gap-2">
            <Ref className="text-[12.5px]">{c.id}</Ref>
            <span className="t-micro text-ink-3">{c.category}</span>
          </span>
          <span className="truncate font-medium text-ink">{c.issue}</span>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      sortValue: (c) => c.customerName,
      cell: (c) => (
        <div className="flex flex-col">
          <span className="text-ink">{c.customerName}</span>
          <span className="t-micro text-ink-3">{c.customerType}</span>
        </div>
      ),
    },
    { key: "operator", header: "Operator", sortValue: (c) => c.operatorName, cell: (c) => <span className="whitespace-nowrap text-ink-2">{c.operatorName}</span> },
    { key: "severity", header: "Severity", sortValue: (c) => SEVERITIES.indexOf(c.severity), cell: (c) => <Badge tone={SEVERITY_TONE[c.severity]}>{c.severity}</Badge> },
    {
      key: "sla",
      header: "SLA",
      sortValue: (c) => c.slaDue,
      cell: (c) => <SlaClock due={c.slaDue} done={!isOpen(c)} met={c.slaMet} paused={c.status === "Waiting"} />,
    },
    {
      key: "assignee",
      header: "Assignee",
      sortValue: (c) => c.assignee,
      cell: (c) =>
        c.assignee === "Unassigned" ? (
          <span className="text-ink-3">Unassigned</span>
        ) : (
          <span className="whitespace-nowrap text-ink">{c.assignee}</span>
        ),
    },
    { key: "status", header: "Status", sortValue: (c) => STATUSES.indexOf(c.status), cell: (c) => <StatusBadge status={c.status} /> },
  ];

  return (
    <Page>
      <PageHeader
        title="Complaints"
        description="Worked against the SLA clock until the customer is told it's fixed."
        actions={
          <Button leading={<Plus className="size-4" />} onClick={() => setNew("1")}>
            New complaint
          </Button>
        }
      />

      <Headline
        kicker="Open right now"
        value={open.length}
        unit="open complaints"
        aside={
          <Figures
            items={[
              { label: "SLA breached", value: breached.length, tone: breached.length ? "danger" : undefined, hint: "With ops lead" },
              { label: "Due in 2 hours", value: dueSoon.length, tone: dueSoon.length ? "warning" : undefined, hint: "Act before breach" },
              { label: "Unassigned", value: unassigned.length, hint: "Need an owner" },
              { label: "Within SLA", value: `${metPct}%`, tone: metPct < 90 ? "warning" : undefined, hint: "30 days · target 90%" },
            ]}
          />
        }
      >
        <p>
          <span className="font-medium text-ink">{breached.length} have breached</span> their SLA and {dueSoon.length} are due within two hours.{" "}
          {topOperator && (
            <>
              {topOperator[0]} accounts for {topOperator[1]} of the open complaints.
            </>
          )}
        </p>
      </Headline>

      <div className="flex flex-col gap-5">
        <Tabs
          param="tab"
          value="open"
          items={[
            { value: "open", label: "All open", count: open.length },
            { value: "new", label: "New", count: counts.New },
            { value: "assigned", label: "Assigned", count: counts.Assigned },
            { value: "investigating", label: "Investigating", count: counts.Investigating },
            { value: "waiting", label: "Waiting", count: counts.Waiting },
            { value: "escalated", label: "Escalated", count: counts.Escalated },
            { value: "resolved", label: "Resolved", count: counts.Resolved },
            { value: "closed", label: "Closed", count: counts.Closed },
            { value: "all", label: "All" },
          ]}
        />
        <FilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Search ID, customer, operator, pickup"
          filters={[
            { key: "sla", label: "SLA", options: ["Breached", "Due soon", "On track", "Paused", "Met", "Missed"] },
            { key: "category", label: "Category", options: CATEGORIES },
            { key: "severity", label: "Severity", options: SEVERITIES },
            { key: "assignee", label: "Assignee", options: [...SUPPORT_AGENTS, "Unassigned"] },
          ]}
          values={filters}
          onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
          onExport={(f) =>
            doExport(
              f,
              "Complaints",
              filtered.map((c) => ({
                ID: c.id, Customer: c.customerName, Operator: c.operatorName, Category: c.category, Severity: c.severity, Status: c.status,
                Created: formatDateTime(c.created), "SLA due": formatDateTime(c.slaDue), SLA: slaLabel(c), Assignee: c.assignee, Issue: c.issue,
              })),
            )
          }
        />
        <DataTable
          rows={filtered}
          columns={columns}
          rowKey={(c) => c.id}
          onRowClick={(c) => setOpenId(c.id)}
          pageSize={12}
          mobile={(c) => (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <Ref className="text-[12.5px]">{c.id}</Ref>
                  <Badge tone={SEVERITY_TONE[c.severity]}>{c.severity}</Badge>
                </span>
                <StatusBadge status={c.status} />
              </div>
              <p className="t-body font-medium text-ink">{c.issue}</p>
              <p className="t-small text-ink-2">
                {c.customerName} · {c.operatorName}
              </p>
              <div className="flex items-center justify-between gap-3">
                <SlaClock due={c.slaDue} done={!isOpen(c)} met={c.slaMet} paused={c.status === "Waiting"} />
                <span className="t-small text-ink-3">{c.assignee === "Unassigned" ? "Unassigned" : c.assignee}</span>
              </div>
            </div>
          )}
          empty={
            <StateView
              state="empty"
              compact
              title={tab === "escalated" ? "Nothing escalated" : "No complaints match"}
              description={tab === "escalated" ? "Every open complaint is inside its SLA." : "Try another tab, filter or search."}
            />
          }
        />
      </div>

      <ComplaintDrawer
        complaint={current}
        missingId={openId && !current ? openId : undefined}
        onClose={() => setOpenId(null)}
        onUpdate={update}
      />

      <NewComplaintModal
        open={isNew === "1"}
        onClose={() => setNew(null)}
        nextId={`CMP-${Math.max(...rows.map((r) => Number(r.id.slice(4)))) + 1}`}
        onCreate={(c) => {
          setRows((rs) => [c, ...rs]);
          setNew(null);
          setOpenId(c.id);
          toast.success(`${c.id} created`, `SLA ${SLA_HOURS[c.severity]} hours · ${c.assignee === "Unassigned" ? "waiting for an owner" : `assigned to ${c.assignee}`}`);
        }}
      />
    </Page>
  );
}
/* ------------------------------------------------------------------ */
/* Drawer — full complaint                                             */
/* ------------------------------------------------------------------ */

function ComplaintDrawer({
  complaint: c,
  missingId,
  onClose,
  onUpdate,
}: {
  complaint?: AdminComplaint;
  missingId?: string;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<AdminComplaint>, note?: string) => void;
}) {
  const toast = useToast();
  const now = useNow();
  const [note, setNote] = useState("");
  const [resType, setResType] = useState("");
  const [resText, setResText] = useState("");
  const [resError, setResError] = useState<string | null>(null);
  const [notify, setNotify] = useState(false);

  if (missingId)
    return (
      <Drawer open onClose={onClose} title="Complaint not found" width="lg">
        <StateView state="not-found" title={`No complaint ${missingId}`} description="It may have been merged into another complaint, or the link is mistyped." />
      </Drawer>
    );
  if (!c) return null;

  const open = isOpen(c);
  const setStatus = (s: ComplaintStatus) => {
    if (s === c.status) return;
    onUpdate(c.id, { status: s }, `Status changed from ${c.status} to ${s}.`);
    toast.success(`${c.id} is now ${s.toLowerCase()}`);
  };
  const resolve = () => {
    if (!resType) return setResError("Choose what fixed it.");
    if (resText.trim().length < 12) return setResError("Describe the resolution in a sentence — the customer will see it.");
    setResError(null);
    onUpdate(c.id, { status: "Resolved", resolution: `${resType}. ${resText.trim()}`, resolvedAt: now.toISOString(), slaMet: new Date(c.slaDue) > now }, `Resolved: ${resType}. Customer notified by SMS and in-app.`);
    setResType("");
    setResText("");
    toast.success(`${c.id} resolved`, `${c.customerName.split(" ")[0]} has been told by SMS and in-app.`);
  };

  const pickupLink = c.pickupId ? (c.pickupExists ? <Link to={`/admin/pickups/${c.pickupId}`} className="t-mono text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">{c.pickupId}</Link> : <Ref className="text-ink">{c.pickupId}</Ref>) : <span className="text-ink-3">Not linked</span>;

  return (
    <>
      <Drawer
        open
        onClose={onClose}
        width="lg"
        title={c.issue}
        description={`${c.id} · ${c.category} · reported ${formatRelative(c.created, now)}`}
        footer={
          open ? (
            <>
              {c.status !== "Escalated" && (
                <Button variant="ghost" leading={<ShieldAlert className="size-4" />} onClick={() => { setStatus("Escalated"); }}>
                  Escalate
                </Button>
              )}
              <Button variant="outline" leading={<BellRing className="size-4" />} onClick={() => setNotify(true)}>
                Notify customer
              </Button>
            </>
          ) : c.status === "Resolved" ? (
            <>
              <Button variant="ghost" onClick={() => setStatus("Investigating")}>Reopen</Button>
              <Button onClick={() => setStatus("Closed")}>Close complaint</Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setStatus("Investigating")}>Reopen</Button>
          )
        }
      >
        <div className="flex flex-col gap-8">
          {/* Status line */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={c.status} size="md" />
              <Badge tone={SEVERITY_TONE[c.severity]} size="md">{c.severity}</Badge>
              <span className="ml-auto">
                <SlaClock due={c.slaDue} done={!open} met={c.slaMet} paused={c.status === "Waiting"} long />
              </span>
            </div>
            {open && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  label="Assigned to"
                  compact
                  value={c.assignee}
                  options={[...SUPPORT_AGENTS, "Unassigned"]}
                  onChange={(e) => {
                    const a = e.target.value;
                    onUpdate(c.id, { assignee: a, status: c.status === "New" && a !== "Unassigned" ? "Assigned" : c.status }, a === "Unassigned" ? "Unassigned." : `Assigned to ${a}.`);
                    toast.success(a === "Unassigned" ? `${c.id} unassigned` : `Assigned to ${a}`);
                  }}
                />
                <Select label="Status" compact value={c.status} options={STATUSES} onChange={(e) => setStatus(e.target.value as ComplaintStatus)} />
              </div>
            )}
          </div>

          {/* Issue + evidence */}
          <section className="flex flex-col gap-3">
            <h3 className="t-h3 text-ink">What the customer said</h3>
            <blockquote className="border-l-2 border-line-strong pl-4 t-body text-ink">“{c.issue}.”</blockquote>
            {c.evidence > 0 ? (
              <div className="grid grid-cols-3 gap-2 sm:max-w-md">
                {Array.from({ length: c.evidence }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toast.info(`IMG_${4410 + i * 7 + Number(c.id.slice(4)) % 50}.jpg`, "Opened in a new tab")}
                    className="group flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-md bg-sunken text-ink-3 transition-colors hover:bg-stone hover:text-ink-2"
                  >
                    <ImageIcon className="size-5" strokeWidth={1.75} />
                    <span className="t-micro tnum">IMG_{4410 + i * 7 + (Number(c.id.slice(4)) % 50)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="t-small text-ink-3">No photos attached.</p>
            )}
          </section>

          <Facts
            cols={2}
            items={[
              { label: "Customer", value: c.customerId ? <Link to={`/admin/customers/${c.customerId}`} className="underline decoration-line-strong underline-offset-4 hover:decoration-ink">{c.customerName}</Link> : c.customerName },
              { label: "Customer type", value: c.customerType },
              { label: "Operator", value: c.operatorId ? <Link to={`/admin/operators/${c.operatorId}`} className="underline decoration-line-strong underline-offset-4 hover:decoration-ink">{c.operatorName}</Link> : c.operatorName },
              { label: "Service", value: c.service },
              { label: "Pickup", value: pickupLink },
              { label: "Created", value: formatDateTime(c.created) },
              { label: "SLA target", value: `${SLA_HOURS[c.severity]} hours (${c.severity.toLowerCase()})` },
              { label: "Due", value: formatDateTime(c.slaDue) },
            ]}
          />

          {/* Resolution */}
          <section className="flex flex-col gap-3 border-t border-line pt-6">
            <h3 className="t-h3 text-ink">Resolution</h3>
            {c.resolution ? (
              <div className="flex flex-col gap-2">
                <p className="t-body text-ink">{c.resolution}</p>
                <p className="t-small text-ink-3">
                  {c.resolvedAt && <>Resolved {formatDateTime(c.resolvedAt)} · </>}
                  {c.slaMet ? "inside SLA" : `SLA missed${c.resolvedAt ? ` by ${formatSpan(new Date(c.resolvedAt).getTime() - new Date(c.slaDue).getTime())}` : ""}`}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Select label="What fixed it" placeholder="Choose" options={RESOLUTION_TYPES} value={resType} onChange={(e) => setResType(e.target.value)} error={resError && !resType ? resError : undefined} />
                <Textarea
                  label="Resolution note"
                  hint="Sent to the customer with the resolution."
                  rows={3}
                  value={resText}
                  onChange={(e) => setResText(e.target.value)}
                  placeholder="Recovery crew collected at 11:20. Penalty applied to the operator."
                  error={resError && resType ? resError : undefined}
                />
                <div>
                  <Button onClick={resolve}>Resolve and notify customer</Button>
                </div>
              </div>
            )}
          </section>

          {/* Workflow 6 */}
          <section className="flex flex-col gap-4 border-t border-line pt-6">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="t-h3 text-ink">Complaint workflow</h3>
              <span className="t-micro text-ink-3">Workflow 6</span>
            </div>
            <Timeline items={workflow(c, now)} />
          </section>

          {/* Internal notes */}
          <section className="flex flex-col gap-3 border-t border-line pt-6">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="t-h3 text-ink">Internal notes</h3>
              <span className="t-micro text-ink-3">Slate staff only</span>
            </div>
            {c.notes.length > 0 ? (
              <ul className="flex flex-col divide-y divide-line">
                {[...c.notes].reverse().map((n, i) => (
                  <li key={i} className="flex gap-3 py-3">
                    <Avatar name={n.by} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="t-small">
                        <span className="font-medium text-ink">{n.by}</span> <span className="text-ink-3">· {formatRelative(n.at, now)}</span>
                      </p>
                      <p className="t-small text-ink-2">{n.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="t-small text-ink-3">No notes yet.</p>
            )}
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for the team" aria-label="New internal note" />
            <div>
              <Button
                variant="secondary"
                size="sm"
                disabled={!note.trim()}
                onClick={() => {
                  onUpdate(c.id, {}, note.trim());
                  setNote("");
                  toast.success("Note added");
                }}
              >
                Add note
              </Button>
            </div>
          </section>
        </div>
      </Drawer>

      <NotifyModal
        open={notify}
        complaint={c}
        onClose={() => setNotify(false)}
        onSend={(channels) => {
          onUpdate(c.id, {}, `Customer notified by ${channels.join(", ")}.`);
          setNotify(false);
          toast.success(`${c.customerName.split(" ")[0]} notified`, `Sent by ${channels.join(" and ")}.`);
        }}
      />
    </>
  );
}

function workflow(c: AdminComplaint, now: Date): TimelineItem[] {
  const created = new Date(c.created).getTime();
  const end = c.resolvedAt ? new Date(c.resolvedAt).getTime() : now.getTime();
  const at = (f: number) => formatDateTime(new Date(created + (end - created) * f));
  const done = { New: 3, Assigned: 4, Investigating: 5, Escalated: 5, Waiting: 6, Resolved: 9, Closed: 10 }[c.status];
  const breached = isOpen(c) && c.status !== "Waiting" && new Date(c.slaDue) < now;
  const first = c.customerName.split(" ")[0];
  const steps: Array<{ title: string; description: string; f: number }> = [
    { title: "Customer reported the issue", description: `${c.customerName} · in-app${c.evidence ? ` · ${c.evidence} photo${c.evidence > 1 ? "s" : ""}` : ""}`, f: 0 },
    { title: "Complaint created", description: c.id, f: 0 },
    {
      title: "SLA timer started",
      description: breached ? `Breached — was due ${formatDateTime(c.slaDue)}` : `${SLA_HOURS[c.severity]}-hour target · due ${formatDateTime(c.slaDue)}`,
      f: 0,
    },
    { title: "Operator notified", description: `${c.operatorName} dispatch, by app and SMS`, f: 0.04 },
    { title: "Operations reviews", description: c.assignee === "Unassigned" ? "Waiting for an owner" : `${c.assignee} reviewing`, f: 0.15 },
    {
      title: "Operator responds",
      description: c.status === "Escalated" ? "Escalated — operator response overdue, operations lead informed" : `${c.operatorName} sends their account and photos`,
      f: 0.45,
    },
    { title: "Slate reviews the response", description: c.status === "Waiting" ? `Waiting on ${first} to confirm` : "Checked against driver log and photos", f: 0.7 },
    { title: "Resolution applied", description: c.resolution ?? "Recovery, credit, replacement or warning", f: 0.85 },
    { title: "Customer notified", description: `${first} told by SMS and in-app`, f: 0.92 },
    { title: "Complaint closed", description: c.status === "Closed" ? "Closed after 48 hours with no reply" : "Closes 48 hours after the customer is told", f: 1 },
  ];
  return steps.map((s, i) => ({
    title: s.title,
    description: s.description,
    time: i < done ? at(s.f) : i === done ? "Now" : undefined,
    state: i === 2 && breached ? "failed" : i < done ? "done" : i === done ? "current" : "upcoming",
  }));
}

/* ------------------------------------------------------------------ */
/* Notify customer                                                     */
/* ------------------------------------------------------------------ */

function NotifyModal({ open, complaint: c, onClose, onSend }: { open: boolean; complaint: AdminComplaint; onClose: () => void; onSend: (channels: string[]) => void }) {
  const now = useNow();
  const first = c.customerName.split(" ")[0];
  const [channels, setChannels] = useState<string[]>(["SMS", "In-app"]);
  const by = new Date(Math.max(new Date(c.slaDue).getTime(), now.getTime() + 2 * HOUR));
  const [msg, setMsg] = useState(
    `Hi ${first}, we're working on your report ${c.id}. ${c.operatorName} has been asked to respond and we'll update you by ${formatDateTime(by).split(", ")[1]} ${by.toDateString() === now.toDateString() ? "today" : "tomorrow"}. Slate`,
  );
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Update ${first}`}
      description={`About ${c.id}. Sent from Slate, not the operator.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button leading={<Send className="size-4" />} disabled={!channels.length || !msg.trim()} onClick={() => onSend(channels)}>
            Send update
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        <div className="flex flex-col gap-2">
          <span className="t-small font-medium text-ink">Channels</span>
          <ChipGroup options={["SMS", "Email", "In-app"]} value={channels} onChange={setChannels} />
        </div>
        <Textarea
          label="Message"
          rows={4}
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          hint={channels.includes("SMS") ? `${msg.length}/160 characters${msg.length > 160 ? ` · sends as ${Math.ceil(msg.length / 153)} SMS` : ""}` : undefined}
        />
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* New complaint                                                       */
/* ------------------------------------------------------------------ */

function NewComplaintModal({ open, onClose, onCreate, nextId }: { open: boolean; onClose: () => void; onCreate: (c: AdminComplaint) => void; nextId: string }) {
  const now = useNow();
  const [customer, setCustomer] = useState("");
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState<Complaint["severity"] | "">("");
  const [pickupId, setPickupId] = useState("");
  const [issue, setIssue] = useState("");
  const [assignee, setAssignee] = useState("Unassigned");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cust = customers.find((c) => c.id === customer);
  const custPickups = cust ? pickups.filter((p) => p.customerId === cust.id).slice(0, 8) : [];

  const reset = () => {
    setCustomer(""); setCategory(""); setSeverity(""); setPickupId(""); setIssue(""); setAssignee("Unassigned"); setFiles([]); setErrors({});
  };

  const submit = () => {
    const e: Record<string, string> = {};
    if (!cust) e.customer = "Choose the customer who reported it.";
    if (!category) e.category = "Choose a category.";
    if (!severity) e.severity = "Choose a severity — it sets the SLA.";
    if (issue.trim().length < 10) e.issue = "Describe the issue in the customer's words (at least 10 characters).";
    setErrors(e);
    if (Object.keys(e).length || !cust || !severity) return;
    const op = customers.find((x) => x.id === cust.id)!.operatorId;
    const opName = { "op-ufok": "Ufok Environmental", "op-atlantic": "Atlantic Coast", "op-ibom": "Ibom Hauliers", "op-nwaniba": "Nwaniba Clean Crew" }[op] ?? "Ufok Environmental";
    const created = now.toISOString();
    onCreate({
      id: nextId,
      customerName: cust.name,
      customerType: cust.type,
      operatorName: opName,
      service: cust.plan,
      pickupId: pickupId || undefined,
      issue: issue.trim().replace(/\.$/, ""),
      category: category as Complaint["category"],
      severity,
      status: assignee === "Unassigned" ? "New" : "Assigned",
      created,
      slaDue: new Date(now.getTime() + SLA_HOURS[severity] * HOUR).toISOString(),
      assignee,
      evidence: files.length,
      customerId: customerIdByName(cust.name) ?? cust.id,
      operatorId: operatorIdByName(opName),
      pickupExists: !!pickupId,
      notes: notifyCustomer ? [{ by: "Idara Umoh", at: created, text: "Logged by phone. Customer sent the acknowledgement SMS." }] : [],
    });
    reset();
  };

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      size="lg"
      title="New complaint"
      description="Log a complaint received by phone, WhatsApp or email. The SLA starts when you save."
      footer={
        <>
          <Button variant="ghost" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button onClick={submit}>Create complaint</Button>
        </>
      }
    >
      <div className="grid gap-4 pb-2 sm:grid-cols-2">
        <Select
          label="Customer"
          placeholder="Choose customer"
          fieldClassName="sm:col-span-2"
          value={customer}
          onChange={(e) => { setCustomer(e.target.value); setPickupId(""); }}
          options={customers.map((c) => ({ value: c.id, label: `${c.name} — ${c.type}, ${c.area}` }))}
          error={errors.customer}
        />
        <Select
          label="Category"
          placeholder="Choose"
          value={category}
          options={CATEGORIES}
          onChange={(e) => {
            setCategory(e.target.value);
            if (!severity) setSeverity(e.target.value === "Missed pickup" ? "High" : e.target.value === "Conduct" ? "High" : "Medium");
          }}
          error={errors.category}
        />
        <Select
          label="Severity"
          placeholder="Choose"
          value={severity}
          options={SEVERITIES.map((s) => ({ value: s, label: `${s} — ${SLA_HOURS[s]}h SLA` }))}
          onChange={(e) => setSeverity(e.target.value as Complaint["severity"])}
          error={errors.severity}
        />
        <Select
          label="Related pickup"
          optional
          placeholder={cust ? (custPickups.length ? "Choose pickup" : "No pickups on record") : "Choose a customer first"}
          disabled={!custPickups.length}
          value={pickupId}
          options={custPickups.map((p) => ({ value: p.id, label: `${p.id} · ${new Date(p.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · ${p.status}` }))}
          onChange={(e) => setPickupId(e.target.value)}
        />
        <Select label="Assign to" value={assignee} options={["Unassigned", ...SUPPORT_AGENTS]} onChange={(e) => setAssignee(e.target.value)} />
        <Textarea
          label="Issue"
          fieldClassName="sm:col-span-2"
          rows={3}
          value={issue}
          onChange={(e) => setIssue(e.target.value)}
          placeholder="Bin was not collected on Thursday morning"
          error={errors.issue}
        />
        <div className="sm:col-span-2">
          <FileDrop label="Evidence" images files={files} onFiles={setFiles} hint="Photos from the customer, JPG or PNG" />
        </div>
        <Checkbox
          className="sm:col-span-2"
          checked={notifyCustomer}
          onChange={setNotifyCustomer}
          label="Send the customer an acknowledgement SMS"
          description={`“We've logged your report ${nextId}. We'll update you within the SLA.”`}
        />
      </div>
    </Modal>
  );
}
