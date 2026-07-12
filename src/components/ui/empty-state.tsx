import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-strong)] bg-white px-6 py-12 text-center",
        className,
      )}
    >
      {/* Blank drafting sheet: cross-hatched well, like an unused image frame. */}
      <div className="relative flex size-12 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full text-slate-200"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" vectorEffect="non-scaling-stroke" />
          <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" vectorEffect="non-scaling-stroke" />
        </svg>
        <Icon className="relative size-5 text-slate-500" aria-hidden />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-[13px] text-slate-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
