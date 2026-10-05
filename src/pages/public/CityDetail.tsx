import { useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, ArrowRight, Check, MapPin, MapPinOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { ServiceAreaMap } from "@/components/brand/ServiceAreaMap";
import { AddressInput, Badge, Button, ButtonLink, DescriptionList, LiveDot, Meter, StateView, Timeline } from "@/components/ui";
import { activeOperators, cities, services } from "@/data";
import { formatNaira, formatNumber } from "@/lib/format";
import { CITY_INFO, Eyebrow, NotifyForm, NumberedHead, SlateSlab, UYO_ZONE_INFO, cityLaunchLabel } from "./_info";

export default function CityDetail() {
  const { city: slug } = useParams();
  const city = cities.find((c) => c.id === slug);
  const info = slug ? CITY_INFO[slug] : undefined;

  if (!city || !info)
    return (
      <div className="container-page py-16 md:py-24">
        <StateView
          state="not-found"
          title="We don't have a page for that city"
          description="Slate is live in Uyo, launching in Port Harcourt, and planned for Eket, Lagos and Abuja."
          action={
            <>
              <ButtonLink to="/cities">All cities</ButtonLink>
              <ButtonLink to="/contact" variant="ghost">Ask about your city</ButtonLink>
            </>
          }
        />
      </div>
    );

  const live = city.status === "Live";
  const others = cities.filter((c) => c.id !== city.id);

  return (
    <div className="pb-24 md:pb-32">
      <header className="container-page pb-12 pt-8 md:pb-16 md:pt-12">
        <Link to="/cities" className="-ml-1 inline-flex items-center gap-1.5 rounded-sm t-small font-medium text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4" /> All cities
        </Link>
        <div className="mt-8 grid gap-10 lg:mt-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <div className="flex min-w-0 flex-col gap-5">
            <Eyebrow>{city.state} State</Eyebrow>
            <h1 className="t-display-xl text-ink">{city.name}</h1>
            <div className="flex flex-wrap items-center gap-3">
              {live ? (
                <span className="inline-flex h-7 items-center gap-2 rounded-sm bg-signal px-2.5 text-[12px] font-semibold text-signal-ink">
                  <LiveDot className="[&>span]:bg-signal-ink" /> Collecting now
                </span>
              ) : (
                <Badge tone={city.status === "Launching" ? "info" : "outline"} size="md">{city.status}</Badge>
              )}
              <span className="t-body text-ink-2">{info.tagline}</span>
            </div>
            <p className="t-body max-w-xl text-ink-2 md:text-[18px] md:leading-[1.55]">{info.summary}</p>
          </div>
          {live ? (
            <SlateSlab seed={5} bands={4} live className="min-h-[260px]">
              <dl className="grid h-full grid-cols-2 content-start gap-x-6 gap-y-6 p-6 sm:p-8">
                {[
                  [formatNumber(city.customers), "homes and sites"],
                  [`${city.completion}%`, "on time, September"],
                  [String(activeOperators.length), "contracted operators"],
                  ["< 24h", "missed-pickup recovery"],
                ].map(([v, l]) => (
                  <div key={l}>
                    <dd className="font-display text-[34px] font-bold leading-none tracking-[-0.02em] tnum sm:text-[40px]">{v}</dd>
                    <dt className="mt-1.5 t-small text-slate-ink/70">{l}</dt>
                  </div>
                ))}
              </dl>
            </SlateSlab>
          ) : (
            <SlateSlab seed={city.id.length * 7} bands={3} className="min-h-[220px]">
              <div className="flex h-full flex-col p-6 sm:p-8">
                <p className="t-micro text-slate-ink/60">Expected</p>
                <p className="mt-1 font-display text-[40px] font-bold leading-none tracking-[-0.025em] sm:text-[48px]">{cityLaunchLabel(city)}</p>
              </div>
            </SlateSlab>
          )}
        </div>
      </header>

      {live ? <LiveCity /> : <UpcomingCity cityId={city.id} />}

      {/* ---------- Other cities ---------- */}
      <section className="container-page mt-20 md:mt-28">
        <p className="t-micro text-ink-3">Other cities</p>
        <ul className="mt-3 grid divide-y divide-line border-y border-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
          {others.map((c) => (
            <li key={c.id} className="sm:border-line sm:[&:nth-child(n+3)]:border-t lg:[&:nth-child(n+3)]:border-t-0 lg:[&:not(:first-child)]:border-l">
              <Link to={`/cities/${c.id}`} className="group flex items-center justify-between gap-3 py-4 sm:px-4 lg:px-5">
                <span>
                  <span className="block t-h3 text-ink group-hover:underline group-hover:underline-offset-4">{c.name}</span>
                  <span className="t-small text-ink-3">{c.status === "Live" ? "Collecting now" : `${c.status} · ${cityLaunchLabel(c)}`}</span>
                </span>
                <ArrowRight className="size-4 text-ink-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Live city: Uyo                                                      */
/* ------------------------------------------------------------------ */

function LiveCity() {
  const [zone, setZone] = useState("ewet");
  const [address, setAddress] = useState("");
  const [checked, setChecked] = useState<null | { ok: boolean; zone?: (typeof UYO_ZONE_INFO)[number] }>(null);
  const z = UYO_ZONE_INFO.find((x) => x.id === zone)!;
  const info = CITY_INFO.uyo!;
  const available = services.filter((s) => s.availability !== "Waitlist");

  const check = () => {
    const a = address.toLowerCase();
    const match = UYO_ZONE_INFO.find((x) => a.includes(x.name.toLowerCase().split(" ")[0]!.toLowerCase())) ?? (a.includes("udo udoma") || a.includes("wellington") || a.includes("ikot ekpene") ? UYO_ZONE_INFO.find((x) => x.id === "oron") : undefined);
    if (match) {
      setChecked({ ok: true, zone: match });
      setZone(match.id);
    } else setChecked({ ok: false });
  };

  return (
    <>
      <section className="container-page">
        <NumberedHead n="01 — Zones" title="Where we collect" lede="Select a zone to see who collects there and on which days. Darker stone means more of the zone's streets are covered." />
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-12">
          <ServiceAreaMap
            className="aspect-[4/3]"
            values={Object.fromEntries(UYO_ZONE_INFO.map((x) => [x.id, x.coverage]))}
            selected={zone}
            onSelect={(id) => {
              setZone(id);
              setChecked(null);
            }}
            legend="Street coverage"
          />
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5 border-b border-line pb-5">
              <p className="t-micro text-ink-3">Selected zone</p>
              <p className="t-h1 text-ink">{z.name}</p>
              {z.note && <p className="t-small text-ink-2">{z.note}</p>}
            </div>
            <DescriptionList
              columns={1}
              items={[
                { label: "Collected by", value: z.operator },
                { label: "Collection days", value: z.days },
                { label: "Street coverage", value: <span className="flex items-center gap-3"><span className="tnum">{z.coverage}%</span><Meter value={z.coverage} className="max-w-40 flex-1" /></span> },
                { label: "Homes and sites served", value: formatNumber(z.homes) },
              ]}
            />
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Zones">
              {UYO_ZONE_INFO.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  aria-pressed={x.id === zone}
                  onClick={() => {
                    setZone(x.id);
                    setChecked(null);
                  }}
                  className={cn(
                    "h-8 rounded-sm border px-2.5 text-[13px] font-medium transition-colors",
                    x.id === zone ? "border-ink bg-ink text-surface" : "border-line-strong text-ink-2 hover:border-ink-3 hover:text-ink",
                  )}
                >
                  {x.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Address check */}
      <section className="container-page mt-20 md:mt-28">
        <div className="grid gap-8 rounded-xl border border-line bg-surface p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 lg:p-12">
          <div className="flex flex-col gap-4">
            <Eyebrow>Check your street</Eyebrow>
            <h2 className="t-display text-ink">Do we collect from you?</h2>
            <p className="t-body text-ink-2">Start typing your street or estate. We'll tell you the zone, the operator and your collection days.</p>
          </div>
          <div className="flex flex-col gap-4">
            <AddressInput
              value={address}
              onChange={(v) => {
                setAddress(v);
                setChecked(null);
              }}
              hint="Try “Ewet”, “Aka Road” or “Nwaniba”."
            />
            <Button onClick={check} disabled={address.trim().length < 3} size="lg">
              Check address
            </Button>
            {checked?.ok && checked.zone && (
              <div className="flex items-start gap-3 rounded-md bg-success-bg px-4 py-3.5 animate-pop-in" role="status">
                <Check className="mt-0.5 size-[18px] shrink-0 text-success" strokeWidth={2.5} />
                <div className="flex flex-col gap-2">
                  <p className="t-small font-semibold text-success">We collect on your street</p>
                  <p className="t-small text-ink-2">
                    {checked.zone.name} zone · {checked.zone.days} · collected by {checked.zone.operator}.
                  </p>
                  <ButtonLink to="/signup" size="sm" className="w-fit" trailing={<ArrowRight className="size-4" />}>
                    Start from {formatNaira(4500)}/month
                  </ButtonLink>
                </div>
              </div>
            )}
            {checked && !checked.ok && (
              <div className="flex items-start gap-3 rounded-md bg-sunken px-4 py-3.5 animate-pop-in" role="status">
                <MapPinOff className="mt-0.5 size-[18px] shrink-0 text-ink-2" />
                <div className="flex flex-col gap-1">
                  <p className="t-small font-semibold text-ink">Not on our routes yet</p>
                  <p className="t-small text-ink-2">
                    We couldn't place that address in a zone. <Link to="/contact" className="font-medium text-ink underline underline-offset-4">Send it to us</Link> and we'll check by hand within a working day.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="container-page mt-20 md:mt-28">
        <NumberedHead n="02 — Services" title="Available in Uyo" lede="Every service below is run by a verified, contracted operator and billed by Slate." />
        <ul className="mt-10 grid divide-y divide-line border-y border-line md:grid-cols-2 md:gap-x-12 md:divide-y-0 md:border-b-0">
          {available.map((s) => (
            <li key={s.id} className="flex items-start justify-between gap-6 py-4 md:border-b md:border-line">
              <div className="min-w-0">
                <p className="t-h3 text-ink">{s.name}</p>
                <p className="t-small text-ink-2">{s.short}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="t-small font-semibold text-ink tnum">from {formatNaira(s.priceFrom)}</p>
                <p className="t-micro text-ink-3">{s.priceUnit.replace("/", "per ")}</p>
                {s.availability === "Limited" && <Badge tone="warning" className="mt-1">Limited</Badge>}
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <ButtonLink to="/pricing" variant="outline" trailing={<ArrowRight className="size-4" />}>
            See pricing
          </ButtonLink>
        </div>
      </section>

      {/* Story so far */}
      <section className="container-page mt-20 md:mt-28">
        <NumberedHead n="03 — So far" title="Six months in Uyo" lede={`Regulated by the ${info.agency}.`} />
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Timeline items={info.milestones.map((m) => ({ title: m.title, time: m.time, description: m.description, state: m.state }))} />
          <div className="flex flex-col gap-3">
            <p className="t-micro text-ink-3">Areas served</p>
            <ul className="flex flex-wrap gap-2">
              {info.areas.map((a) => (
                <li key={a} className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-sunken px-2.5 text-[13px] font-medium text-ink-2">
                  <MapPin className="size-3.5 text-ink-3" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Launching / planned city                                            */
/* ------------------------------------------------------------------ */

function UpcomingCity({ cityId }: { cityId: string }) {
  const city = cities.find((c) => c.id === cityId)!;
  const info = CITY_INFO[cityId]!;
  return (
    <>
      <section className="container-page">
        <div className="grid gap-10 rounded-xl border border-line bg-surface p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 lg:p-12">
          <div className="flex flex-col gap-5">
            <Eyebrow>Notify me</Eyebrow>
            <h2 className="t-display text-ink">Be first on the {city.name} list.</h2>
            <p className="t-body text-ink-2">
              We'll email once, when collection opens in your neighbourhood. Estates and businesses that sign up here get a visit from our partnerships team before
              public launch.
            </p>
            <ul className="mt-1 flex flex-wrap gap-2">
              {info.areas.map((a) => (
                <li key={a} className="inline-flex h-8 items-center rounded-sm bg-sunken px-2.5 text-[13px] font-medium text-ink-2">
                  {a}
                </li>
              ))}
            </ul>
            <p className="t-small text-ink-3">Neighbourhoods with the most requests so far.</p>
          </div>
          <NotifyForm city={city} />
        </div>
      </section>

      <section className="container-page mt-20 md:mt-28">
        <NumberedHead n="01 — Progress" title={`What has to happen in ${city.name}`} lede={`We work under the ${info.agency}. These are the steps, and where each one stands.`} />
        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Timeline items={info.milestones.map((m) => ({ title: m.title, time: m.time, description: m.description, state: m.state }))} />
          <div className="flex flex-col gap-6">
            <p className="t-micro text-ink-3">Readiness this quarter</p>
            {[
              { label: "Regulatory readiness", v: city.regulatory, d: "Registration and operator permits" },
              { label: "Demand signal", v: city.demand, d: "Waitlist, estates and businesses asking" },
            ].map((r) => (
              <div key={r.label} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="t-h3 text-ink">{r.label}</span>
                  <span className="font-display text-[26px] font-bold leading-none text-ink tnum">{r.v}%</span>
                </div>
                <Meter value={r.v} />
                <span className="t-small text-ink-3">{r.d}</span>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-4 border-t border-line pt-5">
              <span className="t-h3 text-ink">Operators in verification</span>
              <span className="font-display text-[26px] font-bold leading-none text-ink tnum">{city.operators}</span>
            </div>
            <p className="t-small text-ink-2">
              Run a waste company in {city.name}?{" "}
              <Link to="/for-waste-companies" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                Apply to be a Slate operator
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
