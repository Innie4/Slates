import { Link } from "react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { ServiceAreaMap } from "@/components/brand/ServiceAreaMap";
import { ButtonLink, LiveDot, Meter } from "@/components/ui";
import { cities, activeOperators } from "@/data";
import { formatNumber } from "@/lib/format";
import { CITY_INFO, Eyebrow, InfoHero, NotifyForm, NumberedHead, UYO_ZONE_INFO, cityLaunchLabel } from "./_info";

export default function Cities() {
  const uyo = cities.find((c) => c.id === "uyo")!;
  const order = ["uyo", "port-harcourt", "eket", "lagos", "abuja"];
  const board = [...cities].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

  return (
    <div className="pb-24 md:pb-32">
      <InfoHero
        eyebrow="Cities"
        title={
          <>
            Uyo first.
            <br />
            Then the coast.
          </>
        }
        lede="We open a city when we can keep the promise there: verified operators with spare capacity, a state framework we can work under, and enough estates and businesses asking. Not before."
      />

      {/* ---------- Departure board ---------- */}
      <section aria-label="Where Slate operates" className="container-page">
        <div className="overflow-hidden rounded-xl bg-slate text-slate-ink chalk-grain dark:bg-[#121920]">
          <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.6fr)_40px] gap-6 border-b border-white/10 px-8 py-3.5 t-micro text-slate-ink/55 md:grid">
            <span>City</span>
            <span>Status</span>
            <span>Opens</span>
            <span>Where it stands</span>
            <span />
          </div>
          <ul className="divide-y divide-white/10">
            {board.map((c) => {
              const live = c.status === "Live";
              const current = CITY_INFO[c.id]!.milestones.find((m) => m.state === "current");
              return (
                <li key={c.id}>
                  <Link
                    to={`/cities/${c.id}`}
                    className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 px-5 py-5 transition-colors hover:bg-white/[0.04] sm:px-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.6fr)_40px] md:gap-6 md:py-6"
                  >
                    <div className="flex min-w-0 items-baseline gap-3">
                      <span className="font-display text-[28px] font-bold leading-none tracking-[-0.025em] md:text-[34px]">{c.name}</span>
                      <span className="t-small text-slate-ink/55">{c.state}</span>
                    </div>
                    <span
                      className={cn(
                        "inline-flex h-7 w-fit items-center gap-2 justify-self-end rounded-sm px-2.5 text-[12px] font-semibold md:justify-self-start",
                        live ? "bg-signal text-signal-ink" : c.status === "Launching" ? "bg-slate-ink text-slate-900" : "border border-white/25 text-slate-ink/80",
                      )}
                    >
                      {live && <LiveDot className="[&>span]:bg-signal-ink" />}
                      {c.status === "Live" ? "Collecting now" : c.status}
                    </span>
                    <span className="t-small text-slate-ink/75 tnum md:t-body md:text-slate-ink">{cityLaunchLabel(c)}</span>
                    <span className="col-span-2 t-small text-slate-ink/70 md:col-span-1">
                      {live ? `${formatNumber(c.customers)} homes and sites · ${c.completion}% on time` : current ? current.title : CITY_INFO[c.id]!.milestones[0]!.title}
                    </span>
                    <ArrowRight className="hidden size-5 text-slate-ink/40 transition-transform group-hover:translate-x-1 group-hover:text-slate-ink md:block" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ---------- Uyo ---------- */}
      <section className="container-page mt-20 md:mt-28">
        <NumberedHead
          n="01 — Live"
          title="Nine zones of Uyo"
          lede={`${formatNumber(uyo.customers)} homes, estates, shops and institutions, collected by ${activeOperators.length} contracted operators on fixed days. Coverage is the share of streets in a zone we can collect from today.`}
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-12">
          <ServiceAreaMap className="aspect-[4/3]" values={Object.fromEntries(UYO_ZONE_INFO.map((z) => [z.id, z.coverage]))} legend="Street coverage" />
          <div className="flex flex-col">
            <ul className="divide-y divide-line border-y border-line">
              {UYO_ZONE_INFO.map((z) => (
                <li key={z.id} className="grid grid-cols-[minmax(0,1fr)_88px] items-center gap-4 py-3">
                  <div className="min-w-0">
                    <p className="t-body font-medium text-ink">{z.name}</p>
                    <p className="t-small truncate text-ink-3">{z.operator}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="t-small text-right font-medium text-ink tnum">{z.coverage}%</span>
                    <Meter value={z.coverage} segments={8} />
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink to="/cities/uyo" trailing={<ArrowRight className="size-4" />}>
                Uyo collection days
              </ButtonLink>
              <ButtonLink to="/signup" variant="outline">
                Check my address
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- How we choose ---------- */}
      <section className="container-page mt-20 md:mt-28">
        <NumberedHead
          n="02 — Next"
          title="How we choose the next city"
          lede="Three things have to be true. We score every candidate city on them each quarter, and the order below is the honest result."
        />
        <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-3">
          {[
            ["Operator supply", "At least two operators who pass verification, with trucks, yards and permits — and spare capacity. We never buy trucks to fill a gap."],
            ["Regulatory readiness", "Registration with the state waste agency, and a clear way for a managed service to sit alongside licensed operators."],
            ["Demand", "Estates, businesses and institutions already asking. Waitlist sign-ups on this page count."],
          ].map(([t, d], i) => (
            <div key={t} className="flex flex-col gap-2 border-t border-line pt-4">
              <span className="t-mono text-ink-3">0{i + 1}</span>
              <p className="t-h3 text-ink">{t}</p>
              <p className="t-small text-ink-2">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 divide-y divide-line border-y border-line">
          <div className="hidden grid-cols-[minmax(0,1fr)_repeat(2,minmax(0,1.2fr))_minmax(0,0.8fr)] gap-8 py-3 t-micro text-ink-3 md:grid">
            <span>City</span>
            <span>Regulatory readiness</span>
            <span>Demand signal</span>
            <span className="text-right">Verified operators</span>
          </div>
          {board
            .filter((c) => c.status !== "Live")
            .map((c) => (
              <Link
                key={c.id}
                to={`/cities/${c.id}`}
                className="group grid grid-cols-2 gap-x-6 gap-y-3 py-5 md:grid-cols-[minmax(0,1fr)_repeat(2,minmax(0,1.2fr))_minmax(0,0.8fr)] md:items-center md:gap-8"
              >
                <div className="col-span-2 flex items-baseline justify-between gap-3 md:col-span-1 md:block">
                  <p className="t-h3 text-ink group-hover:underline group-hover:underline-offset-4">{c.name}</p>
                  <p className="t-small text-ink-3">{cityLaunchLabel(c)}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="flex justify-between t-small">
                    <span className="text-ink-3 md:sr-only">Regulatory</span>
                    <span className="font-medium text-ink tnum">{c.regulatory}%</span>
                  </span>
                  <Meter value={c.regulatory} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="flex justify-between t-small">
                    <span className="text-ink-3 md:sr-only">Demand</span>
                    <span className="font-medium text-ink tnum">{c.demand}%</span>
                  </span>
                  <Meter value={c.demand} />
                </div>
                <p className="col-span-2 t-small text-ink-2 md:col-span-1 md:text-right">
                  <span className="md:hidden">Verified operators: </span>
                  <span className="font-medium text-ink tnum">{c.operators}</span>
                  {c.operators > 0 && <span className="text-ink-3"> in review</span>}
                </p>
              </Link>
            ))}
        </div>
      </section>

      {/* ---------- Notify ---------- */}
      <section className="container-page mt-20 md:mt-28">
        <div className="grid gap-10 rounded-xl border border-line bg-surface p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 lg:p-14">
          <div className="flex flex-col gap-5">
            <Eyebrow>Not in your city yet</Eyebrow>
            <h2 className="t-display text-ink">Tell us where to go next.</h2>
            <p className="t-body text-ink-2 md:text-[17px] md:leading-relaxed">
              Every request is counted in the demand score above. Estate managers and businesses: add your estate or street and our partnerships team
              will contact you first when we open.
            </p>
            <p className="t-small text-ink-3">
              Run a waste company?{" "}
              <Link to="/for-waste-companies" className="inline-flex items-center gap-0.5 font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                Apply to become an operator <ArrowUpRight className="size-3.5" />
              </Link>
            </p>
          </div>
          <NotifyForm />
        </div>
      </section>
    </div>
  );
}
