import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * SIGNATURE, "Clean slate" (DIRECTION.md §6).
 * When `done` flips false → true, a chalk-eraser sweep crosses the slate field
 * and reveals the `after` surface. Haptic where supported; crossfade under
 * reduced motion. If `done` starts true, `after` shows without animation.
 */
export function CleanSlate({
  done,
  children,
  after,
  className,
}: {
  done: boolean;
  children: ReactNode;
  after: ReactNode;
  className?: string;
}) {
  const prev = useRef(done);
  const [phase, setPhase] = useState<"before" | "wiping" | "after">(done ? "after" : "before");

  useEffect(() => {
    if (done && !prev.current) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      try {
        // Browsers only allow vibration after the user has interacted with the page.
        if ((navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive) navigator.vibrate?.([10, 30, 14]);
      } catch {
        /* unsupported */
      }
      if (reduce) setPhase("after");
      else {
        setPhase("wiping");
        const t = setTimeout(() => setPhase("after"), 720);
        prev.current = done;
        return () => clearTimeout(t);
      }
    }
    if (!done) setPhase("before");
    prev.current = done;
  }, [done]);

  return (
    <div className={cn("relative isolate overflow-hidden", className)}>
      <div className={cn("transition-opacity duration-150", phase === "after" && "invisible")} aria-hidden={phase === "after"}>
        {children}
      </div>
      {phase !== "before" && (
        <div
          className="absolute inset-0"
          style={phase === "wiping" ? { animation: "slate-wipe 560ms cubic-bezier(.2,.8,.2,1) both" } : undefined}
        >
          <div className="h-full" style={phase === "wiping" ? { animation: "settle-in 320ms 380ms cubic-bezier(.2,.8,.2,1) both" } : undefined}>
            {after}
          </div>
        </div>
      )}
      {phase === "wiping" && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-y-1/4 left-0 w-1/3"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,.55) 45%, rgba(255,255,255,.85) 55%, transparent)",
            filter: "blur(6px)",
            animation: "eraser-sweep 560ms cubic-bezier(.2,.8,.2,1) both",
          }}
        />
      )}
    </div>
  );
}
