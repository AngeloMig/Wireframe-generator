import { describe, expect, it } from "vitest";
import { canEditInEditor, canEditProjectContent } from "./permissions";
import type { ProjectStatus, UserRole } from "@/types";

const EDITABLE: ProjectStatus[] = [
  "draft",
  "customer-editing",
  "revisions-requested",
  "customer-revising",
];
const LOCKED_FOR_CUSTOMER: ProjectStatus[] = [
  "ready-for-review",
  "agency-reviewing",
  "awaiting-approval",
  "partially-approved",
  "approved",
  "in-development",
  "completed",
  "archived",
];

describe("canEditProjectContent", () => {
  it("lets customers edit only during editable phases", () => {
    for (const s of EDITABLE) expect(canEditProjectContent("customer", s)).toBe(true);
    for (const s of LOCKED_FOR_CUSTOMER) expect(canEditProjectContent("customer", s)).toBe(false);
  });

  it("always lets admins edit", () => {
    for (const s of [...EDITABLE, ...LOCKED_FOR_CUSTOMER]) {
      expect(canEditProjectContent("admin", s)).toBe(true);
    }
  });
});

describe("canEditInEditor — the review lock", () => {
  // Regression guard: an access grant must NEVER unlock a submitted project.
  it("keeps a submitted project locked even with edit access or an approved request", () => {
    for (const status of LOCKED_FOR_CUSTOMER) {
      expect(canEditInEditor("customer", status, { memberAccess: "edit" })).toBe(false);
      expect(canEditInEditor("customer", status, { approvedAccessRequest: true })).toBe(false);
    }
  });

  it("lets an owner/edit customer edit during editable phases", () => {
    for (const status of EDITABLE) {
      expect(canEditInEditor("customer", status, {})).toBe(true); // owner, no member record
      expect(canEditInEditor("customer", status, { memberAccess: "edit" })).toBe(true);
      expect(canEditInEditor("customer", status, { approvedAccessRequest: true })).toBe(true);
    }
  });

  it("blocks a view/comment-only customer until they gain edit access", () => {
    expect(canEditInEditor("customer", "customer-editing", { memberAccess: "view" })).toBe(false);
    expect(canEditInEditor("customer", "customer-editing", { memberAccess: "comment" })).toBe(false);
    // ...but an approved access request unlocks them
    expect(
      canEditInEditor("customer", "customer-editing", {
        memberAccess: "view",
        approvedAccessRequest: true,
      }),
    ).toBe(true);
  });

  it("lets agency roles edit whenever the status allows", () => {
    const agency: UserRole[] = ["agency-designer", "agency-developer", "agency-pm"];
    for (const role of agency) {
      expect(canEditInEditor(role, "agency-reviewing", {})).toBe(true);
      expect(canEditInEditor(role, "approved", {})).toBe(false); // status still gates
    }
  });
});
