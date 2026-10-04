import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "destructive" | "signal" | "link";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium select-none transition-[background-color,color,border-color,transform,box-shadow] duration-150 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 aria-disabled:opacity-50 aria-disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-slate text-slate-ink hover:bg-slate-hover dark:bg-slate-ink dark:text-slate-950 dark:hover:bg-white",
  secondary: "bg-stone text-stone-ink hover:bg-stone-hover",
  outline: "border border-line-strong bg-surface text-ink hover:bg-sunken",
  ghost: "text-ink-2 hover:bg-sunken hover:text-ink",
  destructive: "bg-danger text-white hover:brightness-95 dark:text-slate-950",
  signal: "bg-signal text-signal-ink hover:bg-signal-hover",
  link: "text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink !px-0 !h-auto active:scale-100",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] rounded-sm",
  md: "h-11 px-4 text-[14px] rounded-md",
  lg: "h-13 px-6 text-[15px] rounded-md",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  block?: boolean;
}

export const buttonClass = (variant: ButtonVariant = "primary", size: ButtonSize = "md", block?: boolean, className?: string) =>
  cn(base, variants[variant], sizes[size], block && "w-full", className);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, leading, trailing, block, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass(variant, size, block, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : leading}
      {children && <span className={cn(loading && "opacity-80")}>{children}</span>}
      {!loading && trailing}
    </button>
  );
});

export interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leading?: ReactNode;
  trailing?: ReactNode;
  block?: boolean;
}

export function ButtonLink({ variant = "primary", size = "md", leading, trailing, block, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClass(variant, size, block, typeof className === "string" ? className : undefined)} {...rest}>
      {leading}
      {children}
      {trailing}
    </Link>
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: "ghost" | "outline" | "secondary" | "primary" | "glass";
  size?: "sm" | "md";
  badge?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = "ghost", size = "md", badge, className, children, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-md transition-colors active:scale-[0.96] disabled:opacity-50",
        size === "md" ? "size-11 [&_svg]:size-5" : "size-8 [&_svg]:size-4",
        variant === "ghost" && "text-ink-2 hover:bg-sunken hover:text-ink",
        variant === "outline" && "border border-line-strong bg-surface text-ink hover:bg-sunken",
        variant === "secondary" && "bg-stone text-stone-ink hover:bg-stone-hover",
        variant === "primary" && "bg-slate text-slate-ink hover:bg-slate-hover",
        variant === "glass" && "bg-white/12 text-slate-ink backdrop-blur hover:bg-white/20",
        className,
      )}
      {...rest}
    >
      {children}
      {badge && <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-signal ring-2 ring-surface" aria-hidden />}
    </button>
  );
});
