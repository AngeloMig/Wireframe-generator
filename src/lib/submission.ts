import type { Project, ProjectComment, ProjectPage } from "@/types";

/**
 * Pre-submission validation. Warnings inform but don't block; only structural
 * problems (no homepage, empty included pages, invalid details) block.
 */

export interface SubmissionIssue {
  id: string;
  label: string;
  detail?: string;
  blocking: boolean;
}

export interface SubmissionReport {
  /** Pages that will be part of the submission (have content). */
  includedPages: ProjectPage[];
  /** Empty pages left out of the submission. */
  excludedPages: ProjectPage[];
  totalSections: number;
  issues: SubmissionIssue[];
  blocked: boolean;
  openCustomerActionItems: ProjectComment[];
  unresolvedCustomerComments: ProjectComment[];
}

export function buildSubmissionReport(
  project: Project,
  comments: ProjectComment[],
): SubmissionReport {
  const issues: SubmissionIssue[] = [];

  const validPages = project.pages.filter(
    (p) => Array.isArray(p.sections) && typeof p.name === "string",
  );
  if (validPages.length !== project.pages.length) {
    issues.push({
      id: "corrupted-pages",
      label: "Some page data could not be read",
      detail: "Try Reset Demo Data in Settings if this persists.",
      blocking: true,
    });
  }

  const homepage = validPages.find((p) => p.isHomepage);
  if (!homepage) {
    issues.push({
      id: "missing-homepage",
      label: "The blueprint has no homepage",
      detail: "Add a homepage before submitting.",
      blocking: true,
    });
  } else if (homepage.sections.length === 0) {
    issues.push({
      id: "empty-homepage",
      label: "The homepage has no sections",
      detail: "Add sections to the homepage before submitting.",
      blocking: true,
    });
  }

  if (!project.name.trim() || !project.companyName.trim()) {
    issues.push({
      id: "missing-details",
      label: "Project name or company name is missing",
      blocking: true,
    });
  }

  const includedPages = validPages.filter((p) => p.sections.length > 0);
  const excludedPages = validPages.filter((p) => p.sections.length === 0);

  for (const page of excludedPages) {
    issues.push({
      id: `empty-page-${page.id}`,
      label: `“${page.name}” has no sections yet`,
      detail: "It will be left out of this submission.",
      blocking: false,
    });
  }

  // Missing content warnings.
  for (const page of includedPages) {
    const missing = page.sections.filter(
      (s) => s.notes.contentStatus === "not-started",
    ).length;
    if (missing > 0) {
      issues.push({
        id: `content-${page.id}`,
        label: `${page.name}: ${missing} section${missing === 1 ? "" : "s"} without content`,
        detail: "The agency will see placeholder content there.",
        blocking: false,
      });
    }
  }

  if (!project.questionnaire.businessDescription.trim()) {
    issues.push({
      id: "questionnaire",
      label: "The questionnaire is missing a business description",
      blocking: false,
    });
  }

  const openCustomerActionItems = comments.filter(
    (c) =>
      c.isActionItem &&
      !c.completedAt &&
      (c.status === "open" || c.status === "in-progress" || c.status === "reopened"),
  );
  if (openCustomerActionItems.length > 0) {
    issues.push({
      id: "action-items",
      label: `${openCustomerActionItems.length} open action item${openCustomerActionItems.length === 1 ? "" : "s"}`,
      detail: "You can submit anyway, but the agency may wait on these.",
      blocking: false,
    });
  }

  const unresolvedCustomerComments = comments.filter(
    (c) =>
      !c.isActionItem &&
      c.visibility === "customer" &&
      (c.status === "open" || c.status === "reopened"),
  );
  if (unresolvedCustomerComments.length > 0) {
    issues.push({
      id: "open-comments",
      label: `${unresolvedCustomerComments.length} unresolved comment${unresolvedCustomerComments.length === 1 ? "" : "s"}`,
      blocking: false,
    });
  }

  return {
    includedPages,
    excludedPages,
    totalSections: includedPages.reduce((sum, p) => sum + p.sections.length, 0),
    issues,
    blocked: issues.some((i) => i.blocking),
    openCustomerActionItems,
    unresolvedCustomerComments,
  };
}

/** Warnings shown before a customer submits revisions back to the agency. */
export interface RevisionSubmitWarnings {
  openRequiredActionItems: ProjectComment[];
  unresolvedHighPriority: ProjectComment[];
  missingContentSections: number;
}

export function buildRevisionWarnings(
  project: Project,
  comments: ProjectComment[],
): RevisionSubmitWarnings {
  return {
    openRequiredActionItems: comments.filter((c) => c.isActionItem && !c.completedAt),
    unresolvedHighPriority: comments.filter(
      (c) =>
        (c.priority === "high" || c.priority === "urgent") &&
        (c.status === "open" || c.status === "reopened") &&
        c.visibility === "customer",
    ),
    missingContentSections: project.pages.reduce(
      (sum, p) =>
        sum + p.sections.filter((s) => s.notes.contentStatus === "not-started").length,
      0,
    ),
  };
}
