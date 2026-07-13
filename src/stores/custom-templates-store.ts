"use client";

import { create } from "zustand";
import { readJson, STORAGE_KEYS, writeJson } from "@/lib/storage/local-storage";
import { createId, nowIso } from "@/utils/id";
import type { PageSection, PageTemplate, PageType, VisualStyle, WebsiteGoal } from "@/types";

/**
 * Templates the user saves from their own built pages. Kept separate from the
 * built-in PAGE_TEMPLATES and merged for display, so the static library and the
 * user's growing one never collide.
 */

export interface SaveTemplateInput {
  name: string;
  description: string;
  pageType: PageType;
  industries: string[];
  goals: WebsiteGoal[];
  styles: VisualStyle[];
  /** The live page sections to freeze into the template. */
  sections: PageSection[];
}

interface CustomTemplatesState {
  templates: PageTemplate[];
  hydrated: boolean;
  hydrate: () => void;
  addTemplate: (input: SaveTemplateInput) => PageTemplate;
  removeTemplate: (id: string) => void;
}

/** Freeze a page's live sections into reusable template section entries. */
function toTemplateSections(sections: PageSection[]): PageTemplate["sections"] {
  return [...sections]
    .sort((a, b) => a.order - b.order)
    .map((section) => ({
      variationId: section.variationId,
      contentOverrides: structuredClone(section.content),
      layoutOverrides: structuredClone(section.layout),
      styleOverrides: structuredClone(section.style),
    }));
}

export const useCustomTemplatesStore = create<CustomTemplatesState>((set, get) => ({
  templates: [],
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    const stored = readJson<PageTemplate[]>(STORAGE_KEYS.customTemplates, []);
    set({ templates: Array.isArray(stored) ? stored : [], hydrated: true });
  },
  addTemplate: (input) => {
    const now = nowIso();
    const template: PageTemplate = {
      id: `user-tpl-${createId()}`,
      name: input.name,
      description: input.description,
      pageType: input.pageType,
      industries: input.industries,
      goals: input.goals,
      styles: input.styles,
      sections: toTemplateSections(input.sections),
      isActive: true,
      isCustom: true,
      createdAt: now,
      updatedAt: now,
    };
    const next = [template, ...get().templates];
    writeJson(STORAGE_KEYS.customTemplates, next);
    set({ templates: next });
    return template;
  },
  removeTemplate: (id) => {
    const next = get().templates.filter((template) => template.id !== id);
    writeJson(STORAGE_KEYS.customTemplates, next);
    set({ templates: next });
  },
}));
