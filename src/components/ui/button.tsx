"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--primary)] text-white shadow-[var(--shadow-bevel)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none",
  secondary:
    "border border-[var(--border-default)] bg-white text-[var(--text-primary)] shadow-[var(--shadow-subtle)] hover:bg-[var(--surface-secondary)] active:bg-[var(--surface-pressed)] disabled:text-slate-400 disabled:shadow-none",
  outline:
    "border border-[var(--border-default)] bg-white text-[var(--text-primary)] shadow-[var(--shadow-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-secondary)] disabled:text-slate-400",
  ghost: "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] disabled:text-slate-400",
  danger:
    "bg-rose-600 text-white shadow-[var(--shadow-bevel)] hover:bg-rose-700 active:bg-rose-800 disabled:bg-rose-300 disabled:shadow-none",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-7 gap-1.5 rounded-lg px-2.5 text-[13px]",
  md: "h-8 gap-2 rounded-lg px-3 text-[13px]",
  lg: "h-9 gap-2 rounded-lg px-4 text-sm",
  icon: "h-8 w-8 rounded-lg",
  "icon-sm": "h-7 w-7 rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, type, ...props }, ref) => (
    <button
      ref={ref}
      type={type ?? "button"}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center font-medium transition-[background-color,color,border-color,box-shadow] duration-100 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {isLoading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
