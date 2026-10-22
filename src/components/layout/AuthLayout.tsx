import { Link, Outlet } from "react-router";
import { ArrowLeft, ArrowUpRight, Moon, Sun } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Strata } from "@/components/brand/Strata";
import { useSession } from "@/lib/session";

export function AuthLayout() {
  const { theme, setTheme } = useSession();
  return <div className="auth-layout min-h-dvh bg-canvas lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
    <aside className="auth-brand relative hidden overflow-hidden bg-slate-800 text-slate-50 lg:flex lg:flex-col">
      <div className="relative z-10 flex flex-1 flex-col p-10 xl:p-14">
        <Logo tone="light" />
        <div className="my-auto max-w-xl py-24">
          <p className="t-label text-slate-200">At home in Uyo</p>
          <h2 className="auth-brand-title mt-6">A place for<br />your collections.</h2>
          <div className="mt-7 h-1 w-12 bg-signal" />
          <p className="t-body mt-7 max-w-sm text-slate-200">Request a pickup. Keep track of your plans. Get help from the same place.</p>
        </div>
        <Link to="/services/households" className="t-small flex w-fit items-center gap-3 text-slate-100 underline underline-offset-4">See household services <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
      </div>
      <Strata tone="on-slate" bands={5} seed={21} className="pointer-events-none absolute inset-x-0 bottom-0 h-52 w-full opacity-30" />
    </aside>
    <div className="flex min-w-0 flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-5 sm:px-8 lg:border-0 lg:px-10 lg:py-7">
        <div className="lg:hidden"><Logo /></div>
        <Link to="/" className="t-small hidden items-center gap-2 text-ink-2 hover:text-ink lg:flex"><ArrowLeft className="size-4" aria-hidden="true" />Back to home</Link>
        <button type="button" className="ml-auto flex size-11 items-center justify-center rounded-full border border-line text-ink-2 transition-colors hover:bg-sunken" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={`Use ${theme === "dark" ? "light" : "dark"} theme`}>{theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}</button>
      </header>
      <main id="main-content" className="auth-main flex flex-1 justify-center px-5 pb-10 pt-8 sm:px-8 lg:px-12 lg:py-10"><div className="w-full max-w-[440px]"><Outlet /></div></main>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-5 t-small text-ink-3 sm:px-8 lg:px-10"><span>Slate · Uyo, Nigeria</span><div className="flex gap-4"><Link to="/privacy" className="underline underline-offset-4">Privacy</Link><Link to="/terms" className="underline underline-offset-4">Terms</Link></div></footer>
    </div>
  </div>;
}
