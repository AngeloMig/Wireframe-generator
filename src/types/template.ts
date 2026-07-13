import type { PageType, SectionLayoutSettings, SectionStyleSettings } from "./section";
import type { VisualStyle, WebsiteGoal } from "./project";

/** A section entry inside a full page template. */
export interface PageTemplateSection {
  variationId: string;
  contentOverrides?: Record<string, unknown>;
  layoutOverrides?: Partial<SectionLayoutSettings>;
  styleOverrides?: Partial<SectionStyleSettings>;
}

/** A complete, predefined page structure users can start from. */
export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  pageType: PageType;
  /** Which industries this template suits (matched against questionnaire). */
  industries: string[];
  goals: WebsiteGoal[];
  styles: VisualStyle[];
  sections: PageTemplateSection[];
  isActive: boolean;
  /** True for templates the user saved from their own work (vs built-in). */
  isCustom?: boolean;
  createdAt: string;
  updatedAt: string;
}
