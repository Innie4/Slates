/**
 * Slate demo data, a believable Uyo world shared by every portal.
 * Deterministic: the same seed always produces the same records.
 * The demo clock is Monday 5 October 2026, 08:12 WAT (see DEMO_NOW).
 */
import type {
  AuditEntry, Chargeback, City, CommunityProject, Complaint, Contract, Customer, CustomerType, DocumentItem, Driver,
  Invoice, NotificationItem, Operator, Partner, Payment, Payout, Pickup, PickupStatus, RecyclingPartner, Review,
  Service, SmartSweepPlan, Ticket, Vehicle,
} from "./types";

export * from "./types";

/* ---------- seeded helpers ---------- */
let seed = 20261005;
const rnd = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)]!;
const between = (a: number, b: number) => Math.round(a + rnd() * (b - a));
const pad = (n: number, w = 5) => String(n).padStart(w, "0");
const day = (offset: number, hh = 8, mm = 0) => {
  const d = new Date("2026-10-05T00:00:00+01:00");
  d.setDate(d.getDate() + offset);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
};
const code = (n: number) => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < n; i++) s += chars[Math.floor(rnd() * chars.length)];
  return s;
};

/* ---------- reference lists ---------- */
export const FIRST = ["Aniekan", "Imaobong", "Uduak", "Ekemini", "Nsikak", "Idara", "Edidiong", "Mfon", "Ini", "Ubong", "Itoro", "Emem", "Utibe", "Kufre", "Enobong", "Iniobong", "Ofonime", "Nkoyo", "Akpan", "Ekaette", "Mbuotidem", "Inemesit", "Abasiama", "Unwana", "Chidinma", "Tunde", "Ngozi", "Ifeoma", "Bassey", "Etimbuk"];
export const LAST = ["Etim", "Akpan", "Essien", "Udo", "Okon", "Umoh", "Johnson", "Bassey", "Ekanem", "Inyang", "Ukpong", "Ekpo", "Udoh", "Archibong", "Effiong", "Edet", "Obot", "Ita", "Ntuk", "Asuquo", "Eyo", "Offiong", "Nkanga", "Okafor", "Adeyemi"];
export const AREAS = ["Ewet Housing Estate", "Shelter Afrique Estate", "Osongama Estate", "Aka Road", "Oron Road", "Ikot Ekpene Road", "Nwaniba Road", "Udo Udoma Avenue", "Wellington Bassey Way", "Abak Road", "Itam", "Use Offot"];
export const STREETS = ["Aka Road", "Oron Road", "Ikot Ekpene Road", "Nwaniba Road", "Udo Udoma Avenue", "Wellington Bassey Way", "Abak Road", "Use Offot Road", "Atiku Abubakar Way", "Edet Akpan Avenue", "Gibbs Street", "Ikpa Road", "Barracks Road", "Udo Umana Street"];
const BUSINESSES = ["Afang House Restaurant", "Ibom Plaza Supermarket", "Nkoyo's Kitchen", "Le Meridien Uyo Suites", "Itam Cold Rooms", "Brightway Pharmacy", "Ewet Diagnostics", "Mkpok Bakery", "Urban Cuts Salon", "Akwa Fresh Market Stall 14", "Unity Hotel Uyo", "Grand Atlantic Lounge", "Edet & Sons Hardware", "Uyo Cineplex", "Royal Palm Events Centre"];
const INSTITUTIONS = ["Ikpa Hills University", "Uyo Model Secondary School", "St. Brendan's Hospital", "Ministry of Works Annex", "Christ the King Parish", "Federal Polytechnic Annex", "Ibom Science Academy"];
const ESTATES = ["Shelter Afrique Estate", "Ewet Housing Estate", "Osongama Estate Phase 2", "Federal Housing Estate", "Ikot Ekpene Road Gardens", "Nwaniba Court"];

const personName = () => `${pick(FIRST)} ${pick(LAST)}`;

/* ---------- operators ---------- */
export const operators: Operator[] = [
  { id: "op-ufok", name: "Ufok Environmental Services Ltd", short: "Ufok Environmental", focus: "Residential estates", city: "Uyo", areas: ["Ewet Housing Estate", "Shelter Afrique Estate", "Osongama Estate"], wasteTypes: ["General household", "Recyclables", "Garden waste"], vehicles: 9, staff: 46, capacity: 2400, assigned: 1912, status: "Active", score: 94, completion: 98.1, missed30d: 11, complaints30d: 7, rating: 4.7, responseMins: 48, contact: "Edidiong Johnson", phone: "+234 803 412 7765", email: "ops@ufokenv.ng", joined: "2026-03-02", docsExpiring: 1, payoutMonthly: 9_418_500, rc: "RC 1482207" },
  { id: "op-atlantic", name: "Atlantic Coast Sanitation", short: "Atlantic Coast", focus: "Commercial customers", city: "Uyo", areas: ["Aka Road", "Oron Road", "Udo Udoma Avenue", "Wellington Bassey Way"], wasteTypes: ["Commercial general", "Food waste", "Cardboard", "Glass"], vehicles: 6, staff: 31, capacity: 420, assigned: 318, status: "Active", score: 88, completion: 96.4, missed30d: 9, complaints30d: 6, rating: 4.4, responseMins: 62, contact: "Kufre Inyang", phone: "+234 806 220 1934", email: "dispatch@atlanticsanitation.ng", joined: "2026-03-19", docsExpiring: 0, payoutMonthly: 6_871_000, rc: "RC 1190334" },
  { id: "op-ibom", name: "Ibom Hauliers & Waste Co.", short: "Ibom Hauliers", focus: "Industrial & institutional", city: "Uyo", areas: ["Itam", "Abak Road", "Use Offot"], wasteTypes: ["Industrial", "Construction debris", "Bulk items", "Medical (non-hazardous)"], vehicles: 5, staff: 22, capacity: 140, assigned: 96, status: "Active", score: 81, completion: 93.7, missed30d: 6, complaints30d: 4, rating: 4.1, responseMins: 95, contact: "Ofonime Ekpo", phone: "+234 802 918 4420", email: "info@ibomhauliers.com", joined: "2026-04-07", docsExpiring: 2, payoutMonthly: 4_206_000, rc: "RC 905118" },
  { id: "op-nwaniba", name: "Nwaniba Clean Crew", short: "Nwaniba Clean Crew", focus: "Overflow & emergency", city: "Uyo", areas: ["Nwaniba Road", "Ikot Ekpene Road", "Aka Road"], wasteTypes: ["General household", "Bulk items", "Event waste"], vehicles: 3, staff: 14, capacity: 380, assigned: 151, status: "Active", score: 76, completion: 91.2, missed30d: 8, complaints30d: 5, rating: 3.9, responseMins: 71, contact: "Itoro Ukpong", phone: "+234 813 604 2281", email: "nwanibacrew@gmail.com", joined: "2026-05-11", docsExpiring: 0, payoutMonthly: 1_384_500, rc: "BN 3318840" },
  { id: "op-esuk", name: "Esuk Waste Logistics", short: "Esuk Logistics", focus: "Commercial & bulk", city: "Uyo", areas: ["Oron Road", "Itam"], wasteTypes: ["Commercial general", "Bulk items"], vehicles: 4, staff: 18, capacity: 260, assigned: 0, status: "Under review", score: 0, completion: 0, missed30d: 0, complaints30d: 0, rating: 0, responseMins: 0, contact: "Enobong Asuquo", phone: "+234 816 774 0912", email: "hello@esuklogistics.ng", joined: "2026-09-21", docsExpiring: 0, payoutMonthly: 0, rc: "RC 1730061" },
  { id: "op-mkpok", name: "Mkpok Environmental", short: "Mkpok Environmental", focus: "Residential", city: "Uyo", areas: ["Use Offot", "Abak Road"], wasteTypes: ["General household", "Recyclables"], vehicles: 2, staff: 9, capacity: 600, assigned: 0, status: "More information required", score: 0, completion: 0, missed30d: 0, complaints30d: 0, rating: 0, responseMins: 0, contact: "Abasiama Eyo", phone: "+234 909 115 3360", email: "mkpokenv@yahoo.com", joined: "2026-09-28", docsExpiring: 0, payoutMonthly: 0, rc: "BN 3402157" },
  { id: "op-portside", name: "Portside Waste Partners", short: "Portside", focus: "Commercial", city: "Port Harcourt", areas: ["GRA Phase 2", "Trans-Amadi"], wasteTypes: ["Commercial general", "Industrial"], vehicles: 11, staff: 54, capacity: 900, assigned: 0, status: "Submitted", score: 0, completion: 0, missed30d: 0, complaints30d: 0, rating: 0, responseMins: 0, contact: "Ngozi Okafor", phone: "+234 805 330 7719", email: "bd@portsidewaste.com", joined: "2026-10-02", docsExpiring: 0, payoutMonthly: 0, rc: "RC 822914" },
  { id: "op-obio", name: "Obio Sanitation Services", short: "Obio Sanitation", focus: "Residential", city: "Uyo", areas: ["Ikot Ekpene Road"], wasteTypes: ["General household"], vehicles: 2, staff: 8, capacity: 300, assigned: 0, status: "Suspended", score: 58, completion: 79.4, missed30d: 23, complaints30d: 17, rating: 3.1, responseMins: 210, contact: "Ubong Ntuk", phone: "+234 807 551 9023", email: "obiosanitation@gmail.com", joined: "2026-03-30", docsExpiring: 3, payoutMonthly: 0, rc: "BN 2981104" },
  { id: "op-ekim", name: "Ekim Collections", short: "Ekim Collections", focus: "Residential", city: "Uyo", areas: ["Osongama Estate"], wasteTypes: ["General household"], vehicles: 1, staff: 4, capacity: 120, assigned: 0, status: "Rejected", score: 0, completion: 0, missed30d: 0, complaints30d: 0, rating: 0, responseMins: 0, contact: "Etimbuk Edet", phone: "+234 810 448 2290", email: "ekimcollect@gmail.com", joined: "2026-08-14", docsExpiring: 0, payoutMonthly: 0, rc: "Not set" },
];
export const activeOperators = operators.filter((o) => o.status === "Active");
export const operatorById = (id: string) => operators.find((o) => o.id === id);

/* ---------- services catalog ---------- */
export const services: Service[] = [
  { id: "svc-home-weekly", slug: "slate-home", name: "Slate Home", category: "Household Waste", short: "Scheduled household collection, twice a week.", description: "Your household waste collected on fixed days, in a fixed window, by a verified Slate operator. One monthly payment. If a pickup is missed, Slate sends a crew within 24 hours.", included: ["Two collections a week", "One 240-litre Slate bin", "Pickup reminders by SMS and app", "Missed-pickup recovery within 24 hours", "Digital receipts and service history"], frequency: "Twice weekly", frequencies: ["Weekly", "Twice weekly", "Three times weekly"], priceFrom: 7000, priceUnit: "/month", eligible: ["Household"], wasteTypes: ["General household", "Garden waste"], requirements: ["Address within a Slate service area", "Bin placed at the gate by 7:00"], availability: "Available", pricingModel: "Monthly subscription" },
  { id: "svc-home-lite", slug: "slate-home-lite", name: "Slate Home Lite", category: "Household Waste", short: "Weekly collection for smaller homes.", description: "One collection a week for flats and smaller households.", included: ["One collection a week", "Pickup reminders", "Missed-pickup recovery within 24 hours"], frequency: "Weekly", frequencies: ["Weekly"], priceFrom: 4500, priceUnit: "/month", eligible: ["Household"], wasteTypes: ["General household"], requirements: ["Address within a Slate service area"], availability: "Available", pricingModel: "Monthly subscription" },
  { id: "svc-commercial", slug: "commercial-waste", name: "Commercial Collection", category: "Commercial Waste", short: "Daily or custom collection for shops, restaurants and offices.", description: "Custom collection frequency for businesses, with food-waste handling, cardboard separation and a monthly service report.", included: ["Custom frequency up to daily", "Food-waste handling", "Cardboard separation", "Monthly service report", "Dedicated account contact"], frequency: "Custom", frequencies: ["Three times weekly", "Daily", "Twice daily"], priceFrom: 30000, priceUnit: "/month", eligible: ["Business"], wasteTypes: ["Commercial general", "Food waste", "Cardboard", "Glass"], requirements: ["Accessible bin area for a 7-tonne truck", "Site walk-through before start"], availability: "Available", pricingModel: "Monthly subscription" },
  { id: "svc-estate", slug: "estate-waste-management", name: "Estate Waste Management", category: "Estate Waste Management", short: "One contract, one report, every household in your estate.", description: "Slate manages collection and resident payments for the whole estate. Estate managers get one bill, one report and one number to call.", included: ["Estate-wide collection schedule", "Resident payment collection", "Monthly estate report", "Complaint handling for residents", "Operator replacement if service fails"], frequency: "Twice weekly", frequencies: ["Twice weekly", "Three times weekly"], priceFrom: 6500, priceUnit: "/household/month", eligible: ["Estate"], wasteTypes: ["General household", "Recyclables", "Garden waste"], requirements: ["Estate association agreement", "Central collection points"], availability: "Available", pricingModel: "Per household" },
  { id: "svc-institution", slug: "institutional-waste", name: "Institutional Service", category: "Institutional Waste", short: "Multi-site collection for schools, hospitals and agencies.", description: "Collection across facilities and departments with compliance documentation and procurement-ready contracts.", included: ["Facility-level schedules", "Compliance documents", "Procurement-ready contract", "Quarterly review"], frequency: "Custom", frequencies: ["Daily", "Three times weekly", "Weekly"], priceFrom: 180000, priceUnit: "/month", eligible: ["Institution"], wasteTypes: ["General", "Food waste", "Paper", "Medical (non-hazardous)"], requirements: ["Facility survey", "Procurement documentation"], availability: "Available", pricingModel: "Quote" },
  { id: "svc-bulk", slug: "bulk-waste", name: "Bulk Waste Pickup", category: "Bulk Waste", short: "Furniture, appliances and moving waste, collected once.", description: "Send photos, get a quote within 2 working hours, choose a day. For furniture, appliances, moving waste and large household items.", included: ["Quote from photos", "Two-person crew", "Loading included"], frequency: "One-time", frequencies: ["One-time"], priceFrom: 15000, priceUnit: "/pickup", eligible: ["Household", "Business", "Estate", "Institution"], wasteTypes: ["Furniture", "Appliances", "Moving waste", "Large items"], requirements: ["Photos of the items"], availability: "Available", pricingModel: "Quote" },
  { id: "svc-recycling", slug: "recycling", name: "Recycling Pickup", category: "Recycling", short: "Sorted plastics, cans, paper and e-waste, collected monthly.", description: "Slate routes sorted recyclables to approved recovery partners in Uyo and reports what was recovered.", included: ["Monthly recyclables pickup", "Recovery report", "Sorting guide"], frequency: "Monthly", frequencies: ["Monthly", "Twice monthly"], priceFrom: 1500, priceUnit: "/month", eligible: ["Household", "Business", "Estate", "Institution"], wasteTypes: ["PET plastic", "Aluminium cans", "Paper & cardboard", "E-waste"], requirements: ["Sorted, clean materials"], availability: "Available", pricingModel: "Monthly subscription" },
  { id: "svc-special", slug: "special-collection", name: "Special Collection", category: "Special Collection", short: "Construction debris, garden clearance and difficult waste.", description: "Waste that needs special handling, quoted after a site visit.", included: ["Site assessment", "Specialist operator", "Disposal documentation"], frequency: "One-time", frequencies: ["One-time"], priceFrom: 45000, priceUnit: "/job", eligible: ["Household", "Business", "Institution", "Estate"], wasteTypes: ["Construction debris", "Garden clearance", "Hard-to-handle items"], requirements: ["Site visit"], availability: "Limited", pricingModel: "Quote" },
  { id: "svc-event", slug: "event-cleanup", name: "Event Cleanup", category: "Event Cleanup", short: "Bins before, crew during, clearance after.", description: "For weddings, burials, concerts and conferences. Bins delivered before, a crew on site, full clearance by morning.", included: ["Bin delivery and placement", "On-site crew", "Overnight clearance"], frequency: "One-time", frequencies: ["One-time"], priceFrom: 60000, priceUnit: "/event", eligible: ["Household", "Business", "Institution", "Estate"], wasteTypes: ["Event waste", "Food waste", "Recyclables"], requirements: ["Venue details and guest count"], availability: "Available", pricingModel: "Quote" },
];
export const serviceById = (id: string) => services.find((s) => s.id === id || s.slug === id);

/* ---------- the demo accounts ---------- */
export const me = {
  household: {
    id: "cus-0001", name: "Imaobong Akpan", firstName: "Imaobong", email: "imaobong.akpan@gmail.com", phone: "+234 803 412 0951",
    address: "14 Ewet Housing Estate, Uyo", area: "Ewet Housing Estate", landmark: "Opposite the estate clinic, blue gate",
    plan: "Slate Home", planId: "svc-home-weekly", monthly: 7000, frequency: "Mon & Thu", window: "07:00–09:00",
    operatorId: "op-ufok", card: { brand: "Visa", last4: "4021", exp: "08/28" }, joined: "2026-04-11",
  },
  estate: { name: "Uduak Essien", role: "Estate manager", estate: "Shelter Afrique Estate", households: 312, email: "manager@shelterafriqueuyo.ng" },
  business: { name: "Mfon Bassey", role: "Owner", business: "Afang House Restaurant", locations: 3, email: "mfon@afanghouse.ng" },
  institution: { name: "Dr. Nsikak Okon", role: "Director of Facilities", institution: "Ikpa Hills University", facilities: 7, email: "facilities@ikpahills.edu.ng" },
  operator: { name: "Edidiong Johnson", role: "Operations manager", operatorId: "op-ufok", email: "edidiong@ufokenv.ng" },
  admin: { name: "Idara Umoh", role: "Operations Admin", email: "idara.umoh@slate.ng" },
};

/* ---------- customers ---------- */
const TYPES: CustomerType[] = ["Household", "Household", "Household", "Household", "Business", "Business", "Estate", "Institution"];
export const customers: Customer[] = [
  { id: "cus-0001", name: me.household.name, type: "Household", email: me.household.email, phone: me.household.phone, address: me.household.address, area: "Ewet Housing Estate", city: "Uyo", plan: "Slate Home", monthly: 7000, status: "Active", paymentStatus: "Paid", operatorId: "op-ufok", joined: "2026-04-11" },
  ...Array.from({ length: 63 }, (_, i): Customer => {
    const type = pick(TYPES);
    const name = type === "Household" ? personName() : type === "Business" ? pick(BUSINESSES) : type === "Estate" ? pick(ESTATES) : pick(INSTITUTIONS);
    const area = pick(AREAS);
    const plan = type === "Household" ? pick(["Slate Home", "Slate Home", "Slate Home Lite"]) : type === "Business" ? "Commercial Collection" : type === "Estate" ? "Estate Waste Management" : "Institutional Service";
    const monthly = type === "Household" ? (plan === "Slate Home" ? 7000 : 4500) : type === "Business" ? between(24, 96) * 1000 + pick([0, 500]) : type === "Estate" ? between(120, 340) * 6500 : between(18, 42) * 10000;
    const status = pick(["Active", "Active", "Active", "Active", "Active", "Active", "Paused", "Suspended", "Pending", "Cancelled"] as const);
    const op = type === "Business" ? "op-atlantic" : type === "Institution" ? "op-ibom" : pick(["op-ufok", "op-ufok", "op-nwaniba"]);
    return {
      id: `cus-${pad(i + 2, 4)}`,
      name,
      type,
      email: `${name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "")}@${type === "Household" ? "gmail.com" : "mail.ng"}`,
      phone: `+234 ${pick(["803", "806", "813", "816", "703", "805", "909", "810"])} ${between(100, 999)} ${between(1000, 9999)}`,
      address: `${between(1, 140)} ${type === "Estate" ? area : pick(STREETS)}, Uyo`,
      area, city: "Uyo", plan, monthly, status,
      paymentStatus: status === "Suspended" ? "Failed" : pick(["Paid", "Paid", "Paid", "Paid", "Overdue", "Pending"] as const),
      operatorId: op,
      joined: day(-between(10, 200)),
      sites: type === "Estate" ? between(120, 340) : type === "Business" ? between(1, 4) : type === "Institution" ? between(3, 9) : undefined,
    };
  }),
];

/* ---------- pickups ---------- */
const DRIVERS = ["Emmanuel Udo", "Godwin Etuk", "Samuel Akpan", "Okon Essien", "Daniel Inyang", "Moses Ekpo", "Friday Bassey"];
const VEHICLES = ["AKS 214 XA", "AKS 588 KJ", "UYO 903 BG", "AKS 117 HT", "ABJ 441 TR", "AKS 760 PL"];
const WINDOWS = ["06:00–08:00", "07:00–09:00", "08:00–10:00", "10:00–12:00", "14:00–16:00"];

export const myPickups: Pickup[] = [
  { id: "PU-26-08813", customerId: "cus-0001", customerName: me.household.name, customerType: "Household", address: me.household.address, area: "Ewet Housing Estate", service: "Slate Home", operatorId: "op-ufok", operatorName: "Ufok Environmental", date: day(0, 7), window: "07:00–09:00", status: "En route", driver: "Emmanuel Udo", vehicle: "AKS 214 XA", bins: 1 },
  { id: "PU-26-08851", customerId: "cus-0001", customerName: me.household.name, customerType: "Household", address: me.household.address, area: "Ewet Housing Estate", service: "Slate Home", operatorId: "op-ufok", operatorName: "Ufok Environmental", date: day(3, 7), window: "07:00–09:00", status: "Scheduled", driver: "Emmanuel Udo", vehicle: "AKS 214 XA", bins: 1 },
  { id: "PU-26-08902", customerId: "cus-0001", customerName: me.household.name, customerType: "Household", address: me.household.address, area: "Ewet Housing Estate", service: "Bulk Waste Pickup", operatorId: "op-nwaniba", operatorName: "Nwaniba Clean Crew", date: day(5, 10), window: "10:00–12:00", status: "Scheduled", driver: "Friday Bassey", vehicle: "AKS 760 PL", note: "Old wardrobe and two mattresses" },
  { id: "PU-26-08640", customerId: "cus-0001", customerName: me.household.name, customerType: "Household", address: me.household.address, area: "Ewet Housing Estate", service: "Slate Home", operatorId: "op-ufok", operatorName: "Ufok Environmental", date: day(-7, 7), window: "07:00–09:00", status: "Completed", completedAt: day(-7, 7, 42), driver: "Emmanuel Udo", vehicle: "AKS 214 XA", bins: 1 },
  { id: "PU-26-08512", customerId: "cus-0001", customerName: me.household.name, customerType: "Household", address: me.household.address, area: "Ewet Housing Estate", service: "Slate Home", operatorId: "op-ufok", operatorName: "Ufok Environmental", date: day(-11, 7), window: "07:00–09:00", status: "Missed", driver: "Godwin Etuk", vehicle: "AKS 588 KJ", note: "Recovered next day at 11:20" },
  { id: "PU-26-08519", customerId: "cus-0001", customerName: me.household.name, customerType: "Household", address: me.household.address, area: "Ewet Housing Estate", service: "Slate Home", operatorId: "op-nwaniba", operatorName: "Nwaniba Clean Crew", date: day(-10, 11), window: "10:00–12:00", status: "Completed", completedAt: day(-10, 11, 20), driver: "Friday Bassey", vehicle: "AKS 760 PL", note: "Recovery pickup for PU-26-08512" },
  { id: "PU-26-08377", customerId: "cus-0001", customerName: me.household.name, customerType: "Household", address: me.household.address, area: "Ewet Housing Estate", service: "Slate Home", operatorId: "op-ufok", operatorName: "Ufok Environmental", date: day(-14, 7), window: "07:00–09:00", status: "Completed", completedAt: day(-14, 8, 6), driver: "Emmanuel Udo", vehicle: "AKS 214 XA", bins: 1 },
  { id: "PU-26-08301", customerId: "cus-0001", customerName: me.household.name, customerType: "Household", address: me.household.address, area: "Ewet Housing Estate", service: "Slate Home", operatorId: "op-ufok", operatorName: "Ufok Environmental", date: day(-18, 7), window: "07:00–09:00", status: "Completed", completedAt: day(-18, 7, 31), driver: "Emmanuel Udo", vehicle: "AKS 214 XA", bins: 2 },
  { id: "PU-26-08244", customerId: "cus-0001", customerName: me.household.name, customerType: "Household", address: me.household.address, area: "Ewet Housing Estate", service: "Recycling Pickup", operatorId: "op-ufok", operatorName: "Ufok Environmental", date: day(-13, 14), window: "14:00–16:00", status: "Completed", completedAt: day(-13, 15, 2), driver: "Samuel Akpan", vehicle: "UYO 903 BG" },
  { id: "PU-26-08150", customerId: "cus-0001", customerName: me.household.name, customerType: "Household", address: me.household.address, area: "Ewet Housing Estate", service: "Slate Home", operatorId: "op-ufok", operatorName: "Ufok Environmental", date: day(-4, 7), window: "07:00–09:00", status: "Cancelled", driver: "Emmanuel Udo", vehicle: "AKS 214 XA", note: "Public holiday, Independence Day" },
];

const STATUS_TODAY: PickupStatus[] = ["Completed", "Completed", "Completed", "Completed", "Completed", "In progress", "En route", "Scheduled", "Scheduled", "Scheduled", "Late", "Missed", "Failed"];
export const pickups: Pickup[] = [
  ...myPickups,
  ...Array.from({ length: 140 }, (_, i): Pickup => {
    const c = customers[1 + (i % (customers.length - 1))]!;
    const offset = i < 70 ? 0 : between(-14, 6);
    const op = operatorById(c.operatorId)!;
    let status: PickupStatus = offset < 0 ? pick(["Completed", "Completed", "Completed", "Completed", "Completed", "Completed", "Missed", "Failed", "Cancelled"] as const) : offset > 0 ? "Scheduled" : pick(STATUS_TODAY);
    const hh = between(6, 15);
    if (c.status === "Cancelled") status = "Cancelled";
    return {
      id: `PU-26-${pad(8000 + i * 3 + 1)}`,
      customerId: c.id, customerName: c.name, customerType: c.type, address: c.address, area: c.area,
      service: c.plan, operatorId: op.id, operatorName: op.short,
      date: day(offset, hh), window: pick(WINDOWS), status,
      driver: pick(DRIVERS), vehicle: pick(VEHICLES),
      completedAt: status === "Completed" ? day(offset, hh, between(5, 55)) : undefined,
      bins: between(1, c.type === "Household" ? 2 : 8),
    };
  }),
];
export const todaysPickups = pickups.filter((p) => p.date.slice(0, 10) === day(0).slice(0, 10) && !myPickups.includes(p));
export const pickupById = (id: string) => pickups.find((p) => p.id === id);

/* ---------- payments ---------- */
export const myPayments: Payment[] = [
  { id: "pay-m1", reference: "TXN-7Q4K2M", customerName: me.household.name, customerType: "Household", service: "Slate Home, October", amount: 7000, fee: 105, operatorAllocation: 5500, slateRevenue: 1395, date: day(-4, 6, 2), method: "Visa •• 4021", processor: "Paystack", status: "Successful", attempts: 1 },
  { id: "pay-m2", reference: "TXN-6HZ8RV", customerName: me.household.name, customerType: "Household", service: "Ewet borehole repair, contribution", amount: 2500, fee: 38, operatorAllocation: 0, slateRevenue: 0, date: day(-9, 19, 44), method: "Visa •• 4021", processor: "Paystack", status: "Successful", attempts: 1 },
  { id: "pay-m3", reference: "TXN-5MN3XD", customerName: me.household.name, customerType: "Household", service: "Bulk Waste Pickup, deposit", amount: 9000, fee: 135, operatorAllocation: 7200, slateRevenue: 1665, date: day(-1, 21, 10), method: "Visa •• 4021", processor: "Paystack", status: "Pending", attempts: 1 },
  { id: "pay-m4", reference: "TXN-4C9TBA", customerName: me.household.name, customerType: "Household", service: "Slate Home, September", amount: 7000, fee: 105, operatorAllocation: 5500, slateRevenue: 1395, date: day(-34, 6, 1), method: "Verve •• 7735", processor: "Paystack", status: "Failed", attempts: 3 },
  { id: "pay-m5", reference: "TXN-4C9TBB", customerName: me.household.name, customerType: "Household", service: "Slate Home, September", amount: 7000, fee: 105, operatorAllocation: 5500, slateRevenue: 1395, date: day(-33, 12, 30), method: "Visa •• 4021", processor: "Paystack", status: "Successful", attempts: 1 },
  { id: "pay-m6", reference: "TXN-3PQ7LE", customerName: me.household.name, customerType: "Household", service: "Slate Home, August", amount: 7000, fee: 105, operatorAllocation: 5500, slateRevenue: 1395, date: day(-65, 6, 3), method: "Visa •• 4021", processor: "Paystack", status: "Successful", attempts: 1 },
  { id: "pay-m7", reference: "TXN-2WD5KA", customerName: me.household.name, customerType: "Household", service: "Extra pickup, 22 Aug", amount: 3500, fee: 53, operatorAllocation: 2800, slateRevenue: 647, date: day(-44, 15, 18), method: "Visa •• 4021", processor: "Paystack", status: "Refunded", attempts: 1 },
];

export const payments: Payment[] = [
  ...myPayments,
  ...Array.from({ length: 90 }, (_, i): Payment => {
    const c = customers[1 + (i % (customers.length - 1))]!;
    const amount = c.monthly;
    const fee = Math.round(amount * 0.015);
    const opAlloc = Math.round(amount * pick([0.76, 0.78, 0.8, 0.79]));
    return {
      id: `pay-${i}`,
      reference: `TXN-${code(6)}`,
      customerName: c.name, customerType: c.type,
      service: `${c.plan}, ${pick(["October", "October", "September"])}`,
      amount, fee, operatorAllocation: opAlloc, slateRevenue: amount - opAlloc - fee,
      date: day(-between(0, 30), between(5, 22), between(0, 59)),
      method: `${pick(["Visa", "Mastercard", "Verve", "Bank transfer"])} •• ${between(1000, 9999)}`,
      processor: pick(["Paystack", "Paystack", "Flutterwave"] as const),
      status: pick(["Successful", "Successful", "Successful", "Successful", "Successful", "Successful", "Pending", "Failed", "Refunded"] as const),
      attempts: between(1, 3),
    };
  }).sort((a, b) => b.date.localeCompare(a.date)),
];

/* ---------- complaints ---------- */
const ISSUES: Array<[Complaint["category"], string]> = [
  ["Missed pickup", "Bin was not collected on Tuesday morning"],
  ["Missed pickup", "Truck skipped our street entirely"],
  ["Late pickup", "Crew arrived after 2pm, window was 7–9am"],
  ["Spillage", "Waste spilled at the gate during collection"],
  ["Billing", "Charged twice for October"],
  ["Conduct", "Crew member was rude to our security guard"],
  ["Damaged bin", "Bin lid broken after collection"],
  ["Other", "Need collection moved to Saturdays"],
];
export const complaints: Complaint[] = Array.from({ length: 34 }, (_, i): Complaint => {
  const c = customers[1 + ((i * 7) % (customers.length - 1))]!;
  const [category, issue] = pick(ISSUES);
  const created = day(-between(0, 20), between(7, 20), between(0, 59));
  return {
    id: `CMP-${1150 + i}`,
    customerName: c.name, customerType: c.type,
    operatorName: operatorById(c.operatorId)!.short,
    service: c.plan, pickupId: category === "Missed pickup" || category === "Late pickup" ? `PU-26-${pad(8000 + i * 5)}` : undefined,
    issue, category,
    severity: category === "Missed pickup" ? pick(["Medium", "High", "High"] as const) : pick(["Low", "Medium", "Medium", "High", "Critical"] as const),
    status: pick(["New", "Assigned", "Investigating", "Waiting", "Resolved", "Resolved", "Closed", "Escalated"] as const),
    created, slaDue: new Date(new Date(created).getTime() + 24 * 3600_000).toISOString(),
    assignee: pick(["Idara Umoh", "Utibe Ekanem", "Emem Obot", "Unassigned"]),
    evidence: between(0, 3),
  };
}).sort((a, b) => b.created.localeCompare(a.created));

export const myComplaints: Complaint[] = [
  { id: "CMP-1183", customerName: me.household.name, customerType: "Household", operatorName: "Ufok Environmental", service: "Slate Home", pickupId: "PU-26-08512", issue: "Bin was not collected on Thursday morning", category: "Missed pickup", severity: "High", status: "Resolved", created: day(-11, 10, 14), slaDue: day(-10, 10, 14), assignee: "Utibe Ekanem", evidence: 1 },
  { id: "CMP-1201", customerName: me.household.name, customerType: "Household", operatorName: "Ufok Environmental", service: "Slate Home", pickupId: "PU-26-08640", issue: "Bin lid cracked after collection", category: "Damaged bin", severity: "Low", status: "In progress", created: day(-6, 9, 2), slaDue: day(-4, 9, 2), assignee: "Emem Obot", evidence: 2 },
];

/* ---------- contracts ---------- */
export const contracts: Contract[] = [
  { id: "CT-UYO-011", operatorId: "op-ufok", operatorName: "Ufok Environmental", areas: ["Ewet Housing Estate", "Shelter Afrique Estate", "Osongama Estate"], serviceTypes: ["Household Waste", "Estate Waste Management", "Recycling"], customerPrice: 7000, operatorPayout: 5500, capacity: 2400, customers: 1912, slaCompletion: 97, responseHours: 24, paymentTerms: "Monthly, 7 days after period end", penalties: "₦2,500 per missed pickup not recovered within 24h; 5% deduction below 95% completion", start: "2026-03-15", end: "2027-03-14", status: "Active", monthlyValue: 9_418_500, version: 3 },
  { id: "CT-UYO-012", operatorId: "op-atlantic", operatorName: "Atlantic Coast", areas: ["Aka Road", "Oron Road", "Udo Udoma Avenue", "Wellington Bassey Way"], serviceTypes: ["Commercial Waste", "Event Cleanup"], customerPrice: 30000, operatorPayout: 23000, capacity: 420, customers: 318, slaCompletion: 96, responseHours: 12, paymentTerms: "Monthly, 7 days after period end", penalties: "₦7,500 per missed commercial pickup; termination after 3 breaches in 90 days", start: "2026-04-01", end: "2027-03-31", status: "Active", monthlyValue: 6_871_000, version: 2 },
  { id: "CT-UYO-014", operatorId: "op-ibom", operatorName: "Ibom Hauliers", areas: ["Itam", "Abak Road", "Use Offot"], serviceTypes: ["Institutional Waste", "Bulk Waste", "Special Collection"], customerPrice: 180000, operatorPayout: 141000, capacity: 140, customers: 96, slaCompletion: 95, responseHours: 24, paymentTerms: "Monthly, 14 days after invoice", penalties: "5% deduction below 95% completion", start: "2026-04-15", end: "2026-11-14", status: "Renewal approaching", monthlyValue: 4_206_000, version: 1 },
  { id: "CT-UYO-017", operatorId: "op-nwaniba", operatorName: "Nwaniba Clean Crew", areas: ["Nwaniba Road", "Ikot Ekpene Road", "Aka Road"], serviceTypes: ["Household Waste", "Bulk Waste", "Event Cleanup"], customerPrice: 7000, operatorPayout: 5600, capacity: 380, customers: 151, slaCompletion: 95, responseHours: 6, paymentTerms: "Bi-weekly", penalties: "₦2,500 per missed pickup not recovered within 24h", start: "2026-05-20", end: "2026-11-19", status: "Expiring", monthlyValue: 1_384_500, version: 1 },
  { id: "CT-UYO-021", operatorId: "op-esuk", operatorName: "Esuk Logistics", areas: ["Oron Road", "Itam"], serviceTypes: ["Commercial Waste", "Bulk Waste"], customerPrice: 30000, operatorPayout: 23500, capacity: 260, customers: 0, slaCompletion: 96, responseHours: 12, paymentTerms: "Monthly, 7 days after period end", penalties: "₦7,500 per missed commercial pickup", start: "2026-11-01", end: "2027-10-31", status: "Negotiation", monthlyValue: 0, version: 2 },
  { id: "CT-UYO-022", operatorId: "op-mkpok", operatorName: "Mkpok Environmental", areas: ["Use Offot", "Abak Road"], serviceTypes: ["Household Waste"], customerPrice: 7000, operatorPayout: 5400, capacity: 600, customers: 0, slaCompletion: 97, responseHours: 24, paymentTerms: "Monthly, 7 days after period end", penalties: "Standard residential schedule", start: "2026-11-15", end: "2027-11-14", status: "Draft", monthlyValue: 0, version: 1 },
  { id: "CT-UYO-019", operatorId: "op-ufok", operatorName: "Ufok Environmental", areas: ["Osongama Estate"], serviceTypes: ["Recycling"], customerPrice: 1500, operatorPayout: 1000, capacity: 800, customers: 0, slaCompletion: 95, responseHours: 48, paymentTerms: "Monthly", penalties: "Standard recycling schedule", start: "2026-11-01", end: "2027-10-31", status: "Sent to operator", monthlyValue: 0, version: 1 },
  { id: "CT-UYO-008", operatorId: "op-obio", operatorName: "Obio Sanitation", areas: ["Ikot Ekpene Road"], serviceTypes: ["Household Waste"], customerPrice: 7000, operatorPayout: 5500, capacity: 300, customers: 0, slaCompletion: 97, responseHours: 24, paymentTerms: "Monthly", penalties: "Standard residential schedule", start: "2026-04-01", end: "2027-03-31", status: "Terminated", monthlyValue: 0, version: 2 },
  { id: "CT-UYO-018", operatorId: "op-atlantic", operatorName: "Atlantic Coast", areas: ["Udo Udoma Avenue"], serviceTypes: ["Commercial Waste"], customerPrice: 30000, operatorPayout: 23000, capacity: 60, customers: 0, slaCompletion: 96, responseHours: 12, paymentTerms: "Monthly", penalties: "₦7,500 per missed commercial pickup", start: "2026-11-01", end: "2027-10-31", status: "Internal review", monthlyValue: 0, version: 1 },
];
export const contractById = (id: string) => contracts.find((c) => c.id === id);

/* ---------- invoices & payouts ---------- */
export const invoices: Invoice[] = Array.from({ length: 18 }, (_, i): Invoice => {
  const c = customers.filter((x) => x.type !== "Household")[i % 20] ?? customers[2]!;
  const months = ["October 2026", "September 2026", "August 2026"];
  const m = months[Math.floor(i / 6)]!;
  const amount = c.monthly;
  return {
    id: `INV-26-${pad(410 + i, 4)}`,
    customerName: c.name, period: m,
    issued: day(-30 * Math.floor(i / 6) - 4), due: day(-30 * Math.floor(i / 6) + 10),
    amount,
    status: i < 6 ? pick(["Unpaid", "Sent", "Paid", "Partial"] as const) : i < 12 ? pick(["Paid", "Paid", "Overdue"] as const) : "Paid",
    lines: [
      { label: c.plan, qty: c.sites ?? 1, unit: Math.round(amount / (c.sites ?? 1)) },
    ],
  };
});

export const payouts: Payout[] = activeOperators.flatMap((o, oi) =>
  ["September 2026", "August 2026", "July 2026"].map((period, pi): Payout => {
    const gross = Math.round(o.payoutMonthly * (1 - pi * 0.06));
    const deductions = pi === 0 ? [27500, 52500, 15000, 35000][oi]! : between(0, 6) * 2500;
    const adjustments = pi === 1 && oi === 1 ? 12000 : 0;
    return {
      id: `PO-${pad(2600 + oi * 3 + pi, 5)}`, operatorId: o.id, operatorName: o.short, period,
      jobs: Math.round(o.assigned * 8.4 * (1 - pi * 0.06)), gross, deductions, adjustments, net: gross - deductions + adjustments,
      status: pi === 0 ? (oi === 3 ? "Processing" : "Pending") : "Paid",
      date: day(-pi * 30 + 2),
    };
  }),
);

/* ---------- community ---------- */
export const communityProjects: CommunityProject[] = [
  { id: "cp-ewet-drain", title: "Clear the Ewet Phase 1 drainage channel", community: "Ewet Housing Estate", description: "The main channel behind Blocks C–F floods every heavy rain. A verified crew will desilt 420 metres and haul the debris. Funds are released to the crew when the target is reached and the work is verified.", target: 850_000, raised: 612_500, contributors: 141, deadline: day(19), status: "Active", provider: "Nwaniba Clean Crew", failedPayments: 4, category: "Drainage" },
  { id: "cp-ewet-bins", title: "Six communal recycling stations", community: "Ewet Housing Estate", description: "Sorted stations for PET, cans and paper at the estate entrances, emptied monthly by Ufok Environmental.", target: 1_260_000, raised: 1_260_000, contributors: 233, deadline: day(-12), status: "Funded", provider: "Ufok Environmental", failedPayments: 0, category: "Recycling" },
  { id: "cp-shelter-clean", title: "Monthly sanitation Saturday crew", community: "Shelter Afrique Estate", description: "A paid crew to support the last-Saturday sanitation exercise across all 312 homes.", target: 420_000, raised: 168_000, contributors: 64, deadline: day(26), status: "Active", provider: "Ufok Environmental", failedPayments: 2, category: "Sanitation" },
  { id: "cp-aka-market", title: "Aka Road market stall waste point", community: "Aka Road traders", description: "A covered collection point for 60 market stalls so waste stops piling on the road.", target: 2_100_000, raised: 2_100_000, contributors: 58, deadline: day(-40), status: "Completed", provider: "Atlantic Coast", failedPayments: 0, category: "Infrastructure" },
  { id: "cp-osongama-light", title: "Solar lights at the Osongama collection point", community: "Osongama Estate", description: "Four solar lights so early-morning crews and residents can use the collection point safely.", target: 640_000, raised: 92_000, contributors: 21, deadline: day(41), status: "Active", provider: "Ibom Hauliers", failedPayments: 1, category: "Safety" },
];

/* ---------- recycling ---------- */
export const recyclingPartners: RecyclingPartner[] = [
  { id: "rp-itam", name: "Itam Recovery Ltd", materials: ["PET plastic", "HDPE"], rate: "₦180/kg", volumeKg: 18_420, payout: 3_315_600, status: "Active", score: 92 },
  { id: "rp-metal", name: "Ikot Metal Reclaim", materials: ["Aluminium cans", "Scrap metal"], rate: "₦640/kg", volumeKg: 4_110, payout: 2_630_400, status: "Active", score: 88 },
  { id: "rp-paper", name: "PaperLoop Uyo", materials: ["Paper & cardboard"], rate: "₦60/kg", volumeKg: 22_960, payout: 1_377_600, status: "Active", score: 85 },
  { id: "rp-ecycle", name: "Ewet E-Cycle", materials: ["E-waste"], rate: "Per item", volumeKg: 860, payout: 412_000, status: "Active", score: 79 },
  { id: "rp-compost", name: "Akwa Compost Works", materials: ["Organic waste"], rate: "₦25/kg", volumeKg: 31_200, payout: 780_000, status: "Pending", score: 0 },
];

/* ---------- support, reviews ---------- */
export const tickets: Ticket[] = Array.from({ length: 24 }, (_, i): Ticket => {
  const isOp = i % 5 === 0;
  return {
    id: `TCK-${4400 + i}`,
    from: isOp ? pick(activeOperators).short : customers[1 + ((i * 3) % 60)]!.name,
    kind: isOp ? "Operator" : "Customer",
    subject: isOp
      ? pick(["Payout for September not received", "Need to update a driver's licence", "Route for Thursday has 14 stops too many", "Customer address cannot be found"])
      : pick(["How do I change my pickup day?", "Card declined but I was debited", "Request receipt for September", "Can I pause service while travelling?", "Estate gate closed during pickup window", "Want to add a second bin"]),
    channel: pick(["In-app", "In-app", "WhatsApp", "Email", "Phone"] as const),
    priority: pick(["Low", "Normal", "Normal", "High", "Urgent"] as const),
    status: pick(["Open", "Open", "Pending", "Waiting", "Resolved", "Closed", "Escalated"] as const),
    assignee: pick(["Utibe Ekanem", "Emem Obot", "Inemesit Ita", "Unassigned"]),
    created: day(-between(0, 9), between(7, 21), between(0, 59)),
    sla: pick(["2h left", "35m left", "Breached 1h ago", "6h left", "Met"]),
  };
}).sort((a, b) => b.created.localeCompare(a.created));

const COMMENTS = [
  "Crew came at 7:20 and left the gate clean. No complaints.",
  "On time three weeks running. The SMS before arrival is useful.",
  "Missed us once but the recovery truck came the next morning.",
  "Driver was polite and helped carry the second bin.",
  "Came late, around 11, but did a good job.",
  "Some spillage at the gate, otherwise fine.",
  "Reliable. Much better than the collectors we used to chase.",
  "They don't close the bin lid properly after emptying.",
];
export const reviews: Review[] = Array.from({ length: 28 }, (_, i): Review => {
  const rating = pick([5, 5, 5, 4, 4, 4, 3, 2]);
  return {
    id: `rv-${i}`,
    customerName: customers[1 + ((i * 5) % 60)]!.name,
    operatorName: pick(activeOperators).short,
    rating, punctuality: Math.max(1, rating - pick([0, 0, 1])), professionalism: Math.max(1, rating - pick([0, 0, 0, 1])), quality: Math.max(1, rating - pick([0, 1])),
    comment: rating >= 4 ? COMMENTS[i % 4]! : COMMENTS[4 + (i % 4)]!,
    date: day(-between(0, 40)),
    status: i === 6 ? "Flagged" : i === 19 ? "Hidden" : "Published",
  };
});

/* ---------- notifications ---------- */
export const customerNotifications: NotificationItem[] = [
  { id: "n1", category: "Pickups", title: "Your truck is on Ewet Road, 2 stops away", body: "Today's collection window is 07:00–09:00. Ufok Environmental is collecting for Slate.", time: day(0, 8, 4), read: false, to: "/app/pickups/PU-26-08813" },
  { id: "n2", category: "Payments", title: "Bulk pickup deposit pending", body: "₦9,000 is being confirmed by your bank. This usually takes a few minutes.", time: day(-1, 21, 11), read: false, to: "/app/payments" },
  { id: "n3", category: "Service", title: "Your report CMP-1201 is in progress", body: "A replacement bin lid is scheduled with your Thursday collection.", time: day(-2, 14, 5), read: true, to: "/app/complaints" },
  { id: "n4", category: "Pickups", title: "Collected at 07:42", body: "Monday's collection at 14 Ewet Housing Estate is done. Rate it in a tap.", time: day(-7, 7, 43), read: true, to: "/app/pickups/PU-26-08640" },
  { id: "n5", category: "Community", title: "Ewet drainage project is 72% funded", body: "₦237,500 to go. 141 neighbours have contributed.", time: day(-4, 18, 0), read: true, to: "/app/community/cp-ewet-drain" },
  { id: "n6", category: "Payments", title: "October payment received", body: "₦7,000 charged to Visa •• 4021. Receipt TXN-7Q4K2M.", time: day(-4, 6, 3), read: true, to: "/app/receipts" },
  { id: "n7", category: "Support", title: "Utibe replied to your ticket", body: "“The replacement crew is confirmed for 11:00 tomorrow.”", time: day(-6, 16, 40), read: true, to: "/app/support" },
  { id: "n8", category: "Promotions", title: "Recycling pickup now monthly in Ewet", body: "Add sorted recyclables to your plan for ₦1,500 a month.", time: day(-8, 10, 0), read: true, to: "/app/recycling" },
];

export const operatorNotifications: NotificationItem[] = [
  { id: "on1", category: "Operator", title: "14 new jobs added to Tuesday's route", body: "Shelter Afrique Estate Block D, transferred from Nwaniba Clean Crew.", time: day(0, 6, 40), read: false, to: "/operator/jobs" },
  { id: "on2", category: "Service", title: "SLA warning: CMP-1199 due in 2 hours", body: "Missed pickup at 22 Osongama Estate Phase 2 has not been recovered.", time: day(0, 7, 55), read: false, to: "/operator/complaints" },
  { id: "on3", category: "Payments", title: "September payout approved", body: "₦9,391,000 net will be paid on 7 October.", time: day(-1, 16, 20), read: true, to: "/operator/payments" },
  { id: "on4", category: "Contracts", title: "Contract CT-UYO-019 sent for acceptance", body: "Osongama recycling, from 1 November.", time: day(-2, 11, 0), read: false, to: "/operator/contracts" },
  { id: "on5", category: "System", title: "Vehicle licence expiring", body: "AKS 588 KJ road worthiness expires on 19 October.", time: day(-3, 9, 0), read: true, to: "/operator/vehicles" },
];

export const adminAlerts = {
  missedPickups: 12, operatorApplications: 4, failedPayments: 8, slaBreaches: 3, chargebacks: 2, contractsExpiring: 5, documentsExpiring: 7,
};

/* ---------- documents, audit, fleet ---------- */
export const documents: DocumentItem[] = [
  { id: "doc-1", name: "CAC certificate", owner: "Ufok Environmental", category: "Operator documents", uploaded: "2026-02-20", status: "Verified", version: 1, size: "412 KB" },
  { id: "doc-2", name: "AKSEPA waste-handling permit", owner: "Ufok Environmental", category: "Compliance documents", uploaded: "2026-02-20", expires: "2026-10-31", status: "Expiring", version: 2, size: "1.2 MB" },
  { id: "doc-3", name: "Fleet insurance, 9 vehicles", owner: "Ufok Environmental", category: "Operator documents", uploaded: "2026-03-01", expires: "2027-02-28", status: "Verified", version: 1, size: "2.4 MB" },
  { id: "doc-4", name: "Waste Service Partner Agreement v3", owner: "CT-UYO-011", category: "Contracts", uploaded: "2026-09-02", status: "Verified", version: 3, size: "880 KB" },
  { id: "doc-5", name: "Disposal site agreement, Uyo dumpsite", owner: "Ibom Hauliers", category: "Compliance documents", uploaded: "2026-04-03", expires: "2026-10-12", status: "Expiring", version: 1, size: "640 KB" },
  { id: "doc-6", name: "Driver licences (5)", owner: "Ibom Hauliers", category: "Operator documents", uploaded: "2026-04-03", expires: "2026-09-30", status: "Expired", version: 1, size: "3.1 MB" },
  { id: "doc-7", name: "Tax clearance certificate 2026", owner: "Atlantic Coast", category: "Financial documents", uploaded: "2026-03-18", expires: "2026-12-31", status: "Verified", version: 1, size: "220 KB" },
  { id: "doc-8", name: "Estate service agreement", owner: "Shelter Afrique Estate", category: "Customer documents", uploaded: "2026-05-02", status: "Verified", version: 2, size: "530 KB" },
  { id: "doc-9", name: "AKSEPA operator registration letter", owner: "Slate Technologies Ltd", category: "Government documents", uploaded: "2026-01-29", expires: "2027-01-28", status: "Verified", version: 1, size: "190 KB" },
  { id: "doc-10", name: "CAC certificate", owner: "Esuk Logistics", category: "Operator documents", uploaded: "2026-09-21", status: "Pending", version: 1, size: "380 KB" },
  { id: "doc-11", name: "Vehicle particulars (4)", owner: "Esuk Logistics", category: "Operator documents", uploaded: "2026-09-21", status: "Pending", version: 1, size: "2.0 MB" },
  { id: "doc-12", name: "Business name registration", owner: "Mkpok Environmental", category: "Operator documents", uploaded: "2026-09-28", status: "Rejected", version: 1, size: "150 KB" },
  { id: "doc-13", name: "Q3 financial statement", owner: "Slate Technologies Ltd", category: "Financial documents", uploaded: "2026-10-02", status: "Verified", version: 1, size: "1.6 MB" },
];

export const auditLog: AuditEntry[] = [
  { id: "a1", user: "Idara Umoh", role: "Operations Admin", action: "Reassigned pickup", entity: "PU-26-08519", previous: "Operator: Ufok Environmental", next: "Operator: Nwaniba Clean Crew", time: day(-5, 9, 2), ip: "102.89.34.11" },
  { id: "a2", user: "Aniekan Etim", role: "Super Admin", action: "Approved operator", entity: "Nwaniba Clean Crew", previous: "Under review", next: "Approved", time: day(-12, 15, 30), ip: "102.89.34.20" },
  { id: "a3", user: "Ekaette Archibong", role: "Finance Admin", action: "Issued refund", entity: "TXN-2WD5KA", previous: "Successful", next: "Refunded (₦3,500)", time: day(-44, 16, 2), ip: "105.112.7.88" },
  { id: "a4", user: "Itoro Effiong", role: "Partnership Manager", action: "Changed contract", entity: "CT-UYO-011", previous: "v2, payout ₦5,400", next: "v3, payout ₦5,500", time: day(-33, 11, 12), ip: "102.89.34.11" },
  { id: "a5", user: "Aniekan Etim", role: "Super Admin", action: "Suspended operator", entity: "Obio Sanitation", previous: "Active", next: "Suspended", time: day(-21, 18, 44), ip: "102.89.34.20" },
  { id: "a6", user: "Utibe Ekanem", role: "Customer Support", action: "Status change", entity: "CMP-1183", previous: "Investigating", next: "Resolved", time: day(-5, 12, 6), ip: "197.210.55.4" },
  { id: "a7", user: "Ekaette Archibong", role: "Finance Admin", action: "Payout", entity: "PO-02601", previous: "Pending", next: "Paid (₦6,412,000)", time: day(-28, 10, 0), ip: "105.112.7.88" },
  { id: "a8", user: "Idara Umoh", role: "Operations Admin", action: "Login", entity: "admin.slate.ng", previous: "Not set", next: "Session started (Chrome, macOS)", time: day(0, 7, 58), ip: "102.89.34.11" },
  { id: "a9", user: "Mbuotidem Udoh", role: "Compliance Admin", action: "Rejected document", entity: "Mkpok Environmental, BN registration", previous: "Pending", next: "Rejected (illegible scan)", time: day(-6, 14, 18), ip: "102.89.40.2" },
  { id: "a10", user: "Idara Umoh", role: "Operations Admin", action: "Suspended customer", entity: "cus-0031", previous: "Active", next: "Suspended (3 failed payments)", time: day(-2, 9, 41), ip: "102.89.34.11" },
  { id: "a11", user: "Ekaette Archibong", role: "Finance Admin", action: "Payment", entity: "TXN-4C9TBB", previous: "Failed ×3", next: "Successful (manual retry)", time: day(-33, 12, 30), ip: "105.112.7.88" },
];

export const vehicles: Vehicle[] = [
  { id: "v1", registration: "AKS 214 XA", type: "7-tonne compactor", capacity: "14 m³", status: "Active", driver: "Emmanuel Udo", docStatus: "Verified", inspection: "2026-08-14" },
  { id: "v2", registration: "AKS 588 KJ", type: "7-tonne compactor", capacity: "14 m³", status: "Active", driver: "Godwin Etuk", docStatus: "Expiring", inspection: "2026-04-19" },
  { id: "v3", registration: "UYO 903 BG", type: "Tipper truck", capacity: "10 m³", status: "Active", driver: "Samuel Akpan", docStatus: "Verified", inspection: "2026-07-02" },
  { id: "v4", registration: "AKS 117 HT", type: "Skip loader", capacity: "8 m³", status: "In maintenance", driver: "Not set", docStatus: "Verified", inspection: "2026-06-21" },
  { id: "v5", registration: "AKS 330 FG", type: "Pickup (bulk)", capacity: "3 m³", status: "Active", driver: "Okon Essien", docStatus: "Verified", inspection: "2026-09-08" },
  { id: "v6", registration: "AKS 902 QE", type: "7-tonne compactor", capacity: "14 m³", status: "Active", driver: "Daniel Inyang", docStatus: "Verified", inspection: "2026-09-22" },
  { id: "v7", registration: "AKS 415 BD", type: "Tipper truck", capacity: "10 m³", status: "Inactive", driver: "Not set", docStatus: "Expired", inspection: "2025-12-11" },
];

export const drivers: Driver[] = [
  { id: "d1", name: "Emmanuel Udo", phone: "+234 806 117 2290", vehicle: "AKS 214 XA", verification: "Verified", status: "On shift", jobsToday: 38, rating: 4.8 },
  { id: "d2", name: "Godwin Etuk", phone: "+234 813 449 0127", vehicle: "AKS 588 KJ", verification: "Verified", status: "On shift", jobsToday: 34, rating: 4.5 },
  { id: "d3", name: "Samuel Akpan", phone: "+234 703 558 3311", vehicle: "UYO 903 BG", verification: "Verified", status: "On shift", jobsToday: 21, rating: 4.6 },
  { id: "d4", name: "Okon Essien", phone: "+234 909 220 6643", vehicle: "AKS 330 FG", verification: "Pending", status: "Off shift", jobsToday: 0, rating: 4.2 },
  { id: "d5", name: "Daniel Inyang", phone: "+234 816 903 1185", vehicle: "AKS 902 QE", verification: "Verified", status: "On shift", jobsToday: 29, rating: 4.7 },
  { id: "d6", name: "Moses Ekpo", phone: "+234 802 774 5540", vehicle: "Not set", verification: "Expired", status: "Suspended", jobsToday: 0, rating: 3.8 },
];

/* ---------- partners, cities, smart sweep, chargebacks ---------- */
export const partners: Partner[] = [
  { id: "pt-1", name: "Ufok Environmental Services Ltd", type: "Waste company", contact: "Edidiong Johnson", agreement: "CT-UYO-011", status: "Active", locations: ["Uyo"], since: "2026-03-02", services: ["Household", "Estate", "Recycling"] },
  { id: "pt-2", name: "Itam Recovery Ltd", type: "Recycling company", contact: "Inemesit Ita", agreement: "RA-UYO-002", status: "Active", locations: ["Itam, Uyo"], since: "2026-05-01", services: ["PET", "HDPE"] },
  { id: "pt-3", name: "Shelter Afrique Estate Residents Association", type: "Estate", contact: "Uduak Essien", agreement: "EA-UYO-004", status: "Active", locations: ["Shelter Afrique Estate"], since: "2026-05-02", services: ["Estate waste management"] },
  { id: "pt-4", name: "Gracefield Homes", type: "Property developer", contact: "Tunde Adeyemi", agreement: "Draft MoU", status: "Negotiation", locations: ["Nwaniba Road"], since: "2026-09-10", services: ["New-estate onboarding"] },
  { id: "pt-5", name: "Ikpa Hills University", type: "Institution", contact: "Dr. Nsikak Okon", agreement: "IA-UYO-001", status: "Active", locations: ["Main campus", "Medical campus"], since: "2026-06-01", services: ["Institutional service"] },
  { id: "pt-6", name: "Akwa Ibom State Environmental Protection Agency", type: "Government", contact: "Office of the GM", agreement: "Registration letter", status: "Active", locations: ["Uyo"], since: "2026-01-29", services: ["Regulatory"] },
  { id: "pt-7", name: "Paystack", type: "Payment provider", contact: "Partnerships team", agreement: "Merchant agreement", status: "Active", locations: ["Lagos"], since: "2026-02-14", services: ["Cards", "Transfers", "Recurring charges"] },
  { id: "pt-8", name: "Coastal Microfinance Bank", type: "Financial partner", contact: "Ifeoma Okafor", agreement: "Term sheet (Community Guarantee)", status: "Pending", locations: ["Uyo"], since: "2026-09-25", services: ["Community Guarantee financing"] },
  { id: "pt-9", name: "Grand Atlantic Group", type: "Corporate partner", contact: "Chidinma Okafor", agreement: "Multi-site contract", status: "Active", locations: ["Uyo", "Eket", "Port Harcourt"], since: "2026-07-15", services: ["12-branch corporate waste"] },
];

export const cities: City[] = [
  { id: "uyo", name: "Uyo", state: "Akwa Ibom", status: "Live", customers: 2477, operators: 4, revenue: 21_880_000, completion: 96.8, regulatory: 100, demand: 92, launch: "2026-04-01" },
  { id: "port-harcourt", name: "Port Harcourt", state: "Rivers", status: "Launching", customers: 0, operators: 1, revenue: 0, completion: 0, regulatory: 70, demand: 81, launch: "2027-02-01" },
  { id: "lagos", name: "Lagos", state: "Lagos", status: "Planned", customers: 0, operators: 0, revenue: 0, completion: 0, regulatory: 35, demand: 98, launch: "2027-Q3" },
  { id: "abuja", name: "Abuja", state: "FCT", status: "Planned", customers: 0, operators: 0, revenue: 0, completion: 0, regulatory: 20, demand: 76, launch: "2028-Q1" },
  { id: "eket", name: "Eket", state: "Akwa Ibom", status: "Planned", customers: 0, operators: 0, revenue: 0, completion: 0, regulatory: 55, demand: 48, launch: "2027-Q2" },
];

export const smartSweeps: SmartSweepPlan[] = [
  { id: "ss-1", customerName: me.household.name, owed: 14_000, collected: 8_500, maxCharge: 1_500, frequency: "Weekly", nextCharge: day(3, 9), status: "Active", failures: 0 },
  ...Array.from({ length: 15 }, (_, i): SmartSweepPlan => {
    const owed = pick([7000, 14000, 21000, 13000, 19500]);
    const status = pick(["Active", "Active", "Active", "Paused", "Failed", "Completed"] as const);
    return {
      id: `ss-${i + 2}`, customerName: customers[3 + i * 2]!.name, owed,
      collected: status === "Completed" ? owed : Math.round(owed * rnd() * 0.9),
      maxCharge: pick([1000, 1500, 2000, 2500]), frequency: pick(["Weekly", "Every 3 days", "Fortnightly"]),
      nextCharge: day(between(1, 9), 9), status, failures: status === "Failed" ? 3 : status === "Paused" ? between(1, 3) : 0,
    };
  }),
];

export const chargebacks: Chargeback[] = [
  { id: "CB-0091", customerName: "Grand Atlantic Lounge", amount: 46_500, reason: "Services not provided", opened: day(-3, 10), respondBy: day(4, 23, 59), status: "Open", processor: "Paystack", txn: "TXN-8RF2QJ" },
  { id: "CB-0090", customerName: "Ekemini Udo", amount: 7_000, reason: "Unrecognised transaction", opened: day(-6, 15), respondBy: day(1, 23, 59), status: "Evidence submitted", processor: "Paystack", txn: "TXN-7XK4PL" },
  { id: "CB-0087", customerName: "Uyo Cineplex", amount: 64_000, reason: "Duplicate charge", opened: day(-19, 9), respondBy: day(-9, 23, 59), status: "Won", processor: "Flutterwave", txn: "TXN-6DL9WE" },
  { id: "CB-0081", customerName: "Ofonime Edet", amount: 4_500, reason: "Subscription cancelled", opened: day(-33, 11), respondBy: day(-23, 23, 59), status: "Lost", processor: "Paystack", txn: "TXN-5QW2NM" },
];

/* ---------- time series for charts ---------- */
export const series = {
  months: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
  mrr: [2_140_000, 4_980_000, 8_310_000, 11_620_000, 15_040_000, 19_270_000, 21_880_000],
  mrrPrev: [0, 0, 1_200_000, 3_100_000, 6_400_000, 9_900_000, 12_800_000],
  customers: [182, 611, 1004, 1388, 1797, 2210, 2477],
  completion: [92.1, 94.4, 95.0, 95.8, 96.2, 96.5, 96.8],
  gsv: [9_800_000, 21_400_000, 36_900_000, 52_600_000, 68_100_000, 86_700_000, 98_300_000],
  last14: ["21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "1", "2", "3", "4"],
  pickups14: [412, 455, 398, 470, 488, 211, 96, 431, 466, 459, 102, 478, 492, 305],
  missed14: [9, 12, 7, 15, 10, 4, 2, 8, 11, 9, 3, 12, 6, 5],
  weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};
