import { SECTION_VARIATIONS } from "@/data/section-variations";
import { DEFAULT_BRAND } from "@/components/project/wizard/wizard-types";
import { readJson, STORAGE_KEYS } from "@/lib/storage/local-storage";
import type {
  PageType,
  Project,
  SectionType,
  SectionVariation,
  WebsiteGoal,
} from "@/types";

// ---------------------------------------------------------------------------
// Content value helpers — section content is a loose Record, these narrow it.
// ---------------------------------------------------------------------------

export function str(content: Record<string, unknown>, key: string): string {
  const value = content[key];
  return typeof value === "string" ? value : "";
}

export function bool(content: Record<string, unknown>, key: string): boolean {
  return content[key] === true;
}

/**
 * Immutably set a string at a dot-path ("heading", "items.0.title") inside
 * section content. Unknown intermediate paths leave the content untouched.
 */
export function setContentValue(
  content: Record<string, unknown>,
  path: string,
  value: string,
): Record<string, unknown> {
  const keys = path.split(".");
  const clone = structuredClone(content);
  let node: unknown = clone;
  for (let i = 0; i < keys.length - 1; i++) {
    if (typeof node !== "object" || node === null) return content;
    node = (node as Record<string, unknown>)[keys[i]];
  }
  if (typeof node !== "object" || node === null) return content;
  (node as Record<string, unknown>)[keys[keys.length - 1]] = value;
  return clone;
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
// Library helpers — active designs (with admin overrides) + recommendations.
// ---------------------------------------------------------------------------

type VariationOverrides = Record<string, Partial<SectionVariation>>;

/** All designs with admin overrides (name/description/isActive) applied. */
export function effectiveVariations(): SectionVariation[] {
  const overrides = readJson<VariationOverrides>(STORAGE_KEYS.sectionVariationOverrides, {});
  return SECTION_VARIATIONS.map((variation) => ({
    ...variation,
    ...overrides[variation.id],
    id: variation.id,
    sectionType: variation.sectionType,
    componentKey: variation.componentKey,
  }));
}

export function activeVariations(): SectionVariation[] {
  return effectiveVariations().filter((v) => v.isActive);
}

const GOAL_TYPES: Partial<Record<WebsiteGoal, SectionType[]>> = {
  "sell-products": ["ecommerce", "testimonials", "marquee"],
  "generate-leads": ["cta", "services", "faq"],
  "book-appointments": ["cta", "services", "faq"],
  "showcase-services": ["services", "testimonials"],
  "brand-awareness": ["content", "marquee", "testimonials"],
  "display-portfolio": ["content", "marquee", "testimonials"],
  "educational-content": ["faq", "content"],
  "collect-subscribers": ["cta"],
};

/** Designs suggested for a page, ranked by goal fit. Local logic, no AI. */
export function recommendedVariations(
  variations: SectionVariation[],
  pageType: PageType,
  goals: WebsiteGoal[],
  limit = 6,
): SectionVariation[] {
  const preferred = new Set(goals.flatMap((goal) => GOAL_TYPES[goal] ?? []));
  const seenTypes = new Set<SectionType>();
  return variations
    .filter((v) => v.isActive && v.supportedPageTypes.includes(pageType))
    .map((variation) => {
      let score = 0;
      if (preferred.has(variation.sectionType)) score += 2;
      if (variation.sectionType === "hero") score += 1;
      return { variation, score };
    })
    .sort((a, b) => b.score - a.score)
    .filter(({ variation }) => {
      // At most one suggestion per type keeps the group varied.
      if (seenTypes.has(variation.sectionType)) return false;
      seenTypes.add(variation.sectionType);
      return true;
    })
    .slice(0, limit)
    .map((entry) => entry.variation);
}

/** Variation ids already used on the page, most recently added first. */
export function recentlyUsedVariationIds(sectionVariationIds: string[], limit = 4): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (let i = sectionVariationIds.length - 1; i >= 0 && result.length < limit; i--) {
    const id = sectionVariationIds[i];
    if (!seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }
  return result;
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

/** Parses "#rrggbb" or "rgb(a)(...)" into 0-255 channels + alpha (1 if absent). */
function parseColor(color: string): [number, number, number, number] | null {
  const hex = /^#?([\da-f]{6})$/i.exec(color.trim());
  if (hex) {
    const value = parseInt(hex[1], 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255, 1];
  }
  const rgba = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)$/i.exec(
    color.trim(),
  );
  if (rgba) {
    return [Number(rgba[1]), Number(rgba[2]), Number(rgba[3]), rgba[4] !== undefined ? Number(rgba[4]) : 1];
  }
  return null;
}

/**
 * Whether a background needs white text to stay readable, judged by the
 * background's own perceived brightness rather than by which semantic
 * background type produced it. A "dark" or "brand" background is only dark
 * because it usually is — a brand color light enough to defeat that
 * assumption (a pastel picked as the secondary/primary color) would
 * otherwise still force white text onto a pale surface. Translucent colors
 * (tinted "muted" backgrounds) are blended toward white first, since that's
 * what they render over.
 */
export function needsLightText(backgroundColor: string): boolean {
  const parsed = parseColor(backgroundColor);
  if (!parsed) return false;
  const [r, g, b, a] = parsed;
  const br = r * a + 255 * (1 - a);
  const bg = g * a + 255 * (1 - a);
  const bb = b * a + 255 * (1 - a);
  const brightness = (br * 299 + bg * 587 + bb * 114) / 1000;
  return brightness < 150;
}

/**
 * Whether two colors are close enough that text/a border drawn in one would
 * disappear against a fill of the other — an outline button colored with the
 * brand primary, sitting on a section whose background is *also* the brand
 * primary (background type "brand"), is the concrete case this catches.
 * Unresolvable colors return false (assume fine) rather than block on it.
 */
export function colorsTooSimilar(a: string, b: string): boolean {
  const pa = parseColor(a);
  const pb = parseColor(b);
  if (!pa || !pb) return false;
  const distance = Math.sqrt((pa[0] - pb[0]) ** 2 + (pa[1] - pb[1]) ** 2 + (pa[2] - pb[2]) ** 2);
  return distance < 60;
}
