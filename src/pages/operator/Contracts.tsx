import { useState, type ReactNode } from "react";
import { Check, Download, FileText, MessageCircleQuestion, X } from "lucide-react";
import {
  Alert, Badge, Button, ConfirmDialog, DescriptionList, Drawer, LiveDot, Modal, Page, PageHeader, Panel, ProgressBar, Section, Select,
  StatusBadge, Textarea, Timeline, useToast,
} from "@/components/ui";
import type { Contract } from "@/data";
import { cn } from "@/lib/cn";
import { DEMO_NOW, formatDate, formatDateTime, formatDay, formatNaira, formatNumber } from "@/lib/format";
import { COMPANY, CONTRACT_DOCS, UFOK_CONTRACTS, type SlaTerm } from "./_bizData";
import { daysUntil, useDownload } from "./_biz";

type Decision = "Sent to operator" | "Accepted" | "Rejected" | "Clarification requested";

const TITLES: Record<string, string> = {
  "CT-UYO-011": "Household and estate collection",
  "CT-UYO-019": "Osongama recycling",
};

/** G6 — Slate contracts: read them, download them, answer the one waiting on you. */
export default function Contracts() {
  const toast = useToast();
  const download = useDownload();
  const [decision, setDecision] = useState<Decision>("Sent to operator");
  const [decidedAt, setDecidedAt] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Contract | null>(null);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [clarifyOpen, setClarifyOpen] = useState(false);
  const [question, setQuestion] = useState<{ topic: string; text: string } | null>(null);

  const active = UFOK_CONTRACTS.find((c) => c.id === "CT-UYO-011")!;
  const offer = UFOK_CONTRACTS.find((c) => c.id === "CT-UYO-019")!;
  const offerDoc = CONTRACT_DOCS[offer.id]!;
  const respondDays = daysUntil(offerDoc.respondBy!);
  const offerStatus = decision === "Clarification requested" ? "Sent to operator" : decision;
  const statusOf = (c: Contract) => (c.id === offer.id ? offerStatus : c.status);
  const nowIso = () => new Date(DEMO_NOW.getTime() + 2 * 60_000).toISOString();

  const fileName = (c: Contract) => `${c.id}-Waste-Service-Partner-Agreement-v${c.version}.pdf`;
  const pending = decision === "Sent to operator" || decision === "Clarification requested";

  return (
    <Page>
      <PageHeader
        title="Contracts"
        description="Your Waste Service Partner Agreements with Slate. Customers pay Slate; these set what Slate pays you and the standard you're held to."
      />

      {/* The one that needs you */}
      <section aria-labelledby="offer-title" className={cn("overflow-hidden rounded-lg border bg-surface", pending ? "border-ink" : "border-line")}>
        <div className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {pending ? (
              <span className="inline-flex h-7 items-center gap-2 rounded-sm bg-signal px-2.5 text-[12px] font-semibold text-signal-ink">
                <LiveDot className="[&>span]:bg-signal-ink" pulse={false} />
                Waiting for your answer
              </span>
            ) : (
              <StatusBadge status={decision} size="md" />
            )}
            <span className="t-mono text-ink-3">
              {offer.id} · v{offer.version}
            </span>
            {pending && <span className="t-small text-ink-2 tnum">Respond by {formatDay(offerDoc.respondBy!)} · {respondDays} days</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <h2 id="offer-title" className="t-h1 text-ink">
              {TITLES[offer.id]}
            </h2>
            <p className="t-body max-w-2xl text-ink-2">{offerDoc.summary}</p>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-y border-line py-4 sm:grid-cols-4">
            {[
              ["Rate", `${formatNaira(offer.operatorPayout)} per customer a month`],
              ["Capacity", `Up to ${formatNumber(offer.capacity)} customers`],
              ["Collection", "Monthly, Sat 10:00–14:00"],
              ["Term", `${formatDate(offer.start).replace(/ \d{4}$/, "")} 2026 – ${formatDate(offer.end)}`],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5">
                <dt className="t-micro text-ink-3">{k}</dt>
                <dd className="t-small font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>

          {decision === "Clarification requested" && question && (
            <Alert tone="info" title="Clarification requested">
              On “{question.topic}”: {question.text} Itoro Effiong from Slate partnerships replies within 2 working days. You can still accept or reject.
            </Alert>
          )}
          {decision === "Accepted" && (
            <Alert tone="success" title={`Accepted ${decidedAt ? formatDateTime(decidedAt) : ""}`}>
              Signed by {COMPANY.contactName}. Slate countersigns within 2 working days. Recycling jobs start on Sun 1 Nov and appear in Jobs a week before.
            </Alert>
          )}
          {decision === "Rejected" && (
            <Alert tone="danger" title={`Rejected ${decidedAt ? formatDateTime(decidedAt) : ""}`}>
              Slate partnerships will call {COMPANY.contactName} to talk it through. Your current contract, CT-UYO-011, is not affected.
            </Alert>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Button variant={pending ? "outline" : "secondary"} leading={<FileText className="size-4" />} onClick={() => setViewing(offer)}>
              Read the contract
            </Button>
            {pending && (
              <>
                <Button leading={<Check className="size-4" />} onClick={() => setAcceptOpen(true)} className="sm:order-first">
                  Accept
                </Button>
                <Button variant="ghost" leading={<MessageCircleQuestion className="size-4" />} onClick={() => setClarifyOpen(true)}>
                  Ask a question
                </Button>
                <Button variant="ghost" leading={<X className="size-4" />} onClick={() => setRejectOpen(true)} className="text-danger hover:text-danger sm:ml-auto">
                  Reject
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      <Section title="Active contract">
        <ContractPanel c={active} status={statusOf(active)} onView={() => setViewing(active)} onDownload={() => download(fileName(active), `v${active.version} · 14 pages`)} />
      </Section>

      <Section title={`${active.id} version history`} description="Each change Slate made, and when you agreed to it.">
        <Timeline
          items={CONTRACT_DOCS[active.id]!.versions.map((v, i) => ({
            title: `Version ${v.v}${i === 0 ? " · current" : ""}`,
            time: formatDate(v.date),
            description: v.change,
            state: "done" as const,
          }))}
        />
      </Section>

      <ContractDrawer
        c={viewing}
        status={viewing ? statusOf(viewing) : ""}
        onClose={() => setViewing(null)}
        onDownload={(c) => download(fileName(c), `v${c.version} · ${c.id === "CT-UYO-011" ? 14 : 6} pages`)}
        actions={
          viewing?.id === offer.id && pending ? (
            <>
              <Button variant="ghost" onClick={() => setClarifyOpen(true)}>Ask a question</Button>
              <Button onClick={() => setAcceptOpen(true)}>Accept</Button>
            </>
          ) : null
        }
      />

      <ConfirmDialog
        open={acceptOpen}
        onClose={() => setAcceptOpen(false)}
        title={`Accept ${offer.id}?`}
        description="Accepting signs the contract on behalf of Ufok Environmental Services Ltd. It starts on 1 Nov once Slate countersigns."
        confirmLabel="Accept and sign"
        requireText={COMPANY.contactName}
        onConfirm={() => {
          setDecision("Accepted");
          setDecidedAt(nowIso());
          setViewing(null);
          toast.success(`${offer.id} accepted`, "Slate countersigns within 2 working days.");
        }}
      >
        <ul className="flex flex-col gap-1.5 rounded-md bg-sunken/70 p-3.5 t-small text-ink-2">
          <li>₦1,000 per recycling customer a month, with your CT-UYO-011 statement</li>
          <li>Monthly Saturday collection in Osongama, 10:00–14:00</li>
          <li>Loads delivered to Itam Recovery Ltd with a weighbridge ticket</li>
        </ul>
      </ConfirmDialog>

      <RejectModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onReject={() => {
          setDecision("Rejected");
          setDecidedAt(nowIso());
          setViewing(null);
          toast.info(`${offer.id} rejected`, "Slate partnerships will be in touch.");
        }}
      />
      <ClarifyModal
        open={clarifyOpen}
        onClose={() => setClarifyOpen(false)}
        topics={[...offerDoc.clauses.map((c) => `Clause ${c.n}: ${c.title}`), ...offerDoc.sla.map((s) => `Service level: ${s.label}`), ...offerDoc.commercial.map((s) => `Commercial: ${s.label}`)]}
        onSend={(q) => {
          setQuestion(q);
          setDecision("Clarification requested");
          toast.success("Question sent", "Itoro Effiong replies within 2 working days.");
        }}
      />
    </Page>
  );
}

function ContractPanel({ c, status, onView, onDownload }: { c: Contract; status: string; onView: () => void; onDownload: () => void }) {
  const left = daysUntil(c.end);
  const doc = CONTRACT_DOCS[c.id]!;
  return (
    <Panel
      title={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {TITLES[c.id]}
          <StatusBadge status={status} />
        </span>
      }
      description={
        <>
          <span className="t-mono">{c.id}</span> · version {c.version} · {doc.summary}
        </>
      }
      footer={
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" leading={<FileText className="size-3.5" />} onClick={onView}>
            View contract
          </Button>
          <Button variant="ghost" size="sm" leading={<Download className="size-3.5" />} onClick={onDownload}>
            Download
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <DescriptionList
          columns={3}
          items={[
            { label: "Contract value", value: <span className="tnum">{formatNaira(c.monthlyValue)} a month</span> },
            {
              label: "Customers",
              value: (
                <span className="flex flex-col gap-1.5">
                  <span className="tnum">
                    {formatNumber(c.customers)} of {formatNumber(c.capacity)}
                  </span>
                  <ProgressBar value={c.customers} max={c.capacity} size="sm" label="Customers against capacity" className="max-w-48" />
                </span>
              ),
            },
            { label: "Service area", value: c.areas.join(", ") },
            { label: "SLA", value: `${c.slaCompletion}% completion · missed pickups recovered within ${c.responseHours}h` },
            { label: "Payment terms", value: c.paymentTerms },
            {
              label: "Term",
              value: (
                <span className="tnum">
                  {formatDate(c.start)} – {formatDate(c.end)}
                  <span className="block t-small text-ink-3">{left} days left · renewal talks open 60 days before</span>
                </span>
              ),
            },
          ]}
        />
        <div className="flex flex-wrap gap-1.5">
          {c.serviceTypes.map((s) => (
            <Badge key={s} tone="neutral">
              {s}
            </Badge>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function TermsTable({ rows, caption }: { rows: SlaTerm[]; caption: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-line">
      <table className="w-full text-left">
        <caption className="sr-only">{caption}</caption>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={r.label} className="align-top">
              <th scope="row" className="w-[42%] bg-sunken/50 px-3.5 py-3 t-small font-medium text-ink">
                {r.label}
              </th>
              <td className="px-3.5 py-3">
                <p className="t-small font-semibold text-ink tnum">{r.target}</p>
                {r.detail && <p className="t-small text-ink-2">{r.detail}</p>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContractDrawer({
  c,
  status,
  onClose,
  onDownload,
  actions,
}: {
  c: Contract | null;
  status: string;
  onClose: () => void;
  onDownload: (c: Contract) => void;
  actions?: ReactNode;
}) {
  const doc = c ? CONTRACT_DOCS[c.id] : null;
  return (
    <Drawer
      open={!!c}
      onClose={onClose}
      width="lg"
      title={c ? `Waste Service Partner Agreement` : ""}
      description={c ? `${c.id} · version ${c.version} · ${TITLES[c.id]}` : ""}
      footer={
        c && (
          <>
            <Button variant="outline" leading={<Download className="size-4" />} onClick={() => onDownload(c)}>
              Download
            </Button>
            {actions}
          </>
        )
      }
    >
      {c && doc && (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <StatusBadge status={status} size="md" />
            <p className="t-body text-ink-2">{doc.summary}</p>
            <p className="t-small text-ink-3">{doc.valueLabel}</p>
          </div>

          <section className="flex flex-col gap-3">
            <h3 className="t-h3 text-ink">Schedule A · Parties and scope</h3>
            <DescriptionList
              dense
              items={[
                { label: "Slate", value: "Slate Technologies Ltd, 41 Udo Udoma Avenue, Uyo" },
                { label: "Partner", value: `${COMPANY.legalName}, ${COMPANY.rc}` },
                { label: "Service areas", value: c.areas.join(", ") },
                { label: "Services", value: c.serviceTypes.join(", ") },
                { label: "Starts", value: formatDate(c.start) },
                { label: "Ends", value: formatDate(c.end) },
              ]}
            />
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="t-h3 text-ink">Schedule B · Service levels</h3>
            <TermsTable rows={doc.sla} caption="Service levels" />
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="t-h3 text-ink">Schedule C · Commercial terms</h3>
            <TermsTable rows={doc.commercial} caption="Commercial terms" />
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="t-h3 text-ink">Performance deductions</h3>
            <ul className="divide-y divide-line border-y border-line">
              {doc.penalties.map((p) => (
                <li key={p.label} className="flex items-baseline justify-between gap-4 py-2.5">
                  <span className="t-small text-ink">{p.label}</span>
                  <span className="t-small shrink-0 font-semibold text-danger tnum">{p.target}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="t-h3 text-ink">Schedule D · Compliance</h3>
            <ul className="flex flex-col gap-2">
              {doc.compliance.map((x) => (
                <li key={x} className="flex gap-2.5 t-small text-ink-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-ink-3" />
                  {x}
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="t-h3 text-ink">Clauses</h3>
            <ol className="flex flex-col gap-4">
              {doc.clauses.map((cl) => (
                <li key={cl.n} className="flex gap-3">
                  <span className="t-mono w-5 shrink-0 text-ink-3">{cl.n}</span>
                  <div>
                    <p className="t-small font-semibold text-ink">{cl.title}</p>
                    <p className="t-small text-ink-2">{cl.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </Drawer>
  );
}

function RejectModal({ open, onClose, onReject }: { open: boolean; onClose: () => void; onReject: () => void }) {
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [err, setErr] = useState<{ reason?: string; detail?: string }>({});
  const close = () => {
    setReason("");
    setDetail("");
    setErr({});
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={close}
      title="Reject CT-UYO-019?"
      description="Slate can't change a contract you reject without sending a new version. Tell us why so the next one fits."
      footer={
        <>
          <Button variant="ghost" onClick={close}>Keep it open</Button>
          <Button
            variant="destructive"
            onClick={() => {
              const e = { reason: reason ? undefined : "Choose a reason.", detail: detail.trim().length >= 15 ? undefined : "Add a little detail (15 characters or more)." };
              setErr(e);
              if (e.reason || e.detail) return;
              close();
              onReject();
            }}
          >
            Reject contract
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Select
          label="Main reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Choose a reason"
          options={["Rate is too low", "We don't have a spare covered truck", "Saturday window doesn't work", "Delivery to Itam is too far", "Other"]}
          error={err.reason}
        />
        <Textarea label="Details" rows={4} value={detail} onChange={(e) => setDetail(e.target.value)} error={err.detail} placeholder="What would make this work for Ufok?" />
      </div>
    </Modal>
  );
}

function ClarifyModal({ open, onClose, topics, onSend }: { open: boolean; onClose: () => void; topics: string[]; onSend: (q: { topic: string; text: string }) => void }) {
  const [topic, setTopic] = useState("");
  const [text, setText] = useState("");
  const [err, setErr] = useState<{ topic?: string; text?: string }>({});
  const close = () => {
    setTopic("");
    setText("");
    setErr({});
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={close}
      title="Ask about CT-UYO-019"
      description="Your question goes to Slate partnerships. The contract stays open while they answer."
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button
            onClick={() => {
              const e = { topic: topic ? undefined : "Choose what your question is about.", text: text.trim().length >= 15 ? undefined : "Write your question (15 characters or more)." };
              setErr(e);
              if (e.topic || e.text) return;
              onSend({ topic: topic.replace(/^[^:]+: /, ""), text: text.trim().replace(/([^.?!])$/, "$1.") });
              close();
            }}
          >
            Send question
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Select label="About" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Choose a clause or term" options={topics} error={err.topic} />
        <Textarea
          label="Question"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          error={err.text}
          placeholder="e.g. Can the Saturday window start at 08:00 so the truck is back for afternoon estate runs?"
        />
      </div>
    </Modal>
  );
}
