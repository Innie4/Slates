import { cn } from "@/lib/cn";

/**
 * STRATA — Slate's richness source (DIRECTION.md §5).
 * Layered slabs of slate with gently cleft edges, one chalk line,
 * and an optional signal band when something is live.
 *
 * One hand: band heights follow 1 : 1.6 : 2.6, tilt is 3°, 3–5 bands.
 */
export type StrataTone = "on-slate" | "on-light" | "on-signal";

const PALETTES: Record<StrataTone, string[]> = {
  "on-slate": ["#3A4859", "#4D5D70", "#66768A", "#8C9AA8", "#B4BFCA"],
  "on-light": ["#B4BFCA", "#8C9AA8", "#66768A", "#4D5D70", "#2B3643"],
  "on-signal": ["#2B3643", "#3A4859", "#1C242E", "#4D5D70", "#111820"],
};

/** Deterministic pseudo-random for stable cleft edges. */
function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function cleftPath(y: number, width: number, r: () => number, roughness: number) {
  const pts: string[] = [];
  const steps = 9;
  for (let i = 0; i <= steps; i++) {
    const x = (width / steps) * i;
    const jitter = (r() - 0.5) * roughness;
    pts.push(`${x.toFixed(1)},${(y + jitter).toFixed(1)}`);
  }
  return pts;
}

export function Strata({
  tone = "on-slate",
  bands = 4,
  live = false,
  chalk = true,
  seed = 7,
  className,
  tilt = -3,
  liveIndex,
}: {
  tone?: StrataTone;
  bands?: 3 | 4 | 5;
  live?: boolean;
  chalk?: boolean;
  seed?: number;
  className?: string;
  tilt?: number;
  liveIndex?: number;
}) {
  const W = 480;
  const H = 320;
  const r = rand(seed);
  const base = [1, 1.6, 2.6, 1.6, 1].slice(0, bands);
  const li = liveIndex ?? 1;
  // The live band is a slim hi-vis stripe inserted between slabs.
  const ratios = live ? [...base.slice(0, li), 0.38, ...base.slice(li)] : base;
  const total = ratios.reduce((a, b) => a + b, 0);
  const usable = H * 0.82;
  let y = H - usable;
  const palette = PALETTES[tone];
  const shapes = ratios.map((ratio, i) => {
    const top = cleftPath(y, W, r, 7);
    y += (ratio / total) * usable;
    const isLive = live && i === li;
    const pi = live && i > li ? i - 1 : i;
    return { top, fill: isLive ? "var(--signal)" : palette[pi % palette.length]!, i };
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className={cn("pointer-events-none select-none", className)} aria-hidden>
      <g transform={`rotate(${tilt} ${W / 2} ${H / 2}) translate(-40 0) scale(1.18 1)`}>
        {shapes.map((s) => (
          <polygon key={s.i} points={`${s.top.join(" ")} ${W},${H + 80} 0,${H + 80}`} fill={s.fill} />
        ))}
        {chalk && shapes[live ? 0 : 1] && (
          <polyline
            points={shapes[live ? 0 : 1]!.top.map((p) => {
              const [px, py] = p.split(",").map(Number);
              return `${px},${(py! - 6).toFixed(1)}`;
            }).join(" ")}
            fill="none"
            stroke={tone === "on-light" ? "#2B3643" : "#F2F4F6"}
            strokeOpacity={0.55}
            strokeWidth={1.5}
            strokeDasharray="2 7"
            strokeLinecap="round"
          />
        )}
      </g>
    </svg>
  );
}

/** Small stacked-slab mark used inside empty states and the logo placeholder. */
export function SlabMark({ className, live = true }: { className?: string; live?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M5 9.2 27 5v4.4L5 13.6z" fill="currentColor" opacity=".45" />
      <path d="M5 16.2 27 12v4.4L5 20.6z" fill="currentColor" opacity=".75" />
      <path d="M5 23.2 27 19v4.4L5 27.6z" fill={live ? "var(--signal)" : "currentColor"} />
    </svg>
  );
}
