import { useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Stylised service-area map of Uyo zones. Each zone is a cut-stone polygon.
 * `value` per zone drives the fill intensity (coverage, demand, customers…).
 * Used by operator service areas (G5), admin service areas (H11), cities (H31).
 */
export interface Zone {
  id: string;
  name: string;
  points: string;
  cx: number;
  cy: number;
}

export const UYO_ZONES: Zone[] = [
  { id: "ewet", name: "Ewet Housing", points: "40,40 150,28 168,110 60,128", cx: 102, cy: 78 },
  { id: "shelter", name: "Shelter Afrique", points: "150,28 262,22 270,96 168,110", cx: 212, cy: 66 },
  { id: "osongama", name: "Osongama", points: "262,22 372,34 380,118 270,96", cx: 322, cy: 70 },
  { id: "aka", name: "Aka Road", points: "60,128 168,110 176,196 70,214", cx: 118, cy: 164 },
  { id: "oron", name: "Oron Road", points: "168,110 270,96 282,184 176,196", cx: 224, cy: 148 },
  { id: "nwaniba", name: "Nwaniba", points: "270,96 380,118 390,206 282,184", cx: 332, cy: 152 },
  { id: "abak", name: "Abak Road", points: "70,214 176,196 184,270 84,286", cx: 128, cy: 240 },
  { id: "itam", name: "Itam", points: "176,196 282,184 290,262 184,270", cx: 234, cy: 228 },
  { id: "uselga", name: "Use Offot", points: "282,184 390,206 396,280 290,262", cx: 340, cy: 236 },
];

export function ServiceAreaMap({
  values = {},
  selected,
  onSelect,
  className,
  legend = "Coverage",
  formatValue = (v) => `${v}%`,
  highlight,
}: {
  values?: Record<string, number>;
  selected?: string;
  onSelect?: (id: string) => void;
  className?: string;
  legend?: string;
  formatValue?: (v: number) => string;
  highlight?: string[];
}) {
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(1, ...Object.values(values));
  const active = UYO_ZONES.find((z) => z.id === (hover ?? selected));
  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-sunken", className)}>
      <svg viewBox="20 10 390 290" className="h-full w-full" role="img" aria-label="Service area map of Uyo">
        {UYO_ZONES.map((z) => {
          const v = values[z.id] ?? 0;
          const t = v / max;
          const isSel = selected === z.id || hover === z.id;
          const hl = highlight?.includes(z.id);
          return (
            <g
              key={z.id}
              onMouseEnter={() => setHover(z.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect?.(z.id)}
              className={cn(onSelect && "cursor-pointer")}
            >
              <polygon
                points={z.points}
                fill={hl ? "var(--signal)" : `color-mix(in srgb, #2B3643 ${Math.round(12 + t * 78)}%, var(--surface))`}
                stroke="var(--canvas)"
                strokeWidth={isSel ? 3 : 2}
                className="transition-[fill] duration-200"
              />
              {isSel && <polygon points={z.points} fill="none" stroke="var(--signal)" strokeWidth={2.5} />}
              <text
                x={z.cx}
                y={z.cy}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight={600}
                fontFamily="Geist, sans-serif"
                fill={t > 0.45 || hl ? "#F2F4F6" : "#2B3643"}
                className="pointer-events-none"
              >
                {z.name}
              </text>
              {values[z.id] !== undefined && (
                <text x={z.cx} y={z.cy + 13} textAnchor="middle" fontSize="9" fontFamily="Geist Mono, monospace" fill={t > 0.45 || hl ? "rgba(242,244,246,.75)" : "rgba(43,54,67,.7)"} className="pointer-events-none">
                  {formatValue(v)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-sm bg-surface/90 px-2.5 py-1.5 backdrop-blur">
        <span className="t-micro text-ink-2">{legend}</span>
        <span className="h-2 w-16 rounded-full" style={{ background: "linear-gradient(90deg, color-mix(in srgb,#2B3643 12%, var(--surface)), #2B3643)" }} />
      </div>
      {active && (
        <div className="absolute right-3 top-3 rounded-md bg-slate-950 px-3 py-2 text-white shadow-float">
          <p className="text-[13px] font-semibold">{active.name}</p>
          {values[active.id] !== undefined && <p className="t-mono text-[12px] opacity-75">{legend}: {formatValue(values[active.id]!)}</p>}
        </div>
      )}
    </div>
  );
}
