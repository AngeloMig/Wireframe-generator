"use client";

import { create } from "zustand";
import { readJson, STORAGE_KEYS, writeJson } from "@/lib/storage/local-storage";

/** Locally persisted favorite section designs (variation ids). */
interface FavoritesState {
  favoriteIds: string[];
  hydrated: boolean;
  hydrate: () => void;
  toggleFavorite: (variationId: string) => void;
  isFavorite: (variationId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favoriteIds: [],
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const stored = readJson<string[]>(STORAGE_KEYS.favoriteVariations, []);
    set({ favoriteIds: Array.isArray(stored) ? stored : [], hydrated: true });
  },

  toggleFavorite: (variationId) => {
    const current = get().favoriteIds;
    const next = current.includes(variationId)
      ? current.filter((id) => id !== variationId)
      : [...current, variationId];
    writeJson(STORAGE_KEYS.favoriteVariations, next);
    set({ favoriteIds: next });
  },

  isFavorite: (variationId) => get().favoriteIds.includes(variationId),
}));
