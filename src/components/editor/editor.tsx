"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import { Layers, Lightbulb, MessageCircle, PencilRuler, Settings2, X } from "lucide-react";
import { getVariation } from "@/data/section-variations";
import { brandTheme, setContentValue } from "@/lib/editor-utils";
import {
  readThemeOverrides,
  writeThemeOverrides,
  type ThemeOverrides,
} from "@/lib/theme-overrides";
import { grantedCapabilities, canEditAnything, editRestrictionReason } from "@/lib/permissions";
import { findLastApprovedSection, notifyCustomerEditing } from "@/lib/collab-service";
import { createSectionFromVariation, switchSectionVariation } from "@/lib/sections";
import { cn } from "@/utils/cn";
import { useCollabUiStore } from "@/stores/collab-ui-store";
import { selectProjectComments, useCommentsStore } from "@/stores/comments-store";
import { selectProjectMembers, useMembersStore } from "@/stores/members-store";
import { approvedLevelsFor, useAccessRequestsStore } from "@/stores/access-requests-store";
import { useCustomSectionsStore, type SavedSection } from "@/stores/custom-sections-store";
import { selectProjectSuggestions, useSuggestionsStore } from "@/stores/suggestions-store";
import { useEditorStore } from "@/stores/editor-store";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import type {
  CommentPriority,
  PageSection,
  Project,
  ProjectPage,
  SectionVariation,
  SectionVariationSuggestion,
} from "@/types";
import { createId } from "@/utils/id";
import { CanvasCommentPopover } from "./canvas/canvas-comment-popover";
import { EditorTour } from "@/components/customer/editor-tour";
import { SuggestionDialog } from "@/components/collab/suggestion-banner";
import { CANVAS_APPEND_ID, EditorCanvas, type DropTarget } from "./canvas/editor-canvas";
import { ContextCommentMenu, type ContextMenuState } from "./canvas/context-comment-menu";
import { CommandPalette } from "./command-palette";
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
  const restoreRemovedSection = useEditorStore((s) => s.restoreRemovedSection);
  const dismissRemoval = useEditorStore((s) => s.dismissRemoval);
  const canUndo = useEditorStore((s) => s.past.length > 0);
  const canRedo = useEditorStore((s) => s.future.length > 0);

  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [previewVariation, setPreviewVariation] = useState<SectionVariation | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [reviewingSuggestion, setReviewingSuggestion] =
    useState<SectionVariationSuggestion | null>(null);
  // Small screens: the structure and inspector panels open as bottom sheets.
  const [mobilePanel, setMobilePanel] = useState<"structure" | "inspector" | null>(null);
  // The working-copy explainer never changes, so one read is enough for life.
  const [workingCopyDismissed, setWorkingCopyDismissed] = useState(true);
  useEffect(() => {
    setWorkingCopyDismissed(window.localStorage.getItem("wb:working-copy-dismissed") === "1");
  }, []);
  const dismissWorkingCopy = () => {
    window.localStorage.setItem("wb:working-copy-dismissed", "1");
    setWorkingCopyDismissed(true);
  };

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
  const refreshMembers = useMembersStore((s) => s.refresh);
  const members = useMembersStore((s) => selectProjectMembers(s, project.id));
  const accessRequests = useAccessRequestsStore((s) => s.requests);
  const hydrateAccessRequests = useAccessRequestsStore((s) => s.hydrate);
  const refreshAccessRequests = useAccessRequestsStore((s) => s.refresh);
  const updateComment = useCommentsStore((s) => s.updateComment);
  const comments = useCommentsStore((s) => selectProjectComments(s, project.id));
  const loadSuggestions = useSuggestionsStore((s) => s.load);
  const suggestions = useSuggestionsStore((s) => selectProjectSuggestions(s, project.id));
  const addSavedSection = useCustomSectionsStore((s) => s.addSection);

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
    void loadSuggestions(project.id);
    // Access decisions can be made by an agency user and then viewed by the
    // customer in the same browser session, so always refresh membership here.
    void refreshMembers(project.id);
    hydrateAccessRequests();
    refreshAccessRequests();
  }, [project.id, loadComments, loadSuggestions, refreshMembers, hydrateAccessRequests, refreshAccessRequests]);

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

  // Editing is gated in two independent layers, and BOTH must pass:
  //  1. The project status must be in an editable phase — submitting for review
  //     or entering approval pauses editing, and no access grant overrides that.
  //  2. The customer must actually hold edit rights (owner, an "edit" member,
  //     or an approved access request). Access grants only unlock a customer
  //     during an already-editable phase; they never bypass the review lock.
  const memberAccess = members.find((member) => member.userId === user.id)?.accessLevel;
  const approvedLevels = approvedLevelsFor(accessRequests, project.id, user.id);
  const caps = grantedCapabilities(user.role, project.status, { memberAccess, approvedLevels });
  const canEditContent = caps.content;
  const canBuildSections = caps.builder;
  const contentEditable = canEditAnything(caps);
  // The customer holds an access grant when they own the project, are an "edit"
  // member, or have any approved capability — so if editing is still blocked,
  // it's the status, not a missing grant. Used to word the restriction banner.
  const hasAccessGrant =
    user.role === "customer" &&
    (!memberAccess || memberAccess === "edit" || approvedLevels.length > 0);
  const restrictionReason = editRestrictionReason(user.role, project.status, hasAccessGrant);

  // Ping the agency when the customer edits — but batched. applySections bumps
  // project.lastEditedAt on every change, so we watch that and fire at most one
  // "customer is editing" notification per cooldown window (leading edge), so a
  // burst of edits doesn't spam. Baseline is skipped so opening the editor is
  // never mistaken for an edit.
  const lastEditSeenRef = useRef<string | null>(null);
  useEffect(() => {
    if (user.role !== "customer" || !contentEditable) return;
    if (lastEditSeenRef.current === null) {
      lastEditSeenRef.current = project.lastEditedAt;
      return;
    }
    if (project.lastEditedAt === lastEditSeenRef.current) return;
    lastEditSeenRef.current = project.lastEditedAt;

    const key = `wf:edit-notify:${project.id}`;
    const COOLDOWN_MS = 10 * 60 * 1000;
    const last = Number(window.localStorage.getItem(key) ?? 0);
    if (Date.now() - last < COOLDOWN_MS) return;
    window.localStorage.setItem(key, String(Date.now()));
    void notifyCustomerEditing(project, user);
  }, [project, user, contentEditable]);

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

  // Pin positions are computed from each section's live position, so they must
  // recompute whenever the canvas scrolls, zooms, or resizes — otherwise a
  // screen-fixed pin drifts off the spot it was dropped on.
  const [, recomputePins] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    if (!commentMode) return;
    let frame = 0;
    const onChange = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => recomputePins());
    };
    document.addEventListener("scroll", onChange, true);
    window.addEventListener("resize", onChange);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("scroll", onChange, true);
      window.removeEventListener("resize", onChange);
    };
  }, [commentMode]);

  /** Screen position of a `point:fx:fy` anchor, from its section's live rect. */
  const anchorScreenPosition = useCallback((comment: (typeof comments)[number]) => {
    const parts = comment.anchorKey?.split(":") ?? [];
    const fx = Number(parts[1]);
    const fy = Number(parts[2]);
    if (!Number.isFinite(fx) || !Number.isFinite(fy)) return null;
    const el = comment.sectionId
      ? document.querySelector(`[data-canvas-section="${comment.sectionId}"]`)
      : null;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    // Values ≤1 are fractions of the section (current format); larger values
    // are legacy absolute viewport coords, kept working for old pins.
    const isFraction = Math.abs(fx) <= 1 && Math.abs(fy) <= 1;
    const x = isFraction ? rect.left + fx * rect.width : fx;
    const y = isFraction ? rect.top + fy * rect.height : fy;
    return { x, y };
  }, []);

  // Sections still waiting on someone: open feedback threads, incomplete
  // action items, or content flags on the section itself. Shown as amber
  // dots in the structure rail, with the reasons as the tooltip.
  const attentionReasons = useMemo(() => {
    const map = new Map<string, string[]>();
    const add = (id: string, reason: string) => {
      const list = map.get(id) ?? [];
      if (!list.includes(reason)) list.push(reason);
      map.set(id, list);
    };
    for (const section of ordered) {
      if (section.reviewStatus === "content-needed") add(section.id, "Needs content");
      if (section.reviewStatus === "image-needed") add(section.id, "Needs an image");
      if (section.reviewStatus === "revisions-requested") add(section.id, "Changes requested");
      if (section.reviewStatus === "agency-review-needed")
        add(section.id, "Customer edited — needs review");
    }
    for (const comment of comments) {
      if (!comment.sectionId || comment.pageId !== page.id) continue;
      if (user.role === "customer" && comment.visibility !== "customer") continue;
      if (comment.isActionItem && !comment.completedAt) add(comment.sectionId, "Open task");
      else if (comment.status === "open" || comment.status === "reopened")
        add(comment.sectionId, "Open feedback");
    }
    return map;
  }, [ordered, comments, page.id, user.role]);

  const pendingSuggestions = useMemo(
    () => suggestions.filter((s) => s.status === "pending" && s.pageId === page.id),
    [suggestions, page.id],
  );

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

  const insertSavedSection = useCallback(
    (saved: SavedSection) => {
      const section = { ...structuredClone(saved.snapshot), id: createId() };
      applySections(
        project.id,
        (sections) => {
          const next = [...sections].sort((a, b) => a.order - b.order);
          const selectedIndex = selectedSectionId
            ? next.findIndex((s) => s.id === selectedSectionId)
            : -1;
          const at = selectedIndex === -1 ? next.length : selectedIndex + 1;
          next.splice(at, 0, section);
          return next;
        },
        { activity: { type: "section-added", message: `${saved.name} added from saved sections` } },
      );
      select(section.id, "content");
      setTimeout(() => {
        document
          .querySelector(`[data-canvas-section="${section.id}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
    },
    [applySections, project.id, select, selectedSectionId],
  );

  const saveSectionToLibrary = useCallback(
    (section: PageSection) => {
      const variation = getVariation(section.variationId);
      addSavedSection(variation?.name ?? "Section", section);
      toast(
        "Saved to your sections",
        "success",
        "Find it under Add section, in the Your sections group.",
      );
    },
    [addSavedSection],
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

  // Agency-only: restore a customer-edited section to the last version where
  // it was approved. There's nothing to revert to for a section that was
  // never part of an approved snapshot (e.g. one the customer just added).
  const handleRevertSection = useCallback(
    async (sectionId: string) => {
      const restored = await findLastApprovedSection(project.id, page.id, sectionId);
      if (!restored) {
        toast(
          "No approved version to revert to",
          "info",
          "This section was never part of an approved version — remove it instead if it shouldn't be here.",
        );
        return;
      }
      applySections(
        project.id,
        (sections) =>
          sections.map((s) =>
            s.id === sectionId
              ? {
                  ...s,
                  content: restored.content,
                  layout: restored.layout,
                  style: restored.style,
                  variationId: restored.variationId,
                  reviewStatus: restored.reviewStatus,
                  approvalLocked: true,
                }
              : s,
          ),
        { activity: { type: "section-reverted", message: "Section reverted to the last approved version" } },
      );
      toast("Section reverted", "success", "Restored to the last approved version.");
    },
    [applySections, page.id, project.id],
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
        canBuildSections
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
    canBuildSections,
  ]);

  // ----- Render ------------------------------------------------------------------

  return (
    <div
      className={cn(
        "flex flex-col bg-[var(--app-background)]",
        commentMode
          ? "fixed inset-0 z-[70] h-screen overflow-hidden shadow-[var(--shadow-overlay)]"
          : // Customers get no app-shell header (the toolbar IS the header), so
            // the editor owns the full viewport; agency users sit under the
            // 4rem shell top bar. Reserving 4rem for customers left a dead
            // band below the workspace.
            isCustomer
            ? "relative h-dvh"
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
        canEditOverride={contentEditable}
        canBuildSections={canBuildSections}
        canManagePages={caps.page}
      />

      {commentMode && (
        <p
          className="border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-800"
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

      {isCustomer && contentEditable && !commentMode && !isPreview && !workingCopyDismissed && (
        <p
          className="flex items-center justify-center gap-1.5 border-b border-[var(--focus-ring)]/30 bg-[var(--info-soft)] px-4 py-1.5 text-center text-xs text-[#1a4e8a]"
          aria-live="polite"
        >
          <PencilRuler className="size-3.5 shrink-0" aria-hidden />
          <span>
            <span className="font-semibold">You&apos;re editing a working copy.</span>{" "}
            Your changes stay separate from the agency&apos;s main design until they
            review and approve them.
          </span>
          <button
            type="button"
            aria-label="Dismiss this notice"
            onClick={dismissWorkingCopy}
            className="ml-1 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md text-[#1a4e8a]/60 hover:bg-[#1a4e8a]/10 hover:text-[#1a4e8a]"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </p>
      )}

      {/* One review-queue bar replaces the stacked suggestion + attention banners. */}
      {!commentMode && !isPreview && (pendingSuggestions.length > 0 || missingSections.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-[#d7e5f0] bg-[#f3f9fd] px-4 py-1.5 text-xs">
          <span className="font-semibold text-[var(--text-primary)]">
            {pendingSuggestions.length + missingSections.length} to review
          </span>
          {pendingSuggestions.length > 0 && (
            <button
              type="button"
              onClick={() => setReviewingSuggestion(pendingSuggestions[0])}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 font-medium text-violet-700 transition-colors hover:bg-violet-100"
            >
              <Lightbulb className="size-3" aria-hidden />
              {pendingSuggestions.length === 1
                ? "1 design suggestion"
                : `${pendingSuggestions.length} design suggestions`}
            </button>
          )}
          {missingSections.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const target = missingSections[0];
                select(target.id);
                document
                  .querySelector(`[data-canvas-section="${target.id}"]`)
                  ?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-medium text-amber-800 transition-colors hover:bg-amber-100"
            >
              {missingSections.length === 1
                ? "1 section needs content"
                : `${missingSections.length} sections need content`}
            </button>
          )}
        </div>
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
        {/* The workspace: a grey drafting table that the panels float over as
            rounded frosted cards (PicGen-style spatial UI). Soft ambient color
            blobs sit behind everything so the glass has something to blur —
            frosted panels over a flat color are indistinguishable from solid. */}
        <div className="relative isolate flex min-h-0 flex-1 gap-3 bg-[#e9ece8] p-3 pb-14 xl:pb-3">
          <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <div className="absolute -top-24 -left-24 size-[30rem] rounded-full bg-[#f7d34e]/40 blur-[110px]" />
            <div className="absolute top-1/4 -right-32 size-[32rem] rounded-full bg-[#7cc0f8]/35 blur-[120px]" />
            <div className="absolute -bottom-36 left-1/3 size-[28rem] rounded-full bg-[#f8b4c0]/30 blur-[110px]" />
          </div>
          {!isPreview && !commentMode && (
            <aside
              className="hidden w-60 shrink-0 flex-col relative z-10 overflow-hidden rounded-[1.25rem] bg-white/70 shadow-[inset_0_1px_0_rgb(255_255_255/0.6),0_10px_30px_rgb(38_57_74/0.10)] ring-1 ring-black/[0.05] backdrop-blur-xl lg:flex"
              aria-label="Page structure"
              data-tour="structure"
            >
              <div className="px-4 pt-4 pb-2">
                <p className="text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">Structure</p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  {page.sections.length} section{page.sections.length === 1 ? "" : "s"} on this page
                </p>
              </div>
              <div className="min-h-0 flex-1">
                <StructurePanel
                  sections={page.sections}
                  selectedId={selectedSectionId}
                  actions={canvasActions}
                  readOnly={!canBuildSections}
                  onAddSection={() => setLibraryOpen(true)}
                  attentionReasons={attentionReasons}
                />
              </div>
            </aside>
          )}

          {!isPreview &&
            !commentMode &&
            canBuildSections &&
            libraryOpen &&
            createPortal(
              <div
                className="fixed inset-0 z-[90] flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                aria-label="Section library"
                onKeyDown={(e) => {
                  if (e.key === "Escape") setLibraryOpen(false);
                }}
              >
                <button
                  type="button"
                  aria-label="Close the section list"
                  tabIndex={-1}
                  className="absolute inset-0 animate-fade-in cursor-default bg-slate-900/40"
                  onClick={() => setLibraryOpen(false)}
                />
                <div className="relative flex h-[88vh] w-full max-w-[min(1280px,calc(100vw-32px))] animate-scale-in flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-[var(--shadow-overlay)]">
                  <div className="flex items-start justify-between border-b border-[var(--border-default)] px-4 py-3">
                    <div>
                      <p className="text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">Add section</p>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">Drag onto the canvas, or click to insert</p>
                    </div>
                    <button
                      type="button"
                      aria-label="Close the section list"
                      onClick={() => setLibraryOpen(false)}
                      className="flex size-8 cursor-pointer items-center justify-center rounded-xl bg-black/[0.04] text-slate-500 transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-black/[0.08] hover:text-slate-900 active:scale-[0.94]"
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
                      onInsertSaved={(saved) => {
                        insertSavedSection(saved);
                        if (isCustomer) setLibraryOpen(false);
                      }}
                    />
                  </div>
                </div>
              </div>,
              document.body,
            )}

          <EditorCanvas
            sections={page.sections}
            theme={theme}
            dropTarget={activeDrag?.type === "library" ? dropTarget : null}
            isLibraryDragging={activeDrag?.type === "library"}
            actions={canvasActions}
            canEditContent={canEditContent}
            canEditStructure={canBuildSections}
            commentMode={commentMode}
            markers={markers}
            onMarkerSelect={(sectionId) => {
              const first = comments.find(
                (c) => c.sectionId === sectionId && c.status !== "resolved",
              ) ?? comments.find((c) => c.sectionId === sectionId);
              select(sectionId);
              if (first) selectComment(first.id);
            }}
            onInsertStarter={canBuildSections ? insertStarter : undefined}
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
              className="hidden w-80 shrink-0 relative z-10 overflow-hidden rounded-[1.25rem] bg-white/70 shadow-[inset_0_1px_0_rgb(255_255_255/0.6),0_10px_30px_rgb(38_57_74/0.10)] ring-1 ring-black/[0.05] backdrop-blur-xl xl:block"
              aria-label="Section inspector"
              data-tour="inspector"
            >
              <SectionInspector
                section={selectedSection}
                onChange={updateSelectedSection}
                page={page}
                projectId={project.id}
                attentionReasons={attentionReasons}
                onSelectSection={(id) => {
                  select(id);
                  document
                    .querySelector(`[data-canvas-section="${id}"]`)
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                onAddSection={canBuildSections ? () => setLibraryOpen(true) : undefined}
                onSaveToLibrary={!isCustomer && canBuildSections ? saveSectionToLibrary : undefined}
                onRevertSection={handleRevertSection}
                onRestoreRemoval={(removalId) => restoreRemovedSection(project.id, removalId)}
                onDismissRemoval={(removalId) => dismissRemoval(project.id, removalId)}
              />
            </aside>
          )}

          {mode === "styled" && !isPreview && (
            <p className="pointer-events-none absolute bottom-16 left-1/2 z-20 -translate-x-1/2 rounded-full bg-white/85 px-3 py-1 text-[11px] font-medium whitespace-nowrap text-amber-800 shadow-[var(--shadow-card)] ring-1 ring-amber-200 backdrop-blur xl:bottom-4">
              Design direction preview, not the final website.
            </p>
          )}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDrag?.type === "library" && (
            <LibraryDragPreview variation={activeDrag.variation} />
          )}
          {activeDrag?.type === "section" && (
            <div className="rounded-2xl bg-white/90 px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] shadow-[0_12px_36px_rgb(0_0_0/0.18)] ring-1 ring-[#f2b90d]/60 backdrop-blur-md">
              {activeDrag.name}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Between lg and xl the inspector column is hidden — surface the panels
          as bottom sheets there. (Below lg a dedicated mobile editor renders
          instead of this component.) */}
      {!isPreview && !commentMode && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-2 border-t border-black/[0.06] bg-white/90 px-4 py-2 backdrop-blur-xl xl:hidden">
          <button
            type="button"
            onClick={() => setMobilePanel("structure")}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-white px-3.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] shadow-[var(--shadow-subtle)] active:scale-[0.97] lg:hidden"
          >
            <Layers className="size-3.5" aria-hidden />
            Structure
          </button>
          <button
            type="button"
            onClick={() => setMobilePanel("inspector")}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-white px-3.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] shadow-[var(--shadow-subtle)] active:scale-[0.97]"
          >
            <Settings2 className="size-3.5" aria-hidden />
            {selectedSection ? "Edit section" : "Page overview"}
          </button>
        </div>
      )}

      {mobilePanel && !isPreview && !commentMode && (
        <div className="fixed inset-0 z-[80] xl:hidden" role="dialog" aria-modal="true" aria-label={mobilePanel === "structure" ? "Page structure" : "Section inspector"}>
          <button
            type="button"
            aria-label="Close panel"
            onClick={() => setMobilePanel(null)}
            className="absolute inset-0 cursor-default bg-black/30"
          />
          <div className="absolute inset-x-0 bottom-0 flex h-[72dvh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-[var(--shadow-overlay)]">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {mobilePanel === "structure" ? "Structure" : selectedSection ? "Edit section" : "This page"}
              </p>
              <button
                type="button"
                aria-label="Close panel"
                onClick={() => setMobilePanel(null)}
                className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-black/[0.05]"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {mobilePanel === "structure" ? (
                <StructurePanel
                  sections={page.sections}
                  selectedId={selectedSectionId}
                  actions={{
                    ...canvasActions,
                    onSelect: (id) => {
                      canvasActions.onSelect(id);
                      setMobilePanel(null);
                    },
                  }}
                  readOnly={!canBuildSections}
                  onAddSection={() => {
                    setMobilePanel(null);
                    setLibraryOpen(true);
                  }}
                  attentionReasons={attentionReasons}
                />
              ) : (
                <SectionInspector
                  section={selectedSection}
                  onChange={updateSelectedSection}
                  page={page}
                  projectId={project.id}
                  attentionReasons={attentionReasons}
                  onSelectSection={(id) => {
                    select(id);
                    setMobilePanel(null);
                  }}
                  onAddSection={
                    canBuildSections
                      ? () => {
                          setMobilePanel(null);
                          setLibraryOpen(true);
                        }
                      : undefined
                  }
                  onRevertSection={handleRevertSection}
                  onRestoreRemoval={(removalId) => restoreRemovedSection(project.id, removalId)}
                  onDismissRemoval={(removalId) => dismissRemoval(project.id, removalId)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {reviewingSuggestion && (
        <SuggestionDialog
          project={project}
          page={page}
          suggestion={reviewingSuggestion}
          authorName={
            members.find((m) => m.userId === reviewingSuggestion.createdById)?.name ??
            "The agency"
          }
          onClose={() => setReviewingSuggestion(null)}
        />
      )}

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
            // Anchor the pin as a fraction of the section it was dropped on, so
            // it tracks the design when the canvas scrolls or zooms.
            const el = contextMenu.sectionId
              ? document.querySelector(`[data-canvas-section="${contextMenu.sectionId}"]`)
              : null;
            const rect = el?.getBoundingClientRect();
            const fx = rect ? (contextMenu.x - rect.left) / rect.width : 0.5;
            const fy = rect ? (contextMenu.y - rect.top) / rect.height : 0.5;
            openComposer({
              pageId: page.id,
              sectionId: contextMenu.sectionId,
              anchorKey: `point:${fx.toFixed(4)}:${fy.toFixed(4)}`,
              anchorLabel: "Pinned canvas comment",
              position: { x: contextMenu.x, y: contextMenu.y },
            });
          }}
        />
      )}

      {commentMode && (() => {
        // Pins are position:fixed with a z-index above the editor chrome, so a
        // pin whose anchor scrolls under the toolbar would float on top of it.
        // Hide any pin that leaves the canvas viewport instead.
        const canvasBounds = document
          .querySelector("[data-editor-canvas]")
          ?.getBoundingClientRect();
        return pointComments.map((comment, index) => {
        const pos = anchorScreenPosition(comment);
        if (!pos) return null;
        if (
          canvasBounds &&
          (pos.y < canvasBounds.top + 4 ||
            pos.y > canvasBounds.bottom - 4 ||
            pos.x < canvasBounds.left ||
            pos.x > canvasBounds.right)
        )
          return null;
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
                position: pos,
              })
            }
            className="fixed z-[75] flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-[#f7d34e] text-[#5c4600] shadow-[0_4px_14px_rgb(0_0_0/0.22)] transition-transform hover:scale-110"
            style={{ left: pos.x, top: pos.y }}
          >
            <MessageCircle className="size-3.5" aria-hidden />
          </button>
        );
        });
      })()}

      {!isPreview && commentMode && <CanvasCommentPopover project={project} />}

      <CommandPalette
        project={project}
        page={page}
        onSelectPage={(pageId) =>
          router.replace(`/projects/${project.id}/editor?page=${pageId}`, { scroll: false })
        }
        onAddSection={() => setLibraryOpen(true)}
        onUndo={() => undo(project.id)}
        onRedo={() => redo(project.id)}
        canUndo={canUndo}
        canRedo={canRedo}
        canEdit={contentEditable}
      />

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
