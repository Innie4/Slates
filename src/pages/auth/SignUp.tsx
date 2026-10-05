import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Building2, Home, Store, Truck } from "lucide-react";
import { Alert, Button, Checkbox, ChoiceCard, Input, PasswordInput, PhoneInput, passwordStrength, useToast } from "@/components/ui";
import { me } from "@/data";
import {
  AuthHeading, LegalModal, SignupProgress, isEmail, nationalPhone, saveDraft, wait, type SignupAccount,
} from "./_shared";

type Errors = Partial<Record<"name" | "email" | "phone" | "password" | "confirm" | "legal", ReactNode>>;

const ACCOUNTS: Array<{ value: SignupAccount; title: string; description: string; icon: ReactNode }> = [
  { value: "Residential", title: "Residential", description: "A home, flat or compound in Uyo.", icon: <Home /> },
  { value: "Business", title: "Business", description: "Shop, restaurant, office, hotel or salon.", icon: <Store /> },
  { value: "Institution", title: "Institution", description: "School, hospital, church or government site.", icon: <Building2 /> },
];

const FIELD_ORDER: Array<keyof Errors> = ["name", "email", "phone", "password", "confirm", "legal"];

/** A1 — Create account. */
export default function SignUp() {
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [account, setAccount] = useState<SignupAccount>("Residential");
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const [referral, setReferral] = useState("");
  const [legal, setLegal] = useState<"terms" | "privacy" | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const clear = (k: keyof Errors) => errors[k] && setErrors((e) => ({ ...e, [k]: undefined }));

  const validate = (): Errors => {
    const e: Errors = {};
    if (name.trim().split(/\s+/).filter(Boolean).length < 2) e.name = "Enter your first and last name.";
    if (!email.trim()) e.email = "Enter your email address.";
    else if (!isEmail(email)) e.email = "Enter a valid email address, like name@example.com.";
    if (!phone.trim()) e.phone = "Enter your mobile number.";
    else if (!nationalPhone(phone)) e.phone = "Enter a Nigerian mobile number, like 803 412 7765.";
    if (!password) e.password = "Create a password.";
    else if (passwordStrength(password).score < 3) e.password = "Too weak. Use 8 or more characters with upper and lower case letters and a number.";
    if (!confirm) e.confirm = "Enter your password again.";
    else if (confirm !== password) e.confirm = "Passwords don't match.";
    if (!terms || !privacy) e.legal = "Accept the terms of service and privacy notice to continue.";
    return e;
  };

  const focusFirst = (e: Errors) => {
    const first = FIELD_ORDER.find((k) => e[k]);
    if (first) document.getElementById(`su-${first}`)?.focus();
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setFailed(false);
    const e = validate();
    setErrors(e);
    if (Object.values(e).some(Boolean)) return focusFirst(e);
    setLoading(true);
    await wait(1100);
    setLoading(false);
    const lower = email.trim().toLowerCase();
    if (lower === me.household.email) {
      const err: Errors = {
        email: (
          <>
            An account already uses this email.{" "}
            <Link to="/login" className="font-semibold text-ink underline underline-offset-2">Sign in instead</Link>
          </>
        ),
      };
      setErrors(err);
      return focusFirst(err);
    }
    if (lower.includes("fail")) {
      setFailed(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    saveDraft({ name: name.trim(), email: lower, phone: nationalPhone(phone)!, account });
    toast.success("Account created", "We've sent a 6-digit code to your email.");
    navigate("/verify-email");
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <SignupProgress current={0} />
        <AuthHeading title="Create your Slate account">One account for collection, payments and support at your address.</AuthHeading>
      </div>

      {failed && (
        <Alert tone="danger" title="We couldn't create your account" onDismiss={() => setFailed(false)}>
          Something went wrong on our side and nothing was saved. Try again in a minute — if it keeps happening, call 0700 752 8300.
        </Alert>
      )}

      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <Input
          id="su-name"
          label="Full name"
          autoComplete="name"
          placeholder="First and last name"
          value={name}
          error={errors.name}
          onChange={(e) => {
            setName(e.target.value);
            clear("name");
          }}
        />
        <Input
          id="su-email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          error={errors.email}
          onChange={(e) => {
            setEmail(e.target.value);
            clear("email");
          }}
          onBlur={() => email && !isEmail(email) && setErrors((x) => ({ ...x, email: "Enter a valid email address, like name@example.com." }))}
        />
        <PhoneInput
          id="su-phone"
          label="Mobile number"
          hint="Your operator's driver may call this number on pickup days."
          value={phone}
          error={errors.phone}
          onChange={(e) => {
            setPhone(e.target.value);
            clear("phone");
          }}
          onBlur={() => phone && !nationalPhone(phone) && setErrors((x) => ({ ...x, phone: "Enter a Nigerian mobile number, like 803 412 7765." }))}
        />
        <PasswordInput
          id="su-password"
          label="Password"
          autoComplete="new-password"
          showStrength
          value={password}
          error={errors.password}
          onChange={(e) => {
            setPassword(e.target.value);
            clear("password");
          }}
        />
        <PasswordInput
          id="su-confirm"
          label="Confirm password"
          autoComplete="new-password"
          value={confirm}
          error={errors.confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            clear("confirm");
          }}
        />

        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2.5 t-small font-medium text-ink">Account type</legend>
          {ACCOUNTS.map((a) => (
            <ChoiceCard
              key={a.value}
              selected={account === a.value}
              onSelect={() => setAccount(a.value)}
              title={a.title}
              description={a.description}
              icon={a.icon}
              className="py-3.5"
            />
          ))}
          <p className="flex items-start gap-2 pt-1 t-small text-ink-2">
            <Truck className="mt-0.5 size-4 shrink-0 text-ink-3" strokeWidth={1.75} />
            <span>
              Waste operators apply separately.{" "}
              <Link to="/operator/onboarding" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                Apply as an operator
              </Link>
            </span>
          </p>
        </fieldset>

        <div>
          {referralOpen ? (
            <Input
              label="Referral code"
              optional
              autoFocus
              placeholder="EWET-4K2M"
              className="t-mono uppercase"
              value={referral}
              onChange={(e) => setReferral(e.target.value.toUpperCase())}
              hint="Your neighbour gets ₦1,000 off their next bill when your first pickup is collected."
            />
          ) : (
            <button type="button" onClick={() => setReferralOpen(true)} className="t-small font-medium text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink">
              Have a referral code?
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-5" id="su-legal" tabIndex={-1}>
          <Checkbox
            checked={terms}
            onChange={(v) => {
              setTerms(v);
              clear("legal");
            }}
            label={
              <>
                I agree to Slate's{" "}
                <button type="button" onClick={(e) => { e.preventDefault(); setLegal("terms"); }} className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                  terms of service
                </button>
              </>
            }
          />
          <Checkbox
            checked={privacy}
            onChange={(v) => {
              setPrivacy(v);
              clear("legal");
            }}
            label={
              <>
                I've read the{" "}
                <button type="button" onClick={(e) => { e.preventDefault(); setLegal("privacy"); }} className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                  privacy notice
                </button>{" "}
                and how my address is shared with my operator
              </>
            }
          />
          {errors.legal && <p className="t-small text-danger" role="alert">{errors.legal}</p>}
        </div>

        <Button type="submit" size="lg" block loading={loading} trailing={<ArrowRight className="size-4" />}>
          {loading ? "Creating account" : "Create account"}
        </Button>
      </form>

      <p className="t-small text-ink-2">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">Sign in</Link>
      </p>

      <LegalModal
        kind={legal ?? "terms"}
        open={legal !== null}
        onClose={() => setLegal(null)}
        onAccept={() => {
          if (legal === "terms") setTerms(true);
          else setPrivacy(true);
          clear("legal");
        }}
      />
    </div>
  );
}
