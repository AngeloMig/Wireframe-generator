"use client";

import { useDraggable } from "@dnd-kit/core";
import { Expand, GripVertical, Plus, Star } from "lucide-react";
import type { SectionVariation } from "@/types";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
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

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group relative flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition-colors hover:border-indigo-300",
        isDragging && "opacity-40",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag ${variation.name} onto the page`}
        className="flex h-14 w-5 shrink-0 cursor-grab items-center justify-center rounded text-slate-300 hover:text-slate-500 active:cursor-grabbing"
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <SectionThumbnail variation={variation} />
      <div className="min-w-0 flex-1">
        <p className="truncate pr-5 text-xs font-semibold text-slate-900">{variation.name}</p>
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
        <span className="mt-1.5 flex gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[11px]"
            aria-label={`Preview ${variation.name}`}
            onClick={() => onPreview(variation)}
          >
            <Expand className="size-3" aria-hidden />
            Preview
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="h-6 px-2 text-[11px]"
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
    <div className="flex w-64 items-center gap-2.5 rounded-lg border border-indigo-300 bg-white p-2 shadow-lg">
      <SectionThumbnail variation={variation} />
      <p className="text-xs font-semibold text-slate-900">{variation.name}</p>
    </div>
  );
}
