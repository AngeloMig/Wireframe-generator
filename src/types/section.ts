import type { SectionReviewStatus } from "./collaboration";

/** Section type + variation + page section instance types. */

/**
 * The section categories of the prebuilt library. Each type owns ONE shared
 * content schema; variations of a type are alternative *designs* over that
 * same content, so switching variation preserves the customer's content.
 */
export type SectionType =
  | "navigation"
  | "hero"
  | "faq"
  | "marquee"
  | "testimonials"
  | "services"
  | "cta"
  | "footer"
  | "content"
  | "ecommerce";

export type PageType =
  | "homepage"
  | "about"
  | "services"
  | "service"
  | "product"
  | "collection"
  | "contact"
  | "faq"
  | "portfolio"
  | "case-study"
  | "blog"
  | "blog-article"
  | "landing"
  | "pricing"
  | "team"
  | "testimonials"
  | "booking"
  | "custom";

export type SectionFieldType =
  | "text"
  | "textarea"
  | "url"
  | "image"
  | "number"
  | "select"
  | "toggle"
  | "repeater";

export interface SectionFieldOption {
  value: string;
  label: string;
}

export interface SectionFieldDefinition {
  key: string;
  label: string;
  type: SectionFieldType;
  placeholder?: string;
  helpText?: string;
  options?: SectionFieldOption[];
  /** For repeater fields: the schema of each repeated item. */
  itemFields?: SectionFieldDefinition[];
  itemLabel?: string;
  maxItems?: number;
}

export type ContentAlignment = "left" | "center" | "right";
export type ImagePosition = "left" | "right" | "top" | "background" | "none";
export type ContentWidth = "narrow" | "normal" | "wide" | "full";
export type MobileStacking = "default" | "reverse";

export interface SectionLayoutSettings {
  alignment: ContentAlignment;
  imagePosition: ImagePosition;
  columns: number;
  contentWidth: ContentWidth;
  itemCount: number;
  mobileStacking: MobileStacking;
}

export type BackgroundType = "none" | "muted" | "brand" | "dark" | "image";
export type BorderStyle = "none" | "top" | "bottom" | "both";
export type SectionSpacing = "compact" | "normal" | "spacious";
export type CardRadius = "none" | "small" | "medium" | "large";
export type ButtonStyleOption = "solid" | "outline" | "soft" | "link";

export interface SectionStyleSettings {
  background: BackgroundType;
  backgroundColor: string | null;
  textColor: string | null;
  accentColor: string | null;
  border: BorderStyle;
  spacing: SectionSpacing;
  cardRadius: CardRadius;
  buttonStyle: ButtonStyleOption;
}

export interface ResponsiveSettings {
  stackOnMobile: boolean;
  mobileColumns: number;
  hideOnMobile: boolean;
}

/**
 * The shared definition of a section type: one content schema + default
 * content that every variation of the type works from.
 */
export interface SectionTypeDefinition {
  type: SectionType;
  label: string;
  description: string;
  contentSchema: SectionFieldDefinition[];
  defaultContent: Record<string, unknown>;
}

/** One prebuilt design of a section type. */
export interface SectionVariation {
  id: string;
  sectionType: SectionType;
  name: string;
  description: string;
  previewImage?: string;
  tags: string[];
  supportedPageTypes: PageType[];
  /** Which component in the section component registry renders this design. */
  componentKey: string;
  /**
   * Content keys (from the type's shared schema) this design shows and edits.
   * Omitted = all keys. Content for other keys is kept, just not displayed —
   * that's what makes variation switching lossless.
   */
  contentKeys?: string[];
  /** Per-variation defaults merged over the type's defaultContent on insert. */
  contentDefaults?: Record<string, unknown>;
  defaultLayout: SectionLayoutSettings;
  defaultStyle: SectionStyleSettings;
  responsiveSettings: ResponsiveSettings;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ContentStatus = "not-started" | "draft" | "needs-review" | "final";
export type ImageRequirement =
  | "none"
  | "customer-provides"
  | "agency-sources"
  | "stock-ok";

export interface SectionNotes {
  customerNote: string;
  contentStatus: ContentStatus;
  imageRequirement: ImageRequirement;
  agencyQuestion: string;
  quickNotes: string[];
}

/** A concrete section placed on a page. References its type + design. */
export interface PageSection {
  id: string;
  sectionType: SectionType;
  variationId: string;
  content: Record<string, unknown>;
  layout: SectionLayoutSettings;
  style: SectionStyleSettings;
  notes: SectionNotes;
  isHidden: boolean;
  isLocked: boolean;
  order: number;
  /** Review workflow state — separate from notes.contentStatus. */
  reviewStatus: SectionReviewStatus;
  /** Set while the section is locked after approval. */
  approvalLocked?: boolean;
  /**
   * Set alongside `reviewStatus: "agency-review-needed"` so the UI can say
   * "added" vs "edited" without re-deriving it from version history.
   */
  pendingChange?: "added" | "edited";
}
