import { SECTION_TEMPLATES } from "@/data/section-templates";
import { DEFAULT_BRAND } from "@/components/project/wizard/wizard-types";
import type {
  PageType,
  Project,
  SectionCategory,
  SectionTemplate,
  WebsiteGoal,
} from "@/types";

// ---------------------------------------------------------------------------
// Content value helpers — section content is a loose Record, these narrow it.
// ---------------------------------------------------------------------------

export function str(content: Record<string, unknown>, key: string): string {
  const value = content[key];
  return typeof value === "string" ? value : "";
}

export function itemsOf(
  content: Record<string, unknown>,
  key: string,
): Record<string, unknown>[] {
  const value = content[key];
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> => typeof item === "object" && item !== null,
  );
}

export interface ImageValue {
  url: string;
  alt: string;
}

/** Image content can be null, a bare URL string, or {url, alt}. */
export function imageOf(content: Record<string, unknown>, key: string): ImageValue | null {
  const value = content[key];
  if (typeof value === "string" && value) return { url: value, alt: "" };
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const url = typeof record.url === "string" ? record.url : "";
    const alt = typeof record.alt === "string" ? record.alt : "";
    if (url) return { url, alt };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Recommendations — local logic matching goals/page type to categories.
// ---------------------------------------------------------------------------

const GOAL_CATEGORIES: Partial<Record<WebsiteGoal, SectionCategory[]>> = {
  "sell-products": ["ecommerce", "social-proof"],
  "generate-leads": ["conversion", "services"],
  "book-appointments": ["conversion", "services"],
  "showcase-services": ["services", "social-proof"],
  "brand-awareness": ["content", "social-proof"],
  "display-portfolio": ["content", "social-proof"],
  "educational-content": ["conversion", "content"],
  "collect-subscribers": ["conversion"],
};

/** Templates suggested for a page, ranked by goal fit. Local logic, no AI. */
export function recommendedTemplates(
  templates: SectionTemplate[],
  pageType: PageType,
  goals: WebsiteGoal[],
  limit = 6,
): SectionTemplate[] {
  const preferred = new Set(goals.flatMap((goal) => GOAL_CATEGORIES[goal] ?? []));
  return templates
    .filter((t) => t.isActive && t.supportedPageTypes.includes(pageType))
    .map((template) => {
      let score = 0;
      if (preferred.has(template.category)) score += 2;
      if (template.category === "hero") score += 1;
      return { template, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.template);
}

/** Template ids already used on the page, most recently added first. */
export function recentlyUsedTemplateIds(sectionTemplateIds: string[], limit = 4): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (let i = sectionTemplateIds.length - 1; i >= 0 && result.length < limit; i--) {
    const id = sectionTemplateIds[i];
    if (!seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }
  return result;
}

export function activeTemplates(): SectionTemplate[] {
  return SECTION_TEMPLATES.filter((t) => t.isActive);
}

// ---------------------------------------------------------------------------
// Brand theme for styled preview mode.
// ---------------------------------------------------------------------------

export interface BrandTheme {
  primary: string;
  secondary: string;
  accent: string;
  /** Card/border radius classes derived from the radius preference. */
  cardRadius: string;
  buttonRadius: string;
  headingFont: string;
}

export function brandTheme(project: Project): BrandTheme {
  const brand = project.questionnaire.brand ?? DEFAULT_BRAND;
  const radius = brand.borderRadius;
  const cardRadius =
    radius === "sharp" ? "rounded-none" : radius === "rounded" ? "rounded-2xl" : "rounded-lg";
  const buttonRadius =
    brand.buttonStyle === "pill"
      ? "rounded-full"
      : brand.buttonStyle === "square"
        ? "rounded-none"
        : "rounded-lg";
  const headingFont =
    brand.headingStyle === "serif" ? "font-serif" : "font-sans";
  return {
    primary: brand.primaryColor || DEFAULT_BRAND.primaryColor,
    secondary: brand.secondaryColor || DEFAULT_BRAND.secondaryColor,
    accent: brand.accentColor || DEFAULT_BRAND.accentColor,
    cardRadius,
    buttonRadius,
    headingFont,
  };
}

/** Blend a hex color with white for subtle tinted backgrounds. */
export function tint(hex: string, opacity: number): string {
  const match = /^#?([\da-f]{6})$/i.exec(hex.trim());
  if (!match) return `rgba(100, 116, 139, ${opacity})`;
  const value = parseInt(match[1], 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
