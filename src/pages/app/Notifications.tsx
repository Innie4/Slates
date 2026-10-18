import { useMemo, useState } from "react";
import { Link } from "react-router";
import { CheckCheck, CircleDot, CreditCard, HeartHandshake, LifeBuoy, type LucideIcon, Settings2, Tag, Truck, Wrench } from "lucide-react";
import { Button, ButtonLink, EmptyState, Page, PageHeader, Segmented, useToast } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { NotificationItem } from "@/data";
import { DEMO_NOW, formatDay, formatRelative, formatTime } from "@/lib/format";
import { allNotifications } from "./_care";

const CATS = ["Pickups", "Payments", "Service", "Community", "Promotions", "Support"] as const;
type Cat = (typeof CATS)[number];

const ICONS: Record<Cat, LucideIcon> = {
  Pickups: Truck,
  Payments: CreditCard,
  Service: Wrench,
  Community: HeartHandshake,
  Promotions: Tag,
  Support: LifeBuoy,
};

const EMPTY: Record<Cat, string> = {
  Pickups: "Collection reminders, live truck updates and outcomes appear here.",
  Payments: "Charges, receipts and card problems appear here.",
  Service: "Complaint updates, route changes and plan changes appear here.",
  Community: "Updates from projects in your estate appear here.",
  Promotions: "Slate rarely sends offers. When it does, they're here, and you can turn them off in Settings.",
  Support: "Replies to your support tickets appear here.",
};

const DAY = 86_400_000;
const startOfToday = new Date(DEMO_NOW.getFullYear(), DEMO_NOW.getMonth(), DEMO_NOW.getDate()).getTime();

function groupOf(iso: string) {
  const t = new Date(iso).getTime();
  if (t >= startOfToday) return "Today";
  if (t >= startOfToday - 6 * DAY) return "This week";
  return "Earlier";
}

/** C28, notification inbox. */
export default function Notifications() {
  const toast = useToast();
  const [cat, setCat] = useState<Cat | "All">("All");
  const [show, setShow] = useState<"all" | "unread">("all");
  const [read, setRead] = useState<Set<string>>(() => new Set(allNotifications.filter((n) => n.read).map((n) => n.id)));

  const isUnread = (n: NotificationItem) => !read.has(n.id);
  const unread = allNotifications.filter(isUnread).length;
  const unreadIn = (c: Cat) => allNotifications.filter((n) => n.category === c && isUnread(n)).length;
  const items = allNotifications.filter((n) => (cat === "All" || n.category === cat) && (show === "all" || isUnread(n)));
  const groups = useMemo(() => {
    const g: Array<{ label: string; items: NotificationItem[] }> = [];
    for (const n of items) {
      const label = groupOf(n.time);
      const last = g[g.length - 1];
      if (last?.label === label) last.items.push(n);
      else g.push({ label, items: [n] });
    }
    return g;
  }, [items]);

  const setOne = (id: string, makeRead: boolean) =>
    setRead((s) => {
      const next = new Set(s);
      if (makeRead) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <Page narrow>
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread. Tap one to open what it's about.` : "You're up to date."}
        actions={
          <>
            <Button
              variant="secondary"
              leading={<CheckCheck className="size-4" />}
              disabled={!unread}
              onClick={() => {
                setRead(new Set(allNotifications.map((n) => n.id)));
                toast.success("All marked as read");
              }}
            >
              Mark all read
            </Button>
            <ButtonLink to="/app/settings#notifications" variant="ghost" leading={<Settings2 className="size-4" />}>
              Preferences
            </ButtonLink>
          </>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="-mx-5 overflow-x-auto px-5 scrollbar-none md:mx-0 md:px-0">
          <div className="flex min-w-max gap-2" role="group" aria-label="Filter by category">
            {(["All", ...CATS] as const).map((c) => {
              const on = cat === c;
              const n = c === "All" ? unread : unreadIn(c);
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setCat(c)}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-sm border px-3 text-[14px] font-medium transition",
                    on ? "border-ink bg-ink text-surface" : "border-line-strong bg-surface text-ink-2 hover:border-ink-3 hover:text-ink",
                  )}
                >
                  {c}
                  {n > 0 && (
                    <span className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded-sm px-1 text-[12px] font-semibold tnum", on ? "bg-signal text-signal-ink" : "bg-signal-soft text-ink")}>
                      {n}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <Segmented
          size="sm"
          value={show}
          onChange={setShow}
          className="self-start"
          options={[
            { value: "all", label: "All" },
            { value: "unread", label: `Unread${unread ? ` (${unread})` : ""}` },
          ]}
        />
      </div>

      {groups.length === 0 ? (
        show === "unread" ? (
          <EmptyState
            title="You're all caught up"
            description={cat === "All" ? "Nothing unread. New updates about your pickups and payments arrive here first." : `Nothing unread in ${cat}.`}
            action={
              <Button variant="secondary" onClick={() => setShow("all")}>
                Show read notifications
              </Button>
            }
          />
        ) : (
          <EmptyState
            title={`No ${cat === "All" ? "notifications" : cat.toLowerCase()} yet`}
            description={cat === "All" ? "Updates about your service appear here." : EMPTY[cat]}
            action={
              <Button variant="secondary" onClick={() => setCat("All")}>
                Show all categories
              </Button>
            }
          />
        )
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((g) => (
            <section key={g.label} aria-labelledby={`g-${g.label}`} className="flex flex-col">
              <h2 id={`g-${g.label}`} className="t-micro mb-1 text-ink-3">
                {g.label}
              </h2>
              <ul className="flex flex-col divide-y divide-line border-y border-line">
                {g.items.map((n) => (
                  <NotificationRow key={n.id} n={n} unread={isUnread(n)} onRead={(v) => setOne(n.id, v)} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Page>
  );
}

function NotificationRow({ n, unread, onRead }: { n: NotificationItem; unread: boolean; onRead: (makeRead: boolean) => void }) {
  const Icon = ICONS[n.category as Cat] ?? CircleDot;
  const when = groupOf(n.time) === "Today" ? formatTime(n.time) : groupOf(n.time) === "This week" ? formatRelative(n.time) : formatDay(n.time);
  return (
    <li className="group relative flex items-start">
      <Link
        to={n.to ?? "/app/notifications"}
        onClick={() => onRead(true)}
        className={cn("-mx-2 flex min-w-0 flex-1 items-start gap-3.5 rounded-md px-2 py-4 pr-12 transition-colors hover:bg-sunken/70")}
      >
        <span className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
          <Icon className={cn("size-[18px]", unread ? "text-ink" : "text-ink-3")} strokeWidth={1.75} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-start gap-2">
            <span className={cn("t-body min-w-0 flex-1 text-ink", unread ? "font-semibold" : "font-medium")}>{n.title}</span>
            {unread && <span className="mt-2 size-2 shrink-0 rounded-full bg-signal" aria-label="Unread" />}
          </span>
          <span className={cn("t-small", unread ? "text-ink-2" : "text-ink-3")}>{n.body}</span>
          <span className="t-micro mt-1 text-ink-3 tnum">
            {n.category} · {when}
          </span>
        </span>
      </Link>
      <button
        type="button"
        onClick={() => onRead(unread)}
        aria-label={unread ? "Mark as read" : "Mark as unread"}
        title={unread ? "Mark as read" : "Mark as unread"}
        className="absolute right-0 top-3.5 flex size-9 items-center justify-center rounded-md text-ink-3 opacity-100 transition hover:bg-sunken hover:text-ink md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
      >
        {unread ? <CheckCheck className="size-4" /> : <CircleDot className="size-4" />}
      </button>
    </li>
  );
}
