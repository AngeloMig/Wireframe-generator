"use client";

import { create } from "zustand";
import { readJson, STORAGE_KEYS, writeJson } from "@/lib/storage/local-storage";
import { createId, nowIso } from "@/utils/id";
import type { PageSection, SectionType } from "@/types";

/**
 * Sections the team saves from live pages as reusable patterns. A saved
 * section is a full snapshot (content + layout + style), so inserting one
 * reproduces the section exactly; the variationId still points at the
 * built-in design it was based on, which keeps rendering and design
 * swapping working.
 */

export interface SavedSection {
  id: string;
  name: string;
  sectionType: SectionType;
  variationId: string;
  snapshot: PageSection;
  createdAt: string;
}

interface CustomSectionsState {
  sections: SavedSection[];
  hydrated: boolean;
  hydrate: () => void;
  addSection: (name: string, section: PageSection) => SavedSection;
  removeSection: (id: string) => void;
}

export const useCustomSectionsStore = create<CustomSectionsState>((set, get) => ({
  sections: [],
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    const stored = readJson<SavedSection[]>(STORAGE_KEYS.customSections, []);
    set({ sections: Array.isArray(stored) ? stored : [], hydrated: true });
  },
  addSection: (name, section) => {
    const snapshot = structuredClone(section);
    // The snapshot is a template, not a live page member: strip per-page state
    // so an inserted copy always starts clean.
    snapshot.isHidden = false;
    snapshot.isLocked = false;
    snapshot.approvalLocked = false;
    const saved: SavedSection = {
      id: `user-sec-${createId()}`,
      name,
      sectionType: section.sectionType,
      variationId: section.variationId,
      snapshot,
      createdAt: nowIso(),
    };
    const next = [saved, ...get().sections];
    writeJson(STORAGE_KEYS.customSections, next);
    set({ sections: next });
    return saved;
  },
  removeSection: (id) => {
    const next = get().sections.filter((section) => section.id !== id);
    writeJson(STORAGE_KEYS.customSections, next);
    set({ sections: next });
  },
}));
