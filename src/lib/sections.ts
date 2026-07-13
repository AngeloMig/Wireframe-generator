import { getSectionTypeDefinition } from "@/data/section-schemas";
import { getVariation } from "@/data/section-variations";
import type { PageSection, SectionNotes, SectionVariation } from "@/types";
import { createId } from "@/utils/id";

export function emptySectionNotes(): SectionNotes {
  return {
    customerNote: "",
    contentStatus: "not-started",
    imageRequirement: "none",
    agencyQuestion: "",
    quickNotes: [],
  };
}

interface CreateSectionOptions {
  contentOverrides?: Record<string, unknown>;
  order?: number;
}

/**
 * Navigation always sits at the top of the page and footers at the bottom,
 * whatever an edit tried to do — a drag or move that crosses those bounds
 * snaps back into the template zone. Relative order within each group is
 * preserved (stable partition).
 */
export function normalizeSectionOrder(sections: PageSection[]): PageSection[] {
  const nav = sections.filter((s) => s.sectionType === "navigation");
  const footer = sections.filter((s) => s.sectionType === "footer");
  const body = sections.filter(
    (s) => s.sectionType !== "navigation" && s.sectionType !== "footer",
  );
  return [...nav, ...body, ...footer];
}

/** Instantiate a page section from a library design variation. */
export function createSectionFromVariation(
  variation: SectionVariation,
  options: CreateSectionOptions = {},
): PageSection {
  const definition = getSectionTypeDefinition(variation.sectionType);
  return {
    id: createId(),
    sectionType: variation.sectionType,
    variationId: variation.id,
    content: structuredClone({
      ...definition.defaultContent,
      ...(variation.contentDefaults ?? {}),
      ...(options.contentOverrides ?? {}),
    }),
    layout: { ...variation.defaultLayout },
    style: { ...variation.defaultStyle },
    notes: emptySectionNotes(),
    isHidden: false,
    isLocked: false,
    order: options.order ?? 0,
    reviewStatus: "draft",
  };
}

/** Instantiate a section by variation id; returns null if the id is unknown. */
export function createSectionByVariationId(
  variationId: string,
  options: CreateSectionOptions = {},
): PageSection | null {
  const variation = getVariation(variationId);
  if (!variation) return null;
  return createSectionFromVariation(variation, options);
}

/**
 * Switch a section to a different design of the same type.
 * - Content is preserved untouched (all variations of a type share a schema,
 *   so nothing the customer wrote is ever dropped).
 * - The new variation's default layout applies.
 * - Style settings the customer customised (i.e. that differ from the current
 *   variation's defaults) carry over on top of the new variation's defaults.
 * - The section id is preserved.
 */
export function switchSectionVariation(
  section: PageSection,
  target: SectionVariation,
): PageSection {
  const current = getVariation(section.variationId);

  const style = { ...target.defaultStyle };
  if (current) {
    for (const key of Object.keys(style) as (keyof typeof style)[]) {
      if (section.style[key] !== current.defaultStyle[key]) {
        // The customer changed this away from the old default — keep it.
        (style[key] as unknown) = section.style[key];
      }
    }
  }

  return {
    ...section,
    variationId: target.id,
    layout: { ...target.defaultLayout },
    style,
  };
}
