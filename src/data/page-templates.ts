import type { PageTemplate } from "@/types";

/**
 * Full homepage templates. Each references section design variations by id;
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
      { variationId: "nav-announcement-bar" },
      { variationId: "nav-ecommerce" },
      { variationId: "hero-split" },
      { variationId: "ecom-collections" },
      { variationId: "ecom-featured" },
      { variationId: "ecom-benefits" },
      { variationId: "testi-cards" },
      { variationId: "cta-newsletter" },
      { variationId: "footer-columns" },
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
      { variationId: "nav-standard" },
      { variationId: "hero-stats" },
      { variationId: "marquee-logo-static" },
      { variationId: "svc-icon-cards" },
      { variationId: "svc-process" },
      { variationId: "testi-featured" },
      { variationId: "testi-case-studies" },
      { variationId: "cta-centered" },
      { variationId: "footer-columns" },
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
      { variationId: "nav-cta" },
      { variationId: "hero-centered" },
      { variationId: "marquee-logos" },
      { variationId: "content-image-text" },
      {
        variationId: "content-values",
        contentOverrides: { eyebrow: "Features", heading: "Everything your team needs" },
      },
      { variationId: "content-stats" },
      { variationId: "testi-cards" },
      { variationId: "faq-accordion" },
      {
        variationId: "cta-centered",
        contentOverrides: { heading: "Start your free trial", buttonLabel: "Try it free" },
      },
      { variationId: "footer-columns" },
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
      { variationId: "nav-utility" },
      { variationId: "hero-split", layoutOverrides: { imagePosition: "left" } },
      { variationId: "svc-icon-cards" },
      { variationId: "content-intro" },
      { variationId: "testi-review-summary" },
      { variationId: "faq-accordion" },
      { variationId: "cta-contact-form" },
      { variationId: "footer-contact" },
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
      { variationId: "nav-editorial" },
      { variationId: "hero-fullbg" },
      {
        variationId: "testi-case-studies",
        contentOverrides: { eyebrow: "Selected work", heading: "Recent projects" },
      },
      { variationId: "content-statement" },
      { variationId: "svc-list" },
      { variationId: "marquee-logo-static" },
      {
        variationId: "cta-centered",
        contentOverrides: { heading: "Have a project in mind?", buttonLabel: "Start a conversation" },
      },
      { variationId: "footer-editorial" },
    ],
  },
];

export function getPageTemplate(id: string): PageTemplate | undefined {
  return PAGE_TEMPLATES.find((t) => t.id === id);
}
