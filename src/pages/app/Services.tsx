import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Check, ChevronRight, MessagesSquare } from "lucide-react";
import { Strata } from "@/components/brand/Strata";
import { Badge, Button, EmptyState, FilterBar, Page, PageHeader, SearchInput } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";
import { AREAS, me, services, type Service } from "@/data";
import { CATEGORIES, CATEGORY_ICON, ContactSheet, COVERAGE, coverageLabel, covers } from "./_core";
import { SUBSCRIPTIONS } from "./_subs";

const PRICE_BANDS = ["Under ₦5,000", "₦5,000 – ₦30,000", "Over ₦30,000", "Priced by quote"];
const FREQUENCIES = ["Weekly", "Twice weekly", "Three times weekly", "Daily", "Monthly", "One-time"];
const WASTE_TYPES = [...new Set(services.flatMap((s) => s.wasteTypes))].sort();

const priceBand = (s: Service) =>
  s.pricingModel === "Quote" ? "Priced by quote" : s.priceFrom < 5000 ? "Under ₦5,000" : s.priceFrom <= 30000 ? "₦5,000 – ₦30,000" : "Over ₦30,000";

const SHORT_CAT: Record<Service["category"], string> = {
  "Household Waste": "Household",
  "Commercial Waste": "Commercial",
  "Estate Waste Management": "Estate",
  "Institutional Waste": "Institutional",
  "Bulk Waste": "Bulk",
  Recycling: "Recycling",
  "Special Collection": "Special",
  "Event Cleanup": "Events",
};

/** C3, the catalogue. Slate arranges the operator; the customer chooses what needs collecting. */
export default function Services() {
  const [category, setCategory] = useState<Service["category"] | "All">("All");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [contact, setContact] = useState(false);

  const active = SUBSCRIPTIONS.find((s) => s.status === "Active")!;
  const pending = SUBSCRIPTIONS.find((s) => s.status === "Pending");
  const mine = new Map(SUBSCRIPTIONS.filter((s) => s.status === "Active" || s.status === "Pending").map((s) => [s.serviceId, s]));

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      if (category !== "All" && s.category !== category) return false;
      if (q && !`${s.name} ${s.short} ${s.category} ${s.wasteTypes.join(" ")}`.toLowerCase().includes(q)) return false;
      if (filters.location && !covers(s.id, filters.location)) return false;
      if (filters.waste && !s.wasteTypes.includes(filters.waste)) return false;
      if (filters.frequency && !s.frequencies.includes(filters.frequency)) return false;
      if (filters.price && priceBand(s) !== filters.price) return false;
      if (filters.availability && s.availability !== filters.availability) return false;
      return true;
    });
  }, [category, search, filters]);

  const groups = CATEGORIES.map((c) => ({ c, items: rows.filter((r) => r.category === c) })).filter((g) => g.items.length);
  const clear = () => {
    setFilters({});
    setSearch("");
    setCategory("All");
  };

  return (
    <Page>
      <PageHeader
        title="Services"
        description="Tell Slate what needs collecting. We arrange a verified operator, the schedule and the standard, and stay responsible for all of it."
      />

      {/* Your plan */}
      <section aria-label="Your plan" className="relative isolate overflow-hidden rounded-lg bg-slate text-slate-ink chalk-grain">
        <Strata tone="on-slate" bands={4} seed={19} className="absolute inset-y-0 right-0 h-full w-[55%] opacity-45 [mask-image:linear-gradient(90deg,transparent,black_70%)] max-md:hidden" />
        <div className="relative flex flex-col gap-5 p-5 sm:p-6 md:flex-row md:items-end md:justify-between">
          <div className="flex min-w-0 flex-col gap-4">
            <p className="t-micro text-slate-ink/65">Your plan</p>
            <div>
              <p className="font-display text-[26px] font-bold leading-tight tracking-[-0.02em]">
                {active.service} <span className="text-slate-ink/50">·</span> <span className="tnum">{formatNaira(active.price)}</span>
                <span className="t-body font-normal text-slate-ink/70">/month</span>
              </p>
              <p className="mt-1 max-w-xl t-small text-slate-ink/80">
                Mon & Thu, {active.window} at {me.household.address}. Collected by {active.operator} for Slate.
              </p>
            </div>
            {pending && (
              <p className="flex items-center gap-2 border-t border-white/10 pt-4 t-small text-slate-ink/80">
                <span className="size-1.5 shrink-0 rounded-full bg-slate-ink/60" aria-hidden />
                <span>
                  <span className="font-medium text-slate-ink">{pending.service}</span> joins on Tue 13 Oct · {formatNaira(pending.price)}/month
                </span>
              </p>
            )}
          </div>
          <Link
            to="/app/subscriptions"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-slate-ink px-4 text-[14px] font-semibold text-slate-950 transition hover:bg-white"
          >
            Manage subscriptions <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <div className="flex flex-col gap-4">
        {/* Category rail */}
        <div className="-mx-5 overflow-x-auto px-5 scrollbar-none md:mx-0 md:px-0">
          <div role="tablist" aria-label="Categories" className="flex min-w-max gap-2 md:min-w-0 md:flex-wrap">
            {(["All", ...CATEGORIES] as const).map((c) => {
              const on = category === c;
              const Icon = c === "All" ? null : CATEGORY_ICON[c];
              const count = c === "All" ? services.length : services.filter((s) => s.category === c).length;
              return (
                <button
                  key={c}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setCategory(c)}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-sm border px-3 text-[14px] font-medium transition",
                    on ? "border-ink bg-ink text-surface" : "border-line-strong bg-surface text-ink-2 hover:border-ink-3 hover:text-ink",
                  )}
                >
                  {Icon && <Icon className="size-4" strokeWidth={1.75} />}
                  {c === "All" ? "All services" : SHORT_CAT[c]}
                  {c === "All" && <span className={cn("tnum text-[12px]", on ? "text-surface/70" : "text-ink-3")}>{count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-start gap-2 lg:flex-col lg:items-stretch lg:gap-3">
          <div className="min-w-0 flex-1 lg:max-w-md">
            <SearchInput compact value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search services or waste types" aria-label="Search services" />
          </div>
        <FilterBar
          filters={[
            { key: "location", label: "Location", options: AREAS },
            { key: "waste", label: "Waste type", options: WASTE_TYPES },
            { key: "frequency", label: "Frequency", options: FREQUENCIES },
            { key: "price", label: "Price", options: PRICE_BANDS },
            { key: "availability", label: "Availability", options: ["Available", "Limited", "Waitlist"] },
          ]}
          values={filters}
          onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
        />
        </div>
        <p className="t-small text-ink-3" aria-live="polite">
          {rows.length === services.length ? `${rows.length} services in Uyo` : `${rows.length} of ${services.length} services`}
          {filters.location && ` · in ${filters.location}`}
        </p>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title="No service matches those filters"
          description="Clear a filter, or tell Slate what you need collected and we'll arrange it."
          action={
            <>
              <Button variant="secondary" onClick={clear}>Clear filters</Button>
              <Button variant="ghost" onClick={() => setContact(true)}>Ask Slate</Button>
            </>
          }
        />
      ) : (
        <div className="flex flex-col gap-10">
          {groups.map(({ c, items }) => {
            const Icon = CATEGORY_ICON[c];
            return (
              <section key={c} aria-labelledby={`cat-${c}`} className="flex flex-col">
                <div className="flex items-center gap-2.5 border-b border-ink pb-2.5">
                  <Icon className="size-[18px] text-ink-2" strokeWidth={1.75} />
                  <h2 id={`cat-${c}`} className="t-h2 text-ink">{c}</h2>
                </div>
                {/* timetable header (desktop) */}
                <div className="hidden grid-cols-[minmax(0,1fr)_150px_150px_150px_20px] gap-6 border-b border-line py-2 t-micro text-ink-3 md:grid">
                  <span>Service</span>
                  <span>Frequency</span>
                  <span>Coverage</span>
                  <span className="text-right">From</span>
                  <span />
                </div>
                <ul className="divide-y divide-line">
                  {items.map((s) => (
                    <ServiceRow key={s.id} s={s} mineStatus={mine.get(s.id)?.status} filterArea={filters.location} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <section className="flex flex-col items-start gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="t-h3 text-ink">Not sure which service fits?</h2>
          <p className="t-small text-ink-2">Describe the waste and the address. Slate works out the service and arranges the operator.</p>
        </div>
        <Button variant="secondary" leading={<MessagesSquare className="size-4" />} onClick={() => setContact(true)}>
          Ask Slate
        </Button>
      </section>

      <ContactSheet open={contact} onClose={() => setContact(false)} topic="Tell us what needs collecting and where. We'll recommend a service and arrange it." />
    </Page>
  );
}

function ServiceRow({ s, mineStatus, filterArea }: { s: Service; mineStatus?: string; filterArea?: string }) {
  const householdOk = s.eligible.includes("Household");
  const area = filterArea ?? me.household.area;
  const inArea = covers(s.id, area);
  const soon = COVERAGE[s.id]?.soon;
  const price =
    s.pricingModel === "Quote" ? (
      <>
        <span className="text-ink-3">from </span>
        {formatNaira(s.priceFrom)}
        <span className="text-ink-3">{s.priceUnit}</span>
      </>
    ) : (
      <>
        {formatNaira(s.priceFrom)}
        <span className="text-ink-3">{s.priceUnit}</span>
      </>
    );
  return (
    <li>
      <Link
        to={`/app/services/${s.id}`}
        className="group -mx-2 grid grid-cols-[minmax(0,1fr)_20px] items-start gap-x-4 gap-y-2 rounded-md px-2 py-4 transition-colors hover:bg-sunken/60 md:grid-cols-[minmax(0,1fr)_150px_150px_150px_20px] md:items-center md:gap-6"
      >
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="t-h3 text-ink">{s.name}</span>
            {mineStatus === "Active" && <Badge tone="slate" icon={<Check strokeWidth={3} />}>Your plan</Badge>}
            {mineStatus === "Pending" && <Badge tone="info">Starts 13 Oct</Badge>}
            {s.availability !== "Available" && <Badge tone="warning">{s.availability}</Badge>}
            {!householdOk && <Badge tone="outline">For {s.eligible.map((e) => e.toLowerCase() + (e === "Business" ? "es" : "s")).join(", ")}</Badge>}
          </div>
          <p className="t-small text-ink-2">{s.short}</p>
          {/* mobile meta */}
          <p className="t-small text-ink-3 md:hidden">
            {s.frequency} · <span className="font-medium text-ink tnum">{price}</span>
          </p>
        </div>
        <ChevronRight className="mt-0.5 size-4 text-ink-3 transition-transform group-hover:translate-x-0.5 md:hidden" />
        <span className="hidden t-small text-ink md:block">{s.frequency}</span>
        <span className="hidden t-small md:flex md:flex-col">
          <span className="text-ink">{coverageLabel(s.id)}</span>
          {COVERAGE[s.id]?.areas !== "all" && (
            <span className={cn("t-micro", inArea ? "text-success" : "text-ink-3")}>
              {inArea ? `Covers ${filterArea ?? "your address"}` : soon?.areas.includes(area) ? `${area} from ${soon.from}` : filterArea ? `Not in ${filterArea} yet` : "Not at your address yet"}
            </span>
          )}
        </span>
        <span className="hidden text-right t-small font-medium text-ink tnum md:block">{price}</span>
        <ChevronRight className="hidden size-4 text-ink-3 transition-transform group-hover:translate-x-0.5 md:block" />
      </Link>
    </li>
  );
}
