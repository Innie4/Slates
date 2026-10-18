import { useState } from "react";
import { Check } from "lucide-react";
import {
  BarChart, Button, ConfirmDialog, DataTable, Donut, DatePicker, Input, Meter, Modal, Page, PageHeader, Ref, Section, Select, StatusBadge, Switch, Tabs,
  useTab, useToast, type Column,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { recyclingPartners, type RecyclingPartner } from "@/data";
import { formatDate, formatNaira, formatNairaShort, formatNumber } from "@/lib/format";
import { Facts, Headline, daysFromNow, useExport } from "./_gov";

const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
const TONNES = [6.1, 12.8, 19.4, 27.2, 35.9, 46.4, 7.3];

interface Material {
  name: string;
  examples: string;
  partner: string;
  rate: string;
  kg: number;
  contamination: number;
  accepting: boolean;
}
const MATERIALS: Material[] = [
  { name: "Paper & cardboard", examples: "Boxes, office paper, newspaper", partner: "PaperLoop Uyo", rate: "₦60/kg", kg: 22_960, contamination: 6.2, accepting: true },
  { name: "PET plastic", examples: "Water and soft-drink bottles", partner: "Itam Recovery Ltd", rate: "₦180/kg", kg: 14_870, contamination: 3.1, accepting: true },
  { name: "HDPE", examples: "Detergent and oil containers", partner: "Itam Recovery Ltd", rate: "₦180/kg", kg: 3_550, contamination: 4.4, accepting: true },
  { name: "Aluminium cans", examples: "Drink cans, clean foil trays", partner: "Ikot Metal Reclaim", rate: "₦640/kg", kg: 3_240, contamination: 1.2, accepting: true },
  { name: "Scrap metal", examples: "Small appliances, pots, rods", partner: "Ikot Metal Reclaim", rate: "₦640/kg", kg: 870, contamination: 2.0, accepting: true },
  { name: "E-waste", examples: "Phones, chargers, small electronics", partner: "Ewet E-Cycle", rate: "Per item", kg: 860, contamination: 0.4, accepting: true },
  { name: "Organic waste", examples: "Food and garden waste (pilot)", partner: "Akwa Compost Works", rate: "₦25/kg", kg: 0, contamination: 0, accepting: false },
];

type ReqStatus = "Requested" | "Scheduled" | "Collected" | "Weighed" | "Rejected";
interface PickupReq {
  id: string;
  customer: string;
  area: string;
  materials: string[];
  estKg: number;
  weighedKg?: number;
  requested: string;
  date?: string;
  partner?: string;
  status: ReqStatus;
  note?: string;
}
const REQUESTS: PickupReq[] = [
  { id: "RCY-26-0418", customer: "Ewet Housing Estate", area: "Ewet Housing Estate", materials: ["PET plastic", "Aluminium cans"], estKg: 340, requested: daysFromNow(-1), status: "Requested" },
  { id: "RCY-26-0417", customer: "Ibom Plaza Supermarket", area: "Oron Road", materials: ["Paper & cardboard"], estKg: 620, requested: daysFromNow(-1), status: "Requested" },
  { id: "RCY-26-0416", customer: "Ikpa Hills University", area: "Itam", materials: ["Paper & cardboard", "E-waste"], estKg: 910, requested: daysFromNow(-2), date: daysFromNow(1), partner: "PaperLoop Uyo", status: "Scheduled" },
  { id: "RCY-26-0415", customer: "Imaobong Akpan", area: "Ewet Housing Estate", materials: ["PET plastic", "Aluminium cans"], estKg: 6, requested: daysFromNow(-3), date: daysFromNow(8), partner: "Itam Recovery Ltd", status: "Scheduled" },
  { id: "RCY-26-0414", customer: "Unity Hotel Uyo", area: "Wellington Bassey Way", materials: ["Aluminium cans", "PET plastic"], estKg: 180, requested: daysFromNow(-4), date: daysFromNow(0), partner: "Ikot Metal Reclaim", status: "Collected" },
  { id: "RCY-26-0413", customer: "Shelter Afrique Estate", area: "Shelter Afrique Estate", materials: ["PET plastic", "HDPE"], estKg: 410, weighedKg: 386, requested: daysFromNow(-6), date: daysFromNow(-2), partner: "Itam Recovery Ltd", status: "Weighed" },
  { id: "RCY-26-0412", customer: "Afang House Restaurant", area: "Aka Road", materials: ["Paper & cardboard"], estKg: 140, weighedKg: 0, requested: daysFromNow(-6), date: daysFromNow(-3), partner: "PaperLoop Uyo", status: "Rejected", note: "Cardboard soaked with food oil, contaminated" },
  { id: "RCY-26-0411", customer: "Brightway Pharmacy", area: "Udo Udoma Avenue", materials: ["E-waste"], estKg: 25, weighedKg: 31, requested: daysFromNow(-8), date: daysFromNow(-4), partner: "Ewet E-Cycle", status: "Weighed" },
  { id: "RCY-26-0410", customer: "Uyo Model Secondary School", area: "Abak Road", materials: ["Paper & cardboard", "PET plastic"], estKg: 520, weighedKg: 548, requested: daysFromNow(-9), date: daysFromNow(-5), partner: "PaperLoop Uyo", status: "Weighed" },
];

interface PartnerPayout {
  id: string;
  partner: string;
  period: string;
  kg: number;
  amount: number;
  status: "Pending" | "Processing" | "Paid";
  date: string;
}
const PAYOUTS: PartnerPayout[] = [
  ...recyclingPartners.filter((p) => p.status === "Active").map((p, i): PartnerPayout => ({ id: `RPO-0${930 + i}`, partner: p.name, period: "September 2026", kg: p.volumeKg, amount: p.payout, status: i === 0 ? "Processing" : "Pending", date: daysFromNow(2) })),
  ...recyclingPartners.filter((p) => p.status === "Active").map((p, i): PartnerPayout => ({ id: `RPO-0${920 + i}`, partner: p.name, period: "August 2026", kg: Math.round(p.volumeKg * 0.77), amount: Math.round(p.payout * 0.77), status: "Paid", date: daysFromNow(-28) })),
];

const PERF: Record<string, { acceptance: number; onTime: number; rejected: number }> = {
  "rp-itam": { acceptance: 96.9, onTime: 97, rejected: 2 },
  "rp-metal": { acceptance: 98.8, onTime: 94, rejected: 1 },
  "rp-paper": { acceptance: 93.8, onTime: 91, rejected: 4 },
  "rp-ecycle": { acceptance: 99.6, onTime: 86, rejected: 0 },
  "rp-compost": { acceptance: 0, onTime: 0, rejected: 0 },
};

type TabKey = "overview" | "partners" | "requests" | "payouts";

export default function Recycling() {
  const toast = useToast();
  const doExport = useExport();
  const tab = useTab<TabKey>("tab", "overview");
  const [partners, setPartners] = useState<RecyclingPartner[]>(recyclingPartners);
  const [materials, setMaterials] = useState(MATERIALS);
  const [requests, setRequests] = useState(REQUESTS);
  const [payouts, setPayouts] = useState(PAYOUTS);
  const [approve, setApprove] = useState<RecyclingPartner | null>(null);
  const [payOne, setPayOne] = useState<PartnerPayout | null>(null);
  const [openReq, setOpenReq] = useState<PickupReq | null>(null);

  const sep = TONNES[5]!;
  const aug = TONNES[4]!;
  const growth = Math.round(((sep - aug) / aug) * 100);
  const due = payouts.filter((p) => p.status !== "Paid");
  const active = partners.filter((p) => p.status === "Active");
  const totalKg = active.reduce((a, p) => a + p.volumeKg, 0);

  const reqColumns: Column<PickupReq>[] = [
    { key: "id", header: "Request", sortValue: (r) => r.id, cell: (r) => <div className="flex flex-col"><span className="font-medium text-ink">{r.customer}</span><Ref className="text-[12.5px]">{r.id}</Ref></div> },
    { key: "materials", header: "Materials", cell: (r) => <span className="text-ink-2">{r.materials.join(", ")}</span> },
    { key: "kg", header: "Weight", align: "right", sortValue: (r) => r.weighedKg ?? r.estKg, cell: (r) => <span className="tnum">{r.weighedKg !== undefined ? `${formatNumber(r.weighedKg)} kg` : <span className="text-ink-3">~{formatNumber(r.estKg)} kg</span>}</span> },
    { key: "date", header: "Collection", sortValue: (r) => r.date ?? "", cell: (r) => (r.date ? formatDate(r.date).replace(/ \d{4}$/, "") : <span className="text-ink-3">Not scheduled</span>) },
    { key: "partner", header: "Partner", cell: (r) => r.partner ?? <span className="text-ink-3">, </span>, hideOnMobile: true },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status === "Requested" ? "New" : r.status === "Weighed" ? "Completed" : r.status === "Collected" ? "In progress" : r.status} /> },
  ];

  const payoutColumns: Column<PartnerPayout>[] = [
    { key: "partner", header: "Partner", sortValue: (p) => p.partner, cell: (p) => <div className="flex flex-col"><span className="font-medium text-ink">{p.partner}</span><Ref className="text-[12.5px]">{p.id}</Ref></div> },
    { key: "period", header: "Period", cell: (p) => p.period },
    { key: "kg", header: "Material", align: "right", sortValue: (p) => p.kg, cell: (p) => <span className="tnum">{formatNumber(p.kg)} kg</span> },
    { key: "amount", header: "Amount", align: "right", sortValue: (p) => p.amount, cell: (p) => <span className="t-mono text-ink">{formatNaira(p.amount)}</span> },
    { key: "status", header: "Status", cell: (p) => <StatusBadge status={p.status} /> },
    {
      key: "action",
      header: "",
      align: "right",
      cell: (p) =>
        p.status === "Paid" ? (
          <span className="t-small text-ink-3">{formatDate(p.date).replace(/ \d{4}$/, "")}</span>
        ) : (
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setPayOne(p); }}>
            Pay now
          </Button>
        ),
    },
  ];

  return (
    <Page>
      <PageHeader title="Recycling" description="Sorted recyclables collected from customers and routed to approved recovery partners in Uyo." />

      <Headline
        kicker="Recovered in September"
        value={sep.toFixed(1)}
        unit="tonnes"
        aside={
          <div className="flex flex-col gap-3">
            <p className="t-micro text-ink-3">Tonnes recovered by month</p>
            <BarChart data={TONNES} labels={MONTHS.map((m, i) => (i === 6 ? "Oct*" : m))} format={(v) => `${v} t`} height={150} label="Tonnes recovered per month, April to October" />
            <p className="t-micro text-ink-3">*October to date</p>
          </div>
        }
      >
        <p>
          Up {growth}% on August. Paper and PET make up {Math.round(((22_960 + 18_420) / totalKg) * 100)}% of it.{" "}
          <span className="font-medium text-ink">{formatNairaShort(due.reduce((a, p) => a + p.amount, 0))} in partner payouts</span> is due on 7 October.
        </p>
      </Headline>

      <div className="flex flex-col gap-6">
        <Tabs
          param="tab"
          value="overview"
          items={[
            { value: "overview", label: "Materials" },
            { value: "partners", label: "Partners", count: partners.length },
            { value: "requests", label: "Pickup requests", count: requests.filter((r) => r.status === "Requested").length },
            { value: "payouts", label: "Payouts", count: due.length },
          ]}
        />

        {tab === "overview" && (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-12">
            <Section title="By material" description="September, by weight">
              <Donut
                segments={[
                  { label: "Paper & cardboard", value: 22_960 },
                  { label: "PET & HDPE", value: 18_420 },
                  { label: "Aluminium & metal", value: 4_110 },
                  { label: "E-waste", value: 860 },
                ]}
                center={
                  <>
                    <span className="font-display text-[22px] font-bold leading-none text-ink tnum">{(totalKg / 1000).toFixed(1)}t</span>
                    <span className="t-micro text-ink-3">recovered</span>
                  </>
                }
              />
            </Section>
            <Section title="Material categories" description="What each partner accepts, and how clean it arrives.">
              <ul className="flex flex-col divide-y divide-line border-y border-line">
                {materials.map((m) => (
                  <li key={m.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-3.5 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_90px_auto]">
                    <span className="flex min-w-0 flex-col">
                      <span className="t-body font-medium text-ink">{m.name}</span>
                      <span className="t-small truncate text-ink-3">{m.examples}</span>
                    </span>
                    <span className="order-3 col-span-2 t-small text-ink-2 sm:order-none sm:col-span-1">
                      {m.partner} · {m.rate}
                    </span>
                    <span className="order-4 col-span-2 t-small tnum sm:order-none sm:col-span-1 sm:text-right">
                      {m.kg ? (
                        <>
                          <span className="text-ink">{formatNumber(m.kg)} kg</span>
                          <span className={cn("ml-2 sm:ml-0 sm:block", m.contamination > 5 ? "text-warning" : "text-ink-3")}>{m.contamination}% rejected</span>
                        </>
                      ) : (
                        <span className="text-ink-3">Pilot not started</span>
                      )}
                    </span>
                    <span className="row-start-1 sm:row-auto">
                      <Switch
                        checked={m.accepting}
                        onChange={(v) => {
                          if (v && partners.find((p) => p.name === m.partner)?.status !== "Active") {
                            toast.error(`${m.partner} isn't approved yet`, "Approve the partner before accepting this material.");
                            return;
                          }
                          setMaterials((ms) => ms.map((x) => (x.name === m.name ? { ...x, accepting: v } : x)));
                          toast.success(v ? `Accepting ${m.name.toLowerCase()}` : `Paused ${m.name.toLowerCase()}`, v ? undefined : "Customers can't add it to new pickup requests.");
                        }}
                        label={undefined}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        )}

        {tab === "partners" && (
          <ul className="flex flex-col divide-y divide-line border-y border-line">
            {partners.map((p) => {
              const perf = PERF[p.id]!;
              return (
                <li key={p.id} className="grid gap-4 py-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] md:items-center md:gap-8">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex items-center gap-2">
                      <span className="t-body font-medium text-ink">{p.name}</span>
                      {p.status !== "Active" && <StatusBadge status={p.status} />}
                    </span>
                    <span className="t-small text-ink-2">{p.materials.join(", ")} · {p.rate}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="t-micro text-ink-3">September</span>
                    <span className="t-small text-ink tnum">{p.status === "Active" ? `${formatNumber(p.volumeKg)} kg · ${formatNairaShort(p.payout)}` : "Pilot volume pending approval"}</span>
                  </div>
                  {p.status === "Active" ? (
                    <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5">
                      <Meter value={p.score} />
                      <span className="t-small font-medium text-ink tnum">{p.score}</span>
                      <span className="col-span-2 t-micro text-ink-3 tnum">
                        {perf.acceptance}% accepted · {perf.onTime}% collected on time · {perf.rejected} loads rejected
                      </span>
                    </div>
                  ) : (
                    <p className="t-small text-ink-3">Site visit done 28 Sep. Waiting on the composting permit copy.</p>
                  )}
                  <div className="flex md:justify-end">
                    {p.status === "Active" ? (
                      <span className="inline-flex items-center gap-1.5 t-small text-success"><Check className="size-4" /> Approved</span>
                    ) : (
                      <Button size="sm" onClick={() => setApprove(p)}>Approve partner</Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {tab === "requests" && (
          <DataTable
            rows={requests}
            columns={reqColumns}
            rowKey={(r) => r.id}
            onRowClick={setOpenReq}
          />
        )}

        {tab === "payouts" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="t-body text-ink-2">
                <span className="font-medium text-ink">{formatNaira(due.reduce((a, p) => a + p.amount, 0))}</span> due to {due.length} partners for September, paid on 7 Oct.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => doExport("CSV", "Recycling payouts", payouts.map((p) => ({ Reference: p.id, Partner: p.partner, Period: p.period, Kg: p.kg, Amount: p.amount, Status: p.status })))}
                >
                  Export CSV
                </Button>
                {due.length > 0 && (
                  <Button size="sm" onClick={() => setPayOne({ id: "ALL", partner: `${due.length} partners`, period: "September 2026", kg: due.reduce((a, p) => a + p.kg, 0), amount: due.reduce((a, p) => a + p.amount, 0), status: "Pending", date: "" })}>
                    Pay all due
                  </Button>
                )}
              </div>
            </div>
            <DataTable rows={payouts} columns={payoutColumns} rowKey={(p) => p.id} />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!approve}
        onClose={() => setApprove(null)}
        title={`Approve ${approve?.name}?`}
        description="They'll be able to receive organic waste from Slate pickups at ₦25/kg. Make sure the composting permit has been checked in Documents first."
        confirmLabel="Approve partner"
        onConfirm={() => {
          if (!approve) return;
          setPartners((ps) => ps.map((p) => (p.id === approve.id ? { ...p, status: "Active", score: 80 } : p)));
          setMaterials((ms) => ms.map((m) => (m.partner === approve.name ? { ...m, accepting: true } : m)));
          toast.success(`${approve.name} approved`, "Organic waste is now accepted in pickup requests.");
        }}
      />

      <ConfirmDialog
        open={!!payOne}
        onClose={() => setPayOne(null)}
        title={payOne?.id === "ALL" ? `Pay ${formatNaira(payOne?.amount ?? 0)} to ${payOne?.partner}?` : `Pay ${formatNaira(payOne?.amount ?? 0)} to ${payOne?.partner}?`}
        description={`For ${formatNumber(payOne?.kg ?? 0)} kg delivered in ${payOne?.period}. Sent by bank transfer through Paystack; remittance advice goes to the partner by email.`}
        confirmLabel="Pay now"
        onConfirm={() => {
          if (!payOne) return;
          setPayouts((ps) => ps.map((p) => (payOne.id === "ALL" ? (p.status !== "Paid" ? { ...p, status: "Paid", date: new Date().toISOString() } : p) : p.id === payOne.id ? { ...p, status: "Paid", date: new Date().toISOString() } : p)));
          toast.success("Payout sent", `${formatNaira(payOne.amount)} · arrives within one working day.`);
        }}
      />

      {openReq && (
        <RequestModal
          req={openReq}
          partners={partners.filter((p) => p.status === "Active").map((p) => p.name)}
          onClose={() => setOpenReq(null)}
          onSave={(r, msg) => {
            setRequests((rs) => rs.map((x) => (x.id === r.id ? r : x)));
            setOpenReq(null);
            toast.success(msg);
          }}
        />
      )}
    </Page>
  );
}

function RequestModal({ req, partners, onClose, onSave }: { req: PickupReq; partners: string[]; onClose: () => void; onSave: (r: PickupReq, msg: string) => void }) {
  const [partner, setPartner] = useState(req.partner ?? partners.find((p) => req.materials.some((m) => MATERIALS.find((x) => x.name === m)?.partner === p)) ?? "");
  const [date, setDate] = useState(req.date ? req.date.slice(0, 10) : daysFromNow(2).slice(0, 10));
  const [kg, setKg] = useState(req.weighedKg !== undefined ? String(req.weighedKg) : "");
  const [err, setErr] = useState<string | null>(null);
  const canSchedule = req.status === "Requested" || req.status === "Scheduled";
  const canWeigh = req.status === "Collected";
  return (
    <Modal
      open
      onClose={onClose}
      title={req.customer}
      description={`${req.id} · ${req.area} · requested ${formatDate(req.requested).replace(/ \d{4}$/, "")}`}
      footer={
        canSchedule ? (
          <>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => {
                if (!partner) return setErr("Choose a partner.");
                onSave({ ...req, partner, date: new Date(`${date}T10:00:00+01:00`).toISOString(), status: "Scheduled" }, `${req.id} scheduled with ${partner}`);
              }}
            >
              {req.status === "Scheduled" ? "Save changes" : "Schedule pickup"}
            </Button>
          </>
        ) : canWeigh ? (
          <>
            <Button variant="ghost" onClick={() => onSave({ ...req, status: "Rejected", weighedKg: 0, note: "Rejected at weighing, contaminated" }, `${req.id} rejected as contaminated`)}>
              Reject load
            </Button>
            <Button
              onClick={() => {
                const n = Number(kg);
                if (!n || n <= 0) return setErr("Enter the weighed amount in kilograms.");
                onSave({ ...req, weighedKg: n, status: "Weighed" }, `${formatNumber(n)} kg recorded for ${req.id}`);
              }}
            >
              Record weight
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={onClose}>Close</Button>
        )
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        <Facts
          cols={2}
          items={[
            { label: "Materials", value: req.materials.join(", ") },
            { label: "Estimated", value: `~${formatNumber(req.estKg)} kg` },
            { label: "Status", value: <StatusBadge status={req.status === "Requested" ? "New" : req.status === "Weighed" ? "Completed" : req.status === "Collected" ? "In progress" : req.status} /> },
            { label: "Weighed", value: req.weighedKg !== undefined ? `${formatNumber(req.weighedKg)} kg` : "Not yet" },
            ...(req.note ? [{ label: "Note", value: req.note, full: true }] : []),
          ]}
        />
        {canSchedule && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Recovery partner" placeholder="Choose" value={partner} onChange={(e) => { setPartner(e.target.value); setErr(null); }} options={partners} error={err ?? undefined} />
            <DatePicker label="Collection date"  value={date} onChange={(date) => setDate(date)} />
          </div>
        )}
        {canWeigh && <Input label="Weighed at partner's site" inputMode="decimal" trailing={<span className="pr-3 t-small text-ink-3">kg</span>} value={kg} onChange={(e) => { setKg(e.target.value); setErr(null); }} error={err ?? undefined} />}
      </div>
    </Modal>
  );
}
