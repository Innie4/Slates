import type { ReactNode } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

/* ------------------------------------------------------------------ */
/* Avatar                                                              */
/* ------------------------------------------------------------------ */

const AVATAR_TONES = ["bg-slate text-slate-ink", "bg-stone text-stone-ink", "bg-slate-600 text-white", "bg-slate-300 text-slate-900", "bg-slate-800 text-slate-100"];

export function Avatar({ name, src, size = "md", className, square }: { name: string; src?: string; size?: "xs" | "sm" | "md" | "lg" | "xl"; className?: string; square?: boolean }) {
  const sizes = { xs: "size-6 text-[11px]", sm: "size-8 text-[12px]", md: "size-10 text-[13px]", lg: "size-14 text-[17px]", xl: "size-20 text-[24px]" };
  const tone = AVATAR_TONES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TONES.length];
  return (
    <span className={cn("inline-flex shrink-0 select-none items-center justify-center overflow-hidden font-semibold", square ? "rounded-md" : "rounded-full", sizes[size], !src && tone, className)}>
      {src ? <img src={src} alt={name} className="size-full object-cover" /> : initials(name)}
    </span>
  );
}

export function AvatarStack({ names, max = 4, size = "sm" }: { names: string[]; max?: number; size?: "xs" | "sm" }) {
  const shown = names.slice(0, max);
  return (
    <div className="flex items-center">
      {shown.map((n) => (
        <Avatar key={n} name={n} size={size} className="-ml-2 ring-2 ring-surface first:ml-0" />
      ))}
      {names.length > max && <span className="t-micro ml-1.5 text-ink-3">+{names.length - max}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Breadcrumbs + PageHeader                                            */
/* ------------------------------------------------------------------ */

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex min-w-0 items-center gap-1 t-small text-ink-3", className)}>
      {items.map((c, i) => (
        <span key={i} className="flex min-w-0 items-center gap-1">
          {i > 0 && <ChevronRight className="size-3.5 shrink-0" aria-hidden />}
          {c.to ? (
            <Link to={c.to} className="truncate hover:text-ink">
              {c.label}
            </Link>
          ) : (
            <span className="truncate text-ink-2" aria-current="page">
              {c.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

/**
 * PageHeader — page title, optional back link / breadcrumbs, description,
 * meta (badges) and actions. On mobile, actions wrap under the title.
 */
export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  back,
  meta,
  className,
  eyebrow,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: Crumb[];
  back?: { to: string; label: string };
  meta?: ReactNode;
  className?: string;
  eyebrow?: ReactNode;
}) {
  return (
    <header className={cn("page-head relative flex flex-col gap-3 overflow-hidden border-b border-line pb-6 sm:pb-7", className)}>
      <div className="pointer-events-none absolute right-0 top-1 hidden h-20 w-[min(34vw,360px)] opacity-70 sm:block" aria-hidden>
        <svg viewBox="0 0 360 80" className="size-full" preserveAspectRatio="none">
          <path d="M-20 64 C70 58 118 30 196 36 S298 64 390 12" fill="none" stroke="var(--line-strong)" strokeWidth="1.5" strokeDasharray="3 8" />
          <path d="M150 40 C184 36 216 45 244 49" fill="none" stroke="var(--signal)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="150" cy="40" r="4" fill="var(--signal)" />
          <circle cx="244" cy="49" r="4" fill="var(--canvas)" stroke="var(--ink-3)" strokeWidth="1.5" />
        </svg>
      </div>
      {back && (
        <Link to={back.to} className="-ml-1 inline-flex w-fit items-center gap-1 rounded-sm t-small font-medium text-ink-2 hover:text-ink">
          <ChevronLeft className="size-4" />
          {back.label}
        </Link>
      )}
      {breadcrumbs && !back && <Breadcrumbs items={breadcrumbs} className="hidden sm:flex" />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="relative z-10 flex min-w-0 flex-col gap-1.5">
          <span className="mb-1 flex items-center gap-2 t-micro uppercase tracking-[.08em] text-ink-3">
            <span className="h-0.5 w-7 bg-signal" />
            {eyebrow ?? "Slate · Uyo operations"}
          </span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="font-display text-[clamp(2rem,1.7rem+1.2vw,2.8rem)] font-bold leading-[1.02] tracking-[-.035em] text-ink">{title}</h1>
            {meta}
          </div>
          {description && <p className="t-body max-w-2xl text-ink-2">{description}</p>}
        </div>
        {actions && <div className="relative z-10 flex flex-wrap items-center gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">{actions}</div>}
      </div>
    </header>
  );
}

/** Standard page body spacing used inside portal layouts. */
export function Page({ children, className, narrow }: { children: ReactNode; className?: string; narrow?: boolean }) {
  return <div className={cn("mx-auto flex w-full flex-col gap-8 pb-10 md:gap-10", narrow ? "max-w-3xl" : "max-w-[1240px]", className)}>{children}</div>;
}

/** Keyboard key hint */
export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] border border-line-strong bg-surface px-1 font-mono text-[11px] text-ink-3">{children}</kbd>;
}

/** Inline mono reference, e.g. PU-26-08813 */
export function Ref({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("t-mono text-ink-2", className)}>{children}</span>;
}
