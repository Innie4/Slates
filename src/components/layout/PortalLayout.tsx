import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { Bell, ChevronDown, LogOut, Menu as MenuIcon, Moon, MoreHorizontal, Plus, Search, Sun, Repeat2, User as UserIcon, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/brand/Logo";
import { Avatar, Button, ButtonLink, IconButton, Kbd, Modal, Popover } from "@/components/ui";
import { HOME_FOR_ROLE, useSession } from "@/lib/session";
import { formatRelative } from "@/lib/format";
import { customerNotifications, operatorNotifications, type NotificationItem, type Role } from "@/data";
import { CommandPalette } from "./CommandPalette";
import type { NavItem, PortalConfig } from "./nav";

const ROLE_LABELS: Record<Role, string> = {
  household: "Household",
  estate: "Estate manager",
  business: "Business",
  institution: "Institution",
  operator: "Waste operator",
  admin: "Slate admin",
};

const PORTAL_ROLE: Record<PortalConfig["key"], Role> = {
  app: "household",
  estate: "estate",
  business: "business",
  institution: "institution",
  operator: "operator",
  admin: "admin",
};

function isActive(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

function SideLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive: a }) =>
        cn(
          "group relative flex h-9 items-center gap-3 rounded-md px-2.5 text-[14px] font-medium transition-colors before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-transparent",
          a ? "bg-white/10 text-white before:bg-signal" : "text-white/62 hover:bg-white/[.06] hover:text-white",
        )
      }
    >
      <Icon className="size-[18px] shrink-0" strokeWidth={1.75} />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <span className="rounded-sm bg-signal px-1.5 text-[11px] font-semibold leading-5 text-signal-ink tnum">{item.badge}</span>
      ) : null}
    </NavLink>
  );
}

function NotificationsPanel({ items, viewAll }: { items: NotificationItem[]; viewAll?: string }) {
  const navigate = useNavigate();
  const [read, setRead] = useState<string[]>([]);
  const unread = items.filter((n) => !n.read && !read.includes(n.id)).length;
  return (
    <div className="w-[min(92vw,380px)]">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="t-h3">Notifications</p>
        {unread > 0 && (
          <button type="button" onClick={() => setRead(items.map((i) => i.id))} className="t-small font-medium text-ink-2 hover:text-ink">
            Mark all read
          </button>
        )}
      </div>
      <ul className="max-h-[60vh] divide-y divide-line overflow-y-auto">
        {items.slice(0, 6).map((n) => {
          const isUnread = !n.read && !read.includes(n.id);
          return (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => n.to && navigate(n.to)}
                className="flex w-full gap-3 px-4 py-3 text-left hover:bg-sunken"
              >
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", isUnread ? "bg-signal" : "bg-transparent")} />
                <span className="min-w-0 flex-1">
                  <span className="block t-small font-medium text-ink">{n.title}</span>
                  <span className="mt-0.5 block t-small text-ink-2 line-clamp-2">{n.body}</span>
                  <span className="mt-1 block t-micro text-ink-3">{n.category} · {formatRelative(n.time)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {viewAll && (
        <div className="border-t border-line p-2">
          <Link to={viewAll} className="flex h-10 items-center justify-center rounded-md t-small font-medium text-ink hover:bg-sunken">
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}

function AccountMenu({ compact }: { compact?: boolean }) {
  const { user, role, signIn, signOut, theme, setTheme } = useSession();
  const navigate = useNavigate();
  const [confirmOut, setConfirmOut] = useState(false);
  const roles: Role[] = ["household", "estate", "business", "institution", "operator", "admin"];
  return (
    <>
      <Popover
        trigger={(p) => (
          <button type="button" {...p} className={cn("flex items-center gap-2.5 rounded-md p-1 text-left hover:bg-sunken", !compact && "pr-2")} aria-label="Account">
            <Avatar name={user.name} size="sm" />
            {!compact && (
              <>
                <span className="hidden min-w-0 xl:block">
                  <span className="block truncate text-[13px] font-semibold leading-tight text-ink">{user.name}</span>
                  <span className="block truncate text-[12px] leading-tight text-ink-3">{user.role}</span>
                </span>
                <ChevronDown className="hidden size-4 text-ink-3 xl:block" />
              </>
            )}
          </button>
        )}
      >
        {(close) => (
          <div className="w-72 py-2">
            <div className="flex items-center gap-3 px-4 pb-3 pt-1">
              <Avatar name={user.name} />
              <div className="min-w-0">
                <p className="truncate t-small font-semibold text-ink">{user.name}</p>
                <p className="truncate t-micro text-ink-3">{user.email}</p>
                {user.org && <p className="truncate t-micro text-ink-3">{user.org}</p>}
              </div>
            </div>
            <div className="border-t border-line py-1.5">
              <button type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="flex w-full items-center gap-3 px-4 py-2.5 text-[14px] text-ink hover:bg-sunken">
                {theme === "dark" ? <Sun className="size-4 text-ink-3" /> : <Moon className="size-4 text-ink-3" />}
                {theme === "dark" ? "Light appearance" : "Dark appearance"}
              </button>
            </div>
            <div className="border-t border-line py-1.5">
              <p className="px-4 pb-1 pt-1.5 t-micro text-ink-3">Demo: switch portal</p>
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    signIn(r);
                    close();
                    navigate(HOME_FOR_ROLE[r]);
                  }}
                  className={cn("flex w-full items-center gap-3 px-4 py-2 text-[14px] hover:bg-sunken", r === role ? "font-semibold text-ink" : "text-ink-2")}
                >
                  <Repeat2 className="size-4 text-ink-3" />
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
            <div className="border-t border-line pt-1.5">
              <button type="button" onClick={() => { close(); setConfirmOut(true); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-[14px] text-danger hover:bg-danger-bg">
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </Popover>
      <Modal
        open={confirmOut}
        onClose={() => setConfirmOut(false)}
        size="sm"
        title="Sign out of Slate?"
        description="You'll need your email or phone number and password to sign back in."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOut(false)}>Stay signed in</Button>
            <Button
              variant="destructive"
              onClick={() => {
                signOut();
                navigate("/login");
              }}
            >
              Sign out
            </Button>
          </>
        }
      />
    </>
  );
}

export function PortalLayout({ config, banner }: { config: PortalConfig; banner?: ReactNode }) {
  const { pathname } = useLocation();
  const { role, signIn, user, theme, setTheme } = useSession();
  const [search, setSearch] = useState(false);
  const [more, setMore] = useState(false);
  const [drawer, setDrawer] = useState(false);

  // Visiting a portal URL directly signs the demo user into that role.
  useEffect(() => {
    const r = PORTAL_ROLE[config.key];
    if (role !== r) signIn(r);
  }, [config.key, role, signIn]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch(true);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    setMore(false);
    setDrawer(false);
  }, [pathname]);

  const notifications = config.key === "app" ? customerNotifications : config.key === "operator" ? operatorNotifications : customerNotifications.slice(0, 0).concat(operatorNotifications.slice(1, 4));
  const unread = notifications.filter((n) => !n.read).length;
  const notifRoute = config.key === "app" ? "/app/notifications" : config.key === "admin" ? "/admin/notifications" : undefined;
  const moreActive = !config.tabs.some((t) => isActive(pathname, t.to));

  const sidebar = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Logo to={config.groups[0]!.items[0]!.to} label={config.label} tone="light" />
      </div>
      {user.org && config.key !== "app" && (
        <div className="mx-3 mb-3 overflow-hidden rounded-md border border-white/10 bg-white/[.045]">
          <div className="h-0.5 w-12 bg-signal" />
          <div className="px-3 py-2.5">
            <p className="t-micro text-white/42">{config.key === "admin" ? "Uyo control room" : "Service account"}</p>
            <p className="truncate t-small font-semibold text-white">{user.org}</p>
          </div>
        </div>
      )}
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-6" aria-label="Primary">
        {config.groups.map((g, gi) => (
          <div key={gi} className={cn(gi > 0 && "mt-5")}>
            {g.label && <p className="mb-1.5 px-2.5 t-micro uppercase tracking-[.09em] text-white/35">{g.label}</p>}
            <div className="flex flex-col gap-0.5">
              {g.items.map((it) => (
                <SideLink key={it.to} item={it} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="shrink-0 border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-9 w-full items-center gap-3 rounded-md px-2.5 text-[14px] font-medium text-white/60 hover:bg-white/[.06] hover:text-white"
        >
          {theme === "dark" ? <Sun className="size-[18px]" strokeWidth={1.75} /> : <Moon className="size-[18px]" strokeWidth={1.75} />}
          {theme === "dark" ? "Light appearance" : "Dark appearance"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="portal-shell min-h-dvh bg-canvas" data-portal={config.key}>
      {/* Desktop sidebar */}
      <aside className="chalk-grain fixed inset-y-0 left-0 z-30 hidden w-64 overflow-hidden border-r border-white/10 bg-slate lg:block">
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-40 opacity-20" aria-hidden />
        {sidebar()}
      </aside>

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b border-line bg-glass backdrop-blur-xl backdrop-saturate-150">
          <div className="flex h-14 items-center gap-2 px-4 sm:px-6 lg:h-16 lg:px-8">
            <div className="-ml-2 max-sm:hidden lg:hidden">
              <IconButton label="Open menu" onClick={() => setDrawer(true)}>
                <MenuIcon />
              </IconButton>
            </div>
            <div className="lg:hidden">
              <Logo to={config.groups[0]!.items[0]!.to} label={config.label} />
            </div>
            <button
              type="button"
              onClick={() => setSearch(true)}
              className="ml-2 hidden h-10 w-full max-w-md items-center gap-3 rounded-md border border-line bg-surface px-3 text-left text-[14px] text-ink-3 transition-colors hover:border-line-strong lg:flex"
            >
              <Search className="size-4" />
              <span className="flex-1">{config.key === "admin" ? "Search customers, operators, pickups…" : "Search"}</span>
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </button>
            <div className="ml-auto flex items-center gap-1">
              <IconButton label="Search" className="lg:hidden" onClick={() => setSearch(true)}>
                <Search />
              </IconButton>
              {config.primaryAction && (
                <ButtonLink to={config.primaryAction.to} size="sm" className="mr-1 !h-9 max-md:hidden" leading={<Plus className="size-4" />}>
                  {config.primaryAction.label}
                </ButtonLink>
              )}
              <Popover trigger={(p) => <IconButton label="Notifications" badge={unread > 0} {...p}><Bell /></IconButton>}>
                <NotificationsPanel items={notifications} viewAll={notifRoute} />
              </Popover>
              <div className="ml-1">
                <AccountMenu compact={false} />
              </div>
            </div>
          </div>
          {banner}
        </header>

        <main className="portal-main relative px-5 pb-32 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-16">
          <Outlet />
        </main>
      </div>

      {/* Mobile tab bar — the floating glass navigation layer */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-40 flex h-16 items-stretch rounded-xl border border-line bg-glass px-1.5 shadow-float backdrop-blur-xl backdrop-saturate-150 sm:inset-x-auto sm:left-1/2 sm:w-[440px] sm:-translate-x-1/2 lg:hidden"
      >
        {config.tabs.map((t) => {
          const Icon = t.icon;
          const a = isActive(pathname, t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              aria-current={a ? "page" : undefined}
              className={cn("flex flex-1 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium transition-colors", a ? "text-ink" : "text-ink-3")}
            >
              <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-colors", a && "bg-slate text-slate-ink dark:bg-stone dark:text-ink")}>
                <Icon className="size-[19px]" strokeWidth={a ? 2.1 : 1.75} />
              </span>
              {t.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMore(true)}
          className={cn("flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium", moreActive ? "text-ink" : "text-ink-3")}
          aria-label="More"
        >
          <span className={cn("flex h-7 w-12 items-center justify-center rounded-full", moreActive && "bg-slate text-slate-ink dark:bg-stone dark:text-ink")}>
            <MoreHorizontal className="size-[19px]" />
          </span>
          More
        </button>
      </nav>

      {/* More sheet (mobile) */}
      <Modal open={more} onClose={() => setMore(false)} title="Everything" size="md">
        <div className="flex flex-col gap-5 pb-4">
          {config.primaryAction && (
            <ButtonLink to={config.primaryAction.to} block leading={<Plus className="size-4" />}>
              {config.primaryAction.label}
            </ButtonLink>
          )}
          {config.groups.map((g, gi) => (
            <div key={gi}>
              {g.label && <p className="mb-2 t-micro text-ink-3">{g.label}</p>}
              <div className="grid grid-cols-3 gap-2">
                {g.items.map((it) => {
                  const Icon = it.icon;
                  const a = isActive(pathname, it.to);
                  return (
                    <Link
                      key={it.to}
                      to={it.to}
                      className={cn(
                        "relative flex aspect-[1.15] flex-col items-start justify-between rounded-md p-3 transition-colors",
                        a ? "bg-slate text-slate-ink" : "bg-sunken text-ink hover:bg-stone",
                      )}
                    >
                      <Icon className="size-5" strokeWidth={1.75} />
                      <span className="text-[13px] font-medium leading-tight">{it.label}</span>
                      {it.badge ? <span className="absolute right-2.5 top-2.5 rounded-sm bg-signal px-1.5 text-[11px] font-semibold text-signal-ink">{it.badge}</span> : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="flex gap-2 border-t border-line pt-4">
            <ButtonLink to={config.key === "app" ? "/app/profile" : `${config.base}/settings`} variant="secondary" className="flex-1" leading={<UserIcon className="size-4" />}>
              Account
            </ButtonLink>
            <Button variant="secondary" className="flex-1" leading={theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? "Light" : "Dark"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Tablet drawer */}
      {drawer && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-overlay animate-fade-in" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-surface shadow-float animate-pop-in">
            <IconButton label="Close menu" className="absolute right-2 top-2.5" onClick={() => setDrawer(false)}>
              <X />
            </IconButton>
            {sidebar(() => setDrawer(false))}
          </aside>
        </div>
      )}

      <CommandPalette open={search} onClose={() => setSearch(false)} config={config} />
    </div>
  );
}
