import { useMemo, useState, type ReactNode } from "react";
import { Ban, Check, Eye, MoreHorizontal, RotateCcw, Send, UserPlus } from "lucide-react";
import {
  Avatar, Badge, Button, ChipGroup, ConfirmDialog, DataTable, DescriptionList, Drawer, FilterBar, IconButton, Input, Menu, Modal, Page, PageHeader,
  PhoneInput, Select, StatusBadge, Tabs, useFilteredRows, useToast, type Column,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatDate, formatNaira } from "@/lib/format";
import { BLOCKS, ESTATE, PER_HOUSEHOLD, paymentHistory, pointFor, properties, todayRun, type Property } from "./_data";
import { ReminderModal } from "./_shared";

type Tab = "all" | "Active" | "Inactive" | "Suspended";

function pickupToday(p: Property) {
  const r = todayRun.find((x) => x.block === p.block)!;
  if (r.finished) return { label: `Collected ${r.finished}`, tone: "success" as const };
  if (r.started) return { label: "Crew on this block", tone: "signal" as const };
  return { label: `Due today, ~${r.eta}`, tone: "info" as const };
}

/** D3, the people behind the units: their Slate account, contribution and today's pickup. */
export default function Residents() {
  const toast = useToast();
  const [rows, setRows] = useState(() => properties.filter((p) => p.status === "Occupied"));
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [viewId, setViewId] = useState<string | null>(null);
  const [suspendId, setSuspendId] = useState<string | null>(null);
  const [remindIds, setRemindIds] = useState<string[] | null>(null);
  const [inviting, setInviting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      Active: rows.filter((r) => r.account === "Active").length,
      Inactive: rows.filter((r) => r.account === "Inactive").length,
      Suspended: rows.filter((r) => r.account === "Suspended").length,
    }),
    [rows],
  );
  const byTab = useMemo(() => (tab === "all" ? rows : rows.filter((r) => r.account === tab)), [rows, tab]);
  const filtered = useFilteredRows(byTab, {
    search,
    searchFields: (r) => `${r.resident} ${r.unit} ${r.phone} ${r.email}`,
    filters,
    filterFields: { block: (r) => `Block ${r.block}`, payment: (r) => (r.payment === "Unpaid" ? "Not paid" : r.payment === "Partial" ? "Part paid" : "Paid") },
  });

  const setAccount = (id: string, account: Property["account"]) => setRows((xs) => xs.map((x) => (x.id === id ? { ...x, account } : x)));
  const suspendTarget = rows.find((r) => r.id === suspendId);
  const remindRows = rows.filter((r) => remindIds?.includes(r.id));

  const actions = (r: Property) => (
    <div onClick={(e) => e.stopPropagation()}>
      <Menu
        trigger={(p) => (
          <IconButton label={`Actions for ${r.unit}`} size="sm" {...p}>
            <MoreHorizontal />
          </IconButton>
        )}
        items={[
          { label: "View account", icon: <Eye />, onSelect: () => setViewId(r.id) },
          { label: "Send payment reminder", icon: <Send />, onSelect: () => setRemindIds([r.id]), disabled: r.payment === "Paid" },
          { divider: true, label: "" },
          r.account === "Suspended"
            ? { label: "Restore association", icon: <RotateCcw />, onSelect: () => { setAccount(r.id, "Active"); toast.success(`${r.resident} restored`, "They're back on the estate plan from today."); } }
            : { label: "Suspend association", icon: <Ban />, danger: true, onSelect: () => setSuspendId(r.id) },
        ]}
      />
    </div>
  );

  const columns: Column<Property>[] = [
    {
      key: "resident",
      header: "Resident",
      sortValue: (r) => r.resident!,
      cell: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.resident!} size="sm" />
          <div className="min-w-0">
            <p className="font-medium text-ink">{r.resident}</p>
            <p className="t-mono text-ink-3">{r.unit}</p>
          </div>
        </div>
      ),
    },
    { key: "account", header: "Account", sortValue: (r) => r.account, cell: (r) => (r.account === "Active" ? <Quiet>Active</Quiet> : <StatusBadge status={r.account === "Inactive" ? "Not activated" : r.account} />) },
    {
      key: "payment",
      header: "October",
      sortValue: (r) => r.paid,
      cell: (r) => (
        <div className="flex flex-col">
          {r.payment === "Paid" ? <Quiet check>Paid</Quiet> : <StatusBadge status={r.payment} className="self-start" />}
          {r.payment !== "Paid" && <span className="mt-0.5 t-micro text-ink-3 tnum">{formatNaira(PER_HOUSEHOLD - r.paid)} due</span>}
        </div>
      ),
    },
    { key: "plan", header: "Subscription", cell: () => <span className="text-ink-2">Estate plan · {formatNaira(PER_HOUSEHOLD)}/mo</span>, hideOnMobile: true },
    {
      key: "pickup",
      header: "Today's pickup",
      cell: (r) => {
        const p = pickupToday(r);
        return p.tone === "success" ? <Quiet check>{p.label}</Quiet> : <Badge tone={p.tone} dot>{p.label}</Badge>;
      },
    },
    { key: "actions", header: <span className="sr-only">Actions</span>, cell: actions, align: "right", className: "w-12" },
  ];

  return (
    <Page>
      <PageHeader
        title="Residents"
        description={`${counts.all} households pay through Slate. ${counts.Active} have active accounts, ${counts.Inactive} haven't activated theirs yet, ${counts.Suspended} are suspended from the association.`}
        actions={
          <Button leading={<UserPlus className="size-4" />} onClick={() => setInviting(true)}>
            Invite resident
          </Button>
        }
      />

      <section className="flex flex-col gap-4">
        <Tabs
          value={tab}
          onChange={(t) => {
            setTab(t);
            setSelected([]);
          }}
          items={[
            { value: "all", label: "All", count: counts.all },
            { value: "Active", label: "Active", count: counts.Active },
            { value: "Inactive", label: "Not activated", count: counts.Inactive },
            { value: "Suspended", label: "Suspended", count: counts.Suspended },
          ]}
        />
        {tab === "Inactive" && (
          <p className="t-small text-ink-2">
            These residents still get collection, they just haven't set up the Slate app, so they pay by transfer or at the estate office.{" "}
            <button type="button" className="font-medium text-ink underline underline-offset-4" onClick={() => toast.success(`Activation link resent to ${counts.Inactive} residents`, "By SMS.")}>
              Resend activation links
            </button>
          </p>
        )}
        <FilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Search residents"
          filters={[
            { key: "block", label: "Block", options: BLOCKS.map((b) => `Block ${b}`) },
            { key: "payment", label: "October", options: ["Paid", "Part paid", "Not paid"] },
          ]}
          values={filters}
          onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
          onExport={(f) => toast.success(`Residents exported as ${f}`, `${filtered.length} residents.`)}
        />
        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-md bg-slate px-4 py-2.5 text-slate-ink dark:bg-stone dark:text-ink">
            <span className="t-small font-medium tnum">{selected.length} selected</span>
            <Button size="sm" variant="secondary" leading={<Send className="size-3.5" />} onClick={() => setRemindIds(selected)}>
              Remind
            </Button>
            <button type="button" className="ml-auto t-small opacity-80 hover:opacity-100" onClick={() => setSelected([])}>
              Clear
            </button>
          </div>
        )}
        <DataTable
          rows={filtered}
          columns={columns}
          rowKey={(r) => r.id}
          pageSize={12}
          selectable
          selected={selected}
          onSelectedChange={setSelected}
          onRowClick={(r) => setViewId(r.id)}
          mobile={(r) => {
            const p = pickupToday(r);
            return (
              <div className="flex items-start gap-3">
                <Avatar name={r.resident!} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate font-medium text-ink">{r.resident}</p>
                    <span className="t-mono shrink-0 text-ink-3">{r.unit}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    {r.payment === "Paid" ? <Quiet check>Paid</Quiet> : <StatusBadge status={r.payment} />}
                    {r.account !== "Active" && <StatusBadge status={r.account === "Inactive" ? "Not activated" : r.account} />}
                    {p.tone === "success" ? <Quiet>{p.label}</Quiet> : <Badge tone={p.tone} dot>{p.label}</Badge>}
                  </div>
                </div>
              </div>
            );
          }}
        />
      </section>

      <ResidentDrawer
        resident={rows.find((r) => r.id === viewId) ?? null}
        onClose={() => setViewId(null)}
        onRemind={(id) => setRemindIds([id])}
        onSuspend={(id) => setSuspendId(id)}
        onRestore={(id) => {
          setAccount(id, "Active");
          toast.success("Association restored");
        }}
      />
      <ConfirmDialog
        open={!!suspendTarget}
        onClose={() => setSuspendId(null)}
        variant="destructive"
        title={`Suspend ${suspendTarget?.resident ?? ""} from the association?`}
        description={`${suspendTarget?.unit} keeps collection until 31 October, then moves to individual billing with Slate at ₦7,000 a month. They're told by SMS. You can restore them at any time.`}
        confirmLabel="Suspend association"
        onConfirm={() => {
          if (!suspendTarget) return;
          setAccount(suspendTarget.id, "Suspended");
          toast.success(`${suspendTarget.resident} suspended`, `${suspendTarget.unit} leaves the estate plan on 31 Oct.`);
        }}
      />
      <ReminderModal
        open={!!remindIds}
        onClose={() => setRemindIds(null)}
        households={remindRows.filter((r) => r.payment !== "Paid").length || remindRows.length}
        amount={remindRows.reduce((a, r) => a + (PER_HOUSEHOLD - r.paid), 0)}
        onSent={() => setSelected([])}
      />
      <InviteModal
        open={inviting}
        onClose={() => setInviting(false)}
        onInvite={(unit, name) => {
          setRows((xs) => xs.map((x) => (x.unit === unit ? { ...x, resident: name, account: "Inactive" } : x)));
        }}
      />
    </Page>
  );
}

/** Normal states read as plain text; only exceptions get a badge. */
function Quiet({ children, check }: { children: ReactNode; check?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 t-small text-ink-2">
      {check && <Check className="size-3.5 text-success" strokeWidth={2.5} aria-hidden />}
      {children}
    </span>
  );
}

function ResidentDrawer({
  resident: r,
  onClose,
  onRemind,
  onSuspend,
  onRestore,
}: {
  resident: Property | null;
  onClose: () => void;
  onRemind: (id: string) => void;
  onSuspend: (id: string) => void;
  onRestore: (id: string) => void;
}) {
  const history = useMemo(() => (r ? paymentHistory(r) : []), [r]);
  if (!r) return <Drawer open={false} onClose={onClose} />;
  const pickup = pickupToday(r);
  const point = pointFor(r.block);
  const paidMonths = history.filter((h) => h.status === "Successful").length;
  return (
    <Drawer
      open
      onClose={onClose}
      title={r.resident}
      description={`Unit ${r.unit} · ${r.type}`}
      footer={
        <>
          {r.account === "Suspended" ? (
            <Button variant="secondary" leading={<RotateCcw className="size-4" />} onClick={() => onRestore(r.id)}>Restore association</Button>
          ) : (
            <Button variant="ghost" className="text-danger hover:bg-danger-bg hover:text-danger" onClick={() => onSuspend(r.id)}>Suspend association</Button>
          )}
          {r.payment !== "Paid" && (
            <Button leading={<Send className="size-4" />} onClick={() => onRemind(r.id)}>Send reminder</Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-7">
        <div className="flex items-center gap-4">
          <Avatar name={r.resident!} size="lg" />
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge status={r.account === "Inactive" ? "Not activated" : r.account} />
            <StatusBadge status={r.payment} />
            <Badge tone={r.association === "Member" ? "neutral" : "warning"}>{r.association === "Member" ? "Association member" : `Association: ${r.association.toLowerCase()}`}</Badge>
          </div>
        </div>

        <DescriptionList
          dense
          items={[
            { label: "Phone", value: r.phone },
            { label: "Email", value: <span className="break-all">{r.email}</span> },
            { label: "Subscription", value: `Estate plan · ${formatNaira(PER_HOUSEHOLD)} a month` },
            { label: "Resident since", value: r.since ? formatDate(r.since) : "Not set" },
            { label: "Collection", value: `${ESTATE.schedule} at ${point.id}, ${point.name}` },
            { label: "Today", value: <Badge tone={pickup.tone} dot>{pickup.label}</Badge> },
          ]}
        />

        {r.account === "Suspended" && (
          <p className="rounded-md bg-danger-bg px-4 py-3 t-small text-danger">
            Suspended from the association on 28 Sep. Collection continues until 31 Oct; after that this unit is billed by Slate directly.
          </p>
        )}

        <section className="flex flex-col gap-3 border-t border-line pt-6">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="t-h3 text-ink">Payment history</h3>
            <span className="t-small text-ink-3 tnum">{paidMonths} of {history.length} months paid in full</span>
          </div>
          <ul className="divide-y divide-line">
            {history.map((h) => (
              <li key={h.month} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="t-small font-medium text-ink">{h.month}</p>
                  <p className="t-small text-ink-3">
                    {h.status === "Unpaid" ? `Due ${formatDate("2026-10-07")}` : `${formatDate(h.date)} · ${h.method}`}
                    {h.id !== "Not set" && <span className="t-mono"> · {h.id}</span>}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={cn("t-mono", h.status === "Unpaid" ? "text-ink-3" : "text-ink")}>{h.amount ? formatNaira(h.amount) : "Not set"}</span>
                  {h.status !== "Successful" && <StatusBadge status={h.status} />}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Drawer>
  );
}

function InviteModal({ open, onClose, onInvite }: { open: boolean; onClose: () => void; onInvite: (unit: string, name: string) => void }) {
  const toast = useToast();
  const [unit, setUnit] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [channels, setChannels] = useState(["SMS"]);
  const [tried, setTried] = useState(false);
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setUnit("");
      setName("");
      setPhone("");
      setEmail("");
      setChannels(["SMS"]);
      setTried(false);
    }
  }
  const units = properties.filter((p) => p.status === "Occupied" && p.account === "Inactive").map((p) => ({ value: p.unit, label: `${p.unit} · ${p.resident} (not activated)` }));
  const vacant = properties.filter((p) => p.status === "Vacant").map((p) => ({ value: p.unit, label: `${p.unit} · vacant, new resident` }));
  const errors = {
    unit: !unit ? "Choose the unit" : undefined,
    name: name.trim().split(/\s+/).length < 2 ? "Enter first and last name" : undefined,
    phone: channels.includes("SMS") || channels.includes("WhatsApp") ? (phone.replace(/\D/g, "").length < 10 ? "Enter a 10-digit number after +234" : undefined) : undefined,
    email: channels.includes("Email") ? (!/^\S+@\S+\.\S+$/.test(email) ? "Enter a valid email" : undefined) : email && !/^\S+@\S+\.\S+$/.test(email) ? "Check the email address" : undefined,
    channels: !channels.length ? "Choose at least one way to send the invite" : undefined,
  };
  const valid = !Object.values(errors).some(Boolean);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite a resident"
      description="They get a link to activate their Slate account, see pickups and pay their contribution."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              setTried(true);
              if (!valid) return;
              onInvite(unit, name.trim());
              toast.success(`Invite sent to ${name.trim().split(" ")[0]}`, `${unit} · by ${channels.join(" and ")}. The link works for 7 days.`);
              onClose();
            }}
          >
            Send invite
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        <Select
          label="Unit"
          value={unit}
          onChange={(e) => {
            setUnit(e.target.value);
            const p = properties.find((x) => x.unit === e.target.value);
            if (p?.resident) {
              setName(p.resident);
              setPhone(p.phone?.replace("+234 ", "") ?? "");
              setEmail(p.email ?? "");
            } else {
              setName("");
              setPhone("");
              setEmail("");
            }
          }}
          options={[...units, ...vacant]}
          placeholder="Choose a unit"
          error={tried ? errors.unit : undefined}
        />
        <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} error={tried ? errors.name : undefined} autoComplete="off" />
        <PhoneInput label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} error={tried ? errors.phone : undefined} />
        <Input label="Email" type="email" optional value={email} onChange={(e) => setEmail(e.target.value)} error={tried ? errors.email : undefined} placeholder="name@example.com" />
        <div className="flex flex-col gap-2">
          <span className="t-small font-medium text-ink">Send invite by</span>
          <ChipGroup options={["SMS", "WhatsApp", "Email"]} value={channels} onChange={setChannels} />
          {tried && errors.channels && <p className="t-small text-danger">{errors.channels}</p>}
        </div>
      </div>
    </Modal>
  );
}
