import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { FileText, Lock, Mail, MessageCircle, Phone, Plus, Send, Smartphone } from "lucide-react";
import {
  Avatar, Badge, Button, Drawer, Input, Menu, Modal, Page, PageHeader, Ref, SearchInput, Segmented, Select, StateView, StatusBadge, Tabs, Textarea,
  useToast, type Tone,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { activeOperators, customers, tickets as baseTickets, type Ticket } from "@/data";
import { formatDateTime, formatRelative, formatTime } from "@/lib/format";
import { SUPPORT_AGENTS, SlaClock, customerIdByName, hoursAgo, operatorIdByName, slaState, useMedia, useNow, useParam } from "./_gov";

const HOUR = 3_600_000;
type Status = Ticket["status"];
type Msg = { kind: "in" | "out" | "note"; by: string; at: string; text: string };
interface SupportTicket extends Ticket {
  slaDue: string;
  messages: Msg[];
}

const SLA_BY_PRIORITY: Record<Ticket["priority"], number> = { Urgent: 2, High: 4, Normal: 8, Low: 24 };
const ACTIVE: Status[] = ["Open", "Pending", "Waiting", "Escalated"];
const PAUSED: Status[] = ["Pending", "Waiting"];
const PRIORITY_TONE: Record<Ticket["priority"], Tone> = { Urgent: "danger", High: "warning", Normal: "neutral", Low: "outline" };
const CHANNEL_ICON = { "In-app": Smartphone, Email: Mail, Phone: Phone, WhatsApp: MessageCircle } as const;

/** Hours since opened, for tickets still being worked — keeps SLA clocks believable. */
const AGE: Record<string, number> = {
  "TCK-4408": 26, "TCK-4401": 11, "TCK-4413": 9.2, "TCK-4406": 31, "TCK-4420": 7.4, "TCK-4409": 3, "TCK-4416": 3.5, "TCK-4417": 5,
  "TCK-4402": 6.5, "TCK-4418": 1, "TCK-4422": 2, "TCK-4423": 40, "TCK-4405": 4.4, "TCK-4419": 4, "TCK-4404": 0.8, "TCK-4415": 52, "TCK-4414": 70,
};

type Thread = { first: string; reply: string; follow?: string; close?: string };
const THREADS: Record<string, Thread> = {
  "How do I change my pickup day?": {
    first: "Our estate gate stays locked on Mondays until 9. Can we move collection to Tuesday?",
    reply: "Yes. Tuesday collections in your area run 07:00–09:00. I can move you from next week — shall I go ahead?",
    follow: "I asked two days ago and still nobody has changed it. The bin was full again this morning.",
    close: "Done. From next Tuesday your collection is 07:00–09:00. You'll get the usual reminder the evening before.",
  },
  "Card declined but I was debited": {
    first: "My renewal said card declined, but my bank shows ₦7,000 debited on 4 Oct.",
    reply: "Sorry about that. Paystack shows the attempt as failed, so the debit should reverse within 24 hours. I'll check again tomorrow morning.",
    follow: "It still hasn't reversed and now the app says my payment is overdue.",
    close: "The bank reversed the ₦7,000 this morning and your retry went through. Receipt TXN-6HZ8RV is in your email.",
  },
  "Request receipt for September": {
    first: "Please send the receipt for September. Our accounts team needs it for the month-end.",
    reply: "Sent to your email just now. It's also under Payments → Receipts in the app.",
    close: "Sent. Reference TXN-4C9TBB, ₦7,000, paid 2 Sep.",
  },
  "Can I pause service while travelling?": {
    first: "I'll be away from 12 to 30 October. Can I pause and not pay for those weeks?",
    reply: "You can pause for up to 30 days and your next charge moves by the same number of days. Should I set 12–30 Oct?",
    follow: "I replied yes on WhatsApp but the app still shows collections on those dates.",
    close: "Paused 12–30 Oct. Collections restart Thursday 1 Nov and your renewal moves to 20 Nov.",
  },
  "Estate gate closed during pickup window": {
    first: "The truck came at 7:10 but our gate was still locked. Can they come back today?",
    reply: "The crew will return at 11:00. I've asked the estate office to open the side gate from 6:45 on collection days.",
    follow: "11:00 has passed and nobody came.",
    close: "Collected at 11:20. The estate office confirmed the side gate opens at 6:45 from now on.",
  },
  "Want to add a second bin": {
    first: "We need a second 240-litre bin. One isn't enough since we moved the shop downstairs.",
    reply: "A second bin is ₦2,000 a month and arrives with your next collection. Shall I add it?",
    follow: "Yes please, but we need it before Friday — we have an event.",
    close: "Added. The bin arrives Thursday with your collection and the ₦2,000 is pro-rated this month.",
  },
  "Payout for September not received": {
    first: "Our September payout hasn't landed. Last month it came on the 7th.",
    reply: "September payouts are approved and go out on 7 Oct. You'll get the remittance advice by email.",
    follow: "Our fuel supplier is waiting. Can any part of it come earlier?",
    close: "Paid today: ₦9,391,000 net to your GTBank account. Remittance advice PO-02600 is in your inbox.",
  },
  "Need to update a driver's licence": {
    first: "Moses Ekpo renewed his licence. Where do I upload it?",
    reply: "Upload it under Drivers → Moses Ekpo → Documents. Compliance reviews within one working day.",
    follow: "Uploaded yesterday. He still shows as suspended so he can't take jobs.",
    close: "Verified. Moses is active again and can take jobs from today.",
  },
  "Route for Thursday has 14 stops too many": {
    first: "Thursday's route for AKS 588 KJ has 52 stops. We can do 38 before the window closes.",
    reply: "Thanks. I'm checking capacity with the other operators in that area and will confirm by 4pm.",
    follow: "The route still shows 52 stops this morning. Thursday is close — we need an answer today.",
    close: "Moved 14 Shelter Afrique Block D stops to Nwaniba Clean Crew for Thursday. Your route is now 38 stops.",
  },
  "Customer address cannot be found": {
    first: "22 Udo Umana Street doesn't match any gate. Driver called the customer twice, no answer.",
    reply: "I've reached the customer — it's the yellow gate behind the pharmacy. Pin updated in the app.",
    close: "Address corrected and the pickup is completed.",
  },
};

function buildTicket(t: Ticket): SupportTicket {
  const active = ACTIVE.includes(t.status);
  const age = AGE[t.id];
  const createdMs = active && age !== undefined ? new Date(hoursAgo(age)).getTime() : Math.min(new Date(t.created).getTime(), new Date(hoursAgo(30)).getTime());
  const created = new Date(createdMs).toISOString();
  const th = THREADS[t.subject] ?? THREADS["Request receipt for September"]!;
  const agent = t.assignee === "Unassigned" ? "Utibe Ekanem" : t.assignee;
  const at = (h: number) => new Date(createdMs + h * HOUR).toISOString();
  const msgs: Msg[] = [{ kind: "in", by: t.from, at: created, text: th.first }];
  const span = active ? (age ?? 4) : 20;
  if (t.status !== "Open") msgs.push({ kind: "out", by: agent, at: at(span * 0.2), text: th.reply });
  if (t.status === "Escalated") {
    if (th.follow) msgs.push({ kind: "in", by: t.from, at: at(span * 0.6), text: th.follow });
    msgs.push({ kind: "note", by: agent, at: at(span * 0.7), text: "Escalated to Idara — needs operations to act, not just a reply." });
  }
  if (t.status === "Resolved" || t.status === "Closed") {
    msgs.push({ kind: "note", by: agent, at: at(span * 0.4), text: "Checked and confirmed before replying." });
    if (th.close) msgs.push({ kind: "out", by: agent, at: at(span * 0.6), text: th.close });
  }
  return { ...t, created, assignee: t.status === "Open" && t.id === "TCK-4404" ? "Unassigned" : t.assignee, slaDue: new Date(createdMs + SLA_BY_PRIORITY[t.priority] * HOUR).toISOString(), messages: msgs };
}

const TEMPLATES: Array<{ name: string; body: string }> = [
  { name: "Acknowledge", body: "Hi {first}, thanks for letting us know. I'm looking into this now and will update you within {hours} hours." },
  { name: "Recovery crew booked", body: "Hi {first}, a recovery crew is booked for today between 11:00 and 13:00. You'll get an SMS when they're on the way." },
  { name: "Refund in progress", body: "Hi {first}, your refund is approved. Card refunds take 3–5 working days to show, depending on your bank." },
  { name: "Receipt sent", body: "Hi {first}, your receipt is in your email and under Payments → Receipts in the app." },
  { name: "Pause confirmed", body: "Hi {first}, your service is paused for the dates you asked. Your next charge moves by the same number of days." },
  { name: "Closing — no reply", body: "Hi {first}, we haven't heard back so we'll close this for now. Reply here any time and it reopens." },
];

type ListTab = "open" | "waiting" | "escalated" | "resolved";

export default function Support() {
  const toast = useToast();
  const now = useNow();
  const desktop = useMedia("(min-width: 1024px)");
  const [rows, setRows] = useState<SupportTicket[]>(() => baseTickets.map(buildTicket).sort((a, b) => b.created.localeCompare(a.created)));
  const [id, setId] = useParam("id");
  const [isNew, setNew] = useParam("new");
  const [tab, setTab] = useState<ListTab>("open");
  const [kind, setKind] = useState<"all" | "Customer" | "Operator">("all");
  const [q, setQ] = useState("");

  const inTab = (t: SupportTicket, k: ListTab) =>
    k === "open" ? t.status === "Open" : k === "waiting" ? PAUSED.includes(t.status) : k === "escalated" ? t.status === "Escalated" : t.status === "Resolved" || t.status === "Closed";
  const scoped = rows.filter((t) => kind === "all" || t.kind === kind);
  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return scoped
      .filter((t) => inTab(t, tab))
      .filter((t) => !qq || `${t.id} ${t.from} ${t.subject}`.toLowerCase().includes(qq))
      .sort((a, b) => (tab === "resolved" ? b.created.localeCompare(a.created) : a.slaDue.localeCompare(b.slaDue)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoped, tab, q]);

  const current = id ? rows.find((t) => t.id === id) : desktop ? list[0] : undefined;
  const active = rows.filter((t) => ACTIVE.includes(t.status));
  const breached = active.filter((t) => slaState(t.slaDue, now, { paused: PAUSED.includes(t.status) }).state === "breached");
  const unassigned = active.filter((t) => t.assignee === "Unassigned");

  const update = (tid: string, patch: Partial<SupportTicket>, msg?: Msg) =>
    setRows((rs) => rs.map((t) => (t.id === tid ? { ...t, ...patch, messages: msg ? [...t.messages, msg] : t.messages } : t)));

  // If the open ticket leaves the current tab (e.g. resolved), keep it selected.
  const openTicket = (t: SupportTicket) => setId(t.id);

  return (
    <Page className="gap-6 md:gap-8">
      <PageHeader
        title="Support"
        description="Customer and operator tickets from the app, WhatsApp, email and phone."
        actions={
          <Button leading={<Plus className="size-4" />} onClick={() => setNew("1")}>
            New ticket
          </Button>
        }
      />

      <p className="t-body -mt-2 text-ink-2">
        <span className="font-display text-[28px] font-bold leading-none tracking-[-0.02em] text-ink tnum">{active.length}</span>{" "}
        <span className="font-medium text-ink">tickets in progress</span>
        <span className="mx-2 text-line-strong">·</span>
        <span className={cn(breached.length && "font-medium text-danger")}>{breached.length} past SLA</span>
        <span className="mx-2 text-line-strong">·</span>
        {unassigned.length} unassigned
        <span className="mx-2 text-line-strong">·</span>
        median first reply 38 min
      </p>

      <div className="lg:grid lg:h-[min(760px,calc(100dvh-220px))] lg:min-h-[560px] lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)] lg:overflow-hidden lg:rounded-lg lg:border lg:border-line lg:bg-surface">
        {/* LIST */}
        <div className="flex min-h-0 flex-col lg:border-r lg:border-line">
          <div className="flex flex-col gap-3 lg:px-4 lg:pt-4">
            <div className="w-full">
              <SearchInput compact value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tickets" aria-label="Search tickets" />
            </div>
            <Segmented
              size="sm"
              value={kind}
              onChange={setKind}
              className="w-full"
              options={[
                { value: "all", label: "All" },
                { value: "Customer", label: "Customers" },
                { value: "Operator", label: "Operators" },
              ]}
            />
            <Tabs
              value={tab}
              onChange={setTab}
              className="lg:-mx-4 lg:px-4"
              items={[
                { value: "open", label: "Open", count: scoped.filter((t) => inTab(t, "open")).length },
                { value: "waiting", label: "Waiting", count: scoped.filter((t) => inTab(t, "waiting")).length },
                { value: "escalated", label: "Escalated", count: scoped.filter((t) => inTab(t, "escalated")).length },
                { value: "resolved", label: "Resolved" },
              ]}
            />
          </div>
          <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto max-lg:border-b max-lg:border-line">
            {list.length === 0 && (
              <li>
                <StateView state="empty" compact title="Nothing in this queue" description={q ? "No tickets match that search." : "Every ticket here has been answered."} />
              </li>
            )}
            {list.map((t) => {
              const selected = current?.id === t.id;
              const last = t.messages[t.messages.length - 1]!;
              const Icon = CHANNEL_ICON[t.channel];
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => openTicket(t)}
                    aria-current={selected || undefined}
                    className={cn(
                      "relative flex w-full flex-col gap-1.5 py-3.5 text-left transition-colors lg:px-4",
                      selected ? "lg:bg-stone/50" : "hover:bg-sunken/60",
                    )}
                  >
                    {selected && <span className="absolute inset-y-0 left-0 hidden w-0.5 bg-ink lg:block" aria-hidden />}
                    <span className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate t-small font-medium text-ink">{t.from}</span>
                      <span className="shrink-0 t-micro text-ink-3 tnum">{formatRelative(last.at, now)}</span>
                    </span>
                    <span className="truncate t-body font-medium text-ink">{t.subject}</span>
                    <span className="truncate t-small text-ink-3">{last.kind === "note" ? "Note: " : last.kind === "out" ? "You: " : ""}{last.text}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-2">
                      {t.kind === "Operator" && <Badge tone="slate">Operator</Badge>}
                      {(t.priority === "Urgent" || t.priority === "High") && <Badge tone={PRIORITY_TONE[t.priority]}>{t.priority}</Badge>}
                      {ACTIVE.includes(t.status) ? <SlaClock due={t.slaDue} paused={PAUSED.includes(t.status)} /> : <StatusBadge status={t.status} />}
                      <Icon className="ml-auto size-3.5 text-ink-3" aria-label={t.channel} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* CONVERSATION (desktop) */}
        {desktop && (
          <div className="flex min-h-0 min-w-0 flex-col">
            {current ? (
              <Conversation key={current.id} ticket={current} onUpdate={update} />
            ) : (
              <StateView state={id ? "not-found" : "empty"} title={id ? `No ticket ${id}` : "Choose a ticket"} className="m-auto" />
            )}
          </div>
        )}
      </div>

      {/* CONVERSATION (mobile sheet) */}
      {!desktop && id && (
        <Drawer open onClose={() => setId(null)} title={current?.subject ?? "Ticket not found"} description={current ? `${current.id} · ${current.from}` : undefined}>
          {current ? (
            <div className="-mx-5 -my-5 flex h-[calc(100%+2.5rem)] flex-col">
              <Conversation key={current.id} ticket={current} onUpdate={update} compact />
            </div>
          ) : (
            <StateView state="not-found" title={`No ticket ${id}`} />
          )}
        </Drawer>
      )}

      <NewTicketModal
        open={isNew === "1"}
        onClose={() => setNew(null)}
        nextId={`TCK-${Math.max(...rows.map((r) => Number(r.id.slice(4)))) + 1}`}
        onCreate={(t) => {
          setRows((rs) => [t, ...rs]);
          setTab("open");
          setNew(null);
          setId(t.id);
          toast.success(`${t.id} opened`, `${SLA_BY_PRIORITY[t.priority]}-hour SLA · ${t.assignee === "Unassigned" ? "unassigned" : t.assignee}`);
        }}
      />
    </Page>
  );
}

/* ------------------------------------------------------------------ */

function Conversation({ ticket: t, onUpdate, compact }: { ticket: SupportTicket; onUpdate: (id: string, patch: Partial<SupportTicket>, msg?: Msg) => void; compact?: boolean }) {
  const toast = useToast();
  const now = useNow();
  const [mode, setMode] = useState<"reply" | "note">("reply");
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const first = t.kind === "Customer" ? t.from.split(" ")[0]! : t.from;
  const Icon = CHANNEL_ICON[t.channel];
  const profile = t.kind === "Customer" ? (customerIdByName(t.from) ? `/admin/customers/${customerIdByName(t.from)}` : undefined) : operatorIdByName(t.from) ? `/admin/operators/${operatorIdByName(t.from)}` : undefined;

  useEffect(() => {
    const box = endRef.current?.parentElement;
    if (box) box.scrollTop = box.scrollHeight;
  }, [t.messages.length]);

  const send = (resolve?: boolean) => {
    const body = text.trim();
    if (!body) return;
    const msg: Msg = { kind: mode === "note" ? "note" : "out", by: "Idara Umoh", at: now.toISOString(), text: body };
    const patch: Partial<SupportTicket> = {};
    if (mode === "reply") patch.status = resolve ? "Resolved" : t.status === "Open" || t.status === "Escalated" ? "Waiting" : t.status;
    if (t.assignee === "Unassigned") patch.assignee = "Idara Umoh";
    onUpdate(t.id, patch, msg);
    setText("");
    toast.success(mode === "note" ? "Internal note added" : resolve ? `Replied and resolved ${t.id}` : `Reply sent by ${t.channel === "Phone" ? "SMS" : t.channel}`, mode === "reply" && !resolve ? "Waiting on their reply. The SLA clock is paused." : undefined);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className={cn("flex flex-col gap-3 border-b border-line px-5 py-4 lg:px-6", compact && "pt-4")}>
        {!compact && (
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="t-h2 text-ink">{t.subject}</h2>
              <p className="t-small mt-0.5 flex flex-wrap items-center gap-x-2 text-ink-2">
                <Ref>{t.id}</Ref>
                <span className="text-line-strong">·</span>
                {profile ? <Link to={profile} className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">{t.from}</Link> : <span className="font-medium text-ink">{t.from}</span>}
                <span className="text-line-strong">·</span>
                <span className="inline-flex items-center gap-1"><Icon className="size-3.5" /> {t.channel}</span>
                <span className="text-line-strong">·</span>
                opened {formatRelative(t.created, now)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge tone={PRIORITY_TONE[t.priority]}>{t.priority}</Badge>
              {t.kind === "Operator" && <Badge tone="slate">Operator</Badge>}
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <Select
            compact
            aria-label="Assignee"
            value={t.assignee}
            options={[...SUPPORT_AGENTS, "Unassigned"].map((a) => ({ value: a, label: a === "Unassigned" ? "Unassigned" : a }))}
            className="sm:w-44"
            onChange={(e) => {
              onUpdate(t.id, { assignee: e.target.value }, { kind: "note", by: "Idara Umoh", at: now.toISOString(), text: e.target.value === "Unassigned" ? "Unassigned." : `Assigned to ${e.target.value}.` });
              toast.success(e.target.value === "Unassigned" ? "Unassigned" : `Assigned to ${e.target.value}`);
            }}
          />
          <Select
            compact
            aria-label="Status"
            value={t.status}
            options={["Open", "Pending", "Waiting", "Escalated", "Resolved", "Closed"]}
            className="sm:w-36"
            onChange={(e) => {
              const s = e.target.value as Status;
              onUpdate(t.id, { status: s }, { kind: "note", by: "Idara Umoh", at: now.toISOString(), text: `Status changed from ${t.status} to ${s}.` });
              toast.success(`${t.id} is now ${s.toLowerCase()}`);
            }}
          />
          <span className="col-span-2 flex items-center gap-2 sm:ml-auto">
            <span className="t-micro text-ink-3">SLA {SLA_BY_PRIORITY[t.priority]}h</span>
            {ACTIVE.includes(t.status) ? <SlaClock due={t.slaDue} paused={PAUSED.includes(t.status)} long /> : <StatusBadge status={t.status} />}
          </span>
        </div>
      </div>

      {/* Thread */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 lg:px-6">
        <ol className="flex flex-col gap-4">
          {t.messages.map((m, i) =>
            m.kind === "note" ? (
              <li key={i} className="flex flex-col gap-1 rounded-md border border-dashed border-line-strong bg-sunken/60 px-3.5 py-2.5">
                <span className="flex items-center gap-1.5 t-micro text-ink-3">
                  <Lock className="size-3" /> Internal note · {m.by} · {formatTime(m.at)}
                </span>
                <p className="t-small text-ink-2">{m.text}</p>
              </li>
            ) : (
              <li key={i} className={cn("flex max-w-[86%] gap-2.5", m.kind === "out" && "flex-row-reverse self-end")}>
                <Avatar name={m.by} size="sm" className="mt-5" />
                <div className={cn("flex min-w-0 flex-col gap-1", m.kind === "out" && "items-end")}>
                  <span className="t-micro text-ink-3">
                    {m.by} · {formatDateTime(m.at)}
                  </span>
                  <p className={cn("rounded-lg px-3.5 py-2.5 t-body", m.kind === "in" ? "rounded-tl-sm bg-sunken text-ink" : "rounded-tr-sm bg-slate text-slate-ink dark:bg-stone dark:text-ink")}>{m.text}</p>
                </div>
              </li>
            ),
          )}
        </ol>
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="flex flex-col gap-2.5 border-t border-line px-5 py-4 safe-bottom lg:px-6">
        <div className="flex items-center justify-between gap-2">
          <Segmented
            size="sm"
            value={mode}
            onChange={setMode}
            options={[
              { value: "reply", label: compact ? "Reply" : `Reply to ${first.length > 16 ? t.kind.toLowerCase() : first}` },
              { value: "note", label: "Internal note" },
            ]}
          />
          <Menu
            trigger={(p) => (
              <Button {...p} variant="ghost" size="sm" leading={<FileText className="size-4" />} disabled={mode === "note"}>
                Templates
              </Button>
            )}
            items={TEMPLATES.map((tp) => ({
              label: tp.name,
              onSelect: () => setText(tp.body.replace("{first}", first).replace("{hours}", String(SLA_BY_PRIORITY[t.priority]))),
            }))}
          />
        </div>
        <Textarea
          rows={compact ? 2 : 3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={mode === "note" ? "Only Slate staff will see this" : `Reply by ${t.channel === "Phone" ? "SMS" : t.channel}`}
          aria-label={mode === "note" ? "Internal note" : "Reply"}
          className={cn(mode === "note" && "border-dashed bg-sunken/40")}
        />
        <div className="flex flex-wrap items-center justify-end gap-2">
          {mode === "reply" && (
            <Button variant="ghost" size="sm" disabled={!text.trim()} onClick={() => send(true)}>
              Send and resolve
            </Button>
          )}
          <Button size="sm" leading={<Send className="size-3.5" />} disabled={!text.trim()} onClick={() => send()}>
            {mode === "note" ? "Add note" : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function NewTicketModal({ open, onClose, onCreate, nextId }: { open: boolean; onClose: () => void; onCreate: (t: SupportTicket) => void; nextId: string }) {
  const now = useNow();
  const [kind, setKind] = useState<"Customer" | "Operator">("Customer");
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [channel, setChannel] = useState<Ticket["channel"]>("Phone");
  const [priority, setPriority] = useState<Ticket["priority"]>("Normal");
  const [assignee, setAssignee] = useState("Unassigned");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const reset = () => {
    setFrom(""); setSubject(""); setMessage(""); setErrors({}); setPriority("Normal"); setChannel("Phone"); setAssignee("Unassigned");
  };
  const submit = () => {
    const e: Record<string, string> = {};
    if (!from) e.from = `Choose the ${kind.toLowerCase()}.`;
    if (subject.trim().length < 4) e.subject = "Add a short subject.";
    if (message.trim().length < 8) e.message = "Write what they told you.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const created = now.toISOString();
    onCreate({
      id: nextId, from, kind, subject: subject.trim(), channel, priority, status: "Open", assignee, created, sla: "",
      slaDue: new Date(now.getTime() + SLA_BY_PRIORITY[priority] * HOUR).toISOString(),
      messages: [{ kind: "in", by: from, at: created, text: message.trim() }],
    });
    reset();
  };
  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      size="lg"
      title="New ticket"
      description="For requests that came in by phone, WhatsApp or email."
      footer={
        <>
          <Button variant="ghost" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button onClick={submit}>Open ticket</Button>
        </>
      }
    >
      <div className="grid gap-4 pb-2 sm:grid-cols-2">
        <Segmented
          className="sm:col-span-2 sm:w-fit"
          value={kind}
          onChange={(v) => { setKind(v); setFrom(""); }}
          options={[{ value: "Customer", label: "Customer" }, { value: "Operator", label: "Operator" }]}
        />
        <Select
          label={kind}
          placeholder={`Choose ${kind.toLowerCase()}`}
          fieldClassName="sm:col-span-2"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          options={kind === "Customer" ? customers.map((c) => ({ value: c.name, label: `${c.name} — ${c.type}, ${c.area}` })).filter((o, i, a) => a.findIndex((x) => x.value === o.value) === i) : activeOperators.map((o) => o.short)}
          error={errors.from}
        />
        <Input label="Subject" fieldClassName="sm:col-span-2" value={subject} onChange={(e) => setSubject(e.target.value)} error={errors.subject} placeholder="Wants collection moved to Saturdays" />
        <Select label="Channel" value={channel} options={["Phone", "WhatsApp", "Email", "In-app"]} onChange={(e) => setChannel(e.target.value as Ticket["channel"])} />
        <Select
          label="Priority"
          value={priority}
          options={(["Urgent", "High", "Normal", "Low"] as const).map((p) => ({ value: p, label: `${p} — ${SLA_BY_PRIORITY[p]}h SLA` }))}
          onChange={(e) => setPriority(e.target.value as Ticket["priority"])}
        />
        <Select label="Assign to" value={assignee} options={["Unassigned", ...SUPPORT_AGENTS]} onChange={(e) => setAssignee(e.target.value)} />
        <Textarea label="What they said" fieldClassName="sm:col-span-2" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} error={errors.message} />
      </div>
    </Modal>
  );
}
