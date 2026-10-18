import { useState } from "react";
import { useSearchParams } from "react-router";
import { CalendarPlus, MoreHorizontal, Package, PartyPopper, Plus, Recycle, Repeat, Shovel } from "lucide-react";
import {
  Alert, Badge, Button, ChoiceCard, ConfirmDialog, DescriptionList, IconButton, DatePicker, Input, Menu, Modal, Page, PageHeader, Select, Stepper,
  StatusBadge, Textarea, useToast,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatDay, formatNaira } from "@/lib/format";
import { activeServices, facilities, facilityById, serviceRequests, wasteLocations, type ActiveService, type FacilityId, type ServiceRequest } from "./_data";
import { operatorName } from "./_shared";

const TYPES: Array<{ value: ServiceRequest["type"]; title: string; description: string; price: string; icon: typeof Plus }> = [
  { value: "Extra collection", title: "Extra collection", description: "One more lift on top of the schedule, same crew.", price: "₦18,500 per lift under CT-UYO-014", icon: Repeat },
  { value: "Bulk waste", title: "Bulk waste", description: "Furniture, lab benches, old equipment.", price: "Quoted within 2 working hours", icon: Package },
  { value: "Special collection", title: "Special collection", description: "Construction debris, garden clearance, skips.", price: "Quoted after a site visit", icon: Shovel },
  { value: "Event cleanup", title: "Event cleanup", description: "Matriculation, convocation, games, conferences.", price: "Quoted from the guest count", icon: PartyPopper },
  { value: "Recycling", title: "Recycling pickup", description: "Sorted paper, PET, cans or e-waste.", price: "Usually free; e-waste quoted", icon: Recycle },
];

const WINDOWS = ["06:00–08:00", "08:00–10:00", "10:00–12:00", "12:00–14:00", "14:00–16:00", "After 18:00 (events)"];

export default function Services() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const filter = (params.get("facility") as FacilityId | null) ?? "all";
  const [services, setServices] = useState<ActiveService[]>(activeServices);
  const [requests, setRequests] = useState<ServiceRequest[]>(serviceRequests);
  const [requestOpen, setRequestOpen] = useState(false);
  const [pausing, setPausing] = useState<ActiveService | null>(null);

  const setFilter = (v: string) => {
    const next = new URLSearchParams(params);
    if (v === "all") next.delete("facility");
    else next.set("facility", v);
    setParams(next, { replace: true });
  };

  const billed = services.filter((s) => s.status !== "Paused").reduce((a, s) => a + s.monthly, 0);
  const shown = facilities.filter((f) => filter === "all" || f.id === filter);
  const open = requests.filter((r) => r.status !== "Completed" && r.status !== "Cancelled");
  const done = requests.filter((r) => r.status === "Completed");

  return (
    <Page>
      <PageHeader
        title="Services"
        description={`${services.length} services across ${facilities.length} facilities, ${formatNaira(billed)} a month under two contracts. Hazardous medical waste stays with the licensed specialist.`}
        actions={<Button leading={<CalendarPlus className="size-4" />} onClick={() => setRequestOpen(true)}>Request service</Button>}
      />

      <section className="flex flex-col gap-3">
        <h2 className="t-h2 text-ink">Requests</h2>
        <ul className="divide-y divide-line border-y border-line">
          {[...open, ...done.slice(0, 2)].map((r) => (
            <li key={r.id} className="flex items-start gap-3 py-3.5 sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="t-body font-medium text-ink">{r.title}</p>
                <p className="t-small text-ink-2">
                  {r.type} · {facilityById(r.facilityId).short} · {formatDay(r.date)}
                  <span className="max-sm:hidden"> · requested by {r.by}</span>
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-4">
                {r.amount !== undefined && <span className="t-mono text-ink-2">{formatNaira(r.amount)}</span>}
                <StatusBadge status={r.status} />
              </div>
              <span className="t-mono text-[12px] text-ink-3 max-sm:hidden">{r.id}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <h2 className="t-h2 text-ink">Active services</h2>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 scrollbar-none md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Filter by facility">
            {[{ value: "all", label: "All facilities" }, ...facilities.map((f) => ({ value: f.id, label: f.short }))].map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={filter === o.value}
                onClick={() => setFilter(o.value)}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center rounded-sm border px-3 text-[14px] font-medium transition",
                  filter === o.value ? "border-ink bg-ink text-surface" : "border-line-strong bg-surface text-ink-2 hover:border-ink-3 hover:text-ink",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {shown.map((f) => {
            const list = services.filter((s) => s.facilityId === f.id);
            const sum = list.filter((s) => s.status !== "Paused").reduce((a, s) => a + s.monthly, 0);
            return (
              <section key={f.id} className="flex flex-col gap-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="t-h3 text-ink">{f.name}</h3>
                  <p className="t-small text-ink-3 tnum">{operatorName(f.operator)} · {formatNaira(sum)} a month</p>
                </div>
                <ul className="divide-y divide-line border-y border-line">
                  {list.map((s) => (
                    <li key={s.id} className="flex items-start gap-3 py-3.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                          <p className="t-body font-medium text-ink">{s.name}</p>
                          {s.status !== "Active" && (
                            <Badge tone={s.status === "Paused" ? "warning" : s.status === "Specialist" ? "outline" : "info"} dot={s.status !== "Specialist"}>
                              {s.status}
                            </Badge>
                          )}
                        </div>
                        <p className="t-small text-ink-2">{s.frequency} · {operatorName(s.operator)}</p>
                        {s.note && <p className="mt-0.5 t-small text-ink-3">{s.note}</p>}
                      </div>
                      <span className="pt-0.5 t-mono text-ink-2">{s.monthly ? formatNaira(s.monthly) : s.status === "Specialist" ? "Not billed" : "No charge"}</span>
                      {s.status !== "Specialist" && (
                        <Menu
                          trigger={(p) => (
                            <IconButton label={`Options for ${s.name}`} size="sm" {...p}>
                              <MoreHorizontal />
                            </IconButton>
                          )}
                          items={[
                            { label: "Request an extra lift", onSelect: () => setRequestOpen(true) },
                            { label: "Ask to change frequency", onSelect: () => toast.success("Change request sent", `Slate will confirm the new frequency for ${s.name.toLowerCase()} within a working day.`) },
                            s.status === "Paused"
                              ? { label: "Resume service", onSelect: () => { setServices((xs) => xs.map((x) => (x.id === s.id ? { ...x, status: "Active", note: undefined } : x))); toast.success(`${s.name} resumed`, "It's back on the next scheduled run."); } }
                              : { label: "Pause service", danger: true, onSelect: () => setPausing(s) },
                          ]}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </section>

      <ConfirmDialog
        open={!!pausing}
        onClose={() => setPausing(null)}
        title={`Pause ${pausing?.name.toLowerCase()}?`}
        description="Collections stop from the next scheduled run until you resume. Bins left at the bin point won't be lifted, and the monthly charge is pro-rated."
        confirmLabel="Pause service"
        variant="destructive"
        onConfirm={() => {
          if (!pausing) return;
          setServices((xs) => xs.map((x) => (x.id === pausing.id ? { ...x, status: "Paused", note: "Paused by Dr. Nsikak Okon today" } : x)));
          toast.success(`${pausing.name} paused`, "Resume it from this page at any time.");
        }}
      />

      <RequestModal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        defaultFacility={filter === "all" ? "" : filter}
        nextId={`SR-0${416 + requests.length - serviceRequests.length + 1}`}
        onSubmit={(r) => {
          setRequests((xs) => [r, ...xs]);
          toast.success(`${r.id} sent to Slate`, r.type === "Extra collection" ? "We'll confirm the crew and time within the hour." : "You'll have a quote within 2 working hours.");
        }}
      />
    </Page>
  );
}

/* ------------------------------------------------------------------ */

function RequestModal({
  open, onClose, onSubmit, defaultFacility, nextId,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (r: ServiceRequest) => void;
  defaultFacility: FacilityId | "";
  nextId: string;
}) {
  const blank = { type: "" as ServiceRequest["type"] | "", facility: defaultFacility as string, location: "", date: "", window: "", details: "", volume: "", po: "" };
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setForm({ ...blank, facility: defaultFacility });
    setStep(0);
    setErrors({});
  }
  if (!open && wasOpen) setWasOpen(false);
  const set = (k: keyof typeof blank, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const type = TYPES.find((t) => t.value === form.type);
  const locs = wasteLocations.filter((l) => l.facilityId === form.facility && !l.specialist);

  const next = () => {
    const e: Record<string, string> = {};
    if (step === 0 && !form.type) e.type = "Choose what you need.";
    if (step === 1) {
      if (!form.facility) e.facility = "Choose a facility.";
      if (!form.date) e.date = "Pick a date.";
      else if (form.date <= "2026-10-05") e.date = "Choose a date from tomorrow, 6 Oct.";
      if (!form.window) e.window = "Choose a time window.";
      if (form.type !== "Extra collection" && form.details.trim().length < 10) e.details = "Say what needs collecting, so the quote is right.";
    }
    setErrors(e);
    if (Object.keys(e).length) return;
    if (step < 2) setStep(step + 1);
    else {
      onSubmit({
        id: nextId, type: form.type as ServiceRequest["type"], title: form.details.trim() || `${form.type} at ${facilityById(form.facility).short}`,
        facilityId: form.facility as FacilityId, date: new Date(`${form.date}T${form.window.slice(0, 5).replace("After 1", "1")}:00`).toISOString(),
        submitted: new Date().toISOString(), by: "Dr. Nsikak Okon", status: form.type === "Extra collection" ? "Scheduled" : "Quote pending",
        amount: form.type === "Extra collection" ? 18_500 : undefined,
      });
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Request a service"
      description="For anything outside the regular schedule. Slate arranges the crew and documents the disposal."
      footer={
        <>
          <Button variant="ghost" onClick={step ? () => setStep(step - 1) : onClose}>{step ? "Back" : "Cancel"}</Button>
          <Button onClick={next}>{step < 2 ? "Continue" : form.type === "Extra collection" ? "Book extra lift" : "Send for quote"}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        <Stepper steps={["What", "Where and when", "Review"]} current={step} onStepClick={setStep} />

        {step === 0 && (
          <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Service type">
            {TYPES.map((t) => (
              <ChoiceCard
                key={t.value}
                selected={form.type === t.value}
                onSelect={() => set("type", t.value)}
                icon={<t.icon />}
                title={t.title}
                description={`${t.description} ${t.price}.`}
              />
            ))}
            {errors.type && <p className="t-small text-danger">{errors.type}</p>}
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <Select label="Facility" placeholder="Choose a facility" options={facilities.map((f) => ({ value: f.id, label: f.name }))} value={form.facility} onChange={(e) => { set("facility", e.target.value); set("location", ""); }} error={errors.facility} />
            {form.facility === "medical" && (
              <Alert tone="warning" title="Non-hazardous waste only">
                Slate crews can't take sharps, infectious, anatomical or pharmaceutical waste. Book those with Akwa MedWaste through the teaching clinic.
              </Alert>
            )}
            {locs.length > 0 && (
              <Select label="Bin point" optional placeholder="Anywhere at the facility" options={locs.map((l) => ({ value: l.id, label: l.name }))} value={form.location} onChange={(e) => set("location", e.target.value)} />
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <DatePicker label="Date"  min="2026-10-06" value={form.date} onChange={(date) => set("date", date)} error={errors.date} />
              <Select label="Time window" placeholder="Choose" options={WINDOWS} value={form.window} onChange={(e) => set("window", e.target.value)} error={errors.window} />
            </div>
            {form.type !== "Extra collection" && (
              <Select label="Rough volume" optional placeholder="Not sure" options={["Up to a pickup load (3 m³)", "One skip (6 m³)", "Two skips (12 m³)", "More than two skips"]} value={form.volume} onChange={(e) => set("volume", e.target.value)} />
            )}
            <Textarea
              label={form.type === "Extra collection" ? "Notes for the crew" : "What needs collecting"}
              optional={form.type === "Extra collection"}
              rows={3}
              placeholder={form.type === "Event cleanup" ? "Event, expected guests, where bins should go" : "e.g. 40 wooden lab benches and stools, ground floor"}
              value={form.details}
              onChange={(e) => set("details", e.target.value)}
              error={errors.details}
            />
          </div>
        )}

        {step === 2 && type && (
          <div className="flex flex-col gap-5">
            <DescriptionList
              dense
              items={[
                { label: "Service", value: type.title },
                { label: "Facility", value: facilityById(form.facility).name },
                { label: "Bin point", value: locs.find((l) => l.id === form.location)?.name ?? "Anywhere at the facility" },
                { label: "When", value: `${formatDay(`${form.date}T12:00:00`)}, ${form.window}` },
                { label: "Price", value: type.price },
                ...(form.details ? [{ label: "Details", value: form.details, full: true }] : []),
              ]}
            />
            <Input label="Purchase order number" optional placeholder="PO-IHU-2026-…" value={form.po} onChange={(e) => set("po", e.target.value)} hint="Add one now or when you accept the quote. The invoice will quote it." className="t-mono" />
          </div>
        )}
      </div>
    </Modal>
  );
}
