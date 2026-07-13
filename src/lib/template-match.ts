import type {
  PageTemplate,
  ProjectQuestionnaire,
  VisualStyle,
  WebsiteGoal,
} from "@/types";

/**
 * Match built-in and custom page templates to a project's questionnaire, and
 * group them into curated collections. Pure functions so the templates page
 * stays declarative and this logic is easy to reason about.
 */

export interface TemplateMatch {
  template: PageTemplate;
  /** 0..1 overall fit. */
  score: number;
  matchedStyles: VisualStyle[];
  matchedGoals: WebsiteGoal[];
  industryMatch: boolean;
}

function overlap<T>(a: T[], b: T[]): T[] {
  const set = new Set(b);
  return a.filter((item) => set.has(item));
}

export function scoreTemplate(
  template: PageTemplate,
  q: ProjectQuestionnaire,
): TemplateMatch {
  const matchedStyles = overlap(template.styles, q.visualStyles);
  const matchedGoals = overlap(template.goals, q.goals);
  const industryMatch =
    Boolean(q.industry) &&
    template.industries.some((i) => i.toLowerCase() === q.industry.toLowerCase());

  // Goals carry the most intent, then look, then industry as a tiebreaker.
  const goalScore = q.goals.length ? matchedGoals.length / q.goals.length : 0;
  const styleScore = q.visualStyles.length ? matchedStyles.length / q.visualStyles.length : 0;
  const score = Math.min(1, 0.5 * goalScore + 0.35 * styleScore + (industryMatch ? 0.15 : 0));

  return { template, score, matchedStyles, matchedGoals, industryMatch };
}

/** Templates ranked by fit; only those with any signal are returned. */
export function recommendTemplates(
  templates: PageTemplate[],
  q: ProjectQuestionnaire,
  limit = 3,
): TemplateMatch[] {
  return templates
    .map((template) => scoreTemplate(template, q))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Whether the questionnaire has enough signal to recommend against. */
export function hasRecommendationSignal(q: ProjectQuestionnaire | undefined): boolean {
  return Boolean(q && (q.goals.length > 0 || q.visualStyles.length > 0 || q.industry));
}

// --- Curated collections ----------------------------------------------------

const CONVERSION_GOALS: WebsiteGoal[] = [
  "sell-products",
  "generate-leads",
  "book-appointments",
  "collect-subscribers",
];
const PREMIUM_STYLES: VisualStyle[] = ["premium", "editorial", "elegant", "luxury"];

export type CollectionId = "fast" | "conversion" | "premium" | "content-rich";

export const TEMPLATE_COLLECTIONS: {
  id: CollectionId;
  label: string;
  matches: (template: PageTemplate) => boolean;
}[] = [
  {
    id: "fast",
    label: "Fastest to launch",
    matches: (t) => t.sections.length <= 7,
  },
  {
    id: "conversion",
    label: "Conversion-focused",
    matches: (t) => overlap(t.goals, CONVERSION_GOALS).length > 0,
  },
  {
    id: "premium",
    label: "Premium & editorial",
    matches: (t) => overlap(t.styles, PREMIUM_STYLES).length > 0,
  },
  {
    id: "content-rich",
    label: "Content-rich",
    matches: (t) => t.sections.length >= 9,
  },
];

export function matchesCollection(template: PageTemplate, id: CollectionId): boolean {
  return TEMPLATE_COLLECTIONS.find((c) => c.id === id)?.matches(template) ?? true;
}
