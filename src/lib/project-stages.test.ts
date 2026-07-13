import { describe, expect, it } from "vitest";
import { PROJECT_STAGE_STEPS, stageIndexOf, stageOf } from "./project-stages";
import { nextRecommendedAction } from "./project-utils";
import type { Project, ProjectStatus } from "@/types";

const ALL_STATUSES: ProjectStatus[] = [
  "draft",
  "customer-editing",
  "ready-for-review",
  "agency-reviewing",
  "revisions-requested",
  "customer-revising",
  "awaiting-approval",
  "partially-approved",
  "approved",
  "in-development",
  "completed",
  "archived",
];

function fakeProject(status: ProjectStatus): Project {
  return {
    id: "p1",
    name: "Test Project",
    companyName: "Testco",
    status,
    websiteType: "Ecommerce & Retail",
    organization: "Org",
    ownerId: "user-customer-1",
    questionnaire: {
      companyName: "Testco",
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
    },
    pages: [],
    activity: [],
    assets: [],
    lastEditedAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("stage model", () => {
  it("maps every status to a stage (archived to none)", () => {
    for (const status of ALL_STATUSES) {
      if (status === "archived") expect(stageOf(status)).toBeNull();
      else expect(stageOf(status)).not.toBeNull();
    }
  });

  it("orders stages along the journey", () => {
    expect(stageIndexOf("draft")).toBe(0);
    expect(stageIndexOf("ready-for-review")).toBe(1);
    expect(stageIndexOf("customer-revising")).toBe(2);
    expect(stageIndexOf("awaiting-approval")).toBe(3);
    expect(stageIndexOf("approved")).toBe(4);
    expect(stageIndexOf("archived")).toBe(-1);
    expect(PROJECT_STAGE_STEPS).toHaveLength(5);
  });
});

describe("nextRecommendedAction — role and stage aware", () => {
  it("sends the agency to the handoff on an approved project (regression)", () => {
    const action = nextRecommendedAction(fakeProject("approved"), "agency-pm");
    expect(action.href).toContain("/handoff");
    expect(action.label).not.toMatch(/refining/i);
  });

  it("sends the agency to the review queue on submission", () => {
    expect(nextRecommendedAction(fakeProject("ready-for-review"), "agency-designer").href)
      .toContain("/agency-review");
    expect(nextRecommendedAction(fakeProject("agency-reviewing"), "agency-designer").href)
      .toContain("/agency-review");
  });

  it("sends the customer to the revisions surface for revision rounds", () => {
    expect(nextRecommendedAction(fakeProject("revisions-requested"), "customer").href)
      .toContain("/revisions");
    expect(nextRecommendedAction(fakeProject("customer-revising"), "customer").href)
      .toContain("/revisions");
  });

  it("never links a customer outside their allowed routes", () => {
    // Customers can only open editor / review / revisions (plus /projects lists).
    const allowed = /\/(editor|review|revisions)$|^\/projects$/;
    for (const status of ALL_STATUSES) {
      const action = nextRecommendedAction(fakeProject(status), "customer");
      expect(action.href, `status=${status}`).toMatch(allowed);
    }
  });

  it("gives every status an explicit agency action (no fall-through)", () => {
    for (const status of ALL_STATUSES) {
      const action = nextRecommendedAction(fakeProject(status), "agency-pm");
      expect(action.label, `status=${status}`).not.toMatch(/refining/i);
      expect(action.href.length).toBeGreaterThan(0);
    }
  });
});
