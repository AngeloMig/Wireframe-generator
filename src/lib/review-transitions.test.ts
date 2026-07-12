import { describe, expect, it } from "vitest";
import { PROJECT_TRANSITIONS, findTransition } from "./review-transitions";
import type { ProjectStatus } from "@/types";

const path: [ProjectStatus, ProjectStatus][] = [
  ["customer-editing", "ready-for-review"],
  ["ready-for-review", "agency-reviewing"],
  ["agency-reviewing", "revisions-requested"],
  ["agency-reviewing", "awaiting-approval"],
];

describe("project review workflow", () => {
  it("defines every core transition", () => {
    for (const [from, to] of path) {
      expect(findTransition(PROJECT_TRANSITIONS, from, to), `${from} → ${to}`).toBeDefined();
    }
  });

  it("marks submission transitions as locking editing + snapshotting", () => {
    const submit = findTransition(PROJECT_TRANSITIONS, "customer-editing", "ready-for-review");
    expect(submit?.locksEditing).toBe(true);
    expect(submit?.createsVersion).toBe(true);
  });

  it("does not allow skipping review (editing → approved directly)", () => {
    expect(findTransition(PROJECT_TRANSITIONS, "customer-editing", "approved")).toBeUndefined();
  });
});
