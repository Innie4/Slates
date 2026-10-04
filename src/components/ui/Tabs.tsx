import { useSearchParams } from "react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabItem<T extends string = string> {
  value: T;
  label: ReactNode;
  count?: number;
}

/**
 * Underline tabs. Horizontally scrollable on mobile.
 * Controlled via `value`/`onChange`, or URL-synced with `param` (?tab=…).
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  param,
  className,
}: {
  items: TabItem<T>[];
  value?: T;
  onChange?: (v: T) => void;
  param?: string;
  className?: string;
}) {
  const [params, setParams] = useSearchParams();
  const current = (param ? (params.get(param) as T | null) : undefined) ?? value ?? items[0]?.value;
  const select = (v: T) => {
    if (param) {
      const next = new URLSearchParams(params);
      next.set(param, v);
      setParams(next, { replace: true, preventScrollReset: true });
    }
    onChange?.(v);
  };
  return (
    <div className={cn("relative -mx-5 overflow-x-auto scrollbar-none px-5 md:mx-0 md:px-0", className)}>
      <div role="tablist" className="flex min-w-max gap-6 border-b border-line">
        {items.map((it) => {
          const active = it.value === current;
          return (
            <button
              key={it.value}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => select(it.value)}
              className={cn(
                "relative -mb-px flex h-11 items-center gap-2 whitespace-nowrap border-b-2 text-[14px] font-medium transition-colors",
                active ? "border-ink text-ink" : "border-transparent text-ink-3 hover:text-ink",
              )}
            >
              {it.label}
              {typeof it.count === "number" && (
                <span className={cn("rounded-sm px-1.5 text-[12px] tnum", active ? "bg-ink text-surface" : "bg-sunken text-ink-2")}>{it.count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Hook to read the current URL-synced tab with a fallback. */
export function useTab<T extends string>(param: string, fallback: T): T {
  const [params] = useSearchParams();
  return (params.get(param) as T | null) ?? fallback;
}
