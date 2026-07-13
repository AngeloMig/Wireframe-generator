import { isAgencyUser } from "@/types";
import type { ProjectStatus, UserRole } from "@/types";

/**
 * The project journey as five visible stages. Statuses map onto stages so the
 * shell stepper, the overview's Next Step, and the per-page context strips all
 * tell the same story about where a project is.
 */

export type ProjectStage = "drafting" | "review" | "revisions" | "approval" | "approved";

const STAGE_OF_STATUS: Record<ProjectStatus, ProjectStage | null> = {
  draft: "drafting",
  "customer-editing": "drafting",
  "ready-for-review": "review",
  "agency-reviewing": "review",
  "revisions-requested": "revisions",
  "customer-revising": "revisions",
  "awaiting-approval": "approval",
  "partially-approved": "approval",
  approved: "approved",
  "in-development": "approved",
  completed: "approved",
  archived: null,
};

export function stageOf(status: ProjectStatus): ProjectStage | null {
  return STAGE_OF_STATUS[status];
}

export interface StageStep {
  id: ProjectStage;
  label: string;
  /** Where clicking this stage lands, per viewer role. */
  href: (projectId: string, role: UserRole) => string;
}

export const PROJECT_STAGE_STEPS: StageStep[] = [
  {
    id: "drafting",
    label: "Drafting",
    href: (id, role) =>
      isAgencyUser(role) ? `/projects/${id}/overview` : `/projects/${id}/editor`,
  },
  {
    id: "review",
    label: "Review",
    href: (id, role) =>
      isAgencyUser(role) ? `/projects/${id}/agency-review` : `/projects/${id}/review`,
  },
  {
    id: "revisions",
    label: "Revisions",
    href: (id, role) =>
      isAgencyUser(role) ? `/projects/${id}/agency-review` : `/projects/${id}/revisions`,
  },
  {
    id: "approval",
    label: "Approval",
    href: (id) => `/projects/${id}/review`,
  },
  {
    id: "approved",
    label: "Handoff",
    href: (id, role) =>
      isAgencyUser(role) ? `/projects/${id}/handoff` : `/projects/${id}/review`,
  },
];

/** Index of the project's current stage in PROJECT_STAGE_STEPS; -1 = archived. */
export function stageIndexOf(status: ProjectStatus): number {
  const stage = stageOf(status);
  return stage ? PROJECT_STAGE_STEPS.findIndex((step) => step.id === stage) : -1;
}
