import {
  forwardRef,
  useId,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Check, ChevronDown, Eye, EyeOff, ImagePlus, MapPin, Search, Upload, X, FileText } from "lucide-react";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ */
/* Field wrapper: label, hint, error, optional tag                     */
/* ------------------------------------------------------------------ */

export interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
  action?: ReactNode;
}

export function Field({ label, hint, error, optional, htmlFor, className, children, action }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {(label || action) && (
        <div className="flex items-baseline justify-between gap-3">
          {label && (
            <label htmlFor={htmlFor} className="t-small font-medium text-ink">
              {label}
              {optional && <span className="ml-1.5 font-normal text-ink-3">Optional</span>}
            </label>
          )}
          {action}
        </div>
      )}
      {children}
      {error ? (
        <p className="t-small text-danger" role="alert">{error}</p>
      ) : hint ? (
        <p className="t-small text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

export const controlClass = (invalid?: boolean, className?: string) =>
  cn(
    "w-full rounded-md border bg-surface px-3.5 text-[15px] text-ink placeholder:text-ink-3 transition-[border-color,box-shadow]",
    "focus:outline-none focus:border-ink focus:ring-3 focus:ring-ink/8 disabled:bg-sunken disabled:text-ink-3",
    invalid ? "border-danger focus:border-danger focus:ring-danger/15" : "border-line-strong hover:border-ink-3",
    className,
  );

/* ------------------------------------------------------------------ */
/* Inputs                                                              */
/* ------------------------------------------------------------------ */

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  fieldClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, optional, leading, trailing, className, fieldClassName, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const control = (
    <div className="relative">
      {leading && (
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-ink-3 [&_svg]:size-[18px]">{leading}</span>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error || undefined}
        className={controlClass(!!error, cn("h-12", leading ? "pl-10" : undefined, trailing ? "pr-11" : undefined, className))}
        {...rest}
      />
      {trailing && <span className="absolute inset-y-0 right-1 flex items-center text-ink-3">{trailing}</span>}
    </div>
  );
  if (!label && !hint && !error) return control;
  return (
    <Field label={label} hint={hint} error={error} optional={optional} htmlFor={inputId} className={fieldClassName}>
      {control}
    </Field>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  fieldClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, optional, className, fieldClassName, id, rows = 4, ...rest },
  ref,
) {
  const autoId = useId();
  const tid = id ?? autoId;
  return (
    <Field label={label} hint={hint} error={error} optional={optional} htmlFor={tid} className={fieldClassName}>
      <textarea ref={ref} id={tid} rows={rows} className={controlClass(!!error, cn("py-3 leading-relaxed resize-y", className))} {...rest} />
    </Field>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  options: Array<string | { value: string; label: string }>;
  placeholder?: string;
  fieldClassName?: string;
  size?: never;
  compact?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, optional, options, placeholder, className, fieldClassName, id, compact, ...rest },
  ref,
) {
  const autoId = useId();
  const sid = id ?? autoId;
  const control = (
    <div className="relative">
      <select
        ref={ref}
        id={sid}
        aria-invalid={!!error || undefined}
        className={controlClass(!!error, cn("appearance-none pr-10", compact ? "h-9 text-[14px]" : "h-12", className))}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const opt = typeof o === "string" ? { value: o, label: o } : o;
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
    </div>
  );
  if (!label && !hint && !error) return control;
  return (
    <Field label={label} hint={hint} error={error} optional={optional} htmlFor={sid} className={fieldClassName}>
      {control}
    </Field>
  );
});

/** Nigerian phone input with fixed +234 prefix */
export const PhoneInput = forwardRef<HTMLInputElement, Omit<InputProps, "leading" | "type">>(function PhoneInput(props, ref) {
  return (
    <Input
      ref={ref}
      type="tel"
      inputMode="tel"
      autoComplete="tel-national"
      placeholder="803 412 7765"
      leading={<span className="t-small font-medium text-ink-2 not-italic">+234</span>}
      className="!pl-15"
      {...props}
    />
  );
});

/** Naira amount input */
export const CurrencyInput = forwardRef<HTMLInputElement, Omit<InputProps, "leading" | "type">>(function CurrencyInput(props, ref) {
  return <Input ref={ref} type="text" inputMode="numeric" leading={<span className="font-medium text-ink-2">₦</span>} className="tnum" {...props} />;
});

export function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 14) score++;
  const labels = ["Too short", "Weak", "Fair", "Good", "Strong"];
  return { score: score as 0 | 1 | 2 | 3 | 4, label: pw ? labels[score]! : "" };
}

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, "type" | "trailing"> & { showStrength?: boolean }>(
  function PasswordInput({ showStrength, value, onChange, ...props }, ref) {
    const [visible, setVisible] = useState(false);
    const [inner, setInner] = useState("");
    const current = typeof value === "string" ? value : inner;
    const strength = passwordStrength(current);
    return (
      <div className="flex flex-col gap-2">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => {
            setInner(e.target.value);
            onChange?.(e);
          }}
          trailing={
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="flex size-10 items-center justify-center rounded-md text-ink-3 hover:text-ink"
              aria-label={visible ? "Hide password" : "Show password"}
            >
              {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
            </button>
          }
          {...props}
        />
        {showStrength && current && (
          <div className="flex items-center gap-3" aria-live="polite">
            <div className="flex flex-1 gap-1">
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i <= strength.score
                      ? strength.score <= 1 ? "bg-danger" : strength.score === 2 ? "bg-warning" : "bg-success"
                      : "bg-line",
                  )}
                />
              ))}
            </div>
            <span className="t-micro w-16 text-right text-ink-2">{strength.label}</span>
          </div>
        )}
      </div>
    );
  },
);

export function SearchInput({ className, compact, ...props }: InputProps & { compact?: boolean }) {
  return (
    <Input
      type="search"
      leading={<Search />}
      placeholder="Search"
      className={cn(compact ? "h-10" : undefined, className)}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/* OTP                                                                 */
/* ------------------------------------------------------------------ */

export function OTPInput({
  length = 6,
  value,
  onChange,
  invalid,
  autoFocus,
}: {
  length?: number;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  autoFocus?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");
  const setAt = (i: number, d: string) => {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join("").slice(0, length));
  };
  return (
    <div className="flex gap-2 sm:gap-3" role="group" aria-label="One-time code">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          autoFocus={autoFocus && i === 0}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            if (!v) return setAt(i, "");
            if (v.length > 1) {
              onChange(v.slice(0, length));
              refs.current[Math.min(v.length, length) - 1]?.focus();
              return;
            }
            setAt(i, v);
            refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !d) refs.current[i - 1]?.focus();
            if (e.key === "ArrowLeft") refs.current[i - 1]?.focus();
            if (e.key === "ArrowRight") refs.current[i + 1]?.focus();
          }}
          onPaste={(e) => {
            const v = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
            if (v) {
              e.preventDefault();
              onChange(v);
              refs.current[Math.min(v.length, length) - 1]?.focus();
            }
          }}
          className={cn(
            "h-14 w-full min-w-0 max-w-14 rounded-md border bg-surface text-center font-display text-[24px] font-semibold tnum text-ink transition",
            "focus:outline-none focus:border-ink focus:ring-3 focus:ring-ink/8",
            invalid ? "border-danger" : d ? "border-ink-3" : "border-line-strong",
          )}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Checkbox, radio, switch                                             */
/* ------------------------------------------------------------------ */

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled,
  className,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  const autoId = useId();
  const cid = id ?? autoId;
  return (
    <label htmlFor={cid} className={cn("group flex cursor-pointer items-start gap-3", disabled && "cursor-not-allowed opacity-60", className)}>
      <span className="relative mt-0.5 flex size-5 shrink-0">
        <input
          id={cid}
          type="checkbox"
          className="peer absolute inset-0 appearance-none rounded-[5px] border border-line-strong bg-surface transition checked:border-slate checked:bg-slate dark:checked:border-slate-ink dark:checked:bg-slate-ink"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <Check className="pointer-events-none relative m-auto size-3.5 text-slate-ink opacity-0 peer-checked:opacity-100 dark:text-slate-950" strokeWidth={3} />
      </span>
      {(label || description) && (
        <span className="flex flex-col">
          {label && <span className="t-small text-ink">{label}</span>}
          {description && <span className="t-small text-ink-3">{description}</span>}
        </span>
      )}
    </label>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className={cn("flex items-center justify-between gap-4", disabled && "opacity-60")}>
      {(label || description) && (
        <label htmlFor={id} className="flex flex-col">
          {label && <span className="t-body font-medium text-ink">{label}</span>}
          {description && <span className="t-small text-ink-3">{description}</span>}
        </label>
      )}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-slate dark:bg-slate-ink" : "bg-line-strong",
        )}
      >
        <span
          className={cn(
            "inline-block size-5.5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-[var(--ease-out-quart)] dark:bg-slate-900",
            checked ? "translate-x-[23px] dark:bg-slate-900" : "translate-x-[3px] dark:bg-white",
          )}
        />
      </button>
    </div>
  );
}

/** A selectable card — used for plans, account types, frequencies, payment methods. */
export function ChoiceCard({
  selected,
  onSelect,
  title,
  description,
  icon,
  meta,
  disabled,
  className,
  type = "radio",
}: {
  selected: boolean;
  onSelect: () => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  meta?: ReactNode;
  disabled?: boolean;
  className?: string;
  type?: "radio" | "checkbox";
}) {
  return (
    <button
      type="button"
      role={type}
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "group relative flex w-full items-start gap-3.5 rounded-md border bg-surface p-4 text-left transition-[border-color,box-shadow,background-color]",
        selected ? "border-ink ring-1 ring-ink" : "border-line-strong hover:border-ink-3",
        disabled && "opacity-50",
        className,
      )}
    >
      {icon && (
        <span className={cn("mt-0.5 shrink-0 text-ink-2 [&_svg]:size-5", selected && "text-ink")}>{icon}</span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="t-h3 text-ink">{title}</span>
        {description && <span className="t-small text-ink-2">{description}</span>}
      </span>
      {meta && <span className="shrink-0 t-small font-medium text-ink">{meta}</span>}
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center border transition",
          type === "radio" ? "rounded-full" : "rounded-[5px]",
          selected ? "border-ink bg-ink" : "border-line-strong",
        )}
        aria-hidden
      >
        {selected && (type === "radio" ? <span className="size-2 rounded-full bg-surface" /> : <Check className="size-3.5 text-surface" strokeWidth={3} />)}
      </span>
    </button>
  );
}

/** Segmented control (iOS-like) for 2–5 short options */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: ReactNode }>;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" className={cn("inline-flex rounded-md bg-sunken p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 whitespace-nowrap rounded-[7px] font-medium transition-all",
            size === "md" ? "h-9 px-3.5 text-[14px]" : "h-7 px-2.5 text-[13px]",
            value === o.value ? "bg-surface text-ink shadow-[0_1px_2px_rgb(17_24_32/0.12)]" : "text-ink-2 hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Multi-select as toggle chips */
export function ChipGroup({
  options,
  value,
  onChange,
  multiple = true,
  className,
}: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  multiple?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="group">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(multiple ? (on ? value.filter((v) => v !== o) : [...value, o]) : [o])}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-sm border px-3 text-[14px] font-medium transition",
              on ? "border-ink bg-ink text-surface" : "border-line-strong bg-surface text-ink-2 hover:border-ink-3 hover:text-ink",
            )}
          >
            {on && <Check className="size-3.5" strokeWidth={2.5} />}
            {o}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Uploads                                                             */
/* ------------------------------------------------------------------ */

export interface UploadedFile {
  name: string;
  size: number;
  url?: string;
  type: string;
}

export function FileDrop({
  label,
  hint = "PDF, JPG or PNG, up to 10 MB",
  accept = ".pdf,.jpg,.jpeg,.png",
  multiple = true,
  images = false,
  files,
  onFiles,
  error,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  accept?: string;
  multiple?: boolean;
  images?: boolean;
  files: UploadedFile[];
  onFiles: (f: UploadedFile[]) => void;
  error?: ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const add = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list).map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
      url: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
    }));
    onFiles(multiple ? [...files, ...next] : next.slice(0, 1));
  };
  return (
    <Field label={label} error={error}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          add(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-7 text-center transition",
          over ? "border-ink bg-sunken" : error ? "border-danger" : "border-line-strong bg-surface hover:border-ink-3 hover:bg-sunken/50",
        )}
      >
        <span className="flex size-10 items-center justify-center rounded-md bg-sunken text-ink-2">
          {images ? <ImagePlus className="size-5" /> : <Upload className="size-5" />}
        </span>
        <span className="t-small text-ink">
          <span className="font-semibold underline underline-offset-4">{images ? "Add photos" : "Choose files"}</span> or drag them here
        </span>
        <span className="t-micro text-ink-3">{hint}</span>
        <input ref={inputRef} type="file" className="sr-only" accept={images ? "image/*" : accept} multiple={multiple} onChange={(e) => add(e.target.files)} />
      </div>
      {files.length > 0 &&
        (images ? (
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {files.map((f, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-md bg-sunken">
                {f.url ? <img src={f.url} alt={f.name} className="size-full object-cover" /> : <FileText className="m-auto size-6 text-ink-3" />}
                <button
                  type="button"
                  aria-label={`Remove ${f.name}`}
                  onClick={() => onFiles(files.filter((_, j) => j !== i))}
                  className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-slate-950/70 text-white"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <ul className="mt-2 divide-y divide-line rounded-md border border-line">
            {files.map((f, i) => (
              <li key={i} className="flex items-center gap-3 px-3 py-2.5">
                <FileText className="size-4 shrink-0 text-ink-3" />
                <span className="t-small min-w-0 flex-1 truncate text-ink">{f.name}</span>
                <span className="t-micro text-ink-3">{Math.max(1, Math.round(f.size / 1024))} KB</span>
                <button type="button" aria-label={`Remove ${f.name}`} onClick={() => onFiles(files.filter((_, j) => j !== i))} className="text-ink-3 hover:text-danger">
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        ))}
    </Field>
  );
}

/* ------------------------------------------------------------------ */
/* Address input with suggestions (Uyo)                                */
/* ------------------------------------------------------------------ */

const UYO_ADDRESSES = [
  "14 Ewet Housing Estate, Uyo",
  "Plot 7, Shelter Afrique Estate, Uyo",
  "22 Osongama Estate Phase 2, Uyo",
  "51 Aka Road, Uyo",
  "118 Oron Road, Uyo",
  "9 Udo Udoma Avenue, Uyo",
  "33 Ikot Ekpene Road, Uyo",
  "6 Nwaniba Road, Uyo",
  "40 Wellington Bassey Way, Uyo",
  "17 Abak Road, Uyo",
  "3 Itam Industrial Layout, Itu Road",
  "28 Use Offot Road, Uyo",
];

export function AddressInput({
  value,
  onChange,
  label = "Address",
  hint,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const matches = value.length > 1 ? UYO_ADDRESSES.filter((a) => a.toLowerCase().includes(value.toLowerCase())).slice(0, 5) : [];
  return (
    <div className="relative">
      <Input
        label={label}
        hint={hint}
        error={error}
        value={value}
        leading={<MapPin />}
        placeholder="Start typing your street or estate"
        autoComplete="street-address"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && matches.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-md border border-line bg-surface shadow-float animate-pop-in" role="listbox">
          {matches.map((m) => (
            <li key={m}>
              <button
                type="button"
                className="flex w-full items-center gap-3 px-3.5 py-3 text-left t-small text-ink hover:bg-sunken"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(m);
                  setOpen(false);
                }}
              >
                <MapPin className="size-4 shrink-0 text-ink-3" />
                {m}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
