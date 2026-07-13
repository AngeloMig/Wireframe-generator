import type {
  AccessRequestLevel,
  CommentVisibility,
  Project,
  ProjectAccessLevel,
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
  // The author can always delete their own comment; otherwise it takes higher
  // authority — admins and agency staff can moderate any comment. Customers
  // can only delete their own.
  if (comment.authorId === userId) return true;
  if (role === "admin") return true;
  return isAgencyUser(role);
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

/**
 * The three independent things a customer can be allowed to do in the editor.
 * `page` (add/manage pages) has no self-serve surface yet — the agency handles
 * page creation — so it does NOT unlock the canvas on its own.
 */
export interface EditorCapabilities {
  /** Edit the words and images on existing sections, in place. */
  content: boolean;
  /** Add, remove, reorder, duplicate, swap, hide, or lock sections. */
  builder: boolean;
  /** Add pages / change page settings (agency-fulfilled for now). */
  page: boolean;
}

const NO_CAPABILITIES: EditorCapabilities = { content: false, builder: false, page: false };
const ALL_CAPABILITIES: EditorCapabilities = { content: true, builder: true, page: true };

/**
 * Which editor capabilities a user holds right now. Two gates as before —
 * BOTH required — but the second one is now granular:
 *   1. The status must be an editable phase (canEditProjectContent) — submitting
 *      for review or entering approval pauses editing, and no access grant
 *      overrides that.
 *   2. What the user may do. Agency/admin and full-edit customers (owner or an
 *      "edit" member) get everything; other customers get exactly the levels the
 *      agency has approved. Access grants only unlock DURING an editable phase;
 *      they never bypass the status lock.
 */
export function grantedCapabilities(
  role: UserRole,
  status: ProjectStatus,
  access: { memberAccess?: ProjectAccessLevel; approvedLevels?: AccessRequestLevel[] } = {},
): EditorCapabilities {
  if (!canEditProjectContent(role, status)) return NO_CAPABILITIES;
  if (role !== "customer") return ALL_CAPABILITIES;
  // Owner (no member record) or an explicit "edit" member has the full set.
  if (!access.memberAccess || access.memberAccess === "edit") return ALL_CAPABILITIES;
  const levels = new Set(access.approvedLevels ?? []);
  return {
    content: levels.has("content"),
    builder: levels.has("builder"),
    page: levels.has("page"),
  };
}

/** True when the user can perform any self-serve edit on the canvas. */
export function canEditAnything(caps: EditorCapabilities): boolean {
  return caps.content || caps.builder;
}

/**
 * Whether the editor should allow ANY content changes. Kept as a thin boolean
 * over grantedCapabilities so existing call sites and unit tests are stable
 * (this rule regressed once — an access grant was OR'd past the status gate).
 */
export function canEditInEditor(
  role: UserRole,
  status: ProjectStatus,
  access: { memberAccess?: ProjectAccessLevel; approvedAccessRequest?: boolean } = {},
): boolean {
  const caps = grantedCapabilities(role, status, {
    memberAccess: access.memberAccess,
    // A generic "an access request was approved" maps to the full set, matching
    // the pre-capability behaviour callers of this boolean still expect.
    approvedLevels: access.approvedAccessRequest ? ["content", "builder", "page"] : [],
  });
  return canEditAnything(caps);
}

/** Explains why editing is unavailable — shown next to disabled controls. */
export function editRestrictionReason(
  role: UserRole,
  status: ProjectStatus,
  /** The customer holds an access grant, so the ONLY thing blocking them is the
   *  status. Lets the banner say "you have access, but…" instead of implying
   *  they were never allowed — otherwise an approved request looks ignored. */
  hasAccessGrant = false,
): string | null {
  if (canEditProjectContent(role, status)) return null;
  if (role === "customer") {
    if (hasAccessGrant) {
      switch (status) {
        case "ready-for-review":
        case "agency-reviewing":
          return "You have edit access — but editing is paused while the agency reviews your blueprint. It reopens when they respond.";
        case "awaiting-approval":
        case "partially-approved":
          return "You have edit access — but the blueprint is in approval. Approve it or request changes to keep editing.";
        default:
          break;
      }
    }
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
