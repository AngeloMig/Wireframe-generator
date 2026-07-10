"use client";

import { useEffect, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { MousePointerClick } from "lucide-react";
import { getSectionTemplate } from "@/data/section-templates";
import type { BrandTheme } from "@/lib/editor-utils";
import { DEVICE_WIDTHS, useEditorStore } from "@/stores/editor-store";
import type { PageSection } from "@/types";
import { cn } from "@/utils/cn";
import { WireProvider } from "../wireframes/primitives";
import { CanvasSection, type CanvasSectionActions, type DropEdge } from "./canvas-section";

export const CANVAS_APPEND_ID = "canvas-append";

export interface DropTarget {
  sectionId: string | null; // null = append at the end
  edge: Exclude<DropEdge, null>;
}

/** Center panel: the page rendered as a scaled, device-width wireframe. */
export function EditorCanvas({
  sections,
  theme,
  dropTarget,
  isLibraryDragging,
  actions,
}: {
  sections: PageSection[];
  theme: BrandTheme;
  dropTarget: DropTarget | null;
  isLibraryDragging: boolean;
  actions: CanvasSectionActions;
}) {
  const device = useEditorStore((s) => s.device);
  const mode = useEditorStore((s) => s.mode);
  const zoom = useEditorStore((s) => s.zoom);
  const isPreview = useEditorStore((s) => s.isPreview);
  const selectedSectionId = useEditorStore((s) => s.selectedSectionId);
  const collapsedIds = useEditorStore((s) => s.collapsedIds);
  const select = useEditorStore((s) => s.select);
  const setFitZoom = useEditorStore((s) => s.setFitZoom);

  const scrollRef = useRef<HTMLDivElement>(null);
  const deviceWidth = DEVICE_WIDTHS[device];

  // Keep the "fit" zoom level in sync with the available canvas width.
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const measure = () => {
      const available = node.clientWidth - 64;
      setFitZoom(Math.min(1.3, Math.max(0.4, available / deviceWidth)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [deviceWidth, setFitZoom]);

  const { setNodeRef: setAppendRef, isOver: isOverAppend } = useDroppable({
    id: CANVAS_APPEND_ID,
    data: { type: "append" },
  });

  const ordered = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div
      ref={scrollRef}
      className="h-full flex-1 overflow-auto bg-slate-100 p-8"
      onClick={() => select(null)}
    >
      <div
        className="mx-auto"
        style={{ width: deviceWidth * zoom, minHeight: "100%" }}
      >
        <div
          style={{
            width: deviceWidth,
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
          }}
        >
          <WireProvider value={{ styled: mode === "styled", theme, device }}>
            <div
              className={cn(
                "overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-slate-200",
                device !== "desktop" && "rounded-xl",
              )}
            >
              {ordered.length === 0 ? (
                <EmptyCanvas isLibraryDragging={isLibraryDragging} />
              ) : (
                <SortableContext
                  items={ordered.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {ordered.map((section, index) => {
                    const template = getSectionTemplate(section.templateId);
                    if (!template) return null;
                    return (
                      <CanvasSection
                        key={section.id}
                        section={section}
                        template={template}
                        index={index}
                        total={ordered.length}
                        isSelected={!isPreview && selectedSectionId === section.id}
                        isCollapsed={collapsedIds.includes(section.id)}
                        dropEdge={
                          dropTarget?.sectionId === section.id ? dropTarget.edge : null
                        }
                        readOnly={isPreview}
                        actions={actions}
                      />
                    );
                  })}
                </SortableContext>
              )}

              {/* Append zone: drop here to add a section at the end. */}
              {!isPreview && ordered.length > 0 && (
                <div
                  ref={setAppendRef}
                  className={cn(
                    "flex h-20 items-center justify-center border-t border-dashed border-slate-200 text-xs text-slate-400 transition-colors",
                    isLibraryDragging && "border-indigo-300 bg-indigo-50/60 text-indigo-500",
                    isOverAppend && "border-indigo-500 bg-indigo-50",
                  )}
                >
                  {isLibraryDragging
                    ? "Drop here to add at the end"
                    : "Drag sections here from the library"}
                </div>
              )}
            </div>
          </WireProvider>
        </div>
      </div>
    </div>
  );
}

function EmptyCanvas({ isLibraryDragging }: { isLibraryDragging: boolean }) {
  const { setNodeRef, isOver } = useDroppable({
    id: CANVAS_APPEND_ID,
    data: { type: "append" },
  });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-96 flex-col items-center justify-center gap-3 p-10 text-center transition-colors",
        isLibraryDragging && "bg-indigo-50/60",
        isOver && "bg-indigo-50",
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-slate-100">
        <MousePointerClick className="size-6 text-slate-400" aria-hidden />
      </div>
      <p className="text-sm font-semibold text-slate-700">This page is empty</p>
      <p className="max-w-60 text-xs text-slate-500">
        Drag a section from the library on the left, or click a section&apos;s + button to
        add it here.
      </p>
    </div>
  );
}
