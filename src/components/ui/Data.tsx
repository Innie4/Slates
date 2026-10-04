import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Check, SlidersHorizontal, Download, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";
import { SearchInput, Select } from "./Field";
import { EmptyState } from "./Feedback";
import { Modal } from "./Overlay";

/* ------------------------------------------------------------------ */
/* DataTable — table on ≥768px, stacked rows on phones                 */
/* ------------------------------------------------------------------ */

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  align?: "left" | "right" | "center";
  className?: string;
  /** Hide in the stacked mobile layout */
  hideOnMobile?: boolean;
  /** Label used in the mobile layout (defaults to header) */
  mobileLabel?: string;
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  rowHref,
  mobile,
  pageSize = 10,
  empty,
  className,
  dense,
  selectable,
  selected,
  onSelectedChange,
  footer,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  rowHref?: (row: T) => string;
  /** Custom mobile row renderer */
  mobile?: (row: T) => ReactNode;
  pageSize?: number;
  empty?: ReactNode;
  className?: string;
  dense?: boolean;
  selectable?: boolean;
  selected?: string[];
  onSelectedChange?: (keys: string[]) => void;
  footer?: ReactNode;
}) {
  const navigate = useNavigate();
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const sv = col.sortValue;
    return [...rows].sort((a, b) => {
      const x = sv(a), y = sv(b);
      const r = x < y ? -1 : x > y ? 1 : 0;
      return sort.dir === "asc" ? r : -r;
    });
  }, [rows, sort, columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const visible = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const go = (row: T) => {
    if (onRowClick) onRowClick(row);
    else if (rowHref) navigate(rowHref(row));
  };
  const clickable = !!(onRowClick || rowHref);
  const sel = selected ?? [];
  const allVisibleSelected = visible.length > 0 && visible.every((r) => sel.includes(rowKey(r)));

  if (rows.length === 0) return <>{empty ?? <EmptyState title="No results" description="Try a different filter or search." compact />}</>;

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-lg border border-line bg-surface md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-sunken/60">
              {selectable && (
                <th className="w-10 pl-4">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={allVisibleSelected}
                    onChange={() =>
                      onSelectedChange?.(allVisibleSelected ? sel.filter((k) => !visible.some((r) => rowKey(r) === k)) : [...new Set([...sel, ...visible.map(rowKey)])])
                    }
                    className="size-4 accent-[var(--slate)]"
                  />
                </th>
              )}
              {columns.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    className={cn(
                      "whitespace-nowrap px-4 t-micro font-medium text-ink-3",
                      dense ? "h-9" : "h-11",
                      c.align === "right" && "text-right",
                      c.align === "center" && "text-center",
                      c.className,
                    )}
                  >
                    {c.sortValue ? (
                      <button
                        type="button"
                        className={cn("inline-flex items-center gap-1 hover:text-ink", active && "text-ink")}
                        onClick={() => setSort(active && sort!.dir === "desc" ? null : { key: c.key, dir: active ? "desc" : "asc" })}
                      >
                        {c.header}
                        {active ? sort!.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : <ChevronsUpDown className="size-3 opacity-50" />}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const k = rowKey(row);
              return (
                <tr
                  key={k}
                  onClick={clickable ? () => go(row) : undefined}
                  className={cn(
                    "border-b border-line last:border-0 transition-colors",
                    clickable && "cursor-pointer hover:bg-sunken/50",
                    sel.includes(k) && "bg-stone/40",
                  )}
                >
                  {selectable && (
                    <td className="pl-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label="Select row"
                        checked={sel.includes(k)}
                        onChange={() => onSelectedChange?.(sel.includes(k) ? sel.filter((x) => x !== k) : [...sel, k])}
                        className="size-4 accent-[var(--slate)]"
                      />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "px-4 t-small text-ink",
                        dense ? "py-2.5" : "py-3.5",
                        c.align === "right" && "text-right",
                        c.align === "center" && "text-center",
                        c.className,
                      )}
                    >
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked rows */}
      <div className="divide-y divide-line border-y border-line md:hidden">
        {visible.map((row) => {
          const k = rowKey(row);
          if (mobile)
            return (
              <div key={k} onClick={clickable ? () => go(row) : undefined} className={cn("py-3.5", clickable && "cursor-pointer active:bg-sunken")}>
                {mobile(row)}
              </div>
            );
          const [first, second, ...rest] = columns.filter((c) => !c.hideOnMobile);
          const last = rest.pop();
          return (
            <div key={k} onClick={clickable ? () => go(row) : undefined} className={cn("flex flex-col gap-2 py-3.5", clickable && "cursor-pointer active:bg-sunken")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 t-body font-medium text-ink">{first?.cell(row)}</div>
                {last && <div className="shrink-0">{last.cell(row)}</div>}
              </div>
              {second && <div className="t-small text-ink-2">{second.cell(row)}</div>}
              {rest.length > 0 && (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {rest.map((c) => (
                    <div key={c.key} className="flex min-w-0 flex-col">
                      <dt className="t-micro text-ink-3">{c.mobileLabel ?? c.header}</dt>
                      <dd className="t-small truncate text-ink">{c.cell(row)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          );
        })}
      </div>

      {(pages > 1 || footer) && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="t-small text-ink-3 tnum">
            {safePage * pageSize + 1}–{Math.min(sorted.length, (safePage + 1) * pageSize)} of {sorted.length}
          </p>
          {footer}
          {pages > 1 && <Pagination page={safePage} pages={pages} onChange={setPage} />}
        </div>
      )}
    </div>
  );
}

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  const nums: Array<number | "…"> = [];
  for (let i = 0; i < pages; i++) {
    if (i === 0 || i === pages - 1 || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  return (
    <nav className="flex items-center gap-1" aria-label="Pagination">
      <button type="button" disabled={page === 0} onClick={() => onChange(page - 1)} className="flex size-9 items-center justify-center rounded-md text-ink-2 hover:bg-sunken disabled:opacity-30" aria-label="Previous page">
        <ChevronLeft className="size-4" />
      </button>
      {nums.map((n, i) =>
        n === "…" ? (
          <span key={`e${i}`} className="w-6 text-center t-small text-ink-3">…</span>
        ) : (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-current={n === page ? "page" : undefined}
            className={cn("hidden size-9 items-center justify-center rounded-md t-small tnum sm:flex", n === page ? "bg-ink font-semibold text-surface" : "text-ink-2 hover:bg-sunken")}
          >
            {n + 1}
          </button>
        ),
      )}
      <span className="t-small px-2 text-ink-2 tnum sm:hidden">
        {page + 1} / {pages}
      </span>
      <button type="button" disabled={page >= pages - 1} onClick={() => onChange(page + 1)} className="flex size-9 items-center justify-center rounded-md text-ink-2 hover:bg-sunken disabled:opacity-30" aria-label="Next page">
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* FilterBar                                                           */
/* ------------------------------------------------------------------ */

export interface FilterDef {
  key: string;
  label: string;
  options: string[];
}

/**
 * Search + filter selects. On phones, filters move into a sheet behind a
 * "Filters" button so the list stays visible.
 */
export function FilterBar({
  search,
  onSearch,
  placeholder = "Search",
  filters = [],
  values = {},
  onChange,
  actions,
  onExport,
  className,
}: {
  search?: string;
  onSearch?: (v: string) => void;
  placeholder?: string;
  filters?: FilterDef[];
  values?: Record<string, string>;
  onChange?: (key: string, value: string) => void;
  actions?: ReactNode;
  onExport?: (format: "CSV" | "PDF" | "Print") => void;
  className?: string;
}) {
  const [sheet, setSheet] = useState(false);
  const activeCount = Object.values(values).filter(Boolean).length;
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2">
        {onSearch && (
          <div className="min-w-0 flex-1 lg:max-w-sm">
            <SearchInput compact value={search ?? ""} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
          </div>
        )}
        {filters.length > 0 && (
          <Button variant="outline" size="md" className="!h-10 lg:hidden" leading={<SlidersHorizontal className="size-4" />} onClick={() => setSheet(true)}>
            Filters{activeCount > 0 && <span className="ml-1 rounded-sm bg-ink px-1.5 text-[12px] text-surface">{activeCount}</span>}
          </Button>
        )}
        <div className="hidden items-center gap-2 lg:flex">
          {filters.map((f) => (
            <Select
              key={f.key}
              compact
              aria-label={f.label}
              value={values[f.key] ?? ""}
              onChange={(e) => onChange?.(f.key, e.target.value)}
              options={f.options}
              placeholder={`${f.label}: All`}
              className="!h-10 min-w-36"
            />
          ))}
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" leading={<X className="size-3.5" />} onClick={() => filters.forEach((f) => onChange?.(f.key, ""))}>
              Clear
            </Button>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {onExport && <ExportMenu onExport={onExport} />}
          {actions}
        </div>
      </div>
      <Modal
        open={sheet}
        onClose={() => setSheet(false)}
        title="Filters"
        footer={
          <>
            <Button variant="ghost" onClick={() => filters.forEach((f) => onChange?.(f.key, ""))}>
              Clear all
            </Button>
            <Button onClick={() => setSheet(false)}>Show results</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 pb-2">
          {filters.map((f) => (
            <Select key={f.key} label={f.label} value={values[f.key] ?? ""} onChange={(e) => onChange?.(f.key, e.target.value)} options={f.options} placeholder="All" />
          ))}
        </div>
      </Modal>
    </div>
  );
}

export function ExportMenu({ onExport }: { onExport: (f: "CSV" | "PDF" | "Print") => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="outline" className="!h-10" leading={<Download className="size-4" />} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="hidden sm:inline">Export</span>
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-full z-50 mt-1.5 w-40 overflow-hidden rounded-md border border-line bg-surface py-1.5 shadow-float animate-pop-in" role="menu">
            {(["CSV", "PDF", "Print"] as const).map((f) => (
              <button key={f} type="button" role="menuitem" className="flex w-full px-3.5 py-2.5 text-left text-[14px] text-ink hover:bg-sunken" onClick={() => { setOpen(false); onExport(f); }}>
                {f === "Print" ? "Print" : `Download ${f}`}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Hook: filter rows by search text and select filters. */
export function useFilteredRows<T>(rows: T[], opts: { search: string; searchFields: (r: T) => string; filters?: Record<string, string>; filterFields?: Record<string, (r: T) => string> }) {
  return useMemo(() => {
    const q = opts.search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !opts.searchFields(r).toLowerCase().includes(q)) return false;
      for (const [k, v] of Object.entries(opts.filters ?? {})) {
        if (!v) continue;
        const get = opts.filterFields?.[k];
        if (get && get(r) !== v) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, opts.search, JSON.stringify(opts.filters)]);
}

/* ------------------------------------------------------------------ */
/* Stat                                                                */
/* ------------------------------------------------------------------ */

export function Stat({
  label,
  value,
  delta,
  deltaGood = "up",
  hint,
  chart,
  className,
  to,
  emphasis,
}: {
  label: ReactNode;
  value: ReactNode;
  delta?: number;
  deltaGood?: "up" | "down";
  hint?: ReactNode;
  chart?: ReactNode;
  className?: string;
  to?: string;
  emphasis?: boolean;
}) {
  const navigate = useNavigate();
  const good = delta === undefined ? null : deltaGood === "up" ? delta >= 0 : delta <= 0;
  return (
    <div
      onClick={to ? () => navigate(to) : undefined}
      className={cn("flex flex-col gap-1.5", to && "cursor-pointer", className)}
    >
      <span className="t-micro text-ink-3">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className={cn("font-display font-bold tracking-[-0.02em] text-ink tnum", emphasis ? "text-[34px] leading-none" : "text-[24px] leading-tight")}>{value}</span>
        {delta !== undefined && (
          <span className={cn("t-micro inline-flex items-center gap-0.5 tnum", good ? "text-success" : "text-danger")}>
            {delta >= 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
            {Math.abs(delta).toFixed(1).replace(/\.0$/, "")}%
          </span>
        )}
      </div>
      {hint && <span className="t-small text-ink-3">{hint}</span>}
      {chart && <div className="mt-1">{chart}</div>}
    </div>
  );
}

/** A row of stats separated by hairlines — not boxes. */
export function StatStrip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3 lg:grid-cols-4 [&>*]:bg-surface [&>*]:p-4 sm:[&>*]:p-5", className)}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

export interface TimelineItem {
  title: ReactNode;
  time?: ReactNode;
  description?: ReactNode;
  state?: "done" | "current" | "upcoming" | "failed";
}

export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn("relative flex flex-col", className)}>
      {items.map((it, i) => {
        const state = it.state ?? "done";
        const last = i === items.length - 1;
        return (
          <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
            {!last && (
              <span className={cn("absolute left-[9px] top-6 h-[calc(100%-20px)] w-0.5", state === "done" ? "bg-ink" : "bg-line")} aria-hidden />
            )}
            <span
              className={cn(
                "relative z-10 mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                state === "done" && "bg-ink text-surface",
                state === "current" && "bg-signal ring-4 ring-signal/20",
                state === "upcoming" && "border-2 border-line-strong bg-surface",
                state === "failed" && "bg-danger text-white",
              )}
            >
              {state === "done" && <Check className="size-3" strokeWidth={3} />}
              {state === "failed" && <X className="size-3" strokeWidth={3} />}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className={cn("t-body font-medium", state === "upcoming" ? "text-ink-3" : "text-ink")}>{it.title}</span>
                {it.time && <span className="t-small text-ink-3 tnum">{it.time}</span>}
              </div>
              {it.description && <div className="t-small text-ink-2">{it.description}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Stepper                                                             */
/* ------------------------------------------------------------------ */

export function Stepper({ steps, current, className, onStepClick }: { steps: string[]; current: number; className?: string; onStepClick?: (i: number) => void }) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3 md:hidden">
        <span className="t-small font-medium text-ink">{steps[current]}</span>
        <span className="t-small text-ink-3 tnum">
          Step {current + 1} of {steps.length}
        </span>
      </div>
      <div className="mt-2 flex gap-1 md:hidden">
        {steps.map((_, i) => (
          <span key={i} className={cn("h-1 flex-1 rounded-full", i <= current ? "bg-ink" : "bg-line")} />
        ))}
      </div>
      <ol className="hidden items-center gap-2 md:flex">
        {steps.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2 last:flex-none">
            <button
              type="button"
              disabled={!onStepClick || i > current}
              onClick={() => onStepClick?.(i)}
              className="flex items-center gap-2 disabled:cursor-default"
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold tnum",
                  i < current && "bg-ink text-surface",
                  i === current && "bg-signal text-signal-ink",
                  i > current && "border border-line-strong text-ink-3",
                )}
              >
                {i < current ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span className={cn("whitespace-nowrap t-small", i === current ? "font-semibold text-ink" : i < current ? "text-ink-2" : "text-ink-3")}>{s}</span>
            </button>
            {i < steps.length - 1 && <span className={cn("h-px min-w-3 flex-1", i < current ? "bg-ink" : "bg-line")} />}
          </li>
        ))}
      </ol>
    </div>
  );
}
