"use client";

import { create } from "zustand";
import { versionRepository } from "@/lib/repositories/local-version-repository";
import type { ProjectVersion, VersionTrigger } from "@/types";

interface VersionsState {
  byProject: Record<string, ProjectVersion[]>;
  loaded: Record<string, boolean>;
  load: (projectId: string) => Promise<void>;
  refresh: (projectId: string) => Promise<void>;
  createVersion: (input: {
    projectId: string;
    label: string;
    description?: string;
    createdById: string;
    trigger: VersionTrigger;
    snapshot: ProjectVersion["snapshot"];
  }) => Promise<ProjectVersion>;
  renameVersion: (
    projectId: string,
    id: string,
    label: string,
    description?: string,
  ) => Promise<void>;
}

export const useVersionsStore = create<VersionsState>((set, get) => {
  async function refresh(projectId: string) {
    const versions = await versionRepository.getProjectVersions(projectId);
    set((s) => ({
      byProject: { ...s.byProject, [projectId]: versions },
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

    createVersion: async (input) => {
      const version = await versionRepository.createVersion(input);
      await refresh(input.projectId);
      return version;
    },

    renameVersion: async (projectId, id, label, description) => {
      await versionRepository.updateVersion(id, { label, description });
      await refresh(projectId);
    },
  };
});

// Stable reference — selectors must not fabricate a new array per call.
const NO_VERSIONS: ProjectVersion[] = [];

export function selectProjectVersions(
  state: VersionsState,
  projectId: string | undefined,
): ProjectVersion[] {
  if (!projectId) return NO_VERSIONS;
  return state.byProject[projectId] ?? NO_VERSIONS;
}
