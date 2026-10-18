import { useEffect } from "react";
import { Link, useLocation } from "react-router";
import { ArrowRight, Check, MapPin } from "lucide-react";
import { RouteMap } from "@/components/brand/RouteMap";
import { ButtonLink } from "@/components/ui";
import { AddressChecker, scrollToId } from "./_marketing";

const QUESTIONS = [
  ["Where does Slate collect?", "Start with the address checker below. It matches Uyo areas to the service guide. The team confirms your exact street and collection schedule before your service starts."],
  ["What does a household plan cost?", "Home Lite starts at ₦4,500 a month for one collection a week. Slate Home starts at ₦7,000 for two. Your service request is reviewed before a collection is confirmed."],
  ["Can an estate or business join?", "Yes. Tell us about your properties, waste volume and preferred collection times. Slate prepares a proposal for your site rather than fitting it into a household plan."],
  ["What if my collection is missed?", "Sign in, open your pickups and report the missed collection. Your report is saved with a reference so support can follow it up."],
];

export default function Home() {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash === "#check") scrollToId("check", "address-check");
  }, [hash]);

  return (
    <>
      <section className="overflow-hidden bg-slate text-slate-ink">
        <div className="container-page grid gap-10 pb-14 pt-28 sm:pb-20 sm:pt-32 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-14 lg:pb-24 lg:pt-36">
          <div className="flex flex-col items-start gap-7">
            <h1 className="font-display text-[clamp(4rem,10.8vw,10.5rem)] font-bold leading-[0.9] tracking-[-0.05em]">Waste.<br />Handled.</h1>
            <p className="max-w-[32rem] text-[18px] leading-relaxed text-slate-ink">Waste collection for homes, estates and businesses in Uyo. Find your area, choose a service and keep every request in one place.</p>
            <button type="button" onClick={() => scrollToId("check", "address-check")} className="inline-flex h-13 items-center justify-center gap-3 rounded-md bg-signal px-6 text-[16px] font-semibold text-signal-ink transition hover:bg-signal-hover active:scale-[0.98]">Check your address <ArrowRight className="size-5" /></button>
            <Link to="/pricing" className="inline-flex min-h-11 items-center gap-2 text-[16px] font-medium underline underline-offset-8">Household plans from ₦4,500 a month <ArrowRight className="size-4" /></Link>
          </div>
          <figure className="min-w-0 overflow-hidden rounded-2xl bg-slate-950/40">
            <RouteMap progress={0.58} stops={[0.2, 0.46, 0.74]} className="aspect-[4/3] w-full sm:aspect-[16/9] lg:aspect-square" />
            <figcaption className="flex items-center gap-3 bg-slate-950/40 px-5 py-4 text-[14px] text-slate-ink"><MapPin className="size-4 shrink-0" />Uyo area guide. Check your street below.</figcaption>
          </figure>
        </div>
      </section>

      <section id="check" className="container-page scroll-mt-24 py-16 lg:py-24">
        <div className="mb-10 grid gap-5 lg:grid-cols-2 lg:gap-16">
          <h2 className="t-display text-ink">Find your street.</h2>
          <p className="max-w-xl text-[18px] leading-relaxed text-ink">Enter your street or estate to see the area guide. If collection is not available yet, register your interest with the team.</p>
        </div>
        <AddressChecker inputId="address-check" />
      </section>

      <section className="bg-signal text-signal-ink">
        <div className="container-page py-16 lg:py-24">
          <h2 className="max-w-5xl font-display text-[clamp(2.8rem,6.5vw,6rem)] font-bold leading-none tracking-[-0.04em]">Weekly pickup.<br />From ₦4,500.</h2>
          <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
            <p className="max-w-xl text-[18px] leading-relaxed">One collection each week with Home Lite, or two with Slate Home at ₦7,000 a month. Review the plans and request the service that fits your home.</p>
            <Link to="/pricing" className="inline-flex h-13 shrink-0 items-center justify-center gap-3 rounded-md bg-slate-950 px-6 text-[16px] font-semibold text-slate-ink transition hover:bg-slate-900 active:scale-[0.98]">Compare plans <ArrowRight className="size-5" /></Link>
          </div>
        </div>
      </section>

      <section className="container-page py-16 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <div>
            <h2 className="t-display text-ink">From gate to gone.</h2>
            <p className="mt-5 max-w-sm text-[18px] leading-relaxed text-ink">A clear request, a confirmed schedule and a record you can follow.</p>
            <Link to="/how-it-works" className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-ink">How it works <ArrowRight className="size-4" /></Link>
          </div>
          <div className="flex flex-col gap-3">
            {[
              ["Find your area", "Check the coverage guide, then add your full address and any gate instructions when you request a collection."],
              ["Request your service", "Choose a household plan or tell us about your site. The team reviews availability before confirming collection."],
              ["Follow your collection", "Sign in to see your requests, check their status and report a problem without starting the conversation again."],
            ].map(([title, body], index) => <details key={title} open={index === 0} className="group rounded-xl bg-sunken p-6 sm:p-8"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 text-[22px] font-semibold text-ink">{title}<span aria-hidden className="text-[28px] font-normal group-open:rotate-45">+</span></summary><p className="mt-4 max-w-xl text-[17px] leading-relaxed text-ink">{body}</p></details>)}
          </div>
        </div>
      </section>

      <section className="bg-slate text-slate-ink">
        <div className="container-page grid gap-10 py-16 lg:grid-cols-2 lg:gap-20 lg:py-24">
          <h2 className="t-display">More than one bin?</h2>
          <div className="flex flex-col items-start gap-6">
            <p className="max-w-xl text-[18px] leading-relaxed">An estate, a restaurant or a whole campus needs its own collection plan. Tell Slate about your sites, volume and opening hours.</p>
            <ul className="flex flex-col gap-4 text-[16px]">
              {["A proposal for your collection needs", "One point of contact for your sites", "A record of service requests and support"].map(item => <li key={item} className="flex items-start gap-3"><Check className="mt-0.5 size-5 shrink-0" />{item}</li>)}
            </ul>
            <ButtonLink to="/contact?category=Proposal" variant="signal" size="lg" trailing={<ArrowRight className="size-4" />}>Request a proposal</ButtonLink>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-[16px]"><Link to="/for-estates" className="min-h-11 py-2 underline underline-offset-8">Estates</Link><Link to="/for-businesses" className="min-h-11 py-2 underline underline-offset-8">Businesses</Link><Link to="/for-institutions" className="min-h-11 py-2 underline underline-offset-8">Institutions</Link></div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container-page mb-10"><h2 className="t-display text-ink">Before you book.</h2></div>
        <div className="flex flex-col">
          {QUESTIONS.map(([question, answer], index) => <div key={question} className={index % 2 === 0 ? "bg-sunken" : "bg-canvas"}><div className="container-page grid gap-4 py-8 sm:py-10 lg:grid-cols-2 lg:gap-16"><h3 className="max-w-md text-[24px] font-semibold leading-tight text-ink">{question}</h3><p className="max-w-xl text-[17px] leading-relaxed text-ink">{answer}</p></div></div>)}
        </div>
        <div className="container-page mt-8"><Link to="/faq" className="inline-flex min-h-11 items-center gap-2 font-semibold text-ink">All questions <ArrowRight className="size-4" /></Link></div>
      </section>
    </>
  );
}
