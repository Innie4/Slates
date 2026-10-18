import { useState } from "react";
import { Mail, SlidersHorizontal } from "lucide-react";
import {
  Alert, Button, DataTable, DescriptionList, Drawer, ExportMenu, Input, Modal, Page, PageHeader, Segmented, useToast, type Column,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatNaira, formatNumber } from "@/lib/format";
import { CHARGEBACK_MONTHS, departments as seed, facilityById, type Department } from "./_data";

/** Slate ramp for proportions, not status colours. Index 0 is darkest. */
const RAMP = [
  "bg-slate-800 dark:bg-slate-100",
  "bg-slate-600 dark:bg-slate-300",
  "bg-slate-500 dark:bg-slate-400",
  "bg-slate-400 dark:bg-slate-500",
  "bg-slate-300 dark:bg-slate-600",
];

/** Share of people served, by cost centre (2026/27 headcount). */
const HEADCOUNT: Record<string, number> = { STA: 30, ENG: 17, SCI: 14, LAW: 10, MED: 9, EST: 8, ADM: 5, CAT: 4, SPT: 3 };

type Basis = "weight" | "headcount" | "fixed";
const BASIS_LABEL: Record<Basis, string> = { weight: "measured weight at each department's bin points", headcount: "staff and student headcount", fixed: "a fixed split agreed with the Bursary" };

export default function Departments() {
  const toast = useToast();
  const [rows, setRows] = useState<Department[]>(seed);
  const [month, setMonth] = useState(CHARGEBACK_MONTHS[0]!.key);
  const [basis, setBasis] = useState<Basis>("weight");
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState<Department | null>(null);
  const m = CHARGEBACK_MONTHS.find((x) => x.key === month)!;
  const sorted = [...rows].sort((a, b) => b.share - a.share);
  const cost = (d: Department) => Math.round((m.total * d.share) / 100);
  const top = sorted.slice(0, 4);
  const rest = sorted.slice(4).reduce((a, d) => a + d.share, 0);

  const columns: Column<Department>[] = [
    {
      key: "name", header: "Department", sortValue: (d) => d.name,
      cell: (d) => (
        <span className="flex flex-col">
          <span className="font-medium text-ink">{d.name}</span>
          <span className="t-mono text-[12px] text-ink-3">{d.costCentre}</span>
        </span>
      ),
    },
    { key: "facilities", header: "Facilities", cell: (d) => d.facilities.map((f) => facilityById(f).short).join(", ") },
    { key: "rep", header: "Department rep", cell: (d) => d.rep },
    { key: "kg", header: "Measured", align: "right", sortValue: (d) => d.kg, cell: (d) => <span className="tnum">{formatNumber(d.kg)} kg</span> },
    { key: "share", header: "Share", align: "right", sortValue: (d) => d.share, cell: (d) => <span className="tnum">{d.share}%</span> },
    { key: "cost", header: "Charge", align: "right", sortValue: (d) => d.share, cell: (d) => <span className="t-mono text-ink">{formatNaira(cost(d))}</span> },
  ];

  return (
    <Page>
      <PageHeader
        title="Departments"
        description="Waste costs are charged back to the cost centres that generate them, so each budget holder sees their own share."
        actions={
          <>
            <ExportMenu onExport={(f) => toast.success(`${m.label} charge-back ${f === "Print" ? "sent to printer" : "downloaded"}`, f === "Print" ? undefined : `${f} with cost-centre codes, ready for the Bursary journal.`)} />
            <Button leading={<SlidersHorizontal className="size-4" />} onClick={() => setEditing(true)}>Edit allocation</Button>
          </>
        }
      />

      <section className="flex flex-col gap-5">
        <Segmented
          value={month}
          onChange={setMonth}
          options={CHARGEBACK_MONTHS.map((x) => ({ value: x.key, label: x.label.replace(" 2026", "") }))}
          className="self-start"
        />
        <p className="t-h2 max-w-3xl text-ink">
          {m.label}'s <span className="tnum">{formatNaira(m.total)}</span> is split across {rows.length} cost centres by {BASIS_LABEL[basis]}.{" "}
          <span className="text-ink-2">
            {top[0]!.name} and {top[1]!.name} carry {Math.round(top[0]!.share + top[1]!.share)}%.
          </span>
        </p>
        <div className="flex flex-col gap-3">
          <div className="flex h-4 gap-0.5 overflow-hidden rounded-[4px]" role="img" aria-label="Share of cost by department">
            {top.map((d, i) => (
              <div key={d.code} className={cn("h-full", RAMP[i])} style={{ width: `${d.share}%` }} title={`${d.name} ${d.share}%`} />
            ))}
            <div className={cn("h-full", RAMP[4])} style={{ width: `${rest}%` }} title={`Five others ${rest}%`} />
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
            {[...top.map((d) => ({ label: d.name, share: d.share })), { label: "Five others", share: rest }].map((s, i) => (
              <li key={s.label} className="flex items-center gap-2 t-small">
                <span className={cn("size-2.5 rounded-[3px]", RAMP[i])} />
                <span className="text-ink-2">{s.label}</span>
                <span className="font-medium text-ink tnum">{+s.share.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </div>
        {month === "2026-09" && (
          <p className="t-small text-ink-3">
            The works yard debris removal (₦186,000) was charged to capital line 23050101 and isn't split.
          </p>
        )}
      </section>

      <DataTable
        rows={sorted}
        columns={columns}
        rowKey={(d) => d.code}
        onRowClick={setOpen}
        footer={<p className="t-small font-medium text-ink tnum">Total {formatNaira(m.total)}</p>}
        pageSize={20}
        mobile={(d) => (
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="t-body font-medium text-ink">{d.name}</p>
              <p className="t-mono text-[12px] text-ink-3">{d.costCentre}</p>
              <p className="t-small text-ink-2">{d.facilities.map((f) => facilityById(f).short).join(", ")} · {formatNumber(d.kg)} kg</p>
            </div>
            <div className="text-right">
              <p className="t-mono text-ink">{formatNaira(cost(d))}</p>
              <p className="t-micro text-ink-3 tnum">{d.share}%</p>
            </div>
          </div>
        )}
      />

      <Drawer
        open={!!open}
        onClose={() => setOpen(null)}
        title={open?.name}
        description={open ? `Cost centre ${open.costCentre}` : undefined}
        footer={
          open && (
            <Button
              variant="secondary"
              leading={<Mail className="size-4" />}
              onClick={() => {
                toast.success("Statement sent", `${m.label} charge-back statement emailed to ${open.rep}.`);
                setOpen(null);
              }}
            >
              Email statement to rep
            </Button>
          )
        }
      >
        {open && (
          <div className="flex flex-col gap-7">
            <DescriptionList
              columns={1}
              dense
              items={[
                { label: "Head", value: open.head },
                { label: "Department rep on Slate", value: open.rep },
                { label: "Facilities", value: open.facilities.map((f) => facilityById(f).name).join(", ") },
                { label: "Share", value: <span className="tnum">{open.share}% · {formatNumber(open.kg)} kg measured in September</span> },
              ]}
            />
            <section className="flex flex-col gap-2">
              <h3 className="t-h3 text-ink">Last three months</h3>
              <ul className="divide-y divide-line border-y border-line">
                {CHARGEBACK_MONTHS.map((x) => (
                  <li key={x.key} className="flex items-baseline justify-between gap-4 py-3">
                    <span className="t-small text-ink-2">{x.label}</span>
                    <span className="t-mono text-ink">{formatNaira(Math.round((x.total * open.share) / 100))}</span>
                  </li>
                ))}
              </ul>
              <p className="t-small text-ink-3">Journalled to {open.costCentre} by the Bursary on the 10th of the following month.</p>
            </section>
          </div>
        )}
      </Drawer>

      <AllocationModal
        open={editing}
        onClose={() => setEditing(false)}
        rows={rows}
        basis={basis}
        onSave={(next, b) => {
          setRows(next);
          setBasis(b);
          toast.success("Allocation saved", "It applies from October's charge-back. September stays as journalled.");
        }}
      />
    </Page>
  );
}

function AllocationModal({
  open, onClose, rows, basis, onSave,
}: {
  open: boolean;
  onClose: () => void;
  rows: Department[];
  basis: Basis;
  onSave: (rows: Department[], basis: Basis) => void;
}) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [b, setB] = useState<Basis>(basis);
  const [opened, setOpened] = useState(false);
  if (open && !opened) {
    setOpened(true);
    setB(basis);
    setDraft(Object.fromEntries(rows.map((d) => [d.code, String(d.share)])));
  }
  if (!open && opened) setOpened(false);

  const total = Object.values(draft).reduce((a, v) => a + (Number(v) || 0), 0);
  const ok = Math.abs(total - 100) < 0.05;
  const totalWeight = rows.reduce((a, d) => a + d.kg, 0);

  const applyWeight = () => {
    // Round to 0.5% and push the remainder onto the largest share so it totals 100.
    const raw = rows.map((d) => ({ code: d.code, v: Math.round(((d.kg / totalWeight) * 100) * 2) / 2 }));
    const diff = 100 - raw.reduce((a, r) => a + r.v, 0);
    raw.sort((x, y) => y.v - x.v)[0]!.v += diff;
    setDraft(Object.fromEntries(raw.map((r) => [r.code, String(+r.v.toFixed(1))])));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Edit cost allocation"
      description="How each month's waste cost is split between cost centres. Shares must add up to 100%."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!ok}
            onClick={() => {
              onSave(rows.map((d) => ({ ...d, share: Number(draft[d.code]) || 0 })), b);
              onClose();
            }}
          >
            Save allocation
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        <div className="flex flex-col gap-2">
          <span className="t-small font-medium text-ink">Split by</span>
          <Segmented
            value={b}
            onChange={(v) => {
              setB(v);
              if (v === "weight") applyWeight();
              if (v === "headcount") setDraft(Object.fromEntries(Object.entries(HEADCOUNT).map(([k, n]) => [k, String(n)])));
            }}
            options={[
              { value: "weight", label: "Weight" },
              { value: "headcount", label: "Headcount" },
              { value: "fixed", label: "Fixed" },
            ]}
            className="self-start"
          />
          <p className="t-small text-ink-3">
            {b === "weight" && "Uses September's weighed lifts at each department's bin points. Fairest where bins are clearly owned."}
            {b === "headcount" && "Splits by people served. Simple, but ignores heavy generators like the kitchen."}
            {b === "fixed" && "Percentages agreed with the Bursary and reviewed each session."}
          </p>
        </div>
        <ul className="divide-y divide-line border-y border-line">
          {rows.map((d) => (
            <li key={d.code} className="flex items-center gap-3 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate t-small font-medium text-ink">{d.name}</span>
                <span className="block t-mono text-[12px] text-ink-3">{d.costCentre}</span>
              </span>
              <div className="w-24 shrink-0">
                <Input
                  aria-label={`${d.name} share`}
                  inputMode="decimal"
                  value={draft[d.code] ?? ""}
                  onChange={(e) => {
                    setB("fixed");
                    setDraft((x) => ({ ...x, [d.code]: e.target.value.replace(/[^\d.]/g, "") }));
                  }}
                  trailing={<span className="pr-3 t-small text-ink-3">%</span>}
                  className="!h-10 text-right tnum"
                />
              </div>
            </li>
          ))}
        </ul>
        {ok ? (
          <p className="t-small text-ink-2 tnum">Total 100%. Ready to save.</p>
        ) : (
          <Alert tone="warning" title={`Shares add up to ${+total.toFixed(1)}%`}>
            {total > 100 ? `Take ${+(total - 100).toFixed(1)}% off somewhere.` : `${+(100 - total).toFixed(1)}% isn't allocated yet.`}
          </Alert>
        )}
      </div>
    </Modal>
  );
}
