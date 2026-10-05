/**
 * Shelter Afrique Estate — local mock data for the estate manager portal.
 * Deterministic. The demo clock is Mon 5 Oct 2026, 08:12 (collection day).
 *
 * Billing model (estate agreement EA-UYO-004):
 *   waste collection ₦6,000 + Slate management ₦500 per household per month,
 *   plus ₦24,000 for common areas. Slate collects resident contributions and
 *   applies them to the association's monthly statement.
 */
import { FIRST, LAST } from "@/data";
import type { OrgComplaint, OrgInvoice } from "../_org/shared";

let s = 31207;
const rnd = () => {
  s = (s * 16807) % 2147483647;
  return (s - 1) / 2147483646;
};
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)]!;
const at = (date: string, hh: number, mm = 0) => `${date}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00+01:00`;
const ref = (n: number) => {
  const c = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let o = "";
  for (let i = 0; i < n; i++) o += c[Math.floor(rnd() * c.length)];
  return o;
};

export const ESTATE = {
  name: "Shelter Afrique Estate",
  association: "Shelter Afrique Estate Residents Association",
  address: "Shelter Afrique Estate, off Udo Udoma Avenue, Uyo",
  households: 312,
  units: 318,
  operator: "Ufok Environmental",
  operatorFull: "Ufok Environmental Services Ltd",
  operatorId: "op-ufok",
  contract: "CT-UYO-011",
  agreement: "EA-UYO-004",
  schedule: "Mon & Thu",
  window: "06:30–12:00",
  collection: 6000,
  management: 500,
  commonAreas: 24000,
  start: "2026-05-02",
  end: "2027-05-01",
  crewLead: "Aniekan Obot",
  vehicle: "AKS 472 UF",
  support: "Emem Ukpong",
};
export const PER_HOUSEHOLD = ESTATE.collection + ESTATE.management;

export type Block = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";
export const BLOCKS: Block[] = ["A", "B", "C", "D", "E", "F", "G", "H"];
const BLOCK_UNITS: Record<Block, number> = { A: 40, B: 40, C: 38, D: 44, E: 40, F: 38, G: 40, H: 38 };
const TYPES: Record<Block, string> = {
  A: "3-bed terrace", B: "3-bed terrace", C: "4-bed semi-detached", D: "2-bed flat",
  E: "3-bed bungalow", F: "2-bed flat", G: "4-bed semi-detached", H: "3-bed bungalow",
};
export const COLLECTION_POINTS = [
  { id: "CP-1", name: "Main gate bin bay", blocks: ["A", "B"] as Block[], bins: 6, note: "Beside the security post. Truck enters from Udo Udoma Avenue." },
  { id: "CP-2", name: "Clubhouse lane", blocks: ["C", "D"] as Block[], bins: 8, note: "Behind the clubhouse. Keep the lane clear of parked cars on Mon and Thu." },
  { id: "CP-3", name: "Water tank road", blocks: ["E", "F"] as Block[], bins: 6, note: "Under the overhead tank. Gate key held by Block E warden." },
  { id: "CP-4", name: "Back gate bay", blocks: ["G", "H"] as Block[], bins: 6, note: "Back gate opens 06:15 on collection days." },
];
export const pointFor = (b: Block) => COLLECTION_POINTS.find((p) => p.blocks.includes(b))!;

export type PayState = "Paid" | "Partial" | "Unpaid";
export interface Property {
  id: string;
  unit: string;
  block: Block;
  type: string;
  status: "Occupied" | "Vacant" | "Under renovation";
  resident?: string;
  phone?: string;
  email?: string;
  association: "Member" | "Pending" | "Not joined" | "—";
  collection: "Active" | "Paused" | "Not enrolled";
  payment: PayState | "—";
  paid: number;
  point: string;
  since?: string;
  account: "Active" | "Inactive" | "Suspended" | "—";
}

/* Exact October picture: 285 paid, 6 partial (₦3,000 each), 21 unpaid — 27 households owe ₦157,500. */
const NOT_OCCUPIED: Record<string, Property["status"]> = { "A-17": "Vacant", "C-31": "Under renovation", "D-08": "Vacant", "D-40": "Vacant", "F-22": "Under renovation", "H-05": "Vacant" };
const UNPAID = new Set(["A-06", "B-19", "B-33", "C-04", "D-12", "D-27", "D-41", "E-09", "E-30", "F-03", "F-12", "F-16", "F-29", "F-35", "G-02", "G-11", "G-24", "G-38", "H-14", "H-21", "H-33"]);
const PARTIAL = new Set(["A-28", "C-15", "E-22", "F-07", "G-17", "H-30"]);
const PENDING = new Set(["A-39", "B-04", "C-22", "D-19", "D-33", "E-14", "F-26", "G-29", "H-09"]);
const NOT_JOINED = new Set(["A-06", "B-33", "C-04", "D-27", "D-41", "E-30", "F-03", "F-16", "F-35", "G-02", "G-24", "G-38", "H-21", "H-36", "B-12"]);
const INACTIVE = new Set(["A-11", "B-25", "C-09", "C-36", "D-03", "D-22", "E-18", "E-37", "F-31", "G-07", "G-33", "H-17", "H-26", "B-38"]);
const SUSPENDED = new Set(["F-12", "G-11"]);

const names = new Set<string>();
const uniqueName = () => {
  for (;;) {
    const n = `${pick(FIRST)} ${pick(LAST)}`;
    if (!names.has(n)) {
      names.add(n);
      return n;
    }
  }
};

export const properties: Property[] = BLOCKS.flatMap((b) =>
  Array.from({ length: BLOCK_UNITS[b] }, (_, i): Property => {
    const unit = `${b}-${String(i + 1).padStart(2, "0")}`;
    const notOcc = NOT_OCCUPIED[unit];
    const resident = notOcc ? undefined : unit === "C-07" ? "Uduak Essien" : uniqueName();
    const payment: Property["payment"] = notOcc ? "—" : UNPAID.has(unit) ? "Unpaid" : PARTIAL.has(unit) ? "Partial" : "Paid";
    const phone = `+234 ${pick(["803", "806", "813", "816", "703", "706", "810", "905", "908"])} ${Math.floor(100 + rnd() * 899)} ${Math.floor(1000 + rnd() * 8999)}`;
    const month = pick(["05", "05", "05", "06", "06", "07", "08", "09"]);
    return {
      id: `prop-${unit}`,
      unit,
      block: b,
      type: TYPES[b],
      status: notOcc ?? "Occupied",
      resident,
      phone: resident ? phone : undefined,
      email: resident ? `${resident.split(" ")[0]!.toLowerCase()}.${resident.split(" ")[1]!.toLowerCase()}@${pick(["gmail.com", "gmail.com", "yahoo.com", "outlook.com"])}` : undefined,
      association: notOcc ? "—" : PENDING.has(unit) ? "Pending" : NOT_JOINED.has(unit) ? "Not joined" : "Member",
      collection: notOcc ? (notOcc === "Under renovation" ? "Paused" : "Not enrolled") : "Active",
      payment,
      paid: payment === "Paid" ? PER_HOUSEHOLD : payment === "Partial" ? 3000 : 0,
      point: pointFor(b).id,
      since: resident ? `2026-${month}-${String(2 + Math.floor(rnd() * 26)).padStart(2, "0")}` : undefined,
      account: notOcc ? "—" : SUSPENDED.has(unit) ? "Suspended" : INACTIVE.has(unit) ? "Inactive" : "Active",
    };
  }),
);

export const occupied = properties.filter((p) => p.status === "Occupied");
export const owing = occupied.filter((p) => p.payment !== "Paid");
export const billing = {
  month: "October 2026",
  billed: occupied.length,
  paid: occupied.filter((p) => p.payment === "Paid").length,
  partial: occupied.filter((p) => p.payment === "Partial").length,
  unpaid: occupied.filter((p) => p.payment === "Unpaid").length,
  collected: occupied.reduce((a, p) => a + p.paid, 0),
  gross: occupied.length * PER_HOUSEHOLD,
  outstanding: owing.reduce((a, p) => a + (PER_HOUSEHOLD - p.paid), 0),
  due: "2026-10-07",
};

export const blockStats = BLOCKS.map((b) => {
  const units = properties.filter((p) => p.block === b);
  const occ = units.filter((p) => p.status === "Occupied");
  return {
    block: b,
    units: units.length,
    households: occ.length,
    owing: occ.filter((p) => p.payment !== "Paid").length,
    members: occ.filter((p) => p.association === "Member").length,
  };
});

/* ---------- Today's run (Mon 5 Oct). A and B are done; C is in progress. ---------- */
export interface BlockRunState {
  block: Block;
  bins: number;
  done: number;
  started?: string;
  finished?: string;
  eta: string;
}
export const todayRun: BlockRunState[] = [
  { block: "A", bins: 39, done: 39, started: "06:30", finished: "06:58", eta: "06:30" },
  { block: "B", bins: 40, done: 40, started: "07:02", finished: "07:31", eta: "07:02" },
  { block: "C", bins: 37, done: 22, started: "07:40", eta: "07:40" },
  { block: "D", bins: 42, done: 0, eta: "08:35" },
  { block: "E", bins: 40, done: 0, eta: "09:20" },
  { block: "F", bins: 37, done: 0, eta: "10:05" },
  { block: "G", bins: 40, done: 0, eta: "10:45" },
  { block: "H", bins: 37, done: 0, eta: "11:25" },
];

/* ---------- Collections calendar ---------- */
export type CollectionStatus = "Completed" | "Missed" | "Upcoming" | "In progress" | "Late" | "Rescheduled";
export interface Collection {
  id: string;
  date: string; // ISO date (yyyy-mm-dd)
  kind: "Estate collection" | "Recycling" | "Bulk pickup";
  block?: Block;
  unit?: string;
  window: string;
  status: CollectionStatus;
  done?: string;
  bins?: number;
  note?: string;
}

const COLLECTION_DAYS = [
  "2026-09-14", "2026-09-17", "2026-09-21", "2026-09-24", "2026-09-28", "2026-10-02",
  "2026-10-05", "2026-10-08", "2026-10-12", "2026-10-15", "2026-10-19", "2026-10-22", "2026-10-26", "2026-10-29",
];
const STARTS: Record<Block, [number, number]> = { A: [6, 30], B: [7, 2], C: [7, 40], D: [8, 35], E: [9, 20], F: [10, 5], G: [10, 45], H: [11, 25] };
const hhmm = (h: number, m: number) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
const addMin = ([h, m]: [number, number], d: number): [number, number] => {
  const t = h * 60 + m + d;
  return [Math.floor(t / 60), t % 60];
};

let pu = 9120;
export const collections: Collection[] = [
  ...COLLECTION_DAYS.flatMap((date) =>
    BLOCKS.map((b): Collection => {
      const start = STARTS[b];
      const win = `${hhmm(...start)}–${hhmm(...addMin(start, 45))}`;
      const bins = blockStats.find((x) => x.block === b)!.households;
      const id = `PU-26-${String(pu++).padStart(5, "0")}`;
      if (date === "2026-10-05") {
        const run = todayRun.find((r) => r.block === b)!;
        if (run.finished) return { id, date, kind: "Estate collection", block: b, window: win, status: "Completed", done: run.finished, bins };
        if (run.started) return { id, date, kind: "Estate collection", block: b, window: win, status: "In progress", bins, note: `${run.done} of ${run.bins} bins so far` };
        return { id, date, kind: "Estate collection", block: b, window: win, status: "Upcoming", bins };
      }
      if (date > "2026-10-05") return { id, date, kind: "Estate collection", block: b, window: win, status: "Upcoming", bins };
      if (date === "2026-09-24" && b === "F")
        return { id, date, kind: "Estate collection", block: b, window: win, status: "Missed", bins, note: "Truck broke down on Water tank road. Recovered Fri 25 Sep, 10:40." };
      if (date === "2026-09-14" && b === "H") return { id, date, kind: "Estate collection", block: b, window: win, status: "Late", done: "12:48", bins, note: "Finished 48 min after the window." };
      if (date === "2026-10-02")
        return { id, date, kind: "Estate collection", block: b, window: win, status: "Completed", done: hhmm(...addMin(start, 28 + Math.floor(rnd() * 12))), bins, note: "Moved from Thu 1 Oct (Independence Day)." };
      return { id, date, kind: "Estate collection", block: b, window: win, status: "Completed", done: hhmm(...addMin(start, 24 + Math.floor(rnd() * 16))), bins };
    }),
  ),
  { id: "PU-26-09311", date: "2026-09-19", kind: "Recycling", window: "09:00–12:00", status: "Completed", done: "11:36", note: "1,240 kg sorted — PET, cans, cardboard. CP-1 and CP-3." },
  { id: "PU-26-09466", date: "2026-10-17", kind: "Recycling", window: "09:00–12:00", status: "Upcoming", note: "Monthly recyclables. Residents bring sorted bags to CP-1 and CP-3." },
  { id: "PU-26-09402", date: "2026-09-29", kind: "Bulk pickup", unit: "G-03", window: "10:00–12:00", status: "Completed", done: "10:52", note: "Old sofa set and a broken water heater." },
  { id: "PU-26-09488", date: "2026-10-07", kind: "Bulk pickup", unit: "D-14", window: "10:00–12:00", status: "Upcoming", note: "Moving out — wardrobe, two mattresses, cartons." },
  { id: "PU-26-09491", date: "2026-10-10", kind: "Bulk pickup", unit: "B-21", window: "14:00–16:00", status: "Upcoming", note: "Renovation debris, 9 bags. Quote ₦18,500 accepted." },
];

/* ---------- Resident payment history ---------- */
export interface ResidentPayment {
  id: string;
  month: string;
  amount: number;
  date: string;
  method: string;
  status: "Successful" | "Partial" | "Unpaid";
}
const MONTHS = [
  ["October 2026", "2026-10"], ["September 2026", "2026-09"], ["August 2026", "2026-08"], ["July 2026", "2026-07"], ["June 2026", "2026-06"], ["May 2026", "2026-05"],
] as const;
export function paymentHistory(p: Property): ResidentPayment[] {
  if (!p.resident) return [];
  let local = p.unit.charCodeAt(0) * 97 + Number(p.unit.slice(2)) * 31;
  const r = () => {
    local = (local * 16807) % 2147483647;
    return (local - 1) / 2147483646;
  };
  return MONTHS.filter(([, k]) => !p.since || `${k}-31` >= p.since).map(([label, k], i) => {
    const method = ["Card •• " + (1000 + Math.floor(r() * 8999)).toString().slice(0, 4), "Bank transfer", "USSD", "Card"][Math.floor(r() * 4)]!;
    const id = `TXN-${"ABCDEFGHJKMNPQRSTUVWXYZ23456789"[Math.floor(r() * 31)]}${Math.floor(r() * 9)}${"KQMXPRTW"[Math.floor(r() * 8)]}${Math.floor(r() * 9)}${"ABDEFHJLN"[Math.floor(r() * 9)]}${Math.floor(r() * 9)}`;
    if (i === 0) {
      if (p.payment === "Unpaid") return { id: "—", month: label, amount: 0, date: "", method: "—", status: "Unpaid" };
      if (p.payment === "Partial") return { id, month: label, amount: 3000, date: `${k}-03`, method, status: "Partial" };
      return { id, month: label, amount: PER_HOUSEHOLD, date: `${k}-0${1 + Math.floor(r() * 5)}`, method, status: "Successful" };
    }
    return { id, month: label, amount: PER_HOUSEHOLD, date: `${k}-0${1 + Math.floor(r() * 8)}`, method, status: "Successful" };
  });
}

/* Recent payments received (feed on the payments page) */
export const recentPayments = occupied
  .filter((p) => p.payment !== "Unpaid")
  .slice(0, 400)
  .map((p, i) => ({
    id: `TXN-${ref(6)}`,
    unit: p.unit,
    resident: p.resident!,
    amount: p.paid,
    time: at(`2026-10-0${1 + (i % 5)}`, 7 + (i % 13), (i * 7) % 60),
    method: pick(["Card", "Card", "Bank transfer", "USSD", "Card"]),
  }))
  .filter((x) => x.time <= "2026-10-05T08:12")
  .sort((a, b) => b.time.localeCompare(a.time));

/* ---------- Statements (invoices to the association) ---------- */
const billTo = { name: ESTATE.association, lines: ["Attn: Uduak Essien, Estate manager", "Estate office, Block C", "Shelter Afrique Estate, Uyo"] };
function statement(id: string, month: string, period: string, issued: string, due: string, hh: number, residentsPaid: number, assocPaid: number, status: OrgInvoice["status"], paidOn?: string): OrgInvoice {
  return {
    id,
    title: `${month} estate service`,
    period,
    issued,
    due,
    billTo,
    reference: ESTATE.agreement,
    lines: [
      { label: "Waste collection", detail: `${hh} households · Mon & Thu · ${ESTATE.operator}`, qty: hh, unit: ESTATE.collection },
      { label: "Slate estate management", detail: "Resident billing, reporting and complaint handling", qty: hh, unit: ESTATE.management },
      { label: "Common areas", detail: "Clubhouse, gatehouse and 4 collection points", qty: 1, unit: ESTATE.commonAreas },
    ],
    credits: [
      { label: `Resident contributions collected by Slate`, amount: residentsPaid },
      ...(assocPaid ? [{ label: "Association payment", amount: assocPaid, date: paidOn }] : []),
    ],
    status,
    paidOn,
  };
}
export const statements: OrgInvoice[] = [
  statement("INV-SA-2610", "October", "1–31 Oct 2026", "2026-10-01", "2026-10-31", 312, billing.collected, 0, "Partial"),
  statement("INV-SA-2609", "September", "1–30 Sep 2026", "2026-09-01", "2026-09-30", 312, 302 * PER_HOUSEHOLD + 4 * 3000, 312 * PER_HOUSEHOLD + 24000 - (302 * PER_HOUSEHOLD + 4 * 3000), "Paid", "2026-09-29"),
  statement("INV-SA-2608", "August", "1–31 Aug 2026", "2026-08-01", "2026-08-31", 312, 299 * PER_HOUSEHOLD + 5 * 3000, 312 * PER_HOUSEHOLD + 24000 - (299 * PER_HOUSEHOLD + 5 * 3000), "Paid", "2026-08-28"),
  statement("INV-SA-2607", "July", "1–31 Jul 2026", "2026-07-01", "2026-07-31", 309, 291 * PER_HOUSEHOLD, 309 * PER_HOUSEHOLD + 24000 - 291 * PER_HOUSEHOLD, "Paid", "2026-07-30"),
  statement("INV-SA-2606", "June", "1–30 Jun 2026", "2026-06-01", "2026-06-30", 304, 279 * PER_HOUSEHOLD, 304 * PER_HOUSEHOLD + 24000 - 279 * PER_HOUSEHOLD, "Paid", "2026-06-27"),
  statement("INV-SA-2605", "May", "2–31 May 2026", "2026-05-02", "2026-05-31", 298, 251 * PER_HOUSEHOLD, 298 * PER_HOUSEHOLD + 24000 - 251 * PER_HOUSEHOLD, "Paid", "2026-06-02"),
];

/* Monthly participation (share of billed households who paid in full by month end) */
export const participation = {
  months: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
  billed: [298, 304, 309, 312, 312, 312],
  paid: [251, 279, 291, 299, 302, 285],
  members: [204, 241, 266, 279, 284, 288],
};

/* ---------- Complaints ---------- */
export const complaintsSeed: OrgComplaint[] = [
  {
    id: "CMP-1204", subject: "F-12", subjectLabel: "F-12 · Ini Ekpo", category: "Missed pickup", severity: "High", status: "Investigating",
    issue: "Block F bins left half-full after Thursday collection",
    detail: "The crew emptied the first row at the Water tank road bay and drove off. Four bins were still full when I checked at 11:00. This is the second time in two weeks.",
    created: at("2026-10-02", 11, 24), slaDue: at("2026-10-05", 11, 24), assignee: "Emem Ukpong", operator: ESTATE.operator, channel: "Resident app", evidence: 3, pickupId: "PU-26-09165",
    events: [
      { time: at("2026-10-02", 11, 24), title: "Raised by resident", body: "Submitted with 3 photos from the Slate app.", by: "Ini Ekpo" },
      { time: at("2026-10-02", 11, 52), title: "Assigned to Slate support", by: "Slate" },
      { time: at("2026-10-02", 14, 10), title: "Operator asked for crew report", body: "Ufok Environmental to confirm why the second row at CP-3 was skipped.", by: "Emem Ukpong" },
    ],
  },
  {
    id: "CMP-1201", subject: "C-18", subjectLabel: "C-18 · Ekaette Inyang", category: "Spillage", severity: "Medium", status: "Assigned",
    issue: "Spillage on the road outside the Block C gate",
    detail: "Leachate from the truck has stained the road outside Block C and the smell stays all day. Please have it washed down.",
    created: at("2026-10-01", 16, 2), slaDue: at("2026-10-05", 16, 2), assignee: "Emem Ukpong", operator: ESTATE.operator, channel: "Via estate manager", evidence: 1,
    events: [
      { time: at("2026-10-01", 16, 2), title: "Raised by estate manager on behalf of resident", by: "Uduak Essien" },
      { time: at("2026-10-01", 16, 40), title: "Assigned to Slate support", by: "Slate" },
    ],
  },
  {
    id: "CMP-1198", subject: "H-30", subjectLabel: "H-30 · Mbuotidem Asuquo", category: "Billing", severity: "Low", status: "New",
    issue: "Charged twice for October",
    detail: "I paid ₦3,000 by transfer and my card was also charged. The app shows October as part-paid.",
    created: at("2026-10-05", 7, 48), slaDue: at("2026-10-06", 7, 48), assignee: "Unassigned", operator: "Slate billing", channel: "WhatsApp", evidence: 2,
    events: [{ time: at("2026-10-05", 7, 48), title: "Raised by resident", body: "Sent two bank alerts on WhatsApp.", by: "Mbuotidem Asuquo" }],
  },
  {
    id: "CMP-1187", subject: "F-03", subjectLabel: "F-03 · Kufre Offiong", category: "Missed pickup", severity: "High", status: "Resolved",
    issue: "Block F not collected on Thursday 24 September",
    detail: "No truck came to the Water tank road bay at all on Thursday.",
    created: at("2026-09-24", 12, 31), slaDue: at("2026-09-25", 12, 31), assignee: "Emem Ukpong", operator: ESTATE.operator, channel: "Resident app", evidence: 2, pickupId: "PU-26-09148",
    events: [
      { time: at("2026-09-24", 12, 31), title: "Raised by resident", by: "Kufre Offiong" },
      { time: at("2026-09-24", 12, 50), title: "Operator confirmed breakdown", body: "Truck AKS 472 UF broke down on Water tank road at 10:10.", by: "Ufok Environmental" },
      { time: at("2026-09-25", 10, 40), title: "Recovery pickup completed", body: "37 bins collected by the replacement truck.", by: "Ufok Environmental" },
      { time: at("2026-09-25", 11, 5), title: "Resolved", body: "₦2,500 per household credited to the operator penalty ledger.", by: "Emem Ukpong" },
    ],
  },
  {
    id: "CMP-1179", subject: "A-14", subjectLabel: "A-14 · Nsikak Udoh", category: "Conduct", severity: "Medium", status: "Resolved",
    issue: "Crew shouting and banging bins before 6:30",
    detail: "The crew arrived at 06:05 and woke the whole of Block A.",
    created: at("2026-09-21", 6, 40), slaDue: at("2026-09-22", 6, 40), assignee: "Emem Ukpong", operator: ESTATE.operator, channel: "Resident app", evidence: 0,
    events: [
      { time: at("2026-09-21", 6, 40), title: "Raised by resident", by: "Nsikak Udoh" },
      { time: at("2026-09-21", 9, 15), title: "Crew briefed", body: "Start time moved back to 06:30 for Blocks A and B.", by: "Ufok Environmental" },
      { time: at("2026-09-21", 9, 30), title: "Resolved", by: "Emem Ukpong" },
    ],
  },
  {
    id: "CMP-1166", subject: "G-21", subjectLabel: "G-21 · Abasiama Eyo", category: "Damaged bin", severity: "Low", status: "Resolved",
    issue: "Bin lid cracked by the lifting arm",
    detail: "The lid of my 120 L bin split when the crew dropped it.",
    created: at("2026-09-14", 13, 2), slaDue: at("2026-09-17", 13, 2), assignee: "Emem Ukpong", operator: ESTATE.operator, channel: "Via estate manager", evidence: 1,
    events: [
      { time: at("2026-09-14", 13, 2), title: "Raised by estate manager on behalf of resident", by: "Uduak Essien" },
      { time: at("2026-09-16", 10, 0), title: "Replacement bin delivered", by: "Ufok Environmental" },
      { time: at("2026-09-16", 10, 5), title: "Resolved", by: "Emem Ukpong" },
    ],
  },
  {
    id: "CMP-1158", subject: "H-07", subjectLabel: "H-07 · Utibe Akpan", category: "Late pickup", severity: "Low", status: "Closed",
    issue: "Block H collected after midday",
    detail: "Bins were still out at 12:40 and the street smelt all afternoon.",
    created: at("2026-09-14", 12, 41), slaDue: at("2026-09-15", 12, 41), assignee: "Emem Ukpong", operator: ESTATE.operator, channel: "Resident app", evidence: 0,
    events: [
      { time: at("2026-09-14", 12, 41), title: "Raised by resident", by: "Utibe Akpan" },
      { time: at("2026-09-14", 12, 48), title: "Collection finished", body: "Block H completed at 12:48, 48 minutes late.", by: "Ufok Environmental" },
      { time: at("2026-09-15", 9, 0), title: "Closed", body: "Route order changed so Block H starts by 11:25.", by: "Emem Ukpong" },
    ],
  },
];

export const ESTATE_COMMITTEE = [
  { id: "m1", name: "Uduak Essien", title: "Estate manager", email: "manager@shelterafriqueuyo.ng", phone: "+234 803 551 0274", access: "Full access" },
  { id: "m2", name: "Ekemini Archibong", title: "Chairman, residents association", email: "ekemini.archibong@gmail.com", phone: "+234 806 117 4490", access: "Reports and billing" },
  { id: "m3", name: "Nkoyo Effiong", title: "Treasurer", email: "nkoyo.effiong@yahoo.com", phone: "+234 813 220 9186", access: "Billing" },
  { id: "m4", name: "Ubong Udo", title: "Sanitation secretary", email: "ubong.udo@gmail.com", phone: "+234 816 402 3311", access: "Complaints and pickups" },
];
