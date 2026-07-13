import { SECTION_TYPE_LABELS } from "@/config/labels";
import { getVariation } from "@/data/section-variations";
import type { PageSection, ProjectPage, ProjectSnapshot } from "@/types";

/**
 * Customer-friendly comparison of two project snapshots. No source diffs —
 * plain sentences like "Heading changed" and "Two questions added".
 */

export interface SectionComparison {
  sectionName: string;
  kind: "added" | "removed" | "changed" | "reordered";
  details: string[];
}

export interface PageComparison {
  pageId?: string;
  pageName: string;
  kind: "added" | "removed" | "changed" | "reordered" | "unchanged";
  notes: string[];
  sections: SectionComparison[];
}

export interface VersionComparison {
  summary: string[];
  pages: PageComparison[];
  totalChanges: number;
}

function sectionDisplayName(section: PageSection): string {
  return getVariation(section.variationId)?.name ?? SECTION_TYPE_LABELS[section.sectionType];
}

function isImageValue(value: unknown): boolean {
  if (typeof value === "string") return true;
  return typeof value === "object" && value !== null && "url" in value;
}

/** Friendly description of a changed content key, or null to ignore. */
function describeContentChange(key: string, before: unknown, after: unknown): string | null {
  const lower = key.toLowerCase();
  if (Array.isArray(before) && Array.isArray(after)) {
    const delta = after.length - before.length;
    const noun = lower.includes("question")
      ? "question"
      : lower.includes("item")
        ? "item"
        : lower.includes("link")
          ? "link"
          : "item";
    if (delta > 0) return `${delta === 1 ? "One" : delta} ${noun}${delta === 1 ? "" : "s"} added`;
    if (delta < 0)
      return `${-delta === 1 ? "One" : -delta} ${noun}${-delta === 1 ? "" : "s"} removed`;
    if (JSON.stringify(before) !== JSON.stringify(after))
      return `${noun.charAt(0).toUpperCase() + noun.slice(1)}s updated`;
    return null;
  }
  if (JSON.stringify(before) === JSON.stringify(after)) return null;
  if (lower.includes("heading") || lower === "title") return "Heading changed";
  if (lower.includes("description") || lower.includes("text") || lower.includes("tagline"))
    return "Description changed";
  if (lower.includes("button") || lower.includes("cta")) return "Button label changed";
  if (lower.includes("eyebrow")) return "Eyebrow text changed";
  if (lower.includes("image") || lower.includes("logo") || isImageValue(after) || isImageValue(before))
    return "Image changed";
  if (lower.includes("placeholder")) return "Placeholder text changed";
  return `${key.charAt(0).toUpperCase() + key.slice(1)} updated`;
}

/** Field-level "what changed" summary between two revisions of one section. */
export function compareSections(before: PageSection, after: PageSection): string[] {
  const details: string[] = [];

  if (before.variationId !== after.variationId) {
    const fromName = getVariation(before.variationId)?.name ?? before.variationId;
    const toName = getVariation(after.variationId)?.name ?? after.variationId;
    details.push(`Design changed from ${fromName} to ${toName}`);
  }

  const keys = new Set([...Object.keys(before.content), ...Object.keys(after.content)]);
  const seen = new Set<string>();
  for (const key of keys) {
    const description = describeContentChange(key, before.content[key], after.content[key]);
    if (description && !seen.has(description)) {
      seen.add(description);
      details.push(description);
    }
  }

  if (JSON.stringify(before.layout) !== JSON.stringify(after.layout)) {
    details.push("Layout settings changed");
  }
  if (JSON.stringify(before.style) !== JSON.stringify(after.style)) {
    details.push("Style settings changed");
  }
  if (before.isHidden !== after.isHidden) {
    details.push(after.isHidden ? "Section hidden" : "Section shown");
  }
  if (before.reviewStatus !== after.reviewStatus) {
    details.push("Review status changed");
  }
  return details;
}

function comparePage(before: ProjectPage, after: ProjectPage): PageComparison {
  const notes: string[] = [];
  const sections: SectionComparison[] = [];

  if (before.name !== after.name) notes.push(`Renamed from “${before.name}”`);
  if (before.status !== after.status) notes.push("Page status changed");

  const beforeById = new Map(before.sections.map((s) => [s.id, s]));
  const afterById = new Map(after.sections.map((s) => [s.id, s]));

  for (const section of after.sections) {
    const prior = beforeById.get(section.id);
    if (!prior) {
      sections.push({
        sectionName: sectionDisplayName(section),
        kind: "added",
        details: ["Section added"],
      });
      continue;
    }
    const details = compareSections(prior, section);
    if (details.length > 0) {
      sections.push({ sectionName: sectionDisplayName(section), kind: "changed", details });
    }
  }
  for (const section of before.sections) {
    if (!afterById.has(section.id)) {
      sections.push({
        sectionName: sectionDisplayName(section),
        kind: "removed",
        details: ["Section removed"],
      });
    }
  }

  // Reordering: compare the sequence of surviving section ids.
  const beforeOrder = [...before.sections]
    .sort((a, b) => a.order - b.order)
    .map((s) => s.id)
    .filter((id) => afterById.has(id));
  const afterOrder = [...after.sections]
    .sort((a, b) => a.order - b.order)
    .map((s) => s.id)
    .filter((id) => beforeById.has(id));
  if (beforeOrder.join() !== afterOrder.join()) {
    notes.push("Sections reordered");
  }

  const changed = sections.length > 0 || notes.length > 0;
  return {
    pageId: after.id,
    pageName: after.name,
    kind: changed ? "changed" : "unchanged",
    notes,
    sections,
  };
}

export function compareSnapshots(
  before: ProjectSnapshot,
  after: ProjectSnapshot,
): VersionComparison {
  const summary: string[] = [];
  const pages: PageComparison[] = [];

  const beforeById = new Map(before.pages.map((p) => [p.id, p]));
  const afterById = new Map(after.pages.map((p) => [p.id, p]));

  const added = after.pages.filter((p) => !beforeById.has(p.id));
  const removed = before.pages.filter((p) => !afterById.has(p.id));
  if (added.length > 0) {
    summary.push(
      `${added.length} page${added.length === 1 ? "" : "s"} added: ${added.map((p) => p.name).join(", ")}`,
    );
  }
  if (removed.length > 0) {
    summary.push(
      `${removed.length} page${removed.length === 1 ? "" : "s"} removed: ${removed.map((p) => p.name).join(", ")}`,
    );
  }

  // Page order (surviving pages only).
  const beforeOrder = [...before.pages]
    .sort((a, b) => a.order - b.order)
    .map((p) => p.id)
    .filter((id) => afterById.has(id));
  const afterOrder = [...after.pages]
    .sort((a, b) => a.order - b.order)
    .map((p) => p.id)
    .filter((id) => beforeById.has(id));
  if (beforeOrder.join() !== afterOrder.join()) {
    summary.push("Pages reordered");
  }

  if (JSON.stringify(before.questionnaire.brand) !== JSON.stringify(after.questionnaire.brand)) {
    summary.push("Global design settings changed");
  }
  if (before.status !== after.status) {
    summary.push("Project status changed");
  }

  for (const page of added) {
    pages.push({
      pageId: page.id,
      pageName: page.name,
      kind: "added",
      notes: [`New page with ${page.sections.length} section${page.sections.length === 1 ? "" : "s"}`],
      sections: [],
    });
  }
  for (const page of removed) {
    pages.push({
      pageId: page.id,
      pageName: page.name,
      kind: "removed",
      notes: ["Page removed"],
      sections: [],
    });
  }
  for (const page of after.pages) {
    const prior = beforeById.get(page.id);
    if (prior) pages.push(comparePage(prior, page));
  }

  const totalChanges =
    summary.length +
    pages.reduce(
      (sum, p) => sum + p.notes.length + p.sections.reduce((s, sec) => s + sec.details.length, 0),
      0,
    );

  return { summary, pages, totalChanges };
}
