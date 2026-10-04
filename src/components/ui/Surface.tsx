import type { ElementType, ReactNode } from "react";
import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Panel — a contained surface. Use only when the content is an object
 * (a pickup, an invoice, a contract) or needs a boundary. Group sections
 * with space and hairlines first (DIRECTION.md §4).
 */
export function Panel({
  children,
  className,
  title,
  description,
  actions,
  footer,
  padded = true,
  as: As = "section",
  tone = "surface",
}: {
  children?: ReactNode;
  className?: string;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  padded?: boolean;
  as?: ElementType;
  tone?: "surface" | "sunken" | "slate";
}) {
  return (
    <As
      className={cn(
        "overflow-hidden rounded-lg",
        tone === "surface" && "border border-line bg-surface",
        tone === "sunken" && "bg-sunken",
        tone === "slate" && "bg-slate text-slate-ink chalk-grain",
        className,
      )}
    >
      {(title || actions) && (
        <header className={cn("flex items-start justify-between gap-4", padded ? "px-5 pt-5 sm:px-6 sm:pt-6" : "px-5 pt-5")}>
          <div className="min-w-0">
            {title && <h3 className="t-h3">{title}</h3>}
            {description && <p className={cn("t-small mt-0.5", tone === "slate" ? "text-slate-ink/70" : "text-ink-2")}>{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      {children && <div className={cn(padded && "p-5 sm:p-6", padded && (title || actions) && "pt-4 sm:pt-4")}>{children}</div>}
      {footer && <footer className={cn("border-t px-5 py-3.5 sm:px-6", tone === "slate" ? "border-white/10" : "border-line")}>{footer}</footer>}
    </As>
  );
}

/** Section — a titled group on a page, separated by space, not a box. */
export function Section({
  title,
  description,
  actions,
  children,
  className,
  id,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("flex flex-col gap-4", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            {title && <h2 className="t-h2 text-ink">{title}</h2>}
            {description && <p className="t-small mt-1 text-ink-2">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Divider({ className, label }: { className?: string; label?: ReactNode }) {
  if (label)
    return (
      <div className={cn("flex items-center gap-3 t-micro text-ink-3", className)}>
        <span className="h-px flex-1 bg-line" />
        {label}
        <span className="h-px flex-1 bg-line" />
      </div>
    );
  return <hr className={cn("border-0 border-t border-line", className)} />;
}

/** Key/value description list. `columns` controls the grid on wider screens. */
export function DescriptionList({
  items,
  columns = 2,
  className,
  dense,
}: {
  items: Array<{ label: ReactNode; value: ReactNode; mono?: boolean; full?: boolean }>;
  columns?: 1 | 2 | 3;
  className?: string;
  dense?: boolean;
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-8",
        dense ? "gap-y-3" : "gap-y-5",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {items.map((it, i) => (
        <div key={i} className={cn("flex flex-col gap-0.5", it.full && "sm:col-span-full")}>
          <dt className="t-micro text-ink-3">{it.label}</dt>
          <dd className={cn("text-ink", it.mono ? "t-mono" : "t-body")}>{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Row in a hairline list. Becomes a link when `to` is set. */
export function ListRow({
  to,
  onClick,
  leading,
  title,
  subtitle,
  meta,
  trailing,
  chevron,
  className,
}: {
  to?: string;
  onClick?: () => void;
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  className?: string;
}) {
  const inner = (
    <>
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="t-body truncate font-medium text-ink">{title}</div>
        {subtitle && <div className="t-small truncate text-ink-2">{subtitle}</div>}
      </div>
      {(meta || trailing) && (
        <div className="flex shrink-0 flex-col items-end gap-1 text-right">
          {meta && <div className="t-small text-ink-2 tnum">{meta}</div>}
          {trailing}
        </div>
      )}
      {(chevron ?? !!to) && <ChevronRight className="size-4 shrink-0 text-ink-3" aria-hidden />}
    </>
  );
  const cls = cn("flex items-center gap-3.5 py-3.5", (to || onClick) && "group -mx-2 rounded-md px-2 transition-colors hover:bg-sunken/70", className);
  if (to)
    return (
      <Link to={to} className={cls}>
        {inner}
      </Link>
    );
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={cn(cls, "w-[calc(100%+1rem)] text-left")}>
        {inner}
      </button>
    );
  return <div className={cls}>{inner}</div>;
}

export function List({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("divide-y divide-line", className)}>{children}</div>;
}

/** Glyph in a neutral square — only for settings-like lists. */
export function Glyph({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "slate" | "signal"; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-10 items-center justify-center rounded-md [&_svg]:size-[18px]",
        tone === "neutral" && "bg-sunken text-ink-2",
        tone === "slate" && "bg-slate text-slate-ink",
        tone === "signal" && "bg-signal text-signal-ink",
        className,
      )}
    >
      {children}
    </span>
  );
}
