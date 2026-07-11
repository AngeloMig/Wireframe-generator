import { PAGE_TYPE_LABELS, SECTION_TYPE_LABELS } from "@/config/labels";
import { getVariation } from "@/data/section-variations";
import type {
  ActivityEntry,
  ApprovalRecord,
  BrandPreferences,
  PageSection,
  Project,
  ProjectComment,
  ProjectPage,
} from "@/types";

/**
 * Development-handoff export. Two flavours:
 * - internal: includes agency-only notes, clearly labelled
 * - customer: excludes internal comments, developer notes, and assignments
 */

export interface SectionHandoffExport {
  id: string;
  sectionType: string;
  sectionTypeLabel: string;
  variationId: string;
  variationName: string;
  content: Record<string, unknown>;
  layout: PageSection["layout"];
  style: PageSection["style"];
  responsiveNotes: {
    hidden: boolean;
    contentStatus: string;
    imageRequirement: string;
  };
  customerNote: string;
  /** Present only in internal exports. */
  agencyQuestion?: string;
  quickNotes: string[];
  reviewStatus: string;
}

export interface PageHandoffExport {
  id: string;
  name: string;
  type: string;
  typeLabel: string;
  slug: string;
  navigation: { inMainNav: boolean; footerOnly: boolean; parentId: string | null };
  status: string;
  sections: SectionHandoffExport[];
}

export interface SitemapExportItem {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
  isHomepage: boolean;
}

export interface ProjectHandoffExport {
  exportedAt: string;
  exportVersion: string;
  audience: "internal" | "customer";

  project: {
    id: string;
    name: string;
    companyName: string;
    platform: string;
    status: string;
    approvedVersionId?: string;
    approvedAt?: string;
  };

  designSystem: {
    brand: BrandPreferences | null;
    visualStyles: string[];
    industry: string;
    mainGoal: string;
    targetAudience: string;
  };
  sitemap: SitemapExportItem[];
  pages: PageHandoffExport[];

  comments: ProjectComment[];
  approvals: ApprovalRecord[];
  activitySummary: ActivityEntry[];
  openItems: { message: string; priority: string; dueDate?: string }[];
}

function slugFor(page: ProjectPage): string {
  if (page.isHomepage) return "/";
  return `/${page.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function exportSection(section: PageSection, internal: boolean): SectionHandoffExport {
  const variation = getVariation(section.variationId);
  return {
    id: section.id,
    sectionType: section.sectionType,
    sectionTypeLabel: SECTION_TYPE_LABELS[section.sectionType],
    variationId: section.variationId,
    variationName: variation?.name ?? section.variationId,
    content: section.content,
    layout: section.layout,
    style: section.style,
    responsiveNotes: {
      hidden: section.isHidden,
      contentStatus: section.notes.contentStatus,
      imageRequirement: section.notes.imageRequirement,
    },
    customerNote: section.notes.customerNote,
    ...(internal && section.notes.agencyQuestion
      ? { agencyQuestion: `[INTERNAL] ${section.notes.agencyQuestion}` }
      : {}),
    quickNotes: section.notes.quickNotes,
    reviewStatus: section.reviewStatus,
  };
}

export function buildHandoffExport(
  project: Project,
  comments: ProjectComment[],
  approvals: ApprovalRecord[],
  audience: "internal" | "customer",
): ProjectHandoffExport {
  const internal = audience === "internal";

  // Privacy filtering: customer exports never include agency-only comments.
  const exportComments = internal
    ? comments
    : comments
        .filter((c) => c.visibility === "customer")
        .map((c) => ({ ...c, assignedToId: undefined }));

  const openItems = comments
    .filter(
      (c) =>
        (internal || c.visibility === "customer") &&
        c.status !== "resolved" &&
        c.priority !== "urgent",
    )
    .map((c) => ({
      message: c.message,
      priority: c.priority,
      dueDate: c.dueDate,
    }));

  const orderedPages = [...project.pages].sort(
    (a, b) => Number(b.isHomepage) - Number(a.isHomepage) || a.order - b.order,
  );

  return {
    exportedAt: new Date().toISOString(),
    exportVersion: "1.0",
    audience,
    project: {
      id: project.id,
      name: project.name,
      companyName: project.companyName,
      platform: project.questionnaire.platform,
      status: project.status,
      approvedVersionId: project.approvedVersionId,
      approvedAt: project.approvedAt,
    },
    designSystem: {
      brand: project.questionnaire.brand,
      visualStyles: project.questionnaire.visualStyles,
      industry: project.questionnaire.industry,
      mainGoal: project.questionnaire.mainGoal,
      targetAudience: project.questionnaire.targetAudience,
    },
    sitemap: orderedPages.map((p) => ({
      id: p.id,
      name: p.name,
      parentId: p.parentId,
      order: p.order,
      isHomepage: p.isHomepage,
    })),
    pages: orderedPages.map((page) => ({
      id: page.id,
      name: page.name,
      type: page.type,
      typeLabel: PAGE_TYPE_LABELS[page.type],
      slug: slugFor(page),
      navigation: {
        inMainNav: page.inMainNav,
        footerOnly: page.footerOnly,
        parentId: page.parentId,
      },
      status: page.status,
      sections: [...page.sections]
        .sort((a, b) => a.order - b.order)
        .map((s) => exportSection(s, internal)),
    })),
    comments: exportComments,
    approvals,
    activitySummary: project.activity.slice(0, 50),
    openItems,
  };
}

/** Plain-text content summary for "Copy Content Summary". */
export function buildContentSummary(project: Project): string {
  const lines: string[] = [
    `${project.name} — Content Summary`,
    `${project.companyName} · ${project.websiteType}`,
    "",
  ];
  const orderedPages = [...project.pages].sort(
    (a, b) => Number(b.isHomepage) - Number(a.isHomepage) || a.order - b.order,
  );
  for (const page of orderedPages) {
    lines.push(`${page.name.toUpperCase()}${page.isHomepage ? " (homepage)" : ""}`);
    const sections = [...page.sections].sort((a, b) => a.order - b.order);
    if (sections.length === 0) {
      lines.push("  (no sections)");
    }
    for (const section of sections) {
      const variation = getVariation(section.variationId);
      lines.push(`  • ${variation?.name ?? SECTION_TYPE_LABELS[section.sectionType]}`);
      for (const key of ["eyebrow", "heading", "description", "buttonLabel"]) {
        const value = section.content[key];
        if (typeof value === "string" && value.trim()) {
          lines.push(`      ${key}: ${value}`);
        }
      }
    }
    lines.push("");
  }
  return lines.join("\n");
}
