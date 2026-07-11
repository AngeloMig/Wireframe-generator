"use client";

import { create } from "zustand";
import { memberRepository } from "@/lib/repositories/local-member-repository";
import type { ProjectMember } from "@/types";

interface MembersState {
  byProject: Record<string, ProjectMember[]>;
  loaded: Record<string, boolean>;
  load: (projectId: string) => Promise<void>;
  refresh: (projectId: string) => Promise<void>;
  addMember: (
    input: Omit<ProjectMember, "id" | "addedAt" | "status">,
  ) => Promise<ProjectMember>;
  updateMember: (
    projectId: string,
    id: string,
    updates: Partial<ProjectMember>,
  ) => Promise<void>;
  removeMember: (projectId: string, id: string) => Promise<void>;
  setPrimaryContact: (projectId: string, memberId: string) => Promise<void>;
}

export const useMembersStore = create<MembersState>((set, get) => {
  async function refresh(projectId: string) {
    const members = await memberRepository.getProjectMembers(projectId);
    set((s) => ({
      byProject: { ...s.byProject, [projectId]: members },
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

    addMember: async (input) => {
      const created = await memberRepository.addMember(input);
      await refresh(input.projectId);
      return created;
    },

    updateMember: async (projectId, id, updates) => {
      await memberRepository.updateMember(id, updates);
      await refresh(projectId);
    },

    removeMember: async (projectId, id) => {
      await memberRepository.removeMember(id);
      await refresh(projectId);
    },

    setPrimaryContact: async (projectId, memberId) => {
      const members = get().byProject[projectId] ?? [];
      for (const m of members) {
        if (m.isPrimaryContact && m.id !== memberId) {
          await memberRepository.updateMember(m.id, { isPrimaryContact: false });
        }
      }
      await memberRepository.updateMember(memberId, { isPrimaryContact: true });
      await refresh(projectId);
    },
  };
});

// Stable reference — selectors must not fabricate a new array per call.
const NO_MEMBERS: ProjectMember[] = [];

export function selectProjectMembers(
  state: MembersState,
  projectId: string | undefined,
): ProjectMember[] {
  if (!projectId) return NO_MEMBERS;
  return state.byProject[projectId] ?? NO_MEMBERS;
}
