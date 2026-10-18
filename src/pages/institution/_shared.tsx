import { useMemo, type ReactNode } from "react";
import { Download, FileText } from "lucide-react";
import { IconButton, useToast } from "@/components/ui";
import { cn } from "@/lib/cn";
import { DEMO_NOW, formatDate } from "@/lib/format";
import {
  facilities, otherBuildings, OPERATORS, ROUTE_POINTS, ROUTE_STOPS,
  type FacilityId, type OperatorKey, type WasteLocation,
} from "./_data";

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

const DAY = 86_400_000;
const startOfToday = new Date(DEMO_NOW.getFullYear(), DEMO_NOW.getMonth(), DEMO_NOW.getDate()).getTime();

/** Whole days from today (Mon 5 Oct) to a YYYY-MM-DD or ISO date. Negative = past. */
export function daysUntil(d: string) {
  const t = new Date(d.length === 10 ? `${d}T00:00:00` : d);
  const day = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
  return Math.round((day - startOfToday) / DAY);
}

export function inDays(n: number) {
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  return n > 0 ? `in ${n} days` : `${-n} days ago`;
}

/** 14 Nov (no year when it's this year) */
export const shortDate = (d: string) => formatDate(d).replace(/ 2026$/, "");

/* ------------------------------------------------------------------ */
/* Small presentational helpers                                        */
/* ------------------------------------------------------------------ */

export function operatorName(k: OperatorKey | "itam" | "amw", long = false) {
  if (k === "itam") return "Itam Recovery Ltd";
  if (k === "amw") return "Akwa MedWaste (specialist)";
  return long ? OPERATORS[k].name : OPERATORS[k].short;
}

export function useDownload() {
  const toast = useToast();
  return (name: string, format = "PDF") => toast.success(`${name} downloaded`, `${format} saved to your device.`);
}

/** A document line: file glyph, name, meta, download. */
export function DocLine({ name, meta, trailing, onDownload, className }: { name: ReactNode; meta?: ReactNode; trailing?: ReactNode; onDownload?: () => void; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 py-3", className)}>
      <FileText className="size-[18px] shrink-0 text-ink-3" strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <p className="t-small font-medium text-ink">{name}</p>
        {meta && <p className="t-micro text-ink-3">{meta}</p>}
      </div>
      {trailing}
      {onDownload && (
        <IconButton label="Download" size="sm" onClick={onDownload}>
          <Download />
        </IconButton>
      )}
    </div>
  );
}

/** A plain key → value row used in dense side panels. */
export function KeyRow({ label, children, mono }: { label: ReactNode; children: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="t-small text-ink-2">{label}</span>
      <span className={cn("text-right text-ink", mono ? "t-mono" : "t-small font-medium")}>{children}</span>
    </div>
  );
}

/** Section link in the top-right of a section */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("t-micro text-ink-3", className)}>{children}</p>;
}

/* ------------------------------------------------------------------ */
/* Campus plan, Ikpa Hills main campus in the Strata style            */
/* ------------------------------------------------------------------ */

export type FacilityState = "collected" | "live" | "scheduled" | "missed" | "none";

const ROADS = {
  h1: "M10 96 H336",
  h2: "M10 176 H336",
  v1: "M128 12 V248",
  v2: "M252 12 V248",
  ikpa: "M338 -10 C 334 70, 342 170, 337 270",
};

const MOBILE_LABEL: Record<FacilityId, string> = { academic: "Academic", senate: "Senate", medical: "Medical", halls: "Halls", staff: "Staff", sports: "Sports", kitchen: "Kitchen" };

function routeGeometry(progress: number) {
  const pts = ROUTE_POINTS;
  const i = Math.max(0, Math.min(pts.length - 1, Math.floor(progress)));
  const t = progress - i;
  const a = pts[i]!, b = pts[Math.min(pts.length - 1, i + 1)]!;
  const truck: [number, number] = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const travelled = [...pts.slice(0, i + 1), truck];
  return { truck, travelled };
}

const toPath = (pts: Array<[number, number]>) => pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");

export function CampusMap({
  tone = "on-slate",
  states = {},
  sublabels = {},
  selected,
  onSelect,
  route,
  pins,
  activePin,
  onPin,
  className,
  focus,
  label = "Ikpa Hills University campus plan",
}: {
  tone?: "on-slate" | "on-light";
  states?: Partial<Record<FacilityId, FacilityState>>;
  sublabels?: Partial<Record<FacilityId, string>>;
  selected?: FacilityId | null;
  onSelect?: (id: FacilityId) => void;
  /** Waypoint progress along the compactor route, e.g. 4.6 */
  route?: number;
  pins?: WasteLocation[];
  activePin?: string | null;
  onPin?: (id: string) => void;
  className?: string;
  /** Dim every facility except this one */
  focus?: FacilityId;
  label?: string;
}) {
  const slate = tone === "on-slate";
  const geo = useMemo(() => (route === undefined ? null : routeGeometry(route)), [route]);

  const palette = slate
    ? {
        road: "rgba(242,244,246,.13)",
        roadLabel: "rgba(242,244,246,.5)",
        boundary: "rgba(242,244,246,.28)",
        other: "rgba(242,244,246,.05)",
        otherStroke: "rgba(242,244,246,.16)",
        otherLabel: "rgba(242,244,246,.42)",
        halo: "#2B3643",
        fill: { collected: "#DCE3EA", live: "var(--signal)", scheduled: "#4D5D70", missed: "#E5675B", none: "#3A4859" } as Record<FacilityState, string>,
        ink: { collected: "#1C242E", live: "#1A0D06", scheduled: "#F2F4F6", missed: "#1A0D06", none: "rgba(242,244,246,.75)" } as Record<FacilityState, string>,
        route: "#F2F4F6",
      }
    : {
        road: "var(--surface)",
        roadLabel: "var(--ink-3)",
        boundary: "var(--line-strong)",
        other: "transparent",
        otherStroke: "var(--line-strong)",
        otherLabel: "var(--ink-3)",
        halo: "var(--sunken)",
        fill: { collected: "var(--stone)", live: "var(--signal)", scheduled: "var(--stone)", missed: "var(--danger-bg)", none: "var(--stone)" } as Record<FacilityState, string>,
        ink: { collected: "var(--ink-2)", live: "var(--signal-ink)", scheduled: "var(--ink-2)", missed: "var(--danger)", none: "var(--ink-2)" } as Record<FacilityState, string>,
        route: "var(--ink)",
      };

  return (
    <svg viewBox="0 0 400 256" className={cn("block w-full select-none", className)} role="img" aria-label={label}>
      {/* campus boundary */}
      <rect x="8" y="10" width="326" height="240" rx="18" fill="none" stroke={palette.boundary} strokeWidth="1.5" strokeDasharray="2 6" strokeLinecap="round" />
      {/* roads */}
      {Object.entries(ROADS).map(([k, d]) => (
        <path key={k} d={d} fill="none" stroke={palette.road} strokeWidth={k === "ikpa" ? 11 : 7} strokeLinecap="round" />
      ))}
      <text x="331" y="236" transform="rotate(-88 331 236)" fill={palette.roadLabel} fontSize="8" fontWeight={600} letterSpacing=".14em" fontFamily="Geist, sans-serif">IKPA ROAD</text>
      <text x="262" y="93" fill={palette.roadLabel} fontSize="7" fontWeight={500} letterSpacing=".08em" fontFamily="Geist, sans-serif" className="max-sm:hidden">EAST GATE</text>

      {/* buildings not on a Slate schedule */}
      {otherBuildings.map((b) => (
        <g key={b.name} opacity={focus ? 0.5 : 1}>
          <polygon points={b.shape} fill={palette.other} stroke={palette.otherStroke} strokeWidth="1" strokeDasharray={slate ? undefined : "3 3"} />
          <text x={b.x} y={b.y + 3} textAnchor="middle" fill={palette.otherLabel} fontSize="9" fontWeight={500} fontFamily="Geist, sans-serif">{b.name}</text>
        </g>
      ))}

      {/* facilities */}
      {facilities.map((f) => {
        const st = states[f.id] ?? "none";
        const isSel = selected === f.id;
        const dim = focus && focus !== f.id;
        const fill = !slate && isSel ? "var(--ink)" : palette.fill[st];
        const ink = !slate && isSel ? "var(--surface)" : palette.ink[st];
        const sub = sublabels[f.id];
        return (
          <g
            key={f.id}
            opacity={dim ? 0.35 : 1}
            onClick={onSelect ? () => onSelect(f.id) : undefined}
            className={cn(onSelect && "cursor-pointer [&:hover>polygon]:brightness-110")}
            role={onSelect ? "button" : undefined}
            aria-label={onSelect ? f.name : undefined}
          >
            {f.shapes.map((s, i) => (
              <polygon
                key={i}
                points={s}
                fill={fill}
                stroke={st === "scheduled" && slate ? "rgba(242,244,246,.5)" : isSel && slate ? "var(--signal)" : slate ? "none" : "var(--line-strong)"}
                strokeWidth={isSel ? 2.5 : 1.25}
                strokeDasharray={st === "scheduled" && slate ? "3 3" : undefined}
                className="transition-[fill] duration-500"
              />
            ))}
            {f.id === "sports" && <ellipse cx="72" cy="137" rx="33" ry="19" fill="none" stroke={ink} strokeOpacity=".35" strokeWidth="1.25" />}
            <g transform={f.label.rot ? `rotate(${f.label.rot} ${f.label.x} ${f.label.y})` : undefined} className="pointer-events-none" fontFamily="Geist, sans-serif">
              {[f.short, MOBILE_LABEL[f.id]].map((text, i) => (
                <text
                  key={i}
                  x={f.label.x}
                  y={f.label.y + (sub ? -1 : 3.5)}
                  textAnchor="middle"
                  fill={ink}
                  fontSize={i ? 13 : 10.5}
                  fontWeight={650}
                  stroke={f.shapes.length > 1 ? fill : undefined}
                  strokeWidth={f.shapes.length > 1 ? 4 : undefined}
                  paintOrder="stroke"
                  className={i ? "sm:hidden" : "max-sm:hidden"}
                  dy={i && sub ? 4.5 : 0}
                >
                  {text}
                </text>
              ))}
              {sub && (
                <text x={f.label.x} y={f.label.y + 10} textAnchor="middle" fill={ink} fillOpacity=".8" fontSize="8.5" fontWeight={500} fontFamily="Geist Mono, monospace" stroke={f.shapes.length > 1 ? fill : undefined} strokeWidth={f.shapes.length > 1 ? 4 : undefined} paintOrder="stroke" className="max-sm:hidden">
                  {sub}
                </text>
              )}
            </g>
          </g>
        );
      })}

      {/* compactor route */}
      {geo && (
        <g className="pointer-events-none">
          <path d={toPath(ROUTE_POINTS)} fill="none" stroke={palette.route} strokeOpacity={slate ? 0.55 : 0.4} strokeWidth="1.75" strokeDasharray="3 5" strokeLinecap="round" strokeLinejoin="round" className="animate-dash" />
          <path d={toPath(geo.travelled)} fill="none" stroke="var(--signal)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {ROUTE_STOPS.map((s) => {
            const p = ROUTE_POINTS[s.index]!;
            const passed = route! >= s.index;
            return <circle key={s.facilityId} cx={p[0]} cy={p[1]} r="3.6" fill={passed ? "var(--signal)" : slate ? "#2B3643" : "var(--surface)"} stroke={passed ? "none" : palette.route} strokeOpacity=".7" strokeWidth="1.5" />;
          })}
          <g style={{ transform: `translate(${geo.truck[0]}px, ${geo.truck[1]}px)`, transition: "transform 1200ms cubic-bezier(.2,.8,.2,1)" }}>
            <circle r="10" fill="var(--signal)" fillOpacity=".25">
              <animate attributeName="r" values="7;13;7" dur="1.8s" repeatCount="indefinite" />
            </circle>
            <circle r="5.5" fill="var(--signal)" stroke={slate ? "#2B3643" : "var(--surface)"} strokeWidth="2" />
          </g>
        </g>
      )}

      {/* waste location pins */}
      {pins?.map((p, i) => {
        const on = activePin === p.id;
        return (
          <g
            key={p.id}
            transform={`translate(${p.x} ${p.y})`}
            onClick={onPin ? (e) => { e.stopPropagation(); onPin(p.id); } : undefined}
            className={cn(onPin && "cursor-pointer")}
          >
            <circle r={on ? 8.5 : 7} fill={on ? "var(--signal)" : p.specialist ? "var(--surface)" : "var(--ink)"} stroke={p.specialist ? "var(--ink)" : "var(--surface)"} strokeWidth="1.5" strokeDasharray={p.specialist ? "2 1.5" : undefined} className="transition-all" />
            <text y="3" textAnchor="middle" fontSize="8" fontWeight={700} fontFamily="Geist, sans-serif" fill={on ? "var(--signal-ink)" : p.specialist ? "var(--ink)" : "var(--surface)"} className="pointer-events-none">
              {i + 1}
            </text>
            {p.issue && !on && <circle cx="5.5" cy="-5.5" r="2.6" fill="var(--warning)" stroke="var(--surface)" strokeWidth="1" />}
          </g>
        );
      })}
    </svg>
  );
}
