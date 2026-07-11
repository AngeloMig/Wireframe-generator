"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import { MessageCircle, X } from "lucide-react";
import { getVariation } from "@/data/section-variations";
import { brandTheme, setContentValue } from "@/lib/editor-utils";
import {
  readThemeOverrides,
  writeThemeOverrides,
  type ThemeOverrides,
} from "@/lib/theme-overrides";
import { canEditProjectContent, editRestrictionReason } from "@/lib/permissions";
import { createSectionFromVariation, switchSectionVariation } from "@/lib/sections";
import { cn } from "@/utils/cn";
import { useCollabUiStore } from "@/stores/collab-ui-store";
import { selectProjectComments, useCommentsStore } from "@/stores/comments-store";
import { selectProjectMembers, useMembersStore } from "@/stores/members-store";
import { useEditorStore } from "@/stores/editor-store";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import type {
  CommentPriority,
  PageSection,
  Project,
  ProjectPage,
  SectionVariation,
} from "@/types";
import { createId } from "@/utils/id";
import { CanvasCommentPopover } from "./canvas/canvas-comment-popover";
import { EditorTour } from "@/components/customer/editor-tour";
import { SuggestionBanner } from "@/components/collab/suggestion-banner";
import { CANVAS_APPEND_ID, EditorCanvas, type DropTarget } from "./canvas/editor-canvas";
import { ContextCommentMenu, type ContextMenuState } from "./canvas/context-comment-menu";
import { EditorToolbar } from "./editor-toolbar";
import { LibraryDragPreview, LIBRARY_DRAG_PREFIX } from "./library/library-item";
import { SectionLibrary } from "./library/section-library";
import { RAIL_DRAG_PREFIX, StructurePanel } from "./structure-panel";

function stripRailPrefix(id: string): string {
  return id.startsWith(RAIL_DRAG_PREFIX) ? id.slice(RAIL_DRAG_PREFIX.length) : id;
}
import { VariationPreview } from "./library/variation-preview";
import { SectionInspector } from "./inspector/section-inspector";
import type { CanvasSectionActions, SectionCommentMarker } from "./canvas/canvas-section";

type ActiveDrag =
  | { type: "library"; variation: SectionVariation }
  | { type: "section"; section: PageSection; name: string };

/** The three-panel wireframe editor. Owns the drag-and-drop context. */
export function Editor({
  project,
  page,
  initialSectionId,
}: {
  project: Project;
  page: ProjectPage;
  /** Section to select on load (deep links from comments/notifications). */
  initialSectionId?: string | null;
}) {
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
  const [previewVariation, setPreviewVariation] = useState<SectionVariation | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const user = useSessionStore((s) => s.user);
  const isCustomer = user.role === "customer";
  // Theme-editor layout: the page structure rail is always docked; the
  // section library opens on demand via "Add section" for everyone.
  const [libraryOpen, setLibraryOpen] = useState(false);
  const commentMode = useCollabUiStore((s) => s.commentMode);
  const setCommentMode = useCollabUiStore((s) => s.setCommentMode);
  const openComposer = useCollabUiStore((s) => s.openComposer);
  const selectComment = useCollabUiStore((s) => s.selectComment);
  const loadComments = useCommentsStore((s) => s.load);
  const loadMembers = useMembersStore((s) => s.load);
  const members = useMembersStore((s) => selectProjectMembers(s, project.id));
  const updateComment = useCommentsStore((s) => s.updateComment);
  const comments = useCommentsStore((s) => selectProjectComments(s, project.id));

  useEffect(() => {
    openPage(page.id);
  }, [page.id, openPage]);

  useEffect(() => {
    if (initialSectionId && page.sections.some((s) => s.id === initialSectionId)) {
      select(initialSectionId);
    }
    // Only on load / when the deep link changes — not on every section edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSectionId, page.id, select]);

  useEffect(() => {
    void loadComments(project.id);
    void loadMembers(project.id);
  }, [project.id, loadComments, loadMembers]);

  // Leaving the editor exits comment mode so other pages start clean.
  useEffect(() => () => setCommentMode(false), [setCommentMode]);

  // Styled-mode theme = wizard-derived brand + local Theme-panel tweaks.
  const [themeOverrides, setThemeOverrides] = useState<ThemeOverrides>(() =>
    readThemeOverrides(project.id),
  );
  const theme = useMemo(
    () => ({ ...brandTheme(project), ...themeOverrides }),
    [project, themeOverrides],
  );
  const changeTheme = useCallback(
    (patch: ThemeOverrides) =>
      setThemeOverrides((prev) => {
        const next = { ...prev, ...patch };
        writeThemeOverrides(project.id, next);
        return next;
      }),
    [project.id],
  );
  const resetTheme = useCallback(() => {
    writeThemeOverrides(project.id, {});
    setThemeOverrides({});
  }, [project.id]);
  const ordered = useMemo(
    () => [...page.sections].sort((a, b) => a.order - b.order),
    [page.sections],
  );
  const selectedSection = ordered.find((s) => s.id === selectedSectionId) ?? null;

  // Status-based editing restriction (submission locks editing for customers).
  const memberAccess = members.find((member) => member.userId === user.id)?.accessLevel;
  const contentEditable =
    canEditProjectContent(user.role, project.status) &&
    (user.role !== "customer" || !memberAccess || memberAccess === "edit");
  const restrictionReason = editRestrictionReason(user.role, project.status);

  // Numbered comment markers per section, in page order.
  const markers = useMemo(() => {
    const map = new Map<string, SectionCommentMarker>();
    const rank: Record<CommentPriority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
    const visible = comments.filter(
      (c) =>
        c.sectionId &&
        c.pageId === page.id &&
        (user.role !== "customer" || c.visibility === "customer"),
    );
    let number = 0;
    for (const section of ordered) {
      const forSection = visible.filter((c) => c.sectionId === section.id);
      if (forSection.length === 0) continue;
      number += 1;
      map.set(section.id, {
        number,
        openCount: forSection.filter((c) => c.status !== "resolved").length,
        resolvedCount: forSection.filter((c) => c.status === "resolved").length,
        replyCount: forSection.reduce((sum, c) => sum + c.replies.length, 0),
        topPriority: forSection.reduce<CommentPriority>(
          (top, c) => (rank[c.priority] < rank[top] ? c.priority : top),
          "low",
        ),
      });
    }
    return map;
  }, [comments, ordered, page.id, user.role]);

  const pointComments = useMemo(
    () =>
      comments.filter(
        (comment) =>
          comment.pageId === page.id &&
          comment.anchorKey?.startsWith("point:") &&
          (user.role !== "customer" || comment.visibility === "customer"),
      ),
    [comments, page.id, user.role],
  );

  // Sections still waiting on someone: open feedback threads, incomplete
  // action items, or content flags on the section itself. Shown as amber
  // dots in the structure rail.
  const attentionIds = useMemo(() => {
    const ids = new Set<string>();
    for (const section of ordered) {
      if (
        section.reviewStatus === "content-needed" ||
        section.reviewStatus === "image-needed" ||
        section.reviewStatus === "revisions-requested"
      ) {
        ids.add(section.id);
      }
    }
    for (const comment of comments) {
      if (!comment.sectionId || comment.pageId !== page.id) continue;
      if (user.role === "customer" && comment.visibility !== "customer") continue;
      const openThread = comment.status === "open" || comment.status === "reopened";
      const openTask = comment.isActionItem && !comment.completedAt;
      if (openThread || openTask) ids.add(comment.sectionId);
    }
    return ids;
  }, [ordered, comments, page.id, user.role]);

  const missingSections = useMemo(
    () => ordered.filter((section) => ["content-needed", "image-needed", "revisions-requested"].includes(section.reviewStatus)),
    [ordered],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ----- Section mutations --------------------------------------------------

  const updateSelectedSection = useCallback(
    (mutate: (section: PageSection) => PageSection, editKey?: string) => {
      if (!selectedSectionId) return;
      const current = ordered.find((s) => s.id === selectedSectionId);
      if (current?.approvalLocked) {
        toast(
          "This section is approved and locked",
          "info",
          "Ask the agency to unlock it if something needs to change.",
        );
        return;
      }
      applySections(
        project.id,
        (sections) =>
          sections.map((s) => (s.id === selectedSectionId ? mutate(s) : s)),
        { editKey },
      );
    },
    [applySections, ordered, project.id, selectedSectionId],
  );

  const insertStarter = useCallback(
    (variationIds: string[]) => {
      const sections = variationIds
        .map((id) => {
          const variation = getVariation(id);
          return variation ? createSectionFromVariation(variation) : null;
        })
        .filter((s): s is PageSection => s !== null);
      if (sections.length === 0) return;
      applySections(
        project.id,
        () => sections,
        {
          activity: {
            type: "section-added",
            message: `Page started from a layout bundle (${sections.length} sections)`,
          },
        },
      );
      select(sections[0].id, "content");
      toast("Layout added", "success", "Every section is a starting point — make it yours.");
    },
    [applySections, project.id, select],
  );

  const insertVariation = useCallback(
    (variation: SectionVariation, index?: number) => {
      const section = createSectionFromVariation(variation);
      applySections(
        project.id,
        (sections) => {
          const next = [...sections].sort((a, b) => a.order - b.order);
          // No explicit index: insert right below the selected section
          // (Shopify-style), falling back to the end of the page.
          let at = index;
          if (at === undefined) {
            const selectedIndex = selectedSectionId
              ? next.findIndex((s) => s.id === selectedSectionId)
              : -1;
            at = selectedIndex === -1 ? next.length : selectedIndex + 1;
          }
          next.splice(at, 0, section);
          return next;
        },
        { activity: { type: "section-added", message: `${variation.name} section added` } },
      );
      select(section.id, "content");
      // Bring the new section into view once it has rendered.
      setTimeout(() => {
        document
          .querySelector(`[data-canvas-section="${section.id}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
    },
    [applySections, project.id, select, selectedSectionId],
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
      onInlineEdit: (id, path, value) =>
        applySections(project.id, (sections) =>
          sections.map((s) =>
            s.id === id ? { ...s, content: setContentValue(s.content, path, value) } : s,
          ),
        ),
      onSwapDesign: (id, variationId) => {
        const target = getVariation(variationId);
        if (!target) return;
        applySections(project.id, (sections) =>
          sections.map((s) => (s.id === id ? switchSectionVariation(s, target) : s)),
        );
        toast("Design changed", "success", `Now using “${target.name}”. Your content was kept.`);
      },
      onDelete: (id) => {
        const section = ordered.find((s) => s.id === id);
        if (section?.approvalLocked) {
          toast("Approved sections can't be deleted", "info");
          return;
        }
        const variation = section ? getVariation(section.variationId) : null;

        // Comments on the section survive: mark them as attached to a deleted
        // section and keep a snapshot so they can restore it.
        if (section) {
          const affected = comments.filter((c) => c.sectionId === id && !c.deletedSection);
          for (const comment of affected) {
            void updateComment(project.id, comment.id, {
              deletedSection: {
                sectionName: variation?.name ?? "Section",
                variationName: variation?.name ?? section.variationId,
                sectionSnapshot: structuredClone(section) as unknown as Record<
                  string,
                  unknown
                >,
              },
            });
          }
        }

        applySections(
          project.id,
          (sections) => sections.filter((s) => s.id !== id),
          {
            activity: {
              type: "section-removed",
              message: `${variation?.name ?? "Section"} removed`,
            },
          },
        );
        select(null);
        toast("Section removed", "info", "Use undo if that was a mistake.");
      },
    }),
    [applySections, comments, moveSection, ordered, project.id, select, toggleCollapsed, updateComment],
  );

  // ----- Drag and drop ------------------------------------------------------

  const collisionDetection: CollisionDetection = useCallback((args) => {
    const within = pointerWithin(args);
    return within.length > 0 ? within : closestCenter(args);
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    if (id.startsWith(LIBRARY_DRAG_PREFIX)) {
      const variation = getVariation(id.slice(LIBRARY_DRAG_PREFIX.length));
      if (variation) setActiveDrag({ type: "library", variation });
    } else {
      // Canvas sections use raw ids; structure-rail rows use a "rail:" prefix.
      const section = ordered.find((s) => s.id === stripRailPrefix(id));
      if (section) {
        const variation = getVariation(section.variationId);
        setActiveDrag({
          type: "section",
          section,
          name: variation?.name ?? "Section",
        });
      }
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
      insertVariation(drag.variation, index);
      return;
    }

    // Reordering an existing section (from the canvas or the structure rail).
    const oldIndex = ordered.findIndex((s) => s.id === stripRailPrefix(String(active.id)));
    if (oldIndex === -1) return;
    let newIndex: number;
    if (over.id === CANVAS_APPEND_ID) {
      newIndex = ordered.length - 1;
    } else {
      newIndex = ordered.findIndex((s) => s.id === stripRailPrefix(String(over.id)));
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
        !isPreview &&
        !previewVariation &&
        !commentMode &&
        contentEditable
      ) {
        event.preventDefault();
        canvasActions.onDelete(selectedSectionId);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    undo,
    redo,
    project.id,
    selectedSectionId,
    isPreview,
    canvasActions,
    previewVariation,
    commentMode,
    contentEditable,
  ]);

  // ----- Render ------------------------------------------------------------------

  return (
    <div
      className={cn(
        "flex flex-col bg-[var(--app-background)]",
        commentMode
          ? "fixed inset-0 z-[70] h-screen overflow-hidden shadow-[var(--shadow-overlay)]"
          : "relative h-[calc(100vh-4rem)]",
      )}
      aria-label={commentMode ? "Fullscreen comment workspace" : "Wireframe editor"}
    >
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
        selectedSectionId={selectedSectionId}
        libraryOpen={libraryOpen}
        onToggleLibrary={() => setLibraryOpen((open) => !open)}
        theme={theme}
        themeHasOverrides={Object.keys(themeOverrides).length > 0}
        onThemeChange={changeTheme}
        onThemeReset={resetTheme}
      />

      {mode === "styled" && (
        <p className="border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-800">
          This preview represents the selected direction and is not the final website
          design.
        </p>
      )}

      {commentMode && (
        <p
          className="border-b border-indigo-200 bg-indigo-50 px-4 py-1.5 text-center text-xs text-indigo-800"
          aria-live="polite"
        >
          Comment mode — click any section to start a conversation. Editing is paused.
        </p>
      )}

      {!contentEditable && restrictionReason && !commentMode && (
        <p
          className="border-b border-slate-200 bg-slate-50 px-4 py-1.5 text-center text-xs text-slate-600"
          aria-live="polite"
        >
          {restrictionReason}
          {(project.status === "awaiting-approval" ||
            project.status === "partially-approved") && (
            <Link
              href={`/projects/${project.id}/review`}
              className="ml-1.5 font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
            >
              Review &amp; approve →
            </Link>
          )}
        </p>
      )}

      <SuggestionBanner project={project} page={page} />

      {!commentMode && missingSections.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-amber-200 bg-[#fff9ef] px-4 py-2.5 text-xs text-[#79572f]">
          <span className="flex size-6 items-center justify-center rounded-full bg-[#f3b96c]/30 font-bold">{missingSections.length}</span>
          <span className="font-semibold">{missingSections.length === 1 ? "One section needs attention" : `${missingSections.length} sections need attention`}</span>
          <span className="hidden text-[#98734c] sm:inline">Add content or resolve requested changes before you submit.</span>
          <button
            type="button"
            className="ml-auto rounded-lg bg-[#f3b96c]/25 px-2.5 py-1 font-semibold text-[#79572f] hover:bg-[#f3b96c]/40"
            onClick={() => {
              const target = missingSections[0];
              select(target.id);
              document.querySelector(`[data-canvas-section="${target.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          >
            Review first issue
          </button>
        </div>
      )}

      <div className="border-b border-[var(--border-default)] bg-[#fff9ef] px-4 py-2 text-center text-xs text-[#79572f] md:hidden">
        You can review, comment, and make simple edits here. For arranging sections, a larger screen works best.
      </div>

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
        <div className="flex min-h-0 flex-1 gap-px bg-[var(--border-default)]">
          {!isPreview && !commentMode && (
            <aside
              className="hidden w-60 shrink-0 bg-white lg:block"
              aria-label="Page structure"
              data-tour="structure"
            >
              <StructurePanel
                sections={page.sections}
                selectedId={selectedSectionId}
                actions={canvasActions}
                readOnly={!contentEditable}
                onAddSection={() => setLibraryOpen(true)}
                attentionIds={attentionIds}
              />
            </aside>
          )}

          {!isPreview && !commentMode && contentEditable && libraryOpen && (
            <aside
              className="hidden w-72 shrink-0 flex-col bg-white lg:flex xl:w-76"
              aria-label="Section library"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-default)] px-3 py-2">
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">Add section</p>
                <button
                  type="button"
                  aria-label="Close the section list"
                  onClick={() => setLibraryOpen(false)}
                  className="flex size-6 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <SectionLibrary
                  page={page}
                  goals={project.questionnaire.goals}
                  onAdd={(variation) => {
                    insertVariation(variation);
                    if (isCustomer) setLibraryOpen(false);
                  }}
                  onPreview={(variation) => setPreviewVariation(variation)}
                />
              </div>
            </aside>
          )}

          <EditorCanvas
            sections={page.sections}
            theme={theme}
            dropTarget={activeDrag?.type === "library" ? dropTarget : null}
            isLibraryDragging={activeDrag?.type === "library"}
            actions={canvasActions}
            readOnly={!contentEditable}
            commentMode={commentMode}
            markers={markers}
            onMarkerSelect={(sectionId) => {
              const first = comments.find(
                (c) => c.sectionId === sectionId && c.status !== "resolved",
              ) ?? comments.find((c) => c.sectionId === sectionId);
              select(sectionId);
              if (first) selectComment(first.id);
            }}
            onInsertStarter={contentEditable ? insertStarter : undefined}
            onContextComment={
              isPreview
                ? undefined
                : (sectionId, x, y) =>
                    setContextMenu({
                      sectionId,
                      sectionName: sectionId
                        ? (getVariation(
                            ordered.find((s) => s.id === sectionId)?.variationId ?? "",
                          )?.name ?? "this section")
                        : null,
                      x,
                      y,
                    })
            }
          />

          {!isPreview && !commentMode && (
            <aside
              className="hidden w-80 shrink-0 bg-white xl:block"
              aria-label="Section inspector"
              data-tour="inspector"
            >
              <SectionInspector section={selectedSection} onChange={updateSelectedSection} />
            </aside>
          )}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDrag?.type === "library" && (
            <LibraryDragPreview variation={activeDrag.variation} />
          )}
          {activeDrag?.type === "section" && (
            <div className="rounded-lg border border-[var(--primary)] bg-white px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] shadow-[var(--shadow-panel)]">
              {activeDrag.name}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {contextMenu && (
        <ContextCommentMenu
          menu={contextMenu}
          onClose={() => setContextMenu(null)}
          onCommentSection={(sectionId) => {
            setCommentMode(true);
            select(sectionId);
            openComposer({ pageId: page.id, sectionId });
          }}
          onCommentPage={() => {
            setCommentMode(true);
            openComposer({ pageId: page.id });
          }}
          onCommentHere={() => {
            setCommentMode(true);
            openComposer({
              pageId: page.id,
              sectionId: contextMenu.sectionId,
              anchorKey: `point:${contextMenu.x}:${contextMenu.y}`,
              anchorLabel: "Pinned canvas comment",
              position: { x: contextMenu.x, y: contextMenu.y },
            });
          }}
        />
      )}

      {commentMode && pointComments.map((comment, index) => {
        const [, rawX, rawY] = comment.anchorKey?.split(":") ?? [];
        const x = Number(rawX);
        const y = Number(rawY);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        return (
          <button
            key={comment.id}
            type="button"
            aria-label={`Open comment ${index + 1}`}
            onClick={() =>
              openComposer({
                pageId: page.id,
                sectionId: comment.sectionId,
                anchorKey: comment.anchorKey,
                anchorLabel: comment.anchorLabel ?? "Pinned canvas comment",
                position: { x, y },
              })
            }
            className="fixed z-[75] flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-[var(--primary)] text-white shadow-[0_4px_14px_rgb(22_107_87/0.3)] transition-transform hover:scale-110"
            style={{ left: x, top: y }}
          >
            <MessageCircle className="size-3.5" aria-hidden />
          </button>
        );
      })}

      {!isPreview && commentMode && <CanvasCommentPopover project={project} />}

      {isCustomer && contentEditable && <EditorTour />}

      <VariationPreview
        variation={previewVariation}
        theme={theme}
        onClose={() => setPreviewVariation(null)}
        onAdd={(variation) => insertVariation(variation)}
      />
    </div>
  );
}
