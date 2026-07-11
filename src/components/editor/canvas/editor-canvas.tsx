"use client";

import { useEffect, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { MousePointerClick } from "lucide-react";
import { getVariation } from "@/data/section-variations";
import { getSectionTypeDefinition } from "@/data/section-schemas";
import type { BrandTheme } from "@/lib/editor-utils";
import { DEVICE_WIDTHS, useEditorStore } from "@/stores/editor-store";
import type { PageSection } from "@/types";
import { cn } from "@/utils/cn";
import { WireProvider } from "../wireframes/primitives";
import {
  CanvasSection,
  type CanvasSectionActions,
  type DropEdge,
  type SectionCommentMarker,
} from "./canvas-section";

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
  readOnly = false,
  commentMode = false,
  markers,
  onCommentTarget,
  onMarkerSelect,
  onInsertStarter,
}: {
  sections: PageSection[];
  theme: BrandTheme;
  dropTarget: DropTarget | null;
  isLibraryDragging: boolean;
  actions: CanvasSectionActions;
  /** Extra read-only state on top of preview mode (status restrictions). */
  readOnly?: boolean;
  commentMode?: boolean;
  markers?: Map<string, SectionCommentMarker>;
  onCommentTarget?: (sectionId: string) => void;
  onMarkerSelect?: (sectionId: string) => void;
  /** One-click starter layouts offered on an empty page. */
  onInsertStarter?: (variationIds: string[]) => void;
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

  // Figma/Shopify-style zoom: Ctrl/Cmd + scroll. Native listener because the
  // browser's wheel events are passive by default and we must preventDefault
  // to stop the page from pinch-zooming.
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const { zoom: current, setZoom } = useEditorStore.getState();
      const factor = event.deltaY < 0 ? 1.06 : 1 / 1.06;
      setZoom(current * factor);
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);

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
                "overflow-hidden rounded-lg bg-white shadow-[var(--shadow-card)] ring-1 ring-slate-200",
                device !== "desktop" && "rounded-xl",
              )}
            >
              {ordered.length === 0 ? (
                <EmptyCanvas
                  isLibraryDragging={isLibraryDragging}
                  onInsertStarter={!readOnly && !commentMode ? onInsertStarter : undefined}
                />
              ) : (
                <SortableContext
                  items={ordered.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {ordered.map((section, index) => {
                    const variation = getVariation(section.variationId);
                    const name =
                      variation?.name ?? getSectionTypeDefinition(section.sectionType).label;
                    return (
                      <CanvasSection
                        key={section.id}
                        section={section}
                        name={name}
                        index={index}
                        total={ordered.length}
                        isSelected={!isPreview && selectedSectionId === section.id}
                        isCollapsed={collapsedIds.includes(section.id)}
                        dropEdge={
                          dropTarget?.sectionId === section.id ? dropTarget.edge : null
                        }
                        readOnly={isPreview || readOnly}
                        actions={actions}
                        commentMode={commentMode}
                        marker={markers?.get(section.id) ?? null}
                        onCommentTarget={onCommentTarget}
                        onMarkerSelect={onMarkerSelect}
                      />
                    );
                  })}
                </SortableContext>
              )}

              {/* Append zone: drop here to add a section at the end. */}
              {!isPreview && !readOnly && !commentMode && ordered.length > 0 && (
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

/** One-click layout bundles for an empty page. */
const PAGE_STARTERS: { id: string; name: string; description: string; variationIds: string[] }[] = [
  {
    id: "presence",
    name: "Simple presence",
    description: "Hero, introduction, services, and a call to action.",
    variationIds: [
      "nav-standard",
      "hero-centered",
      "content-intro",
      "svc-icon-cards",
      "testi-cards",
      "cta-centered",
      "footer-columns",
    ],
  },
  {
    id: "leadgen",
    name: "Lead generation",
    description: "Form-first hero, social proof, FAQ, and contact.",
    variationIds: [
      "nav-cta",
      "hero-form",
      "hero-logos",
      "testi-review-summary",
      "faq-accordion",
      "cta-contact-form",
      "footer-contact",
    ],
  },
  {
    id: "ecommerce",
    name: "Ecommerce home",
    description: "Collections, featured products, benefits, newsletter.",
    variationIds: [
      "nav-ecommerce",
      "hero-promo",
      "ecom-collections",
      "ecom-featured",
      "ecom-benefits",
      "cta-newsletter",
      "footer-columns",
    ],
  },
];

function EmptyCanvas({
  isLibraryDragging,
  onInsertStarter,
}: {
  isLibraryDragging: boolean;
  onInsertStarter?: (variationIds: string[]) => void;
}) {
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
        {onInsertStarter
          ? "Start from a ready-made layout, or add sections one at a time."
          : "Drag a section from the library on the left, or click a section's + button to add it here."}
      </p>
      {onInsertStarter && (
        <div className="mt-2 grid w-full max-w-xl gap-2.5 sm:grid-cols-3">
          {PAGE_STARTERS.map((starter) => (
            <button
              key={starter.id}
              type="button"
              onClick={() => onInsertStarter(starter.variationIds)}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 text-left transition-colors hover:border-[var(--primary,#4f46e5)]"
            >
              {/* Miniature layout sketch */}
              <span aria-hidden className="mb-2.5 block space-y-1">
                <span className="block h-1.5 rounded-sm bg-slate-200" />
                <span className="block h-5 rounded-sm bg-slate-300" />
                <span className="flex gap-1">
                  <span className="h-3 flex-1 rounded-sm bg-slate-200" />
                  <span className="h-3 flex-1 rounded-sm bg-slate-200" />
                  <span className="h-3 flex-1 rounded-sm bg-slate-200" />
                </span>
                <span className="block h-2.5 rounded-sm bg-slate-200" />
              </span>
              <span className="block text-xs font-semibold text-slate-800">
                {starter.name}
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
                {starter.description}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
