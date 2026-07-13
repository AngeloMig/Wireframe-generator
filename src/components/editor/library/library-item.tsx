"use client";

import { useDraggable } from "@dnd-kit/core";
import { useMemo } from "react";
import { Expand, GripVertical, Plus, Star } from "lucide-react";
import type { SectionVariation } from "@/types";
import { createSectionFromVariation } from "@/lib/sections";
import { DEVICE_WIDTHS } from "@/stores/editor-store";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { WireProvider } from "../wireframes/primitives";
import { SectionRenderer } from "../wireframes/section-renderer";
import { SectionThumbnail } from "./section-thumbnail";

export const LIBRARY_DRAG_PREFIX = "library:";

/** One design variation card: draggable, previewable, addable, favoritable. */
export function LibraryItem({
  variation,
  isFavorite,
  onAdd,
  onPreview,
  onToggleFavorite,
}: {
  variation: SectionVariation;
  isFavorite: boolean;
  onAdd: (variation: SectionVariation) => void;
  onPreview: (variation: SectionVariation) => void;
  onToggleFavorite: (variation: SectionVariation) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${LIBRARY_DRAG_PREFIX}${variation.id}`,
    data: { type: "library", variationId: variation.id },
  });
  const previewSection = useMemo(() => createSectionFromVariation(variation), [variation]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group relative flex flex-col gap-2 rounded-xl border border-[var(--border-default)] bg-white p-2.5 shadow-[var(--shadow-subtle)] transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-[var(--shadow-card)]",
        isDragging && "opacity-40",
      )}
    >
      <div className="relative">
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag ${variation.name} onto the page`}
        className="absolute top-1/2 left-1 z-10 flex size-6 -translate-y-1/2 cursor-grab items-center justify-center rounded-md bg-white/90 text-slate-400 shadow-sm hover:text-[var(--primary)] active:cursor-grabbing"
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <div className="relative flex h-28 w-full items-start justify-center overflow-hidden rounded-lg border border-[#d8dfda] bg-[#eef1ed]">
        <div
          className="absolute top-0 left-1/2 origin-top"
          style={{
            width: DEVICE_WIDTHS.desktop,
            transform: "translateX(-50%) scale(0.245)",
          }}
        >
          <WireProvider
            value={{
              styled: false,
              device: "desktop",
              theme: {
                primary: "#315f53",
                secondary: "#24332e",
                accent: "#e5a65f",
                cardRadius: "rounded-lg",
                buttonRadius: "rounded-lg",
                headingFont: "font-sans",
              },
            }}
          >
            <div className="overflow-hidden bg-white shadow-sm">
              <SectionRenderer section={previewSection} />
            </div>
          </WireProvider>
        </div>
      </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate pr-5 text-[13px] font-bold text-[var(--text-primary)]">{variation.name}</p>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-500">
          {variation.description}
        </p>
        {variation.tags.length > 0 && (
          <p className="mt-1 flex flex-wrap gap-1">
            {variation.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-1.5 py-px text-[10px] text-slate-500"
              >
                {tag}
              </span>
            ))}
          </p>
        )}
        <span className="mt-2 flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 flex-1 px-2 text-[11px]"
            aria-label={`Preview ${variation.name}`}
            onClick={() => onPreview(variation)}
          >
            <Expand className="size-3" aria-hidden />
            Preview
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="h-7 flex-1 px-2 text-[11px]"
            aria-label={`Add ${variation.name} to the page`}
            onClick={() => onAdd(variation)}
          >
            <Plus className="size-3" aria-hidden />
            Add
          </Button>
        </span>
      </div>
      <button
        type="button"
        aria-label={
          isFavorite
            ? `Remove ${variation.name} from favorites`
            : `Add ${variation.name} to favorites`
        }
        aria-pressed={isFavorite}
        onClick={() => onToggleFavorite(variation)}
        className={cn(
          "absolute top-2 right-2 flex size-6 cursor-pointer items-center justify-center rounded transition-colors",
          isFavorite
            ? "text-amber-400 hover:text-amber-500"
            : "text-slate-200 hover:text-slate-400",
        )}
      >
        <Star className={cn("size-4", isFavorite && "fill-amber-400")} aria-hidden />
      </button>
    </div>
  );
}

/** Compact card rendered in the DragOverlay while dragging from the library. */
export function LibraryDragPreview({ variation }: { variation: SectionVariation }) {
  return (
    <div className="flex w-64 items-center gap-2.5 rounded-2xl bg-white/90 p-2 shadow-[0_12px_36px_rgb(0_0_0/0.16)] ring-1 ring-[#f2b90d]/60 backdrop-blur-md">
      <SectionThumbnail variation={variation} />
      <p className="text-xs font-semibold text-slate-900">{variation.name}</p>
    </div>
  );
}
