import type { Timestamps, UserRole } from "./common";
import type { PageSection, PageType } from "./section";

export type ProjectStatus =
  | "draft"
  | "customer-editing"
  | "ready-for-review"
  | "agency-reviewing"
  | "revisions-requested"
  | "awaiting-approval"
  | "approved"
  | "in-development"
  | "completed"
  | "archived";

export type PageStatus =
  | "draft"
  | "in-progress"
  | "ready-for-review"
  | "in-review"
  | "revisions-requested"
  | "approved";

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
  | "revisions-requested"
  | "page-approved"
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
  createdAt: string;
}

export type CommentStatus = "open" | "resolved";
export type CommentTarget = "project" | "page" | "section";

export interface CommentReply {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  message: string;
  createdAt: string;
}

export interface ProjectComment {
  id: string;
  projectId: string;
  target: CommentTarget;
  pageId: string | null;
  sectionId: string | null;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  message: string;
  status: CommentStatus;
  replies: CommentReply[];
  createdAt: string;
  updatedAt: string;
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
  ownerId: string;
  questionnaire: ProjectQuestionnaire;
  pages: ProjectPage[];
  comments: ProjectComment[];
  activity: ActivityEntry[];
  assets: ProjectAsset[];
  lastEditedAt: string;
}

export interface CreateProjectInput {
  name: string;
  companyName: string;
  websiteType: string;
  questionnaire: ProjectQuestionnaire;
  pages: Omit<ProjectPage, "projectId" | "createdAt" | "updatedAt">[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  projectId: string | null;
  href: string | null;
  createdAt: string;
}
