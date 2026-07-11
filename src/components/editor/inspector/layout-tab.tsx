"use client";

import { useId } from "react";
import { getVariation, variationsOfType } from "@/data/section-variations";
import { switchSectionVariation } from "@/lib/sections";
import { toast } from "@/stores/ui-store";
import type { PageSection, SectionLayoutSettings } from "@/types";
import { cn } from "@/utils/cn";
import { Label } from "@/components/ui/input";
import { SectionThumbnail } from "../library/section-thumbnail";
import type { SectionMutator } from "./inspector-types";

/** Design variation, alignment, columns, widths, visibility, mobile behaviour. */
export function LayoutTab({
  section,
  onChange,
}: {
  section: PageSection;
  onChange: SectionMutator;
}) {
  const variationId = useId();
  const designs = variationsOfType(section.sectionType).filter(
    (v) => v.isActive || v.id === section.variationId,
  );
  const current = getVariation(section.variationId);

  const setLayout = (patch: Partial<SectionLayoutSettings>) =>
    onChange((s) => ({ ...s, layout: { ...s.layout, ...patch } }));

  const handleSwitch = (targetId: string) => {
    const target = designs.find((v) => v.id === targetId);
    if (!target || target.id === section.variationId) return;
    // Content is preserved whole (shared schema per type); the new design's
    // default layout applies and customised style settings carry over. Runs
    // through applySections, so it lands in undo history and autosaves.
    onChange((s) => switchSectionVariation(s, target));
    toast("Design changed", "success", `Now using “${target.name}”. Your content was kept.`);
  };

  return (
    <div className="space-y-4 p-4">
      {designs.length > 1 && (
        <div>
          <Label htmlFor={variationId} className="mb-1.5 text-xs">
            Design
          </Label>
          <div id={variationId} role="radiogroup" aria-label="Design" className="grid grid-cols-2 gap-2">
            {designs.map((variation) => {
              const isCurrent = variation.id === section.variationId;
              return (
                <button
                  key={variation.id}
                  type="button"
                  role="radio"
                  aria-checked={isCurrent}
                  onClick={() => handleSwitch(variation.id)}
                  className={cn(
                    "flex cursor-pointer flex-col gap-1.5 rounded-lg border p-1.5 text-left transition-colors",
                    isCurrent
                      ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
                      : "border-slate-200 bg-white hover:border-slate-300",
                  )}
                >
                  <SectionThumbnail variation={variation} className="w-full" />
                  <span
                    className={cn(
                      "truncate text-[11px] font-medium",
                      isCurrent ? "text-indigo-900" : "text-slate-600",
                    )}
                  >
                    {variation.name}
                  </span>
                </button>
              );
            })}
          </div>
          {current && (
            <p className="mt-1.5 text-[11px] text-slate-400">
              Switching designs keeps your content — only the layout changes.
            </p>
          )}
        </div>
      )}

      <SegmentedControl
        label="Content alignment"
        value={section.layout.alignment}
        options={[
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
          { value: "right", label: "Right" },
        ]}
        onChange={(alignment) => setLayout({ alignment: alignment as SectionLayoutSettings["alignment"] })}
      />

      <SegmentedControl
        label="Image position"
        value={section.layout.imagePosition}
        options={[
          { value: "left", label: "Left" },
          { value: "right", label: "Right" },
          { value: "top", label: "Top" },
          { value: "background", label: "Bg" },
          { value: "none", label: "None" },
        ]}
        onChange={(position) =>
          setLayout({ imagePosition: position as SectionLayoutSettings["imagePosition"] })
        }
      />

      <SegmentedControl
        label="Columns"
        value={String(section.layout.columns)}
        options={[1, 2, 3, 4].map((n) => ({ value: String(n), label: String(n) }))}
        onChange={(columns) => setLayout({ columns: Number(columns) })}
      />

      <SegmentedControl
        label="Content width"
        value={section.layout.contentWidth}
        options={[
          { value: "narrow", label: "Narrow" },
          { value: "normal", label: "Normal" },
          { value: "wide", label: "Wide" },
          { value: "full", label: "Full" },
        ]}
        onChange={(width) =>
          setLayout({ contentWidth: width as SectionLayoutSettings["contentWidth"] })
        }
      />

      <SegmentedControl
        label="Items shown"
        value={String(section.layout.itemCount)}
        options={[
          { value: "0", label: "All" },
          ...[2, 3, 4, 6, 8].map((n) => ({ value: String(n), label: String(n) })),
        ]}
        onChange={(count) => setLayout({ itemCount: Number(count) })}
      />

      <SegmentedControl
        label="Mobile stacking order"
        value={section.layout.mobileStacking}
        options={[
          { value: "default", label: "Content first" },
          { value: "reverse", label: "Image first" },
        ]}
        onChange={(stacking) =>
          setLayout({ mobileStacking: stacking as SectionLayoutSettings["mobileStacking"] })
        }
      />

      <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-700">
        <input
          type="checkbox"
          checked={!section.isHidden}
          onChange={(e) => onChange((s) => ({ ...s, isHidden: !e.target.checked }))}
          className="size-4 rounded border-slate-300 accent-indigo-600"
        />
        Section is visible on the page
      </label>
    </div>
  );
}

export function SegmentedControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-slate-700">{label}</p>
      <div
        role="group"
        aria-label={label}
        className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex-1 cursor-pointer rounded-md px-1.5 py-1 text-[11px] font-medium transition-colors",
              value === option.value
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
