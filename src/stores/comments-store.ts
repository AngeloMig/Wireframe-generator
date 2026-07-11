"use client";

import { create } from "zustand";
import { commentRepository } from "@/lib/repositories/local-comment-repository";
import type {
  CreateCommentInput,
  CreateReplyInput,
  ProjectComment,
} from "@/types";

/**
 * Client cache of collaboration comments, keyed by project. All persistence
 * flows through the CommentRepository abstraction.
 */

interface CommentsState {
  byProject: Record<string, ProjectComment[]>;
  loaded: Record<string, boolean>;
  load: (projectId: string) => Promise<void>;
  refresh: (projectId: string) => Promise<void>;
  createComment: (input: CreateCommentInput) => Promise<ProjectComment>;
  updateComment: (
    projectId: string,
    id: string,
    updates: Partial<ProjectComment>,
  ) => Promise<ProjectComment>;
  deleteComment: (projectId: string, id: string) => Promise<void>;
  addReply: (
    projectId: string,
    commentId: string,
    input: CreateReplyInput,
  ) => Promise<void>;
  resolveComment: (projectId: string, id: string, userId: string) => Promise<void>;
  reopenComment: (projectId: string, id: string) => Promise<void>;
}

export const useCommentsStore = create<CommentsState>((set, get) => {
  async function refresh(projectId: string) {
    const comments = await commentRepository.getProjectComments(projectId);
    set((s) => ({
      byProject: { ...s.byProject, [projectId]: comments },
      loaded: { ...s.loaded, [projectId]: true },
    }));
  }

  return {
    byProject: {},
    loaded: {},

    load: async (projectId) => {
      if (get().loaded[projectId]) return;
      await refresh(projectId);
    },

    refresh,

    createComment: async (input) => {
      const comment = await commentRepository.createComment(input);
      await refresh(input.projectId);
      return comment;
    },

    updateComment: async (projectId, id, updates) => {
      const updated = await commentRepository.updateComment(id, updates);
      await refresh(projectId);
      return updated;
    },

    deleteComment: async (projectId, id) => {
      await commentRepository.deleteComment(id);
      await refresh(projectId);
    },

    addReply: async (projectId, commentId, input) => {
      await commentRepository.addReply(commentId, input);
      await refresh(projectId);
    },

    resolveComment: async (projectId, id, userId) => {
      await commentRepository.resolveComment(id, userId);
      await refresh(projectId);
    },

    reopenComment: async (projectId, id) => {
      await commentRepository.reopenComment(id);
      await refresh(projectId);
    },
  };
});

// Stable reference — selectors must not fabricate a new array per call.
const NO_COMMENTS: ProjectComment[] = [];

/** All of a project's comments (empty until loaded). */
export function selectProjectComments(
  state: CommentsState,
  projectId: string | undefined,
): ProjectComment[] {
  if (!projectId) return NO_COMMENTS;
  return state.byProject[projectId] ?? NO_COMMENTS;
}
