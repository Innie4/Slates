import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Laptop, LogOut, Monitor, Moon, Smartphone, Sun } from "lucide-react";
import { Badge, Button, ChoiceCard, ConfirmDialog, Page, PageHeader, Select, Switch, Tooltip, useToast } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useSession } from "@/lib/session";
import { me } from "@/data";
import { formatNaira } from "@/lib/format";
import { SectionIndex, SettingsBlock, useActiveSection } from "./_care";

const SECTIONS = [
  { id: "appearance", label: "Appearance" },
  { id: "notifications", label: "Notifications" },
  { id: "payment-timing", label: "Payment timing" },
  { id: "language", label: "Language" },
  { id: "sessions", label: "Devices" },
  { id: "sign-out", label: "Sign out" },
];

type Pref = "light" | "dark" | "system";
const CHANNELS = ["Push", "SMS", "Email", "WhatsApp"] as const;
type Channel = (typeof CHANNELS)[number];
const CATEGORIES: Array<{ name: string; detail: string; on: Channel[]; locked?: Channel }> = [
  { name: "Pickups", detail: "Truck on the way, collected, missed", on: ["Push", "SMS", "WhatsApp"] },
  { name: "Payments", detail: "Charges, receipts, failed cards", on: ["Push", "Email"], locked: "Email" },
  { name: "Service", detail: "Complaints, route and plan changes", on: ["Push", "SMS", "Email"] },
  { name: "Community", detail: "Projects in your estate", on: ["Push"] },
  { name: "Promotions", detail: "Offers and new services", on: ["Email"] },
  { name: "Support", detail: "Replies to your tickets", on: ["Push", "Email", "WhatsApp"] },
];

const readPref = (): Pref | null => {
  try {
    return localStorage.getItem("slate-theme-pref") as Pref | null;
  } catch {
    return null;
  }
};

export default function Settings() {
  const toast = useToast();
  const navigate = useNavigate();
  const { theme, setTheme, signOut } = useSession();
  const active = useActiveSection(SECTIONS.map((s) => s.id));
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" }), 60);
    return () => clearTimeout(t);
  }, [hash]);

  /* appearance */
  const [pref, setPref] = useState<Pref>(() => readPref() ?? theme);
  useEffect(() => {
    try {
      localStorage.setItem("slate-theme-pref", pref);
    } catch {
      /* storage unavailable */
    }
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setTheme(mq.matches ? "dark" : "light");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [pref, setTheme]);
  // Keep the choice in step if the sidebar toggle changes the theme.
  useEffect(() => {
    if (pref !== "system" && pref !== theme) setPref(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);
  const choose = (p: Pref) => {
    setPref(p);
    if (p !== "system") setTheme(p);
  };

  /* notifications */
  const [matrix, setMatrix] = useState<Record<string, Channel[]>>(() => Object.fromEntries(CATEGORIES.map((c) => [c.name, c.on])));
  const [quiet, setQuiet] = useState(true);
  const toggle = (cat: string, ch: Channel, v: boolean) => {
    setMatrix((m) => ({ ...m, [cat]: v ? [...m[cat]!, ch] : m[cat]!.filter((x) => x !== ch) }));
    toast.success(`${cat} by ${ch} ${v ? "on" : "off"}`);
  };

  /* payment timing */
  const [payday, setPayday] = useState("last");
  const [auto, setAuto] = useState(true);
  const nextCharge = (() => {
    if (payday === "last") return "Fri 30 Oct, your last working day";
    const d = Number(payday);
    const date = new Date(2026, d >= 20 ? 9 : 10, d);
    return `${date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}`;
  })();

  /* language */
  const [lang, setLang] = useState("en");

  /* sessions */
  const [sessions, setSessions] = useState([
    { id: "s1", icon: Smartphone, device: "Chrome on Android", model: "Tecno Camon 20", place: "Uyo", when: "Active now", current: true },
    { id: "s2", icon: Laptop, device: "Safari on MacBook", model: "macOS 15", place: "Uyo", when: "2 days ago", current: false },
    { id: "s3", icon: Monitor, device: "Chrome on Windows", model: "Windows 11", place: "Lagos", when: "12 Sep", current: false, unusual: true },
  ]);
  const [outOthers, setOutOthers] = useState(false);
  const [outOne, setOutOne] = useState<string | null>(null);
  const [logout, setLogout] = useState(false);

  return (
    <Page>
      <PageHeader title="Settings" description="How Slate looks, how it reaches you, and when it charges you." />

      <div className="grid gap-10 lg:grid-cols-[200px_minmax(0,1fr)] xl:gap-14">
        <SectionIndex items={SECTIONS} active={active} />

        <div className="flex min-w-0 max-w-3xl flex-col gap-10">
          <SettingsBlock id="appearance" title="Appearance" description="System follows your phone or computer, including its night schedule.">
            <div className="grid grid-cols-3 gap-2 sm:gap-3" role="radiogroup" aria-label="Appearance">
              {(
                [
                  ["light", "Light", Sun],
                  ["dark", "Dark", Moon],
                  ["system", "System", Monitor],
                ] as const
              ).map(([v, label, Icon]) => {
                const on = pref === v;
                return (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => choose(v)}
                    className={cn(
                      "flex flex-col overflow-hidden rounded-md border text-left transition",
                      on ? "border-ink ring-1 ring-ink" : "border-line-strong hover:border-ink-3",
                    )}
                  >
                    <ThemePreview kind={v} />
                    <span className="flex items-center gap-2 border-t border-line bg-surface px-3 py-2.5 t-small font-medium text-ink">
                      <Icon className="size-4 text-ink-3" />
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </SettingsBlock>

          <SettingsBlock id="notifications" title="Notifications" description="Choose how each kind of message reaches you. Live pickup alerts always use push when the app is open.">
            {/* Desktop: matrix */}
            <div className="hidden overflow-hidden rounded-lg border border-line md:block">
              <table className="w-full">
                <thead className="bg-sunken">
                  <tr>
                    <th className="px-4 py-3 text-left t-micro font-medium text-ink-3">Category</th>
                    {CHANNELS.map((ch) => (
                      <th key={ch} className="w-24 px-2 py-3 text-center t-micro font-medium text-ink-3">
                        {ch}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-surface">
                  {CATEGORIES.map((c) => (
                    <tr key={c.name}>
                      <td className="px-4 py-3.5">
                        <p className="t-body font-medium text-ink">{c.name}</p>
                        <p className="t-small text-ink-3">{c.detail}</p>
                      </td>
                      {CHANNELS.map((ch) => (
                        <td key={ch} className="px-2 py-3.5">
                          <div className="flex justify-center">
                            <ChannelSwitch cat={c} ch={ch} on={matrix[c.name]!.includes(ch)} onChange={(v) => toggle(c.name, ch, v)} />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Phone: one block per category */}
            <div className="flex flex-col divide-y divide-line border-y border-line md:hidden">
              {CATEGORIES.map((c) => (
                <div key={c.name} className="flex flex-col gap-3 py-4">
                  <div>
                    <p className="t-body font-medium text-ink">{c.name}</p>
                    <p className="t-small text-ink-3">{c.detail}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                    {CHANNELS.map((ch) => (
                      <div key={ch} className="flex items-center justify-between gap-2 rounded-md bg-sunken py-1.5 pl-3 pr-1.5">
                        <span className="t-small text-ink-2">{ch}</span>
                        <ChannelSwitch cat={c} ch={ch} on={matrix[c.name]!.includes(ch)} onChange={(v) => toggle(c.name, ch, v)} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5">
              <Switch
                checked={quiet}
                onChange={(v) => {
                  setQuiet(v);
                  toast.success(v ? "Quiet hours on" : "Quiet hours off");
                }}
                label="Quiet hours, 21:00–06:00"
                description="Hold push and WhatsApp overnight. Urgent service alerts still come through."
              />
            </div>
          </SettingsBlock>

          <SettingsBlock
            id="payment-timing"
            title="Payment timing"
            description={`Slate charges your ${formatNaira(me.household.monthly)} plan around your payday instead of the 1st. You're never charged twice in a month.`}
          >
            <div className="flex flex-col gap-5">
              <Select
                label="When are you usually paid?"
                value={payday}
                onChange={(e) => {
                  setPayday(e.target.value);
                  toast.success("Payday saved");
                }}
                options={[{ value: "last", label: "Last working day of the month" }, ...Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: `On the ${ordinal(i + 1)}` }))]}
                fieldClassName="sm:max-w-sm"
              />
              <div className="border-y border-line py-4">
                <Switch
                  checked={auto}
                  onChange={(v) => {
                    setAuto(v);
                    toast.success(v ? "Automatic timing on" : "Automatic timing off");
                  }}
                  label="Automatic timing"
                  description="If a charge fails, retry on the days your past charges succeeded — up to 3 days later, never earlier."
                />
              </div>
              <div className="flex flex-col gap-1 rounded-md bg-sunken px-4 py-3.5">
                <p className="t-micro text-ink-3">Next charge</p>
                <p className="t-body font-medium text-ink tnum">
                  {formatNaira(me.household.monthly)} on {nextCharge}
                </p>
                <p className="t-small text-ink-2">
                  To {me.household.card.brand} •• {me.household.card.last4}, at 06:00. {auto ? "Retries follow your past successful days." : "If it fails, we retry the next morning, twice."}
                </p>
              </div>
            </div>
          </SettingsBlock>

          <SettingsBlock id="language" title="Language">
            <div className="grid gap-2 sm:grid-cols-2">
              <ChoiceCard selected={lang === "en"} onSelect={() => setLang("en")} title="English" description="Nigerian English" />
              <ChoiceCard selected={false} onSelect={() => undefined} disabled title="Ibibio" description="Ikɔ Ibibio" meta={<Badge tone="outline">Coming soon</Badge>} />
            </div>
          </SettingsBlock>

          <SettingsBlock
            id="sessions"
            title="Devices"
            description="Where you're signed in to Slate."
            actions={
              sessions.length > 1 && (
                <Button variant="secondary" size="sm" onClick={() => setOutOthers(true)}>
                  Sign out others
                </Button>
              )
            }
          >
            <ul className="flex flex-col divide-y divide-line border-y border-line">
              {sessions.map((s) => (
                <li key={s.id} className="flex items-center gap-3.5 py-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-sunken text-ink-2">
                    <s.icon className="size-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="t-body font-medium text-ink">{s.device}</p>
                      {s.current && <Badge tone="slate">This device</Badge>}
                      {s.unusual && <Badge tone="warning">New location</Badge>}
                    </div>
                    <p className="t-small text-ink-2">
                      {s.model} · {s.place} · {s.when}
                    </p>
                  </div>
                  {!s.current && (
                    <Button variant="ghost" size="sm" onClick={() => setOutOne(s.id)}>
                      Sign out
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </SettingsBlock>

          <SettingsBlock id="sign-out" title="Sign out">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="t-small text-ink-2">Signed in as {me.household.email}. Your collections continue when you're signed out.</p>
              <Button variant="outline" leading={<LogOut className="size-4" />} onClick={() => setLogout(true)}>
                Sign out
              </Button>
            </div>
          </SettingsBlock>
        </div>
      </div>

      <ConfirmDialog
        open={outOthers}
        onClose={() => setOutOthers(false)}
        title="Sign out of other devices?"
        description={`${sessions.length - 1} other ${sessions.length - 1 === 1 ? "device" : "devices"} will need your password to sign back in.`}
        confirmLabel="Sign out others"
        onConfirm={() => {
          setSessions((xs) => xs.filter((x) => x.current));
          toast.success("Other devices signed out");
        }}
      />
      <ConfirmDialog
        open={!!outOne}
        onClose={() => setOutOne(null)}
        title={`Sign out ${sessions.find((s) => s.id === outOne)?.device ?? "this device"}?`}
        description="If you don't recognise it, change your password too."
        confirmLabel="Sign out"
        onConfirm={() => {
          const s = sessions.find((x) => x.id === outOne);
          setSessions((xs) => xs.filter((x) => x.id !== outOne));
          toast.success("Device signed out", s ? `${s.device}, ${s.place}` : undefined);
        }}
      />
      <ConfirmDialog
        open={logout}
        onClose={() => setLogout(false)}
        variant="destructive"
        title="Sign out of Slate?"
        description="You'll need your email or phone number and password to sign back in."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        onConfirm={() => {
          signOut();
          navigate("/login");
        }}
      />
    </Page>
  );
}

function ordinal(n: number) {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `${n}${s}`;
}

function ChannelSwitch({ cat, ch, on, onChange }: { cat: (typeof CATEGORIES)[number]; ch: Channel; on: boolean; onChange: (v: boolean) => void }) {
  if (cat.locked === ch)
    return (
      <Tooltip content="Receipts are always emailed">
        <span className="inline-flex" aria-label={`${cat.name} by ${ch}: always on`}>
          <Switch checked onChange={() => undefined} disabled />
        </span>
      </Tooltip>
    );
  return (
    <span aria-label={`${cat.name} by ${ch}`} className="inline-flex">
      <Switch checked={on} onChange={onChange} />
    </span>
  );
}

/** Tiny SVG mock of the app in each appearance. */
function ThemePreview({ kind }: { kind: Pref }) {
  const light = { bg: "#F2F4F6", panel: "#FFFFFF", line: "#DAE0E6", ink: "#2B3643", soft: "#C0CAD4" };
  const dark = { bg: "#0E1318", panel: "#161D25", line: "#25303B", ink: "#EDF1F4", soft: "#34414E" };
  const pane = (c: typeof light, x: number, w: number) => (
    <g>
      <rect x={x} y="0" width={w} height="72" fill={c.bg} />
      <rect x={x + 10} y="12" width={w - 20} height="48" rx="5" fill={c.panel} stroke={c.line} />
      <rect x={x + 18} y="20" width={Math.min(36, w - 36)} height="5" rx="2.5" fill={c.ink} />
      <rect x={x + 18} y="31" width={w - 36} height="4" rx="2" fill={c.soft} />
      <rect x={x + 18} y="40" width={(w - 36) * 0.7} height="4" rx="2" fill={c.soft} />
      <rect x={x + 18} y="49" width="14" height="4" rx="2" fill="#FF5B1F" />
    </g>
  );
  return (
    <svg viewBox="0 0 120 72" className="block aspect-[5/3] w-full" aria-hidden preserveAspectRatio="xMidYMid slice">
      {kind === "light" && pane(light, 0, 120)}
      {kind === "dark" && pane(dark, 0, 120)}
      {kind === "system" && (
        <>
          <defs>
            <clipPath id="sys-left">
              <rect x="0" y="0" width="60" height="72" />
            </clipPath>
            <clipPath id="sys-right">
              <rect x="60" y="0" width="60" height="72" />
            </clipPath>
          </defs>
          <g clipPath="url(#sys-left)">{pane(light, 0, 120)}</g>
          <g clipPath="url(#sys-right)">{pane(dark, 0, 120)}</g>
        </>
      )}
    </svg>
  );
}
