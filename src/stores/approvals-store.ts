"use client";

import { create } from "zustand";
import { approvalRepository } from "@/lib/repositories/local-approval-repository";
import type { ApprovalRecord } from "@/types";

interface ApprovalsState {
  byProject: Record<string, ApprovalRecord[]>;
  loaded: Record<string, boolean>;
  load: (projectId: string) => Promise<void>;
  refresh: (projectId: string) => Promise<void>;
  addApproval: (
    input: Omit<ApprovalRecord, "id" | "approvedAt">,
  ) => Promise<ApprovalRecord>;
  revokeApproval: (
    projectId: string,
    id: string,
    revokedById: string,
    reason: string,
  ) => Promise<void>;
}

export const useApprovalsStore = create<ApprovalsState>((set, get) => {
  async function refresh(projectId: string) {
    const approvals = await approvalRepository.getProjectApprovals(projectId);
    set((s) => ({
      byProject: { ...s.byProject, [projectId]: approvals },
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

    addApproval: async (input) => {
      const approval = await approvalRepository.addApproval(input);
      await refresh(input.projectId);
      return approval;
    },

    revokeApproval: async (projectId, id, revokedById, reason) => {
      await approvalRepository.revokeApproval(id, revokedById, reason);
      await refresh(projectId);
    },
  };
});

// Stable reference — selectors must not fabricate a new array per call.
const NO_APPROVALS: ApprovalRecord[] = [];

export function selectProjectApprovals(
  state: ApprovalsState,
  projectId: string | undefined,
): ApprovalRecord[] {
  if (!projectId) return NO_APPROVALS;
  return state.byProject[projectId] ?? NO_APPROVALS;
}

/** The active (non-revoked) approval for a scope target, if any. */
export function activeApprovalFor(
  approvals: ApprovalRecord[],
  target: { scope: "section"; sectionId: string } | { scope: "page"; pageId: string } | { scope: "project" },
): ApprovalRecord | undefined {
  return approvals.find((a) => {
    if (a.revokedAt) return false;
    if (a.scope !== target.scope) return false;
    if (target.scope === "section") return a.sectionId === target.sectionId;
    if (target.scope === "page") return a.pageId === target.pageId;
    return true;
  });
}
