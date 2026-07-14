import type { ActivityEntry, ActivityType, AppUser, Project, ProjectPage, UserRole } from "@/types";
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
  /** Short button label when it differs from the headline. */
  cta?: string;
}

/**
 * The single next step for this project, from the VIEWER's seat. Every status
 * maps to an explicit action for each side — no fall-through that tells an
 * agency user to "keep refining" an approved blueprint, and no customer links
 * to routes their role can't open (customers only reach editor/review/revisions).
 */
export function nextRecommendedAction(
  project: Project,
  role: UserRole = "customer",
): RecommendedAction {
  const base = `/projects/${project.id}`;
  const agency = role !== "customer";

  if (agency) {
    switch (project.status) {
      case "draft":
      case "customer-editing":
        return {
          label: "The customer is drafting",
          description: `${project.companyName} is building the blueprint. Watch Feedback for questions, or nudge them if it's gone quiet.`,
          href: `${base}/activity`,
          cta: "Open feedback",
        };
      case "ready-for-review":
        return {
          label: "Start the review",
          description: `${project.companyName} submitted the blueprint — give it a first pass in the review queue.`,
          href: `${base}/agency-review`,
          cta: "Start review",
        };
      case "agency-reviewing":
        return {
          label: "Continue the review",
          description: "Pick up where the team left off in the review queue.",
          href: `${base}/agency-review`,
          cta: "Continue review",
        };
      case "revisions-requested":
      case "customer-revising":
        return {
          label: "Waiting on customer revisions",
          description: "You asked for changes — the customer is working on them. Their progress shows up in Feedback.",
          href: `${base}/activity`,
          cta: "Open feedback",
        };
      case "awaiting-approval":
      case "partially-approved":
        return {
          label: "Waiting on customer approval",
          description: "The blueprint is with the customer for sign-off. A nudge might help if it's been a while.",
          href: `${base}/review`,
          cta: "View approval",
        };
      case "approved":
        return {
          label: "Prepare the handoff",
          description: "The customer approved the blueprint — export it for the build team.",
          href: `${base}/handoff`,
          cta: "Export handoff",
        };
      case "in-development":
        return {
          label: "Build in progress",
          description: "Track what was promised against the approved blueprint in the handoff sheet.",
          href: `${base}/handoff`,
          cta: "Open handoff",
        };
      case "completed":
        return {
          label: "Project completed",
          description: "Everything shipped. The handoff and version history stay available for reference.",
          href: `${base}/handoff`,
          cta: "Open handoff",
        };
      case "archived":
        return {
          label: "This project is archived",
          description: "Restore it from the projects list to keep working.",
          href: "/projects",
          cta: "All projects",
        };
    }
  }

  // Customer seat — checklist-driven while drafting, explicit elsewhere.
  // Customers can only open editor / review / revisions.
  switch (project.status) {
    case "revisions-requested":
      return {
        label: "Review requested revisions",
        description: "The agency has asked for changes — read their feedback first.",
        href: `${base}/revisions`,
        cta: "See revisions",
      };
    case "customer-revising":
      return {
        label: "Continue your revisions",
        description: "Finish the requested changes and submit them back.",
        href: `${base}/revisions`,
        cta: "Continue revisions",
      };
    case "ready-for-review":
    case "agency-reviewing":
      return {
        label: "The agency is reviewing",
        description: "You'll hear back soon. You can still browse and comment meanwhile.",
        href: `${base}/editor`,
        cta: "Open blueprint",
      };
    case "awaiting-approval":
    case "partially-approved":
      return {
        label: "Review and approve",
        description: "Your blueprint is ready for final approval.",
        href: `${base}/review`,
        cta: "Review & approve",
      };
    case "approved":
    case "in-development":
    case "completed":
      return {
        label: "Your blueprint is approved",
        description: "The agency is building it — you can revisit or download it anytime.",
        href: `${base}/review`,
        cta: "View blueprint",
      };
    case "archived":
      return {
        label: "This project is archived",
        description: "Ask your agency to restore it if something needs to change.",
        href: `${base}/review`,
        cta: "View project",
      };
    default:
      break;
  }

  const checklist = projectChecklist(project);
  const firstMissing = checklist.find((i) => i.required && !i.done);
  if (firstMissing) {
    // Everything a customer fixes lives in the editor (pages via the page
    // switcher, sections and content on the canvas).
    return {
      label:
        firstMissing.id === "homepage" || firstMissing.id === "pages"
          ? "Set up your pages"
          : firstMissing.id === "sections"
            ? "Build your homepage"
            : "Fill in your content",
      description: firstMissing.hint,
      href: `${base}/editor`,
      cta: "Open the editor",
    };
  }
  return {
    label: "Submit for agency review",
    description: "Everything required is in place — open the editor and hit Submit.",
    href: `${base}/editor`,
    cta: "Open the editor",
  };
}

/** Append an activity entry (newest first) and bump edit timestamps. */
export function withActivity(
  project: Project,
  type: ActivityType,
  message: string,
  actor: Pick<AppUser, "id" | "name" | "role">,
  meta?: { pageId?: string; sectionId?: string },
): Project {
  const entry: ActivityEntry = {
    id: createId(),
    projectId: project.id,
    type,
    message,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    pageId: meta?.pageId,
    sectionId: meta?.sectionId,
    createdAt: nowIso(),
  };
  return {
    ...project,
    activity: [entry, ...project.activity],
    lastEditedAt: entry.createdAt,
  };
}

/**
 * Same as `withActivity`, but bursts of edits to the same section from the
 * same actor collapse into one entry (the timestamp and message just bump)
 * instead of flooding the feed with one row per keystroke. Anyone reviewing
 * "what changed" — the activity page, the dashboard, a "customer is editing"
 * notification deep link — sees one live line per section, not a wall of noise.
 */
export function withThrottledActivity(
  project: Project,
  type: ActivityType,
  message: string,
  actor: Pick<AppUser, "id" | "name" | "role">,
  meta: { pageId?: string; sectionId?: string },
  windowMs = 3 * 60 * 1000,
): Project {
  const [latest, ...rest] = project.activity;
  const canCollapse =
    latest &&
    latest.type === type &&
    latest.actorId === actor.id &&
    latest.sectionId === meta.sectionId &&
    Date.now() - new Date(latest.createdAt).getTime() < windowMs;
  const now = nowIso();
  if (canCollapse) {
    return {
      ...project,
      activity: [{ ...latest, message, createdAt: now }, ...rest],
      lastEditedAt: now,
    };
  }
  return withActivity(project, type, message, actor, meta);
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
