import { useMemo, useState } from "react";
import { useLocation, useMatches, useParams } from "react-router";
import { ArrowRight, Building2, CalendarDays, CircleDollarSign, Download, Filter, Plus, ShieldCheck, Users } from "lucide-react";
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
      <div className="container-page relative z-10 grid min-h-[560px] items-center gap-10 py-24 lg:grid-cols-[1.08fr_.92fr] lg:py-32">
        <div className="max-w-3xl"><p className="t-micro mb-5 text-slate-ink/65">Slate · Uyo, Akwa Ibom</p><h1 className="t-display-xl text-slate-ink">{title}</h1><p className="mt-6 max-w-2xl text-[18px] leading-8 text-slate-ink/75">{description(title, "public")}</p><div className="mt-9 flex flex-wrap gap-3"><ButtonLink to="/signup" variant="signal" size="lg" trailing={<ArrowRight className="size-4" />}>Start with Slate</ButtonLink><ButtonLink to="/contact" variant="outline" size="lg" className="border-white/25 bg-white/5 text-white hover:bg-white/10">Talk to our team</ButtonLink></div></div>
        <div className="relative hidden min-h-[360px] overflow-hidden rounded-xl border border-white/10 bg-slate-900/30 lg:block"><Strata tone="on-slate" bands={5} live chalk seed={title.length + 9} className="absolute inset-0 size-full" /><div className="absolute inset-x-8 bottom-8 rounded-lg border border-white/12 bg-slate-950/72 p-5 backdrop-blur-md"><div className="flex items-center justify-between gap-4"><div><p className="t-micro text-white/55">Service signal</p><p className="t-h3 mt-1 text-white">Uyo routes are operating normally</p></div><Badge tone="signal" dot>Live</Badge></div></div></div>
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
  return <Page><PageHeader title={title} description={description(title, area)} actions={<Button leading={<Download className="size-4" />} variant="outline" onClick={() => toast.success("Report prepared", "The CSV is ready for this demo period.")}>Export</Button>} />
    <section className="relative min-h-[300px] overflow-hidden rounded-xl bg-slate p-6 text-slate-ink chalk-grain sm:p-8 lg:p-10"><RouteMap progress={0.66} tone="on-slate" className="absolute inset-y-0 right-0 h-full w-full opacity-75 lg:w-[58%]" /><div className="relative z-10 max-w-lg"><div className="flex items-center gap-2"><span className="size-2.5 animate-pulse rounded-full bg-signal" /><span className="t-micro text-slate-ink/65">Live operation · 08:12 WAT</span></div><h2 className="mt-5 font-display text-[44px] font-bold leading-[.98] tracking-[-.035em] text-slate-ink sm:text-[58px]">27 crews are moving through Uyo.</h2><p className="t-body mt-5 max-w-md text-slate-ink/70">1,184 collections scheduled today. Twelve need intervention after one vehicle breakdown.</p><ButtonLink to={`/${area}/pickups`} variant="signal" className="mt-7" trailing={<ArrowRight className="size-4" />}>Open live control</ButtonLink></div></section>
    <StatStrip><Stat label="On-time rate" value="96.4%" delta={1.8} hint="Last 30 days" /><Stat label="Active services" value="2,477" delta={6.2} hint="Across Uyo" /><Stat label="Needs attention" value="12" delta={-25} deltaGood="down" hint="All assigned" /><Stat label="October revenue" value="₦18.42m" delta={8.4} hint="83% collected" /></StatStrip>
    <div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]"><Panel title="Service volume" description="Completed collections, May–October"><AreaChart data={[8210, 9140, 9784, 10442, 11206, 11984]} compare={[7640, 8010, 8860, 9120, 10040, 10880]} labels={["May", "Jun", "Jul", "Aug", "Sep", "Oct"]} format={(value) => value.toLocaleString()} /></Panel><Panel title="Today's outcomes"><Donut segments={[{ label: "Completed", value: 874 }, { label: "In progress", value: 238 }, { label: "Missed", value: 12, color: "var(--danger)" }, { label: "Upcoming", value: 60 }]} center={<><span className="t-h2 text-ink tnum">96.4%</span><span className="t-micro text-ink-3">on time</span></>} /></Panel></div>
  </Page>;
}

function Listing({ title, area }: { title: string; area: Area }) {
  const toast = useToast(); const [search, setSearch] = useState(""); const [view, setView] = useState<"all" | "attention">("all");
  const source = rowsByTitle[title] ?? defaults.map((row) => ({ ...row, name: `${title.replace(/s$/, "")} · ${row.name}` }));
  const filtered = source.filter((row) => `${row.name} ${row.detail} ${row.id}`.toLowerCase().includes(search.toLowerCase()) && (view === "all" || !["Active", "Verified", "Completed", "Paid", "Successful"].includes(row.status)));
  return <Page><PageHeader title={title} description={description(title, area)} actions={<><Button variant="outline" leading={<Download className="size-4" />} onClick={() => toast.success("Export ready", `${title} were exported as CSV.`)}>Export</Button><Button leading={<Plus className="size-4" />} onClick={() => toast.info(`New ${title.replace(/s$/, "").toLowerCase()}`, "The creation form is ready in this frontend demo.")}>Add {title.replace(/s$/, "").toLowerCase()}</Button></>} />
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center"><SearchInput compact value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${title.toLowerCase()}`} className="sm:max-w-sm" /><Segmented value={view} onChange={setView} options={[{ value: "all", label: `All ${source.length}` }, { value: "attention", label: "Needs attention" }]} size="sm" /><Button variant="outline" className="sm:ml-auto" leading={<Filter className="size-4" />}>Filters</Button></div>
    <Panel padded={false}><div className="grid grid-cols-[1fr_auto] border-b border-line bg-sunken/60 px-5 py-3 t-micro text-ink-3 sm:grid-cols-[1.2fr_1fr_150px_130px] sm:px-6"><span>{title.replace(/s$/, "")}</span><span className="hidden sm:block">Details</span><span className="hidden sm:block">Reference</span><span>Status</span></div><List className="px-5 sm:px-6">{filtered.map((row) => <ListRow key={row.id} leading={<Avatar name={row.name} square />} title={row.name} subtitle={row.detail} meta={<span className="hidden sm:block"><Ref>{row.id}</Ref><br /><span>{row.meta}</span></span>} trailing={<StatusBadge status={row.status} />} chevron />)}</List>{!filtered.length && <div className="p-8 text-center"><p className="t-h3 text-ink">No matching {title.toLowerCase()}</p><p className="t-small mt-1 text-ink-2">Try a different search or show all records.</p></div>}</Panel>
  </Page>;
}

function Detail({ title, area }: { title: string; area: Area }) {
  const toast = useToast(); const params = useParams(); const location = useLocation(); const id = (Object.values(params)[0] ?? location.pathname.split("/").pop() ?? "record").toUpperCase(); const root = `/${area}/${location.pathname.split("/").filter(Boolean)[1] ?? "dashboard"}`;
  return <Page><PageHeader back={{ to: root, label: `Back to ${title.toLowerCase()}s` }} eyebrow={<Ref>{id}</Ref>} title={`${title} record`} description="A complete operational record with service, payment and evidence history." meta={<StatusBadge status="Active" />} actions={<><Button variant="outline" onClick={() => toast.info("Note added", "The record timeline has been updated.")}>Add note</Button><Button onClick={() => toast.success(`${title} updated`, "Changes were saved locally.")}>Edit {title.toLowerCase()}</Button></>} />
    <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]"><div className="flex flex-col gap-6"><Panel title="Overview"><DescriptionList columns={2} items={[{ label: "Reference", value: id, mono: true }, { label: "Status", value: "Active" }, { label: "Service area", value: "Ewet Housing Estate, Uyo" }, { label: "Assigned operator", value: "Ufok Environmental Services" }, { label: "Created", value: "18 Sep 2026, 11:24" }, { label: "Owner", value: "Ekemini James" }]} /></Panel><Panel title="Activity"><Timeline items={[{ title: "Operations review completed", time: "Today, 08:04", description: "No exception found in the current service window.", state: "done" }, { title: "Evidence received", time: "Yesterday, 16:42", description: "Driver photo and location proof attached.", state: "done" }, { title: "Next service check", time: "8 Oct, 09:00", description: "Automated review after the next collection.", state: "upcoming" }]} /></Panel></div><div className="flex flex-col gap-6"><Panel tone="slate" title="Current service"><p className="font-display text-[38px] font-bold leading-none tracking-[-.03em] tnum">96.4%</p><p className="t-small mt-2 text-slate-ink/70">On-time performance over 30 days</p><ProgressBar value={96.4} tone="signal" className="mt-5" /></Panel><Panel title="Contact"><List><ListRow title="Ekemini James" subtitle="Operations owner · +234 803 412 7792" leading={<Avatar name="Ekemini James" />} /><ListRow title="Ufok Environmental" subtitle="Contracted operator" leading={<Building2 className="size-5 text-ink-2" />} chevron /></List></Panel><Alert tone="info" title="Demo record">This frontend uses believable local data; no backend request is made.</Alert></div></div>
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
  return <Page narrow><PageHeader title={title} description={description(title, area)} /><Panel title="Workspace details"><div className="grid gap-4 sm:grid-cols-2"><Input label="Display name" defaultValue={area === "operator" ? "Ufok Environmental Services" : "Slate Uyo workspace"} /><Input label="Support email" type="email" defaultValue="operations@slate.ng" /><Input label="Phone" defaultValue="+234 700 752 8300" /><Select label="Timezone" defaultValue="wat" options={[{ value: "wat", label: "West Africa Time (WAT)" }]} /></div></Panel><Panel title="Notifications"><div className="flex flex-col divide-y divide-line"><div className="py-4 first:pt-0"><Switch checked={email} onChange={setEmail} label="Email summaries" description="Daily service and payment digest at 18:00" /></div><div className="py-4"><Switch checked={sms} onChange={setSms} label="SMS service alerts" description="Missed pickups, route delays and payment failures" /></div><div className="py-4 last:pb-0"><Switch checked={weekly} onChange={setWeekly} label="Weekly performance review" description="Every Monday for the previous service week" /></div></div></Panel><Panel title="Security"><List><ListRow leading={<ShieldCheck className="size-5 text-ink-2" />} title="Two-factor authentication" subtitle="Authenticator app · enabled" trailing={<StatusBadge status="Active" />} chevron /><ListRow leading={<Users className="size-5 text-ink-2" />} title="Active sessions" subtitle="2 trusted devices" chevron /></List></Panel><div className="flex justify-end"><Button onClick={() => toast.success("Settings saved", "Your workspace preferences were updated.")}>Save changes</Button></div></Page>;
}

function Form({ title, area }: { title: string; area: Area }) {
  const toast = useToast();
  const [stage, setStage] = useState<"details" | "evidence" | "review">("details");
  const stages = ["details", "evidence", "review"] as const;

  return (
    <Page narrow>
      <PageHeader title={title} description={description(title, area)} meta={<Badge tone="info">Draft saved</Badge>} />
      <Segmented
        value={stage}
        onChange={setStage}
        options={[
          { value: "details", label: "Details" },
          { value: "evidence", label: "Evidence" },
          { value: "review", label: "Review" },
        ]}
      />
      <Panel title={stage === "details" ? "Organisation details" : stage === "evidence" ? "Supporting evidence" : "Review and submit"}>
        {stage === "details" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Legal name" placeholder="Registered organisation name" />
            <Input label="Registration number" placeholder="RC 123456" />
            <Select label="Service type" options={["Household collection", "Commercial collection", "Institutional collection"]} />
            <Input label="Primary contact" placeholder="Full name" />
            <Input label="Email" type="email" placeholder="name@company.ng" />
            <Input label="Phone" placeholder="+234" />
          </div>
        )}
        {stage === "evidence" && (
          <div className="flex flex-col gap-4">
            <Alert tone="info" title="Accepted evidence">Upload a valid licence, insurance certificate and one vehicle ownership record.</Alert>
            {["Waste handling licence", "Public liability insurance", "Vehicle evidence"].map((item) => (
              <label key={item} className="flex min-h-24 cursor-pointer items-center justify-between gap-4 rounded-md border border-dashed border-line-strong bg-sunken/40 p-4">
                <span><span className="t-body font-medium text-ink">{item}</span><span className="t-small mt-1 block text-ink-3">PDF, PNG or JPG · up to 10 MB</span></span>
                <Button variant="outline" size="sm">Choose file</Button>
                <input className="sr-only" type="file" />
              </label>
            ))}
          </div>
        )}
        {stage === "review" && (
          <DescriptionList columns={2} items={[
            { label: "Legal name", value: "Ufok Environmental Services" },
            { label: "Registration", value: "RC 882104", mono: true },
            { label: "Service", value: "Household collection" },
            { label: "Coverage", value: "Uyo, Akwa Ibom" },
            { label: "Documents", value: "3 attached" },
            { label: "Review target", value: "2 working days" },
          ]} />
        )}
      </Panel>
      <div className="flex items-center justify-between">
        <Button variant="ghost" disabled={stage === "details"} onClick={() => setStage(stages[Math.max(0, stages.indexOf(stage) - 1)]!)}>Back</Button>
        {stage !== "review" ? (
          <Button onClick={() => setStage(stages[stages.indexOf(stage) + 1]!)}>Continue</Button>
        ) : (
          <Button onClick={() => toast.success("Submitted for review", "Reference APP-UYO-0148 has been created.")}>Submit for review</Button>
        )}
      </div>
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
