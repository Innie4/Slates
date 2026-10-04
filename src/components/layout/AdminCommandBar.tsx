import { Link, useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { adminAlerts } from "@/data";
import { Menu } from "@/components/ui";
import { cn } from "@/lib/cn";

/**
 * Part S — persistent operations command bar for Slate staff.
 * Global alerts link straight to the queue that needs attention.
 */
const ALERTS = [
  { label: "missed pickups", n: adminAlerts.missedPickups, to: "/admin/pickups?tab=missed", hot: true },
  { label: "operator applications", n: adminAlerts.operatorApplications, to: "/admin/operator-applications" },
  { label: "failed payments", n: adminAlerts.failedPayments, to: "/admin/payments?tab=failed", hot: true },
  { label: "SLA breaches", n: adminAlerts.slaBreaches, to: "/admin/complaints?tab=escalated", hot: true },
  { label: "chargebacks", n: adminAlerts.chargebacks, to: "/admin/chargebacks" },
  { label: "contracts expiring", n: adminAlerts.contractsExpiring, to: "/admin/contracts?tab=expiring" },
  { label: "documents expiring", n: adminAlerts.documentsExpiring, to: "/admin/documents?tab=expiring" },
];

const QUICK = [
  ["Customer", "/admin/customers?new=1"],
  ["Operator", "/admin/operator-applications?new=1"],
  ["Contract", "/admin/contracts/new"],
  ["Service", "/admin/services?new=1"],
  ["Pickup", "/admin/bookings?new=1"],
  ["Community project", "/admin/community?new=1"],
  ["Invoice", "/admin/invoices?new=1"],
  ["Complaint", "/admin/complaints?new=1"],
  ["Support ticket", "/admin/support?new=1"],
] as const;

export function AdminCommandBar() {
  const navigate = useNavigate();
  return (
    <div className="flex h-11 items-center gap-3 border-t border-line px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto scrollbar-none">
        {ALERTS.map((a) => (
          <Link
            key={a.label}
            to={a.to}
            className={cn(
              "flex h-7 shrink-0 items-center gap-1.5 rounded-sm px-2 text-[12px] font-medium transition-colors",
              a.hot ? "bg-signal-soft text-ink hover:bg-signal/25" : "bg-sunken text-ink-2 hover:text-ink",
            )}
          >
            <span className={cn("font-semibold tnum", a.hot && "text-[color:var(--signal-hover)] dark:text-signal")}>{a.n}</span>
            {a.label}
          </Link>
        ))}
      </div>
      <Menu
        trigger={(p) => (
          <button type="button" {...p} className="flex h-7 shrink-0 items-center gap-1 rounded-sm bg-slate px-2.5 text-[12px] font-semibold text-slate-ink dark:bg-slate-ink dark:text-slate-950">
            <Plus className="size-3.5" /> New
          </button>
        )}
        items={QUICK.map(([label, to]) => ({ label, onSelect: () => navigate(to) }))}
      />
    </div>
  );
}
