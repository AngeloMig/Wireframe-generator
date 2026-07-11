import type { Project, SectionType } from "@/types";

/**
 * Draft copy from the project brief — all local, template-based (no AI, no
 * network). Pulls the company name, industry, goal, and audience from the
 * questionnaire so first drafts sound like the client, not lorem ipsum.
 */

function clean(value: string | undefined | null): string {
  return (value ?? "").trim();
}

export function suggestCopy(
  project: Project,
  sectionType: SectionType,
  fieldKey: string,
): string[] {
  const q = project.questionnaire;
  const company = clean(q.companyName) || clean(project.companyName) || "We";
  const industry = clean(q.industry).toLowerCase();
  const audience = clean(q.targetAudience);
  const description = clean(q.businessDescription);
  const goal = clean(q.mainGoal);

  const pool: string[] = [];
  const add = (...candidates: (string | null | undefined)[]) => {
    for (const candidate of candidates) {
      const value = clean(candidate);
      if (value && !pool.includes(value)) pool.push(value);
    }
  };

  if (fieldKey === "heading" || fieldKey === "ctaHeading") {
    if (sectionType === "hero") {
      add(
        industry && `${capitalize(industry)}, done properly`,
        audience && `Built for ${lowerFirst(audience)}`,
        `Welcome to ${company}`,
      );
    } else if (sectionType === "cta") {
      add(
        goal && `Ready to ${lowerFirst(goal)}?`,
        `Let's work together`,
        `Start with ${company} today`,
      );
    } else if (sectionType === "services") {
      add(`What ${company} can do for you`, "Services built around you", industry && `Everything your ${industry} project needs`);
    } else if (sectionType === "testimonials") {
      add("Don't just take our word for it", "What our clients say", `Why people choose ${company}`);
    } else if (sectionType === "faq") {
      add("Frequently asked questions", "Good to know", "You asked, we answered");
    } else {
      add(
        `About ${company}`,
        description && sentenceOf(description),
        goal && `Here to ${lowerFirst(goal)}`,
      );
    }
  } else if (fieldKey === "description" || fieldKey === "ctaDescription") {
    add(
      description && sentenceOf(description),
      audience && goal && `${company} helps ${lowerFirst(audience)} ${lowerFirst(goal)}.`,
      audience && `Made for ${lowerFirst(audience)} — no fluff, just results.`,
    );
  } else if (fieldKey === "eyebrow") {
    add(
      industry && capitalize(industry),
      company !== "We" ? company : null,
      goal && "Why choose us",
    );
  }

  return pool.slice(0, 3);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function lowerFirst(value: string): string {
  // Keep acronyms/proper nouns intact ("SEO", "B2B buyers").
  const first = value.charAt(0);
  return first === first.toUpperCase() && value.charAt(1) === value.charAt(1).toUpperCase()
    ? value
    : first.toLowerCase() + value.slice(1);
}

/** First sentence, trimmed to something headline-adjacent. */
function sentenceOf(text: string): string {
  const first = text.split(/(?<=[.!?])\s/)[0] ?? text;
  return first.length > 120 ? `${first.slice(0, 117).trimEnd()}…` : first;
}
