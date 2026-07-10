"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { getSectionTemplate } from "@/data/section-templates";
import { brandTheme } from "@/lib/editor-utils";
import { createSectionFromTemplate } from "@/lib/sections";
import { useEditorStore } from "@/stores/editor-store";
import { toast } from "@/stores/ui-store";
import type { PageSection, Project, ProjectPage, SectionTemplate } from "@/types";
import { createId } from "@/utils/id";
import { CANVAS_APPEND_ID, EditorCanvas, type DropTarget } from "./canvas/editor-canvas";
import { EditorToolbar } from "./editor-toolbar";
import { LibraryDragPreview, LIBRARY_DRAG_PREFIX } from "./library/library-item";
import { SectionLibrary } from "./library/section-library";
import { SectionInspector } from "./inspector/section-inspector";
import type { CanvasSectionActions } from "./canvas/canvas-section";

type ActiveDrag =
  | { type: "library"; template: SectionTemplate }
  | { type: "section"; section: PageSection; template: SectionTemplate };

/** The three-panel wireframe editor. Owns the drag-and-drop context. */
export function Editor({ project, page }: { project: Project; page: ProjectPage }) {
  const router = useRouter();
  const openPage = useEditorStore((s) => s.openPage);
  const select = useEditorStore((s) => s.select);
  const selectedSectionId = useEditorStore((s) => s.selectedSectionId);
  const toggleCollapsed = useEditorStore((s) => s.toggleCollapsed);
  const isPreview = useEditorStore((s) => s.isPreview);
  const mode = useEditorStore((s) => s.mode);
  const applySections = useEditorStore((s) => s.applySections);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.past.length > 0);
  const canRedo = useEditorStore((s) => s.future.length > 0);

  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  useEffect(() => {
    openPage(page.id);
  }, [page.id, openPage]);

  const theme = useMemo(() => brandTheme(project), [project]);
  const ordered = useMemo(
    () => [...page.sections].sort((a, b) => a.order - b.order),
    [page.sections],
  );
  const selectedSection = ordered.find((s) => s.id === selectedSectionId) ?? null;
  const selectedTemplate = selectedSection
    ? (getSectionTemplate(selectedSection.templateId) ?? null)
    : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ----- Section mutations --------------------------------------------------

  const updateSelectedSection = useCallback(
    (mutate: (section: PageSection) => PageSection, editKey?: string) => {
      if (!selectedSectionId) return;
      applySections(
        project.id,
        (sections) =>
          sections.map((s) => (s.id === selectedSectionId ? mutate(s) : s)),
        { editKey },
      );
    },
    [applySections, project.id, selectedSectionId],
  );

  const insertTemplate = useCallback(
    (template: SectionTemplate, index?: number) => {
      const section = createSectionFromTemplate(template);
      applySections(
        project.id,
        (sections) => {
          const next = [...sections].sort((a, b) => a.order - b.order);
          next.splice(index ?? next.length, 0, section);
          return next;
        },
        { activity: { type: "section-added", message: `${template.name} section added` } },
      );
      select(section.id, "content");
    },
    [applySections, project.id, select],
  );

  const moveSection = useCallback(
    (id: string, direction: -1 | 1) => {
      applySections(project.id, (sections) => {
        const sorted = [...sections].sort((a, b) => a.order - b.order);
        const index = sorted.findIndex((s) => s.id === id);
        const target = index + direction;
        if (index === -1 || target < 0 || target >= sorted.length) return sections;
        return arrayMove(sorted, index, target);
      });
    },
    [applySections, project.id],
  );

  const canvasActions: CanvasSectionActions = useMemo(
    () => ({
      onSelect: (id) => select(id),
      onMoveUp: (id) => moveSection(id, -1),
      onMoveDown: (id) => moveSection(id, 1),
      onDuplicate: (id) => {
        applySections(
          project.id,
          (sections) => {
            const sorted = [...sections].sort((a, b) => a.order - b.order);
            const index = sorted.findIndex((s) => s.id === id);
            if (index === -1) return sections;
            const copy = { ...structuredClone(sorted[index]), id: createId() };
            sorted.splice(index + 1, 0, copy);
            return sorted;
          },
          { activity: { type: "section-added", message: "Section duplicated" } },
        );
      },
      onToggleHidden: (id) =>
        applySections(project.id, (sections) =>
          sections.map((s) => (s.id === id ? { ...s, isHidden: !s.isHidden } : s)),
        ),
      onToggleLocked: (id) =>
        applySections(project.id, (sections) =>
          sections.map((s) => (s.id === id ? { ...s, isLocked: !s.isLocked } : s)),
        ),
      onToggleCollapsed: (id) => toggleCollapsed(id),
      onDelete: (id) => {
        const section = ordered.find((s) => s.id === id);
        const template = section ? getSectionTemplate(section.templateId) : null;
        applySections(
          project.id,
          (sections) => sections.filter((s) => s.id !== id),
          {
            activity: {
              type: "section-removed",
              message: `${template?.name ?? "Section"} removed`,
            },
          },
        );
        select(null);
        toast("Section removed", "info", "Use undo if that was a mistake.");
      },
    }),
    [applySections, moveSection, ordered, project.id, select, toggleCollapsed],
  );

  // ----- Drag and drop ------------------------------------------------------

  const collisionDetection: CollisionDetection = useCallback((args) => {
    const within = pointerWithin(args);
    return within.length > 0 ? within : closestCenter(args);
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    if (id.startsWith(LIBRARY_DRAG_PREFIX)) {
      const template = getSectionTemplate(id.slice(LIBRARY_DRAG_PREFIX.length));
      if (template) setActiveDrag({ type: "library", template });
    } else {
      const section = ordered.find((s) => s.id === id);
      const template = section ? getSectionTemplate(section.templateId) : null;
      if (section && template) setActiveDrag({ type: "section", section, template });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (activeDrag?.type !== "library") return;
    const { active, over } = event;
    if (!over) {
      setDropTarget(null);
      return;
    }
    if (over.id === CANVAS_APPEND_ID) {
      setDropTarget({ sectionId: null, edge: "top" });
      return;
    }
    const overSection = ordered.find((s) => s.id === String(over.id));
    if (!overSection) {
      setDropTarget(null);
      return;
    }
    const translated = active.rect.current.translated;
    const activeMid = translated ? translated.top + translated.height / 2 : 0;
    const overMid = over.rect.top + over.rect.height / 2;
    setDropTarget({
      sectionId: overSection.id,
      edge: activeMid < overMid ? "top" : "bottom",
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const drag = activeDrag;
    const target = dropTarget;
    setActiveDrag(null);
    setDropTarget(null);
    const { active, over } = event;
    if (!over || !drag) return;

    if (drag.type === "library") {
      let index = ordered.length;
      if (target?.sectionId) {
        const overIndex = ordered.findIndex((s) => s.id === target.sectionId);
        if (overIndex !== -1) index = overIndex + (target.edge === "bottom" ? 1 : 0);
      }
      insertTemplate(drag.template, index);
      return;
    }

    // Reordering an existing section.
    const oldIndex = ordered.findIndex((s) => s.id === String(active.id));
    if (oldIndex === -1) return;
    let newIndex: number;
    if (over.id === CANVAS_APPEND_ID) {
      newIndex = ordered.length - 1;
    } else {
      newIndex = ordered.findIndex((s) => s.id === String(over.id));
      if (newIndex === -1) return;
    }
    if (newIndex === oldIndex) return;
    applySections(project.id, (sections) => {
      const sorted = [...sections].sort((a, b) => a.order - b.order);
      return arrayMove(sorted, oldIndex, newIndex);
    });
  };

  // ----- Keyboard shortcuts ---------------------------------------------------

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (isTyping) return;

      const meta = event.ctrlKey || event.metaKey;
      if (meta && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo(project.id);
        else undo(project.id);
      } else if (meta && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo(project.id);
      } else if (
        (event.key === "Delete" || event.key === "Backspace") &&
        selectedSectionId &&
        !isPreview
      ) {
        event.preventDefault();
        canvasActions.onDelete(selectedSectionId);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, project.id, selectedSectionId, isPreview, canvasActions]);

  // ----- Render ------------------------------------------------------------------

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-white">
      <EditorToolbar
        project={project}
        page={page}
        onSelectPage={(pageId) =>
          router.replace(`/projects/${project.id}/editor?page=${pageId}`, { scroll: false })
        }
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={() => undo(project.id)}
        onRedo={() => redo(project.id)}
      />

      {mode === "styled" && (
        <p className="border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-800">
          This preview represents the selected direction and is not the final website
          design.
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveDrag(null);
          setDropTarget(null);
        }}
      >
        <div className="flex min-h-0 flex-1">
          {!isPreview && (
            <aside
              className="w-76 shrink-0 border-r border-slate-200 bg-white"
              aria-label="Section library"
            >
              <SectionLibrary
                page={page}
                goals={project.questionnaire.goals}
                onAdd={(template) => insertTemplate(template)}
              />
            </aside>
          )}

          <EditorCanvas
            sections={page.sections}
            theme={theme}
            dropTarget={activeDrag?.type === "library" ? dropTarget : null}
            isLibraryDragging={activeDrag?.type === "library"}
            actions={canvasActions}
          />

          {!isPreview && (
            <aside
              className="w-80 shrink-0 border-l border-slate-200 bg-white"
              aria-label="Section inspector"
            >
              <SectionInspector
                section={selectedSection}
                template={selectedTemplate}
                onChange={updateSelectedSection}
              />
            </aside>
          )}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDrag?.type === "library" && (
            <LibraryDragPreview template={activeDrag.template} />
          )}
          {activeDrag?.type === "section" && (
            <div className="rounded-lg border border-indigo-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-lg">
              {activeDrag.template.name}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
