import { useMemo, useState } from "react";
import { useLocation, useMatches, useParams } from "react-router";
import { ArrowRight, Building2, CalendarDays, Check, CircleDollarSign, Download, FileText, Filter, Plus, ShieldCheck, Users } from "lucide-react";
import { RouteMap } from "@/components/brand/RouteMap";
import { ServiceAreaMap } from "@/components/brand/ServiceAreaMap";
import { Strata } from "@/components/brand/Strata";
import {
  Alert, AreaChart, Avatar, Badge, BarChart, Button, ButtonLink, DescriptionList, Donut,
  Input, List, ListRow, Page, PageHeader, Panel, ProgressBar, Ref, SearchInput,
  Segmented, Select, Stat, StatStrip, StatusBadge, Switch, Textarea, Timeline, useToast,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatNairaShort } from "@/lib/format";

type Area = "public" | "app" | "estate" | "business" | "institution" | "operator" | "admin";
type Kind = "marketing" | "dashboard" | "list" | "detail" | "schedule" | "finance" | "analytics" | "settings" | "form";
type Row = { id: string; name: string; detail: string; meta: string; status: string };

const copy: Record<string, string> = {
  About: "The operating company behind reliable collection in Uyo.", Contact: "One Slate team for service, billing and operator support.",
  FAQ: "Clear answers about collection, billing and missed-pickup recovery.", Blog: "Field notes from waste operations, neighbourhoods and the circular economy.",
  Pricing: "Clear, all-in prices with collection, support and recovery included.", "For businesses": "Reliable commercial collection without chasing multiple operators.",
  "For estates": "One service standard across every street, block and resident.", "For institutions": "Auditable waste services for schools, hospitals and public facilities.",
  "For waste companies": "Verified demand, predictable routes and faster settlement.", "Bulk waste": "Book a crew for furniture, renovation debris and oversized waste.",
  Customers: "Every active account, service state and payment signal in one operational view.", Operators: "Verify capacity, monitor performance and manage contracted waste companies.",
  Pickups: "Track scheduled, live, completed and missed collections across the service area.", Routes: "Balance daily stops across verified crews and vehicles.",
  Payments: "Monitor customer collections, retries, refunds and settlement status.", Invoices: "Issue, track and reconcile every bill against its service contract.",
  Reports: "Operational and financial reporting for the selected service period.", Analytics: "Demand, service quality and unit economics across Slate's Uyo operation.",
  Finance: "Revenue, operator liabilities and cash movement for the current period.", Compliance: "Evidence, expiries and service obligations requiring attention.",
  Documents: "Licences, insurance, contracts and service evidence in one register.", Team: "Roles, access and operating responsibility for this workspace.",
  Settings: "Workspace controls, notifications, billing and security preferences.", Vehicles: "Fleet readiness, assigned drivers and maintenance status.",
  Drivers: "Verified drivers, route assignments and service performance.", Calendar: "A service calendar built around routes, capacity and promised windows.",
  Locations: "Every service site, its collection profile and current health.", Procurement: "Quotes, approvals and purchase records for institutional services.",
  Billing: "Invoices, payment approvals and budget use across facilities.", Partnerships: "City, community and commercial partners expanding Slate's network.",
  Expansion: "Readiness signals for the next Nigerian city launch.",
};

const rawRows: Record<string, Array<[string, string, string, string, string]>> = {
  Customers: [
    ["CUS-2477", "Iniobong Udo", "14 Ewet Housing Estate", "Slate Home · ₦7,000", "Active"],
    ["CUS-2476", "Afang Kitchen", "84 Oron Road", "Commercial · ₦48,500", "Active"],
    ["CUS-2475", "Uyo Model School", "Itam Road", "Institutional · ₦210,000", "Pending"],
    ["CUS-2474", "Emem Akpan", "Shelter Afrique Estate", "Slate Home Lite", "Overdue"],
    ["CUS-2473", "Ibom Diagnostics", "19 Aka Road", "Commercial · 2 sites", "Active"],
  ],
  Operators: [
    ["OP-UFK-01", "Ufok Environmental Services", "Ewet, Shelter Afrique, Osongama", "842 customers", "Verified"],
    ["OP-ATL-02", "Atlantic Waste Resources", "Aka Road, Oron Road", "616 customers", "Verified"],
    ["OP-IBM-03", "Ibom Resource Recovery", "Itam, Abak Road, Use Offot", "531 customers", "Expiring soon"],
    ["OP-NWB-04", "Nwaniba Sanitation Co.", "Nwaniba and Ikot Ekpene Road", "488 customers", "Verified"],
  ],
  Pickups: [
    ["PU-26-08813", "14 Ewet Housing Estate", "Ufok Environmental · AKS 214 XA", "07:00–09:00", "En route"],
    ["PU-26-08814", "Afang Kitchen, Oron Road", "Atlantic Waste · AKS 337 NY", "08:00–10:00", "Scheduled"],
    ["PU-26-08815", "Uyo Model School", "Ibom Recovery · AKS 902 UA", "10:00–12:00", "Completed"],
    ["PU-26-08816", "Shelter Afrique Block C", "Ufok Environmental · AKS 214 XA", "07:00–09:00", "Missed"],
    ["PU-26-08817", "Ibom Diagnostics", "Atlantic Waste · AKS 337 NY", "14:00–16:00", "Scheduled"],
  ],
  Invoices: [
    ["INV-26-10384", "Ibom Diagnostics", "October commercial collection", "₦97,000", "Paid"],
    ["INV-26-10383", "Uyo Model School", "Q4 institutional service", "₦630,000", "Sent"],
    ["INV-26-10382", "Afang Kitchen", "October collection", "₦48,500", "Overdue"],
    ["INV-26-10381", "Shelter Afrique Estate", "412 household services", "₦2,884,000", "Paid"],
  ],
  Payments: [
    ["TXN-7Q4K2M", "Iniobong Udo", "Visa ending 1042", "₦7,250", "Successful"],
    ["TXN-2N8P6A", "Afang Kitchen", "Bank transfer", "₦48,500", "Pending"],
    ["TXN-9M3R1D", "Shelter Afrique Estate", "Direct debit", "₦2,884,000", "Successful"],
    ["TXN-4F7K8C", "Emem Akpan", "Mastercard ending 7781", "₦4,750", "Failed"],
  ],
  Vehicles: [
    ["VEH-014", "AKS 214 XA", "Compactor · 12 m³", "Ufok Environmental", "On route"],
    ["VEH-022", "AKS 337 NY", "Rear loader · 10 m³", "Atlantic Waste", "On route"],
    ["VEH-031", "AKS 902 UA", "Tipper · 8 m³", "Ibom Recovery", "Maintenance due"],
    ["VEH-036", "AKS 118 QP", "Compactor · 14 m³", "Nwaniba Sanitation", "Available"],
  ],
  Drivers: [
    ["DRV-031", "Emmanuel Udo", "AKS 214 XA · Ewet route", "96.8% on time", "On route"],
    ["DRV-044", "Friday Bassey", "AKS 337 NY · Oron route", "94.1% on time", "On route"],
    ["DRV-052", "Mercy Etim", "AKS 902 UA · Itam route", "98.2% on time", "Available"],
    ["DRV-061", "Nsikak Ekanem", "AKS 118 QP · Nwaniba route", "93.6% on time", "Off duty"],
  ],
};

const rowsByTitle: Record<string, Row[]> = Object.fromEntries(
  Object.entries(rawRows).map(([key, rows]) => [key, rows.map(([id, name, detail, meta, status]) => ({ id, name, detail, meta, status }))]),
);

const defaults: Row[] = [
  { id: "SL-00184", name: "Ewet Housing Estate", detail: "Uyo · Ufok Environmental", meta: "Updated 08:04", status: "Active" },
  { id: "SL-00183", name: "Shelter Afrique Estate", detail: "Uyo · 412 active services", meta: "Updated yesterday", status: "Active" },
  { id: "SL-00182", name: "Aka Road commercial route", detail: "Uyo · Atlantic Waste", meta: "Review 9 Oct", status: "Pending" },
  { id: "SL-00181", name: "Itam institutional cluster", detail: "Uyo · Ibom Recovery", meta: "1 issue", status: "At risk" },
  { id: "SL-00180", name: "Nwaniba Road households", detail: "Uyo · Nwaniba Sanitation", meta: "Updated 4 Oct", status: "Active" },
];

type MarketingProfile = {
  index: string;
  kicker: string;
  statement: string;
  metric: string;
  metricLabel: string;
  signal: string;
};

const marketingProfiles: Record<string, MarketingProfile> = {
  About: { index: "01", kicker: "Built in Uyo", statement: "The operating layer behind a cleaner city.", metric: "2,477", metricLabel: "active services", signal: "27 crews moving now" },
  Contact: { index: "02", kicker: "One support line", statement: "A real operations team answers.", metric: "4m 18s", metricLabel: "median response", signal: "Support online until 20:00" },
  FAQ: { index: "03", kicker: "Before you ask", statement: "Clear answers. Specific service promises.", metric: "24h", metricLabel: "missed-pickup recovery", signal: "Service policy current" },
  Blog: { index: "04", kicker: "Field notes", statement: "What a cleaner city teaches us.", metric: "18", metricLabel: "dispatches documented", signal: "New from the Oron corridor" },
  Article: { index: "05", kicker: "From the field", statement: "Inside Uyo’s morning collection window.", metric: "06:12", metricLabel: "first truck out", signal: "Reporting from Ewet route A" },
  Pricing: { index: "06", kicker: "All-in service", statement: "The price includes the promise.", metric: "₦7,000", metricLabel: "Slate Home monthly", signal: "No operator-side charges" },
  Businesses: { index: "07", kicker: "Commercial service", statement: "Close on time. Waste handled.", metric: "96.4%", metricLabel: "on-time collection", signal: "84 Oron Road · next 18:30" },
  Institutions: { index: "08", kicker: "Auditable service", statement: "Every collection leaves evidence.", metric: "100%", metricLabel: "records retained", signal: "Ikpa Hills · compliant" },
  "Bulk waste": { index: "09", kicker: "Booked crews", statement: "The big things leave properly.", metric: "48h", metricLabel: "typical collection", signal: "Two crews available Thursday" },
  Recycling: { index: "10", kicker: "Recovery routes", statement: "Sorted material stays in motion.", metric: "18.6t", metricLabel: "recovered this month", signal: "PET route closes 16:00" },
  "For estates": { index: "11", kicker: "One estate standard", statement: "Every street. One accountable service.", metric: "412", metricLabel: "homes on one contract", signal: "Shelter Afrique · 98% complete" },
  "For businesses": { index: "12", kicker: "Built for closing time", statement: "Collection that follows your operation.", metric: "31", metricLabel: "commercial routes", signal: "Aka Road corridor is clear" },
  "For institutions": { index: "13", kicker: "Procurement ready", statement: "Waste service you can audit.", metric: "7 yrs", metricLabel: "evidence retention", signal: "Q4 compliance complete" },
  "For waste companies": { index: "14", kicker: "Verified demand", statement: "Fuller routes. Faster settlement.", metric: "8 days", metricLabel: "settlement cycle", signal: "186 stops ready to assign" },
};

const listingCatalog: Record<string, Row[]> = {
  Contracts: [
    { id: "CT-UYO-014", name: "Ufok household service", detail: "Ewet · 842 active households", meta: "Renews 30 Nov", status: "Active" },
    { id: "CT-UYO-021", name: "Atlantic commercial corridor", detail: "Aka and Oron roads · 31 sites", meta: "Review 12 Oct", status: "Pending" },
    { id: "CT-UYO-009", name: "Ibom institutional cluster", detail: "4 schools · 2 clinics", meta: "Expires 18 Oct", status: "Expiring soon" },
    { id: "CT-UYO-027", name: "Nwaniba household route", detail: "488 household services", meta: "Renews 14 Dec", status: "Active" },
  ],
  "Service areas": [
    { id: "AREA-EWT", name: "Ewet Housing Estate", detail: "Ufok Environmental · Route A", meta: "92% capacity", status: "Active" },
    { id: "AREA-SHA", name: "Shelter Afrique", detail: "Ufok Environmental · Route C", meta: "81% capacity", status: "Active" },
    { id: "AREA-AKA", name: "Aka Road corridor", detail: "Atlantic Waste · Commercial", meta: "66% capacity", status: "Active" },
    { id: "AREA-ITA", name: "Itam cluster", detail: "Ibom Recovery · Mixed use", meta: "2 documents due", status: "At risk" },
  ],
  Services: [
    { id: "SVC-HOME", name: "Slate Home", detail: "Two collections weekly · one household bin", meta: "₦7,000 monthly", status: "Active" },
    { id: "SVC-LITE", name: "Home Lite", detail: "One collection weekly · one household bin", meta: "₦4,500 monthly", status: "Active" },
    { id: "SVC-COM", name: "Commercial Flex", detail: "Three to six collections weekly", meta: "From ₦30,000", status: "Active" },
    { id: "SVC-BULK", name: "Bulk collection", detail: "Furniture, appliances and renovation waste", meta: "From ₦12,500", status: "Active" },
  ],
  Documents: [
    { id: "DOC-4812", name: "Waste handling licence", detail: "Ufok Environmental · Akwa Ibom", meta: "Expires 28 Nov", status: "Verified" },
    { id: "DOC-4807", name: "Public liability insurance", detail: "Atlantic Waste Resources", meta: "Expires 18 Oct", status: "Expiring soon" },
    { id: "DOC-4794", name: "Vehicle roadworthiness", detail: "AKS 902 UA · Ibom Recovery", meta: "Uploaded 3 Oct", status: "Pending" },
    { id: "DOC-4772", name: "Disposal-site agreement", detail: "Nwaniba Sanitation", meta: "Valid to Jun 2027", status: "Verified" },
  ],
  Notifications: [
    { id: "NTF-1842", name: "Ewet route is two stops away", detail: "Pickup PU-26-08813 · household alert", meta: "08:12", status: "Sent" },
    { id: "NTF-1841", name: "Payment retry scheduled", detail: "Emem Akpan · Mastercard 7781", meta: "07:58", status: "Pending" },
    { id: "NTF-1839", name: "Shelter Afrique recovery assigned", detail: "Missed pickup MP-1182", meta: "07:41", status: "Sent" },
    { id: "NTF-1836", name: "Operator document expires soon", detail: "Atlantic Waste · insurance", meta: "Yesterday", status: "Attention" },
  ],
  Team: [
    { id: "USR-031", name: "Nsikak Okon", detail: "Director of Facilities", meta: "Last active 08:03", status: "Active" },
    { id: "USR-044", name: "Imaobong Etim", detail: "Procurement officer", meta: "Last active yesterday", status: "Active" },
    { id: "USR-052", name: "Edidiong Udo", detail: "Finance reviewer", meta: "Invite sent 4 Oct", status: "Pending" },
    { id: "USR-061", name: "Mfon James", detail: "Site coordinator", meta: "Last active 3 Oct", status: "Active" },
  ],
  Complaints: [
    { id: "CMP-1182", name: "Bin not collected", detail: "Shelter Afrique Block C · recovery assigned", meta: "SLA 1h 42m", status: "In progress" },
    { id: "CMP-1179", name: "Truck arrived outside window", detail: "84 Oron Road · evidence attached", meta: "Opened yesterday", status: "Pending" },
    { id: "CMP-1171", name: "Gate access was missed", detail: "Uyo Model School · contact updated", meta: "Resolved 3 Oct", status: "Resolved" },
    { id: "CMP-1164", name: "Invoice quantity disputed", detail: "Ibom Diagnostics · September", meta: "Resolved 1 Oct", status: "Resolved" },
  ],
  Locations: [
    { id: "LOC-001", name: "Afang Kitchen · Oron Road", detail: "Food waste · three weekly collections", meta: "Next 18:30", status: "Active" },
    { id: "LOC-002", name: "Afang Kitchen · Aka Road", detail: "General waste · four weekly collections", meta: "Next tomorrow", status: "Active" },
    { id: "LOC-003", name: "Afang Events · Udo Udoma", detail: "Event service · on demand", meta: "No booking", status: "Paused" },
  ],
  Partnerships: [
    { id: "PT-001", name: "Akwa Ibom Environmental Protection", detail: "City data and disposal oversight", meta: "Review 14 Oct", status: "Active" },
    { id: "PT-004", name: "Ewet Residents Association", detail: "Community service adoption", meta: "412 households", status: "Active" },
    { id: "PT-007", name: "Ibom Circular Materials", detail: "PET and aluminium recovery", meta: "18.6t recovered", status: "Active" },
  ],
  Cities: [
    { id: "CITY-UYO", name: "Uyo", detail: "Live · 2,477 services · 27 crews", meta: "96.4% on time", status: "Active" },
    { id: "CITY-ABA", name: "Aba", detail: "Operator diligence and route modelling", meta: "74% ready", status: "Pending" },
    { id: "CITY-CAL", name: "Calabar", detail: "Demand validation", meta: "41% ready", status: "Research" },
  ],
};

function rowsFor(title: string): Row[] {
  if (rowsByTitle[title]) return rowsByTitle[title]!;
  if (listingCatalog[title]) return listingCatalog[title]!;
  return defaults.map((row, index) => ({
    ...row,
    id: `${title.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "SLT")}-${String(184 - index).padStart(4, "0")}`,
    name: row.name,
    detail: `${title} · ${row.detail}`,
  }));
}

const dashboardProfile: Record<Exclude<Area, "public">, { line: string; sub: string; count: string; unit: string }> = {
  app: { line: "Your truck is two stops away.", sub: "Ewet route A is moving normally. Put one closed bin outside before 07:00.", count: "07:42", unit: "estimated arrival" },
  estate: { line: "Ewet is nearly clear.", sub: "Seven of eight streets are complete. Block D is the final active collection zone.", count: "93%", unit: "estate collected" },
  business: { line: "All three sites are on schedule.", sub: "Oron Road closes at 18:30; Aka Road and Udo Udoma are already clear.", count: "18:30", unit: "next collection" },
  institution: { line: "Five facilities are compliant today.", sub: "The clinic route is complete. Engineering receives the next truck at 10:40.", count: "5 / 6", unit: "facilities complete" },
  operator: { line: "Eighteen of twenty-six stops are clear.", sub: "AKS 214 XA remains on time through Ewet. One recovery job follows Block D.", count: "18 / 26", unit: "route progress" },
  admin: { line: "Twenty-seven crews are moving through Uyo.", sub: "1,184 collections are scheduled. Twelve need intervention after one vehicle breakdown.", count: "96.4%", unit: "on-time network" },
};

function areaOf(pathname: string): Area {
  const first = pathname.split("/").filter(Boolean)[0];
  return (["app", "estate", "business", "institution", "operator", "admin"] as const).includes(first as Exclude<Area, "public">) ? first as Area : "public";
}

function getTitle(matches: ReturnType<typeof useMatches>) {
  const match = [...matches].reverse().find((item) => (item.handle as { title?: string } | undefined)?.title);
  return ((match?.handle as { title?: string } | undefined)?.title ?? "Slate").replace("Control centre", "Overview");
}

function kindOf(title: string, pathname: string, params: Readonly<Record<string, string | undefined>>, area: Area): Kind {
  if (area === "public") return "marketing";
  if (pathname.endsWith("/dashboard")) return "dashboard";
  if (Object.keys(params).length || ["Application review", "Customer", "Operator", "Payment", "Pickup", "City", "Partner"].includes(title)) return "detail";
  if (["Reports", "Analytics", "Performance"].includes(title)) return "analytics";
  if (["Finance", "Payments", "Payouts", "Invoices", "Billing", "Chargebacks", "Smart Sweep"].includes(title)) return "finance";
  if (["Settings", "System settings", "Profile", "Company profile"].includes(title)) return "settings";
  if (["Verification", "Operator verification", "Procurement", "New contract", "Get started", "Operator application"].includes(title)) return "form";
  if (["Pickups", "Pickup control centre", "Jobs", "Routes", "Calendar", "Bookings", "Request extra pickup", "Report missed pickup", "Bulk waste"].includes(title)) return "schedule";
  return "list";
}

function description(title: string, area: Area) {
  return copy[title] ?? `Manage ${title.toLowerCase()} for ${area === "admin" ? "Slate operations" : area === "operator" ? "your operating team" : "your workspace"}, using the current Uyo service data.`;
}

function Marketing({ title }: { title: string }) {
  const isPricing = title === "Pricing";
  const isFaq = title === "FAQ";
  const profile = marketingProfiles[title] ?? {
    index: String((title.length % 14) + 1).padStart(2, "0"),
    kicker: "Managed collection in Uyo",
    statement: description(title, "public"),
    metric: "96.4%",
    metricLabel: "on-time service",
    signal: "Uyo routes operating normally",
  };
  const sections = isFaq ? [
    ["What happens when a pickup is missed?", "Report it within 48 hours. Slate dispatches a recovery collection within 24 hours."],
    ["Who do I call — Slate or the operator?", "Slate. Your subscription, payment and support relationship is always with Slate."],
    ["Can I pause my service?", "Yes. Pause for up to 60 days without losing your route slot."],
    ["Are prices all-in?", "Yes. The amount shown includes operator service, supervision and customer support."],
  ] : [
    ["One accountable service", "Slate contracts the operator, supervises collection and owns the support outcome."],
    ["Verified local capacity", "Vehicles, drivers, disposal routes and documents are checked before work is assigned."],
    ["Evidence, not promises", "Every collection has a window, route state and service record you can see."],
  ];
  return <main className="bg-canvas">
    <section className="relative overflow-hidden bg-slate text-slate-ink chalk-grain">
      <RouteMap progress={0.61} tone="on-slate" showLabels className="pointer-events-none absolute inset-y-0 right-[-10%] h-full w-[78%] opacity-[.23]" />
      <div className="container-page relative z-10 grid min-h-[620px] items-center gap-12 py-24 lg:grid-cols-[1.08fr_.92fr] lg:py-32">
        <div className="max-w-3xl">
          <div className="mb-8 flex items-center gap-3"><span className="t-mono flex size-9 items-center justify-center border border-white/15 text-white/75">{profile.index}</span><span className="t-micro uppercase tracking-[.1em] text-slate-ink/58">{profile.kicker}</span></div>
          <p className="t-micro mb-4 text-slate-ink/52">{title} · Uyo, Akwa Ibom</p>
          <h1 className="font-display text-[clamp(3.35rem,2rem+5.6vw,6.8rem)] font-bold leading-[.9] tracking-[-.055em] text-slate-ink [font-variation-settings:'opsz'_96,'wdth'_82]">{profile.statement}</h1>
          <p className="mt-7 max-w-xl text-[17px] leading-7 text-slate-ink/68">{description(title, "public")}</p>
          <div className="mt-9 flex flex-wrap gap-3"><ButtonLink to="/signup" variant="signal" size="lg" trailing={<ArrowRight className="size-4" />}>Start with Slate</ButtonLink><ButtonLink to="/contact" variant="outline" size="lg" className="border-white/25 bg-white/5 text-white hover:bg-white/10">Talk to operations</ButtonLink></div>
        </div>
        <div className="relative min-h-[340px] overflow-hidden rounded-xl border border-white/10 bg-slate-950/25 lg:min-h-[430px]">
          <Strata tone="on-slate" bands={5} live chalk seed={title.length + 9} className="absolute inset-x-0 bottom-0 h-[62%] w-full opacity-70" />
          <div className="absolute inset-x-6 top-6 flex items-start justify-between border-b border-white/10 pb-5 sm:inset-x-8 sm:top-8"><div><p className="t-micro text-white/48">UYO SERVICE INDEX</p><p className="mt-2 font-display text-[44px] font-bold leading-none tracking-[-.04em] text-white tnum sm:text-[58px]">{profile.metric}</p><p className="t-small mt-2 text-white/58">{profile.metricLabel}</p></div><Badge tone="signal" dot>Live</Badge></div>
          <div className="absolute inset-x-6 bottom-6 border-l-2 border-signal bg-slate-950/72 px-4 py-3 backdrop-blur-md sm:inset-x-8 sm:bottom-8"><p className="t-micro text-white/45">CURRENT SIGNAL · 08:12 WAT</p><p className="t-h3 mt-1 text-white">{profile.signal}</p></div>
        </div>
      </div>
    </section>
    <section className="container-page grid gap-12 py-20 lg:grid-cols-[.72fr_1.28fr] lg:py-28"><div><p className="t-micro text-ink-3">How Slate works</p><h2 className="t-display mt-3 max-w-lg text-ink">Reliable collection is an operating system.</h2></div><List className="border-y border-line">{sections.map(([heading, body], index) => <ListRow key={heading} leading={<span className="t-mono flex size-9 items-center justify-center rounded-sm bg-stone text-stone-ink">0{index + 1}</span>} title={heading} subtitle={body} />)}</List></section>
    {isPricing ? <section className="border-y border-line bg-surface"><div className="container-page grid gap-px bg-line py-px sm:grid-cols-3">{[["Home Lite", "₦4,500", "One weekly collection"], ["Slate Home", "₦7,000", "Two weekly collections"], ["Commercial", "From ₦30,000", "Three collections weekly"]].map(([name, price, note]) => <div key={name} className="bg-surface p-7 lg:p-9"><p className="t-h3 text-ink">{name}</p><p className="t-display mt-5 text-ink tnum">{price}</p><p className="t-small mt-2 text-ink-2">{note} · support included</p></div>)}</div></section> : <section className="border-y border-line bg-surface py-20"><div className="container-page grid items-center gap-10 lg:grid-cols-2"><ServiceAreaMap values={{ ewet: 92, shelter: 81, osongama: 74, aka: 66, oron: 58, nwaniba: 49, abak: 34, itam: 42, uselga: 28 }} className="min-h-[320px]" /><div><p className="t-micro text-ink-3">Uyo first</p><h2 className="t-display mt-3 text-ink">Local routes. One standard.</h2><p className="t-body mt-5 max-w-xl text-ink-2">Ewet, Shelter Afrique, Osongama, Aka Road, Oron Road, Itam and Nwaniba are managed from the same control centre.</p><ButtonLink to="/cities/uyo" variant="outline" className="mt-7" trailing={<ArrowRight className="size-4" />}>See Uyo coverage</ButtonLink></div></div></section>}
    {title === "Contact" && <section className="container-page py-20"><Panel title="Send a message" description="Replies usually arrive within one working day."><form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()}><Input label="Name" placeholder="Your name" /><Input label="Email" type="email" placeholder="you@example.com" /><Select label="Topic" options={["New service", "Existing service", "Operator partnership"]} className="sm:col-span-2" /><Textarea label="Message" placeholder="Include any pickup or invoice reference." className="sm:col-span-2" /><Button type="submit" className="sm:w-fit">Send message</Button></form></Panel></section>}
    <section className="container-page py-20 text-center"><p className="t-micro text-ink-3">Ready when your area is</p><h2 className="t-display mx-auto mt-3 max-w-2xl text-ink">Your waste gets collected. We handle the rest.</h2><ButtonLink to="/signup" variant="signal" size="lg" className="mt-8">Create your account</ButtonLink></section>
  </main>;
}

function Dashboard({ title, area }: { title: string; area: Area }) {
  const toast = useToast();
  const profile = dashboardProfile[area === "public" ? "admin" : area];
  return <Page><PageHeader title={title} description={description(title, area)} actions={<Button leading={<Download className="size-4" />} variant="outline" onClick={() => toast.success("Report prepared", "The CSV is ready for this demo period.")}>Export</Button>} />
    <section className="relative min-h-[380px] overflow-hidden rounded-xl bg-slate text-slate-ink chalk-grain"><RouteMap progress={0.66} tone="on-slate" className="absolute inset-y-0 right-0 h-full w-full opacity-70 lg:w-[62%]" /><div className="relative z-10 flex min-h-[380px] max-w-[620px] flex-col justify-between bg-slate/95 p-6 sm:p-8 lg:p-10"><div><div className="flex items-center gap-2"><span className="size-2.5 animate-pulse rounded-full bg-signal" /><span className="t-micro uppercase tracking-[.08em] text-slate-ink/58">Live operation · 08:12 WAT</span></div><h2 className="mt-5 font-display text-[44px] font-bold leading-[.92] tracking-[-.05em] text-slate-ink [font-variation-settings:'opsz'_80,'wdth'_84] sm:text-[64px]">{profile.line}</h2><p className="t-body mt-5 max-w-md text-slate-ink/68">{profile.sub}</p></div><div className="mt-8 flex flex-wrap items-end justify-between gap-5 border-t border-white/12 pt-5"><div><p className="font-display text-[36px] font-bold leading-none tracking-[-.04em] text-white tnum">{profile.count}</p><p className="t-micro mt-1 text-white/48">{profile.unit}</p></div><ButtonLink to={`/${area}/pickups`} variant="signal" trailing={<ArrowRight className="size-4" />}>Open live control</ButtonLink></div></div></section>
    <StatStrip><Stat label="On-time rate" value="96.4%" delta={1.8} hint="Last 30 days" /><Stat label="Active services" value="2,477" delta={6.2} hint="Across Uyo" /><Stat label="Needs attention" value="12" delta={-25} deltaGood="down" hint="All assigned" /><Stat label="October revenue" value="₦18.42m" delta={8.4} hint="83% collected" /></StatStrip>
    <div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]"><Panel title="Service volume" description="Completed collections, May–October"><AreaChart data={[8210, 9140, 9784, 10442, 11206, 11984]} compare={[7640, 8010, 8860, 9120, 10040, 10880]} labels={["May", "Jun", "Jul", "Aug", "Sep", "Oct"]} format={(value) => value.toLocaleString()} /></Panel><Panel title="Today's outcomes"><Donut segments={[{ label: "Completed", value: 874 }, { label: "In progress", value: 238 }, { label: "Missed", value: 12, color: "var(--danger)" }, { label: "Upcoming", value: 60 }]} center={<><span className="t-h2 text-ink tnum">96.4%</span><span className="t-micro text-ink-3">on time</span></>} /></Panel></div>
  </Page>;
}

function Listing({ title, area }: { title: string; area: Area }) {
  const toast = useToast(); const [search, setSearch] = useState(""); const [view, setView] = useState<"all" | "attention">("all");
  const source = rowsFor(title);
  const filtered = source.filter((row) => `${row.name} ${row.detail} ${row.id}`.toLowerCase().includes(search.toLowerCase()) && (view === "all" || !["Active", "Verified", "Completed", "Paid", "Successful"].includes(row.status)));
  return <Page><PageHeader title={title} description={description(title, area)} actions={<><Button variant="outline" leading={<Download className="size-4" />} onClick={() => toast.success("Export ready", `${title} were exported as CSV.`)}>Export</Button><Button leading={<Plus className="size-4" />} onClick={() => toast.info(`New ${title.replace(/s$/, "").toLowerCase()}`, "The creation form is ready in this frontend demo.")}>Add {title.replace(/s$/, "").toLowerCase()}</Button></>} />
    <section className="grid gap-6 border-y border-line py-6 sm:grid-cols-[1fr_auto_auto] sm:items-end">
      <div><p className="t-micro uppercase tracking-[.08em] text-ink-3">Uyo register · 05 Oct 2026</p><p className="mt-2 font-display text-[48px] font-bold leading-none tracking-[-.045em] text-ink tnum">{source.length}</p><p className="t-small mt-2 text-ink-2">records in the current operational view</p></div>
      <div className="border-l-2 border-signal pl-4"><p className="t-micro text-ink-3">Needs attention</p><p className="t-h2 mt-1 text-ink tnum">{source.filter((row) => !["Active", "Verified", "Completed", "Paid", "Successful", "Resolved", "Sent"].includes(row.status)).length}</p></div>
      <div className="border-l border-line pl-4"><p className="t-micro text-ink-3">Last reconciled</p><p className="t-h3 mt-1 text-ink tnum">08:04 WAT</p></div>
    </section>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center"><SearchInput compact value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${title.toLowerCase()}`} className="sm:max-w-sm" /><Segmented value={view} onChange={setView} options={[{ value: "all", label: `All ${source.length}` }, { value: "attention", label: "Needs attention" }]} size="sm" /><Button variant="outline" className="sm:ml-auto" leading={<Filter className="size-4" />}>Filters</Button></div>
    <section className="overflow-hidden border-y border-line bg-surface/80 backdrop-blur-sm"><div className="grid grid-cols-[1fr_auto] border-b border-line bg-sunken/50 px-5 py-3 t-micro uppercase tracking-[.07em] text-ink-3 sm:grid-cols-[1.2fr_1fr_150px_130px] sm:px-6"><span>{title.replace(/s$/, "")}</span><span className="hidden sm:block">Operational detail</span><span className="hidden sm:block">Reference</span><span>Status</span></div><List className="px-5 sm:px-6">{filtered.map((row, index) => <ListRow key={row.id} leading={<span className={cn("t-mono flex size-9 items-center justify-center rounded-sm", index === 0 ? "bg-slate text-slate-ink" : "bg-sunken text-ink-2")}>{String(index + 1).padStart(2, "0")}</span>} title={row.name} subtitle={row.detail} meta={<span className="hidden sm:block"><Ref>{row.id}</Ref><br /><span>{row.meta}</span></span>} trailing={<StatusBadge status={row.status} />} chevron />)}</List>{!filtered.length && <div className="p-10 text-center"><p className="t-h3 text-ink">No matching {title.toLowerCase()}</p><p className="t-small mt-1 text-ink-2">Try a different search or show all records.</p></div>}</section>
  </Page>;
}

function Detail({ title, area }: { title: string; area: Area }) {
  const toast = useToast(); const params = useParams(); const location = useLocation(); const id = (Object.values(params)[0] ?? location.pathname.split("/").pop() ?? "record").toUpperCase(); const root = `/${area}/${location.pathname.split("/").filter(Boolean)[1] ?? "dashboard"}`;
  return <Page><PageHeader back={{ to: root, label: `Back to ${title.toLowerCase()}s` }} eyebrow={<Ref>{id}</Ref>} title={`${title} record`} description="A complete operational record with service, payment and evidence history." meta={<StatusBadge status="Active" />} actions={<><Button variant="outline" onClick={() => toast.info("Note added", "The record timeline has been updated.")}>Add note</Button><Button onClick={() => toast.success(`${title} updated`, "Changes were saved locally.")}>Edit {title.toLowerCase()}</Button></>} />
    <section className="relative overflow-hidden rounded-xl bg-slate text-slate-ink chalk-grain"><RouteMap progress={0.78} tone="on-slate" className="absolute inset-y-0 right-0 h-full w-full opacity-55 lg:w-[55%]" /><div className="relative z-10 grid min-h-[300px] gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_.9fr] lg:p-10"><div className="flex flex-col justify-between"><div><p className="t-micro uppercase tracking-[.08em] text-white/45">Service passport · {id}</p><h2 className="mt-4 max-w-xl font-display text-[42px] font-bold leading-[.95] tracking-[-.045em] text-white sm:text-[56px]">Ewet service is on standard.</h2><p className="t-body mt-5 max-w-md text-white/65">Ufok Environmental completed the last four visits inside the promised collection window.</p></div><div className="mt-8 flex items-end gap-8 border-t border-white/12 pt-5"><div><p className="font-display text-[36px] font-bold leading-none text-white tnum">96.4%</p><p className="t-micro mt-1 text-white/45">30-day on-time rate</p></div><div><p className="t-h2 text-white tnum">07:42</p><p className="t-micro mt-1 text-white/45">latest collection</p></div></div></div></div></section>
    <div className="grid gap-8 lg:grid-cols-[1.25fr_.75fr]"><div className="flex flex-col gap-8"><section className="border-t border-line pt-6"><h3 className="t-h2 text-ink">Record details</h3><DescriptionList columns={2} className="mt-5" items={[{ label: "Reference", value: id, mono: true }, { label: "Status", value: "Active" }, { label: "Service area", value: "Ewet Housing Estate, Uyo" }, { label: "Assigned operator", value: "Ufok Environmental Services" }, { label: "Created", value: "18 Sep 2026, 11:24" }, { label: "Owner", value: "Ekemini James" }]} /></section><section className="border-t border-line pt-6"><h3 className="t-h2 text-ink">Activity</h3><div className="mt-5"><Timeline items={[{ title: "Operations review completed", time: "Today, 08:04", description: "No exception found in the current service window.", state: "done" }, { title: "Evidence received", time: "Yesterday, 16:42", description: "Driver photo and location proof attached.", state: "done" }, { title: "Next service check", time: "8 Oct, 09:00", description: "Automated review after the next collection.", state: "upcoming" }]} /></div></section></div><div className="flex flex-col gap-6"><section className="border-l-2 border-signal bg-surface/75 p-5 backdrop-blur-sm"><p className="t-micro text-ink-3">CURRENT SERVICE</p><p className="mt-3 font-display text-[38px] font-bold leading-none tracking-[-.03em] text-ink tnum">96.4%</p><p className="t-small mt-2 text-ink-2">On-time performance over 30 days</p><ProgressBar value={96.4} tone="signal" className="mt-5" /></section><section className="border-t border-line pt-5"><h3 className="t-h3 text-ink">People on this record</h3><List className="mt-3"><ListRow title="Ekemini James" subtitle="Operations owner · +234 803 412 7792" leading={<Avatar name="Ekemini James" />} /><ListRow title="Ufok Environmental" subtitle="Contracted operator" leading={<Building2 className="size-5 text-ink-2" />} chevron /></List></section><Alert tone="info" title="Demo record">This frontend uses believable local data; no backend request is made.</Alert></div></div>
  </Page>;
}

function Schedule({ title, area }: { title: string; area: Area }) {
  const [day, setDay] = useState<"today" | "week">("today"); const rows = rowsByTitle.Pickups!;
  return <Page><PageHeader title={title} description={description(title, area)} actions={<Button leading={<Plus className="size-4" />}>Create {title === "Routes" ? "route" : "booking"}</Button>} />
    <section className="relative overflow-hidden rounded-xl bg-slate p-6 text-slate-ink chalk-grain lg:min-h-[340px] lg:p-8"><RouteMap progress={0.58} tone="on-slate" className="absolute inset-0 size-full opacity-75" /><div className="relative z-10 max-w-sm rounded-lg border border-white/10 bg-slate-950/75 p-5 backdrop-blur-md"><div className="flex items-center gap-2"><span className="size-2.5 animate-pulse rounded-full bg-signal" /><span className="t-micro text-white/60">Live route</span></div><p className="t-h2 mt-3 text-white">Ewet route A</p><p className="t-small mt-1 text-white/65">Truck AKS 214 XA · 2 stops to 14 Ewet</p><div className="mt-5 flex items-end justify-between"><span className="font-display text-[34px] font-bold text-white tnum">18 / 26</span><Badge tone="signal">07:42 ETA</Badge></div></div></section>
    <div className="flex items-center justify-between gap-3"><Segmented value={day} onChange={setDay} options={[{ value: "today", label: "Today" }, { value: "week", label: "This week" }]} /><Button variant="outline" leading={<CalendarDays className="size-4" />}>5 Oct 2026</Button></div>
    <Panel padded={false} title="Service queue" description={`${day === "today" ? "Today's" : "This week's"} routed work`}><List className="px-5 sm:px-6">{rows.map((row, index) => <ListRow key={row.id} leading={<span className={cn("t-mono flex size-9 items-center justify-center rounded-sm", index === 0 ? "bg-signal text-signal-ink" : "bg-sunken text-ink-2")}>{String(index + 1).padStart(2, "0")}</span>} title={row.name} subtitle={row.detail} meta={row.meta} trailing={<StatusBadge status={row.status} />} chevron />)}</List></Panel>
  </Page>;
}

function Analytics({ title, area }: { title: string; area: Area }) {
  const toast = useToast();
  return <Page><PageHeader title={title} description={description(title, area)} actions={<Button variant="outline" leading={<Download className="size-4" />} onClick={() => toast.success("Report ready", "The selected period was exported.")}>Export report</Button>} /><StatStrip><Stat label="Collections" value="11,984" delta={7.1} hint="October to date" /><Stat label="On time" value="96.4%" delta={1.8} hint="+2.1 pts vs May" /><Stat label="Missed" value="184" delta={-22.4} deltaGood="down" hint="1.5% of total" /><Stat label="Recovery under 24h" value="92.7%" delta={4.6} hint="171 recovered" /></StatStrip><Panel title="Six-month service trend"><AreaChart data={[8210, 9140, 9784, 10442, 11206, 11984]} compare={[7640, 8010, 8860, 9120, 10040, 10880]} labels={["May", "Jun", "Jul", "Aug", "Sep", "Oct"]} format={(value) => value.toLocaleString()} /></Panel><div className="grid gap-6 lg:grid-cols-2"><Panel title="Collection outcomes"><BarChart data={[1882, 2014, 2140, 2288, 2430, 2561]} stacked={[42, 38, 34, 31, 26, 24]} labels={["May", "Jun", "Jul", "Aug", "Sep", "Oct"]} highlight={5} /></Panel><Panel title="Customer mix"><Donut segments={[{ label: "Household", value: 1624 }, { label: "Business", value: 492 }, { label: "Estate", value: 241 }, { label: "Institution", value: 120 }]} center={<><span className="t-h2 text-ink tnum">2,477</span><span className="t-micro text-ink-3">services</span></>} /></Panel></div></Page>;
}

function Finance({ title, area }: { title: string; area: Area }) {
  const toast = useToast(); const rows = title === "Invoices" ? rowsByTitle.Invoices! : rowsByTitle.Payments!;
  return <Page><PageHeader title={title} description={description(title, area)} actions={<Button variant="outline" leading={<Download className="size-4" />} onClick={() => toast.success("Statement ready", "The October statement was generated.")}>Download statement</Button>} /><section className="grid gap-8 border-y border-line py-7 lg:grid-cols-[1.1fr_.9fr] lg:items-end"><div><p className="t-micro text-ink-3">October collected</p><p className="mt-2 font-display text-[52px] font-bold leading-none tracking-[-.04em] text-ink tnum sm:text-[72px]">₦18.42m</p><p className="t-body mt-4 text-ink-2">₦3.71m remains due before operator settlement on 8 October.</p></div><div className="grid grid-cols-2 gap-6"><Stat label="Collection rate" value="83.2%" delta={3.4} /><Stat label="Failed payments" value="47" delta={-14.5} deltaGood="down" /></div></section><Panel title="Cash movement"><BarChart data={[640, 920, 1110, 860, 1480, 1320, 1760, 1530, 1910, 2120, 1840, 2000]} labels={["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]} highlight={11} format={(value) => formatNairaShort(value * 1000)} /></Panel><Panel padded={false} title={title === "Invoices" ? "Latest invoices" : "Latest transactions"}><List className="px-5 sm:px-6">{rows.map((row) => <ListRow key={row.id} leading={<span className="flex size-10 items-center justify-center rounded-md bg-sunken"><CircleDollarSign className="size-5 text-ink-2" /></span>} title={row.name} subtitle={row.detail} meta={<><Ref>{row.id}</Ref><br />{row.meta}</>} trailing={<StatusBadge status={row.status} />} chevron />)}</List></Panel></Page>;
}

function Settings({ title, area }: { title: string; area: Area }) {
  const toast = useToast(); const [email, setEmail] = useState(true); const [sms, setSms] = useState(true); const [weekly, setWeekly] = useState(false);
  return <Page className="max-w-5xl"><PageHeader title={title} description={description(title, area)} /><div className="grid gap-10 lg:grid-cols-[220px_1fr]"><aside className="lg:sticky lg:top-24 lg:self-start"><p className="t-micro uppercase tracking-[.08em] text-ink-3">Workspace index</p><p className="mt-3 font-display text-[30px] font-bold leading-tight tracking-[-.03em] text-ink">Slate Uyo</p><p className="t-small mt-2 text-ink-2">Last security review<br />28 September 2026</p><div className="mt-6 h-1 w-16 bg-signal" /></aside><div className="flex flex-col gap-10"><section className="border-t border-line pt-6"><h2 className="t-h2 text-ink">Workspace details</h2><p className="t-small mt-1 text-ink-2">Identity and contact information used on service records.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><Input label="Display name" defaultValue={area === "operator" ? "Ufok Environmental Services" : "Slate Uyo workspace"} /><Input label="Support email" type="email" defaultValue="operations@slate.ng" /><Input label="Phone" defaultValue="+234 700 752 8300" /><Select label="Timezone" defaultValue="wat" options={[{ value: "wat", label: "West Africa Time (WAT)" }]} /></div></section><section className="border-t border-line pt-6"><h2 className="t-h2 text-ink">Notifications</h2><div className="mt-3 flex flex-col divide-y divide-line"><div className="py-4"><Switch checked={email} onChange={setEmail} label="Email summaries" description="Daily service and payment digest at 18:00" /></div><div className="py-4"><Switch checked={sms} onChange={setSms} label="SMS service alerts" description="Missed pickups, route delays and payment failures" /></div><div className="py-4"><Switch checked={weekly} onChange={setWeekly} label="Weekly performance review" description="Every Monday for the previous service week" /></div></div></section><section className="border-t border-line pt-6"><h2 className="t-h2 text-ink">Security</h2><List className="mt-3"><ListRow leading={<ShieldCheck className="size-5 text-ink-2" />} title="Two-factor authentication" subtitle="Authenticator app · enabled" trailing={<StatusBadge status="Active" />} chevron /><ListRow leading={<Users className="size-5 text-ink-2" />} title="Active sessions" subtitle="2 trusted devices" chevron /></List></section><div className="flex justify-end border-t border-line pt-5"><Button onClick={() => toast.success("Settings saved", "Your workspace preferences were updated.")}>Save changes</Button></div></div></div></Page>;
}

function Form({ title, area }: { title: string; area: Area }) {
  const toast = useToast();
  const [stage, setStage] = useState<"details" | "evidence" | "review">("details");
  const stages = ["details", "evidence", "review"] as const;
  const isProcurement = title === "Procurement";
  const profile = isProcurement
    ? {
        ref: "PROC-26-041",
        label: "Purchase request",
        heading: "Route one service request through a complete approval trail.",
        section: "Purchase brief",
        note: "Scope, owner and budget for the next institutional service period.",
        signal: "₦840k",
        signalLabel: "quarterly budget",
        facts: [["Quotes", "3 required"], ["Reviewers", "2 assigned"], ["Target", "8 Oct 2026"]],
      }
    : {
        ref: title === "New contract" ? "CT-DRAFT-118" : "APP-UYO-0148",
        label: title === "Verification" || title === "Operator verification" ? "Verification file" : "Application",
        heading: "Build a record the operations team can verify without guesswork.",
        section: "Organisation details",
        note: "Registered identity and service capacity for the Uyo operating area.",
        signal: "2 days",
        signalLabel: "review target",
        facts: [["Evidence", "3 documents"], ["Coverage", "Uyo"], ["Owner", "Imaobong Etim"]],
      };
  const stageIndex = stages.indexOf(stage);

  return (
    <Page className="max-w-6xl">
      <PageHeader title={title} description={description(title, area)} meta={<Badge tone="info">Draft saved</Badge>} />
      <section className="overflow-hidden border-y border-line bg-surface/72 backdrop-blur-sm">
        <div className="grid lg:grid-cols-[250px_1fr]">
          <aside className="border-b border-line bg-slate p-5 text-slate-ink chalk-grain sm:p-6 lg:border-b-0 lg:border-r lg:border-white/10 lg:p-7">
            <p className="t-micro uppercase tracking-[.09em] text-white/45">{profile.label}</p>
            <p className="t-mono mt-2 text-white/80">{profile.ref}</p>
            <h2 className="mt-7 max-w-[220px] font-display text-[30px] font-bold leading-[1.02] tracking-[-.035em] text-white">{profile.heading}</h2>
            <nav aria-label="Application progress" className="mt-8 grid grid-cols-3 gap-px bg-white/10 lg:grid-cols-1">
              {stages.map((item, index) => {
                const active = item === stage;
                const complete = index < stageIndex;
                return <button key={item} type="button" onClick={() => setStage(item)} className={cn("group relative flex min-h-16 items-center gap-3 bg-slate px-3 py-3 text-left transition-colors hover:bg-white/5 lg:px-0", active && "bg-white/7")}>
                  <span className={cn("t-mono flex size-7 shrink-0 items-center justify-center border text-white/50", active && "border-signal bg-signal text-signal-ink", complete && "border-white/20 bg-white/10 text-white")}>{complete ? <Check className="size-3.5" /> : `0${index + 1}`}</span>
                  <span className={cn("t-small hidden capitalize text-white/48 sm:block", active && "font-semibold text-white")}>{item}</span>
                  {active && <span className="absolute inset-y-2 right-0 w-0.5 bg-signal" />}
                </button>;
              })}
            </nav>
            <div className="mt-8 hidden border-t border-white/12 pt-5 lg:block">
              <p className="font-display text-[34px] font-bold leading-none text-white tnum">{profile.signal}</p>
              <p className="t-micro mt-2 text-white/45">{profile.signalLabel}</p>
            </div>
          </aside>

          <div className="p-5 sm:p-7 lg:p-9 xl:p-10">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
              <div><p className="t-micro text-ink-3">STEP {stageIndex + 1} OF 3 · AUTO-SAVED 08:11</p><h3 className="t-h2 mt-2 text-ink">{stage === "details" ? profile.section : stage === "evidence" ? "Supporting evidence" : "Review and submit"}</h3><p className="t-small mt-1 max-w-xl text-ink-2">{stage === "details" ? profile.note : stage === "evidence" ? "Attach the records the review team needs to approve this request." : "Confirm the service, evidence and approval route before submission."}</p></div>
              <span className="t-mono border border-line bg-sunken px-3 py-2 text-ink-2">{profile.ref}</span>
            </div>

            <div className="grid gap-8 pt-7 xl:grid-cols-[1fr_210px]">
              <div>
                {stage === "details" && (isProcurement ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Request title" defaultValue="Q4 clinical waste service" />
                    <Input label="Department" defaultValue="Facilities & Operations" />
                    <Select label="Service type" defaultValue="institutional" options={[{ value: "institutional", label: "Institutional collection" }, { value: "bulk", label: "Bulk collection" }]} />
                    <Input label="Quarterly budget" defaultValue="₦840,000" />
                    <Input label="Review owner" defaultValue="Imaobong Etim" />
                    <Input label="Service needed by" defaultValue="12 October 2026" />
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Legal name" defaultValue="Ufok Environmental Services" />
                    <Input label="Registration number" defaultValue="RC 882104" />
                    <Select label="Service type" defaultValue="household" options={[{ value: "household", label: "Household collection" }, { value: "commercial", label: "Commercial collection" }, { value: "institutional", label: "Institutional collection" }]} />
                    <Input label="Primary contact" defaultValue="Ekemini James" />
                    <Input label="Email" type="email" defaultValue="operations@ufokenvironmental.ng" />
                    <Input label="Phone" defaultValue="+234 803 412 7792" />
                  </div>
                ))}
                {stage === "evidence" && (
                  <div className="flex flex-col gap-3">
                    <Alert tone="info" title="Evidence standard">{isProcurement ? "Attach the approved brief, comparable quotations and budget confirmation." : "Attach a valid licence, insurance certificate and one vehicle ownership record."}</Alert>
                    {(isProcurement ? ["Approved service brief", "Three comparable quotations", "Budget confirmation"] : ["Waste handling licence", "Public liability insurance", "Vehicle evidence"]).map((item, index) => (
                      <label key={item} className="flex min-h-24 cursor-pointer items-center justify-between gap-4 border-b border-line px-1 py-4">
                        <span className="flex items-center gap-4"><span className="t-mono flex size-9 items-center justify-center bg-sunken text-ink-3">0{index + 1}</span><span><span className="t-body font-medium text-ink">{item}</span><span className="t-small mt-1 block text-ink-3">PDF, PNG or JPG · up to 10 MB</span></span></span>
                        <Button variant="outline" size="sm">Choose file</Button><input className="sr-only" type="file" />
                      </label>
                    ))}
                  </div>
                )}
                {stage === "review" && (
                  <DescriptionList columns={2} items={isProcurement ? [
                    { label: "Request", value: "Q4 clinical waste service" }, { label: "Reference", value: profile.ref, mono: true }, { label: "Department", value: "Facilities & Operations" }, { label: "Budget", value: "₦840,000" }, { label: "Evidence", value: "3 records attached" }, { label: "Approval route", value: "Facilities → Finance" },
                  ] : [
                    { label: "Legal name", value: "Ufok Environmental Services" }, { label: "Registration", value: "RC 882104", mono: true }, { label: "Service", value: "Household collection" }, { label: "Coverage", value: "Uyo, Akwa Ibom" }, { label: "Documents", value: "3 attached" }, { label: "Review target", value: "2 working days" },
                  ]} />
                )}
              </div>

              <aside className="border-l-2 border-signal bg-sunken/55 p-5">
                <FileText className="size-5 text-ink-2" />
                <p className="t-h3 mt-4 text-ink">Review standard</p>
                <dl className="mt-5 flex flex-col divide-y divide-line">{profile.facts.map(([label, value]) => <div key={label} className="py-3 first:pt-0"><dt className="t-micro text-ink-3">{label}</dt><dd className="t-small mt-1 font-semibold text-ink">{value}</dd></div>)}</dl>
              </aside>
            </div>

            <div className="mt-9 flex items-center justify-between border-t border-line pt-5">
              <Button variant="ghost" disabled={stage === "details"} onClick={() => setStage(stages[Math.max(0, stageIndex - 1)]!)}>Back</Button>
              {stage !== "review" ? <Button onClick={() => setStage(stages[stageIndex + 1]!)}>Continue to {stages[stageIndex + 1]}</Button> : <Button onClick={() => toast.success("Submitted for review", `Reference ${profile.ref} has been created.`)}>Submit for review</Button>}
            </div>
          </div>
        </div>
      </section>
    </Page>
  );
}

export default function RoutePage() {
  const location = useLocation(); const matches = useMatches(); const params = useParams(); const area = areaOf(location.pathname); const title = getTitle(matches); const kind = kindOf(title, location.pathname, params, area);
  return useMemo(() => {
    if (kind === "marketing") return <Marketing title={title} />;
    if (kind === "dashboard") return <Dashboard title={title} area={area} />;
    if (kind === "detail") return <Detail title={title} area={area} />;
    if (kind === "schedule") return <Schedule title={title} area={area} />;
    if (kind === "analytics") return <Analytics title={title} area={area} />;
    if (kind === "finance") return <Finance title={title} area={area} />;
    if (kind === "settings") return <Settings title={title} area={area} />;
    if (kind === "form") return <Form title={title} area={area} />;
    return <Listing title={title} area={area} />;
  }, [area, kind, title]);
}
