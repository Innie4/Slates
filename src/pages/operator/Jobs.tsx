import { useMemo, useState } from "react";
import { Check, UserPlus, X } from "lucide-react";
import {
  Badge, Button, ChoiceCard, DataTable, FilterBar, Modal, Page, PageHeader, StatusBadge, Tabs, useFilteredRows, useTab, useToast, EmptyState, type Column,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { DEMO_NOW, formatDay, formatTime } from "@/lib/format";
import { OPS_DRIVERS, type Job } from "./_opsData";
import { DateTile, STATUS_ORDER, StopNumber, isLate, isTodayIso, stopState, updateJobs, useJobs } from "./_ops";

type TabKey = "today" | "upcoming" | "completed" | "failed" | "cancelled";

const startOfTomorrow = (() => {
  const d = new Date(DEMO_NOW);
  d.setHours(24, 0, 0, 0);
  return d.getTime();
})();

function inTab(j: Job, tab: TabKey) {
  switch (tab) {
    case "today":
      return isTodayIso(j.date) && j.status !== "Cancelled";
    case "upcoming":
      return new Date(j.date).getTime() >= startOfTomorrow && j.status !== "Cancelled";
    case "completed":
      return j.status === "Completed";
    case "failed":
      return j.status === "Failed";
    case "cancelled":
      return j.status === "Cancelled";
  }
}

const sorters: Record<TabKey, (a: Job, b: Job) => number> = {
  today: (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.window.localeCompare(b.window) || (a.stop ?? 0) - (b.stop ?? 0),
  upcoming: (a, b) => a.date.localeCompare(b.date) || (a.stop ?? 0) - (b.stop ?? 0),
  completed: (a, b) => (b.completedAt ?? b.date).localeCompare(a.completedAt ?? a.date),
  failed: (a, b) => (b.failedAt ?? b.date).localeCompare(a.failedAt ?? a.date),
  cancelled: (a, b) => b.date.localeCompare(a.date),
};

/** G8, every job assigned to Ufok, by day and outcome. Dispatchers bulk-assign from here. */
export default function Jobs() {
  const toast = useToast();
  const jobs = useJobs();
  const tab = useTab<TabKey>("tab", "today");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);

  const counts = useMemo(() => {
    const c = { today: 0, upcoming: 0, completed: 0, failed: 0, cancelled: 0 } as Record<TabKey, number>;
    for (const j of jobs) (Object.keys(c) as TabKey[]).forEach((k) => inTab(j, k) && c[k]++);
    return c;
  }, [jobs]);

  const tabRows = useMemo(() => jobs.filter((j) => inTab(j, tab)).sort(sorters[tab]), [jobs, tab]);
  const rows = useFilteredRows(tabRows, {
    search,
    searchFields: (j) => `${j.id} ${j.customerName} ${j.address} ${j.service}`,
    filters,
    filterFields: { driver: (j) => j.driver || "Unassigned", vehicle: (j) => j.vehicle || "Unassigned", area: (j) => j.area },
  });
  const assignable = tab === "today" || tab === "upcoming";
  const late = jobs.filter(isLate).length;
  const unassigned = tabRows.filter((j) => !j.driver).length;

  const uniq = (xs: string[]) => [...new Set(xs)].sort();
  const filterDefs = [
    { key: "driver", label: "Driver", options: uniq(tabRows.map((j) => j.driver || "Unassigned")) },
    { key: "vehicle", label: "Vehicle", options: uniq(tabRows.map((j) => j.vehicle || "Unassigned")) },
    { key: "area", label: "Area", options: uniq(tabRows.map((j) => j.area)) },
  ];

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const selectable = (j: Job) => assignable && !["Completed", "Failed", "Cancelled"].includes(j.status);

  const columns: Column<Job>[] = [
    {
      key: "when",
      header: tab === "today" ? "Stop" : "When",
      sortValue: (j) => (tab === "today" ? j.stop ?? 0 : j.date),
      cell: (j) =>
        tab === "today" ? (
          <div className="flex items-center gap-3">
            <StopNumber n={j.stop ?? "–"} state={stopState(j)} className="size-8 text-[14px]" />
            <span className="t-small text-ink-2 tnum">{j.window}</span>
          </div>
        ) : (
          <div className="flex flex-col">
            <span className="t-small font-medium text-ink">{formatDay(j.date)}</span>
            <span className="t-small text-ink-3 tnum">{j.window}</span>
          </div>
        ),
    },
    {
      key: "customer",
      header: "Customer",
      sortValue: (j) => j.customerName,
      cell: (j) => (
        <div className="flex min-w-0 max-w-[300px] flex-col">
          <span className="truncate font-medium text-ink">{j.customerName}</span>
          <span className="truncate t-small text-ink-2">{j.address.replace(/, Uyo$/, "")}</span>
        </div>
      ),
    },
    {
      key: "service",
      header: "Service",
      cell: (j) => (
        <div className="flex flex-col">
          <span className="text-ink">{j.service}</span>
          <span className="t-small text-ink-3">{j.customerType}{j.households ? ` · ${j.households} homes` : ""}</span>
        </div>
      ),
    },
    {
      key: "driver",
      header: "Driver",
      sortValue: (j) => j.driver || "~",
      cell: (j) =>
        j.driver ? (
          <div className="flex flex-col">
            <span className="text-ink">{j.driver}</span>
            <span className="t-mono text-[12.5px] text-ink-3">{j.vehicle}</span>
          </div>
        ) : (
          <Badge tone="warning" dot>Unassigned</Badge>
        ),
    },
    {
      key: "status",
      header: tab === "failed" ? "Reason" : tab === "cancelled" ? "Reason" : tab === "completed" ? "Collected" : "Status",
      align: "right",
      cell: (j) => <StatusCell j={j} tab={tab} />,
    },
  ];

  const doAssign = (driverName: string) => {
    const d = OPS_DRIVERS.find((x) => x.name === driverName)!;
    updateJobs(selected, { driver: d.name, vehicle: d.vehicle });
    toast.success(`${selected.length} ${selected.length === 1 ? "job" : "jobs"} assigned to ${d.name}`, `${d.vehicle} · their route on the driver app is updated.`);
    setSelected([]);
    setAssignOpen(false);
  };

  return (
    <Page className="gap-6 md:gap-8">
      <PageHeader
        title="Jobs"
        description={
          <>
            {DEMO_NOW.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · {counts.today} on today's routes
            {late > 0 && <span className="text-danger"> · {late} late</span>}
          </>
        }
      />

      <div className="flex flex-col gap-4">
        <Tabs<TabKey>
          param="tab"
          onChange={() => {
            setSelected([]);
            setFilters({});
          }}
          items={[
            { value: "today", label: "Today", count: counts.today },
            { value: "upcoming", label: "Upcoming", count: counts.upcoming },
            { value: "completed", label: "Completed", count: counts.completed },
            { value: "failed", label: "Failed", count: counts.failed },
            { value: "cancelled", label: "Cancelled", count: counts.cancelled },
          ]}
        />
        <FilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Search jobs"
          filters={filterDefs}
          values={filters}
          onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
          onExport={(f) => toast.success(f === "Print" ? "Sending job sheet to print" : `Job list exported as ${f}`, `${rows.length} jobs · ${tab}`)}
        />
        {assignable && unassigned > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-warning-bg px-4 py-3">
            <p className="t-small text-ink">
              <span className="font-semibold text-warning">{unassigned} jobs have no driver.</span>{" "}
              {tab === "upcoming" ? "Shelter Afrique Block D, transferred from Nwaniba Clean Crew for Tuesday." : "Assign them before the trucks leave."}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelected(tabRows.filter((j) => !j.driver).map((j) => j.id));
                setAssignOpen(true);
              }}
            >
              Select and assign
            </Button>
          </div>
        )}
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(j) => j.id}
        rowHref={(j) => `/operator/jobs/${j.id}`}
        pageSize={20}
        selectable={assignable}
        selected={selected}
        onSelectedChange={(keys) => setSelected(keys.filter((k) => selectable(rows.find((r) => r.id === k) ?? tabRows.find((r) => r.id === k)!)))}
        empty={
          <EmptyState
            compact
            title={search || Object.values(filters).some(Boolean) ? "No jobs match" : `No ${tab} jobs`}
            description={search || Object.values(filters).some(Boolean) ? "Try another name, driver or area." : tab === "failed" ? "Nothing failed. Every attempted stop was collected." : "When Slate assigns jobs, they appear here."}
          />
        }
        mobile={(j) => (
          <div className="flex items-center gap-3">
            {assignable && (
              <button
                type="button"
                aria-label={selected.includes(j.id) ? `Deselect ${j.customerName}` : `Select ${j.customerName}`}
                aria-pressed={selected.includes(j.id)}
                disabled={!selectable(j)}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(j.id);
                }}
                className="-ml-2 flex size-11 shrink-0 items-center justify-center disabled:opacity-30"
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-[5px] border transition",
                    selected.includes(j.id) ? "border-slate bg-slate text-slate-ink dark:border-slate-ink dark:bg-slate-ink dark:text-slate-950" : "border-line-strong bg-surface",
                  )}
                >
                  {selected.includes(j.id) && <Check className="size-3.5" strokeWidth={3} />}
                </span>
              </button>
            )}
            {tab === "today" ? <StopNumber n={j.stop ?? "–"} state={stopState(j)} /> : <DateTile date={j.date} />}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate t-body font-medium text-ink">{j.customerName}</span>
              <span className="truncate t-small text-ink-2">{j.address.replace(/, Uyo$/, "")}</span>
              <span className="truncate t-small text-ink-3 tnum">
                {j.window} · {j.driver ? <span className="font-mono text-[12.5px]">{j.vehicle}</span> : <span className="text-warning">Unassigned</span>}
              </span>
            </div>
            <div className="shrink-0 self-start pt-0.5">
              <StatusCell j={j} tab={tab} compact />
            </div>
          </div>
        )}
      />

      {/* Bulk action bar, thumb zone on phones, above the tab bar */}
      {selected.length > 0 && (
        <div className="fixed inset-x-3 bottom-[calc(max(12px,env(safe-area-inset-bottom))+76px)] z-40 flex items-center gap-2 rounded-lg border border-line-strong bg-surface p-2 pl-4 text-ink shadow-float animate-toast-in sm:inset-x-auto sm:left-1/2 sm:w-[460px] sm:-translate-x-1/2 lg:bottom-6 lg:left-[calc(50%+128px)]">
          <span className="flex-1 text-[14px] font-medium tnum">{selected.length} selected</span>
          <button type="button" onClick={() => setSelected([])} className="flex h-11 items-center gap-1.5 rounded-md px-3 text-[14px] font-medium text-ink-2 hover:bg-sunken hover:text-ink">
            <X className="size-4" /> Clear
          </button>
          <Button leading={<UserPlus className="size-4" />} onClick={() => setAssignOpen(true)}>
            Assign to driver
          </Button>
        </div>
      )}

      <AssignModal open={assignOpen} count={selected.length} onClose={() => setAssignOpen(false)} onAssign={doAssign} />
    </Page>
  );
}

function StatusCell({ j, tab, compact }: { j: Job; tab: TabKey; compact?: boolean }) {
  if (tab === "failed")
    return (
      <div className={cn("flex flex-col items-end gap-1", compact && "max-w-[120px]")}>
        <StatusBadge status="Failed" />
        <span className="t-small text-ink-2 text-right">{j.failReason}</span>
      </div>
    );
  if (tab === "cancelled")
    return (
      <div className={cn("flex flex-col items-end gap-1", compact && "max-w-[130px]")}>
        <StatusBadge status="Cancelled" />
        {!compact && <span className="t-small text-ink-2 text-right">{j.cancelReason}</span>}
      </div>
    );
  if (tab === "completed")
    return (
      <div className="flex flex-col items-end gap-1">
        <StatusBadge status="Completed" />
        <span className="t-small text-ink-3 tnum">{j.completedAt ? (isTodayIso(j.completedAt) ? formatTime(j.completedAt) : `${formatDay(j.completedAt).replace(/^\w+ /, "")}, ${formatTime(j.completedAt)}`) : ""}</span>
      </div>
    );
  return (
    <div className="flex flex-col items-end gap-1">
      {isLate(j) ? <Badge tone="danger" dot>Late</Badge> : <StatusBadge status={j.status} />}
      {!compact && j.status === "Completed" && j.completedAt && <span className="t-small text-ink-3 tnum">{formatTime(j.completedAt)}</span>}
      {!compact && j.status === "Failed" && <span className="t-small text-ink-2">{j.failReason}</span>}
    </div>
  );
}

function AssignModal({ open, count, onClose, onAssign }: { open: boolean; count: number; onClose: () => void; onAssign: (name: string) => void }) {
  const [choice, setChoice] = useState("");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Assign ${count} ${count === 1 ? "job" : "jobs"}`}
      description="The driver's vehicle comes with them. Only verified drivers can take jobs."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!choice || count === 0} onClick={() => onAssign(choice)}>
            Assign{choice ? ` to ${choice.split(" ")[0]}` : ""}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2 pb-2">
        {OPS_DRIVERS.map((d) => {
          const blocked = d.status === "Suspended" ? "Suspended" : d.verification !== "Verified" ? "Licence awaiting Slate verification" : d.vehicle === "Not set" ? "No vehicle" : null;
          return (
            <ChoiceCard
              key={d.id}
              selected={choice === d.name}
              onSelect={() => setChoice(d.name)}
              disabled={!!blocked}
              title={d.name}
              description={blocked ?? `${d.status} · ${d.jobsToday} jobs today`}
              meta={<span className="t-mono text-ink-2">{d.vehicle}</span>}
            />
          );
        })}
      </div>
    </Modal>
  );
}
