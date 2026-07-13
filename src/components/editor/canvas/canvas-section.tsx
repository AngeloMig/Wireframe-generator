"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  ChevronsDownUp,
  ChevronsUpDown,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Lock,
  LockOpen,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { useMemo } from "react";
import type { CommentPriority, PageSection } from "@/types";
import { cn } from "@/utils/cn";
import { InlineEditProvider, type InlineEditContextValue } from "../wireframes/primitives";
import { SectionRenderer } from "../wireframes/section-renderer";
import { DesignSwapButton } from "./design-swap-button";

export interface CanvasSectionActions {
  onSelect: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleHidden: (id: string) => void;
  onToggleLocked: (id: string) => void;
  onToggleCollapsed: (id: string) => void;
  onDelete: (id: string) => void;
  /** Inline canvas text edit: set content at a dot-path. */
  onInlineEdit: (id: string, path: string, value: string) => void;
  /** Swap to another design variation, keeping content. */
  onSwapDesign: (id: string, variationId: string) => void;
}

export type DropEdge = "top" | "bottom" | null;

/** Aggregate of a section's comments for the comment-mode marker. */
export interface SectionCommentMarker {
  /** 1-based marker number, in page order. */
  number: number;
  openCount: number;
  resolvedCount: number;
  replyCount: number;
  topPriority: CommentPriority;
}

/** One section on the canvas: selectable, sortable, with a floating toolbar. */
export function CanvasSection({
  section,
  name,
  index,
  total,
  isSelected,
  isCollapsed,
  dropEdge,
  canEditContent,
  canEditStructure,
  actions,
  commentMode = false,
  marker = null,
  onMarkerSelect,
  onContextComment,
}: {
  section: PageSection;
  /** Display name of the section's design (for labels and the toolbar). */
  name: string;
  index: number;
  total: number;
  isSelected: boolean;
  isCollapsed: boolean;
  /** Shows the insertion indicator while a library item hovers this section. */
  dropEdge: DropEdge;
  /** May edit the words/images in place. */
  canEditContent: boolean;
  /** May reorder, duplicate, delete, hide, lock, or swap the section. */
  canEditStructure: boolean;
  actions: CanvasSectionActions;
  /** Comment mode: clicking targets the section with a composer instead of editing. */
  commentMode?: boolean;
  marker?: SectionCommentMarker | null;
  onMarkerSelect?: (sectionId: string) => void;
  /** Right-click anywhere on the section: start a comment there. */
  onContextComment?: (sectionId: string, x: number, y: number) => void;
}) {
  const approvalLocked = Boolean(section.approvalLocked);
  // Nav and footer are pinned to the page's top/bottom: they render in place
  // and never drag (the store also re-normalizes order on every write).
  const pinned = section.sectionType === "navigation" || section.sectionType === "footer";
  // Any hands-on interaction (selecting, focusing) is possible if the user can
  // do either kind of edit; the two capabilities then gate what they can do.
  const interactive = canEditContent || canEditStructure;

  // Inline text editing is available exactly when the section itself is
  // editable; locked/approved sections and comment mode stay hands-off.
  const inlineEdit = useMemo<InlineEditContextValue | null>(
    () =>
      !canEditContent || commentMode || section.isLocked || approvalLocked
        ? null
        : { onEdit: (path, value) => actions.onInlineEdit(section.id, path, value) },
    [canEditContent, commentMode, section.isLocked, approvalLocked, section.id, actions],
  );

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    data: { type: "section" },
    disabled: !canEditStructure || pinned || section.isLocked || approvalLocked || commentMode,
  });

  const toolbarButton =
    "flex size-7 cursor-pointer items-center justify-center rounded-[10px] text-slate-500 transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-black/[0.05] hover:text-slate-800 active:scale-[0.92] disabled:cursor-not-allowed disabled:opacity-30";

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
            "absolute right-0 left-0 z-30 h-1 rounded-full bg-[#f2b90d]",
            dropEdge === "top" ? "-top-1.5" : "-bottom-1.5",
          )}
        />
      )}

      {/* Selection / hover outline + click-to-select layer */}
      <div
        role="button"
        tabIndex={0}
        aria-label={
          commentMode
            ? `Comment on the ${name} section`
            : `${name} section${section.isHidden ? " (hidden)" : ""}${section.isLocked ? " (locked)" : ""}${approvalLocked ? " (approved and locked)" : ""}`
        }
      aria-pressed={isSelected}
      onPointerDownCapture={() => {
        // Select before child controls/contentEditable elements can consume
        // the click, so the contextual inspector always follows the canvas.
        if (!commentMode) actions.onSelect(section.id);
      }}
      onClick={(e) => {
          e.stopPropagation();
          // Comment placement is intentionally right-click only. A normal
          // click keeps the canvas calm while the user scans existing pins.
          if (commentMode) return;
          else if (interactive) actions.onSelect(section.id);
        }}
        onContextMenu={(e) => {
          if (!onContextComment) return;
          e.preventDefault();
          e.stopPropagation();
          onContextComment(section.id, e.clientX, e.clientY);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            if (commentMode) {
              // Use the context menu to place an exact comment pin.
              return;
            } else if (interactive) {
              e.preventDefault();
              actions.onSelect(section.id);
            }
          }
        }}
        data-canvas-section={section.id}
        className={cn(
          "group relative cursor-pointer outline-none",
          (interactive || commentMode) && "focus-visible:ring-2 focus-visible:ring-[#eab308]",
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-10 border-2 transition-colors",
            commentMode
              ? isSelected
                ? "border-amber-500"
                : "border-transparent group-hover:border-amber-400/80"
              : isSelected
                ? "border-[#f2b90d]"
                : "border-transparent group-hover:border-[#f5c000]/50",
          )}
          aria-hidden
        />

        {/* Comment marker */}
        {commentMode && marker && (
          <button
            type="button"
            aria-label={`Comments on ${name}: ${marker.openCount} open, ${marker.resolvedCount} resolved${marker.replyCount ? `, ${marker.replyCount} replies` : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onMarkerSelect?.(section.id);
            }}
            className={cn(
              "absolute top-2 left-2 z-30 flex h-7 min-w-7 cursor-pointer items-center justify-center gap-1 rounded-full px-1.5 text-xs font-bold text-white shadow-md transition-transform hover:scale-110",
              marker.openCount === 0
                ? "bg-emerald-500"
                : marker.topPriority === "urgent" || marker.topPriority === "high"
                  ? "bg-rose-500"
                  : "bg-amber-500",
            )}
          >
            {marker.number}
            {marker.replyCount > 0 && (
              <span className="flex items-center text-[9px] font-semibold">
                <MessageSquare className="mr-0.5 size-2.5" aria-hidden />
                {marker.replyCount}
              </span>
            )}
          </button>
        )}

        {/* Drag handle — pinned nav/footer sections don't get one. */}
        {canEditStructure && !pinned && !commentMode && !section.isLocked && !approvalLocked && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${name}. Use the toolbar arrows for keyboard reordering.`}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "absolute top-2 left-2 z-20 flex size-8 cursor-grab items-center justify-center rounded-xl bg-white/90 text-slate-500 shadow-[0_2px_10px_rgb(0_0_0/0.12)] ring-1 ring-black/[0.06] backdrop-blur-sm transition-opacity active:cursor-grabbing",
              isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
        )}

        {/* Status chips */}
        {(section.isHidden || section.isLocked || approvalLocked || section.reviewStatus === "approved") && (
          <div className="absolute top-2 right-2 z-20 flex gap-1">
            {section.isHidden && (
              <span className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                Hidden
              </span>
            )}
            {section.isLocked && !approvalLocked && (
              <span className="rounded bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                Locked
              </span>
            )}
            {(approvalLocked || section.reviewStatus === "approved") && (
              <span className="flex items-center gap-1 rounded bg-emerald-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                <BadgeCheck className="size-3" aria-hidden />
                Approved
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
                {name} (collapsed)
              </span>
            </div>
          ) : (
            <InlineEditProvider value={inlineEdit}>
              <SectionRenderer section={section} />
            </InlineEditProvider>
          )}
        </div>
      </div>

      {/* Floating toolbar */}
      {isSelected && canEditStructure && !commentMode && (
        <div
          className={cn(
            "absolute right-3 z-30 flex items-center gap-0.5 rounded-2xl bg-white/85 p-1 shadow-[inset_0_1px_0_rgb(255_255_255/0.6),0_10px_30px_rgb(0_0_0/0.14)] ring-1 ring-black/[0.06] backdrop-blur-md",
            // The page wrapper clips overflowing children to its rounded
            // corners, so the FIRST section's toolbar must sit inside the
            // page instead of hanging above it (it was getting cut off).
            index === 0 ? "top-2" : "-top-5",
          )}
          role="toolbar"
          aria-label={`${name} actions`}
        >
          <span className="max-w-36 truncate px-2 text-[11px] font-semibold text-slate-600">
            {name}
          </span>
          {approvalLocked ? (
            <span className="px-2 text-[11px] text-emerald-700">
              Approved — unlock to edit
            </span>
          ) : (
            <>
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
              <DesignSwapButton
                section={section}
                onSwap={(variationId) => actions.onSwapDesign(section.id, variationId)}
                buttonClass={toolbarButton}
              />
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
