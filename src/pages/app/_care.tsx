/**
 * Customer care & community — page-local data and helpers shared by
 * Community, CommunityProject, Recycling, Complaints, ComplaintDetail,
 * Profile, Settings, Notifications and Support.
 *
 * Everything here extends `@/data` for the signed-in household
 * (Imaobong Akpan, 14 Ewet Housing Estate). The demo clock is DEMO_NOW.
 */
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { DEMO_NOW, formatDate } from "@/lib/format";
import type { Tone } from "@/components/ui";
import { FIRST, LAST, customerNotifications, me, myComplaints, type CommunityProject, type Complaint, type NotificationItem } from "@/data";

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

/** ISO string `offset` days from Mon 5 Oct 2026 at hh:mm (WAT). */
export const cday = (offset: number, hh = 8, mm = 0) => {
  const d = new Date("2026-10-05T00:00:00+01:00");
  d.setDate(d.getDate() + offset);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
};

/** A clock that starts at DEMO_NOW and advances in real time. */
export function useDemoClock(stepMs = 1000) {
  const [now, setNow] = useState(() => DEMO_NOW.getTime());
  useEffect(() => {
    const started = Date.now();
    const t = setInterval(() => setNow(DEMO_NOW.getTime() + (Date.now() - started)), stepMs);
    return () => clearInterval(t);
  }, [stepMs]);
  return now;
}

/** "3h 40m", "1d 4h", "26m" */
export function formatSpan(ms: number) {
  const m = Math.max(0, Math.round(ms / 60_000));
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const mm = m % 60;
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${mm}m`;
  return `${mm}m`;
}

/* ------------------------------------------------------------------ */
/* Complaints                                                          */
/* ------------------------------------------------------------------ */

export type ThreadAuthor = "you" | "slate" | "operator" | "system";

export interface ThreadMessage {
  id: string;
  author: ThreadAuthor;
  name: string;
  role: string;
  time: string;
  body: string;
  attachments?: string[];
}

export type EvidenceKind = "lid-crack" | "lid-hinge" | "bin-gate" | "statement" | "late-street";

export interface Evidence {
  id: string;
  kind: EvidenceKind;
  name: string;
  taken: string;
  caption: string;
}

export interface CareComplaint extends Complaint {
  description: string;
  evidenceItems: Evidence[];
  thread: ThreadMessage[];
  /** Index of the last reached step in COMPLAINT_STEPS, and the time each step was reached. */
  stepTimes: Array<string | null>;
  respondedAt?: string;
  resolution?: { summary: string; detail: string; state: "proposed" | "done" };
  paymentRef?: string;
}

export const COMPLAINT_STEPS = [
  "Created",
  "SLA timer started",
  "Operator notified",
  "Operations reviewed",
  "Operator responded",
  "Slate reviewed",
  "Resolution",
  "Customer notified",
  "Closed",
] as const;

const base = (id: string) => myComplaints.find((c) => c.id === id)!;

export const careComplaints: CareComplaint[] = [
  {
    ...base("CMP-1201"),
    description:
      "The lid of my bin came back cracked after Monday's collection. The split runs about 15 cm from the hinge and rain now gets in. The bin was fine when I put it out at 6:40.",
    evidenceItems: [
      { id: "ev-1", kind: "lid-crack", name: "IMG_20260928_0904.jpg", taken: cday(-7, 9, 4), caption: "Crack across the lid, taken at the gate after collection" },
      { id: "ev-2", kind: "lid-hinge", name: "IMG_20260928_0905.jpg", taken: cday(-7, 9, 5), caption: "Hinge side, where the split starts" },
    ],
    thread: [
      { id: "t1", author: "you", name: me.household.name, role: "You", time: cday(-6, 9, 2), body: "The lid of my bin came back cracked after Monday's collection. The split runs about 15 cm from the hinge and rain now gets in. Two photos attached.", attachments: ["IMG_20260928_0904.jpg", "IMG_20260928_0905.jpg"] },
      { id: "t2", author: "slate", name: "Emem Obot", role: "Slate Care", time: cday(-6, 12, 44), body: "Thanks, Imaobong. I've logged this against PU-26-08640 and asked Ufok Environmental for the crew's report. You'll hear from me by noon tomorrow." },
      { id: "t3", author: "operator", name: "Ufok Environmental", role: "Operator, via Slate", time: cday(-5, 10, 15), body: "Crew lead Emmanuel Udo confirms the lid caught on the lift arm while emptying. We accept responsibility and will supply a replacement lid at no cost." },
      { id: "t4", author: "slate", name: "Emem Obot", role: "Slate Care", time: cday(-2, 14, 5), body: "A replacement lid will be fitted with your Thursday collection, 8 Oct between 07:00 and 09:00. There is no charge. I'll close this once you confirm it's fitted." },
    ],
    stepTimes: [cday(-6, 9, 2), cday(-6, 9, 2), cday(-6, 9, 6), cday(-6, 12, 40), cday(-5, 10, 15), cday(-5, 11, 30), null, null, null],
    respondedAt: cday(-6, 12, 44),
    resolution: { summary: "Replacement lid, fitted Thu 8 Oct", detail: "Ufok Environmental supplies and fits a new lid during your 07:00–09:00 collection. No charge to you.", state: "proposed" },
  },
  {
    ...base("CMP-1183"),
    description: "Our bin was at the gate from 6:30 but the truck never came on Thursday morning. Neighbours at No. 12 and 16 were collected.",
    evidenceItems: [{ id: "ev-3", kind: "bin-gate", name: "IMG_20260924_1012.jpg", taken: cday(-11, 10, 12), caption: "Bin still full at the gate at 10:12" }],
    thread: [
      { id: "t1", author: "you", name: me.household.name, role: "You", time: cday(-11, 10, 14), body: "Our bin was at the gate from 6:30 but the truck never came this morning. No. 12 and No. 16 were collected.", attachments: ["IMG_20260924_1012.jpg"] },
      { id: "t2", author: "slate", name: "Utibe Ekanem", role: "Slate Care", time: cday(-11, 11, 2), body: "Sorry about this. The Ufok truck on your route broke down at 07:50. I've booked a recovery crew from Nwaniba Clean Crew for tomorrow between 10:00 and 12:00." },
      { id: "t3", author: "operator", name: "Nwaniba Clean Crew", role: "Operator, via Slate", time: cday(-10, 11, 20), body: "Collected at 14 Ewet Housing Estate, 11:20. One bin, gate closed after." },
      { id: "t4", author: "slate", name: "Utibe Ekanem", role: "Slate Care", time: cday(-10, 12, 5), body: "Your recovery pickup is done. Because it came more than 24 hours after your window, we've credited ₦875 — one collection — to your November charge." },
    ],
    stepTimes: [cday(-11, 10, 14), cday(-11, 10, 14), cday(-11, 10, 18), cday(-11, 10, 50), cday(-11, 10, 58), cday(-11, 11, 2), cday(-10, 11, 20), cday(-10, 12, 5), null],
    respondedAt: cday(-11, 11, 2),
    resolution: { summary: "Recovered next day, ₦875 credited", detail: "Recovery crew collected at 11:20 the next day. One collection (₦875) credited to your November charge.", state: "done" },
  },
  {
    id: "CMP-1216",
    customerName: me.household.name,
    customerType: "Household",
    operatorName: "Nwaniba Clean Crew",
    service: "Bulk Waste Pickup",
    pickupId: "PU-26-08902",
    issue: "Deposit taken but Saturday booking not confirmed",
    category: "Billing",
    severity: "Medium",
    status: "New",
    created: cday(-1, 21, 40),
    slaDue: cday(0, 21, 40),
    assignee: "Emem Obot",
    evidence: 1,
    paymentRef: "TXN-5MN3XD",
    description: "₦9,000 left my account at 21:10 for the bulk pickup deposit, but the app still says pending and I haven't had a confirmation for Saturday.",
    evidenceItems: [{ id: "ev-4", kind: "statement", name: "Screenshot_20261004_2138.png", taken: cday(-1, 21, 38), caption: "Bank alert for ₦9,000 at 21:10" }],
    thread: [
      { id: "t1", author: "you", name: me.household.name, role: "You", time: cday(-1, 21, 40), body: "₦9,000 left my account at 21:10 for the bulk pickup deposit, but the app still says pending and I haven't had a confirmation for Saturday.", attachments: ["Screenshot_20261004_2138.png"] },
      { id: "t2", author: "system", name: "Slate", role: "Automatic", time: cday(-1, 21, 40), body: "Received. Slate Care replies within 24 hours — by 21:40 today at the latest. Your Saturday slot is held while we check." },
    ],
    stepTimes: [cday(-1, 21, 40), cday(-1, 21, 40), null, null, null, null, null, null, null],
  },
  {
    id: "CMP-1142",
    customerName: me.household.name,
    customerType: "Household",
    operatorName: "Ufok Environmental",
    service: "Slate Home",
    pickupId: "PU-26-07966",
    issue: "Collection came after 11:00, outside my window",
    category: "Late pickup",
    severity: "Low",
    status: "Closed",
    created: cday(-29, 11, 25),
    slaDue: cday(-28, 11, 25),
    assignee: "Utibe Ekanem",
    evidence: 1,
    description: "Second week running the truck came after 11:00. My window is 07:00–09:00 and I leave for work at 8.",
    evidenceItems: [{ id: "ev-5", kind: "late-street", name: "IMG_20260906_1108.jpg", taken: cday(-29, 11, 8), caption: "Truck arriving at 11:08" }],
    thread: [
      { id: "t1", author: "you", name: me.household.name, role: "You", time: cday(-29, 11, 25), body: "Second week running the truck came after 11:00. My window is 07:00–09:00 and I leave for work at 8.", attachments: ["IMG_20260906_1108.jpg"] },
      { id: "t2", author: "slate", name: "Utibe Ekanem", role: "Slate Care", time: cday(-29, 13, 40), body: "You're right — Ewet Phase 1 was being collected last on the Monday route. I've asked Ufok to re-order it." },
      { id: "t3", author: "operator", name: "Ufok Environmental", role: "Operator, via Slate", time: cday(-28, 9, 0), body: "Route UYO-R3 re-ordered. Ewet Phase 1 now collected between 07:10 and 08:20." },
      { id: "t4", author: "slate", name: "Utibe Ekanem", role: "Slate Care", time: cday(-21, 9, 12), body: "Your last two collections were at 07:38 and 07:42, so I'm closing this. Reopen it any time if it slips again." },
    ],
    stepTimes: [cday(-29, 11, 25), cday(-29, 11, 25), cday(-29, 11, 30), cday(-29, 13, 10), cday(-28, 9, 0), cday(-28, 10, 4), cday(-28, 10, 4), cday(-28, 10, 6), cday(-21, 9, 12)],
    respondedAt: cday(-29, 13, 40),
    resolution: { summary: "Route re-ordered", detail: "Ewet Phase 1 moved to the start of route UYO-R3. Collected inside the window every week since.", state: "done" },
  },
  {
    id: "CMP-1097",
    customerName: me.household.name,
    customerType: "Household",
    operatorName: "Ufok Environmental",
    service: "Slate Home",
    issue: "Charged twice for August",
    category: "Billing",
    severity: "Medium",
    status: "Closed",
    created: cday(-62, 8, 50),
    slaDue: cday(-61, 8, 50),
    assignee: "Inemesit Ita",
    evidence: 1,
    paymentRef: "TXN-3PQ7LE",
    description: "I was debited ₦7,000 twice on 1 August, two minutes apart.",
    evidenceItems: [{ id: "ev-6", kind: "statement", name: "Screenshot_20260804_0847.png", taken: cday(-62, 8, 47), caption: "Two debits of ₦7,000 on 1 Aug" }],
    thread: [
      { id: "t1", author: "you", name: me.household.name, role: "You", time: cday(-62, 8, 50), body: "I was debited ₦7,000 twice on 1 August, two minutes apart.", attachments: ["Screenshot_20260804_0847.png"] },
      { id: "t2", author: "slate", name: "Inemesit Ita", role: "Slate Payments", time: cday(-62, 10, 31), body: "Confirmed: Paystack retried a charge that had already succeeded. The duplicate ₦7,000 has been refunded to Visa •• 4021 and should appear within 3 working days." },
      { id: "t3", author: "slate", name: "Inemesit Ita", role: "Slate Payments", time: cday(-57, 9, 0), body: "The refund settled on 7 Aug. Closing this — thank you for flagging it." },
    ],
    stepTimes: [cday(-62, 8, 50), cday(-62, 8, 50), null, cday(-62, 9, 40), null, cday(-62, 10, 31), cday(-62, 10, 31), cday(-62, 10, 31), cday(-57, 9, 0)],
    respondedAt: cday(-62, 10, 31),
    resolution: { summary: "Duplicate refunded", detail: "₦7,000 refunded to Visa •• 4021, settled 7 Aug.", state: "done" },
  },
];

export const careComplaintById = (id: string) => careComplaints.find((c) => c.id === id);

export type ComplaintTab = "open" | "progress" | "resolved" | "closed";
export const complaintTab = (status: Complaint["status"]): ComplaintTab =>
  status === "Resolved" ? "resolved" : status === "Closed" ? "closed" : status === "Investigating" || status === "Waiting" || status === "In progress" ? "progress" : "open";

/** The customer-facing label for an internal complaint status. */
export const complaintLabel = (status: Complaint["status"]) =>
  ({ New: "Open", Open: "Open", Assigned: "Open", Escalated: "Escalated", Investigating: "In progress", Waiting: "In progress", "In progress": "In progress", Resolved: "Resolved", Closed: "Closed" })[status];

export function slaLine(c: CareComplaint, now = DEMO_NOW.getTime()): { text: string; tone: "ok" | "warn" | "late" | "done" } {
  const created = new Date(c.created).getTime();
  const tab = complaintTab(c.status);
  if (tab === "resolved" || tab === "closed") {
    const end = c.stepTimes[6] ?? c.stepTimes[8];
    return { text: end ? `Resolved in ${formatSpan(new Date(end).getTime() - created)}` : "Resolved", tone: "done" };
  }
  if (c.respondedAt) {
    const replied = `Replied in ${formatSpan(new Date(c.respondedAt).getTime() - created)}`;
    return { text: c.resolution ? `${replied} · ${c.resolution.summary.toLowerCase()}` : replied, tone: "ok" };
  }
  const left = new Date(c.slaDue).getTime() - now;
  if (left <= 0) return { text: `Reply overdue by ${formatSpan(-left)}`, tone: "late" };
  return { text: `Reply due in ${formatSpan(left)}`, tone: left < 4 * 3_600_000 ? "warn" : "ok" };
}

/* ------------------------------------------------------------------ */
/* Evidence — designed thumbnails (photo stand-ins, SVG)               */
/* ------------------------------------------------------------------ */

const stamp = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).toUpperCase().replace(",", "").replace("SEPT", "SEP");

export function EvidenceArt({ kind, taken, className }: { kind: EvidenceKind; taken: string; className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={cn("block h-full w-full", className)} role="img" aria-label={`Photo, ${stamp(taken)}`} preserveAspectRatio="xMidYMid slice">
      {kind === "lid-crack" && (
        <g>
          <rect width="160" height="120" fill="#B9C2CB" />
          {Array.from({ length: 6 }).map((_, i) => (
            <path key={i} d={`M0 ${i * 22 + 8} L160 ${i * 22 - 6}`} stroke="#A7B1BB" strokeWidth="1" />
          ))}
          <ellipse cx="84" cy="104" rx="58" ry="8" fill="#000" opacity=".12" />
          <rect x="24" y="18" width="116" height="84" rx="9" fill="#26303B" />
          <rect x="24" y="18" width="116" height="12" rx="6" fill="#1C242E" />
          <rect x="30" y="34" width="104" height="62" rx="6" fill="#2E3946" />
          <path d="M44 30 L58 46 L52 55 L70 64 L64 74 L86 84 L82 96" fill="none" stroke="#E8ECF0" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
          <path d="M58 46 L66 44 M70 64 L78 61" stroke="#E8ECF0" strokeWidth="1.2" strokeLinecap="round" opacity=".7" />
          <circle cx="112" cy="50" r="3" fill="#3A4859" />
          <circle cx="112" cy="80" r="3" fill="#3A4859" />
        </g>
      )}
      {kind === "lid-hinge" && (
        <g>
          <rect width="160" height="120" fill="#C7CFD7" />
          <rect x="0" y="0" width="160" height="58" fill="#26303B" />
          <rect x="0" y="52" width="160" height="12" fill="#1C242E" />
          <rect x="22" y="54" width="22" height="8" rx="2" fill="#3A4859" />
          <rect x="116" y="54" width="22" height="8" rx="2" fill="#3A4859" />
          <rect x="0" y="64" width="160" height="56" fill="#2E3946" />
          <path d="M40 52 L46 34 L40 26 L50 10 L46 0" fill="none" stroke="#E8ECF0" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
          <path d="M46 34 L56 30" stroke="#E8ECF0" strokeWidth="1.2" strokeLinecap="round" opacity=".7" />
          <path d="M8 84 H152" stroke="#3A4859" strokeWidth="2" />
          <path d="M8 98 H152" stroke="#3A4859" strokeWidth="2" />
        </g>
      )}
      {kind === "bin-gate" && (
        <g>
          <rect width="160" height="120" fill="#DCE2E8" />
          <rect x="0" y="88" width="160" height="32" fill="#9AA6B2" />
          <rect x="70" y="10" width="90" height="80" fill="#2F5D8A" />
          {Array.from({ length: 7 }).map((_, i) => (
            <rect key={i} x={74 + i * 12.5} y="14" width="8" height="72" fill="#3B6E9F" />
          ))}
          <rect x="0" y="22" width="70" height="68" fill="#C9D1D9" />
          <rect x="62" y="6" width="10" height="84" fill="#AEB8C2" />
          <rect x="22" y="44" width="34" height="50" rx="4" fill="#26303B" />
          <rect x="19" y="38" width="40" height="9" rx="3" fill="#1C242E" />
          <path d="M26 38 Q34 28 44 34 Q50 26 56 38" fill="#4D5D70" />
          <circle cx="28" cy="96" r="4" fill="#111820" />
          <circle cx="50" cy="96" r="4" fill="#111820" />
        </g>
      )}
      {kind === "statement" && (
        <g>
          <rect width="160" height="120" fill="#1C242E" />
          <rect x="38" y="6" width="84" height="120" rx="10" fill="#F4F6F8" />
          <rect x="46" y="16" width="40" height="5" rx="2" fill="#8C9AA8" />
          <rect x="46" y="28" width="68" height="20" rx="3" fill="#FBE6E3" />
          <rect x="50" y="33" width="30" height="4" rx="2" fill="#BF3328" />
          <rect x="50" y="40" width="20" height="3" rx="1.5" fill="#B4BFCA" />
          <text x="110" y="40" textAnchor="end" fontFamily="Geist Mono, monospace" fontSize="7" fontWeight="600" fill="#BF3328">-9,000</text>
          {[56, 70, 84, 98].map((y) => (
            <g key={y}>
              <rect x="46" y={y} width="34" height="4" rx="2" fill="#B4BFCA" />
              <rect x="46" y={y + 7} width="22" height="3" rx="1.5" fill="#D3DAE1" />
              <rect x="96" y={y} width="18" height="4" rx="2" fill="#8C9AA8" />
            </g>
          ))}
        </g>
      )}
      {kind === "late-street" && (
        <g>
          <rect width="160" height="120" fill="#E6EAEE" />
          <rect x="0" y="70" width="160" height="50" fill="#6B7A8A" />
          <path d="M0 96 H160" stroke="#E8ECF0" strokeWidth="2" strokeDasharray="10 8" />
          <rect x="0" y="40" width="160" height="30" fill="#C9D1D9" />
          <rect x="62" y="44" width="70" height="34" rx="3" fill="#F2F4F6" />
          <rect x="120" y="50" width="24" height="28" rx="3" fill="#2B3643" />
          <rect x="124" y="54" width="14" height="9" rx="1" fill="#8FB4D9" />
          <rect x="62" y="64" width="70" height="4" fill="#FF5B1F" />
          <circle cx="78" cy="82" r="6" fill="#111820" />
          <circle cx="130" cy="82" r="6" fill="#111820" />
        </g>
      )}
      <rect x="0" y="100" width="160" height="20" fill="#000" opacity=".42" />
      <text x="8" y="113.5" fontFamily="Geist Mono, monospace" fontSize="8" fontWeight="500" fill="#F2F4F6" letterSpacing=".4">
        {stamp(taken)}
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Community                                                           */
/* ------------------------------------------------------------------ */

export interface Contribution {
  id: string;
  ref: string;
  projectId: string;
  amount: number;
  date: string;
  method: string;
  status: "Successful" | "Pending" | "Failed" | "Refunded";
  note?: string;
}

export const myContributions: Contribution[] = [
  { id: "ct-1", ref: "TXN-6HZ8RV", projectId: "cp-ewet-drain", amount: 2500, date: cday(-9, 19, 44), method: "Visa •• 4021", status: "Successful" },
  { id: "ct-2", ref: "TXN-5BR2QW", projectId: "cp-ewet-bins", amount: 5000, date: cday(-27, 20, 12), method: "Visa •• 4021", status: "Successful" },
  { id: "ct-3", ref: "TXN-4KV7NE", projectId: "cp-ewet-bins", amount: 2000, date: cday(-49, 7, 55), method: "Bank transfer", status: "Successful" },
];

/** Deterministic recent contributions for a project. */
export function recentContributions(p: CommunityProject, count = 8) {
  let s = [...p.id].reduce((a, c) => a + c.charCodeAt(0), 0) * 7919;
  const r = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const amounts = [1000, 2500, 2500, 5000, 1000, 10000, 2000, 1500, 5000, 2500];
  const used = new Set<string>([me.household.name]);
  const out: Array<{ id: string; name: string; amount: number; time: string; sweep?: string; anonymous?: boolean }> = [];
  let hoursAgo = 1 + Math.floor(r() * 3);
  for (let i = 0; i < count; i++) {
    let name = "";
    do name = `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`;
    while (used.has(name));
    used.add(name);
    const anonymous = i === 2 || i === 6;
    const amount = amounts[Math.floor(r() * amounts.length)]!;
    out.push({
      id: `${p.id}-c${i}`,
      name: anonymous ? "A neighbour" : name,
      amount,
      time: new Date(DEMO_NOW.getTime() - hoursAgo * 3_600_000).toISOString(),
      sweep: i === 1 || i === 5 ? "Smart Sweep, 1 of 4" : undefined,
      anonymous,
    });
    hoursAgo += 2 + Math.floor(r() * 14);
  }
  return out;
}

/** Names for an AvatarStack (unique, deterministic). */
export function contributorNames(p: CommunityProject, n = 6) {
  return recentContributions(p, n + 2).filter((c) => !c.anonymous).slice(0, n).map((c) => c.name);
}

export const projectIsOpen = (p: CommunityProject) => p.status === "Active" || p.status === "Draft";

/** Which release step the project has reached (index into RELEASE_STEPS). */
export const RELEASE_STEPS = ["Contributions", "Goal reached", "Provider verified", "Funds released", "Work begins", "Completion evidence", "Closed"] as const;
export function releaseIndex(p: CommunityProject) {
  switch (p.status) {
    case "Draft":
    case "Active":
      return 0;
    case "Funded":
      return 2;
    case "Released":
      return 4;
    case "Completed":
      return 6;
    case "Closed":
      return 7;
  }
}

const DAY = 86_400_000;

export function projectBadge(p: CommunityProject): { label: string; tone: Tone } {
  switch (p.status) {
    case "Active":
      return { label: "Raising", tone: "info" };
    case "Funded":
      return { label: "Funded", tone: "success" };
    case "Released":
      return { label: "Funds released", tone: "info" };
    case "Completed":
      return { label: "Completed", tone: "success" };
    case "Closed":
      return { label: "Closed", tone: "neutral" };
    default:
      return { label: "Draft", tone: "neutral" };
  }
}

export function deadlineText(p: CommunityProject) {
  const diff = new Date(p.deadline).getTime() - DEMO_NOW.getTime();
  if (projectIsOpen(p)) {
    const days = Math.ceil(diff / DAY);
    return days <= 1 ? "Closes tomorrow" : `${days} days left`;
  }
  return `Closed ${formatDate(p.deadline).replace(/ \d{4}$/, "")}`;
}

/* ------------------------------------------------------------------ */
/* Recycling                                                           */
/* ------------------------------------------------------------------ */

export type Material = "PET plastic" | "Aluminium cans" | "Paper & cardboard" | "E-waste" | "Glass";

export const MATERIALS: Array<{
  name: Material;
  code: string;
  partner: string;
  goesIn: string[];
  keepOut: string[];
  prep: string;
}> = [
  {
    name: "PET plastic",
    code: "PET 1",
    partner: "Itam Recovery Ltd",
    goesIn: ["Water and soft-drink bottles", "Cooking-oil bottles, rinsed", "Clear food trays and punnets"],
    keepOut: ["Sachet water nylon", "Black plastic trays", "Bottles with oil or food inside"],
    prep: "Rinse, squash, keep caps on.",
  },
  {
    name: "Aluminium cans",
    code: "ALU 41",
    partner: "Ikot Metal Reclaim",
    goesIn: ["Drink cans", "Clean foil and foil trays", "Aerosol cans, fully empty"],
    keepOut: ["Tin food cans (steel)", "Paint or insecticide cans with residue", "Gas cylinders"],
    prep: "Empty and crush. A magnet won't stick to aluminium.",
  },
  {
    name: "Paper & cardboard",
    code: "PAP 20",
    partner: "PaperLoop Uyo",
    goesIn: ["Cartons and delivery boxes, flattened", "Newspapers and magazines", "Office paper and envelopes"],
    keepOut: ["Greasy pizza boxes", "Tissue and paper towels", "Wet or mouldy paper"],
    prep: "Flatten boxes and keep them dry.",
  },
  {
    name: "E-waste",
    code: "WEEE",
    partner: "Ewet E-Cycle",
    goesIn: ["Phones, chargers and cables", "Small appliances: kettles, irons, fans", "Remote controls and routers"],
    keepOut: ["Loose batteries — bag and tape them separately", "Broken fluorescent tubes", "Fridges and ACs (book bulk waste)"],
    prep: "Bag small items together. Remove batteries where you can.",
  },
  {
    name: "Glass",
    code: "GL 70",
    partner: "Held at Slate's Itam yard",
    goesIn: ["Drink bottles", "Jam and sauce jars, rinsed"],
    keepOut: ["Window glass and mirrors", "Drinking glasses and ceramics", "Light bulbs"],
    prep: "Rinse. Don't break — whole bottles are safer for the crew.",
  },
];

export interface RecyclingEntry {
  id: string;
  ref: string;
  date: string;
  kind: "Pickup" | "Drop-off";
  where: string;
  kg: Partial<Record<Material, number>>;
}

export const recyclingHistory: RecyclingEntry[] = [
  { id: "rh-7", ref: "DRP-0412", date: cday(-3, 17, 20), kind: "Drop-off", where: "Ufok depot, Ewet", kg: { "PET plastic": 1.1, "Aluminium cans": 0.9, "E-waste": 1.0, "Paper & cardboard": 0.4 } },
  { id: "rh-6", ref: "PU-26-08244", date: cday(-13, 15, 2), kind: "Pickup", where: "14 Ewet Housing Estate", kg: { "PET plastic": 3.2, "Aluminium cans": 2.7, "Paper & cardboard": 1.4, Glass: 0.7 } },
  { id: "rh-5", ref: "PU-26-07812", date: cday(-41, 14, 48), kind: "Pickup", where: "14 Ewet Housing Estate", kg: { "PET plastic": 2.6, "Aluminium cans": 2.2, "Paper & cardboard": 1.0, "E-waste": 1.5 } },
  { id: "rh-4", ref: "PU-26-07390", date: cday(-69, 15, 10), kind: "Pickup", where: "14 Ewet Housing Estate", kg: { "PET plastic": 2.4, "Aluminium cans": 2.0, "Paper & cardboard": 0.9, Glass: 1.1 } },
  { id: "rh-3", ref: "PU-26-06911", date: cday(-104, 14, 35), kind: "Pickup", where: "14 Ewet Housing Estate", kg: { "PET plastic": 2.1, "Aluminium cans": 1.8, "Paper & cardboard": 1.2 } },
  { id: "rh-2", ref: "PU-26-06425", date: cday(-132, 15, 22), kind: "Pickup", where: "14 Ewet Housing Estate", kg: { "PET plastic": 2.0, "Aluminium cans": 1.6, "Paper & cardboard": 1.0 } },
  { id: "rh-1", ref: "PU-26-05988", date: cday(-160, 14, 56), kind: "Pickup", where: "14 Ewet Housing Estate", kg: { "PET plastic": 1.6, "Aluminium cans": 0.9, "Paper & cardboard": 0.7 } },
];

export const entryKg = (e: RecyclingEntry) => Object.values(e.kg).reduce((a, b) => a + (b ?? 0), 0);

/* ------------------------------------------------------------------ */
/* Support                                                             */
/* ------------------------------------------------------------------ */

export interface CareTicket {
  id: string;
  subject: string;
  topic: string;
  status: "Open" | "Waiting" | "Resolved" | "Closed";
  created: string;
  updated: string;
  last: string;
}

export const myTickets: CareTicket[] = [
  { id: "TCK-4418", subject: "Can I pause service while I travel in December?", topic: "Account", status: "Waiting", created: cday(-1, 12, 30), updated: cday(0, 7, 30), last: "Utibe asked which dates you'll be away." },
  { id: "TCK-4406", subject: "Crew didn't come for my extra pickup", topic: "Pickups & schedule", status: "Resolved", created: cday(-7, 9, 15), updated: cday(-5, 11, 40), last: "Replacement crew collected at 11:06." },
  { id: "TCK-4371", subject: "Receipt for September with my company name", topic: "Payments & billing", status: "Closed", created: cday(-30, 14, 2), updated: cday(-29, 10, 0), last: "Receipt reissued to Akpan Consulting." },
];

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

const extraNotifications: NotificationItem[] = [
  { id: "n9", category: "Pickups", title: "Recyclables pickup moved to Tue 13 Oct", body: "Ufok's recycling truck is in for service. Your pickup moves from Thu 8 Oct to Tue 13 Oct, 14:00–16:00.", time: cday(-3, 12, 15), read: true, to: "/app/recycling" },
  { id: "n10", category: "Community", title: "Six recycling stations fully funded", body: "233 neighbours reached ₦1,260,000. Ufok Environmental is now being verified for installation.", time: cday(-12, 9, 30), read: true, to: "/app/community/cp-ewet-bins" },
  { id: "n11", category: "Promotions", title: "₦1,000 off for every neighbour you refer", body: "When someone in Ewet joins Slate Home with your code, your next month is ₦1,000 less.", time: cday(-15, 10, 0), read: true, to: "/app/subscriptions" },
  { id: "n12", category: "Support", title: "Ticket TCK-4371 closed", body: "Your September receipt was reissued to Akpan Consulting.", time: cday(-29, 10, 0), read: true, to: "/app/support" },
  { id: "n13", category: "Service", title: "Route change: Ewet Phase 1 now collected first", body: "From Monday your collection moves earlier, between 07:10 and 08:20.", time: cday(-28, 9, 5), read: true, to: "/app/complaints/CMP-1142" },
];
export const allNotifications: NotificationItem[] = [...customerNotifications, ...extraNotifications].sort((a, b) => b.time.localeCompare(a.time));

/* ------------------------------------------------------------------ */
/* Layout helpers                                                      */
/* ------------------------------------------------------------------ */

/** Sticky in-page section index for long settings-like pages (desktop only). */
export function SectionIndex({ items, active }: { items: Array<{ id: string; label: string }>; active?: string }) {
  return (
    <nav aria-label="On this page" className="sticky top-24 hidden flex-col gap-0.5 lg:flex">
      {items.map((it) => (
        <a
          key={it.id}
          href={`#${it.id}`}
          className={cn(
            "flex h-9 items-center rounded-md border-l-2 px-3 text-[14px] font-medium transition-colors",
            active === it.id ? "border-ink bg-sunken text-ink" : "border-transparent text-ink-3 hover:text-ink",
          )}
        >
          {it.label}
        </a>
      ))}
    </nav>
  );
}

/** Track which section is in view (for SectionIndex). */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-80px 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join("|")]);
  return active;
}

/** A titled block on a settings-like page: title column + content, separated by a hairline. */
export function SettingsBlock({
  id,
  title,
  description,
  children,
  actions,
  className,
}: {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-24 border-t border-line pt-8 first:border-t-0 first:pt-0", className)}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 max-w-xl">
          <h2 className="t-h2 text-ink">{title}</h2>
          {description && <p className="t-small mt-1 text-ink-2">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

/** Row: label + detail on the left, a control on the right. Stacks on narrow screens when `stack`. */
export function SettingRow({
  title,
  detail,
  control,
  icon,
  className,
}: {
  title: ReactNode;
  detail?: ReactNode;
  control?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3.5 py-4", className)}>
      {icon && <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-sunken text-ink-2 [&_svg]:size-[18px]">{icon}</span>}
      <div className="min-w-0 flex-1">
        <div className="t-body font-medium text-ink">{title}</div>
        {detail && <div className="t-small text-ink-2">{detail}</div>}
      </div>
      {control && <div className="flex shrink-0 items-center gap-2">{control}</div>}
    </div>
  );
}

/** Theme-aware slate ramp for categorical data (no signal — that's reserved). */
export const RAMP = {
  light: ["#2B3643", "#66768A", "#9AA7B4", "#C3CCD5", "#E1E6EB"],
  dark: ["#E8ECF0", "#AFBBC7", "#7D8C9B", "#56677A", "#3A4859"],
};

/** Session-only: complaints filed in this visit, so the detail page can open them. */
export function addCareComplaint(c: CareComplaint) {
  careComplaints.unshift(c);
}
