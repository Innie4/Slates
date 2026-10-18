import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { ChevronDown, Printer, Scale } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui";

/**
 * Legal template, one layout for every legal document on slate.ng.
 * Title, effective date, an "in short" summary, a table of contents
 * (sticky rail on desktop, collapsible on phones) and numbered sections
 * with numbered clauses (3.1, 3.2 …).
 */

export type LegalDocKey = "terms" | "privacy" | "waste-service-terms" | "operator-terms" | "cookies";

export const LEGAL_DOCS: Array<{ key: LegalDocKey; title: string; short: string; to: string; blurb: string }> = [
  { key: "terms", title: "Terms of use", short: "Terms", to: "/terms", blurb: "Using slate.ng and the Slate apps." },
  { key: "privacy", title: "Privacy policy", short: "Privacy", to: "/privacy", blurb: "What we collect, why, and your rights under the NDPA." },
  { key: "waste-service-terms", title: "Waste service terms", short: "Waste service", to: "/waste-service-terms", blurb: "Collections, payments, missed pickups and suspension." },
  { key: "operator-terms", title: "Operator terms", short: "Operators", to: "/operator-terms", blurb: "For contracted waste operators: SLAs, payouts, penalties." },
  { key: "cookies", title: "Cookie policy", short: "Cookies", to: "/cookies", blurb: "The small files we store and how to control them." },
];

export interface LegalSection {
  /** Anchor id, e.g. "data-we-collect" */
  id: string;
  title: string;
  /** Paragraph(s) before the numbered clauses. Strings become paragraphs. */
  intro?: ReactNode | ReactNode[];
  /** Each clause is numbered automatically: <section>.<n> */
  clauses?: ReactNode[];
  /** Paragraph(s) after the clauses. */
  outro?: ReactNode | ReactNode[];
}

export interface LegalPageProps {
  doc: LegalDocKey;
  title: string;
  /** One or two sentences under the title. */
  lede: string;
  /** e.g. "1 April 2026" */
  effective: string;
  /** e.g. "14 September 2026" */
  updated: string;
  version?: string;
  /** 3–5 plain-language points shown in the "In short" panel. */
  summary: string[];
  sections: LegalSection[];
  /** Mailbox for questions about this document. */
  contactEmail?: string;
}

const asParagraphs = (node: ReactNode | ReactNode[] | undefined) => {
  if (node === undefined || node === null) return null;
  const list = Array.isArray(node) ? node : [node];
  return list.map((n, i) => (typeof n === "string" ? <p key={i}>{n}</p> : <div key={i}>{n}</div>));
};

/** Body copy styles for anything inside a legal section. */
const prose =
  "t-body text-ink-2 [&_p+p]:mt-3 [&_strong]:font-semibold [&_strong]:text-ink [&_a]:font-medium [&_a]:text-ink [&_a]:underline [&_a]:decoration-line-strong [&_a]:underline-offset-4 hover:[&_a]:decoration-ink";

export function LegalPage({ doc, title, lede, effective, updated, version, summary, sections, contactEmail = "legal@slate.ng" }: LegalPageProps) {
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const [tocOpen, setTocOpen] = useState(false);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-18% 0px -70% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  const go = (id: string) => {
    setTocOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  const others = LEGAL_DOCS.filter((d) => d.key !== doc);

  return (
    <div className="container-page pb-20 pt-6 md:pb-28 md:pt-10">
      {/* Legal document switcher */}
      <nav aria-label="Legal documents" className="-mx-5 overflow-x-auto px-5 scrollbar-none md:mx-0 md:px-0">
        <ul className="flex min-w-max gap-1 border-b border-line">
          {LEGAL_DOCS.map((d) => (
            <li key={d.key}>
              <Link
                to={d.to}
                aria-current={d.key === doc ? "page" : undefined}
                className={cn(
                  "-mb-px flex h-11 items-center border-b-2 px-3 text-[14px] font-medium transition-colors first:pl-0",
                  d.key === doc ? "border-ink text-ink" : "border-transparent text-ink-3 hover:text-ink",
                )}
              >
                {d.short}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <header className="flex flex-col gap-5 pb-10 pt-10 md:pb-14 md:pt-16">
        <p className="t-small font-medium text-ink-3">Legal</p>
        <h1 className="t-display max-w-3xl text-ink">{title}</h1>
        <p className="t-body max-w-2xl text-ink-2 md:text-[17px] md:leading-relaxed">{lede}</p>
        <dl className="mt-1 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-5">
          <div>
            <dt className="t-micro text-ink-3">Effective</dt>
            <dd className="t-small font-medium text-ink tnum">{effective}</dd>
          </div>
          <div>
            <dt className="t-micro text-ink-3">Last updated</dt>
            <dd className="t-small font-medium text-ink tnum">{updated}</dd>
          </div>
          {version && (
            <div>
              <dt className="t-micro text-ink-3">Version</dt>
              <dd className="t-mono text-ink">{version}</dd>
            </div>
          )}
          <div className="flex items-end sm:ml-auto">
            <p className="inline-flex items-center gap-2 rounded-sm border border-dashed border-line-strong px-2.5 py-1 t-micro text-ink-3">
              <Scale className="size-3.5" aria-hidden />
              Template, to be reviewed by counsel
            </p>
          </div>
        </dl>
      </header>

      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[260px_minmax(0,680px)] xl:gap-20">
        {/* Contents: sticky rail on desktop */}
        <aside className="hidden lg:block">
          <nav aria-label="Contents" className="sticky top-[104px] max-h-[calc(100dvh-136px)] overflow-y-auto pb-6 scrollbar-none">
            <p className="mb-3 t-micro text-ink-3">Contents</p>
            <ol className="flex flex-col border-l border-line">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      go(s.id);
                    }}
                    aria-current={active === s.id ? "location" : undefined}
                    className={cn(
                      "-ml-px flex gap-3 border-l-2 py-1.5 pl-4 pr-2 t-small transition-colors",
                      active === s.id ? "border-ink font-medium text-ink" : "border-transparent text-ink-3 hover:text-ink",
                    )}
                  >
                    <span className="w-5 shrink-0 t-mono text-[12px] leading-5 text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                    <span>{s.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <div className="min-w-0 max-w-[680px]">
          {/* In short */}
          <section aria-label="In short" className="rounded-lg bg-sunken p-5 sm:p-6">
            <h2 className="t-h3 text-ink">In short</h2>
            <ul className="mt-3 flex flex-col divide-y divide-line">
              {summary.map((s, i) => (
                <li key={i} className="flex gap-3 py-2.5 t-body text-ink-2 first:pt-1 last:pb-0">
                  <span className="mt-[11px] h-px w-3 shrink-0 bg-ink-3" aria-hidden />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Contents: collapsible on phones */}
          <div className="mt-6 rounded-lg border border-line bg-surface lg:hidden">
            <button
              type="button"
              aria-expanded={tocOpen}
              onClick={() => setTocOpen((o) => !o)}
              className="flex h-13 w-full items-center justify-between gap-3 px-4 text-left"
            >
              <span className="t-small font-medium text-ink">Contents</span>
              <span className="flex items-center gap-2 t-small text-ink-3">
                {sections.length} sections
                <ChevronDown className={cn("size-4 transition-transform", tocOpen && "rotate-180")} />
              </span>
            </button>
            {tocOpen && (
              <ol className="flex flex-col border-t border-line px-2 py-2 animate-fade-in">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => go(s.id)} className="flex w-full gap-3 rounded-md px-2 py-2.5 text-left t-small text-ink-2 hover:bg-sunken hover:text-ink">
                      <span className="w-5 shrink-0 t-mono text-[12px] leading-5 text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                      {s.title}
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Sections */}
          <div className="mt-4">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-24 border-t border-line pt-8 mt-10 first:mt-8 lg:scroll-mt-28">
                <h2 className="flex items-baseline gap-3 t-h2 text-ink">
                  <span className="t-mono text-[13px] font-medium text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </h2>
                {s.intro !== undefined && <div className={cn("mt-4", prose)}>{asParagraphs(s.intro)}</div>}
                {s.clauses && s.clauses.length > 0 && (
                  <ol className="mt-4 flex flex-col gap-4">
                    {s.clauses.map((c, j) => (
                      <li key={j} className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-1">
                        <span className="t-mono pt-[3px] text-[12.5px] text-ink-3">
                          {i + 1}.{j + 1}
                        </span>
                        <div className={prose}>{typeof c === "string" ? <p>{c}</p> : c}</div>
                      </li>
                    ))}
                  </ol>
                )}
                {s.outro !== undefined && <div className={cn("mt-4", prose)}>{asParagraphs(s.outro)}</div>}
              </section>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-14 flex flex-col gap-5 border-t border-ink pt-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="t-h3 text-ink">Questions about this document</p>
              <p className="t-small text-ink-2">
                Write to{" "}
                <a href={`mailto:${contactEmail}`} className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                  {contactEmail}
                </a>{" "}
                or Slate Technologies Ltd, 22 Udo Udoma Avenue, Uyo, Akwa Ibom.
              </p>
            </div>
            <Button variant="outline" size="sm" leading={<Printer className="size-4" />} onClick={() => window.print()} className="self-start">
              Print or save as PDF
            </Button>
          </div>

          <nav aria-label="Other legal documents" className="mt-12">
            <p className="mb-2 t-micro text-ink-3">Other legal documents</p>
            <ul className="divide-y divide-line border-y border-line">
              {others.map((d) => (
                <li key={d.key}>
                  <Link to={d.to} className="group flex items-baseline justify-between gap-4 py-3.5">
                    <span className="t-body font-medium text-ink group-hover:underline group-hover:underline-offset-4">{d.title}</span>
                    <span className="t-small text-right text-ink-3">{d.blurb}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Building blocks for clause content                                  */
/* ------------------------------------------------------------------ */

/** Bulleted (or lettered) list inside a clause. */
export function LegalList({ items, ordered }: { items: ReactNode[]; ordered?: boolean }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className="mt-2.5 flex flex-col gap-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          <span className={cn("shrink-0 text-ink-3", ordered ? "t-mono w-5 pt-[2px] text-[12.5px]" : "mt-[11px] h-px w-2.5 bg-ink-3")} aria-hidden>
            {ordered ? `(${String.fromCharCode(97 + i)})` : null}
          </span>
          <span className="min-w-0">{it}</span>
        </li>
      ))}
    </Tag>
  );
}

/** Table inside a section (e.g. the cookie list). Stacks into rows on phones. */
export function LegalTable({ columns, rows, caption }: { columns: string[]; rows: ReactNode[][]; caption?: string }) {
  return (
    <div className="mt-4">
      {caption && <p className="mb-2 t-micro text-ink-3">{caption}</p>}
      <div className="hidden overflow-hidden rounded-md border border-line md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-sunken/70">
              {columns.map((c) => (
                <th key={c} scope="col" className="px-3.5 py-2.5 t-micro font-medium text-ink-3">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-line align-top last:border-0">
                {r.map((cell, j) => (
                  <td key={j} className={cn("px-3.5 py-3 t-small", j === 0 ? "font-medium text-ink" : "text-ink-2")}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-line border-y border-line md:hidden">
        {rows.map((r, i) => (
          <dl key={i} className="flex flex-col gap-1.5 py-3.5">
            {r.map((cell, j) =>
              j === 0 ? (
                <dt key={j} className="t-small font-semibold text-ink">
                  {cell}
                </dt>
              ) : (
                <div key={j} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3">
                  <span className="t-micro pt-0.5 text-ink-3">{columns[j]}</span>
                  <dd className="t-small text-ink-2">{cell}</dd>
                </div>
              ),
            )}
          </dl>
        ))}
      </div>
    </div>
  );
}

/** Defined term, e.g. <Term>"Operator"</Term> means … */
export function Term({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-ink">{children}</strong>;
}

/** A quiet aside inside a section, for plain-language explanations. */
export function LegalNote({ children, title = "In plain language" }: { children: ReactNode; title?: string }) {
  return (
    <aside className="mt-4 border-l-2 border-ink pl-4">
      <p className="t-micro text-ink-3">{title}</p>
      <div className="mt-1 t-body text-ink">{children}</div>
    </aside>
  );
}
