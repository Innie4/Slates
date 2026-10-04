import { Link, Outlet } from "react-router";
import { ChevronLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Strata } from "@/components/brand/Strata";

/**
 * Auth — slate field with strata on the left (desktop), form on the right.
 * On phones the slate field becomes a short band above the form.
 */
export function AuthLayout() {
  return (
    <div className="grid min-h-dvh bg-canvas lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-slate text-slate-ink chalk-grain lg:flex lg:flex-col">
        <Strata tone="on-slate" bands={5} live seed={21} className="absolute inset-x-0 bottom-0 h-[40%] w-full" />
        <div className="relative flex flex-1 flex-col p-10 xl:p-14">
          <Logo tone="light" />
          <div className="mt-auto max-w-md pb-[38vh]">
            <p className="font-display text-[44px] font-bold leading-[1.02] tracking-[-0.03em]" style={{ fontVariationSettings: '"opsz" 72, "wdth" 90' }}>
              Your waste gets collected. We handle the rest.
            </p>
            <p className="mt-5 t-body text-slate-ink/75">
              One company, one payment, one support line. Slate contracts and monitors verified operators across Uyo so you never chase a collector again.
            </p>
            <dl className="mt-8 grid grid-cols-3 gap-6 border-t border-white/15 pt-6">
              <div>
                <dt className="t-micro text-slate-ink/60">On-time pickups</dt>
                <dd className="mt-1 font-display text-[26px] font-bold tnum">96.8%</dd>
              </div>
              <div>
                <dt className="t-micro text-slate-ink/60">Missed, recovered</dt>
                <dd className="mt-1 font-display text-[26px] font-bold tnum">&lt; 24h</dd>
              </div>
              <div>
                <dt className="t-micro text-slate-ink/60">Homes & sites</dt>
                <dd className="mt-1 font-display text-[26px] font-bold tnum">2,477</dd>
              </div>
            </dl>
          </div>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <div className="relative overflow-hidden bg-slate text-slate-ink chalk-grain lg:hidden">
          <Strata tone="on-slate" bands={4} live seed={21} className="absolute inset-x-0 bottom-0 h-full w-full opacity-90" />
          <div className="relative flex h-28 items-start justify-between px-5 pt-5">
            <Logo tone="light" />
            <Link to="/" className="flex items-center gap-1 t-small text-slate-ink/80">
              <ChevronLeft className="size-4" /> Home
            </Link>
          </div>
        </div>
        <div className="hidden justify-end p-6 lg:flex">
          <Link to="/" className="flex items-center gap-1 t-small font-medium text-ink-2 hover:text-ink">
            <ChevronLeft className="size-4" /> Back to slate.ng
          </Link>
        </div>
        <div className="flex flex-1 items-start justify-center px-5 pb-12 pt-8 sm:px-8 lg:items-center lg:pt-0">
          <div className="w-full max-w-[440px]">
            <Outlet />
          </div>
        </div>
        <p className="px-5 pb-6 text-center t-micro text-ink-3">
          Protected by Slate. <Link to="/privacy" className="underline underline-offset-2">Privacy</Link> · <Link to="/terms" className="underline underline-offset-2">Terms</Link>
        </p>
      </div>
    </div>
  );
}
