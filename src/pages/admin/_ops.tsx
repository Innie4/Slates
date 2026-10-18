/**
 * Admin operations, page-local data model and helpers for the control centre,
 * people and pickup pages (Admin part 1).
 *
 * The shared demo data holds a 64-customer sample. The admin portal needs the
 * whole Uyo book (2,477 accounts = the four operators' assigned counts), so this
 * module extends it deterministically, then builds today's routes and pickups
 * from it so every counter, list and detail page agrees with every other.
 *
 * A tiny external store keeps admin actions (reassign, suspend, reschedule…)
 * alive while the admin moves between pages in one session.
 */
import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { ArrowLeft, Check, MessageSquare, Phone, Mail, Send, AlertTriangle, Truck } from "lucide-react";
import {
  Alert, Avatar, Badge, Button, ButtonLink, Checkbox, DatePicker, Meter, Modal, Page, Segmented, Select, StateView, StatusBadge, Textarea,
  useToast, type Tone,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  FIRST, LAST, activeOperators, auditLog, communityProjects, complaints, customers, documents, drivers as sharedDrivers, myPickups, operatorById,
  operators, payments, pickups, services, tickets, vehicles as sharedVehicles,
  type Customer, type CustomerType, type Operator, type Pickup, type PickupStatus, type Service, type Vehicle,
} from "@/data";
import { DEMO_NOW, formatDate, formatNaira, formatNumber } from "@/lib/format";

/* ================================================================== */
/* Seeded helpers                                                      */
/* ================================================================== */

function seeded(s: number) {
  let x = Math.abs(Math.floor(s)) % 2147483647;
  if (x <= 0) x += 2147483646;
  return () => {
    x = (x * 16807) % 2147483647;
    return (x - 1) / 2147483646;
  };
}
const R = seeded(5410);
const pk = <T,>(xs: readonly T[], r: () => number = R): T => xs[Math.floor(r() * xs.length)]!;
const btw = (a: number, b: number, r: () => number = R) => Math.round(a + r() * (b - a));
const pad = (n: number, w = 4) => String(n).padStart(w, "0");
const shuffle = <T,>(xs: T[], r: () => number = R) => {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
};
const refCode = (n: number, r: () => number) => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < n; i++) s += chars[Math.floor(r() * chars.length)];
  return s;
};

/** Same clock convention as the shared data: local Uyo time on 5 Oct 2026 + offset days. */
export function dayAt(offset: number, hh = 8, mm = 0) {
  const d = new Date("2026-10-05T00:00:00+01:00");
  d.setDate(d.getDate() + offset);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}
const NOW = DEMO_NOW.getTime();
export const isPast = (iso: string) => new Date(iso).getTime() < NOW;
export const daysUntil = (iso: string) => Math.round((new Date(iso).getTime() - NOW) / 86_400_000);

/* ================================================================== */
/* Geography                                                           */
/* ================================================================== */

/** Customer areas → ServiceAreaMap zone ids */
export const AREA_ZONE: Record<string, string> = {
  "Ewet Housing Estate": "ewet",
  "Shelter Afrique Estate": "shelter",
  "Osongama Estate": "osongama",
  "Aka Road": "aka",
  "Udo Udoma Avenue": "aka",
  "Oron Road": "oron",
  "Wellington Bassey Way": "oron",
  "Nwaniba Road": "nwaniba",
  "Ikot Ekpene Road": "nwaniba",
  "Abak Road": "abak",
  Itam: "itam",
  "Use Offot": "uselga",
};
export const zoneAreas = (zone: string) => Object.entries(AREA_ZONE).filter(([, z]) => z === zone).map(([a]) => a);

/* ================================================================== */
/* The whole customer book                                             */
/* ================================================================== */

const BIZ_A = ["Afang", "Ibom", "Atakpa", "Itoro", "Mbakara", "Unity", "Royal", "Grace", "Divine", "Prime", "Kingsway", "Crystal", "Akwa", "Ikot", "Nsit", "Riverside", "Golden", "Ekpo", "Udeme", "Abasi", "Mma Ekaette", "Uwem", "Edem"];
const BIZ_B = ["Kitchen", "Pharmacy", "Supermarket", "Bakery", "Hotel", "Suites", "Lounge", "Eatery", "Salon", "Boutique", "Printing Press", "Diagnostics", "Mart", "Fast Food", "Car Wash", "Guest House", "Hardware", "Cold Room", "Restaurant", "Event Hall", "Filling Station", "Clinic", "Bar & Grill", "Pastries"];
const INST_A = ["Uyo", "Ewet", "Itam", "Ikot Ekpene Road", "Abak Road", "Use Offot", "Nwaniba", "Ibesikpo", "Mbiabong", "Oku", "Afaha Oku", "Ikot Oku Ikono"];
const INST_B = ["Primary School", "Comprehensive Secondary School", "Model School", "Medical Centre", "General Hospital Annex", "Specialist Clinic", "Methodist Church", "Catholic Parish", "LGA Secretariat", "Technical College", "School of Nursing", "Police Barracks"];
const INDUSTRIAL = ["Itam Block Industry", "Abak Road Sawmill", "Use Offot Timber Market", "Ibom Rice Mill", "Itam Motor Park", "Akwa Water Bottling", "Mbiabong Poultry Farm", "Itu Road Quarry Depot", "Uyo Mechanic Village", "Itam Furniture Works", "Ikot Ntuen Cassava Mill", "Abak Road Tyre Market"];
const ESTATE_STREETS: Record<string, string[]> = {
  "Ewet Housing Estate": ["Road 2", "Road 4", "Road 7", "Close B", "Crescent 3", "Avenue C", "Road 11", "Close F"],
  "Shelter Afrique Estate": ["Block A", "Block B", "Block C", "Block D", "Block E", "Block F"],
  "Osongama Estate": ["Phase 1, Street 3", "Phase 1, Street 6", "Phase 2, Street 2", "Phase 2, Street 9", "Phase 2, Close 4"],
};
const PHONES = ["803", "806", "813", "816", "703", "705", "805", "909", "810", "814", "902", "701", "708", "903"];
const phone = () => `+234 ${pk(PHONES)} ${btw(100, 999)} ${btw(1000, 9999)}`;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "");

const OP_BOOK: Record<string, { areas: string[]; weights: number[] }> = {
  "op-ufok": { areas: ["Ewet Housing Estate", "Shelter Afrique Estate", "Osongama Estate"], weights: [0.45, 0.3, 0.25] },
  "op-atlantic": { areas: ["Aka Road", "Oron Road", "Udo Udoma Avenue", "Wellington Bassey Way"], weights: [0.27, 0.27, 0.24, 0.22] },
  "op-ibom": { areas: ["Itam", "Abak Road", "Use Offot"], weights: [0.42, 0.32, 0.26] },
  "op-nwaniba": { areas: ["Nwaniba Road", "Ikot Ekpene Road", "Aka Road"], weights: [0.4, 0.38, 0.22] },
};
const weighted = (areas: string[], w: number[]) => {
  const x = R();
  let acc = 0;
  for (let i = 0; i < areas.length; i++) {
    acc += w[i]!;
    if (x <= acc) return areas[i]!;
  }
  return areas[areas.length - 1]!;
};
// Growth curve: more recent joins (matches series.customers)
const JOIN_BUCKETS: Array<[number, number, number]> = [
  // [weight, daysAgoMin, daysAgoMax]
  [0.074, 157, 187], [0.17, 127, 156], [0.16, 96, 126], [0.155, 66, 95], [0.165, 35, 65], [0.168, 5, 34], [0.108, 0, 4],
];
const joinedDate = () => {
  const x = R();
  let acc = 0;
  for (const [w, a, b] of JOIN_BUCKETS) {
    acc += w;
    if (x <= acc) return dayAt(-btw(a, b), btw(8, 20), btw(0, 59));
  }
  return dayAt(-btw(5, 30));
};

function makeCustomer(n: number, opId: string): Customer {
  const book = OP_BOOK[opId]!;
  const area = weighted(book.areas, book.weights);
  let type: CustomerType = "Household";
  let name = `${pk(FIRST)} ${pk(LAST)}`;
  let plan = R() < 0.74 ? "Slate Home" : "Slate Home Lite";
  let monthly = plan === "Slate Home" ? 7000 : 4500;
  let address = `${btw(1, 160)} ${area}, Uyo`;
  let sites: number | undefined;
  if (opId === "op-ufok") {
    address = `${btw(1, 48)} ${pk(ESTATE_STREETS[area]!)}, ${area}, Uyo`;
  } else if (opId === "op-atlantic") {
    type = "Business";
    name = `${pk(BIZ_A)} ${pk(BIZ_B)}`;
    plan = "Commercial Collection";
    monthly = btw(24, 96) * 1000 + pk([0, 500]);
    sites = R() < 0.82 ? 1 : btw(2, 4);
    address = `${btw(2, 210)} ${area}, Uyo`;
  } else if (opId === "op-ibom") {
    if (R() < 0.55) {
      type = "Institution";
      name = `${pk(INST_A)} ${pk(INST_B)}`;
      plan = "Institutional Service";
      monthly = btw(18, 42) * 10000;
      sites = btw(1, 6);
    } else {
      type = "Business";
      name = `${pk(INDUSTRIAL)}${R() < 0.5 ? ` Unit ${btw(2, 9)}` : ""}`;
      plan = "Commercial Collection";
      monthly = btw(38, 120) * 1000;
      sites = 1;
    }
    address = `${btw(1, 90)} ${area === "Itam" ? "Itam Industrial Layout" : area === "Use Offot" ? "Use Offot Road" : "Abak Road"}, Uyo`;
  }
  const st = R();
  const status: Customer["status"] = st < 0.9 ? "Active" : st < 0.93 ? "Paused" : st < 0.955 ? "Pending" : st < 0.98 ? "Suspended" : "Cancelled";
  const ps = R();
  const paymentStatus: Customer["paymentStatus"] =
    status === "Suspended" ? "Failed" : status === "Pending" ? "Pending" : ps < 0.9 ? "Paid" : ps < 0.95 ? "Overdue" : ps < 0.975 ? "Pending" : "Failed";
  return {
    id: `cus-${pad(n)}`,
    name,
    type,
    email: `${slug(name)}@${type === "Household" ? pk(["gmail.com", "gmail.com", "yahoo.com"]) : "mail.ng"}`,
    phone: phone(),
    address,
    area,
    city: "Uyo",
    plan,
    monthly,
    status,
    paymentStatus,
    operatorId: opId,
    joined: joinedDate(),
    sites,
  };
}

const generated: Customer[] = (() => {
  const out: Customer[] = [];
  let n = customers.length + 1;
  for (const op of activeOperators) {
    const have = customers.filter((c) => c.operatorId === op.id).length;
    for (let i = have; i < op.assigned; i++) out.push(makeCustomer(n++, op.id));
  }
  return out;
})();

/** Every Slate customer account in Uyo (2,477). */
export const allCustomers: Customer[] = [...customers, ...generated];
const customerIdx = new Map(allCustomers.map((c, i) => [c.id, i]));
export const findCustomer = (id?: string) => (id ? allCustomers[customerIdx.get(id) ?? -1] : undefined);

/** Verification state of an account (address + phone). Most are verified. */
export const customerVerification = (c: Customer): "Verified" | "Pending" =>
  c.status === "Pending" || (customerIdx.get(c.id) ?? 0) % 37 === 5 ? "Pending" : "Verified";

/* ================================================================== */
/* Today's routes and pickups (Mon 5 Oct, 08:12)                       */
/* ================================================================== */

export interface OpsRoute {
  id: string;
  operatorId: string;
  vehicle: string;
  vehicleType: string;
  driver: string;
  driverPhone: string;
  area: string;
  window: string;
  stops: number;
  done: number;
  breakdownAt?: string;
  state: "Completed" | "On route" | "Running late" | "Not started" | "Breakdown";
  startedAt?: string;
  pickupIds: string[];
}

type RouteSpec = Omit<OpsRoute, "state" | "startedAt" | "pickupIds" | "driverPhone">;
const ROUTE_SPECS: RouteSpec[] = [
  { id: "RT-UFK-01", operatorId: "op-ufok", vehicle: "AKS 214 XA", vehicleType: "7-tonne compactor", driver: "Emmanuel Udo", area: "Ewet Housing Estate", window: "07:00–09:00", stops: 52, done: 30 },
  { id: "RT-UFK-02", operatorId: "op-ufok", vehicle: "AKS 588 KJ", vehicleType: "7-tonne compactor", driver: "Godwin Etuk", area: "Ewet Housing Estate", window: "06:00–08:00", stops: 48, done: 42 },
  { id: "RT-UFK-03", operatorId: "op-ufok", vehicle: "UYO 903 BG", vehicleType: "Tipper truck", driver: "Samuel Akpan", area: "Shelter Afrique Estate", window: "07:00–09:00", stops: 50, done: 27 },
  { id: "RT-UFK-04", operatorId: "op-ufok", vehicle: "AKS 902 QE", vehicleType: "7-tonne compactor", driver: "Daniel Inyang", area: "Shelter Afrique Estate", window: "08:00–10:00", stops: 46, done: 4 },
  { id: "RT-UFK-05", operatorId: "op-ufok", vehicle: "AKS 118 RT", vehicleType: "7-tonne compactor", driver: "Uwem Okon", area: "Osongama Estate", window: "06:00–08:00", stops: 44, done: 44 },
  { id: "RT-UFK-06", operatorId: "op-ufok", vehicle: "AKS 447 MN", vehicleType: "Tipper truck", driver: "Blessing Akpan", area: "Osongama Estate", window: "08:00–10:00", stops: 40, done: 3 },
  { id: "RT-ATL-01", operatorId: "op-atlantic", vehicle: "UYO 412 KD", vehicleType: "Rear-loader", driver: "Peter Ita", area: "Aka Road", window: "06:00–08:00", stops: 26, done: 19 },
  { id: "RT-ATL-02", operatorId: "op-atlantic", vehicle: "ABK 220 TR", vehicleType: "Rear-loader", driver: "Sunday Ekanem", area: "Oron Road", window: "07:00–09:00", stops: 24, done: 14 },
  { id: "RT-ATL-03", operatorId: "op-atlantic", vehicle: "UYO 578 PA", vehicleType: "Box truck (food waste)", driver: "Victor Obot", area: "Udo Udoma Avenue", window: "10:00–12:00", stops: 22, done: 0 },
  { id: "RT-ATL-04", operatorId: "op-atlantic", vehicle: "ITU 315 LM", vehicleType: "Rear-loader", driver: "Ime Asuquo", area: "Wellington Bassey Way", window: "14:00–16:00", stops: 20, done: 0 },
  { id: "RT-IBM-01", operatorId: "op-ibom", vehicle: "ITU 640 HB", vehicleType: "Skip loader", driver: "Christopher Eyo", area: "Itam", window: "07:00–09:00", stops: 12, done: 7 },
  { id: "RT-IBM-02", operatorId: "op-ibom", vehicle: "ABK 118 QS", vehicleType: "Hook-lift truck", driver: "Effiong Edet", area: "Abak Road", window: "08:00–10:00", stops: 10, done: 1 },
  { id: "RT-IBM-03", operatorId: "op-ibom", vehicle: "UYO 207 WD", vehicleType: "Tipper truck", driver: "Nsikak Udo", area: "Use Offot", window: "10:00–12:00", stops: 9, done: 0 },
  { id: "RT-NWC-01", operatorId: "op-nwaniba", vehicle: "ETN 334 KC", vehicleType: "Tipper truck", driver: "Aniefiok Ntuk", area: "Ikot Ekpene Road", window: "06:00–08:00", stops: 18, done: 6, breakdownAt: dayAt(0, 6, 52) },
  { id: "RT-NWC-02", operatorId: "op-nwaniba", vehicle: "AKS 760 PL", vehicleType: "Pickup (bulk)", driver: "Friday Bassey", area: "Nwaniba Road", window: "07:00–09:00", stops: 14, done: 8 },
];

const winStart = (w: string) => Number(w.slice(0, 2));
const winEnd = (w: string) => Number(w.slice(6, 8));
export const windowEnded = (w: string) => winEnd(w) * 60 <= DEMO_NOW.getHours() * 60 + DEMO_NOW.getMinutes();

/** Why a pickup is in an exception state (missed / failed / late). */
export const pickupReasons: Record<string, string> = {};
const FAILED_AT: Array<[string, number, string]> = [
  ["RT-UFK-03", 6, "Gate locked, no answer on two calls"],
  ["RT-ATL-02", 3, "Bins not put out, shop closed until 10:00"],
  ["RT-UFK-01", 12, "Access blocked by road works on Road 7"],
  ["RT-IBM-01", 2, "Security refused entry, no work order on file"],
];

const routes: OpsRoute[] = [];
const live: Pickup[] = [];
(() => {
  const todays = pickups.filter((p) => p.date.slice(0, 10) === dayAt(0).slice(0, 10) && !myPickups.includes(p));
  const routable = todays.filter((p) => p.status !== "Cancelled");
  // Reserve shared records for the operator route in the same area, else that operator's longest route.
  const reserved = new Map<string, Pickup[]>();
  for (const p of routable) {
    const opRoutes = ROUTE_SPECS.filter((r) => r.operatorId === p.operatorId);
    const r = opRoutes.find((x) => x.area === p.area) ?? opRoutes.filter((x) => !x.breakdownAt).sort((a, b) => b.stops - a.stops)[0]!;
    reserved.set(r.id, [...(reserved.get(r.id) ?? []), p]);
  }
  const used = new Set<string>(["cus-0001", ...todays.map((p) => p.customerId)]);
  let seq = 9001;
  const phoneR = seeded(77);
  for (const spec of ROUTE_SPECS) {
    const op = operatorById(spec.operatorId)!;
    const mine = reserved.get(spec.id) ?? [];
    const pool = shuffle(
      allCustomers.filter((c) => c.operatorId === spec.operatorId && c.area === spec.area && c.status === "Active" && !used.has(c.id)),
    );
    const need = Math.max(0, spec.stops - mine.length - (spec.id === "RT-UFK-01" ? 1 : 0));
    const fresh = pool.slice(0, need);
    fresh.forEach((c) => used.add(c.id));
    type Slot = { c: Customer; shared?: Pickup };
    let slots: Slot[] = shuffle<Slot>([...mine.map((p) => ({ c: findCustomer(p.customerId)!, shared: p })), ...fresh.map((c) => ({ c }))]);
    if (spec.id === "RT-UFK-01") slots.splice(spec.done + 1, 0, { c: findCustomer("cus-0001")!, shared: myPickups[0] });
    slots = slots.slice(0, spec.stops);
    const start = winStart(spec.window);
    const ended = windowEnded(spec.window);
    const notStarted = start * 60 > DEMO_NOW.getHours() * 60 + DEMO_NOW.getMinutes();
    const startedAt = notStarted ? undefined : dayAt(0, start, btw(0, 9));
    const elapsedEnd = spec.breakdownAt ? new Date(spec.breakdownAt).getTime() : NOW;
    const ids: string[] = [];
    slots.forEach((s, i) => {
      let status: PickupStatus = "Scheduled";
      let completedAt: string | undefined;
      if (i < spec.done) {
        status = "Completed";
        const t0 = new Date(startedAt!).getTime();
        const step = (elapsedEnd - t0) / (spec.done + (spec.done === spec.stops ? 0.4 : 1));
        completedAt = new Date(t0 + step * (i + 0.6)).toISOString();
      } else if (spec.breakdownAt) {
        status = "Missed";
      } else if (!notStarted && i === spec.done) {
        status = "In progress";
      } else if (!notStarted && i === spec.done + 1 && !ended) {
        status = "En route";
      } else if (ended) {
        status = "Late";
      }
      const id = s.shared?.id ?? `PU-26-${pad(seq++, 5)}`;
      const p: Pickup = {
        id,
        customerId: s.c.id,
        customerName: s.c.name,
        customerType: s.c.type,
        address: s.c.address,
        area: s.c.area,
        service: s.c.plan,
        operatorId: op.id,
        operatorName: op.short,
        date: dayAt(0, start),
        window: spec.window,
        status,
        driver: spec.driver,
        vehicle: spec.vehicle,
        completedAt,
        bins: s.shared?.bins ?? (s.c.type === "Household" ? btw(1, 2) : btw(2, 8)),
      };
      if (status === "Missed") pickupReasons[id] = `Truck ${spec.vehicle} broke down on ${spec.area} at 06:52, stop not reached`;
      if (status === "Late") pickupReasons[id] = `Window ended ${spec.window.slice(6)}, crew ${i - spec.done} ${i - spec.done === 1 ? "stop" : "stops"} away`;
      live.push(p);
      ids.push(id);
    });
    for (const [rid, idx, why] of FAILED_AT) {
      if (rid !== spec.id) continue;
      const p = live.find((x) => x.id === ids[idx]);
      if (p) {
        p.status = "Failed";
        p.completedAt = undefined;
        pickupReasons[p.id] = why;
      }
    }
    const remaining = spec.stops - spec.done;
    const state: OpsRoute["state"] = spec.breakdownAt ? "Breakdown" : spec.done >= spec.stops ? "Completed" : notStarted ? "Not started" : ended ? "Running late" : "On route";
    routes.push({
      ...spec,
      stops: slots.length,
      done: Math.min(spec.done, slots.length),
      state: remaining <= 0 ? "Completed" : state,
      startedAt,
      pickupIds: ids,
      driverPhone: `+234 ${pk(PHONES, phoneR)} ${btw(100, 999, phoneR)} ${btw(1000, 9999, phoneR)}`,
    });
  }
  // Customer-cancelled pickups stay on today's sheet as cancelled.
  for (const p of todays.filter((x) => x.status === "Cancelled")) live.push({ ...p, note: "Customer account cancelled" });
})();

export const opsRoutes = routes;
export const routeById = (id: string) => routes.find((r) => r.id === id);
export const routeForPickup = (id: string) => routes.find((r) => r.pickupIds.includes(id));
export const livePickups = live;

/* Historical pickups, 4 per customer, decodable from the id (PU-26-1xxxx). */
const HISTORY_OFFSETS = [-7, -11, -14, -18];
export function historyPickup(n: number): Pickup | undefined {
  const rel = n - 10000;
  if (rel < 0) return undefined;
  const ci = Math.floor(rel / 4), k = rel % 4;
  const c = allCustomers[ci];
  if (!c || ci < customers.length) return undefined;
  const op = operatorById(c.operatorId)!;
  const r = seeded(n * 31 + 7);
  const opRoutes = routes.filter((x) => x.operatorId === op.id);
  const route = opRoutes[Math.floor(r() * opRoutes.length)]!;
  const x = r();
  const status: PickupStatus = x < 0.9 ? "Completed" : x < 0.95 ? "Late" : x < 0.98 ? "Missed" : "Failed";
  const hh = winStart(route.window);
  const date = dayAt(HISTORY_OFFSETS[k]!, hh);
  return {
    id: `PU-26-${n}`,
    customerId: c.id, customerName: c.name, customerType: c.type, address: c.address, area: c.area, service: c.plan,
    operatorId: op.id, operatorName: op.short, date, window: route.window, status,
    driver: route.driver, vehicle: route.vehicle,
    completedAt: status === "Completed" || status === "Late" ? dayAt(HISTORY_OFFSETS[k]!, status === "Late" ? winEnd(route.window) : hh, btw(5, 55, r)) : undefined,
    bins: c.type === "Household" ? btw(1, 2, r) : btw(2, 6, r),
    note: status === "Missed" ? "Recovered next day" : status === "Failed" ? "Gate locked" : undefined,
  };
}

/* ================================================================== */
/* Shared admin store (session-scoped)                                 */
/* ================================================================== */

export type PickupPatch = Partial<Pickup> & { note?: string };
export interface OpsState {
  pickups: Record<string, PickupPatch>;
  extra: Pickup[];
  recoveries: Record<string, string>;
  customers: Record<string, Partial<Customer> & { verification?: "Verified" | "Pending" }>;
  operators: Record<string, Partial<Operator>>;
}
let state: OpsState = { pickups: {}, extra: [], recoveries: {}, customers: {}, operators: {} };
const listeners = new Set<() => void>();
const emit = (next: OpsState) => {
  state = next;
  listeners.forEach((l) => l());
};
export const opsStore = {
  get: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  patchPickup(id: string, patch: PickupPatch) {
    emit({ ...state, pickups: { ...state.pickups, [id]: { ...state.pickups[id], ...patch } } });
  },
  /** Workflow 4: reassignment creates a new recovery pickup for another operator. */
  recover(orig: Pickup, operatorId: string, window: string, dayOffset = 0): Pickup {
    const op = operatorById(operatorId)!;
    const route = routes.find((r) => r.operatorId === operatorId && r.state !== "Breakdown");
    const id = `PU-26-${9600 + state.extra.length}`;
    const p: Pickup = {
      ...orig,
      id,
      operatorId,
      operatorName: op.short,
      status: "Scheduled",
      window,
      date: dayAt(dayOffset, winStart(window)),
      driver: route?.driver ?? "To be assigned",
      vehicle: route?.vehicle ?? "Not set",
      completedAt: undefined,
      note: `Recovery for ${orig.id}`,
    };
    emit({ ...state, extra: [...state.extra, p], recoveries: { ...state.recoveries, [orig.id]: id } });
    return p;
  },
  patchCustomer(id: string, patch: OpsState["customers"][string]) {
    emit({ ...state, customers: { ...state.customers, [id]: { ...state.customers[id], ...patch } } });
  },
  patchOperator(id: string, patch: Partial<Operator>) {
    emit({ ...state, operators: { ...state.operators, [id]: { ...state.operators[id], ...patch } } });
  },
};
export function useOps() {
  return useSyncExternalStore(opsStore.subscribe, opsStore.get, opsStore.get);
}
const applyPickup = (p: Pickup, s: OpsState) => (s.pickups[p.id] ? { ...p, ...s.pickups[p.id] } : p);

/** Today's pickups with admin changes applied (incl. recovery pickups created this session). */
export function useLivePickups() {
  const s = useOps();
  return useMemo(() => [...live, ...s.extra].map((p) => applyPickup(p, s)), [s]);
}
export function useCustomers() {
  const s = useOps();
  return useMemo(() => allCustomers.map((c) => (s.customers[c.id] ? { ...c, ...s.customers[c.id] } : c)), [s.customers]);
}
export function useOperators() {
  const s = useOps();
  return useMemo(() => operators.map((o) => (s.operators[o.id] ? { ...o, ...s.operators[o.id] } : o)), [s.operators]);
}

/** Any pickup by reference: today's sheet, shared history, or decoded customer history. */
export function findPickup(id: string, s: OpsState = state): Pickup | undefined {
  const found =
    live.find((p) => p.id === id) ?? s.extra.find((p) => p.id === id) ?? pickups.find((p) => p.id === id) ??
    (/^PU-26-1\d{4}$/.test(id) ? historyPickup(Number(id.slice(6))) : undefined);
  return found ? applyPickup(found, s) : undefined;
}

/** A customer's pickups: today, shared records, generated history, newest first. */
export function customerPickups(c: Customer, s: OpsState = state): Pickup[] {
  const ci = customerIdx.get(c.id) ?? 0;
  const today = [...live, ...s.extra].filter((p) => p.customerId === c.id);
  const todayIds = new Set(today.map((p) => p.id));
  const shared = pickups.filter((p) => p.customerId === c.id && !todayIds.has(p.id) && p.date.slice(0, 10) !== dayAt(0).slice(0, 10));
  const hist = ci >= customers.length ? HISTORY_OFFSETS.map((_, k) => historyPickup(10000 + ci * 4 + k)!).filter(Boolean) : [];
  return [...today.map((p) => applyPickup(p, s)), ...shared, ...hist].sort((a, b) => b.date.localeCompare(a.date));
}

/* ================================================================== */
/* Today, counters                                                    */
/* ================================================================== */

export interface TodayCounts {
  total: number;
  completed: number;
  inProgress: number;
  scheduled: number;
  late: number;
  missed: number;
  failed: number;
  cancelled: number;
}
export function countToday(list: Pickup[]): TodayCounts {
  const c: TodayCounts = { total: 0, completed: 0, inProgress: 0, scheduled: 0, late: 0, missed: 0, failed: 0, cancelled: 0 };
  for (const p of list) {
    if (p.note?.startsWith("Recovery for")) {
      // recovery pickups are counted on top of the original sheet
    }
    if (p.status === "Cancelled") {
      c.cancelled++;
      continue;
    }
    c.total++;
    if (p.status === "Completed") c.completed++;
    else if (p.status === "In progress" || p.status === "En route" || p.status === "Arrived") c.inProgress++;
    else if (p.status === "Scheduled") c.scheduled++;
    else if (p.status === "Late") c.late++;
    else if (p.status === "Missed") c.missed++;
    else if (p.status === "Failed") c.failed++;
  }
  return c;
}

/* ================================================================== */
/* Customer records, payments, complaints, community, support, log    */
/* ================================================================== */

export interface CustomerPayment {
  id: string;
  reference: string;
  label: string;
  amount: number;
  date: string;
  method: string;
  status: "Successful" | "Pending" | "Failed" | "Refunded" | "Chargeback";
  attempts: number;
  linkable: boolean;
}
export function customerPayments(c: Customer): CustomerPayment[] {
  const shared = payments
    .filter((p) => p.customerName === c.name)
    .map((p): CustomerPayment => ({ id: p.id, reference: p.reference, label: p.service, amount: p.amount, date: p.date, method: p.method, status: p.status, attempts: p.attempts, linkable: true }));
  if (shared.length >= 2 || customerIdx.get(c.id)! < customers.length) return shared.sort((a, b) => b.date.localeCompare(a.date));
  const r = seeded((customerIdx.get(c.id) ?? 1) * 97);
  const card = `${pk(["Visa", "Mastercard", "Verve"], r)} •• ${btw(1000, 9999, r)}`;
  const months: Array<[string, number]> = [["October", -4], ["September", -34], ["August", -65], ["July", -95]];
  const joined = new Date(c.joined).getTime();
  return months
    .filter(([, off]) => new Date(dayAt(off)).getTime() >= joined - 5 * 86_400_000)
    .map(([m, off], i): CustomerPayment => {
      let status: CustomerPayment["status"] = "Successful";
      let attempts = 1;
      if (i === 0 && c.paymentStatus === "Failed") (status = "Failed"), (attempts = 3);
      if (i === 0 && c.paymentStatus === "Pending") status = "Pending";
      if (i === 0 && c.paymentStatus === "Overdue") (status = "Failed"), (attempts = 2);
      return {
        id: `gp-${c.id}-${i}`, reference: `TXN-${refCode(6, r)}`, label: `${c.plan}, ${m}`, amount: c.monthly,
        date: dayAt(off, 6, btw(0, 40, r)), method: card, status, attempts, linkable: false,
      };
    });
}

export const customerComplaints = (c: Customer) => complaints.filter((x) => x.customerName === c.name);

export function customerContributions(c: Customer) {
  const projects = communityProjects.filter((p) => c.area.startsWith(p.community.split(" ")[0]!) || p.community === c.area);
  if (c.id === "cus-0001") return [{ project: communityProjects[0]!, amount: 2500, date: dayAt(-9, 19, 44), reference: "TXN-6HZ8RV" }];
  const r = seeded((customerIdx.get(c.id) ?? 1) * 13);
  return projects
    .filter(() => r() < 0.45)
    .map((p) => ({ project: p, amount: pk([1000, 1500, 2000, 2500, 5000, 10000], r), date: dayAt(-btw(3, 30, r), btw(8, 21, r)), reference: `TXN-${refCode(6, r)}` }));
}

export function customerTickets(c: Customer) {
  const shared = tickets.filter((t) => t.from === c.name);
  if (shared.length || c.id === "cus-0001") {
    if (c.id === "cus-0001")
      return [
        { id: "TCK-4371", subject: "Missed pickup on Thursday 24 Sep", channel: "In-app", status: "Resolved", created: dayAt(-11, 10, 20), assignee: "Utibe Ekanem", sla: "Met" },
        { id: "TCK-4398", subject: "Replacement bin lid", channel: "WhatsApp", status: "Pending", created: dayAt(-6, 9, 10), assignee: "Emem Obot", sla: "6h left" },
      ];
    return shared;
  }
  const r = seeded((customerIdx.get(c.id) ?? 1) * 29);
  if (r() > 0.35) return [];
  return [
    {
      id: `TCK-${4200 + ((customerIdx.get(c.id) ?? 0) % 190)}`,
      subject: pk(["How do I change my pickup day?", "Request receipt for September", "Can I pause service while travelling?", "Want to add a second bin", "Card declined but I was debited"], r),
      channel: pk(["In-app", "WhatsApp", "Email", "Phone"], r),
      status: pk(["Resolved", "Closed", "Resolved"], r),
      created: dayAt(-btw(12, 60, r), btw(8, 20, r)),
      assignee: pk(["Utibe Ekanem", "Emem Obot", "Inemesit Ita"], r),
      sla: "Met",
    },
  ];
}

export function customerActivity(c: Customer) {
  const op = operatorById(c.operatorId);
  const items = [
    ...auditLog.filter((a) => a.entity === c.id).map((a) => ({ title: a.action, detail: `${a.previous} → ${a.next}`, by: `${a.user}, ${a.role}`, time: a.time })),
    { title: "Account created", detail: `Signed up as ${c.type.toLowerCase()} via ${c.type === "Household" ? "the Slate app" : "a Slate account manager"}`, by: c.type === "Household" ? c.name : "Itoro Effiong, Partnership Manager", time: c.joined },
    { title: "Address verified", detail: c.address, by: "Slate verification", time: new Date(new Date(c.joined).getTime() + 3 * 3600_000).toISOString() },
    { title: `Subscribed to ${c.plan}`, detail: formatNaira(c.monthly) + " a month", by: c.name, time: new Date(new Date(c.joined).getTime() + 5 * 3600_000).toISOString() },
    { title: "Assigned to operator", detail: op ? `${op.short} · contract ${op.id === "op-ufok" ? "CT-UYO-011" : op.id === "op-atlantic" ? "CT-UYO-012" : op.id === "op-ibom" ? "CT-UYO-014" : "CT-UYO-017"}` : "Not set", by: "Slate dispatch (automatic)", time: new Date(new Date(c.joined).getTime() + 26 * 3600_000).toISOString() },
  ];
  return items.sort((a, b) => b.time.localeCompare(a.time));
}

/* ================================================================== */
/* Operators, fleet, workers, documents, contracts                    */
/* ================================================================== */

const EXTRA_FLEET: Record<string, Vehicle[]> = {
  "op-ufok": [
    { id: "v8", registration: "AKS 118 RT", type: "7-tonne compactor", capacity: "14 m³", status: "Active", driver: "Uwem Okon", docStatus: "Verified", inspection: "2026-09-12" },
    { id: "v9", registration: "AKS 447 MN", type: "Tipper truck", capacity: "10 m³", status: "Active", driver: "Blessing Akpan", docStatus: "Verified", inspection: "2026-08-30" },
  ],
  "op-atlantic": [
    { id: "va5", registration: "UYO 990 FE", type: "Rear-loader", capacity: "12 m³", status: "In maintenance", driver: "Not set", docStatus: "Verified", inspection: "2026-07-18" },
    { id: "va6", registration: "ABK 431 GS", type: "Box truck (food waste)", capacity: "6 m³", status: "Inactive", driver: "Not set", docStatus: "Verified", inspection: "2026-08-02" },
  ],
  "op-ibom": [
    { id: "vi4", registration: "ITU 118 SK", type: "Skip loader", capacity: "8 m³", status: "In maintenance", driver: "Not set", docStatus: "Verified", inspection: "2026-06-09" },
    { id: "vi5", registration: "ITU 552 RM", type: "Tipper truck", capacity: "10 m³", status: "Inactive", driver: "Not set", docStatus: "Expired", inspection: "2025-11-20" },
  ],
  "op-nwaniba": [
    { id: "vn3", registration: "ETN 209 XB", type: "Tipper truck", capacity: "10 m³", status: "Active", driver: "Standby, Kingsley Etim", docStatus: "Verified", inspection: "2026-09-26" },
  ],
  "op-obio": [
    { id: "vo1", registration: "UYO 155 OB", type: "Tipper truck", capacity: "10 m³", status: "Inactive", driver: "Not set", docStatus: "Expired", inspection: "2026-02-03" },
    { id: "vo2", registration: "UYO 381 OB", type: "Pickup (bulk)", capacity: "3 m³", status: "Inactive", driver: "Not set", docStatus: "Expired", inspection: "2026-01-14" },
  ],
};

export function operatorFleet(opId: string): Vehicle[] {
  if (opId === "op-ufok") return [...sharedVehicles, ...EXTRA_FLEET["op-ufok"]!];
  const fromRoutes = routes
    .filter((r) => r.operatorId === opId)
    .map((r, i): Vehicle => ({
      id: `${opId}-r${i}`, registration: r.vehicle, type: r.vehicleType, capacity: r.vehicleType.includes("compactor") ? "14 m³" : r.vehicleType.includes("Pickup") ? "3 m³" : r.vehicleType.includes("Box") ? "6 m³" : "10 m³",
      status: "Active", driver: r.driver, docStatus: "Verified", inspection: dayAt(-btw(20, 120)).slice(0, 10),
    }));
  return [...fromRoutes, ...(EXTRA_FLEET[opId] ?? [])];
}

export interface Worker {
  id: string;
  name: string;
  role: "Driver" | "Supervisor" | "Dispatcher";
  phone: string;
  vehicle: string;
  verification: "Verified" | "Pending" | "Expired";
  status: "On shift" | "Off shift" | "Suspended";
  jobsToday: number;
  rating: number;
}
export function operatorWorkers(opId: string): Worker[] {
  const op = operatorById(opId)!;
  const wr = seeded(opId.length * 991 + op.staff);
  const fromRoutes = routes
    .filter((r) => r.operatorId === opId)
    .map((r): Worker => ({ id: r.id, name: r.driver, role: "Driver", phone: r.driverPhone, vehicle: r.vehicle, verification: "Verified", status: "On shift", jobsToday: r.done, rating: +(4 + wr() * 0.9).toFixed(1) }));
  const base: Worker[] =
    opId === "op-ufok"
      ? [
          ...sharedDrivers.map((d): Worker => {
            const r = routes.find((x) => x.driver === d.name);
            return { id: d.id, name: d.name, role: "Driver", phone: d.phone, vehicle: d.vehicle, verification: d.verification, status: d.status, jobsToday: r ? r.done : d.jobsToday, rating: d.rating };
          }),
          ...fromRoutes.filter((w) => !sharedDrivers.some((d) => d.name === w.name)),
        ]
      : fromRoutes;
  const office: Worker[] = op.staff
    ? [
        { id: `${opId}-sup`, name: `${pk(FIRST, wr)} ${pk(LAST, wr)}`, role: "Supervisor", phone: `+234 ${pk(PHONES, wr)} ${btw(100, 999, wr)} ${btw(1000, 9999, wr)}`, vehicle: "Not set", verification: "Verified", status: base.length ? "On shift" : "Off shift", jobsToday: 0, rating: 0 },
        { id: `${opId}-dsp`, name: op.contact, role: "Dispatcher", phone: op.phone, vehicle: "Not set", verification: "Verified", status: base.length ? "On shift" : "Off shift", jobsToday: 0, rating: 0 },
      ]
    : [];
  return [...base, ...office];
}

export type DocStatus = "Verified" | "Pending" | "Expiring" | "Expired" | "Rejected" | "Missing";
export interface OpsDoc {
  id: string;
  operatorId: string;
  name: string;
  category: string;
  uploaded?: string;
  expires?: string;
  status: DocStatus;
  version: number;
  size?: string;
  note?: string;
}
const DOC_TEMPLATE: Array<[string, string, string | undefined]> = [
  ["CAC certificate", "Corporate", undefined],
  ["Tax clearance certificate 2026", "Financial", "2026-12-31"],
  ["AKSEPA waste-handling permit", "Regulatory", "2027-03-31"],
  ["Fleet insurance", "Insurance", "2027-02-28"],
  ["Vehicle roadworthiness certificates", "Fleet", "2027-01-15"],
  ["Driver licences", "Workforce", "2027-04-30"],
  ["Disposal site agreement, Uyo dumpsite", "Regulatory", "2027-03-31"],
  ["Health & safety policy", "Workforce", undefined],
  ["Bank account verification", "Financial", undefined],
  ["Director ID (NIN)", "Corporate", undefined],
];
type DocOverride = Partial<Omit<OpsDoc, "id" | "operatorId">>;
const DOC_OVERRIDES: Record<string, Record<number, DocOverride>> = {
  "op-ufok": {
    2: { status: "Expiring", expires: "2026-10-31", uploaded: "2026-02-20", version: 2, size: "1.2 MB" },
    4: { name: "Roadworthiness, AKS 588 KJ", status: "Expiring", expires: "2026-10-19" },
  },
  "op-ibom": {
    6: { status: "Expiring", expires: "2026-10-12", uploaded: "2026-04-03", size: "640 KB" },
    5: { name: "Driver licences (5)", status: "Expired", expires: "2026-09-30", uploaded: "2026-04-03", size: "3.1 MB" },
  },
  "op-obio": {
    2: { status: "Expired", expires: "2026-09-14" },
    3: { status: "Expired", expires: "2026-08-31" },
    4: { status: "Expiring", expires: "2026-10-22" },
  },
  "op-esuk": {
    0: { status: "Pending", uploaded: "2026-09-21", size: "380 KB" },
    3: { status: "Pending", uploaded: "2026-09-23", size: "1.8 MB" },
    4: { name: "Vehicle particulars (4)", status: "Pending", uploaded: "2026-09-21", size: "2.0 MB" },
    5: { status: "Pending", uploaded: "2026-09-24", size: "2.6 MB" },
  },
  "op-mkpok": {
    0: { name: "Business name registration", status: "Rejected", uploaded: "2026-09-28", size: "150 KB", note: "Illegible scan, registration number cut off" },
    1: { status: "Pending", uploaded: "2026-09-28" },
    2: { status: "Missing" },
    3: { status: "Missing" },
    4: { status: "Pending", uploaded: "2026-09-29" },
    5: { status: "Pending", uploaded: "2026-09-29" },
    6: { status: "Missing" },
    7: { status: "Missing" },
  },
  "op-portside": Object.fromEntries(DOC_TEMPLATE.map((_, i) => [i, { status: "Pending" as DocStatus, uploaded: "2026-10-02" }])),
  "op-ekim": {
    0: { status: "Missing" },
    2: { status: "Rejected", note: "Permit belongs to a different company" },
    3: { status: "Missing" },
    4: { status: "Rejected", note: "Only vehicle failed roadworthiness" },
    6: { status: "Missing" },
    7: { status: "Missing" },
  },
  "op-etinan": Object.fromEntries(DOC_TEMPLATE.map((_, i) => [i, i === 0 ? { status: "Pending" as DocStatus, uploaded: "2026-10-03" } : { status: "Missing" as DocStatus }])),
};
const docCache = new Map<string, OpsDoc[]>();
export function operatorDocs(opId: string): OpsDoc[] {
  if (docCache.has(opId)) return docCache.get(opId)!;
  const op = operatorById(opId) ?? (opId === "op-etinan" ? ({ joined: "2026-10-03" } as Operator) : undefined);
  const dr = seeded(opId.charCodeAt(3) * 131 + opId.length);
  const over = DOC_OVERRIDES[opId] ?? {};
  const list = DOC_TEMPLATE.map(([name, category, expires], i): OpsDoc => {
    const o = over[i] ?? {};
    const status = o.status ?? "Verified";
    return {
      id: `${opId}-doc-${i}`,
      operatorId: opId,
      name: o.name ?? name,
      category,
      uploaded: status === "Missing" ? undefined : o.uploaded ?? op?.joined ?? "2026-03-01",
      expires: status === "Missing" ? undefined : o.expires ?? expires,
      status,
      version: o.version ?? 1,
      size: status === "Missing" ? undefined : o.size ?? `${btw(140, 2900, dr)} KB`.replace(/(\d)(\d{3}) KB/, "$1.$2 MB").replace(/\.(\d)\d\d MB/, ".$1 MB"),
      note: o.note,
    };
  });
  docCache.set(opId, list);
  return list;
}
export const allOperatorDocs = () => [...operators.map((o) => o.id), "op-etinan"].flatMap((id) => operatorDocs(id));
/** Documents that are verified but expire within `days` (or have already expired). */
export const expiringDocs = (days = 30) =>
  allOperatorDocs().filter((d) => d.status === "Expired" || d.status === "Expiring" || (d.expires && d.status === "Verified" && daysUntil(d.expires) <= days));

export const SHARED_DOC_IDS = documents.map((d) => d.id);

/* ================================================================== */
/* Operator exceptions, the escalation ladder                         */
/* ================================================================== */

export const LADDER = ["Warning", "Penalty", "Reassign customers", "Activate another operator", "Terminate"] as const;
export interface ExceptionRecord {
  kind: (typeof LADDER)[number] | "Suspension";
  detail: string;
  by: string;
  time: string;
  amount?: number;
}
export const OPERATOR_EXCEPTIONS: Record<string, ExceptionRecord[]> = {
  "op-ibom": [{ kind: "Warning", detail: "Five driver licences expired on 30 Sep. Renew within 7 days or affected drivers come off routes.", by: "Mbuotidem Udoh, Compliance Admin", time: dayAt(-4, 11, 20) }],
  "op-nwaniba": [
    { kind: "Warning", detail: "Completion fell to 91.2% (contract floor 95%). Eight missed pickups in 30 days.", by: "Idara Umoh, Operations Admin", time: dayAt(-7, 15, 5) },
  ],
  "op-obio": [
    { kind: "Warning", detail: "Completion 86% in July, below the 95% floor.", by: "Idara Umoh, Operations Admin", time: dayAt(-62, 10, 0) },
    { kind: "Penalty", detail: "₦57,500 deducted from August payout, 23 missed pickups not recovered within 24h.", by: "Ekaette Archibong, Finance Admin", time: dayAt(-36, 12, 0), amount: 57500 },
    { kind: "Reassign customers", detail: "All 284 customers moved to Ufok Environmental (212) and Nwaniba Clean Crew (72).", by: "Idara Umoh, Operations Admin", time: dayAt(-22, 9, 30) },
    { kind: "Suspension", detail: "Operator suspended pending contract review. Contract CT-UYO-008 terminated.", by: "Aniekan Etim, Super Admin", time: dayAt(-21, 18, 44) },
  ],
};

/* ================================================================== */
/* Applications (Workflow 2)                                           */
/* ================================================================== */

export const WORKFLOW_2 = [
  "Operator onboarding",
  "Documents uploaded",
  "Verification",
  "Operational assessment",
  "Commercial negotiation",
  "Contract issued",
  "Operator accepts",
  "Internal approval",
  "Activated",
  "Service areas assigned",
  "Customers assigned",
] as const;

export interface Application {
  id: string;
  company: string;
  short: string;
  stage: "Draft" | "Submitted" | "Under review" | "More information required" | "Rejected";
  step: number;
  failedStep?: number;
  submitted?: string;
  created: string;
  city: string;
  state: string;
  owner: string;
  source: "Slate discovered" | "Applied online" | "Referral";
  rc: string;
  founded: number;
  hq: string;
  contact: string;
  phone: string;
  email: string;
  focus: string;
  zones: string[];
  areaNames: string[];
  wasteTypes: string[];
  capacity: { customers: number; pickupsPerDay: number; tonnesPerDay: number; hours: string };
  vehicles: Array<{ registration: string; type: string; capacity: string; year: number; roadworthy: "Valid" | "Expired" | "Not provided" }>;
  workers: { drivers: number; loaders: number; supervisors: number; ppe: boolean; training: string };
  compliance: { permit: string; disposal: string; insurance: string; incidents: string; references: string[] };
  next: string;
  rejection?: string;
  missing?: string[];
}

export const applications: Application[] = [
  {
    id: "op-esuk", company: "Esuk Waste Logistics", short: "Esuk Logistics", stage: "Under review", step: 3, submitted: "2026-09-21", created: "2026-09-12", city: "Uyo", state: "Akwa Ibom",
    owner: "Itoro Effiong", source: "Slate discovered", rc: "RC 1730061", founded: 2019, hq: "22 Itu Road, Uyo", contact: "Enobong Asuquo", phone: "+234 816 774 0912", email: "hello@esuklogistics.ng",
    focus: "Commercial & bulk", zones: ["oron", "itam"], areaNames: ["Oron Road", "Itam"], wasteTypes: ["Commercial general", "Bulk items"],
    capacity: { customers: 260, pickupsPerDay: 70, tonnesPerDay: 18, hours: "05:30–18:00, Mon–Sat" },
    vehicles: [
      { registration: "UYO 611 ES", type: "Rear-loader", capacity: "12 m³", year: 2018, roadworthy: "Valid" },
      { registration: "UYO 612 ES", type: "Rear-loader", capacity: "12 m³", year: 2019, roadworthy: "Valid" },
      { registration: "ITU 208 EK", type: "Tipper truck", capacity: "10 m³", year: 2016, roadworthy: "Valid" },
      { registration: "ITU 744 EK", type: "Pickup (bulk)", capacity: "3 m³", year: 2021, roadworthy: "Not provided" },
    ],
    workers: { drivers: 5, loaders: 10, supervisors: 2, ppe: true, training: "In-house induction, monthly toolbox talks" },
    compliance: { permit: "AKSEPA/WHP/2024/0418", disposal: "Uyo dumpsite (Use Offot), agreement to Jun 2027", insurance: "Fleet + public liability, ₦50m cover (Leadway)", incidents: "None reported in 24 months", references: ["Ibom Plaza Supermarket", "Unity Hotel Uyo"] },
    next: "Site visit at Itu Road yard, Wed 7 Oct 10:00",
  },
  {
    id: "op-mkpok", company: "Mkpok Environmental", short: "Mkpok Environmental", stage: "More information required", step: 1, submitted: "2026-09-28", created: "2026-09-28", city: "Uyo", state: "Akwa Ibom",
    owner: "Itoro Effiong", source: "Applied online", rc: "BN 3402157", founded: 2022, hq: "5 Mkpok Street, off Abak Road, Uyo", contact: "Abasiama Eyo", phone: "+234 909 115 3360", email: "mkpokenv@yahoo.com",
    focus: "Residential", zones: ["uselga", "abak"], areaNames: ["Use Offot", "Abak Road"], wasteTypes: ["General household", "Recyclables"],
    capacity: { customers: 600, pickupsPerDay: 110, tonnesPerDay: 9, hours: "06:00–16:00, Mon–Sat" },
    vehicles: [
      { registration: "ABK 902 MK", type: "Tipper truck", capacity: "10 m³", year: 2014, roadworthy: "Valid" },
      { registration: "ABK 117 MK", type: "Pickup (bulk)", capacity: "3 m³", year: 2017, roadworthy: "Expired" },
    ],
    workers: { drivers: 2, loaders: 6, supervisors: 1, ppe: false, training: "None documented" },
    compliance: { permit: "Not provided", disposal: "Not provided", insurance: "Not provided", incidents: "Not declared", references: ["Use Offot Residents Forum"] },
    next: "Waiting on operator, 4 documents requested on 30 Sep",
    missing: ["Clear scan of business name registration", "AKSEPA waste-handling permit", "Fleet insurance", "Disposal site agreement", "Health & safety policy"],
  },
  {
    id: "op-portside", company: "Portside Waste Partners", short: "Portside", stage: "Submitted", step: 2, submitted: "2026-10-02", created: "2026-10-01", city: "Port Harcourt", state: "Rivers",
    owner: "Unassigned", source: "Applied online", rc: "RC 822914", founded: 2011, hq: "14 Trans-Amadi Industrial Layout, Port Harcourt", contact: "Ngozi Okafor", phone: "+234 805 330 7719", email: "bd@portsidewaste.com",
    focus: "Commercial", zones: [], areaNames: ["GRA Phase 2", "Trans-Amadi"], wasteTypes: ["Commercial general", "Industrial"],
    capacity: { customers: 900, pickupsPerDay: 240, tonnesPerDay: 64, hours: "24 hours, 7 days" },
    vehicles: [
      { registration: "PHC 401 KT", type: "7-tonne compactor", capacity: "14 m³", year: 2020, roadworthy: "Valid" },
      { registration: "PHC 402 KT", type: "7-tonne compactor", capacity: "14 m³", year: 2020, roadworthy: "Valid" },
      { registration: "PHC 118 RV", type: "Hook-lift truck", capacity: "20 m³", year: 2019, roadworthy: "Valid" },
      { registration: "PHC 774 AB", type: "Rear-loader", capacity: "12 m³", year: 2017, roadworthy: "Valid" },
      { registration: "PHC 775 AB", type: "Rear-loader", capacity: "12 m³", year: 2017, roadworthy: "Valid" },
    ],
    workers: { drivers: 13, loaders: 32, supervisors: 5, ppe: true, training: "ISO 45001-aligned programme" },
    compliance: { permit: "RIWAMA/OP/2023/112", disposal: "Eneka dumpsite, RIWAMA allocation", insurance: "Fleet + public liability, ₦150m cover (AXA Mansard)", incidents: "One minor spill, Mar 2025, closed", references: ["Grand Atlantic Group", "Trans-Amadi Industrial Association"] },
    next: "Assign a reviewer, Port Harcourt launches 1 Feb 2027",
  },
  {
    id: "op-ekim", company: "Ekim Collections", short: "Ekim Collections", stage: "Rejected", step: 2, failedStep: 2, submitted: "2026-08-14", created: "2026-08-14", city: "Uyo", state: "Akwa Ibom",
    owner: "Itoro Effiong", source: "Referral", rc: "Not set", founded: 2024, hq: "Osongama Estate Phase 1, Uyo", contact: "Etimbuk Edet", phone: "+234 810 448 2290", email: "ekimcollect@gmail.com",
    focus: "Residential", zones: ["osongama"], areaNames: ["Osongama Estate"], wasteTypes: ["General household"],
    capacity: { customers: 120, pickupsPerDay: 30, tonnesPerDay: 2, hours: "06:00–12:00, Mon–Fri" },
    vehicles: [{ registration: "UYO 090 EK", type: "Pickup (bulk)", capacity: "3 m³", year: 2009, roadworthy: "Expired" }],
    workers: { drivers: 1, loaders: 3, supervisors: 0, ppe: false, training: "None" },
    compliance: { permit: "Belongs to another company", disposal: "None", insurance: "None", incidents: "Not declared", references: [] },
    next: "Closed, may reapply after 6 months (from 21 Feb 2027)",
    rejection: "Not a registered company; waste permit belongs to a different business; the only vehicle failed roadworthiness. Rejected 21 Aug by Mbuotidem Udoh.",
  },
  {
    id: "op-etinan", company: "Etinan Haulage & Sanitation", short: "Etinan Haulage", stage: "Draft", step: 0, created: "2026-10-03", city: "Uyo", state: "Akwa Ibom",
    owner: "Itoro Effiong", source: "Slate discovered", rc: "RC 1588420", founded: 2017, hq: "Km 3 Etinan Road, Etinan", contact: "Mfon Udofia", phone: "+234 703 662 1048", email: "etinanhaulage@gmail.com",
    focus: "Residential & overflow", zones: ["abak", "uselga"], areaNames: ["Abak Road", "Use Offot"], wasteTypes: ["General household", "Bulk items"],
    capacity: { customers: 450, pickupsPerDay: 90, tonnesPerDay: 11, hours: "06:00–17:00, Mon–Sat" },
    vehicles: [
      { registration: "ETN 515 HS", type: "Tipper truck", capacity: "10 m³", year: 2018, roadworthy: "Not provided" },
      { registration: "ETN 516 HS", type: "Tipper truck", capacity: "10 m³", year: 2018, roadworthy: "Not provided" },
      { registration: "ETN 220 HS", type: "Pickup (bulk)", capacity: "3 m³", year: 2020, roadworthy: "Not provided" },
    ],
    workers: { drivers: 3, loaders: 8, supervisors: 1, ppe: true, training: "Not yet provided" },
    compliance: { permit: "Not yet provided", disposal: "Not yet provided", insurance: "Not yet provided", incidents: "Not yet declared", references: ["Seen working Etinan market clearance"] },
    next: "Invite sent 3 Oct, operator has not started onboarding",
  },
];
export const applicationById = (id: string) => applications.find((a) => a.id === id);
export const completeness = (id: string) => {
  const d = operatorDocs(id);
  const score = d.reduce((a, x) => a + (x.status === "Verified" ? 1 : x.status === "Pending" ? 0.7 : x.status === "Rejected" ? 0.2 : 0), 0);
  return Math.round((score / d.length) * 100);
};

/* ================================================================== */
/* Bookings (H12)                                                      */
/* ================================================================== */

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerType: CustomerType;
  area: string;
  service: string;
  date: string;
  window: string;
  operatorId: string | null;
  status: "Unassigned" | "Quote pending" | "Assigned" | "Scheduled" | "Completed" | "Cancelled" | "Escalated";
  amount: number;
  created: string;
  channel: "App" | "WhatsApp" | "Phone" | "Admin";
  note: string;
  pickupId?: string;
}
const BOOKING_SERVICES: Array<[string, number, number, string[]]> = [
  ["Bulk Waste Pickup", 15000, 48000, ["Old wardrobe and two mattresses", "Fridge and a broken generator", "Moving out, 14 bags and a sofa", "Office chairs (11) and a desk", "Renovation offcuts, 2 trips"]],
  ["Extra pickup", 3500, 3500, ["Party leftovers, 4 bags", "Extra bags after the weekend", "Second collection before travel"]],
  ["Special Collection", 45000, 120000, ["Construction debris from a fence rebuild", "Garden clearance, 3 palm trunks", "Burnt roofing sheets after a fire"]],
  ["Event Cleanup", 60000, 240000, ["Wedding reception, 400 guests", "Burial ceremony, 2 days", "Church harvest, 1,200 guests", "Conference, Ibom Hall"]],
  ["Recycling Pickup", 1500, 1500, ["First recyclables pickup", "PET and cans, 3 sacks"]],
];
export const bookings: Booking[] = (() => {
  const r = seeded(1212);
  const statuses: Booking["status"][] = ["Unassigned", "Unassigned", "Unassigned", "Quote pending", "Quote pending", "Assigned", "Assigned", "Scheduled", "Scheduled", "Scheduled", "Scheduled", "Completed", "Completed", "Completed", "Cancelled", "Escalated"];
  const out: Booking[] = [
    { id: "BK-26-0412", customerId: "cus-0001", customerName: "Imaobong Akpan", customerType: "Household", area: "Ewet Housing Estate", service: "Bulk Waste Pickup", date: dayAt(5, 10), window: "10:00–12:00", operatorId: "op-nwaniba", status: "Scheduled", amount: 18000, created: dayAt(-1, 21, 8), channel: "App", note: "Old wardrobe and two mattresses", pickupId: "PU-26-08902" },
  ];
  for (let i = 0; i < 38; i++) {
    const c = allCustomers[btw(1, allCustomers.length - 1, r)]!;
    const [svc, lo, hi, notes] = pk(BOOKING_SERVICES, r);
    const status = i < 6 ? (["Unassigned", "Escalated", "Quote pending", "Unassigned", "Unassigned", "Quote pending"] as const)[i]! : pk(statuses, r);
    const off = status === "Completed" ? -btw(1, 12, r) : status === "Cancelled" ? btw(-6, 6, r) : btw(0, 12, r);
    const window = pk(["07:00–09:00", "08:00–10:00", "10:00–12:00", "14:00–16:00"], r);
    const opForSvc = svc === "Special Collection" ? "op-ibom" : svc === "Event Cleanup" ? pk(["op-atlantic", "op-nwaniba"], r) : svc === "Bulk Waste Pickup" ? pk(["op-nwaniba", "op-ibom", "op-nwaniba"], r) : c.operatorId;
    out.push({
      id: `BK-26-${pad(413 + i)}`,
      customerId: c.id, customerName: c.name, customerType: c.type, area: c.area, service: svc,
      date: dayAt(off, winStart(window)), window,
      operatorId: status === "Unassigned" || status === "Quote pending" ? null : opForSvc,
      status, amount: Math.round(btw(lo, hi, r) / 500) * 500,
      created: dayAt(Math.min(off, 0) - btw(1, 6, r), btw(7, 22, r), btw(0, 59, r)),
      channel: pk(["App", "App", "App", "WhatsApp", "Phone", "Admin"], r),
      note: pk(notes, r),
      pickupId: status === "Scheduled" || status === "Completed" || status === "Assigned" ? `PU-26-${btw(8420, 8790, r)}` : undefined,
    });
  }
  return out.sort((a, b) => b.created.localeCompare(a.created));
})();

/* ================================================================== */
/* Service areas, zone metrics                                        */
/* ================================================================== */

export const ZONE_FACTS: Record<string, { households: number; demand: number; lga: string; estates: string[] }> = {
  ewet: { households: 1450, demand: 64, lga: "Uyo", estates: ["Ewet Housing Estate Phase 1", "Ewet Housing Estate Phase 2", "Federal Housing Estate"] },
  shelter: { households: 760, demand: 22, lga: "Uyo", estates: ["Shelter Afrique Estate", "Nwaniba Court"] },
  osongama: { households: 690, demand: 41, lga: "Uyo", estates: ["Osongama Estate Phase 1", "Osongama Estate Phase 2"] },
  aka: { households: 520, demand: 37, lga: "Uyo", estates: ["Aka Road Gardens", "Udo Udoma Close"] },
  oron: { households: 480, demand: 58, lga: "Uyo", estates: ["Wellington Bassey Court", "Oron Road Layout"] },
  nwaniba: { households: 610, demand: 112, lga: "Uyo", estates: ["Ikot Ekpene Road Gardens", "Nwaniba Layout"] },
  abak: { households: 540, demand: 146, lga: "Uyo", estates: ["Abak Road Estate"] },
  itam: { households: 320, demand: 29, lga: "Itu", estates: ["Itam Industrial Layout"] },
  uselga: { households: 470, demand: 133, lga: "Uyo", estates: ["Use Offot Housing", "Mbiabong Layout"] },
};

/* ================================================================== */
/* UI helpers                                                          */
/* ================================================================== */

const EXTRA_TONES: Record<string, Tone> = {
  unassigned: "warning",
  "on route": "info",
  "running late": "warning",
  breakdown: "danger",
  "not started": "neutral",
  "on shift": "success",
  "off shift": "neutral",
  "in maintenance": "warning",
  missing: "neutral",
  "recovery scheduled": "info",
  arrived: "info",
  valid: "success",
  "not provided": "neutral",
};
/** StatusBadge with the operations vocabulary added (routes, fleet, bookings). */
export function OpsBadge({ status, size, className }: { status: string; size?: "sm" | "md"; className?: string }) {
  const t = EXTRA_TONES[status.toLowerCase()];
  if (t)
    return (
      <Badge tone={t} dot size={size} className={className}>
        {status}
      </Badge>
    );
  return <StatusBadge status={status} size={size} className={className} />;
}

/** Operator score: figure + segmented meter. */
export function Score({ value, className, wide }: { value: number; className?: string; wide?: boolean }) {
  if (!value) return <span className={cn("t-small text-ink-3", className)}>Not scored</span>;
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="w-6 text-right t-small font-semibold text-ink tnum">{value}</span>
      <Meter value={value} className={wide ? "w-28" : "w-16"} />
    </span>
  );
}

export function PersonCell({ name, sub, square }: { name: string; sub?: ReactNode; square?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <Avatar name={name} size="sm" square={square} />
      <span className="flex min-w-0 flex-col">
        <span className="truncate t-small font-medium text-ink">{name}</span>
        {sub && <span className="truncate t-micro text-ink-3">{sub}</span>}
      </span>
    </span>
  );
}

/** Unknown id → not found, with a way back. */
export function NotFound({ what, id, back }: { what: string; id?: string; back: { to: string; label: string } }) {
  return (
    <Page>
      <StateView
        state="not-found"
        title={`No ${what} with that reference`}
        description={
          id ? (
            <>
              Nothing matches <span className="t-mono text-ink">{id}</span>. It may have been merged, or the link is wrong.
            </>
          ) : undefined
        }
        action={
          <ButtonLink to={back.to} variant="secondary" leading={<ArrowLeft className="size-4" />}>
            {back.label}
          </ButtonLink>
        }
      />
    </Page>
  );
}

/** `?new=1` style flags that open a modal and clear on close. */
export function useParamFlag(key = "new"): [boolean, (v: boolean) => void] {
  const [params, setParams] = useSearchParams();
  const on = params.get(key) === "1";
  const set = (v: boolean) => {
    const n = new URLSearchParams(params);
    if (v) n.set(key, "1");
    else n.delete(key);
    setParams(n, { replace: true, preventScrollReset: true });
  };
  return [on, set];
}

export function useExport(what: string) {
  const toast = useToast();
  return (count: number) => (f: "CSV" | "PDF" | "Print") =>
    f === "Print"
      ? toast.info(`Preparing ${what} for print`, `${formatNumber(count)} rows`)
      : toast.success(`${what} exported as ${f}`, `${formatNumber(count)} rows · sent to idara.umoh@slate.ng`);
}

/** Section kicker, small label above a block. */
export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("t-micro text-ink-3", className)}>{children}</p>;
}

/** A row of figures separated by hairlines, sentence-like, not tiles. */
export function Figures({ items, className }: { items: Array<{ label: string; value: ReactNode; tone?: "danger" | "warning" | "success" }>; className?: string }) {
  return (
    <dl className={cn("flex flex-wrap gap-x-8 gap-y-3", className)}>
      {items.map((it) => (
        <div key={it.label} className="flex flex-col gap-0.5">
          <dt className="t-micro text-ink-3">{it.label}</dt>
          <dd className={cn("font-display text-[22px] font-bold leading-tight tracking-[-0.02em] tnum", it.tone === "danger" ? "text-danger" : it.tone === "warning" ? "text-warning" : it.tone === "success" ? "text-success" : "text-ink")}>
            {it.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export const spareCapacity = (o: Operator) => Math.max(0, o.capacity - o.assigned);
export const stopsLeft = (opId: string, list: Pickup[]) =>
  list.filter((p) => p.operatorId === opId && (p.status === "Scheduled" || p.status === "En route" || p.status === "In progress" || p.status === "Late")).length;

/* ================================================================== */
/* Modals                                                              */
/* ================================================================== */

const TODAY_WINDOWS = ["10:00–12:00", "14:00–16:00"];
const REASONS = ["Truck breakdown", "Operator no-show", "Operator over capacity", "Customer request", "Access problem", "Other"];

/**
 * Reassign one or more pickups to another operator, Workflow 4 recovery.
 * Capacity check: spare contract capacity and stops still on today's sheet.
 */
export function ReassignModal({
  open,
  onClose,
  items,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  items: Pickup[];
  onDone?: (created: Pickup[]) => void;
}) {
  const toast = useToast();
  const ops = useOperators();
  const today = useLivePickups();
  const current = new Set(items.map((p) => p.operatorId));
  const areas = [...new Set(items.map((p) => p.area))];
  const candidates = ops.filter((o) => o.status === "Active" && !(current.size === 1 && current.has(o.id)));
  const [target, setTarget] = useState("");
  const [when, setWhen] = useState(TODAY_WINDOWS[0]!);
  const [reason, setReason] = useState(items.some((p) => pickupReasons[p.id]?.includes("broke down")) ? "Truck breakdown" : "");
  const [notify, setNotify] = useState(true);
  const [error, setError] = useState("");
  const close = () => {
    setTarget("");
    setError("");
    onClose();
  };
  const submit = () => {
    if (!target) return setError("Choose the operator who will recover these pickups.");
    if (!reason) return setError("Choose a reason, it goes on the operator's record.");
    const tomorrow = when.startsWith("Tomorrow");
    const win = tomorrow ? "07:00–09:00" : when;
    const created = items.map((p) => opsStore.recover(p, target, win, tomorrow ? 1 : 0));
    const op = ops.find((o) => o.id === target)!;
    toast.success(
      `${items.length === 1 ? "Recovery pickup" : `${items.length} recovery pickups`} booked with ${op.short}`,
      `${tomorrow ? "Tomorrow" : "Today"} ${win}${notify ? " · customers notified by SMS" : ""}`,
    );
    onDone?.(created);
    close();
  };
  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title={items.length === 1 ? "Reassign pickup" : `Reassign ${items.length} pickups`}
      description={`${areas.slice(0, 3).join(", ")}${areas.length > 3 ? ` +${areas.length - 3} more` : ""} · now with ${[...current].map((id) => operatorById(id)?.short).join(", ")}. A new recovery pickup is created; the original stays on record.`}
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button onClick={submit} leading={<Truck className="size-4" />}>
            {items.length === 1 ? "Book recovery" : `Book ${items.length} recoveries`}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 t-small font-medium text-ink">Recovering operator</legend>
          {candidates.map((o) => {
            const spare = spareCapacity(o);
            const left = stopsLeft(o.id, today);
            const covers = areas.filter((a) => o.areas.includes(a)).length;
            const full = spare < items.length;
            const sel = target === o.id;
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={sel}
                disabled={full}
                onClick={() => {
                  setTarget(o.id);
                  setError("");
                }}
                className={cn(
                  "flex w-full items-start gap-3 rounded-md border bg-surface p-3.5 text-left transition-[border-color,box-shadow] disabled:opacity-50",
                  sel ? "border-ink ring-1 ring-ink" : "border-line-strong hover:border-ink-3",
                )}
              >
                <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border", sel ? "border-ink bg-ink" : "border-line-strong")}>
                  {sel && <span className="size-2 rounded-full bg-surface" />}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="t-h3 text-ink">{o.short}</span>
                    <Score value={o.score} />
                  </span>
                  <span className="t-small text-ink-2 tnum">
                    {formatNumber(spare)} slots free of {formatNumber(o.capacity)} · {left} stops left today
                  </span>
                  <span className={cn("t-small", full ? "text-danger" : covers === areas.length ? "text-success" : "text-warning")}>
                    {full
                      ? `Not enough capacity for ${items.length}`
                      : covers === areas.length
                        ? `Covers ${areas.length === 1 ? areas[0] : "all affected areas"}`
                        : covers === 0
                          ? "Outside contracted areas, overflow rate applies"
                          : `Covers ${covers} of ${areas.length} areas, overflow rate for the rest`}
                  </span>
                </span>
              </button>
            );
          })}
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="New window" value={when} onChange={(e) => setWhen(e.target.value)} options={[...TODAY_WINDOWS.map((w) => ({ value: w, label: `Today ${w}` })), { value: "Tomorrow 07:00–09:00", label: "Tomorrow 07:00–09:00" }]} />
          <Select label="Reason" value={reason} onChange={(e) => { setReason(e.target.value); setError(""); }} options={REASONS} placeholder="Choose a reason" />
        </div>
        <Checkbox checked={notify} onChange={setNotify} label="Tell customers by SMS and in the app" description="“Your collection has been moved to a Slate recovery crew, today 10:00–12:00.”" />
        {error && <p className="t-small text-danger" role="alert">{error}</p>}
      </div>
    </Modal>
  );
}

export function RescheduleModal({ open, onClose, pickup, onDone }: { open: boolean; onClose: () => void; pickup?: Pickup; onDone?: (date: string, window: string) => void }) {
  const toast = useToast();
  const [date, setDate] = useState("2026-10-06");
  const [win, setWin] = useState("07:00–09:00");
  const [reason, setReason] = useState("");
  const [notify, setNotify] = useState(true);
  const [error, setError] = useState("");
  const submit = () => {
    if (!date || date < "2026-10-05") return setError("Pick today or a later date.");
    if (!reason.trim()) return setError("Add a short reason for the record.");
    const iso = new Date(`${date}T${win.slice(0, 5)}:00+01:00`).toISOString();
    if (pickup) opsStore.patchPickup(pickup.id, { date: iso, window: win, status: "Scheduled", note: `Rescheduled: ${reason}` });
    onDone?.(iso, win);
    toast.success("Pickup rescheduled", `${formatDate(iso)}, ${win}${notify ? " · customer notified" : ""}`);
    setError("");
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reschedule pickup"
      description={pickup ? `${pickup.id} · ${pickup.customerName} · ${pickup.operatorName}` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Reschedule</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <DatePicker label="Date"  min="2026-10-05" value={date} onChange={(date) => setDate(date)} />
          <Select label="Window" value={win} onChange={(e) => setWin(e.target.value)} options={["06:00–08:00", "07:00–09:00", "08:00–10:00", "10:00–12:00", "14:00–16:00"]} />
        </div>
        <Textarea label="Reason" rows={2} value={reason} onChange={(e) => { setReason(e.target.value); setError(""); }} placeholder="e.g. Customer travelling, estate gate closed on Monday" error={error || undefined} />
        <Checkbox checked={notify} onChange={setNotify} label="Notify the customer and the operator" />
      </div>
    </Modal>
  );
}

export function CancelPickupModal({ open, onClose, pickup, onDone }: { open: boolean; onClose: () => void; pickup?: Pickup; onDone?: () => void }) {
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [refund, setRefund] = useState(true);
  const [error, setError] = useState("");
  const submit = () => {
    if (!reason) return setError("Choose why this pickup is being cancelled.");
    if (pickup) opsStore.patchPickup(pickup.id, { status: "Cancelled", note: `Cancelled: ${reason}${note ? `, ${note}` : ""}` });
    toast.success("Pickup cancelled", `${pickup?.id ?? ""}${refund ? " · credit added to the customer's next bill" : ""}`);
    onDone?.();
    setError("");
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Cancel this pickup?"
      description={pickup ? `${pickup.id} · ${pickup.customerName}. The operator is told to skip the stop.` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Keep pickup</Button>
          <Button variant="destructive" onClick={submit}>Cancel pickup</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Select label="Reason" value={reason} onChange={(e) => { setReason(e.target.value); setError(""); }} options={["Customer request", "Duplicate booking", "Account suspended", "Public holiday", "Unsafe access", "Other"]} placeholder="Choose a reason" error={error || undefined} />
        <Textarea label="Note" optional rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        <Checkbox checked={refund} onChange={setRefund} label="Credit the customer for this collection" />
      </div>
    </Modal>
  );
}

/** Contact a customer or operator, SMS, WhatsApp, email or a logged call. */
export function ContactModal({ open, onClose, name, phone: tel, email, template }: { open: boolean; onClose: () => void; name: string; phone: string; email: string; template?: string }) {
  const toast = useToast();
  const [channel, setChannel] = useState<"SMS" | "WhatsApp" | "Email" | "Call">("SMS");
  const [msg, setMsg] = useState(template ?? `Hello ${name.split(" ")[0]}, this is Idara from Slate operations. `);
  const [outcome, setOutcome] = useState("Answered, resolved");
  const [error, setError] = useState("");
  const send = () => {
    if (channel !== "Call" && msg.trim().length < 12) return setError("Write a message first.");
    toast.success(channel === "Call" ? `Call logged with ${name}` : `${channel} sent to ${name}`, channel === "Call" ? outcome : channel === "Email" ? email : tel);
    setError("");
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Contact ${name}`}
      description={`${tel} · ${email}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={send} leading={channel === "Call" ? <Phone className="size-4" /> : <Send className="size-4" />}>
            {channel === "Call" ? "Log call" : `Send ${channel === "Email" ? "email" : channel}`}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Segmented
          value={channel}
          onChange={setChannel}
          className="w-full"
          options={[
            { value: "SMS", label: <span className="flex items-center gap-1.5"><MessageSquare className="size-3.5" />SMS</span> },
            { value: "WhatsApp", label: "WhatsApp" },
            { value: "Email", label: <span className="flex items-center gap-1.5"><Mail className="size-3.5" />Email</span> },
            { value: "Call", label: <span className="flex items-center gap-1.5"><Phone className="size-3.5" />Call</span> },
          ]}
        />
        {channel === "Call" ? (
          <>
            <a href={`tel:${tel.replace(/\s/g, "")}`} className="flex items-center justify-between rounded-md border border-line px-4 py-3 hover:bg-sunken">
              <span className="t-mono text-ink">{tel}</span>
              <span className="t-small font-medium text-ink-2">Call now</span>
            </a>
            <Select label="Outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)} options={["Answered, resolved", "Answered, follow-up needed", "No answer", "Wrong number"]} />
          </>
        ) : (
          <Textarea label="Message" rows={4} value={msg} onChange={(e) => { setMsg(e.target.value); setError(""); }} error={error || undefined} hint={channel === "SMS" ? `${msg.length} / 160 characters` : undefined} />
        )}
      </div>
    </Modal>
  );
}

/** Assign a service to a customer, service, frequency, start, operator. */
export function AssignServiceModal({ open, onClose, customer }: { open: boolean; onClose: () => void; customer?: Customer }) {
  const toast = useToast();
  const ops = useOperators();
  const eligible = services.filter((s) => !customer || s.eligible.includes(customer.type));
  const [svc, setSvc] = useState("");
  const [freq, setFreq] = useState("");
  const [start, setStart] = useState("2026-10-08");
  const [op, setOp] = useState(customer?.operatorId ?? "");
  const [error, setError] = useState<Record<string, string>>({});
  const service: Service | undefined = services.find((s) => s.id === svc);
  const activeOps = ops.filter((o) => o.status === "Active");
  const close = () => {
    setSvc("");
    setFreq("");
    setError({});
    onClose();
  };
  const submit = () => {
    const e: Record<string, string> = {};
    if (!svc) e.svc = "Choose a service.";
    if (service && service.frequencies.length > 1 && !freq) e.freq = "Choose how often.";
    if (!op) e.op = "Choose who will deliver it.";
    setError(e);
    if (Object.keys(e).length) return;
    toast.success(`${service!.name} assigned`, `${customer?.name ?? "Customer"} · from ${formatDate(start)} · ${ops.find((o) => o.id === op)!.short}`);
    close();
  };
  return (
    <Modal
      open={open}
      onClose={close}
      title="Assign a service"
      description={customer ? `${customer.name} · ${customer.type} · ${customer.area}` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button onClick={submit}>Assign service</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Select
          label="Service"
          value={svc}
          onChange={(e) => {
            setSvc(e.target.value);
            setFreq(services.find((s) => s.id === e.target.value)?.frequencies.length === 1 ? services.find((s) => s.id === e.target.value)!.frequencies[0]! : "");
          }}
          options={eligible.map((s) => ({ value: s.id, label: `${s.name}, from ${formatNaira(s.priceFrom)}${s.priceUnit}` }))}
          placeholder="Choose a service"
          error={error.svc}
        />
        {service && (
          <p className="t-small text-ink-2">
            {service.short} {service.pricingModel === "Quote" ? "Priced by quote after assessment." : ""}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Frequency" value={freq} onChange={(e) => setFreq(e.target.value)} options={service?.frequencies ?? []} placeholder={service ? "Choose" : "Choose a service first"} disabled={!service} error={error.freq} />
          <DatePicker label="Start date"  min="2026-10-05" value={start} onChange={(date) => setStart(date)} />
        </div>
        <Select
          label="Operator"
          value={op}
          onChange={(e) => setOp(e.target.value)}
          options={activeOps.map((o) => ({ value: o.id, label: `${o.short}, ${formatNumber(spareCapacity(o))} slots free${customer && o.areas.includes(customer.area) ? " · covers this area" : ""}` }))}
          placeholder="Choose an operator"
          error={error.op}
        />
      </div>
    </Modal>
  );
}

/** A small inline warning about a capacity shortfall. */
export function CapacityNote({ need, spare }: { need: number; spare: number }) {
  if (need <= spare)
    return (
      <p className="flex items-center gap-1.5 t-small text-success">
        <Check className="size-4" /> {formatNumber(spare - need)} slots left after this move
      </p>
    );
  return (
    <Alert tone="danger" icon={<AlertTriangle />} title="Over capacity">
      Needs {formatNumber(need)} slots; only {formatNumber(spare)} free under the current contract.
    </Alert>
  );
}

export const isTodayISO = (iso: string) => iso.slice(0, 10) === dayAt(0).slice(0, 10);
export { DEMO_NOW };
