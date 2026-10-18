import { Link, useSearchParams } from "react-router";
import { ArrowRight } from "lucide-react";
import { Badge, Segmented } from "@/components/ui";
import { services, type CustomerType, type Service } from "@/data";
import { formatNaira } from "@/lib/format";
import { CATEGORY_LABEL, CtaSlab, PageHero, SectionHead, AddressChecker } from "./_marketing";

type Filter = "All" | CustomerType;
const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "All", label: "All" },
  { value: "Household", label: "Households" },
  { value: "Estate", label: "Estates" },
  { value: "Business", label: "Businesses" },
  { value: "Institution", label: "Institutions" },
];

const LINKS: Record<Service["category"], { to: string; label: string }> = {
  "Household Waste": { to: "/services/households", label: "Household service" },
  "Commercial Waste": { to: "/services/businesses", label: "Commercial service" },
  "Estate Waste Management": { to: "/services/estates", label: "Estate service" },
  "Institutional Waste": { to: "/services/institutions", label: "Institutional service" },
  "Bulk Waste": { to: "/services/bulk-waste", label: "Bulk pickups" },
  Recycling: { to: "/services/recycling", label: "Recycling" },
  "Special Collection": { to: "/contact", label: "Request a site visit" },
  "Event Cleanup": { to: "/contact", label: "Request a quote" },
};

const PLURAL: Record<CustomerType, string> = { Household: "Households", Estate: "Estates", Business: "Businesses", Institution: "Institutions" };

export default function Services() {
  const [params, setParams] = useSearchParams();
  const initial = (FILTERS.find((f) => f.value === params.get("for"))?.value ?? "All") as Filter;
  const filter = initial;
  const list = services.filter((s) => filter === "All" || s.eligible.includes(filter));

  // One entry per category: the first service is the lead; siblings are listed as plans.
  const categories = Array.from(new Set(list.map((s) => s.category)));

  const choose = (f: Filter) => {
    const next = new URLSearchParams(params);
    if (f === "All") next.delete("for");
    else next.set("for", f);
    setParams(next, { replace: true, preventScrollReset: true });
  };

  return (
    <>
      <PageHero
        tone="light"
        crumbs={[{ label: "Home", to: "/" }, { label: "Services" }]}
        eyebrow="Services"
        title="A service for your site."
        body="Scheduled collection for homes, estates, businesses and institutions, plus one-off pickups for the things a weekly bin can't take. Availability and service terms are confirmed when your request is reviewed."
      />

      <section className="container-page pb-20 lg:pb-28">
        <div className="sticky top-16 z-20 -mx-5 flex flex-col gap-3 border-b border-line bg-canvas/90 px-5 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between md:mx-0 md:px-0 lg:top-[72px]">
          <div className="-mx-5 overflow-x-auto scrollbar-none px-5 md:mx-0 md:px-0">
            <Segmented value={filter} onChange={choose} options={FILTERS} />
          </div>
          <p className="t-small text-ink-3 tnum" aria-live="polite">
            {categories.length} {categories.length === 1 ? "service" : "services"}
            {filter !== "All" && ` for ${PLURAL[filter].toLowerCase()}`}
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
          {categories.map((cat, i) => {
            const group = list.filter((s) => s.category === cat);
            const lead = group[0]!;
            const link = LINKS[cat];
            return (
              <li key={cat} className="animate-pop-in flex flex-col gap-5 border-b border-line py-8 sm:py-10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="t-mono !text-[12px] text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                    <h2 className="font-display text-[30px] font-bold leading-none tracking-[-0.025em] text-ink sm:text-[36px]">{CATEGORY_LABEL[cat]}</h2>
                  </div>
                  {lead.availability !== "Available" && <Badge tone="warning">{lead.availability} availability</Badge>}
                </div>
                <p className="t-body text-ink-2">{lead.description}</p>

                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-line pt-5">
                  <div>
                    <dt className="t-micro text-ink-3">Frequency</dt>
                    <dd className="t-small font-medium text-ink">{lead.frequencies.join(", ")}</dd>
                  </div>
                  <div>
                    <dt className="t-micro text-ink-3">For</dt>
                    <dd className="t-small font-medium text-ink">{lead.eligible.length === 4 ? "Everyone" : lead.eligible.map((e) => PLURAL[e]).join(", ")}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="t-micro text-ink-3">Takes</dt>
                    <dd className="t-small text-ink">{lead.wasteTypes.join(" · ")}</dd>
                  </div>
                </dl>

                {group.length > 1 && (
                  <ul className="flex flex-col divide-y divide-line rounded-md border border-line bg-surface">
                    {group.map((s) => (
                      <li key={s.id} className="flex items-center justify-between gap-4 px-4 py-3">
                        <div className="min-w-0">
                          <p className="t-small font-semibold text-ink">{s.name}</p>
                          <p className="t-small text-ink-3">{s.frequency}</p>
                        </div>
                        <span className="t-mono shrink-0 text-ink">
                          {formatNaira(s.priceFrom)}
                          <span className="text-ink-3">{s.priceUnit}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-auto flex items-end justify-between gap-4 pt-2">
                  <p className="flex flex-col">
                    <span className="t-micro text-ink-3">{lead.pricingModel === "Quote" ? "Quoted, from" : "From"}</span>
                    <span className="font-display text-[26px] font-bold leading-tight tracking-[-0.02em] text-ink tnum">
                      {formatNaira(Math.min(...group.map((g) => g.priceFrom)))}
                      <span className="ml-1 font-sans text-[14px] font-normal tracking-normal text-ink-2">{lead.priceUnit}</span>
                    </span>
                  </p>
                  <Link to={link.to} className="group inline-flex h-11 items-center gap-2 rounded-md bg-stone px-4 text-[14px] font-medium text-stone-ink transition-colors hover:bg-stone-hover">
                    {link.label}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="border-y border-line bg-surface py-20 lg:py-28">
        <div className="container-page flex flex-col gap-12">
          <SectionHead eyebrow="Before you choose" title="Check that Slate collects on your street." body="Services are available in nine Uyo zones today. Enter an address to see your collection days." />
          <AddressChecker inputId="services-address" />
        </div>
      </section>

      <section className="container-page py-20 lg:py-28">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-12">
          {[
            ["Every service has the same standard", "Fixed windows, a named operator, missed pickups recovered within 24 hours and one number for every problem."],
            ["Mix scheduled and one-off", "Add a bulk pickup or recycling to your plan from the app. One bill, one receipt, whatever you add."],
            ["Not sure which fits?", "Estates, multi-branch businesses and institutions get a walk-through and a written proposal before anything starts."],
          ].map(([t, b], i) => (
            <div key={t} className="flex flex-col gap-3 border-t border-line pt-6">
              <span className="t-mono text-ink-3">{String(i + 1).padStart(2, "0")}</span>
              <p className="t-h2 text-ink">{t}</p>
              <p className="t-body text-ink-2">{b}</p>
            </div>
          ))}
        </div>
      </section>

      <CtaSlab title="One company for all of it." body="Start with collection for your home, or talk to us about your estate, branches or campus." secondary={{ label: "Talk to us", to: "/contact" }} />
    </>
  );
}
