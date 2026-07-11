import type { SectionVariationSuggestion } from "@/types";
import { createId, nowIso } from "@/utils/id";
import { STORAGE_KEYS } from "../storage/local-storage";
import { readCollection, writeCollection } from "./local-collection";
import type { SuggestionRepository } from "./types";

export class LocalSuggestionRepository implements SuggestionRepository {
  private read(): SectionVariationSuggestion[] {
    return readCollection<SectionVariationSuggestion>(STORAGE_KEYS.suggestions);
  }

  async getProjectSuggestions(
    projectId: string,
  ): Promise<SectionVariationSuggestion[]> {
    return this.read().filter((s) => s.projectId === projectId);
  }

  async createSuggestion(
    input: Omit<SectionVariationSuggestion, "id" | "createdAt" | "status">,
  ): Promise<SectionVariationSuggestion> {
    const suggestion: SectionVariationSuggestion = {
      ...input,
      id: createId(),
      status: "pending",
      createdAt: nowIso(),
    };
    const suggestions = this.read();
    suggestions.push(suggestion);
    writeCollection(STORAGE_KEYS.suggestions, suggestions);
    return suggestion;
  }

  async respondToSuggestion(
    id: string,
    response: {
      status: "accepted" | "declined";
      respondedById: string;
      responseMessage?: string;
    },
  ): Promise<SectionVariationSuggestion> {
    const suggestions = this.read();
    const index = suggestions.findIndex((s) => s.id === id);
    if (index === -1) throw new Error("Suggestion not found.");
    suggestions[index] = {
      ...suggestions[index],
      status: response.status,
      respondedById: response.respondedById,
      responseMessage: response.responseMessage,
      respondedAt: nowIso(),
    };
    writeCollection(STORAGE_KEYS.suggestions, suggestions);
    return suggestions[index];
  }
}

export const suggestionRepository: LocalSuggestionRepository =
  new LocalSuggestionRepository();
