/**
 * Ikpa Hills University — local demo data for the institution portal.
 * Demo clock: Monday 5 October 2026, 08:12 WAT (DEMO_NOW).
 * Deterministic: no randomness, so every render and screenshot is the same.
 */

/** ISO timestamp `offset` days from Mon 5 Oct 2026 at hh:mm WAT. */
export const at = (offset: number, hh = 8, mm = 0) => new Date(2026, 9, 5 + offset, hh, mm, 0, 0).toISOString();

/* ------------------------------------------------------------------ */
/* Institution                                                         */
/* ------------------------------------------------------------------ */

export const institution = {
  name: "Ikpa Hills University",
  short: "IHU",
  type: "University (state-owned)",
  address: "Km 6 Ikpa Road, Uyo, Akwa Ibom",
  phone: "+234 803 551 2048",
  email: "facilities@ikpahills.edu.ng",
  billingEmail: "bursary.payables@ikpahills.edu.ng",
  tin: "20871455-0001",
  rc: "Established by Law No. 7 of 2009",
  vendorNo: "IHU/VR/2026/0417",
  students: 11_240,
  residents: 3_280,
  staff: 1_460,
  beds: 64,
  session: "2026/2027",
  director: "Dr. Nsikak Okon",
};

/* ------------------------------------------------------------------ */
/* Operators (as the institution sees them)                            */
/* ------------------------------------------------------------------ */

export type OperatorKey = "ibom" | "ufok";
export const OPERATORS: Record<OperatorKey, { name: string; short: string; rc: string; contact: string; phone: string; email: string; contract: string }> = {
  ibom: { name: "Ibom Hauliers & Waste Co.", short: "Ibom Hauliers", rc: "RC 905118", contact: "Ofonime Ekpo", phone: "+234 802 918 4420", email: "info@ibomhauliers.com", contract: "CT-UYO-014" },
  ufok: { name: "Ufok Environmental Services Ltd", short: "Ufok Environmental", rc: "RC 1482207", contact: "Edidiong Johnson", phone: "+234 803 412 7765", email: "ops@ufokenv.ng", contract: "CT-UYO-016" },
};

/* ------------------------------------------------------------------ */
/* Facilities — with campus-plan geometry (viewBox 0 0 400 256)        */
/* ------------------------------------------------------------------ */

export type FacilityId = "academic" | "senate" | "medical" | "halls" | "staff" | "sports" | "kitchen";
export type WasteStream = "General" | "Food waste" | "Paper & cardboard" | "Recyclables" | "Non-hazardous medical" | "Used cooking oil" | "Hazardous medical (specialist)";

export const STREAMS: WasteStream[] = ["General", "Food waste", "Paper & cardboard", "Recyclables", "Non-hazardous medical", "Used cooking oil"];

export interface Facility {
  id: FacilityId;
  name: string;
  short: string;
  kind: "Academic" | "Administrative" | "Medical" | "Residential" | "Staff housing" | "Sports" | "Catering";
  address: string;
  operator: OperatorKey;
  contract: string;
  manager: string;
  managerRole: string;
  managerPhone: string;
  population: number;
  populationLabel: string;
  schedule: string;
  streams: WasteStream[];
  monthlyKg: number;
  monthlyCost: number;
  departments: string[];
  note?: string;
  /** campus plan shapes */
  shapes: string[];
  label: { x: number; y: number; rot?: number };
}

export const facilities: Facility[] = [
  {
    id: "academic", name: "Main campus academic block", short: "Academic block", kind: "Academic",
    address: "Faculty Road, main campus", operator: "ibom", contract: "CT-UYO-014",
    manager: "Engr. Utibe Ntuk", managerRole: "Faculty works officer", managerPhone: "+234 806 330 4419",
    population: 9_400, populationLabel: "students on a weekday", schedule: "Mon, Wed, Fri · 07:00",
    streams: ["General", "Paper & cardboard", "Recyclables"], monthlyKg: 12_600, monthlyCost: 412_300,
    departments: ["ENG", "LAW", "SCI"],
    shapes: ["138,106 241,101 244,166 141,170"], label: { x: 191, y: 139 },
  },
  {
    id: "senate", name: "Senate building", short: "Senate", kind: "Administrative",
    address: "Senate Avenue, by the east gate", operator: "ibom", contract: "CT-UYO-014",
    manager: "Mrs. Nkoyo Ita", managerRole: "Senate house manager", managerPhone: "+234 813 207 5561",
    population: 420, populationLabel: "staff", schedule: "Mon, Thu · 07:45",
    streams: ["General", "Paper & cardboard"], monthlyKg: 1_780, monthlyCost: 96_400,
    departments: ["ADM"],
    shapes: ["262,107 324,104 327,167 264,170"], label: { x: 294, y: 140 },
  },
  {
    id: "medical", name: "Medical campus & teaching clinic", short: "Medical campus", kind: "Medical",
    address: "Medical campus, across Ikpa Road", operator: "ibom", contract: "CT-UYO-014",
    manager: "Dr. Mfon Udoh", managerRole: "Medical director, teaching clinic", managerPhone: "+234 802 664 1093",
    population: 64, populationLabel: "beds", schedule: "Weekdays · 08:30",
    streams: ["General", "Non-hazardous medical", "Food waste"], monthlyKg: 4_850, monthlyCost: 268_900,
    departments: ["MED"],
    note: "Hazardous medical waste (sharps, infectious, anatomical, pharmaceutical) is collected by Akwa MedWaste Disposal Ltd, a licensed specialist. Slate keeps the licence and consignment notes on file but does not collect it.",
    shapes: ["349,40 394,38 396,214 351,218"], label: { x: 373, y: 128, rot: -90 },
  },
  {
    id: "halls", name: "Halls of residence (4 halls)", short: "Halls", kind: "Residential",
    address: "Etinan, Itu, Oron and Eket halls, north campus", operator: "ufok", contract: "CT-UYO-016",
    manager: "Mr. Kufre Essien", managerRole: "Chief hall warden", managerPhone: "+234 809 118 7724",
    population: 3_280, populationLabel: "residents", schedule: "Daily · 06:30",
    streams: ["General", "Food waste", "Recyclables"], monthlyKg: 18_900, monthlyCost: 612_000,
    departments: ["STA"],
    shapes: ["24,24 65,22 66,49 25,51", "76,21 117,19 118,47 77,49", "25,63 65,61 66,87 26,89", "77,60 118,58 119,85 78,87"],
    label: { x: 71, y: 58 },
  },
  {
    id: "staff", name: "Staff quarters", short: "Staff quarters", kind: "Staff housing",
    address: "Staff quarters, south campus", operator: "ibom", contract: "CT-UYO-014",
    manager: "Mr. Akpan Umoh", managerRole: "Estate officer, staff housing", managerPhone: "+234 703 992 0816",
    population: 146, populationLabel: "households", schedule: "Mon, Thu · 10:00",
    streams: ["General", "Recyclables"], monthlyKg: 7_300, monthlyCost: 233_800,
    departments: ["EST"],
    shapes: ["24,186 118,183 118,198 24,201", "24,206 118,203 118,218 24,221", "24,226 118,223 118,238 24,241"],
    label: { x: 71, y: 213 },
  },
  {
    id: "sports", name: "Sports complex", short: "Sports", kind: "Sports",
    address: "Sports complex, west campus", operator: "ibom", contract: "CT-UYO-014",
    manager: "Coach Edet Bassey", managerRole: "Director of sports", managerPhone: "+234 816 445 2301",
    population: 2_600, populationLabel: "visitors a week", schedule: "Mon · 09:00, plus fixtures",
    streams: ["General", "Recyclables"], monthlyKg: 2_950, monthlyCost: 118_700,
    departments: ["SPT"],
    shapes: ["24,107 118,104 120,167 26,170"], label: { x: 72, y: 140 },
  },
  {
    id: "kitchen", name: "Central kitchen & cafeterias", short: "Central kitchen", kind: "Catering",
    address: "Students' centre, north campus", operator: "ibom", contract: "CT-UYO-014",
    manager: "Mrs. Iniobong Asuquo", managerRole: "Catering manager", managerPhone: "+234 805 772 3318",
    population: 7_800, populationLabel: "meals a day", schedule: "Mon–Sat · 06:00 and 14:00",
    streams: ["Food waste", "General", "Used cooking oil"], monthlyKg: 21_400, monthlyCost: 356_400,
    departments: ["CAT"],
    shapes: ["150,38 232,35 234,84 152,87"], label: { x: 192, y: 62 },
  },
];

export const facilityById = (id: string) => facilities.find((f) => f.id === id)!;

/** Campus buildings not on a Slate schedule — drawn faintly for orientation. */
export const otherBuildings = [
  { name: "Library", shape: "262,29 324,26 326,85 264,88", x: 294, y: 58 },
  { name: "Works yard", shape: "140,186 244,182 246,238 142,242", x: 193, y: 213 },
  { name: "Chapel", shape: "262,186 325,183 327,238 264,240", x: 294, y: 213 },
];

/* ------------------------------------------------------------------ */
/* Waste locations — bin points                                        */
/* ------------------------------------------------------------------ */

export interface WasteLocation {
  id: string;
  facilityId: FacilityId;
  name: string;
  container: string;
  bins: number;
  capacityL: number;
  stream: WasteStream;
  frequency: string;
  lastCollected?: string;
  access?: string;
  issue?: string;
  specialist?: boolean;
  x: number;
  y: number;
}

export const wasteLocations: WasteLocation[] = [
  { id: "WL-A01", facilityId: "academic", name: "Faculty of Engineering, rear loading bay", container: "1,100 L bin", bins: 4, capacityL: 1100, stream: "General", frequency: "Mon, Wed, Fri", lastCollected: at(0, 7, 21), access: "Gate opened by faculty porter from 06:45", x: 152, y: 115 },
  { id: "WL-A02", facilityId: "academic", name: "Engineering workshops yard", container: "6 m³ skip", bins: 1, capacityL: 6000, stream: "General", frequency: "Fri, exchange on request", lastCollected: at(-3, 7, 52), x: 157, y: 157 },
  { id: "WL-A03", facilityId: "academic", name: "Faculty of Law, courtyard bin store", container: "240 L bin", bins: 6, capacityL: 240, stream: "General", frequency: "Mon, Wed, Fri", lastCollected: at(0, 7, 29), access: "Bin store padlocked after 18:00", x: 194, y: 113 },
  { id: "WL-A04", facilityId: "academic", name: "Lecture theatres LT1–LT4", container: "1,100 L bin", bins: 3, capacityL: 1100, stream: "General", frequency: "Mon, Wed, Fri", lastCollected: at(0, 7, 33), x: 229, y: 116 },
  { id: "WL-A05", facilityId: "academic", name: "Faculty of Science, lab block (non-chemical)", container: "240 L bin", bins: 8, capacityL: 240, stream: "General", frequency: "Mon, Wed, Fri", lastCollected: at(0, 7, 36), issue: "Two lids broken, replacement requested", x: 224, y: 156 },
  { id: "WL-A06", facilityId: "academic", name: "Faculty of Arts, paper store", container: "1,100 L bin", bins: 2, capacityL: 1100, stream: "Paper & cardboard", frequency: "Wed", lastCollected: at(-5, 7, 40), x: 191, y: 157 },
  { id: "WL-S01", facilityId: "senate", name: "Senate ground-floor bin store", container: "1,100 L bin", bins: 2, capacityL: 1100, stream: "General", frequency: "Mon, Thu", lastCollected: at(-4, 7, 58), x: 276, y: 120 },
  { id: "WL-S02", facilityId: "senate", name: "Registry, confidential paper", container: "240 L lockable bin", bins: 4, capacityL: 240, stream: "Paper & cardboard", frequency: "Thu, with destruction certificate", lastCollected: at(-4, 8, 10), access: "Registry officer must sign the release", x: 313, y: 122 },
  { id: "WL-S03", facilityId: "senate", name: "Bursary block and car park", container: "240 L bin", bins: 3, capacityL: 240, stream: "General", frequency: "Mon, Thu", lastCollected: at(-4, 8, 4), x: 301, y: 156 },
  { id: "WL-M01", facilityId: "medical", name: "Ward annex, non-hazardous clinical store", container: "240 L bin", bins: 6, capacityL: 240, stream: "Non-hazardous medical", frequency: "Weekdays", lastCollected: at(-4, 8, 51), access: "Clinic gate; collect only bagged and tagged waste", x: 372, y: 64 },
  { id: "WL-M02", facilityId: "medical", name: "Outpatients and pharmacy", container: "240 L bin", bins: 4, capacityL: 240, stream: "General", frequency: "Weekdays", lastCollected: at(-4, 8, 58), x: 366, y: 100 },
  { id: "WL-M03", facilityId: "medical", name: "Clinic kitchen", container: "240 L food caddy", bins: 2, capacityL: 240, stream: "Food waste", frequency: "Weekdays", lastCollected: at(-4, 9, 3), x: 380, y: 134 },
  { id: "WL-M05", facilityId: "medical", name: "College of Medicine lecture block", container: "1,100 L bin", bins: 2, capacityL: 1100, stream: "General", frequency: "Weekdays", lastCollected: at(-4, 9, 8), x: 364, y: 164 },
  { id: "WL-M04", facilityId: "medical", name: "Hazardous waste holding room", container: "Sharps and infectious containers", bins: 14, capacityL: 25, stream: "Hazardous medical (specialist)", frequency: "Tue, Fri by Akwa MedWaste", specialist: true, access: "Not a Slate pickup. Licensed specialist only.", x: 374, y: 196 },
  { id: "WL-H01", facilityId: "halls", name: "Etinan Hall bin shelter", container: "1,100 L bin", bins: 4, capacityL: 1100, stream: "General", frequency: "Daily", lastCollected: at(0, 6, 44), x: 44, y: 36 },
  { id: "WL-H02", facilityId: "halls", name: "Itu Hall bin shelter", container: "1,100 L bin", bins: 4, capacityL: 1100, stream: "General", frequency: "Daily", lastCollected: at(0, 6, 51), x: 97, y: 34 },
  { id: "WL-H03", facilityId: "halls", name: "Oron Hall bin shelter", container: "1,100 L bin", bins: 4, capacityL: 1100, stream: "General", frequency: "Daily", lastCollected: at(0, 7, 9), x: 45, y: 75 },
  { id: "WL-H04", facilityId: "halls", name: "Eket Hall bin shelter", container: "1,100 L bin", bins: 3, capacityL: 1100, stream: "General", frequency: "Daily", lastCollected: at(0, 7, 16), issue: "Overflow reported Sat night after hall week", x: 98, y: 72 },
  { id: "WL-H05", facilityId: "halls", name: "PET bottle cages, halls walkway", container: "Mesh cage", bins: 2, capacityL: 2000, stream: "Recyclables", frequency: "Sat", lastCollected: at(-2, 11, 5), x: 71, y: 56 },
  { id: "WL-Q01", facilityId: "staff", name: "Blocks A–D communal point", container: "6 m³ skip", bins: 1, capacityL: 6000, stream: "General", frequency: "Thu, exchange", lastCollected: at(-4, 10, 32), x: 40, y: 193 },
  { id: "WL-Q02", facilityId: "staff", name: "Senior staff close, kerbside", container: "240 L bin", bins: 36, capacityL: 240, stream: "General", frequency: "Mon, Thu", lastCollected: at(-4, 10, 58), x: 80, y: 213 },
  { id: "WL-Q03", facilityId: "staff", name: "Junior staff blocks", container: "1,100 L bin", bins: 4, capacityL: 1100, stream: "General", frequency: "Mon, Thu", lastCollected: at(-4, 11, 14), x: 104, y: 232 },
  { id: "WL-P01", facilityId: "sports", name: "Main stadium, east stand", container: "1,100 L bin", bins: 4, capacityL: 1100, stream: "General", frequency: "Mon, plus fixtures", lastCollected: at(-7, 9, 18), x: 104, y: 117 },
  { id: "WL-P02", facilityId: "sports", name: "Swimming pool and changing rooms", container: "240 L bin", bins: 4, capacityL: 240, stream: "General", frequency: "Mon", lastCollected: at(-7, 9, 31), x: 38, y: 158 },
  { id: "WL-P03", facilityId: "sports", name: "Stadium PET bottle cage", container: "Mesh cage", bins: 1, capacityL: 2000, stream: "Recyclables", frequency: "Mon", lastCollected: at(-7, 9, 26), x: 40, y: 117 },
  { id: "WL-K01", facilityId: "kitchen", name: "Central kitchen, food waste bay", container: "240 L food caddy", bins: 12, capacityL: 240, stream: "Food waste", frequency: "Mon–Sat, twice daily", lastCollected: at(0, 6, 18), access: "Wash-down after each lift", x: 166, y: 50 },
  { id: "WL-K02", facilityId: "kitchen", name: "Central kitchen, general waste", container: "1,100 L bin", bins: 3, capacityL: 1100, stream: "General", frequency: "Mon–Sat", lastCollected: at(0, 6, 24), x: 218, y: 49 },
  { id: "WL-K03", facilityId: "kitchen", name: "Cafeteria 1, students' centre", container: "240 L bin", bins: 5, capacityL: 240, stream: "General", frequency: "Mon–Sat", lastCollected: at(0, 6, 22), x: 172, y: 75 },
  { id: "WL-K04", facilityId: "kitchen", name: "Used cooking oil drums", container: "200 L drum", bins: 4, capacityL: 200, stream: "Used cooking oil", frequency: "Fortnightly, Itam Recovery", lastCollected: at(-9, 13, 40), x: 216, y: 74 },
];

/* ------------------------------------------------------------------ */
/* Pickups                                                             */
/* ------------------------------------------------------------------ */

export type InstPickupStatus = "Scheduled" | "En route" | "Arrived" | "Completed" | "Missed" | "Cancelled";

export interface InstPickup {
  id: string;
  /** days from today (Mon 5 Oct) */
  day: number;
  facilityId: FacilityId;
  label: string;
  operator: OperatorKey;
  streams: WasteStream[];
  date: string;
  window: string;
  status: InstPickupStatus;
  completedAt?: string;
  late?: number;
  kg?: number;
  bins?: number;
  driver: string;
  vehicle: string;
  signedBy?: string;
  note?: string;
  recovery?: string;
}

interface Run {
  facilityId: FacilityId;
  label: string;
  days: number[]; // 0 Sun … 6 Sat
  hh: number;
  mm: number;
  window: string;
  operator: OperatorKey;
  streams: WasteStream[];
  kg: number;
  bins: number;
  driver: string;
  vehicle: string;
  signer: string;
}

const RUNS: Run[] = [
  { facilityId: "kitchen", label: "Central kitchen, morning", days: [1, 2, 3, 4, 5, 6], hh: 6, mm: 0, window: "06:00–06:30", operator: "ibom", streams: ["Food waste", "General"], kg: 486, bins: 20, driver: "Akpan Udoh", vehicle: "AKS 641 RB", signer: "Iniobong Asuquo" },
  { facilityId: "halls", label: "Etinan and Itu halls", days: [0, 1, 2, 3, 4, 5, 6], hh: 6, mm: 30, window: "06:30–07:30", operator: "ufok", streams: ["General", "Food waste"], kg: 318, bins: 8, driver: "Daniel Inyang", vehicle: "AKS 902 QE", signer: "Porter Etim Okon" },
  { facilityId: "halls", label: "Oron and Eket halls", days: [0, 1, 2, 3, 4, 5, 6], hh: 6, mm: 30, window: "06:30–07:30", operator: "ufok", streams: ["General", "Food waste"], kg: 291, bins: 7, driver: "Daniel Inyang", vehicle: "AKS 902 QE", signer: "Porter Etim Okon" },
  { facilityId: "academic", label: "Academic block", days: [1, 3, 5], hh: 7, mm: 0, window: "07:00–07:45", operator: "ibom", streams: ["General", "Paper & cardboard"], kg: 962, bins: 23, driver: "Akpan Udoh", vehicle: "AKS 641 RB", signer: "Engr. Utibe Ntuk" },
  { facilityId: "senate", label: "Senate building", days: [1, 4], hh: 7, mm: 45, window: "07:45–08:30", operator: "ibom", streams: ["General", "Paper & cardboard"], kg: 204, bins: 9, driver: "Akpan Udoh", vehicle: "AKS 641 RB", signer: "Mrs. Nkoyo Ita" },
  { facilityId: "medical", label: "Medical campus", days: [1, 2, 3, 4, 5], hh: 8, mm: 30, window: "08:30–09:30", operator: "ibom", streams: ["Non-hazardous medical", "General", "Food waste"], kg: 221, bins: 14, driver: "Nkoyo Archibong", vehicle: "UYO 552 TK", signer: "Nurse Emem Ukpong" },
  { facilityId: "sports", label: "Sports complex, post-fixture", days: [1], hh: 9, mm: 0, window: "09:00–09:45", operator: "ibom", streams: ["General", "Recyclables"], kg: 588, bins: 9, driver: "Akpan Udoh", vehicle: "AKS 641 RB", signer: "Coach Edet Bassey" },
  { facilityId: "staff", label: "Staff quarters", days: [1, 4], hh: 10, mm: 0, window: "10:00–11:00", operator: "ibom", streams: ["General", "Recyclables"], kg: 842, bins: 41, driver: "Akpan Udoh", vehicle: "AKS 641 RB", signer: "Mr. Akpan Umoh" },
  { facilityId: "kitchen", label: "Central kitchen, afternoon", days: [1, 2, 3, 4, 5, 6], hh: 14, mm: 0, window: "14:00–14:30", operator: "ibom", streams: ["Food waste"], kg: 372, bins: 12, driver: "Bassey Effiong", vehicle: "AKS 208 MN", signer: "Iniobong Asuquo" },
];

/** Exceptions by `${offset}:${facilityId}:${hh}` */
const MISSED: Record<string, { note: string; recovery?: string }> = {
  "-24:halls:6": { note: "Truck arrived after the window; hall wardens had locked the bin shelter.", recovery: "Recovered Sat 12 Sep, 11:05" },
  "-19:academic:7": { note: "Faculty of Law bin store was padlocked; porter not on duty.", recovery: "Recovered Thu 17 Sep, 07:40" },
  "-14:staff:10": { note: "Compactor diverted to a breakdown recovery on Abak Road.", recovery: "Recovered Tue 22 Sep, 09:15" },
  "-11:medical:8": { note: "Clinic gate blocked by construction materials; van could not reach the ward annex.", recovery: "Recovered same day, 15:40" },
  "-7:sports:9": { note: "Compactor AKS 641 RB broke down on Ikpa Road after the senate run.", recovery: "Recovered Tue 29 Sep, 10:20" },
  "-3:medical:8": { note: "Van UYO 552 TK failed its morning check (brake fault). Replacement not available in time.", recovery: "Recovery combined with today's 08:30 run" },
};
const LATE: Record<string, number> = {
  "-26:kitchen:6": 22, "-22:academic:7": 35, "-17:senate:7": 18, "-12:kitchen:14": 26, "-10:halls:6": 31, "-9:staff:10": 40, "-5:medical:8": 24, "-2:kitchen:6": 19, "-6:halls:6": 17,
};

function buildPickups(): InstPickup[] {
  const list: InstPickup[] = [];
  let n = 11_420;
  for (let off = -28; off <= 7; off++) {
    const dow = new Date(2026, 9, 5 + off).getDay();
    for (const r of RUNS) {
      if (!r.days.includes(dow)) continue;
      n += 1;
      const key = `${off}:${r.facilityId}:${r.hh}`;
      const wobble = ((n * 7) % 13) - 6; // −6 … +6
      const p: InstPickup = {
        id: `PU-26-${n}`, day: off, facilityId: r.facilityId, label: r.label, operator: r.operator, streams: r.streams,
        date: at(off, r.hh, r.mm), window: r.window, status: "Scheduled", driver: r.driver, vehicle: r.vehicle,
      };
      if (off === -4) {
        p.status = "Cancelled";
        p.note = "Independence Day. Collections paused across campus by agreement.";
      } else if (MISSED[key]) {
        p.status = "Missed";
        p.note = MISSED[key]!.note;
        p.recovery = MISSED[key]!.recovery;
      } else if (off < 0) {
        const late = LATE[key];
        p.status = "Completed";
        p.late = late;
        p.completedAt = at(off, r.hh, r.mm + 16 + (late ?? 0) + (n % 11));
        p.kg = Math.max(40, Math.round(r.kg * (1 + wobble / 60)));
        p.bins = r.bins;
        p.signedBy = r.signer;
      } else if (off === 0) {
        const doneAt = TODAY_DONE[r.label];
        if (doneAt) {
          p.status = "Completed";
          p.completedAt = at(0, doneAt[0], doneAt[1]);
          p.kg = Math.round(r.kg * 1.04);
          p.bins = r.bins;
          p.signedBy = r.signer;
        } else if (r.facilityId === "senate") p.status = "En route";
        else if (r.facilityId === "medical") p.note = "Includes recovery of Friday's missed collection.";
      }
      list.push(p);
    }
  }
  return list;
}

/** Today's finished runs (Mon 5 Oct, 08:12). */
const TODAY_DONE: Record<string, [number, number]> = {
  "Central kitchen, morning": [6, 24],
  "Etinan and Itu halls": [6, 51],
  "Oron and Eket halls": [7, 16],
  "Academic block": [7, 38],
};

export const pickups: InstPickup[] = buildPickups();
export const todaysPickups = pickups.filter((p) => p.day === 0).sort((a, b) => a.date.localeCompare(b.date));

/** Ibom Hauliers' compactor route today, along campus roads. Stops are waypoint indices. */
export const ROUTE_POINTS: Array<[number, number]> = [
  [190, 96], [128, 96], [128, 176], [190, 176], [252, 176], [252, 136], [252, 176], [96, 176], [48, 176],
];
export const ROUTE_STOPS: Array<{ index: number; facilityId: FacilityId }> = [
  { index: 0, facilityId: "kitchen" },
  { index: 3, facilityId: "academic" },
  { index: 5, facilityId: "senate" },
  { index: 7, facilityId: "sports" },
  { index: 8, facilityId: "staff" },
];

/* ------------------------------------------------------------------ */
/* Departments & charge-back                                           */
/* ------------------------------------------------------------------ */

export interface Department {
  code: string;
  costCentre: string;
  name: string;
  head: string;
  rep: string;
  facilities: FacilityId[];
  share: number; // % of monthly cost
  kg: number; // September measured
}

export const departments: Department[] = [
  { code: "STA", costCentre: "CC-STA-510", name: "Student Affairs", head: "Dr. Emem Offiong, Dean of Students", rep: "Kufre Essien", facilities: ["halls"], share: 28, kg: 18_900 },
  { code: "CAT", costCentre: "CC-CAT-610", name: "Catering Services", head: "Mrs. Iniobong Asuquo, Catering manager", rep: "Iniobong Asuquo", facilities: ["kitchen"], share: 24, kg: 21_400 },
  { code: "MED", costCentre: "CC-MED-310", name: "College of Medicine", head: "Prof. Aniekan Udo, Provost", rep: "Dr. Mfon Udoh", facilities: ["medical"], share: 11.5, kg: 4_850 },
  { code: "ENG", costCentre: "CC-ENG-220", name: "Faculty of Engineering", head: "Prof. Enobong Ekpo, Dean", rep: "Engr. Utibe Ntuk", facilities: ["academic"], share: 8.5, kg: 5_480 },
  { code: "EST", costCentre: "CC-EST-700", name: "Estates & Works", head: "Engr. Ubong Akpan, Director", rep: "Engr. Ubong Akpan", facilities: ["staff"], share: 8, kg: 7_300 },
  { code: "SCI", costCentre: "CC-SCI-230", name: "Faculty of Science", head: "Prof. Ekemini Effiong, Dean", rep: "Dr. Itoro Edet", facilities: ["academic"], share: 6, kg: 4_160 },
  { code: "ADM", costCentre: "CC-ADM-100", name: "Registry & Administration", head: "Mr. Etimbuk Obot, Registrar", rep: "Mrs. Nkoyo Ita", facilities: ["senate"], share: 6, kg: 1_780 },
  { code: "SPT", costCentre: "CC-SPT-530", name: "Sports Directorate", head: "Coach Edet Bassey, Director of sports", rep: "Coach Edet Bassey", facilities: ["sports"], share: 4.5, kg: 2_950 },
  { code: "LAW", costCentre: "CC-LAW-140", name: "Faculty of Law", head: "Prof. Idara Archibong, Dean", rep: "Barr. Ini Nkanga", facilities: ["academic"], share: 3.5, kg: 2_960 },
];

export const CHARGEBACK_MONTHS = [
  { key: "2026-09", label: "September 2026", total: 2_184_600 },
  { key: "2026-08", label: "August 2026", total: 1_834_500 },
  { key: "2026-07", label: "July 2026", total: 1_486_500 },
];

/* ------------------------------------------------------------------ */
/* Services & requests                                                 */
/* ------------------------------------------------------------------ */

export interface ActiveService {
  id: string;
  facilityId: FacilityId;
  name: string;
  stream: WasteStream;
  frequency: string;
  operator: OperatorKey | "itam" | "amw";
  monthly: number;
  status: "Active" | "Paused" | "Scheduled change" | "Specialist";
  note?: string;
}

export const activeServices: ActiveService[] = [
  { id: "SV-01", facilityId: "kitchen", name: "Food waste collection", stream: "Food waste", frequency: "Mon–Sat, 06:00 and 14:00", operator: "ibom", monthly: 214_800, status: "Active" },
  { id: "SV-02", facilityId: "kitchen", name: "General waste collection", stream: "General", frequency: "Mon–Sat, 06:00", operator: "ibom", monthly: 141_600, status: "Active" },
  { id: "SV-03", facilityId: "kitchen", name: "Used cooking oil recovery", stream: "Used cooking oil", frequency: "Fortnightly", operator: "itam", monthly: 0, status: "Active", note: "Itam Recovery Ltd pays ₦210 per litre, credited on the invoice" },
  { id: "SV-04", facilityId: "halls", name: "Hall collection, 4 halls", stream: "General", frequency: "Daily, 06:30", operator: "ufok", monthly: 568_000, status: "Active", note: "Drops to Mon, Wed, Fri during semester breaks" },
  { id: "SV-05", facilityId: "halls", name: "PET bottle recycling", stream: "Recyclables", frequency: "Saturdays", operator: "ufok", monthly: 44_000, status: "Active" },
  { id: "SV-06", facilityId: "academic", name: "Scheduled collection", stream: "General", frequency: "Mon, Wed, Fri, 07:00", operator: "ibom", monthly: 336_500, status: "Active" },
  { id: "SV-07", facilityId: "academic", name: "Paper and cardboard recycling", stream: "Paper & cardboard", frequency: "Wednesdays", operator: "ibom", monthly: 38_400, status: "Active" },
  { id: "SV-08", facilityId: "academic", name: "Workshop skip exchange", stream: "General", frequency: "Fridays, or on request", operator: "ibom", monthly: 37_400, status: "Active" },
  { id: "SV-09", facilityId: "senate", name: "Scheduled collection", stream: "General", frequency: "Mon, Thu, 07:45", operator: "ibom", monthly: 64_200, status: "Active" },
  { id: "SV-10", facilityId: "senate", name: "Confidential paper collection", stream: "Paper & cardboard", frequency: "Thursdays", operator: "ibom", monthly: 32_200, status: "Active", note: "Certificate of destruction with each lift" },
  { id: "SV-11", facilityId: "medical", name: "Non-hazardous medical waste", stream: "Non-hazardous medical", frequency: "Weekdays, 08:30", operator: "ibom", monthly: 172_500, status: "Scheduled change", note: "Saturday collection added from 15 Nov if the renewal is signed" },
  { id: "SV-12", facilityId: "medical", name: "General and kitchen waste", stream: "General", frequency: "Weekdays, 08:30", operator: "ibom", monthly: 96_400, status: "Active" },
  { id: "SV-13", facilityId: "medical", name: "Hazardous medical waste", stream: "Hazardous medical (specialist)", frequency: "Tue, Fri", operator: "amw", monthly: 0, status: "Specialist", note: "Akwa MedWaste Disposal Ltd, licensed. Contracted by the teaching clinic. Slate holds the paperwork only." },
  { id: "SV-14", facilityId: "staff", name: "Kerbside collection", stream: "General", frequency: "Mon, Thu, 10:00", operator: "ibom", monthly: 186_300, status: "Active" },
  { id: "SV-15", facilityId: "staff", name: "Communal skip exchange", stream: "General", frequency: "Thursdays", operator: "ibom", monthly: 47_500, status: "Active" },
  { id: "SV-16", facilityId: "sports", name: "Post-fixture clear-up", stream: "General", frequency: "Mondays, plus fixtures", operator: "ibom", monthly: 102_900, status: "Active" },
  { id: "SV-17", facilityId: "sports", name: "Stadium PET recycling", stream: "Recyclables", frequency: "Mondays", operator: "ibom", monthly: 15_800, status: "Paused", note: "Paused while the east stand is repainted, until 19 Oct" },
];

export interface ServiceRequest {
  id: string;
  type: "Event cleanup" | "Bulk waste" | "Special collection" | "Extra collection" | "Recycling";
  title: string;
  facilityId: FacilityId;
  date: string;
  submitted: string;
  by: string;
  status: "Quote pending" | "Quote accepted" | "Scheduled" | "Completed" | "Cancelled";
  amount?: number;
  ref?: string;
}

export const serviceRequests: ServiceRequest[] = [
  { id: "SR-0415", type: "Bulk waste", title: "Old laboratory benches and stools (about 40 pieces)", facilityId: "academic", date: at(9, 10), submitted: at(-2, 15, 20), by: "Dr. Itoro Edet", status: "Quote pending" },
  { id: "SR-0412", type: "Event cleanup", title: "Matriculation ceremony, 2026/2027 session", facilityId: "sports", date: at(12, 7), submitted: at(-9, 11, 2), by: "Ekaette Inyang", status: "Quote accepted", amount: 265_000, ref: "PO-IHU-2026-0352" },
  { id: "SR-0410", type: "Extra collection", title: "Hall week clean-up, Eket Hall", facilityId: "halls", date: at(-1, 9), submitted: at(-4, 18, 40), by: "Kufre Essien", status: "Completed", amount: 37_000 },
  { id: "SR-0409", type: "Special collection", title: "Works yard renovation debris, 2 skips", facilityId: "staff", date: at(-23, 8), submitted: at(-30, 10, 14), by: "Engr. Ubong Akpan", status: "Completed", amount: 186_000, ref: "INV-IHU-2609-S3" },
  { id: "SR-0401", type: "Event cleanup", title: "Inter-faculty games final", facilityId: "sports", date: at(-36, 16), submitted: at(-44, 9, 31), by: "Coach Edet Bassey", status: "Completed", amount: 86_100 },
];

/* ------------------------------------------------------------------ */
/* Contracts                                                           */
/* ------------------------------------------------------------------ */

export interface ContractDoc {
  name: string;
  version: string;
  date: string;
  size: string;
  status: "Signed" | "Draft" | "Superseded" | "Current";
}

export interface InstContract {
  id: string;
  title: string;
  party: string;
  partyRole: string;
  via: "Slate" | "Direct (documented)";
  scope: string[];
  excludes?: string[];
  facilities: FacilityId[];
  start: string;
  end: string;
  status: "Renewal approaching" | "Active" | "Completed" | "Specialist";
  monthly: number;
  pricing: Array<{ label: string; value: string }>;
  sla: Array<{ label: string; target: string; actual?: string; ok?: boolean }>;
  paymentTerms: string;
  version: string;
  docs: ContractDoc[];
  versions: Array<{ version: string; date: string; title: string; by: string; state: "done" | "current" | "upcoming" }>;
}

export const contracts: InstContract[] = [
  {
    id: "CT-UYO-014", title: "Institutional waste service, main and medical campus", party: OPERATORS.ibom.name, partyRole: "Operator, contracted and managed by Slate", via: "Slate",
    scope: [
      "Scheduled collection at six facilities: academic block, senate, medical campus, staff quarters, sports complex, central kitchen",
      "Non-hazardous medical waste from the teaching clinic, bagged and tagged at source",
      "Food waste from the central kitchen and clinic kitchen, twice daily",
      "Disposal at the Use Offot transfer station, with a monthly disposal certificate",
      "Monthly service report and quarterly review with Estates & Works",
    ],
    excludes: ["Hazardous medical waste: sharps, infectious, anatomical and pharmaceutical. Handled by a licensed specialist under a separate agreement.", "Chemical laboratory waste"],
    facilities: ["academic", "senate", "medical", "staff", "sports", "kitchen"],
    start: "2026-04-15", end: "2026-11-14", status: "Renewal approaching", monthly: 1_486_500,
    pricing: [
      { label: "Monthly service fee", value: "₦1,486,500" },
      { label: "Included tonnage", value: "58 t a month" },
      { label: "Excess tonnage", value: "₦14,200 per tonne" },
      { label: "Extra collection", value: "₦18,500 per lift" },
      { label: "Special collections", value: "Quoted per job" },
      { label: "Withholding tax", value: "5% deducted at source" },
    ],
    sla: [
      { label: "Collection completion", target: "95% each month", actual: "96.4% in September", ok: true },
      { label: "Missed collection recovery", target: "Within 24 hours", actual: "4 of 5 in September", ok: false },
      { label: "Complaint response", target: "4 working hours", actual: "2 h 40 min average", ok: true },
      { label: "Disposal certificate", target: "By the 5th of each month", actual: "September's received 3 Oct", ok: true },
      { label: "Service credit", target: "5% of the monthly fee below 95% completion" },
    ],
    paymentTerms: "Within 14 days of invoice, by Remita or bank transfer",
    version: "v1.2",
    docs: [
      { name: "Master service agreement", version: "v1.0", date: "2026-04-10", size: "1.4 MB", status: "Signed" },
      { name: "Schedule A, facilities and frequencies", version: "v1.2", date: "2026-09-01", size: "310 KB", status: "Current" },
      { name: "Schedule B, pricing", version: "v1.0", date: "2026-04-10", size: "180 KB", status: "Signed" },
      { name: "Schedule C, service levels and credits", version: "v1.0", date: "2026-04-10", size: "240 KB", status: "Signed" },
      { name: "Amendment 1, sports complex post-fixture clear-up", version: "v1.1", date: "2026-06-02", size: "96 KB", status: "Signed" },
      { name: "Amendment 2, halls moved to CT-UYO-016", version: "v1.2", date: "2026-09-01", size: "102 KB", status: "Signed" },
      { name: "Renewal proposal, 15 Nov 2026 to 14 Nov 2027", version: "v2.0", date: "2026-09-28", size: "520 KB", status: "Draft" },
    ],
    versions: [
      { version: "v1.0", date: "2026-04-10", title: "Signed after tender IHU/TB/RFQ/2026/011", by: "Dr. Nsikak Okon and Slate", state: "done" },
      { version: "v1.1", date: "2026-06-02", title: "Added post-fixture clear-up at the sports complex", by: "Dr. Nsikak Okon", state: "done" },
      { version: "v1.2", date: "2026-09-01", title: "Halls of residence moved to a separate contract with Ufok", by: "Dr. Nsikak Okon", state: "done" },
      { version: "v2.0", date: "2026-09-28", title: "Renewal proposal sent by Slate, awaiting your decision", by: "Slate institutional team", state: "current" },
    ],
  },
  {
    id: "CT-UYO-016", title: "Halls of residence collection", party: OPERATORS.ufok.name, partyRole: "Operator, contracted and managed by Slate", via: "Slate",
    scope: [
      "Daily collection from four hall bin shelters, 06:30 to 07:30",
      "Saturday PET bottle collection from the halls walkway cages",
      "Reduced frequency (Mon, Wed, Fri) during semester breaks, with a matching fee reduction",
      "Overflow response within 6 hours when a hall warden reports it",
    ],
    facilities: ["halls"], start: "2026-09-01", end: "2027-08-31", status: "Active", monthly: 612_000,
    pricing: [
      { label: "Monthly service fee", value: "₦612,000" },
      { label: "Semester-break fee", value: "₦428,400 (−30%)" },
      { label: "Overflow call-out", value: "₦12,500 per call-out" },
      { label: "Withholding tax", value: "5% deducted at source" },
    ],
    sla: [
      { label: "Collection completion", target: "97% each month", actual: "98.3% in September", ok: true },
      { label: "Overflow response", target: "Within 6 hours", actual: "3 h 15 min average", ok: true },
      { label: "Collection window", target: "Done by 07:30", actual: "93% on time", ok: true },
    ],
    paymentTerms: "Within 14 days of invoice, by Remita or bank transfer",
    version: "v1.0",
    docs: [
      { name: "Service agreement, halls of residence", version: "v1.0", date: "2026-08-24", size: "860 KB", status: "Signed" },
      { name: "Schedule A, halls, bin points and calendar", version: "v1.0", date: "2026-08-24", size: "210 KB", status: "Signed" },
    ],
    versions: [
      { version: "v1.0", date: "2026-08-24", title: "Signed for the 2026/2027 session", by: "Dr. Nsikak Okon and Slate", state: "done" },
    ],
  },
  {
    id: "AMW-IHU-2026", title: "Hazardous medical waste (specialist)", party: "Akwa MedWaste Disposal Ltd", partyRole: "Licensed specialist, contracted directly by the teaching clinic", via: "Direct (documented)",
    scope: [
      "Collection of sharps, infectious, anatomical and pharmaceutical waste from the hazardous waste holding room, Tue and Fri",
      "High-temperature incineration at a licensed facility, with a consignment note per lift",
      "Slate holds the licence and consignment notes for compliance reporting only",
    ],
    facilities: ["medical"], start: "2026-01-01", end: "2026-12-31", status: "Specialist", monthly: 0,
    pricing: [{ label: "Billing", value: "Billed to the teaching clinic directly, not through Slate" }],
    sla: [{ label: "Consignment notes", target: "Quarterly upload to Slate", actual: "Q3 notes not yet uploaded", ok: false }],
    paymentTerms: "Not billed through Slate",
    version: "—",
    docs: [
      { name: "Specialist service agreement (copy)", version: "2026", date: "2026-01-06", size: "740 KB", status: "Signed" },
      { name: "NESREA licence, hazardous medical waste", version: "2025–26", date: "2025-11-20", size: "380 KB", status: "Current" },
    ],
    versions: [{ version: "2026", date: "2026-01-06", title: "Copy filed by the teaching clinic", by: "Dr. Mfon Udoh", state: "done" }],
  },
  {
    id: "CT-UYO-009", title: "Campus pilot, two weeks", party: OPERATORS.ibom.name, partyRole: "Operator, contracted and managed by Slate", via: "Slate",
    scope: ["Two-week trial collection at the academic block, senate and central kitchen", "Baseline weighing to size the main contract"],
    facilities: ["academic", "senate", "kitchen"], start: "2026-04-01", end: "2026-04-14", status: "Completed", monthly: 240_000,
    pricing: [{ label: "Pilot fee", value: "₦240,000, one-off" }],
    sla: [{ label: "Collection completion", target: "90%", actual: "100%", ok: true }],
    paymentTerms: "Paid on completion",
    version: "v1.0",
    docs: [
      { name: "Pilot letter of agreement", version: "v1.0", date: "2026-03-30", size: "120 KB", status: "Signed" },
      { name: "Pilot baseline report", version: "v1.0", date: "2026-04-16", size: "2.2 MB", status: "Signed" },
    ],
    versions: [{ version: "v1.0", date: "2026-03-30", title: "Pilot agreed", by: "Dr. Nsikak Okon", state: "done" }],
  },
];

export const RENEWAL = {
  contract: "CT-UYO-014",
  decisionDue: "2026-10-31",
  expires: "2026-11-14",
  proposedStart: "2026-11-15",
  proposedEnd: "2027-11-14",
  proposedMonthly: 1_583_100,
  changes: [
    { term: "Term", current: "7 months, to 14 Nov 2026", proposed: "12 months, to 14 Nov 2027" },
    { term: "Monthly fee", current: "₦1,486,500", proposed: "₦1,583,100", delta: "+6.5%" },
    { term: "Included tonnage", current: "58 t", proposed: "62 t" },
    { term: "Completion target", current: "95%", proposed: "96%" },
    { term: "Medical campus", current: "Weekdays", proposed: "Mon–Sat" },
    { term: "Missed recovery, medical", current: "24 hours", proposed: "12 hours" },
    { term: "Semester breaks", current: "Full fee", proposed: "−20% fee, reduced frequency" },
    { term: "Payment terms", current: "14 days", proposed: "30 days" },
  ],
  why: "Diesel is up 18% since April, and the medical campus needs a Saturday lift. The semester-break reduction offsets most of the increase across a full year.",
};

/* ------------------------------------------------------------------ */
/* Procurement                                                         */
/* ------------------------------------------------------------------ */

export const procurement = {
  vendor: { name: "Slate Technologies Ltd", number: "IHU/VR/2026/0417", category: "Environmental and sanitation services", registered: "2026-03-03", validTo: "2026-12-31", status: "Valid" },
  renewal: {
    ref: "IHU/TB/REN/2026/037",
    title: "Renewal of campus waste management services (CT-UYO-014)",
    method: "Direct renewal, tenders board approval",
    value: 18_997_200,
    steps: [
      { title: "Requisition", who: "Engr. Ubong Akpan, Estates & Works", date: "2026-10-02", state: "done" as const, note: "REQ-EW-2026-0912 raised for 12 months at ₦1,583,100 a month" },
      { title: "Budget approval", who: "Mrs. Imaobong Etim, Deputy Bursar", date: "2026-10-09", state: "current" as const, note: "Waiting on the 2027 recurrent estimate for line 22021002" },
      { title: "Tenders board", who: "University Tenders Board", date: "2026-10-22", state: "upcoming" as const, note: "Listed for the 22 Oct sitting" },
      { title: "Award", who: "Vice-Chancellor's office", date: "2026-10-27", state: "upcoming" as const, note: "Award letter to Slate" },
      { title: "Contract signed", who: "Dr. Nsikak Okon and Slate", date: "2026-10-31", state: "upcoming" as const, note: "Needed before 14 Nov to avoid a gap in service" },
    ],
  },
  original: {
    ref: "IHU/TB/RFQ/2026/011",
    title: "Request for quotation: campus waste management services",
    method: "Request for quotation, 4 bids",
    awarded: "2026-04-02",
    value: 10_405_500,
    bids: [
      { bidder: "Slate Technologies Ltd", amount: 1_486_500, score: 86, result: "Awarded" },
      { bidder: "Cleanfield Environmental Ltd", amount: 1_392_000, score: 71, result: "Not awarded" },
      { bidder: "Aqua Waste Nigeria", amount: 1_640_000, score: 68, result: "Not awarded" },
      { bidder: "Uyo Sanitation Co-operative", amount: 1_210_000, score: 52, result: "Disqualified" },
    ],
    steps: [
      { title: "Requisition", date: "2026-03-09" },
      { title: "Budget approval", date: "2026-03-13" },
      { title: "Tenders board", date: "2026-03-27" },
      { title: "Award", date: "2026-04-02" },
      { title: "Contract signed", date: "2026-04-10" },
    ],
  },
};

export interface PurchaseOrder {
  id: string;
  description: string;
  contract: string;
  line: string;
  raised: string;
  amount: number;
  invoiced: number;
  status: "Open" | "Closed" | "Partial" | "Draft";
}

export const purchaseOrders: PurchaseOrder[] = [
  { id: "PO-IHU-2026-0352", description: "Matriculation ceremony cleanup", contract: "SR-0412", line: "22021002", raised: "2026-09-28", amount: 265_000, invoiced: 0, status: "Open" },
  { id: "PO-IHU-2026-0331", description: "Main contract, 1 Oct to 14 Nov 2026", contract: "CT-UYO-014", line: "22021002", raised: "2026-09-22", amount: 2_180_200, invoiced: 1_486_500, status: "Partial" },
  { id: "PO-IHU-2026-0297", description: "Halls collection, 2026/2027 session", contract: "CT-UYO-016", line: "22021002", raised: "2026-08-24", amount: 7_344_000, invoiced: 1_224_000, status: "Partial" },
  { id: "PO-IHU-2026-0281", description: "Works yard renovation debris", contract: "SR-0409", line: "23050101", raised: "2026-09-04", amount: 186_000, invoiced: 186_000, status: "Closed" },
  { id: "PO-IHU-2026-0254", description: "Main contract, July to September", contract: "CT-UYO-014", line: "22021002", raised: "2026-06-26", amount: 4_459_500, invoiced: 4_459_500, status: "Closed" },
  { id: "PO-IHU-2026-0188", description: "Main contract, 15 April to June", contract: "CT-UYO-014", line: "22021002", raised: "2026-04-08", amount: 3_765_800, invoiced: 3_765_800, status: "Closed" },
  { id: "PO-IHU-2026-0179", description: "Campus pilot, two weeks", contract: "CT-UYO-009", line: "22021002", raised: "2026-03-30", amount: 240_000, invoiced: 240_000, status: "Closed" },
];

export const budgetLines = [
  { code: "22021002", name: "Cleaning, fumigation and waste management (recurrent)", holder: "Estates & Works", budget: 19_800_000, committed: 14_095_000, spent: 11_555_900 },
  { code: "23050101", name: "Rehabilitation and repairs, works yard (capital)", holder: "Estates & Works", budget: 4_500_000, committed: 186_000, spent: 186_000 },
  { code: "22020906", name: "Event and ceremonies support", holder: "Registry", budget: 1_200_000, committed: 351_100, spent: 86_100 },
];

export interface ProcDoc {
  id: string;
  name: string;
  group: "Tender" | "Vendor" | "Statutory";
  date: string;
  size: string;
  expires?: string;
}

export const procurementDocs: ProcDoc[] = [
  { id: "PD-01", name: "Tenders board minutes, 27 Mar 2026 (extract)", group: "Tender", date: "2026-03-30", size: "410 KB" },
  { id: "PD-02", name: "Bid evaluation report, RFQ/2026/011", group: "Tender", date: "2026-03-26", size: "1.1 MB" },
  { id: "PD-03", name: "Letter of award to Slate", group: "Tender", date: "2026-04-02", size: "160 KB" },
  { id: "PD-04", name: "Requisition REQ-EW-2026-0912 (renewal)", group: "Tender", date: "2026-10-02", size: "88 KB" },
  { id: "PD-05", name: "Vendor registration certificate", group: "Vendor", date: "2026-03-03", size: "210 KB", expires: "2026-12-31" },
  { id: "PD-06", name: "CAC certificate of incorporation, Slate", group: "Vendor", date: "2026-03-03", size: "330 KB" },
  { id: "PD-07", name: "Tax clearance certificate 2026, Slate", group: "Statutory", date: "2026-03-03", size: "190 KB", expires: "2026-12-31" },
  { id: "PD-08", name: "PENCOM compliance certificate", group: "Statutory", date: "2026-03-03", size: "150 KB", expires: "2026-12-31" },
  { id: "PD-09", name: "ITF compliance certificate", group: "Statutory", date: "2026-03-03", size: "140 KB", expires: "2026-12-31" },
  { id: "PD-10", name: "NSITF compliance certificate", group: "Statutory", date: "2026-03-03", size: "138 KB", expires: "2026-12-31" },
];

/* ------------------------------------------------------------------ */
/* Billing                                                             */
/* ------------------------------------------------------------------ */

export interface InstInvoice {
  id: string;
  title: string;
  contract: string;
  period: string;
  issued: string;
  due: string;
  amount: number;
  paid: number;
  status: "Paid" | "Sent" | "Overdue" | "Partial";
  lines: Array<{ label: string; qty: number; unit: number }>;
}

export const invoices: InstInvoice[] = [
  { id: "INV-IHU-2610-01", title: "Main contract, October", contract: "CT-UYO-014", period: "October 2026", issued: "2026-10-01", due: "2026-10-15", amount: 1_486_500, paid: 0, status: "Sent", lines: [{ label: "Monthly service fee, six facilities", qty: 1, unit: 1_486_500 }] },
  { id: "INV-IHU-2610-02", title: "Halls collection, October", contract: "CT-UYO-016", period: "October 2026", issued: "2026-10-01", due: "2026-10-15", amount: 612_000, paid: 0, status: "Sent", lines: [{ label: "Monthly service fee, four halls", qty: 1, unit: 612_000 }] },
  { id: "INV-IHU-2609-S3", title: "Works yard renovation debris", contract: "SR-0409", period: "September 2026", issued: "2026-09-14", due: "2026-09-28", amount: 186_000, paid: 0, status: "Overdue", lines: [{ label: "6 m³ skip, delivery and removal", qty: 2, unit: 78_000 }, { label: "Disposal at Use Offot transfer station", qty: 2, unit: 15_000 }] },
  { id: "INV-IHU-2609-02", title: "Halls collection, September", contract: "CT-UYO-016", period: "September 2026", issued: "2026-09-01", due: "2026-09-15", amount: 612_000, paid: 400_000, status: "Partial", lines: [{ label: "Monthly service fee, four halls", qty: 1, unit: 612_000 }] },
  { id: "INV-IHU-2609-01", title: "Main contract, September", contract: "CT-UYO-014", period: "September 2026", issued: "2026-09-01", due: "2026-09-15", amount: 1_486_500, paid: 1_486_500, status: "Paid", lines: [{ label: "Monthly service fee, six facilities", qty: 1, unit: 1_486_500 }] },
  { id: "INV-IHU-2609-X1", title: "Extra collections, matriculation week", contract: "CT-UYO-014", period: "September 2026", issued: "2026-09-07", due: "2026-09-21", amount: 86_100, paid: 86_100, status: "Paid", lines: [{ label: "Extra collection", qty: 4, unit: 18_500 }, { label: "Excess tonnage", qty: 1, unit: 12_100 }] },
  { id: "INV-IHU-2608-S1", title: "Convocation 2026 cleanup", contract: "SR-0388", period: "August 2026", issued: "2026-08-10", due: "2026-08-24", amount: 348_000, paid: 348_000, status: "Paid", lines: [{ label: "Event cleanup, three days", qty: 1, unit: 348_000 }] },
  { id: "INV-IHU-2608-01", title: "Main contract, August", contract: "CT-UYO-014", period: "August 2026", issued: "2026-08-01", due: "2026-08-15", amount: 1_486_500, paid: 1_486_500, status: "Paid", lines: [{ label: "Monthly service fee", qty: 1, unit: 1_486_500 }] },
  { id: "INV-IHU-2607-01", title: "Main contract, July", contract: "CT-UYO-014", period: "July 2026", issued: "2026-07-01", due: "2026-07-15", amount: 1_486_500, paid: 1_486_500, status: "Paid", lines: [{ label: "Monthly service fee", qty: 1, unit: 1_486_500 }] },
  { id: "INV-IHU-2606-01", title: "Main contract, June", contract: "CT-UYO-014", period: "June 2026", issued: "2026-06-01", due: "2026-06-15", amount: 1_486_500, paid: 1_486_500, status: "Paid", lines: [{ label: "Monthly service fee", qty: 1, unit: 1_486_500 }] },
  { id: "INV-IHU-2605-01", title: "Main contract, May", contract: "CT-UYO-014", period: "May 2026", issued: "2026-05-01", due: "2026-05-15", amount: 1_486_500, paid: 1_486_500, status: "Paid", lines: [{ label: "Monthly service fee", qty: 1, unit: 1_486_500 }] },
  { id: "INV-IHU-2604-01", title: "Main contract, 15–30 April", contract: "CT-UYO-014", period: "April 2026", issued: "2026-05-01", due: "2026-05-15", amount: 792_800, paid: 792_800, status: "Paid", lines: [{ label: "Monthly service fee, pro-rated 16 days", qty: 1, unit: 792_800 }] },
];

export interface InstPayment {
  id: string;
  invoice: string;
  date: string;
  amount: number;
  method: string;
  ref: string;
  status: "Successful" | "Pending";
}

export const payments: InstPayment[] = [
  { id: "TXN-9KD2RW", invoice: "INV-IHU-2609-02", date: "2026-09-25", amount: 400_000, method: "Remita", ref: "RRR 3104-9921-7735", status: "Successful" },
  { id: "TXN-8PV7QA", invoice: "INV-IHU-2609-01", date: "2026-09-12", amount: 1_486_500, method: "Remita", ref: "RRR 3104-8812-0046", status: "Successful" },
  { id: "TXN-8MC4LE", invoice: "INV-IHU-2609-X1", date: "2026-09-18", amount: 86_100, method: "Bank transfer", ref: "Zenith Bank · FT26261ZK90", status: "Successful" },
  { id: "TXN-7XR2HN", invoice: "INV-IHU-2608-S1", date: "2026-08-21", amount: 348_000, method: "Bank transfer", ref: "Zenith Bank · FT26233ZQ14", status: "Successful" },
  { id: "TXN-7GT9DK", invoice: "INV-IHU-2608-01", date: "2026-08-13", amount: 1_486_500, method: "Remita", ref: "RRR 3104-7290-5518", status: "Successful" },
  { id: "TXN-6WS3BF", invoice: "INV-IHU-2607-01", date: "2026-07-14", amount: 1_486_500, method: "Remita", ref: "RRR 3104-6018-3302", status: "Successful" },
  { id: "TXN-5QN8TU", invoice: "INV-IHU-2606-01", date: "2026-06-12", amount: 1_486_500, method: "Remita", ref: "RRR 3104-4977-1209", status: "Successful" },
  { id: "TXN-4HM6CY", invoice: "INV-IHU-2605-01", date: "2026-05-14", amount: 1_486_500, method: "Remita", ref: "RRR 3104-3821-6650", status: "Successful" },
  { id: "TXN-4AB1PZ", invoice: "INV-IHU-2604-01", date: "2026-05-14", amount: 792_800, method: "Remita", ref: "RRR 3104-3821-6651", status: "Successful" },
];

export const BUDGET = { total: 19_800_000, start: "2026-04-15", end: "2026-12-31", forecast: 16_010_400 };

/* ------------------------------------------------------------------ */
/* Compliance                                                          */
/* ------------------------------------------------------------------ */

export interface ComplianceDoc {
  id: string;
  name: string;
  category: "Permits" | "Disposal certificates" | "Specialist" | "Audits" | "Safety & insurance";
  holder: string;
  issuer: string;
  issued: string;
  expires?: string;
  review?: string;
  status: "Verified" | "Expiring" | "Expired" | "Pending";
  version: number;
  size: string;
  note?: string;
  history: Array<{ version: number; date: string; by: string; note: string }>;
}

export const complianceDocs: ComplianceDoc[] = [
  { id: "CD-13", name: "Disposal site agreement, Use Offot transfer station", category: "Permits", holder: "Ibom Hauliers", issuer: "Uyo Capital City Development Authority", issued: "2026-04-03", expires: "2026-10-12", status: "Expiring", version: 1, size: "640 KB", note: "Ibom Hauliers say the renewal is with UCCDA. Without it, disposal certificates can't be issued after 12 Oct.", history: [{ version: 1, date: "2026-04-03", by: "Slate compliance", note: "Uploaded and verified" }] },
  { id: "CD-03", name: "Waste-handling permit, operator", category: "Permits", holder: "Ufok Environmental", issuer: "AKSEPA", issued: "2025-11-01", expires: "2026-10-31", status: "Expiring", version: 2, size: "1.2 MB", history: [{ version: 2, date: "2026-02-20", by: "Slate compliance", note: "Re-issued with updated fleet list" }, { version: 1, date: "2025-11-04", by: "Slate compliance", note: "Uploaded and verified" }] },
  { id: "CD-10", name: "Vehicle roadworthiness, 3 vehicles", category: "Safety & insurance", holder: "Ibom Hauliers", issuer: "Vehicle Inspection Office, Uyo", issued: "2025-11-12", expires: "2026-11-12", status: "Expiring", version: 1, size: "2.1 MB", history: [{ version: 1, date: "2026-04-03", by: "Slate compliance", note: "Uploaded and verified" }] },
  { id: "CD-04", name: "Hazardous medical waste licence", category: "Specialist", holder: "Akwa MedWaste Disposal Ltd", issuer: "NESREA", issued: "2025-11-20", expires: "2026-11-19", status: "Expiring", version: 1, size: "380 KB", note: "Required for the teaching clinic's hazardous stream. Not collected by Slate.", history: [{ version: 1, date: "2026-01-06", by: "Dr. Mfon Udoh", note: "Copy filed by the teaching clinic" }] },
  { id: "CD-08", name: "Annual environmental audit report, 2025", category: "Audits", holder: "Ikpa Hills University", issuer: "AKSEPA", issued: "2025-10-01", expires: "2026-09-30", status: "Expired", version: 1, size: "4.8 MB", note: "The 2026 audit is booked with Eko Environmental Consult for 21 Oct.", history: [{ version: 1, date: "2025-10-06", by: "Engr. Ubong Akpan", note: "Uploaded" }] },
  { id: "CD-07", name: "Hazardous waste consignment notes, Q3 2026", category: "Specialist", holder: "Akwa MedWaste Disposal Ltd", issuer: "Akwa MedWaste Disposal Ltd", issued: "2026-09-30", status: "Pending", version: 0, size: "—", note: "Due by 15 Oct. The teaching clinic holds the originals.", history: [] },
  { id: "CD-05", name: "Disposal certificate, September 2026", category: "Disposal certificates", holder: "Ibom Hauliers", issuer: "Use Offot transfer station", issued: "2026-10-03", status: "Verified", version: 1, size: "290 KB", note: "62.4 t received from Ikpa Hills University across 104 loads.", history: [{ version: 1, date: "2026-10-03", by: "Slate compliance", note: "Matched to weighbridge tickets and verified" }] },
  { id: "CD-06", name: "Disposal certificate, August 2026", category: "Disposal certificates", holder: "Ibom Hauliers", issuer: "Use Offot transfer station", issued: "2026-09-04", status: "Verified", version: 1, size: "276 KB", history: [{ version: 1, date: "2026-09-04", by: "Slate compliance", note: "Matched to weighbridge tickets and verified" }] },
  { id: "CD-01", name: "Waste generator registration", category: "Permits", holder: "Ikpa Hills University", issuer: "AKSEPA", issued: "2026-03-31", expires: "2027-03-31", status: "Verified", version: 2, size: "520 KB", history: [{ version: 2, date: "2026-04-02", by: "Engr. Ubong Akpan", note: "Renewed for 2026/27" }, { version: 1, date: "2025-04-01", by: "Engr. Ubong Akpan", note: "First registration" }] },
  { id: "CD-02", name: "Waste-handling permit, operator", category: "Permits", holder: "Ibom Hauliers", issuer: "AKSEPA", issued: "2026-03-01", expires: "2027-02-28", status: "Verified", version: 1, size: "1.0 MB", history: [{ version: 1, date: "2026-04-03", by: "Slate compliance", note: "Uploaded and verified" }] },
  { id: "CD-09", name: "Crew training and PPE records", category: "Safety & insurance", holder: "Ibom Hauliers", issuer: "Ibom Hauliers HSE", issued: "2026-07-31", review: "2027-01-31", status: "Verified", version: 3, size: "1.7 MB", history: [{ version: 3, date: "2026-08-02", by: "Slate compliance", note: "Medical-waste handling refresher added" }, { version: 2, date: "2026-05-01", by: "Slate compliance", note: "Two new crew members" }, { version: 1, date: "2026-04-03", by: "Slate compliance", note: "Uploaded and verified" }] },
  { id: "CD-11", name: "Public liability insurance, ₦50m", category: "Safety & insurance", holder: "Slate Technologies Ltd", issuer: "Leadway Assurance", issued: "2026-04-01", expires: "2027-03-31", status: "Verified", version: 1, size: "640 KB", history: [{ version: 1, date: "2026-04-01", by: "Slate compliance", note: "Uploaded and verified" }] },
  { id: "CD-12", name: "Clinical waste segregation procedure", category: "Specialist", holder: "Teaching clinic", issuer: "Ikpa Hills University", issued: "2026-01-15", review: "2027-01-15", status: "Verified", version: 2, size: "310 KB", history: [{ version: 2, date: "2026-06-11", by: "Dr. Mfon Udoh", note: "Colour coding updated for the ward annex" }, { version: 1, date: "2026-01-15", by: "Dr. Mfon Udoh", note: "Uploaded" }] },
];

export const complianceAudit = [
  { who: "Slate compliance", what: "Verified Disposal certificate, September 2026", when: at(-2, 11, 14) },
  { who: "Engr. Ubong Akpan", what: "Booked the 2026 environmental audit for 21 Oct", when: at(-3, 16, 2) },
  { who: "Slate compliance", what: "Flagged Disposal site agreement as expiring in 14 days", when: at(-7, 9, 0) },
  { who: "Dr. Mfon Udoh", what: "Viewed Hazardous medical waste licence", when: at(-8, 13, 47) },
  { who: "Slate compliance", what: "Marked Annual environmental audit report, 2025 as expired", when: at(-5, 0, 1) },
  { who: "Itoro Bassey", what: "Exported the compliance register for internal audit", when: at(-12, 10, 25) },
];

/* ------------------------------------------------------------------ */
/* Team                                                                */
/* ------------------------------------------------------------------ */

export type TeamRole = "Owner" | "Admin" | "Finance" | "Operations" | "Viewer" | "Department rep";
export const ROLES: TeamRole[] = ["Owner", "Admin", "Finance", "Operations", "Viewer", "Department rep"];

export interface Member {
  id: string;
  name: string;
  title: string;
  email: string;
  role: TeamRole;
  department?: string;
  lastActive?: string;
  status: "Active" | "Invited";
}

export const members: Member[] = [
  { id: "m1", name: "Dr. Nsikak Okon", title: "Director of Facilities", email: "facilities@ikpahills.edu.ng", role: "Owner", lastActive: at(0, 8, 9), status: "Active" },
  { id: "m2", name: "Ekaette Inyang", title: "Procurement officer", email: "e.inyang@ikpahills.edu.ng", role: "Admin", lastActive: at(-1, 17, 40), status: "Active" },
  { id: "m3", name: "Mrs. Imaobong Etim", title: "Deputy Bursar", email: "i.etim@ikpahills.edu.ng", role: "Finance", lastActive: at(-2, 12, 5), status: "Active" },
  { id: "m4", name: "Engr. Ubong Akpan", title: "Director, Estates & Works", email: "u.akpan@ikpahills.edu.ng", role: "Operations", department: "Estates & Works", lastActive: at(0, 7, 31), status: "Active" },
  { id: "m5", name: "Dr. Mfon Udoh", title: "Medical director, teaching clinic", email: "m.udoh@ikpahills.edu.ng", role: "Department rep", department: "College of Medicine", lastActive: at(-3, 9, 50), status: "Active" },
  { id: "m6", name: "Kufre Essien", title: "Chief hall warden", email: "k.essien@ikpahills.edu.ng", role: "Department rep", department: "Student Affairs", lastActive: at(0, 6, 58), status: "Active" },
  { id: "m7", name: "Mrs. Iniobong Asuquo", title: "Catering manager", email: "catering@ikpahills.edu.ng", role: "Department rep", department: "Catering Services", lastActive: at(-1, 14, 22), status: "Active" },
  { id: "m8", name: "Prof. Enobong Ekpo", title: "Dean of Engineering", email: "dean.eng@ikpahills.edu.ng", role: "Viewer", lastActive: at(-16, 11, 3), status: "Active" },
  { id: "m9", name: "Itoro Bassey", title: "Internal audit", email: "audit@ikpahills.edu.ng", role: "Viewer", lastActive: at(-12, 10, 25), status: "Active" },
  { id: "m10", name: "Idara Ntuk", title: "Sanitation supervisor", email: "i.ntuk@ikpahills.edu.ng", role: "Operations", department: "Estates & Works", status: "Invited", lastActive: at(-3, 10, 0) },
];

export const PERMISSIONS: Array<{ key: string; label: string; roles: TeamRole[]; note?: string }> = [
  { key: "view", label: "See schedules, pickups and reports", roles: ["Owner", "Admin", "Finance", "Operations", "Viewer", "Department rep"], note: "Department reps see their own facilities" },
  { key: "request", label: "Request services and special collections", roles: ["Owner", "Admin", "Operations", "Department rep"] },
  { key: "facilities", label: "Add facilities and waste locations", roles: ["Owner", "Admin", "Operations"] },
  { key: "pay", label: "Pay invoices and download statements", roles: ["Owner", "Finance"] },
  { key: "allocation", label: "Edit department cost allocation", roles: ["Owner", "Finance"] },
  { key: "procurement", label: "Manage procurement records and POs", roles: ["Owner", "Admin", "Finance"] },
  { key: "contracts", label: "Approve and sign contract renewals", roles: ["Owner"] },
  { key: "compliance", label: "Upload compliance documents", roles: ["Owner", "Admin", "Operations"] },
  { key: "team", label: "Invite and remove team members", roles: ["Owner", "Admin"] },
  { key: "export", label: "Export reports and registers", roles: ["Owner", "Admin", "Finance", "Viewer"] },
];

/* ------------------------------------------------------------------ */
/* Reports                                                             */
/* ------------------------------------------------------------------ */

export const REPORT_MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
export const reportSeries = {
  completion: [93.8, 95.6, 96.9, 97.4, 96.2, 97.1],
  onTime: [86.0, 88.9, 90.4, 92.1, 90.8, 91.8],
  tonnes: [31.2, 58.6, 61.9, 44.8, 52.3, 69.8],
  missed: [3, 4, 2, 2, 5, 5],
  diverted: [8.1, 13.4, 15.2, 12.0, 14.9, 19.6],
  cost: [792_800, 1_486_500, 1_486_500, 1_486_500, 1_834_500, 2_184_600],
};

/** September volume by facility × category (kg). */
export const volumeByFacility: Array<{ facilityId: FacilityId; general: number; food: number; recyclables: number; medical: number }> = [
  { facilityId: "kitchen", general: 6_200, food: 14_100, recyclables: 1_100, medical: 0 },
  { facilityId: "halls", general: 12_400, food: 4_300, recyclables: 2_200, medical: 0 },
  { facilityId: "academic", general: 8_900, food: 0, recyclables: 3_700, medical: 0 },
  { facilityId: "staff", general: 6_100, food: 0, recyclables: 1_200, medical: 0 },
  { facilityId: "medical", general: 2_710, food: 900, recyclables: 0, medical: 1_240 },
  { facilityId: "sports", general: 2_150, food: 0, recyclables: 800, medical: 0 },
  { facilityId: "senate", general: 960, food: 0, recyclables: 820, medical: 0 },
];
