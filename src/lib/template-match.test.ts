import { describe, expect, it } from "vitest";
import {
  hasRecommendationSignal,
  matchesCollection,
  recommendTemplates,
  scoreTemplate,
} from "./template-match";
import type { PageTemplate, ProjectQuestionnaire } from "@/types";

function template(overrides: Partial<PageTemplate>): PageTemplate {
  return {
    id: "t",
    name: "T",
    description: "",
    pageType: "homepage",
    industries: [],
    goals: [],
    styles: [],
    sections: [],
    isActive: true,
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

const baseQ: ProjectQuestionnaire = {
  companyName: "",
  existingUrl: "",
  industry: "",
  businessDescription: "",
  mainGoal: "",
  targetAudience: "",
  estimatedPages: "4-6 pages",
  platform: "not-sure",
  goals: [],
  visualStyles: [],
  brand: null,
  inspirations: [],
};

describe("scoreTemplate", () => {
  it("rewards overlapping goals and styles, and industry match", () => {
    const q: ProjectQuestionnaire = {
      ...baseQ,
      industry: "Ecommerce & Retail",
      goals: ["sell-products", "collect-subscribers"],
      visualStyles: ["minimal", "premium"],
    };
    const strong = scoreTemplate(
      template({
        goals: ["sell-products", "collect-subscribers"],
        styles: ["minimal", "premium"],
        industries: ["Ecommerce & Retail"],
      }),
      q,
    );
    expect(strong.score).toBeCloseTo(1, 5);
    expect(strong.matchedGoals).toContain("sell-products");
    expect(strong.industryMatch).toBe(true);
  });

  it("scores an unrelated template at zero", () => {
    const q: ProjectQuestionnaire = { ...baseQ, goals: ["sell-products"], visualStyles: ["minimal"] };
    const weak = scoreTemplate(template({ goals: ["membership"], styles: ["bold"] }), q);
    expect(weak.score).toBe(0);
  });
});

describe("recommendTemplates", () => {
  it("ranks by fit and drops zero-signal templates", () => {
    const q: ProjectQuestionnaire = { ...baseQ, goals: ["sell-products"], visualStyles: ["minimal"] };
    const ranked = recommendTemplates(
      [
        template({ id: "match", goals: ["sell-products"], styles: ["minimal"] }),
        template({ id: "none", goals: ["membership"], styles: ["bold"] }),
        template({ id: "partial", goals: ["sell-products"], styles: ["bold"] }),
      ],
      q,
    );
    expect(ranked.map((m) => m.template.id)).toEqual(["match", "partial"]);
  });
});

describe("collections + signal", () => {
  it("classifies by section count and goals", () => {
    expect(matchesCollection(template({ sections: new Array(6).fill({ variationId: "x" }) }), "fast")).toBe(true);
    expect(matchesCollection(template({ sections: new Array(10).fill({ variationId: "x" }) }), "content-rich")).toBe(true);
    expect(matchesCollection(template({ goals: ["generate-leads"] }), "conversion")).toBe(true);
    expect(matchesCollection(template({ styles: ["premium"] }), "premium")).toBe(true);
  });

  it("detects whether there is anything to recommend against", () => {
    expect(hasRecommendationSignal(baseQ)).toBe(false);
    expect(hasRecommendationSignal({ ...baseQ, goals: ["sell-products"] })).toBe(true);
  });
});
