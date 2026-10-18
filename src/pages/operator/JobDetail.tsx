import { useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { ArrowRight, Camera, Check, Crosshair, ImageIcon, MapPin, MessageSquare, Navigation, RotateCcw, StickyNote, X } from "lucide-react";
import { CleanSlate } from "@/components/brand/CleanSlate";
import { RouteMap } from "@/components/brand/RouteMap";
import {
  Alert, Badge, Button, ButtonLink, Checkbox, DescriptionList, FileDrop, LiveDot, Modal, Page, PageHeader, Panel, Select, StateView, StatusBadge,
  Textarea, Timeline, useToast, type TimelineItem, type UploadedFile,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { DEMO_NOW, formatDateTime, formatDay, formatTime } from "@/lib/format";
import { FAILURE_REASONS, OPS_CUSTOMERS, SLATE_RELAY, routeById, type Job } from "./_opsData";
import { CAPTURED_AT, CallViaSlate, isLate, isTodayIso, routeStat, updateJob, useJobs } from "./_ops";

/** A clock that starts at the demo's 08:12 and moves with real time. */
function useDemoClock() {
  const mounted = useRef(Date.now());
  return () => new Date(DEMO_NOW.getTime() + (Date.now() - mounted.current) + 60_000);
}

/**
 * G9, a single job, built for a phone in a truck: the state machine's next step is
 * one big button in the thumb zone, evidence is a camera tap, and the customer is
 * reached through Slate's masked number.
 */
export default function JobDetail() {
  const { id = "" } = useParams();
  const jobs = useJobs();
  const job = jobs.find((j) => j.id === id);
  if (!job)
    return (
      <Page>
        <StateView
          state="not-found"
          title="We couldn't find that job"
          description={`${id || "This job"} isn't assigned to Ufok Environmental. It may have been moved to another operator or the reference is wrong.`}
          action={<ButtonLink to="/operator/jobs" variant="secondary">Back to jobs</ButtonLink>}
        />
      </Page>
    );
  return <JobView key={job.id} job={job} jobs={jobs} />;
}

function JobView({ job, jobs }: { job: Job; jobs: Job[] }) {
  const toast = useToast();
  const now = useDemoClock();
  const customer = OPS_CUSTOMERS.find((c) => c.id === job.customerId);
  const route = job.routeId ? routeById(job.routeId) : undefined;
  const stat = route && job.stop && isTodayIso(job.date) ? routeStat(jobs, route.id) : undefined;
  const [photos, setPhotos] = useState<UploadedFile[]>([]);
  const [notes, setNotes] = useState<Array<{ text: string; time: string }>>(job.note ? [{ text: job.note, time: job.failedAt ?? job.date }] : []);
  const [draft, setDraft] = useState("");
  const [sheet, setSheet] = useState<null | "complete" | "fail">(null);
  const late = isLate(job);
  const done = job.status === "Completed";
  const closed = done || job.status === "Failed" || job.status === "Cancelled";

  const stopsAhead = stat ? stat.jobs.filter((j) => j.stop! < job.stop! && ["Scheduled", "En route", "Arrived"].includes(j.status)).length : 0;
  const progress = job.status === "Arrived" ? 0.97 : job.status === "En route" ? 0.82 : Math.max(0.12, 0.74 - stopsAhead * 0.06);

  const act = (patch: Partial<Job>, title: string, description?: string) => {
    updateJob(job.id, patch);
    toast.success(title, description);
    try {
      navigator.vibrate?.(12);
    } catch {
      /* no haptics */
    }
  };

  const timeline: TimelineItem[] = useMemo(() => {
    const items: Array<TimelineItem & { at: string }> = [];
    const assigned = new Date(job.date);
    assigned.setDate(assigned.getDate() - 1);
    assigned.setHours(18, 0, 0, 0);
    items.push({ at: assigned.toISOString(), title: job.driver ? `Assigned to ${job.driver}` : "Assigned to Ufok by Slate", time: formatDateTime(assigned), description: job.vehicle ? `${job.vehicle}${job.stop ? ` · stop ${job.stop}` : ""}` : "No driver yet", state: "done" });
    if (job.status === "Cancelled") {
      items.push({ at: job.date, title: "Cancelled", time: formatDateTime(job.date), description: job.cancelReason, state: "failed" });
    } else {
      const remind = new Date(job.date);
      remind.setHours(6, 0, 0, 0);
      if (remind.getTime() <= now().getTime()) items.push({ at: remind.toISOString(), title: "Customer reminded by Slate", time: formatTime(remind), description: `SMS: “Bin out by ${job.window.split("–")[0]}”`, state: "done" });
      items.push(job.startedAt ? { at: job.startedAt, title: "Started", time: formatTime(job.startedAt), description: "Customer told the truck is on the way", state: "done" } : { at: "~1", title: "Start", state: job.status === "Scheduled" ? "current" : "upcoming" });
      items.push(job.arrivedAt ? { at: job.arrivedAt, title: "Arrived", time: formatTime(job.arrivedAt), state: "done" } : { at: "~2", title: "Arrive", state: job.status === "En route" ? "current" : "upcoming" });
      if (job.status === "Completed") items.push({ at: job.completedAt!, title: "Collected", time: formatTime(job.completedAt!), description: `${job.photos ?? photos.length} photo${(job.photos ?? photos.length) === 1 ? "" : "s"} · ${CAPTURED_AT.lat}, ${CAPTURED_AT.lng}`, state: "done" });
      else if (job.status === "Failed") items.push({ at: job.failedAt!, title: `Failed: ${job.failReason?.toLowerCase()}`, time: formatTime(job.failedAt!), description: "Slate notified the customer", state: "failed" });
      else items.push({ at: "~3", title: "Collect", state: job.status === "Arrived" ? "current" : "upcoming" });
    }
    for (const n of notes) items.push({ at: n.time, title: "Note", time: formatTime(n.time), description: n.text, state: "done" });
    return items.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0)).map(({ at: _at, ...rest }) => rest);
  }, [job, notes, photos.length, now]);

  const actionBar = <Actions job={job} onStart={() => act({ status: "En route", startedAt: now().toISOString() }, "Job started", "Slate has told the customer the truck is on the way.")} onArrive={() => act({ status: "Arrived", arrivedAt: now().toISOString() }, "Arrived at the address", "Collect, then mark it complete with a photo.")} onComplete={() => setSheet("complete")} onFail={() => setSheet("fail")} onRetry={() => act({ status: "Scheduled", startedAt: undefined, arrivedAt: undefined, failedAt: undefined, failReason: undefined }, "Retry scheduled for today", "The stop is back on the route after the current one.")} />;

  return (
    <Page className="gap-6 md:gap-8">
      <PageHeader
        back={{ to: "/operator/jobs", label: "Jobs" }}
        title={job.customerName}
        meta={
          <>
            {late ? <Badge tone="danger" dot size="md">Late</Badge> : <StatusBadge status={job.status} size="md" />}
          </>
        }
        description={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="t-mono">{job.id}</span>
            <span className="text-ink-3">·</span>
            <span>{isTodayIso(job.date) ? "Today" : formatDay(job.date)}, {job.window}</span>
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-10">
        <div className="flex min-w-0 flex-col gap-8">
          {/* Where: live field, wiped clean when collected */}
          <CleanSlate
            done={done}
            className="rounded-xl"
            after={
              <div className="flex h-full flex-col justify-between gap-6 rounded-xl border border-line bg-surface p-6 sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <Badge tone="success" icon={<Check strokeWidth={3} />}>Collected</Badge>
                  {job.stop && <span className="t-small text-ink-3 tnum">Stop {job.stop}{stat ? ` of ${stat.total}` : ""}</span>}
                </div>
                <div>
                  <p className="t-display text-ink">Clean slate.</p>
                  <p className="mt-3 t-body text-ink-2">
                    Collected at <span className="font-semibold text-ink tnum">{job.completedAt ? formatTime(job.completedAt) : "Not set"}</span>
                    {job.completedAt && !isTodayIso(job.completedAt) ? ` on ${formatDay(job.completedAt)}` : ""} by {job.driver.split(" ")[0]}. Slate has told the customer.
                  </p>
                </div>
                <p className="flex items-center gap-2 t-small text-ink-2">
                  <MapPin className="size-4 shrink-0 text-ink-3" />
                  {job.address}
                </p>
              </div>
            }
          >
            <section aria-label="Location" className="relative isolate flex min-h-[300px] flex-col overflow-hidden rounded-xl bg-slate text-slate-ink chalk-grain sm:min-h-[320px]">
              <RouteMap progress={progress} stops={[0.2, 0.42, 0.6]} className="absolute inset-0 h-full w-full opacity-95" animate={job.status === "En route"} />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-slate from-35% via-slate/80 to-transparent" />
              <div className="relative flex flex-col gap-2 p-5 sm:p-7">
                <div className="flex flex-wrap items-center gap-2">
                  {job.status === "En route" || job.status === "Arrived" ? (
                    <span className="inline-flex h-7 items-center gap-2 rounded-sm bg-signal px-2.5 text-[12px] font-semibold text-signal-ink">
                      <LiveDot className="[&>span]:bg-signal-ink" />
                      {job.status === "Arrived" ? "On site" : "Heading here"}
                    </span>
                  ) : (
                    <span className="inline-flex h-7 items-center rounded-sm bg-white/12 px-2.5 text-[12px] font-semibold">
                      {job.status === "Failed" ? "Not collected" : job.status === "Cancelled" ? "Cancelled" : "Not started"}
                    </span>
                  )}
                  {job.stop && (
                    <span className="t-small text-slate-ink/75 tnum">
                      Stop {job.stop}{stat ? ` of ${stat.total}` : ""}{job.vehicle ? ` · ${job.vehicle}` : ""}
                    </span>
                  )}
                </div>
                <p className="t-h1 max-w-md">{job.address.replace(/, Uyo$/, "")}</p>
                <p className="t-small text-slate-ink/75">
                  {job.status === "Scheduled" && stat ? `${stopsAhead} ${stopsAhead === 1 ? "stop" : "stops"} before this one · ` : ""}
                  <span className="tnum">{job.window}</span> · {job.households ? `${job.households} homes` : `${job.bins} ${job.bins === 1 ? "bin" : "bins"}`}
                </p>
              </div>
              <div className="relative mt-auto flex items-end justify-between gap-3 p-5 sm:p-7">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(job.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-slate-ink px-4 text-[14px] font-semibold text-slate-950 transition hover:bg-white"
                >
                  <Navigation className="size-4" /> Directions
                </a>
              </div>
            </section>
          </CleanSlate>

          {/* Mobile action bar (the thumb zone): fixed above the tab bar */}
          <div className="fixed inset-x-3 bottom-[calc(max(12px,env(safe-area-inset-bottom))+76px)] z-30 lg:hidden">
            <div className="rounded-lg border border-line bg-glass p-2 shadow-float backdrop-blur-xl">{actionBar}</div>
          </div>

          {job.status === "Failed" && (
            <Alert tone="warning" title={`Failed: ${job.failReason?.toLowerCase()}`}>
              Slate has told the customer. Recover by {job.failedAt ? formatTime(new Date(new Date(job.failedAt).getTime() + 24 * 3600_000)) : "Not set"} tomorrow, or a ₦2,500 deduction applies under CT-UYO-011.
            </Alert>
          )}
          {job.status === "Cancelled" && (
            <Alert tone="neutral" title="This job was cancelled">
              {job.cancelReason}. Nothing to collect, and it doesn't count against your completion rate.
            </Alert>
          )}

          <section className="flex flex-col gap-5">
            <h2 className="t-h2 text-ink">Job</h2>
            <DescriptionList
              className="grid-cols-2"
              items={[
                { label: "Service", value: job.service },
                { label: "Window", value: <span className="tnum">{job.window}</span> },
                { label: job.households ? "Households" : "Bins", value: job.households ? `${job.households} homes · ${job.bins} skips` : `${job.bins} × 240-litre` },
                { label: "Customer type", value: job.customerType },
                { label: "Driver", value: job.driver || <Badge tone="warning" dot>Unassigned</Badge> },
                { label: "Vehicle", value: job.vehicle || "Not set", mono: !!job.vehicle },
              ]}
            />
            {job.access && (
              <div className="flex gap-3 rounded-md bg-sunken px-4 py-3.5">
                <StickyNote className="mt-0.5 size-[18px] shrink-0 text-ink-3" strokeWidth={1.75} />
                <div>
                  <p className="t-small font-semibold text-ink">Access notes</p>
                  <p className="t-small text-ink-2">{job.access}</p>
                </div>
              </div>
            )}
          </section>

          {/* Evidence */}
          {(job.status === "Completed" || job.status === "Failed") && (
            <section className="flex flex-col gap-4">
              <h2 className="t-h2 text-ink">{job.status === "Completed" ? "Completion evidence" : "Failure evidence"}</h2>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {photos.map((p, i) => (
                  <div key={`u${i}`} className="aspect-square overflow-hidden rounded-md bg-sunken">
                    {p.url ? <img src={p.url} alt={p.name} className="size-full object-cover" /> : null}
                  </div>
                ))}
                {Array.from({ length: photos.length ? 0 : job.photos ?? 0 }).map((_, i) => (
                  <div key={i} className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-md border border-line bg-sunken text-ink-3">
                    <ImageIcon className="size-6" strokeWidth={1.5} />
                    <span className="t-micro tnum">IMG_{(job.completedAt ?? job.failedAt ?? "").slice(11, 16).replace(":", "")}{i ? `_${i}` : ""}</span>
                  </div>
                ))}
              </div>
              <DescriptionList
                columns={2}
                dense
                items={[
                  { label: "Timestamp", value: <span className="tnum">{formatDateTime((job.completedAt ?? job.failedAt)!)}</span> },
                  {
                    label: "Location",
                    value: (
                      <span className="inline-flex items-center gap-1.5">
                        <Crosshair className="size-4 text-ink-3" />
                        <span className="t-mono text-ink">{CAPTURED_AT.lat}, {CAPTURED_AT.lng}</span>
                      </span>
                    ),
                  },
                  { label: "Captured by", value: `${job.driver}'s phone, ${CAPTURED_AT.accuracy}` },
                  { label: "Shared with", value: "Slate operations and the customer" },
                ]}
              />
            </section>
          )}

          {!closed && (
            <section className="flex flex-col gap-4">
              <div>
                <h2 className="t-h2 text-ink">Evidence and notes</h2>
                <p className="t-small mt-1 text-ink-2">Photos are timestamped and located when they're taken. On a phone, this opens the camera.</p>
              </div>
              <FileDrop images files={photos} onFiles={setPhotos} hint="Bin before and after, or the blocked gate" />
            </section>
          )}

          <section className="flex flex-col gap-3">
            {closed && <h2 className="t-h2 text-ink">Notes</h2>}
            <Textarea
              label="Add a note"
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="For Slate and the next crew, e.g. bin moved behind the generator house"
            />
            <div className="flex justify-end">
              <Button
                variant="secondary"
                disabled={!draft.trim()}
                leading={<MessageSquare className="size-4" />}
                onClick={() => {
                  setNotes((n) => [...n, { text: draft.trim(), time: now().toISOString() }]);
                  setDraft("");
                  toast.success("Note added", "Visible to Slate operations and your dispatchers.");
                }}
              >
                Add note
              </Button>
            </div>
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-8">
          <div className="hidden lg:block">
            <Panel title="Next step" description={nextStepCopy(job)}>
              {actionBar}
            </Panel>
          </div>

          <section className="flex flex-col gap-4 border-b border-line pb-8">
            <h2 className="t-h2 text-ink">Customer</h2>
            <div>
              <p className="t-body font-medium text-ink">{job.customerName}</p>
              <p className="t-small text-ink-2">{job.address}</p>
              <p className="t-small mt-1 text-ink-3">{customer ? `${customer.plan} · ${customer.days}` : job.service}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <CallViaSlate ext={customer?.ext ?? job.id.slice(-4)} name={job.customerName} block />
              <Button variant="outline" block leading={<MessageSquare className="size-4" />} onClick={() => toast.info("Message sent through Slate", `“Your Slate truck is outside ${job.address.split(",")[0]}.”`)}>
                Message
              </Button>
            </div>
            <p className="t-small text-ink-3">
              Numbers are masked: you reach the customer through Slate on <span className="tnum">{SLATE_RELAY}</span>, ext. <span className="t-mono">{customer?.ext ?? job.id.slice(-4)}</span>. The customer relationship belongs to Slate.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="t-h2 text-ink">Timeline</h2>
            <Timeline items={timeline} />
          </section>
        </aside>
      </div>

      {/* room for the fixed action bar on phones */}
      <div className="h-24 lg:hidden" aria-hidden />

      <CompleteSheet
        open={sheet === "complete"}
        job={job}
        photos={photos}
        setPhotos={setPhotos}
        onClose={() => setSheet(null)}
        onConfirm={(bins, note) => {
          const t = now().toISOString();
          if (note) setNotes((n) => [...n, { text: note, time: t }]);
          setSheet(null);
          act({ status: "Completed", completedAt: t, photos: Math.max(1, photos.length), bins }, `Collected ${formatTime(t)}`, "Slate has told the customer. Evidence saved.");
        }}
      />
      <FailSheet
        open={sheet === "fail"}
        job={job}
        photos={photos}
        setPhotos={setPhotos}
        onClose={() => setSheet(null)}
        onConfirm={(reason, note) => {
          const t = now().toISOString();
          if (note) setNotes((n) => [...n, { text: note, time: t }]);
          setSheet(null);
          updateJob(job.id, { status: "Failed", failedAt: t, failReason: reason as Job["failReason"], photos: photos.length || undefined });
          toast.toast({ tone: "warning", title: `Marked failed: ${reason.toLowerCase()}`, description: "Slate will tell the customer and agree a retry." });
        }}
      />
    </Page>
  );
}

function nextStepCopy(job: Job) {
  switch (job.status) {
    case "Scheduled":
      return job.driver ? "Start when the truck leaves for this stop." : "Assign a driver from Jobs before starting.";
    case "En route":
      return "Tap when the truck is at the gate.";
    case "Arrived":
      return "Collect, take a photo, then complete.";
    case "Failed":
      return "Retry today if the problem is solved.";
    case "Completed":
      return "Nothing left to do on this job.";
    default:
      return "No action needed.";
  }
}

function Actions({ job, onStart, onArrive, onComplete, onFail, onRetry }: { job: Job; onStart: () => void; onArrive: () => void; onComplete: () => void; onFail: () => void; onRetry: () => void }) {
  switch (job.status) {
    case "Scheduled":
      return (
        <Button size="lg" block disabled={!job.driver} trailing={<ArrowRight className="size-5" />} onClick={onStart}>
          {job.driver ? "Start job" : "Needs a driver"}
        </Button>
      );
    case "En route":
      return (
        <Button size="lg" block leading={<MapPin className="size-5" />} onClick={onArrive}>
          Arrived at address
        </Button>
      );
    case "Arrived":
      return (
        <div className="grid grid-cols-[1fr_2fr] gap-2">
          <Button size="lg" variant="outline" className="!text-danger" leading={<X className="size-5" />} onClick={onFail}>
            Failed
          </Button>
          <Button size="lg" leading={<Camera className="size-5" />} onClick={onComplete}>
            Complete
          </Button>
        </div>
      );
    case "Failed":
      return (
        <Button size="lg" variant="secondary" block leading={<RotateCcw className="size-5" />} onClick={onRetry}>
          Retry today
        </Button>
      );
    case "Completed":
      return (
        <p className={cn("flex h-13 items-center justify-center gap-2 rounded-md bg-success-bg px-4 text-[15px] font-semibold text-success")}>
          <Check className="size-5" strokeWidth={2.5} /> Collected {job.completedAt ? formatTime(job.completedAt) : ""}
        </p>
      );
    default:
      return <p className="flex h-13 items-center justify-center rounded-md bg-sunken px-4 text-[15px] font-medium text-ink-2">Cancelled, nothing to do</p>;
  }
}

function CompleteSheet({
  open, job, photos, setPhotos, onClose, onConfirm,
}: { open: boolean; job: Job; photos: UploadedFile[]; setPhotos: (f: UploadedFile[]) => void; onClose: () => void; onConfirm: (bins: number, note?: string) => void }) {
  const [bins, setBins] = useState(job.bins);
  const [noPhoto, setNoPhoto] = useState(false);
  const [why, setWhy] = useState("");
  const [tried, setTried] = useState(false);
  const photoError = tried && !photos.length && !noPhoto ? "Add a photo of the emptied bin, or say why you can't." : undefined;
  const whyError = tried && noPhoto && why.trim().length < 6 ? "Say why there's no photo." : undefined;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Complete this stop"
      description={`${job.customerName} · ${job.address.replace(/, Uyo$/, "")}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Not yet</Button>
          <Button
            size="lg"
            leading={<Check className="size-5" />}
            onClick={() => {
              setTried(true);
              if ((!photos.length && !noPhoto) || (noPhoto && why.trim().length < 6)) return;
              onConfirm(bins, noPhoto ? `No photo: ${why.trim()}` : undefined);
            }}
          >
            Mark collected
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        <FileDrop images label="Photo of the emptied bin" files={photos} onFiles={setPhotos} hint="Opens the camera on your phone" error={photoError} />
        <Checkbox checked={noPhoto} onChange={setNoPhoto} label="I can't take a photo" description="Camera broken or no light. Slate may follow up." />
        {noPhoto && <Textarea label="Why not?" rows={2} value={why} onChange={(e) => setWhy(e.target.value)} error={whyError} />}
        <div className="flex items-center justify-between gap-4 border-y border-line py-3">
          <span className="t-body font-medium text-ink">{job.households ? "Skips emptied" : "Bins emptied"}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" aria-label="One fewer" className="!w-11 !px-0" onClick={() => setBins((b) => Math.max(1, b - 1))}>−</Button>
            <span className="w-10 text-center font-display text-[22px] font-bold text-ink tnum" aria-live="polite">{bins}</span>
            <Button variant="outline" aria-label="One more" className="!w-11 !px-0" onClick={() => setBins((b) => b + 1)}>+</Button>
          </div>
        </div>
        <p className="flex items-start gap-2 t-small text-ink-2">
          <Crosshair className="mt-0.5 size-4 shrink-0 text-ink-3" />
          <span>
            Location <span className="t-mono text-ink">{CAPTURED_AT.lat}, {CAPTURED_AT.lng}</span> ({CAPTURED_AT.accuracy}) and the time are saved with the evidence.
          </span>
        </p>
      </div>
    </Modal>
  );
}

function FailSheet({
  open, job, photos, setPhotos, onClose, onConfirm,
}: { open: boolean; job: Job; photos: UploadedFile[]; setPhotos: (f: UploadedFile[]) => void; onClose: () => void; onConfirm: (reason: string, note?: string) => void }) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const reasonError = tried && !reason ? "Choose what stopped the collection." : undefined;
  const noteError = tried && reason === "Other" && note.trim().length < 6 ? "Describe what happened." : undefined;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Couldn't collect"
      description="Slate tells the customer and agrees a retry. A photo protects you if the customer disputes it."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Go back</Button>
          <Button
            size="lg"
            variant="destructive"
            onClick={() => {
              setTried(true);
              if (!reason || (reason === "Other" && note.trim().length < 6)) return;
              onConfirm(reason, note.trim() || undefined);
            }}
          >
            Mark failed
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        <Select label="Reason" placeholder="Choose a reason" options={[...FAILURE_REASONS]} value={reason} onChange={(e) => setReason(e.target.value)} error={reasonError} />
        <Textarea label="What happened" optional={reason !== "Other"} rows={3} value={note} onChange={(e) => setNote(e.target.value)} error={noteError} placeholder="e.g. Gate padlocked, security says residents travelled" />
        <FileDrop images label="Photo" files={photos} onFiles={setPhotos} hint="The locked gate, the empty kerb, the blocked street" />
        {reason === "Vehicle breakdown" && (
          <Alert tone="warning" title="Tell your dispatcher too">
            The remaining stops on {job.vehicle || "this route"} need another truck. Reassign them from Jobs.
          </Alert>
        )}
      </div>
    </Modal>
  );
}
