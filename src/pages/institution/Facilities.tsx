import { useMemo, useState } from "react";
import { ChevronRight, MapPin, Plus } from "lucide-react";
import {
  Alert, Badge, Button, ButtonLink, ChipGroup, DataTable, DescriptionList, Drawer, FilterBar, Input, Modal, Page, PageHeader,
  Select, Tabs, Textarea, useFilteredRows, useTab, useToast, type Column,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatNaira, formatNumber, formatRelative } from "@/lib/format";
import { facilities, facilityById, OPERATORS, STREAMS, wasteLocations, type Facility, type FacilityId, type WasteLocation, type WasteStream } from "./_data";
import { CampusMap } from "./_shared";

const CONTAINERS = ["240 L bin", "240 L lockable bin", "240 L food caddy", "1,100 L bin", "6 m³ skip", "200 L drum", "Mesh cage"];
const FREQUENCIES = ["Daily", "Mon–Sat", "Weekdays", "Mon, Wed, Fri", "Mon, Thu", "Weekly", "On request"];
const KINDS: Facility["kind"][] = ["Academic", "Administrative", "Medical", "Residential", "Staff housing", "Sports", "Catering"];

const capacity = (l: WasteLocation) => {
  const total = l.bins * l.capacityL;
  return total >= 1000 ? `${(total / 1000).toFixed(1).replace(/\.0$/, "")} m³` : `${formatNumber(total)} L`;
};

interface NewFacility { id: string; name: string; kind: string; address: string; population: string }

export default function Facilities() {
  const toast = useToast();
  const view = useTab<"facilities" | "locations">("view", "facilities");
  const [locations, setLocations] = useState<WasteLocation[]>(wasteLocations);
  const [added, setAdded] = useState<NewFacility[]>([]);
  const [open, setOpen] = useState<FacilityId | null>(null);
  const [pin, setPin] = useState<string | null>(null);
  const [hover, setHover] = useState<FacilityId | null>(null);
  const [addFacility, setAddFacility] = useState(false);
  const [addLocation, setAddLocation] = useState<FacilityId | "" | null>(null);

  const bins = locations.filter((l) => !l.specialist).reduce((a, l) => a + l.bins, 0);
  const openFacility = (id: FacilityId, pinId: string | null = null) => {
    setOpen(id);
    setPin(pinId);
  };

  return (
    <Page>
      <PageHeader
        title="Facilities"
        description={`${facilities.length + added.length} facilities with ${locations.length} waste locations and ${formatNumber(bins)} bins, across the main campus and the medical campus.`}
        actions={
          <>
            <Button variant="secondary" leading={<MapPin className="size-4" />} onClick={() => setAddLocation("")}>Add waste location</Button>
            <Button leading={<Plus className="size-4" />} onClick={() => setAddFacility(true)}>Add facility</Button>
          </>
        }
      />

      <Tabs
        param="view"
        items={[
          { value: "facilities", label: "Facilities", count: facilities.length + added.length },
          { value: "locations", label: "Waste locations", count: locations.length },
        ]}
      />

      {view === "facilities" ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-10">
          <figure className="flex flex-col gap-3 lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-lg bg-sunken p-2 sm:p-4">
              <CampusMap tone="on-light" selected={hover} onSelect={(id) => openFacility(id)} label="Campus plan. Select a facility to see its waste locations." />
            </div>
            <figcaption className="t-small text-ink-3">Main campus plan with the medical campus across Ikpa Road. Select a building to see its bin points.</figcaption>
          </figure>

          <ul className="divide-y divide-line border-y border-line lg:self-start">
            {facilities.map((f) => {
              const locs = locations.filter((l) => l.facilityId === f.id);
              const issues = locs.filter((l) => l.issue).length;
              return (
                <li key={f.id} onMouseEnter={() => setHover(f.id)} onMouseLeave={() => setHover(null)}>
                  <button type="button" onClick={() => openFacility(f.id)} className="group -mx-2 flex w-[calc(100%+1rem)] items-center gap-4 rounded-md px-2 py-4 text-left transition-colors hover:bg-sunken/70">
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate t-body font-medium text-ink">{f.name}</span>
                      </span>
                      <span className="mt-0.5 block truncate t-small text-ink-2">
                        {f.kind} · {OPERATORS[f.operator].short} · {f.schedule}
                      </span>
                      <span className="mt-1 block t-micro text-ink-3 tnum">
                        {locs.length} waste locations · {locs.filter((l) => !l.specialist).reduce((a, l) => a + l.bins, 0)} bins · {formatNumber(f.population)} {f.populationLabel}
                      </span>
                    </span>
                    {issues > 0 && <Badge tone="warning" dot>{issues === 1 ? "1 issue" : `${issues} issues`}</Badge>}
                    <ChevronRight className="size-4 shrink-0 text-ink-3" />
                  </button>
                </li>
              );
            })}
            {added.map((f) => (
              <li key={f.id} className="flex items-center gap-4 py-4">
                <span className="min-w-0 flex-1">
                  <span className="block truncate t-body font-medium text-ink">{f.name}</span>
                  <span className="mt-0.5 block truncate t-small text-ink-2">{f.kind} · {f.address}</span>
                  <span className="mt-1 block t-micro text-ink-3">Site survey booked. Slate will map bin points and propose a schedule.</span>
                </span>
                <Badge tone="info" dot>Survey pending</Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <LocationsTable locations={locations} onOpen={(l) => openFacility(l.facilityId, l.id)} />
      )}

      <FacilityDrawer
        id={open}
        locations={locations}
        pin={pin}
        onPin={setPin}
        onClose={() => setOpen(null)}
        onAddLocation={(id) => setAddLocation(id)}
      />

      <AddFacilityModal
        open={addFacility}
        onClose={() => setAddFacility(false)}
        onAdd={(f) => {
          setAdded((a) => [...a, f]);
          toast.success(`${f.name} added`, "Slate will book a site survey within 3 working days.");
        }}
      />
      <AddLocationModal
        open={addLocation !== null}
        initialFacility={addLocation || ""}
        onClose={() => setAddLocation(null)}
        onAdd={(l) => {
          setLocations((xs) => [...xs, l]);
          toast.success("Waste location added", `${l.name} joins the ${facilityById(l.facilityId).short.toLowerCase()} schedule from the next collection.`);
        }}
        nextId={`WL-N${String(locations.length + 1).padStart(2, "0")}`}
      />
    </Page>
  );
}

/* ------------------------------------------------------------------ */

function LocationsTable({ locations, onOpen }: { locations: WasteLocation[]; onOpen: (l: WasteLocation) => void }) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const rows = useFilteredRows(locations, {
    search,
    searchFields: (l) => `${l.id} ${l.name} ${facilityById(l.facilityId).name} ${l.container}`,
    filters,
    filterFields: { facility: (l) => facilityById(l.facilityId).short, stream: (l) => l.stream },
  });
  const columns: Column<WasteLocation>[] = [
    {
      key: "name", header: "Location", sortValue: (l) => l.name,
      cell: (l) => (
        <span className="flex flex-col">
          <span className="font-medium text-ink">{l.name}</span>
          <span className="t-mono text-[12px] text-ink-3">{l.id}</span>
        </span>
      ),
    },
    { key: "facility", header: "Facility", sortValue: (l) => l.facilityId, cell: (l) => facilityById(l.facilityId).short },
    { key: "bins", header: "Bins", align: "right", sortValue: (l) => l.bins, cell: (l) => <span className="tnum">{l.bins} × {l.container}</span> },
    { key: "capacity", header: "Capacity", align: "right", sortValue: (l) => l.bins * l.capacityL, cell: (l) => <span className="tnum">{capacity(l)}</span> },
    { key: "stream", header: "Stream", cell: (l) => (l.specialist ? <Badge tone="outline">Specialist only</Badge> : l.stream) },
    { key: "frequency", header: "Frequency", cell: (l) => l.frequency },
    {
      key: "last", header: "Last collected", sortValue: (l) => l.lastCollected ?? "", align: "right",
      cell: (l) => (l.issue ? <Badge tone="warning" dot>Issue</Badge> : <span className="tnum text-ink-2">{l.lastCollected ? formatRelative(l.lastCollected) : "Not set"}</span>),
    },
  ];
  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search locations"
        filters={[
          { key: "facility", label: "Facility", options: facilities.map((f) => f.short) },
          { key: "stream", label: "Stream", options: [...STREAMS, "Hazardous medical (specialist)"] },
        ]}
        values={filters}
        onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
      />
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(l) => l.id}
        onRowClick={onOpen}
        pageSize={12}
        mobile={(l) => (
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="t-body font-medium text-ink">{l.name}</p>
              <p className="t-small text-ink-2">{facilityById(l.facilityId).short} · {l.bins} × {l.container}</p>
              <p className="t-micro text-ink-3">{l.specialist ? "Licensed specialist only" : `${l.stream} · ${l.frequency}`}</p>
            </div>
            {l.issue ? <Badge tone="warning" dot>Issue</Badge> : <span className="t-small text-ink-3 tnum">{capacity(l)}</span>}
          </div>
        )}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function FacilityDrawer({
  id, locations, pin, onPin, onClose, onAddLocation,
}: {
  id: FacilityId | null;
  locations: WasteLocation[];
  pin: string | null;
  onPin: (id: string | null) => void;
  onClose: () => void;
  onAddLocation: (id: FacilityId) => void;
}) {
  const f = id ? facilityById(id) : null;
  const locs = useMemo(() => (id ? locations.filter((l) => l.facilityId === id) : []), [id, locations]);
  const mapped = locs.filter((l) => l.x > 0);
  const active = locs.find((l) => l.id === pin);
  return (
    <Drawer
      open={!!f}
      onClose={onClose}
      width="lg"
      title={f?.name}
      description={f ? `${f.kind} · ${f.address}` : undefined}
      footer={
        f && (
          <>
            <ButtonLink to={`/institution/services?facility=${f.id}`} variant="ghost">Request service</ButtonLink>
            <Button leading={<Plus className="size-4" />} onClick={() => onAddLocation(f.id)}>Add waste location</Button>
          </>
        )
      }
    >
      {f && (
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-3">
            <div className="overflow-hidden rounded-lg bg-sunken p-2">
              <CampusMap tone="on-light" focus={f.id} pins={mapped} activePin={pin} onPin={(p) => onPin(p === pin ? null : p)} label={`${f.name} with its waste locations`} />
            </div>
            <p className="t-small text-ink-3">
              {active ? (
                <>
                  <span className="font-medium text-ink">{active.name}.</span> {active.bins} × {active.container}, {capacity(active)} in total. {active.frequency}.
                  {active.access && ` ${active.access}.`}
                </>
              ) : (
                "Numbers match the list below. Select a pin to see the bin point."
              )}
            </p>
          </div>

          {f.note && <Alert tone="neutral" title="Hazardous medical waste is handled separately">{f.note}</Alert>}

          <DescriptionList
            dense
            items={[
              { label: "Facility contact", value: <>{f.manager}<span className="block t-small text-ink-3">{f.managerRole} · {f.managerPhone}</span></> },
              { label: "Schedule", value: f.schedule },
              { label: "Operator", value: <>{OPERATORS[f.operator].short}<span className="block t-small text-ink-3">Contract {f.contract}</span></> },
              { label: "Served", value: `${formatNumber(f.population)} ${f.populationLabel}` },
              { label: "Waste streams", value: f.streams.join(", ") },
              { label: "September", value: <span className="tnum">{(f.monthlyKg / 1000).toFixed(1)} t · {formatNaira(f.monthlyCost)}</span> },
            ]}
          />

          <section className="flex flex-col gap-2">
            <h3 className="t-h3 text-ink">Waste locations</h3>
            <ol className="divide-y divide-line border-y border-line">
              {locs.map((l, i) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => onPin(l.id === pin ? null : l.id)}
                    className={cn("-mx-2 flex w-[calc(100%+1rem)] items-start gap-3 rounded-md px-2 py-3 text-left transition-colors hover:bg-sunken/70", l.id === pin && "bg-sunken")}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold tnum",
                        l.id === pin ? "bg-signal text-signal-ink" : l.specialist ? "border border-dashed border-ink text-ink" : "bg-ink text-surface",
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block t-small font-medium text-ink">{l.name}</span>
                      <span className="block t-small text-ink-2 tnum">
                        {l.bins} × {l.container} · {capacity(l)} · {l.specialist ? "licensed specialist only" : l.stream}
                      </span>
                      <span className="block t-micro text-ink-3">
                        {l.frequency}
                        {l.lastCollected && ` · last collected ${formatRelative(l.lastCollected)}`}
                      </span>
                      {l.issue && <span className="mt-1 block t-micro font-medium text-warning">{l.issue}</span>}
                    </span>
                    <span className="t-mono text-[12px] text-ink-3">{l.id}</span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </Drawer>
  );
}

/* ------------------------------------------------------------------ */

function AddFacilityModal({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (f: NewFacility) => void }) {
  const [form, setForm] = useState({ name: "", kind: "", address: "", population: "", notes: "" });
  const [streams, setStreams] = useState<string[]>(["General"]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const close = () => {
    setForm({ name: "", kind: "", address: "", population: "", notes: "" });
    setStreams(["General"]);
    setErrors({});
    onClose();
  };
  const submit = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 3) e.name = "Give the facility a name people on campus would recognise.";
    if (!form.kind) e.kind = "Choose the type of facility.";
    if (form.address.trim().length < 4) e.address = "Add where the facility is, so the crew can find it.";
    if (form.population && !/^\d[\d,]*$/.test(form.population)) e.population = "Use a whole number, such as 450.";
    if (!streams.length) e.streams = "Choose at least one waste stream.";
    setErrors(e);
    if (Object.keys(e).length) return;
    onAdd({ id: `new-${Date.now()}`, name: form.name.trim(), kind: form.kind, address: form.address.trim(), population: form.population });
    close();
  };
  return (
    <Modal
      open={open}
      onClose={close}
      title="Add a facility"
      description="Slate surveys new facilities before they join a schedule, so bin points and frequencies are right from the first lift."
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button onClick={submit}>Add and book survey</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Input label="Facility name" placeholder="e.g. Postgraduate hostel" value={form.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
        <Select label="Type" placeholder="Choose a type" options={KINDS} value={form.kind} onChange={(e) => set("kind", e.target.value)} error={errors.kind} />
        <Input label="Location on campus" placeholder="e.g. Behind the senate car park" value={form.address} onChange={(e) => set("address", e.target.value)} error={errors.address} leading={<MapPin />} />
        <Input label="People served" optional inputMode="numeric" placeholder="e.g. 450" value={form.population} onChange={(e) => set("population", e.target.value)} error={errors.population} hint="Residents, staff, beds or daily visitors. Used for cost-per-head reporting." />
        <div className="flex flex-col gap-1.5">
          <span className="t-small font-medium text-ink">Waste streams</span>
          <ChipGroup options={STREAMS} value={streams} onChange={setStreams} />
          {errors.streams && <p className="t-small text-danger">{errors.streams}</p>}
        </div>
        <Textarea label="Notes for the survey" optional rows={3} placeholder="Access times, gate contacts, anything the crew should know" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>
    </Modal>
  );
}

function AddLocationModal({
  open, initialFacility, onClose, onAdd, nextId,
}: {
  open: boolean;
  initialFacility: FacilityId | "";
  onClose: () => void;
  onAdd: (l: WasteLocation) => void;
  nextId: string;
}) {
  const blank = { facility: "", name: "", container: "", bins: "1", stream: "", frequency: "", access: "" };
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [seeded, setSeeded] = useState<string | null>(null);
  if (open && seeded !== initialFacility) {
    setSeeded(initialFacility);
    setForm({ ...blank, facility: initialFacility });
  }
  const set = (k: keyof typeof blank, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const close = () => {
    setErrors({});
    setSeeded(null);
    onClose();
  };
  const submit = () => {
    const e: Record<string, string> = {};
    if (!form.facility) e.facility = "Choose the facility this bin point belongs to.";
    if (form.name.trim().length < 3) e.name = "Describe where the bins are, e.g. “Rear of block B”.";
    if (!form.container) e.container = "Choose a container type.";
    const n = Number(form.bins);
    if (!Number.isInteger(n) || n < 1 || n > 60) e.bins = "Between 1 and 60 bins.";
    if (!form.stream) e.stream = "Choose what goes in these bins.";
    if (!form.frequency) e.frequency = "Choose how often it should be collected.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const capacityL = Number((form.container.match(/^[\d,]+/)?.[0] ?? "240").replace(",", "")) * (form.container.includes("m³") ? 1000 : 1);
    onAdd({
      id: nextId, facilityId: form.facility as FacilityId, name: form.name.trim(), container: form.container, bins: n,
      capacityL: form.container === "Mesh cage" ? 2000 : capacityL, stream: form.stream as WasteStream, frequency: form.frequency, access: form.access || undefined, x: 0, y: 0,
    });
    close();
  };
  return (
    <Modal
      open={open}
      onClose={close}
      title="Add a waste location"
      description="A bin point the crew collects from. It joins the facility's next scheduled run."
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button onClick={submit}>Add location</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Select label="Facility" placeholder="Choose a facility" options={facilities.map((f) => ({ value: f.id, label: f.name }))} value={form.facility} onChange={(e) => set("facility", e.target.value)} error={errors.facility} />
        <Input label="Where the bins are" placeholder="e.g. Faculty of Law, side entrance" value={form.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_7rem]">
          <Select label="Container" placeholder="Choose" options={CONTAINERS} value={form.container} onChange={(e) => set("container", e.target.value)} error={errors.container} />
          <Input label="Bins" inputMode="numeric" value={form.bins} onChange={(e) => set("bins", e.target.value.replace(/\D/g, ""))} error={errors.bins} className="tnum" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Waste stream" placeholder="Choose" options={STREAMS} value={form.stream} onChange={(e) => set("stream", e.target.value)} error={errors.stream} />
          <Select label="Frequency" placeholder="Choose" options={FREQUENCIES} value={form.frequency} onChange={(e) => set("frequency", e.target.value)} error={errors.frequency} />
        </div>
        {form.stream === "Non-hazardous medical" && (
          <Alert tone="warning" title="Non-hazardous only">
            Sharps, infectious, anatomical and pharmaceutical waste can't go in Slate bins. They go to the licensed specialist's holding room.
          </Alert>
        )}
        <Textarea label="Access notes" optional rows={2} placeholder="Gate times, who holds the key" value={form.access} onChange={(e) => set("access", e.target.value)} />
      </div>
    </Modal>
  );
}
