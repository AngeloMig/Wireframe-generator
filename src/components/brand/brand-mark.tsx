import { cn } from "@/utils/cn";

/** Original Blueprint Builder mark: two linked drafting paths forming a B. */
export function BrandMark({ className, inverse = false }: { className?: string; inverse?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-[10px]",
        inverse ? "bg-white text-[var(--info)]" : "bg-[#dff0fb] text-[var(--info)]",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 5v14" />
        <path d="M7 5h5.4a3.2 3.2 0 0 1 0 6.4H7" />
        <path d="M7 11.4h6.3a3.6 3.6 0 0 1 0 7.2H7" />
        <path d="M16.8 5.8 18.7 4" />
      </svg>
    </span>
  );
}
