"use client";

import { create } from "zustand";
import type { CommentPriority, CommentStatus, CommentVisibility } from "@/types";

/**
 * Transient collaboration UI state — panel visibility, comment mode, filters,
 * version comparison picks. Nothing here persists.
 */

export type CommentQuickFilter =
  | "all"
  | "open"
  | "assigned-to-me"
  | "mentions"
  | "resolved"
  | "internal"
  | "action-items";

export type CommentSort =
  | "newest"
  | "oldest"
  | "priority"
  | "recently-updated"
  | "page-order";

export interface CommentFilters {
  status: CommentStatus | "all";
  priority: CommentPriority | "all";
  assigneeId: string | "all";
  authorId: string | "all";
  visibility: CommentVisibility | "all";
  /** Limit to the page currently open in the editor/review view. */
  currentPageOnly: boolean;
  currentSectionOnly: boolean;
}

export const DEFAULT_COMMENT_FILTERS: CommentFilters = {
  status: "all",
  priority: "all",
  assigneeId: "all",
  authorId: "all",
  visibility: "all",
  currentPageOnly: false,
  currentSectionOnly: false,
};

interface CollabUiState {
  panelOpen: boolean;
  commentMode: boolean;
  selectedCommentId: string | null;
  quickFilter: CommentQuickFilter;
  filters: CommentFilters;
  sort: CommentSort;
  /** Section id a composer should target (set by comment-mode clicks). */
  composerSectionId: string | null;
  composerPageId: string | null;
  composerAnchorKey: string | null;
  composerAnchorLabel: string | null;
  composerPosition: { x: number; y: number } | null;
  composerOpen: boolean;
  /** Version comparison picks. */
  compareFromId: string | null;
  compareToId: string | null;

  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  setCommentMode: (on: boolean) => void;
  selectComment: (id: string | null) => void;
  setQuickFilter: (filter: CommentQuickFilter) => void;
  setFilters: (filters: Partial<CommentFilters>) => void;
  resetFilters: () => void;
  setSort: (sort: CommentSort) => void;
  openComposer: (target: { pageId?: string | null; sectionId?: string | null; anchorKey?: string | null; anchorLabel?: string | null; position?: { x: number; y: number } | null }) => void;
  closeComposer: () => void;
  setCompare: (fromId: string | null, toId: string | null) => void;
}

export const useCollabUiStore = create<CollabUiState>((set) => ({
  panelOpen: false,
  commentMode: false,
  selectedCommentId: null,
  quickFilter: "all",
  filters: DEFAULT_COMMENT_FILTERS,
  sort: "newest",
  composerSectionId: null,
  composerPageId: null,
  composerAnchorKey: null,
  composerAnchorLabel: null,
  composerPosition: null,
  composerOpen: false,
  compareFromId: null,
  compareToId: null,

  setPanelOpen: (open) => set({ panelOpen: open }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  setCommentMode: (on) =>
    set({ commentMode: on, ...(on ? { panelOpen: true } : {}) }),
  selectComment: (id) => set({ selectedCommentId: id }),
  setQuickFilter: (filter) => set({ quickFilter: filter }),
  setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),
  resetFilters: () => set({ filters: DEFAULT_COMMENT_FILTERS, quickFilter: "all" }),
  setSort: (sort) => set({ sort }),
  openComposer: ({ pageId, sectionId, anchorKey, anchorLabel, position }) =>
    set({
      composerOpen: true,
      composerPageId: pageId ?? null,
      composerSectionId: sectionId ?? null,
      composerAnchorKey: anchorKey ?? null,
      composerAnchorLabel: anchorLabel ?? null,
      composerPosition: position ?? null,
      panelOpen: true,
    }),
  closeComposer: () =>
    set({ composerOpen: false, composerPageId: null, composerSectionId: null, composerAnchorKey: null, composerAnchorLabel: null, composerPosition: null }),
  setCompare: (fromId, toId) => set({ compareFromId: fromId, compareToId: toId }),
}));
