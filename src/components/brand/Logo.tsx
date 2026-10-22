import { Link } from "react-router";
import { cn } from "@/lib/cn";

export function BrandMark({ className = "size-8", tone = "ink" }: { className?: string; tone?: "ink" | "light" }) {
  return <span className={cn("inline-flex shrink-0 items-center justify-center", className)} aria-hidden="true">
    {tone === "light" ? (
      <img src="/brand/slate-mark-white.svg" alt="" width="63" height="83" className="size-full object-contain" />
    ) : <>
      <img src="/brand/slate-mark-grey.svg" alt="" width="63" height="83" className="size-full object-contain dark:hidden" />
      <img src="/brand/slate-mark-white.svg" alt="" width="63" height="83" className="hidden size-full object-contain dark:block" />
    </>}
  </span>;
}

/** Shared Slate logo for public pages, account portals and documents. */
export function Logo({
  to = "/",
  className,
  tone = "ink",
  label,
  compact,
}: {
  to?: string | null;
  className?: string;
  tone?: "ink" | "light";
  /** Optional portal label, e.g. "Operator" or "Admin" */
  label?: string;
  compact?: boolean;
}) {
  const content = (
    <span className={cn("inline-flex items-center gap-2", tone === "light" ? "text-slate-ink" : "text-ink", className)}>
      <BrandMark tone={tone} />
      {!compact && (
        <span className="font-display text-[22px] font-bold leading-none tracking-[-0.04em]" style={{ fontVariationSettings: '"opsz" 32, "wdth" 90' }}>
          slate
        </span>
      )}
      {label && !compact && (
        <span
          className={cn(
            "ml-0.5 rounded-sm px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
            tone === "light" ? "bg-white/12 text-slate-ink" : "bg-sunken text-ink-2",
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
  if (to === null) return content;
  return (
    <Link to={to} aria-label="Slate home" className="inline-flex rounded-sm">
      {content}
    </Link>
  );
}
