import type { Timestamps, UserRole } from "./common";
import type { PageReviewStatus, PendingSectionRemoval } from "./collaboration";
import type { PageSection, PageType } from "./section";

export type ProjectStatus =
  | "draft"
  | "customer-editing"
  | "ready-for-review"
  | "agency-reviewing"
  | "revisions-requested"
  | "customer-revising"
  | "awaiting-approval"
  | "partially-approved"
  | "approved"
  | "in-development"
  | "completed"
  | "archived";

/** Page review status doubles as the page's overall status. */
export type PageStatus = PageReviewStatus;

export type WebsiteGoal =
  | "sell-products"
  | "generate-leads"
  | "book-appointments"
  | "showcase-services"
  | "brand-awareness"
  | "display-portfolio"
  | "educational-content"
  | "promote-events"
  | "collect-subscribers"
  | "membership";

export type VisualStyle =
  | "minimal"
  | "modern"
  | "editorial"
  | "premium"
  | "playful"
  | "corporate"
  | "bold"
  | "elegant"
  | "technical"
  | "luxury"
  | "organic"
  | "ecommerce";

export type PlatformPreference =
  | "shopify"
  | "wordpress"
  | "webflow"
  | "statamic"
  | "custom"
  | "not-sure";

export type HeadingStyle = "serif" | "sans-serif" | "display" | "not-sure";
export type BrandButtonStyle = "rounded" | "pill" | "square" | "not-sure";
export type RadiusPreference = "sharp" | "subtle" | "rounded" | "not-sure";
export type SpacingPreference = "compact" | "balanced" | "airy" | "not-sure";

export interface BrandPreferences {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headingStyle: HeadingStyle;
  buttonStyle: BrandButtonStyle;
  borderRadius: RadiusPreference;
  spacing: SpacingPreference;
}

export interface InspirationSite {
  id: string;
  url: string;
  likes: string;
  dislikes: string;
  sectionsToReference: string;
}

export interface ProjectQuestionnaire {
  companyName: string;
  existingUrl: string;
  industry: string;
  businessDescription: string;
  mainGoal: string;
  targetAudience: string;
  estimatedPages: string;
  platform: PlatformPreference;
  goals: WebsiteGoal[];
  visualStyles: VisualStyle[];
  brand: BrandPreferences | null;
  inspirations: InspirationSite[];
}

export interface ProjectPage extends Timestamps {
  id: string;
  projectId: string;
  name: string;
  navLabel: string;
  type: PageType;
  status: PageStatus;
  isHomepage: boolean;
  inMainNav: boolean;
  footerOnly: boolean;
  parentId: string | null;
  order: number;
  sections: PageSection[];
  /** Set while the page is locked (post-approval). */
  lockedAt?: string;
  lockedById?: string;
  /** Sections the customer removed, kept as a trace until the agency acts on them. */
  pendingRemovals?: PendingSectionRemoval[];
}

export type ActivityType =
  | "project-created"
  | "project-updated"
  | "page-added"
  | "page-updated"
  | "page-deleted"
  | "section-added"
  | "section-removed"
  | "page-submitted"
  | "project-submitted"
  | "comment-created"
  | "comment-replied"
  | "comment-resolved"
  | "comment-reopened"
  | "action-item-assigned"
  | "action-item-completed"
  | "revisions-requested"
  | "revisions-submitted"
  | "section-approved"
  | "section-reverted"
  | "page-approved"
  | "project-approved"
  | "approval-revoked"
  | "version-created"
  | "version-restored"
  | "section-unlocked"
  | "page-unlocked"
  | "suggestion-created"
  | "suggestion-accepted"
  | "suggestion-declined"
  | "member-added"
  | "member-removed"
  | "member-role-changed"
  | "status-changed"
  | "asset-added";

export interface ActivityEntry {
  id: string;
  projectId: string;
  type: ActivityType;
  message: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  pageId?: string;
  sectionId?: string;
  createdAt: string;
}

export type AssetKind = "image" | "logo" | "document";

export interface ProjectAsset extends Timestamps {
  id: string;
  projectId: string;
  name: string;
  kind: AssetKind;
  /** Object URL / data URL / remote URL — preview only in the prototype. */
  url: string;
  note: string;
}

export interface Project extends Timestamps {
  id: string;
  name: string;
  companyName: string;
  status: ProjectStatus;
  websiteType: string;
  /** The agency (organization) this project belongs to — multi-tenant wall. */
  organization: string;
  ownerId: string;
  questionnaire: ProjectQuestionnaire;
  pages: ProjectPage[];
  activity: ActivityEntry[];
  assets: ProjectAsset[];
  lastEditedAt: string;
  /** Version snapshot the customer approved (set on project approval). */
  approvedVersionId?: string;
  approvedAt?: string;
  approvedById?: string;
  approvalNote?: string;
  /** Latest submission note from a review/revision submission. */
  latestSubmissionNote?: string;
}

export interface CreateProjectInput {
  name: string;
  companyName: string;
  websiteType: string;
  /** Owning agency; defaults to the demo agency when omitted. */
  organization?: string;
  /** Customer the project is created for; defaults to the demo customer. */
  ownerId?: string;
  questionnaire: ProjectQuestionnaire;
  pages: Omit<ProjectPage, "projectId" | "createdAt" | "updatedAt">[];
}

export type NotificationType =
  | "mention"
  | "comment-assigned"
  | "comment-reply"
  | "revisions-requested"
  | "revisions-submitted"
  | "section-ready-for-approval"
  | "page-ready-for-approval"
  | "project-ready-for-approval"
  | "suggestion-received"
  | "action-item-due"
  | "approval-revoked"
  | "version-restored"
  | "review-submitted"
  | "general";

export interface AppNotification {
  id: string;
  /** Recipient — notifications are per-user. */
  userId: string;
  projectId?: string;
  pageId?: string;
  sectionId?: string;

  type: NotificationType;
  title: string;
  message: string;

  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}
