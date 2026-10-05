import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router";
import { ArrowLeft, ArrowRight, Check, CreditCard, Home, MapPin, Minus, Package, Plus, Coins, Lock, CircleAlert } from "lucide-react";
import { Strata } from "@/components/brand/Strata";
import {
  Alert, AddressInput, Badge, Button, ButtonLink, Checkbox, ChoiceCard, Input, Modal, Page, PageHeader, Ref, Stepper, Timeline, useToast,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { DEMO_NOW, formatNaira } from "@/lib/format";
import { AREAS, me, serviceById, services, type Service } from "@/data";
import {
  covers, EXTRA_BIN, feeFor, FREQ_META, fromIsoDay, isoDay, joinDays, PriceLine, priceFor, slotState, StickyActions, TermsModal, weekdayOf,
  WeekStrip, WINDOWS,
} from "./_core";
import { SUBSCRIPTIONS, type Weekday } from "./_subs";

const STEPS = ["Service", "Property", "Frequency", "Schedule", "Start date", "Price", "Payment", "Confirm", "Done"];
const BOOKABLE = services.filter((s) => s.eligible.includes("Household") && s.pricingModel === "Monthly subscription");

interface Property {
  id: string;
  label: string;
  address: string;
  area: string;
  landmark?: string;
}
const BASE_PROPERTIES: Property[] = [
  { id: "home", label: "Home", address: me.household.address, area: me.household.area, landmark: me.household.landmark },
  { id: "nwaniba", label: "Previous address", address: "Flat 2, 6 Nwaniba Road, Uyo", area: "Nwaniba Road", landmark: "Behind Mobil filling station" },
];
const ROUTE_BY_AREA: Record<string, Weekday[]> = {
  "Ewet Housing Estate": ["Mon", "Thu"],
  "Shelter Afrique Estate": ["Tue", "Fri"],
  "Osongama Estate": ["Wed", "Sat"],
  "Nwaniba Road": ["Tue", "Sat"],
  "Ikot Ekpene Road": ["Tue", "Fri"],
  "Aka Road": ["Wed", "Sat"],
};
const routeFor = (area: string): Weekday[] => ROUTE_BY_AREA[area] ?? ["Wed", "Fri"];
const areaOf = (address: string) => AREAS.find((a) => address.toLowerCase().includes(a.toLowerCase().replace(" estate", "").replace(" road", ""))) ?? "";

interface Draft {
  serviceId: string;
  propertyId: string;
  frequency: string;
  days: Weekday[];
  window: string;
  start: string;
  extraBins: number;
  payment: "visa" | "new" | "sweep";
  card: { number: string; expiry: string; cvv: string };
  agreed: boolean;
}

type Conflict = { level: "block" | "note"; title: string; body: ReactNode } | null;

function conflictFor(s: Service | undefined, p: Property | undefined): Conflict {
  if (!s || !p) return null;
  if (!covers(s.id, p.area))
    return { level: "block", title: `${s.name} isn't collected in ${p.area || "this area"} yet`, body: "Slate only sells a service where a verified operator is already contracted. Choose another property, or ask us to notify you when it arrives." };
  const subs = SUBSCRIPTIONS.filter((x) => x.address === p.address && x.status !== "Cancelled");
  const same = subs.find((x) => x.serviceId === s.id);
  if (same?.status === "Active")
    return { level: "block", title: `${s.name} is already active here`, body: <>To change days or frequency, <Link className="font-medium text-ink underline underline-offset-4" to={`/app/subscriptions/${same.id}`}>modify that subscription</Link>.</> };
  if (same?.status === "Pending") return { level: "block", title: `${s.name} already starts here on Tue 13 Oct`, body: <>You can change it from <Link className="font-medium text-ink underline underline-offset-4" to={`/app/subscriptions/${same.id}`}>the subscription</Link> before it starts.</> };
  if (same?.status === "Paused") return { level: "block", title: `Your ${s.name} here is paused`, body: <>Resume it instead — you keep your route slot. <Link className="font-medium text-ink underline underline-offset-4" to="/app/subscriptions?tab=paused">Go to paused</Link></> };
  const paused = subs.find((x) => x.status === "Paused");
  if (paused) return { level: "note", title: `Your paused ${paused.service} here will close`, body: `When ${s.name} starts, Slate closes the paused subscription so you're never billed twice for one address.` };
  const active = subs.find((x) => x.status === "Active" && x.serviceId.startsWith("svc-home") && s.id.startsWith("svc-home"));
  if (active) return { level: "note", title: `This adds to your ${active.service}`, body: "You'd have two household collections at one address. Most homes change frequency instead." };
  return null;
}

/** C5 — book a service in nine short steps. State persists across steps. */
export default function Book() {
  const [params] = useSearchParams();
  const toast = useToast();
  const pre = serviceById(params.get("service") ?? "");
  const preBookable = pre && BOOKABLE.some((b) => b.id === pre.id) ? pre : undefined;
  const preStart = params.get("start");
  const preWindow = params.get("window");

  const [step, setStep] = useState(0);
  const [showErr, setShowErr] = useState(false);
  const [properties, setProperties] = useState<Property[]>(BASE_PROPERTIES);
  const [d, setD] = useState<Draft>(() => {
    const svc = preBookable;
    const freq = svc ? (params.get("frequency") && svc.frequencies.includes(params.get("frequency")!) ? params.get("frequency")! : svc.frequency) : "";
    const startDay = preStart ? weekdayOf(fromIsoDay(preStart)) : null;
    return {
      serviceId: svc?.id ?? "",
      propertyId: "",
      frequency: freq,
      days: startDay ? [startDay] : [],
      window: preWindow && (WINDOWS as readonly string[]).includes(preWindow) ? preWindow : "",
      start: preStart ?? "",
      extraBins: 0,
      payment: "visa",
      card: { number: "", expiry: "", cvv: "" },
      agreed: false,
    };
  });
  const set = (patch: Partial<Draft>) => {
    setShowErr(false);
    setD((x) => ({ ...x, ...patch }));
  };
  const [modal, setModal] = useState<null | "address" | "date" | "frequency" | "breakdown" | "terms" | "cancellation" | "confirm">(null);
  const [paying, setPaying] = useState(false);

  const service = serviceById(d.serviceId);
  const property = properties.find((p) => p.id === d.propertyId);
  const conflict = conflictFor(service, property);
  const isRecycling = d.serviceId === "svc-recycling";
  const needDays = FREQ_META[d.frequency]?.days ?? 1;
  const route = property ? routeFor(property.area) : [];

  // Keep the property sensible when the service changes.
  useEffect(() => {
    if (!service) return;
    if (d.propertyId && !conflictFor(service, properties.find((p) => p.id === d.propertyId))?.level) return;
    const firstOk = properties.find((p) => conflictFor(service, p)?.level !== "block");
    if (firstOk && firstOk.id !== d.propertyId) setD((x) => ({ ...x, propertyId: firstOk.id }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.serviceId]);

  // Money
  const plan = service && d.frequency ? priceFor(service, d.frequency) : 0;
  const bins = isRecycling ? 0 : d.extraBins * EXTRA_BIN;
  const fee = feeFor(plan);
  const monthly = plan + bins;
  const startDate = d.start ? fromIsoDay(d.start) : null;
  const dim = startDate ? new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate() : 30;
  const remaining = startDate ? dim - startDate.getDate() + 1 : dim;
  const dueNow = isRecycling || !startDate ? monthly : Math.round((monthly * remaining) / dim / 10) * 10;
  const firstPickupLabel = startDate?.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  const cardDigits = d.card.number.replace(/\D/g, "");
  const cardErr = {
    number: cardDigits.length !== 16 ? "Enter the 16-digit card number" : "",
    expiry: !/^(0[1-9]|1[0-2])\/(\d{2})$/.test(d.card.expiry) || Number(d.card.expiry.slice(3)) < 26 ? "Use MM/YY, for a card that hasn't expired" : "",
    cvv: !/^\d{3}$/.test(d.card.cvv) ? "3 digits on the back" : "",
  };

  const error = (i: number): string | null => {
    switch (i) {
      case 0: return service ? null : "Choose a service to continue.";
      case 1: return !property ? "Choose where Slate should collect." : conflict?.level === "block" ? conflict.title : null;
      case 2: return d.frequency ? null : "Choose how often.";
      case 3: return d.days.length !== needDays ? `Choose ${needDays === 1 ? "one day" : `${needDays} days`}.` : !d.window ? "Choose a time window." : null;
      case 4: return d.start && d.days.includes(weekdayOf(fromIsoDay(d.start))!) ? null : "Choose a start date on one of your collection days.";
      case 6: return d.payment === "new" && (cardErr.number || cardErr.expiry || cardErr.cvv) ? "Check the card details." : null;
      case 7: return d.agreed ? null : "Agree to the service terms and cancellation policy to confirm.";
      default: return null;
    }
  };

  const go = (i: number) => {
    setShowErr(false);
    setStep(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const next = () => {
    if (error(step)) return setShowErr(true);
    if (step === 7) return setModal("confirm");
    go(step + 1);
  };

  const err = showErr ? error(step) : null;
  const ref = "SUB-26-0458";

  /* -------------------------------- render ------------------------------- */
  if (step === 8 && service && property && startDate)
    return (
      <Page narrow className="gap-8">
        <section className="relative isolate flex min-h-[340px] flex-col justify-between gap-10 overflow-hidden rounded-xl bg-slate p-6 text-slate-ink chalk-grain sm:p-8">
          <Strata tone="on-slate" bands={4} seed={5} className="absolute inset-x-0 bottom-0 -z-10 h-1/2 w-full opacity-70" />
          <div className="flex items-center justify-between gap-3">
            <Badge tone="success" icon={<Check strokeWidth={3} />}>Booked</Badge>
            <span className="t-mono text-slate-ink/70">{ref}</span>
          </div>
          <div>
            <h1 className="t-display-xl">Booked.</h1>
            <p className="mt-4 max-w-lg t-body text-slate-ink/85">
              {service.name}, {d.frequency.toLowerCase()} at {property.address.split(",")[0]}. First pickup{" "}
              <span className="font-semibold text-slate-ink">{firstPickupLabel}, {d.window}</span>.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="t-h2 text-ink">What happens next</h2>
          <Timeline
            items={[
              { title: "Booking confirmed", time: "Now", description: `${formatNaira(dueNow)} charged to ${d.payment === "visa" ? "Visa •• 4021" : d.payment === "new" ? `card •• ${cardDigits.slice(-4)}` : "your first Smart Sweep charge"}. Receipt sent by SMS and email.`, state: "done" },
              { title: "Slate assigns a verified operator in your area", time: "Within 24 h", description: "You'll see who is collecting — Slate stays your one contact for everything.", state: "current" },
              ...(isRecycling
                ? [{ title: "Sorting sacks delivered", time: "Day before", description: "Three labelled sacks: PET, cans, paper.", state: "upcoming" as const }]
                : [{ title: "Slate bin delivered", time: "Day before", description: `${1 + d.extraBins} × 240-litre bin${d.extraBins ? "s" : ""}, dropped at the gate.`, state: "upcoming" as const }]),
              { title: "First pickup", time: startDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }), description: `${d.window}. Bin at the gate by ${d.window.slice(0, 5)}.`, state: "upcoming" },
            ]}
          />
        </section>

        <div className="flex flex-col gap-2 sm:flex-row">
          <ButtonLink to="/app/subscriptions?tab=pending" trailing={<ArrowRight className="size-4" />}>View subscription</ButtonLink>
          <ButtonLink to="/app/dashboard" variant="ghost">Back to home</ButtonLink>
        </div>
      </Page>
    );

  return (
    <Page className="gap-6 md:gap-8">
      <PageHeader title="Book a service" description="Slate assigns a verified operator, sets the route and handles payment. You choose the what, where and when." />
      <Stepper steps={STEPS} current={step} onStepClick={(i) => i < step && go(i)} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
        <div className="flex min-w-0 max-w-2xl flex-col gap-6">
          {/* STEP 1 — service */}
          {step === 0 && (
            <StepBody title="What should Slate collect?" sub="Regular services for your home. You can add more later.">
              {pre && !preBookable && (
                <Alert tone="info" title={`${pre.name} isn't booked here`}>
                  {pre.id === "svc-bulk" ? <>Bulk pickups are priced from photos. <Link to="/app/bulk-waste" className="font-medium text-ink underline underline-offset-4">Get a bulk quote</Link></> : <>It's arranged by quote. <Link to={`/app/services/${pre.id}`} className="font-medium text-ink underline underline-offset-4">Request one from the service page</Link></>}
                </Alert>
              )}
              <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Service">
                {BOOKABLE.map((s) => {
                  const mineHere = SUBSCRIPTIONS.find((x) => x.serviceId === s.id && (x.status === "Active" || x.status === "Pending"));
                  return (
                    <ChoiceCard
                      key={s.id}
                      selected={d.serviceId === s.id}
                      onSelect={() => set({ serviceId: s.id, frequency: s.frequency, days: [], window: d.window, start: "", extraBins: 0 })}
                      icon={s.id === "svc-recycling" ? <Package /> : <Home />}
                      title={
                        <span className="flex flex-wrap items-center gap-2">
                          {s.name}
                          {mineHere && <Badge tone={mineHere.status === "Active" ? "slate" : "info"}>{mineHere.status === "Active" ? "You have this" : "Starts 13 Oct"}</Badge>}
                        </span>
                      }
                      description={s.short}
                      meta={<span className="tnum">{formatNaira(s.priceFrom)}<span className="font-normal text-ink-3">/mo</span></span>}
                    />
                  );
                })}
              </div>
              <p className="t-small text-ink-3">
                One-off instead? <Link to="/app/extra-pickup" className="font-medium text-ink-2 underline underline-offset-4 hover:text-ink">Request an extra pickup</Link> or{" "}
                <Link to="/app/bulk-waste" className="font-medium text-ink-2 underline underline-offset-4 hover:text-ink">get a bulk quote</Link>.
              </p>
            </StepBody>
          )}

          {/* STEP 2 — property */}
          {step === 1 && service && (
            <StepBody title="Where should Slate collect?" sub="Choose a saved property, or add a new address.">
              <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Property">
                {properties.map((p) => {
                  const c = conflictFor(service, p);
                  return (
                    <ChoiceCard
                      key={p.id}
                      selected={d.propertyId === p.id}
                      onSelect={() => set({ propertyId: p.id, days: [], start: "" })}
                      icon={<MapPin />}
                      title={p.address}
                      description={
                        <>
                          {p.label}
                          {p.landmark && ` · ${p.landmark}`}
                          {c?.level === "block" && <span className="mt-1 block text-warning">{c.title}</span>}
                        </>
                      }
                    />
                  );
                })}
              </div>
              <Button variant="outline" leading={<Plus className="size-4" />} onClick={() => setModal("address")} className="self-start">
                Add a new address
              </Button>
              {conflict && (
                <Alert tone={conflict.level === "block" ? "warning" : "neutral"} title={conflict.title}>
                  {conflict.body}
                </Alert>
              )}
            </StepBody>
          )}

          {/* STEP 3 — frequency */}
          {step === 2 && service && (
            <StepBody title="How often?" sub={service.frequencies.length === 1 ? `${service.name} runs ${service.frequency.toLowerCase()}. For more collections, choose Slate Home.` : "You can change this any time — it applies from your next collection."}>
              <FrequencyCards service={service} value={d.frequency} onChange={(f) => set({ frequency: f, days: d.days.slice(0, FREQ_META[f]?.days ?? 1), start: "" })} />
            </StepBody>
          )}

          {/* STEP 4 — schedule */}
          {step === 3 && service && property && (
            <StepBody
              title="Which days, and when?"
              sub={`Choose ${needDays === 1 ? "one day" : `${needDays} days`}${isRecycling ? " — collected on that weekday " + (d.frequency === "Monthly" ? "once a month" : "every other week") : ""}. “Route” days are when Slate's truck already serves ${property.area}.`}
            >
              <WeekStrip
                days={d.days}
                window={d.window || undefined}
                route={route}
                showRoute
                onToggle={(day) => {
                  const has = d.days.includes(day);
                  const nextDays = has ? d.days.filter((x) => x !== day) : [...d.days, day].slice(-needDays);
                  set({ days: WEEKDAYS_ORDER(nextDays), start: "" });
                }}
              />
              <p className="t-small text-ink-2 tnum" aria-live="polite">
                {d.days.length}/{needDays} chosen{d.days.length ? ` · ${joinDays(d.days)}` : ""}
                {d.days.length > 0 && !d.days.every((x) => route.includes(x)) && <span className="text-ink-3"> · off-route days cost the same</span>}
              </p>
              <div className="flex flex-col gap-2">
                <p className="t-small font-medium text-ink">Time window</p>
                <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Time window">
                  {WINDOWS.map((w) => {
                    const fullOn = d.days.filter((x) => slotState(x, w) === "full");
                    const fewOn = d.days.filter((x) => slotState(x, w) === "few");
                    return (
                      <ChoiceCard
                        key={w}
                        selected={d.window === w}
                        disabled={fullOn.length > 0}
                        onSelect={() => set({ window: w })}
                        title={<span className="tnum">{w}</span>}
                        description={fullOn.length ? `Full on ${joinDays(fullOn)}` : fewOn.length ? `2 places left on ${joinDays(fewOn)}` : w.startsWith("14") ? "Afternoon" : "Morning"}
                      />
                    );
                  })}
                </div>
              </div>
            </StepBody>
          )}

          {/* STEP 5 — start date */}
          {step === 4 && (
            <StepBody title="When should it start?" sub={`Your first pickup must fall on ${joinDays(d.days)}. Slate needs two days to assign an operator${isRecycling ? "" : " and deliver your bin"}.`}>
              <MiniCalendar days={d.days} value={d.start} onChange={(v) => set({ start: v })} />
              {startDate && (
                <p className="t-body text-ink" aria-live="polite">
                  First pickup <span className="font-semibold">{firstPickupLabel}</span>, {d.window}.
                </p>
              )}
            </StepBody>
          )}

          {/* STEP 6 — price */}
          {step === 5 && service && (
            <StepBody title="Review the price" sub="All-in. No call-out fees, no tips, no surprise charges.">
              <div className="flex flex-col gap-1 border-b border-line pb-5">
                <p className="t-micro text-ink-3">{service.name} · {d.frequency}</p>
                <p className="flex items-baseline gap-1.5">
                  <span className="t-display text-ink tnum">{formatNaira(monthly)}</span>
                  <span className="t-body text-ink-3">/month</span>
                </p>
                <p className="t-small text-ink-2 tnum">
                  {isRecycling
                    ? `Charged today, then on the ${startDate?.getDate()}th of each month.`
                    : `Today: ${formatNaira(dueNow)} for ${remaining} days of ${startDate?.toLocaleDateString("en-GB", { month: "long" })}. Then ${formatNaira(monthly)} on the 1st.`}
                </p>
              </div>
              {!isRecycling && (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="t-body font-medium text-ink">Bins</p>
                    <p className="t-small text-ink-2">One 240-litre bin included. Extra bins {formatNaira(EXTRA_BIN)}/month each.</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-md border border-line-strong bg-surface p-1">
                    <button type="button" aria-label="Fewer bins" disabled={d.extraBins === 0} onClick={() => set({ extraBins: d.extraBins - 1 })} className="flex size-9 items-center justify-center rounded-sm text-ink hover:bg-sunken disabled:opacity-30">
                      <Minus className="size-4" />
                    </button>
                    <span className="w-8 text-center t-body font-semibold text-ink tnum" aria-live="polite">{1 + d.extraBins}</span>
                    <button type="button" aria-label="More bins" disabled={d.extraBins >= 3} onClick={() => set({ extraBins: d.extraBins + 1 })} className="flex size-9 items-center justify-center rounded-sm text-ink hover:bg-sunken disabled:opacity-30">
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>
              )}
              <div className="flex flex-col divide-y divide-line border-y border-line">
                <PriceLine label={`Collection, ${d.frequency.toLowerCase()}`} value={formatNaira(plan - fee)} />
                {!isRecycling && <PriceLine label={`Bins · ${1 + d.extraBins} × 240 L`} sub={d.extraBins ? `1 included, ${d.extraBins} extra` : "1 included"} value={bins ? formatNaira(bins) : "Included"} muted={!bins} />}
                <PriceLine label="Slate service fee" value={formatNaira(fee)} />
              </div>
              <Button variant="link" onClick={() => setModal("breakdown")} className="self-start">See full price breakdown</Button>
            </StepBody>
          )}

          {/* STEP 7 — payment */}
          {step === 6 && (
            <StepBody title="How would you like to pay?" sub="Slate takes the payment and pays the operator. You'll never be asked for cash at the gate.">
              <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Payment method">
                <ChoiceCard selected={d.payment === "visa"} onSelect={() => set({ payment: "visa" })} icon={<CreditCard />} title="Visa •• 4021" description="Default card · expires 08/28" meta={<Badge>Saved</Badge>} />
                <ChoiceCard selected={d.payment === "new"} onSelect={() => set({ payment: "new" })} icon={<Plus />} title="Add a new card" description="Visa, Mastercard or Verve. Secured by Paystack." />
                {d.payment === "new" && (
                  <div className="grid gap-3 rounded-md bg-sunken p-4 sm:grid-cols-[1fr_120px_100px]">
                    <Input
                      label="Card number"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="5399 2104 8836 1172"
                      value={d.card.number}
                      maxLength={19}
                      onChange={(e) => set({ card: { ...d.card, number: e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ") } })}
                      error={showErr ? cardErr.number : undefined}
                      fieldClassName="sm:col-span-3"
                    />
                    <Input
                      label="Expiry"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM/YY"
                      value={d.card.expiry}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                        set({ card: { ...d.card, expiry: v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v } });
                      }}
                      error={showErr ? cardErr.expiry : undefined}
                      fieldClassName="sm:col-span-1"
                    />
                    <Input
                      label="CVV"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="123"
                      value={d.card.cvv}
                      onChange={(e) => set({ card: { ...d.card, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) } })}
                      error={showErr ? cardErr.cvv : undefined}
                      fieldClassName="sm:col-span-1"
                    />
                    <p className="flex items-center gap-1.5 self-end pb-3 t-micro text-ink-3 sm:col-span-1">
                      <Lock className="size-3.5" /> Encrypted
                    </p>
                  </div>
                )}
                <ChoiceCard
                  selected={d.payment === "sweep"}
                  onSelect={() => set({ payment: "sweep" })}
                  icon={<Coins />}
                  title="Smart Sweep"
                  description={`Pay in small automatic charges instead of one — about ${formatNaira(Math.ceil(monthly / 4 / 50) * 50)} a week from Visa •• 4021. No interest, stop any time.`}
                />
              </div>
            </StepBody>
          )}

          {/* STEP 8 — confirm */}
          {step === 7 && service && property && startDate && (
            <StepBody title="Confirm your booking" sub="Check everything once. You can change any of it later too.">
              <dl className="flex flex-col divide-y divide-line border-y border-line">
                <SummaryRow label="Service" value={service.name} onChange={() => go(0)} />
                <SummaryRow label="Address" value={property.address} sub={property.landmark} onChange={() => setModal("address")} />
                <SummaryRow label="Frequency" value={d.frequency} onChange={() => setModal("frequency")} />
                <SummaryRow label="Days and window" value={`${joinDays(d.days)}, ${d.window}`} onChange={() => go(3)} />
                <SummaryRow label="First pickup" value={firstPickupLabel!} onChange={() => setModal("date")} />
                <SummaryRow label="Payment" value={d.payment === "visa" ? "Visa •• 4021" : d.payment === "new" ? `Card •• ${cardDigits.slice(-4)}` : "Smart Sweep, weekly"} onChange={() => go(6)} />
                <SummaryRow label="Price" value={`${formatNaira(monthly)}/month`} sub={`${formatNaira(dueNow)} today`} onChange={() => setModal("breakdown")} changeLabel="Breakdown" />
              </dl>
              <div className="flex flex-col gap-2 rounded-md bg-sunken p-4">
                <Checkbox
                  checked={d.agreed}
                  onChange={(v) => set({ agreed: v })}
                  label={
                    <>
                      I agree to the{" "}
                      <button type="button" className="font-medium text-ink underline underline-offset-4" onClick={(e) => { e.preventDefault(); setModal("terms"); }}>service terms</button>{" "}
                      and{" "}
                      <button type="button" className="font-medium text-ink underline underline-offset-4" onClick={(e) => { e.preventDefault(); setModal("cancellation"); }}>cancellation policy</button>
                    </>
                  }
                  description="Cancel any time. Unused days are refunded within 5 working days."
                />
              </div>
            </StepBody>
          )}

          {err && (
            <p role="alert" className="flex items-center gap-2 t-small font-medium text-danger">
              <CircleAlert className="size-4 shrink-0" /> {err}
            </p>
          )}

          <StickyActions
            summary={
              monthly > 0 ? (
                <div className="lg:hidden">
                  <p className="t-micro text-ink-3">{step >= 5 ? "Today" : "Monthly"}</p>
                  <p className="font-display text-[18px] font-bold leading-tight text-ink tnum">{formatNaira(step >= 5 ? dueNow : monthly)}</p>
                </div>
              ) : undefined
            }
          >
            {step > 0 && (
              <Button variant="ghost" leading={<ArrowLeft className="size-4" />} onClick={() => go(step - 1)}>
                Back
              </Button>
            )}
            <Button onClick={next} trailing={step < 7 ? <ArrowRight className="size-4" /> : undefined} className={cn(!monthly && "flex-1 lg:flex-none")}>
              {step === 7 ? "Confirm booking" : step === 6 ? "Review booking" : "Continue"}
            </Button>
          </StickyActions>
        </div>

        {/* Running summary (desktop) */}
        <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5">
            <p className="t-h3 text-ink">Your booking</p>
            <dl className="flex flex-col gap-3 t-small">
              {[
                ["Service", service?.name],
                ["Address", property?.address],
                ["Frequency", d.frequency || undefined],
                ["Days", d.days.length ? `${joinDays(d.days)}${d.window ? `, ${d.window}` : ""}` : undefined],
                ["Starts", startDate?.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })],
                ["Payment", step >= 6 ? (d.payment === "visa" ? "Visa •• 4021" : d.payment === "new" ? "New card" : "Smart Sweep") : undefined],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col">
                  <dt className="t-micro text-ink-3">{k}</dt>
                  <dd className={cn(v ? "text-ink" : "text-ink-3")}>{v ?? "—"}</dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-line pt-4">
              <p className="t-micro text-ink-3">Monthly</p>
              <p className="font-display text-[28px] font-bold leading-tight text-ink tnum">{monthly ? formatNaira(monthly) : "—"}</p>
              {monthly > 0 && startDate && <p className="t-small text-ink-2 tnum">{formatNaira(dueNow)} today</p>}
            </div>
            <p className="t-micro text-ink-3">Slate assigns a verified operator after you book. You never have to choose one.</p>
          </div>
        </aside>
      </div>

      {/* ------------------------------ modals ------------------------------ */}
      <AddressModal
        open={modal === "address"}
        onClose={() => setModal(null)}
        service={service}
        properties={properties}
        current={d.propertyId}
        onPick={(id) => set({ propertyId: id })}
        onAdd={(p) => {
          setProperties((ps) => [...ps, p]);
          set({ propertyId: p.id, days: step > 3 ? d.days : [], start: step > 4 ? d.start : "" });
          toast.success("Address added", p.address);
        }}
      />
      <Modal
        open={modal === "date"}
        onClose={() => setModal(null)}
        title="Change start date"
        description={`First pickup on a ${joinDays(d.days)}.`}
        footer={<Button onClick={() => setModal(null)}>Done</Button>}
      >
        <div className="pb-3">
          <MiniCalendar days={d.days} value={d.start} onChange={(v) => set({ start: v })} />
        </div>
      </Modal>
      <Modal
        open={modal === "frequency"}
        onClose={() => setModal(null)}
        title="Change frequency"
        description="Your days reset if the number of collections changes."
        footer={<Button onClick={() => setModal(null)}>Done</Button>}
      >
        <div className="pb-3">
          {service && (
            <FrequencyCards
              service={service}
              value={d.frequency}
              onChange={(f) => {
                const n = FREQ_META[f]?.days ?? 1;
                const keep = d.days.length === n;
                set({ frequency: f, days: keep ? d.days : d.days.slice(0, n) });
                if (!keep) {
                  setModal(null);
                  go(3);
                  toast.info("Choose your days again", `${f} needs ${n === 1 ? "one day" : `${n} days`}.`);
                }
              }}
            />
          )}
        </div>
      </Modal>
      <Modal
        open={modal === "breakdown"}
        onClose={() => setModal(null)}
        title="Price breakdown"
        description={service ? `${service.name}, ${d.frequency.toLowerCase()}${property ? ` · ${property.address.split(",")[0]}` : ""}` : undefined}
        footer={<Button variant="secondary" onClick={() => setModal(null)}>Close</Button>}
      >
        <div className="flex flex-col pb-3">
          <div className="flex flex-col divide-y divide-line">
            <PriceLine label="Plan" sub={`${d.frequency}, collection by a Slate-contracted operator`} value={formatNaira(plan - fee)} />
            {!isRecycling && <PriceLine label="Bins" sub={`${1 + d.extraBins} × 240 L · 1 included${d.extraBins ? `, ${d.extraBins} × ${formatNaira(EXTRA_BIN)}` : ""}`} value={bins ? formatNaira(bins) : "₦0"} />}
            <PriceLine label="Slate service fee" sub="Support, missed-pickup recovery, payment processing" value={formatNaira(fee)} />
            <PriceLine label="Total per month" value={formatNaira(monthly)} strong />
          </div>
          {startDate && !isRecycling && (
            <div className="mt-3 rounded-md bg-sunken px-4 py-3 t-small text-ink-2 tnum">
              First charge today: <span className="font-semibold text-ink">{formatNaira(dueNow)}</span> — {remaining} of {dim} days in {startDate.toLocaleDateString("en-GB", { month: "long" })}. From 1 {new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1).toLocaleDateString("en-GB", { month: "long" })}, {formatNaira(monthly)} on the 1st.
            </div>
          )}
        </div>
      </Modal>
      <TermsModal kind="terms" open={modal === "terms"} onClose={() => setModal(null)} onAccept={() => set({ agreed: true })} />
      <TermsModal kind="cancellation" open={modal === "cancellation"} onClose={() => setModal(null)} />
      <Modal
        open={modal === "confirm"}
        onClose={() => !paying && setModal(null)}
        size="sm"
        title="Confirm booking"
        footer={
          <>
            <Button variant="ghost" disabled={paying} onClick={() => setModal(null)}>Not yet</Button>
            <Button
              loading={paying}
              onClick={() => {
                setPaying(true);
                setTimeout(() => {
                  setPaying(false);
                  setModal(null);
                  go(8);
                }, 1100);
              }}
            >
              Confirm and pay {formatNaira(dueNow)}
            </Button>
          </>
        }
      >
        {service && property && (
          <div className="flex flex-col gap-3 pb-3">
            <p className="t-body text-ink-2">
              {service.name}, {d.frequency.toLowerCase()} on {joinDays(d.days)} ({d.window}) at {property.address}, starting {firstPickupLabel}.
            </p>
            <div className="flex items-center justify-between rounded-md bg-sunken px-4 py-3">
              <span className="t-small text-ink-2">{d.payment === "sweep" ? "First Smart Sweep charge" : `Charged to ${d.payment === "visa" ? "Visa •• 4021" : `card •• ${cardDigits.slice(-4)}`}`}</span>
              <span className="font-display text-[20px] font-bold text-ink tnum">{formatNaira(d.payment === "sweep" ? Math.ceil(monthly / 4 / 50) * 50 : dueNow)}</span>
            </div>
            <p className="t-micro text-ink-3">Reference will be <Ref className="text-ink-3">{ref}</Ref></p>
          </div>
        )}
      </Modal>
    </Page>
  );
}

const ORDER: Weekday[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_ORDER = (xs: Weekday[]) => ORDER.filter((x) => xs.includes(x));

function StepBody({ title, sub, children }: { title: string; sub?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5 animate-fade-in">
      <div>
        <h2 className="t-h2 text-ink">{title}</h2>
        {sub && <p className="t-small mt-1 text-ink-2">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

function SummaryRow({ label, value, sub, onChange, changeLabel = "Change" }: { label: string; value: ReactNode; sub?: ReactNode; onChange: () => void; changeLabel?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <dt className="t-micro text-ink-3">{label}</dt>
        <dd className="t-body text-ink">{value}</dd>
        {sub && <dd className="t-small text-ink-3">{sub}</dd>}
      </div>
      <button type="button" onClick={onChange} className="shrink-0 rounded-sm px-1 t-small font-medium text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink hover:decoration-ink">
        {changeLabel}
      </button>
    </div>
  );
}

function FrequencyCards({ service, value, onChange }: { service: Service; value: string; onChange: (f: string) => void }) {
  return (
    <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Frequency">
      {service.frequencies.map((f) => (
        <ChoiceCard
          key={f}
          selected={value === f}
          onSelect={() => onChange(f)}
          title={
            <span className="flex flex-wrap items-center gap-2">
              {f}
              {f === service.frequency && service.frequencies.length > 1 && <Badge>Most chosen</Badge>}
            </span>
          }
          description={FREQ_META[f]?.line}
          meta={<span className="tnum">{formatNaira(priceFor(service, f))}<span className="font-normal text-ink-3">/mo</span></span>}
        />
      ))}
    </div>
  );
}

/** Three-week calendar: only the chosen weekdays, from two days out, can start. */
function MiniCalendar({ days, value, onChange }: { days: Weekday[]; value: string; onChange: (v: string) => void }) {
  const monday = new Date(DEMO_NOW);
  monday.setHours(7, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const cells = Array.from({ length: 21 }, (_, i) => {
    const c = new Date(monday);
    c.setDate(monday.getDate() + i);
    return c;
  });
  const earliest = new Date(DEMO_NOW);
  earliest.setDate(earliest.getDate() + 2);
  earliest.setHours(0, 0, 0, 0);
  const firstOk = cells.find((c) => c >= earliest && days.includes(weekdayOf(c)!));
  return (
    <div className="rounded-lg border border-line bg-surface p-3 sm:p-4">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="t-small font-semibold text-ink">October 2026</p>
        <p className="t-micro text-ink-3">{days.length ? `${joinDays(days)} only` : "Choose days first"}</p>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => (
          <span key={w} className="py-1 t-micro text-ink-3">{w.slice(0, 2)}</span>
        ))}
        {cells.map((c) => {
          const key = isoDay(c);
          const wd = weekdayOf(c);
          const ok = c >= earliest && !!wd && days.includes(wd);
          const sel = value === key;
          const today = key === isoDay(DEMO_NOW);
          return (
            <button
              key={key}
              type="button"
              disabled={!ok}
              aria-pressed={sel}
              aria-label={c.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
              onClick={() => onChange(key)}
              className={cn(
                "relative flex h-12 flex-col items-center justify-center rounded-md text-[15px] font-medium tnum transition",
                sel ? "bg-ink text-surface" : ok ? "bg-stone text-ink hover:bg-stone-hover" : "text-ink-3/70",
                !ok && "cursor-default",
              )}
            >
              {c.getDate() === 1 ? <span className="text-[12px] leading-none">1 Nov</span> : c.getDate()}
              {today && <span className={cn("absolute bottom-1.5 h-0.5 w-4 rounded-full", sel ? "bg-surface" : "bg-ink-3")} aria-hidden />}
              {firstOk && key === isoDay(firstOk) && !sel && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-ink" aria-hidden />}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 px-1 t-micro text-ink-3">
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded-full bg-ink-3" /> Today</span>
        <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-ink" /> Earliest start</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-[3px] bg-stone" /> Available</span>
      </div>
    </div>
  );
}

function AddressModal({
  open, onClose, service, properties, current, onPick, onAdd,
}: {
  open: boolean;
  onClose: () => void;
  service?: Service;
  properties: Property[];
  current: string;
  onPick: (id: string) => void;
  onAdd: (p: Property) => void;
}) {
  const [mode, setMode] = useState<"pick" | "new">("pick");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [tried, setTried] = useState(false);
  const area = useMemo(() => areaOf(address), [address]);
  const ok = address.trim().length > 6 && !!area;
  const served = !!service && !!area && covers(service.id, area);
  const reset = () => {
    setMode("pick");
    setAddress("");
    setLandmark("");
    setTried(false);
  };
  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title={mode === "pick" ? "Change address" : "Add a new address"}
      description={mode === "pick" ? "Where should Slate collect?" : "Slate checks the address is in a service area before you continue."}
      footer={
        mode === "pick" ? (
          <>
            <Button variant="ghost" leading={<Plus className="size-4" />} onClick={() => setMode("new")}>New address</Button>
            <Button onClick={() => { reset(); onClose(); }}>Done</Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => setMode("pick")}>Back</Button>
            <Button
              disabled={tried && (!ok || !served)}
              onClick={() => {
                setTried(true);
                if (!ok || !served) return;
                onAdd({ id: `p-${Date.now()}`, label: "New address", address, area, landmark: landmark || undefined });
                reset();
                onClose();
              }}
            >
              Use this address
            </Button>
          </>
        )
      }
    >
      {mode === "pick" ? (
        <div className="flex flex-col gap-2.5 pb-3">
          {properties.map((p) => (
            <ChoiceCard key={p.id} selected={current === p.id} onSelect={() => onPick(p.id)} icon={<MapPin />} title={p.address} description={p.label} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4 pb-3">
          <AddressInput value={address} onChange={setAddress} error={tried && !ok ? "Choose an address in Uyo from the list, or include the street or estate name." : undefined} />
          <Input label="Landmark" optional value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Yellow gate after the church" />
          {area && service && (
            <Alert tone={served ? "success" : "warning"} title={served ? `${service.name} is available in ${area}` : `${service.name} isn't in ${area} yet`}>
              {served ? "A Slate-contracted operator already serves this street." : "We'll tell you the day it arrives. Other services may be available here."}
            </Alert>
          )}
        </div>
      )}
    </Modal>
  );
}
