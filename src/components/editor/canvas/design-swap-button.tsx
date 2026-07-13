"use client";

import { useEffect, useRef, useState } from "react";
import { Shuffle } from "lucide-react";
import { variationsOfType } from "@/data/section-variations";
import type { PageSection } from "@/types";
import { cn } from "@/utils/cn";
import { SectionThumbnail } from "../library/section-thumbnail";

/**
 * "Change design" right in the section's floating toolbar: a popover with
 * the same thumbnail grid as the inspector's Design tab, one click to swap.
 */
export function DesignSwapButton({
  section,
  onSwap,
  buttonClass,
}: {
  section: PageSection;
  onSwap: (variationId: string) => void;
  buttonClass: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const designs = variationsOfType(section.sectionType).filter(
    (v) => v.isActive || v.id === section.variationId,
  );
  if (designs.length < 2) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className={buttonClass}
        aria-label="Change design"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <Shuffle className="size-3.5" aria-hidden />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Change design"
          className="absolute top-8 right-0 z-40 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-[var(--shadow-panel)]"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="px-1 pb-1.5 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
            Change design
          </p>
          <div className="grid max-h-72 grid-cols-2 gap-1.5 overflow-y-auto">
            {designs.map((variation) => {
              const isCurrent = variation.id === section.variationId;
              return (
                <button
                  key={variation.id}
                  type="button"
                  aria-pressed={isCurrent}
                  onClick={() => {
                    if (!isCurrent) onSwap(variation.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex cursor-pointer flex-col gap-1 rounded-lg border p-1.5 text-left transition-colors",
                    isCurrent
                      ? "border-[#f2b90d] bg-[#f7d34e]/20 ring-1 ring-[#f2b90d]"
                      : "border-slate-200 bg-white hover:border-slate-300",
                  )}
                >
                  <SectionThumbnail variation={variation} className="w-full" />
                  <span
                    className={cn(
                      "truncate text-[11px] font-medium",
                      isCurrent ? "text-[#5c4600]" : "text-slate-600",
                    )}
                  >
                    {variation.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
