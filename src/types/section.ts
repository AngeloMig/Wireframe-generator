/** Section template + page section instance types. */

export type SectionCategory =
  | "navigation"
  | "hero"
  | "content"
  | "services"
  | "ecommerce"
  | "social-proof"
  | "conversion"
  | "footer";

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

export interface SectionVariation {
  id: string;
  name: string;
  description?: string;
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

export interface SectionTemplate {
  id: string;
  name: string;
  category: SectionCategory;
  description: string;
  supportedPageTypes: PageType[];
  /** Identifier for the drawn thumbnail representation. */
  thumbnail: string;
  variations: SectionVariation[];
  defaultContent: Record<string, unknown>;
  contentSchema: SectionFieldDefinition[];
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

/** A concrete section placed on a page. References its template. */
export interface PageSection {
  id: string;
  templateId: string;
  variationId: string;
  content: Record<string, unknown>;
  layout: SectionLayoutSettings;
  style: SectionStyleSettings;
  notes: SectionNotes;
  isHidden: boolean;
  isLocked: boolean;
  order: number;
}
