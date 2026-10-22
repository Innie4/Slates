import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { browserSupportsWebAuthn, startAuthentication, WebAuthnAbortService } from "@simplewebauthn/browser";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";
import { Fingerprint } from "lucide-react";
import { Alert, Button } from "@/components/ui";
import { api, messageFor } from "@/lib/api";
import { beginOAuth, passkeyMessage, type AuthMethodsConfig, type AuthProvider } from "@/lib/auth";
import { useSession } from "@/lib/session";

export function GoogleMark() {
  return <svg viewBox="0 0 48 48" className="size-5 shrink-0" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.02 46.98 31.87 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59A14.41 14.41 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.87 23.87 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>;
}

export function AppleMark() {
  return <svg viewBox="0 0 24 24" className="size-5 shrink-0 fill-current" aria-hidden="true"><path d="M17.05 12.54c.03 3.17 2.78 4.23 2.81 4.24-.02.07-.44 1.51-1.45 3-1.01 1.48-2.06 2.95-3.71 2.98-1.63.04-2.16-.96-4.03-.96-1.87 0-2.46.93-4 .99-1.59.06-2.8-1.6-3.82-3.08-2.08-3.02-3.67-8.54-1.53-12.27a5.93 5.93 0 0 1 5.02-3.04c1.57-.03 3.05 1.06 4.01 1.06.96 0 2.76-1.31 4.65-1.12.79.03 3 .32 4.42 2.4-.11.07-2.64 1.54-2.61 4.8l.24 1ZM14.01 2.34C14.86 1.31 15.44-.12 15.28-1.5c-1.23.05-2.72.82-3.6 1.85-.79.91-1.48 2.37-1.29 3.73 1.37.11 2.76-.69 3.62-1.74Z" transform="translate(1 2) scale(.85)"/></svg>;
}

export function AuthMethods({ intent, next }: { intent: "login" | "signup"; next: string }) {
  const session = useSession();
  const navigate = useNavigate();
  const [config, setConfig] = useState<AuthMethodsConfig>();
  const [configError, setConfigError] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string>();
  const operation = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const supported = browserSupportsWebAuthn() && window.isSecureContext;
  useEffect(() => { let active = true; api<AuthMethodsConfig>("/auth/config").then(value => { if (active) setConfig(value); }).catch(() => { if (active) setConfigError(true); }); return () => { active = false; }; }, []);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; operation.current?.abort(); WebAuthnAbortService.cancelCeremony(); }; }, []);
  async function social(provider: AuthProvider) {
    if (busy) return;
    setBusy(provider); setError("");
    const controller = new AbortController(); operation.current = controller;
    try { await beginOAuth(provider, intent, next, controller.signal); }
    catch (cause) { if (mounted.current && !controller.signal.aborted) { setError(messageFor(cause)); setBusy(undefined); } }
  }
  async function passkey() {
    if (busy) return;
    setBusy("passkey"); setError("");
    const controller = new AbortController(); operation.current = controller;
    try {
      const { options } = await api<{ options: PublicKeyCredentialRequestOptionsJSON }>("/auth/passkeys/login/options", { method: "POST", body: "{}", signal: controller.signal });
      if (controller.signal.aborted || !mounted.current) return;
      const response = await startAuthentication({ optionsJSON: options });
      if (controller.signal.aborted || !mounted.current) return;
      await api("/auth/passkeys/login/verify", { method: "POST", body: JSON.stringify({ response }), signal: controller.signal });
      if (controller.signal.aborted || !mounted.current) return;
      await session.reload(); if (mounted.current && !controller.signal.aborted) navigate(next, { replace: true });
    } catch (cause) { if (mounted.current && !controller.signal.aborted) setError(passkeyMessage(cause)); }
    finally { if (mounted.current) setBusy(undefined); }
  }
  return <section aria-label="Other sign-in methods" className="flex flex-col gap-3">
    {error && <Alert tone="danger" title="Couldn't continue">{error}</Alert>}
    <Button variant="outline" size="lg" block className="auth-google" leading={<GoogleMark />} disabled={!config?.methods.google || !!busy} loading={busy === "google"} onClick={() => void social("google")}>{intent === "signup" ? "Sign up with Google" : "Continue with Google"}</Button>
    <Button variant="outline" size="lg" block className="auth-apple" leading={<AppleMark />} disabled={!config?.methods.apple || !!busy} loading={busy === "apple"} onClick={() => void social("apple")}>Continue with Apple</Button>
    {!config?.methods.apple && <p className="t-small text-center text-ink-3">Apple sign-in is not available yet.</p>}
    {intent === "login" && <><Button variant="outline" size="lg" block className="auth-passkey" leading={<Fingerprint className="size-5" />} disabled={!config?.methods.passkeys || !supported || !!busy} loading={busy === "passkey"} onClick={() => void passkey()}>Sign in with a passkey</Button><p className="t-small text-center text-ink-2">{supported ? "Use your fingerprint, face or device PIN." : "Passkeys need a supported browser on a secure connection."}</p></>}
    {configError ? <p role="status" className="t-small text-ink-2">Other sign-in methods couldn't load. You can still use your email.</p> : config && !config.methods.google && <p className="t-small text-ink-2">Google sign-in is not available yet. Use your email below.</p>}
    <div className="auth-divider"><span>Or {intent === "signup" ? "sign up" : "sign in"} with email</span></div>
  </section>;
}
