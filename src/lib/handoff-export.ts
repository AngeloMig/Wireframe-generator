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

/**
 * Human-readable Markdown developer brief built from a handoff export.
 * Developers generally want a scannable spec, not raw JSON — this renders
 * the same structured export as a readable document.
 */
export function buildHandoffMarkdown(exp: ProjectHandoffExport): string {
  const out: string[] = [];
  const p = exp.project;
  out.push(`# ${p.name} — Development Handoff`, "");
  out.push(
    `> Exported ${new Date(exp.exportedAt).toLocaleString()} · ${
      exp.audience === "internal" ? "Internal (agency)" : "Customer"
    } copy · Status: ${p.status}`,
    "",
  );

  out.push("## Project", "");
  out.push(`- **Company:** ${p.companyName}`);
  out.push(`- **Platform:** ${p.platform}`);
  if (exp.designSystem.mainGoal) out.push(`- **Main goal:** ${exp.designSystem.mainGoal}`);
  if (exp.designSystem.targetAudience)
    out.push(`- **Audience:** ${exp.designSystem.targetAudience}`);
  if (exp.designSystem.industry) out.push(`- **Industry:** ${exp.designSystem.industry}`);
  out.push("");

  const brand = exp.designSystem.brand;
  if (brand || exp.designSystem.visualStyles.length > 0) {
    out.push("## Design system", "");
    if (brand) {
      if (brand.primaryColor) out.push(`- **Primary color:** \`${brand.primaryColor}\``);
      if (brand.secondaryColor) out.push(`- **Secondary color:** \`${brand.secondaryColor}\``);
      if (brand.accentColor) out.push(`- **Accent color:** \`${brand.accentColor}\``);
      if (brand.headingStyle) out.push(`- **Headings:** ${brand.headingStyle}`);
      if (brand.buttonStyle) out.push(`- **Buttons:** ${brand.buttonStyle}`);
      if (brand.borderRadius) out.push(`- **Corners:** ${brand.borderRadius}`);
    }
    if (exp.designSystem.visualStyles.length > 0)
      out.push(`- **Visual direction:** ${exp.designSystem.visualStyles.join(", ")}`);
    out.push("");
  }

  out.push("## Pages", "");
  for (const page of exp.pages) {
    const nav = page.navigation.footerOnly
      ? "footer only"
      : page.navigation.inMainNav
        ? "in main nav"
        : "not in nav";
    const slug = page.slug.startsWith("/") ? page.slug : `/${page.slug}`;
    out.push(`### ${page.name} \`${slug}\``);
    out.push(`_${page.typeLabel} · ${nav} · status: ${page.status}_`, "");
    if (page.sections.length === 0) {
      out.push("_No sections._", "");
      continue;
    }
    page.sections.forEach((section, i) => {
      const flags = [
        section.responsiveNotes.hidden ? "hidden" : null,
        section.responsiveNotes.imageRequirement
          ? `image: ${section.responsiveNotes.imageRequirement}`
          : null,
      ]
        .filter(Boolean)
        .join(", ");
      out.push(
        `${i + 1}. **${section.variationName}** — ${section.sectionTypeLabel}${flags ? ` _(${flags})_` : ""}`,
      );
      for (const key of ["eyebrow", "heading", "description", "buttonLabel"]) {
        const value = (section.content as Record<string, unknown>)[key];
        if (typeof value === "string" && value.trim()) {
          out.push(`   - ${key}: ${value.trim()}`);
        }
      }
      if (section.customerNote) out.push(`   - _note:_ ${section.customerNote}`);
      if (section.agencyQuestion) out.push(`   - ${section.agencyQuestion}`);
    });
    out.push("");
  }

  if (exp.openItems.length > 0) {
    out.push("## Open items", "");
    for (const item of exp.openItems) {
      out.push(`- [${item.priority}] ${item.message}${item.dueDate ? ` (due ${item.dueDate})` : ""}`);
    }
    out.push("");
  }

  return out.join("\n");
}
