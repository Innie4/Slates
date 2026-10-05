import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, MailCheck, MessageSquare } from "lucide-react";
import { Button, Input, OTPInput, PhoneInput, Segmented, useToast } from "@/components/ui";
import { AuthHeading, AuthOutcome, DEMO_OTP, DemoHint, formatPhone, isEmail, maskEmail, maskPhone, nationalPhone, useCountdown, wait } from "./_shared";

type Via = "email" | "phone";

/** A5 — Forgot password: send a reset link (email) or code (SMS). */
export default function ForgotPassword() {
  const navigate = useNavigate();
  const toast = useToast();
  const [via, setVia] = useState<Via>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [checking, setChecking] = useState(false);
  const resend = useCountdown(30);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (via === "email" && !isEmail(email)) return setError(email ? "Enter a valid email address, like name@example.com." : "Enter the email on your account.");
    if (via === "phone" && !nationalPhone(phone)) return setError(phone ? "Enter a Nigerian mobile number, like 803 412 7765." : "Enter the mobile number on your account.");
    setError("");
    setLoading(true);
    await wait(900);
    setLoading(false);
    setSent(true);
    resend.restart();
  };

  const target = via === "email" ? maskEmail(email.trim().toLowerCase()) : maskPhone(nationalPhone(phone) ?? "");

  if (sent)
    return (
      <div className="flex flex-col gap-8">
        <AuthOutcome
          icon={via === "email" ? <MailCheck /> : <MessageSquare />}
          title={via === "email" ? "Check your email" : "Enter the code we sent"}
        >
          {via === "email" ? (
            <>
              If an account uses <span className="font-semibold text-ink">{target}</span>, a reset link is on its way. It works once and expires in 30 minutes.
            </>
          ) : (
            <>
              If an account uses <span className="font-semibold text-ink tnum">{formatPhone(nationalPhone(phone)!)}</span>, we've sent a 6-digit reset code by SMS.
            </>
          )}
        </AuthOutcome>

        {via === "phone" ? (
          <form
            className="flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (code.length < 6) return setCodeError("Enter all 6 digits.");
              setChecking(true);
              await wait(700);
              setChecking(false);
              if (code !== DEMO_OTP) {
                setCode("");
                return setCodeError("That code isn't right. Check the latest SMS from SLATE.");
              }
              navigate("/reset-password");
            }}
          >
            <OTPInput value={code} onChange={(v) => { setCode(v); setCodeError(""); }} invalid={!!codeError} autoFocus />
            {codeError && <p className="t-small text-danger" role="alert">{codeError}</p>}
            <Button type="submit" size="lg" block loading={checking}>Continue</Button>
          </form>
        ) : (
          <Button size="lg" block variant="secondary" onClick={() => navigate("/reset-password")}>
            Open the reset link
          </Button>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setCode("");
              setCodeError("");
            }}
            className="t-small font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
          >
            Use a different {via === "email" ? "email" : "number"}
          </button>
          {resend.ready ? (
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                resend.restart();
                toast.success(via === "email" ? "Reset link sent again" : "New code sent", `To ${target}`);
              }}
            >
              Send again
            </Button>
          ) : (
            <span className="t-small text-ink-3 tnum">Send again in {resend.label}</span>
          )}
        </div>
        <DemoHint>{via === "email" ? "“Open the reset link” stands in for the link in the email." : <>The code is <span className="t-mono font-semibold text-ink">{DEMO_OTP}</span>.</>}</DemoHint>
      </div>
    );

  return (
    <div className="flex flex-col gap-8">
      <Link to="/login" className="-mb-2 inline-flex w-fit items-center gap-1.5 t-small font-medium text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" /> Back to sign in
      </Link>
      <AuthHeading title="Reset your password">We'll send you a link by email or a code by SMS. Your pickups and payments aren't affected.</AuthHeading>

      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <Segmented<Via>
          value={via}
          onChange={(v) => {
            setVia(v);
            setError("");
          }}
          options={[
            { value: "email", label: "Email" },
            { value: "phone", label: "Mobile number" },
          ]}
          className="w-full"
        />
        {via === "email" ? (
          <Input
            label="Email on your account"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            autoFocus
            value={email}
            error={error}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
          />
        ) : (
          <PhoneInput
            label="Mobile number on your account"
            autoFocus
            value={phone}
            error={error}
            onChange={(e) => {
              setPhone(e.target.value);
              setError("");
            }}
          />
        )}
        <Button type="submit" size="lg" block loading={loading}>
          {via === "email" ? "Send reset link" : "Send reset code"}
        </Button>
      </form>

      <p className="t-small text-ink-2">
        Can't access your email or phone? Call Slate on <span className="font-medium text-ink tnum">0700 752 8300</span>, Mon–Sat 7:00–19:00, and we'll verify you another way.
      </p>
    </div>
  );
}
