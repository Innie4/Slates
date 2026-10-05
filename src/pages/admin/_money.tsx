/**
 * Admin — commercial & money helpers (contracts, partners, cities, finance,
 * payments, payouts, invoices, chargebacks, Smart Sweep).
 * Page-local data extensions and small presentational pieces shared by
 * the money pages. Shared data lives in `@/data`; nothing here mutates it.
 */
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import {
  chargebacks, cities, contracts, customers, operatorById, partners, payments, payouts,
  type Chargeback, type City, type Contract, type Customer, type Partner, type Payment, type Payout, type SmartSweepPlan,
} from "@/data";
import { Button, CurrencyInput, Field, Modal, Select, StateView, Textarea } from "@/components/ui";
import { DEMO_NOW, formatNaira } from "@/lib/format";
import { cn } from "@/lib/cn";

export const SLATE_ENTITY = "Slate Technologies Ltd";
const DAY = 86_400_000;

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

const at = (offsetDays: number, hh = 9, mm = 0) => {
  const d = new Date("2026-10-05T00:00:00+01:00");
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
};
export const shiftDays = (iso: string, days: number) => new Date(new Date(iso).getTime() + days * DAY).toISOString();
export const daysUntil = (iso: string) => Math.ceil((new Date(iso).getTime() - DEMO_NOW.getTime()) / DAY);

/** "4 days 15 h" / "15 h 47 min" / "Overdue by 2 days" */
export function countdown(iso: string): { label: string; overdue: boolean; hours: number } {
  const ms = new Date(iso).getTime() - DEMO_NOW.getTime();
  const hours = ms / 3_600_000;
  const abs = Math.abs(ms);
  const d = Math.floor(abs / DAY);
  const h = Math.floor((abs % DAY) / 3_600_000);
  const m = Math.floor((abs % 3_600_000) / 60_000);
  const span = d > 0 ? `${d} ${d === 1 ? "day" : "days"} ${h} h` : `${h} h ${m} min`;
  return { label: ms < 0 ? `Overdue by ${span}` : span, overdue: ms < 0, hours };
}

export function useMediaQuery(q: string) {
  const [match, setMatch] = useState(() => (typeof window !== "undefined" ? window.matchMedia(q).matches : false));
  useEffect(() => {
    const m = window.matchMedia(q);
    const h = () => setMatch(m.matches);
    h();
    m.addEventListener("change", h);
    return () => m.removeEventListener("change", h);
  }, [q]);
  return match;
}

/* ------------------------------------------------------------------ */
/* Lookups across portals                                              */
/* ------------------------------------------------------------------ */

export const customerByName = (name: string): Customer | undefined => customers.find((c) => c.name === name);
export const customerHref = (name: string) => {
  const c = customerByName(name);
  return c ? `/admin/customers/${c.id}` : undefined;
};

/* ------------------------------------------------------------------ */
/* Contracts                                                           */
/* ------------------------------------------------------------------ */

/** Three short-term operator contracts that end inside the next 60 days. */
const EXTRA_CONTRACTS: Contract[] = [
  { id: "CT-UYO-009", operatorId: "op-ufok", operatorName: "Ufok Environmental", areas: ["Ewet Housing Estate"], serviceTypes: ["Household Waste"], customerPrice: 4500, operatorPayout: 3500, capacity: 300, customers: 214, slaCompletion: 96, responseHours: 24, paymentTerms: "Monthly, 7 days after period end", penalties: "₦2,500 per missed pickup not recovered within 24h", start: "2026-04-01", end: "2026-11-30", status: "Expiring", monthlyValue: 749_000, version: 1 },
  { id: "CT-UYO-013", operatorId: "op-atlantic", operatorName: "Atlantic Coast", areas: ["Wellington Bassey Way", "Udo Udoma Avenue"], serviceTypes: ["Event Cleanup"], customerPrice: 60000, operatorPayout: 46000, capacity: 24, customers: 9, slaCompletion: 98, responseHours: 6, paymentTerms: "Per event, 7 days after completion", penalties: "₦15,000 per event not cleared by 07:00 next day", start: "2026-06-16", end: "2026-12-15", status: "Renewal approaching", monthlyValue: 414_000, version: 1 },
  { id: "CT-UYO-015", operatorId: "op-ibom", operatorName: "Ibom Hauliers", areas: ["Itam"], serviceTypes: ["Special Collection"], customerPrice: 45000, operatorPayout: 34500, capacity: 30, customers: 11, slaCompletion: 95, responseHours: 48, paymentTerms: "Monthly, 14 days after invoice", penalties: "Disposal documentation required within 48h or job unpaid", start: "2026-05-01", end: "2026-10-31", status: "Expiring", monthlyValue: 379_500, version: 1 },
];

export const allContracts: Contract[] = [...contracts, ...EXTRA_CONTRACTS].sort((a, b) => a.id.localeCompare(b.id));
export const contractByIdAll = (id: string) => allContracts.find((c) => c.id === id);
export const NEXT_CONTRACT_ID = "CT-UYO-023";

export type ContractTab = "all" | "draft" | "negotiation" | "active" | "expiring" | "terminated";
export const CONTRACT_TABS: Record<Exclude<ContractTab, "all">, Contract["status"][]> = {
  draft: ["Draft", "Internal review"],
  negotiation: ["Negotiation", "Sent to operator", "Accepted"],
  active: ["Active"],
  expiring: ["Renewal approaching", "Expiring"],
  terminated: ["Terminated", "Expired"],
};
export const isLive = (c: Contract) => ["Active", "Expiring", "Renewal approaching"].includes(c.status);

export function margin(price: number, payout: number) {
  const amount = price - payout;
  return { amount, pct: price > 0 ? (amount / price) * 100 : 0 };
}

export interface SlaTerms {
  windows: string[];
  maxMissed: number;
  complaintHours: number;
}
const SLA_OVERRIDES: Record<string, SlaTerms> = {
  "CT-UYO-011": { windows: ["06:00–08:00", "07:00–09:00"], maxMissed: 15, complaintHours: 48 },
  "CT-UYO-012": { windows: ["05:00–07:00", "21:00–23:00"], maxMissed: 8, complaintHours: 24 },
  "CT-UYO-014": { windows: ["08:00–12:00"], maxMissed: 6, complaintHours: 48 },
  "CT-UYO-017": { windows: ["07:00–09:00", "10:00–12:00"], maxMissed: 10, complaintHours: 48 },
};
export function slaTerms(c: Contract): SlaTerms {
  return SLA_OVERRIDES[c.id] ?? {
    windows: c.serviceTypes.includes("Commercial Waste") ? ["05:00–07:00", "21:00–23:00"] : ["07:00–09:00"],
    maxMissed: Math.max(4, Math.round(c.capacity * 0.006)),
    complaintHours: c.serviceTypes.includes("Commercial Waste") ? 24 : 48,
  };
}

export interface ContractVersion {
  version: number;
  date: string;
  by: string;
  change: string;
}
const VERSION_NOTES: Record<string, Array<Omit<ContractVersion, "version">>> = {
  "CT-UYO-011": [
    { date: "2026-02-24", by: "Itoro Effiong", change: "First draft from the residential template. Ewet and Shelter Afrique, payout ₦5,200." },
    { date: "2026-05-02", by: "Itoro Effiong", change: "Added Osongama Estate and recycling. Payout ₦5,400 after capacity review." },
    { date: "2026-09-02", by: "Itoro Effiong", change: "Payout ₦5,400 → ₦5,500. Approved by Aniekan Etim after Q3 SLA review." },
  ],
  "CT-UYO-012": [
    { date: "2026-03-12", by: "Itoro Effiong", change: "First draft from the commercial template." },
    { date: "2026-06-10", by: "Itoro Effiong", change: "Added Event Cleanup and the 3-breaches termination clause." },
  ],
  "CT-UYO-021": [
    { date: "2026-09-24", by: "Itoro Effiong", change: "First draft from the commercial template. Payout ₦23,000." },
    { date: "2026-10-01", by: "Itoro Effiong", change: "Operator counter-offer accepted: payout ₦23,500, 12-hour response kept." },
  ],
  "CT-UYO-008": [
    { date: "2026-03-18", by: "Itoro Effiong", change: "First draft from the residential template." },
    { date: "2026-09-14", by: "Aniekan Etim", change: "Termination notice issued after 23 missed pickups in 30 days." },
  ],
};
export function contractVersions(c: Contract): ContractVersion[] {
  const notes = VERSION_NOTES[c.id] ?? [{ date: shiftDays(new Date(c.start).toISOString(), -21).slice(0, 10), by: "Itoro Effiong", change: "First draft from the standard template." }];
  return notes.slice(0, Math.max(c.version, 1)).map((n, i) => ({ ...n, version: i + 1 })).reverse();
}

export const LIFECYCLE = ["Draft", "Internal review", "Negotiation", "Sent to operator", "Accepted", "Active", "Renewal approaching", "Renewed or ended"] as const;
export function lifecycleIndex(status: Contract["status"]) {
  switch (status) {
    case "Draft": return 0;
    case "Internal review": return 1;
    case "Negotiation": return 2;
    case "Sent to operator": return 3;
    case "Accepted": return 4;
    case "Active": return 5;
    case "Expiring":
    case "Renewal approaching": return 6;
    case "Terminated":
    case "Expired": return 7;
  }
}

export interface ContractTemplate {
  id: string;
  name: string;
  kind: string;
  version: string;
  updated: string;
  clauses: string[];
  price: number;
  payout: number;
  unit: string;
  inUse: number;
}
export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  { id: "residential", name: "Waste Service Partner Agreement", kind: "Residential", version: "v3.2", updated: "2026-09-02", price: 7000, payout: 5500, unit: "per household / month", inUse: 4, clauses: ["Service areas and collection windows", "Twice-weekly collection standard", "Missed-pickup recovery within 24 hours", "₦2,500 per unrecovered missed pickup", "5% deduction below 95% completion", "Monthly payout, 7 days after period end", "Customer data stays with Slate", "Operator replacement on repeated breach"] },
  { id: "commercial", name: "Waste Service Partner Agreement", kind: "Commercial", version: "v2.1", updated: "2026-06-10", price: 30000, payout: 23000, unit: "per site / month", inUse: 4, clauses: ["Custom frequency up to twice daily", "Food-waste and cardboard handling", "12-hour response on service requests", "₦7,500 per missed commercial pickup", "Termination after 3 breaches in 90 days", "Monthly payout, 7 days after period end"] },
  { id: "institutional", name: "Waste Service Partner Agreement", kind: "Institutional", version: "v1.4", updated: "2026-04-11", price: 180000, payout: 141000, unit: "per facility / month", inUse: 2, clauses: ["Facility-level schedules", "Disposal documentation for every load", "Non-hazardous medical waste handling", "Quarterly performance review", "5% deduction below 95% completion", "Monthly payout, 14 days after invoice"] },
  { id: "recycling", name: "Waste Service Partner Agreement", kind: "Recycling", version: "v1.1", updated: "2026-08-19", price: 1500, payout: 1000, unit: "per subscriber / month", inUse: 1, clauses: ["Monthly sorted-materials pickup", "Delivery to Slate-approved recovery partners only", "Weight tickets for every delivery", "Recovery report by the 5th", "Monthly payout"] },
];

/* ------------------------------------------------------------------ */
/* Partners                                                            */
/* ------------------------------------------------------------------ */

const EXTRA_PARTNERS: Partner[] = [
  { id: "pt-10", name: "Atlantic Coast Sanitation", type: "Waste company", contact: "Kufre Inyang", agreement: "CT-UYO-012", status: "Active", locations: ["Uyo"], since: "2026-03-19", services: ["Commercial", "Event cleanup"] },
  { id: "pt-11", name: "Ibom Hauliers & Waste Co.", type: "Waste company", contact: "Ofonime Ekpo", agreement: "CT-UYO-014", status: "Active", locations: ["Uyo"], since: "2026-04-07", services: ["Institutional", "Bulk", "Special collection"] },
  { id: "pt-12", name: "Flutterwave", type: "Payment provider", contact: "Merchant success", agreement: "Merchant agreement", status: "Active", locations: ["Lagos"], since: "2026-03-01", services: ["Cards", "Bank transfers", "Fallback processing"] },
  { id: "pt-13", name: "Federal Housing Estate Residents Association", type: "Estate", contact: "Mbuotidem Udoh", agreement: "EA-UYO-006", status: "Active", locations: ["Federal Housing Estate"], since: "2026-07-01", services: ["Estate waste management"] },
  { id: "pt-14", name: "Rivers State Waste Management Agency", type: "Government", contact: "Directorate of Licensing", agreement: "Application RIWAMA/PH/0417", status: "Pending", locations: ["Port Harcourt"], since: "2026-08-20", services: ["Regulatory"] },
  { id: "pt-15", name: "Uyo Glass & Can Recovery", type: "Recycling company", contact: "Nkoyo Bassey", agreement: "RA-UYO-005", status: "Negotiation", locations: ["Abak Road, Uyo"], since: "2026-09-18", services: ["Glass", "Aluminium cans"] },
];
export const allPartners: Partner[] = [...partners, ...EXTRA_PARTNERS];
export const partnerById = (id: string) => allPartners.find((p) => p.id === id);
export const PARTNER_TYPES: Array<{ type: Partner["type"]; plural: string }> = [
  { type: "Waste company", plural: "Waste companies" },
  { type: "Recycling company", plural: "Recycling companies" },
  { type: "Estate", plural: "Estates" },
  { type: "Property developer", plural: "Property developers" },
  { type: "Institution", plural: "Institutions" },
  { type: "Corporate partner", plural: "Corporate partners" },
  { type: "Government", plural: "Government" },
  { type: "Payment provider", plural: "Payment providers" },
  { type: "Financial partner", plural: "Financial partners" },
];

/* ------------------------------------------------------------------ */
/* Cities & expansion                                                  */
/* ------------------------------------------------------------------ */

export type ExpansionStage = "Research" | "Regulatory" | "Operators" | "Demand & partners" | "Pilot" | "Live";
export const STAGES: ExpansionStage[] = ["Research", "Regulatory", "Operators", "Demand & partners", "Pilot", "Live"];

export interface ChecklistItem {
  label: string;
  progress?: string;
  state: "done" | "current" | "upcoming";
}
export interface CityProfile {
  id: string;
  regulator: string;
  population: string;
  lead: string;
  stage: ExpansionStage;
  operatorsIdentified: number;
  partnersSelected: number;
  estates: number;
  businesses: number;
  institutions: number;
  waitlist: number;
  note: string;
  checklist: ChecklistItem[];
}

const check = (rows: Array<[string, string | undefined, ChecklistItem["state"]]>): ChecklistItem[] => rows.map(([label, progress, state]) => ({ label, progress, state }));

export const CITY_PROFILES: Record<string, CityProfile> = {
  uyo: {
    id: "uyo", regulator: "AKSEPA (Akwa Ibom State Environmental Protection Agency)", population: "1.4m metro", lead: "Idara Umoh", stage: "Live",
    operatorsIdentified: 16, partnersSelected: 4, estates: 6, businesses: 41, institutions: 7, waitlist: 386,
    note: "Live since 1 April. Use Offot and Abak Road have a waitlist of 386 households until Mkpok Environmental is contracted.",
    checklist: check([
      ["State regulatory assessment", "Complete", "done"], ["AKSEPA operator registration", "Letter dated 29 Jan", "done"],
      ["10–20 operators identified", "16 identified", "done"], ["3–5 partners selected", "4 contracted", "done"],
      ["5 estates approached", "6 signed", "done"], ["20 businesses approached", "41 approached, 26 signed", "done"],
      ["5 institutions approached", "7 approached, 3 signed", "done"], ["Pricing set", "₦7,000 household · ₦30,000 business", "done"],
      ["Payment collection tested", "Paystack + Flutterwave", "done"], ["Launch", "1 Apr 2026", "done"],
    ]),
  },
  "port-harcourt": {
    id: "port-harcourt", regulator: "RIWAMA (Rivers State Waste Management Agency)", population: "3.2m metro", lead: "Ngozi Okafor", stage: "Pilot",
    operatorsIdentified: 13, partnersSelected: 1, estates: 4, businesses: 17, institutions: 2, waitlist: 214,
    note: "Licence application RIWAMA/PH/0417 is with the directorate. Portside Waste Partners is the first operator in verification.",
    checklist: check([
      ["State regulatory assessment", "Complete", "done"], ["RIWAMA licence", "Application under review", "current"],
      ["10–20 operators identified", "13 identified", "done"], ["3–5 partners selected", "1 of 3 in verification", "current"],
      ["5 estates approached", "4 of 5", "current"], ["20 businesses approached", "17 of 20", "current"],
      ["5 institutions approached", "2 of 5", "current"], ["Pricing set", "₦8,000 household proposed", "current"],
      ["Payment collection tested", undefined, "upcoming"], ["Launch", "Target 1 Feb 2027", "upcoming"],
    ]),
  },
  eket: {
    id: "eket", regulator: "AKSEPA (same state as Uyo)", population: "0.35m", lead: "Utibe Ekanem", stage: "Operators",
    operatorsIdentified: 6, partnersSelected: 0, estates: 1, businesses: 4, institutions: 0, waitlist: 37,
    note: "Same state regulator as Uyo, so registration extends rather than restarts. Grand Atlantic Group's Eket branch is the anchor customer.",
    checklist: check([
      ["State regulatory assessment", "Covered by Uyo registration", "done"], ["Local government permits", "Eket LGA meeting on 19 Oct", "current"],
      ["10–20 operators identified", "6 of 10", "current"], ["3–5 partners selected", undefined, "upcoming"],
      ["5 estates approached", "1 of 5", "current"], ["20 businesses approached", "4 of 20", "current"],
      ["5 institutions approached", undefined, "upcoming"], ["Pricing set", undefined, "upcoming"],
      ["Payment collection tested", "Same rails as Uyo", "done"], ["Launch", "Target Q2 2027", "upcoming"],
    ]),
  },
  lagos: {
    id: "lagos", regulator: "LAWMA (Lagos Waste Management Authority)", population: "15m+ metro", lead: "Aniekan Etim", stage: "Regulatory",
    operatorsIdentified: 3, partnersSelected: 0, estates: 0, businesses: 2, institutions: 0, waitlist: 1_120,
    note: "Highest demand signal of any city: 1,120 waitlist sign-ups from Lekki and Yaba. PSP operator framework needs a legal review first.",
    checklist: check([
      ["State regulatory assessment", "PSP framework under legal review", "current"], ["LAWMA engagement", "Intro meeting requested", "current"],
      ["10–20 operators identified", "3 of 10", "current"], ["3–5 partners selected", undefined, "upcoming"],
      ["5 estates approached", undefined, "upcoming"], ["20 businesses approached", "2 of 20", "current"],
      ["5 institutions approached", undefined, "upcoming"], ["Pricing set", undefined, "upcoming"],
      ["Payment collection tested", "Same rails as Uyo", "done"], ["Launch", "Target Q3 2027", "upcoming"],
    ]),
  },
  abuja: {
    id: "abuja", regulator: "AEPB (Abuja Environmental Protection Board)", population: "3.8m metro", lead: "Unassigned", stage: "Research",
    operatorsIdentified: 0, partnersSelected: 0, estates: 0, businesses: 0, institutions: 0, waitlist: 402,
    note: "Desk research only. AEPB concession model differs from the state-agency model used elsewhere.",
    checklist: check([
      ["State regulatory assessment", "Desk research", "current"], ["AEPB engagement", undefined, "upcoming"],
      ["10–20 operators identified", undefined, "upcoming"], ["3–5 partners selected", undefined, "upcoming"],
      ["5 estates approached", undefined, "upcoming"], ["20 businesses approached", undefined, "upcoming"],
      ["5 institutions approached", undefined, "upcoming"], ["Pricing set", undefined, "upcoming"],
      ["Payment collection tested", "Same rails as Uyo", "done"], ["Launch", "Target Q1 2028", "upcoming"],
    ]),
  },
};
export const cityById = (id: string): City | undefined => cities.find((c) => c.id === id);
export const checklistDone = (p: CityProfile) => p.checklist.filter((c) => c.state === "done").length;

/** Uyo customers by service zone (sums to the city total, 2,477). */
export const UYO_ZONE_CUSTOMERS: Record<string, number> = { ewet: 512, shelter: 418, osongama: 344, aka: 301, oron: 287, nwaniba: 233, abak: 162, itam: 124, uselga: 96 };
export const AREA_TO_ZONE: Record<string, string> = {
  "Ewet Housing Estate": "ewet", "Shelter Afrique Estate": "shelter", "Osongama Estate": "osongama", "Aka Road": "aka", "Oron Road": "oron",
  "Nwaniba Road": "nwaniba", "Abak Road": "abak", Itam: "itam", "Use Offot": "uselga",
};
export const ZONE_TO_AREA = Object.fromEntries(Object.entries(AREA_TO_ZONE).map(([a, z]) => [z, a])) as Record<string, string>;

export function cityLaunchLabel(c: City) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(c.launch)) return new Date(c.launch).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return c.launch.replace("-", " ");
}

/* ------------------------------------------------------------------ */
/* Finance model — closed months Apr–Sep 2026                          */
/* Operator payouts for Jul–Sep match the payout ledger exactly.       */
/* ------------------------------------------------------------------ */

export const FIN = {
  months: ["Apr", "May", "Jun", "Jul", "Aug", "Sep"],
  gsv: [4_120_000, 9_760_000, 17_580_000, 25_200_000, 26_920_000, 28_640_000],
  payouts: [3_147_700, 7_456_600, 13_431_100, 19_254_400, 20_567_200, 21_880_000],
  fees: [61_000, 144_400, 260_200, 373_000, 398_400, 423_900],
  refunds: [12_000, 41_500, 88_000, 132_500, 151_000, 186_500],
  chargebacks: [0, 0, 0, 0, 0, 75_500],
  collectedRate: [0.958, 0.966, 0.971, 0.973, 0.975, 0.9743],
};
export const finMargin = (i: number) => FIN.gsv[i]! - FIN.payouts[i]! - FIN.fees[i]!;

export type FinPeriod = "sep" | "q3" | "ytd";
export const FIN_PERIODS: Array<{ value: FinPeriod; label: string; long: string; idx: number[] }> = [
  { value: "sep", label: "September", long: "September 2026", idx: [5] },
  { value: "q3", label: "Q3", long: "Q3 2026 (Jul–Sep)", idx: [3, 4, 5] },
  { value: "ytd", label: "Since launch", long: "Apr–Sep 2026", idx: [0, 1, 2, 3, 4, 5] },
];
export const finSum = (key: "gsv" | "payouts" | "fees" | "refunds" | "chargebacks", idx: number[]) => idx.reduce((a, i) => a + FIN[key][i]!, 0);
export const finMarginSum = (idx: number[]) => idx.reduce((a, i) => a + finMargin(i), 0);
/** Share of the period total relative to September, used to scale breakdowns. */
export const finScale = (idx: number[]) => finSum("gsv", idx) / FIN.gsv[5]!;

export const GSV_BY_SERVICE: Array<{ label: string; value: number; recurring: boolean }> = [
  { label: "Household collection", value: 9_620_000, recurring: true },
  { label: "Estate waste management", value: 4_980_000, recurring: true },
  { label: "Commercial collection", value: 3_410_000, recurring: true },
  { label: "Bulk waste", value: 3_145_000, recurring: false },
  { label: "Institutional projects", value: 2_060_000, recurring: false },
  { label: "Event cleanup", value: 1_830_000, recurring: false },
  { label: "Special collection", value: 1_415_000, recurring: false },
  { label: "Institutional service", value: 980_000, recurring: true },
  { label: "Extra & recovery pickups", value: 920_000, recurring: false },
  { label: "Recycling", value: 280_000, recurring: true },
];
export const GSV_BY_SEGMENT = [
  { label: "Households", value: 13_280_000, note: "2,214 accounts" },
  { label: "Businesses", value: 6_410_000, note: "204 sites" },
  { label: "Estates", value: 5_640_000, note: "6 estates · 2,070 homes" },
  { label: "Institutions", value: 3_310_000, note: "7 facilities" },
];
export const REVENUE_STREAMS = [
  { label: "Service margin", value: 3_018_000, note: "₦1,500 on each ₦7,000 household plan, plus one-off jobs" },
  { label: "Business contracts", value: 1_262_000, note: "₦7,000 on each ₦30,000 site" },
  { label: "Estate management fees", value: 1_071_000, note: "₦6,000 + ₦500 per household, 6 estates" },
  { label: "Corporate multi-location", value: 512_000, note: "Grand Atlantic Group, 12 branches" },
  { label: "Payment & automation fees", value: 286_600, note: "Smart Sweep and recurring-charge fees" },
  { label: "Recycling & recovery", value: 140_500, note: "Material sales via Itam Recovery" },
  { label: "Data & reporting", value: 46_000, note: "Estate and institution reporting add-ons" },
];

/* ------------------------------------------------------------------ */
/* Payments                                                            */
/* ------------------------------------------------------------------ */

const CB_META: Record<string, { type: Payment["customerType"]; service: string; method: string }> = {
  "CB-0091": { type: "Business", service: "Commercial Collection — September", method: "Mastercard •• 4417" },
  "CB-0090": { type: "Household", service: "Slate Home — September", method: "Verve •• 2290" },
  "CB-0087": { type: "Business", service: "Commercial Collection — August", method: "Visa •• 6631" },
  "CB-0081": { type: "Household", service: "Slate Home Lite — August", method: "Visa •• 0918" },
};
export const paymentIdForChargeback = (cb: Chargeback) => `pay-${cb.id.toLowerCase()}`;
const CB_PAYMENTS: Payment[] = chargebacks.map((cb) => {
  const meta = CB_META[cb.id]!;
  const fee = Math.round(cb.amount * 0.015);
  const op = Math.round(cb.amount * 0.78);
  return {
    id: paymentIdForChargeback(cb), reference: cb.txn, customerName: cb.customerName, customerType: meta.type, service: meta.service,
    amount: cb.amount, fee, operatorAllocation: op, slateRevenue: cb.amount - op - fee,
    date: shiftDays(cb.opened, -24), method: meta.method, processor: cb.processor, status: "Chargeback", attempts: 1,
  };
});
export const allPayments: Payment[] = [...payments, ...CB_PAYMENTS].sort((a, b) => b.date.localeCompare(a.date));
export const paymentByIdAll = (id: string) => allPayments.find((p) => p.id === id);
export const chargebackForPayment = (p: Payment) => chargebacks.find((c) => c.txn === p.reference);

/** Failed charges already recovered — by a later charge or by moving the balance to Smart Sweep. */
export const RECOVERED: Record<string, string> = {
  "pay-m4": "Recovered by a manual retry — TXN-4C9TBB",
  "pay-2": "Balance moved to Smart Sweep (ss-2)",
  "pay-67": "Balance moved to Smart Sweep (ss-3)",
  "pay-20": "Recovered through Smart Sweep (ss-11, completed)",
};

export const FAIL_REASONS = ["Insufficient funds", "Card expired", "Issuer unavailable", "Do not honour", "Insufficient funds"];
export const failReason = (p: Payment, n = 0) => FAIL_REASONS[(p.reference.charCodeAt(4) + n) % FAIL_REASONS.length]!;

export interface Attempt {
  n: number;
  time: string;
  ok: boolean;
  note: string;
}
/** Retry schedule: first charge at T, retries at T+1 day and T+3 days, then the plan pauses. */
export const RETRY_OFFSETS = [0, 1, 3];
export function paymentAttempts(p: Payment): Attempt[] {
  const out: Attempt[] = [];
  const last = RETRY_OFFSETS[p.attempts - 1]!;
  for (let i = 0; i < p.attempts; i++) {
    const ok = i === p.attempts - 1 && p.status !== "Failed";
    out.push({
      n: i + 1,
      time: shiftDays(p.date, RETRY_OFFSETS[i]! - last),
      ok,
      note: ok ? (p.status === "Pending" ? "Awaiting processor confirmation" : `Approved by ${p.processor}`) : failReason(p, i),
    });
  }
  return out;
}
/** When the next automatic retry runs, or null once all three attempts are used. */
export function nextRetry(p: Payment): string | null {
  if (p.status !== "Failed" || p.attempts >= 3) return null;
  return shiftDays(p.date, RETRY_OFFSETS[p.attempts]! - RETRY_OFFSETS[p.attempts - 1]!);
}

/* ------------------------------------------------------------------ */
/* Payouts                                                             */
/* ------------------------------------------------------------------ */

export interface PayoutLine {
  label: string;
  amount: number;
  ref?: string;
}
const OBIO_FINAL: Payout = { id: "PO-02598", operatorId: "op-obio", operatorName: "Obio Sanitation", period: "Final settlement", jobs: 1_204, gross: 412_500, deductions: 160_000, adjustments: 0, net: 252_500, status: "Failed", date: at(-3, 10) };
export const allPayouts: Payout[] = [...payouts, OBIO_FINAL];
export const PAYOUT_FAILURE: Record<string, string> = { "PO-02598": "Beneficiary account closed — Zenith Bank •• 4471. Ask Obio Sanitation for a new settlement account." };
export const BANKS: Record<string, string> = {
  "op-ufok": "Zenith Bank •• 2210", "op-atlantic": "GTBank •• 0934", "op-ibom": "First Bank •• 7718", "op-nwaniba": "Opay •• 5531", "op-obio": "Zenith Bank •• 4471",
};

export function payoutDeductions(p: Payout): PayoutLine[] {
  if (!p.deductions) return [];
  if (p.operatorId === "op-atlantic") return [{ label: `Missed commercial pickups × ${p.deductions / 7500} at ₦7,500`, amount: p.deductions, ref: "CT-UYO-012 §7.1" }];
  if (p.operatorId === "op-nwaniba" && p.deductions === 35_000)
    return [
      { label: "Missed pickups not recovered in 24h × 8 at ₦2,500", amount: 20_000, ref: "CT-UYO-017 §7.1" },
      { label: "Bin replacement — damaged during collection", amount: 15_000, ref: "CMP-1171" },
    ];
  if (p.operatorId === "op-obio") return [{ label: "Unrecovered missed pickups × 64 at ₦2,500", amount: 160_000, ref: "CT-UYO-008 §7.1" }];
  const contract = allContracts.find((c) => c.operatorId === p.operatorId && c.status !== "Terminated");
  return [{ label: `Missed pickups not recovered in 24h × ${p.deductions / 2500} at ₦2,500`, amount: p.deductions, ref: contract ? `${contract.id} §7.1` : undefined }];
}
export function payoutAdjustments(p: Payout): PayoutLine[] {
  if (p.id === "PO-02604") return [{ label: "Credit — extra crew for Le Meridien event clearance", amount: 12_000, ref: "PU-26-08187" }];
  return p.adjustments ? [{ label: "Manual adjustment", amount: p.adjustments }] : [];
}

/* ------------------------------------------------------------------ */
/* Invoices                                                            */
/* ------------------------------------------------------------------ */

export type InvoiceStatus = "Draft" | "Sent" | "Unpaid" | "Partial" | "Overdue" | "Paid";
export interface AdminInvoice {
  id: string;
  party: "Customer" | "Operator";
  name: string;
  period: string;
  issued: string;
  due: string;
  amount: number;
  paid: number;
  status: InvoiceStatus;
  lines: Array<{ label: string; qty: number; unit: number }>;
}

/* ------------------------------------------------------------------ */
/* Smart Sweep                                                         */
/* ------------------------------------------------------------------ */

export function sweepAttempts(s: SmartSweepPlan): Attempt[] {
  const gap = s.frequency === "Weekly" ? 7 : s.frequency === "Every 3 days" ? 3 : 14;
  const charges = Math.max(0, Math.ceil(s.collected / s.maxCharge));
  const rows: Attempt[] = [];
  // The last successful charge sits one gap before the first failure (or before the next charge).
  const lastOk = shiftDays(s.nextCharge, -gap * (s.failures + 1));
  for (let i = 0; i < charges; i++) {
    const amount = i === 0 ? s.collected - s.maxCharge * (charges - 1) : s.maxCharge;
    rows.push({ n: i + 1, time: shiftDays(lastOk, -gap * (charges - 1 - i)), ok: true, note: formatNaira(amount) });
  }
  const reasons = ["Insufficient funds", "Insufficient funds", "Issuer unavailable"];
  for (let f = 0; f < s.failures; f++) {
    rows.push({ n: charges + f + 1, time: shiftDays(lastOk, gap * (f + 1)), ok: false, note: reasons[f]! });
  }
  return rows.reverse();
}

/* ------------------------------------------------------------------ */
/* Presentational pieces                                               */
/* ------------------------------------------------------------------ */

/** Unknown-id page used by every money detail route. */
export function NotFoundView({ what, back, backLabel }: { what: string; back: string; backLabel: string }) {
  const navigate = useNavigate();
  return (
    <StateView
      state="not-found"
      title={`We couldn't find that ${what}`}
      description="It may have been archived, or the link is wrong. Check the reference and try again."
      action={
        <Button variant="secondary" leading={<ArrowLeft className="size-4" />} onClick={() => navigate(back)}>
          {backLabel}
        </Button>
      }
    />
  );
}

/** Stops a click inside a clickable table row from navigating. */
export function Stop({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("inline-flex", className)} onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  );
}

/**
 * Where a customer's naira goes: operator, Slate, processor.
 * Three slate tones — money split is information, not status.
 */
export function AllocationBar({ operator, slate, fee, className, compact }: { operator: number; slate: number; fee: number; className?: string; compact?: boolean }) {
  const total = Math.max(1, operator + slate + fee);
  const parts = [
    { label: "Operator", value: operator, cls: "bg-slate-300 dark:bg-slate-600" },
    { label: "Slate", value: slate, cls: "bg-slate dark:bg-slate-200" },
    { label: "Processor fee", value: fee, cls: "bg-line-strong" },
  ].filter((p) => p.value > 0);
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={parts.map((p) => `${p.label} ${formatNaira(p.value)}`).join(", ")}>
        {parts.map((p) => (
          <div key={p.label} className={cn("h-full first:rounded-l-full last:rounded-r-full", p.cls)} style={{ width: `${(p.value / total) * 100}%` }} />
        ))}
      </div>
      {!compact && (
        <dl className="grid grid-cols-3 gap-3">
          {parts.map((p) => (
            <div key={p.label} className="flex min-w-0 flex-col gap-0.5">
              <dt className="flex items-center gap-1.5 t-micro text-ink-3">
                <span className={cn("size-2.5 shrink-0 rounded-[3px]", p.cls)} />
                {p.label}
              </dt>
              <dd className="t-small font-semibold text-ink tnum">{formatNaira(p.value)}</dd>
              <dd className="t-micro text-ink-3 tnum">{((p.value / total) * 100).toFixed(1)}%</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

/** Ranked breakdown with proportional bars — hairline rows, no boxes. */
export function Breakdown({
  rows,
  format = formatNaira,
  className,
  highlightFirst,
}: {
  rows: Array<{ label: ReactNode; value: number; note?: ReactNode; trailing?: ReactNode }>;
  format?: (n: number) => string;
  className?: string;
  highlightFirst?: boolean;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const total = rows.reduce((a, r) => a + r.value, 0) || 1;
  return (
    <ul className={cn("divide-y divide-line", className)}>
      {rows.map((r, i) => (
        <li key={i} className="flex flex-col gap-2 py-3">
          <div className="flex items-baseline justify-between gap-4">
            <div className="min-w-0">
              <p className="t-small font-medium text-ink">{r.label}</p>
              {r.note && <p className="t-micro text-ink-3">{r.note}</p>}
            </div>
            <div className="flex shrink-0 items-baseline gap-3">
              {r.trailing}
              <span className="t-small font-semibold text-ink tnum">{format(r.value)}</span>
              <span className="w-11 text-right t-micro text-ink-3 tnum">{((r.value / total) * 100).toFixed(1)}%</span>
            </div>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-sunken">
            <div className={cn("h-full rounded-full", highlightFirst && i === 0 ? "bg-ink" : "bg-slate-400 dark:bg-slate-500")} style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Inline figure used in summary lines: label above, value below. */
export function Figure({ label, value, hint, tone, className }: { label: ReactNode; value: ReactNode; hint?: ReactNode; tone?: "danger" | "warning" | "signal"; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      <span className="t-micro text-ink-3">{label}</span>
      <span
        className={cn(
          "font-display text-[22px] font-bold leading-tight tracking-[-0.02em] tnum",
          tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : tone === "signal" ? "text-[color:var(--signal-hover)] dark:text-signal" : "text-ink",
        )}
      >
        {value}
      </span>
      {hint && <span className="t-small text-ink-3">{hint}</span>}
    </div>
  );
}

/** A row of figures divided by hairlines (wraps to two columns on phones). */
export function FigureRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-x-6 gap-y-5 border-y border-line py-5 sm:flex sm:flex-wrap sm:gap-x-10 sm:[&>*+*]:border-l sm:[&>*+*]:border-line sm:[&>*+*]:pl-10", className)}>{children}</div>;
}

/** Refund with a reason and an amount up to the original charge. */
export function RefundModal({
  payment,
  open,
  onClose,
  onRefund,
}: {
  payment: Payment | null;
  open: boolean;
  onClose: () => void;
  onRefund: (amount: number, reason: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open && payment) {
      setAmount(String(payment.amount));
      setReason("");
      setNote("");
      setTried(false);
    }
  }, [open, payment]);
  if (!payment) return null;
  const value = Number(amount.replace(/[^\d]/g, "")) || 0;
  const amountErr = value <= 0 ? "Enter an amount" : value > payment.amount ? `Can't refund more than ${formatNaira(payment.amount)}` : undefined;
  const reasonErr = !reason ? "Choose a reason" : undefined;
  const opShare = Math.round((value / payment.amount) * payment.operatorAllocation);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Refund payment"
      description={`${payment.reference} · ${payment.customerName} · ${formatNaira(payment.amount)} on ${payment.method}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="destructive"
            loading={busy}
            onClick={async () => {
              setTried(true);
              if (amountErr || reasonErr) return;
              setBusy(true);
              await new Promise((r) => setTimeout(r, 700));
              setBusy(false);
              onRefund(value, reason);
              onClose();
            }}
          >
            Refund {value > 0 ? formatNaira(value) : ""}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <CurrencyInput
          label="Amount"
          value={amount ? Number(amount.replace(/[^\d]/g, "") || 0).toLocaleString("en-NG") : ""}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
          error={tried ? amountErr : undefined}
          hint={value > 0 && value < payment.amount ? "Partial refund — the payment stays successful for the rest." : "Full refund"}
        />
        <Select
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Choose a reason"
          error={tried ? reasonErr : undefined}
          options={["Duplicate charge", "Service not delivered", "Missed pickup not recovered", "Customer cancelled within 7 days", "Charged wrong amount", "Goodwill credit"]}
        />
        <Textarea label="Note for the customer" optional rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Shown on the refund receipt" />
        <Field label="What changes">
          <p className="t-small text-ink-2">
            {payment.processor} returns {value > 0 ? formatNaira(value) : "the amount"} to {payment.method} in 3–7 working days.
            {payment.operatorAllocation > 0 && <> {formatNaira(opShare)} is recovered from the operator's next payout.</>}
          </p>
        </Field>
      </div>
    </Modal>
  );
}

/** Operator label for a contract or payment, safely. */
export const operatorShort = (id: string) => operatorById(id)?.short ?? "—";
