import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Stylised Uyo street map with a live route. The truck sits at `progress`
 * (0 → 1) along the route; the address pin is the route's end.
 * Roads are drawn as chalk lines; the travelled route is signal orange.
 */
const ROADS: Array<{ d: string; name?: string; nx?: number; ny?: number; rot?: number; major?: boolean }> = [
  { d: "M-10 196 C 80 188, 160 170, 240 150 S 380 112, 420 104", name: "Oron Road", nx: 300, ny: 124, rot: -12, major: true },
  { d: "M60 -10 C 70 60, 92 130, 120 270", name: "Aka Road", nx: 82, ny: 70, rot: 78, major: true },
  { d: "M-10 70 C 90 76, 190 86, 280 70 S 380 40, 420 30", name: "Ikot Ekpene Rd", nx: 214, ny: 76, rot: -4, major: true },
  { d: "M250 -10 C 246 70, 262 160, 300 270", name: "Abak Road", nx: 262, ny: 214, rot: 74 },
  { d: "M-10 130 C 60 134, 120 128, 180 122" },
  { d: "M160 -10 C 170 40, 180 80, 196 130 S 214 210, 210 270" },
  { d: "M330 -10 C 336 40, 344 90, 360 140 S 386 230, 392 270" },
  { d: "M120 230 C 180 226, 240 214, 320 200 S 400 190, 420 186" },
  { d: "M20 270 C 30 240, 40 220, 70 200" },
];

const ROUTE = "M36 22 C 52 40, 68 66, 88 78 S 150 96, 196 128 S 250 150, 284 162 S 320 176, 338 196";
const DEFAULT_STOPS = [0.18, 0.4, 0.78];

export function RouteMap({
  progress = 0.62,
  tone = "on-slate",
  className,
  stops = DEFAULT_STOPS,
  showLabels = true,
  animate = true,
}: {
  progress?: number;
  tone?: "on-slate" | "on-light";
  className?: string;
  stops?: number[];
  showLabels?: boolean;
  animate?: boolean;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const [len, setLen] = useState(0);
  const [pt, setPt] = useState({ x: 0, y: 0 });
  const [stopPts, setStopPts] = useState<Array<{ x: number; y: number }>>([]);
  const [end, setEnd] = useState({ x: 338, y: 196 });

  useEffect(() => {
    const p = pathRef.current;
    if (!p) return;
    const L = p.getTotalLength();
    setLen(L);
    const at = p.getPointAtLength(L * Math.max(0, Math.min(1, progress)));
    setPt({ x: at.x, y: at.y });
    setStopPts(stops.map((s) => {
      const q = p.getPointAtLength(L * s);
      return { x: q.x, y: q.y };
    }));
    const e = p.getPointAtLength(L);
    setEnd({ x: e.x, y: e.y });
  }, [progress, stops]);

  const road = tone === "on-slate" ? "#F2F4F6" : "#2B3643";
  const label = tone === "on-slate" ? "rgba(242,244,246,.55)" : "rgba(43,54,67,.55)";

  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className={cn("select-none", className)} role="img" aria-label="Live route map">
      {ROADS.map((r, i) => (
        <path
          key={i}
          d={r.d}
          fill="none"
          stroke={road}
          strokeOpacity={r.major ? 0.22 : 0.1}
          strokeWidth={r.major ? 9 : 5}
          strokeLinecap="round"
        />
      ))}
      {showLabels &&
        ROADS.filter((r) => r.name).map((r) => (
          <text
            key={r.name}
            x={r.nx}
            y={r.ny}
            transform={`rotate(${r.rot} ${r.nx} ${r.ny})`}
            fill={label}
            fontSize="8.5"
            fontFamily="Geist, sans-serif"
            fontWeight={500}
            letterSpacing=".04em"
          >
            {r.name}
          </text>
        ))}
      {/* full route, dashed chalk */}
      <path ref={pathRef} d={ROUTE} fill="none" stroke={road} strokeOpacity={0.5} strokeWidth={2} strokeDasharray="3 6" strokeLinecap="round" className={animate ? "animate-dash" : undefined} />
      {/* travelled part, signal */}
      {len > 0 && (
        <path
          d={ROUTE}
          fill="none"
          stroke="var(--signal)"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeDasharray={`${len * progress} ${len}`}
          style={{ transition: "stroke-dasharray 900ms cubic-bezier(.2,.8,.2,1)" }}
        />
      )}
      {stopPts.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={4} fill={stops[i]! <= progress ? "var(--signal)" : tone === "on-slate" ? "#2B3643" : "#fff"} stroke={stops[i]! <= progress ? "none" : road} strokeOpacity={0.6} strokeWidth={1.5} />
      ))}
      {/* destination pin */}
      <g transform={`translate(${end.x} ${end.y})`}>
        <circle r={14} fill={road} fillOpacity={0.12} />
        <circle r={7} fill={tone === "on-slate" ? "#F2F4F6" : "#2B3643"} />
        <circle r={2.6} fill={tone === "on-slate" ? "#2B3643" : "#F2F4F6"} />
      </g>
      {/* truck */}
      {len > 0 && progress < 1 && (
        <g style={{ transform: `translate(${pt.x}px, ${pt.y}px)`, transition: "transform 900ms cubic-bezier(.2,.8,.2,1)" }}>
          <circle r={11} fill="var(--signal)" fillOpacity={0.22}>
            {animate && <animate attributeName="r" values="9;15;9" dur="1.8s" repeatCount="indefinite" />}
          </circle>
          <circle r={6.5} fill="var(--signal)" stroke={tone === "on-slate" ? "#2B3643" : "#fff"} strokeWidth={2} />
        </g>
      )}
    </svg>
  );
}
