import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, IconButton, type ButtonVariant } from "./Button";

/* Lock body scroll while any overlay is open (ref-counted). */
let lockCount = 0;
function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lockCount++;
    document.documentElement.style.overflow = "hidden";
    return () => {
      lockCount--;
      if (lockCount === 0) document.documentElement.style.overflow = "";
    };
  }, [active]);
}

function useEscape(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [active, onClose]);
}

function useFocusTrap(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!active || !ref.current) return;
    const prev = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const first = node.querySelector<HTMLElement>("[autofocus], input, select, textarea, button:not([data-close])");
    (first ?? node).focus({ preventScroll: true });
    const h = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const f = node.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      const a = f[0]!, b = f[f.length - 1]!;
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
      else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
    };
    node.addEventListener("keydown", h);
    return () => {
      node.removeEventListener("keydown", h);
      prev?.focus?.({ preventScroll: true });
    };
  }, [active]);
  return ref;
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  /** On mobile the modal is a bottom sheet. Set false to keep it centered. */
  sheet?: boolean;
  hideClose?: boolean;
  className?: string;
}

/**
 * Modal, centered dialog on ≥640px, bottom sheet on phones.
 * Footer actions sit in the thumb zone on mobile.
 */
export function Modal({ open, onClose, title, description, children, footer, size = "md", sheet = true, hideClose, className }: ModalProps) {
  useScrollLock(open);
  useEscape(open, onClose);
  const trap = useFocusTrap(open);
  const titleId = useId();
  if (!open) return null;
  const widths = { sm: "sm:max-w-sm", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" };
  return createPortal(
    <div className={cn("fixed inset-0 z-[80] flex justify-center", sheet ? "items-end sm:items-center" : "items-center p-4")}>
      <div className="absolute inset-0 bg-overlay animate-fade-in" onClick={onClose} aria-hidden />
      <div
        ref={trap}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[92dvh] w-full flex-col bg-surface shadow-float outline-none",
          sheet ? "rounded-t-xl animate-sheet-up sm:m-4 sm:rounded-lg sm:animate-pop-in" : "rounded-lg animate-pop-in",
          widths[size],
          className,
        )}
      >
        {sheet && <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-line-strong sm:hidden" aria-hidden />}
        {(title || !hideClose) && (
          <div className="flex items-start gap-4 px-5 pb-2 pt-4 sm:px-6 sm:pt-6">
            <div className="min-w-0 flex-1">
              {title && <h2 id={titleId} className="t-h2 text-ink">{title}</h2>}
              {description && <p className="t-small mt-1 text-ink-2">{description}</p>}
            </div>
            {!hideClose && (
              <IconButton label="Close" size="sm" onClick={onClose} data-close className="-mr-1.5 -mt-0.5">
                <X />
              </IconButton>
            )}
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3 sm:px-6">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 safe-bottom sm:flex-row sm:justify-end sm:px-6 [&>*]:w-full sm:[&>*]:w-auto">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/** Right-side drawer on desktop, full-height sheet on mobile. */
export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  width?: "md" | "lg";
}) {
  useScrollLock(open);
  useEscape(open, onClose);
  const trap = useFocusTrap(open);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-overlay animate-fade-in" onClick={onClose} aria-hidden />
      <div
        ref={trap}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          "absolute inset-y-0 right-0 flex w-full flex-col bg-surface shadow-float outline-none animate-slide-in-right",
          width === "md" ? "sm:max-w-md" : "sm:max-w-2xl",
        )}
      >
        <div className="flex items-start gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            {title && <h2 className="t-h2 text-ink">{title}</h2>}
            {description && <p className="t-small mt-1 text-ink-2">{description}</p>}
          </div>
          <IconButton label="Close" size="sm" onClick={onClose} data-close>
            <X />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex gap-2 border-t border-line px-5 py-4 safe-bottom sm:px-6 [&>*]:flex-1 sm:[&>*]:flex-none sm:justify-end">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** Confirmation dialog for destructive or consequential actions. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  children,
  requireText,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ButtonVariant;
  children?: ReactNode;
  /** Require the user to type this text before confirming (e.g. "TERMINATE"). */
  requireText?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [typed, setTyped] = useState("");
  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);
  const destructive = variant === "destructive";
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      hideClose
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            loading={busy}
            disabled={!!requireText && typed !== requireText}
            onClick={async () => {
              setBusy(true);
              await new Promise((r) => setTimeout(r, 650));
              await onConfirm();
              setBusy(false);
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 pt-2">
        {destructive && (
          <span className="flex size-11 items-center justify-center rounded-md bg-danger-bg text-danger">
            <AlertTriangle className="size-5" />
          </span>
        )}
        <h2 className="t-h2 text-ink">{title}</h2>
        {description && <p className="t-body text-ink-2">{description}</p>}
        {children}
        {requireText && (
          <label className="mt-1 flex flex-col gap-1.5">
            <span className="t-small text-ink-2">
              Type <span className="t-mono font-semibold text-ink">{requireText}</span> to confirm
            </span>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="h-11 rounded-md border border-line-strong bg-surface px-3 t-mono text-ink focus:border-ink focus:outline-none"
            />
          </label>
        )}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Menu (dropdown) and Popover                                         */
/* ------------------------------------------------------------------ */

export interface MenuItem {
  label: ReactNode;
  icon?: ReactNode;
  onSelect?: () => void;
  href?: string;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

export function Menu({
  trigger,
  items,
  align = "end",
  className,
}: {
  trigger: (props: { onClick: () => void; "aria-expanded": boolean; "aria-haspopup": "menu" }) => ReactNode;
  items: MenuItem[];
  align?: "start" | "end";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", k);
    };
  }, [open]);
  return (
    <div ref={ref} className={cn("relative inline-flex", className)}>
      {trigger({ onClick: () => setOpen((o) => !o), "aria-expanded": open, "aria-haspopup": "menu" })}
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute top-full z-50 mt-1.5 min-w-52 overflow-hidden rounded-md border border-line bg-surface py-1.5 shadow-float animate-pop-in",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {items.map((it, i) =>
            it.divider ? (
              <div key={i} className="my-1.5 h-px bg-line" />
            ) : (
              <button
                key={i}
                role="menuitem"
                type="button"
                disabled={it.disabled}
                onClick={() => {
                  setOpen(false);
                  it.onSelect?.();
                  if (it.href) window.location.assign(it.href);
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-[14px] transition-colors disabled:opacity-40 [&_svg]:size-4",
                  it.danger ? "text-danger hover:bg-danger-bg" : "text-ink hover:bg-sunken",
                )}
              >
                {it.icon && <span className={cn(!it.danger && "text-ink-3")}>{it.icon}</span>}
                {it.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export function Popover({
  trigger,
  children,
  align = "end",
  className,
  open: controlledOpen,
  onOpenChange,
}: {
  trigger: (props: { onClick: () => void; "aria-expanded": boolean }) => ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: "start" | "end";
  className?: string;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}) {
  const [inner, setInner] = useState(false);
  const open = controlledOpen ?? inner;
  const setOpen = (o: boolean) => (onOpenChange ? onOpenChange(o) : setInner(o));
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  });
  return (
    <div ref={ref} className="relative inline-flex">
      {trigger({ onClick: () => setOpen(!open), "aria-expanded": open })}
      {open && (
        <div
          className={cn(
            "absolute top-full z-50 mt-2 rounded-lg border border-line bg-surface shadow-float animate-pop-in",
            align === "end" ? "right-0" : "left-0",
            className,
          )}
        >
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}

/** CSS-only tooltip; content must be short. */
export function Tooltip({ content, children, side = "top" }: { content: ReactNode; children: ReactNode; side?: "top" | "bottom" }) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-sm bg-slate-950 px-2 py-1 text-[12px] font-medium text-white opacity-0 transition-opacity group-hover/tt:opacity-100 group-focus-within/tt:opacity-100 dark:bg-slate-100 dark:text-slate-950",
          side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5",
        )}
      >
        {content}
      </span>
    </span>
  );
}
