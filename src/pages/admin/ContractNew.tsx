import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock, FileText, Mail, Send } from "lucide-react";
import { ServiceAreaMap } from "@/components/brand/ServiceAreaMap";
import {
  Alert, Badge, Button, Checkbox, ChipGroup, ChoiceCard, CurrencyInput, DatePicker, FileDrop, Input, PageHeader, Page, Segmented, Select, Spinner,
  Stepper, Switch, Textarea, useToast, type UploadedFile,
} from "@/components/ui";
import { AREAS, operators, type Contract } from "@/data";
import { cn } from "@/lib/cn";
import { formatDate, formatNaira, formatNumber } from "@/lib/format";
import { AREA_TO_ZONE, AllocationBar, CONTRACT_TEMPLATES, NEXT_CONTRACT_ID, SLATE_ENTITY, ZONE_TO_AREA, allContracts, isLive, margin } from "./_money";

const STEPS = ["Operator", "Service area", "Service type", "Customer pricing", "Operator payout", "SLA", "Schedule", "Penalties", "Agreement", "Approval", "Send", "Acceptance", "Activate"];
const SERVICE_TYPES: Array<{ value: string; hint: string; template: string }> = [
  { value: "Household Waste", hint: "Scheduled collection for homes", template: "residential" },
  { value: "Estate Waste Management", hint: "Estate-wide schedule, resident billing", template: "residential" },
  { value: "Commercial Waste", hint: "Shops, restaurants, offices", template: "commercial" },
  { value: "Institutional Waste", hint: "Schools, hospitals, agencies", template: "institutional" },
  { value: "Bulk Waste", hint: "Furniture, appliances, moving waste", template: "institutional" },
  { value: "Recycling", hint: "Sorted materials to recovery partners", template: "recycling" },
  { value: "Special Collection", hint: "Debris, garden clearance", template: "institutional" },
  { value: "Event Cleanup", hint: "Bins before, crew during, clearance after", template: "commercial" },
];
const PH_AREAS = ["GRA Phase 2", "Trans-Amadi", "Old GRA", "Rumuola"];
const WINDOWS = ["05:00–07:00", "06:00–08:00", "07:00–09:00", "08:00–10:00", "10:00–12:00", "14:00–16:00", "21:00–23:00"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const APPROVERS = [
  { value: "Aniekan Etim", label: "Aniekan Etim, Super Admin" },
  { value: "Ekaette Archibong", label: "Ekaette Archibong, Finance Admin" },
  { value: "Itoro Effiong", label: "Itoro Effiong, Partnership Manager" },
];
const MARGIN_FLOOR = 18;
const FEE_RATE = 0.015;

interface Draft {
  operatorId: string;
  city: "Uyo" | "Port Harcourt";
  areas: string[];
  services: string[];
  price: string;
  unit: string;
  payout: string;
  sla: string;
  windows: string[];
  maxMissed: string;
  response: string;
  complaintHours: string;
  frequency: "Weekly" | "Twice weekly" | "Three times weekly" | "Daily";
  days: string[];
  start: string;
  term: "6" | "12" | "24";
  capacity: string;
  penaltyMissed: string;
  recoveryHours: string;
  deductionBelow: string;
  deductionPct: string;
  breachLimit: string;
  autoDeduct: boolean;
  agreementMode: "generate" | "upload";
  files: UploadedFile[];
  approver: string;
  approvalNote: string;
  approval: "none" | "pending" | "approved";
  message: string;
  copyPortal: boolean;
  sent: boolean;
  accepted: boolean;
  autoAssign: boolean;
  notifyCustomers: boolean;
}

const num = (v: string) => Number(v.replace(/[^\d.]/g, "")) || 0;
const digits = (v: string) => v.replace(/[^\d]/g, "");
const addMonths = (d: string, m: number) => {
  const x = new Date(d);
  x.setMonth(x.getMonth() + m);
  x.setDate(x.getDate() - 1);
  return x.toISOString().slice(0, 10);
};

export default function ContractNew() {
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tpl = CONTRACT_TEMPLATES.find((t) => t.id === params.get("template"));
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [d, setD] = useState<Draft>(() => ({
    operatorId: "",
    city: "Uyo",
    areas: [],
    services: tpl ? SERVICE_TYPES.filter((s) => s.template === tpl.id).slice(0, 1).map((s) => s.value) : [],
    price: tpl ? String(tpl.price) : "",
    unit: tpl?.unit ?? "per household / month",
    payout: tpl ? String(tpl.payout) : "",
    sla: "97",
    windows: ["07:00–09:00"],
    maxMissed: "10",
    response: "24",
    complaintHours: "48",
    frequency: "Twice weekly",
    days: ["Mon", "Thu"],
    start: "2026-11-01",
    term: "12",
    capacity: "",
    penaltyMissed: "2500",
    recoveryHours: "24",
    deductionBelow: "95",
    deductionPct: "5",
    breachLimit: "3",
    autoDeduct: true,
    agreementMode: "generate",
    files: [],
    approver: "Aniekan Etim",
    approvalNote: "",
    approval: "none",
    message: "",
    copyPortal: true,
    sent: false,
    accepted: false,
    autoAssign: true,
    notifyCustomers: true,
  }));
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  const op = operators.find((o) => o.id === d.operatorId);
  const template = CONTRACT_TEMPLATES.find((t) => t.id === (SERVICE_TYPES.find((s) => s.value === d.services[0])?.template ?? "residential"))!;
  const price = num(d.price), payout = num(d.payout);
  const m = margin(price, payout);
  const fee = Math.round(price * FEE_RATE);
  const capacity = num(d.capacity);
  const end = addMonths(d.start, Number(d.term));
  const areaOptions = d.city === "Uyo" ? AREAS : PH_AREAS;

  // Pre-fill pricing and capacity from the template and operator when the step opens.
  useEffect(() => {
    if (step === 3 && !d.price) setD((x) => ({ ...x, price: String(template.price), unit: template.unit }));
    if (step === 4 && !d.payout) setD((x) => ({ ...x, payout: String(template.payout) }));
    if (step === 6 && !d.capacity && op) setD((x) => ({ ...x, capacity: String(Math.max(50, op.capacity - op.assigned)) }));
    if (step === 7 && template.id === "commercial" && d.penaltyMissed === "2500") setD((x) => ({ ...x, penaltyMissed: "7500" }));
    if (step === 10 && !d.message && op) setD((x) => ({ ...x, message: `Hello ${op.contact.split(" ")[0]}, please review and accept contract ${NEXT_CONTRACT_ID} for ${x.areas.join(", ")}. It starts on ${formatDate(x.start)}.` }));
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const overlaps = useMemo(
    () => allContracts.filter((c) => isLive(c) && c.areas.some((a) => d.areas.includes(a)) && c.serviceTypes.some((s) => d.services.includes(s))),
    [d.areas, d.services],
  );

  const errors: Record<string, string | undefined> = (() => {
    switch (step) {
      case 0: return { operator: !d.operatorId ? "Choose an operator" : undefined };
      case 1: return { areas: !d.areas.length ? "Choose at least one area" : undefined };
      case 2: return { services: !d.services.length ? "Choose at least one service type" : undefined };
      case 3: return { price: price <= 0 ? "Enter the customer price" : undefined };
      case 4: return { payout: payout <= 0 ? "Enter the operator payout" : payout >= price ? "Payout must be less than the customer price" : undefined };
      case 5: return {
        sla: num(d.sla) < 80 || num(d.sla) > 100 ? "Between 80 and 100" : undefined,
        windows: !d.windows.length ? "Choose at least one window" : undefined,
        maxMissed: num(d.maxMissed) < 1 ? "At least 1" : undefined,
        response: num(d.response) < 1 || num(d.response) > 72 ? "Between 1 and 72 hours" : undefined,
        complaintHours: num(d.complaintHours) < 1 || num(d.complaintHours) > 168 ? "Between 1 and 168 hours" : undefined,
      };
      case 6: return {
        days: !d.days.length ? "Choose collection days" : undefined,
        start: !d.start ? "Choose a start date" : d.start < "2026-10-06" ? "Start date must be after today" : undefined,
        capacity: capacity <= 0 ? "Enter capacity" : op && capacity > op.capacity ? `${op.short} can take ${formatNumber(op.capacity)} at most` : undefined,
      };
      case 7: return { penaltyMissed: num(d.penaltyMissed) <= 0 ? "Enter a penalty" : num(d.penaltyMissed) > payout * 2 ? "More than twice the payout, check the amount" : undefined };
      case 8: return { files: d.agreementMode === "upload" && !d.files.length ? "Upload the signed-off agreement, or generate it from the template" : undefined };
      case 9: return { approval: d.approval !== "approved" ? "Request approval and wait for it before sending" : undefined };
      case 10: return { sent: !d.sent ? "Send the contract to the operator to continue" : undefined };
      case 11: return { accepted: !d.accepted ? "The operator needs to accept before you can activate" : undefined };
      default: return {};
    }
  })();
  const invalid = Object.values(errors).some(Boolean);
  const err = (k: string) => (tried ? errors[k] : undefined);

  const go = (i: number) => {
    setStep(i);
    setTried(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const next = () => {
    setTried(true);
    if (invalid) return;
    const n = Math.min(STEPS.length - 1, step + 1);
    setReached((r) => Math.max(r, n));
    go(n);
  };

  const requestApproval = () => {
    set("approval", "pending");
    toast.info("Approval requested", `${d.approver} has been asked to approve ${NEXT_CONTRACT_ID}.`);
    setTimeout(() => {
      setD((x) => ({ ...x, approval: "approved" }));
      toast.success(`Approved by ${d.approver}`, "You can now send the contract to the operator.");
    }, 1600);
  };

  const finish = async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 800));
    const contract: Contract = {
      id: NEXT_CONTRACT_ID,
      operatorId: d.operatorId,
      operatorName: op?.short ?? "",
      areas: d.areas,
      serviceTypes: d.services,
      customerPrice: price,
      operatorPayout: payout,
      capacity,
      customers: 0,
      slaCompletion: num(d.sla),
      responseHours: num(d.response),
      paymentTerms: template.id === "institutional" ? "Monthly, 14 days after invoice" : "Monthly, 7 days after period end",
      penalties: `${formatNaira(num(d.penaltyMissed))} per missed pickup not recovered within ${d.recoveryHours}h; ${d.deductionPct}% deduction below ${d.deductionBelow}% completion; termination after ${d.breachLimit} breaches in 90 days`,
      start: d.start,
      end,
      status: "Active",
      monthlyValue: 0,
      version: 1,
    };
    toast.success(`${NEXT_CONTRACT_ID} is active`, `${op?.short} starts on ${formatDate(d.start)}.`);
    navigate(`/admin/contracts/${NEXT_CONTRACT_ID}`, { state: { created: contract } });
  };

  const summary: Array<[string, ReactNode, number]> = [
    ["Operator", op?.short ?? "Not set", 0],
    ["Areas", d.areas.length ? d.areas.join(", ") : "Not set", 1],
    ["Services", d.services.length ? d.services.join(", ") : "Not set", 2],
    ["Customer price", price ? `${formatNaira(price)} ${d.unit}` : "Not set", 3],
    ["Operator payout", payout ? formatNaira(payout) : "Not set", 4],
    ["Slate margin", price && payout ? `${formatNaira(m.amount)} · ${m.pct.toFixed(1)}%` : "Not set", 4],
    ["SLA", `${d.sla}% · ${d.response} h response · max ${d.maxMissed} missed`, 5],
    ["Schedule", `${d.frequency}, ${d.days.join(" & ")}`, 6],
    ["Term", `${formatDate(d.start)} – ${formatDate(end)}`, 6],
    ["Capacity", capacity ? formatNumber(capacity) : "Not set", 6],
    ["Penalty", `${formatNaira(num(d.penaltyMissed))} per missed pickup`, 7],
    ["Agreement", d.agreementMode === "generate" ? `${template.kind} template ${template.version}` : d.files[0]?.name ?? "Not uploaded", 8],
  ];

  return (
    <Page className="gap-6 md:gap-8">
      <PageHeader
        back={{ to: "/admin/contracts", label: "Contracts" }}
        eyebrow={<span className="t-mono">{NEXT_CONTRACT_ID} · draft</span>}
        title="New contract"
        description={`A Waste Service Partner Agreement between ${SLATE_ENTITY} and a verified operator.`}
      />

      <div className="overflow-x-auto scrollbar-none lg:hidden">
        <Stepper steps={STEPS} current={step} onStepClick={(i) => i <= reached && go(i)} className="md:min-w-[1500px]" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <header className="flex flex-col gap-1 border-b border-line pb-5">
            <p className="t-micro text-ink-3 tnum">Step {step + 1} of {STEPS.length}</p>
            <h2 className="t-h2 text-ink">{STEP_TITLES[step]}</h2>
            <p className="t-small text-ink-2">{STEP_HINTS[step]}</p>
          </header>

          {/* ---------- 1 · operator ---------- */}
          {step === 0 && (
            <div className="flex flex-col gap-3">
              {operators.filter((o) => o.status !== "Rejected").map((o) => {
                const verified = o.status === "Active" || o.status === "Approved";
                const free = o.capacity - o.assigned;
                return (
                  <ChoiceCard
                    key={o.id}
                    selected={d.operatorId === o.id}
                    onSelect={() => set("operatorId", o.id)}
                    disabled={!verified}
                    title={o.name}
                    description={
                      verified
                        ? `${o.focus} · ${o.areas.join(", ")} · score ${o.score} · ${formatNumber(free)} free capacity`
                        : `${o.status}, verification must be complete before contracting`
                    }
                    meta={verified ? <span className="tnum">{o.completion}%</span> : <Badge tone="warning">{o.status}</Badge>}
                  />
                );
              })}
              {err("operator") && <p className="t-small text-danger" role="alert">{err("operator")}</p>}
            </div>
          )}

          {/* ---------- 2 · areas ---------- */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <Select
                label="City"
                value={d.city}
                onChange={(e) => setD((x) => ({ ...x, city: e.target.value as Draft["city"], areas: [] }))}
                options={[{ value: "Uyo", label: "Uyo, Akwa Ibom, live" }, { value: "Port Harcourt", label: "Port Harcourt, Rivers, pilot from Feb 2027" }]}
              />
              {d.city === "Uyo" && (
                <ServiceAreaMap
                  className="aspect-[4/3] w-full sm:aspect-[16/10]"
                  legend="Selected"
                  highlight={d.areas.map((a) => AREA_TO_ZONE[a]).filter(Boolean) as string[]}
                  onSelect={(z) => {
                    const a = ZONE_TO_AREA[z]!;
                    set("areas", d.areas.includes(a) ? d.areas.filter((x) => x !== a) : [...d.areas, a]);
                  }}
                />
              )}
              <div className="flex flex-col gap-2">
                <span className="t-small font-medium text-ink">Areas</span>
                <ChipGroup options={areaOptions} value={d.areas} onChange={(v) => set("areas", v)} />
                {op && <p className="t-small text-ink-3">{op.short} already covers {op.areas.join(", ")}.</p>}
                {err("areas") && <p className="t-small text-danger" role="alert">{err("areas")}</p>}
              </div>
            </div>
          )}

          {/* ---------- 3 · service types ---------- */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {SERVICE_TYPES.map((s) => (
                  <ChoiceCard
                    key={s.value}
                    type="checkbox"
                    selected={d.services.includes(s.value)}
                    onSelect={() => set("services", d.services.includes(s.value) ? d.services.filter((x) => x !== s.value) : [...d.services, s.value])}
                    title={s.value}
                    description={s.hint}
                  />
                ))}
              </div>
              {err("services") && <p className="t-small text-danger" role="alert">{err("services")}</p>}
              {overlaps.length > 0 && (
                <Alert tone="info" title="Some of this is already contracted">
                  {overlaps.map((c) => `${c.areas.filter((a) => d.areas.includes(a)).join(", ")} is served by ${c.operatorName} under ${c.id}`).join(". ")}. New customers will be split by capacity.
                </Alert>
              )}
            </div>
          )}

          {/* ---------- 4 · customer pricing ---------- */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <CurrencyInput label="Customer price" value={price ? price.toLocaleString("en-NG") : ""} onChange={(e) => set("price", digits(e.target.value))} error={err("price")} hint={`${template.kind} template default: ${formatNaira(template.price)}`} />
                <Select label="Billed" value={d.unit} onChange={(e) => set("unit", e.target.value)} options={["per household / month", "per site / month", "per facility / month", "per subscriber / month", "per pickup", "per event"]} />
              </div>
              <div className="flex flex-col gap-2">
                <span className="t-small font-medium text-ink">Start from a standard price</span>
                <div className="flex flex-wrap gap-2">
                  {CONTRACT_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setD((x) => ({ ...x, price: String(t.price), unit: t.unit }))}
                      className={cn("rounded-sm border px-3 py-2 text-left transition-colors", price === t.price ? "border-ink bg-sunken" : "border-line-strong hover:border-ink-3")}
                    >
                      <span className="block t-small font-medium text-ink">{t.kind}</span>
                      <span className="block t-micro text-ink-3 tnum">{formatNaira(t.price)} {t.unit}</span>
                    </button>
                  ))}
                </div>
              </div>
              <p className="t-small text-ink-2">Customers see only Slate's price. The operator's payout is never shown to customers.</p>
            </div>
          )}

          {/* ---------- 5 · operator payout ---------- */}
          {step === 4 && (
            <div className="flex flex-col gap-6">
              <CurrencyInput label="Operator payout" value={payout ? payout.toLocaleString("en-NG") : ""} onChange={(e) => set("payout", digits(e.target.value))} error={err("payout")} hint={`For each ${d.unit.replace("per ", "").replace(" / month", "")}. Customer pays ${formatNaira(price)}.`} />
              <section className="flex flex-col gap-4 border-y border-line py-5" aria-live="polite">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="t-micro text-ink-3">Slate margin</p>
                    <p className={cn("t-display tnum", m.amount <= 0 ? "text-danger" : "text-ink")}>{formatNaira(m.amount)}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-display text-[28px] font-bold leading-none tnum", m.amount <= 0 ? "text-danger" : m.pct < MARGIN_FLOOR ? "text-warning" : "text-ink")}>{m.pct.toFixed(1)}%</p>
                    <p className="t-small text-ink-3 tnum">{formatNaira(m.amount - fee)} after the {formatNaira(fee)} processor fee</p>
                  </div>
                </div>
                {price > 0 && payout > 0 && payout < price && <AllocationBar operator={payout} slate={m.amount - fee} fee={fee} />}
                {op && payout > 0 && payout < price && (
                  <p className="t-small text-ink-2 tnum">
                    At {formatNumber(Math.max(50, op.capacity - op.assigned))} customers this pays {op.short} {formatNaira(payout * Math.max(50, op.capacity - op.assigned))} and Slate keeps {formatNaira(m.amount * Math.max(50, op.capacity - op.assigned))} a month.
                  </p>
                )}
              </section>
              {m.amount > 0 && m.pct < MARGIN_FLOOR && (
                <Alert tone="warning" title={`Below the ${MARGIN_FLOOR}% margin floor`}>Contracts under the floor need a Super Admin as approver in step 10.</Alert>
              )}
            </div>
          )}

          {/* ---------- 6 · SLA ---------- */}
          {step === 5 && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Completion rate" inputMode="numeric" value={d.sla} onChange={(e) => set("sla", digits(e.target.value))} trailing={<span className="pr-3 t-small">%</span>} error={err("sla")} hint="Scheduled pickups completed in the window" />
              <Input label="Maximum missed pickups" inputMode="numeric" value={d.maxMissed} onChange={(e) => set("maxMissed", digits(e.target.value))} trailing={<span className="pr-3 t-small">a month</span>} error={err("maxMissed")} />
              <Input label="Response time" inputMode="numeric" value={d.response} onChange={(e) => set("response", digits(e.target.value))} trailing={<span className="pr-3 t-small">hours</span>} error={err("response")} hint="To a missed-pickup or service request" />
              <Input label="Complaint resolution" inputMode="numeric" value={d.complaintHours} onChange={(e) => set("complaintHours", digits(e.target.value))} trailing={<span className="pr-3 t-small">hours</span>} error={err("complaintHours")} />
              <div className="flex flex-col gap-2 sm:col-span-2">
                <span className="t-small font-medium text-ink">Pickup windows</span>
                <ChipGroup options={WINDOWS} value={d.windows} onChange={(v) => set("windows", v)} />
                {err("windows") && <p className="t-small text-danger" role="alert">{err("windows")}</p>}
              </div>
            </div>
          )}

          {/* ---------- 7 · schedule ---------- */}
          {step === 6 && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <span className="t-small font-medium text-ink">Frequency</span>
                <Segmented
                  className="w-full sm:w-auto"
                  value={d.frequency}
                  onChange={(v) => setD((x) => ({ ...x, frequency: v, days: v === "Weekly" ? ["Mon"] : v === "Twice weekly" ? ["Mon", "Thu"] : v === "Three times weekly" ? ["Mon", "Wed", "Fri"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] }))}
                  options={[{ value: "Weekly", label: "Weekly" }, { value: "Twice weekly", label: "2× week" }, { value: "Three times weekly", label: "3× week" }, { value: "Daily", label: "Daily" }]}
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className="t-small font-medium text-ink">Collection days</span>
                <ChipGroup options={DAYS} value={d.days} onChange={(v) => set("days", DAYS.filter((x) => v.includes(x)))} />
                {err("days") && <p className="t-small text-danger" role="alert">{err("days")}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <DatePicker  label="Start date" value={d.start} min="2026-10-06" onChange={(date) => set("start", date)} error={err("start")} />
                <div className="flex flex-col gap-1.5">
                  <span className="t-small font-medium text-ink">Term</span>
                  <Segmented className="w-full" value={d.term} onChange={(v) => set("term", v)} options={[{ value: "6", label: "6 months" }, { value: "12", label: "12 months" }, { value: "24", label: "24 months" }]} />
                  <span className="t-small text-ink-3">Ends {formatDate(end)}</span>
                </div>
                <Input label="Capacity" inputMode="numeric" value={d.capacity} onChange={(e) => set("capacity", digits(e.target.value))} error={err("capacity")} hint={op ? `${op.short}: ${formatNumber(op.capacity - op.assigned)} free of ${formatNumber(op.capacity)}` : undefined} trailing={<span className="pr-3 t-small">customers</span>} />
              </div>
            </div>
          )}

          {/* ---------- 8 · penalties ---------- */}
          {step === 7 && (
            <div className="flex flex-col gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <CurrencyInput label="Per missed pickup" value={d.penaltyMissed} onChange={(e) => set("penaltyMissed", digits(e.target.value))} error={err("penaltyMissed")} hint="Only when not recovered in time" />
                <Input label="Recovery window" inputMode="numeric" value={d.recoveryHours} onChange={(e) => set("recoveryHours", digits(e.target.value))} trailing={<span className="pr-3 t-small">hours</span>} />
                <Input label="Deduction below completion of" inputMode="numeric" value={d.deductionBelow} onChange={(e) => set("deductionBelow", digits(e.target.value))} trailing={<span className="pr-3 t-small">%</span>} />
                <Input label="Deduction from monthly payout" inputMode="numeric" value={d.deductionPct} onChange={(e) => set("deductionPct", digits(e.target.value))} trailing={<span className="pr-3 t-small">%</span>} />
                <Input label="Breaches before termination" inputMode="numeric" value={d.breachLimit} onChange={(e) => set("breachLimit", digits(e.target.value))} hint="Within any 90 days" fieldClassName="sm:col-span-2" />
              </div>
              <div className="border-y border-line py-4">
                <Switch checked={d.autoDeduct} onChange={(v) => set("autoDeduct", v)} label="Deduct automatically from payouts" description="Deductions show on the operator's payout statement with the pickup reference." />
              </div>
              <p className="t-small text-ink-2">
                In words: {formatNaira(num(d.penaltyMissed))} for each missed pickup not recovered within {d.recoveryHours} hours; {d.deductionPct}% off the month's payout if completion falls below {d.deductionBelow}%; termination after {d.breachLimit} breaches in 90 days.
              </p>
            </div>
          )}

          {/* ---------- 9 · agreement ---------- */}
          {step === 8 && (
            <div className="flex flex-col gap-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <ChoiceCard selected={d.agreementMode === "generate"} onSelect={() => set("agreementMode", "generate")} icon={<FileText />} title="Generate from template" description={`${template.name}, ${template.kind}, ${template.version}, with these terms filled in`} />
                <ChoiceCard selected={d.agreementMode === "upload"} onSelect={() => set("agreementMode", "upload")} icon={<Send />} title="Upload an agreement" description="A version Legal has already negotiated with the operator" />
              </div>
              {d.agreementMode === "upload" ? (
                <FileDrop label="Agreement" hint="PDF, up to 10 MB" accept=".pdf" multiple={false} files={d.files} onFiles={(f) => set("files", f)} error={err("files")} />
              ) : (
                <ol className="flex flex-col divide-y divide-line border-y border-line">
                  {template.clauses.map((c, i) => (
                    <li key={c} className="flex gap-3 py-2.5">
                      <span className="w-6 shrink-0 t-mono text-ink-3">§{i + 1}</span>
                      <span className="t-small text-ink">{c}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {/* ---------- 10 · internal approval ---------- */}
          {step === 9 && (
            <div className="flex flex-col gap-5">
              <Select
                label="Approver"
                value={d.approver}
                onChange={(e) => set("approver", e.target.value)}
                options={APPROVERS}
                disabled={d.approval !== "none"}
                hint={m.pct < MARGIN_FLOOR ? `Margin is ${m.pct.toFixed(1)}%, only a Super Admin can approve below ${MARGIN_FLOOR}%.` : "Finance or a Super Admin can approve standard terms."}
                error={m.pct < MARGIN_FLOOR && d.approver !== "Aniekan Etim" ? "Choose a Super Admin for a below-floor margin" : undefined}
              />
              <Textarea label="Note for the approver" optional rows={3} value={d.approvalNote} onChange={(e) => set("approvalNote", e.target.value)} disabled={d.approval !== "none"} placeholder="Context: why this operator, why this price" />
              {d.approval === "none" && (
                <div>
                  <Button onClick={requestApproval} disabled={m.pct < MARGIN_FLOOR && d.approver !== "Aniekan Etim"}>Request approval</Button>
                </div>
              )}
              {d.approval === "pending" && (
                <div className="flex items-center gap-3 border-y border-line py-4">
                  <Spinner />
                  <p className="t-small text-ink-2">Waiting for {d.approver}…</p>
                </div>
              )}
              {d.approval === "approved" && (
                <Alert tone="success" title={`Approved by ${d.approver}`}>Today at 08:{String(14 + (d.approvalNote.length % 9)).padStart(2, "0")}. The approval is recorded in the audit log against {NEXT_CONTRACT_ID}.</Alert>
              )}
              {err("approval") && <p className="t-small text-danger" role="alert">{err("approval")}</p>}
            </div>
          )}

          {/* ---------- 11 · send ---------- */}
          {step === 10 && op && (
            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-3 border-y border-line py-4">
                <Mail className="mt-0.5 size-5 shrink-0 text-ink-3" strokeWidth={1.75} />
                <div className="min-w-0">
                  <p className="t-small font-medium text-ink">{op.contact}</p>
                  <p className="t-small text-ink-2">{op.email} · {op.phone}</p>
                </div>
              </div>
              <Textarea label="Message" rows={4} value={d.message} onChange={(e) => set("message", e.target.value)} disabled={d.sent} />
              <Checkbox checked={d.copyPortal} onChange={(v) => set("copyPortal", v)} label="Also create a task in the operator portal" description="The operator can review, sign and accept from Contracts." disabled={d.sent} />
              {d.sent ? (
                <Alert tone="success" title="Sent to the operator">{op.contact} has the contract by email{d.copyPortal ? " and in the operator portal" : ""}. You can continue to track acceptance.</Alert>
              ) : (
                <div>
                  <Button leading={<Send className="size-4" />} onClick={() => { set("sent", true); toast.success("Contract sent", `${NEXT_CONTRACT_ID} to ${op.email}.`); }}>
                    Send to {op.contact.split(" ")[0]}
                  </Button>
                </div>
              )}
              {err("sent") && <p className="t-small text-danger" role="alert">{err("sent")}</p>}
            </div>
          )}

          {/* ---------- 12 · acceptance ---------- */}
          {step === 11 && op && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                {d.accepted ? <CheckCircle2 className="size-5 text-success" /> : <Clock className="size-5 text-warning" />}
                <p className="t-body font-medium text-ink">{d.accepted ? `Accepted by ${op.contact}` : `Waiting for ${op.contact} to accept`}</p>
              </div>
              <div className="rounded-lg border border-line bg-surface">
                <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
                  <span className="t-micro text-ink-3">What {op.short} sees in the operator portal</span>
                  <Badge tone={d.accepted ? "success" : "warning"} dot>{d.accepted ? "Accepted" : "Awaiting acceptance"}</Badge>
                </div>
                <div className="flex flex-col gap-3 p-5">
                  <p className="t-h3 text-ink">Contract {NEXT_CONTRACT_ID} from Slate</p>
                  <p className="t-small text-ink-2">
                    {d.services.join(", ")} in {d.areas.join(", ")}. {formatNaira(payout)} {d.unit}, from {formatDate(d.start)} to {formatDate(end)}. Capacity {formatNumber(capacity)}.
                  </p>
                  <div className="flex gap-2">
                    <span className="inline-flex h-8 items-center rounded-sm bg-slate px-3 t-small font-medium text-slate-ink opacity-60 dark:bg-slate-ink dark:text-slate-950">Review and accept</span>
                    <span className="inline-flex h-8 items-center rounded-sm border border-line-strong px-3 t-small text-ink-2 opacity-60">Request changes</span>
                  </div>
                </div>
              </div>
              {!d.accepted && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => toast.success("Reminder sent", `${op.contact} gets an SMS and email.`)}>Send reminder</Button>
                  <Button variant="ghost" onClick={() => { set("accepted", true); toast.success("Operator accepted", `${op.contact} signed ${NEXT_CONTRACT_ID} electronically.`); }}>
                    Record acceptance
                  </Button>
                </div>
              )}
              {err("accepted") && <p className="t-small text-danger" role="alert">{err("accepted")}</p>}
            </div>
          )}

          {/* ---------- 13 · activate ---------- */}
          {step === 12 && (
            <div className="flex flex-col gap-5">
              <ul className="flex flex-col divide-y divide-line border-y border-line">
                {["Operator verified", "Terms approved internally", "Agreement sent", "Operator accepted"].map((t) => (
                  <li key={t} className="flex items-center gap-3 py-3">
                    <Check className="size-4 text-success" strokeWidth={2.5} />
                    <span className="t-small text-ink">{t}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-4">
                <Switch checked={d.autoAssign} onChange={(v) => set("autoAssign", v)} label="Assign customers automatically" description={`New customers in ${d.areas.join(", ")} go to ${op?.short ?? "this operator"} up to capacity.`} />
                <Switch checked={d.notifyCustomers} onChange={(v) => set("notifyCustomers", v)} label="Tell affected customers" description="Customers moved to this operator get an SMS with their new collection days." />
              </div>
              <p className="t-small text-ink-2">Activation starts the contract on {formatDate(d.start)}. Payouts follow the payment terms from the first full month.</p>
            </div>
          )}

          {/* Navigation, sticky above the tab bar on phones */}
          <div className="sticky bottom-[88px] z-20 -mx-5 flex items-center gap-2 border-t border-line bg-glass px-5 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <Button variant="ghost" leading={<ArrowLeft className="size-4" />} onClick={() => go(Math.max(0, step - 1))} disabled={step === 0}>
              Back
            </Button>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden t-small text-ink-3 sm:inline">{tried && invalid ? "Fix the highlighted fields" : ""}</span>
              {step < STEPS.length - 1 ? (
                <Button trailing={<ArrowRight className="size-4" />} onClick={next}>
                  Continue
                </Button>
              ) : (
                <Button loading={busy} onClick={finish} leading={<Check className="size-4" />}>
                  Activate contract
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Summary, desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-32 flex flex-col gap-6">
            <ol className="flex flex-col">
              {STEPS.map((s, i) => (
                <li key={s}>
                  <button
                    type="button"
                    disabled={i > reached}
                    onClick={() => go(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-sm px-2 py-1.5 text-left t-small transition-colors disabled:cursor-default",
                      i === step ? "bg-sunken font-semibold text-ink" : i <= reached ? "text-ink-2 hover:bg-sunken/60 hover:text-ink" : "text-ink-3",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold tnum",
                        i < step || (i <= reached && i !== step) ? "bg-ink text-surface" : i === step ? "bg-signal text-signal-ink" : "border border-line-strong",
                      )}
                    >
                      {i !== step && i <= reached ? <Check className="size-3" strokeWidth={3} /> : i + 1}
                    </span>
                    {s}
                  </button>
                </li>
              ))}
            </ol>
            <div className="flex flex-col gap-3 border-t border-line pt-5">
              <p className="t-micro text-ink-3">Summary</p>
              <dl className="flex flex-col gap-2.5">
                {summary.map(([k, v, i]) => (
                  <div key={k} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3">
                    <dt className="t-small text-ink-3">{k}</dt>
                    <dd className={cn("t-small tnum", i <= reached ? "text-ink" : "text-ink-3")}>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </aside>
      </div>
    </Page>
  );
}

const STEP_TITLES = [
  "Select the operator",
  "Where they'll collect",
  "What they'll collect",
  "What customers pay Slate",
  "What Slate pays the operator",
  "Service level agreement",
  "Collection schedule and term",
  "Penalties",
  "The agreement",
  "Internal approval",
  "Send to the operator",
  "Operator acceptance",
  "Activate",
];
const STEP_HINTS = [
  "Only verified operators can be contracted. Capacity and score are from the last 30 days.",
  "Tap zones on the map or choose areas below.",
  "Choose every service type this operator will deliver under this contract.",
  "The price customers see. It comes from the service catalogue unless this contract needs its own.",
  "The margin updates as you type. Processor fees are about 1.5% of the customer price.",
  "These terms drive the operator scorecard and automatic penalties.",
  "When collections happen, from when, and how many customers this contract can take.",
  "Applied automatically from completed and missed pickup records.",
  "Generate the Waste Service Partner Agreement or upload a negotiated version.",
  "Every contract is approved before it goes to the operator.",
  "The operator gets the agreement by email and in their portal.",
  "Track the operator's decision. You can nudge them or record a signed paper copy.",
  "Review and start the contract.",
];
