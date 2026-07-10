"use client";

import { VISUAL_STYLE_OPTIONS } from "@/config/options";
import type { VisualStyle } from "@/types";
import { cn } from "@/utils/cn";
import { SelectableCard } from "@/components/ui/selectable-card";

const MAX_STYLES = 3;

/** Small abstract preview drawn with simple shapes for each style. */
function StylePreview({ style }: { style: VisualStyle }) {
  const base = "pointer-events-none mb-3 flex h-16 w-full items-center justify-center gap-1.5 overflow-hidden rounded-lg";
  switch (style) {
    case "minimal":
      return (
        <div className={cn(base, "flex-col bg-slate-50")}>
          <div className="h-1 w-12 rounded bg-slate-300" />
          <div className="h-1 w-20 rounded bg-slate-200" />
        </div>
      );
    case "modern":
      return (
        <div className={cn(base, "bg-slate-100")}>
          <div className="h-8 w-8 rounded-lg bg-indigo-400" />
          <div className="flex flex-col gap-1">
            <div className="h-1.5 w-14 rounded bg-slate-400" />
            <div className="h-1.5 w-10 rounded bg-slate-300" />
          </div>
        </div>
      );
    case "editorial":
      return (
        <div className={cn(base, "flex-col items-start bg-amber-50/60 px-4")}>
          <div className="h-2.5 w-16 rounded-sm bg-slate-700" />
          <div className="mt-1.5 h-1 w-24 rounded bg-slate-400" />
          <div className="mt-1 h-1 w-20 rounded bg-slate-300" />
        </div>
      );
    case "premium":
      return (
        <div className={cn(base, "bg-slate-900")}>
          <div className="h-1.5 w-16 rounded bg-amber-300/80" />
        </div>
      );
    case "playful":
      return (
        <div className={cn(base, "bg-rose-50")}>
          <div className="size-5 rounded-full bg-rose-300" />
          <div className="size-7 rounded-full bg-amber-300" />
          <div className="size-4 rounded-full bg-sky-300" />
        </div>
      );
    case "corporate":
      return (
        <div className={cn(base, "bg-blue-50")}>
          <div className="h-9 w-6 rounded-sm bg-blue-300" />
          <div className="h-9 w-6 rounded-sm bg-blue-400" />
          <div className="h-9 w-6 rounded-sm bg-blue-500" />
        </div>
      );
    case "bold":
      return (
        <div className={cn(base, "bg-slate-900")}>
          <div className="h-5 w-24 -rotate-2 rounded-sm bg-yellow-300" />
        </div>
      );
    case "elegant":
      return (
        <div className={cn(base, "flex-col bg-stone-50")}>
          <div className="h-px w-16 bg-stone-400" />
          <div className="my-1.5 h-2 w-20 rounded-sm bg-stone-500" />
          <div className="h-px w-16 bg-stone-400" />
        </div>
      );
    case "technical":
      return (
        <div className={cn(base, "bg-slate-800")}>
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-2.5 w-6 rounded-sm bg-emerald-400/70" />
            ))}
          </div>
        </div>
      );
    case "luxury":
      return (
        <div className={cn(base, "bg-gradient-to-r from-slate-900 to-slate-800")}>
          <div className="size-8 rotate-45 border border-amber-300/80" />
        </div>
      );
    case "organic":
      return (
        <div className={cn(base, "bg-emerald-50")}>
          <div className="h-8 w-10 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-emerald-300" />
          <div className="h-6 w-8 rounded-[60%_40%_50%_50%/50%_60%_40%_50%] bg-lime-300" />
        </div>
      );
    case "ecommerce":
      return (
        <div className={cn(base, "bg-slate-50 px-3")}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-1 flex-col gap-1">
              <div className="h-7 rounded bg-slate-200" />
              <div className="h-1 w-3/4 rounded bg-slate-300" />
            </div>
          ))}
        </div>
      );
  }
}

export function StepStyles({
  selected,
  onChange,
}: {
  selected: VisualStyle[];
  onChange: (styles: VisualStyle[]) => void;
}) {
  const toggle = (style: VisualStyle) => {
    if (selected.includes(style)) {
      onChange(selected.filter((s) => s !== style));
    } else if (selected.length < MAX_STYLES) {
      onChange([...selected, style]);
    }
  };

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500" id="styles-hint">
        Choose up to {MAX_STYLES} styles that feel right for your brand.{" "}
        <span className="font-medium text-slate-700">{selected.length}/{MAX_STYLES} selected</span>
      </p>
      <div
        role="group"
        aria-labelledby="styles-hint"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {VISUAL_STYLE_OPTIONS.map((style) => (
          <SelectableCard
            key={style.value}
            selected={selected.includes(style.value)}
            onToggle={() => toggle(style.value)}
            title={style.label}
            description={style.description}
            disabled={!selected.includes(style.value) && selected.length >= MAX_STYLES}
          >
            <StylePreview style={style.value} />
          </SelectableCard>
        ))}
      </div>
    </div>
  );
}
