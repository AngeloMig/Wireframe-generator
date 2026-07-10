import type { PageTemplate } from "@/types";

/**
 * Full homepage templates. Each references section templates by id;
 * sections are instantiated when the template is applied to a page.
 */

const T0 = "2026-05-04T09:00:00.000Z";

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: "tpl-home-ecommerce",
    name: "Ecommerce Brand",
    description:
      "A conversion-ready store homepage: hero, collections, featured products, social proof, and FAQ.",
    pageType: "homepage",
    industries: ["Ecommerce & Retail", "Hospitality & Food"],
    goals: ["sell-products", "collect-subscribers"],
    styles: ["ecommerce", "modern", "minimal"],
    isActive: true,
    createdAt: T0,
    updatedAt: T0,
    sections: [
      { templateId: "announcement-bar" },
      { templateId: "header-ecommerce" },
      { templateId: "hero-split" },
      { templateId: "collection-cards" },
      { templateId: "featured-products" },
      { templateId: "product-benefits" },
      { templateId: "testimonial-cards" },
      { templateId: "newsletter-signup" },
      { templateId: "footer-standard" },
    ],
  },
  {
    id: "tpl-home-services",
    name: "Professional Services",
    description:
      "A trust-building homepage for consultancies and service firms: services, process, proof, and a consultation CTA.",
    pageType: "homepage",
    industries: ["Professional Services", "Finance & Legal", "Construction & Trades"],
    goals: ["generate-leads", "showcase-services", "book-appointments"],
    styles: ["corporate", "premium", "modern"],
    isActive: true,
    createdAt: T0,
    updatedAt: T0,
    sections: [
      { templateId: "header-standard", variationId: "with-cta" },
      { templateId: "hero-stats" },
      { templateId: "logo-row" },
      { templateId: "services-cards" },
      { templateId: "services-process" },
      { templateId: "testimonial-featured" },
      { templateId: "case-study-cards" },
      { templateId: "consultation-cta" },
      { templateId: "footer-standard" },
    ],
  },
  {
    id: "tpl-home-saas",
    name: "SaaS Product",
    description:
      "A product-led homepage for software: bold hero, feature highlights, statistics, reviews, and FAQ.",
    pageType: "homepage",
    industries: ["Technology & SaaS"],
    goals: ["generate-leads", "collect-subscribers", "membership"],
    styles: ["technical", "modern", "bold"],
    isActive: true,
    createdAt: T0,
    updatedAt: T0,
    sections: [
      { templateId: "header-standard", variationId: "with-cta" },
      { templateId: "hero-centered", variationId: "with-image" },
      { templateId: "logo-row" },
      { templateId: "image-text" },
      { templateId: "company-values", contentOverrides: { eyebrow: "Features", heading: "Everything your team needs" } },
      { templateId: "stats-section" },
      { templateId: "testimonial-cards" },
      { templateId: "faq-accordion" },
      { templateId: "consultation-cta", contentOverrides: { heading: "Start your free trial", buttonLabel: "Try it free" } },
      { templateId: "footer-standard" },
    ],
  },
  {
    id: "tpl-home-local",
    name: "Local Business",
    description:
      "A friendly homepage for local businesses: clear services, reviews, FAQ, and easy contact.",
    pageType: "homepage",
    industries: ["Health & Wellness", "Hospitality & Food", "Construction & Trades", "Real Estate"],
    goals: ["book-appointments", "generate-leads", "showcase-services"],
    styles: ["organic", "playful", "modern"],
    isActive: true,
    createdAt: T0,
    updatedAt: T0,
    sections: [
      { templateId: "header-standard" },
      { templateId: "hero-split", variationId: "image-left" },
      { templateId: "services-cards" },
      { templateId: "brand-intro" },
      { templateId: "review-summary" },
      { templateId: "faq-accordion" },
      { templateId: "contact-form" },
      { templateId: "footer-standard" },
    ],
  },
  {
    id: "tpl-home-portfolio",
    name: "Portfolio / Creative Studio",
    description:
      "An expressive homepage for studios and creatives: full-width hero, work highlights, and a strong mission statement.",
    pageType: "homepage",
    industries: ["Creative & Design", "Other"],
    goals: ["display-portfolio", "brand-awareness", "generate-leads"],
    styles: ["editorial", "bold", "minimal"],
    isActive: true,
    createdAt: T0,
    updatedAt: T0,
    sections: [
      { templateId: "header-centered" },
      { templateId: "hero-fullwidth" },
      { templateId: "case-study-cards", contentOverrides: { eyebrow: "Selected work", heading: "Recent projects" } },
      { templateId: "mission-statement" },
      { templateId: "services-list" },
      { templateId: "logo-row" },
      { templateId: "consultation-cta", contentOverrides: { heading: "Have a project in mind?", buttonLabel: "Start a conversation" } },
      { templateId: "footer-standard", variationId: "simple" },
    ],
  },
];

export function getPageTemplate(id: string): PageTemplate | undefined {
  return PAGE_TEMPLATES.find((t) => t.id === id);
}
