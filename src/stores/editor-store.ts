"use client";

import { create } from "zustand";
import { withActivity } from "@/lib/project-utils";
import type { ActivityType, PageSection } from "@/types";
import { nowIso } from "@/utils/id";
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
}

function readSections(projectId: string, pageId: string | null): PageSection[] | null {
  if (!pageId) return null;
  const project = useProjectsStore.getState().projects.find((p) => p.id === projectId);
  const page = project?.pages.find((pg) => pg.id === pageId);
  return page ? page.sections : null;
}

function writeSections(
  projectId: string,
  pageId: string,
  sections: PageSection[],
  activity?: ApplyOptions["activity"],
) {
  const user = useSessionStore.getState().user;
  useProjectsStore.getState().updateProject(projectId, (project) => {
    const next = {
      ...project,
      pages: project.pages.map((page) =>
        page.id === pageId
          ? {
              ...page,
              sections: sections.map((section, index) => ({ ...section, order: index })),
              status:
                page.status === "draft" && sections.length > 0
                  ? ("in-progress" as const)
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
  setZoom: (zoom) => set({ zoom: Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom)) }),
  setFitZoom: (fitZoom) => set({ fitZoom }),
  setInspectorTab: (inspectorTab) => set({ inspectorTab }),
  setPreview: (isPreview) => set({ isPreview, ...(isPreview ? { selectedSectionId: null } : {}) }),

  applySections: (projectId, updater, options) => {
    const { pageId, past, lastEditKey, lastEditAt } = get();
    if (!pageId) return;
    const current = readSections(projectId, pageId);
    if (!current) return;
    const next = updater(current);
    if (next === current) return;

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
    writeSections(projectId, pageId, next, options?.activity);
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
}));
