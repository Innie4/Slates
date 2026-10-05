import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, FileText, Plus } from "lucide-react";
import {
  Button, ButtonLink, DataTable, FilterBar, LiveDot, Modal, Page, PageHeader, Ref, Section, StatusBadge, Tabs, useFilteredRows, useTab, useToast,
  type Column,
} from "@/components/ui";
import type { Contract } from "@/data";
import { cn } from "@/lib/cn";
import { formatDate, formatNaira, formatNairaShort, formatNumber } from "@/lib/format";
import { CONTRACT_TABS, CONTRACT_TEMPLATES, allContracts, daysUntil, isLive, margin, type ContractTab, type ContractTemplate } from "./_money";

/** Default order: what needs a decision first, then live, then pipeline, then ended. */
const STATUS_ORDER: Contract["status"][] = ["Expiring", "Renewal approaching", "Active", "Accepted", "Sent to operator", "Negotiation", "Internal review", "Draft", "Expired", "Terminated"];

const shortService = (s: string) => s.replace(" Waste Management", "").replace(" Waste", "");

function EndsCell({ c }: { c: Contract }) {
  const d = daysUntil(c.end);
  const soon = isLive(c) && d <= 60;
  return (
    <div className="flex flex-col whitespace-nowrap">
      <span className="tnum text-ink">{formatDate(c.end)}</span>
      {c.status === "Terminated" || c.status === "Expired" ? (
        <span className="t-micro text-ink-3">Ended</span>
      ) : soon ? (
        <span className="t-micro font-medium text-warning tnum">in {d} days</span>
      ) : (
        <span className="t-micro text-ink-3 tnum">{d > 0 ? `${Math.round(d / 30)} months left` : "Ended"}</span>
      )}
    </div>
  );
}

function PriceCell({ c }: { c: Contract }) {
  const m = margin(c.customerPrice, c.operatorPayout);
  return (
    <div className="flex flex-col whitespace-nowrap">
      <span className="tnum text-ink">
        {formatNaira(c.customerPrice)} <span className="text-ink-3">→</span> {formatNaira(c.operatorPayout)}
      </span>
      <span className="t-micro text-ink-3 tnum">
        {formatNaira(m.amount)} margin · {m.pct.toFixed(1)}%
      </span>
    </div>
  );
}

function CapacityCell({ c }: { c: Contract }) {
  const pct = c.capacity ? Math.round((c.customers / c.capacity) * 100) : 0;
  return (
    <div className="flex w-28 flex-col gap-1.5">
      <span className="tnum text-ink">
        {formatNumber(c.customers)} <span className="text-ink-3">/ {formatNumber(c.capacity)}</span>
      </span>
      <span className="h-1 overflow-hidden rounded-full bg-sunken" aria-label={`${pct}% of capacity`}>
        <span className={cn("block h-full rounded-full", pct >= 90 ? "bg-warning" : "bg-slate-400 dark:bg-slate-500")} style={{ width: `${Math.min(100, pct)}%` }} />
      </span>
    </div>
  );
}

export default function Contracts() {
  const toast = useToast();
  const tab = useTab<ContractTab>("tab", "all");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<ContractTemplate | null>(null);

  const live = allContracts.filter(isLive);
  const monthly = live.reduce((a, c) => a + c.monthlyValue, 0);
  const served = live.reduce((a, c) => a + c.customers, 0);
  const billed = live.reduce((a, c) => a + c.customerPrice * c.customers, 0);
  const kept = live.reduce((a, c) => a + (c.customerPrice - c.operatorPayout) * c.customers, 0);
  const areas = new Set(live.flatMap((c) => c.areas)).size;
  const ending = allContracts.filter((c) => CONTRACT_TABS.expiring.includes(c.status)).sort((a, b) => a.end.localeCompare(b.end));
  const soonest = ending[0];

  const inTab = useMemo(() => {
    const list = tab === "all" ? allContracts : allContracts.filter((c) => CONTRACT_TABS[tab]?.includes(c.status));
    return [...list].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || a.end.localeCompare(b.end));
  }, [tab]);
  const rows = useFilteredRows(inTab, {
    search,
    searchFields: (c) => `${c.id} ${c.operatorName} ${c.areas.join(" ")} ${c.serviceTypes.join(" ")}`,
    filters,
    filterFields: {
      operator: (c) => c.operatorName,
      service: (c) => (c.serviceTypes.map(shortService).includes(filters.service ?? "") ? filters.service! : ""),
      area: (c) => (c.areas.includes(filters.area ?? "") ? filters.area! : ""),
    },
  });

  const count = (t: Exclude<ContractTab, "all">) => allContracts.filter((c) => CONTRACT_TABS[t].includes(c.status)).length;

  const columns: Column<Contract>[] = [
    {
      key: "contract",
      header: "Contract",
      sortValue: (c) => c.id,
      cell: (c) => (
        <div className="flex flex-col whitespace-nowrap">
          <span className="font-medium text-ink">{c.operatorName}</span>
          <Ref className="text-ink-3">{c.id} · v{c.version}</Ref>
        </div>
      ),
    },
    {
      key: "areas",
      header: "Areas & services",
      cell: (c) => (
        <div className="flex max-w-52 flex-col xl:max-w-64">
          <span className="truncate text-ink">
            {c.areas.slice(0, 2).join(", ")}
            {c.areas.length > 2 && <span className="text-ink-3"> +{c.areas.length - 2}</span>}
          </span>
          <span className="truncate t-micro text-ink-3">{c.serviceTypes.map(shortService).join(" · ")}</span>
        </div>
      ),
    },
    { key: "price", header: "Customer → operator", sortValue: (c) => margin(c.customerPrice, c.operatorPayout).pct, cell: (c) => <PriceCell c={c} /> },
    { key: "capacity", header: "Customers / capacity", sortValue: (c) => c.customers / Math.max(1, c.capacity), cell: (c) => <CapacityCell c={c} /> },
    {
      key: "sla",
      header: "SLA",
      cell: (c) => (
        <span className="whitespace-nowrap tnum text-ink-2">
          {c.slaCompletion}% <span className="text-ink-3">· {c.responseHours}h</span>
        </span>
      ),
    },
    { key: "status", header: "Status", sortValue: (c) => c.status, cell: (c) => <StatusBadge status={c.status} /> },
    { key: "end", header: "Ends", sortValue: (c) => c.end, cell: (c) => <EndsCell c={c} /> },
  ];

  return (
    <Page>
      <PageHeader
        title="Contracts"
        description={`Waste Service Partner Agreements between Slate Technologies Ltd and its operators. Customers pay Slate; Slate pays operators.`}
        actions={
          <ButtonLink to="/admin/contracts/new" leading={<Plus className="size-4" />}>
            New contract
          </ButtonLink>
        }
      />

      {/* Hero: what Slate is committed to paying, and what needs a decision */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-end lg:gap-10">
        <div className="flex flex-col gap-2">
          <p className="t-micro text-ink-3">Committed to operators each month</p>
          <p className="t-display text-ink tnum">{formatNairaShort(monthly)}</p>
          <p className="t-body max-w-xl text-ink-2">
            {live.length} live contracts cover <span className="font-medium text-ink tnum">{formatNumber(served)}</span> customers in {areas} areas. Slate keeps{" "}
            <span className="font-medium text-ink tnum">{((kept / billed) * 100).toFixed(1)}%</span> of what those customers pay.
          </p>
        </div>
        {soonest && (
          <Link
            to="/admin/contracts?tab=expiring"
            className="group flex items-start gap-3 rounded-md border border-line bg-surface p-4 transition-colors hover:border-line-strong"
          >
            <LiveDot className="mt-1.5" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="t-small font-semibold text-ink">
                {ending.length} contracts end before {formatDate(ending[ending.length - 1]!.end).replace(/ \d{4}$/, "")}
              </span>
              <span className="t-small text-ink-2">
                {soonest.operatorName} <span className="t-mono text-ink-3">{soonest.id}</span> ends in {daysUntil(soonest.end)} days. Renew or let it lapse.
              </span>
            </span>
            <ArrowRight className="mt-1 size-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <Tabs
          param="tab"
          value={tab}
          items={[
            { value: "all", label: "All", count: allContracts.length },
            { value: "draft", label: "Draft", count: count("draft") },
            { value: "negotiation", label: "Negotiation", count: count("negotiation") },
            { value: "active", label: "Active", count: count("active") },
            { value: "expiring", label: "Expiring", count: count("expiring") },
            { value: "terminated", label: "Terminated", count: count("terminated") },
          ]}
        />
        {tab === "expiring" && (
          <p className="t-small text-ink-2">Renewal approaching and expiring contracts. Renewals go back through internal review before they're sent to the operator.</p>
        )}
        {tab === "draft" && <p className="t-small text-ink-2">Drafts and contracts waiting for internal approval.</p>}
        {tab === "negotiation" && <p className="t-small text-ink-2">In negotiation, sent to the operator, or accepted and waiting to be activated.</p>}
        <FilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Search contracts"
          filters={[
            { key: "operator", label: "Operator", options: [...new Set(allContracts.map((c) => c.operatorName))] },
            { key: "service", label: "Service", options: [...new Set(allContracts.flatMap((c) => c.serviceTypes.map(shortService)))] },
            { key: "area", label: "Area", options: [...new Set(allContracts.flatMap((c) => c.areas))].sort() },
          ]}
          values={filters}
          onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
          onExport={(f) => toast.success(f === "Print" ? "Sent to printer" : `Contracts exported as ${f}`, `${rows.length} contracts, ${tab === "all" ? "all statuses" : `${tab} tab`}.`)}
        />
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(c) => c.id}
          rowHref={(c) => `/admin/contracts/${c.id}`}
          mobile={(c) => {
            const m = margin(c.customerPrice, c.operatorPayout);
            const d = daysUntil(c.end);
            return (
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="t-body font-medium text-ink">{c.operatorName}</p>
                    <p className="t-mono text-[12px] text-ink-3">{c.id} · v{c.version}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <p className="t-small text-ink-2">
                  {c.areas.slice(0, 2).join(", ")}
                  {c.areas.length > 2 && ` +${c.areas.length - 2}`} · {c.serviceTypes.map(shortService).join(", ")}
                </p>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 t-small">
                  <span className="text-ink tnum">
                    {formatNaira(c.customerPrice)} → {formatNaira(c.operatorPayout)} <span className="text-ink-3">· {m.pct.toFixed(1)}%</span>
                  </span>
                  <span className={cn("tnum", isLive(c) && d <= 60 ? "font-medium text-warning" : "text-ink-3")}>
                    {c.status === "Terminated" ? "Terminated" : isLive(c) && d <= 60 ? `Ends in ${d} days` : `Ends ${formatDate(c.end)}`}
                  </span>
                </div>
              </div>
            );
          }}
          empty={
            <div className="flex flex-col items-center gap-3 border-y border-line py-12 text-center">
              <p className="t-h3 text-ink">No contracts match</p>
              <p className="t-small text-ink-2">Clear the search or filters, or start a new contract.</p>
              <ButtonLink to="/admin/contracts/new" variant="secondary" size="sm" leading={<Plus className="size-4" />}>
                New contract
              </ButtonLink>
            </div>
          }
        />
      </section>

      <Section
        title="Contract templates"
        description="Every operator contract starts from a Waste Service Partner Agreement template. Legal owns the clauses; pricing and SLA are set per contract."
      >
        <div className="grid border-y border-line sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-4 lg:gap-x-0 lg:divide-x lg:divide-line">
          {CONTRACT_TEMPLATES.map((t) => {
            const m = margin(t.price, t.payout);
            return (
              <div key={t.id} className="flex flex-col gap-3 border-line py-5 max-sm:[&:not(:first-child)]:border-t sm:max-lg:[&:nth-child(n+3)]:border-t lg:px-5 lg:first:pl-0 lg:last:pr-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="t-h3 text-ink">{t.kind}</p>
                    <p className="t-small text-ink-3">
                      {t.name} · <span className="t-mono">{t.version}</span>
                    </p>
                  </div>
                  <FileText className="mt-0.5 size-[18px] shrink-0 text-ink-3" strokeWidth={1.75} />
                </div>
                <p className="t-small text-ink-2 tnum">
                  {formatNaira(t.price)} → {formatNaira(t.payout)} {t.unit} · {m.pct.toFixed(1)}% margin
                </p>
                <p className="t-micro text-ink-3">
                  {t.clauses.length} standard clauses · used by {t.inUse} {t.inUse === 1 ? "contract" : "contracts"} · updated {formatDate(t.updated)}
                </p>
                <div className="mt-auto flex gap-2 pt-1">
                  <Button variant="secondary" size="sm" onClick={() => setPreview(t)}>
                    Preview
                  </Button>
                  <ButtonLink to={`/admin/contracts/new?template=${t.id}`} variant="ghost" size="sm">
                    Use template
                  </ButtonLink>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview ? `${preview.name} — ${preview.kind}` : undefined}
        description={preview ? `${preview.version} · last changed ${formatDate(preview.updated)} by Legal` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => { toast.success("Template downloaded", `${preview?.kind} agreement ${preview?.version}, PDF.`); }}>
              Download PDF
            </Button>
            <ButtonLink to={`/admin/contracts/new?template=${preview?.id ?? ""}`}>Use this template</ButtonLink>
          </>
        }
      >
        {preview && (
          <div className="flex flex-col gap-5 pb-2">
            <dl className="grid grid-cols-2 gap-4 border-y border-line py-4">
              <div>
                <dt className="t-micro text-ink-3">Default customer price</dt>
                <dd className="t-body font-medium text-ink tnum">{formatNaira(preview.price)}</dd>
              </div>
              <div>
                <dt className="t-micro text-ink-3">Default operator payout</dt>
                <dd className="t-body font-medium text-ink tnum">{formatNaira(preview.payout)}</dd>
              </div>
            </dl>
            <ol className="flex flex-col divide-y divide-line">
              {preview.clauses.map((c, i) => (
                <li key={c} className="flex gap-3 py-2.5">
                  <span className="w-6 shrink-0 t-mono text-ink-3">§{i + 1}</span>
                  <span className="t-small text-ink">{c}</span>
                </li>
              ))}
            </ol>
            <p className="t-small text-ink-3">Parties: Slate Technologies Ltd and the contracted operator. Customer relationships, pricing and data remain with Slate.</p>
          </div>
        )}
      </Modal>
    </Page>
  );
}
