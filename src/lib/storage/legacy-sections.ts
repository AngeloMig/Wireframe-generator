import { getVariation } from "@/data/section-variations";
import type { PageSection, Project, SectionType } from "@/types";

/**
 * Schema v1 → v2 migration: v1 sections referenced one of 36 section
 * *templates* (templateId + cosmetic variationId). v2 sections reference a
 * section *type* plus a design variation from the prebuilt library. This maps
 * every known v1 (templateId, variationId) pair onto its closest v2 design
 * and renames content keys where the shared schemas changed.
 */

interface LegacySection {
  id: string;
  templateId?: string;
  variationId?: string;
  content?: Record<string, unknown>;
  [key: string]: unknown;
}

/** templateId → v2 variation id (or per-v1-variation map). */
const TEMPLATE_MAP: Record<string, string | Record<string, string>> = {
  "announcement-bar": "nav-announcement-bar",
  "header-standard": { default: "nav-standard", "with-cta": "nav-standard", minimal: "nav-minimal" },
  "header-centered": { default: "nav-centered", stacked: "nav-editorial" },
  "header-ecommerce": "nav-ecommerce",
  "hero-centered": "hero-centered",
  "hero-split": "hero-split",
  "hero-fullwidth": "hero-fullbg",
  "hero-form": "hero-form",
  "hero-product": "hero-product",
  "hero-stats": "hero-stats",
  "brand-intro": "content-intro",
  "image-text": "content-image-text",
  "mission-statement": "content-statement",
  "company-values": "content-values",
  "stats-section": "content-stats",
  "services-cards": { default: "svc-icon-cards", "image-cards": "svc-image-cards", bordered: "svc-icon-cards" },
  "services-alternating": "svc-alternating",
  "services-list": "svc-list",
  "services-process": { default: "svc-process", vertical: "svc-timeline" },
  "featured-products": "ecom-featured",
  "product-grid": "ecom-grid",
  "collection-cards": "ecom-collections",
  "best-sellers": "ecom-best-sellers",
  "product-benefits": "ecom-benefits",
  "testimonial-cards": { default: "testi-cards", "two-cards": "testi-two-column", masonry: "testi-masonry" },
  "testimonial-featured": "testi-featured",
  "logo-row": "marquee-logo-static",
  "review-summary": "testi-review-summary",
  "case-study-cards": "testi-case-studies",
  "faq-accordion": { default: "faq-accordion", "two-column": "faq-two-column", "with-contact": "faq-contact-cta" },
  "newsletter-signup": { default: "cta-newsletter", split: "cta-newsletter-split" },
  "consultation-cta": { default: "cta-centered", split: "cta-split" },
  "contact-form": "cta-contact-form",
  "blog-cards": "content-blog",
  "team-grid": "content-team",
};

/** Rename/reshape v1 content keys where the v2 shared schemas differ. */
function migrateContent(
  templateId: string,
  content: Record<string, unknown>,
  variationId: string,
): Record<string, unknown> {
  const next = { ...content };
  const items = Array.isArray(next.items) ? (next.items as Record<string, unknown>[]) : [];

  switch (templateId) {
    case "header-ecommerce":
      // The v1 ecommerce header always showed the account/cart icons; the
      // search bar was hidden only by the icons-only variation.
      next.showSearch = variationId !== "icons-only";
      next.showAccount = true;
      next.showCart = true;
      break;
    case "announcement-bar":
      next.announcementText = next.message ?? "";
      next.ctaLabel = next.linkLabel ?? "";
      next.ctaUrl = next.linkUrl ?? "";
      delete next.message;
      delete next.linkLabel;
      delete next.linkUrl;
      break;
    case "header-standard":
      next.ctaLabel = next.buttonLabel ?? "";
      next.ctaUrl = next.buttonUrl ?? "";
      delete next.buttonLabel;
      delete next.buttonUrl;
      break;
    case "faq-accordion":
      next.questions = items.map((item) => ({
        question: item.question ?? "",
        answer: item.answer ?? "",
        categoryId: "",
      }));
      delete next.items;
      break;
    case "testimonial-cards":
      next.quotes = items;
      delete next.items;
      break;
    case "testimonial-featured":
      next.quotes = [{ quote: next.quote ?? "", author: next.author ?? "", role: next.role ?? "" }];
      delete next.quote;
      delete next.author;
      delete next.role;
      break;
    case "review-summary":
      next.quotes = items.map((item) => ({ quote: item.quote ?? "", author: item.author ?? "", role: "" }));
      delete next.items;
      break;
    case "case-study-cards":
      next.caseStudies = items;
      delete next.items;
      break;
    case "logo-row":
      next.items = items.map((item) => ({ type: "logo", label: item.name ?? "", description: "" }));
      delete next.heading;
      break;
    case "blog-cards":
      next.posts = items;
      delete next.items;
      break;
    case "team-grid":
      next.people = items;
      delete next.items;
      break;
    default:
      break;
  }
  return next;
}

/**
 * Migrate one v1 section. Unknown templates keep their data and get a
 * best-effort sectionType so the renderer can show its "missing design"
 * card instead of crashing.
 */
export function migrateLegacySection(legacy: LegacySection): PageSection {
  const templateId = legacy.templateId ?? "";
  const mapping = TEMPLATE_MAP[templateId];
  const mapped =
    typeof mapping === "string"
      ? mapping
      : (mapping?.[legacy.variationId ?? "default"] ?? mapping?.default);

  const variation = mapped ? getVariation(mapped) : undefined;
  const sectionType: SectionType = variation?.sectionType ?? "content";
  const content = migrateContent(templateId, legacy.content ?? {}, legacy.variationId ?? "default");

  const { templateId: _dropped, ...rest } = legacy;
  void _dropped;
  return {
    ...(rest as unknown as PageSection),
    sectionType,
    variationId: variation?.id ?? legacy.variationId ?? templateId,
    content,
  };
}

/** Migrate all projects' sections from schema v1 to v2. */
export function migrateProjectsV1toV2(projects: Project[]): Project[] {
  return projects.map((project) => ({
    ...project,
    pages: project.pages.map((page) => ({
      ...page,
      sections: page.sections.map((section) =>
        migrateLegacySection(section as unknown as LegacySection),
      ),
    })),
  }));
}
