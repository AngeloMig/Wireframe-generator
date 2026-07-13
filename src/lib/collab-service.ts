import { getVariation } from "@/data/section-variations";
import { switchSectionVariation } from "@/lib/sections";
import { withActivity } from "@/lib/project-utils";
import { nowIso } from "@/utils/id";
import { notificationRepository } from "@/lib/repositories/local-notification-repository";
import { revisionRequestRepository } from "@/lib/repositories/local-revision-repository";
import { versionRepository } from "@/lib/repositories/local-version-repository";
import { useApprovalsStore } from "@/stores/approvals-store";
import { useCommentsStore } from "@/stores/comments-store";
import { useMembersStore } from "@/stores/members-store";
import { useNotificationsStore } from "@/stores/notifications-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useSuggestionsStore } from "@/stores/suggestions-store";
import { useVersionsStore } from "@/stores/versions-store";
import { isAgencyUser } from "@/types";
import type {
  ActivityType,
  AppNotification,
  AppUser,
  CommentPriority,
  CommentVisibility,
  PageSection,
  PageStatus,
  Project,
  ProjectPage,
  ProjectSnapshot,
  ProjectVersion,
  RevisionRequest,
  SectionVariationSuggestion,
  UserRole,
  VersionTrigger,
} from "@/types";

/**
 * Collaboration workflows: every multi-step review/version/approval action
 * lives here so pages and panels stay thin and the rules stay in one place.
 * All persistence still flows through stores → repositories.
 */

type Actor = Pick<AppUser, "id" | "name" | "role">;

// ---------------------------------------------------------------------------
// Snapshots + versions
// ---------------------------------------------------------------------------

export function snapshotOf(project: Project): ProjectSnapshot {
  return {
    name: project.name,
    companyName: project.companyName,
    websiteType: project.websiteType,
    status: project.status,
    questionnaire: structuredClone(project.questionnaire),
    pages: structuredClone(project.pages),
  };
}

export async function createVersion(
  project: Project,
  input: {
    label: string;
    description?: string;
    trigger: VersionTrigger;
    createdById: string;
  },
): Promise<ProjectVersion> {
  return useVersionsStore.getState().createVersion({
    projectId: project.id,
    label: input.label,
    description: input.description,
    createdById: input.createdById,
    trigger: input.trigger,
    snapshot: snapshotOf(project),
  });
}

/**
 * The most recent version snapshot where this section was approved (or
 * technically reviewed) — used to revert a section that a customer edited
 * after it had already been signed off. Returns null when no such snapshot
 * exists (e.g. a section the customer added that was never part of an
 * approved version) — the caller should offer removing it instead.
 */
export async function findLastApprovedSection(
  projectId: string,
  pageId: string,
  sectionId: string,
): Promise<PageSection | null> {
  const versions = await versionRepository.getProjectVersions(projectId);
  for (const version of versions) {
    const page = version.snapshot.pages.find((p) => p.id === pageId);
    const section = page?.sections.find((s) => s.id === sectionId);
    if (section && (section.reviewStatus === "approved" || section.reviewStatus === "technically-reviewed")) {
      return section;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

type NotificationInput = Omit<AppNotification, "id" | "createdAt" | "isRead" | "userId">;

/** Notify a set of users (deduplicated, excluding the actor). */
export async function notifyUsers(
  userIds: string[],
  actorId: string,
  input: NotificationInput,
): Promise<void> {
  const targets = [...new Set(userIds)].filter((id) => id && id !== actorId);
  for (const userId of targets) {
    await notificationRepository.addNotification({ ...input, userId });
  }
  await useNotificationsStore.getState().refresh();
}

/** All member userIds on a project matching a role group. */
export async function memberIdsByRole(
  projectId: string,
  match: (role: UserRole) => boolean,
): Promise<string[]> {
  await useMembersStore.getState().load(projectId);
  // Re-read AFTER load — the pre-load snapshot would be stale.
  const members = useMembersStore.getState().byProject[projectId] ?? [];
  return members.filter((m) => match(m.role)).map((m) => m.userId);
}

export async function notifyAgency(
  project: Project,
  actorId: string,
  input: NotificationInput,
): Promise<void> {
  const agencyIds = await memberIdsByRole(project.id, (r) => r !== "customer");
  await notifyUsers(agencyIds, actorId, input);
}

export async function notifyCustomer(
  project: Project,
  actorId: string,
  input: NotificationInput,
): Promise<void> {
  const customerIds = await memberIdsByRole(project.id, (r) => r === "customer");
  // Always include the owner even if the members list is incomplete.
  await notifyUsers([...customerIds, project.ownerId], actorId, input);
}

/**
 * Notify the OTHER side when a new top-level comment is posted, so a plain
 * comment (no @mention, no assignee) still reaches someone. Every comment
 * entry point should call this — routing lives here so no caller can forget it.
 */
export async function notifyNewComment(
  project: Project,
  actor: Actor,
  comment: {
    visibility: CommentVisibility;
    message: string;
    pageId?: string;
    sectionId?: string;
  },
): Promise<void> {
  const fromAgency = isAgencyUser(actor.role);
  const notice: NotificationInput = {
    projectId: project.id,
    pageId: comment.pageId,
    sectionId: comment.sectionId,
    type: "general",
    title: fromAgency ? "New comment from the agency" : "New comment",
    message: `${actor.name} commented on “${project.name}”: ${comment.message.slice(0, 80)}`,
    actionUrl: `/projects/${project.id}/overview`,
  };
  // Customer → agency; agency customer-visible → customer; agency-only → team.
  if (!fromAgency || comment.visibility === "agency") {
    await notifyAgency(project, actor.id, notice);
  } else {
    await notifyCustomer(project, actor.id, notice);
  }
}

/**
 * Tell the agency the customer is editing the blueprint. Meant to be throttled
 * by the caller (one leading-edge ping per cooldown window) so a burst of edits
 * doesn't turn into a burst of notifications. Unlike other notifications, this
 * one recurs for the same ongoing situation, so it upserts (refreshing an
 * existing unread "Customer is editing" row) instead of stacking a new one
 * every cooldown window.
 */
export async function notifyCustomerEditing(project: Project, actor: Actor): Promise<void> {
  const agencyIds = (await memberIdsByRole(project.id, (r) => r !== "customer")).filter(
    (id) => id !== actor.id,
  );
  const notice: NotificationInput = {
    projectId: project.id,
    type: "general",
    title: "Customer is editing",
    message: `${actor.name} is making changes to “${project.name}”.`,
    actionUrl: `/projects/${project.id}/overview`,
  };
  for (const userId of new Set(agencyIds)) {
    await notificationRepository.upsertNotification({ ...notice, userId });
  }
  await useNotificationsStore.getState().refresh();
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function updateProject(
  projectId: string,
  updater: (p: Project) => Project,
): void {
  useProjectsStore.getState().updateProject(projectId, updater, { immediate: true });
}

function logActivity(
  project: Project,
  type: ActivityType,
  message: string,
  actor: Actor,
  refs?: { pageId?: string; sectionId?: string },
): Project {
  const withEntry = withActivity(project, type, message, actor);
  if (refs && withEntry.activity.length > 0) {
    withEntry.activity[0] = { ...withEntry.activity[0], ...refs };
  }
  return withEntry;
}

function setPageStatus(project: Project, pageIds: string[], status: PageStatus): Project {
  const ids = new Set(pageIds);
  return {
    ...project,
    pages: project.pages.map((p) => (ids.has(p.id) ? { ...p, status } : p)),
  };
}

// ---------------------------------------------------------------------------
// Review submission
// ---------------------------------------------------------------------------

export async function submitForReview(
  project: Project,
  actor: Actor,
  options: { note?: string; pageIds?: string[] },
): Promise<void> {
  const submittedPages = options.pageIds?.length
    ? options.pageIds
    : project.pages.map((p) => p.id);

  // Snapshot BEFORE status changes so the version captures what was submitted.
  const version = await createVersion(project, {
    label: "Submitted for agency review",
    description: options.note,
    trigger: "review-submission",
    createdById: actor.id,
  });

  updateProject(project.id, (p) => {
    let next = setPageStatus(p, submittedPages, "ready-for-review");
    next = {
      ...next,
      status: "ready-for-review",
      latestSubmissionNote: options.note ?? "",
    };
    return logActivity(
      next,
      "project-submitted",
      `Blueprint submitted for agency review (version ${version.versionNumber})`,
      actor,
    );
  });

  await notifyAgency(project, actor.id, {
    projectId: project.id,
    type: "review-submitted",
    title: "Ready for review",
    message: `“${project.name}” was submitted for agency review.`,
    actionUrl: `/projects/${project.id}/agency-review`,
  });
}

export async function startAgencyReview(project: Project, actor: Actor): Promise<void> {
  updateProject(project.id, (p) => {
    let next: Project = { ...p, status: "agency-reviewing" };
    next = {
      ...next,
      pages: next.pages.map((page) =>
        page.status === "ready-for-review" ? { ...page, status: "in-review" } : page,
      ),
    };
    return logActivity(next, "status-changed", "Agency review started", actor);
  });
}

// ---------------------------------------------------------------------------
// Revision workflow
// ---------------------------------------------------------------------------

export async function fetchRevisionRequests(projectId: string): Promise<RevisionRequest[]> {
  return revisionRequestRepository.getProjectRevisionRequests(projectId);
}

export async function requestRevisions(
  project: Project,
  actor: Actor,
  input: {
    summary: string;
    message: string;
    pageIds: string[];
    sectionIds: string[];
    priority?: CommentPriority;
    dueDate?: string;
    /** Requested actions — each becomes an action item assigned to the customer. */
    actionItems?: string[];
  },
): Promise<void> {
  const version = await createVersion(project, {
    label: `Revisions requested: ${input.summary}`,
    description: input.message,
    trigger: "revision-request",
    createdById: actor.id,
  });

  await revisionRequestRepository.createRevisionRequest({
    projectId: project.id,
    summary: input.summary,
    message: input.message,
    pageIds: input.pageIds,
    sectionIds: input.sectionIds,
    priority: input.priority ?? "normal",
    dueDate: input.dueDate,
    createdById: actor.id,
  });

  for (const item of input.actionItems ?? []) {
    if (!item.trim()) continue;
    await useCommentsStore.getState().createComment({
      projectId: project.id,
      scope: "project",
      visibility: "customer",
      authorId: actor.id,
      assignedToId: project.ownerId,
      message: item.trim(),
      mentions: [],
      priority: input.priority ?? "normal",
      isActionItem: true,
      dueDate: input.dueDate,
    });
  }

  updateProject(project.id, (p) => {
    let next = setPageStatus(p, input.pageIds, "revisions-requested");
    const sectionIds = new Set(input.sectionIds);
    next = {
      ...next,
      status: "revisions-requested",
      latestSubmissionNote: input.message,
      pages: next.pages.map((page) => ({
        ...page,
        sections: page.sections.map((s) =>
          sectionIds.has(s.id) ? { ...s, reviewStatus: "revisions-requested" } : s,
        ),
      })),
    };
    return logActivity(
      next,
      "revisions-requested",
      `Revisions requested: ${input.summary} (version ${version.versionNumber})`,
      actor,
    );
  });

  await notifyCustomer(project, actor.id, {
    projectId: project.id,
    type: "revisions-requested",
    title: "Revisions requested",
    message: `${actor.name} requested revisions on “${project.name}”: ${input.summary}`,
    actionUrl: `/projects/${project.id}/revisions`,
  });
}

export async function submitRevisions(
  project: Project,
  actor: Actor,
  note?: string,
): Promise<void> {
  const version = await createVersion(project, {
    label: "Revisions submitted",
    description: note,
    trigger: "revision-submission",
    createdById: actor.id,
  });

  // Close out the open revision request, keeping the record for history.
  const requests = await revisionRequestRepository.getProjectRevisionRequests(project.id);
  const openRequest = requests.find((r) => !r.submittedAt);
  if (openRequest) {
    await revisionRequestRepository.updateRevisionRequest(openRequest.id, {
      submittedAt: nowIso(),
      submittedById: actor.id,
      submissionNote: note,
    });
  }

  updateProject(project.id, (p) => {
    let next: Project = {
      ...p,
      status: "ready-for-review",
      latestSubmissionNote: note ?? "",
      pages: p.pages.map((page) =>
        page.status === "revisions-requested" || page.status === "customer-revising"
          ? { ...page, status: "ready-for-review" }
          : page,
      ),
    };
    next = {
      ...next,
      pages: next.pages.map((page) => ({
        ...page,
        sections: page.sections.map((s) =>
          s.reviewStatus === "revisions-requested"
            ? { ...s, reviewStatus: "agency-review-needed" }
            : s,
        ),
      })),
    };
    return logActivity(
      next,
      "revisions-submitted",
      `Revisions submitted for review (version ${version.versionNumber})`,
      actor,
    );
  });

  await notifyAgency(project, actor.id, {
    projectId: project.id,
    type: "revisions-submitted",
    title: "Revisions submitted",
    message: `${actor.name} submitted revisions on “${project.name}”.`,
    actionUrl: `/projects/${project.id}/agency-review`,
  });
}

// ---------------------------------------------------------------------------
// Approval flow
// ---------------------------------------------------------------------------

async function latestVersionId(project: Project): Promise<string> {
  await useVersionsStore.getState().refresh(project.id);
  // Re-read AFTER refresh — the pre-refresh snapshot would be stale.
  const versions = useVersionsStore.getState().byProject[project.id] ?? [];
  return versions[0]?.id ?? "";
}

export async function sendForCustomerApproval(
  project: Project,
  actor: Actor,
): Promise<void> {
  updateProject(project.id, (p) => {
    let next: Project = { ...p, status: "awaiting-approval" };
    next = {
      ...next,
      pages: next.pages.map((page) =>
        page.status === "in-review" || page.status === "ready-for-review"
          ? { ...page, status: "ready-for-approval" }
          : page,
      ),
    };
    return logActivity(next, "status-changed", "Sent for customer approval", actor);
  });

  await notifyCustomer(project, actor.id, {
    projectId: project.id,
    type: "project-ready-for-approval",
    title: "Ready for your approval",
    message: `“${project.name}” is ready for your review and approval.`,
    actionUrl: `/projects/${project.id}/review`,
  });
}

export async function approveSection(
  project: Project,
  page: ProjectPage,
  sectionId: string,
  actor: Actor,
  note?: string,
): Promise<void> {
  const versionId = await latestVersionId(project);
  await useApprovalsStore.getState().addApproval({
    projectId: project.id,
    pageId: page.id,
    sectionId,
    scope: "section",
    versionId,
    approvedById: actor.id,
    note,
  });

  const sectionName = page.sections.find((s) => s.id === sectionId);
  const variation = sectionName ? getVariation(sectionName.variationId) : undefined;

  updateProject(project.id, (p) =>
    logActivity(
      {
        ...p,
        pages: p.pages.map((pg) =>
          pg.id === page.id
            ? {
                ...pg,
                sections: pg.sections.map((s) =>
                  s.id === sectionId
                    ? { ...s, reviewStatus: "approved", approvalLocked: true }
                    : s,
                ),
              }
            : pg,
        ),
      },
      "section-approved",
      `${variation?.name ?? "Section"} approved on ${page.name}`,
      actor,
      { pageId: page.id, sectionId },
    ),
  );

  await notifyAgency(project, actor.id, {
    projectId: project.id,
    pageId: page.id,
    sectionId,
    type: "general",
    title: "Section approved",
    message: `${actor.name} approved a section on ${page.name}.`,
    actionUrl: `/projects/${project.id}/editor?page=${page.id}`,
  });
}

export async function approvePage(
  project: Project,
  page: ProjectPage,
  actor: Actor,
  note?: string,
): Promise<void> {
  const version = await createVersion(project, {
    label: `${page.name} approved`,
    description: note,
    trigger: "page-approval",
    createdById: actor.id,
  });

  await useApprovalsStore.getState().addApproval({
    projectId: project.id,
    pageId: page.id,
    scope: "page",
    versionId: version.id,
    approvedById: actor.id,
    note,
  });

  updateProject(project.id, (p) => {
    const pages = p.pages.map((pg) =>
      pg.id === page.id
        ? {
            ...pg,
            status: "approved" as PageStatus,
            lockedAt: nowIso(),
            lockedById: actor.id,
            sections: pg.sections.map((s) => ({
              ...s,
              reviewStatus: "approved" as const,
              approvalLocked: true,
            })),
          }
        : pg,
    );
    const allApproved = pages
      .filter((pg) => pg.sections.length > 0 || pg.isHomepage)
      .every((pg) => pg.status === "approved" || pg.status === "locked");
    const status: Project["status"] =
      p.status === "awaiting-approval" || p.status === "partially-approved"
        ? allApproved
          ? p.status // project approval is its own explicit step
          : "partially-approved"
        : p.status;
    return logActivity(
      { ...p, pages, status },
      "page-approved",
      `${page.name} approved (version ${version.versionNumber})`,
      actor,
      { pageId: page.id },
    );
  });

  await notifyAgency(project, actor.id, {
    projectId: project.id,
    pageId: page.id,
    type: "general",
    title: "Page approved",
    message: `${actor.name} approved ${page.name} on “${project.name}”.`,
    actionUrl: `/projects/${project.id}/overview`,
  });
}

export async function approveProject(
  project: Project,
  actor: Actor,
  note: string | undefined,
): Promise<void> {
  const version = await createVersion(project, {
    label: "Blueprint approved",
    description: note,
    trigger: "project-approval",
    createdById: actor.id,
  });

  await useApprovalsStore.getState().addApproval({
    projectId: project.id,
    scope: "project",
    versionId: version.id,
    approvedById: actor.id,
    note,
  });

  updateProject(project.id, (p) =>
    logActivity(
      {
        ...p,
        status: "approved",
        approvedVersionId: version.id,
        approvedAt: nowIso(),
        approvedById: actor.id,
        approvalNote: note,
        pages: p.pages.map((pg) =>
          pg.status === "approved" || pg.status === "locked"
            ? { ...pg, status: "locked" as PageStatus }
            : pg,
        ),
      },
      "project-approved",
      `Blueprint approved (version ${version.versionNumber})`,
      actor,
    ),
  );

  await notifyAgency(project, actor.id, {
    projectId: project.id,
    type: "general",
    title: "Blueprint approved 🎉",
    message: `${actor.name} approved “${project.name}”. Ready for development handoff.`,
    actionUrl: `/projects/${project.id}/handoff`,
  });
}

// ---------------------------------------------------------------------------
// Locking / unlocking
// ---------------------------------------------------------------------------

export async function unlockPage(
  project: Project,
  page: ProjectPage,
  actor: Actor,
  reason: string,
): Promise<void> {
  const version = await createVersion(project, {
    label: `${page.name} unlocked`,
    description: reason,
    trigger: "unlock",
    createdById: actor.id,
  });

  // Revoke the active page approval (records stay in history).
  const approvalsStore = useApprovalsStore.getState();
  await approvalsStore.refresh(project.id);
  // Re-read AFTER refresh — the pre-refresh snapshot would be stale.
  const approvals = useApprovalsStore.getState().byProject[project.id] ?? [];
  const active = approvals.find(
    (a) => a.scope === "page" && a.pageId === page.id && !a.revokedAt,
  );
  if (active) {
    await approvalsStore.revokeApproval(project.id, active.id, actor.id, reason);
  }

  updateProject(project.id, (p) =>
    logActivity(
      {
        ...p,
        pages: p.pages.map((pg) =>
          pg.id === page.id
            ? {
                ...pg,
                status: "customer-revising" as PageStatus,
                lockedAt: undefined,
                lockedById: undefined,
                sections: pg.sections.map((s) => ({ ...s, approvalLocked: false })),
              }
            : pg,
        ),
      },
      "page-unlocked",
      `${page.name} unlocked: ${reason} (version ${version.versionNumber})`,
      actor,
      { pageId: page.id },
    ),
  );

  await notifyCustomer(project, actor.id, {
    projectId: project.id,
    pageId: page.id,
    type: "approval-revoked",
    title: "Page unlocked",
    message: `${page.name} was unlocked for changes: ${reason}`,
    actionUrl: `/projects/${project.id}/editor?page=${page.id}`,
  });
}

export async function unlockSection(
  project: Project,
  page: ProjectPage,
  sectionId: string,
  actor: Actor,
  reason: string,
): Promise<void> {
  const version = await createVersion(project, {
    label: `Section unlocked on ${page.name}`,
    description: reason,
    trigger: "unlock",
    createdById: actor.id,
  });

  const approvalsStore = useApprovalsStore.getState();
  await approvalsStore.refresh(project.id);
  // Re-read AFTER refresh — the pre-refresh snapshot would be stale.
  const approvals = useApprovalsStore.getState().byProject[project.id] ?? [];
  const active = approvals.find(
    (a) => a.scope === "section" && a.sectionId === sectionId && !a.revokedAt,
  );
  if (active) {
    await approvalsStore.revokeApproval(project.id, active.id, actor.id, reason);
  }

  updateProject(project.id, (p) =>
    logActivity(
      {
        ...p,
        pages: p.pages.map((pg) =>
          pg.id === page.id
            ? {
                ...pg,
                sections: pg.sections.map((s) =>
                  s.id === sectionId
                    ? { ...s, reviewStatus: "revisions-requested", approvalLocked: false }
                    : s,
                ),
              }
            : pg,
        ),
      },
      "section-unlocked",
      `Section unlocked on ${page.name}: ${reason} (version ${version.versionNumber})`,
      actor,
      { pageId: page.id, sectionId },
    ),
  );

  await notifyCustomer(project, actor.id, {
    projectId: project.id,
    pageId: page.id,
    sectionId,
    type: "approval-revoked",
    title: "Section unlocked",
    message: `A section on ${page.name} was unlocked: ${reason}`,
    actionUrl: `/projects/${project.id}/editor?page=${page.id}`,
  });
}

// ---------------------------------------------------------------------------
// Version restore
// ---------------------------------------------------------------------------

export async function restoreVersion(
  project: Project,
  version: ProjectVersion,
  actor: Actor,
): Promise<void> {
  // Backup of the current state FIRST, so nothing is lost.
  await createVersion(project, {
    label: `Backup before restoring v${version.versionNumber}`,
    trigger: "restore-backup",
    createdById: actor.id,
  });

  updateProject(project.id, (p) => {
    const snap = structuredClone(version.snapshot);
    return logActivity(
      {
        ...p,
        name: snap.name,
        companyName: snap.companyName,
        websiteType: snap.websiteType,
        status: snap.status,
        questionnaire: snap.questionnaire,
        pages: snap.pages,
      },
      "version-restored",
      `Restored version ${version.versionNumber} — ${version.label}`,
      actor,
    );
  });

  const memberIds = await memberIdsByRole(project.id, () => true);
  await notifyUsers(memberIds, actor.id, {
    projectId: project.id,
    type: "version-restored",
    title: "Version restored",
    message: `${actor.name} restored version ${version.versionNumber} (“${version.label}”) on “${project.name}”.`,
    actionUrl: `/projects/${project.id}/versions`,
  });
}

// ---------------------------------------------------------------------------
// Variation suggestions
// ---------------------------------------------------------------------------

export async function suggestVariation(
  project: Project,
  page: ProjectPage,
  sectionId: string,
  suggestedVariationId: string,
  actor: Actor,
  message?: string,
): Promise<void> {
  const section = page.sections.find((s) => s.id === sectionId);
  if (!section) throw new Error("Section not found.");

  await useSuggestionsStore.getState().createSuggestion({
    projectId: project.id,
    pageId: page.id,
    sectionId,
    currentVariationId: section.variationId,
    suggestedVariationId,
    message,
    createdById: actor.id,
  });

  const suggested = getVariation(suggestedVariationId);
  updateProject(project.id, (p) =>
    logActivity(
      p,
      "suggestion-created",
      `Suggested the “${suggested?.name ?? suggestedVariationId}” design for a section on ${page.name}`,
      actor,
      { pageId: page.id, sectionId },
    ),
  );

  await notifyCustomer(project, actor.id, {
    projectId: project.id,
    pageId: page.id,
    sectionId,
    type: "suggestion-received",
    title: "Design suggestion received",
    message: `${actor.name} suggested a different design for a section on ${page.name}.`,
    actionUrl: `/projects/${project.id}/editor?page=${page.id}`,
  });
}

export async function respondToSuggestion(
  project: Project,
  suggestion: SectionVariationSuggestion,
  actor: Actor,
  response: { status: "accepted" | "declined"; message?: string },
): Promise<{ accepted: boolean }> {
  await useSuggestionsStore.getState().respondToSuggestion(project.id, suggestion.id, {
    status: response.status,
    respondedById: actor.id,
    responseMessage: response.message,
  });

  const variation = getVariation(suggestion.suggestedVariationId);

  if (response.status === "accepted" && variation) {
    // Apply the switch, preserving content (shared schema per section type).
    updateProject(project.id, (p) =>
      logActivity(
        {
          ...p,
          pages: p.pages.map((pg) =>
            pg.id === suggestion.pageId
              ? {
                  ...pg,
                  sections: pg.sections.map((s) =>
                    s.id === suggestion.sectionId
                      ? switchSectionVariation(s, variation)
                      : s,
                  ),
                }
              : pg,
          ),
        },
        "suggestion-accepted",
        `Accepted the “${variation.name}” design suggestion`,
        actor,
        { pageId: suggestion.pageId, sectionId: suggestion.sectionId },
      ),
    );
  } else {
    updateProject(project.id, (p) =>
      logActivity(
        p,
        "suggestion-declined",
        `Declined the “${variation?.name ?? "design"}” suggestion`,
        actor,
        { pageId: suggestion.pageId, sectionId: suggestion.sectionId },
      ),
    );
  }

  await notifyUsers([suggestion.createdById], actor.id, {
    projectId: project.id,
    pageId: suggestion.pageId,
    sectionId: suggestion.sectionId,
    type: "general",
    title: response.status === "accepted" ? "Suggestion accepted" : "Suggestion declined",
    message: `${actor.name} ${response.status} your design suggestion on “${project.name}”.`,
    actionUrl: `/projects/${project.id}/editor?page=${suggestion.pageId}`,
  });

  return { accepted: response.status === "accepted" && Boolean(variation) };
}
