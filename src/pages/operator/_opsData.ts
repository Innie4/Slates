/**
 * Operator portal (part 1), page-local data for Ufok Environmental Services Ltd.
 *
 * Built on top of the shared Uyo world in `@/data`: every Ufok pickup and customer
 * from the shared set is kept (same ids, names, addresses), then normalised onto
 * Ufok's own fleet and today's four routes so the operator view is internally
 * consistent at the demo clock (Mon 5 Oct 2026, 08:12).
 */
import {
  FIRST, LAST, customers as sharedCustomers, drivers as sharedDrivers, operatorById, operatorNotifications, pickups as sharedPickups,
  vehicles as sharedVehicles, type CustomerType, type Driver, type Vehicle,
} from "@/data";

export const OP_ID = "op-ufok";
export const UFOK = operatorById(OP_ID)!;

/* ---------- time helpers (same construction as @/data) ---------- */
export const at = (offset: number, hh = 8, mm = 0) => {
  const d = new Date("2026-10-05T00:00:00+01:00");
  d.setDate(d.getDate() + offset);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
};
export const TODAY_KEY = at(0).slice(0, 10);
export const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const isToday = (iso: string) => dayKey(iso) === dayKey(at(0));
const windowStart = (w: string) => {
  const [h, m] = w.split("–")[0]!.split(":").map(Number);
  return { h: h!, m: m! };
};

let s = 5108;
const rnd = () => {
  s = (s * 16807) % 2147483647;
  return (s - 1) / 2147483646;
};
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)]!;
const between = (a: number, b: number) => Math.round(a + rnd() * (b - a));

/* ---------- types ---------- */
export type JobStatus = "Scheduled" | "En route" | "Arrived" | "Completed" | "Failed" | "Cancelled";
export const FAILURE_REASONS = ["Gate locked", "Bin not out", "Access blocked", "Vehicle breakdown", "Other"] as const;
export type FailureReason = (typeof FAILURE_REASONS)[number] | "Missed, recovered next day";

export interface Job {
  id: string;
  customerId: string;
  customerName: string;
  customerType: CustomerType;
  address: string;
  area: string;
  service: string;
  date: string;
  window: string;
  status: JobStatus;
  driver: string;
  vehicle: string;
  routeId?: string;
  /** 1-based position on today's route */
  stop?: number;
  startedAt?: string;
  arrivedAt?: string;
  completedAt?: string;
  failedAt?: string;
  failReason?: FailureReason;
  cancelReason?: string;
  bins: number;
  households?: number;
  access?: string;
  note?: string;
  photos?: number;
}

export interface OpsRoute {
  id: string;
  name: string;
  vehicle: string;
  driver: string;
  areas: string[];
  truckAt: string;
  startedAt: string;
  distanceKm: number;
  size: number;
  /** stops attempted (completed + failed) */
  attempted: number;
  failedAt: Array<{ index: number; reason: FailureReason }>;
  /** status of the stop the truck is on */
  current: "Arrived" | "En route";
}

export const ROUTES: OpsRoute[] = [
  {
    id: "r-ewet", name: "Ewet & Udo Udoma", vehicle: "AKS 214 XA", driver: "Emmanuel Udo",
    areas: ["Ewet Housing Estate", "Udo Udoma Avenue", "Wellington Bassey Way", "Aka Road"],
    truckAt: "Ewet Road", startedAt: at(0, 6, 4), distanceKm: 41.6, size: 38, attempted: 17, failedAt: [], current: "Arrived",
  },
  {
    id: "r-shelter", name: "Shelter Afrique & Nwaniba", vehicle: "AKS 588 KJ", driver: "Godwin Etuk",
    areas: ["Shelter Afrique Estate", "Nwaniba Road", "Ikot Ekpene Road"],
    truckAt: "Shelter Afrique, Block B", startedAt: at(0, 6, 11), distanceKm: 37.9, size: 34, attempted: 11, failedAt: [{ index: 6, reason: "Gate locked" }], current: "Arrived",
  },
  {
    id: "r-osongama", name: "Osongama & Itam", vehicle: "AKS 902 QE", driver: "Daniel Inyang",
    areas: ["Osongama Estate", "Itam", "Use Offot", "Abak Road", "Oron Road"],
    truckAt: "Itam Road junction", startedAt: at(0, 6, 20), distanceKm: 46.3, size: 29, attempted: 9, failedAt: [{ index: 4, reason: "Bin not out" }], current: "En route",
  },
  {
    id: "r-estates", name: "Estate collection points", vehicle: "UYO 903 BG", driver: "Samuel Akpan",
    areas: [], truckAt: "Udo Udoma Avenue", startedAt: at(0, 6, 35), distanceKm: 28.4, size: 21, attempted: 3, failedAt: [], current: "En route",
  },
];
export const routeById = (id: string) => ROUTES.find((r) => r.id === id);

const routeForArea = (area: string, type: CustomerType) =>
  type === "Estate" ? ROUTES[3]! : ROUTES.find((r) => r.areas.includes(area)) ?? ROUTES[2]!;

/* ---------- customers (Ufok only) ---------- */
export interface OpsCustomer {
  id: string;
  name: string;
  type: CustomerType;
  address: string;
  area: string;
  plan: string;
  frequency: string;
  days: string;
  window: string;
  status: "Active" | "Paused" | "Suspended" | "Cancelled" | "Pending";
  households?: number;
  bins: number;
  access: string;
  since: string;
  routeId: string;
  ext: string;
}

const ACCESS = [
  "Bin at the gate by 06:30. Blue gate, opposite the estate clinic.",
  "Security post at the entrance, give the Slate job number.",
  "Dog in the compound. Bin is left outside the gate.",
  "Narrow street, reverse in from the junction.",
  "Two bins. Second bin behind the generator house.",
  "Gate opens at 07:00. Call via Slate if closed.",
  "Bin by the transformer at the corner plot.",
];
const ESTATE_ACCESS = "Central collection point by the main gate. Estate security signs the job sheet.";

const frequencyFor = (plan: string, type: CustomerType) =>
  type === "Estate"
    ? { frequency: "Three times weekly", days: "Mon, Wed & Fri" }
    : plan === "Slate Home Lite"
      ? { frequency: "Weekly", days: "Mon" }
      : { frequency: "Twice weekly", days: "Mon & Thu" };

const extFor = (id: string) => String(4000 + (parseInt(id.replace(/\D/g, ""), 10) % 6000));

const baseCustomers: OpsCustomer[] = sharedCustomers
  .filter((c) => c.operatorId === OP_ID)
  .map((c) => ({
    id: c.id, name: c.name, type: c.type, address: c.address, area: c.area, plan: c.plan,
    ...frequencyFor(c.plan, c.type),
    window: c.type === "Estate" ? "06:00–10:00" : "07:00–09:00",
    status: c.status, households: c.type === "Estate" ? c.sites : undefined, bins: c.type === "Estate" ? Math.round((c.sites ?? 120) / 18) : 1,
    access: c.id === "cus-0001" ? "Opposite the estate clinic, blue gate. Bin out by 07:00." : c.type === "Estate" ? ESTATE_ACCESS : pick(ACCESS),
    since: c.joined, routeId: routeForArea(c.area, c.type).id, ext: extFor(c.id),
  }));

const STREET_FOR: Record<string, (n: number) => string> = {
  "Ewet Housing Estate": (n) => `House ${n}, Block ${pick(["A", "B", "C", "E", "F"])}, Ewet Housing Estate`,
  "Udo Udoma Avenue": (n) => `${n} Udo Udoma Avenue`,
  "Wellington Bassey Way": (n) => `${n} Wellington Bassey Way`,
  "Aka Road": (n) => `${n} Aka Road`,
  "Shelter Afrique Estate": (n) => `Plot ${n}, Shelter Afrique Estate`,
  "Nwaniba Road": (n) => `${n} Nwaniba Road`,
  "Ikot Ekpene Road": (n) => `${n} Ikot Ekpene Road`,
  "Osongama Estate": (n) => `${n} Osongama Estate Phase ${pick(["1", "2"])}`,
  Itam: (n) => `${n} Itam Industrial Layout`,
  "Use Offot": (n) => `${n} Use Offot Road`,
  "Abak Road": (n) => `${n} Abak Road`,
  "Oron Road": (n) => `${n} Oron Road`,
};

let gen = 0;
function genHousehold(route: OpsRoute): OpsCustomer {
  gen++;
  const area = route.areas[Math.min(route.areas.length - 1, Math.floor(rnd() * rnd() * route.areas.length * 1.4))] ?? route.areas[0]!;
  const plan = pick(["Slate Home", "Slate Home", "Slate Home", "Slate Home Lite"]);
  const id = `cus-u${String(gen).padStart(3, "0")}`;
  return {
    id, name: `${pick(FIRST)} ${pick(LAST)}`, type: "Household", address: `${STREET_FOR[area]!(between(2, 96))}, Uyo`, area, plan,
    ...frequencyFor(plan, "Household"), window: "07:00–09:00", status: "Active", bins: rnd() > 0.8 ? 2 : 1,
    access: pick(ACCESS), since: at(-between(20, 190)), routeId: route.id, ext: extFor(id),
  };
}

const ESTATE_POINTS = ["Main gate", "Block C car park", "Phase 2 roundabout", "Back gate", "Block F", "Clubhouse"];
function genEstatePoint(estate: OpsCustomer, n: number): OpsCustomer {
  return { ...estate, address: `${ESTATE_POINTS[n % ESTATE_POINTS.length]} collection point · ${estate.address}` };
}

/* ---------- today's routes ---------- */
const WINDOWS_BY_POS = (i: number, size: number) => (i < size * 0.32 ? "06:00–08:00" : i < size * 0.68 ? "07:00–09:00" : "08:00–10:00");
const sharedUfok = (() => {
  const seen = new Set<string>();
  return sharedPickups.filter((p) => {
    if (p.operatorId !== OP_ID || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
})();
const customerById = (id: string) => baseCustomers.find((c) => c.id === id);

const extraCustomers: OpsCustomer[] = [];
const todayJobs: Job[] = [];
const cancelledToday: Job[] = [];
let genJobId = 9104;

const sharedToday = sharedUfok.filter((p) => isToday(p.date) && p.id !== "PU-26-08813");
for (const p of sharedToday) {
  const c = customerById(p.customerId);
  if (p.status === "Cancelled" || !c || c.status !== "Active") {
    const r = routeForArea(p.area, p.customerType);
    cancelledToday.push({
      id: p.id, customerId: p.customerId, customerName: p.customerName, customerType: p.customerType, address: p.address, area: p.area,
      service: p.service, date: at(0, windowStart(p.window).h), window: p.window, status: "Cancelled", driver: r.driver, vehicle: r.vehicle,
      cancelReason: c?.status === "Paused" ? "Service paused by customer" : c?.status === "Suspended" ? "Customer suspended by Slate (payment)" : c?.status === "Pending" ? "Customer not yet active" : "Customer cancelled their plan",
      bins: p.bins ?? 1, households: c?.households,
    });
  }
}
const liveShared = sharedToday.filter((p) => !cancelledToday.some((j) => j.id === p.id));

for (const route of ROUTES) {
  const pool = liveShared.filter((p) => routeForArea(p.area, p.customerType).id === route.id);
  const slots: Array<{ c: OpsCustomer; id: string; service: string }> = [];
  if (route.id === "r-estates") {
    const estates = baseCustomers.filter((c) => c.type === "Estate" && c.status === "Active");
    let n = 0;
    for (const p of pool) slots.push({ c: customerById(p.customerId)!, id: p.id, service: p.service });
    while (slots.length < route.size) {
      const e = estates[n % estates.length]!;
      slots.push({ c: genEstatePoint(e, n + 1), id: `PU-26-0${genJobId++}`, service: "Estate Waste Management" });
      n++;
    }
  } else {
    const target = route.size - pool.length - (route.id === "r-ewet" ? 1 : 0);
    while (slots.length < target) {
      const c = genHousehold(route);
      extraCustomers.push(c);
      slots.push({ c, id: `PU-26-0${genJobId++}`, service: c.plan });
    }
    // Interleave the shared pickups through the route
    pool.forEach((p, k) => {
      const pos = Math.min(slots.length, Math.round(((k + 1) / (pool.length + 1)) * slots.length) + (k % 2 ? 1 : -1));
      slots.splice(Math.max(0, pos), 0, { c: customerById(p.customerId)!, id: p.id, service: p.service });
    });
  }
  if (route.id === "r-ewet") {
    const me = sharedUfok.find((p) => p.id === "PU-26-08813")!;
    slots.splice(18, 0, { c: customerById(me.customerId)!, id: me.id, service: me.service });
  }
  const span = (new Date(at(0, 8, 9)).getTime() - new Date(route.startedAt).getTime()) / Math.max(1, route.attempted);
  slots.slice(0, route.size).forEach(({ c, id, service }, i) => {
    const failed = route.failedAt.find((f) => f.index === i);
    const doneAt = new Date(new Date(route.startedAt).getTime() + span * (i + 0.8)).toISOString();
    let status: JobStatus = "Scheduled";
    if (i < route.attempted) status = failed ? "Failed" : "Completed";
    else if (i === route.attempted) status = route.current;
    else if (route.id === "r-ewet" && i === route.attempted + 1) status = "En route";
    const window = id === "PU-26-08813" ? "07:00–09:00" : WINDOWS_BY_POS(i, route.size);
    todayJobs.push({
      id, customerId: c.id, customerName: c.name, customerType: c.type, address: c.address, area: c.area, service,
      date: at(0, windowStart(window).h), window, status, driver: route.driver, vehicle: route.vehicle, routeId: route.id, stop: i + 1,
      startedAt: status !== "Scheduled" ? doneAt : undefined,
      arrivedAt: status === "Completed" || status === "Failed" || status === "Arrived" ? doneAt : undefined,
      completedAt: status === "Completed" ? new Date(new Date(doneAt).getTime() + 4 * 60000).toISOString() : undefined,
      failedAt: status === "Failed" ? new Date(new Date(doneAt).getTime() + 6 * 60000).toISOString() : undefined,
      failReason: failed?.reason,
      photos: status === "Completed" ? 1 : status === "Failed" ? 2 : undefined,
      bins: c.bins, households: c.households, access: c.access,
      note: failed?.reason === "Gate locked" ? "Security said the residents travelled. Retry after 14:00." : failed?.reason === "Bin not out" ? "No bin at the gate. Neighbour says they leave at 06:00." : undefined,
    });
  });
}

/* ---------- history and upcoming (from shared pickups) ---------- */
const otherDays: Job[] = sharedUfok
  .filter((p) => !isToday(p.date))
  .map((p) => {
    const c = customerById(p.customerId);
    const r = routeForArea(p.area, p.customerType);
    const offset = Math.round((new Date(dayKey(p.date)).getTime() - new Date(dayKey(at(0))).getTime()) / 86400000);
    const { h } = windowStart(p.window);
    const status: JobStatus = p.status === "Completed" || p.status === "Late" ? "Completed" : p.status === "Missed" || p.status === "Failed" ? "Failed" : p.status === "Cancelled" ? "Cancelled" : "Scheduled";
    const done = at(offset, h, between(12, 58) + (p.window.startsWith("06") ? 30 : 0));
    const isMine = p.customerId === "cus-0001";
    return {
      id: p.id, customerId: p.customerId, customerName: p.customerName, customerType: p.customerType, address: p.address, area: p.area,
      service: p.service, date: at(offset, h), window: p.window, status,
      driver: isMine && p.driver ? p.driver : r.driver, vehicle: isMine && p.vehicle ? p.vehicle : r.vehicle, routeId: r.id,
      startedAt: status === "Completed" || status === "Failed" ? done : undefined,
      arrivedAt: status === "Completed" || status === "Failed" ? done : undefined,
      completedAt: status === "Completed" ? (isMine && p.completedAt ? p.completedAt : done) : undefined,
      failedAt: status === "Failed" ? done : undefined,
      failReason: p.status === "Missed" ? "Missed, recovered next day" : status === "Failed" ? "Access blocked" : undefined,
      cancelReason: status === "Cancelled" ? (p.note ?? (c?.status === "Cancelled" ? "Customer cancelled their plan" : c?.status === "Paused" ? "Service paused by customer" : "Rescheduled by Slate")) : undefined,
      photos: status === "Completed" ? 1 : undefined,
      bins: p.bins ?? 1, households: c?.households, access: c?.access, note: status === "Cancelled" ? undefined : p.note,
    } satisfies Job;
  });

/** 14 jobs transferred from Nwaniba Clean Crew for Tuesday (operatorNotifications on1), not yet assigned. */
const blockD: Job[] = Array.from({ length: 14 }, (_, i) => {
  const id = `cus-sd${String(i + 1).padStart(2, "0")}`;
  const c: OpsCustomer = {
    id, name: `${pick(FIRST)} ${pick(LAST)}`, type: "Household", address: `D${i + 1}, Block D, Shelter Afrique Estate, Uyo`, area: "Shelter Afrique Estate",
    plan: "Slate Home", frequency: "Twice weekly", days: "Tue & Fri", window: "07:00–09:00", status: "Active", bins: 1,
    access: "Block D gate is opened by the estate security at 06:45.", since: at(-1), routeId: "r-shelter", ext: extFor(`9${i}`),
  };
  extraCustomers.push(c);
  return {
    id: `PU-26-0${9300 + i * 2}`, customerId: id, customerName: c.name, customerType: "Household", address: c.address, area: c.area, service: "Slate Home",
    date: at(1, 7), window: "07:00–09:00", status: "Scheduled", driver: "", vehicle: "", bins: 1, access: c.access,
    note: "Transferred from Nwaniba Clean Crew",
  } satisfies Job;
});

export const JOBS: Job[] = [...todayJobs, ...cancelledToday, ...otherDays, ...blockD].sort((a, b) => a.date.localeCompare(b.date) || (a.stop ?? 0) - (b.stop ?? 0));
export const OPS_CUSTOMERS: OpsCustomer[] = [...baseCustomers, ...extraCustomers];

/* ---------- fleet ---------- */
export interface OpsVehicle extends Vehicle {
  roadworthiness: string;
  insurance: string;
  licence: string;
  nextInspection: string;
  routeId?: string;
}
const addMonths = (iso: string, m: number) => {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + m);
  return d.toISOString().slice(0, 10);
};
export const OPS_VEHICLES: OpsVehicle[] = sharedVehicles.map((v) => ({
  ...v,
  roadworthiness: v.registration === "AKS 588 KJ" ? "2026-10-19" : v.registration === "AKS 415 BD" ? "2025-12-11" : addMonths(v.inspection, 12),
  insurance: v.registration === "AKS 415 BD" ? "2026-02-28" : "2027-02-28",
  licence: v.registration === "AKS 415 BD" ? "2026-01-14" : addMonths(v.inspection, 14),
  nextInspection: addMonths(v.inspection, 6),
  routeId: ROUTES.find((r) => r.vehicle === v.registration)?.id,
}));

export interface OpsDriver extends Driver {
  licenceNo: string;
  licenceExpiry: string;
  since: string;
}
export const OPS_DRIVERS: OpsDriver[] = sharedDrivers.map((d, i) => ({
  ...d,
  jobsToday: todayJobs.filter((j) => j.driver === d.name).length,
  licenceNo: `AKW${["78213", "64107", "90552", "11846", "53390", "27761"][i]}AA${10 + i * 7}`,
  licenceExpiry: d.verification === "Expired" ? "2026-09-30" : d.verification === "Pending" ? "2029-10-01" : ["2028-03-14", "2027-06-02", "2028-11-20", "", "2027-01-09"][i] || "2028-01-01",
  since: ["2026-03-02", "2026-03-02", "2026-03-16", "2026-09-30", "2026-04-01", "2026-03-02"][i]!,
}));

/* ---------- team ---------- */
export type TeamRole = "Owner" | "Admin" | "Dispatcher" | "Driver" | "Finance" | "Viewer";
export const TEAM_ROLES: TeamRole[] = ["Owner", "Admin", "Dispatcher", "Driver", "Finance", "Viewer"];
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: TeamRole;
  status: "Active" | "Invited" | "Suspended";
  lastActive: string;
  you?: boolean;
}
export const TEAM: TeamMember[] = [
  { id: "t1", name: "Effiong Ufok", email: "effiong@ufokenv.ng", phone: "+234 803 220 4518", role: "Owner", status: "Active", lastActive: at(-1, 19, 12) },
  { id: "t2", name: "Edidiong Johnson", email: "edidiong@ufokenv.ng", phone: "+234 803 412 7765", role: "Admin", status: "Active", lastActive: at(0, 8, 11), you: true },
  { id: "t3", name: "Iniobong Etuk", email: "dispatch@ufokenv.ng", phone: "+234 816 330 9021", role: "Dispatcher", status: "Active", lastActive: at(0, 8, 2) },
  { id: "t4", name: "Mbuotidem Akpan", email: "mbuotidem@ufokenv.ng", phone: "+234 909 412 6630", role: "Dispatcher", status: "Active", lastActive: at(0, 6, 48) },
  { id: "t5", name: "Ekaette Obot", email: "accounts@ufokenv.ng", phone: "+234 802 551 7314", role: "Finance", status: "Active", lastActive: at(-2, 15, 30) },
  ...OPS_DRIVERS.filter((d) => d.status !== "Suspended").slice(0, 4).map((d, i): TeamMember => ({
    id: `t${6 + i}`, name: d.name, email: `${d.name.split(" ")[0]!.toLowerCase()}.driver@ufokenv.ng`, phone: d.phone, role: "Driver", status: "Active", lastActive: at(0, 8, 9 - i * 2),
  })),
  { id: "t10", name: "Ubong Essien", email: "ubong.essien@gmail.com", phone: "+234 805 117 0042", role: "Viewer", status: "Active", lastActive: at(-9, 10, 0) },
  { id: "t11", name: "Okon Essien", email: "okon.driver@ufokenv.ng", phone: "+234 909 220 6643", role: "Driver", status: "Invited", lastActive: at(-5, 9, 0) },
];

export const PERMISSIONS: Array<{ label: string; roles: TeamRole[] }> = [
  { label: "See today's jobs and routes", roles: ["Owner", "Admin", "Dispatcher", "Driver", "Viewer"] },
  { label: "Update job status and add evidence", roles: ["Owner", "Admin", "Dispatcher", "Driver"] },
  { label: "Assign jobs, reorder routes", roles: ["Owner", "Admin", "Dispatcher"] },
  { label: "Manage vehicles and drivers", roles: ["Owner", "Admin"] },
  { label: "See payouts, invoices and deductions", roles: ["Owner", "Admin", "Finance"] },
  { label: "Change payout bank account", roles: ["Owner"] },
  { label: "Accept contracts from Slate", roles: ["Owner"] },
  { label: "Invite and remove team members", roles: ["Owner", "Admin"] },
];

export const ROLE_SUMMARY: Record<TeamRole, string> = {
  Owner: "Everything, including the payout account and contract acceptance.",
  Admin: "Runs operations: fleet, team, jobs and routes. Cannot change the payout account.",
  Dispatcher: "Plans the day: assigns jobs, reorders routes, follows up failed stops.",
  Driver: "Sees their own route and updates stops from the truck.",
  Finance: "Payouts, invoices and deductions. No job or fleet access.",
  Viewer: "Read-only view of today, performance and payouts.",
};

/* ---------- schedule (calendar) ---------- */
export interface ScheduleBlock {
  id: string;
  label: string;
  type: "Household" | "Estate" | "Recycling" | "Bulk";
  areas: string[];
  stops: number;
  window: string;
  vehicle: string;
  /** weekday numbers, 0 = Sunday */
  days?: number[];
  /** explicit dates (yyyy-mm-dd) */
  dates?: string[];
  from?: string;
}
export const SCHEDULE: ScheduleBlock[] = [
  { id: "s-hh-mon", label: "Households, Ewet & Udo Udoma", type: "Household", areas: ROUTES[0]!.areas, stops: 38, window: "06:00–10:00", vehicle: "AKS 214 XA", days: [1] },
  { id: "s-hh-thu", label: "Households, Ewet & Udo Udoma", type: "Household", areas: ROUTES[0]!.areas, stops: 31, window: "06:00–10:00", vehicle: "AKS 214 XA", days: [4] },
  { id: "s-sh-mon", label: "Households, Shelter Afrique & Nwaniba", type: "Household", areas: ROUTES[1]!.areas, stops: 34, window: "06:00–10:00", vehicle: "AKS 588 KJ", days: [1] },
  { id: "s-sh-thu", label: "Households, Shelter Afrique & Nwaniba", type: "Household", areas: ROUTES[1]!.areas, stops: 27, window: "06:00–10:00", vehicle: "AKS 588 KJ", days: [4] },
  { id: "s-os-mon", label: "Households, Osongama & Itam", type: "Household", areas: ROUTES[2]!.areas, stops: 29, window: "06:00–10:00", vehicle: "AKS 902 QE", days: [1] },
  { id: "s-os-thu", label: "Households, Osongama & Itam", type: "Household", areas: ROUTES[2]!.areas, stops: 24, window: "06:00–10:00", vehicle: "AKS 902 QE", days: [4] },
  { id: "s-est", label: "Estate collection points", type: "Estate", areas: ["Osongama Estate", "Shelter Afrique Estate", "Ewet Housing Estate"], stops: 21, window: "06:00–10:00", vehicle: "UYO 903 BG", days: [1, 3, 5] },
  { id: "s-blockd", label: "Shelter Afrique Block D (transferred)", type: "Household", areas: ["Shelter Afrique Estate"], stops: 14, window: "07:00–09:00", vehicle: "Unassigned", days: [2, 5], from: "2026-10-06" },
  { id: "s-garden", label: "Garden waste and bulk requests", type: "Bulk", areas: ["Ewet Housing Estate", "Osongama Estate"], stops: 6, window: "09:00–13:00", vehicle: "AKS 330 FG", days: [6] },
  { id: "s-recy", label: "Recyclables, Ewet & Osongama", type: "Recycling", areas: ["Ewet Housing Estate", "Osongama Estate"], stops: 64, window: "14:00–16:00", vehicle: "UYO 903 BG", dates: ["2026-09-08", "2026-10-13", "2026-11-10", "2026-12-08"] },
];

export const HOLIDAYS: Record<string, string> = {
  "2026-10-01": "Independence Day",
  "2026-12-25": "Christmas Day",
  "2026-12-26": "Boxing Day",
  "2027-01-01": "New Year's Day",
  "2026-08-26": "Id el Maulud",
};

export function blocksOn(date: Date): ScheduleBlock[] {
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  if (HOLIDAYS[key]) return [];
  return SCHEDULE.filter((b) => (b.dates ? b.dates.includes(key) : b.days!.includes(date.getDay())) && (!b.from || key >= b.from));
}

/* ---------- SLA warnings for "Today" ---------- */
export const SLA_NOTES = operatorNotifications.filter((n) => n.category === "Service" || n.category === "System" || n.category === "Operator");

/* ---------- payout account (masked) ---------- */
export const PAYOUT_ACCOUNT = { bank: "Zenith Bank", last4: "4417", name: "UFOK ENVIRONMENTAL SERVICES LTD", verified: "2026-03-04" };
export const SLATE_RELAY = "+234 201 330 4400";
