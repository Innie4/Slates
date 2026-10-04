import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { ArrowRight, CornerDownLeft, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { Kbd } from "@/components/ui";
import type { PortalConfig } from "./nav";
import { complaints, contracts, customers, invoices, myPayments, myPickups, operators, payments, pickups, tickets } from "@/data";
import { formatNaira } from "@/lib/format";

interface Result {
  group: string;
  label: string;
  hint?: string;
  to: string;
}

/**
 * Global search (Part P). Pages from the portal nav + entities.
 * Admins search customers, operators, contracts, pickups, payments,
 * complaints, invoices and tickets. Customers search their own pickups/payments.
 */
export function CommandPalette({ open, onClose, config }: { open: boolean; onClose: () => void; config: PortalConfig }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const s = q.trim().toLowerCase();
    const pages: Result[] = config.groups.flatMap((g) => g.items.map((i) => ({ group: "Go to", label: i.label, hint: g.label, to: i.to })));
    const match = (t: string) => !s || t.toLowerCase().includes(s);
    const out: Result[] = pages.filter((p) => match(p.label)).slice(0, s ? 6 : 8);
    if (!s) return out;
    if (config.key === "admin") {
      customers.filter((c) => match(c.name) || match(c.id)).slice(0, 4).forEach((c) => out.push({ group: "Customers", label: c.name, hint: `${c.type} · ${c.area}`, to: `/admin/customers/${c.id}` }));
      operators.filter((o) => match(o.name)).slice(0, 3).forEach((o) => out.push({ group: "Operators", label: o.name, hint: o.status, to: `/admin/operators/${o.id}` }));
      contracts.filter((c) => match(c.id) || match(c.operatorName)).slice(0, 3).forEach((c) => out.push({ group: "Contracts", label: c.id, hint: `${c.operatorName} · ${c.status}`, to: `/admin/contracts/${c.id}` }));
      pickups.filter((p) => match(p.id) || match(p.customerName)).slice(0, 4).forEach((p) => out.push({ group: "Pickups", label: p.id, hint: `${p.customerName} · ${p.status}`, to: `/admin/pickups/${p.id}` }));
      payments.filter((p) => match(p.reference) || match(p.customerName)).slice(0, 3).forEach((p) => out.push({ group: "Payments", label: p.reference, hint: `${p.customerName} · ${formatNaira(p.amount)}`, to: `/admin/payments/${p.id}` }));
      complaints.filter((c) => match(c.id) || match(c.customerName) || match(c.issue)).slice(0, 3).forEach((c) => out.push({ group: "Complaints", label: `${c.id} — ${c.issue}`, hint: c.customerName, to: `/admin/complaints?id=${c.id}` }));
      invoices.filter((i) => match(i.id) || match(i.customerName)).slice(0, 3).forEach((i) => out.push({ group: "Invoices", label: i.id, hint: i.customerName, to: `/admin/invoices?id=${i.id}` }));
      tickets.filter((t) => match(t.id) || match(t.subject)).slice(0, 3).forEach((t) => out.push({ group: "Tickets", label: `${t.id} — ${t.subject}`, hint: t.from, to: `/admin/support?id=${t.id}` }));
    } else if (config.key === "app") {
      myPickups.filter((p) => match(p.id) || match(p.service)).slice(0, 4).forEach((p) => out.push({ group: "Pickups", label: p.id, hint: `${p.service} · ${p.status}`, to: `/app/pickups/${p.id}` }));
      myPayments.filter((p) => match(p.reference) || match(p.service)).slice(0, 4).forEach((p) => out.push({ group: "Payments", label: p.reference, hint: `${p.service} · ${formatNaira(p.amount)}`, to: `/app/payments` }));
    } else if (config.key === "operator") {
      pickups.filter((p) => p.operatorId === "op-ufok" && (match(p.id) || match(p.customerName))).slice(0, 5).forEach((p) => out.push({ group: "Jobs", label: p.id, hint: `${p.customerName} · ${p.status}`, to: `/operator/jobs/${p.id}` }));
    }
    return out;
  }, [q, config]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
      if (e.key === "Enter" && results[active]) { navigate(results[active]!.to); onClose(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, results, active, navigate, onClose]);

  if (!open) return null;
  let lastGroup = "";
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-start justify-center p-3 pt-[8vh] sm:p-6 sm:pt-[12vh]">
      <div className="absolute inset-0 bg-overlay animate-fade-in" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Search" className="relative flex max-h-[76vh] w-full max-w-xl flex-col overflow-hidden rounded-lg bg-surface shadow-float animate-pop-in">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-5 shrink-0 text-ink-3" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            placeholder={config.key === "admin" ? "Search customers, operators, pickups, payments…" : "Search pages, pickups, payments…"}
            className="h-14 flex-1 bg-transparent text-[16px] text-ink placeholder:text-ink-3 focus:outline-none"
            aria-label="Search"
          />
          <Kbd>Esc</Kbd>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto p-2" role="listbox">
          {results.length === 0 && <li className="px-3 py-10 text-center t-body text-ink-3">No matches for “{q}”.</li>}
          {results.map((r, i) => {
            const header = r.group !== lastGroup ? r.group : null;
            lastGroup = r.group;
            return (
              <li key={`${r.group}-${r.to}-${i}`}>
                {header && <p className="px-3 pb-1 pt-3 t-micro text-ink-3">{header}</p>}
                <button
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => { navigate(r.to); onClose(); }}
                  className={cn("flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left", i === active ? "bg-sunken" : "")}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate t-body text-ink">{r.label}</span>
                    {r.hint && <span className="block truncate t-small text-ink-3">{r.hint}</span>}
                  </span>
                  {i === active ? <CornerDownLeft className="size-4 text-ink-3" /> : <ArrowRight className="size-4 text-transparent" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
