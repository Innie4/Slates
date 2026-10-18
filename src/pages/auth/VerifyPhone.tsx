import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, CheckCircle2, MessageSquare, PhoneCall } from "lucide-react";
import { Button, Modal, OTPInput, PhoneInput, useToast } from "@/components/ui";
import {
  AuthHeading, AuthOutcome, DEMO_OTP, DemoHint, EXPIRED_OTP, SignupProgress, formatPhone, maskPhone, nationalPhone, readDraft, saveDraft,
  useCountdown, wait,
} from "./_shared";

/** A4, Verify mobile number by SMS (or voice call). */
export default function VerifyPhone() {
  const navigate = useNavigate();
  const toast = useToast();
  const [phone, setPhone] = useState(() => readDraft().phone);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [done, setDone] = useState(false);
  const [channel, setChannel] = useState<"SMS" | "voice call">("SMS");
  const [changeOpen, setChangeOpen] = useState(false);
  const [draftPhone, setDraftPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [sending, setSending] = useState<null | "sms" | "voice" | "change">(null);
  const resend = useCountdown(30);

  const verify = async (value = code) => {
    if (value.length < 6) return setError("Enter all 6 digits.");
    setChecking(true);
    await wait(700);
    setChecking(false);
    if (value === EXPIRED_OTP) {
      setCode("");
      return setError("That code has expired. Request a new one below.");
    }
    if (value !== DEMO_OTP) {
      setCode("");
      return setError("That code isn't right. Check the latest message from SLATE and try again.");
    }
    setError("");
    setDone(true);
  };

  useEffect(() => {
    if (code.length === 6 && !checking && !done) verify(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const send = async (via: "sms" | "voice") => {
    setSending(via);
    await wait(700);
    setSending(null);
    setChannel(via === "sms" ? "SMS" : "voice call");
    setCode("");
    setError("");
    resend.restart();
    toast.success(via === "sms" ? "New code sent by SMS" : "Calling you now", via === "sms" ? `To ${maskPhone(phone)}` : `An automated call to ${maskPhone(phone)} will read out your code.`);
  };

  if (done)
    return (
      <div className="flex flex-col gap-8">
        <SignupProgress current={2} />
        <AuthOutcome
          icon={<CheckCircle2 />}
          tone="success"
          title="Phone number confirmed"
          actions={
            <Button size="lg" block trailing={<ArrowRight className="size-4" />} onClick={() => navigate("/account-type")}>
              Choose account type
            </Button>
          }
        >
          <span className="font-semibold text-ink tnum">{formatPhone(phone)}</span> will get pickup reminders and calls from your driver. You can add a second number later in your profile.
        </AuthOutcome>
      </div>
    );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <SignupProgress current={2} />
        <AuthHeading title="Confirm your mobile number">
          We sent a code by {channel} to <span className="font-semibold text-ink tnum">{formatPhone(phone)}</span>.
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
          <label className="t-small font-medium text-ink">Code from SLATE</label>
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
          {checking ? "Checking" : "Confirm number"}
        </Button>
      </form>

      <div className="flex flex-col gap-4 border-t border-line pt-6">
        {resend.ready ? (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" leading={<MessageSquare className="size-4" />} loading={sending === "sms"} onClick={() => send("sms")}>
              Resend SMS
            </Button>
            <Button variant="outline" leading={<PhoneCall className="size-4" />} loading={sending === "voice"} onClick={() => send("voice")}>
              Call me instead
            </Button>
          </div>
        ) : (
          <p className="t-small text-ink-3 tnum" aria-live="polite">
            SMS can take up to a minute on some networks. Resend in {resend.label}.
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setDraftPhone("");
            setPhoneError("");
            setChangeOpen(true);
          }}
          className="w-fit t-small font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
        >
          Change number
        </button>
      </div>

      <DemoHint>
        The code is <span className="t-mono font-semibold text-ink">{DEMO_OTP}</span>.
      </DemoHint>

      <Modal
        open={changeOpen}
        onClose={() => setChangeOpen(false)}
        title="Change mobile number"
        description="Use a number you can answer at 7am on pickup days."
        footer={
          <>
            <Button variant="ghost" onClick={() => setChangeOpen(false)}>Cancel</Button>
            <Button
              loading={sending === "change"}
              onClick={async () => {
                const n = nationalPhone(draftPhone);
                if (!n) return setPhoneError("Enter a Nigerian mobile number, like 803 412 7765.");
                if (n === phone) return setPhoneError("That's the number we already sent the code to.");
                setSending("change");
                await wait(700);
                setSending(null);
                setPhone(n);
                saveDraft({ phone: n });
                setCode("");
                setError("");
                setChannel("SMS");
                resend.restart();
                setChangeOpen(false);
                toast.success("Code sent to your new number", maskPhone(n));
              }}
            >
              Send code
            </Button>
          </>
        }
      >
        <div className="pb-2">
          <PhoneInput
            label="New mobile number"
            autoFocus
            value={draftPhone}
            error={phoneError}
            onChange={(e) => {
              setDraftPhone(e.target.value);
              setPhoneError("");
            }}
          />
        </div>
      </Modal>
    </div>
  );
}
