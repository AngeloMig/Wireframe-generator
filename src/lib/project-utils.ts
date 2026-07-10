import type { ActivityEntry, ActivityType, AppUser, Project, ProjectPage } from "@/types";
import { createId, nowIso } from "@/utils/id";

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  required: boolean;
  hint: string;
}

/** Checklist used for completion % and the submit-for-review modal. */
export function projectChecklist(project: Project): ChecklistItem[] {
  const q = project.questionnaire;
  const homepage = project.pages.find((p) => p.isHomepage);
  const homepageSections = homepage?.sections.length ?? 0;
  const sectionsWithNotes = project.pages.some((p) =>
    p.sections.some((s) => s.notes.customerNote.trim().length > 0 || s.notes.quickNotes.length > 0),
  );

  return [
    {
      id: "homepage",
      label: "Homepage created",
      done: Boolean(homepage),
      required: true,
      hint: "Every blueprint needs a homepage.",
    },
    {
      id: "pages",
      label: "Required pages added",
      done: project.pages.length >= 2,
      required: true,
      hint: "Add at least one page besides the homepage.",
    },
    {
      id: "sections",
      label: "Main sections selected",
      done: homepageSections >= 4,
      required: true,
      hint: "Your homepage should have at least four sections.",
    },
    {
      id: "content",
      label: "Basic content added",
      done: Boolean(q.businessDescription.trim() && q.mainGoal.trim()),
      required: true,
      hint: "Describe your business and main goal in the questionnaire.",
    },
    {
      id: "brand",
      label: "Brand preferences completed",
      done: q.brand !== null,
      required: false,
      hint: "Optional, but helps the agency match your style.",
    },
    {
      id: "inspiration",
      label: "Inspiration websites added",
      done: q.inspirations.length > 0,
      required: false,
      hint: "Optional examples of sites you like.",
    },
    {
      id: "notes",
      label: "Notes reviewed",
      done: sectionsWithNotes,
      required: false,
      hint: "Optional notes help the agency understand your intent.",
    },
  ];
}

export function projectCompletion(project: Project): number {
  const items = projectChecklist(project);
  const done = items.filter((i) => i.done).length;
  return Math.round((done / items.length) * 100);
}

export function canSubmitProject(project: Project): boolean {
  return projectChecklist(project)
    .filter((i) => i.required)
    .every((i) => i.done);
}

export interface RecommendedAction {
  label: string;
  description: string;
  href: string;
}

export function nextRecommendedAction(project: Project): RecommendedAction {
  const base = `/projects/${project.id}`;
  if (project.status === "revisions-requested") {
    return {
      label: "Review requested revisions",
      description: "The agency has asked for changes — read their feedback first.",
      href: `${base}/review`,
    };
  }
  if (project.status === "awaiting-approval") {
    return {
      label: "Review and approve",
      description: "Your blueprint is ready for final approval.",
      href: `${base}/review`,
    };
  }
  const checklist = projectChecklist(project);
  const firstMissing = checklist.find((i) => i.required && !i.done);
  if (firstMissing) {
    switch (firstMissing.id) {
      case "homepage":
      case "pages":
        return {
          label: "Set up your pages",
          description: firstMissing.hint,
          href: `${base}/sitemap`,
        };
      case "sections":
        return {
          label: "Build your homepage",
          description: firstMissing.hint,
          href: `${base}/editor`,
        };
      case "content":
        return {
          label: "Complete the questionnaire",
          description: firstMissing.hint,
          href: `${base}/questionnaire`,
        };
    }
  }
  if (project.status === "customer-editing" || project.status === "draft") {
    return {
      label: "Submit for agency review",
      description: "Everything required is in place — send it to the agency.",
      href: `${base}/review`,
    };
  }
  return {
    label: "Keep refining your blueprint",
    description: "Add detail to sections, notes, and content.",
    href: `${base}/editor`,
  };
}

/** Append an activity entry (newest first) and bump edit timestamps. */
export function withActivity(
  project: Project,
  type: ActivityType,
  message: string,
  actor: Pick<AppUser, "id" | "name" | "role">,
): Project {
  const entry: ActivityEntry = {
    id: createId(),
    projectId: project.id,
    type,
    message,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    createdAt: nowIso(),
  };
  return {
    ...project,
    activity: [entry, ...project.activity],
    lastEditedAt: entry.createdAt,
  };
}

/** Build a CreateProjectInput that deep-clones a project with fresh IDs. */
export function cloneProjectAsInput(project: Project) {
  const pageIdMap = new Map<string, string>();
  project.pages.forEach((page) => pageIdMap.set(page.id, createId()));
  return {
    name: `${project.name} (Copy)`,
    companyName: project.companyName,
    websiteType: project.websiteType,
    questionnaire: structuredClone(project.questionnaire),
    pages: project.pages.map((page) => ({
      id: pageIdMap.get(page.id)!,
      name: page.name,
      navLabel: page.navLabel,
      type: page.type,
      status: "draft" as const,
      isHomepage: page.isHomepage,
      inMainNav: page.inMainNav,
      footerOnly: page.footerOnly,
      parentId: page.parentId ? (pageIdMap.get(page.parentId) ?? null) : null,
      order: page.order,
      sections: page.sections.map((section) => ({
        ...structuredClone(section),
        id: createId(),
      })),
    })),
  };
}

/** Normalise page order values within each level (top level and per parent). */
export function normalisePageOrder(pages: ProjectPage[]): ProjectPage[] {
  const topLevel = pages
    .filter((p) => !p.parentId)
    .sort((a, b) => a.order - b.order);
  const result: ProjectPage[] = [];
  topLevel.forEach((page, index) => {
    result.push({ ...page, order: index });
    const children = pages
      .filter((p) => p.parentId === page.id)
      .sort((a, b) => a.order - b.order);
    children.forEach((child, childIndex) => {
      result.push({ ...child, order: childIndex });
    });
  });
  // Orphans (parent deleted) get promoted to top level.
  const known = new Set(result.map((p) => p.id));
  pages
    .filter((p) => !known.has(p.id))
    .forEach((orphan, i) => {
      result.push({ ...orphan, parentId: null, order: topLevel.length + i });
    });
  return result;
}
