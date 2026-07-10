import { getSectionTemplate } from "@/data/section-templates";
import type { PageSection, SectionNotes, SectionTemplate } from "@/types";
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
  variationId?: string;
  contentOverrides?: Record<string, unknown>;
  order?: number;
}

/** Instantiate a page section from a library template. */
export function createSectionFromTemplate(
  template: SectionTemplate,
  options: CreateSectionOptions = {},
): PageSection {
  return {
    id: createId(),
    templateId: template.id,
    variationId: options.variationId ?? template.variations[0]?.id ?? "default",
    content: structuredClone({
      ...template.defaultContent,
      ...(options.contentOverrides ?? {}),
    }),
    layout: { ...template.defaultLayout },
    style: { ...template.defaultStyle },
    notes: emptySectionNotes(),
    isHidden: false,
    isLocked: false,
    order: options.order ?? 0,
  };
}

/** Instantiate a section by template id; returns null if the id is unknown. */
export function createSectionByTemplateId(
  templateId: string,
  options: CreateSectionOptions = {},
): PageSection | null {
  const template = getSectionTemplate(templateId);
  if (!template) return null;
  return createSectionFromTemplate(template, options);
}
