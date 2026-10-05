import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { CalendarX, CheckCircle2 } from "lucide-react";
import { Button, PasswordInput } from "@/components/ui";
import { AuthHeading, AuthOutcome, PASSWORD_RULES, PasswordChecklist, wait } from "./_shared";

/** A6 — Choose a new password. `?token=expired` shows the expired-link state. */
export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (params.get("token") === "expired")
    return (
      <AuthOutcome
        icon={<CalendarX />}
        tone="warning"
        title="This reset link has expired"
        actions={
          <Button size="lg" block onClick={() => navigate("/forgot-password")}>
            Send a new link
          </Button>
        }
      >
        Reset links work once and last 30 minutes. Your password hasn't changed.
      </AuthOutcome>
    );

  if (done)
    return (
      <AuthOutcome
        icon={<CheckCircle2 />}
        tone="success"
        title="Password updated"
        actions={
          <Button size="lg" block onClick={() => navigate("/login")}>
            Sign in
          </Button>
        }
      >
        We've signed you out on other devices to keep your account safe. Sign in with your new password.
      </AuthOutcome>
    );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    const failing = PASSWORD_RULES.filter((r) => !r.test(password));
    if (!password) next.password = "Create a new password.";
    else if (failing.length) next.password = `Still needed: ${failing.map((r) => r.label.toLowerCase()).join(", ")}.`;
    if (!confirm) next.confirm = "Enter the new password again.";
    else if (confirm !== password) next.confirm = "Passwords don't match.";
    setErrors(next);
    if (next.password || next.confirm) return;
    setLoading(true);
    await wait(1000);
    setLoading(false);
    setDone(true);
  };

  return (
    <div className="flex flex-col gap-8">
      <AuthHeading title="Choose a new password">Use something you don't use for your bank or email.</AuthHeading>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          autoFocus
          value={password}
          error={errors.password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrors((x) => ({ ...x, password: undefined }));
          }}
        />
        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          value={confirm}
          error={errors.confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setErrors((x) => ({ ...x, confirm: undefined }));
          }}
        />
        <div className="rounded-md bg-sunken px-4 py-3.5">
          <p className="mb-2.5 t-micro text-ink-3">Your password needs</p>
          <PasswordChecklist password={password} confirm={confirm} />
        </div>
        <Button type="submit" size="lg" block loading={loading}>
          {loading ? "Updating password" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
