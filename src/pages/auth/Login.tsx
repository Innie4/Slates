import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Alert, Button, Input, PasswordInput } from "@/components/ui";
import { DEMO_ENABLED, HOME_FOR_ROLE, useSession } from "@/lib/session";
import { messageFor } from "@/lib/api";
import type { Role } from "@/data";
import { AuthHeading } from "./_shared";
import { AuthMethods } from "@/components/auth/AuthMethods";
import { authErrorMessages, safeDestination } from "@/lib/auth";

const PREVIEWS: Array<[Role, string]> = [["household", "Household"], ["estate", "Estate manager"], ["business", "Business"], ["institution", "Institution"], ["operator", "Waste operator"], ["admin", "Slate operations"]];
export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const session = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const next = params.get("next");
  const destination = safeDestination(next);
  const callbackError = authErrorMessages[params.get("authError") ?? ""];
  if (session.mode === "account") return <Navigate to={callbackError ? `/app/settings?authError=${encodeURIComponent(params.get("authError")!)}` : destination} replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true); setError("");
    try { await session.authenticate("login", { email: email.trim(), password }); navigate(destination, { replace: true }); }
    catch (cause) { setError(messageFor(cause)); }
    finally { setLoading(false); }
  }
  return <div className="flex flex-col gap-7">
    <AuthHeading title="Sign in">Your collection requests and support, in one place.</AuthHeading>
    {(error || callbackError) && <Alert tone="danger" title="Couldn't sign in">{error || callbackError}</Alert>}
    <AuthMethods intent="login" next={destination} />
    <form onSubmit={submit} className="flex flex-col gap-5">
      <Input label="Email" type="email" autoComplete="username" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" />
      <PasswordInput label="Password" autoComplete="current-password" required maxLength={128} value={password} onChange={event => setPassword(event.target.value)} />
      <Button type="submit" block size="lg" loading={loading} trailing={<ArrowRight className="size-4" />}>Sign in</Button>
    </form>
    <div className="flex flex-wrap justify-between gap-3 t-small">
      <p className="text-ink-2">New to Slate? <Link to="/signup" className="font-semibold text-ink underline underline-offset-4">Create an account</Link></p>
      <Link to="/forgot-password" className="text-ink-2 underline underline-offset-4">Account help</Link>
    </div>
    {DEMO_ENABLED && <section className="border-t border-line pt-6" aria-labelledby="preview-title">
      <h2 id="preview-title" className="t-h3 text-ink">Explore Slate</h2>
      <p className="t-small mt-1 mb-4 text-ink-2">Sample accounts let you explore each portal. Their records and payments are demonstrations.</p>
      <div className="grid grid-cols-2 gap-2">{PREVIEWS.map(([role, label]) => <button key={role} type="button" onClick={() => { session.signIn(role); navigate(HOME_FOR_ROLE[role]); }} className="flex min-h-12 items-center justify-between gap-2 rounded-md bg-sunken px-3 py-3 text-left t-small font-medium text-ink hover:bg-stone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">{label}<ArrowUpRight className="size-4 shrink-0" /></button>)}</div>
    </section>}
  </div>;
}
