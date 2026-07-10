import { PAGE_TEMPLATES } from "@/data/page-templates";
import type { PageTemplate, WebsiteGoal } from "@/types";

/**
 * Local (non-AI) recommendation logic: score page templates against the
 * questionnaire's industry and goals, highest score wins.
 */
export function recommendPageTemplates(
  industry: string,
  goals: WebsiteGoal[],
): PageTemplate[] {
  const scored = PAGE_TEMPLATES.filter((t) => t.isActive).map((template) => {
    let score = 0;
    if (template.industries.includes(industry)) score += 3;
    for (const goal of goals) {
      if (template.goals.includes(goal)) score += 2;
    }
    return { template, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.template);
}

export function bestTemplateFor(
  industry: string,
  goals: WebsiteGoal[],
): PageTemplate {
  return recommendPageTemplates(industry, goals)[0] ?? PAGE_TEMPLATES[0];
}
