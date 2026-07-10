"use client";

import { useDraggable } from "@dnd-kit/core";
import { GripVertical, Plus } from "lucide-react";
import { SECTION_CATEGORY_LABELS } from "@/config/labels";
import type { SectionTemplate } from "@/types";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { SectionThumbnail } from "./section-thumbnail";

export const LIBRARY_DRAG_PREFIX = "library:";

/** Draggable library entry. Also insertable via its Add button. */
export function LibraryItem({
  template,
  onAdd,
}: {
  template: SectionTemplate;
  onAdd: (template: SectionTemplate) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${LIBRARY_DRAG_PREFIX}${template.id}`,
    data: { type: "library", templateId: template.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition-colors hover:border-indigo-300",
        isDragging && "opacity-40",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag ${template.name} onto the page`}
        className="flex h-14 w-5 shrink-0 cursor-grab items-center justify-center rounded text-slate-300 hover:text-slate-500 active:cursor-grabbing"
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <SectionThumbnail template={template} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-slate-900">{template.name}</p>
        <p className="truncate text-[11px] text-slate-400">
          {SECTION_CATEGORY_LABELS[template.category]}
          {" · "}
          {template.variations.length}{" "}
          {template.variations.length === 1 ? "variation" : "variations"}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-500">
          {template.description}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        className="shrink-0 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
        aria-label={`Add ${template.name} to the page`}
        onClick={() => onAdd(template)}
      >
        <Plus className="size-4" aria-hidden />
      </Button>
    </div>
  );
}

/** Compact card rendered in the DragOverlay while dragging from the library. */
export function LibraryDragPreview({ template }: { template: SectionTemplate }) {
  return (
    <div className="flex w-64 items-center gap-2.5 rounded-lg border border-indigo-300 bg-white p-2 shadow-lg">
      <SectionThumbnail template={template} />
      <p className="text-xs font-semibold text-slate-900">{template.name}</p>
    </div>
  );
}
