"use client";

import { create } from "zustand";
import { suggestionRepository } from "@/lib/repositories/local-suggestion-repository";
import type { SectionVariationSuggestion } from "@/types";

interface SuggestionsState {
  byProject: Record<string, SectionVariationSuggestion[]>;
  loaded: Record<string, boolean>;
  load: (projectId: string) => Promise<void>;
  refresh: (projectId: string) => Promise<void>;
  createSuggestion: (
    input: Omit<SectionVariationSuggestion, "id" | "createdAt" | "status">,
  ) => Promise<SectionVariationSuggestion>;
  respondToSuggestion: (
    projectId: string,
    id: string,
    response: {
      status: "accepted" | "declined";
      respondedById: string;
      responseMessage?: string;
    },
  ) => Promise<void>;
}

export const useSuggestionsStore = create<SuggestionsState>((set, get) => {
  async function refresh(projectId: string) {
    const suggestions = await suggestionRepository.getProjectSuggestions(projectId);
    set((s) => ({
      byProject: { ...s.byProject, [projectId]: suggestions },
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

    createSuggestion: async (input) => {
      const suggestion = await suggestionRepository.createSuggestion(input);
      await refresh(input.projectId);
      return suggestion;
    },

    respondToSuggestion: async (projectId, id, response) => {
      await suggestionRepository.respondToSuggestion(id, response);
      await refresh(projectId);
    },
  };
});

// Stable reference — selectors must not fabricate a new array per call.
const NO_SUGGESTIONS: SectionVariationSuggestion[] = [];

export function selectProjectSuggestions(
  state: SuggestionsState,
  projectId: string | undefined,
): SectionVariationSuggestion[] {
  if (!projectId) return NO_SUGGESTIONS;
  return state.byProject[projectId] ?? NO_SUGGESTIONS;
}
