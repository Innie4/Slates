import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { Alert, Button, Checkbox, Input, PasswordInput, useToast } from "@/components/ui";
import { HOME_FOR_ROLE, useSession, userForRole } from "@/lib/session";
import type { Role } from "@/data";
import { AuthHeading, isEmail, nationalPhone, wait } from "./_shared";

type Outcome = null | "invalid" | "suspended" | "pending" | "offline";

const DEMO_ROLES: Array<{ role: Role; label: string }> = [
  { role: "household", label: "Household" },
  { role: "estate", label: "Estate manager" },
  { role: "business", label: "Business" },
  { role: "institution", label: "Institution" },
  { role: "operator", label: "Waste operator" },
  { role: "admin", label: "Slate admin" },
];

/** A2 — Sign in, with demo access to every portal. */
export default function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const { signIn } = useSession();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ id?: string; password?: string }>({});
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const submit = async (ev?: FormEvent) => {
    ev?.preventDefault();
    const e: typeof errors = {};
    const trimmed = id.trim();
    if (!trimmed) e.id = "Enter your email or mobile number.";
    else if (!isEmail(trimmed) && !nationalPhone(trimmed)) e.id = "Enter a valid email, or a mobile number like 0803 412 7765.";
    if (!password) e.password = "Enter your password.";
    setErrors(e);
    setOutcome(null);
    if (e.id || e.password) {
      document.getElementById(e.id ? "li-id" : "li-password")?.focus();
      return;
    }
    setLoading(true);
    await wait(950);
    setLoading(false);
    const lower = trimmed.toLowerCase();
    if (lower.startsWith("suspended@")) return setOutcome("suspended");
    if (lower.startsWith("pending@")) return setOutcome("pending");
    if (lower.startsWith("offline@")) return setOutcome("offline");
    if (lower.startsWith("wrong@") || password.length < 6) {
      setAttempts((a) => a + 1);
      return setOutcome("invalid");
    }
    if (lower.startsWith("2fa@")) return navigate("/two-factor");
    signIn("household");
    if (remember) toast.info("This device will stay signed in for 30 days");
    navigate(HOME_FOR_ROLE.household);
  };

  const demo = (role: Role) => {
    signIn(role);
    navigate(HOME_FOR_ROLE[role]);
  };

  return (
    <div className="flex flex-col gap-8">
      <AuthHeading title="Sign in">Check today's pickup, pay and get help in one place.</AuthHeading>

      {outcome === "invalid" && (
        <Alert tone="danger" title="That email or password isn't right">
          {attempts >= 3 ? (
            <>
              {attempts} attempts so far. After 5, sign-in pauses for 15 minutes.{" "}
              <Link to="/forgot-password" className="font-semibold text-ink underline underline-offset-2">Reset your password</Link>
            </>
          ) : (
            "Check both and try again. Passwords are case-sensitive."
          )}
        </Alert>
      )}
      {outcome === "suspended" && (
        <Alert tone="warning" title="This account is suspended">
          Collection was paused on 28 Sept after three failed payments. Call Slate on 0700 752 8300 or{" "}
          <Link to="/contact" className="font-semibold text-ink underline underline-offset-2">contact support</Link> to restore it — your history is safe.
        </Alert>
      )}
      {outcome === "pending" && (
        <Alert
          tone="info"
          title="Verify your email to finish signing in"
          action={
            <Button size="sm" variant="outline" onClick={() => navigate("/verify-email")}>
              Verify
            </Button>
          }
        >
          We sent a code when you signed up. You can request a new one.
        </Alert>
      )}
      {outcome === "offline" && (
        <Alert
          tone="danger"
          title="Couldn't reach Slate"
          action={
            <Button size="sm" variant="outline" onClick={() => submit()}>
              Retry
            </Button>
          }
        >
          Check your mobile data or Wi-Fi. Nothing was changed.
        </Alert>
      )}

      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <Input
          id="li-id"
          label="Email or mobile number"
          autoComplete="username"
          placeholder="you@example.com or 0803…"
          value={id}
          error={errors.id}
          onChange={(e) => {
            setId(e.target.value);
            setErrors((x) => ({ ...x, id: undefined }));
          }}
        />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <label htmlFor="li-password" className="t-small font-medium text-ink">Password</label>
            <Link to="/forgot-password" className="t-small font-medium text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="li-password"
            autoComplete="current-password"
            value={password}
            error={errors.password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((x) => ({ ...x, password: undefined }));
            }}
          />
        </div>
        <Checkbox checked={remember} onChange={setRemember} label="Keep me signed in on this device" description="For 30 days. Leave unticked on a shared phone." />
        <Button type="submit" size="lg" block loading={loading} trailing={<ArrowRight className="size-4" />}>
          {loading ? "Signing in" : "Sign in"}
        </Button>
      </form>

      <p className="t-small text-ink-2">
        New to Slate?{" "}
        <Link to="/signup" className="font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">Create an account</Link>
      </p>

      <section aria-labelledby="demo-access" className="flex flex-col gap-4 border-t border-line pt-7">
        <div className="flex flex-col gap-1">
          <h2 id="demo-access" className="t-h3 text-ink">Demo access</h2>
          <p className="t-small text-ink-2">
            This is a frontend-only demo. Open any portal as its demo user — no password needed.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ROLES.map((d) => {
            const u = userForRole(d.role);
            return (
              <button
                key={d.role}
                type="button"
                onClick={() => demo(d.role)}
                className="group flex min-w-0 items-start justify-between gap-2 rounded-md border border-line bg-surface px-3.5 py-3 text-left transition-colors hover:border-line-strong hover:bg-sunken/60"
              >
                <span className="min-w-0">
                  <span className="block t-small font-semibold text-ink">{d.label}</span>
                  <span className="block truncate t-micro text-ink-3">{u.name}</span>
                </span>
                <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-ink-3 transition-transform group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-ink" />
              </button>
            );
          })}
        </div>
        <details className="group rounded-md border border-dashed border-line-strong px-3.5 py-2.5">
          <summary className="flex cursor-pointer list-none items-center justify-between t-small font-medium text-ink-2 hover:text-ink [&::-webkit-details-marker]:hidden">
            Try a sign-in state
            <ChevronDown className="size-4 text-ink-3 transition-transform group-open:rotate-180" />
          </summary>
          <ul className="mt-2.5 grid gap-1.5 pb-1 t-small text-ink-2">
            <li><span className="t-mono text-ink">wrong@…</span> or a short password — invalid credentials</li>
            <li><span className="t-mono text-ink">suspended@…</span> — account suspended</li>
            <li><span className="t-mono text-ink">pending@…</span> — email not verified</li>
            <li><span className="t-mono text-ink">offline@…</span> — network failure</li>
            <li><span className="t-mono text-ink">2fa@…</span> — two-step verification</li>
          </ul>
        </details>
      </section>
    </div>
  );
}
