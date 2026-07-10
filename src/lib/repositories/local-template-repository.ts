import { PAGE_TEMPLATES } from "@/data/page-templates";
import { SECTION_TEMPLATES } from "@/data/section-templates";
import type { PageTemplate, SectionTemplate } from "@/types";
import { nowIso } from "@/utils/id";
import { readJson, STORAGE_KEYS, writeJson } from "../storage/local-storage";
import type { TemplateRepository } from "./types";

type TemplateOverrides = Record<string, Partial<SectionTemplate>>;

/**
 * Templates ship as static data; admin edits are stored as local overrides
 * merged on read. Supabase will later own the full records.
 */
export class LocalTemplateRepository implements TemplateRepository {
  private readOverrides(): TemplateOverrides {
    const overrides = readJson<TemplateOverrides>(STORAGE_KEYS.sectionTemplateOverrides, {});
    return overrides && typeof overrides === "object" ? overrides : {};
  }

  async getSectionTemplates(): Promise<SectionTemplate[]> {
    const overrides = this.readOverrides();
    return SECTION_TEMPLATES.map((template) => ({
      ...template,
      ...overrides[template.id],
      id: template.id,
    }));
  }

  async getPageTemplates(): Promise<PageTemplate[]> {
    return PAGE_TEMPLATES;
  }

  async updateSectionTemplate(
    id: string,
    updates: Partial<SectionTemplate>,
  ): Promise<SectionTemplate | null> {
    const base = SECTION_TEMPLATES.find((t) => t.id === id);
    if (!base) return null;
    const overrides = this.readOverrides();
    overrides[id] = { ...overrides[id], ...updates, updatedAt: nowIso() };
    writeJson(STORAGE_KEYS.sectionTemplateOverrides, overrides);
    return { ...base, ...overrides[id], id };
  }
}

export const templateRepository: LocalTemplateRepository = new LocalTemplateRepository();
