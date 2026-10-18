import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Bell, Building2, Camera, Check, CreditCard, Download, FileArchive, Home, Inbox, KeyRound, Mail, MapPin, MoreHorizontal, Phone, Plus,
  ShieldCheck, Smartphone, Store, Landmark,
} from "lucide-react";
import {
  AddressInput, Alert, Avatar, Badge, Button, ButtonLink, ChoiceCard, ConfirmDialog, Input, Menu, Modal, OTPInput, Page, PageHeader, PasswordInput,
  PhoneInput, Segmented, Spinner, Switch, Textarea, useToast,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { me } from "@/data";
import { DEMO_NOW, formatDate, formatNaira } from "@/lib/format";
import { SectionIndex, SettingRow, SettingsBlock, useActiveSection } from "./_care";

const SECTIONS = [
  { id: "personal", label: "Personal details" },
  { id: "addresses", label: "Addresses" },
  { id: "account", label: "Account type" },
  { id: "payment", label: "Payment methods" },
  { id: "security", label: "Security" },
  { id: "notifications", label: "Notifications" },
  { id: "privacy", label: "Privacy" },
  { id: "delete", label: "Delete account" },
];

interface Address {
  id: string;
  label: string;
  address: string;
  landmark: string;
  gate?: string;
  use: string;
  primary: boolean;
}

/** C29, the customer's profile and account. */
export default function Profile() {
  const toast = useToast();
  const active = useActiveSection(SECTIONS.map((s) => s.id));

  /* personal */
  const [person, setPerson] = useState({ name: me.household.name, preferred: me.household.firstName, alt: "" });
  const [draft, setDraft] = useState(person);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState(me.household.email);
  const [phone, setPhone] = useState(me.household.phone);

  /* addresses */
  const [addresses, setAddresses] = useState<Address[]>([
    { id: "a1", label: "Home", address: me.household.address, landmark: me.household.landmark, gate: "Gateman Okon opens from 6:00", use: "Slate Home, Recycling Pickup", primary: true },
    { id: "a2", label: "Mum's house", address: "33 Ikot Ekpene Road, Uyo", landmark: "Yellow two-storey, behind Mobil filling station", use: "Bulk and extra pickups only", primary: false },
  ]);
  const [addrModal, setAddrModal] = useState<Address | "new" | null>(null);
  const [primaryAsk, setPrimaryAsk] = useState<Address | null>(null);
  const [removeAsk, setRemoveAsk] = useState<Address | null>(null);

  /* other modals */
  const [typeOpen, setTypeOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [contact, setContact] = useState<null | "email" | "phone">(null);
  const [dataOpen, setDataOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletion, setDeletion] = useState<string | null>(null);
  const [sharing, setSharing] = useState({ ratings: true, recycling: true, partners: false, research: true });

  const nameError = draft.name.trim().split(/\s+/).length < 2 ? "Enter your first and last name." : undefined;
  const preferredError = !draft.preferred.trim() ? "Tell us what to call you." : undefined;

  return (
    <Page>
      <PageHeader title="Profile" description="Your details, addresses and how Slate keeps your account safe." />

      <div className="grid gap-10 lg:grid-cols-[200px_minmax(0,1fr)] xl:gap-14">
        <SectionIndex items={SECTIONS} active={active} />

        <div className="flex min-w-0 max-w-3xl flex-col gap-10">
          {/* Identity */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative">
              <Avatar name={person.name} size="xl" />
              <button
                type="button"
                aria-label="Change photo"
                onClick={() => toast.info("Photo upload", "Choose a square photo, at least 400 × 400 px.")}
                className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border border-line bg-surface text-ink-2 shadow-float hover:text-ink"
              >
                <Camera className="size-4" />
              </button>
            </div>
            <div className="min-w-0">
              <p className="t-h2 truncate text-ink">{person.name}</p>
              <p className="t-small text-ink-2">Household · customer since {formatDate(me.household.joined).replace(/^\d+ /, "")}</p>
              <p className="t-mono mt-0.5 text-[12.5px] text-ink-3">{me.household.id.toUpperCase()}</p>
            </div>
          </div>

          <SettingsBlock
            id="personal"
            title="Personal details"
            description="Used on receipts and by Slate Care when we call you."
            actions={
              !editing && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setDraft(person);
                    setEditing(true);
                  }}
                >
                  Edit
                </Button>
              )
            }
          >
            {editing ? (
              <form
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (nameError || preferredError) return;
                  setSaving(true);
                  setTimeout(() => {
                    setPerson(draft);
                    setSaving(false);
                    setEditing(false);
                    toast.success("Details saved");
                  }, 600);
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Full name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} error={nameError} autoComplete="name" />
                  <Input label="What should we call you?" value={draft.preferred} onChange={(e) => setDraft({ ...draft, preferred: e.target.value })} error={preferredError} />
                </div>
                <PhoneInput
                  label="Second contact number"
                  optional
                  hint="Someone at home we can call if we can't reach you, a spouse, a gateman."
                  value={draft.alt}
                  onChange={(e) => setDraft({ ...draft, alt: e.target.value.replace(/[^\d ]/g, "") })}
                />
                <p className="t-small text-ink-3">Email and phone are changed under Security, because they need a code.</p>
                <div className="flex gap-2">
                  <Button type="submit" loading={saving}>
                    Save changes
                  </Button>
                  <Button variant="ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                {[
                  ["Full name", person.name],
                  ["Preferred name", person.preferred],
                  [
                    "Email",
                    <span className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="truncate">{email}</span>
                      <Badge tone="success" icon={<Check strokeWidth={3} />}>Verified</Badge>
                    </span>,
                  ],
                  [
                    "Phone",
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="tnum">{phone}</span>
                      <Badge tone="success" icon={<Check strokeWidth={3} />}>Verified</Badge>
                    </span>,
                  ],
                  ["Second contact", person.alt ? `+234 ${person.alt}` : <span className="text-ink-3">Not added</span>],
                ].map(([k, v], i) => (
                  <div key={i} className="flex min-w-0 flex-col gap-0.5">
                    <dt className="t-micro text-ink-3">{k}</dt>
                    <dd className="t-body min-w-0 text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </SettingsBlock>

          <SettingsBlock
            id="addresses"
            title="Addresses"
            description="Your primary address decides your operator, collection days and price."
            actions={
              <Button variant="secondary" size="sm" leading={<Plus className="size-4" />} onClick={() => setAddrModal("new")}>
                Add address
              </Button>
            }
          >
            <ul className="flex flex-col divide-y divide-line border-y border-line">
              {addresses.map((a) => (
                <li key={a.id} className="flex items-start gap-3.5 py-4">
                  <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-md", a.primary ? "bg-slate text-slate-ink dark:bg-stone dark:text-ink" : "bg-sunken text-ink-2")}>
                    <MapPin className="size-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="t-body font-medium text-ink">{a.label}</p>
                      {a.primary && <Badge tone="slate">Primary</Badge>}
                    </div>
                    <p className="t-small text-ink">{a.address}</p>
                    <p className="t-small text-ink-2">{a.landmark}</p>
                    <p className="t-small mt-1 text-ink-3">{a.use}</p>
                  </div>
                  <Menu
                    trigger={(p) => (
                      <button {...p} type="button" aria-label={`Options for ${a.label}`} className="flex size-9 shrink-0 items-center justify-center rounded-md text-ink-2 hover:bg-sunken hover:text-ink">
                        <MoreHorizontal className="size-5" />
                      </button>
                    )}
                    items={[
                      { label: "Edit", onSelect: () => setAddrModal(a) },
                      { label: "Set as primary", disabled: a.primary, onSelect: () => setPrimaryAsk(a) },
                      { divider: true, label: "" },
                      { label: a.primary ? "Primary can't be removed" : "Remove", danger: !a.primary, disabled: a.primary, onSelect: () => setRemoveAsk(a) },
                    ]}
                  />
                </li>
              ))}
            </ul>
          </SettingsBlock>

          <SettingsBlock id="account" title="Account type">
            <div className="border-y border-line">
              <SettingRow
                icon={<Home />}
                title="Household"
                detail={`One home, billed to you. ${me.household.plan} · ${formatNaira(me.household.monthly)}/month.`}
                control={
                  <Button variant="secondary" size="sm" onClick={() => setTypeOpen(true)}>
                    Change
                  </Button>
                }
              />
            </div>
          </SettingsBlock>

          <SettingsBlock
            id="payment"
            title="Payment methods"
            actions={
              <ButtonLink to="/app/payment-methods" variant="secondary" size="sm">
                Manage
              </ButtonLink>
            }
          >
            <div className="divide-y divide-line border-y border-line">
              <SettingRow icon={<CreditCard />} title={`${me.household.card.brand} •• ${me.household.card.last4}`} detail={`Expires ${me.household.card.exp} · used for Slate Home`} control={<Badge tone="slate">Default</Badge>} />
              <SettingRow icon={<CreditCard />} title="Verve •• 7735" detail="Expires 02/27 · declined 3 times in September" control={<Badge tone="warning" dot>Check card</Badge>} />
            </div>
          </SettingsBlock>

          <SettingsBlock id="security" title="Security" description="Changing your email or phone needs a 6-digit code sent to the new one.">
            <div className="divide-y divide-line border-y border-line">
              <SettingRow icon={<KeyRound />} title="Password" detail="Last changed 14 Jul 2026" control={<Button variant="secondary" size="sm" onClick={() => setPwOpen(true)}>Change</Button>} />
              <SettingRow icon={<Mail />} title="Email" detail={email} control={<Button variant="secondary" size="sm" onClick={() => setContact("email")}>Change</Button>} />
              <SettingRow icon={<Phone />} title="Phone" detail={phone} control={<Button variant="secondary" size="sm" onClick={() => setContact("phone")}>Change</Button>} />
              <SettingRow
                icon={<ShieldCheck />}
                title={
                  <span className="flex items-center gap-2">
                    Two-step sign-in <Badge tone="warning">Off</Badge>
                  </span>
                }
                detail="Ask for a code from your phone when you sign in on a new device."
                control={
                  <ButtonLink to="/two-factor" variant="secondary" size="sm">
                    Set up
                  </ButtonLink>
                }
              />
            </div>
          </SettingsBlock>

          <SettingsBlock id="notifications" title="Notifications">
            <div className="divide-y divide-line border-y border-line">
              <Link to="/app/settings#notifications" className="block hover:bg-sunken/60 -mx-2 rounded-md px-2">
                <SettingRow icon={<Bell />} title="Channels and categories" detail="Push, SMS, email and WhatsApp for each kind of message." control={<span className="t-small font-medium text-ink-2">Settings</span>} />
              </Link>
              <Link to="/app/notifications" className="block hover:bg-sunken/60 -mx-2 rounded-md px-2">
                <SettingRow icon={<Inbox />} title="Notification inbox" detail="Everything Slate has sent you, grouped by day." control={<span className="t-small font-medium text-ink-2">Open</span>} />
              </Link>
            </div>
          </SettingsBlock>

          <SettingsBlock id="privacy" title="Privacy" description="What Slate does with your data, and what you can switch off.">
            <div className="flex flex-col gap-5">
              <p className="t-small rounded-md bg-sunken px-4 py-3.5 text-ink-2">
                Slate processes your data under the Nigeria Data Protection Regulation (NDPR) and the Nigeria Data Protection Act 2023. You can see,
                download or correct it at any time. Your address and phone are shared with your assigned operator only for collections.
              </p>
              <div className="divide-y divide-line border-y border-line">
                <SettingRow
                  icon={<FileArchive />}
                  title="Download my data"
                  detail="Profile, pickups, payments, complaints and messages."
                  control={<Button variant="secondary" size="sm" onClick={() => setDataOpen(true)}>Request</Button>}
                />
              </div>
              <div className="flex flex-col divide-y divide-line">
                {(
                  [
                    ["ratings", "Share my ratings with the operator", "They see scores and comments, never your name or address."],
                    ["recycling", "Share recycling weights with recovery partners", "Anonymised, by estate. Helps them price per kilo."],
                    ["research", "Use my pickup history to improve routes", "Times and outcomes, never payments."],
                    ["partners", "Offers from Slate's partners", "Occasional offers from banks and insurers we work with."],
                  ] as const
                ).map(([k, t, d]) => (
                  <div key={k} className="py-4">
                    <Switch
                      checked={sharing[k]}
                      onChange={(v) => {
                        setSharing((s) => ({ ...s, [k]: v }));
                        toast.success(v ? "Turned on" : "Turned off", t);
                      }}
                      label={t}
                      description={d}
                    />
                  </div>
                ))}
              </div>
            </div>
          </SettingsBlock>

          <SettingsBlock id="delete" title="Delete account">
            <div className="flex flex-col gap-4 rounded-lg border border-danger/40 p-5 sm:p-6">
              {deletion ? (
                <Alert
                  tone="danger"
                  title={`Your account will be deleted on ${deletion}`}
                  action={
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDeletion(null);
                        toast.success("Deletion cancelled", "Your account and plan stay as they are.");
                      }}
                    >
                      Cancel deletion
                    </Button>
                  }
                >
                  Collections continue until then. Sign in any time before that date to cancel.
                </Alert>
              ) : (
                <>
                  <p className="t-body text-ink">Deleting your account cancels Slate Home and removes your profile, addresses and saved cards.</p>
                  <ul className="flex flex-col gap-1.5 t-small text-ink-2">
                    <li>· You have 14 days to change your mind.</li>
                    <li>· You owe nothing. Your October payment covers collections to 31 Oct.</li>
                    <li>· Receipts are kept for 6 years, as tax law requires.</li>
                  </ul>
                  <div>
                    <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                      Delete account
                    </Button>
                  </div>
                </>
              )}
            </div>
          </SettingsBlock>
        </div>
      </div>

      {/* Modals */}
      <AddressModal
        value={addrModal}
        onClose={() => setAddrModal(null)}
        onSave={(a) => {
          setAddresses((xs) => (xs.some((x) => x.id === a.id) ? xs.map((x) => (x.id === a.id ? a : x)) : [...xs, a]));
          setAddrModal(null);
          toast.success(addrModal === "new" ? "Address added" : "Address updated", a.address);
        }}
      />
      <ConfirmDialog
        open={!!primaryAsk}
        onClose={() => setPrimaryAsk(null)}
        title={`Make ${primaryAsk?.label ?? ""} your primary address?`}
        description="Slate Home moves there from your next collection. Your operator, collection days and price may change, we'll confirm by SMS before anything is charged."
        confirmLabel="Make primary"
        onConfirm={() => {
          setAddresses((xs) => xs.map((x) => ({ ...x, primary: x.id === primaryAsk!.id, use: x.id === primaryAsk!.id ? "Slate Home, Recycling Pickup" : "Bulk and extra pickups only" })));
          toast.success("Primary address changed", "We'll text you the new collection days within a working day.");
        }}
      />
      <ConfirmDialog
        open={!!removeAsk}
        onClose={() => setRemoveAsk(null)}
        variant="destructive"
        title={`Remove ${removeAsk?.label ?? "this address"}?`}
        description={removeAsk?.address}
        confirmLabel="Remove"
        onConfirm={() => {
          setAddresses((xs) => xs.filter((x) => x.id !== removeAsk!.id));
          toast.success("Address removed");
        }}
      />
      <AccountTypeModal open={typeOpen} onClose={() => setTypeOpen(false)} />
      <PasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
      <ContactModal
        kind={contact}
        onClose={() => setContact(null)}
        onChanged={(kind, v) => {
          if (kind === "email") setEmail(v);
          else setPhone(v);
        }}
      />
      <DataModal open={dataOpen} onClose={() => setDataOpen(false)} email={email} />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        variant="destructive"
        title="Delete your Slate account?"
        description="Slate Home is cancelled and your profile is removed after 14 days. Collections continue until then."
        confirmLabel="Delete account"
        requireText="DELETE"
        onConfirm={() => {
          const d = new Date(DEMO_NOW.getTime() + 14 * 86_400_000);
          setDeletion(d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }));
          toast.toast({ tone: "warning", title: "Account scheduled for deletion", description: "You have 14 days to cancel." });
        }}
      />
    </Page>
  );
}

/* ------------------------------------------------------------------ */

function AddressModal({ value, onClose, onSave }: { value: Address | "new" | null; onClose: () => void; onSave: (a: Address) => void }) {
  const [form, setForm] = useState({ label: "", address: "", landmark: "", gate: "" });
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (value && value !== "new") setForm({ label: value.label, address: value.address, landmark: value.landmark, gate: value.gate ?? "" });
    else setForm({ label: "", address: "", landmark: "", gate: "" });
    setTried(false);
  }, [value]);
  const errors = {
    label: !form.label.trim() ? "Give it a name, like Home or Office." : undefined,
    address: form.address.trim().length < 8 ? "Enter the street or estate and house number." : undefined,
    landmark: !form.landmark.trim() ? "A landmark helps the crew find you." : undefined,
  };
  return (
    <Modal
      open={!!value}
      onClose={onClose}
      title={value === "new" ? "Add an address" : "Edit address"}
      description="Crews read this on the way, so describe what they'll see."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setTried(true);
              if (errors.label || errors.address || errors.landmark) return;
              const prev = value !== "new" ? value : null;
              onSave({
                id: prev?.id ?? `a${Date.now()}`,
                label: form.label.trim(),
                address: form.address.trim(),
                landmark: form.landmark.trim(),
                gate: form.gate.trim() || undefined,
                use: prev?.use ?? "Bulk and extra pickups only",
                primary: prev?.primary ?? false,
              });
            }}
          >
            Save address
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Input label="Name" placeholder="Home, Office, Mum's house" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} error={tried ? errors.label : undefined} />
        <AddressInput value={form.address} onChange={(v) => setForm({ ...form, address: v })} error={tried ? errors.address : undefined} />
        <Input label="Landmark" placeholder="e.g. Opposite the estate clinic, blue gate" value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} error={tried ? errors.landmark : undefined} />
        <Textarea label="Gate and access" optional rows={2} placeholder="Who opens the gate, and from what time" value={form.gate} onChange={(e) => setForm({ ...form, gate: e.target.value })} />
      </div>
    </Modal>
  );
}

function AccountTypeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [type, setType] = useState("Household");
  const options = [
    { v: "Household", icon: <Home />, d: "One home. What you have now." },
    { v: "Estate", icon: <Building2 />, d: "Manage collection and resident payments for a whole estate." },
    { v: "Business", icon: <Store />, d: "Shops, restaurants and offices, with invoices and a monthly report." },
    { v: "Institution", icon: <Landmark />, d: "Schools, hospitals and agencies, with procurement-ready contracts." },
  ];
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change account type"
      description="Estate, business and institution accounts are set up with an account manager."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={type === "Household"}
            onClick={() => {
              onClose();
              toast.success(`${type} account requested`, "An account manager will call you within one working day. Your household plan carries on meanwhile.");
            }}
          >
            Request a call
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2 pb-2">
        {options.map((o) => (
          <ChoiceCard key={o.v} selected={type === o.v} onSelect={() => setType(o.v)} icon={o.icon} title={o.v} description={o.d} className="py-3.5" />
        ))}
      </div>
    </Modal>
  );
}

function PasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ current: "", next: "", confirm: "" });
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const errors = {
    current: !f.current ? "Enter your current password." : undefined,
    next: f.next.length < 8 ? "Use at least 8 characters." : f.next === f.current ? "Choose a password you haven't used here." : undefined,
    confirm: f.confirm !== f.next ? "The passwords don't match." : undefined,
  };
  const close = () => {
    onClose();
    setF({ current: "", next: "", confirm: "" });
    setTried(false);
  };
  return (
    <Modal
      open={open}
      onClose={close}
      title="Change password"
      description="You'll stay signed in here. Other devices are signed out."
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            loading={busy}
            onClick={() => {
              setTried(true);
              if (errors.current || errors.next || errors.confirm) return;
              setBusy(true);
              setTimeout(() => {
                setBusy(false);
                close();
                toast.success("Password changed", "We've signed out your other devices.");
              }, 700);
            }}
          >
            Change password
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <PasswordInput label="Current password" autoComplete="current-password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} error={tried ? errors.current : undefined} />
        <PasswordInput label="New password" autoComplete="new-password" showStrength value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} error={tried ? errors.next : undefined} />
        <PasswordInput label="Confirm new password" autoComplete="new-password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} error={tried ? errors.confirm : undefined} />
      </div>
    </Modal>
  );
}

function ContactModal({ kind, onClose, onChanged }: { kind: null | "email" | "phone"; onClose: () => void; onChanged: (k: "email" | "phone", v: string) => void }) {
  const toast = useToast();
  const [step, setStep] = useState<"enter" | "code">("enter");
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resend, setResend] = useState(0);
  useEffect(() => {
    if (!kind) return;
    setStep("enter");
    setValue("");
    setCode("");
    setTried(false);
  }, [kind]);
  useEffect(() => {
    if (resend <= 0) return;
    const t = setTimeout(() => setResend((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resend]);
  const isEmail = kind === "email";
  const digits = value.replace(/\D/g, "");
  const error = isEmail
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? undefined : "Enter a valid email address."
    : /^[789][01]\d{8}$/.test(digits) ? undefined : "Enter a Nigerian mobile number, e.g. 803 412 7765.";
  const shown = isEmail ? value.trim() : `+234 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  const codeError = tried && step === "code" && code.length < 6 ? "Enter all 6 digits." : undefined;

  return (
    <Modal
      open={!!kind}
      onClose={onClose}
      size="sm"
      title={step === "enter" ? (isEmail ? "Change email" : "Change phone number") : "Enter the code"}
      description={step === "enter" ? (isEmail ? "We'll send a code to the new address." : "We'll text a code to the new number.") : `Sent to ${shown}. It expires in 10 minutes.`}
      footer={
        <>
          <Button variant="ghost" onClick={step === "code" ? () => { setStep("enter"); setTried(false); } : onClose}>
            {step === "code" ? "Back" : "Cancel"}
          </Button>
          <Button
            loading={busy}
            onClick={() => {
              setTried(true);
              if (step === "enter") {
                if (error) return;
                setBusy(true);
                setTimeout(() => {
                  setBusy(false);
                  setStep("code");
                  setTried(false);
                  setResend(30);
                }, 600);
              } else {
                if (code.length < 6) return;
                setBusy(true);
                setTimeout(() => {
                  setBusy(false);
                  onChanged(kind!, shown);
                  onClose();
                  toast.success(isEmail ? "Email changed" : "Phone number changed", `Receipts and alerts now go to ${shown}.`);
                }, 700);
              }
            }}
          >
            {step === "enter" ? "Send code" : "Verify and save"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        {step === "enter" ? (
          isEmail ? (
            <Input label="New email" type="email" autoComplete="email" leading={<Mail />} value={value} onChange={(e) => setValue(e.target.value)} error={tried ? error : undefined} autoFocus />
          ) : (
            <PhoneInput label="New phone number" value={value} onChange={(e) => setValue(e.target.value.replace(/[^\d ]/g, ""))} error={tried ? error : undefined} autoFocus />
          )
        ) : (
          <>
            <OTPInput value={code} onChange={setCode} invalid={!!codeError} autoFocus />
            {codeError && (
              <p className="t-small text-danger" role="alert">
                {codeError}
              </p>
            )}
            <div className="flex items-center gap-2 t-small text-ink-3">
              {isEmail ? <Mail className="size-4" /> : <Smartphone className="size-4" />}
              {resend > 0 ? (
                <span className="tnum">Resend in 0:{String(resend).padStart(2, "0")}</span>
              ) : (
                <button type="button" className="font-medium text-ink underline underline-offset-4" onClick={() => { setResend(30); toast.info("New code sent", shown); }}>
                  Resend code
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

function DataModal({ open, onClose, email }: { open: boolean; onClose: () => void; email: string }) {
  const toast = useToast();
  const [format, setFormat] = useState<"json" | "csv">("csv");
  const [state, setState] = useState<"idle" | "preparing" | "ready">("idle");
  const file = `slate-data-imaobong-akpan-2026-10-05.${format === "csv" ? "zip" : "json"}`;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Download my data"
      description="A copy of everything Slate holds about you."
      footer={
        state === "ready" ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button
              leading={<Download className="size-4" />}
              onClick={() => {
                toast.success("Download started", file);
                onClose();
                setState("idle");
              }}
            >
              Download
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              loading={state === "preparing"}
              onClick={() => {
                setState("preparing");
                setTimeout(() => setState("ready"), 1600);
              }}
            >
              Prepare file
            </Button>
          </>
        )
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        {state === "ready" ? (
          <div className="flex items-center gap-3 rounded-md bg-sunken p-4">
            <FileArchive className="size-5 shrink-0 text-ink-2" />
            <div className="min-w-0">
              <p className="t-mono truncate text-[12.5px] text-ink">{file}</p>
              <p className="t-small text-ink-3">{format === "csv" ? "214 KB" : "386 KB"} · link also sent to {email}, valid 7 days</p>
            </div>
          </div>
        ) : state === "preparing" ? (
          <div className="flex items-center gap-3 py-4">
            <Spinner />
            <p className="t-small text-ink-2">Gathering pickups, payments and messages…</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <p className="t-small font-medium text-ink">Format</p>
              <Segmented
                value={format}
                onChange={setFormat}
                options={[
                  { value: "csv", label: "Spreadsheets (CSV)" },
                  { value: "json", label: "JSON" },
                ]}
              />
            </div>
            <ul className="flex flex-col gap-2 t-small text-ink-2">
              {["Profile and addresses", "24 pickups and their outcomes", "7 payments and receipts", "Complaints and support messages", "Community contributions", "Recycling weights"].map((x) => (
                <li key={x} className="flex items-center gap-2.5">
                  <Check className="size-4 text-ink-3" strokeWidth={2.5} />
                  {x}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Modal>
  );
}
