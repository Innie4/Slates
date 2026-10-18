import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/cn";
import "./date-picker.css";

export interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  placeholder?: string;
  className?: string;
  fieldClassName?: string;
  inline?: boolean;
  isDateDisabled?: (value: string) => boolean;
  "aria-label"?: string;
}

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dateValue = (date: Date) => `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const parseDate = (value?: string) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  // Local noon preserves calendar dates across time zones and daylight-saving changes.
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) || dateValue(date) !== value ? null : date;
};
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12);
const addMonths = (date: Date, months: number) => {
  const first = new Date(date.getFullYear(), date.getMonth() + months, 1, 12);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0, 12).getDate();
  return new Date(first.getFullYear(), first.getMonth(), Math.min(date.getDate(), last), 12);
};
const monthLabel = (date: Date) => date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
const fullLabel = (date: Date) => date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export function DatePicker({
  value, onChange, label, hint, error, optional, min, max, disabled, required, name, id,
  placeholder = "Choose a date", className, fieldClassName, inline = false, isDateDisabled,
  "aria-label": ariaLabel,
}: DatePickerProps) {
  const uid = useId();
  const inputId = id ?? `date-${uid}`;
  const headingId = `${inputId}-month`;
  const panelId = `${inputId}-calendar`;
  const descriptionId = `${inputId}-description`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const validationRef = useRef<HTMLInputElement>(null);
  const focusDay = useRef(false);
  const today = dateValue(new Date());
  const lower = parseDate(min) ? min! : "0001-01-01";
  const upper = parseDate(max) ? max! : "9999-12-31";
  const clamp = (candidate: string) => candidate < lower ? lower : candidate > upper ? upper : candidate;
  const selected = parseDate(value);
  const initial = clamp(selected ? value : today);
  const [open, setOpen] = useState(false);
  const [validationError, setValidationError] = useState("");
  const fieldError = error || validationError;
  const [active, setActive] = useState(initial);
  const [month, setMonth] = useState(() => parseDate(initial) ?? new Date());
  const visible = inline || open;
  const unavailable = (date: string) => !!disabled || date < lower || date > upper || !!isDateDisabled?.(date);
  const displayedMonth = month.getMonth();
  const first = new Date(month.getFullYear(), displayedMonth, 1, 12);
  const start = addDays(first, -((first.getDay() + 6) % 7));
  const cells = Array.from({ length: 42 }, (_, index) => addDays(start, index));
  const activeInMonth = cells.some((date) => date.getMonth() === displayedMonth && dateValue(date) === active && !unavailable(active));
  const tabDate = activeInMonth ? active : cells.find((date) => date.getMonth() === displayedMonth && !unavailable(dateValue(date)));
  const tabValue = typeof tabDate === "string" ? tabDate : tabDate ? dateValue(tabDate) : "";

  const close = (restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true });
  };
  const moveTo = (candidate: Date, direction = 1) => {
    let date = parseDate(clamp(dateValue(candidate)));
    if (!date) return;
    // A bounded search skips blocked weekdays without hanging on a fully closed calendar.
    for (let attempts = 0; attempts < 366; attempts++) {
      const key = dateValue(date);
      if (!unavailable(key)) {
        focusDay.current = true;
        setActive(key);
        setMonth(new Date(date.getFullYear(), date.getMonth(), 1, 12));
        return;
      }
      date = addDays(date, direction);
      if (dateValue(date) < lower || dateValue(date) > upper) return;
    }
  };

  useLayoutEffect(() => {
    if (!visible || !panelRef.current) return;
    const panel = panelRef.current;
    if (!inline) {
      // The top layer avoids clipping inside scrollable forms and existing dialogs.
      panel.showPopover?.();
      const position = () => {
        const anchor = triggerRef.current?.getBoundingClientRect();
        if (!anchor) return;
        const edge = window.innerWidth < 360 ? 0 : 8;
        const width = Math.min(352, window.innerWidth - edge * 2);
        const height = panel.getBoundingClientRect().height;
        const left = Math.max(edge, Math.min(anchor.left, window.innerWidth - width - edge));
        const below = anchor.bottom + 8;
        const top = below + height <= window.innerHeight - 8 ? below : Math.max(8, anchor.top - height - 8);
        panel.style.setProperty("--date-left", `${left}px`);
        panel.style.setProperty("--date-top", `${top}px`);
      };
      position();
      window.addEventListener("resize", position);
      window.addEventListener("scroll", position, true);
      return () => {
        window.removeEventListener("resize", position);
        window.removeEventListener("scroll", position, true);
      };
    }
  }, [visible, inline]);

  useLayoutEffect(() => {
    if (visible && focusDay.current) {
      const day = panelRef.current?.querySelector<HTMLButtonElement>(`[data-date="${tabValue}"]`);
      (day ?? panelRef.current)?.focus({ preventScroll: true });
      if (day && panelRef.current) {
        const button = day.getBoundingClientRect();
        const panel = panelRef.current.getBoundingClientRect();
        if (button.top < panel.top || button.bottom > panel.bottom) day.scrollIntoView({ block: "nearest" });
      }
      focusDay.current = false;
    }
  }, [visible, active, month, tabValue]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  useLayoutEffect(() => {
    validationRef.current?.setCustomValidity(value && (!selected || unavailable(value)) ? "Choose an available date." : "");
  });
  useEffect(() => { setValidationError(""); }, [value]);

  const onDayKey = (event: KeyboardEvent<HTMLButtonElement>, date: Date) => {
    let next: Date;
    let direction: number | undefined;
    const dayIndex = (date.getDay() + 6) % 7;
    switch (event.key) {
      case "ArrowLeft": next = addDays(date, -1); break;
      case "ArrowRight": next = addDays(date, 1); break;
      case "ArrowUp": next = addDays(date, -7); break;
      case "ArrowDown": next = addDays(date, 7); break;
      case "Home": next = addDays(date, -dayIndex); direction = 1; break;
      case "End": next = addDays(date, 6 - dayIndex); direction = -1; break;
      case "PageUp": next = addMonths(date, event.shiftKey ? -12 : -1); break;
      case "PageDown": next = addMonths(date, event.shiftKey ? 12 : 1); break;
      default: return;
    }
    event.preventDefault();
    moveTo(next, direction ?? (next < date ? -1 : 1));
  };
  const choose = (key: string) => {
    if (unavailable(key)) return;
    onChange(key);
    setActive(key);
    if (inline) setMonth(parseDate(key)!);
    if (!inline) close();
  };
  const shiftMonth = (amount: number) => {
    const target = addMonths(month, amount);
    setMonth(new Date(target.getFullYear(), target.getMonth(), 1, 12));
  };
  const prevMonthEnd = dateValue(new Date(month.getFullYear(), displayedMonth, 0, 12));
  const nextMonthStart = dateValue(new Date(month.getFullYear(), displayedMonth + 1, 1, 12));

  return (
    <div ref={rootRef} className={cn("date-picker", fieldClassName)} onBlur={(event) => {
      if (open && event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) close(false);
    }}>
      {label && <label id={`${inputId}-label`} htmlFor={inputId} className="date-picker-label">{label}{optional && <span>Optional</span>}</label>}
      {!inline && <button
        ref={triggerRef}
        type="button"
        id={inputId}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={visible ? panelId : undefined}
        aria-invalid={!!fieldError || undefined}
        aria-required={required || undefined}
        aria-describedby={fieldError || hint ? descriptionId : undefined}
        className={cn("date-picker-trigger", !selected && "date-picker-placeholder", className)}
        onClick={() => {
          if (open) return close();
          const startAt = clamp(selected ? value : today);
          setActive(startAt);
          setMonth(parseDate(startAt) ?? new Date());
          focusDay.current = true;
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const startAt = clamp(selected ? value : today);
            setActive(startAt);
            setMonth(parseDate(startAt) ?? new Date());
            focusDay.current = true;
            setOpen(true);
          }
        }}
      ><CalendarDays aria-hidden="true" /><span>{selected ? selected.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : placeholder}</span><ChevronDown aria-hidden="true" className="date-picker-chevron" /></button>}
      {visible && <div
        ref={panelRef}
        id={panelId}
        popover={inline ? undefined : "manual"}
        role={inline ? "group" : "dialog"}
        aria-label={ariaLabel ?? (typeof label === "string" ? label : "Choose a date")}
        aria-describedby={`${inputId}-keys${fieldError || hint ? ` ${descriptionId}` : ""}`}
        aria-invalid={inline && fieldError ? true : undefined}
        tabIndex={-1}
        className={cn("date-picker-panel", inline && "date-picker-inline", inline && className)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && !inline) {
            event.preventDefault();
            event.stopPropagation();
            close();
          }
        }}
      >
        <div className="date-picker-heading">
          <div><span className="date-picker-eyebrow">Select date</span><h3 id={headingId} aria-live="polite">{monthLabel(month)}</h3></div>
          <div className="date-picker-navigation">
            <button type="button" aria-label="Previous month" disabled={disabled || prevMonthEnd < lower} onClick={() => shiftMonth(-1)}><ChevronLeft aria-hidden="true" /></button>
            <button type="button" aria-label="Next month" disabled={disabled || nextMonthStart > upper} onClick={() => shiftMonth(1)}><ChevronRight aria-hidden="true" /></button>
          </div>
        </div>
        <p id={`${inputId}-keys`} className="sr-only">Use arrow keys to move by day or week. Home and End move within a week. Page Up and Page Down change month. Hold Shift to change year. Enter selects a date. Escape closes the calendar.</p>
        <table role="grid" aria-labelledby={headingId} className="date-picker-grid">
          <thead><tr>{weekdays.map((day) => <th key={day} scope="col" aria-label={day}>{day.slice(0, 2)}</th>)}</tr></thead>
          <tbody>{Array.from({ length: 6 }, (_, week) => <tr key={week}>{cells.slice(week * 7, week * 7 + 7).map((date) => {
            const key = dateValue(date);
            const otherMonth = date.getMonth() !== displayedMonth;
            return <td key={key} role="gridcell" aria-selected={key === value}><button
              type="button"
              data-date={key}
              tabIndex={key === tabValue ? 0 : -1}
              disabled={unavailable(key)}
              aria-label={fullLabel(date)}
              aria-current={key === today ? "date" : undefined}
              className={cn("date-picker-day", key === value && "date-picker-selected", key === today && "date-picker-today", otherMonth && "date-picker-outside")}
              onClick={() => choose(key)}
              onFocus={() => setActive(key)}
              onKeyDown={(event) => onDayKey(event, date)}
            >{date.getDate()}{key === value && <Check aria-hidden="true" />}</button></td>;
          })}</tr>)}</tbody>
        </table>
        <div className="date-picker-footer">
          <button type="button" disabled={unavailable(today)} onClick={() => { moveTo(new Date()); }}>Today</button>
          {!required && value && <button type="button" disabled={disabled} onClick={() => { onChange(""); if (!inline) close(); }}>Clear</button>}
          {!inline && <button type="button" className="date-picker-done" onClick={() => close()}><X aria-hidden="true" />Close</button>}
        </div>
      </div>}
      <input
        ref={validationRef}
        type="text"
        name={name}
        value={value}
        required={required}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={() => {}}
        onInvalid={(event) => {
          event.preventDefault();
          setValidationError(value ? "Choose an available date." : "Choose a date.");
          (triggerRef.current ?? panelRef.current)?.focus({ preventScroll: true });
        }}
      />
      {(fieldError || hint) && <p id={descriptionId} className={cn("date-picker-description", fieldError && "date-picker-error")} role={fieldError ? "alert" : undefined}>{fieldError || hint}</p>}
    </div>
  );
}
