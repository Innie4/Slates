import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowLeft, ArrowRight, BadgeCheck, Bell, Building, Building2, CalendarDays, Check, Home, Hotel, Loader2, LocateFixed, MapPin, MapPinned, Pencil, ShieldCheck,
  Truck, Warehouse,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Strata } from "@/components/brand/Strata";
import { ServiceAreaMap } from "@/components/brand/ServiceAreaMap";
import {
  AddressInput, Alert, Badge, Button, Checkbox, ChipGroup, ChoiceCard, Field, Input, Modal, PhoneInput, Segmented, Select, StateView, Stepper, Textarea, useToast,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { DEMO_NOW, formatDay, formatNaira } from "@/lib/format";
import { useSession } from "@/lib/session";
import { AREAS, cities, operators, serviceById } from "@/data";
import { readDraft } from "@/pages/auth/_shared";

const STEPS = ["Welcome", "Location", "Profile", "Waste", "Service"];

const STATES: Record<string, string[]> = {
  "Akwa Ibom": ["Uyo", "Eket", "Ikot Ekpene", "Oron", "Abak", "Ikot Abasi"],
  "Cross River": ["Calabar"],
  Rivers: ["Port Harcourt"],
  Lagos: ["Lagos"],
  FCT: ["Abuja"],
};

const AREA_ZONE: Record<string, string> = {
  "Ewet Housing Estate": "ewet", "Shelter Afrique Estate": "shelter", "Osongama Estate": "osongama", "Aka Road": "aka", "Oron Road": "oron",
  "Ikot Ekpene Road": "nwaniba", "Nwaniba Road": "nwaniba", "Udo Udoma Avenue": "oron", "Wellington Bassey Way": "aka", "Abak Road": "abak", Itam: "itam", "Use Offot": "uselga",
};
const ZONE_AREA: Record<string, string> = {
  ewet: "Ewet Housing Estate", shelter: "Shelter Afrique Estate", osongama: "Osongama Estate", aka: "Aka Road", oron: "Oron Road", nwaniba: "Nwaniba Road",
  abak: "Abak Road", itam: "Itam", uselga: "Use Offot",
};
const ZONE_DAYS: Record<string, [string, number[]]> = {
  ewet: ["Mon & Thu", [1, 4]], aka: ["Mon & Thu", [1, 4]], abak: ["Mon & Thu", [1, 4]],
  shelter: ["Tue & Fri", [2, 5]], oron: ["Tue & Fri", [2, 5]], itam: ["Tue & Fri", [2, 5]],
  osongama: ["Wed & Sat", [3, 6]], nwaniba: ["Wed & Sat", [3, 6]], uselga: ["Wed & Sat", [3, 6]],
};
const ON_TIME: Record<string, number> = { ewet: 98, shelter: 97, osongama: 95, aka: 96, oron: 94, nwaniba: 93, abak: 95, itam: 92, uselga: 94 };
const ESTATES = ["Ewet Housing Estate", "Shelter Afrique Estate", "Osongama Estate", "Federal Housing Estate, Abak Road", "Not in an estate"];

const PROPERTY = [
  { value: "Flat", title: "Flat or apartment", icon: <Building /> },
  { value: "Bungalow", title: "Bungalow", icon: <Home /> },
  { value: "Duplex", title: "Duplex or terrace", icon: <Hotel /> },
  { value: "Compound", title: "Compound, several homes", icon: <Warehouse /> },
];
const VOLUME = {
  Light: "1–2 bags a week. A small flat, or you're often away.",
  Typical: "3–5 bags a week. A family home, cooking most days.",
  Heavy: "6 or more bags a week. A large household, garden waste or a home business.",
} as const;
type Volume = keyof typeof VOLUME;
const CATEGORIES = ["General household", "Food scraps", "PET bottles & cans", "Paper & cardboard", "Garden waste", "Diapers & sanitary", "Old electronics"];
const FREQUENCIES = [
  { value: "Weekly", description: "Best for one or two people.", price: 4500 },
  { value: "Twice weekly", description: "Most homes choose this — food waste never sits for long.", price: 7000 },
  { value: "Three times weekly", description: "Large households and home businesses.", price: 9500 },
];
const SPECIAL = ["Collect from inside the compound — caretaker or gate code", "Someone at home needs help carrying bins", "Dogs on the property"];

const nationalPhone = (v: string) => {
  let d = v.replace(/\D/g, "");
  if (d.startsWith("234")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  return /^[789][01]\d{8}$/.test(d) ? d : null;
};
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

type Errors = Record<string, string | undefined>;

/** C1 — Customer onboarding, full-screen (no portal layout). */
export default function Onboarding() {
  const navigate = useNavigate();
  const toast = useToast();
  const { signIn } = useSession();
  const draft = useMemo(readDraft, []);
  const [nameFirst, ...nameRest] = draft.name.split(/\s+/);

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});

  // Location
  const [state, setState] = useState("Akwa Ibom");
  const [city, setCity] = useState("Uyo");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [estate, setEstate] = useState("");
  const [geoOpen, setGeoOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoDenied, setGeoDenied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cantFindOpen, setCantFindOpen] = useState(false);
  const [notify, setNotify] = useState<"idle" | "loading" | "done">("idle");
  const [notifyEmail, setNotifyEmail] = useState(draft.email);

  // Profile
  const [first, setFirst] = useState(nameFirst ?? "");
  const [last, setLast] = useState(nameRest.join(" "));
  const [phone, setPhone] = useState(draft.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3"));
  const [email, setEmail] = useState(draft.email);
  const [profileAddress, setProfileAddress] = useState("");
  const [occupancy, setOccupancy] = useState("");

  // Waste
  const [property, setProperty] = useState("");
  const [household, setHousehold] = useState("");
  const [volume, setVolume] = useState<Volume>("Typical");
  const [categories, setCategories] = useState<string[]>(["General household", "Food scraps"]);
  const [frequency, setFrequency] = useState("");
  const [special, setSpecial] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  // Service
  const [plan, setPlan] = useState("");
  const [recycling, setRecycling] = useState(false);

  const zone = AREA_ZONE[area];
  const unavailable = city !== "Uyo";
  const cityInfo = cities.find((c) => c.name === city);
  const operator = operators.find((o) => o.status === "Active" && o.areas.includes(area));
  const [days, dayNums] = zone ? ZONE_DAYS[zone]! : ["Mon & Thu", [1, 4]];
  const firstPickup = useMemo(() => {
    const d = new Date(DEMO_NOW);
    d.setDate(d.getDate() + 2);
    while (!dayNums.includes(d.getDay())) d.setDate(d.getDate() + 1);
    return d;
  }, [dayNums]);
  const recommended = frequency === "Weekly" && volume !== "Heavy" ? "svc-home-lite" : "svc-home-weekly";

  const setErr = (k: string, v?: string) => setErrors((e) => ({ ...e, [k]: v }));
  const go = (n: number) => {
    setErrors({});
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pickArea = (a: string) => {
    setArea(a);
    setErr("area");
    if (a.endsWith("Estate")) setEstate(a);
  };

  const onAddress = (v: string) => {
    setAddress(v);
    setErr("address");
    const match = AREAS.find((a) => v.toLowerCase().includes(a.toLowerCase().replace(" estate", "")));
    if (match) pickArea(match);
  };

  const locate = async () => {
    setGeoOpen(false);
    setLocating(true);
    await new Promise((r) => setTimeout(r, 1400));
    setLocating(false);
    setState("Akwa Ibom");
    setCity("Uyo");
    pickArea("Ewet Housing Estate");
    setAddress("14 Ewet Housing Estate, Uyo");
    if (!landmark) setLandmark("Opposite the estate clinic, blue gate");
    setErrors({});
    toast.success("Location found", "14 Ewet Housing Estate, Uyo — within 20 m.");
  };

  /* ---------------- validation per step ---------------- */
  const next = () => {
    const e: Errors = {};
    if (step === 1) {
      if (unavailable) return;
      if (!area) e.area = "Choose your area.";
      if (address.trim().length < 6) e.address = "Enter your house number and street or estate.";
      if (landmark.trim().length < 4) e.landmark = "Add a landmark so the crew can find your gate.";
      setErrors(e);
      if (Object.keys(e).length) return;
      return setConfirmOpen(true);
    }
    if (step === 2) {
      if (!first.trim()) e.first = "Enter your first name.";
      if (!last.trim()) e.last = "Enter your last name.";
      if (!nationalPhone(phone)) e.phone = "Enter a Nigerian mobile number, like 803 412 7765.";
      if (!isEmail(email)) e.email = "Enter a valid email address.";
      if (profileAddress.trim().length < 6) e.profileAddress = "Enter your service address.";
      if (!occupancy) e.occupancy = "Choose how you live at this address.";
      setErrors(e);
      if (Object.keys(e).length) return;
    }
    if (step === 3) {
      if (!property) e.property = "Choose your property type.";
      if (!household) e.household = "Choose how many people live here.";
      if (!categories.length) e.categories = "Pick at least one kind of waste.";
      if (!frequency) e.frequency = "Choose how often you'd like collection.";
      setErrors(e);
      if (Object.keys(e).length) return;
      if (!plan) setPlan(recommended);
    }
    go(step + 1);
  };

  const finish = (to: string) => {
    signIn("household");
    toast.success("You're set up", `${days} collection at ${profileAddress || address}.`);
    navigate(to);
  };

  /* ---------------- step bodies ---------------- */
  const welcome = (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <section className="relative isolate overflow-hidden rounded-xl bg-slate text-slate-ink chalk-grain">
        <Strata tone="on-slate" bands={4} live seed={21} className="absolute inset-x-0 bottom-0 -z-10 h-36 w-full sm:h-44" />
        <div className="flex flex-col gap-4 p-6 pb-40 sm:p-10 sm:pb-48">
          <p className="flex items-center gap-2 t-small text-slate-ink/75">
            <BadgeCheck className="size-4" /> Account created and verified
          </p>
          <h1 className="t-display">Let's get your waste collected.</h1>
          <p className="max-w-lg t-body text-slate-ink/85">
            Four short steps, about three minutes. Tell us where you are and what you throw away — Slate matches your address to a verified operator and the right plan.
          </p>
        </div>
      </section>
      <section aria-labelledby="acct" className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 id="acct" className="t-h2 text-ink">Your account</h2>
          <span className="t-small text-ink-3">You can change these in step 3</span>
        </div>
        <dl className="grid grid-cols-1 divide-y divide-line border-y border-line sm:grid-cols-2 sm:divide-y-0 sm:gap-px sm:bg-line sm:border-0 sm:overflow-hidden sm:rounded-lg sm:border sm:border-line">
          {[
            ["Name", draft.name, null],
            ["Account type", "Household", null],
            ["Email", draft.email, "Verified"],
            ["Mobile", `+234 ${draft.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3")}`, "Verified"],
          ].map(([k, v, tag]) => (
            <div key={k} className="flex flex-col gap-0.5 py-3 sm:bg-surface sm:px-5 sm:py-4">
              <dt className="t-micro text-ink-3">{k}</dt>
              <dd className="flex min-w-0 items-center gap-2 t-body text-ink">
                <span className="truncate">{v}</span>
                {tag && <Badge tone="success" icon={<Check strokeWidth={3} />}>{tag}</Badge>}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );

  const location = (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
      <div className="flex min-w-0 flex-col gap-6">
        <StepTitle title="Where should we collect?" description="Your address decides your zone, collection days and operator." />
        <Button
          variant="outline"
          size="lg"
          block
          loading={locating}
          leading={<LocateFixed className="size-4" />}
          onClick={() => setGeoOpen(true)}
        >
          {locating ? "Finding your location" : "Use my current location"}
        </Button>
        {geoDenied && (
          <Alert tone="neutral" onDismiss={() => setGeoDenied(false)}>
            Location is off. Enter your address below — it works just as well.
          </Alert>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="State"
            options={Object.keys(STATES)}
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setCity(STATES[e.target.value]![0]!);
              setNotify("idle");
            }}
          />
          <Select
            label="City"
            options={STATES[state]!}
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setNotify("idle");
            }}
          />
        </div>

        {!unavailable && (
          <>
            <Select
              label="Area"
              placeholder="Choose your area"
              options={AREAS}
              value={area}
              error={errors.area}
              onChange={(e) => pickArea(e.target.value)}
            />
            <AddressInput value={address} onChange={onAddress} label="Address" error={errors.address} hint="House number, street or block — try “Ewet” or “Aka Road”." />
            <Input
              label="Landmark"
              placeholder="e.g. Opposite the estate clinic, blue gate"
              value={landmark}
              error={errors.landmark}
              hint={!errors.landmark ? "Drivers rely on this more than house numbers." : undefined}
              onChange={(e) => {
                setLandmark(e.target.value);
                setErr("landmark");
              }}
            />
            <Select label="Estate" optional placeholder="Choose an estate" options={ESTATES} value={estate} onChange={(e) => setEstate(e.target.value)} />
            <button type="button" onClick={() => setCantFindOpen(true)} className="w-fit t-small font-medium text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink">
              Can't find my address
            </button>
          </>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        {unavailable ? (
          <div className="rounded-xl border border-line bg-surface px-5 sm:px-8">
            {notify === "done" ? (
              <StateView
                state="success"
                title={`You're on the list for ${city}`}
                description={`We'll email ${notifyEmail} the week Slate starts collecting in ${city}. Nothing else — no newsletters.`}
                action={
                  <Button variant="outline" onClick={() => { setState("Akwa Ibom"); setCity("Uyo"); }}>
                    Use an address in Uyo instead
                  </Button>
                }
              />
            ) : (
              <StateView
                state="service-unavailable"
                title={`Slate isn't in ${city} yet`}
                description={
                  cityInfo?.status === "Launching"
                    ? `We're launching in ${city} in ${new Date(cityInfo.launch).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}, with operators already being verified.`
                    : cityInfo
                      ? `${city} is planned for ${cityInfo.launch.replace(/(\d{4})-Q(\d)/, "Q$2 $1")}. Today Slate collects across Uyo only.`
                      : `Today Slate collects across Uyo only. Tell us you're waiting — demand decides where we go next.`
                }
                action={
                  <div className="flex w-full max-w-sm flex-col gap-2">
                    <Input aria-label="Email for launch updates" type="email" value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} />
                    <Button
                      block
                      loading={notify === "loading"}
                      leading={<Bell className="size-4" />}
                      onClick={async () => {
                        if (!isEmail(notifyEmail)) return toast.error("Enter a valid email", "We'll only use it to tell you when Slate arrives.");
                        setNotify("loading");
                        await new Promise((r) => setTimeout(r, 900));
                        setNotify("done");
                      }}
                    >
                      Notify me when Slate arrives
                    </Button>
                  </div>
                }
              />
            )}
          </div>
        ) : (
          <>
            <ServiceAreaMap
              className="aspect-[4/3] w-full"
              values={ON_TIME}
              legend="On-time"
              selected={zone}
              highlight={zone ? [zone] : undefined}
              onSelect={(id) => pickArea(ZONE_AREA[id]!)}
            />
            {zone ? (
              <div className="flex items-start gap-3">
                <MapPinned className="mt-0.5 size-5 shrink-0 text-ink-3" strokeWidth={1.75} />
                <p className="t-small text-ink-2">
                  <span className="font-semibold text-ink">{area}</span> is a Slate zone. Collection runs <span className="font-medium text-ink">{days}, 07:00–09:00</span>, {ON_TIME[zone]}% on time last month.
                </p>
              </div>
            ) : (
              <p className="t-small text-ink-3">Tap a zone on the map or choose your area to see collection days.</p>
            )}
          </>
        )}
      </div>
    </div>
  );

  const profile = (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <StepTitle title="Who's the customer?" description="Bills, receipts and pickup reminders go to this person." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="First name" autoComplete="given-name" value={first} error={errors.first} onChange={(e) => { setFirst(e.target.value); setErr("first"); }} />
        <Input label="Last name" autoComplete="family-name" value={last} error={errors.last} onChange={(e) => { setLast(e.target.value); setErr("last"); }} />
        <PhoneInput label="Mobile number" value={phone} error={errors.phone} onChange={(e) => { setPhone(e.target.value); setErr("phone"); }} />
        <Input label="Email" type="email" autoComplete="email" value={email} error={errors.email} onChange={(e) => { setEmail(e.target.value); setErr("email"); }} />
      </div>
      <AddressInput label="Service address" value={profileAddress} error={errors.profileAddress} hint={landmark ? `Landmark: ${landmark}` : undefined} onChange={(v) => { setProfileAddress(v); setErr("profileAddress"); }} />
      <Field label="You are the" error={errors.occupancy}>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {[
            ["Owner-occupier", "You own and live here."],
            ["Tenant", "You rent. Your landlord isn't billed."],
            ["Landlord or caretaker", "You manage it for someone else."],
          ].map(([t, d]) => (
            <ChoiceCard key={t} selected={occupancy === t} onSelect={() => { setOccupancy(t!); setErr("occupancy"); }} title={t} description={d} className="py-3.5" />
          ))}
        </div>
      </Field>
    </div>
  );

  const waste = (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <StepTitle title="What do you throw away?" description="This sets your bin size, collection days and the plan we recommend." />
      <Field label="Property type" error={errors.property}>
        <div className="grid grid-cols-2 gap-2.5">
          {PROPERTY.map((p) => (
            <ChoiceCard key={p.value} selected={property === p.value} onSelect={() => { setProperty(p.value); setErr("property"); }} title={<span className="t-small font-semibold sm:t-h3">{p.title}</span>} icon={p.icon} className="py-3.5" />
          ))}
        </div>
      </Field>
      <Field label="People living here" error={errors.household}>
        <Segmented
          value={household}
          onChange={(v) => { setHousehold(v); setErr("household"); }}
          className="w-full sm:w-auto"
          options={["1–2", "3–4", "5–6", "7+"].map((v) => ({ value: v, label: v }))}
        />
      </Field>
      <Field label="How much waste, roughly">
        <div className="flex flex-col gap-2.5">
          <Segmented<Volume> value={volume} onChange={setVolume} className="w-full sm:w-auto" options={(Object.keys(VOLUME) as Volume[]).map((v) => ({ value: v, label: v }))} />
          <div className="flex items-start gap-3 rounded-md bg-sunken px-4 py-3" aria-live="polite">
            <VolumeBins level={volume} />
            <p className="t-small text-ink-2"><span className="font-semibold text-ink">{volume}.</span> {VOLUME[volume]}</p>
          </div>
        </div>
      </Field>
      <Field label="What goes in your bin" hint={!errors.categories ? "Pick everything that applies. Recyclables can be collected separately." : undefined} error={errors.categories}>
        <ChipGroup options={CATEGORIES} value={categories} onChange={(v) => { setCategories(v); setErr("categories"); }} />
      </Field>
      <Field label="How often would you like collection?" error={errors.frequency}>
        <div className="flex flex-col gap-2.5">
          {FREQUENCIES.map((f) => (
            <ChoiceCard
              key={f.value}
              selected={frequency === f.value}
              onSelect={() => { setFrequency(f.value); setErr("frequency"); }}
              title={f.value}
              description={f.description}
              meta={<span className="tnum">{formatNaira(f.price)}<span className="font-normal text-ink-3">/mo</span></span>}
              className="py-3.5"
            />
          ))}
        </div>
      </Field>
      <Field label="Special requirements" optional>
        <div className="flex flex-col gap-3">
          {SPECIAL.map((s) => (
            <Checkbox key={s} checked={special.includes(s)} onChange={(on) => setSpecial((xs) => (on ? [...xs, s] : xs.filter((x) => x !== s)))} label={s} />
          ))}
          <Textarea rows={3} aria-label="Anything else the crew should know" placeholder="Anything else the crew should know — gate times, where the bin is kept" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </Field>
    </div>
  );

  const lite = serviceById("svc-home-lite")!;
  const home = serviceById("svc-home-weekly")!;
  const recyclingSvc = serviceById("svc-recycling")!;
  const planPrice = (id: string) => (id === "svc-home-weekly" && frequency === "Three times weekly" ? 9500 : serviceById(id)!.priceFrom);
  const total = (plan ? planPrice(plan) : 0) + (recycling ? recyclingSvc.priceFrom : 0);

  const service = (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-12">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Badge tone="success" dot className="w-fit">Available at your address</Badge>
          <h1 className="t-h1 text-ink">Slate serves {area || "your area"}</h1>
          <p className="t-body text-ink-2">Based on {household ? `${household} people` : "your home"}, {volume.toLowerCase()} volume and {frequency.toLowerCase() || "your preferred"} collection, here's what we recommend.</p>
        </div>
        <div role="radiogroup" aria-label="Plan" className="flex flex-col gap-2.5">
          {[home, lite].map((s) => (
            <ChoiceCard
              key={s.id}
              selected={plan === s.id}
              onSelect={() => setPlan(s.id)}
              title={
                <span className="flex flex-wrap items-center gap-2">
                  {s.name}
                  {s.id === recommended && <Badge tone="slate">Recommended</Badge>}
                </span>
              }
              description={s.id === "svc-home-weekly" && frequency === "Three times weekly" ? "Three collections a week, one 240-litre bin, 24-hour missed-pickup recovery." : s.short + " " + s.included.slice(1, 3).join(", ") + "."}
              meta={<span className="tnum">{formatNaira(planPrice(s.id))}<span className="font-normal text-ink-3">/mo</span></span>}
            />
          ))}
          <ChoiceCard
            type="checkbox"
            selected={recycling}
            onSelect={() => setRecycling((r) => !r)}
            title="Add recycling pickup"
            description="Sorted PET, cans and paper collected monthly and sent to a recovery partner."
            meta={<span className="tnum">+{formatNaira(recyclingSvc.priceFrom)}<span className="font-normal text-ink-3">/mo</span></span>}
          />
        </div>
        <p className="t-small text-ink-3">No setup fee. Change or cancel from Subscriptions any time.</p>
      </div>

      <aside className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
        <section className="relative isolate overflow-hidden rounded-xl bg-slate p-6 text-slate-ink chalk-grain">
          <Strata tone="on-slate" bands={3} seed={9} chalk={false} className="absolute inset-x-0 bottom-0 -z-10 h-16 w-full opacity-40" />
          <p className="t-micro text-slate-ink/65">First collection</p>
          <p className="mt-1 font-display text-[34px] font-bold leading-none tracking-[-0.02em]">{formatDay(firstPickup)}</p>
          <p className="mt-2 t-small text-slate-ink/80">07:00–09:00, then every {days}. Bin by the gate by 7:00.</p>
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-white/12 pb-10 pt-4">
            <div>
              <dt className="t-micro text-slate-ink/60">Address</dt>
              <dd className="t-small font-medium">{(profileAddress || address).replace(", Uyo", "")}</dd>
            </div>
            <div>
              <dt className="t-micro text-slate-ink/60">Monthly</dt>
              <dd className="t-small font-medium tnum">{total ? formatNaira(total) : "Choose a plan"}</dd>
            </div>
          </dl>
        </section>
        <div className="flex items-start gap-3 border-b border-line pb-5">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-ink-3" strokeWidth={1.75} />
          <div>
            <p className="t-body font-medium text-ink">Collected by a verified Slate operator</p>
            <p className="t-small text-ink-2">
              You pay Slate, not the operator. Slate contracts and checks the crew for {area || "your zone"}{operator ? ` (currently ${operator.short})` : ""}, tracks every pickup, and replaces them if service slips.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Truck className="mt-0.5 size-5 shrink-0 text-ink-3" strokeWidth={1.75} />
          <p className="t-small text-ink-2">Missed a pickup? Report it in the app and Slate sends a crew within 24 hours.</p>
        </div>
      </aside>
    </div>
  );

  const body = [welcome, location, profile, waste, service][step];

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-glass backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-14 w-full max-w-[1120px] items-center gap-4 px-5 md:h-16 md:px-8">
          <Logo to={null} />
          <span className="hidden t-small text-ink-3 sm:inline">Set up collection</span>
          <Link to="/app/dashboard" className="ml-auto t-small font-medium text-ink-2 hover:text-ink">
            Save and exit
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col gap-8 px-5 pb-12 pt-5 md:px-8 md:pt-8">
        <Stepper steps={STEPS} current={step} onStepClick={(i) => i < step && go(i)} />
        <div key={step} className="animate-fade-in">{body}</div>
      </main>

      <footer className="sticky bottom-0 z-30 border-t border-line bg-glass backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex w-full max-w-[1120px] items-center gap-2 px-5 py-3 safe-bottom md:px-8">
          {step > 0 && (
            <Button variant="ghost" leading={<ArrowLeft className="size-4" />} onClick={() => go(step - 1)}>
              Back
            </Button>
          )}
          <span className="hidden t-small text-ink-3 md:inline">{step > 0 ? `Step ${step + 1} of ${STEPS.length} · saved as you go` : "About 3 minutes"}</span>
          <div className="ml-auto flex gap-2">
            {step === 0 && (
              <Button size="lg" className="max-sm:flex-1" trailing={<ArrowRight className="size-4" />} onClick={() => go(1)}>
                Get started
              </Button>
            )}
            {step > 0 && step < 4 && (
              <Button trailing={<ArrowRight className="size-4" />} disabled={step === 1 && unavailable} onClick={next}>
                Continue
              </Button>
            )}
            {step === 4 && (
              <>
                <Button variant="outline" className="max-sm:hidden" onClick={() => finish("/app/dashboard")}>Go to dashboard</Button>
                <Button disabled={!plan} trailing={<ArrowRight className="size-4" />} onClick={() => finish(`/app/book?service=${plan}`)}>
                  Continue to booking
                </Button>
              </>
            )}
          </div>
        </div>
        {step === 4 && (
          <div className="flex justify-center pb-3 safe-bottom sm:hidden">
            <button type="button" onClick={() => finish("/app/dashboard")} className="t-small font-medium text-ink-2 underline decoration-line-strong underline-offset-4">
              Go to dashboard
            </button>
          </div>
        )}
        {step === 1 && unavailable && <p className="px-5 pb-3 text-center t-small text-ink-3 md:hidden">Choose an address in Uyo to continue.</p>}
      </footer>

      {/* Geolocation permission */}
      <Modal
        open={geoOpen}
        onClose={() => setGeoOpen(false)}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setGeoOpen(false); setGeoDenied(true); }}>Not now</Button>
            <Button leading={<LocateFixed className="size-4" />} onClick={locate}>Allow once</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3 pb-2 pt-1">
          <span className="flex size-11 items-center justify-center rounded-md bg-sunken text-ink-2"><MapPin className="size-5" /></span>
          <h2 className="t-h2 text-ink">Use your current location?</h2>
          <p className="t-body text-ink-2">Slate uses it once to fill in your address and find your zone. We don't track your phone, and your browser will ask too.</p>
        </div>
      </Modal>

      {/* Confirm location */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Is this the right place?"
        description="Your crew will come here on collection days."
        footer={
          <>
            <Button variant="ghost" leading={<Pencil className="size-4" />} onClick={() => setConfirmOpen(false)}>Edit</Button>
            <Button
              leading={<Check className="size-4" />}
              onClick={() => {
                setConfirmOpen(false);
                if (!profileAddress) setProfileAddress(address);
                go(2);
              }}
            >
              Confirm location
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 pb-2">
          {zone && <ServiceAreaMap className="aspect-[2/1] w-full" selected={zone} highlight={[zone]} legend="Your zone" />}
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ["Address", address],
              ["Landmark", landmark],
              ["Area", `${area}, ${city}`],
              ["Estate", estate || "Not in an estate"],
              ["Collection", `${days}, 07:00–09:00`],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5">
                <dt className="t-micro text-ink-3">{k}</dt>
                <dd className="t-small text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Modal>

      <CantFindModal open={cantFindOpen} onClose={() => setCantFindOpen(false)} phone={phone} />
    </div>
  );
}

function StepTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="t-h1 text-ink">{title}</h1>
      <p className="t-body text-ink-2">{description}</p>
    </div>
  );
}

/** Three small bins, filled to show the chosen volume. */
function VolumeBins({ level }: { level: Volume }) {
  const n = level === "Light" ? 1 : level === "Typical" ? 2 : 3;
  return (
    <span className="mt-0.5 flex shrink-0 items-end gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className={cn("w-2.5 rounded-[2px] transition-all duration-300", i < n ? "bg-ink" : "bg-line-strong")} style={{ height: 10 + i * 4 }} />
      ))}
    </span>
  );
}

function CantFindModal({ open, onClose, phone }: { open: boolean; onClose: () => void; phone: string }) {
  const toast = useToast();
  const [desc, setDesc] = useState("");
  const [callback, setCallback] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Can't find your address?"
      description="New estates and unnamed streets often aren't on maps yet. Describe it and Slate will pin it for you."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            loading={busy}
            onClick={async () => {
              if (desc.trim().length < 12) return setErr("Describe the street, nearest junction or a well-known building.");
              setBusy(true);
              await new Promise((r) => setTimeout(r, 900));
              setBusy(false);
              onClose();
              setDesc("");
              toast.success("Sent to Slate's Uyo team", callback ? `We'll call +234 ${phone} within one working day to pin it.` : "We'll email you once it's pinned, within one working day.");
            }}
          >
            Send to Slate
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Textarea
          label="Describe your location"
          rows={4}
          placeholder="e.g. New layout behind Ibom Plaza, second left after the Total filling station on Udo Udoma Avenue, cream gate"
          value={desc}
          error={err}
          onChange={(e) => {
            setDesc(e.target.value);
            setErr("");
          }}
        />
        <Checkbox checked={callback} onChange={setCallback} label="Call me to confirm the location" description={`On +234 ${phone}, Mon–Sat 8:00–18:00.`} />
        <p className="flex items-start gap-2 t-small text-ink-3">
          <Building2 className="mt-0.5 size-4 shrink-0" /> If you're in a gated estate, add the estate name — we may already serve it.
        </p>
      </div>
    </Modal>
  );
}

// Keep icon imports referenced for tree-shaking clarity
export const _icons: ReactNode[] = [<CalendarDays key="c" />, <Loader2 key="l" />];
