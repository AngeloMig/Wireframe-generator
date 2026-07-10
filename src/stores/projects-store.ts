"use client";

import { create } from "zustand";
import { APP_CONFIG } from "@/config/app";
import { projectRepository } from "@/lib/repositories/local-project-repository";
import { seedDemoData } from "@/lib/storage/seed";
import type { CreateProjectInput, Project } from "@/types";
import { nowIso } from "@/utils/id";

export type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * Client cache of projects with optimistic updates and debounced
 * persistence through the ProjectRepository abstraction.
 */

interface ProjectsState {
  projects: Project[];
  hydrated: boolean;
  saveState: SaveState;
  hydrate: () => Promise<void>;
  createProject: (input: CreateProjectInput) => Promise<Project>;
  /** Apply an updater to a project, update state immediately, persist debounced. */
  updateProject: (
    id: string,
    updater: (project: Project) => Project,
    options?: { immediate?: boolean },
  ) => void;
  deleteProject: (id: string) => Promise<void>;
  resetDemoData: () => Promise<void>;
  flushPendingSaves: () => Promise<void>;
}

const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const useProjectsStore = create<ProjectsState>((set, get) => {
  async function persistProject(id: string) {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return;
    try {
      await projectRepository.updateProject(id, project);
      set({ saveState: "saved" });
    } catch {
      set({ saveState: "error" });
    }
  }

  return {
    projects: [],
    hydrated: false,
    saveState: "idle",

    hydrate: async () => {
      if (get().hydrated) return;
      const projects = await projectRepository.getProjects();
      set({ projects, hydrated: true });
    },

    createProject: async (input) => {
      const project = await projectRepository.createProject(input);
      set((s) => ({ projects: [project, ...s.projects] }));
      return project;
    },

    updateProject: (id, updater, options) => {
      const current = get().projects.find((p) => p.id === id);
      if (!current) return;
      const updated = { ...updater(current), updatedAt: nowIso() };
      set((s) => ({
        projects: s.projects.map((p) => (p.id === id ? updated : p)),
        saveState: "saving",
      }));

      const existing = saveTimers.get(id);
      if (existing) clearTimeout(existing);
      if (options?.immediate) {
        saveTimers.delete(id);
        void persistProject(id);
      } else {
        saveTimers.set(
          id,
          setTimeout(() => {
            saveTimers.delete(id);
            void persistProject(id);
          }, APP_CONFIG.autosaveDebounceMs),
        );
      }
    },

    deleteProject: async (id) => {
      const timer = saveTimers.get(id);
      if (timer) {
        clearTimeout(timer);
        saveTimers.delete(id);
      }
      await projectRepository.deleteProject(id);
      set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
    },

    resetDemoData: async () => {
      saveTimers.forEach((timer) => clearTimeout(timer));
      saveTimers.clear();
      const { projects } = seedDemoData();
      set({ projects, hydrated: true, saveState: "idle" });
    },

    flushPendingSaves: async () => {
      const ids = Array.from(saveTimers.keys());
      saveTimers.forEach((timer) => clearTimeout(timer));
      saveTimers.clear();
      await Promise.all(ids.map((id) => persistProject(id)));
    },
  };
});
