import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Check, Plus, Truck, X } from "lucide-react";
import {
  BarChart, Button, ChipGroup, ChoiceCard, ConfirmDialog, Donut, List, ListRow, Modal, Page, PageHeader, Section, Segmented, Textarea, useToast,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { useSession } from "@/lib/session";
import { recyclingPartners } from "@/data";
import { formatDate, formatNaira } from "@/lib/format";
import { MATERIALS, RAMP, cday, entryKg, recyclingHistory, type Material } from "./_care";

const SHORT: Record<Material, string> = {
  "PET plastic": "PET",
  "Aluminium cans": "Cans",
  "Paper & cardboard": "Paper",
  "E-waste": "E-waste",
  Glass: "Glass",
};

const kg = (n: number) => `${n.toFixed(1).replace(/\.0$/, "")} kg`;

interface Slot {
  id: string;
  day: string;
  window: string;
  note: string;
  extra: number;
}

const SLOTS: Slot[] = [
  { id: "s-13", day: cday(8, 14), window: "14:00–16:00", note: "With your monthly pickup", extra: 0 },
  { id: "s-07", day: cday(2, 14), window: "14:00–16:00", note: "Extra pickup", extra: 1000 },
  { id: "s-10", day: cday(5, 10), window: "10:00–12:00", note: "Extra pickup, Saturday", extra: 1000 },
];

/** C23, recycling for a household. */
export default function Recycling() {
  const toast = useToast();
  const { theme } = useSession();
  const [requestOpen, setRequestOpen] = useState(false);
  const [skipOpen, setSkipOpen] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [extras, setExtras] = useState<Array<{ slot: Slot; materials: string[]; bags: string }>>([]);
  const [added, setAdded] = useState<string[]>([]);
  const [guide, setGuide] = useState<Material>("PET plastic");

  const totals = useMemo(() => {
    const t: Record<Material, number> = { "PET plastic": 0, "Aluminium cans": 0, "Paper & cardboard": 0, "E-waste": 0, Glass: 0 };
    recyclingHistory.forEach((e) => (Object.entries(e.kg) as Array<[Material, number]>).forEach(([m, v]) => (t[m] += v)));
    return t;
  }, []);
  const year = Object.values(totals).reduce((a, b) => a + b, 0);
  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
  const monthly = months.map((_, i) =>
    +recyclingHistory.filter((e) => new Date(e.date).getMonth() === 3 + i).reduce((a, e) => a + entryKg(e), 0).toFixed(1),
  );
  const ramp = RAMP[theme];
  const segments = (Object.keys(totals) as Material[])
    .map((m) => ({ label: m, value: +totals[m].toFixed(1) }))
    .sort((a, b) => b.value - a.value)
    .map((s, i) => ({ ...s, color: ramp[i] }));
  const bottles = Math.round((totals["PET plastic"] * 1000) / 23 / 10) * 10;
  const cans = Math.round((totals["Aluminium cans"] * 1000) / 15 / 10) * 10;
  const next = SLOTS[0]!;
  const g = MATERIALS.find((m) => m.name === guide)!;

  return (
    <Page>
      <PageHeader
        title="Recycling"
        description="Sorted recyclables collected from your gate once a month and weighed at Slate's recovery partners in Uyo."
        actions={
          <Button leading={<Plus className="size-4" />} onClick={() => setRequestOpen(true)}>
            Request pickup
          </Button>
        }
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        {/* Recovery statistics */}
        <section aria-labelledby="recovered" className="flex min-w-0 flex-col gap-8">
          <div className="flex flex-col gap-3">
            <p id="recovered" className="t-small text-ink-3">
              Recovered from your home in 2026
            </p>
            <p className="t-display-xl text-ink tnum">{kg(year)}</p>
            <p className="t-body max-w-xl text-ink-2">
              Mostly PET and cans, roughly <span className="font-semibold text-ink tnum">{bottles}</span> bottles and{" "}
              <span className="font-semibold text-ink tnum">{cans}</span> cans that went to recovery partners instead of the Uyo dumpsite.
            </p>
          </div>
          <div className="grid gap-8 border-t border-line pt-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:gap-10">
            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <h2 className="t-h3 text-ink">By month</h2>
                <span className="t-micro text-ink-3">kg</span>
              </div>
              <BarChart data={monthly} labels={months} height={150} highlight={6} format={(v) => kg(v)} label="Kilograms recovered by month" />
              <p className="t-small text-ink-3">October so far: one depot drop-off. Your monthly pickup is on the 13th.</p>
            </div>
            <div className="flex min-w-0 flex-col gap-3">
              <h2 className="t-h3 text-ink">By material</h2>
              <Donut
                segments={segments}
                size={132}
                thickness={16}
                center={
                  <>
                    <span className="font-display text-[22px] font-bold leading-none text-ink tnum">{Math.round(year)}</span>
                    <span className="t-micro text-ink-3">kg</span>
                  </>
                }
              />
            </div>
          </div>
        </section>

        {/* Schedule */}
        <aside className="flex min-w-0 flex-col gap-6">
          <section aria-label="Next recycling pickup" className="rounded-lg border border-line bg-surface">
            <div className="flex flex-col gap-4 p-5 sm:p-6">
              <p className="t-micro text-ink-3">Next recyclables pickup</p>
              {skipped ? (
                <div className="flex flex-col gap-2">
                  <p className="t-h2 text-ink">Skipped this month</p>
                  <p className="t-small text-ink-2">Your next pickup is Tue 10 Nov, 14:00–16:00. You won't be charged for October.</p>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="flex w-14 shrink-0 flex-col items-center rounded-md bg-sunken py-2">
                    <span className="t-micro uppercase text-ink-3">Tue</span>
                    <span className="font-display text-[26px] font-bold leading-none text-ink tnum">13</span>
                    <span className="t-micro text-ink-3">Oct</span>
                  </div>
                  <div className="min-w-0">
                    <p className="t-h2 text-ink tnum">{next.window}</p>
                    <p className="t-small text-ink-2">Samuel Akpan · UYO 903 BG · Ufok Environmental</p>
                    <p className="t-small mt-1 text-ink-3">Moved from Thu 8 Oct while the recycling truck is serviced.</p>
                  </div>
                </div>
              )}
              {added.length > 0 && !skipped && (
                <p className="flex items-start gap-2 rounded-md bg-sunken px-3 py-2.5 t-small text-ink-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-ink" strokeWidth={2.5} />
                  Added: {added.join(", ")}
                </p>
              )}
            </div>
            <div className="flex gap-2 border-t border-line p-4 sm:px-6">
              {skipped ? (
                <Button variant="secondary" size="sm" onClick={() => { setSkipped(false); toast.success("Pickup back on", "Tue 13 Oct, 14:00–16:00."); }}>
                  Undo skip
                </Button>
              ) : (
                <>
                  <Button variant="secondary" size="sm" onClick={() => setRequestOpen(true)}>
                    Add items
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSkipOpen(true)}>
                    Skip this month
                  </Button>
                </>
              )}
            </div>
          </section>

          {extras.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="t-h3 text-ink">Extra pickups requested</h2>
              <List className="border-y border-line">
                {extras.map((x, i) => (
                  <ListRow
                    key={i}
                    leading={<Truck className="size-[18px] text-ink-3" strokeWidth={1.75} />}
                    title={`${formatDate(x.slot.day).replace(/ \d{4}$/, "")}, ${x.slot.window}`}
                    subtitle={`${x.materials.join(", ")} · ${x.bags}`}
                    trailing={
                      <button
                        type="button"
                        aria-label="Cancel extra pickup"
                        className="flex size-8 items-center justify-center rounded-md text-ink-3 hover:bg-sunken hover:text-ink"
                        onClick={() => {
                          setExtras((xs) => xs.filter((_, j) => j !== i));
                          toast.info("Extra pickup cancelled", "The ₦1,000 hold has been released.");
                        }}
                      >
                        <X className="size-4" />
                      </button>
                    }
                  />
                ))}
              </List>
            </section>
          )}

          <div className="flex items-start gap-3 border-t border-line pt-5">
            <div className="min-w-0 flex-1">
              <p className="t-body font-medium text-ink">Recycling Pickup · {formatNaira(1500)}/month</p>
              <p className="t-small text-ink-2">Monthly, second Tuesday, 14:00–16:00. Billed with Slate Home.</p>
            </div>
            <Link to="/app/subscriptions" className="t-small shrink-0 font-medium text-ink-2 hover:text-ink">
              Change
            </Link>
          </div>
        </aside>
      </div>

      {/* Sorting guide */}
      <Section title="What goes in" description="Sorted, clean and dry. Anything in the wrong bag goes to general waste, so it isn't wasted effort to check.">
        <div className="-mx-5 overflow-x-auto px-5 scrollbar-none md:mx-0 md:px-0">
          <div role="tablist" aria-label="Materials" className="flex min-w-max gap-2">
            {MATERIALS.map((m) => {
              const on = m.name === guide;
              return (
                <button
                  key={m.name}
                  role="tab"
                  type="button"
                  aria-selected={on}
                  onClick={() => setGuide(m.name)}
                  className={cn(
                    "flex h-11 items-center gap-2.5 rounded-md border px-3.5 text-[14px] font-medium transition",
                    on ? "border-ink bg-ink text-surface" : "border-line-strong bg-surface text-ink-2 hover:border-ink-3 hover:text-ink",
                  )}
                >
                  <span className={cn("rounded-[4px] px-1.5 py-0.5 font-mono text-[12px] font-semibold", on ? "bg-surface/15" : "bg-sunken text-ink")}>{m.code}</span>
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>
        <div role="tabpanel" className="grid gap-6 rounded-lg border border-line bg-surface p-5 sm:p-6 md:grid-cols-[1fr_1fr_minmax(0,0.9fr)] md:gap-8">
          <div>
            <p className="t-micro mb-2 text-ink-3">Goes in</p>
            <ul className="flex flex-col gap-2">
              {g.goesIn.map((x) => (
                <li key={x} className="flex items-start gap-2.5 t-small text-ink">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2.5} />
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="t-micro mb-2 text-ink-3">Keep out</p>
            <ul className="flex flex-col gap-2">
              {g.keepOut.map((x) => (
                <li key={x} className="flex items-start gap-2.5 t-small text-ink">
                  <X className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={2.5} />
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3 border-t border-line pt-5 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <div>
              <p className="t-micro text-ink-3">Before you bag it</p>
              <p className="t-small mt-1 text-ink">{g.prep}</p>
            </div>
            <div>
              <p className="t-micro text-ink-3">Goes to</p>
              <p className="t-small mt-1 text-ink">{g.partner}</p>
            </div>
            <div>
              <p className="t-micro text-ink-3">Yours this year</p>
              <p className="t-small mt-1 font-semibold text-ink tnum">{kg(totals[g.name])}</p>
            </div>
          </div>
        </div>
      </Section>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <Section title="History" description="Weighed at the partner's yard. Weights reach you within two days of the pickup.">
          <List className="border-y border-line">
            {recyclingHistory.map((e) => {
              const d = new Date(e.date);
              const parts = (Object.entries(e.kg) as Array<[Material, number]>).map(([m, v]) => `${SHORT[m]} ${v.toFixed(1)}`);
              return (
                <ListRow
                  key={e.id}
                  to={e.ref === "PU-26-08244" ? `/app/pickups/${e.ref}` : undefined}
                  leading={
                    <div className="flex w-12 flex-col items-center rounded-md bg-sunken py-1.5">
                      <span className="t-micro uppercase text-ink-3">{d.toLocaleDateString("en-GB", { month: "short" }).slice(0, 3)}</span>
                      <span className="font-display text-[20px] font-bold leading-none text-ink tnum">{d.getDate()}</span>
                    </div>
                  }
                  title={
                    <span className="tnum">
                      {kg(entryKg(e))} <span className="font-normal text-ink-3">· {e.kind}</span>
                    </span>
                  }
                  subtitle={`${parts.join(" · ")} kg`}
                  meta={<span className="t-mono text-[12.5px]">{e.ref}</span>}
                />
              );
            })}
          </List>
        </Section>

        <Section title="Where it goes" description="Slate's contracted recovery partners. They pay per kilo, which keeps your plan at ₦1,500.">
          <List className="border-y border-line">
            {MATERIALS.map((m) => {
              const partner = recyclingPartners.find((p) => p.name === m.partner);
              return (
                <div key={m.name} className="flex items-start justify-between gap-4 py-3.5">
                  <div className="min-w-0">
                    <p className="t-body font-medium text-ink">{partner ? partner.name : "Itam yard (holding)"}</p>
                    <p className="t-small text-ink-2">{partner ? partner.materials.join(", ") : "Glass, until a glass partner is contracted"}</p>
                  </div>
                  <p className="t-small shrink-0 text-right text-ink-2 tnum">
                    <span className="font-semibold text-ink">{kg(totals[m.name])}</span>
                    <span className="block t-micro text-ink-3">of yours</span>
                  </p>
                </div>
              );
            })}
          </List>
          <Link to="/app/support" className="group inline-flex items-center gap-1.5 t-small font-medium text-ink-2 hover:text-ink">
            Questions about sorting <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Section>
      </div>

      <RequestModal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        onSubmit={(slot, materials, bags) => {
          setRequestOpen(false);
          if (slot.extra === 0) {
            setSkipped(false);
            setAdded((a) => [...new Set([...a, ...materials])]);
            toast.success("Added to your Tue 13 Oct pickup", `${materials.join(", ")} · ${bags}`);
          } else {
            setExtras((xs) => [...xs, { slot, materials, bags }]);
            toast.success(`Extra pickup booked for ${formatDate(slot.day).replace(/ \d{4}$/, "")}`, `${formatNaira(slot.extra)} will be charged to Visa •• 4021 after collection.`);
          }
        }}
      />
      <ConfirmDialog
        open={skipOpen}
        onClose={() => setSkipOpen(false)}
        title="Skip October's recycling pickup?"
        description="Keep your recyclables for next month, Tue 10 Nov. You won't be charged the ₦1,500 for October."
        confirmLabel="Skip October"
        onConfirm={() => {
          setSkipped(true);
          toast.success("October pickup skipped", "Next pickup Tue 10 Nov, 14:00–16:00.");
        }}
      />
    </Page>
  );
}

function RequestModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (slot: Slot, materials: string[], bags: string) => void }) {
  const [materials, setMaterials] = useState<string[]>(["PET plastic", "Aluminium cans"]);
  const [bags, setBags] = useState<"1 bag" | "2–3 bags" | "4 or more bags">("2–3 bags");
  const [slot, setSlot] = useState(SLOTS[0]!.id);
  const [tried, setTried] = useState(false);
  const chosen = SLOTS.find((s) => s.id === slot)!;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request a recycling pickup"
      description="Add items to your monthly pickup, or book an extra one."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setTried(true);
              if (!materials.length) return;
              onSubmit(chosen, materials, bags);
              setTried(false);
            }}
          >
            {chosen.extra ? `Book for ${formatNaira(chosen.extra)}` : "Add to Tue 13 Oct"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6 pb-2">
        <div className="flex flex-col gap-2">
          <p className="t-small font-medium text-ink">What are you putting out?</p>
          <ChipGroup options={MATERIALS.map((m) => m.name)} value={materials} onChange={setMaterials} />
          {tried && !materials.length && (
            <p className="t-small text-danger" role="alert">
              Choose at least one material.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <p className="t-small font-medium text-ink">Roughly how much?</p>
          <Segmented
            value={bags}
            onChange={setBags}
            className="w-full sm:w-auto"
            options={[
              { value: "1 bag", label: "1 bag" },
              { value: "2–3 bags", label: "2–3 bags" },
              { value: "4 or more bags", label: "4 or more" },
            ]}
          />
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 t-small font-medium text-ink">When</legend>
          {SLOTS.map((s) => (
            <ChoiceCard
              key={s.id}
              selected={slot === s.id}
              onSelect={() => setSlot(s.id)}
              title={`${new Date(s.day).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}, ${s.window}`}
              description={s.note}
              meta={s.extra ? `+${formatNaira(s.extra)}` : "Included"}
              className="py-3.5"
            />
          ))}
        </fieldset>
        {materials.includes("E-waste") && (
          <p className="rounded-md bg-sunken px-3.5 py-3 t-small text-ink-2">Bag and tape loose batteries separately. Fridges and air conditioners go through bulk waste.</p>
        )}
        <Textarea label="Note for the crew" optional rows={2} placeholder="e.g. Bags are behind the generator house" />
      </div>
    </Modal>
  );
}
