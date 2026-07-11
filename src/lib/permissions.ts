import type {
  CommentVisibility,
  Project,
  ProjectComment,
  ProjectStatus,
  UserRole,
} from "@/types";
import { isAgencyUser } from "@/types";

/**
 * Reusable permission checks. UI components call these instead of testing
 * roles inline, so the same rules can later be enforced with Supabase RLS
 * and server-side checks.
 */

// --- Comments ---------------------------------------------------------------

export function canViewInternalNotes(role: UserRole): boolean {
  return isAgencyUser(role);
}

export function canCreateComment(role: UserRole, visibility: CommentVisibility): boolean {
  if (visibility === "agency") return isAgencyUser(role);
  return true;
}

export function canEditComment(role: UserRole, comment: ProjectComment, userId: string): boolean {
  if (role === "admin") return true;
  return comment.authorId === userId;
}

export function canDeleteComment(
  role: UserRole,
  comment: ProjectComment,
  userId: string,
): boolean {
  if (role === "admin") return true;
  // Customers can never delete agency feedback.
  return comment.authorId === userId;
}

export function canResolveComment(role: UserRole, comment: ProjectComment, userId: string): boolean {
  if (isAgencyUser(role)) return true;
  // Customers may resolve their own threads or ones assigned to them.
  return comment.authorId === userId || comment.assignedToId === userId;
}

export function canAssignComments(role: UserRole): boolean {
  return role === "agency-pm" || role === "admin" || role === "agency-designer";
}

export function canChangeCommentPriority(role: UserRole): boolean {
  return isAgencyUser(role);
}

/** Customers may complete action items assigned to them; agency users any. */
export function canCompleteActionItem(
  role: UserRole,
  comment: ProjectComment,
  userId: string,
): boolean {
  if (isAgencyUser(role)) return true;
  return comment.assignedToId === userId || comment.authorId === userId;
}

// --- Members ----------------------------------------------------------------

export function canManageMembers(role: UserRole): boolean {
  return role === "agency-pm" || role === "admin";
}

// --- Editing ----------------------------------------------------------------

const CUSTOMER_EDITABLE_STATUSES: ProjectStatus[] = [
  "draft",
  "customer-editing",
  "revisions-requested",
  "customer-revising",
];

/** Whether this role may edit page/section content given the project status. */
export function canEditProjectContent(role: UserRole, status: ProjectStatus): boolean {
  if (role === "admin") return true;
  if (role === "customer") return CUSTOMER_EDITABLE_STATUSES.includes(status);
  // Agency edits happen during review (via the explicit Edit Wireframe action).
  return (
    status === "ready-for-review" ||
    status === "agency-reviewing" ||
    status === "revisions-requested" ||
    status === "awaiting-approval"
  );
}

/** Explains why editing is unavailable — shown next to disabled controls. */
export function editRestrictionReason(role: UserRole, status: ProjectStatus): string | null {
  if (canEditProjectContent(role, status)) return null;
  if (role === "customer") {
    switch (status) {
      case "ready-for-review":
        return "Your blueprint has been submitted — the agency is reviewing it. You can comment, but editing is paused until the agency responds.";
      case "agency-reviewing":
        return "The agency is reviewing your blueprint. Editing is paused until they finish.";
      case "awaiting-approval":
      case "partially-approved":
        return "The blueprint is in approval. Approve it or request changes to continue.";
      case "approved":
      case "in-development":
      case "completed":
        return "This blueprint is approved. Ask the agency to reopen it if something needs to change.";
      case "archived":
        return "This project is archived.";
      default:
        return "Editing is currently unavailable.";
    }
  }
  return "Editing is unavailable in the current project status.";
}

// --- Review + approval ------------------------------------------------------

export function canReviewAsAgency(role: UserRole): boolean {
  return isAgencyUser(role);
}

export function canRequestRevisions(role: UserRole): boolean {
  return role === "agency-designer" || role === "agency-pm" || role === "admin";
}

export function canSuggestVariations(role: UserRole): boolean {
  return isAgencyUser(role);
}

export function canMarkTechnicallyReviewed(role: UserRole): boolean {
  return role === "agency-developer" || role === "admin";
}

export function canSendForCustomerApproval(role: UserRole): boolean {
  return role === "agency-pm" || role === "admin";
}

/** Customer approval of sections/pages/project. */
export function canApprove(role: UserRole): boolean {
  return role === "customer" || role === "admin";
}

export function canLockPages(role: UserRole): boolean {
  return role === "agency-pm" || role === "admin";
}

export function canUnlockApproved(role: UserRole): boolean {
  return role === "agency-pm" || role === "admin";
}

// --- Versions ---------------------------------------------------------------

export function canCreateManualVersion(role: UserRole): boolean {
  return isAgencyUser(role);
}

export function canRestoreVersion(role: UserRole): boolean {
  return role === "agency-pm" || role === "admin";
}

// --- Export -----------------------------------------------------------------

export function canExportHandoff(role: UserRole): boolean {
  return isAgencyUser(role);
}

export function canDownloadCustomerExport(role: UserRole, project: Project): boolean {
  if (isAgencyUser(role)) return true;
  return project.status === "approved" ||
    project.status === "in-development" ||
    project.status === "completed";
}

// --- Admin ------------------------------------------------------------------

export function canManageUsers(role: UserRole): boolean {
  return role === "admin";
}
