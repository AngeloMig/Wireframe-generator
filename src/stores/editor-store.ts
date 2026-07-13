"use client";

import { create } from "zustand";
import { normalizeSectionOrder } from "@/lib/sections";
import { withActivity } from "@/lib/project-utils";
import type { ActivityType, PageSection, PendingSectionRemoval } from "@/types";
import { createId, nowIso } from "@/utils/id";
import { useProjectsStore } from "./projects-store";
import { useSessionStore } from "./session-store";

export type DeviceKind = "desktop" | "tablet" | "mobile";
export type EditorMode = "wireframe" | "styled";
export type InspectorTab = "content" | "layout" | "style" | "notes";

export const DEVICE_WIDTHS: Record<DeviceKind, number> = {
  desktop: 1200,
  tablet: 768,
  mobile: 390,
};

export const ZOOM_MIN = 0.4;
export const ZOOM_MAX = 1.3;
export const ZOOM_STEP = 0.1;

const HISTORY_LIMIT = 50;
/** Content keystrokes within this window collapse into one history entry. */
const EDIT_COALESCE_MS = 1200;

interface ApplyOptions {
  /**
   * Identifies a stream of small edits (e.g. typing in one field) so they
   * coalesce into a single undo step instead of one per keystroke.
   */
  editKey?: string;
  activity?: { type: ActivityType; message: string };
}

/**
 * Temporary editor UI state. Persistent data (the sections themselves)
 * lives in the projects store; this store orchestrates edits so it can
 * keep per-page undo/redo history.
 */
interface EditorState {
  pageId: string | null;
  selectedSectionId: string | null;
  collapsedIds: string[];
  device: DeviceKind;
  mode: EditorMode;
  zoom: number;
  /** Zoom that fits the device width into the canvas, measured by the canvas. */
  fitZoom: number;
  /** True once the user zooms by hand — stops auto-following fitZoom. */
  hasManualZoom: boolean;
  inspectorTab: InspectorTab;
  isPreview: boolean;
  past: PageSection[][];
  future: PageSection[][];
  lastEditKey: string | null;
  lastEditAt: number;

  openPage: (pageId: string) => void;
  select: (sectionId: string | null, tab?: InspectorTab) => void;
  toggleCollapsed: (sectionId: string) => void;
  setDevice: (device: DeviceKind) => void;
  setMode: (mode: EditorMode) => void;
  setZoom: (zoom: number) => void;
  setFitZoom: (zoom: number) => void;
  setInspectorTab: (tab: InspectorTab) => void;
  setPreview: (isPreview: boolean) => void;

  applySections: (
    projectId: string,
    updater: (sections: PageSection[]) => PageSection[],
    options?: ApplyOptions,
  ) => void;
  undo: (projectId: string) => void;
  redo: (projectId: string) => void;
  /** Agency-side: bring a customer-removed section back onto the page. */
  restoreRemovedSection: (projectId: string, removalId: string) => void;
  /** Agency-side: dismiss a removal trace without restoring the section. */
  dismissRemoval: (projectId: string, removalId: string) => void;
}

function readSections(projectId: string, pageId: string | null): PageSection[] | null {
  if (!pageId) return null;
  const project = useProjectsStore.getState().projects.find((p) => p.id === projectId);
  const page = project?.pages.find((pg) => pg.id === pageId);
  return page ? page.sections : null;
}

/**
 * A section's content/design fields changed between two revisions (deep
 * comparison — updaters don't reliably preserve object identity on
 * untouched fields).
 */
function sectionContentChanged(before: PageSection, after: PageSection): boolean {
  return (
    before.variationId !== after.variationId ||
    JSON.stringify(before.content) !== JSON.stringify(after.content) ||
    JSON.stringify(before.layout) !== JSON.stringify(after.layout) ||
    JSON.stringify(before.style) !== JSON.stringify(after.style)
  );
}

const SKIP_REVIEW_FLAG_STATUSES = new Set(["content-needed", "image-needed", "agency-review-needed"]);

interface CustomerEditResult {
  sections: PageSection[];
  /** New removal traces for sections the customer just deleted. */
  removals: PendingSectionRemoval[];
}

/**
 * When a customer edits, adds, or removes a section on a project that's
 * already been submitted at least once:
 *  - edited/added sections flag as needing another look from the agency
 *    (protects previously reviewed/approved content from silently drifting
 *    out of sync with what the agency last saw), tagged with which kind of
 *    change it was so the UI can say "added" vs "edited";
 *  - removed sections leave a trace (full snapshot) instead of vanishing,
 *    so the agency can see what disappeared and restore it.
 */
function flagCustomerEdits(
  projectId: string,
  prev: PageSection[],
  next: PageSection[],
): CustomerEditResult {
  const user = useSessionStore.getState().user;
  if (user.role !== "customer") return { sections: next, removals: [] };
  const project = useProjectsStore.getState().projects.find((p) => p.id === projectId);
  if (!project || project.status === "draft" || project.status === "customer-editing") {
    return { sections: next, removals: [] };
  }

  const prevById = new Map(prev.map((section) => [section.id, section]));
  const nextIds = new Set(next.map((section) => section.id));
  let changed = false;
  const flagged = next.map((section) => {
    const before = prevById.get(section.id);
    const needsFlag = !before || sectionContentChanged(before, section);
    if (!needsFlag || SKIP_REVIEW_FLAG_STATUSES.has(section.reviewStatus)) return section;
    changed = true;
    return {
      ...section,
      reviewStatus: "agency-review-needed" as const,
      approvalLocked: false,
      pendingChange: before ? ("edited" as const) : ("added" as const),
    };
  });

  const removals: PendingSectionRemoval[] = prev
    .filter((section) => !nextIds.has(section.id))
    .map((section) => ({
      id: createId(),
      sectionId: section.id,
      removedAt: nowIso(),
      removedById: user.id,
      snapshot: section,
    }));

  return { sections: changed ? flagged : next, removals };
}

function writeSections(
  projectId: string,
  pageId: string,
  sections: PageSection[],
  activity?: ApplyOptions["activity"],
  newRemovals: PendingSectionRemoval[] = [],
) {
  const user = useSessionStore.getState().user;
  useProjectsStore.getState().updateProject(projectId, (project) => {
    const next = {
      ...project,
      pages: project.pages.map((page) =>
        page.id === pageId
          ? {
              ...page,
              // Nav pins to the top, footer to the bottom — enforced here at
              // the single write point so no drag/move/insert path can bypass it.
              sections: normalizeSectionOrder(sections).map((section, index) => ({
                ...section,
                order: index,
              })),
              pendingRemovals:
                newRemovals.length > 0
                  ? [...(page.pendingRemovals ?? []), ...newRemovals]
                  : page.pendingRemovals,
              status:
                page.status === "draft" && sections.length > 0
                  ? ("content-needed" as const)
                  : page.status,
              updatedAt: nowIso(),
            }
          : page,
      ),
      lastEditedAt: nowIso(),
    };
    return activity ? withActivity(next, activity.type, activity.message, user) : next;
  });
}

export const useEditorStore = create<EditorState>((set, get) => ({
  pageId: null,
  selectedSectionId: null,
  collapsedIds: [],
  device: "desktop",
  mode: "wireframe",
  zoom: 1,
  fitZoom: 1,
  hasManualZoom: false,
  inspectorTab: "content",
  isPreview: false,
  past: [],
  future: [],
  lastEditKey: null,
  lastEditAt: 0,

  openPage: (pageId) => {
    if (get().pageId === pageId) return;
    set({
      pageId,
      selectedSectionId: null,
      collapsedIds: [],
      past: [],
      future: [],
      lastEditKey: null,
      lastEditAt: 0,
    });
  },

  select: (sectionId, tab) =>
    set((s) => ({
      selectedSectionId: sectionId,
      inspectorTab: tab ?? (sectionId === s.selectedSectionId ? s.inspectorTab : "content"),
    })),

  toggleCollapsed: (sectionId) =>
    set((s) => ({
      collapsedIds: s.collapsedIds.includes(sectionId)
        ? s.collapsedIds.filter((id) => id !== sectionId)
        : [...s.collapsedIds, sectionId],
    })),

  setDevice: (device) => set({ device }),
  setMode: (mode) => set({ mode }),
  setZoom: (zoom) =>
    set((s) => ({
      zoom: Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom)),
      // Using the "fit" button re-enables auto-fit; hand zooming disables it.
      hasManualZoom: Math.abs(zoom - s.fitZoom) > 0.001,
    })),
  setFitZoom: (fitZoom) =>
    set((s) => ({
      fitZoom,
      // Follow the fitted width until the user picks a zoom themselves.
      ...(s.hasManualZoom ? {} : { zoom: Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, fitZoom)) }),
    })),
  setInspectorTab: (inspectorTab) => set({ inspectorTab }),
  setPreview: (isPreview) => set({ isPreview, ...(isPreview ? { selectedSectionId: null } : {}) }),

  applySections: (projectId, updater, options) => {
    const { pageId, past, lastEditKey, lastEditAt } = get();
    if (!pageId) return;
    const current = readSections(projectId, pageId);
    if (!current) return;
    const updated = updater(current);
    if (updated === current) return;
    const { sections: next, removals } = flagCustomerEdits(projectId, current, updated);

    const now = Date.now();
    const coalesce =
      options?.editKey !== undefined &&
      options.editKey === lastEditKey &&
      now - lastEditAt < EDIT_COALESCE_MS;

    set({
      past: coalesce ? past : [...past.slice(-HISTORY_LIMIT + 1), current],
      future: [],
      lastEditKey: options?.editKey ?? null,
      lastEditAt: now,
    });
    writeSections(projectId, pageId, next, options?.activity, removals);
  },

  undo: (projectId) => {
    const { pageId, past, future } = get();
    if (!pageId || past.length === 0) return;
    const current = readSections(projectId, pageId);
    if (!current) return;
    const previous = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      future: [...future, current],
      lastEditKey: null,
      selectedSectionId: null,
    });
    writeSections(projectId, pageId, previous);
  },

  redo: (projectId) => {
    const { pageId, past, future } = get();
    if (!pageId || future.length === 0) return;
    const current = readSections(projectId, pageId);
    if (!current) return;
    const next = future[future.length - 1];
    set({
      past: [...past, current],
      future: future.slice(0, -1),
      lastEditKey: null,
      selectedSectionId: null,
    });
    writeSections(projectId, pageId, next);
  },

  restoreRemovedSection: (projectId, removalId) => {
    const { pageId } = get();
    if (!pageId) return;
    useProjectsStore.getState().updateProject(projectId, (project) => ({
      ...project,
      pages: project.pages.map((page) => {
        if (page.id !== pageId) return page;
        const removal = (page.pendingRemovals ?? []).find((r) => r.id === removalId);
        if (!removal) return page;
        const restored: PageSection = { ...removal.snapshot, order: page.sections.length };
        return {
          ...page,
          sections: normalizeSectionOrder([...page.sections, restored]).map((section, index) => ({
            ...section,
            order: index,
          })),
          pendingRemovals: (page.pendingRemovals ?? []).filter((r) => r.id !== removalId),
          updatedAt: nowIso(),
        };
      }),
      lastEditedAt: nowIso(),
    }));
  },

  dismissRemoval: (projectId, removalId) => {
    const { pageId } = get();
    if (!pageId) return;
    useProjectsStore.getState().updateProject(projectId, (project) => ({
      ...project,
      pages: project.pages.map((page) =>
        page.id === pageId
          ? { ...page, pendingRemovals: (page.pendingRemovals ?? []).filter((r) => r.id !== removalId) }
          : page,
      ),
    }));
  },
}));
