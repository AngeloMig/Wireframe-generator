import type {
  PageType,
  SectionLayoutSettings,
  SectionStyleSettings,
  SectionType,
  SectionVariation,
} from "@/types";

/**
 * The prebuilt section design library: every design variation of every
 * section type. Content schemas live in section-schemas.ts (shared per type);
 * the React components live in the editor's section component registry,
 * looked up via `componentKey`.
 */

const T0 = "2026-07-11T09:00:00.000Z";

const ALL_PAGES: PageType[] = [
  "homepage", "about", "services", "service", "product", "collection",
  "contact", "faq", "portfolio", "case-study", "blog", "blog-article",
  "landing", "pricing", "team", "testimonials", "booking", "custom",
];

const MARKETING_PAGES: PageType[] = [
  "homepage", "about", "services", "service", "landing", "pricing", "custom",
];

const ECOM_PAGES: PageType[] = ["homepage", "product", "collection", "landing", "custom"];

const BASE_LAYOUT: SectionLayoutSettings = {
  alignment: "left",
  imagePosition: "none",
  columns: 1,
  contentWidth: "normal",
  itemCount: 0,
  mobileStacking: "default",
};

const BASE_STYLE: SectionStyleSettings = {
  background: "none",
  backgroundColor: null,
  textColor: null,
  accentColor: null,
  border: "none",
  spacing: "normal",
  cardRadius: "medium",
  buttonStyle: "solid",
};

type VariationInput = Partial<SectionVariation> &
  Pick<SectionVariation, "id" | "sectionType" | "name" | "description">;

/** Input for the per-type helpers, which supply `sectionType` themselves. */
type TypedVariationInput = Omit<VariationInput, "sectionType"> &
  Partial<Pick<SectionVariation, "sectionType">>;

function defineVariation(input: VariationInput): SectionVariation {
  return {
    tags: [],
    supportedPageTypes: ALL_PAGES,
    componentKey: input.id,
    isActive: true,
    createdAt: T0,
    updatedAt: T0,
    ...input,
    defaultLayout: { ...BASE_LAYOUT, ...input.defaultLayout },
    defaultStyle: { ...BASE_STYLE, ...input.defaultStyle },
    responsiveSettings: {
      stackOnMobile: true,
      mobileColumns: 1,
      hideOnMobile: false,
      ...input.responsiveSettings,
    },
  };
}

const nav = (input: TypedVariationInput) =>
  defineVariation({
    supportedPageTypes: ALL_PAGES,
    defaultLayout: { ...BASE_LAYOUT, contentWidth: "full", ...input.defaultLayout },
    defaultStyle: { ...BASE_STYLE, spacing: "compact", ...input.defaultStyle },
    ...input,
    sectionType: "navigation",
  });

// ---------------------------------------------------------------------------
// Navigation — 10 designs (+ the standalone announcement bar)
// ---------------------------------------------------------------------------

const NAV_BASE_KEYS = ["logoText", "links", "ctaLabel", "ctaUrl"];

const navigation: SectionVariation[] = [
  nav({
    id: "nav-standard",
    name: "Standard Left Logo",
    description: "Logo left, links right, CTA button — the classic header. Hamburger menu on mobile.",
    tags: ["classic", "cta", "versatile"],
    contentKeys: NAV_BASE_KEYS,
  }),
  nav({
    id: "nav-centered",
    name: "Centered Logo",
    description: "Links split around a centered logo, with an optional announcement bar above.",
    tags: ["boutique", "editorial", "announcement"],
    contentKeys: ["logoText", "links", "announcementText"],
    contentDefaults: {
      links: [{ label: "Shop" }, { label: "About" }, { label: "Journal" }, { label: "Contact" }],
    },
    defaultLayout: { ...BASE_LAYOUT, contentWidth: "full", alignment: "center" },
  }),
  nav({
    id: "nav-minimal",
    name: "Minimal",
    description: "Just a logo, a few links, and a quiet CTA with generous spacing.",
    tags: ["minimal", "spacious"],
    contentKeys: NAV_BASE_KEYS,
    contentDefaults: {
      links: [{ label: "Work" }, { label: "About" }, { label: "Contact" }],
      ctaLabel: "Start a project",
    },
    defaultStyle: { ...BASE_STYLE, spacing: "normal" },
  }),
  nav({
    id: "nav-ecommerce",
    name: "Ecommerce",
    description: "Category links plus search, account, and cart — with an optional announcement bar.",
    tags: ["store", "search", "cart", "announcement"],
    supportedPageTypes: ALL_PAGES,
    contentKeys: ["logoText", "links", "announcementText", "showSearch", "showAccount", "showCart"],
    contentDefaults: {
      logoText: "Your Store",
      links: [{ label: "New In" }, { label: "Shop" }, { label: "Collections" }, { label: "Sale" }],
    },
  }),
  nav({
    id: "nav-mega",
    name: "Mega Menu",
    description: "Main categories with a large open dropdown: link columns and a featured promo area.",
    tags: ["mega menu", "large catalog"],
    contentKeys: NAV_BASE_KEYS,
    contentDefaults: {
      links: [{ label: "Products" }, { label: "Solutions" }, { label: "Resources" }, { label: "Pricing" }],
      ctaLabel: "Get a demo",
    },
  }),
  nav({
    id: "nav-overlay",
    name: "Transparent Overlay",
    description: "Transparent header that overlaps a hero, with light/dark tones and a sticky-state preview.",
    tags: ["overlay", "transparent", "sticky"],
    contentKeys: [...NAV_BASE_KEYS, "overlayTone"],
    defaultStyle: { ...BASE_STYLE, spacing: "compact", background: "dark" },
  }),
  nav({
    id: "nav-sidebar",
    name: "Sidebar",
    description: "A fixed vertical navigation panel on the left — great for portfolio or editorial sites.",
    tags: ["vertical", "portfolio", "editorial"],
    supportedPageTypes: ["homepage", "portfolio", "case-study", "blog", "about", "custom"],
    contentKeys: ["logoText", "links", "ctaLabel"],
  }),
  nav({
    id: "nav-utility",
    name: "Utility Bar",
    description: "A slim contact/language bar above the main navigation.",
    tags: ["utility", "contact", "language"],
    contentKeys: ["logoText", "links", "contactPhone", "contactEmail", "languageLabel", "ctaLabel", "ctaUrl"],
  }),
  nav({
    id: "nav-cta",
    name: "CTA-Focused",
    description: "Minimal links with a prominent primary CTA and an optional login link.",
    tags: ["conversion", "cta", "login"],
    contentKeys: [...NAV_BASE_KEYS, "loginLabel"],
    contentDefaults: {
      links: [{ label: "Features" }, { label: "Pricing" }],
      ctaLabel: "Start free trial",
    },
  }),
  nav({
    id: "nav-editorial",
    name: "Editorial",
    description: "An oversized centered logo with spacious links below — premium, editorial feel.",
    tags: ["editorial", "premium", "oversized logo"],
    contentKeys: ["logoText", "links"],
    defaultLayout: { ...BASE_LAYOUT, contentWidth: "full", alignment: "center" },
    defaultStyle: { ...BASE_STYLE, spacing: "normal" },
  }),
  nav({
    id: "nav-announcement-bar",
    name: "Announcement Bar",
    description: "A slim standalone bar for promotions, shipping notices, or announcements.",
    tags: ["announcement", "promo"],
    contentKeys: ["announcementText", "ctaLabel", "ctaUrl"],
    contentDefaults: { ctaLabel: "Shop now", ctaUrl: "/collections/all" },
    defaultLayout: { ...BASE_LAYOUT, contentWidth: "full", alignment: "center" },
    defaultStyle: { ...BASE_STYLE, background: "dark", spacing: "compact", cardRadius: "none", buttonStyle: "link" },
  }),
];

// ---------------------------------------------------------------------------
// FAQ — 10 designs
// ---------------------------------------------------------------------------

const FAQ_BASE_KEYS = ["eyebrow", "heading", "description", "questions"];

const faqV = (input: TypedVariationInput) =>
  defineVariation({
    tags: [],
    contentKeys: FAQ_BASE_KEYS,
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", contentWidth: "narrow" },
    ...input,
    sectionType: "faq",
  });

const faq: SectionVariation[] = [
  faqV({
    id: "faq-accordion",
    name: "Standard Accordion",
    description: "A single column of expandable questions — the familiar default.",
    tags: ["accordion", "classic"],
  }),
  faqV({
    id: "faq-two-column",
    name: "Two-Column Accordion",
    description: "Accordion questions in two columns on desktop, one column on mobile.",
    tags: ["accordion", "two columns"],
    componentKey: "faq-accordion",
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", contentWidth: "wide", columns: 2 },
  }),
  faqV({
    id: "faq-sidebar",
    name: "Sidebar Categories",
    description: "Category navigation on the left, questions on the right. Becomes a dropdown on mobile.",
    tags: ["categories", "sidebar"],
    contentKeys: [...FAQ_BASE_KEYS, "categories"],
    defaultLayout: { ...BASE_LAYOUT, alignment: "left", contentWidth: "wide", columns: 2 },
  }),
  faqV({
    id: "faq-tabs",
    name: "Tabbed Categories",
    description: "Category tabs above the questions — tap a tab to switch.",
    tags: ["categories", "tabs"],
    contentKeys: [...FAQ_BASE_KEYS, "categories"],
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", contentWidth: "normal" },
  }),
  faqV({
    id: "faq-cards",
    name: "FAQ Cards",
    description: "Questions and answers shown open, in a grid of cards.",
    tags: ["cards", "grid", "open answers"],
    defaultLayout: { ...BASE_LAYOUT, alignment: "left", contentWidth: "wide", columns: 3 },
    responsiveSettings: { stackOnMobile: true, mobileColumns: 1, hideOnMobile: false },
  }),
  faqV({
    id: "faq-featured",
    name: "Featured Question",
    description: "One highlighted question and answer, followed by the rest as a list.",
    tags: ["featured", "editorial"],
  }),
  faqV({
    id: "faq-search",
    name: "Searchable",
    description: "A search input that filters the visible questions as you type.",
    tags: ["search", "filter", "large FAQ"],
    contentKeys: [...FAQ_BASE_KEYS, "searchPlaceholder"],
  }),
  faqV({
    id: "faq-contact-cta",
    name: "With Contact CTA",
    description: "Questions alongside a support card so no one leaves stuck.",
    tags: ["support", "cta"],
    contentKeys: [...FAQ_BASE_KEYS, "ctaHeading", "ctaDescription", "ctaButtonLabel", "ctaButtonUrl"],
    defaultLayout: { ...BASE_LAYOUT, alignment: "left", contentWidth: "wide", columns: 2 },
  }),
  faqV({
    id: "faq-numbered",
    name: "Numbered Editorial List",
    description: "Open questions with large numerals and editorial typography.",
    tags: ["numbered", "editorial", "open answers"],
    defaultLayout: { ...BASE_LAYOUT, alignment: "left", contentWidth: "narrow" },
    defaultStyle: { ...BASE_STYLE, spacing: "spacious" },
  }),
  faqV({
    id: "faq-dark",
    name: "Dark High-Contrast",
    description: "An accordion on a dark background for bold, high-contrast pages.",
    tags: ["dark", "accordion", "high contrast"],
    componentKey: "faq-accordion",
    defaultStyle: { ...BASE_STYLE, background: "dark", spacing: "spacious" },
  }),
];

// ---------------------------------------------------------------------------
// Marquee & Ticker — 8 designs
// ---------------------------------------------------------------------------

const MARQUEE_SETTINGS_KEYS = [
  "items", "animation", "direction", "speed", "pauseOnHover", "fadeEdges",
  "showLabels", "itemSpacing",
];

const marqueeV = (input: TypedVariationInput) =>
  defineVariation({
    componentKey: "marquee-row",
    contentKeys: MARQUEE_SETTINGS_KEYS,
    defaultLayout: { ...BASE_LAYOUT, contentWidth: "full", alignment: "center" },
    defaultStyle: { ...BASE_STYLE, spacing: "compact" },
    ...input,
    sectionType: "marquee",
  });

const marquee: SectionVariation[] = [
  marqueeV({
    id: "marquee-logos",
    name: "Logo Marquee",
    description: "Partner or customer logos scrolling in a continuous row.",
    tags: ["logos", "social proof"],
  }),
  marqueeV({
    id: "marquee-text",
    name: "Text Statement",
    description: "Large repeating marketing statements gliding across the page.",
    tags: ["statement", "typographic", "bold"],
    contentDefaults: {
      items: [
        { type: "text", label: "Designed to last", description: "" },
        { type: "text", label: "Made responsibly", description: "" },
        { type: "text", label: "Loved worldwide", description: "" },
      ],
      speed: "slow",
    },
    defaultStyle: { ...BASE_STYLE, spacing: "normal" },
  }),
  marqueeV({
    id: "marquee-categories",
    name: "Category Marquee",
    description: "Scrolling product or service categories as tappable pills.",
    tags: ["categories", "pills"],
    supportedPageTypes: ECOM_PAGES.concat(["services", "custom"]),
    contentDefaults: {
      items: [
        { type: "category", label: "Living room", description: "" },
        { type: "category", label: "Bedroom", description: "" },
        { type: "category", label: "Dining", description: "" },
        { type: "category", label: "Office", description: "" },
        { type: "category", label: "Outdoor", description: "" },
        { type: "category", label: "Lighting", description: "" },
      ],
    },
  }),
  marqueeV({
    id: "marquee-reviews",
    name: "Review Marquee",
    description: "Short customer quotes with ratings drifting by.",
    tags: ["reviews", "social proof"],
    contentDefaults: {
      items: [
        { type: "review", label: "“Beautiful quality”", description: "Jordan P." },
        { type: "review", label: "“Fast delivery”", description: "Sarah K." },
        { type: "review", label: "“Best purchase this year”", description: "Liam D." },
        { type: "review", label: "“Five stars”", description: "Ava M." },
      ],
      speed: "slow",
    },
  }),
  marqueeV({
    id: "marquee-images",
    name: "Image Cards",
    description: "A scrolling strip of image or project cards.",
    tags: ["images", "portfolio"],
    contentDefaults: {
      items: [
        { type: "image", label: "Project one", description: "" },
        { type: "image", label: "Project two", description: "" },
        { type: "image", label: "Project three", description: "" },
        { type: "image", label: "Project four", description: "" },
        { type: "image", label: "Project five", description: "" },
      ],
      speed: "slow",
    },
    defaultStyle: { ...BASE_STYLE, spacing: "normal" },
  }),
  marqueeV({
    id: "marquee-ticker",
    name: "Announcement Ticker",
    description: "A slim ticker of promotional or informational messages.",
    tags: ["ticker", "announcement", "promo"],
    contentDefaults: {
      items: [
        { type: "text", label: "Free shipping over $100", description: "" },
        { type: "text", label: "New season arrivals", description: "" },
        { type: "text", label: "30-day returns", description: "" },
      ],
      speed: "medium",
      fadeEdges: false,
    },
    defaultStyle: { ...BASE_STYLE, background: "dark", spacing: "compact", cardRadius: "none" },
  }),
  marqueeV({
    id: "marquee-dual",
    name: "Dual Direction",
    description: "Two rows moving in opposite directions for extra energy.",
    tags: ["two rows", "dynamic"],
    componentKey: "marquee-dual",
    contentDefaults: {
      items: [
        { type: "logo", label: "Northwind", description: "" },
        { type: "logo", label: "Acme Co", description: "" },
        { type: "logo", label: "Globex", description: "" },
        { type: "logo", label: "Initech", description: "" },
        { type: "logo", label: "Umbrella", description: "" },
        { type: "logo", label: "Stark & Co", description: "" },
        { type: "logo", label: "Wayne Ent", description: "" },
        { type: "logo", label: "Hooli", description: "" },
      ],
    },
  }),
  marqueeV({
    id: "marquee-logo-static",
    name: "Static-to-Motion Logo Row",
    description: "A logo row that stays static while everything fits and scrolls only on overflow.",
    tags: ["logos", "static", "adaptive"],
    componentKey: "marquee-auto",
    contentDefaults: { animation: true, fadeEdges: false },
  }),
];

// ---------------------------------------------------------------------------
// Hero — 12 designs
// ---------------------------------------------------------------------------

const HERO_BASE_KEYS = [
  "eyebrow", "heading", "description",
  "buttonLabel", "buttonUrl", "secondaryButtonLabel", "secondaryButtonUrl",
];

const heroV = (input: TypedVariationInput) =>
  defineVariation({
    supportedPageTypes: MARKETING_PAGES,
    contentKeys: HERO_BASE_KEYS,
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", contentWidth: "narrow" },
    defaultStyle: { ...BASE_STYLE, spacing: "spacious" },
    ...input,
    sectionType: "hero",
  });

const hero: SectionVariation[] = [
  heroV({
    id: "hero-centered",
    name: "Centered Hero",
    description: "A focused, centered introduction with heading, text, and buttons.",
    tags: ["centered", "classic"],
    contentKeys: [...HERO_BASE_KEYS, "image"],
  }),
  heroV({
    id: "hero-split",
    name: "Split Image Hero",
    description: "Text on one side, a large image on the other.",
    tags: ["image", "split"],
    supportedPageTypes: MARKETING_PAGES.concat(["collection", "product"]),
    contentKeys: [...HERO_BASE_KEYS, "image"],
    contentDefaults: {
      eyebrow: "New collection",
      heading: "A headline paired with a strong visual",
      description: "Introduce your product, service, or story next to a hero image.",
    },
    defaultLayout: { ...BASE_LAYOUT, alignment: "left", imagePosition: "right", columns: 2, contentWidth: "wide" },
  }),
  heroV({
    id: "hero-fullbg",
    name: "Full-Background Image",
    description: "A full-bleed background image with overlaid heading and actions.",
    tags: ["full width", "image", "impact"],
    supportedPageTypes: MARKETING_PAGES.concat(["collection", "portfolio"]),
    contentKeys: [...HERO_BASE_KEYS, "image"],
    contentDefaults: {
      eyebrow: "",
      heading: "Make a strong first impression",
      description: "A short supporting line over a full-width image.",
      secondaryButtonLabel: "",
    },
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", imagePosition: "background", contentWidth: "full" },
    defaultStyle: { ...BASE_STYLE, background: "image", spacing: "spacious", cardRadius: "none" },
  }),
  heroV({
    id: "hero-form",
    name: "Hero with Form",
    description: "Headline beside a short lead-capture form.",
    tags: ["form", "lead capture"],
    supportedPageTypes: ["homepage", "landing", "services", "booking", "custom"],
    contentKeys: ["eyebrow", "heading", "description", "formTitle", "buttonLabel", "fields"],
    contentDefaults: {
      eyebrow: "Free consultation",
      heading: "Tell us about your project",
      description: "Fill in a few details and we'll get back to you within one business day.",
      buttonLabel: "Send request",
    },
    defaultLayout: { ...BASE_LAYOUT, alignment: "left", imagePosition: "right", columns: 2, contentWidth: "wide" },
  }),
  heroV({
    id: "hero-product",
    name: "Product-Focused",
    description: "Spotlight a single product with price and buy action.",
    tags: ["product", "ecommerce"],
    supportedPageTypes: ECOM_PAGES,
    contentKeys: ["eyebrow", "heading", "description", "price", "buttonLabel", "buttonUrl", "image"],
    contentDefaults: {
      eyebrow: "Featured product",
      heading: "The product your customers will love",
      description: "Highlight your hero product with a short, persuasive description.",
      buttonLabel: "Add to cart",
    },
    defaultLayout: { ...BASE_LAYOUT, alignment: "left", imagePosition: "right", columns: 2, contentWidth: "wide" },
  }),
  heroV({
    id: "hero-stats",
    name: "With Statistics",
    description: "A headline supported by proof-point statistics.",
    tags: ["statistics", "credibility"],
    contentKeys: [...HERO_BASE_KEYS, "stats"],
    contentDefaults: {
      eyebrow: "Trusted results",
      heading: "Results your visitors can trust",
      description: "Lead with credibility by pairing your message with real numbers.",
      buttonLabel: "Work with us",
      secondaryButtonLabel: "",
    },
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", columns: 3, contentWidth: "normal" },
  }),
  heroV({
    id: "hero-logos",
    name: "With Logo Row",
    description: "A centered hero with a quiet row of client logos beneath.",
    tags: ["logos", "social proof"],
    contentKeys: [...HERO_BASE_KEYS, "logos"],
    contentDefaults: {
      eyebrow: "Trusted by teams",
      secondaryButtonLabel: "",
    },
  }),
  heroV({
    id: "hero-video",
    name: "Video Hero",
    description: "A large video placeholder with heading and play affordance.",
    tags: ["video", "media"],
    contentKeys: [...HERO_BASE_KEYS, "videoUrl"],
    contentDefaults: {
      eyebrow: "Watch",
      heading: "Show, don't tell",
      description: "Introduce your brand with a short film.",
      secondaryButtonLabel: "",
    },
  }),
  heroV({
    id: "hero-editorial",
    name: "Editorial Text",
    description: "Oversized left-aligned typography with minimal ornamentation.",
    tags: ["editorial", "typographic", "minimal"],
    supportedPageTypes: MARKETING_PAGES.concat(["portfolio", "blog"]),
    contentDefaults: {
      eyebrow: "Est. 2014",
      heading: "A studio for considered, lasting design",
      description: "",
      buttonLabel: "",
      secondaryButtonLabel: "",
    },
    defaultLayout: { ...BASE_LAYOUT, alignment: "left", contentWidth: "wide" },
  }),
  heroV({
    id: "hero-cards",
    name: "With Cards",
    description: "A headline with a row of supporting feature cards.",
    tags: ["cards", "features"],
    contentKeys: [...HERO_BASE_KEYS, "items"],
    contentDefaults: { secondaryButtonLabel: "" },
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", columns: 3, contentWidth: "wide" },
  }),
  heroV({
    id: "hero-promo",
    name: "Ecommerce Promotion",
    description: "A promotional hero with badge, offer headline, and product image.",
    tags: ["promo", "ecommerce", "sale"],
    supportedPageTypes: ECOM_PAGES,
    contentKeys: [...HERO_BASE_KEYS, "badge", "image"],
    contentDefaults: {
      badge: "Up to 30% off",
      eyebrow: "Season sale",
      heading: "The summer event is on",
      description: "Save on best-selling pieces for a limited time.",
      buttonLabel: "Shop the sale",
      secondaryButtonLabel: "",
    },
    defaultLayout: { ...BASE_LAYOUT, alignment: "left", imagePosition: "right", columns: 2, contentWidth: "wide" },
    defaultStyle: { ...BASE_STYLE, background: "muted", spacing: "spacious" },
  }),
  heroV({
    id: "hero-minimal",
    name: "Minimal Headline",
    description: "Nothing but a big centered headline and one action.",
    tags: ["minimal", "typographic"],
    contentDefaults: {
      eyebrow: "",
      description: "",
      secondaryButtonLabel: "",
    },
  }),
];

// ---------------------------------------------------------------------------
// Testimonials & social proof — 8 designs
// ---------------------------------------------------------------------------

const testiV = (input: TypedVariationInput) =>
  defineVariation({
    contentKeys: ["eyebrow", "heading", "quotes"],
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", contentWidth: "wide", columns: 3 },
    ...input,
    sectionType: "testimonials",
  });

const testimonials: SectionVariation[] = [
  testiV({
    id: "testi-cards",
    name: "Testimonial Cards",
    description: "Customer quotes displayed as a grid of cards.",
    tags: ["cards", "grid"],
  }),
  testiV({
    id: "testi-two-column",
    name: "Two-Column Quotes",
    description: "Two larger quote cards side by side.",
    tags: ["two columns", "large quotes"],
    componentKey: "testi-cards",
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", contentWidth: "normal", columns: 2 },
  }),
  testiV({
    id: "testi-featured",
    name: "Featured Quote",
    description: "One large, standout quote from a key customer.",
    tags: ["featured", "single quote"],
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", contentWidth: "narrow" },
    defaultStyle: { ...BASE_STYLE, background: "muted", spacing: "spacious" },
  }),
  testiV({
    id: "testi-masonry",
    name: "Masonry Wall",
    description: "A staggered wall of quotes at different heights.",
    tags: ["masonry", "wall"],
    defaultLayout: { ...BASE_LAYOUT, alignment: "left", contentWidth: "wide", columns: 3 },
  }),
  testiV({
    id: "testi-carousel",
    name: "Carousel",
    description: "One quote at a time with previous/next controls and dots.",
    tags: ["carousel", "slider"],
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", contentWidth: "narrow" },
  }),
  testiV({
    id: "testi-review-summary",
    name: "Review Summary",
    description: "An aggregate star rating with highlighted review quotes.",
    tags: ["rating", "summary"],
    supportedPageTypes: ["homepage", "product", "collection", "testimonials", "landing", "custom"],
    contentKeys: ["rating", "ratingLabel", "heading", "quotes"],
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", contentWidth: "normal", columns: 2 },
  }),
  testiV({
    id: "testi-case-studies",
    name: "Case Study Cards",
    description: "Cards linking to detailed success stories with key results.",
    tags: ["case studies", "results"],
    supportedPageTypes: ["homepage", "services", "portfolio", "case-study", "about", "custom"],
    contentKeys: ["eyebrow", "heading", "caseStudies"],
    defaultLayout: { ...BASE_LAYOUT, alignment: "left", contentWidth: "wide", columns: 3 },
  }),
  testiV({
    id: "testi-dark",
    name: "Dark Spotlight",
    description: "A dark, high-contrast band with a single glowing quote.",
    tags: ["dark", "spotlight"],
    componentKey: "testi-featured",
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", contentWidth: "narrow" },
    defaultStyle: { ...BASE_STYLE, background: "dark", spacing: "spacious" },
  }),
];

// ---------------------------------------------------------------------------
// Services — 8 designs
// ---------------------------------------------------------------------------

const SVC_PAGES: PageType[] = ["homepage", "services", "service", "about", "landing", "pricing", "custom"];

const svcV = (input: TypedVariationInput) =>
  defineVariation({
    supportedPageTypes: SVC_PAGES,
    contentKeys: ["eyebrow", "heading", "description", "items"],
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", contentWidth: "wide", columns: 3, itemCount: 3 },
    ...input,
    sectionType: "services",
  });

const servicesV: SectionVariation[] = [
  svcV({
    id: "svc-icon-cards",
    name: "Icon Cards",
    description: "Service cards with icons — the versatile default.",
    tags: ["cards", "icons"],
  }),
  svcV({
    id: "svc-image-cards",
    name: "Image Cards",
    description: "Service cards led by an image placeholder.",
    tags: ["cards", "images"],
  }),
  svcV({
    id: "svc-alternating",
    name: "Alternating Rows",
    description: "Image-and-text rows that alternate sides for each service.",
    tags: ["rows", "detailed"],
    defaultLayout: { ...BASE_LAYOUT, alignment: "left", imagePosition: "left", columns: 2, contentWidth: "wide", itemCount: 2 },
  }),
  svcV({
    id: "svc-list",
    name: "Compact List",
    description: "A compact two-column list of every service you offer.",
    tags: ["list", "compact"],
    contentDefaults: {
      items: [
        { title: "Service A", description: "", linkLabel: "", price: "" },
        { title: "Service B", description: "", linkLabel: "", price: "" },
        { title: "Service C", description: "", linkLabel: "", price: "" },
        { title: "Service D", description: "", linkLabel: "", price: "" },
        { title: "Service E", description: "", linkLabel: "", price: "" },
        { title: "Service F", description: "", linkLabel: "", price: "" },
      ],
    },
    defaultLayout: { ...BASE_LAYOUT, alignment: "left", columns: 2, contentWidth: "normal", itemCount: 0 },
  }),
  svcV({
    id: "svc-process",
    name: "Process Steps",
    description: "Numbered horizontal steps that explain how working with you goes.",
    tags: ["process", "steps"],
    contentDefaults: {
      eyebrow: "How it works",
      heading: "A simple, guided process",
      items: [
        { title: "Discovery", description: "We learn about your goals and needs.", linkLabel: "", price: "" },
        { title: "Proposal", description: "You receive a clear plan and quote.", linkLabel: "", price: "" },
        { title: "Delivery", description: "We do the work and keep you updated.", linkLabel: "", price: "" },
        { title: "Support", description: "We stay available after launch.", linkLabel: "", price: "" },
      ],
    },
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", columns: 4, contentWidth: "wide", itemCount: 4 },
  }),
  svcV({
    id: "svc-timeline",
    name: "Vertical Timeline",
    description: "Steps stacked as a vertical timeline with connecting line.",
    tags: ["timeline", "process"],
    contentDefaults: {
      eyebrow: "How it works",
      heading: "A simple, guided process",
      items: [
        { title: "Discovery", description: "We learn about your goals and needs.", linkLabel: "", price: "" },
        { title: "Proposal", description: "You receive a clear plan and quote.", linkLabel: "", price: "" },
        { title: "Delivery", description: "We do the work and keep you updated.", linkLabel: "", price: "" },
      ],
    },
    defaultLayout: { ...BASE_LAYOUT, alignment: "left", columns: 1, contentWidth: "narrow", itemCount: 0 },
  }),
  svcV({
    id: "svc-featured",
    name: "Featured Service",
    description: "One flagship service in a large panel, others listed beside it.",
    tags: ["featured", "hierarchy"],
    defaultLayout: { ...BASE_LAYOUT, alignment: "left", columns: 2, contentWidth: "wide", itemCount: 0 },
  }),
  svcV({
    id: "svc-pricing",
    name: "Simple Pricing Cards",
    description: "Service cards with a price line — a lightweight pricing table.",
    tags: ["pricing", "cards"],
    contentDefaults: {
      eyebrow: "Pricing",
      heading: "Simple, transparent pricing",
      items: [
        { title: "Starter", description: "For small projects getting under way.", linkLabel: "Choose plan", price: "$490" },
        { title: "Studio", description: "Our most popular engagement.", linkLabel: "Choose plan", price: "$1,900" },
        { title: "Partner", description: "Ongoing support and iteration.", linkLabel: "Talk to us", price: "Custom" },
      ],
    },
  }),
];

// ---------------------------------------------------------------------------
// Calls to action — 8 designs
// ---------------------------------------------------------------------------

const CTA_BASE_KEYS = [
  "eyebrow", "heading", "description", "buttonLabel", "buttonUrl",
  "secondaryButtonLabel", "secondaryButtonUrl",
];

const ctaV = (input: TypedVariationInput) =>
  defineVariation({
    contentKeys: CTA_BASE_KEYS,
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", contentWidth: "narrow" },
    defaultStyle: { ...BASE_STYLE, background: "dark", spacing: "spacious" },
    ...input,
    sectionType: "cta",
  });

const ctaVariations: SectionVariation[] = [
  ctaV({
    id: "cta-centered",
    name: "Centered Band",
    description: "A strong centered call-to-action band on a dark background.",
    tags: ["band", "dark", "classic"],
  }),
  ctaV({
    id: "cta-split",
    name: "Text + Button Split",
    description: "Message on the left, action on the right, in one tidy row.",
    tags: ["split", "compact"],
    defaultLayout: { ...BASE_LAYOUT, alignment: "left", columns: 2, contentWidth: "wide" },
    defaultStyle: { ...BASE_STYLE, background: "muted", spacing: "normal" },
  }),
  ctaV({
    id: "cta-newsletter",
    name: "Newsletter Signup",
    description: "An email capture band with a short pitch.",
    tags: ["newsletter", "email"],
    contentKeys: ["heading", "description", "buttonLabel", "placeholder", "note"],
    contentDefaults: {
      heading: "Stay in the loop",
      description: "Sign up for new arrivals, offers, and helpful guides.",
      buttonLabel: "Subscribe",
    },
    defaultStyle: { ...BASE_STYLE, background: "brand", spacing: "normal" },
  }),
  ctaV({
    id: "cta-newsletter-split",
    name: "Newsletter Split",
    description: "Newsletter pitch on the left, input on the right.",
    tags: ["newsletter", "split"],
    componentKey: "cta-newsletter",
    contentKeys: ["heading", "description", "buttonLabel", "placeholder", "note"],
    contentDefaults: {
      heading: "Stay in the loop",
      description: "Sign up for new arrivals, offers, and helpful guides.",
      buttonLabel: "Subscribe",
    },
    defaultLayout: { ...BASE_LAYOUT, alignment: "left", columns: 2, contentWidth: "wide" },
    defaultStyle: { ...BASE_STYLE, background: "muted", spacing: "normal" },
  }),
  ctaV({
    id: "cta-contact-form",
    name: "Contact Form",
    description: "A contact form with supporting business details.",
    tags: ["form", "contact"],
    supportedPageTypes: ["homepage", "contact", "booking", "landing", "custom"],
    contentKeys: ["eyebrow", "heading", "description", "buttonLabel", "fields", "details"],
    contentDefaults: {
      eyebrow: "Contact",
      heading: "Get in touch",
      description: "We usually reply within one business day.",
      buttonLabel: "Send message",
      fields: [{ label: "Name" }, { label: "Email" }, { label: "Phone" }, { label: "Message" }],
    },
    defaultLayout: { ...BASE_LAYOUT, alignment: "left", imagePosition: "right", columns: 2, contentWidth: "wide" },
    defaultStyle: { ...BASE_STYLE, spacing: "normal" },
  }),
  ctaV({
    id: "cta-image",
    name: "With Image",
    description: "A CTA panel beside a supporting image.",
    tags: ["image", "split"],
    contentKeys: [...CTA_BASE_KEYS, "image"],
    defaultLayout: { ...BASE_LAYOUT, alignment: "left", imagePosition: "right", columns: 2, contentWidth: "wide" },
    defaultStyle: { ...BASE_STYLE, background: "muted", spacing: "spacious" },
  }),
  ctaV({
    id: "cta-stat-banner",
    name: "Stat Banner",
    description: "A slim conversion band with one headline number.",
    tags: ["banner", "statistic", "slim"],
    contentKeys: ["eyebrow", "heading", "buttonLabel", "buttonUrl"],
    contentDefaults: {
      eyebrow: "Join 10,000+ happy customers",
      heading: "Ready when you are",
      buttonLabel: "Get started",
    },
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", contentWidth: "normal" },
    defaultStyle: { ...BASE_STYLE, background: "brand", spacing: "compact" },
  }),
  ctaV({
    id: "cta-card",
    name: "Floating Card",
    description: "A CTA in a raised card floating on a muted background.",
    tags: ["card", "elevated"],
    defaultStyle: { ...BASE_STYLE, background: "muted", spacing: "spacious" },
  }),
];

// ---------------------------------------------------------------------------
// Footer — 8 designs
// ---------------------------------------------------------------------------

const footerV = (input: TypedVariationInput) =>
  defineVariation({
    contentKeys: ["logoText", "tagline", "columns", "legalText"],
    defaultLayout: { ...BASE_LAYOUT, contentWidth: "wide", columns: 4 },
    defaultStyle: { ...BASE_STYLE, background: "dark", spacing: "normal", cardRadius: "none" },
    responsiveSettings: { stackOnMobile: true, mobileColumns: 2, hideOnMobile: false },
    ...input,
    sectionType: "footer",
  });

const footerVariations: SectionVariation[] = [
  footerV({
    id: "footer-columns",
    name: "Link Columns",
    description: "A multi-column footer with link groups and legal line.",
    tags: ["columns", "classic"],
  }),
  footerV({
    id: "footer-simple",
    name: "Simple Centered",
    description: "Logo, tagline, and legal line — nothing else.",
    tags: ["simple", "centered"],
    contentKeys: ["logoText", "tagline", "legalText"],
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", contentWidth: "narrow" },
  }),
  footerV({
    id: "footer-newsletter",
    name: "With Newsletter",
    description: "Link columns plus an email signup block.",
    tags: ["newsletter", "columns"],
    contentKeys: ["logoText", "tagline", "columns", "legalText", "newsletterHeading", "newsletterPlaceholder"],
  }),
  footerV({
    id: "footer-mega",
    name: "Mega Footer",
    description: "Everything: columns, newsletter, contact, and social links.",
    tags: ["mega", "complete"],
    contentKeys: [
      "logoText", "tagline", "columns", "legalText",
      "newsletterHeading", "newsletterPlaceholder", "contactEmail", "contactPhone", "socials",
    ],
    defaultStyle: { ...BASE_STYLE, background: "dark", spacing: "spacious", cardRadius: "none" },
  }),
  footerV({
    id: "footer-dark-cta",
    name: "With Closing CTA",
    description: "A final call-to-action headline above slim footer links.",
    tags: ["cta", "closing"],
    contentKeys: ["logoText", "tagline", "columns", "legalText"],
    contentDefaults: { tagline: "Ready to start? Let's talk." },
    defaultStyle: { ...BASE_STYLE, background: "dark", spacing: "spacious", cardRadius: "none" },
  }),
  footerV({
    id: "footer-editorial",
    name: "Editorial",
    description: "An oversized wordmark with a single quiet row of links.",
    tags: ["editorial", "oversized logo"],
    contentKeys: ["logoText", "columns", "legalText"],
    defaultStyle: { ...BASE_STYLE, background: "none", spacing: "spacious", cardRadius: "none" },
  }),
  footerV({
    id: "footer-contact",
    name: "Contact-First",
    description: "Contact details front and centre, links secondary.",
    tags: ["contact", "local business"],
    contentKeys: ["logoText", "tagline", "columns", "legalText", "contactEmail", "contactPhone"],
    defaultStyle: { ...BASE_STYLE, background: "muted", spacing: "normal", cardRadius: "none" },
  }),
  footerV({
    id: "footer-minimal",
    name: "Minimal Bar",
    description: "A single slim bar: logo left, links and legal right.",
    tags: ["minimal", "slim"],
    contentKeys: ["logoText", "columns", "legalText"],
    defaultLayout: { ...BASE_LAYOUT, contentWidth: "wide", columns: 1 },
    defaultStyle: { ...BASE_STYLE, background: "none", spacing: "compact", cardRadius: "none", border: "top" },
  }),
];

// ---------------------------------------------------------------------------
// Introduction & content — carried over from the phase-3 library
// ---------------------------------------------------------------------------

const contentV = (input: TypedVariationInput) =>
  defineVariation({
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", contentWidth: "narrow" },
    ...input,
    sectionType: "content",
  });

const contentVariations: SectionVariation[] = [
  contentV({
    id: "content-intro",
    name: "Brand Introduction",
    description: "A warm introduction to who you are and what you stand for.",
    tags: ["intro", "about"],
    contentKeys: ["eyebrow", "heading", "description", "buttonLabel", "buttonUrl"],
    defaultStyle: { ...BASE_STYLE, background: "muted", spacing: "spacious", buttonStyle: "outline" },
  }),
  contentV({
    id: "content-image-text",
    name: "Image & Text",
    description: "A flexible half-image, half-text content block.",
    tags: ["image", "split"],
    contentKeys: ["eyebrow", "heading", "description", "buttonLabel", "buttonUrl", "image"],
    contentDefaults: {
      eyebrow: "Why choose us",
      heading: "Pair a message with a meaningful image",
      description: "Use this section to explain a key idea alongside a supporting photo.",
      buttonLabel: "Learn more",
    },
    defaultLayout: { ...BASE_LAYOUT, alignment: "left", imagePosition: "left", columns: 2, contentWidth: "wide" },
  }),
  contentV({
    id: "content-statement",
    name: "Mission Statement",
    description: "A large, quiet statement of purpose.",
    tags: ["statement", "quote"],
    supportedPageTypes: ["homepage", "about", "custom", "landing"],
    contentKeys: ["eyebrow", "heading", "attribution"],
    contentDefaults: {
      eyebrow: "Our mission",
      heading: "We believe every business deserves a website that feels considered, honest, and unmistakably theirs.",
    },
    defaultStyle: { ...BASE_STYLE, background: "dark", spacing: "spacious" },
  }),
  contentV({
    id: "content-values",
    name: "Company Values",
    description: "A grid of the principles that guide your business.",
    tags: ["values", "grid"],
    supportedPageTypes: ["homepage", "about", "team", "custom"],
    contentKeys: ["eyebrow", "heading", "description", "items"],
    contentDefaults: { eyebrow: "Our values", heading: "What we stand for", description: "" },
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", columns: 3, contentWidth: "wide", itemCount: 3 },
  }),
  contentV({
    id: "content-stats",
    name: "Statistics Section",
    description: "A row of headline numbers that build credibility.",
    tags: ["statistics", "numbers"],
    contentKeys: ["eyebrow", "heading", "stats"],
    contentDefaults: { eyebrow: "By the numbers", heading: "" },
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", columns: 4, contentWidth: "wide", itemCount: 4 },
    responsiveSettings: { stackOnMobile: true, mobileColumns: 2, hideOnMobile: false },
  }),
  contentV({
    id: "content-blog",
    name: "Blog Cards",
    description: "Recent articles or guides displayed as cards.",
    tags: ["blog", "articles"],
    supportedPageTypes: ["homepage", "blog", "blog-article", "about", "custom"],
    contentKeys: ["eyebrow", "heading", "buttonLabel", "buttonUrl", "posts"],
    contentDefaults: {
      eyebrow: "From the journal",
      heading: "Latest articles",
      buttonLabel: "View all articles",
      buttonUrl: "/blog",
    },
    defaultLayout: { ...BASE_LAYOUT, alignment: "left", imagePosition: "top", columns: 3, contentWidth: "wide", itemCount: 3 },
  }),
  contentV({
    id: "content-team",
    name: "Team Grid",
    description: "Photos, names, and roles for your team members.",
    tags: ["team", "people"],
    supportedPageTypes: ["homepage", "about", "team", "custom"],
    contentKeys: ["eyebrow", "heading", "people"],
    contentDefaults: { eyebrow: "Our team", heading: "The people behind the work" },
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", imagePosition: "top", columns: 4, contentWidth: "wide", itemCount: 4 },
    responsiveSettings: { stackOnMobile: true, mobileColumns: 2, hideOnMobile: false },
  }),
];

// ---------------------------------------------------------------------------
// Ecommerce — carried over from the phase-3 library
// ---------------------------------------------------------------------------

const ecomV = (input: TypedVariationInput) =>
  defineVariation({
    supportedPageTypes: ECOM_PAGES,
    contentKeys: ["eyebrow", "heading", "buttonLabel", "buttonUrl", "items"],
    defaultLayout: { ...BASE_LAYOUT, alignment: "left", imagePosition: "top", columns: 4, contentWidth: "wide", itemCount: 4 },
    responsiveSettings: { stackOnMobile: true, mobileColumns: 2, hideOnMobile: false },
    ...input,
    sectionType: "ecommerce",
  });

const ecommerceVariations: SectionVariation[] = [
  ecomV({
    id: "ecom-featured",
    name: "Featured Products",
    description: "A curated row of featured products with prices.",
    tags: ["products", "featured"],
  }),
  ecomV({
    id: "ecom-grid",
    name: "Product Grid",
    description: "A full grid of products for collection-style browsing.",
    tags: ["products", "grid"],
    contentDefaults: {
      heading: "Shop the range",
      eyebrow: "",
      buttonLabel: "",
      items: [
        { title: "Product one", price: "$89", description: "" },
        { title: "Product two", price: "$129", description: "" },
        { title: "Product three", price: "$59", description: "" },
        { title: "Product four", price: "$210", description: "" },
        { title: "Product five", price: "$75", description: "" },
        { title: "Product six", price: "$149", description: "" },
      ],
    },
    defaultLayout: { ...BASE_LAYOUT, alignment: "left", imagePosition: "top", columns: 3, contentWidth: "wide", itemCount: 6 },
  }),
  ecomV({
    id: "ecom-collections",
    name: "Collection Cards",
    description: "Large cards linking to your main product collections.",
    tags: ["collections", "cards"],
    contentDefaults: {
      eyebrow: "Collections",
      heading: "Shop by room",
      buttonLabel: "",
      items: [
        { title: "Living room", price: "", description: "" },
        { title: "Bedroom", price: "", description: "" },
        { title: "Dining", price: "", description: "" },
      ],
    },
    defaultLayout: { ...BASE_LAYOUT, alignment: "left", imagePosition: "background", columns: 3, contentWidth: "wide", itemCount: 3 },
  }),
  ecomV({
    id: "ecom-best-sellers",
    name: "Best Sellers",
    description: "Your top-selling products with rank badges.",
    tags: ["products", "best sellers"],
    contentDefaults: {
      eyebrow: "Best sellers",
      heading: "Most loved this season",
      buttonLabel: "",
      items: [
        { title: "Product one", price: "$129", description: "" },
        { title: "Product two", price: "$89", description: "" },
        { title: "Product three", price: "$159", description: "" },
      ],
    },
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", imagePosition: "top", columns: 3, contentWidth: "wide", itemCount: 3 },
  }),
  ecomV({
    id: "ecom-benefits",
    name: "Store Benefits",
    description: "Icon-led benefits like shipping, returns, and warranty.",
    tags: ["benefits", "trust"],
    contentDefaults: {
      eyebrow: "",
      heading: "",
      buttonLabel: "",
      items: [
        { title: "Free delivery", price: "", description: "On all orders over $100" },
        { title: "5-year warranty", price: "", description: "Built to last, guaranteed" },
        { title: "Easy returns", price: "", description: "30-day no-fuss returns" },
        { title: "Secure checkout", price: "", description: "Safe and encrypted payment" },
      ],
    },
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", columns: 4, contentWidth: "wide", itemCount: 4 },
    defaultStyle: { ...BASE_STYLE, background: "muted", spacing: "compact" },
  }),
];

// ---------------------------------------------------------------------------
// Aggregate + lookups
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Design-path kits — each website design direction gets signature sections.
// Most are data-only variants of existing components; seven are new layouts
// (bento, spec table, pull quote, gallery, scroll story, code, arched hero).
// The path name lives in tags so the library search surfaces whole kits.
// ---------------------------------------------------------------------------

const designPaths: SectionVariation[] = [
  // --- Modern SaaS ----------------------------------------------------------
  defineVariation({
    id: "hero-saas",
    sectionType: "hero",
    componentKey: "hero-product",
    name: "SaaS Product Hero",
    description: "Centered pitch above a large product screenshot — the classic software landing opener.",
    tags: ["saas", "modern", "product"],
    supportedPageTypes: ["homepage", "landing", "pricing", "custom"],
    defaultStyle: { ...BASE_STYLE, background: "muted", spacing: "spacious" },
    contentDefaults: {
      eyebrow: "New: version 2.0",
      heading: "The faster way to run your work",
      description: "One workspace for planning, tracking, and shipping — without the busywork.",
      buttonLabel: "Start free trial",
      secondaryButtonLabel: "Book a demo",
    },
  }),
  defineVariation({
    id: "content-bento",
    sectionType: "content",
    name: "Feature Bento",
    description: "One large feature tile with supporting tiles around it — a modern product-page staple.",
    tags: ["saas", "technical", "modern", "features"],
    supportedPageTypes: ["homepage", "landing", "services", "pricing", "custom"],
    contentDefaults: {
      eyebrow: "Everything included",
      heading: "Built for the whole team",
      items: [
        { title: "Real-time collaboration", description: "Work together without stepping on each other." },
        { title: "Automations", description: "Repetitive work runs itself." },
        { title: "Integrations", description: "Plays well with your stack." },
        { title: "Reporting", description: "Numbers your leadership will read." },
        { title: "Permissions", description: "The right access for every role." },
      ],
    },
  }),
  defineVariation({
    id: "content-spec-table",
    sectionType: "content",
    name: "Comparison Table",
    description: "Feature-by-feature comparison rows — us versus the alternative.",
    tags: ["saas", "technical", "corporate", "comparison"],
    supportedPageTypes: ["homepage", "landing", "pricing", "services", "custom"],
    contentDefaults: {
      eyebrow: "Why switch",
      heading: "See how we compare",
      items: [
        { title: "Unlimited projects", description: "No per-seat surprises" },
        { title: "Priority support", description: "Real humans, under an hour" },
        { title: "Version history", description: "Every change, forever" },
        { title: "Approvals built in", description: "No email ping-pong" },
      ],
    },
  }),
  defineVariation({
    id: "svc-pricing-tiers",
    sectionType: "services",
    componentKey: "svc-pricing",
    name: "Pricing Tiers",
    description: "Three plans side by side with a highlighted recommendation.",
    tags: ["saas", "pricing", "modern"],
    supportedPageTypes: ["homepage", "pricing", "landing", "services", "custom"],
    defaultLayout: { ...BASE_LAYOUT, columns: 3, alignment: "center" },
    defaultStyle: { ...BASE_STYLE, background: "muted", spacing: "spacious" },
  }),
  defineVariation({
    id: "marquee-integrations",
    sectionType: "marquee",
    componentKey: "marquee-row",
    name: "Integration Logos",
    description: "A quiet strip of the tools you connect with.",
    tags: ["saas", "technical", "logos"],
    contentDefaults: {
      items: [
        { type: "logo", label: "Slack" }, { type: "logo", label: "Figma" }, { type: "logo", label: "GitHub" },
        { type: "logo", label: "Notion" }, { type: "logo", label: "Linear" }, { type: "logo", label: "Zapier" },
      ],
    },
  }),

  // --- Minimalist / Swiss ----------------------------------------------------
  defineVariation({
    id: "hero-swiss",
    sectionType: "hero",
    componentKey: "hero-minimal",
    name: "Swiss Minimal Hero",
    description: "A single oversized statement, hard left, and a great deal of air.",
    tags: ["minimal", "swiss", "typographic"],
    defaultLayout: { ...BASE_LAYOUT, alignment: "left", contentWidth: "narrow" },
    defaultStyle: { ...BASE_STYLE, spacing: "spacious" },
    contentDefaults: {
      heading: "Less, but better.",
      description: "We design objects and interfaces with everything unnecessary removed.",
    },
  }),
  defineVariation({
    id: "content-quote",
    sectionType: "content",
    name: "Pull Quote",
    description: "One oversized quotation with a small attribution rule.",
    tags: ["minimal", "editorial", "luxury", "quote"],
    supportedPageTypes: ["homepage", "about", "landing", "case-study", "custom"],
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", contentWidth: "narrow" },
    defaultStyle: { ...BASE_STYLE, spacing: "spacious" },
    contentDefaults: {
      description: "Design is not just what it looks like. Design is how it works.",
      attribution: "A very satisfied customer",
    },
  }),
  defineVariation({
    id: "content-manifesto",
    sectionType: "content",
    componentKey: "content-intro",
    name: "Manifesto Block",
    description: "A narrow column of conviction — what you believe, stated plainly.",
    tags: ["minimal", "swiss", "editorial"],
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", contentWidth: "narrow" },
    defaultStyle: { ...BASE_STYLE, spacing: "spacious" },
    contentDefaults: {
      eyebrow: "Our belief",
      heading: "Good design is as little design as possible",
      description: "Every element earns its place. What remains is what matters.",
      buttonLabel: "",
    },
  }),

  // --- Editorial / Magazine ---------------------------------------------------
  defineVariation({
    id: "content-article-grid",
    sectionType: "content",
    componentKey: "content-blog",
    name: "Article Grid",
    description: "A three-column story grid with category tags, like a magazine front page.",
    tags: ["editorial", "blog", "magazine"],
    supportedPageTypes: ["homepage", "blog", "landing", "custom"],
    defaultLayout: { ...BASE_LAYOUT, columns: 3 },
    contentDefaults: {
      eyebrow: "The journal",
      heading: "Latest stories",
      posts: [
        { title: "The craft issue: process over polish", category: "Features" },
        { title: "Studio visit: where the work happens", category: "Interviews" },
        { title: "Field notes from the season", category: "Notes" },
      ],
    },
  }),
  defineVariation({
    id: "content-featured-story",
    sectionType: "content",
    componentKey: "content-image-text",
    name: "Featured Story",
    description: "A lead story splash: wide image beside a strong standfirst.",
    tags: ["editorial", "magazine", "feature"],
    defaultLayout: { ...BASE_LAYOUT, imagePosition: "left", contentWidth: "wide" },
    defaultStyle: { ...BASE_STYLE, spacing: "spacious" },
    contentDefaults: {
      eyebrow: "Cover story",
      heading: "The long read worth your coffee",
      description: "Set the scene in two sentences — why this story, why now.",
      buttonLabel: "Read the story",
    },
  }),

  // --- Bold / Brutalist -------------------------------------------------------
  defineVariation({
    id: "hero-brutalist",
    sectionType: "hero",
    componentKey: "hero-minimal",
    name: "Brutalist Statement",
    description: "Giant type on a dark slab. No image, no apology.",
    tags: ["bold", "brutalist", "typographic"],
    defaultLayout: { ...BASE_LAYOUT, alignment: "left", contentWidth: "wide" },
    defaultStyle: { ...BASE_STYLE, background: "dark", spacing: "spacious", cardRadius: "none", buttonStyle: "outline" },
    contentDefaults: {
      heading: "WE MAKE LOUD THINGS.",
      description: "Websites, drops, campaigns. Zero beige.",
      buttonLabel: "SEE THE WORK",
    },
  }),
  defineVariation({
    id: "marquee-shout",
    sectionType: "marquee",
    componentKey: "marquee-row",
    name: "Shout Ticker",
    description: "An all-caps statement on repeat, edge to edge.",
    tags: ["bold", "brutalist", "ticker"],
    defaultStyle: { ...BASE_STYLE, background: "dark", cardRadius: "none" },
    contentDefaults: {
      items: [
        { type: "text", label: "NEW DROP" }, { type: "text", label: "★" }, { type: "text", label: "NO BEIGE" },
        { type: "text", label: "★" }, { type: "text", label: "SHIP LOUD" }, { type: "text", label: "★" },
      ],
    },
  }),
  defineVariation({
    id: "content-manifesto-list",
    sectionType: "content",
    componentKey: "content-values",
    name: "Numbered Manifesto",
    description: "Rules of the house in one bold column.",
    tags: ["bold", "brutalist", "list"],
    defaultLayout: { ...BASE_LAYOUT, columns: 1, contentWidth: "narrow" },
    defaultStyle: { ...BASE_STYLE, border: "both", cardRadius: "none" },
    contentDefaults: {
      eyebrow: "House rules",
      heading: "How we work",
      items: [
        { title: "01 — Say it plainly", description: "If it needs a footnote, cut it." },
        { title: "02 — Ship the bold version", description: "The safe version bores everyone." },
        { title: "03 — Details are the design", description: "Sweat them." },
      ],
    },
  }),
  defineVariation({
    id: "cta-brutalist",
    sectionType: "cta",
    componentKey: "cta-stat-banner",
    name: "Slab CTA",
    description: "A hard-edged dark band with one demand.",
    tags: ["bold", "brutalist"],
    defaultStyle: { ...BASE_STYLE, background: "dark", cardRadius: "none", spacing: "spacious" },
  }),

  // --- Animated / Interactive -------------------------------------------------
  defineVariation({
    id: "content-scroll-story",
    sectionType: "content",
    name: "Scroll Story",
    description: "Pinned frames that reveal on scroll — annotated so developers know the motion intent.",
    tags: ["animated", "interactive", "scroll", "motion"],
    supportedPageTypes: ["homepage", "landing", "product", "custom"],
    contentDefaults: {
      eyebrow: "How it works",
      heading: "Three moments, one scroll",
      items: [
        { title: "The hook", description: "Product appears and pins while copy changes." },
        { title: "The proof", description: "Numbers count up as they enter the viewport." },
        { title: "The close", description: "CTA slides in once the story is told." },
      ],
    },
  }),
  defineVariation({
    id: "hero-motion",
    sectionType: "hero",
    componentKey: "hero-video",
    name: "Motion Hero",
    description: "Full-width video opener with a short overlaid claim.",
    tags: ["animated", "video", "motion"],
    defaultStyle: { ...BASE_STYLE, background: "dark", spacing: "spacious" },
  }),

  // --- Luxury / Premium -------------------------------------------------------
  defineVariation({
    id: "content-gallery",
    sectionType: "content",
    name: "Lookbook Gallery",
    description: "A staggered image grid that lets photography breathe.",
    tags: ["luxury", "portfolio", "organic", "gallery"],
    supportedPageTypes: ["homepage", "portfolio", "about", "collection", "custom"],
    defaultLayout: { ...BASE_LAYOUT, columns: 4 },
    defaultStyle: { ...BASE_STYLE, spacing: "spacious" },
    contentDefaults: {
      eyebrow: "The collection",
      heading: "Autumn, in eight frames",
      items: [
        { title: "Look 01" }, { title: "Look 02" }, { title: "Look 03" }, { title: "Look 04" },
        { title: "Look 05" }, { title: "Look 06" }, { title: "Look 07" }, { title: "Look 08" },
      ],
    },
  }),
  defineVariation({
    id: "hero-luxury",
    sectionType: "hero",
    componentKey: "hero-fullbg",
    name: "Luxury Full-Image Hero",
    description: "A full-bleed photograph with a few quiet words at its center.",
    tags: ["luxury", "premium", "elegant"],
    defaultLayout: { ...BASE_LAYOUT, alignment: "center" },
    defaultStyle: { ...BASE_STYLE, background: "image", spacing: "spacious", buttonStyle: "outline" },
    contentDefaults: {
      eyebrow: "Since 1962",
      heading: "Quietly exceptional",
      description: "",
      buttonLabel: "Discover the house",
    },
  }),
  defineVariation({
    id: "svc-heritage",
    sectionType: "services",
    componentKey: "svc-timeline",
    name: "Heritage Timeline",
    description: "Milestones of the house, told slowly down the page.",
    tags: ["luxury", "heritage", "timeline"],
    defaultStyle: { ...BASE_STYLE, spacing: "spacious" },
  }),
  defineVariation({
    id: "cta-appointment",
    sectionType: "cta",
    componentKey: "cta-contact-form",
    name: "Private Appointment",
    description: "A narrow, unhurried request form for consultations and fittings.",
    tags: ["luxury", "booking", "elegant"],
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", contentWidth: "narrow" },
    defaultStyle: { ...BASE_STYLE, background: "muted", spacing: "spacious" },
  }),

  // --- Playful / Illustrated --------------------------------------------------
  defineVariation({
    id: "hero-playful",
    sectionType: "hero",
    componentKey: "hero-centered",
    name: "Playful Hero",
    description: "Big friendly headline on a brand-colour splash, rounded everywhere.",
    tags: ["playful", "illustrated", "fun"],
    defaultLayout: { ...BASE_LAYOUT, alignment: "center" },
    defaultStyle: { ...BASE_STYLE, background: "brand", cardRadius: "large", buttonStyle: "soft", spacing: "spacious" },
    contentDefaults: {
      eyebrow: "Hi there 👋",
      heading: "Learning that doesn't feel like homework",
      description: "Five minutes a day. Genuinely fun. Slightly addictive.",
      buttonLabel: "Start playing",
    },
  }),
  defineVariation({
    id: "faq-bubbles",
    sectionType: "faq",
    componentKey: "faq-cards",
    name: "Chat Bubble FAQ",
    description: "Questions and answers styled like a friendly conversation.",
    tags: ["playful", "conversational"],
    defaultLayout: { ...BASE_LAYOUT, columns: 2 },
    defaultStyle: { ...BASE_STYLE, background: "muted", cardRadius: "large" },
  }),
  defineVariation({
    id: "content-badge-stats",
    sectionType: "content",
    componentKey: "content-stats",
    name: "Badge Stats",
    description: "Happy numbers in rounded badge tiles.",
    tags: ["playful", "stats"],
    defaultLayout: { ...BASE_LAYOUT, columns: 4, alignment: "center" },
    defaultStyle: { ...BASE_STYLE, background: "muted", cardRadius: "large" },
  }),
  defineVariation({
    id: "marquee-stickers",
    sectionType: "marquee",
    componentKey: "marquee-row",
    name: "Sticker Parade",
    description: "A rolling row of playful word-stickers.",
    tags: ["playful", "ticker"],
    defaultStyle: { ...BASE_STYLE, background: "brand", cardRadius: "large" },
    contentDefaults: {
      items: [
        { type: "text", label: "hooray" }, { type: "text", label: "★ 4.9" }, { type: "text", label: "no ads" },
        { type: "text", label: "kid-approved" }, { type: "text", label: "5 min/day" },
      ],
    },
  }),

  // --- Corporate / Trust ------------------------------------------------------
  defineVariation({
    id: "content-leadership",
    sectionType: "content",
    componentKey: "content-team",
    name: "Leadership Grid",
    description: "The people accountable, four across with roles.",
    tags: ["corporate", "team", "trust"],
    defaultLayout: { ...BASE_LAYOUT, columns: 4 },
  }),
  defineVariation({
    id: "marquee-certifications",
    sectionType: "marquee",
    componentKey: "marquee-row",
    name: "Certifications Strip",
    description: "Accreditations and memberships in a quiet proof row.",
    tags: ["corporate", "trust", "logos"],
    defaultStyle: { ...BASE_STYLE, background: "muted" },
    contentDefaults: {
      items: [
        { type: "logo", label: "ISO 27001" }, { type: "logo", label: "SOC 2" }, { type: "logo", label: "GDPR" },
        { type: "logo", label: "Chamber member" }, { type: "logo", label: "Est. 1998" },
      ],
    },
  }),
  defineVariation({
    id: "content-proof-stats",
    sectionType: "content",
    componentKey: "content-stats",
    name: "Proof Points",
    description: "The four numbers a procurement team wants to see.",
    tags: ["corporate", "stats", "trust"],
    defaultLayout: { ...BASE_LAYOUT, columns: 4, alignment: "center" },
    defaultStyle: { ...BASE_STYLE, border: "both" },
    contentDefaults: {
      stats: [
        { value: "27 yrs", label: "In business" },
        { value: "400+", label: "Clients served" },
        { value: "98%", label: "Retention" },
        { value: "$2.4B", label: "Managed" },
      ],
    },
  }),

  // --- Organic / Wellness -----------------------------------------------------
  defineVariation({
    id: "hero-arch",
    sectionType: "hero",
    name: "Arched Hero",
    description: "A soft arched image beside calm, unhurried copy.",
    tags: ["organic", "wellness", "soft"],
    defaultLayout: { ...BASE_LAYOUT, imagePosition: "right" },
    defaultStyle: { ...BASE_STYLE, background: "muted", spacing: "spacious", cardRadius: "large", buttonStyle: "soft" },
    contentDefaults: {
      eyebrow: "Take a breath",
      heading: "Care that meets you where you are",
      description: "Thoughtful treatments, small rituals, real rest.",
      buttonLabel: "Book a visit",
    },
  }),
  defineVariation({
    id: "svc-rituals",
    sectionType: "services",
    componentKey: "svc-process",
    name: "Ritual Steps",
    description: "Your process as a gentle three-step ritual.",
    tags: ["organic", "wellness", "process"],
    defaultStyle: { ...BASE_STYLE, background: "muted", spacing: "spacious", cardRadius: "large" },
  }),
  defineVariation({
    id: "faq-ingredients",
    sectionType: "faq",
    componentKey: "faq-accordion",
    name: "Ingredients & Care FAQ",
    description: "Soft accordion for what's-inside and how-to-care questions.",
    tags: ["organic", "wellness"],
    defaultStyle: { ...BASE_STYLE, background: "muted", cardRadius: "large", spacing: "spacious" },
  }),

  // --- Dark / Tech ------------------------------------------------------------
  defineVariation({
    id: "hero-tech",
    sectionType: "hero",
    componentKey: "hero-centered",
    name: "Dark Tech Hero",
    description: "Dark-mode opener with a single glowing claim.",
    tags: ["technical", "dark", "developer"],
    defaultLayout: { ...BASE_LAYOUT, alignment: "center" },
    defaultStyle: { ...BASE_STYLE, background: "dark", spacing: "spacious", buttonStyle: "outline" },
    contentDefaults: {
      eyebrow: "v3.0 — now generally available",
      heading: "Infrastructure that gets out of the way",
      description: "Deploy in seconds. Scale without meetings.",
      buttonLabel: "npm install",
      secondaryButtonLabel: "Read the docs",
    },
  }),
  defineVariation({
    id: "content-code",
    sectionType: "content",
    name: "Code Snippet",
    description: "Copy beside a mock editor window — show developers the API, not adjectives.",
    tags: ["technical", "developer", "dark"],
    supportedPageTypes: ["homepage", "landing", "services", "custom"],
    contentDefaults: {
      eyebrow: "Developer first",
      heading: "Three lines to production",
      description: "A typed SDK, sensible defaults, and docs that respect your time.",
      buttonLabel: "Explore the API",
    },
  }),

  // --- Detail pages: product, collection, blog -------------------------------
  defineVariation({
    id: "ecom-product-detail",
    sectionType: "ecommerce",
    name: "Product Detail",
    description: "Gallery, price, options, and an add-to-cart buy box — the heart of a product page.",
    tags: ["product", "ecommerce", "pdp"],
    supportedPageTypes: ["product", "landing", "custom"],
    contentDefaults: {
      eyebrow: "New arrival",
      heading: "Aria Lounge Chair",
      price: "$890",
      description: "Sculpted oak frame with a wool-blend cushion. Made in small batches, built for decades.",
      buttonLabel: "Add to cart",
      items: [
        { title: "Oak", price: "", description: "" },
        { title: "Walnut", price: "", description: "" },
        { title: "Black stain", price: "", description: "" },
      ],
    },
  }),
  defineVariation({
    id: "ecom-filter-grid",
    sectionType: "ecommerce",
    name: "Collection Browser",
    description: "Filter rail beside a sortable product grid — the standard collection layout.",
    tags: ["collection", "ecommerce", "filters"],
    supportedPageTypes: ["collection", "product", "custom"],
    contentDefaults: {
      eyebrow: "Collection",
      heading: "Living room",
      items: [
        { title: "Aria lounge chair", price: "$890", description: "" },
        { title: "Fjord dining table", price: "$1,450", description: "" },
        { title: "Nook side table", price: "$320", description: "" },
        { title: "Haven sofa", price: "$2,100", description: "" },
        { title: "Ledge shelf", price: "$540", description: "" },
        { title: "Arc floor lamp", price: "$260", description: "" },
      ],
    },
  }),
  defineVariation({
    id: "content-article-header",
    sectionType: "content",
    name: "Article Header",
    description: "Category, headline, byline, and lead image — how every post opens.",
    tags: ["blog", "editorial", "article"],
    supportedPageTypes: ["blog-article", "blog", "case-study", "custom"],
    defaultLayout: { ...BASE_LAYOUT, alignment: "center", contentWidth: "wide" },
    contentDefaults: {
      eyebrow: "Guides",
      heading: "A headline that earns the click",
      description: "One standfirst sentence that sets up the story and why it matters.",
      attribution: "Jamie Chen",
      buttonLabel: "",
    },
  }),
  defineVariation({
    id: "content-prose",
    sectionType: "content",
    name: "Article Body",
    description: "Reading-width prose with a subhead and an inline image — the body of a post.",
    tags: ["blog", "editorial", "article"],
    supportedPageTypes: ["blog-article", "case-study", "about", "custom"],
    defaultLayout: { ...BASE_LAYOUT, contentWidth: "narrow" },
    contentDefaults: {
      heading: "A section subheading",
      description: "The opening paragraph appears here in full — everything after is shown as placeholder text the writer will replace.",
      buttonLabel: "",
    },
  }),
  defineVariation({
    id: "content-author",
    sectionType: "content",
    name: "Author Bio",
    description: "Who wrote it, with a short bio and a follow action.",
    tags: ["blog", "editorial", "article"],
    supportedPageTypes: ["blog-article", "blog", "about", "custom"],
    defaultLayout: { ...BASE_LAYOUT, contentWidth: "narrow" },
    contentDefaults: {
      attribution: "Jamie Chen",
      description: "Senior editor. Writes about craft, process, and the people behind good work.",
      buttonLabel: "",
    },
  }),
  defineVariation({
    id: "content-post-list",
    sectionType: "content",
    name: "Post List",
    description: "Dated article rows, magazine-index style — denser than the card grid.",
    tags: ["blog", "editorial", "index"],
    supportedPageTypes: ["blog", "homepage", "custom"],
    contentDefaults: {
      eyebrow: "Archive",
      heading: "All stories",
      posts: [
        { title: "The craft issue: process over polish", category: "Features" },
        { title: "Studio visit: where the work happens", category: "Interviews" },
        { title: "Field notes from the season", category: "Notes" },
        { title: "What we shipped this quarter", category: "News" },
      ],
    },
  }),
];

export const SECTION_VARIATIONS: SectionVariation[] = [
  ...navigation,
  ...hero,
  ...faq,
  ...marquee,
  ...testimonials,
  ...servicesV,
  ...ctaVariations,
  ...footerVariations,
  ...contentVariations,
  ...ecommerceVariations,
  ...designPaths,
];

const BY_ID = new Map(SECTION_VARIATIONS.map((v) => [v.id, v]));

export function getVariation(id: string): SectionVariation | undefined {
  return BY_ID.get(id);
}

export function variationsOfType(type: SectionType): SectionVariation[] {
  return SECTION_VARIATIONS.filter((v) => v.sectionType === type);
}

export const SECTION_TYPE_ORDER: SectionType[] = [
  "navigation",
  "hero",
  "faq",
  "marquee",
  "testimonials",
  "services",
  "cta",
  "footer",
  "content",
  "ecommerce",
];
