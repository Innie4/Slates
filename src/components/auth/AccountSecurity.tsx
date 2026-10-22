import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { browserSupportsWebAuthn, startAuthentication, startRegistration, WebAuthnAbortService } from "@simplewebauthn/browser";
import type { PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";
import { Check, Fingerprint, KeyRound } from "lucide-react";
import { Alert, Button, Input, Modal, SkeletonRows } from "@/components/ui";
import { ApiError, api, messageFor } from "@/lib/api";
import { authErrorMessages, beginOAuth, passkeyMessage } from "@/lib/auth";
import { useSession } from "@/lib/session";
import { AppleMark, GoogleMark } from "./AuthMethods";
import type { AuthMethods, AuthProvider, AuthSecurity } from "../../../server/contracts";

type Passkey = AuthSecurity["passkeys"][number];
type Action = { kind: "register" } | { kind: "remove"; passkey: Passkey } | { kind: "link"; provider: AuthProvider };

function SecuritySettings() {
  const session = useSession();
  const [params] = useSearchParams();
  const callbackError = authErrorMessages[params.get("authError") ?? ""];
  const [config, setConfig] = useState<AuthMethods>();
  const [security, setSecurity] = useState<AuthSecurity>();
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [dialog, setDialog] = useState<"register" | "remove" | "reauth" | null>(null);
  const [pending, setPending] = useState<Action>();
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const supported = browserSupportsWebAuthn() && window.isSecureContext;

  async function refresh(signal?: AbortSignal) {
    const [methods, details] = await Promise.all([
      api<AuthMethods>("/auth/config", { signal }),
      api<AuthSecurity>("/auth/security", { signal }),
    ]);
    setConfig(methods); setSecurity(details);
  }

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal).catch(cause => {
      if (!controller.signal.aborted) setLoadError(messageFor(cause));
    });
    return () => { controller.abort(); WebAuthnAbortService.cancelCeremony(); };
  }, []);

  function closeDialog() {
    if (busy) return;
    setDialog(null); setPending(undefined); setError(""); setPassword("");
  }

  function openDialog(kind: "register" | "remove", passkey?: Passkey) {
    setError(""); setNotice(""); setPassword("");
    setPending(kind === "remove" && passkey ? { kind: "remove", passkey } : { kind: "register" });
    setDialog(kind);
  }

  async function perform(action: Action) {
    if (busy || !security) return;
    setError(""); setNotice(""); setPending(action);
    if (!security.recentAuth) { setDialog("reauth"); return; }
    setBusy(action.kind);
    try {
      if (action.kind === "link") {
        await beginOAuth(action.provider, "link", "/app/settings");
        return;
      }
      if (action.kind === "register") {
        const { options } = await api<{ options: PublicKeyCredentialCreationOptionsJSON }>("/auth/passkeys/register/options", {
          method: "POST", body: JSON.stringify({ name: name.trim() }),
        });
        const response = await startRegistration({ optionsJSON: options });
        await api("/auth/passkeys/register/verify", { method: "POST", body: JSON.stringify({ response }) });
        setName("");
        setNotice("Passkey added. You can use it the next time you sign in.");
      } else {
        await api(`/auth/passkeys/${encodeURIComponent(action.passkey.id)}`, { method: "DELETE" });
        setNotice(`Passkey removed: ${action.passkey.name}.`);
      }
      setDialog(null); setPending(undefined);
      await refresh();
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "REAUTH_REQUIRED") {
        setSecurity(value => value ? { ...value, recentAuth: false } : value);
        setDialog("reauth");
      } else setError(passkeyMessage(cause));
    } finally { setBusy(""); }
  }

  async function confirmSignIn(method: "password" | "passkey") {
    if (busy) return;
    setBusy(method); setError("");
    try {
      if (method === "password") {
        await api("/auth/reauthenticate", { method: "POST", body: JSON.stringify({ password }) });
      } else {
        const { options } = await api<{ options: PublicKeyCredentialRequestOptionsJSON }>("/auth/passkeys/reauthenticate/options", { method: "POST", body: "{}" });
        const response = await startAuthentication({ optionsJSON: options });
        await api("/auth/passkeys/reauthenticate/verify", { method: "POST", body: JSON.stringify({ response }) });
      }
      setPassword("");
      await session.reload();
      await refresh();
      setError("");
      if (pending?.kind === "link") {
        await beginOAuth(pending.provider, "link", "/app/settings");
      } else {
        setDialog(pending?.kind === "remove" ? "remove" : "register");
        setNotice("Sign-in confirmed. Continue with your change.");
      }
    } catch (cause) { setError(passkeyMessage(cause)); }
    finally { setBusy(""); }
  }

  async function providerSignIn(provider: AuthProvider) {
    if (busy) return;
    setBusy(provider); setError("");
    try { await beginOAuth(provider, "login", "/app/settings"); }
    catch (cause) { setError(messageFor(cause)); setBusy(""); }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (dialog === "reauth") void confirmSignIn("password");
    else if (pending) void perform(pending);
  }

  if (loadError) return <section aria-label="Sign-in and security" className="space-y-4">
    <h2 className="t-h2 text-ink">Sign-in and security</h2>
    <Alert tone="danger" title="Couldn't load sign-in methods">{loadError}</Alert>
    <Button variant="outline" loading={busy === "retry"} onClick={async () => {
      setBusy("retry");
      try { await refresh(); setLoadError(""); } catch (cause) { setLoadError(messageFor(cause)); }
      finally { setBusy(""); }
    }}>Try again</Button>
  </section>;

  if (!security || !config) return <section aria-label="Loading sign-in methods"><SkeletonRows rows={2} /></section>;

  const canUsePasskeys = config.methods.passkeys && supported;
  const providerNames = { google: "Google", apple: "Apple" };
  return <section aria-labelledby="account-security-title" className="space-y-6">
    <div>
      <h2 id="account-security-title" className="t-h2 text-ink">Sign-in and security</h2>
      <p className="t-small mt-1 text-ink-2">Choose how you sign in to your Slate account.</p>
    </div>
    {!dialog && (error || callbackError) && <Alert tone="danger" title="Couldn't complete this change">{error || callbackError}</Alert>}
    {notice && <Alert tone="success">{notice}</Alert>}
    <div className="divide-y divide-line border-y border-line">
      {security.hasPassword && <div className="flex items-center justify-between gap-4 py-5">
        <div className="flex items-center gap-3"><KeyRound className="size-5 shrink-0 text-ink-2" aria-hidden="true" /><span className="t-body font-medium text-ink">Password</span></div>
        <span className="t-small text-ink-2">Active</span>
      </div>}
      {(["google", "apple"] as const).map(provider => {
        const connected = security.identities.includes(provider);
        const available = config.methods[provider];
        return <div key={provider} className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div className="flex min-w-0 items-center gap-3">
            {provider === "google" ? <GoogleMark /> : <AppleMark />}
            <div><h3 className="t-body font-medium text-ink">{providerNames[provider]}</h3>
              <p className="t-small mt-1 text-ink-2">{connected ? "Connected to your account" : available ? "Use this account to sign in" : `${providerNames[provider]} sign-in is not connected to Slate yet.`}</p>
            </div>
          </div>
          {connected ? <span className="t-small flex items-center gap-1.5 text-ink-2"><Check className="size-4" aria-hidden="true" />Connected</span> : <Button variant="outline" disabled={!available || !!busy} loading={busy === "link" && pending?.kind === "link" && pending.provider === provider} onClick={() => void perform({ kind: "link", provider })}>Connect {providerNames[provider]}</Button>}
        </div>;
      })}
    </div>
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl"><h3 className="t-h3 text-ink">Your passkeys</h3><p className="t-small mt-1 text-ink-2">Sign in with your device's fingerprint, Face ID or PIN. Slate never receives your biometric data.</p></div>
        <Button variant="secondary" leading={<Fingerprint className="size-4" aria-hidden="true" />} disabled={!canUsePasskeys || !!busy || security.passkeys.length >= 10} onClick={() => openDialog("register")}>Add passkey</Button>
      </div>
      {!canUsePasskeys && <p className="t-small text-ink-2">{config.methods.passkeys ? "This browser does not support passkeys. Try a current browser on a supported device." : "Passkeys are unavailable on this connection. Use a secure connection to add one."}</p>}
      {security.passkeys.length ? <ul className="divide-y divide-line border-t border-line">{security.passkeys.map(passkey => <li key={passkey.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="min-w-0"><p className="t-body break-words font-medium text-ink">{passkey.name}</p><p className="t-small mt-1 text-ink-2">Added {new Date(passkey.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</p></div>
        <Button variant="ghost" disabled={!!busy} aria-label={`Remove passkey ${passkey.name}`} onClick={() => openDialog("remove", passkey)}>Remove</Button>
      </li>)}</ul> : <p className="t-small rounded-md bg-sunken px-4 py-4 text-ink-2">No passkeys saved. Add one on a device you trust.</p>}
      {security.passkeys.length >= 10 && <p className="t-small text-ink-2">You have 10 passkeys. Remove an old passkey before adding another.</p>}
    </div>
    <Modal open={dialog !== null} onClose={closeDialog} title={dialog === "register" ? "Add a passkey" : dialog === "remove" ? "Remove this passkey?" : "Confirm your sign-in"} description={dialog === "reauth" ? "Confirm it's you before changing your sign-in methods." : undefined} size="sm">
      <div className="space-y-4 pb-3">
        {error && <Alert tone="danger" title="Couldn't continue">{error}</Alert>}
        {dialog === "register" && <form onSubmit={submit} className="space-y-5">
          <Input label="Passkey name" value={name} onChange={event => setName(event.target.value)} required minLength={1} maxLength={80} autoComplete="off" placeholder="For example, my phone" hint="Choose a name to help you recognise it later." disabled={!!busy} />
          <p className="t-small text-ink-2">Your device will ask you to confirm. The options depend on your device and passkey provider.</p>
          <div className="flex flex-wrap justify-end gap-2"><Button variant="ghost" disabled={!!busy} onClick={closeDialog}>Cancel</Button><Button type="submit" loading={busy === "register"} disabled={!name.trim() || !!busy}>Create passkey</Button></div>
        </form>}
        {dialog === "remove" && pending?.kind === "remove" && <>
          <p className="t-body break-words text-ink-2">You will no longer be able to sign in with <strong className="font-medium text-ink">{pending.passkey.name}</strong>. Your other sign-in methods will stay available.</p>
          <div className="flex flex-wrap justify-end gap-2"><Button variant="ghost" disabled={!!busy} onClick={closeDialog}>Keep passkey</Button><Button variant="destructive" loading={busy === "remove"} disabled={!!busy} onClick={() => void perform(pending)}>Remove passkey</Button></div>
        </>}
        {dialog === "reauth" && <div className="space-y-5">
          {security.hasPassword && <form onSubmit={submit} className="space-y-4"><Input label="Current password" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required minLength={12} maxLength={128} disabled={!!busy} /><Button type="submit" block loading={busy === "password"} disabled={!!busy}>Confirm with password</Button></form>}
          {security.passkeys.length > 0 && canUsePasskeys && <Button variant="outline" block leading={<Fingerprint className="size-4" aria-hidden="true" />} loading={busy === "passkey"} disabled={!!busy} onClick={() => void confirmSignIn("passkey")}>Confirm with passkey</Button>}
          {security.identities.filter(provider => config.methods[provider]).map(provider => <Button key={provider} variant="outline" block leading={provider === "google" ? <GoogleMark /> : <AppleMark />} loading={busy === provider} disabled={!!busy} onClick={() => void providerSignIn(provider)}>Continue with {providerNames[provider]}</Button>)}
          {security.identities.some(provider => config.methods[provider]) && <p className="t-small text-ink-2">After signing in, return here and choose your change again.</p>}
          {!security.hasPassword && !(security.passkeys.length > 0 && canUsePasskeys) && !security.identities.some(provider => config.methods[provider]) && <p className="t-small text-ink-2">Sign out and sign in again before changing your sign-in methods.</p>}
          <Button variant="ghost" block disabled={!!busy} onClick={closeDialog}>Cancel</Button>
        </div>}
      </div>
    </Modal>
  </section>;
}

export function AccountSecurity() {
  const { account } = useSession();
  return account ? <SecuritySettings key={account.id} /> : null;
}
