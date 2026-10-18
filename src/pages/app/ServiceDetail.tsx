import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowRight, Check, CircleAlert, FileText, MapPin } from "lucide-react";
import { ServiceAreaMap } from "@/components/brand/ServiceAreaMap";
import {
  Alert, Badge, Button, DatePicker, Modal, Page, PageHeader, Segmented, Textarea, useToast,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";
import { me, serviceById, type Service } from "@/data";
import {
  AREA_ZONE, CATEGORY_ICON, ContactSheet, COVERAGE, covers, FREQ_META, FREQ_PRICE, isoDay, NotFound, priceFor, slotState, TermsModal,
  StickyActions, upcomingDays, weekdayOf, WINDOWS,
} from "./_core";
import { SUBSCRIPTIONS } from "./_subs";

/** C4, one service, explained plainly, with a way to start it. */
export default function ServiceDetail() {
  const { id = "" } = useParams();
  const s = serviceById(id);
  if (!s) return <NotFound title="We couldn't find that service" description={`There's no Slate service called “${id}”. It may have been renamed.`} back={{ to: "/app/services", label: "All services" }} />;
  return <Detail key={s.id} s={s} />;
}

type Kind = "subscribe" | "bulk" | "quote" | "account";
const kindOf = (s: Service): Kind => {
  if (!s.eligible.includes("Household")) return "account";
  if (s.id === "svc-bulk") return "bulk";
  if (s.pricingModel === "Quote") return "quote";
  return "subscribe";
};

function Detail({ s }: { s: Service }) {
  const navigate = useNavigate();
  const toast = useToast();
  const kind = kindOf(s);
  const Icon = CATEGORY_ICON[s.category];
  const freqs = FREQ_PRICE[s.id] ? s.frequencies : [];
  const [freq, setFreq] = useState(s.frequencies.includes(s.frequency) ? s.frequency : s.frequencies[0]!);
  const [slot, setSlot] = useState<{ day: string; window: string } | null>(null);
  const [terms, setTerms] = useState(false);
  const [contact, setContact] = useState(false);
  const [quote, setQuote] = useState(false);
  const mine = SUBSCRIPTIONS.find((x) => x.serviceId === s.id && (x.status === "Active" || x.status === "Pending"));
  const cov = COVERAGE[s.id];
  const inArea = covers(s.id, me.household.area);
  const price = priceFor(s, freq);

  const zones = useMemo(() => {
    if (!cov || cov.areas === "all") return Object.values(AREA_ZONE);
    return [...new Set(cov.areas.map((a) => AREA_ZONE[a]!).filter(Boolean))];
  }, [cov]);

  const days = upcomingDays(9, s.pricingModel === "Quote" ? 3 : 2).filter((d) => weekdayOf(d));

  const go = () => {
    if (kind === "bulk") return navigate("/app/bulk-waste");
    if (kind === "quote") return setQuote(true);
    if (kind === "account") return setContact(true);
    const q = new URLSearchParams({ service: s.id });
    if (freqs.length) q.set("frequency", freq);
    if (slot) {
      q.set("start", slot.day);
      q.set("window", slot.window);
    }
    navigate(`/app/book?${q.toString()}`);
  };

  const cta = kind === "bulk" ? "Get a quote" : kind === "quote" ? "Request a quote" : kind === "account" ? "Talk to Slate" : "Get this service";

  return (
    <Page>
      <PageHeader
        back={{ to: "/app/services", label: "Services" }}
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <Icon className="size-3.5" strokeWidth={1.75} /> {s.category}
          </span>
        }
        title={s.name}
        meta={
          <>
            {mine?.status === "Active" && <Badge tone="slate" icon={<Check strokeWidth={3} />}>Your plan</Badge>}
            {mine?.status === "Pending" && <Badge tone="info">Starts 13 Oct</Badge>}
            {s.availability !== "Available" && <Badge tone="warning">{s.availability}</Badge>}
          </>
        }
        description={s.short}
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-10">
          {mine?.status === "Active" && (
            <Alert
              tone="neutral"
              title={`You have ${s.name} at ${mine.address.split(",")[0]}`}
              action={<Link to={`/app/subscriptions/${mine.id}`} className="t-small font-medium text-ink underline underline-offset-4">Manage</Link>}
            >
              Book again only for another property. To change days or frequency, modify your subscription.
            </Alert>
          )}
          {kind === "account" && (
            <Alert tone="info" title={`${s.name} is set up for ${s.eligible.join(" and ").toLowerCase()} accounts`}>
              Slate opens these after a short call and a site check. Talk to us and we'll set it up, you won't need a new login.
            </Alert>
          )}

          <section className="flex flex-col gap-4">
            <p className="t-body max-w-2xl text-ink">{s.description}</p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="t-h2 text-ink">What's included</h2>
            <ul className="grid gap-x-8 sm:grid-cols-2">
              {s.included.map((it) => (
                <li key={it} className="flex items-start gap-3 border-b border-line py-3">
                  <Check className="mt-1 size-4 shrink-0 text-ink" strokeWidth={2.5} />
                  <span className="t-body text-ink">{it}</span>
                </li>
              ))}
            </ul>
            <p className="t-small text-ink-3">Waste accepted: {s.wasteTypes.join(", ")}.</p>
          </section>

          <section className="flex flex-col gap-4">
            <div>
              <h2 className="t-h2 text-ink">Collection frequency</h2>
              <p className="t-small mt-1 text-ink-2">{FREQ_META[freq]?.line ?? s.frequency}</p>
            </div>
            {freqs.length > 1 ? (
              <div className="flex flex-col gap-3">
                <Segmented
                  value={freq}
                  onChange={setFreq}
                  options={freqs.map((f) => ({ value: f, label: f.replace(" weekly", "/wk").replace("Three times", "3×").replace("Twice", "2×").replace(" monthly", "/mo") }))}
                  className="w-full max-w-md"
                />
                <p className="t-small text-ink-2">
                  <span className="font-display text-[22px] font-bold text-ink tnum">{formatNaira(price)}</span>
                  <span className="text-ink-3"> {s.priceUnit}</span>
                  {freq !== s.frequency && FREQ_PRICE[s.id]?.[s.frequency] && (
                    <span className="ml-2 text-ink-3 tnum">
                      {price > priceFor(s, s.frequency) ? "+" : "−"}
                      {formatNaira(Math.abs(price - priceFor(s, s.frequency)))} vs {s.frequency.toLowerCase()}
                    </span>
                  )}
                </p>
              </div>
            ) : (
              <p className="t-body text-ink">{s.frequency}</p>
            )}
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="t-h2 text-ink">Service area</h2>
                <p className="t-small mt-1 text-ink-2">
                  {cov?.areas === "all"
                    ? "Anywhere in Uyo. Slate sends the nearest verified crew."
                    : `${cov?.areas.length ?? 0} areas, served by operators Slate has verified and contracted.`}
                </p>
              </div>
              <span className={cn("inline-flex items-center gap-1.5 t-small font-medium", inArea ? "text-success" : "text-warning")}>
                {inArea ? <Check className="size-4" strokeWidth={2.5} /> : <CircleAlert className="size-4" />}
                {inArea ? "Covers 14 Ewet Housing Estate" : "Not at your address yet"}
              </span>
            </div>
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_200px]">
              <ServiceAreaMap values={Object.fromEntries(zones.map((z) => [z, z === AREA_ZONE[me.household.area] ? 2 : 1]))} formatValue={(v) => (v === 2 ? "Your address" : "Served")} legend="Served today" className="aspect-[4/3] md:aspect-auto md:h-64" />
              <ul className="flex flex-col gap-1.5 t-small">
                {(cov?.areas === "all" ? ["All Uyo areas"] : cov?.areas ?? []).map((a) => (
                  <li key={a} className="flex items-center gap-2 text-ink">
                    <MapPin className="size-3.5 shrink-0 text-ink-3" /> {a}
                  </li>
                ))}
                {cov?.soon?.areas.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-ink-3">
                    <MapPin className="size-3.5 shrink-0" /> {a} <span className="t-micro">from {cov.soon!.from}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div>
              <h2 className="t-h2 text-ink">Available schedule</h2>
              <p className="t-small mt-1 text-ink-2">
                {kind === "subscribe"
                  ? "Earliest start dates and windows for 14 Ewet Housing Estate. Pick one to carry it into booking."
                  : kind === "bulk"
                    ? "Crews available after your quote is confirmed. Quotes take under 2 working hours."
                    : "Dates open after a site visit or quote."}
              </p>
            </div>
            <div className="overflow-hidden rounded-lg border border-line bg-surface">
              <div className="grid grid-cols-[88px_repeat(4,minmax(0,1fr))] border-b border-line bg-sunken/60 sm:grid-cols-[120px_repeat(4,minmax(0,1fr))]">
                <span className="px-3 py-2 t-micro text-ink-3 sm:px-4">Day</span>
                {WINDOWS.map((w) => (
                  <span key={w} className="px-1 py-2 text-center t-micro text-ink-3 tnum">{w.replace(/:00/g, "")}</span>
                ))}
              </div>
              {days.slice(0, 6).map((d) => {
                const wd = weekdayOf(d)!;
                const key = isoDay(d);
                return (
                  <div key={key} className="grid grid-cols-[88px_repeat(4,minmax(0,1fr))] items-center border-b border-line last:border-0 sm:grid-cols-[120px_repeat(4,minmax(0,1fr))]">
                    <span className="flex flex-col px-3 py-2.5 sm:px-4">
                      <span className="t-small font-medium text-ink">
                        {d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" })}
                        <span className="max-sm:hidden"> {d.toLocaleDateString("en-GB", { month: "short" })}</span>
                      </span>
                      {(wd === "Mon" || wd === "Thu") && kind === "subscribe" && <span className="t-micro text-ink-3">Route day</span>}
                    </span>
                    {WINDOWS.map((w) => {
                      const st = slotState(wd, w);
                      const sel = slot?.day === key && slot.window === w;
                      return (
                        <span key={w} className="p-1">
                          <button
                            type="button"
                            disabled={st === "full" || kind !== "subscribe"}
                            aria-pressed={sel}
                            aria-label={`${d.toDateString()} ${w}: ${st === "full" ? "full" : st === "few" ? "few places left" : "available"}`}
                            onClick={() => setSlot(sel ? null : { day: key, window: w })}
                            className={cn(
                              "flex h-10 w-full items-center justify-center rounded-sm text-[12px] font-medium transition",
                              sel
                                ? "bg-ink text-surface"
                                : st === "full"
                                  ? "cursor-not-allowed bg-[repeating-linear-gradient(135deg,var(--sunken)_0_4px,transparent_4px_8px)] text-ink-3 line-through"
                                  : st === "few"
                                    ? "border border-line-strong text-warning hover:border-ink"
                                    : "border border-line text-ink-2 hover:border-ink hover:text-ink",
                              kind !== "subscribe" && st !== "full" && "cursor-default hover:border-line hover:text-ink-2",
                            )}
                          >
                            {sel ? <Check className="size-4" strokeWidth={3} /> : st === "full" ? "Full" : st === "few" ? "2 left" : "Open"}
                          </button>
                        </span>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            {slot && (
              <p className="t-small text-ink-2" aria-live="polite">
                Start on <span className="font-medium text-ink">{new Date(`${slot.day}T07:00:00+01:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</span>, {slot.window}.
              </p>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="t-h2 text-ink">Requirements</h2>
            <ul className="flex flex-col divide-y divide-line border-y border-line">
              {s.requirements.map((r, i) => (
                <li key={r} className="flex items-baseline gap-3 py-3">
                  <span className="t-mono text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                  <span className="t-body text-ink">{r}</span>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setTerms(true)} className="inline-flex w-fit items-center gap-2 t-small font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              <FileText className="size-4" /> Read the service terms
            </button>
          </section>
        </div>

        {/* Price + CTA */}
        <aside className="max-lg:order-last lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-col gap-5 rounded-lg border border-line bg-surface p-5 sm:p-6">
            <div>
              <p className="t-micro text-ink-3">{s.pricingModel === "Quote" ? "Priced by quote, from" : s.pricingModel === "Per household" ? "Per household" : "All-in price"}</p>
              <p className="mt-1 flex items-baseline gap-1">
                <span className="t-display text-ink tnum">{formatNaira(price)}</span>
                <span className="t-body text-ink-3">{s.priceUnit}</span>
              </p>
              {freqs.length > 0 && <p className="mt-1 t-small text-ink-2">{freq}, includes the Slate service fee</p>}
            </div>
            <dl className="flex flex-col divide-y divide-line border-y border-line t-small">
              {[
                ["Frequency", freqs.length ? freq : s.frequency],
                ["Billing", s.pricingModel === "Monthly subscription" ? "Monthly, on the 1st" : s.pricingModel === "Per household" ? "One estate invoice" : "After the quote is accepted"],
                ["Operator", "Assigned by Slate"],
                ["If a pickup is missed", "Recovered within 24 h"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-ink-3">{k}</dt>
                  <dd className="text-right font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <Button block size="lg" trailing={<ArrowRight className="size-4" />} onClick={go}>
              {cta}
            </Button>
            <p className="-mt-2 t-micro text-ink-3">
              {kind === "subscribe" ? "You'll review the price before paying. Cancel any time." : kind === "account" ? "Slate replies within one working day." : "No payment until you accept a quote."}
            </p>
          </div>
        </aside>
      </div>

      <StickyActions className="lg:hidden" summary={<p className="t-small text-ink-2"><span className="font-display text-[20px] font-bold text-ink tnum">{formatNaira(price)}</span> {s.priceUnit}</p>}>
        <Button onClick={go} trailing={<ArrowRight className="size-4" />}>{cta}</Button>
      </StickyActions>

      <TermsModal kind="terms" open={terms} onClose={() => setTerms(false)} />
      <ContactSheet open={contact} onClose={() => setContact(false)} topic={`Ask about ${s.name}. Slate will set up the right account and service for you.`} />
      <QuoteModal s={s} open={quote} onClose={() => setQuote(false)} onSent={() => toast.success("Quote request sent", `Slate will call you about ${s.name.toLowerCase()} within 2 working hours.`)} />
    </Page>
  );
}

function QuoteModal({ s, open, onClose, onSent }: { s: Service; open: boolean; onClose: () => void; onSent: () => void }) {
  const [desc, setDesc] = useState("");
  const [when, setWhen] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});
  const submit = () => {
    const e: Record<string, string> = {};
    if (desc.trim().length < 12) e.desc = "Describe the job in a sentence or two so we can price it.";
    if (!when) e.when = "Choose a date, even a rough one.";
    setErr(e);
    if (Object.keys(e).length) return;
    onClose();
    onSent();
    setDesc("");
    setWhen("");
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Request a quote, ${s.name}`}
      description="Slate prices the job, books a verified specialist crew and handles payment. You only deal with us."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Send request</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Textarea label="What needs collecting?" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} error={err.desc} placeholder={s.id === "svc-event" ? "Wedding reception, about 300 guests, at Ibom Hall" : "Builders' rubble from a kitchen renovation, about 20 bags"} />
        <DatePicker label="When"  value={when} min="2026-10-07" onChange={(date) => setWhen(date)} error={err.when} />
        <p className="t-small text-ink-3">Address: {me.household.address}</p>
      </div>
    </Modal>
  );
}
