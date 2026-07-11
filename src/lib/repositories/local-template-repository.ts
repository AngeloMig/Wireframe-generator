import { PAGE_TEMPLATES } from "@/data/page-templates";
import { SECTION_VARIATIONS } from "@/data/section-variations";
import type { PageTemplate, SectionVariation } from "@/types";
import { nowIso } from "@/utils/id";
import { readJson, STORAGE_KEYS, writeJson } from "../storage/local-storage";
import type { TemplateRepository } from "./types";

type VariationOverrides = Record<string, Partial<SectionVariation>>;

/**
 * Section design variations ship as static data; admin edits are stored as
 * local overrides merged on read. Supabase will later own the full records.
 */
export class LocalTemplateRepository implements TemplateRepository {
  private readOverrides(): VariationOverrides {
    const overrides = readJson<VariationOverrides>(STORAGE_KEYS.sectionVariationOverrides, {});
    return overrides && typeof overrides === "object" ? overrides : {};
  }

  async getSectionVariations(): Promise<SectionVariation[]> {
    const overrides = this.readOverrides();
    return SECTION_VARIATIONS.map((variation) => ({
      ...variation,
      ...overrides[variation.id],
      id: variation.id,
      sectionType: variation.sectionType,
      componentKey: variation.componentKey,
    }));
  }

  async getPageTemplates(): Promise<PageTemplate[]> {
    return PAGE_TEMPLATES;
  }

  async updateSectionVariation(
    id: string,
    updates: Partial<SectionVariation>,
  ): Promise<SectionVariation | null> {
    const base = SECTION_VARIATIONS.find((v) => v.id === id);
    if (!base) return null;
    const overrides = this.readOverrides();
    overrides[id] = { ...overrides[id], ...updates, updatedAt: nowIso() };
    writeJson(STORAGE_KEYS.sectionVariationOverrides, overrides);
    return {
      ...base,
      ...overrides[id],
      id,
      sectionType: base.sectionType,
      componentKey: base.componentKey,
    };
  }
}

export const templateRepository: LocalTemplateRepository = new LocalTemplateRepository();
