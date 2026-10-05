import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { CalendarX, CheckCircle2, MailOpen, ShieldAlert } from "lucide-react";
import { Button, Input, Modal, OTPInput, useToast } from "@/components/ui";
import {
  AuthHeading, DEMO_OTP, DemoHint, EXPIRED_OTP, ModalBody, SignupProgress, isEmail, maskEmail, readDraft, saveDraft, useCountdown, wait,
} from "./_shared";

const MAX_ATTEMPTS = 3;

/** A3 — Verify email with a 6-digit code. */
export default function VerifyEmail() {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState(() => readDraft().email);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [checking, setChecking] = useState(false);
  const [modal, setModal] = useState<null | "expired" | "locked" | "success" | "change">(null);
  const [newEmail, setNewEmail] = useState("");
  const [newEmailError, setNewEmailError] = useState("");
  const [sending, setSending] = useState(false);
  const resend = useCountdown(30);

  const verify = async (value = code) => {
    if (value.length < 6) return setError("Enter all 6 digits.");
    setChecking(true);
    await wait(700);
    setChecking(false);
    if (value === EXPIRED_OTP) {
      setCode("");
      return setModal("expired");
    }
    if (value !== DEMO_OTP) {
      const n = attempts + 1;
      setAttempts(n);
      setCode("");
      if (n >= MAX_ATTEMPTS) {
        setError("");
        return setModal("locked");
      }
      const left = MAX_ATTEMPTS - n;
      return setError(`That code isn't right. ${left} ${left === 1 ? "attempt" : "attempts"} left.`);
    }
    setError("");
    setModal("success");
  };

  // Verify automatically once six digits are in.
  useEffect(() => {
    if (code.length === 6 && !checking && modal === null) verify(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const sendNew = async (msg = "New code sent") => {
    setSending(true);
    await wait(700);
    setSending(false);
    setAttempts(0);
    setError("");
    setCode("");
    resend.restart();
    setModal(null);
    toast.success(msg, `Check ${maskEmail(email)}. It expires in 10 minutes.`);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <SignupProgress current={1} />
        <AuthHeading title="Check your email">
          We sent a 6-digit code to <span className="font-semibold text-ink">{maskEmail(email)}</span>. It expires in 10 minutes.
        </AuthHeading>
      </div>

      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          verify();
        }}
      >
        <div className="flex flex-col gap-2">
          <label className="t-small font-medium text-ink">Verification code</label>
          <OTPInput
            value={code}
            onChange={(v) => {
              setCode(v);
              if (error) setError("");
            }}
            invalid={!!error}
            autoFocus
          />
          {error && <p className="t-small text-danger" role="alert">{error}</p>}
        </div>
        <Button type="submit" size="lg" block loading={checking} disabled={code.length < 6 && !checking}>
          {checking ? "Checking" : "Verify email"}
        </Button>
      </form>

      <div className="flex flex-col gap-3 border-t border-line pt-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="t-small text-ink-2">Didn't get it? Check spam or promotions.</p>
          {resend.ready ? (
            <Button variant="link" size="sm" loading={sending} onClick={() => sendNew()}>
              Resend code
            </Button>
          ) : (
            <span className="t-small text-ink-3 tnum" aria-live="polite">Resend in {resend.label}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setNewEmail("");
            setNewEmailError("");
            setModal("change");
          }}
          className="w-fit t-small font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
        >
          Change email address
        </button>
      </div>

      <DemoHint>
        The code is <span className="t-mono font-semibold text-ink">{DEMO_OTP}</span>. Enter <span className="t-mono text-ink">{EXPIRED_OTP}</span> to see an expired code, or any wrong code three times to lock.
      </DemoHint>

      {/* Expired */}
      <Modal
        open={modal === "expired"}
        onClose={() => setModal(null)}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>Close</Button>
            <Button loading={sending} onClick={() => sendNew("Fresh code sent")}>Send a new code</Button>
          </>
        }
      >
        <ModalBody icon={<CalendarX />} tone="warning" title="This code has expired">
          Codes last 10 minutes. We'll send a fresh one to {maskEmail(email)} — the old code stops working.
        </ModalBody>
      </Modal>

      {/* Too many attempts */}
      <Modal
        open={modal === "locked"}
        onClose={() => setModal(null)}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>Close</Button>
            <Button loading={sending} onClick={() => sendNew("New code sent")}>Send a new code</Button>
          </>
        }
      >
        <ModalBody icon={<ShieldAlert />} tone="danger" title="Too many attempts">
          You entered {MAX_ATTEMPTS} wrong codes, so this code is locked to protect your account. Request a new code to try again.
        </ModalBody>
      </Modal>

      {/* Success */}
      <Modal
        open={modal === "success"}
        onClose={() => navigate("/verify-phone")}
        size="sm"
        hideClose
        footer={<Button onClick={() => navigate("/verify-phone")}>Continue to phone</Button>}
      >
        <ModalBody icon={<CheckCircle2 />} tone="success" title="Email verified">
          Receipts and service updates will go to {email}. Next, confirm your mobile number so your driver can reach you on pickup days.
        </ModalBody>
      </Modal>

      {/* Change email */}
      <Modal
        open={modal === "change"}
        onClose={() => setModal(null)}
        title="Change email address"
        description="We'll send a new code to this address. The current code stops working."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
            <Button
              loading={sending}
              onClick={async () => {
                if (!isEmail(newEmail)) return setNewEmailError("Enter a valid email address, like name@example.com.");
                if (newEmail.trim().toLowerCase() === email) return setNewEmailError("That's the address we already sent the code to.");
                const v = newEmail.trim().toLowerCase();
                setEmail(v);
                saveDraft({ email: v });
                await sendNew("Code sent to your new address");
              }}
            >
              Send code
            </Button>
          </>
        }
      >
        <div className="pb-2">
          <Input
            label="New email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            value={newEmail}
            error={newEmailError}
            leading={<MailOpen />}
            onChange={(e) => {
              setNewEmail(e.target.value);
              setNewEmailError("");
            }}
          />
        </div>
      </Modal>
    </div>
  );
}
