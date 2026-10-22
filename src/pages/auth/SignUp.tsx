import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";
import { Alert, Button, Checkbox, Input, PasswordInput, PhoneInput } from "@/components/ui";
import { useSession } from "@/lib/session";
import { messageFor } from "@/lib/api";
import { AuthHeading } from "./_shared";
import { TERMS_VERSION } from "../../../server/contracts";
import { AuthMethods } from "@/components/auth/AuthMethods";

export default function SignUp() {
  const session = useSession();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  if (session.mode === "account") return <Navigate to="/app/dashboard" replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    if (password !== confirm) { setError("Passwords don't match. Enter the same password in both fields."); return; }
    if (!agreed) { setError("Read and accept the service terms and privacy notice to continue."); return; }
    setLoading(true); setError("");
    try {
      await session.authenticate("register", { name: name.trim(), email: email.trim(), phone: phone.trim(), password, termsVersion: TERMS_VERSION });
      navigate("/app/dashboard", { replace: true });
    } catch (cause) { setError(messageFor(cause)); }
    finally { setLoading(false); }
  }
  return <div className="flex flex-col gap-7">
    <AuthHeading title="Start with your home">Create an account to request collection in Uyo and keep track of support.</AuthHeading>
    <AuthMethods intent="signup" next="/app/dashboard" />
    {error && <Alert tone="danger" title="Check your details">{error}</Alert>}
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input label="Full name" autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={event => setName(event.target.value)} />
      <Input label="Email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} />
      <PhoneInput label="Mobile number" required maxLength={20} value={phone} onChange={event => setPhone(event.target.value)} hint="Your collection team may use this number to contact you." />
      <PasswordInput label="Password" autoComplete="new-password" required minLength={12} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} hint="Use at least 12 characters. A few unrelated words make a good password." />
      <PasswordInput label="Confirm password" autoComplete="new-password" required minLength={12} maxLength={128} value={confirm} onChange={event => setConfirm(event.target.value)} />
      <Checkbox checked={agreed} onChange={setAgreed} label="I have read and accept the service terms and privacy notice." />
      <p className="t-small text-ink-2"><Link to="/terms" className="underline underline-offset-4">Service terms</Link> · <Link to="/privacy" className="underline underline-offset-4">Privacy notice</Link></p>
      <Button type="submit" size="lg" block loading={loading} trailing={<ArrowRight className="size-4" />}>Create account</Button>
    </form>
    <p className="t-small text-ink-2">Already registered? <Link to="/login" className="font-semibold text-ink underline underline-offset-4">Sign in</Link></p>
    <p className="t-small text-ink-2">For an estate, business or institution, <Link to="/contact" className="font-medium text-ink underline underline-offset-4">talk to the Slate team</Link>.</p>
  </div>;
}
