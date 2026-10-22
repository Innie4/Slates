import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { ArrowRight, Check } from "lucide-react";
import { Alert, Button, Checkbox, Input, PhoneInput } from "@/components/ui";
import { api, messageFor } from "@/lib/api";
import { safeDestination } from "@/lib/auth";
import { useSession } from "@/lib/session";
import { TERMS_VERSION } from "../../../server/contracts";
import { AuthHeading } from "./_shared";

export default function ContinueSignUp() {
  const session = useSession();
  const navigate = useNavigate();
  const [identity, setIdentity] = useState<{ provider: string; name: string; email: string }>();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; api<{ provider: string; name: string; email: string }>("/auth/signup").then(value => { if (active) { setIdentity(value); setName(value.name); } }).catch(cause => { if (active) setError(messageFor(cause)); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  if (session.mode === "account") return <Navigate to="/app/dashboard" replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !agreed) return;
    setBusy(true); setError("");
    try {
      const result = await api<{ next: string }>("/auth/signup", { method: "POST", body: JSON.stringify({ name: name.trim(), phone: phone.trim(), termsVersion: TERMS_VERSION }) });
      await session.reload(); navigate(safeDestination(result.next), { replace: true });
    } catch (cause) { setError(messageFor(cause)); }
    finally { setBusy(false); }
  }
  return <div className="flex flex-col gap-7">
    <AuthHeading title="One last step.">Add your contact details so your collection team can reach you.</AuthHeading>
    {error && <Alert tone="danger" title="Couldn't finish signup">{error}</Alert>}
    {loading ? <p role="status" className="t-body text-ink-2">Checking your sign-in…</p> : identity ? <>
      <div className="flex gap-3 rounded-md border border-line bg-surface p-4"><Check className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" /><div className="min-w-0"><p className="t-small font-medium text-ink">{identity.provider === "google" ? "Google" : "Apple"} account verified</p><p className="t-small mt-1 break-words text-ink-2">{identity.email}</p></div></div>
      <form onSubmit={submit} className="flex flex-col gap-5">
        <Input label="Full name" required autoComplete="name" minLength={2} maxLength={100} value={name} onChange={event => setName(event.target.value)} />
        <PhoneInput label="Mobile number" required maxLength={20} value={phone} onChange={event => setPhone(event.target.value)} hint="Used to contact you about collection requests." />
        <Checkbox checked={agreed} onChange={setAgreed} label="I have read and accept the service terms and privacy notice." />
        <p className="t-small text-ink-2"><Link to="/terms" className="underline underline-offset-4">Service terms</Link> · <Link to="/privacy" className="underline underline-offset-4">Privacy notice</Link></p>
        <Button type="submit" size="lg" block loading={busy} disabled={!agreed} trailing={<ArrowRight className="size-4" />}>Create account</Button>
      </form>
      <p className="t-small text-ink-2">You can add a passkey in Your account after signup.</p>
    </> : <Link to="/signup" className="t-small font-medium text-ink underline underline-offset-4">Start signup again</Link>}
  </div>;
}
