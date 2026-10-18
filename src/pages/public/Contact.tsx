import { useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { ArrowRight, CheckCircle2, Mail, Phone } from "lucide-react";
import { api, messageFor } from "@/lib/api";
import { Button, ButtonLink, Input, Select, Textarea } from "@/components/ui";

export default function Contact() {
  const [search] = useSearchParams();
  const requestedCategory = search.get("category");
  const initialCategory = ["New service", "Existing service", "Operator partnership", "Proposal", "Waitlist"].includes(requestedCategory ?? "") ? requestedCategory! : requestedCategory === "operator" ? "Operator partnership" : "New service";
  const [category, setCategory] = useState(initialCategory);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const attempt = useRef<{ body: string; key: string } | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const body = JSON.stringify({
      name: String(form.get("name") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
      category,
      message: String(form.get("message") ?? "").trim(),
    });
    if (attempt.current?.body !== body) attempt.current = { body, key: crypto.randomUUID() };
    setBusy(true);
    setError("");
    try {
      const result = await api<{ reference: string }>("/enquiries", { method: "POST", body, headers: { "Idempotency-Key": attempt.current.key } });
      setReference(result.reference);
    } catch (cause) {
      setError(messageFor(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-page py-12 sm:py-16 lg:py-24">
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">
        <div className="flex flex-col items-start gap-6">
          <h1 className="t-display-xl text-ink">Talk to Slate.</h1>
          <p className="max-w-md text-[18px] leading-relaxed text-ink">Tell us where you need collection, ask about a plan, or get help with your service.</p>
          <div className="flex flex-col gap-2 pt-3 text-ink">
            <a href="mailto:hello@slate.ng" className="flex min-h-11 items-center gap-3 hover:underline"><Mail className="size-5" />hello@slate.ng</a>
            <a href="tel:+2347007528300" className="flex min-h-11 items-center gap-3 hover:underline"><Phone className="size-5" />+234 700 752 8300</a>
          </div>
          <div className="mt-4 max-w-md rounded-xl bg-sunken p-6">
            <h2 className="text-[20px] font-semibold text-ink">Already have an account?</h2>
            <p className="mt-2 text-[16px] leading-relaxed text-ink">Sign in to report a missed pickup or track an existing request.</p>
            <Link to="/app/support" className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-ink">Open support <ArrowRight className="size-4" /></Link>
          </div>
        </div>
        <div className="rounded-2xl bg-surface p-6 sm:p-10">
          {reference ? (
            <div role="status" className="flex min-h-96 flex-col items-start justify-center gap-5">
              <CheckCircle2 className="size-10 text-success" />
              <h2 className="t-h1 text-ink">Your message is saved.</h2>
              <p className="text-[17px] leading-relaxed text-ink">Keep reference <strong>{reference}</strong>. The Slate team can use it to find your enquiry.</p>
              <ButtonLink to="/" variant="secondary">Back to home</ButtonLink>
              <Button variant="ghost" onClick={() => { setReference(""); attempt.current = null; }}>Send another message</Button>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-5" aria-label="Contact Slate">
              <h2 className="t-h1 text-ink">How can we help?</h2>
              <Select label="I'm asking about" value={category} onChange={(event) => setCategory(event.target.value)} options={["New service", "Existing service", "Operator partnership", "Proposal", "Waitlist"]} />
              <Input name="name" label="Your name" autoComplete="name" minLength={2} maxLength={120} required />
              <Input name="email" label="Email address" type="email" autoComplete="email" maxLength={254} required />
              <Input name="phone" label="Phone number" type="tel" autoComplete="tel" maxLength={32} optional />
              <Textarea name="message" label="Your message" rows={5} minLength={10} maxLength={4000} placeholder="Include your area and the service you need. Please leave out payment details and passwords." required />
              {error && <p role="alert" className="rounded-md bg-danger-bg p-4 text-[15px] text-danger">{error}</p>}
              <Button type="submit" size="lg" loading={busy} trailing={<ArrowRight className="size-4" />}>Send message</Button>
              <p className="text-[14px] leading-relaxed text-ink-2">We use your details to respond to this enquiry. Read our <Link to="/privacy" className="underline underline-offset-4">privacy policy</Link>.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
