import { cn } from "@/utils/cn";

export function ProgressBar({
  value,
  className,
  label,
}: {
  value: number;
  className?: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Completion"}
      className={cn("h-1 w-full overflow-hidden rounded-full bg-slate-200", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-300",
          clamped >= 100 ? "bg-emerald-600" : "bg-slate-900",
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
