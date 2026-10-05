import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Check, Circle } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { cn } from "@/lib/cn";
import { me } from "@/data";

/* ------------------------------------------------------------------ */
/* Demo constants                                                      */
/* ------------------------------------------------------------------ */

/** The one code that verifies email, phone and two-step sign-in in the demo. */
export const DEMO_OTP = "482913";
/** A code that simulates an expired OTP. */
export const EXPIRED_OTP = "000000";

/* ------------------------------------------------------------------ */
/* Sign-up draft — carried from /signup through verification           */
/* ------------------------------------------------------------------ */

export type SignupAccount = "Residential" | "Business" | "Institution";

export interface SignupDraft {
  name: string;
  email: string;
  phone: string; // national digits, e.g. 8034120951
  account: SignupAccount;
}

const DRAFT_KEY = "slate-signup";
const FALLBACK: SignupDraft = { name: me.household.name, email: me.household.email, phone: "8034120951", account: "Residential" };

export function readDraft(): SignupDraft {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (raw) return { ...FALLBACK, ...(JSON.parse(raw) as Partial<SignupDraft>) };
  } catch {
    /* storage unavailable */
  }
  return FALLBACK;
}

export function saveDraft(patch: Partial<SignupDraft>) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...readDraft(), ...patch }));
  } catch {
    /* storage unavailable */
  }
}

/* ------------------------------------------------------------------ */
/* Validation and formatting                                           */
/* ------------------------------------------------------------------ */

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/** Returns the 10 national digits of a Nigerian mobile number, or null. */
export function nationalPhone(v: string): string | null {
  let d = v.replace(/\D/g, "");
  if (d.startsWith("234")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  return /^[789][01]\d{8}$/.test(d) ? d : null;
}

/** 8034120951 → +234 803 412 0951 */
export const formatPhone = (national: string) => `+234 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;

/** imaobong.akpan@gmail.com → im•••••••••an@gmail.com */
export function maskEmail(email: string) {
  const [user = "", domain = ""] = email.split("@");
  if (user.length <= 3) return `${user[0] ?? ""}•••@${domain}`;
  return `${user.slice(0, 2)}${"•".repeat(Math.min(8, user.length - 4))}${user.slice(-2)}@${domain}`;
}

export const maskPhone = (national: string) => `+234 ••• ••• ${national.slice(-4)}`;

export const PASSWORD_RULES: Array<{ label: string; test: (pw: string) => boolean }> = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "Upper and lower case letters", test: (pw) => /[A-Z]/.test(pw) && /[a-z]/.test(pw) },
  { label: "At least one number", test: (pw) => /\d/.test(pw) },
  { label: "A symbol, or 14 characters or more", test: (pw) => /[^A-Za-z0-9]/.test(pw) || pw.length >= 14 },
];

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

/** Seconds-remaining countdown for "Resend code". */
export function useCountdown(initial: number) {
  const [left, setLeft] = useState(initial);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  const restart = useCallback(() => setLeft(initial), [initial]);
  return { left, restart, ready: left <= 0, label: `0:${String(Math.max(0, left)).padStart(2, "0")}` };
}

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ */
/* Layout pieces                                                       */
/* ------------------------------------------------------------------ */

export function AuthHeading({ eyebrow, title, children, className }: { eyebrow?: ReactNode; title: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <header className={cn("flex flex-col gap-2", className)}>
      {eyebrow && <p className="t-small font-medium text-ink-3">{eyebrow}</p>}
      <h1 className="t-h1 text-ink">{title}</h1>
      {children && <div className="t-body text-ink-2">{children}</div>}
    </header>
  );
}

const SIGNUP_STEPS = ["Account", "Email", "Phone", "Type"];

/** Thin four-part progress for the sign-up journey. */
export function SignupProgress({ current }: { current: number }) {
  return (
    <div className="flex flex-col gap-2" aria-label={`Step ${current + 1} of ${SIGNUP_STEPS.length}: ${SIGNUP_STEPS[current]}`}>
      <div className="flex gap-1.5">
        {SIGNUP_STEPS.map((s, i) => (
          <span key={s} className={cn("h-1 flex-1 rounded-full transition-colors", i < current ? "bg-ink" : i === current ? "bg-signal" : "bg-line")} />
        ))}
      </div>
      <div className="flex justify-between t-micro">
        {SIGNUP_STEPS.map((s, i) => (
          <span key={s} className={cn(i === current ? "font-semibold text-ink" : i < current ? "text-ink-2" : "text-ink-3")}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Dashed box that tells a demo visitor how to drive the flow. Not product copy. */
export function DemoHint({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start gap-2.5 rounded-md border border-dashed border-line-strong px-3.5 py-2.5", className)}>
      <span className="mt-px rounded-[4px] bg-sunken px-1.5 py-0.5 t-micro font-semibold uppercase tracking-wider text-ink-3">Demo</span>
      <p className="t-small text-ink-2">{children}</p>
    </div>
  );
}

/** Left-aligned outcome block used for sent / success states inside the auth column. */
export function AuthOutcome({
  icon,
  tone = "neutral",
  title,
  children,
  actions,
}: {
  icon: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 animate-pop-in">
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-md [&_svg]:size-6",
          tone === "neutral" && "bg-sunken text-ink-2",
          tone === "success" && "bg-success-bg text-success",
          tone === "warning" && "bg-warning-bg text-warning",
          tone === "danger" && "bg-danger-bg text-danger",
        )}
      >
        {icon}
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="t-h1 text-ink">{title}</h1>
        {children && <div className="t-body text-ink-2">{children}</div>}
      </div>
      {actions && <div className="flex flex-col gap-2">{actions}</div>}
    </div>
  );
}

/** Live checklist of password rules. */
export function PasswordChecklist({ password, confirm, className }: { password: string; confirm?: string; className?: string }) {
  const rules = [...PASSWORD_RULES.map((r) => ({ label: r.label, ok: r.test(password) }))];
  if (confirm !== undefined) rules.push({ label: "Both passwords match", ok: !!password && password === confirm });
  return (
    <ul className={cn("grid gap-1.5", className)} aria-live="polite">
      {rules.map((r) => (
        <li key={r.label} className={cn("flex items-center gap-2 t-small transition-colors", r.ok ? "text-ink" : "text-ink-3")}>
          {r.ok ? (
            <span className="flex size-4 items-center justify-center rounded-full bg-success text-white dark:text-slate-950">
              <Check className="size-2.5" strokeWidth={3.5} />
            </span>
          ) : (
            <Circle className="size-4 text-line-strong" strokeWidth={1.75} />
          )}
          {r.label}
          <span className="sr-only">{r.ok ? "met" : "not met"}</span>
        </li>
      ))}
    </ul>
  );
}

/** Icon + title + text body for small outcome modals. */
export function ModalBody({ icon, tone, title, children }: { icon: ReactNode; tone: "success" | "warning" | "danger" | "neutral"; title: string; children: ReactNode }) {
  const tones = { success: "bg-success-bg text-success", warning: "bg-warning-bg text-warning", danger: "bg-danger-bg text-danger", neutral: "bg-sunken text-ink-2" };
  return (
    <div className="flex flex-col gap-3 pb-2 pt-2">
      <span className={cn("flex size-11 items-center justify-center rounded-md [&_svg]:size-5", tones[tone])}>{icon}</span>
      <h2 className="t-h2 text-ink">{title}</h2>
      <p className="t-body text-ink-2">{children}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Terms and privacy summaries                                         */
/* ------------------------------------------------------------------ */

const LEGAL = {
  terms: {
    title: "Terms of service, in short",
    updated: "Updated 1 September 2026",
    points: [
      ["Your contract is with Slate", "You buy collection from Slate Waste Services Ltd, not from the operator. Slate assigns, pays and supervises a verified, contracted operator for your area."],
      ["What we promise", "Collection on your scheduled days and window. If a pickup is missed, Slate sends a crew within 24 hours or credits the visit on your next bill."],
      ["What we need from you", "Waste bagged and at the agreed collection point by 07:00. No hazardous, medical or construction waste in regular bins — book a special collection for those."],
      ["Payments", "Plans are billed monthly in advance through Paystack. Failed payments are retried up to three times before service pauses. You can cancel any time from Subscriptions; the current month is not refunded."],
      ["Complaints", "Report problems in the app. Slate responds within one working day and handles the operator for you."],
    ],
    full: "/terms",
  },
  privacy: {
    title: "Privacy notice, in short",
    updated: "Updated 1 September 2026",
    points: [
      ["What we collect", "Your name, contact details, service address, landmark and payment outcomes. Card details are held by Paystack, never by Slate."],
      ["Who sees it", "Your assigned operator sees your address, landmark and pickup notes — never your payment details. We don't sell your data."],
      ["Location", "Used once during setup to find your address and service zone. We don't track your device."],
      ["Your rights", "Download or delete your data from Settings, or write to privacy@slate.ng. We follow the Nigeria Data Protection Act 2023."],
    ],
    full: "/privacy",
  },
} as const;

export function LegalModal({ kind, open, onClose, onAccept }: { kind: "terms" | "privacy"; open: boolean; onClose: () => void; onAccept?: () => void }) {
  const doc = LEGAL[kind];
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={doc.title}
      description={doc.updated}
      footer={
        <>
          <a href={doc.full} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center rounded-md px-4 text-[14px] font-medium text-ink-2 hover:bg-sunken hover:text-ink">
            Read the full {kind === "terms" ? "terms" : "notice"}
          </a>
          {onAccept ? (
            <Button
              onClick={() => {
                onAccept();
                onClose();
              }}
            >
              I agree
            </Button>
          ) : (
            <Button onClick={onClose}>Close</Button>
          )}
        </>
      }
    >
      <ol className="flex flex-col divide-y divide-line pb-2">
        {doc.points.map(([h, b], i) => (
          <li key={h} className="flex gap-4 py-4 first:pt-1">
            <span className="t-mono w-5 shrink-0 pt-0.5 text-ink-3">{String(i + 1).padStart(2, "0")}</span>
            <div className="flex flex-col gap-1">
              <p className="t-h3 text-ink">{h}</p>
              <p className="t-small text-ink-2">{b}</p>
            </div>
          </li>
        ))}
      </ol>
    </Modal>
  );
}
