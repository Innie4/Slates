import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Hand-built SVG charts in the Slate palette. One series = slate; a highlighted
 * point/series = signal. Every chart has an accessible label and visible values.
 */

export function Sparkline({
  data,
  className,
  tone = "slate",
  height = 32,
  fill = true,
}: {
  data: number[];
  className?: string;
  tone?: "slate" | "signal" | "success" | "danger";
  height?: number;
  fill?: boolean;
}) {
  const id = useId();
  const w = 120;
  const min = Math.min(...data), max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, height - 2 - ((v - min) / span) * (height - 4)] as const);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const color = { slate: "var(--ink-2)", signal: "var(--signal)", success: "var(--success)", danger: "var(--danger)" }[tone];
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className={cn("h-8 w-full overflow-visible", className)} aria-hidden>
      {fill && (
        <>
          <defs>
            <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity=".18" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${line} L${w} ${height} L0 ${height}Z`} fill={`url(#${id})`} />
        </>
      )}
      <path d={line} fill="none" stroke={color} strokeWidth={1.75} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

/** Area/line chart with x labels, y gridlines and hover readout. */
export function AreaChart({
  data,
  labels,
  height = 220,
  format = (v) => String(v),
  className,
  compare,
  label = "Chart",
}: {
  data: number[];
  labels: string[];
  height?: number;
  format?: (v: number) => string;
  className?: string;
  /** Optional comparison series (e.g. last period) drawn dashed */
  compare?: number[];
  label?: string;
}) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = height, padL = 8, padR = 8, padT = 16, padB = 28;
  const all = [...data, ...(compare ?? [])];
  const max = Math.max(...all) * 1.12, min = 0;
  const x = (i: number) => padL + (i / (data.length - 1)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - (v - min) / (max - min)) * (H - padT - padB);
  const path = (d: number[]) => d.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const grid = [0.25, 0.5, 0.75, 1].map((t) => min + t * (max - min));
  const hi = hover ?? data.length - 1;
  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const rel = ((e.clientX - r.left) / r.width) * W;
          const i = Math.round(((rel - padL) / (W - padL - padR)) * (data.length - 1));
          setHover(Math.max(0, Math.min(data.length - 1, i)));
        }}
      >
        <defs>
          <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--ink)" stopOpacity=".14" />
            <stop offset="1" stopColor="var(--ink)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {grid.map((g) => (
          <line key={g} x1={padL} x2={W - padR} y1={y(g)} y2={y(g)} stroke="var(--line)" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
        ))}
        {compare && <path d={path(compare)} fill="none" stroke="var(--ink-3)" strokeWidth={1.5} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />}
        <path d={`${path(data)} L${x(data.length - 1)} ${H - padB} L${x(0)} ${H - padB}Z`} fill={`url(#${id})`} />
        <path d={path(data)} fill="none" stroke="var(--ink)" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        <line x1={x(hi)} x2={x(hi)} y1={padT} y2={H - padB} stroke="var(--line-strong)" vectorEffect="non-scaling-stroke" />
        <circle cx={x(hi)} cy={y(data[hi]!)} r={4.5} fill="var(--signal)" stroke="var(--surface)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-1 flex justify-between px-1">
        {labels.map((l, i) => (
          <span key={i} className={cn("t-micro text-ink-3 tnum", labels.length > 8 && i % 2 === 1 && "hidden sm:inline")}>
            {l}
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute left-2 top-0 rounded-sm bg-surface/90 px-2 py-1 backdrop-blur">
        <span className="t-micro text-ink-3">{labels[hi]}</span>{" "}
        <span className="t-small font-semibold text-ink tnum">{format(data[hi]!)}</span>
        {compare && <span className="t-micro ml-2 text-ink-3 tnum">prev {format(compare[hi]!)}</span>}
      </div>
    </div>
  );
}

/** Vertical bar chart. `highlight` index is drawn in signal. */
export function BarChart({
  data,
  labels,
  height = 180,
  format = (v) => String(v),
  highlight,
  className,
  label = "Bar chart",
  stacked,
}: {
  data: number[];
  labels: string[];
  height?: number;
  format?: (v: number) => string;
  highlight?: number;
  className?: string;
  label?: string;
  /** Optional second segment stacked on top of each bar (e.g. missed) */
  stacked?: number[];
}) {
  const totals = data.map((d, i) => d + (stacked?.[i] ?? 0));
  const max = Math.max(...totals) || 1;
  return (
    <div className={cn("flex flex-col", className)} role="img" aria-label={label}>
      <div className="flex items-end gap-1.5 sm:gap-2" style={{ height }}>
        {data.map((v, i) => (
          <div key={i} className="group relative flex h-full flex-1 flex-col justify-end">
            <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-slate-950 px-1.5 py-0.5 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 tnum dark:bg-white dark:text-slate-950">
              {format(totals[i]!)}
            </span>
            {stacked && stacked[i]! > 0 && (
              <div className="w-full rounded-t-[3px] bg-danger/80" style={{ height: `${(stacked[i]! / max) * 100}%` }} />
            )}
            <div
              className={cn(
                "w-full transition-[height] duration-700 ease-[var(--ease-out-quart)]",
                stacked && stacked[i]! > 0 ? "" : "rounded-t-[3px]",
                i === highlight ? "bg-signal" : "bg-slate dark:bg-slate-400 group-hover:opacity-80",
              )}
              style={{ height: `${(v / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2">
        {labels.map((l, i) => (
          <span key={i} className={cn("flex-1 truncate text-center t-micro tnum", i === highlight ? "font-semibold text-ink" : "text-ink-3")}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Donut with legend. Segments use the slate ramp; one may be signal. */
export function Donut({
  segments,
  size = 148,
  center,
  className,
  thickness = 18,
}: {
  segments: Array<{ label: string; value: number; color?: string }>;
  size?: number;
  center?: ReactNode;
  className?: string;
  thickness?: number;
}) {
  const ramp = ["#2B3643", "#66768A", "#B4BFCA", "#FF5B1F", "#127A57", "#D3DAE1"];
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className={cn("flex flex-wrap items-center gap-6", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img" aria-label={segments.map((s) => `${s.label} ${s.value}`).join(", ")}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--sunken)" strokeWidth={thickness} />
          {segments.map((s, i) => {
            const len = (s.value / total) * C;
            const el = (
              <circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color ?? ramp[i % ramp.length]}
                strokeWidth={thickness}
                strokeDasharray={`${Math.max(0, len - 2)} ${C}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        {center && <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{center}</div>}
      </div>
      <ul className="flex min-w-36 flex-1 flex-col gap-2">
        {segments.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2.5">
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: s.color ?? ramp[i % ramp.length] }} />
            <span className="t-small flex-1 text-ink-2">{s.label}</span>
            <span className="t-small font-medium text-ink tnum">{Math.round((s.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Horizontal stacked proportion bar with legend (e.g. pickup outcomes). */
export function StackedBar({ segments, className }: { segments: Array<{ label: string; value: number; tone: "slate" | "success" | "warning" | "danger" | "signal" | "muted" }>; className?: string }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const bg = { slate: "bg-slate dark:bg-slate-400", success: "bg-success", warning: "bg-warning", danger: "bg-danger", signal: "bg-signal", muted: "bg-line-strong" };
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
        {segments.map((s) => (
          <div key={s.label} className={cn("h-full first:rounded-l-full last:rounded-r-full", bg[s.tone])} style={{ width: `${(s.value / total) * 100}%` }} title={`${s.label}: ${s.value}`} />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 t-small">
            <span className={cn("size-2.5 rounded-[3px]", bg[s.tone])} />
            <span className="text-ink-2">{s.label}</span>
            <span className="font-medium text-ink tnum">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
