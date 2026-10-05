import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Copy, Download, KeyRound, ShieldCheck } from "lucide-react";
import { Alert, Button, Checkbox, Input, OTPInput, Tabs, useToast } from "@/components/ui";
import { HOME_FOR_ROLE, useSession } from "@/lib/session";
import { AuthHeading, AuthOutcome, DEMO_OTP, DemoHint, maskPhone, readDraft, useCountdown, wait } from "./_shared";

type Method = "sms" | "app" | "backup";

const BACKUP_CODES = ["7KQ4-M2XD", "R9TB-3HVA", "PZ6E-WL8N", "C4JU-Y7GF", "N2MS-K5QR", "H8DW-T3PC", "X6VA-B9LJ", "E3RN-Q7ZK", "U5FY-G2MT", "L9PH-D4WS"];
const SETUP_KEY = "JBSW Y3DP EHPK 3PXP 6Q2M";

/** A8 — Two-step verification at sign-in, plus authenticator and backup-code setup. */
export default function TwoFactor() {
  const [mode, setMode] = useState<"verify" | "setup">("verify");
  return mode === "verify" ? <Verify onSetup={() => setMode("setup")} /> : <Setup onBack={() => setMode("verify")} />;
}

function Verify({ onSetup }: { onSetup: () => void }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { signIn } = useSession();
  const phone = readDraft().phone;
  const [method, setMethod] = useState<Method>("sms");
  const [code, setCode] = useState("");
  const [backup, setBackup] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [used, setUsed] = useState<string[]>([]);
  const resend = useCountdown(30);

  useEffect(() => {
    setCode("");
    setBackup("");
    setError("");
  }, [method]);

  const submit = async () => {
    if (method === "backup") {
      const v = backup.trim().toUpperCase();
      if (!/^[A-Z0-9]{4}-?[A-Z0-9]{4}$/.test(v)) return setError("Backup codes look like 7KQ4-M2XD.");
      setChecking(true);
      await wait(700);
      setChecking(false);
      const norm = v.includes("-") ? v : `${v.slice(0, 4)}-${v.slice(4)}`;
      if (used.includes(norm)) return setError("That backup code has already been used. Each code works once.");
      if (!BACKUP_CODES.includes(norm)) return setError("That backup code isn't right.");
      setUsed((u) => [...u, norm]);
    } else {
      if (code.length < 6) return setError("Enter all 6 digits.");
      setChecking(true);
      await wait(700);
      setChecking(false);
      if (code !== DEMO_OTP) {
        setCode("");
        return setError(method === "app" ? "That code isn't right. Codes change every 30 seconds — use the current one." : "That code isn't right. Check the latest SMS from SLATE.");
      }
    }
    signIn("household");
    if (remember) toast.info("We won't ask for a code on this device for 30 days");
    navigate(HOME_FOR_ROLE.household);
  };

  return (
    <div className="flex flex-col gap-8">
      <AuthHeading title="Two-step verification">Confirm it's you with a second step. This keeps your address and payment history private.</AuthHeading>

      <Tabs<Method>
        value={method}
        onChange={setMethod}
        items={[
          { value: "sms", label: "Text message" },
          { value: "app", label: "Authenticator app" },
          { value: "backup", label: "Backup code" },
        ]}
      />

      <form
        className="-mt-2 flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {method === "sms" && (
          <div className="flex flex-col gap-3">
            <p className="t-body text-ink-2">
              Enter the code we sent to <span className="font-semibold text-ink tnum">{maskPhone(phone)}</span>.
            </p>
            <OTPInput value={code} onChange={(v) => { setCode(v); setError(""); }} invalid={!!error} autoFocus />
            <div className="flex items-center justify-between">
              {error ? <p className="t-small text-danger" role="alert">{error}</p> : <span />}
              {resend.ready ? (
                <Button variant="link" size="sm" onClick={() => { resend.restart(); toast.success("New code sent", maskPhone(phone)); }}>
                  Resend code
                </Button>
              ) : (
                <span className="shrink-0 t-small text-ink-3 tnum">Resend in {resend.label}</span>
              )}
            </div>
          </div>
        )}
        {method === "app" && (
          <div className="flex flex-col gap-3">
            <p className="t-body text-ink-2">Open Google Authenticator, Authy or 1Password and enter the 6-digit code for <span className="font-semibold text-ink">Slate</span>.</p>
            <OTPInput value={code} onChange={(v) => { setCode(v); setError(""); }} invalid={!!error} autoFocus />
            {error && <p className="t-small text-danger" role="alert">{error}</p>}
          </div>
        )}
        {method === "backup" && (
          <Input
            label="Backup code"
            hint="One of the 10 codes you saved when you turned on two-step verification. Each works once."
            placeholder="XXXX-XXXX"
            autoComplete="one-time-code"
            autoFocus
            className="t-mono uppercase tracking-wider"
            leading={<KeyRound />}
            value={backup}
            error={error}
            onChange={(e) => {
              setBackup(e.target.value.toUpperCase());
              setError("");
            }}
          />
        )}

        <Checkbox checked={remember} onChange={setRemember} label="Remember this device for 30 days" description="Only on a phone or computer you don't share." />
        <Button type="submit" size="lg" block loading={checking}>
          {checking ? "Checking" : "Verify and sign in"}
        </Button>
      </form>

      <div className="flex flex-col gap-3 border-t border-line pt-6">
        <p className="t-small text-ink-2">
          Lost your phone and your backup codes? Call Slate on <span className="font-medium text-ink tnum">0700 752 8300</span> — we'll confirm your identity before resetting two-step verification.
        </p>
        <button type="button" onClick={onSetup} className="w-fit t-small font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
          Set up an authenticator app and backup codes
        </button>
      </div>

      <DemoHint>
        Codes: <span className="t-mono font-semibold text-ink">{DEMO_OTP}</span> for text and app, or any backup code from the setup view, like <span className="t-mono text-ink">{BACKUP_CODES[0]}</span>.
      </DemoHint>
    </div>
  );
}

function Setup({ onBack }: { onBack: () => void }) {
  const toast = useToast();
  const [step, setStep] = useState<"scan" | "codes" | "done">("scan");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedError, setSavedError] = useState(false);

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${what} copied`);
    } catch {
      toast.error("Couldn't copy", "Select the text and copy it manually.");
    }
  };

  const download = () => {
    const body = `Slate backup codes for ${readDraft().email}\nGenerated 5 Oct 2026. Each code works once.\n\n${BACKUP_CODES.join("\n")}\n`;
    try {
      const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "slate-backup-codes.txt";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Backup codes downloaded", "slate-backup-codes.txt");
    } catch {
      toast.error("Download didn't start", "Copy the codes instead.");
    }
  };

  if (step === "done")
    return (
      <AuthOutcome
        icon={<ShieldCheck />}
        tone="success"
        title="Two-step verification is on"
        actions={<Button size="lg" block onClick={onBack}>Back to sign-in</Button>}
      >
        Next time you sign in on a new device, we'll ask for a code from your authenticator app. Keep your backup codes somewhere safe and offline.
      </AuthOutcome>
    );

  return (
    <div className="flex flex-col gap-8">
      <button type="button" onClick={step === "codes" ? () => setStep("scan") : onBack} className="-mb-2 inline-flex w-fit items-center gap-1.5 t-small font-medium text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" /> Back
      </button>
      <AuthHeading eyebrow={`Step ${step === "scan" ? 1 : 2} of 2`} title={step === "scan" ? "Connect an authenticator app" : "Save your backup codes"}>
        {step === "scan"
          ? "Scan this code with Google Authenticator, Authy or 1Password, then enter the 6-digit code it shows."
          : "If you lose your phone, each of these codes lets you sign in once. Slate staff will never ask for them."}
      </AuthHeading>

      {step === "scan" ? (
        <form
          className="flex flex-col gap-6"
          onSubmit={async (e) => {
            e.preventDefault();
            if (code.length < 6) return setError("Enter all 6 digits.");
            setChecking(true);
            await wait(700);
            setChecking(false);
            if (code !== DEMO_OTP) {
              setCode("");
              return setError("That code doesn't match. Make sure your phone's time is set automatically.");
            }
            setStep("codes");
          }}
        >
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <QrCode className="size-40 shrink-0 rounded-md border border-line bg-white p-2.5" />
            <div className="flex min-w-0 flex-col gap-2">
              <p className="t-small text-ink-2">Can't scan? Enter this key instead:</p>
              <p className="t-mono break-all text-[15px] text-ink">{SETUP_KEY}</p>
              <Button variant="outline" size="sm" className="w-fit" leading={<Copy className="size-3.5" />} onClick={() => copy(SETUP_KEY.replace(/\s/g, ""), "Setup key")}>
                Copy key
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="t-small font-medium text-ink">Code from your app</label>
            <OTPInput value={code} onChange={(v) => { setCode(v); setError(""); }} invalid={!!error} />
            {error && <p className="t-small text-danger" role="alert">{error}</p>}
          </div>
          <Button type="submit" size="lg" block loading={checking}>Verify and continue</Button>
          <DemoHint>
            Enter <span className="t-mono font-semibold text-ink">{DEMO_OTP}</span>.
          </DemoHint>
        </form>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            <ol className="grid grid-cols-2 gap-px bg-line">
              {BACKUP_CODES.map((c, i) => (
                <li key={c} className="flex items-baseline gap-3 bg-surface px-4 py-3">
                  <span className="t-micro w-4 text-right text-ink-3 tnum">{i + 1}</span>
                  <span className="t-mono text-[15px] tracking-wide text-ink">{c}</span>
                </li>
              ))}
            </ol>
            <div className="grid grid-cols-2 gap-px border-t border-line bg-line">
              <button type="button" onClick={() => copy(BACKUP_CODES.join("\n"), "Backup codes")} className="flex h-12 items-center justify-center gap-2 bg-surface t-small font-medium text-ink hover:bg-sunken">
                <Copy className="size-4" /> Copy all
              </button>
              <button type="button" onClick={download} className="flex h-12 items-center justify-center gap-2 bg-surface t-small font-medium text-ink hover:bg-sunken">
                <Download className="size-4" /> Download .txt
              </button>
            </div>
          </div>
          <Alert tone="warning">Generating new codes later cancels these ones.</Alert>
          <div className="flex flex-col gap-2">
            <Checkbox checked={saved} onChange={(v) => { setSaved(v); setSavedError(false); }} label="I've saved these codes somewhere safe" />
            {savedError && <p className="t-small text-danger" role="alert">Confirm you've saved the codes before finishing.</p>}
          </div>
          <Button size="lg" block onClick={() => (saved ? setStep("done") : setSavedError(true))}>
            Turn on two-step verification
          </Button>
        </div>
      )}
    </div>
  );
}

/** Deterministic illustrative QR code (not scannable). */
function QrCode({ className }: { className?: string }) {
  const N = 25;
  const cells = useMemo(() => {
    let s = 482913;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const out: Array<[number, number]> = [];
    const inFinder = (x: number, y: number) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!inFinder(x, y) && r() > 0.52) out.push([x, y]);
    return out;
  }, []);
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} fill="#111820" />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="#fff" />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="#111820" />
    </g>
  );
  return (
    <svg viewBox={`0 0 ${N} ${N}`} className={className} role="img" aria-label="QR code for your authenticator app" shapeRendering="crispEdges">
      <rect width={N} height={N} fill="#fff" />
      {cells.map(([x, y]) => (
        <rect key={`${x}.${y}`} x={x} y={y} width={1} height={1} fill="#111820" />
      ))}
      {finder(0, 0)}
      {finder(N - 7, 0)}
      {finder(0, N - 7)}
    </svg>
  );
}
