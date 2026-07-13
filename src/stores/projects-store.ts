"use client";

import { create } from "zustand";
import { APP_CONFIG } from "@/config/app";
import { ALL_MOCK_USERS } from "@/data/users";
import { projectRepository } from "@/lib/repositories/local-project-repository";
import { memberRepository } from "@/lib/repositories/local-member-repository";
import { seedDemoData } from "@/lib/storage/seed";
import { isAgencyUser } from "@/types";
import type { CreateProjectInput, Project } from "@/types";
import { nowIso } from "@/utils/id";

/**
 * A brand-new project has no member records, which would leave it with no
 * agency team — so @mentions have no one to offer and notifyAgency reaches
 * nobody. Seed the owner plus the agency staff for the project's org so
 * collaboration works from the first moment.
 */
function pickRandom<T>(items: T[]): T | undefined {
  return items.length ? items[Math.floor(Math.random() * items.length)] : undefined;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function seedProjectMembers(project: Project): Promise<void> {
  const owner = ALL_MOCK_USERS.find((u) => u.id === project.ownerId);
  const agencyStaff = ALL_MOCK_USERS.filter(
    (u) => u.organization === project.organization && isAgencyUser(u.role),
  );
  // Randomize the assigned team so projects don't all share the same faces:
  // one PM plus two other agency people, drawn fresh at creation.
  const pm = pickRandom(agencyStaff.filter((u) => u.role === "agency-pm"));
  const others = shuffle(agencyStaff.filter((u) => u.role !== "agency-pm")).slice(0, 2);
  const team = [...(pm ? [pm] : []), ...others];
  const roster = [...(owner ? [owner] : []), ...team];
  let primaryAssigned = false;
  for (const person of roster) {
    const agency = isAgencyUser(person.role);
    const isPrimaryContact = agency && !primaryAssigned;
    if (isPrimaryContact) primaryAssigned = true;
    await memberRepository.addMember({
      projectId: project.id,
      userId: person.id,
      name: person.name,
      email: person.email,
      initials: person.initials,
      avatarColor: person.avatarColor,
      role: person.role,
      organization: agency ? person.organization : project.companyName,
      accessLevel: "edit",
      isPrimaryContact,
    });
  }
}

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
      await seedProjectMembers(project);
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
