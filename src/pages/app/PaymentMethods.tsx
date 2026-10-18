import { useState, type ReactNode } from "react";
import { AlertCircle, Building2, CheckCircle2, Copy, Hash, Loader2, Lock, Plus, ServerCrash, ShieldCheck, Trash2, XCircle } from "lucide-react";
import { Strata } from "@/components/brand/Strata";
import {
  Alert, Badge, Button, Checkbox, ConfirmDialog, Input, List, ListRow, Modal, OTPInput, Page, PageHeader, Section, useToast,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { BrandMark, INITIAL_CARDS, type SavedCard } from "./_money";

/** C14, Saved cards, add card (tokenised by Paystack), and other ways to pay. */
export default function PaymentMethods() {
  const toast = useToast();
  const [cards, setCards] = useState<SavedCard[]>(INITIAL_CARDS);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<SavedCard | null>(null);
  const expired = cards.filter((c) => c.expired);
  const def = cards.find((c) => c.isDefault);

  const setDefault = (c: SavedCard) => {
    setCards((xs) => xs.map((x) => ({ ...x, isDefault: x.id === c.id })));
    toast.success(`${c.brand} •• ${c.last4} is now your default`, "Plan charges and Smart Sweep will use it from the next charge.");
  };

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text.replace(/\s/g, ""));
      toast.success(`${what} copied`, text);
    } catch {
      toast.info(what, text);
    }
  };

  return (
    <Page>
      <PageHeader
        title="Payment methods"
        description="Your plan, extra pickups and Smart Sweep charges use your default card."
        actions={
          <Button leading={<Plus className="size-4" />} onClick={() => setAdding(true)}>
            Add card
          </Button>
        }
      />

      {expired.map((c) => (
        <Alert
          key={c.id}
          tone="warning"
          title={`Your ${c.brand} card ending ${c.last4} has expired`}
        >
          <p>It expired at the end of {c.exp.replace("/", "/20")}. Slate won't try it again, one extra-pickup charge of ₦3,500 failed on it and needs a retry.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" leading={<Plus className="size-3.5" />} onClick={() => setAdding(true)}>Add new card</Button>
            <Button size="sm" variant="ghost" onClick={() => setRemoving(c)}>Remove expired card</Button>
          </div>
        </Alert>
      ))}

      <Section title="Saved cards" description={def ? `Default: ${def.brand} •• ${def.last4}` : "No default card, add one to keep collection running."}>
        {cards.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line-strong px-6 py-10 text-center">
            <p className="t-h3 text-ink">No saved cards</p>
            <p className="mt-1 t-small text-ink-2">Pay by transfer or USSD below, or add a card for automatic charges.</p>
            <Button className="mt-4" leading={<Plus className="size-4" />} onClick={() => setAdding(true)}>Add card</Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((c) => (
              <div key={c.id} className="flex flex-col gap-3">
                <CardFace card={c} />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {c.isDefault ? (
                      <Badge tone="slate" icon={<CheckCircle2 />}>Default</Badge>
                    ) : c.expired ? (
                      <Badge tone="danger" dot>Expired</Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setDefault(c)}>Make default</Button>
                    )}
                    <span className="t-small text-ink-3">{c.bank}</span>
                  </div>
                  {c.isDefault && cards.filter((x) => !x.expired).length === 1 ? (
                    <Button size="sm" variant="ghost" disabled title="Add another card before removing your default" leading={<Trash2 className="size-3.5" />}>Remove</Button>
                  ) : (
                    <Button size="sm" variant="ghost" className="text-danger hover:bg-danger-bg hover:text-danger" leading={<Trash2 className="size-3.5" />} onClick={() => setRemoving(c)}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex aspect-[1.75] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong text-ink-2 transition-colors hover:border-ink-3 hover:bg-sunken/50 hover:text-ink max-sm:aspect-auto max-sm:py-6"
            >
              <Plus className="size-5" />
              <span className="t-small font-medium">Add a debit card</span>
              <span className="t-micro text-ink-3">Visa, Mastercard or Verve</span>
            </button>
          </div>
        )}
      </Section>

      <Section title="Other ways to pay" description="For one-off payments. These don't renew automatically.">
        <List className="border-y border-line">
          <ListRow
            leading={<span className="flex size-10 items-center justify-center rounded-md bg-sunken text-ink-2"><Building2 className="size-[18px]" /></span>}
            title="Bank transfer"
            subtitle={
              <span className="whitespace-normal">
                Wema Bank · <span className="t-mono text-ink">7821 0465 93</span> · Slate / Imaobong Akpan. Confirms in under 10 minutes.
              </span>
            }
            trailing={<Button size="sm" variant="outline" leading={<Copy className="size-3.5" />} onClick={() => copy("7821 0465 93", "Account number")}>Copy</Button>}
            className="[&_.truncate]:whitespace-normal"
          />
          <ListRow
            leading={<span className="flex size-10 items-center justify-center rounded-md bg-sunken text-ink-2"><Hash className="size-[18px]" /></span>}
            title="USSD"
            subtitle={
              <span className="whitespace-normal">
                Dial <span className="t-mono text-ink">*945*000*7000#</span> from {"+234 ••• ••• 0951"}. Works on any network, no data needed.
              </span>
            }
            trailing={<Button size="sm" variant="outline" leading={<Copy className="size-3.5" />} onClick={() => copy("*945*000*7000#", "USSD code")}>Copy</Button>}
            className="[&_.truncate]:whitespace-normal"
          />
        </List>
      </Section>

      <p className="flex max-w-2xl items-start gap-2.5 t-small text-ink-3">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        Cards are stored by Paystack, a CBN-licensed payment processor. Slate keeps only a token, the brand and the last four digits.
      </p>

      <AddCardModal
        open={adding}
        onClose={() => setAdding(false)}
        onAdded={(card) => {
          setCards((xs) => [...(card.isDefault ? xs.map((x) => ({ ...x, isDefault: false })) : xs), card]);
        }}
      />
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        variant="destructive"
        title={removing ? `Remove ${removing.brand} •• ${removing.last4}?` : ""}
        description={
          removing?.isDefault
            ? "This is your default card. Your next plan charge will use your other card instead."
            : "Slate won't charge this card again. You can add it back any time."
        }
        confirmLabel="Remove card"
        onConfirm={() => {
          if (!removing) return;
          setCards((xs) => {
            const rest = xs.filter((x) => x.id !== removing.id);
            if (removing.isDefault) {
              const next = rest.find((x) => !x.expired);
              return rest.map((x) => ({ ...x, isDefault: x.id === next?.id }));
            }
            return rest;
          });
          toast.success("Card removed", `${removing.brand} •• ${removing.last4}`);
        }}
      />
    </Page>
  );
}

/** The card as a small slate slab. Expired cards go flat and grey. */
function CardFace({ card }: { card: SavedCard }) {
  const dim = card.expired;
  return (
    <div
      className={cn(
        "relative isolate flex aspect-[1.75] w-full flex-col justify-between overflow-hidden rounded-lg p-5",
        dim ? "border border-line bg-sunken text-ink-3" : "bg-slate text-slate-ink chalk-grain",
      )}
      aria-label={`${card.brand} ending ${card.last4}, expires ${card.exp}${dim ? ", expired" : ""}`}
    >
      {!dim && <Strata tone="on-slate" bands={3} seed={card.last4.charCodeAt(0) + 3} chalk className="absolute inset-x-0 bottom-0 -z-10 h-[38%] w-full opacity-45" />}
      <div className="flex items-start justify-between">
        <BrandMark brand={card.brand} className="text-[18px]" />
        <span className={cn("t-micro", dim ? "text-ink-3" : "text-slate-ink/70")}>{card.bank}</span>
      </div>
      <div className="flex flex-col gap-2">
        <p className="t-mono text-[17px] tracking-[0.12em]">•••• •••• •••• {card.last4}</p>
        <div className="flex items-end justify-between t-micro">
          <span className={cn("uppercase tracking-wider", dim ? "" : "text-slate-ink/75")}>{card.holder}</span>
          <span className={cn("tnum", dim && "font-semibold text-danger")}>{dim ? `Expired ${card.exp}` : `Exp ${card.exp}`}</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Add card                                                            */
/* ------------------------------------------------------------------ */

type Stage = "form" | "processing" | "otp" | "verifying" | "added" | "declined" | "error";

const detectBrand = (digits: string): SavedCard["brand"] | null =>
  /^4/.test(digits) ? "Visa" : /^(5[1-5]|2[2-7])/.test(digits) ? "Mastercard" : /^(506[01]|507[89]|6500)/.test(digits) ? "Verve" : null;

const groupCard = (digits: string) => digits.replace(/(.{4})/g, "$1 ").trim();

function AddCardModal({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: (c: SavedCard) => void }) {
  const toast = useToast();
  const [stage, setStage] = useState<Stage>("form");
  const [number, setNumber] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");
  const [holder, setHolder] = useState("");
  const [makeDefault, setMakeDefault] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<"number" | "exp" | "cvv" | "holder", string>>>({});
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [added, setAdded] = useState<SavedCard | null>(null);

  const digits = number.replace(/\D/g, "");
  const brand = detectBrand(digits);

  const reset = () => {
    setStage("form");
    setNumber("");
    setExp("");
    setCvv("");
    setHolder("");
    setErrors({});
    setOtp("");
    setOtpError("");
    setAdded(null);
    setMakeDefault(true);
  };
  const close = () => {
    if (stage === "processing" || stage === "verifying") return;
    onClose();
    setTimeout(reset, 250);
  };

  const submit = async () => {
    const e: typeof errors = {};
    if (holder.trim().split(/\s+/).length < 2) e.holder = "Enter the name as it appears on the card.";
    if (digits.length < 16 || digits.length > 19) e.number = "Card numbers are 16 to 19 digits.";
    else if (!brand) e.number = "Slate accepts Visa, Mastercard and Verve debit cards.";
    const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(exp);
    if (!m) e.exp = "Use MM/YY.";
    else {
      const mm = Number(m[1]), yy = Number(m[2]);
      if (mm < 1 || mm > 12) e.exp = "Month must be 01–12.";
      else if (yy < 26 || (yy === 26 && mm < 10)) e.exp = "This card has expired.";
    }
    if (!/^\d{3,4}$/.test(cvv)) e.cvv = "3 digits on the back.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setStage("processing");
    await new Promise((r) => setTimeout(r, 1500));
    if (digits.endsWith("0002")) return setStage("declined");
    if (digits.endsWith("0003")) return setStage("error");
    setStage("otp");
  };

  const verifyOtp = async () => {
    if (otp.length < 6) return setOtpError("Enter the 6-digit code from your bank.");
    setStage("verifying");
    await new Promise((r) => setTimeout(r, 1300));
    if (otp === "000000") {
      setStage("otp");
      setOtp("");
      return setOtpError("Your bank rejected that code. Check the latest SMS and try again.");
    }
    const card: SavedCard = {
      id: `card-${digits.slice(-4)}-${Date.now()}`,
      brand: brand!,
      last4: digits.slice(-4),
      exp: exp.replace(/\s/g, ""),
      bank: brand === "Verve" ? "Access Bank" : brand === "Mastercard" ? "Zenith Bank" : "UBA",
      holder: holder.trim().toUpperCase(),
      isDefault: makeDefault,
      expired: false,
    };
    setAdded(card);
    onAdded(card);
    setStage("added");
    toast.success(`${card.brand} •• ${card.last4} added`, "The ₦50 verification charge has been refunded.");
  };

  const bankName = brand === "Verve" ? "Access Bank" : brand === "Mastercard" ? "Zenith Bank" : "UBA";

  const footer =
    stage === "form" ? (
      <>
        <Button variant="ghost" onClick={close}>Cancel</Button>
        <Button leading={<Lock className="size-4" />} onClick={submit}>Add card securely</Button>
      </>
    ) : stage === "otp" || stage === "verifying" ? (
      <>
        <Button variant="ghost" disabled={stage === "verifying"} onClick={() => setStage("form")}>Back</Button>
        <Button loading={stage === "verifying"} onClick={verifyOtp}>{stage === "verifying" ? "Confirming" : "Confirm"}</Button>
      </>
    ) : stage === "added" ? (
      <Button onClick={close}>Done</Button>
    ) : stage === "declined" || stage === "error" ? (
      <>
        <Button variant="ghost" onClick={close}>Close</Button>
        <Button
          onClick={() => {
            if (stage === "declined") {
              setNumber("");
              setCvv("");
            }
            setStage("form");
          }}
        >
          {stage === "declined" ? "Try another card" : "Try again"}
        </Button>
      </>
    ) : undefined;

  return (
    <Modal open={open} onClose={close} title={stage === "form" ? "Add a debit card" : undefined} description={stage === "form" ? "We'll charge ₦50 to check the card, then refund it straight away." : undefined} footer={footer} hideClose={stage === "processing" || stage === "verifying"}>
      {stage === "form" && (
        <div className="flex flex-col gap-4 pb-2">
          {/* Paystack-hosted secure field group */}
          <div className="overflow-hidden rounded-lg border border-line-strong bg-surface">
            <div className="flex items-center justify-between gap-3 border-b border-line bg-sunken/60 px-4 py-2.5">
              <span className="flex items-center gap-1.5 t-micro font-semibold text-ink-2">
                <Lock className="size-3.5" /> Secure card fields
              </span>
              <span className="t-micro text-ink-3">Handled by Paystack</span>
            </div>
            <div className="flex flex-col gap-4 p-4">
              <Input
                label="Name on card"
                autoComplete="cc-name"
                placeholder="IMAOBONG AKPAN"
                className="uppercase"
                value={holder}
                error={errors.holder}
                onChange={(e) => { setHolder(e.target.value); setErrors((x) => ({ ...x, holder: undefined })); }}
              />
              <Input
                label="Card number"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="0000 0000 0000 0000"
                className="t-mono text-[15px] tracking-wider"
                value={number}
                error={errors.number}
                trailing={brand ? <BrandMark brand={brand} className="pr-3 text-[13px] text-ink-2" /> : undefined}
                onChange={(e) => { setNumber(groupCard(e.target.value.replace(/\D/g, "").slice(0, 19))); setErrors((x) => ({ ...x, number: undefined })); }}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Expiry"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="MM/YY"
                  className="t-mono text-[15px]"
                  value={exp}
                  error={errors.exp}
                  onChange={(e) => {
                    const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setExp(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
                    setErrors((x) => ({ ...x, exp: undefined }));
                  }}
                />
                <Input
                  label="CVV"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="123"
                  type="password"
                  className="t-mono text-[15px]"
                  value={cvv}
                  error={errors.cvv}
                  onChange={(e) => { setCvv(e.target.value.replace(/\D/g, "").slice(0, 4)); setErrors((x) => ({ ...x, cvv: undefined })); }}
                />
              </div>
            </div>
            <p className="flex items-start gap-2 border-t border-line px-4 py-3 t-small text-ink-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ink-3" />
              Slate never stores your full card number, expiry or CVV, Paystack returns a token.
            </p>
          </div>
          <Checkbox checked={makeDefault} onChange={setMakeDefault} label="Make this my default card" description="Used for your plan, extra pickups and Smart Sweep." />
          <div className="flex items-start gap-2.5 rounded-md border border-dashed border-line-strong px-3.5 py-2.5">
            <span className="mt-px rounded-[4px] bg-sunken px-1.5 py-0.5 t-micro font-semibold uppercase tracking-wider text-ink-3">Demo</span>
            <p className="t-small text-ink-2">
              Any 16-digit card starting 4, 5 or 5061 works. Ending <span className="t-mono text-ink">0002</span> is declined, <span className="t-mono text-ink">0003</span> is a processor error.
            </p>
          </div>
        </div>
      )}

      {stage === "processing" && (
        <StageBody icon={<Loader2 className="animate-spin" />} title="Contacting your bank" tone="neutral">
          Paystack is checking {brand ?? "your card"} •• {digits.slice(-4)}. Keep this window open, it takes a few seconds.
        </StageBody>
      )}

      {(stage === "otp" || stage === "verifying") && (
        <div className="flex flex-col gap-5 pb-2 pt-2">
          <StageBody icon={<Lock />} title="Enter the code from your bank" tone="neutral">
            {bankName} sent a one-time code to the phone ending 0951 to approve the ₦50 check.
          </StageBody>
          <div className="flex flex-col gap-2">
            <OTPInput value={otp} onChange={(v) => { setOtp(v); setOtpError(""); }} invalid={!!otpError} autoFocus />
            {otpError ? <p className="t-small text-danger" role="alert">{otpError}</p> : <p className="t-small text-ink-3">Any 6 digits work in the demo. 000000 is rejected.</p>}
          </div>
        </div>
      )}

      {stage === "added" && added && (
        <div className="flex flex-col gap-5 pb-2 pt-2">
          <StageBody icon={<CheckCircle2 />} title="Card added" tone="success">
            {added.brand} •• {added.last4} is saved{added.isDefault ? " and set as your default" : ""}. The ₦50 check has been refunded.
          </StageBody>
          <div className="max-w-xs"><CardFace card={added} /></div>
        </div>
      )}

      {stage === "declined" && (
        <StageBody icon={<XCircle />} title="Your bank declined this card" tone="danger">
          No money was taken. Debit cards with online payments switched off are often declined, turn them on in your bank app, or use another card.
        </StageBody>
      )}

      {stage === "error" && (
        <StageBody icon={<ServerCrash />} title="Paystack couldn't process this right now" tone="warning">
          This is on the payment provider's side and your card wasn't charged. Wait a minute and try again.
          <span className="mt-3 flex items-center gap-1.5 t-small text-ink-3"><AlertCircle className="size-3.5" /> Error PSK-503 · {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
        </StageBody>
      )}
    </Modal>
  );
}

function StageBody({ icon, title, tone, children }: { icon: ReactNode; title: string; tone: "neutral" | "success" | "warning" | "danger"; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 pb-2 pt-2">
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-md [&_svg]:size-5",
          tone === "neutral" && "bg-sunken text-ink-2",
          tone === "success" && "bg-success-bg text-success",
          tone === "warning" && "bg-warning-bg text-warning",
          tone === "danger" && "bg-danger-bg text-danger",
        )}
      >
        {icon}
      </span>
      <h2 className="t-h2 text-ink">{title}</h2>
      <div className="t-body text-ink-2">{children}</div>
    </div>
  );
}
