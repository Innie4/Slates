import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { ArrowRight, ChevronDown, Menu, X, Moon, Sun, Mail, Phone, MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/brand/Logo";
import { Strata } from "@/components/brand/Strata";
import { ButtonLink, IconButton } from "@/components/ui";
import { useSession } from "@/lib/session";

const SERVICE_LINKS = [
  { label: "Households", to: "/services/households", desc: "Scheduled collection for your home" },
  { label: "Estates", to: "/services/estates", desc: "One contract for every household" },
  { label: "Businesses", to: "/services/businesses", desc: "Custom commercial collection" },
  { label: "Institutions", to: "/services/institutions", desc: "Schools, hospitals and agencies" },
  { label: "Bulk waste", to: "/services/bulk-waste", desc: "Furniture, appliances, moving waste" },
  { label: "Recycling", to: "/services/recycling", desc: "Sorted materials to recovery partners" },
];

const NAV = [
  { label: "How it works", to: "/how-it-works" },
  { label: "For businesses", to: "/for-businesses" },
  { label: "For estates", to: "/for-estates" },
  { label: "For operators", to: "/for-waste-companies" },
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
];

const FOOTER = [
  { title: "Services", links: [["Households", "/services/households"], ["Estates", "/services/estates"], ["Businesses", "/services/businesses"], ["Institutions", "/services/institutions"], ["Bulk waste", "/services/bulk-waste"], ["Recycling", "/services/recycling"]] },
  { title: "Company", links: [["About", "/about"], ["How it works", "/how-it-works"], ["Cities", "/cities"], ["For waste companies", "/for-waste-companies"], ["Pricing", "/pricing"]] },
  { title: "Resources", links: [["Blog", "/blog"], ["FAQ", "/faq"], ["For estates", "/for-estates"], ["For institutions", "/for-institutions"], ["Design system", "/design-system"]] },
  { title: "Support", links: [["Contact", "/contact"], ["Sign in", "/login"], ["Create account", "/signup"], ["Report a missed pickup", "/login"]] },
  { title: "Legal", links: [["Terms", "/terms"], ["Privacy", "/privacy"], ["Waste service terms", "/waste-service-terms"], ["Operator terms", "/operator-terms"], ["Cookies", "/cookies"]] },
] as const;

export function PublicLayout() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [svc, setSvc] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useSession();
  const onHero = pathname === "/";

  useEffect(() => {
    setOpen(false);
    setSvc(false);
  }, [pathname]);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    h();
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  const light = onHero && !scrolled && !open;

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2">
        Skip to content
      </a>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300",
          light ? "border-b border-transparent bg-transparent" : "border-b border-line bg-glass backdrop-blur-xl backdrop-saturate-150",
        )}
      >
        <div className="container-page flex h-16 items-center gap-6 lg:h-[72px]">
          <Logo tone={light ? "light" : "ink"} />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            <div className="relative" onMouseLeave={() => setSvc(false)}>
              <button
                type="button"
                onMouseEnter={() => setSvc(true)}
                onClick={() => setSvc((s) => !s)}
                aria-expanded={svc}
                className={cn("flex h-10 items-center gap-1 rounded-md px-3 text-[14px] font-medium transition-colors", light ? "text-slate-ink/85 hover:text-slate-ink" : "text-ink-2 hover:text-ink")}
              >
                Services <ChevronDown className={cn("size-4 transition-transform", svc && "rotate-180")} />
              </button>
              {svc && (
                <div className="absolute left-0 top-full pt-2">
                  <div className="grid w-[560px] grid-cols-2 gap-1 rounded-lg border border-line bg-surface p-2 shadow-float animate-pop-in">
                    {SERVICE_LINKS.map((s) => (
                      <Link key={s.to} to={s.to} className="rounded-md p-3 hover:bg-sunken">
                        <p className="t-small font-semibold text-ink">{s.label}</p>
                        <p className="t-small text-ink-2">{s.desc}</p>
                      </Link>
                    ))}
                    <Link to="/services" className="col-span-2 mt-1 flex items-center justify-between rounded-md bg-sunken px-3 py-2.5 t-small font-medium text-ink">
                      All services <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  cn(
                    "flex h-10 items-center rounded-md px-3 text-[14px] font-medium transition-colors",
                    light ? "text-slate-ink/85 hover:text-slate-ink" : isActive ? "text-ink" : "text-ink-2 hover:text-ink",
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <IconButton
              label={theme === "dark" ? "Light appearance" : "Dark appearance"}
              className={cn("max-sm:hidden", light && "text-slate-ink/80 hover:bg-white/10 hover:text-slate-ink")}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun /> : <Moon />}
            </IconButton>
            <Link to="/login" className={cn("h-10 items-center rounded-md px-3 text-[14px] font-medium max-sm:hidden flex", light ? "text-slate-ink hover:bg-white/10" : "text-ink hover:bg-sunken")}>
              Sign in
            </Link>
            <ButtonLink to="/signup" variant="signal" size="sm" className="!h-10 !px-4 !text-[14px]">
              Get started
            </ButtonLink>
            <IconButton label={open ? "Close menu" : "Open menu"} className={cn("-mr-2 lg:hidden", light && "text-slate-ink hover:bg-white/10")} onClick={() => setOpen((o) => !o)}>
              {open ? <X /> : <Menu />}
            </IconButton>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {open && (
        <div className="fixed inset-0 top-16 z-40 overflow-y-auto bg-canvas animate-fade-in lg:hidden">
          <div className="container-page flex flex-col gap-8 py-6">
            <div>
              <p className="mb-2 t-micro text-ink-3">Services</p>
              <div className="grid grid-cols-2 gap-2">
                {SERVICE_LINKS.map((s) => (
                  <Link key={s.to} to={s.to} className="rounded-md bg-surface p-3.5 ring-1 ring-line">
                    <p className="t-small font-semibold text-ink">{s.label}</p>
                    <p className="mt-0.5 text-[12px] leading-snug text-ink-3">{s.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
            <nav className="flex flex-col divide-y divide-line border-y border-line" aria-label="Mobile">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} className="flex items-center justify-between py-4 font-display text-[22px] font-semibold tracking-tight text-ink">
                  {n.label}
                  <ArrowRight className="size-5 text-ink-3" />
                </Link>
              ))}
            </nav>
            <div className="flex flex-col gap-2">
              <ButtonLink to="/signup" variant="signal" size="lg" block>
                Get started
              </ButtonLink>
              <ButtonLink to="/login" variant="outline" size="lg" block>
                Sign in
              </ButtonLink>
              <button type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="mt-2 flex items-center justify-center gap-2 t-small text-ink-2">
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                {theme === "dark" ? "Light appearance" : "Dark appearance"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main id="main" className={cn("flex-1", !onHero && "pt-16 lg:pt-[72px]")}>
        <Outlet />
      </main>

      <footer className="relative overflow-hidden bg-slate text-slate-ink chalk-grain dark:bg-[#0a0e12]">
        <Strata tone="on-slate" bands={4} seed={3} chalk className="absolute inset-x-0 bottom-0 h-40 w-full opacity-40" />
        <div className="container-page relative py-16 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
            <div className="flex flex-col gap-6">
              <Logo tone="light" />
              <p className="max-w-xs font-display text-[26px] font-semibold leading-tight tracking-[-0.02em]">We manage the waste service. You don't have to.</p>
              <ul className="flex flex-col gap-2.5 t-small text-slate-ink/75">
                <li className="flex items-center gap-2.5"><MapPin className="size-4" /> 22 Udo Udoma Avenue, Uyo, Akwa Ibom</li>
                <li className="flex items-center gap-2.5"><Phone className="size-4" /> +234 700 752 8300</li>
                <li className="flex items-center gap-2.5"><Mail className="size-4" /> hello@slate.ng</li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
              {FOOTER.map((col) => (
                <div key={col.title}>
                  <p className="mb-3 t-micro text-slate-ink/55">{col.title}</p>
                  <ul className="flex flex-col gap-2.5">
                    {col.links.map(([label, to]) => (
                      <li key={label}>
                        <Link to={to} className="t-small text-slate-ink/85 hover:text-slate-ink">
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="t-small text-slate-ink/60">© 2026 Slate Technologies Ltd. RC 1904417. Live in Uyo.</p>
            <div className="flex gap-5 t-small text-slate-ink/70">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-slate-ink">Instagram</a>
              <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-slate-ink">X</a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-slate-ink">LinkedIn</a>
              <a href="https://wa.me/2347007528300" target="_blank" rel="noreferrer" className="hover:text-slate-ink">WhatsApp</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
