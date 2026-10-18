/**
 * Operator portal, business pages (company, compliance, money, quality).
 * Page-local mock data for Ufok Environmental Services Ltd (op-ufok).
 *
 * The numbers tie together across pages:
 *  - 1,912 customers = 702 Slate Home + 152 Slate Home Lite + 1,058 estate households
 *  - September gross ₦9,418,500 = 702×5,500 + 152×3,500 + 1,058×4,750
 *  - 11 missed pickups not recovered within 24h × ₦2,500 = ₦27,500 deductions
 *  - Net ₦9,391,000, paid Wed 7 Oct (matches the shared `payouts` record)
 *  - Coverage 2,400 capacity: Ewet 1,000 / Shelter Afrique 400 / Osongama 1,000
 */
import { contracts, operatorById, payouts } from "@/data";

export const UFOK = operatorById("op-ufok")!;
export const UFOK_CONTRACTS = contracts.filter((c) => c.operatorId === "op-ufok");
export const UFOK_PAYOUTS = payouts.filter((p) => p.operatorId === "op-ufok");

/* ------------------------------------------------------------------ */
/* Company profile (G4)                                                */
/* ------------------------------------------------------------------ */

export const COMPANY = {
  legalName: "Ufok Environmental Services Ltd",
  tradingName: "Ufok Environmental",
  rc: "RC 1482207",
  tin: "21948377-0001",
  incorporated: "2018-06-14",
  address: "Plot 18, Itam Industrial Layout, Itu Road, Uyo",
  depot: "6 Use Offot Road, Uyo (truck yard and sorting shed)",
  contactName: "Edidiong Johnson",
  contactRole: "Operations manager",
  phone: "803 412 7765",
  dispatch: "816 300 4412",
  email: "ops@ufokenv.ng",
  billingEmail: "accounts@ufokenv.ng",
  website: "ufokenv.ng",
  hours: "Mon–Sat, 05:30–18:00",
  description:
    "Ufok collects household and estate waste across Ewet Housing, Shelter Afrique and Osongama for Slate. Seven compactor and tipper crews run fixed weekday routes from our Use Offot yard, with a standby crew for missed-pickup recovery. Recyclables are separated at the yard and delivered to Itam Recovery Ltd.",
  areas: ["Ewet Housing Estate", "Shelter Afrique Estate", "Osongama Estate"],
  wasteTypes: ["General household", "Recyclables", "Garden waste"],
  capacity: { customers: 2400, tonnesPerDay: 38, vehicles: 9, activeVehicles: 7, staff: 46, crews: 7 },
};

export const ALL_WASTE_TYPES = [
  "General household",
  "Recyclables",
  "Garden waste",
  "Food waste",
  "Bulk items",
  "Construction debris",
  "Commercial general",
  "E-waste",
];

/* ------------------------------------------------------------------ */
/* Contracted services                                                 */
/* ------------------------------------------------------------------ */

export interface ContractedService {
  id: string;
  name: string;
  category: string;
  status: "Active" | "Pending";
  contract: string;
  rates: Array<{ label: string; rate: number; unit: string; customers: number; frequency: string }>;
  windows: string;
  wasteTypes: string[];
  areas: string[];
  since?: string;
  note?: string;
}

export const CONTRACTED_SERVICES: ContractedService[] = [
  {
    id: "household",
    name: "Household collection",
    category: "Household Waste",
    status: "Active",
    contract: "CT-UYO-011",
    rates: [
      { label: "Slate Home", rate: 5500, unit: "per customer / month", customers: 702, frequency: "Twice weekly" },
      { label: "Slate Home Lite", rate: 3500, unit: "per customer / month", customers: 152, frequency: "Weekly" },
    ],
    windows: "Ewet Mon & Thu 07:00–09:00 · Osongama Wed & Sat 07:00–09:00",
    wasteTypes: ["General household", "Garden waste"],
    areas: ["Ewet Housing Estate", "Osongama Estate"],
    since: "2026-03-15",
  },
  {
    id: "estate",
    name: "Estate waste management",
    category: "Estate Waste Management",
    status: "Active",
    contract: "CT-UYO-011",
    rates: [{ label: "Estate household", rate: 4750, unit: "per household / month", customers: 1058, frequency: "Twice weekly, central points" }],
    windows: "Shelter Afrique Tue & Fri 06:00–08:00 · Osongama Ph 2 Wed & Sat · Ewet Federal block Mon & Thu",
    wasteTypes: ["General household", "Recyclables", "Garden waste"],
    areas: ["Shelter Afrique Estate", "Osongama Estate Phase 2", "Ewet Housing Estate"],
    since: "2026-03-15",
  },
  {
    id: "recycling",
    name: "Recycling pickup",
    category: "Recycling",
    status: "Pending",
    contract: "CT-UYO-019",
    rates: [{ label: "Recycling subscriber", rate: 1000, unit: "per customer / month", customers: 0, frequency: "Monthly, Saturdays" }],
    windows: "Osongama Sat 10:00–14:00, from 1 Nov",
    wasteTypes: ["PET plastic", "Aluminium cans", "Paper & cardboard"],
    areas: ["Osongama Estate"],
    note: "Starts when you accept CT-UYO-019. The monthly Ewet recycling pilot stays billed under CT-UYO-011 until then.",
  },
];

export const ADDITIONAL_CHARGES = [
  { label: "Extra pickup", rate: 2800, unit: "per job" },
  { label: "Bulk assist (two-person crew)", rate: 14200, unit: "per job" },
  { label: "Recovery job outside your areas", rate: 3500, unit: "per job" },
  { label: "Bin replacement labour", rate: 600, unit: "per bin" },
];

export interface ServiceRequest {
  id: string;
  service: string;
  areas: string[];
  capacity: string;
  submitted: string;
  status: "Submitted" | "Under review" | "Approved" | "Declined";
  note: string;
}

export const SERVICE_REQUESTS: ServiceRequest[] = [
  {
    id: "SRQ-0042",
    service: "Bulk Waste Pickup",
    areas: ["Ewet Housing Estate", "Osongama Estate"],
    capacity: "12 jobs a week, 1 pickup truck (AKS 330 FG)",
    submitted: "2026-09-18T11:20:00+01:00",
    status: "Under review",
    note: "Itoro Effiong (Partnerships) is checking vehicle documents. Decision expected by 9 Oct.",
  },
];

/* ------------------------------------------------------------------ */
/* Service areas (G5)                                                  */
/* ------------------------------------------------------------------ */

export interface CoverageArea {
  id: string; // matches UYO_ZONES ids in ServiceAreaMap
  name: string;
  lga: string;
  neighbourhoods: string[];
  estates: Array<{ name: string; households: number; kind: "Estate contract" | "Household subscribers" }>;
  capacity: number;
  assigned: number;
  days: string;
  window: string;
  vehicles: string[];
  crews: number;
}

export const COVERAGE: CoverageArea[] = [
  {
    id: "ewet",
    name: "Ewet Housing Estate",
    lga: "Uyo LGA",
    neighbourhoods: ["Phase 1", "Phase 2", "Ewet Extension", "Federal block"],
    estates: [
      { name: "Ewet Federal block", households: 226, kind: "Estate contract" },
      { name: "Ewet Phases 1–2 and Extension", households: 642, kind: "Household subscribers" },
    ],
    capacity: 1000,
    assigned: 868,
    days: "Mon & Thu",
    window: "07:00–09:00",
    vehicles: ["AKS 214 XA", "AKS 902 QE", "UYO 903 BG"],
    crews: 3,
  },
  {
    id: "shelter",
    name: "Shelter Afrique Estate",
    lga: "Uyo LGA",
    neighbourhoods: ["Blocks A–C", "Block D", "Blocks E–F"],
    estates: [{ name: "Shelter Afrique Estate", households: 312, kind: "Estate contract" }],
    capacity: 400,
    assigned: 312,
    days: "Tue & Fri",
    window: "06:00–08:00",
    vehicles: ["AKS 588 KJ"],
    crews: 1,
  },
  {
    id: "osongama",
    name: "Osongama Estate",
    lga: "Uyo LGA",
    neighbourhoods: ["Phase 1", "Phase 2", "Osongama Extension"],
    estates: [
      { name: "Osongama Estate Phase 2", households: 520, kind: "Estate contract" },
      { name: "Osongama Phase 1 and Extension", households: 212, kind: "Household subscribers" },
    ],
    capacity: 1000,
    assigned: 732,
    days: "Wed & Sat",
    window: "07:00–09:00",
    vehicles: ["AKS 214 XA", "AKS 902 QE", "AKS 330 FG"],
    crews: 3,
  },
];

export interface CoverageRequest {
  id: string;
  kind: "Add area" | "Change capacity" | "Remove area";
  area: string;
  detail: string;
  submitted: string;
  status: "Submitted" | "Under review" | "Approved" | "Declined";
}

export const COVERAGE_REQUESTS: CoverageRequest[] = [
  { id: "CVR-0017", kind: "Change capacity", area: "Shelter Afrique Estate", detail: "400 → 480 households, from 1 Nov. Adds Saturday sweep with AKS 588 KJ.", submitted: "2026-09-28T15:04:00+01:00", status: "Under review" },
  { id: "CVR-0011", kind: "Add area", area: "Osongama Estate", detail: "Osongama Extension added to Wednesday route.", submitted: "2026-07-06T10:30:00+01:00", status: "Approved" },
];

/* ------------------------------------------------------------------ */
/* Contracts (G6)                                                      */
/* ------------------------------------------------------------------ */

export interface SlaTerm { label: string; target: string; detail?: string }
export interface ContractDoc {
  respondBy?: string;
  summary: string;
  sla: SlaTerm[];
  commercial: SlaTerm[];
  penalties: SlaTerm[];
  compliance: string[];
  clauses: Array<{ n: string; title: string; body: string }>;
  versions: Array<{ v: number; date: string; change: string }>;
  valueLabel: string;
}

export const CONTRACT_DOCS: Record<string, ContractDoc> = {
  "CT-UYO-011": {
    summary: "Household and estate collection across Ewet Housing, Shelter Afrique and Osongama for 12 months.",
    valueLabel: "₦9,418,500 a month at current customers",
    sla: [
      { label: "Collection frequency", target: "Twice weekly", detail: "Weekly for Slate Home Lite customers" },
      { label: "Pickup windows", target: "06:00–10:00", detail: "Fixed per area: Ewet Mon/Thu, Shelter Afrique Tue/Fri, Osongama Wed/Sat" },
      { label: "Maximum missed collections", target: "15 a month", detail: "Counted only when not recovered within 24 hours" },
      { label: "Missed-pickup recovery", target: "Within 24 hours" },
      { label: "Response to Slate escalations", target: "Within 2 hours", detail: "Acknowledge between 06:00 and 20:00" },
      { label: "Complaint resolution", target: "Within 48 hours" },
      { label: "Vehicles", target: "7 roadworthy", detail: "Branded, insured, running the Slate driver app" },
      { label: "Workers", target: "Verified and kitted", detail: "Hi-vis, gloves and boots; Slate ID card on every shift" },
      { label: "Waste handling", target: "No spillage, covered loads", detail: "Disposal only at AKSEPA-approved sites; recyclables kept separate" },
    ],
    commercial: [
      { label: "Slate Home", target: "₦5,500", detail: "per customer per month" },
      { label: "Slate Home Lite", target: "₦3,500", detail: "per customer per month" },
      { label: "Estate household", target: "₦4,750", detail: "per household per month" },
      { label: "Payment schedule", target: "Monthly", detail: "Paid 7 days after period end, to your verified account" },
      { label: "Additional services", target: "By invoice", detail: "Extra pickup ₦2,800 · bulk assist ₦14,200 · recovery job ₦3,500 · bin labour ₦600" },
      { label: "Termination", target: "30 days' notice", detail: "Immediate on loss of AKSEPA permit, fraud or a serious safety breach" },
    ],
    penalties: [
      { label: "Missed pickup not recovered within 24h", target: "₦2,500 each" },
      { label: "Completion below 95% in a month", target: "5% of gross" },
      { label: "Verified conduct complaint", target: "₦10,000 each" },
      { label: "Score below 75 for 3 months running", target: "Contract review" },
    ],
    compliance: [
      "CAC registration and current status report",
      "Valid AKSEPA waste-handling permit and Uyo LGA sanitation permit",
      "Fleet insurance covering every vehicle on a Slate route",
      "Vehicle particulars and roadworthiness for each truck",
      "Valid licence and guarantor form for every driver",
      "Signed disposal-site agreement and recovery-partner letter",
    ],
    clauses: [
      { n: "1", title: "Parties", body: "Slate Technologies Ltd (\"Slate\") and Ufok Environmental Services Ltd, RC 1482207 (\"the Partner\")." },
      { n: "2", title: "Scope", body: "The Partner collects waste for Slate customers assigned to it in the service areas listed in Schedule A, on the schedules Slate publishes in the operator portal." },
      { n: "3", title: "Customer relationship", body: "Customers contract with and pay Slate. The Partner does not bill, solicit or take payment from Slate customers directly." },
      { n: "4", title: "Service levels", body: "The Partner meets the service levels in Schedule B. Slate measures them from driver-app records, customer reports and spot checks." },
      { n: "5", title: "Payment", body: "Slate pays the rates in Schedule C monthly, 7 days after period end, less performance deductions, with a statement showing each line." },
      { n: "6", title: "Compliance", body: "The Partner keeps every document in Schedule D valid. Slate may pause new jobs when a required document lapses." },
      { n: "7", title: "Term and termination", body: "Twelve months from 15 March 2026. Either party may end it with 30 days' written notice. Slate may end it immediately for the reasons in 7.3." },
    ],
    versions: [
      { v: 3, date: "2026-09-02", change: "Household payout raised from ₦5,400 to ₦5,500" },
      { v: 2, date: "2026-06-01", change: "Osongama Extension added to Schedule A" },
      { v: 1, date: "2026-03-02", change: "Signed" },
    ],
  },
  "CT-UYO-019": {
    respondBy: "2026-10-12T17:00:00+01:00",
    summary: "Monthly sorted-recyclables collection in Osongama Estate, delivered to Itam Recovery Ltd.",
    valueLabel: "Up to ₦800,000 a month at full capacity (800 customers)",
    sla: [
      { label: "Collection frequency", target: "Monthly", detail: "Second Saturday of each month" },
      { label: "Pickup windows", target: "10:00–14:00" },
      { label: "Maximum missed collections", target: "8 a month", detail: "Counted only when not recovered within 48 hours" },
      { label: "Missed-pickup recovery", target: "Within 48 hours" },
      { label: "Complaint resolution", target: "Within 48 hours" },
      { label: "Vehicles", target: "1 covered truck", detail: "Separate from general-waste loads on the day" },
      { label: "Waste handling", target: "Weighbridge tickets", detail: "Delivered to Itam Recovery Ltd; ticket photo uploaded per load" },
    ],
    commercial: [
      { label: "Recycling subscriber", target: "₦1,000", detail: "per customer per month" },
      { label: "Payment schedule", target: "Monthly", detail: "Added to your CT-UYO-011 statement" },
      { label: "Contamination handling", target: "₦0", detail: "Contaminated bags are left with a tag; no charge to the customer" },
      { label: "Termination", target: "30 days' notice" },
    ],
    penalties: [
      { label: "Missed pickup not recovered within 48h", target: "₦1,000 each" },
      { label: "Load delivered without weighbridge ticket", target: "Not paid" },
    ],
    compliance: ["Recovery-partner letter from Itam Recovery Ltd", "Covered vehicle with valid roadworthiness"],
    clauses: [
      { n: "1", title: "Parties", body: "Slate Technologies Ltd and Ufok Environmental Services Ltd, RC 1482207." },
      { n: "2", title: "Scope", body: "Monthly collection of sorted PET, cans and paper from Slate recycling subscribers in Osongama Estate (Phases 1, 2 and Extension)." },
      { n: "3", title: "Delivery", body: "All recyclables go to Itam Recovery Ltd. The Partner keeps no sale proceeds; recovery value is settled between Slate and Itam Recovery." },
      { n: "4", title: "Payment", body: "₦1,000 per active subscriber per month, paid with the CT-UYO-011 statement." },
      { n: "5", title: "Term", body: "1 November 2026 to 31 October 2027." },
    ],
    versions: [{ v: 1, date: "2026-10-03", change: "Sent to operator for acceptance" }],
  },
};

/* ------------------------------------------------------------------ */
/* Payments (G13)                                                      */
/* ------------------------------------------------------------------ */

export const BANK = { bank: "Zenith Bank", last4: "4417", accountName: "Ufok Environmental Services Ltd", verified: "2026-03-02" };

export const SEPT_STATEMENT = {
  id: "PO-02600",
  period: "September 2026",
  approved: "2026-10-04T16:20:00+01:00",
  payDate: "2026-10-07T10:00:00+01:00",
  collections: 16061,
  gross: [
    { label: "Slate Home", qty: 702, unit: 5500, note: "customers × ₦5,500" },
    { label: "Slate Home Lite", qty: 152, unit: 3500, note: "customers × ₦3,500" },
    { label: "Estate households", qty: 1058, unit: 4750, note: "households × ₦4,750" },
  ],
  deductions: [{ label: "Missed pickups not recovered within 24h", qty: 11, unit: 2500, note: "pickups × ₦2,500 · CT-UYO-011 Schedule B" }],
  adjustments: [] as Array<{ label: string; amount: number; note: string }>,
};

/** The 11 missed pickups behind September's deduction. */
export const SEPT_MISSED = [
  { id: "PU-26-07514", date: "2026-09-03", area: "Osongama Ph 2", reason: "Truck AKS 588 KJ broke down on Oron Road", recovered: "Recovered after 31h" },
  { id: "PU-26-07519", date: "2026-09-03", area: "Osongama Ph 2", reason: "Truck AKS 588 KJ broke down on Oron Road", recovered: "Recovered after 31h" },
  { id: "PU-26-07722", date: "2026-09-10", area: "Ewet Phase 2", reason: "Gate locked, no answer from resident", recovered: "Recovered after 27h" },
  { id: "PU-26-07890", date: "2026-09-14", area: "Shelter Afrique Blk D", reason: "Flooded access road after rain", recovered: "Recovered after 40h" },
  { id: "PU-26-07893", date: "2026-09-14", area: "Shelter Afrique Blk D", reason: "Flooded access road after rain", recovered: "Recovered after 40h" },
  { id: "PU-26-07897", date: "2026-09-14", area: "Shelter Afrique Blk E", reason: "Flooded access road after rain", recovered: "Recovered after 40h" },
  { id: "PU-26-07902", date: "2026-09-14", area: "Shelter Afrique Blk E", reason: "Flooded access road after rain", recovered: "Recovered after 41h" },
  { id: "PU-26-08061", date: "2026-09-19", area: "Osongama Ph 1", reason: "Crew skipped close (route error)", recovered: "Recovered after 26h" },
  { id: "PU-26-08512", date: "2026-09-24", area: "Ewet Housing", reason: "Driver change, stop not loaded", recovered: "Recovered by Nwaniba Clean Crew" },
  { id: "PU-26-08530", date: "2026-09-24", area: "Ewet Housing", reason: "Driver change, stop not loaded", recovered: "Recovered by Nwaniba Clean Crew" },
  { id: "PU-26-08655", date: "2026-09-28", area: "Ewet Phase 1", reason: "Bin not out, resident disputes", recovered: "Recovered after 29h" },
];

export const OCT_RUNNING = {
  period: "October 2026",
  earnedToDate: 1_247_800,
  daysDone: 4,
  forecastGross: 9_486_500,
  adjustments: [{ label: "Shelter Afrique Block D, transferred from Nwaniba Clean Crew", amount: 10_500, note: "3 service days × ₦3,500" }],
  deductionsToDate: 0,
  payDate: "2026-11-07",
};

/** Older payouts not in the shared data (contract started 15 March). */
export const EARLY_PAYOUTS = [
  { id: "PO-02414", period: "June 2026", jobs: 14108, gross: 8_264_000, deductions: 32_500, adjustments: 0, net: 8_231_500, status: "Paid" as const, date: "2026-07-07T10:00:00+01:00" },
  { id: "PO-02311", period: "May 2026", jobs: 13692, gross: 8_011_000, deductions: 40_000, adjustments: 0, net: 7_971_000, status: "Paid" as const, date: "2026-06-07T10:00:00+01:00" },
  { id: "PO-02207", period: "April 2026", jobs: 12960, gross: 7_604_500, deductions: 62_500, adjustments: 18_000, net: 7_560_000, status: "Paid" as const, date: "2026-05-07T10:00:00+01:00" },
  { id: "PO-02102", period: "March 2026 (from 15 Mar)", jobs: 6488, gross: 3_912_000, deductions: 45_000, adjustments: 0, net: 3_867_000, status: "Paid" as const, date: "2026-04-07T10:00:00+01:00" },
];

/* ------------------------------------------------------------------ */
/* Invoices (G14)                                                      */
/* ------------------------------------------------------------------ */

export type OpInvoiceStatus = "Draft" | "Submitted" | "Approved" | "Paid" | "Rejected";
export interface OpInvoiceLine { label: string; qty: number; unit: number; ref?: string }
export interface OpInvoice {
  id: string;
  title: string;
  period: string;
  created: string;
  submitted?: string;
  status: OpInvoiceStatus;
  lines: OpInvoiceLine[];
  note?: string;
  decision?: { by: string; at: string; text: string };
  paid?: { at: string; ref: string };
}

export const VAT_RATE = 0.075;
export const invoiceSubtotal = (inv: Pick<OpInvoice, "lines">) => inv.lines.reduce((a, l) => a + l.qty * l.unit, 0);
export const invoiceTotal = (inv: Pick<OpInvoice, "lines">) => Math.round(invoiceSubtotal(inv) * (1 + VAT_RATE));

export const OP_INVOICES: OpInvoice[] = [
  {
    id: "INV-UFK-0016",
    title: "October additional services",
    period: "1–4 Oct 2026",
    created: "2026-10-04T18:40:00+01:00",
    status: "Draft",
    lines: [{ label: "Extra pickups", qty: 9, unit: 2800, ref: "9 jobs, 1–4 Oct" }],
  },
  {
    id: "INV-UFK-0015",
    title: "September additional services",
    period: "September 2026",
    created: "2026-10-02T09:15:00+01:00",
    submitted: "2026-10-02T09:22:00+01:00",
    status: "Submitted",
    lines: [
      { label: "Extra pickups", qty: 96, unit: 2800, ref: "96 jobs" },
      { label: "Bulk assists", qty: 8, unit: 14200, ref: "8 jobs" },
    ],
  },
  {
    id: "INV-UFK-0014",
    title: "Recovery crew, Nwaniba overflow",
    period: "21–25 Sep 2026",
    created: "2026-09-26T12:02:00+01:00",
    submitted: "2026-09-26T12:10:00+01:00",
    status: "Approved",
    lines: [{ label: "Recovery jobs outside your areas", qty: 18, unit: 3500, ref: "Nwaniba Road, Ikot Ekpene Road" }],
    decision: { by: "Ekaette Archibong, Finance", at: "2026-10-03T11:48:00+01:00", text: "Approved. Paid with the September payout on 7 Oct." },
  },
  {
    id: "INV-UFK-0013",
    title: "August additional services",
    period: "August 2026",
    created: "2026-09-01T10:00:00+01:00",
    submitted: "2026-09-01T10:05:00+01:00",
    status: "Paid",
    lines: [
      { label: "Extra pickups", qty: 81, unit: 2800 },
      { label: "Bulk assists", qty: 6, unit: 14200 },
    ],
    decision: { by: "Ekaette Archibong, Finance", at: "2026-09-03T14:10:00+01:00", text: "Approved." },
    paid: { at: "2026-09-07T10:00:00+01:00", ref: "TXN-PB7K3W" },
  },
  {
    id: "INV-UFK-0012",
    title: "Bin replacements, August",
    period: "August 2026",
    created: "2026-08-27T16:30:00+01:00",
    submitted: "2026-08-27T16:31:00+01:00",
    status: "Rejected",
    lines: [{ label: "Bin replacements (supply and fit)", qty: 24, unit: 2500 }],
    decision: {
      by: "Ekaette Archibong, Finance",
      at: "2026-08-29T10:12:00+01:00",
      text: "Bins are supplied by Slate under Schedule C of CT-UYO-011. Only fitting labour (₦600 a bin) is billable. Resubmit with labour only.",
    },
  },
  {
    id: "INV-UFK-0011",
    title: "July additional services",
    period: "July 2026",
    created: "2026-08-01T09:40:00+01:00",
    submitted: "2026-08-01T09:44:00+01:00",
    status: "Paid",
    lines: [
      { label: "Extra pickups", qty: 74, unit: 2800 },
      { label: "Bulk assists", qty: 5, unit: 14200 },
    ],
    decision: { by: "Ekaette Archibong, Finance", at: "2026-08-04T12:00:00+01:00", text: "Approved." },
    paid: { at: "2026-08-07T10:00:00+01:00", ref: "TXN-NC2R8D" },
  },
  {
    id: "INV-UFK-0010",
    title: "June additional services",
    period: "June 2026",
    created: "2026-07-01T08:55:00+01:00",
    submitted: "2026-07-01T09:01:00+01:00",
    status: "Paid",
    lines: [
      { label: "Extra pickups", qty: 62, unit: 2800 },
      { label: "Bulk assists", qty: 4, unit: 14200 },
    ],
    decision: { by: "Ekaette Archibong, Finance", at: "2026-07-03T15:30:00+01:00", text: "Approved." },
    paid: { at: "2026-07-07T10:00:00+01:00", ref: "TXN-MV9Q4T" },
  },
];

/** Completed billable jobs not yet on an invoice (for the create modal). */
export const BILLABLE_JOBS = [
  { id: "PU-26-08940", date: "2026-10-02", customer: "Nkoyo's Kitchen", area: "Ewet Housing", kind: "Extra pickup", amount: 2800 },
  { id: "PU-26-08946", date: "2026-10-02", customer: "Ekemini Udo", area: "Osongama Ph 1", kind: "Extra pickup", amount: 2800 },
  { id: "PU-26-08951", date: "2026-10-03", customer: "Uduak Bassey", area: "Ewet Phase 2", kind: "Bulk assist", amount: 14200 },
  { id: "PU-26-08955", date: "2026-10-03", customer: "Shelter Afrique Estate", area: "Block D", kind: "Recovery job", amount: 3500 },
  { id: "PU-26-08957", date: "2026-10-03", customer: "Shelter Afrique Estate", area: "Block D", kind: "Recovery job", amount: 3500 },
  { id: "PU-26-08962", date: "2026-10-04", customer: "Mfon Ekanem", area: "Ewet Phase 1", kind: "Extra pickup", amount: 2800 },
  { id: "PU-26-08968", date: "2026-10-04", customer: "Shelter Afrique Estate", area: "Blocks E–F", kind: "Bin labour", amount: 600 },
];

/* ------------------------------------------------------------------ */
/* Performance (G15)                                                   */
/* ------------------------------------------------------------------ */

export const WEEKS = ["13 Jul", "20 Jul", "27 Jul", "3 Aug", "10 Aug", "17 Aug", "24 Aug", "31 Aug", "7 Sep", "14 Sep", "21 Sep", "28 Sep"];
export const PERF_SERIES = {
  score: [88, 89, 89, 90, 91, 90, 92, 92, 93, 92, 93, 94],
  scorePrev: [82, 83, 84, 84, 85, 86, 86, 87, 87, 88, 88, 88],
  completion: [96.4, 96.9, 97.1, 97.3, 97.8, 97.2, 97.9, 98.0, 98.3, 97.9, 98.2, 98.1],
  missed: [6, 5, 5, 4, 3, 5, 3, 3, 2, 4, 2, 2],
  response: [74, 70, 66, 61, 58, 62, 55, 52, 50, 53, 49, 48],
};

export const SCORE_PARTS = [
  { key: "sla", label: "SLA compliance", weight: 40, points: 37.6, basis: "98.1% completion, 94.2% in window, 48 min to acknowledge escalations" },
  { key: "ratings", label: "Customer ratings", weight: 25, points: 23.5, basis: "4.7 average from 1,148 ratings in 90 days" },
  { key: "complaints", label: "Complaint rate", weight: 20, points: 18.4, basis: "7 complaints per 1,912 customers in 30 days (0.37%)" },
  { key: "missed", label: "Missed pickups", weight: 15, points: 14.5, basis: "11 not recovered within 24h out of 16,061 collections" },
];

export const SCORE_BANDS = [
  { key: "suspend", label: "Suspend review", min: 0, max: 59, effect: "New jobs paused, contract review within 14 days" },
  { key: "warning", label: "Warning", min: 60, max: 74, effect: "Written improvement plan, weekly check-ins" },
  { key: "maintain", label: "Maintain", min: 75, max: 89, effect: "Normal job allocation and payout terms" },
  { key: "reward", label: "Reward", min: 90, max: 100, effect: "First refusal on new estates in your areas" },
];

export const TARGETS = [
  { metric: "Collection completion", target: "97% or more", actual: "98.1%", status: "Met" },
  { metric: "Pickups inside the window", target: "95% or more", actual: "94.2%", status: "Below target" },
  { metric: "Missed, not recovered in 24h", target: "15 or fewer a month", actual: "11", status: "Met" },
  { metric: "Escalation acknowledged", target: "Within 2 hours", actual: "48 min average", status: "Met" },
  { metric: "Complaint resolution", target: "Within 48 hours", actual: "31 h average", status: "Met" },
  { metric: "Roadworthy vehicles on route", target: "7", actual: "7 of 9", status: "Met" },
  { metric: "Customer rating", target: "4.3 or higher", actual: "4.7", status: "Met" },
];

export const AREA_PERF = [
  { id: "ewet", area: "Ewet Housing Estate", customers: 868, completion: 98.6, window: 95.1, missed: 3, complaints: 3, rating: 4.8, score: 96 },
  { id: "shelter", area: "Shelter Afrique Estate", customers: 312, completion: 97.2, window: 92.4, missed: 4, complaints: 2, rating: 4.6, score: 91 },
  { id: "osongama", area: "Osongama Estate", customers: 732, completion: 97.9, window: 94.0, missed: 4, complaints: 2, rating: 4.6, score: 93 },
];

/* ------------------------------------------------------------------ */
/* Complaints (G16)                                                    */
/* ------------------------------------------------------------------ */

export type OpComplaintStatus = "Open" | "Responded" | "Resolved" | "Escalated";
export interface OpComplaint {
  id: string;
  customer: string;
  address: string;
  area: string;
  category: "Missed pickup" | "Late pickup" | "Spillage" | "Conduct" | "Damaged bin";
  issue: string;
  pickupId?: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  created: string;
  passed: string;
  slaDue: string;
  status: OpComplaintStatus;
  evidence: number;
  response?: { at: string; by: string; text: string; recovered?: string };
  resolution?: { at: string; text: string };
}

export const OP_COMPLAINTS: OpComplaint[] = [
  {
    id: "CMP-1204",
    customer: "Shelter Afrique Estate",
    address: "Block D gate, Shelter Afrique Estate",
    area: "Shelter Afrique",
    category: "Spillage",
    issue: "Waste spilled at the Block D gate during this morning's collection and was left on the road.",
    pickupId: "PU-26-08977",
    severity: "Medium",
    created: "2026-10-05T07:31:00+01:00",
    passed: "2026-10-05T07:46:00+01:00",
    slaDue: "2026-10-05T19:46:00+01:00",
    status: "Open",
    evidence: 2,
  },
  {
    id: "CMP-1199",
    customer: "Ekemini Udo",
    address: "22 Osongama Estate Phase 2",
    area: "Osongama",
    category: "Missed pickup",
    issue: "Bin was not collected on Saturday morning. Truck passed the close without stopping.",
    pickupId: "PU-26-08791",
    severity: "High",
    created: "2026-10-04T09:58:00+01:00",
    passed: "2026-10-04T10:12:00+01:00",
    slaDue: "2026-10-05T10:12:00+01:00",
    status: "Open",
    evidence: 1,
  },
  {
    id: "CMP-1201",
    customer: "Imaobong Akpan",
    address: "14 Ewet Housing Estate",
    area: "Ewet Housing",
    category: "Damaged bin",
    issue: "Bin lid cracked after collection.",
    pickupId: "PU-26-08640",
    severity: "Low",
    created: "2026-09-29T09:02:00+01:00",
    passed: "2026-09-29T09:40:00+01:00",
    slaDue: "2026-10-01T09:40:00+01:00",
    status: "Responded",
    evidence: 2,
    response: { at: "2026-09-30T14:05:00+01:00", by: "Edidiong Johnson", text: "Lid hinge cracked when the bin was lifted. Replacement lid will be fitted on Thursday's collection (8 Oct) by Emmanuel's crew." },
  },
  {
    id: "CMP-1196",
    customer: "Utibe Essien",
    address: "5 Osongama Phase 1",
    area: "Osongama",
    category: "Late pickup",
    issue: "Crew arrived after 11:00. Our window is 07:00–09:00.",
    pickupId: "PU-26-08702",
    severity: "Medium",
    created: "2026-10-01T11:40:00+01:00",
    passed: "2026-10-01T11:52:00+01:00",
    slaDue: "2026-10-03T11:52:00+01:00",
    status: "Resolved",
    evidence: 0,
    response: { at: "2026-10-01T13:10:00+01:00", by: "Edidiong Johnson", text: "Public holiday traffic on Oron Road held the truck. Route now starts from the Phase 1 end on Wednesdays." },
    resolution: { at: "2026-10-02T09:00:00+01:00", text: "Customer accepted the explanation. No charge." },
  },
  {
    id: "CMP-1190",
    customer: "Shelter Afrique Estate",
    address: "Main gate, Shelter Afrique Estate",
    area: "Shelter Afrique",
    category: "Conduct",
    issue: "Crew member argued with our gateman about where bins should be left.",
    severity: "Medium",
    created: "2026-09-27T08:20:00+01:00",
    passed: "2026-09-27T08:41:00+01:00",
    slaDue: "2026-09-29T08:41:00+01:00",
    status: "Resolved",
    evidence: 0,
    response: { at: "2026-09-27T12:30:00+01:00", by: "Edidiong Johnson", text: "Spoke with the crew lead and the estate manager. Agreed bin point is left of the gatehouse." },
    resolution: { at: "2026-09-28T10:15:00+01:00", text: "Estate manager confirmed resolved. Not counted as a verified conduct complaint." },
  },
  {
    id: "CMP-1187",
    customer: "Aniekan Obot",
    address: "31 Ewet Phase 2",
    area: "Ewet Housing",
    category: "Missed pickup",
    issue: "No collection on Thursday.",
    pickupId: "PU-26-08603",
    severity: "High",
    created: "2026-09-25T10:05:00+01:00",
    passed: "2026-09-25T10:20:00+01:00",
    slaDue: "2026-09-26T10:20:00+01:00",
    status: "Resolved",
    evidence: 1,
    response: { at: "2026-09-25T11:00:00+01:00", by: "Edidiong Johnson", text: "Standby crew dispatched.", recovered: "2026-09-26T05:40:00+01:00" },
    resolution: { at: "2026-09-26T05:40:00+01:00", text: "Recovered in 19 hours. No deduction." },
  },
  {
    id: "CMP-1183",
    customer: "Imaobong Akpan",
    address: "14 Ewet Housing Estate",
    area: "Ewet Housing",
    category: "Missed pickup",
    issue: "Bin was not collected on Thursday morning.",
    pickupId: "PU-26-08512",
    severity: "High",
    created: "2026-09-24T10:14:00+01:00",
    passed: "2026-09-24T10:30:00+01:00",
    slaDue: "2026-09-25T10:30:00+01:00",
    status: "Resolved",
    evidence: 1,
    response: { at: "2026-09-24T15:45:00+01:00", by: "Edidiong Johnson", text: "Driver change that morning; stop was not loaded to the new driver's route. Standby crew was already out at Osongama." },
    resolution: { at: "2026-09-25T11:20:00+01:00", text: "Recovered by Nwaniba Clean Crew at Slate's request. Counted in September deductions." },
  },
  {
    id: "CMP-1171",
    customer: "Idara Ekpo",
    address: "9 Osongama Extension",
    area: "Osongama",
    category: "Spillage",
    issue: "Leachate left on the driveway after collection.",
    severity: "Low",
    created: "2026-09-02T08:44:00+01:00",
    passed: "2026-09-02T09:01:00+01:00",
    slaDue: "2026-09-04T09:01:00+01:00",
    status: "Resolved",
    evidence: 1,
    response: { at: "2026-09-02T12:00:00+01:00", by: "Edidiong Johnson", text: "Crew returned and washed down the driveway." },
    resolution: { at: "2026-09-02T15:30:00+01:00", text: "Customer confirmed." },
  },
];

/* ------------------------------------------------------------------ */
/* Reviews (G17)                                                       */
/* ------------------------------------------------------------------ */

export const RATING_SUMMARY = {
  average: 4.7,
  count: 1148,
  distribution: { 5: 902, 4: 186, 3: 37, 2: 13, 1: 10 } as Record<number, number>,
  categories: [
    { key: "punctuality", label: "Punctuality", value: 4.6, trend: [4.2, 4.3, 4.4, 4.5, 4.5, 4.6, 4.6] },
    { key: "professionalism", label: "Professionalism", value: 4.8, trend: [4.5, 4.6, 4.6, 4.7, 4.7, 4.8, 4.8] },
    { key: "quality", label: "Service quality", value: 4.7, trend: [4.3, 4.4, 4.5, 4.6, 4.6, 4.7, 4.7] },
  ],
  months: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
  monthly: [4.3, 4.4, 4.5, 4.6, 4.6, 4.7, 4.7],
  monthlyCount: [96, 141, 168, 182, 197, 214, 38],
};

export interface OpReview {
  id: string;
  customer: string;
  area: string;
  rating: number;
  punctuality: number;
  professionalism: number;
  quality: number;
  comment?: string;
  date: string;
  pickupId: string;
  driver: string;
}

export const OP_REVIEWS: OpReview[] = [
  { id: "r1", customer: "Imaobong A.", area: "Ewet Housing", rating: 5, punctuality: 5, professionalism: 5, quality: 5, comment: "Crew came at 7:20 and left the gate clean. The SMS before arrival is useful.", date: "2026-10-05T07:58:00+01:00", pickupId: "PU-26-08813", driver: "Emmanuel Udo" },
  { id: "r2", customer: "Ekemini U.", area: "Osongama Ph 2", rating: 2, punctuality: 1, professionalism: 3, quality: 2, comment: "Truck drove past our close on Saturday. Reported it, still waiting.", date: "2026-10-04T10:03:00+01:00", pickupId: "PU-26-08791", driver: "Daniel Inyang" },
  { id: "r3", customer: "Nsikak E.", area: "Shelter Afrique", rating: 5, punctuality: 5, professionalism: 5, quality: 4, comment: "Reliable. Much better than the collectors we used to chase every month.", date: "2026-10-02T08:10:00+01:00", pickupId: "PU-26-08744", driver: "Godwin Etuk" },
  { id: "r4", customer: "Utibe E.", area: "Osongama Ph 1", rating: 3, punctuality: 2, professionalism: 4, quality: 4, comment: "Came late, around 11, but did a good job.", date: "2026-10-01T11:45:00+01:00", pickupId: "PU-26-08702", driver: "Daniel Inyang" },
  { id: "r5", customer: "Idara O.", area: "Ewet Phase 1", rating: 5, punctuality: 5, professionalism: 5, quality: 5, comment: "Driver was polite and helped carry the second bin to the truck.", date: "2026-09-28T07:40:00+01:00", pickupId: "PU-26-08650", driver: "Emmanuel Udo" },
  { id: "r6", customer: "Mfon E.", area: "Ewet Phase 1", rating: 4, punctuality: 4, professionalism: 5, quality: 4, date: "2026-09-28T07:52:00+01:00", pickupId: "PU-26-08651", driver: "Emmanuel Udo" },
  { id: "r7", customer: "Aniekan O.", area: "Ewet Phase 2", rating: 4, punctuality: 3, professionalism: 4, quality: 5, comment: "Missed us once but the recovery truck came first thing the next morning.", date: "2026-09-26T06:10:00+01:00", pickupId: "PU-26-08603", driver: "Samuel Akpan" },
  { id: "r8", customer: "Ini B.", area: "Shelter Afrique", rating: 5, punctuality: 5, professionalism: 5, quality: 5, comment: "Three weeks running they've been inside the window.", date: "2026-09-25T07:05:00+01:00", pickupId: "PU-26-08588", driver: "Godwin Etuk" },
  { id: "r9", customer: "Enobong A.", area: "Osongama Ph 2", rating: 4, punctuality: 4, professionalism: 4, quality: 3, comment: "They don't always close the bin lid properly after emptying.", date: "2026-09-23T08:32:00+01:00", pickupId: "PU-26-08540", driver: "Daniel Inyang" },
  { id: "r10", customer: "Kufre U.", area: "Ewet Phase 2", rating: 5, punctuality: 5, professionalism: 5, quality: 5, date: "2026-09-21T07:31:00+01:00", pickupId: "PU-26-08497", driver: "Emmanuel Udo" },
  { id: "r11", customer: "Ofonime N.", area: "Shelter Afrique", rating: 1, punctuality: 1, professionalism: 2, quality: 1, comment: "Road flooded and nobody came for two days. Waste sat at the gate.", date: "2026-09-16T09:12:00+01:00", pickupId: "PU-26-07893", driver: "Godwin Etuk" },
  { id: "r12", customer: "Itoro A.", area: "Osongama Ext.", rating: 5, punctuality: 4, professionalism: 5, quality: 5, comment: "Washed the driveway after the leak last time. Appreciated.", date: "2026-09-12T07:48:00+01:00", pickupId: "PU-26-07811", driver: "Samuel Akpan" },
  { id: "r13", customer: "Emem J.", area: "Ewet Federal", rating: 4, punctuality: 4, professionalism: 4, quality: 4, comment: "Central point is kept tidier since Ufok took over.", date: "2026-09-10T08:01:00+01:00", pickupId: "PU-26-07720", driver: "Emmanuel Udo" },
  { id: "r14", customer: "Abasiama E.", area: "Osongama Ph 2", rating: 5, punctuality: 5, professionalism: 5, quality: 5, date: "2026-09-09T07:22:00+01:00", pickupId: "PU-26-07701", driver: "Daniel Inyang" },
];

/* ------------------------------------------------------------------ */
/* Documents + verification (G2)                                       */
/* ------------------------------------------------------------------ */

export type DocStatus = "Verified" | "Expiring" | "Expired" | "Pending review" | "Rejected";
export type DocCategory =
  | "Registration"
  | "Permits and licences"
  | "Company and tax"
  | "Vehicles"
  | "Drivers"
  | "Insurance"
  | "Disposal and recovery"
  | "Contracts";

export interface DocVersion { v: number; uploaded: string; by: string; size: string; status: DocStatus | "Superseded"; note?: string }
export interface CompanyDoc {
  id: string;
  name: string;
  category: DocCategory;
  detail?: string;
  issuer?: string;
  expires?: string;
  versions: DocVersion[]; // newest first
}

const ed = "Edidiong Johnson";

export const COMPANY_DOCS: CompanyDoc[] = [
  { id: "doc-cac", name: "CAC certificate of incorporation", category: "Registration", issuer: "Corporate Affairs Commission", versions: [{ v: 1, uploaded: "2026-02-20", by: ed, size: "412 KB", status: "Verified" }] },
  { id: "doc-cac7", name: "CAC status report", category: "Registration", detail: "Directors and shareholding", issuer: "Corporate Affairs Commission", versions: [{ v: 1, uploaded: "2026-02-20", by: ed, size: "286 KB", status: "Verified" }] },
  {
    id: "doc-aksepa",
    name: "AKSEPA waste-handling permit",
    category: "Permits and licences",
    detail: "Permit AKS/EPA/WH/0447",
    issuer: "Akwa Ibom State Environmental Protection Agency",
    expires: "2026-10-31",
    versions: [
      { v: 2, uploaded: "2026-02-20", by: ed, size: "1.2 MB", status: "Expiring" },
      { v: 1, uploaded: "2026-02-12", by: ed, size: "940 KB", status: "Rejected", note: "Scan cropped: permit number and expiry date cut off." },
    ],
  },
  { id: "doc-lga", name: "Uyo LGA sanitation permit", category: "Permits and licences", issuer: "Uyo Local Government Council", expires: "2026-12-31", versions: [{ v: 1, uploaded: "2026-02-20", by: ed, size: "330 KB", status: "Verified" }] },
  { id: "doc-memart", name: "Memorandum and articles of association", category: "Company and tax", versions: [{ v: 1, uploaded: "2026-02-20", by: ed, size: "1.8 MB", status: "Verified" }] },
  { id: "doc-tin", name: "FIRS tax identification certificate", category: "Company and tax", detail: "TIN 21948377-0001", issuer: "Federal Inland Revenue Service", versions: [{ v: 1, uploaded: "2026-02-20", by: ed, size: "198 KB", status: "Verified" }] },
  {
    id: "doc-tcc",
    name: "Tax clearance certificate 2026",
    category: "Company and tax",
    issuer: "Akwa Ibom Internal Revenue Service",
    expires: "2026-12-31",
    versions: [
      { v: 2, uploaded: "2026-02-20", by: ed, size: "240 KB", status: "Verified" },
      { v: 1, uploaded: "2025-11-04", by: ed, size: "232 KB", status: "Superseded", note: "2025 certificate." },
    ],
  },
  {
    id: "doc-veh",
    name: "Vehicle particulars, active fleet",
    category: "Vehicles",
    detail: "7 active vehicles",
    versions: [
      { v: 3, uploaded: "2026-09-08", by: ed, size: "2.0 MB", status: "Verified", note: "Added AKS 330 FG." },
      { v: 2, uploaded: "2026-05-14", by: ed, size: "1.7 MB", status: "Superseded" },
      { v: 1, uploaded: "2026-02-20", by: ed, size: "1.5 MB", status: "Superseded" },
    ],
  },
  { id: "doc-rw-588", name: "Roadworthiness certificate, AKS 588 KJ", category: "Vehicles", issuer: "Akwa Ibom Ministry of Transport", expires: "2026-10-19", versions: [{ v: 1, uploaded: "2026-04-19", by: ed, size: "180 KB", status: "Expiring" }] },
  { id: "doc-rw-415", name: "Roadworthiness certificate, AKS 415 BD", category: "Vehicles", detail: "Vehicle inactive, off Slate routes", issuer: "Akwa Ibom Ministry of Transport", expires: "2026-09-02", versions: [{ v: 1, uploaded: "2026-03-01", by: ed, size: "176 KB", status: "Expired" }] },
  { id: "doc-drv", name: "Driver licences and guarantor forms", category: "Drivers", detail: "5 active drivers", versions: [{ v: 2, uploaded: "2026-09-08", by: ed, size: "3.1 MB", status: "Verified" }, { v: 1, uploaded: "2026-02-20", by: ed, size: "2.6 MB", status: "Superseded" }] },
  { id: "doc-drv-moses", name: "Driver licence, Moses Ekpo", category: "Drivers", detail: "Driver suspended, not on routes", issuer: "FRSC", expires: "2026-09-14", versions: [{ v: 1, uploaded: "2026-03-01", by: ed, size: "210 KB", status: "Expired" }] },
  { id: "doc-fleet-ins", name: "Fleet insurance, 9 vehicles", category: "Insurance", issuer: "Leadway Assurance", expires: "2027-02-28", versions: [{ v: 1, uploaded: "2026-03-01", by: ed, size: "2.4 MB", status: "Verified" }] },
  { id: "doc-pli", name: "Public liability insurance", category: "Insurance", issuer: "AIICO Insurance", expires: "2027-03-14", versions: [{ v: 1, uploaded: "2026-03-10", by: ed, size: "1.1 MB", status: "Verified" }] },
  { id: "doc-disposal", name: "Disposal site agreement", category: "Disposal and recovery", detail: "Uyo final disposal site, Ibiaku", issuer: "AKSEPA", expires: "2027-01-31", versions: [{ v: 1, uploaded: "2026-02-20", by: ed, size: "640 KB", status: "Verified" }] },
  { id: "doc-recovery", name: "Recovery partner letter", category: "Disposal and recovery", detail: "Itam Recovery Ltd, PET and cans", issuer: "Itam Recovery Ltd", expires: "2027-04-30", versions: [{ v: 1, uploaded: "2026-05-02", by: ed, size: "220 KB", status: "Verified" }] },
  {
    id: "doc-wspa",
    name: "Waste Service Partner Agreement v3",
    category: "Contracts",
    detail: "CT-UYO-011",
    issuer: "Slate Technologies Ltd",
    versions: [
      { v: 3, uploaded: "2026-09-02", by: "Slate", size: "880 KB", status: "Verified" },
      { v: 2, uploaded: "2026-06-01", by: "Slate", size: "860 KB", status: "Superseded" },
      { v: 1, uploaded: "2026-03-02", by: "Slate", size: "842 KB", status: "Superseded" },
    ],
  },
];

/** Verification checklist (G2), the company pack Slate verifies. */
export type VerifyGroup =
  | "Registration documents"
  | "Permits and licences"
  | "Company documents"
  | "Vehicle documents"
  | "Driver documents"
  | "Insurance"
  | "Disposal and recovery";

export interface VerifyItem {
  id: string;
  group: VerifyGroup;
  name: string;
  hint: string;
  required: boolean;
  docId?: string;
  expires?: string;
}

export const VERIFY_GROUPS: Array<{ group: VerifyGroup; note: string }> = [
  { group: "Registration documents", note: "Proves Ufok is a registered company." },
  { group: "Permits and licences", note: "Required by AKSEPA and the Uyo LGA to handle waste." },
  { group: "Company documents", note: "Tax and governance." },
  { group: "Vehicle documents", note: "Every truck that runs a Slate route." },
  { group: "Driver documents", note: "Every driver on a Slate shift." },
  { group: "Insurance", note: "Fleet cover is required; liability cover where applicable." },
  { group: "Disposal and recovery", note: "Where collected waste and recyclables end up." },
];

export const VERIFY_ITEMS: VerifyItem[] = [
  { id: "v-cac", group: "Registration documents", name: "CAC certificate of incorporation", hint: "Clear scan of the original certificate", required: true, docId: "doc-cac" },
  { id: "v-cac7", group: "Registration documents", name: "CAC status report", hint: "Issued within the last 12 months", required: true, docId: "doc-cac7" },
  { id: "v-aksepa", group: "Permits and licences", name: "AKSEPA waste-handling permit", hint: "Full page, permit number and expiry visible", required: true, docId: "doc-aksepa", expires: "2026-10-31" },
  { id: "v-lga", group: "Permits and licences", name: "Uyo LGA sanitation permit", hint: "Current year", required: true, docId: "doc-lga", expires: "2026-12-31" },
  { id: "v-tin", group: "Company documents", name: "FIRS tax identification certificate", hint: "Company TIN, not a director's", required: true, docId: "doc-tin" },
  { id: "v-tcc", group: "Company documents", name: "Tax clearance certificate", hint: "Current year", required: true, docId: "doc-tcc", expires: "2026-12-31" },
  { id: "v-memart", group: "Company documents", name: "Memorandum and articles", hint: "Certified true copy", required: false, docId: "doc-memart" },
  { id: "v-veh", group: "Vehicle documents", name: "Vehicle particulars and licences", hint: "One file per vehicle or a combined PDF", required: true, docId: "doc-veh" },
  { id: "v-rw", group: "Vehicle documents", name: "Roadworthiness certificates", hint: "Every active vehicle", required: true },
  { id: "v-drv", group: "Driver documents", name: "Driver licences", hint: "Valid FRSC licence for every driver", required: true, docId: "doc-drv" },
  { id: "v-guar", group: "Driver documents", name: "Guarantor forms", hint: "Signed, with guarantor ID", required: true },
  { id: "v-fleet", group: "Insurance", name: "Fleet insurance", hint: "Covers every vehicle on a Slate route", required: true, docId: "doc-fleet-ins", expires: "2027-02-28" },
  { id: "v-pli", group: "Insurance", name: "Public liability insurance", hint: "Where applicable", required: false, docId: "doc-pli", expires: "2027-03-14" },
  { id: "v-disposal", group: "Disposal and recovery", name: "Disposal site agreement", hint: "Signed by the site operator", required: true, docId: "doc-disposal", expires: "2027-01-31" },
  { id: "v-recovery", group: "Disposal and recovery", name: "Recovery partner letter", hint: "If you collect recyclables", required: false, docId: "doc-recovery", expires: "2027-04-30" },
];
