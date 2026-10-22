import { useCallback, useEffect, useId, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { ArrowRight, CalendarDays, Check, ChevronDown, MapPin, MessageSquare, Package, Plus, Truck } from "lucide-react";
import { Alert, Badge, Button, ButtonLink, Checkbox, DatePicker, EmptyState, Input, List, ListRow, Modal, Page, PageHeader as BasePageHeader, Panel, Ref, Select, SkeletonRows, Textarea } from "@/components/ui";
import { api, messageFor } from "@/lib/api";
import { AccountSecurity } from "@/components/auth/AccountSecurity";
import { formatNaira } from "@/lib/format";
import { useSession } from "@/lib/session";
import { services } from "@/lib/service-catalog";
import { BOOKING_SERVICES, BOOKING_AREAS, type Booking, type BookingInput, type SupportTicket, type TicketInput } from "../../../server/contracts";

function PageHeader(props: ComponentProps<typeof BasePageHeader>) {
  return <BasePageHeader eyebrow="Your Slate account · Uyo" {...props} />;
}
const serviceDescriptions: Record<string, string> = {
  "svc-home-weekly": "Regular household waste from your address.",
  "svc-home-lite": "A smaller household collection plan.",
  "svc-bulk": "Furniture, appliances and other large items. Tell us what needs moving.",
  "svc-recycling": "Separated bottles, paper and other recoverable materials. Ask about accepted items.",
  "svc-special": "Items that need collection advice before booking.",
  "svc-event": "Collection for event venues before or after guests leave.",
};

const dateLabel = (value: string) => new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const afterDays = (days: number) => { const date = new Date(`${today()}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10); };
const windowLabel = (window: string) => window === "morning" ? "Morning, 7 am to noon" : "Afternoon, noon to 5 pm";
const statusLabel = (status: Booking["status"]) => status === "requested" ? "Awaiting review" : "Cancelled";

function useRequestKey() {
  const request = useRef({ payload: "", key: "" });
  return { forPayload: (body: unknown) => {
    const payload = JSON.stringify(body);
    if (request.current.payload !== payload) request.current = { payload, key: crypto.randomUUID() };
    return request.current.key;
  }, reset: () => { request.current = { payload: "", key: "" }; } };
}

function Failure({ error, retry }: { error: string; retry: () => void }) {
  return <Alert tone="danger" title="Couldn't load your account" action={<Button size="sm" variant="outline" onClick={retry}>Try again</Button>}>{error}</Alert>;
}
function useAccountRecord<T>(path: string, field: string) {
  const [record, setRecord] = useState<T>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const revision = useRef(0);
  const reload = useCallback(async () => {
    const current = ++revision.current;
    setLoading(true); setError("");
    try {
      const result = await api<Record<string, T>>(path);
      if (current === revision.current) setRecord(result[field]);
    } catch (cause) { if (current === revision.current) { setError(messageFor(cause)); setRecord(undefined); } }
    finally { if (current === revision.current) setLoading(false); }
  }, [path, field]);
  useEffect(() => { void reload(); return () => { revision.current++; }; }, [reload]);
  return { record, error, loading, reload };
}
function BookingRecord({ id, onUpdated }: { id: string; onUpdated: () => void }) {
  const { record, error, loading, reload } = useAccountRecord<Booking>(`/bookings/${encodeURIComponent(id)}`, "booking");
  if (loading) return <Page><SkeletonRows rows={3} /></Page>;
  if (error || !record) return <Page><Alert tone="danger" title="Couldn't open this request">{error || "The request could not be found."}</Alert><ButtonLink to="/app/pickups">All requests</ButtonLink></Page>;
  return <BookingDetail booking={record} onUpdated={() => { void reload(); onUpdated(); }} />;
}
function TicketRecord({ id }: { id: string }) {
  const { record: ticket, error, loading } = useAccountRecord<SupportTicket>(`/tickets/${encodeURIComponent(id)}`, "ticket");
  if (loading) return <Page><SkeletonRows rows={3} /></Page>;
  return <Page><PageHeader title={ticket?.subject ?? "Message not found"} description={ticket?.reference} actions={<ButtonLink to="/app/support" variant="secondary">All messages</ButtonLink>} />{ticket ? <Panel><Badge tone="info">Open</Badge><p className="t-body mt-5 whitespace-pre-wrap break-words text-ink">{ticket.message}</p><p className="t-small mt-6 text-ink-3">Saved {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(ticket.createdAt))} WAT</p></Panel> : <Alert tone="danger">{error || "This message is not on your account."}</Alert>}</Page>;
}
function BookingRows({ bookings }: { bookings: Booking[] }) {
  return <List>{bookings.map(booking => <ListRow key={booking.id} to={`/app/pickups/${booking.id}`} leading={<span className="flex size-11 items-center justify-center rounded-md bg-sunken text-ink-2"><Truck className="size-5" /></span>} title={booking.serviceName} subtitle={`${dateLabel(booking.date)} · ${booking.area}`} trailing={<Badge tone={booking.status === "cancelled" ? "neutral" : "info"}>{statusLabel(booking.status)}</Badge>} />)}</List>;
}
function NoBookings() {
  return <EmptyState title="Your first collection starts here" description="Choose a service and tell us where to collect. The team will review your request and confirm availability." action={<ButtonLink to="/app/book" leading={<Plus className="size-4" />}>Request a collection</ButtonLink>} />;
}
function Overview({ bookings, tickets }: { bookings: Booking[]; tickets: SupportTicket[] }) {
  const { user } = useSession();
  const next = bookings.filter(booking => booking.status === "requested").sort((a, b) => a.date.localeCompare(b.date))[0];
  return <Page className="gap-8">
    <PageHeader title="Your collections" description={`Collection requests and support for ${user.name}.`} />
    <section className="relative overflow-hidden rounded-xl bg-slate px-6 py-8 text-slate-ink sm:px-9 sm:py-10">
      <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div><p className="t-small text-slate-ink/70">{next ? "Next requested collection" : "Collection, without the chase"}</p><h2 className="mt-4 font-display text-[38px] font-bold leading-[1.05] tracking-[-.035em] sm:text-[56px]">{next ? dateLabel(next.date) : "Start with your address."}</h2><p className="t-body mt-4 max-w-xl text-slate-ink/80">{next ? `${next.serviceName} at ${next.address}. Your preferred window is ${windowLabel(next.window).toLowerCase()}.` : "Tell us your address and preferred day. Follow every request here, with one place to ask for help."}</p></div>
        {next ? <ButtonLink to={`/app/pickups/${next.id}`} variant="signal" trailing={<ArrowRight className="size-4" />}>View request</ButtonLink> : <div className="flex size-16 items-center justify-center rounded-lg bg-white/10"><Truck className="size-8" /></div>}
      </div>
    </section>
    {next && <Alert tone="info" title="Awaiting review">Your preferred date is a request. Collection is confirmed after the team reviews route availability and price.</Alert>}
    <div className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
      <section><div className="mb-4 flex items-center justify-between gap-3"><h2 className="t-h2 text-ink">Recent requests</h2><Link to="/app/pickups" className="t-small font-medium text-ink underline underline-offset-4">View all</Link></div>{bookings.length ? <BookingRows bookings={bookings.slice(0, 5)} /> : <NoBookings />}</section>
      <aside className="rounded-lg bg-sunken p-6"><MessageSquare className="size-6 text-ink-2" /><h2 className="t-h2 mt-5 text-ink">Need a hand?</h2><p className="t-body mt-2 text-ink-2">{tickets.length ? `${tickets.length} support ${tickets.length === 1 ? "request" : "requests"} on your account. Keep the reference when you contact the team.` : "Ask about a collection, your address or a service. Your message stays with your account."}</p><ButtonLink to="/app/support" variant="secondary" className="mt-6" trailing={<ArrowRight className="size-4" />}>Contact support</ButtonLink></aside>
    </div>
  </Page>;
}
function RequestCollection({ onSaved }: { onSaved: (booking: Booking) => void }) {
  const [params] = useSearchParams();
  const preselected = BOOKING_SERVICES.some(service => service.id === params.get("service")) ? params.get("service")! : BOOKING_SERVICES[0].id;
  const [draft, setDraft] = useState<BookingInput>({ serviceId: preselected, address: "", area: "", date: "", window: "morning", notes: "" });
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [error, setError] = useState("");
  const keyFor = useRequestKey();
  const change = (patch: Partial<BookingInput>) => { setDraft(value => ({ ...value, ...patch })); setError(""); };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    if (!draft.date || !agreed) { setError("Choose a date and confirm that this is a request for review."); return; }
    locked.current = true; setBusy(true); setError("");
    try {
      const body = { ...draft, address: draft.address.trim(), notes: draft.notes?.trim() };
      const result = await api<{ booking: Booking }>("/bookings", { method: "POST", headers: { "Idempotency-Key": keyFor.forPayload(body) }, body: JSON.stringify(body) });
      onSaved(result.booking);
    } catch (cause) { setError(messageFor(cause)); }
    finally { setBusy(false); locked.current = false; }
  }
  return <Page>
    <PageHeader title="Request a collection" description="Tell us what you need. We will review the route, price and date before confirming." />
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
      <form onSubmit={submit} className="flex max-w-2xl flex-col gap-5">
        {error && <Alert tone="danger" title="Couldn't save this request">{error}</Alert>}
        <ServicePicker value={draft.serviceId} onChange={serviceId => change({ serviceId })} />
        <Input label="Collection address" autoComplete="street-address" required minLength={8} maxLength={300} placeholder="House number, street and landmark" value={draft.address} onChange={event => change({ address: event.target.value })} />
        <Select label="Area in Uyo" placeholder="Choose your area" options={[...BOOKING_AREAS]} value={draft.area} onChange={event => change({ area: event.target.value })} required />
        <div className="grid gap-5 sm:grid-cols-2">
          <DatePicker label="Preferred date" value={draft.date} onChange={date => change({ date })} min={afterDays(1)} max={afterDays(90)} required hint="Choose a date within the next 90 days." />
          <Select label="Preferred window" value={draft.window} onChange={event => change({ window: event.target.value as BookingInput["window"] })} options={[{ value: "morning", label: "Morning, 7 am to noon" }, { value: "afternoon", label: "Afternoon, noon to 5 pm" }]} />
        </div>
        <Textarea label="Notes for the collection team" optional maxLength={2000} rows={4} value={draft.notes} onChange={event => change({ notes: event.target.value })} placeholder="Waste type, access instructions or items to collect" />
        <Checkbox checked={agreed} onChange={setAgreed} label="I understand that availability and price need to be confirmed." />
        <Button type="submit" size="lg" loading={busy} trailing={<ArrowRight className="size-4" />}>Send request</Button>
      </form>
      <aside className="h-fit rounded-lg bg-sunken p-6"><CalendarDays className="size-6 text-ink-2" /><h2 className="t-h2 mt-5 text-ink">What happens next</h2><ol className="mt-4 list-decimal space-y-4 pl-5 t-body text-ink-2"><li>Your request is saved with a reference.</li><li>The team reviews coverage and collection capacity.</li><li>Availability and price are confirmed before any collection or payment.</li></ol><p className="t-small mt-6 text-ink-2">You can cancel a pending request from its details.</p></aside>
    </div>
  </Page>;
}
function BookingDetail({ booking, onUpdated }: { booking: Booking; onUpdated: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function cancel() {
    setBusy(true); setError("");
    try { await api(`/bookings/${booking.id}`, { method: "PATCH", body: JSON.stringify({ status: "cancelled" }) }); setConfirm(false); onUpdated(); }
    catch (cause) { setError(messageFor(cause)); }
    finally { setBusy(false); }
  }
  return <Page>
    <PageHeader title={booking.serviceName} description={booking.reference} actions={<ButtonLink to="/app/pickups" variant="secondary">All requests</ButtonLink>} />
    <Alert tone={booking.status === "cancelled" ? "neutral" : "info"} title={statusLabel(booking.status)}>{booking.status === "cancelled" ? "This request has been cancelled. No payment was taken." : "The team needs to confirm route availability and price. Your preferred date is not a confirmed collection."}</Alert>
    <Panel><dl className="grid gap-6 sm:grid-cols-2">{[["Reference", booking.reference], ["Preferred date", dateLabel(booking.date)], ["Window", windowLabel(booking.window)], ["Area", booking.area], ["Address", booking.address], ["Notes", booking.notes || "No additional notes"]].map(([label, value]) => <div key={label}><dt className="t-small text-ink-3">{label}</dt><dd className="t-body mt-1 break-words font-medium text-ink">{value}</dd></div>)}</dl></Panel>
    <div className="flex flex-wrap gap-3"><ButtonLink to={`/app/support?booking=${booking.id}`} leading={<MessageSquare className="size-4" />}>Ask about this request</ButtonLink>{booking.status === "requested" && <Button variant="outline" onClick={() => setConfirm(true)}>Cancel request</Button>}</div>
    <Modal open={confirm} onClose={() => !busy && setConfirm(false)} title="Cancel this request?" description="The collection team will see that you no longer need this request." footer={<><Button variant="ghost" disabled={busy} onClick={() => setConfirm(false)}>Keep request</Button><Button variant="destructive" loading={busy} onClick={cancel}>Cancel request</Button></>}>
      {error && <Alert tone="danger">{error}</Alert>}<p className="t-body py-3 text-ink-2">{booking.serviceName} · {dateLabel(booking.date)}<br />{booking.address}</p>
    </Modal>
  </Page>;
}
function Support({ tickets, bookings, onSaved }: { tickets: SupportTicket[]; bookings: Booking[]; onSaved: () => void }) {
  const [params] = useSearchParams();
  const linkedId = params.get("booking") ?? "";
  const listedBooking = bookings.some(booking => booking.id === linkedId);
  const [linkedBooking, setLinkedBooking] = useState<Booking>();
  const [linkLoading, setLinkLoading] = useState(!!linkedId && !listedBooking);
  const [draft, setDraft] = useState<TicketInput>({ subject: "", message: "", bookingId: linkedId });
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const keyFor = useRequestKey();
  useEffect(() => {
    if (!linkedId || listedBooking) return;
    let current = true;
    setLinkLoading(true);
    api<{ booking: Booking }>(`/bookings/${encodeURIComponent(linkedId)}`).then(result => {
      if (current) setLinkedBooking(result.booking);
    }).catch(cause => {
      if (current) { setError(messageFor(cause)); setDraft(value => ({ ...value, bookingId: "" })); }
    }).finally(() => { if (current) setLinkLoading(false); });
    return () => { current = false; };
  }, [linkedId, listedBooking]);
  const availableBookings = linkedBooking && !listedBooking ? [...bookings, linkedBooking] : bookings;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (locked.current) return;
    locked.current = true; setBusy(true); setError(""); setSaved("");
    try {
      const body = { subject: draft.subject.trim(), message: draft.message.trim(), ...(draft.bookingId ? { bookingId: draft.bookingId } : {}) };
      const result = await api<{ ticket: SupportTicket }>("/tickets", { method: "POST", headers: { "Idempotency-Key": keyFor.forPayload(body) }, body: JSON.stringify(body) });
      keyFor.reset(); setSaved(result.ticket.reference); setDraft({ subject: "", message: "", bookingId: "" }); onSaved();
    } catch (cause) { setError(messageFor(cause)); }
    finally { setBusy(false); locked.current = false; }
  }
  return <Page>
    <PageHeader title="Talk to Slate" description="Tell us what happened. Your message is saved with your account." />
    <div className="grid gap-8 xl:grid-cols-2"><form onSubmit={submit} className="flex flex-col gap-5">
      {error && <Alert tone="danger" title="Couldn't send your message">{error}</Alert>}
      {saved && <Alert tone="success" title="Message saved">Your support reference is <Ref>{saved}</Ref>. The team can use this to find your message.</Alert>}
      <Input label="Subject" required minLength={5} maxLength={160} value={draft.subject} onChange={event => setDraft(value => ({ ...value, subject: event.target.value }))} placeholder="What do you need help with?" />
      <Select label="Collection request" optional disabled={linkLoading} placeholder={linkLoading ? "Loading collection request" : "General question"} value={draft.bookingId} onChange={event => setDraft(value => ({ ...value, bookingId: event.target.value }))} options={availableBookings.map(booking => ({ value: booking.id, label: `${booking.reference} · ${booking.serviceName}` }))} />
      <Textarea label="Your message" required minLength={10} maxLength={4000} rows={6} value={draft.message} onChange={event => setDraft(value => ({ ...value, message: event.target.value }))} hint="Include the details we need. Please leave out card details and passwords." />
      <Button type="submit" loading={busy} disabled={linkLoading}>Send message</Button>
    </form><section><h2 className="t-h2 mb-4 text-ink">Your messages</h2>{tickets.length ? <List>{tickets.map(ticket => <ListRow key={ticket.id} to={`/app/complaints/${ticket.id}`} title={ticket.subject} subtitle={ticket.reference} trailing={<Badge tone="info">Open</Badge>} />)}</List> : <EmptyState title="No messages yet" description="Messages you send here will appear in this list." />}</section></div>
  </Page>;
}
const collectionSchedules: Record<string, string> = {
  Weekly: "1 collection per week",
  "Twice weekly": "2 collections per week",
  Monthly: "1 collection per month",
  "One-time": "One-time collection",
};
function ServicePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const available = services.filter(service => BOOKING_SERVICES.some(booking => booking.id === service.id));
  const selected = available.find(service => service.id === value)!;
  return <div className="request-service-field">
    <label id={`${id}-label`} htmlFor={id} className="t-small font-medium text-ink">Service</label>
    <button
      id={id}
      type="button"
      className="request-service-trigger"
      aria-labelledby={`${id}-label ${id}-value`}
      aria-describedby={`${id}-summary`}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => setOpen(true)}
    >
      <span className="min-w-0">
        <span id={`${id}-value`} className="request-service-value">{selected.name}</span>
        <span id={`${id}-summary`} className="request-service-summary" aria-live="polite"><span>From {formatNaira(selected.priceFrom)}{selected.priceUnit}</span><span className="request-service-summary-separator"> · </span><span>{collectionSchedules[selected.frequency] ?? selected.frequency}</span></span>
      </span>
      <ChevronDown className="size-5 shrink-0 text-ink-2" aria-hidden="true" />
    </button>
    <Modal open={open} onClose={() => setOpen(false)} title="Choose a service" description="Compare starting prices and collection frequency." className="request-service-dialog" footer={<p className="request-service-note">The team confirms the final price before collection.</p>}>
      <ul className="request-service-options">
        {available.map(service => <li key={service.id}>
          <button type="button" className="request-service-option" aria-pressed={service.id === value} onClick={() => { onChange(service.id); setOpen(false); }}>
            <span className="request-service-check" aria-hidden="true">{service.id === value && <Check className="size-3.5" />}</span>
            <span className="request-service-copy">
              <span className="request-service-name">{service.name}</span>
              <span className="request-service-frequency">{collectionSchedules[service.frequency] ?? service.frequency}</span>
            </span>
            <span className="request-service-price">
              <span className="request-service-from">From</span>
              <span>{formatNaira(service.priceFrom)}</span>
              <span className="request-service-unit">{service.priceUnit}</span>
            </span>
          </button>
        </li>)}
      </ul>
    </Modal>
  </div>;
}
function Services() {
  const householdServices = services.filter(service => BOOKING_SERVICES.some(bookingService => bookingService.id === service.id));
  return <Page>
    <PageHeader title="Services for your home" description="Compare starting prices and collection frequency in Uyo. Your final price, schedule and availability are confirmed after review." />
    <div className="account-services grid gap-4 md:grid-cols-2">
      {householdServices.map(service => <Panel key={service.id}>
        <Package className="size-6 text-ink-2" aria-hidden="true" />
        <h2 className="t-h2 text-ink">{service.name}</h2>
        <p className="t-body text-ink-2">{serviceDescriptions[service.id]}</p>
        <dl className="account-service-details">
          <div>
            <dt className="t-small text-ink-2">Starting price</dt>
            <dd className="mt-2 flex flex-wrap items-baseline gap-x-1 gap-y-1 text-ink">
              <span className="font-display text-[28px] font-bold leading-none tracking-tight tnum">{formatNaira(service.priceFrom)}</span>
              <span className="t-small text-ink-2">{service.priceUnit}</span>
            </dd>
          </div>
          <div>
            <dt className="t-small text-ink-2">Collection frequency</dt>
            <dd className="t-body mt-2 font-medium text-ink">{collectionSchedules[service.frequency] ?? service.frequency}</dd>
          </div>
        </dl>
        {service.pricingModel === "Quote" && <p className="t-small text-ink-2">Final quote confirmed after review.</p>}
        <ButtonLink to={`/app/book?service=${service.id}`} variant="secondary" trailing={<ArrowRight className="size-4" />} aria-label={`Request this service: ${service.name}`}>Request this service</ButtonLink>
      </Panel>)}
    </div>
  </Page>;
}
function AccountDetails() {
  const { account, theme, setTheme } = useSession();
  return <Page><PageHeader title="Your account" description="The details used for your collection requests." /><Panel><dl className="grid gap-6 sm:grid-cols-2">{[["Name", account!.name], ["Email", account!.email], ["Phone", account!.phone], ["Account", "Household"]].map(([label, value]) => <div key={label}><dt className="t-small text-ink-3">{label}</dt><dd className="t-body mt-1 break-words font-medium text-ink">{value}</dd></div>)}</dl></Panel><AccountSecurity /><section className="flex flex-wrap items-center justify-between gap-5 rounded-lg bg-sunken p-6"><div><h2 className="t-h3 text-ink">Appearance</h2><p className="t-small mt-1 text-ink-2">Choose a comfortable theme for this device.</p></div><Button variant="secondary" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>Use {theme === "dark" ? "light" : "dark"} theme</Button></section><p className="t-body text-ink-2">Need to update your details? <Link to="/app/support" className="font-medium text-ink underline underline-offset-4">Contact support</Link>.</p></Page>;
}
function Unavailable({ title, children }: { title: string; children: ReactNode }) {
  return <Page><PageHeader title={title} /><Panel><div className="max-w-xl py-6"><h2 className="t-h2 text-ink">Available after service confirmation</h2><p className="t-body mt-3 text-ink-2">{children}</p><div className="mt-6 flex flex-wrap gap-3"><ButtonLink to="/app/book">Request a collection</ButtonLink><ButtonLink to="/app/support" variant="secondary">Ask the team</ButtonLink></div></div></Panel></Page>;
}
export function AccountPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    setError("");
    try {
      const [collection, support] = await Promise.all([api<{ bookings: Booking[] }>("/bookings"), api<{ tickets: SupportTicket[] }>("/tickets")]);
      setBookings(collection.bookings); setTickets(support.tickets);
    } catch (cause) { setError(messageFor(cause)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  if (loading) return <Page><SkeletonRows /></Page>;
  if (error) return <Page><Failure error={error} retry={() => void reload()} /></Page>;
  const path = pathname.replace(/\/$/, "");
  if (path === "/app/dashboard") return <Overview bookings={bookings} tickets={tickets} />;
  if (["/app/book", "/app/extra-pickup", "/app/bulk-waste"].includes(path)) return <RequestCollection key={path} onSaved={booking => { setBookings(value => [booking, ...value.filter(item => item.id !== booking.id)]); navigate(`/app/pickups/${booking.id}`); }} />;
  if (path === "/app/pickups") return <Page><PageHeader title="Your collection requests" description="Requests are saved here while the team reviews availability." actions={<ButtonLink to="/app/book" leading={<Plus className="size-4" />}>New request</ButtonLink>} />{bookings.length ? <BookingRows bookings={bookings} /> : <NoBookings />}</Page>;
  if (path.startsWith("/app/pickups/")) {
    return <BookingRecord key={path} id={path.split("/").at(-1)!} onUpdated={() => void reload()} />;
  }
  if (["/app/support", "/app/complaints", "/app/report-missed"].includes(path)) return <Support key={path} tickets={tickets} bookings={bookings} onSaved={() => void reload()} />;
  if (path.startsWith("/app/complaints/")) {
    return <TicketRecord key={path} id={path.split("/").at(-1)!} />;
  }
  if (path === "/app/services" || path.startsWith("/app/services/")) return <Services />;
  if (["/app/profile", "/app/settings"].includes(path)) return <AccountDetails />;
  if (path === "/app/notifications") return <Page><PageHeader title="Account activity" description="Your saved collection requests and support messages." />{bookings.length || tickets.length ? <List>{bookings.slice(0, 10).map(booking => <ListRow key={booking.id} to={`/app/pickups/${booking.id}`} title={`${booking.serviceName}: ${statusLabel(booking.status).toLowerCase()}`} subtitle={booking.reference} leading={<Check className="size-5 text-ink-2" />} />)}{tickets.slice(0, 10).map(ticket => <ListRow key={ticket.id} to={`/app/complaints/${ticket.id}`} title={ticket.subject} subtitle={ticket.reference} leading={<MessageSquare className="size-5 text-ink-2" />} />)}</List> : <EmptyState title="Nothing to catch up on" description="New account activity will appear here after you send a request." />}</Page>;
  if (["/app/payments", "/app/payment-methods", "/app/smart-sweep", "/app/receipts"].includes(path)) return <Unavailable title="Payments and billing">Online payments are not enabled. No card details are collected here, and no payment has been taken. The team will confirm service terms and price before arranging payment.</Unavailable>;
  if (path.startsWith("/app/subscriptions")) return <Unavailable title="Your services">You do not have a confirmed subscription yet. Your collection requests stay in Pickups until the team confirms service.</Unavailable>;
  return <Page><PageHeader title={path.includes("recycling") ? "Recycling in Uyo" : "Neighbourhood services"} description="Ask the team about recovery partners and collection options in your area." /><Panel><MapPin className="size-6 text-ink-2" /><h2 className="t-h2 mt-5 text-ink">Find the right service</h2><p className="t-body mt-3 max-w-xl text-ink-2">Tell us your area and what needs collecting. The team will check availability before you make a commitment.</p><ButtonLink to="/app/support" className="mt-6">Ask about availability</ButtonLink></Panel></Page>;
}
