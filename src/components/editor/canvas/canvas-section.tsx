"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  ChevronsDownUp,
  ChevronsUpDown,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Lock,
  LockOpen,
  Trash2,
} from "lucide-react";
import type { PageSection, SectionTemplate } from "@/types";
import { cn } from "@/utils/cn";
import { SectionWireframe } from "../wireframes/section-wireframe";

export interface CanvasSectionActions {
  onSelect: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleHidden: (id: string) => void;
  onToggleLocked: (id: string) => void;
  onToggleCollapsed: (id: string) => void;
  onDelete: (id: string) => void;
}

export type DropEdge = "top" | "bottom" | null;

/** One section on the canvas: selectable, sortable, with a floating toolbar. */
export function CanvasSection({
  section,
  template,
  index,
  total,
  isSelected,
  isCollapsed,
  dropEdge,
  readOnly,
  actions,
}: {
  section: PageSection;
  template: SectionTemplate;
  index: number;
  total: number;
  isSelected: boolean;
  isCollapsed: boolean;
  /** Shows the insertion indicator while a library item hovers this section. */
  dropEdge: DropEdge;
  readOnly: boolean;
  actions: CanvasSectionActions;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    data: { type: "section" },
    disabled: readOnly || section.isLocked,
  });

  const toolbarButton =
    "flex size-7 cursor-pointer items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative", isDragging && "z-20 opacity-40")}
    >
      {/* Drop indicator for library inserts */}
      {dropEdge && (
        <div
          aria-hidden
          className={cn(
            "absolute right-0 left-0 z-30 h-1 rounded-full bg-indigo-500",
            dropEdge === "top" ? "-top-1.5" : "-bottom-1.5",
          )}
        />
      )}

      {/* Selection / hover outline + click-to-select layer */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`${template.name} section${section.isHidden ? " (hidden)" : ""}${section.isLocked ? " (locked)" : ""}`}
        aria-pressed={isSelected}
        onClick={(e) => {
          e.stopPropagation();
          if (!readOnly) actions.onSelect(section.id);
        }}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !readOnly) {
            e.preventDefault();
            actions.onSelect(section.id);
          }
        }}
        className={cn(
          "group relative cursor-pointer outline-none",
          !readOnly && "focus-visible:ring-2 focus-visible:ring-indigo-400",
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-10 border-2 transition-colors",
            isSelected
              ? "border-indigo-500"
              : "border-transparent group-hover:border-indigo-300/70",
          )}
          aria-hidden
        />

        {/* Drag handle */}
        {!readOnly && !section.isLocked && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${template.name}. Use the toolbar arrows for keyboard reordering.`}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "absolute top-2 left-2 z-20 flex size-7 cursor-grab items-center justify-center rounded bg-white/95 text-slate-400 shadow-sm transition-opacity active:cursor-grabbing",
              isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
        )}

        {/* Status chips */}
        {(section.isHidden || section.isLocked) && (
          <div className="absolute top-2 right-2 z-20 flex gap-1">
            {section.isHidden && (
              <span className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                Hidden
              </span>
            )}
            {section.isLocked && (
              <span className="rounded bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                Locked
              </span>
            )}
          </div>
        )}

        {/* The wireframe itself */}
        <div className={cn(section.isHidden && "opacity-40")}>
          {isCollapsed ? (
            <div className="flex items-center gap-2 border-y border-dashed border-slate-300 bg-slate-50 px-10 py-3">
              <ChevronsUpDown className="size-3.5 text-slate-400" aria-hidden />
              <span className="text-xs font-medium text-slate-500">
                {template.name} (collapsed)
              </span>
            </div>
          ) : (
            <SectionWireframe section={section} template={template} />
          )}
        </div>
      </div>

      {/* Floating toolbar */}
      {isSelected && !readOnly && (
        <div
          className="absolute -top-4 right-3 z-30 flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 shadow-md"
          role="toolbar"
          aria-label={`${template.name} actions`}
        >
          <span className="max-w-36 truncate px-2 text-[11px] font-semibold text-slate-600">
            {template.name}
          </span>
          <button
            type="button"
            className={toolbarButton}
            disabled={index === 0}
            aria-label="Move section up"
            onClick={() => actions.onMoveUp(section.id)}
          >
            <ArrowUp className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            className={toolbarButton}
            disabled={index === total - 1}
            aria-label="Move section down"
            onClick={() => actions.onMoveDown(section.id)}
          >
            <ArrowDown className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            className={toolbarButton}
            aria-label="Duplicate section"
            onClick={() => actions.onDuplicate(section.id)}
          >
            <Copy className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            className={toolbarButton}
            aria-label={section.isHidden ? "Show section" : "Hide section"}
            onClick={() => actions.onToggleHidden(section.id)}
          >
            {section.isHidden ? (
              <EyeOff className="size-3.5" aria-hidden />
            ) : (
              <Eye className="size-3.5" aria-hidden />
            )}
          </button>
          <button
            type="button"
            className={toolbarButton}
            aria-label={section.isLocked ? "Unlock section" : "Lock section"}
            onClick={() => actions.onToggleLocked(section.id)}
          >
            {section.isLocked ? (
              <Lock className="size-3.5" aria-hidden />
            ) : (
              <LockOpen className="size-3.5" aria-hidden />
            )}
          </button>
          <button
            type="button"
            className={toolbarButton}
            aria-label={isCollapsed ? "Expand section" : "Collapse section"}
            onClick={() => actions.onToggleCollapsed(section.id)}
          >
            <ChevronsDownUp className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            className={cn(toolbarButton, "text-rose-500 hover:bg-rose-50 hover:text-rose-600")}
            aria-label="Delete section"
            onClick={() => actions.onDelete(section.id)}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
