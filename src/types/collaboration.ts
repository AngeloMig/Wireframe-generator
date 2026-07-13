import type { UserRole } from "./common";
import type {
  ProjectPage,
  ProjectQuestionnaire,
  ProjectStatus,
} from "./project";
import type { PageSection } from "./section";

/**
 * Collaboration, review, versioning, and approval records. All persistent —
 * every record carries projectId (and organizationId where it exists) so the
 * Local* repositories can later be swapped for Supabase tables with RLS.
 */

// ---------------------------------------------------------------------------
// Project members
// ---------------------------------------------------------------------------

export type ProjectAccessLevel = "view" | "comment" | "edit";
export type MemberStatus = "active" | "invited" | "removed";

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  email: string;
  initials: string;
  avatarColor: string;
  role: UserRole;
  organization: string;
  accessLevel: ProjectAccessLevel;
  status: MemberStatus;
  isPrimaryContact: boolean;
  addedAt: string;
}

export type AccessRequestLevel = "page" | "content" | "builder";
export type AccessRequestStatus = "pending" | "approved" | "declined" | "revoked";

export interface AccessRequest {
  id: string;
  projectId: string;
  requesterId: string;
  requesterName: string;
  level: AccessRequestLevel;
  pageId?: string;
  reason: string;
  status: AccessRequestStatus;
  createdAt: string;
  decidedAt?: string;
  decidedById?: string;
  response?: string;
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export type CommentScope = "project" | "page" | "section";
export type CommentVisibility = "customer" | "agency";
export type CommentStatus = "open" | "in-progress" | "resolved" | "reopened";
export type CommentPriority = "low" | "normal" | "high" | "urgent";

export interface CommentAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  /** Object/data URL — temporary browser preview only in the prototype. */
  previewUrl?: string;
}

export interface CommentReply {
  id: string;
  commentId: string;
  authorId: string;
  message: string;
  mentions: string[];
  attachments: CommentAttachment[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Kept when a commented section is deleted so the conversation survives and
 * the section can be restored from the comment.
 */
export interface DeletedSectionContext {
  sectionName: string;
  variationName: string;
  /** Full section record at deletion time, for restore. */
  sectionSnapshot?: Record<string, unknown>;
}

export interface ProjectComment {
  id: string;
  projectId: string;
  pageId?: string;
  sectionId?: string;
  /** Optional exact canvas target, e.g. content.ctaLabel or hero.primaryButton. */
  anchorKey?: string;
  anchorLabel?: string;
  /** Emoji reaction name -> user ids. */
  reactions?: Record<string, string[]>;

  scope: CommentScope;
  visibility: CommentVisibility;

  authorId: string;
  assignedToId?: string;

  message: string;
  mentions: string[];

  status: CommentStatus;
  priority: CommentPriority;

  replies: CommentReply[];
  attachments: CommentAttachment[];

  /** Action-item fields (isActionItem turns the comment into a task). */
  isActionItem: boolean;
  dueDate?: string;
  completedAt?: string;
  completedById?: string;

  /** Set when the target section was deleted; comment is preserved. */
  deletedSection?: DeletedSectionContext;

  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedById?: string;
}

export interface CreateCommentInput {
  projectId: string;
  pageId?: string;
  sectionId?: string;
  anchorKey?: string;
  anchorLabel?: string;
  scope: CommentScope;
  visibility: CommentVisibility;
  authorId: string;
  assignedToId?: string;
  message: string;
  mentions: string[];
  priority: CommentPriority;
  attachments?: CommentAttachment[];
  isActionItem?: boolean;
  dueDate?: string;
}

export interface CreateReplyInput {
  authorId: string;
  message: string;
  mentions: string[];
  attachments?: CommentAttachment[];
}

// ---------------------------------------------------------------------------
// Review statuses (separate from content status)
// ---------------------------------------------------------------------------

export type PageReviewStatus =
  | "draft"
  | "content-needed"
  | "ready-for-review"
  | "in-review"
  | "revisions-requested"
  | "customer-revising"
  | "ready-for-approval"
  | "approved"
  | "locked";

export type SectionReviewStatus =
  | "draft"
  | "content-needed"
  | "image-needed"
  | "agency-review-needed"
  | "revisions-requested"
  | "ready-for-approval"
  | "approved"
  | "technically-reviewed";

/**
 * A section the customer removed from a page — kept as a trace (with a full
 * snapshot) so the agency can see what disappeared and restore it, instead of
 * it vanishing without a mark.
 */
export interface PendingSectionRemoval {
  id: string;
  sectionId: string;
  removedAt: string;
  removedById: string;
  snapshot: PageSection;
}

// ---------------------------------------------------------------------------
// Variation suggestions
// ---------------------------------------------------------------------------

export type SuggestionStatus = "pending" | "accepted" | "declined";

export interface SectionVariationSuggestion {
  id: string;
  projectId: string;
  pageId: string;
  sectionId: string;

  currentVariationId: string;
  suggestedVariationId: string;

  message?: string;
  createdById: string;
  status: SuggestionStatus;

  createdAt: string;
  respondedAt?: string;
  respondedById?: string;
  responseMessage?: string;
}

// ---------------------------------------------------------------------------
// Approvals
// ---------------------------------------------------------------------------

export type ApprovalScope = "section" | "page" | "project";

export interface ApprovalRecord {
  id: string;
  projectId: string;
  pageId?: string;
  sectionId?: string;

  scope: ApprovalScope;
  versionId: string;

  approvedById: string;
  approvedAt: string;

  note?: string;
  revokedAt?: string;
  revokedById?: string;
  revokeReason?: string;
}

// ---------------------------------------------------------------------------
// Versions
// ---------------------------------------------------------------------------

export type VersionTrigger =
  | "manual"
  | "review-submission"
  | "revision-request"
  | "revision-submission"
  | "revision-backup"
  | "page-approval"
  | "project-approval"
  | "unlock"
  | "restore-backup";

/**
 * Full copy of everything a version needs to be viewed, compared, and
 * restored. No transient UI state.
 */
export interface ProjectSnapshot {
  name: string;
  companyName: string;
  websiteType: string;
  status: ProjectStatus;
  questionnaire: ProjectQuestionnaire;
  pages: ProjectPage[];
}

export interface ProjectVersion {
  id: string;
  projectId: string;

  versionNumber: number;
  label: string;
  description?: string;

  createdById: string;
  createdAt: string;
  trigger: VersionTrigger;

  snapshot: ProjectSnapshot;
}

// ---------------------------------------------------------------------------
// Revision requests
// ---------------------------------------------------------------------------

export interface RevisionRequest {
  id: string;
  projectId: string;
  summary: string;
  message: string;
  pageIds: string[];
  sectionIds: string[];
  priority: CommentPriority;
  dueDate?: string;
  createdById: string;
  createdAt: string;
  /** Set when the customer submits the revisions back. */
  submittedAt?: string;
  submittedById?: string;
  submissionNote?: string;
}
