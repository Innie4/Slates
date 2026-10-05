import { useMemo, useState } from "react";
import { Clock, ImageIcon, MessageSquareReply } from "lucide-react";
import {
  Badge, Button, DataTable, Drawer, EmptyState, FileDrop, Input, LiveDot, Modal, Page, PageHeader, Section, Select, Switch, Tabs, Textarea,
  Timeline, useToast, type Column, type Tone, type TimelineItem, type UploadedFile,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { DEMO_NOW, formatDateTime, formatDay, formatTime } from "@/lib/format";
import { Facts, formatCountdown, useDemoNow } from "./_biz";
import { OP_COMPLAINTS, type OpComplaint, type OpComplaintStatus } from "./_bizData";

type TabKey = "open" | "responded" | "resolved" | "all";
const SEVERITY_TONE: Record<OpComplaint["severity"], Tone> = { Low: "neutral", Medium: "warning", High: "danger", Critical: "danger" };
const STATUS_TONE: Record<OpComplaintStatus, Tone> = { Open: "info", Responded: "warning", Resolved: "success", Escalated: "danger" };
const STATUS_LABEL: Record<OpComplaintStatus, string> = { Open: "Needs response", Responded: "Response sent", Resolved: "Resolved", Escalated: "Escalated" };
const CREWS = ["Emmanuel Udo · AKS 214 XA", "Godwin Etuk · AKS 588 KJ", "Samuel Akpan · UYO 903 BG", "Daniel Inyang · AKS 902 QE", "Standby crew · AKS 330 FG"];

const hm = (ms: number) => {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.round((ms % 3_600_000) / 60_000);
  return h ? `${h}h ${m}m` : `${m}m`;
};

/** G16 — complaints Slate has passed to Ufok, with live SLA deadlines. */
export default function Complaints() {
  const toast = useToast();
  const now = useDemoNow(1000);
  const [items, setItems] = useState<OpComplaint[]>(OP_COMPLAINTS);
  const [tab, setTab] = useState<TabKey>("open");
  const [openId, setOpenId] = useState<string | null>(null);
  const [respondId, setRespondId] = useState<string | null>(null);

  const isOpen = (c: OpComplaint) => c.status === "Open" || c.status === "Escalated";
  const groups: Record<TabKey, OpComplaint[]> = useMemo(
    () => ({
      open: items.filter(isOpen).sort((a, b) => a.slaDue.localeCompare(b.slaDue)),
      responded: items.filter((c) => c.status === "Responded"),
      resolved: items.filter((c) => c.status === "Resolved"),
      all: items,
    }),
    [items],
  );
  const rows = groups[tab];
  const urgent = groups.open[0];
  const open = items.find((c) => c.id === openId) ?? null;
  const responding = items.find((c) => c.id === respondId) ?? null;
  const last30 = items.filter((c) => new Date(c.created).getTime() > DEMO_NOW.getTime() - 30 * 86_400_000);
  const responded = items.filter((c) => c.response);
  const avgResponse = responded.reduce((a, c) => a + (new Date(c.response!.at).getTime() - new Date(c.passed).getTime()), 0) / Math.max(1, responded.length);

  const SlaCell = ({ c }: { c: OpComplaint }) => {
    if (c.response) {
      const took = new Date(c.response.at).getTime() - new Date(c.passed).getTime();
      const inTime = new Date(c.response.at) <= new Date(c.slaDue);
      return (
        <span className={cn("t-small tnum", inTime ? "text-ink-3" : "text-danger")}>
          Responded in {hm(took)}
          {!inTime && " · late"}
        </span>
      );
    }
    const left = new Date(c.slaDue).getTime() - now;
    return (
      <span className={cn("inline-flex items-center gap-1.5 t-small font-medium tnum", left < 0 ? "text-danger" : left < 3 * 3_600_000 ? "text-[color:var(--signal-hover)] dark:text-signal" : "text-ink")}>
        <Clock className="size-3.5" />
        {formatCountdown(left)}
      </span>
    );
  };

  const columns: Column<OpComplaint>[] = [
    {
      key: "complaint",
      header: "Complaint",
      cell: (c) => (
        <div className="flex max-w-sm flex-col">
          <span className="font-medium text-ink">{c.category}</span>
          <span className="truncate text-ink-2">{c.issue}</span>
          <span className="t-mono text-[12px] text-ink-3">{c.id}</span>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      cell: (c) => (
        <div className="flex flex-col">
          <span className="text-ink">{c.customer}</span>
          <span className="text-ink-3">{c.address}</span>
        </div>
      ),
    },
    { key: "pickup", header: "Pickup", cell: (c) => (c.pickupId ? <span className="t-mono text-ink-2">{c.pickupId}</span> : <span className="text-ink-3">—</span>) },
    { key: "severity", header: "Severity", cell: (c) => <Badge tone={SEVERITY_TONE[c.severity]}>{c.severity}</Badge>, sortValue: (c) => ["Low", "Medium", "High", "Critical"].indexOf(c.severity) },
    { key: "sla", header: "SLA", cell: (c) => <SlaCell c={c} />, sortValue: (c) => c.slaDue },
    { key: "status", header: "Status", cell: (c) => <Badge tone={STATUS_TONE[c.status]} dot>{STATUS_LABEL[c.status]}</Badge> },
  ];

  return (
    <Page>
      <PageHeader
        title="Complaints"
        description="Customers report to Slate. Slate passes operational complaints to you with a deadline: respond, recover the pickup, and attach proof."
      />

      {urgent && (
        <section aria-label="Due next" className="flex flex-col gap-4 rounded-lg border border-ink bg-surface p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-7 items-center gap-2 rounded-sm bg-signal px-2.5 text-[12px] font-semibold text-signal-ink">
                <LiveDot className="[&>span]:bg-signal-ink" />
                Due next
              </span>
              <Badge tone={SEVERITY_TONE[urgent.severity]}>{urgent.severity}</Badge>
              <span className="t-mono text-ink-3">{urgent.id}</span>
            </div>
            <p className="t-h2 text-ink">
              {urgent.category} at {urgent.address}
            </p>
            <p className="t-small text-ink-2">{urgent.issue}</p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:items-end">
            <div className="sm:text-right">
              <p className="font-display text-[28px] font-bold leading-none tracking-[-0.02em] text-ink tnum">{formatCountdown(new Date(urgent.slaDue).getTime() - now).replace(" left", "")}</p>
              <p className="t-small text-ink-3">left · due {formatTime(urgent.slaDue)} {formatDay(urgent.slaDue) === formatDay(DEMO_NOW) ? "today" : formatDay(urgent.slaDue)}</p>
            </div>
            <Button leading={<MessageSquareReply className="size-4" />} onClick={() => setRespondId(urgent.id)}>
              Respond
            </Button>
          </div>
        </section>
      )}

      <p className="t-body max-w-3xl text-ink-2">
        <span className="font-semibold text-ink tnum">{last30.length} complaints</span> in the last 30 days, 0.37% of your customers. Average first response{" "}
        <span className="font-semibold text-ink tnum">{hm(avgResponse)}</span>. Every resolved complaint closed inside the 48-hour contract limit.
      </p>

      <Section title="All complaints">
        <Tabs<TabKey>
          value={tab}
          onChange={setTab}
          items={[
            { value: "open", label: "Needs response", count: groups.open.length },
            { value: "responded", label: "Response sent", count: groups.responded.length },
            { value: "resolved", label: "Resolved", count: groups.resolved.length },
            { value: "all", label: "All", count: items.length },
          ]}
        />
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(c) => c.id}
          onRowClick={(c) => setOpenId(c.id)}
          empty={<EmptyState compact title="Nothing waiting on you" description="New complaints from Slate land here with their deadline." />}
          mobile={(c) => (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="t-body font-medium text-ink">{c.category}</p>
                  <p className="t-small truncate text-ink-2">{c.address}</p>
                </div>
                <Badge tone={STATUS_TONE[c.status]} dot>
                  {STATUS_LABEL[c.status]}
                </Badge>
              </div>
              <p className="t-small text-ink-2 line-clamp-2">{c.issue}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Badge tone={SEVERITY_TONE[c.severity]}>{c.severity}</Badge>
                <SlaCell c={c} />
                <span className="t-mono text-[12px] text-ink-3">{c.id}</span>
              </div>
            </div>
          )}
        />
      </Section>

      <ComplaintDrawer c={open} onClose={() => setOpenId(null)} onRespond={(id) => setRespondId(id)} />

      <RespondModal
        c={responding}
        onClose={() => setRespondId(null)}
        onSend={(id, r) => {
          const at = new Date(now).toISOString();
          setItems((xs) =>
            xs.map((x) =>
              x.id === id
                ? { ...x, status: "Responded", evidence: x.evidence + r.photos, response: { at, by: "Edidiong Johnson", text: r.text, recovered: r.recoveredAt } }
                : x,
            ),
          );
          setTab("responded");
          toast.success(`Response sent for ${id}`, r.recoveredAt ? "Marked recovered. Slate confirms with the customer, then closes it." : "Slate confirms with the customer, then closes it.");
        }}
      />
    </Page>
  );
}

function ComplaintDrawer({ c, onClose, onRespond }: { c: OpComplaint | null; onClose: () => void; onRespond: (id: string) => void }) {
  if (!c) return <Drawer open={false} onClose={onClose} />;
  const items: TimelineItem[] = [
    { title: "Reported to Slate", time: formatDateTime(c.created), description: `${c.customer}, in the Slate app`, state: "done" },
    { title: "Passed to Ufok", time: formatDateTime(c.passed), description: `Respond by ${formatDateTime(c.slaDue)}`, state: "done" },
    c.response
      ? { title: "Your response", time: formatDateTime(c.response.at), description: `${c.response.text}${c.response.recovered ? ` Recovered ${formatDateTime(c.response.recovered)}.` : ""}`, state: "done" }
      : { title: "Your response", description: "Waiting on Ufok", state: "current" },
    c.resolution
      ? { title: "Resolved by Slate", time: formatDateTime(c.resolution.at), description: c.resolution.text, state: "done" }
      : { title: "Slate confirms with the customer", state: c.response ? "current" : "upcoming" },
  ];
  return (
    <Drawer
      open
      onClose={onClose}
      title={c.category}
      description={`${c.id} · ${c.address}`}
      footer={
        c.status === "Open" || c.status === "Escalated" ? (
          <Button leading={<MessageSquareReply className="size-4" />} onClick={() => onRespond(c.id)}>
            Respond
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-7">
        <div className="flex flex-wrap gap-2">
          <Badge tone={STATUS_TONE[c.status]} dot>
            {STATUS_LABEL[c.status]}
          </Badge>
          <Badge tone={SEVERITY_TONE[c.severity]}>{c.severity} severity</Badge>
        </div>
        <blockquote className="border-l-2 border-line-strong pl-4 t-body text-ink">“{c.issue}”</blockquote>
        {c.evidence > 0 && (
          <div className="flex flex-col gap-2">
            <p className="t-micro text-ink-3">Customer photos</p>
            <div className="flex gap-2">
              {Array.from({ length: c.evidence }).map((_, i) => (
                <span key={i} className="flex size-20 flex-col items-center justify-center gap-1 rounded-md bg-sunken text-ink-3">
                  <ImageIcon className="size-5" />
                  <span className="t-micro">Photo {i + 1}</span>
                </span>
              ))}
            </div>
          </div>
        )}
        <Facts
          items={[
            { label: "Customer", value: c.customer },
            { label: "Address", value: c.address },
            { label: "Pickup", value: c.pickupId ? <span className="t-mono">{c.pickupId}</span> : "Not linked" },
            { label: "Deadline", value: <span className="tnum">{formatDateTime(c.slaDue)}</span> },
          ]}
        />
        <section className="flex flex-col gap-4">
          <h3 className="t-h3 text-ink">History</h3>
          <Timeline items={items} />
        </section>
      </div>
    </Drawer>
  );
}

function RespondModal({ c, onClose, onSend }: { c: OpComplaint | null; onClose: () => void; onSend: (id: string, r: { text: string; photos: number; recoveredAt?: string }) => void }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [recovered, setRecovered] = useState(false);
  const [time, setTime] = useState("09:40");
  const [crew, setCrew] = useState("");
  const [err, setErr] = useState<{ text?: string; crew?: string }>({});
  const [busy, setBusy] = useState(false);
  const recoverable = c?.category === "Missed pickup" || c?.category === "Late pickup" || c?.category === "Spillage";

  const close = () => {
    setText("");
    setFiles([]);
    setRecovered(false);
    setTime("09:40");
    setCrew("");
    setErr({});
    onClose();
  };

  return (
    <Modal
      open={!!c}
      onClose={close}
      title={c ? `Respond to ${c.id}` : ""}
      description={c ? `${c.category} · ${c.address}` : ""}
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button
            loading={busy}
            onClick={() => {
              if (!c) return;
              const e = {
                text: text.trim().length >= 20 ? undefined : "Say what happened and what you did (20 characters or more).",
                crew: recovered && !crew ? "Choose the crew that recovered it." : undefined,
              };
              setErr(e);
              if (e.text || e.crew) return;
              setBusy(true);
              setTimeout(() => {
                setBusy(false);
                onSend(c.id, {
                  text: text.trim().replace(/([^.?!])$/, "$1.") + (recovered ? ` ${crew.split(" · ")[0]}'s crew.` : ""),
                  photos: files.length,
                  recoveredAt: recovered ? new Date(`2026-10-05T${time}:00+01:00`).toISOString() : undefined,
                });
                close();
              }, 600);
            }}
          >
            Send response
          </Button>
        </>
      }
    >
      {c && (
        <div className="flex flex-col gap-5 pb-2">
          <p className="rounded-md bg-sunken/70 px-3.5 py-3 t-small text-ink-2">“{c.issue}”</p>
          <Textarea
            label="Response to Slate"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            error={err.text}
            hint="Slate shares a summary with the customer. Keep it factual."
            placeholder={c.category === "Missed pickup" ? "e.g. Daniel's truck skipped the close after a road block on Osongama Road. Standby crew collected at 09:40." : "What happened, and what you did about it"}
          />
          <FileDrop label="Evidence" images files={files} onFiles={setFiles} hint="Photos of the cleared bin point or gate, up to 10 MB each" />
          {recoverable && (
            <div className="flex flex-col gap-4 border-t border-line pt-4">
              <Switch
                checked={recovered}
                onChange={setRecovered}
                label={c.category === "Spillage" ? "Mark cleaned up" : "Mark pickup recovered"}
                description="Stops the deduction clock if it's within 24 hours of the missed pickup."
              />
              {recovered && (
                <div className="grid gap-4 sm:grid-cols-[1fr_1.6fr]">
                  <Input label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                  <Select label="Crew" value={crew} onChange={(e) => setCrew(e.target.value)} placeholder="Choose crew" options={CREWS} error={err.crew} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
