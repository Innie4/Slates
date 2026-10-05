import { useMemo, useState } from "react";
import { AlertCircle, Check, FileSpreadsheet, Plus, Upload } from "lucide-react";
import {
  Alert, Badge, Button, ChoiceCard, DataTable, DescriptionList, Drawer, FileDrop, FilterBar, Input, Modal, Page, PageHeader, PhoneInput, Select,
  StatusBadge, useFilteredRows, useToast, type Column, type UploadedFile,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatDate, formatNaira } from "@/lib/format";
import { BLOCKS, ESTATE, PER_HOUSEHOLD, pointFor, properties as seed, type Block, type Property } from "./_data";

const STATUS_OPTIONS: Property["status"][] = ["Occupied", "Vacant", "Under renovation"];
const TYPE_OPTIONS = ["2-bed flat", "3-bed terrace", "3-bed bungalow", "4-bed semi-detached", "5-bed detached"];

/** D2 — every unit in the estate, its occupancy, association and collection status. */
export default function Properties() {
  const toast = useToast();
  const [rows, setRows] = useState<Property[]>(seed);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useFilteredRows(rows, {
    search,
    searchFields: (r) => `${r.unit} ${r.resident ?? ""} ${r.type}`,
    filters,
    filterFields: {
      block: (r) => `Block ${r.block}`,
      status: (r) => r.status,
      association: (r) => r.association,
      collection: (r) => r.collection,
    },
  });

  const byBlock = useMemo(
    () =>
      BLOCKS.map((b) => {
        const u = rows.filter((r) => r.block === b);
        return { block: b, units: u.length, occupied: u.filter((r) => r.status === "Occupied").length, map: u.map((r) => r.status === "Occupied") };
      }),
    [rows],
  );
  const occupied = rows.filter((r) => r.status === "Occupied").length;
  const activeBlock = filters.block?.replace("Block ", "");

  const columns: Column<Property>[] = [
    {
      key: "unit",
      header: "Unit",
      sortValue: (r) => r.unit,
      cell: (r) => (
        <div className="flex flex-col">
          <span className="t-mono font-semibold text-ink">{r.unit}</span>
          <span className="t-small text-ink-3">{r.type}</span>
        </div>
      ),
    },
    {
      key: "resident",
      header: "Resident",
      sortValue: (r) => r.resident ?? "zzz",
      cell: (r) => (r.resident ? <span className="text-ink">{r.resident}</span> : <span className="text-ink-3">No resident</span>),
    },
    { key: "status", header: "Property", sortValue: (r) => r.status, cell: (r) => <StatusPill status={r.status} /> },
    { key: "association", header: "Association", sortValue: (r) => r.association, cell: (r) => (r.association === "—" ? <span className="text-ink-3">—</span> : <AssocBadge a={r.association} />) },
    { key: "collection", header: "Collection", sortValue: (r) => r.collection, cell: (r) => <StatusBadge status={r.collection === "Not enrolled" ? "Inactive" : r.collection} className="[&]:whitespace-nowrap" /> },
    { key: "point", header: "Point", cell: (r) => <span className="t-mono text-ink-2">{r.point}</span>, hideOnMobile: true },
  ];

  const current = rows.find((r) => r.id === openId) ?? null;

  return (
    <Page>
      <PageHeader
        title="Properties"
        description={`${rows.length} units across Blocks A–H. ${occupied} occupied and billed through Slate; ${rows.length - occupied} vacant or under renovation.`}
        actions={
          <>
            <Button variant="outline" leading={<Upload className="size-4" />} onClick={() => setUploading(true)}>
              Bulk upload
            </Button>
            <Button leading={<Plus className="size-4" />} onClick={() => setAdding(true)}>
              Add property
            </Button>
          </>
        }
      />

      {/* Blocks as a map of the estate — also the quickest filter */}
      <nav aria-label="Filter by block">
        <div className="grid grid-cols-4 gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-8">
          {byBlock.map((b) => {
            const on = activeBlock === b.block;
            return (
              <button
                key={b.block}
                type="button"
                aria-pressed={on}
                onClick={() => setFilters((f) => ({ ...f, block: on ? "" : `Block ${b.block}` }))}
                className={cn("flex flex-col items-start gap-2 px-3 py-3 text-left transition-colors sm:px-4", on ? "bg-slate text-slate-ink dark:bg-stone dark:text-ink" : "bg-surface hover:bg-sunken")}
              >
                <span className="flex w-full items-baseline justify-between gap-2">
                  <span className="font-display text-[22px] font-bold leading-none">{b.block}</span>
                  <span className={cn("t-micro tnum", on ? "opacity-80" : "text-ink-2")}>
                    {b.occupied}/{b.units}
                  </span>
                </span>
                <span className="flex h-3 w-full gap-px" aria-hidden>
                  {b.map.map((occ, i) => (
                    <span
                      key={i}
                      className={cn(
                        "flex-1 rounded-[1px]",
                        occ ? (on ? "bg-slate-ink/90 dark:bg-ink" : "bg-slate/80 dark:bg-slate-400") : on ? "bg-white/25" : "bg-line-strong/60",
                      )}
                    />
                  ))}
                </span>
                <span className={cn("t-micro max-md:sr-only", on ? "opacity-80" : "text-ink-3")}>{b.units - b.occupied ? `${b.units - b.occupied} empty` : "Full"}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <section className="flex flex-col gap-4">
        <FilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Unit or resident"
          filters={[
            { key: "block", label: "Block", options: BLOCKS.map((b) => `Block ${b}`) },
            { key: "status", label: "Property", options: STATUS_OPTIONS },
            { key: "association", label: "Association", options: ["Member", "Pending", "Not joined"] },
            { key: "collection", label: "Collection", options: ["Active", "Paused", "Not enrolled"] },
          ]}
          values={filters}
          onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
          onExport={(f) => toast.success(`Properties exported as ${f}`, `${filtered.length} units, filtered as shown.`)}
        />
        <p className="t-small text-ink-3 tnum" aria-live="polite">
          {filtered.length === rows.length ? `All ${rows.length} units` : `${filtered.length} of ${rows.length} units`}
        </p>
        <DataTable
          rows={filtered}
          columns={columns}
          rowKey={(r) => r.id}
          pageSize={12}
          onRowClick={(r) => setOpenId(r.id)}
          mobile={(r) => (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-baseline gap-2">
                  <span className="t-mono font-semibold text-ink">{r.unit}</span>
                  <span className="t-small truncate text-ink">{r.resident ?? <span className="text-ink-3">No resident</span>}</span>
                </p>
                <p className="mt-0.5 t-small text-ink-3">
                  {r.type} · {r.association === "—" ? "Not in association" : r.association === "Member" ? "Association member" : `Association: ${r.association.toLowerCase()}`}
                </p>
              </div>
              <StatusPill status={r.status} />
            </div>
          )}
        />
      </section>

      <PropertyDrawer
        property={current}
        onClose={() => setOpenId(null)}
        onSave={(p) => {
          setRows((xs) => xs.map((x) => (x.id === p.id ? p : x)));
          toast.success(`${p.unit} updated`);
        }}
      />
      <AddPropertyModal
        open={adding}
        onClose={() => setAdding(false)}
        existing={rows}
        onAdd={(p) => {
          setRows((xs) => [...xs, p].sort((a, b) => a.unit.localeCompare(b.unit)));
          toast.success(`${p.unit} added`, p.status === "Occupied" ? `${p.resident} will get an invite to pay through Slate.` : "Marked vacant — it won't be billed.");
        }}
      />
      <BulkUploadModal
        open={uploading}
        onClose={() => setUploading(false)}
        existing={rows}
        onImport={(ps) => {
          setRows((xs) => [...xs, ...ps].sort((a, b) => a.unit.localeCompare(b.unit)));
          toast.success(`${ps.length} properties imported`, "Residents with phone numbers get an invite today.");
        }}
      />
    </Page>
  );
}

function StatusPill({ status }: { status: Property["status"] }) {
  return <Badge tone={status === "Occupied" ? "neutral" : status === "Vacant" ? "outline" : "warning"} dot={status !== "Occupied"}>{status}</Badge>;
}

function AssocBadge({ a }: { a: Property["association"] }) {
  return <Badge tone={a === "Member" ? "neutral" : a === "Pending" ? "warning" : "outline"} dot={a !== "Member"}>{a}</Badge>;
}

/* ------------------------------------------------------------------ */

function PropertyDrawer({ property, onClose, onSave }: { property: Property | null; onClose: () => void; onSave: (p: Property) => void }) {
  const [status, setStatus] = useState<Property["status"]>("Occupied");
  const [association, setAssociation] = useState<Property["association"]>("Member");
  const [collection, setCollection] = useState<Property["collection"]>("Active");
  const [key, setKey] = useState<string | null>(null);
  if (property && key !== property.id) {
    setKey(property.id);
    setStatus(property.status);
    setAssociation(property.association);
    setCollection(property.collection);
  }
  if (!property) return <Drawer open={false} onClose={onClose} />;
  const dirty = status !== property.status || association !== property.association || collection !== property.collection;
  const point = pointFor(property.block);
  return (
    <Drawer
      open
      onClose={onClose}
      title={`Unit ${property.unit}`}
      description={`${property.type} · Block ${property.block}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button
            disabled={!dirty}
            onClick={() => {
              onSave({
                ...property,
                status,
                association: status === "Occupied" ? (association === "—" ? "Pending" : association) : "—",
                collection: status === "Occupied" ? collection : status === "Vacant" ? "Not enrolled" : "Paused",
                payment: status === "Occupied" ? property.payment : "—",
              });
              onClose();
            }}
          >
            Save changes
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-7">
        <DescriptionList
          dense
          items={[
            { label: "Resident", value: property.resident ?? "No resident" },
            { label: "Phone", value: property.phone ?? "—" },
            { label: "Collection point", value: `${point.id} · ${point.name}` },
            { label: "Resident since", value: property.since ? formatDate(property.since) : "—" },
            { label: "October contribution", value: property.payment === "—" ? "Not billed" : `${property.payment} · ${formatNaira(property.paid)} of ${formatNaira(PER_HOUSEHOLD)}` },
          ]}
        />
        <div className="flex flex-col gap-4 border-t border-line pt-6">
          <h3 className="t-h3 text-ink">Status</h3>
          <Select label="Property" value={status} onChange={(e) => setStatus(e.target.value as Property["status"])} options={STATUS_OPTIONS} hint={status !== "Occupied" ? "Vacant and renovating units aren't billed and get no collection." : undefined} />
          {status === "Occupied" && (
            <>
              <Select label="Residents association" value={association === "—" ? "Pending" : association} onChange={(e) => setAssociation(e.target.value as Property["association"])} options={["Member", "Pending", "Not joined"]} />
              <Select label="Collection" value={collection} onChange={(e) => setCollection(e.target.value as Property["collection"])} options={["Active", "Paused"]} hint={collection === "Paused" ? "Paused units are skipped by the crew and not billed from next month." : undefined} />
            </>
          )}
        </div>
      </div>
    </Drawer>
  );
}

function nextUnit(existing: Property[], block: Block) {
  const nums = existing.filter((p) => p.block === block).map((p) => Number(p.unit.slice(2)));
  return `${block}-${String(Math.max(0, ...nums) + 1).padStart(2, "0")}`;
}

function AddPropertyModal({ open, onClose, existing, onAdd }: { open: boolean; onClose: () => void; existing: Property[]; onAdd: (p: Property) => void }) {
  const [block, setBlock] = useState<Block>("A");
  const [unit, setUnit] = useState("");
  const [type, setType] = useState(TYPE_OPTIONS[1]!);
  const [occupied, setOccupied] = useState(true);
  const [resident, setResident] = useState("");
  const [phone, setPhone] = useState("");
  const [tried, setTried] = useState(false);
  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setBlock("A");
    setUnit(nextUnit(existing, "A"));
    setType(TYPE_OPTIONS[1]!);
    setOccupied(true);
    setResident("");
    setPhone("");
    setTried(false);
  }
  if (!open && wasOpen) setWasOpen(false);
  const u = unit.trim().toUpperCase();
  const errors = {
    unit: !/^[A-H]-\d{2,3}$/.test(u) ? "Use the block letter and number, e.g. A-41" : u[0] !== block ? `Unit should start with ${block}-` : existing.some((p) => p.unit === u) ? `${u} already exists` : undefined,
    resident: occupied && resident.trim().split(/\s+/).length < 2 ? "Enter the resident's first and last name" : undefined,
    phone: occupied && phone.replace(/\D/g, "").length < 10 ? "Enter a 10-digit number after +234" : undefined,
  };
  const valid = !Object.values(errors).some(Boolean);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add property"
      description="New units join the next collection after Slate confirms them, usually within a day."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              setTried(true);
              if (!valid) return;
              onAdd({
                id: `prop-${u}`, unit: u, block, type, status: occupied ? "Occupied" : "Vacant", resident: occupied ? resident.trim() : undefined,
                phone: occupied ? `+234 ${phone.trim()}` : undefined, association: occupied ? "Pending" : "—", collection: occupied ? "Active" : "Not enrolled",
                payment: occupied ? "Unpaid" : "—", paid: 0, point: pointFor(block).id, since: occupied ? "2026-10-05" : undefined, account: occupied ? "Inactive" : "—",
              });
              onClose();
            }}
          >
            Add property
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Block"
            value={block}
            onChange={(e) => {
              const b = e.target.value as Block;
              setBlock(b);
              setUnit(nextUnit(existing, b));
            }}
            options={BLOCKS.map((b) => ({ value: b, label: `Block ${b}` }))}
          />
          <Input label="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} error={tried ? errors.unit : undefined} className="t-mono uppercase" />
        </div>
        <Select label="Property type" value={type} onChange={(e) => setType(e.target.value)} options={TYPE_OPTIONS} />
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Occupancy">
          <ChoiceCard selected={occupied} onSelect={() => setOccupied(true)} title="Occupied" description={`Billed ${formatNaira(PER_HOUSEHOLD)} a month`} />
          <ChoiceCard selected={!occupied} onSelect={() => setOccupied(false)} title="Vacant" description="Not billed, not collected" />
        </div>
        {occupied && (
          <>
            <Input label="Resident" value={resident} onChange={(e) => setResident(e.target.value)} placeholder="Idara Nkanga" error={tried ? errors.resident : undefined} autoComplete="off" />
            <PhoneInput label="Resident's phone" value={phone} onChange={(e) => setPhone(e.target.value)} error={tried ? errors.phone : undefined} hint="They get an SMS invite to activate their Slate account." />
          </>
        )}
        <p className="t-small text-ink-3">Collection point: {pointFor(block).id} · {pointFor(block).name}</p>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */

interface CsvRow {
  line: number;
  unit: string;
  type: string;
  status: string;
  resident: string;
  phone: string;
  error?: string;
}
const SAMPLE: Omit<CsvRow, "error">[] = [
  { line: 2, unit: "A-41", type: "3-bed terrace", status: "Occupied", resident: "Inemesit Obot", phone: "8034417720" },
  { line: 3, unit: "A-42", type: "3-bed terrace", status: "Occupied", resident: "Edidiong Ekanem", phone: "8132260941" },
  { line: 4, unit: "B-12", type: "3-bed terrace", status: "Occupied", resident: "Ofonime Ita", phone: "7069913302" },
  { line: 5, unit: "D-45", type: "2-bed flat", status: "Vacant", resident: "", phone: "" },
  { line: 6, unit: "D-46", type: "2-bed flat", status: "Occupied", resident: "Chidinma Okafor", phone: "81022" },
  { line: 7, unit: "J-01", type: "4-bed semi-detached", status: "Occupied", resident: "Tunde Adeyemi", phone: "9054418823" },
  { line: 8, unit: "G-41", type: "4-bed semi-detached", status: "Occupied", resident: "Unwana Ntuk", phone: "8167720094" },
  { line: 9, unit: "H-39", type: "3-bed bungalow", status: "Occupied", resident: "Ekaette Umoh", phone: "8039912288" },
];

function validate(rows: Omit<CsvRow, "error">[], existing: Property[]): CsvRow[] {
  return rows.map((r) => {
    let error: string | undefined;
    if (!/^[A-H]-\d{2,3}$/.test(r.unit)) error = `Block ${r.unit.split("-")[0]} doesn't exist in this estate`;
    else if (existing.some((p) => p.unit === r.unit)) error = `${r.unit} already exists`;
    else if (r.status === "Occupied" && r.phone.replace(/\D/g, "").length < 10) error = "Phone number is too short";
    return { ...r, error };
  });
}

function BulkUploadModal({ open, onClose, existing, onImport }: { open: boolean; onClose: () => void; existing: Property[]; onImport: (p: Property[]) => void }) {
  const toast = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [parsed, setParsed] = useState<CsvRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const reset = () => {
    setFiles([]);
    setParsed(null);
  };
  const load = (f: UploadedFile[]) => {
    setFiles(f);
    if (!f.length) return setParsed(null);
    setBusy(true);
    setTimeout(() => {
      setParsed(validate(SAMPLE, existing));
      setBusy(false);
    }, 700);
  };
  const ok = parsed?.filter((r) => !r.error) ?? [];
  const bad = parsed?.filter((r) => r.error) ?? [];
  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      size="xl"
      title="Bulk upload properties"
      description="One row per unit. Columns: unit, type, status, resident, phone."
      footer={
        <>
          <Button variant="ghost" onClick={() => (parsed ? reset() : onClose())}>{parsed ? "Choose another file" : "Cancel"}</Button>
          <Button
            disabled={!ok.length}
            onClick={() => {
              onImport(
                ok.map((r) => {
                  const block = r.unit[0] as Block;
                  const occ = r.status === "Occupied";
                  return {
                    id: `prop-${r.unit}`, unit: r.unit, block, type: r.type, status: occ ? "Occupied" : "Vacant", resident: occ ? r.resident : undefined,
                    phone: occ ? `+234 ${r.phone.slice(0, 3)} ${r.phone.slice(3, 6)} ${r.phone.slice(6)}` : undefined, association: occ ? "Pending" : "—",
                    collection: occ ? "Active" : "Not enrolled", payment: occ ? "Unpaid" : "—", paid: 0, point: pointFor(block).id, since: occ ? "2026-10-05" : undefined, account: occ ? "Inactive" : "—",
                  } satisfies Property;
                }),
              );
              reset();
              onClose();
            }}
          >
            {ok.length ? `Import ${ok.length} valid row${ok.length === 1 ? "" : "s"}` : "Import"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        {!parsed && (
          <>
            <FileDrop label="CSV file" accept=".csv,text/csv" multiple={false} hint="CSV up to 2 MB · up to 500 rows" files={files} onFiles={load} />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Button variant="link" leading={<FileSpreadsheet className="size-4" />} onClick={() => toast.success("Template downloaded", "shelter-afrique-properties-template.csv")}>
                Download the template
              </Button>
              <Button variant="link" onClick={() => load([{ name: "new-units-oct.csv", size: 1840, type: "text/csv" }])}>
                Try with a sample file
              </Button>
            </div>
            {busy && <p className="t-small text-ink-3">Checking rows…</p>}
          </>
        )}
        {parsed && (
          <>
            <div className="flex flex-col gap-1">
              <p className="t-body text-ink">
                <span className="font-semibold">{files[0]?.name}</span> · {parsed.length} rows read
              </p>
              <p className="t-small text-ink-2">
                <span className="font-medium text-success">{ok.length} ready to import</span>
                {bad.length > 0 && (
                  <>
                    {" · "}
                    <span className="font-medium text-danger">{bad.length} need fixing</span>. Rows with errors are skipped; fix them and upload again.
                  </>
                )}
              </p>
            </div>
            {bad.length > 0 && (
              <Alert tone="danger" title={`${bad.length} rows won't be imported`}>
                {bad.map((r) => `Row ${r.line}: ${r.error}`).join(" · ")}
              </Alert>
            )}
            <div className="overflow-hidden rounded-md border border-line">
              <div className="hidden grid-cols-[3rem_5rem_1fr_1fr_8rem_minmax(0,1.4fr)] gap-3 border-b border-line bg-sunken/60 px-4 py-2 t-micro text-ink-3 md:grid">
                <span>Row</span>
                <span>Unit</span>
                <span>Resident</span>
                <span>Type</span>
                <span>Phone</span>
                <span>Check</span>
              </div>
              <ul className="divide-y divide-line">
                {parsed.map((r) => (
                  <li key={r.line} className={cn("grid grid-cols-[auto_1fr_auto] items-start gap-x-3 gap-y-0.5 px-4 py-2.5 md:grid-cols-[3rem_5rem_1fr_1fr_8rem_minmax(0,1.4fr)] md:items-center", r.error && "bg-danger-bg/50")}>
                    <span className="t-mono text-ink-3">{r.line}</span>
                    <span className="t-mono font-semibold text-ink md:order-none">{r.unit}</span>
                    <span className="t-small text-ink max-md:col-start-2 max-md:row-start-2">{r.resident || <span className="text-ink-3">Vacant</span>}</span>
                    <span className="t-small text-ink-2 max-md:hidden">{r.type}</span>
                    <span className="t-mono text-ink-2 max-md:hidden">{r.phone || "—"}</span>
                    <span className={cn("flex items-center gap-1.5 t-small max-md:col-start-3 max-md:row-start-1 max-md:justify-end", r.error ? "text-danger" : "text-success")}>
                      {r.error ? <AlertCircle className="size-4 shrink-0" /> : <Check className="size-4 shrink-0" strokeWidth={2.5} />}
                      <span className="max-md:sr-only">{r.error ?? "Ready"}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="t-small text-ink-3">Imported units are billed from the 1st of next month. {ESTATE.operator} adds them to the route after Slate confirms.</p>
          </>
        )}
      </div>
    </Modal>
  );
}
