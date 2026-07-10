"use client";

import { Check } from "lucide-react";
import { cn } from "@/utils/cn";

/** A card that behaves like a (multi-)select option — used across the wizard. */
export function SelectableCard({
  selected,
  onToggle,
  title,
  description,
  disabled,
  children,
  className,
}: {
  selected: boolean;
  onToggle: () => void;
  title: string;
  description?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "relative flex cursor-pointer flex-col rounded-xl border bg-white p-4 text-left shadow-sm transition-all",
        selected
          ? "border-indigo-500 ring-2 ring-indigo-100"
          : "border-slate-200 hover:border-slate-300 hover:shadow-md",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-3 right-3 flex size-5 items-center justify-center rounded-full border transition-colors",
          selected ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-300 bg-white",
        )}
      >
        {selected && <Check className="size-3" strokeWidth={3} />}
      </span>
      {children}
      <span className="pr-6 text-sm font-medium text-slate-900">{title}</span>
      {description && <span className="mt-1 text-xs text-slate-500">{description}</span>}
    </button>
  );
}
