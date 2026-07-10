import type {
  PageType,
  SectionFieldDefinition,
  SectionTemplate,
} from "@/types";

/**
 * The reusable section library. Each entry is a full template definition:
 * schema-driven content fields, variations, layout/style defaults.
 * Seeded into local storage so the admin area can toggle/edit metadata.
 */

const T0 = "2026-05-04T09:00:00.000Z";

const ALL_PAGES: PageType[] = [
  "homepage", "about", "services", "service", "product", "collection",
  "contact", "faq", "portfolio", "case-study", "blog", "blog-article",
  "landing", "pricing", "team", "testimonials", "booking", "custom",
];

const MARKETING_PAGES: PageType[] = [
  "homepage", "about", "services", "service", "landing", "pricing", "custom",
];

// ---------------------------------------------------------------------------
// Field helpers keep the schema definitions compact and consistent.
// ---------------------------------------------------------------------------

const text = (key: string, label: string, placeholder?: string): SectionFieldDefinition => ({
  key, label, type: "text", placeholder,
});
const textarea = (key: string, label: string, placeholder?: string): SectionFieldDefinition => ({
  key, label, type: "textarea", placeholder,
});
const url = (key: string, label: string): SectionFieldDefinition => ({
  key, label, type: "url", placeholder: "/page or https://…",
});
const image = (key: string, label: string): SectionFieldDefinition => ({
  key, label, type: "image",
});
const repeater = (
  key: string,
  label: string,
  itemLabel: string,
  itemFields: SectionFieldDefinition[],
  maxItems = 12,
): SectionFieldDefinition => ({ key, label, type: "repeater", itemLabel, itemFields, maxItems });

const eyebrowHeadingDescription: SectionFieldDefinition[] = [
  text("eyebrow", "Eyebrow", "Small label above the heading"),
  text("heading", "Heading"),
  textarea("description", "Description"),
];

const primaryButton: SectionFieldDefinition[] = [
  text("buttonLabel", "Button label"),
  url("buttonUrl", "Button URL"),
];

const secondaryButton: SectionFieldDefinition[] = [
  text("secondaryButtonLabel", "Secondary button label"),
  url("secondaryButtonUrl", "Secondary button URL"),
];

type TemplateInput = Partial<SectionTemplate> & Pick<SectionTemplate, "id" | "name" | "category" | "description">;

function defineSection(input: TemplateInput): SectionTemplate {
  return {
    thumbnail: input.id,
    supportedPageTypes: ALL_PAGES,
    variations: [{ id: "default", name: "Default" }],
    defaultContent: {},
    contentSchema: [],
    defaultLayout: {
      alignment: "left",
      imagePosition: "none",
      columns: 1,
      contentWidth: "normal",
      itemCount: 3,
      mobileStacking: "default",
    },
    defaultStyle: {
      background: "none",
      backgroundColor: null,
      textColor: null,
      accentColor: null,
      border: "none",
      spacing: "normal",
      cardRadius: "medium",
      buttonStyle: "solid",
    },
    responsiveSettings: { stackOnMobile: true, mobileColumns: 1, hideOnMobile: false },
    isActive: true,
    createdAt: T0,
    updatedAt: T0,
    ...input,
  };
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

const navigation: SectionTemplate[] = [
  defineSection({
    id: "announcement-bar",
    name: "Announcement Bar",
    category: "navigation",
    description: "A slim bar for promotions, shipping notices, or announcements.",
    variations: [
      { id: "default", name: "Single message" },
      { id: "with-link", name: "Message with link" },
      { id: "dismissible", name: "Dismissible" },
    ],
    defaultContent: {
      message: "Free shipping on orders over $100",
      linkLabel: "Shop now",
      linkUrl: "/collections/all",
    },
    contentSchema: [
      text("message", "Message"),
      text("linkLabel", "Link label"),
      url("linkUrl", "Link URL"),
    ],
    defaultLayout: {
      alignment: "center", imagePosition: "none", columns: 1,
      contentWidth: "full", itemCount: 1, mobileStacking: "default",
    },
    defaultStyle: {
      background: "dark", backgroundColor: null, textColor: null, accentColor: null,
      border: "none", spacing: "compact", cardRadius: "none", buttonStyle: "link",
    },
  }),
  defineSection({
    id: "header-standard",
    name: "Standard Header",
    category: "navigation",
    description: "Logo left, navigation links right — the classic website header.",
    variations: [
      { id: "default", name: "Links right" },
      { id: "with-cta", name: "With CTA button" },
      { id: "minimal", name: "Minimal" },
    ],
    defaultContent: {
      logoText: "Your Brand",
      links: [
        { label: "Home" }, { label: "About" }, { label: "Services" }, { label: "Contact" },
      ],
      buttonLabel: "Get in touch",
      buttonUrl: "/contact",
    },
    contentSchema: [
      text("logoText", "Logo text"),
      repeater("links", "Navigation links", "Link", [text("label", "Label")], 7),
      ...primaryButton,
    ],
  }),
  defineSection({
    id: "header-centered",
    name: "Centered Logo Header",
    category: "navigation",
    description: "Navigation split around a centered logo — editorial and boutique feel.",
    variations: [
      { id: "default", name: "Split navigation" },
      { id: "stacked", name: "Logo above links" },
    ],
    defaultContent: {
      logoText: "Your Brand",
      links: [
        { label: "Shop" }, { label: "About" }, { label: "Journal" }, { label: "Contact" },
      ],
    },
    contentSchema: [
      text("logoText", "Logo text"),
      repeater("links", "Navigation links", "Link", [text("label", "Label")], 6),
    ],
    defaultLayout: {
      alignment: "center", imagePosition: "none", columns: 1,
      contentWidth: "full", itemCount: 1, mobileStacking: "default",
    },
  }),
  defineSection({
    id: "header-ecommerce",
    name: "Ecommerce Header",
    category: "navigation",
    description: "Header with search, account, and cart icons for online stores.",
    supportedPageTypes: ALL_PAGES,
    variations: [
      { id: "default", name: "With search bar" },
      { id: "icons-only", name: "Icons only" },
    ],
    defaultContent: {
      logoText: "Your Store",
      links: [
        { label: "New In" }, { label: "Shop" }, { label: "Collections" }, { label: "Sale" },
      ],
    },
    contentSchema: [
      text("logoText", "Logo text"),
      repeater("links", "Navigation links", "Link", [text("label", "Label")], 6),
    ],
  }),
];

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

const hero: SectionTemplate[] = [
  defineSection({
    id: "hero-centered",
    name: "Centered Hero",
    category: "hero",
    description: "A focused, centered introduction with heading, text, and buttons.",
    supportedPageTypes: MARKETING_PAGES,
    variations: [
      { id: "default", name: "Text only" },
      { id: "with-image", name: "With image below" },
      { id: "compact", name: "Compact" },
    ],
    defaultContent: {
      eyebrow: "Welcome",
      heading: "A clear headline about what you do",
      description: "One or two sentences that explain your value and who you help.",
      buttonLabel: "Get started",
      buttonUrl: "/contact",
      secondaryButtonLabel: "Learn more",
      secondaryButtonUrl: "/about",
      image: null,
    },
    contentSchema: [
      ...eyebrowHeadingDescription,
      ...primaryButton,
      ...secondaryButton,
      image("image", "Supporting image"),
    ],
    defaultLayout: {
      alignment: "center", imagePosition: "none", columns: 1,
      contentWidth: "narrow", itemCount: 1, mobileStacking: "default",
    },
    defaultStyle: {
      background: "none", backgroundColor: null, textColor: null, accentColor: null,
      border: "none", spacing: "spacious", cardRadius: "medium", buttonStyle: "solid",
    },
  }),
  defineSection({
    id: "hero-split",
    name: "Split Hero with Image",
    category: "hero",
    description: "Text on one side, a large image on the other.",
    supportedPageTypes: MARKETING_PAGES.concat(["collection", "product"]),
    variations: [
      { id: "default", name: "Image right" },
      { id: "image-left", name: "Image left" },
      { id: "overlap", name: "Overlapping card" },
    ],
    defaultContent: {
      eyebrow: "New collection",
      heading: "A headline paired with a strong visual",
      description: "Introduce your product, service, or story next to a hero image.",
      buttonLabel: "Shop now",
      buttonUrl: "/collections/all",
      secondaryButtonLabel: "Our story",
      secondaryButtonUrl: "/about",
      image: null,
    },
    contentSchema: [
      ...eyebrowHeadingDescription,
      ...primaryButton,
      ...secondaryButton,
      image("image", "Hero image"),
    ],
    defaultLayout: {
      alignment: "left", imagePosition: "right", columns: 2,
      contentWidth: "wide", itemCount: 1, mobileStacking: "default",
    },
  }),
  defineSection({
    id: "hero-fullwidth",
    name: "Full-Width Image Hero",
    category: "hero",
    description: "A full-bleed background image with overlaid heading and actions.",
    supportedPageTypes: MARKETING_PAGES.concat(["collection", "portfolio"]),
    variations: [
      { id: "default", name: "Center overlay" },
      { id: "left-overlay", name: "Left overlay" },
      { id: "bottom-bar", name: "Bottom content bar" },
    ],
    defaultContent: {
      eyebrow: "",
      heading: "Make a strong first impression",
      description: "A short supporting line over a full-width image.",
      buttonLabel: "Explore",
      buttonUrl: "/collections/all",
      image: null,
    },
    contentSchema: [...eyebrowHeadingDescription, ...primaryButton, image("image", "Background image")],
    defaultLayout: {
      alignment: "center", imagePosition: "background", columns: 1,
      contentWidth: "full", itemCount: 1, mobileStacking: "default",
    },
    defaultStyle: {
      background: "image", backgroundColor: null, textColor: null, accentColor: null,
      border: "none", spacing: "spacious", cardRadius: "none", buttonStyle: "solid",
    },
  }),
  defineSection({
    id: "hero-form",
    name: "Hero with Form",
    category: "hero",
    description: "Headline beside a short lead-capture form.",
    supportedPageTypes: ["homepage", "landing", "services", "booking", "custom"],
    variations: [
      { id: "default", name: "Form right" },
      { id: "form-card", name: "Form in card" },
    ],
    defaultContent: {
      eyebrow: "Free consultation",
      heading: "Tell us about your project",
      description: "Fill in a few details and we'll get back to you within one business day.",
      formTitle: "Request a callback",
      buttonLabel: "Send request",
      fields: [{ label: "Name" }, { label: "Email" }, { label: "Message" }],
    },
    contentSchema: [
      ...eyebrowHeadingDescription,
      text("formTitle", "Form title"),
      text("buttonLabel", "Submit button label"),
      repeater("fields", "Form fields", "Field", [text("label", "Field label")], 6),
    ],
    defaultLayout: {
      alignment: "left", imagePosition: "right", columns: 2,
      contentWidth: "wide", itemCount: 1, mobileStacking: "default",
    },
  }),
  defineSection({
    id: "hero-product",
    name: "Product-Focused Hero",
    category: "hero",
    description: "Spotlight a single product with price and buy action.",
    supportedPageTypes: ["homepage", "product", "landing", "collection"],
    variations: [
      { id: "default", name: "Product right" },
      { id: "product-left", name: "Product left" },
    ],
    defaultContent: {
      eyebrow: "Featured product",
      heading: "The product your customers will love",
      description: "Highlight your hero product with a short, persuasive description.",
      price: "$129",
      buttonLabel: "Add to cart",
      buttonUrl: "/products/example",
      image: null,
    },
    contentSchema: [
      ...eyebrowHeadingDescription,
      text("price", "Price"),
      ...primaryButton,
      image("image", "Product image"),
    ],
    defaultLayout: {
      alignment: "left", imagePosition: "right", columns: 2,
      contentWidth: "wide", itemCount: 1, mobileStacking: "default",
    },
  }),
  defineSection({
    id: "hero-stats",
    name: "Hero with Statistics",
    category: "hero",
    description: "A headline supported by three proof-point statistics.",
    supportedPageTypes: MARKETING_PAGES,
    variations: [
      { id: "default", name: "Stats below" },
      { id: "stats-right", name: "Stats right" },
    ],
    defaultContent: {
      eyebrow: "Trusted results",
      heading: "Results your visitors can trust",
      description: "Lead with credibility by pairing your message with real numbers.",
      buttonLabel: "Work with us",
      buttonUrl: "/contact",
      stats: [
        { value: "250+", label: "Projects delivered" },
        { value: "98%", label: "Client satisfaction" },
        { value: "12 yrs", label: "In business" },
      ],
    },
    contentSchema: [
      ...eyebrowHeadingDescription,
      ...primaryButton,
      repeater("stats", "Statistics", "Statistic", [text("value", "Value"), text("label", "Label")], 4),
    ],
    defaultLayout: {
      alignment: "center", imagePosition: "none", columns: 3,
      contentWidth: "normal", itemCount: 3, mobileStacking: "default",
    },
  }),
];

// ---------------------------------------------------------------------------
// Introduction and content
// ---------------------------------------------------------------------------

const content: SectionTemplate[] = [
  defineSection({
    id: "brand-intro",
    name: "Brand Introduction",
    category: "content",
    description: "A warm introduction to who you are and what you stand for.",
    variations: [
      { id: "default", name: "Centered" },
      { id: "left-aligned", name: "Left aligned" },
    ],
    defaultContent: {
      eyebrow: "About us",
      heading: "Crafted with care, made to last",
      description:
        "Share a short paragraph about your brand story, your craft, and the people behind it.",
      buttonLabel: "Read our story",
      buttonUrl: "/about",
    },
    contentSchema: [...eyebrowHeadingDescription, ...primaryButton],
    defaultLayout: {
      alignment: "center", imagePosition: "none", columns: 1,
      contentWidth: "narrow", itemCount: 1, mobileStacking: "default",
    },
    defaultStyle: {
      background: "muted", backgroundColor: null, textColor: null, accentColor: null,
      border: "none", spacing: "spacious", cardRadius: "medium", buttonStyle: "outline",
    },
  }),
  defineSection({
    id: "image-text",
    name: "Image & Text",
    category: "content",
    description: "A flexible half-image, half-text content block.",
    variations: [
      { id: "default", name: "Image left" },
      { id: "image-right", name: "Image right" },
    ],
    defaultContent: {
      eyebrow: "Why choose us",
      heading: "Pair a message with a meaningful image",
      description: "Use this section to explain a key idea alongside a supporting photo.",
      buttonLabel: "Learn more",
      buttonUrl: "/about",
      image: null,
    },
    contentSchema: [...eyebrowHeadingDescription, ...primaryButton, image("image", "Image")],
    defaultLayout: {
      alignment: "left", imagePosition: "left", columns: 2,
      contentWidth: "wide", itemCount: 1, mobileStacking: "default",
    },
  }),
  defineSection({
    id: "mission-statement",
    name: "Mission Statement",
    category: "content",
    description: "A large, quiet statement of purpose.",
    supportedPageTypes: ["homepage", "about", "custom", "landing"],
    variations: [{ id: "default", name: "Centered quote" }, { id: "with-signature", name: "With signature" }],
    defaultContent: {
      eyebrow: "Our mission",
      heading:
        "We believe every business deserves a website that feels considered, honest, and unmistakably theirs.",
      attribution: "The Founding Team",
    },
    contentSchema: [
      text("eyebrow", "Eyebrow"),
      textarea("heading", "Statement"),
      text("attribution", "Attribution"),
    ],
    defaultLayout: {
      alignment: "center", imagePosition: "none", columns: 1,
      contentWidth: "narrow", itemCount: 1, mobileStacking: "default",
    },
    defaultStyle: {
      background: "dark", backgroundColor: null, textColor: null, accentColor: null,
      border: "none", spacing: "spacious", cardRadius: "medium", buttonStyle: "solid",
    },
  }),
  defineSection({
    id: "company-values",
    name: "Company Values",
    category: "content",
    description: "A grid of the principles that guide your business.",
    supportedPageTypes: ["homepage", "about", "team", "custom"],
    variations: [
      { id: "default", name: "Three columns" },
      { id: "two-column", name: "Two columns" },
      { id: "list", name: "Numbered list" },
    ],
    defaultContent: {
      eyebrow: "Our values",
      heading: "What we stand for",
      description: "",
      items: [
        { title: "Quality first", description: "We never cut corners on materials or process." },
        { title: "Honest pricing", description: "Fair, transparent pricing with no surprises." },
        { title: "Built to last", description: "Designed for years of everyday use." },
      ],
    },
    contentSchema: [
      ...eyebrowHeadingDescription,
      repeater("items", "Values", "Value", [text("title", "Title"), textarea("description", "Description")], 6),
    ],
    defaultLayout: {
      alignment: "center", imagePosition: "none", columns: 3,
      contentWidth: "wide", itemCount: 3, mobileStacking: "default",
    },
  }),
  defineSection({
    id: "stats-section",
    name: "Statistics Section",
    category: "content",
    description: "A row of headline numbers that build credibility.",
    variations: [
      { id: "default", name: "Four across" },
      { id: "with-divider", name: "With dividers" },
    ],
    defaultContent: {
      eyebrow: "By the numbers",
      heading: "",
      stats: [
        { value: "10k+", label: "Happy customers" },
        { value: "4.9★", label: "Average rating" },
        { value: "30-day", label: "Return policy" },
        { value: "24/7", label: "Support" },
      ],
    },
    contentSchema: [
      text("eyebrow", "Eyebrow"),
      text("heading", "Heading"),
      repeater("stats", "Statistics", "Statistic", [text("value", "Value"), text("label", "Label")], 6),
    ],
    defaultLayout: {
      alignment: "center", imagePosition: "none", columns: 4,
      contentWidth: "wide", itemCount: 4, mobileStacking: "default",
    },
    responsiveSettings: { stackOnMobile: true, mobileColumns: 2, hideOnMobile: false },
  }),
];

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

const serviceCardFields: SectionFieldDefinition[] = [
  text("title", "Title"),
  textarea("description", "Description"),
  text("linkLabel", "Link label"),
];

const services: SectionTemplate[] = [
  defineSection({
    id: "services-cards",
    name: "Three Service Cards",
    category: "services",
    description: "Three cards summarising your core services.",
    supportedPageTypes: ["homepage", "services", "service", "about", "landing", "custom"],
    variations: [
      { id: "default", name: "Icon cards" },
      { id: "image-cards", name: "Image cards" },
      { id: "bordered", name: "Bordered" },
    ],
    defaultContent: {
      eyebrow: "What we do",
      heading: "Services built around you",
      description: "",
      items: [
        { title: "Service one", description: "A short description of this service and its outcome.", linkLabel: "Learn more" },
        { title: "Service two", description: "A short description of this service and its outcome.", linkLabel: "Learn more" },
        { title: "Service three", description: "A short description of this service and its outcome.", linkLabel: "Learn more" },
      ],
    },
    contentSchema: [
      ...eyebrowHeadingDescription,
      repeater("items", "Service cards", "Service", serviceCardFields, 6),
    ],
    defaultLayout: {
      alignment: "center", imagePosition: "none", columns: 3,
      contentWidth: "wide", itemCount: 3, mobileStacking: "default",
    },
  }),
  defineSection({
    id: "services-alternating",
    name: "Alternating Service Rows",
    category: "services",
    description: "Image-and-text rows that alternate sides for each service.",
    supportedPageTypes: ["homepage", "services", "service", "about", "custom"],
    variations: [
      { id: "default", name: "Start image left" },
      { id: "start-right", name: "Start image right" },
    ],
    defaultContent: {
      eyebrow: "Our services",
      heading: "A closer look at how we help",
      description: "",
      items: [
        { title: "Service one", description: "Explain the service, who it's for, and the result." },
        { title: "Service two", description: "Explain the service, who it's for, and the result." },
      ],
    },
    contentSchema: [
      ...eyebrowHeadingDescription,
      repeater("items", "Service rows", "Service", [text("title", "Title"), textarea("description", "Description")], 5),
    ],
    defaultLayout: {
      alignment: "left", imagePosition: "left", columns: 2,
      contentWidth: "wide", itemCount: 2, mobileStacking: "default",
    },
  }),
  defineSection({
    id: "services-list",
    name: "Service List",
    category: "services",
    description: "A compact list of every service you offer.",
    supportedPageTypes: ["homepage", "services", "pricing", "custom"],
    variations: [
      { id: "default", name: "Two-column list" },
      { id: "single", name: "Single column" },
    ],
    defaultContent: {
      eyebrow: "Full service list",
      heading: "Everything we offer",
      items: [
        { title: "Service A" }, { title: "Service B" }, { title: "Service C" },
        { title: "Service D" }, { title: "Service E" }, { title: "Service F" },
      ],
    },
    contentSchema: [
      text("eyebrow", "Eyebrow"),
      text("heading", "Heading"),
      repeater("items", "Services", "Service", [text("title", "Service name")], 14),
    ],
    defaultLayout: {
      alignment: "left", imagePosition: "none", columns: 2,
      contentWidth: "normal", itemCount: 6, mobileStacking: "default",
    },
  }),
  defineSection({
    id: "services-process",
    name: "Service Process",
    category: "services",
    description: "Numbered steps that explain how working with you goes.",
    supportedPageTypes: ["homepage", "services", "service", "about", "booking", "custom"],
    variations: [
      { id: "default", name: "Horizontal steps" },
      { id: "vertical", name: "Vertical timeline" },
    ],
    defaultContent: {
      eyebrow: "How it works",
      heading: "A simple, guided process",
      description: "",
      items: [
        { title: "Discovery", description: "We learn about your goals and needs." },
        { title: "Proposal", description: "You receive a clear plan and quote." },
        { title: "Delivery", description: "We do the work and keep you updated." },
        { title: "Support", description: "We stay available after launch." },
      ],
    },
    contentSchema: [
      ...eyebrowHeadingDescription,
      repeater("items", "Steps", "Step", [text("title", "Title"), textarea("description", "Description")], 6),
    ],
    defaultLayout: {
      alignment: "center", imagePosition: "none", columns: 4,
      contentWidth: "wide", itemCount: 4, mobileStacking: "default",
    },
    responsiveSettings: { stackOnMobile: true, mobileColumns: 1, hideOnMobile: false },
  }),
];

// ---------------------------------------------------------------------------
// Ecommerce
// ---------------------------------------------------------------------------

const productItemFields: SectionFieldDefinition[] = [
  text("title", "Product name"),
  text("price", "Price"),
];

const ecommerce: SectionTemplate[] = [
  defineSection({
    id: "featured-products",
    name: "Featured Products",
    category: "ecommerce",
    description: "A curated row of featured products with prices.",
    supportedPageTypes: ["homepage", "collection", "product", "landing", "custom"],
    variations: [
      { id: "default", name: "Four across" },
      { id: "three-large", name: "Three large" },
      { id: "carousel", name: "Carousel style" },
    ],
    defaultContent: {
      eyebrow: "Featured",
      heading: "Customer favourites",
      buttonLabel: "View all products",
      buttonUrl: "/collections/all",
      items: [
        { title: "Product one", price: "$89" },
        { title: "Product two", price: "$129" },
        { title: "Product three", price: "$59" },
        { title: "Product four", price: "$210" },
      ],
    },
    contentSchema: [
      text("eyebrow", "Eyebrow"),
      text("heading", "Heading"),
      ...primaryButton,
      repeater("items", "Products", "Product", productItemFields, 8),
    ],
    defaultLayout: {
      alignment: "left", imagePosition: "top", columns: 4,
      contentWidth: "wide", itemCount: 4, mobileStacking: "default",
    },
    responsiveSettings: { stackOnMobile: true, mobileColumns: 2, hideOnMobile: false },
  }),
  defineSection({
    id: "product-grid",
    name: "Product Grid",
    category: "ecommerce",
    description: "A full grid of products for collection-style browsing.",
    supportedPageTypes: ["homepage", "collection", "custom"],
    variations: [
      { id: "default", name: "Three columns" },
      { id: "four-columns", name: "Four columns" },
      { id: "with-filters", name: "With filter bar" },
    ],
    defaultContent: {
      heading: "Shop the range",
      items: [
        { title: "Product one", price: "$89" },
        { title: "Product two", price: "$129" },
        { title: "Product three", price: "$59" },
        { title: "Product four", price: "$210" },
        { title: "Product five", price: "$75" },
        { title: "Product six", price: "$149" },
      ],
    },
    contentSchema: [
      text("heading", "Heading"),
      repeater("items", "Products", "Product", productItemFields, 12),
    ],
    defaultLayout: {
      alignment: "left", imagePosition: "top", columns: 3,
      contentWidth: "wide", itemCount: 6, mobileStacking: "default",
    },
    responsiveSettings: { stackOnMobile: true, mobileColumns: 2, hideOnMobile: false },
  }),
  defineSection({
    id: "collection-cards",
    name: "Collection Cards",
    category: "ecommerce",
    description: "Large cards linking to your main product collections.",
    supportedPageTypes: ["homepage", "collection", "landing", "custom"],
    variations: [
      { id: "default", name: "Three cards" },
      { id: "two-wide", name: "Two wide cards" },
      { id: "mosaic", name: "Mosaic" },
    ],
    defaultContent: {
      eyebrow: "Collections",
      heading: "Shop by room",
      items: [
        { title: "Living room" },
        { title: "Bedroom" },
        { title: "Dining" },
      ],
    },
    contentSchema: [
      text("eyebrow", "Eyebrow"),
      text("heading", "Heading"),
      repeater("items", "Collections", "Collection", [text("title", "Collection name")], 6),
    ],
    defaultLayout: {
      alignment: "left", imagePosition: "background", columns: 3,
      contentWidth: "wide", itemCount: 3, mobileStacking: "default",
    },
  }),
  defineSection({
    id: "best-sellers",
    name: "Best Sellers",
    category: "ecommerce",
    description: "Your top-selling products with a proof-driven headline.",
    supportedPageTypes: ["homepage", "collection", "landing", "custom"],
    variations: [
      { id: "default", name: "With rank badges" },
      { id: "simple", name: "Simple row" },
    ],
    defaultContent: {
      eyebrow: "Best sellers",
      heading: "Most loved this season",
      items: [
        { title: "Product one", price: "$129" },
        { title: "Product two", price: "$89" },
        { title: "Product three", price: "$159" },
      ],
    },
    contentSchema: [
      text("eyebrow", "Eyebrow"),
      text("heading", "Heading"),
      repeater("items", "Products", "Product", productItemFields, 6),
    ],
    defaultLayout: {
      alignment: "center", imagePosition: "top", columns: 3,
      contentWidth: "wide", itemCount: 3, mobileStacking: "default",
    },
  }),
  defineSection({
    id: "product-benefits",
    name: "Product Benefits",
    category: "ecommerce",
    description: "Icon-led benefits like shipping, returns, and warranty.",
    supportedPageTypes: ["homepage", "product", "collection", "landing", "custom"],
    variations: [
      { id: "default", name: "Four benefits" },
      { id: "three", name: "Three benefits" },
      { id: "banner", name: "Slim banner" },
    ],
    defaultContent: {
      heading: "",
      items: [
        { title: "Free delivery", description: "On all orders over $100" },
        { title: "5-year warranty", description: "Built to last, guaranteed" },
        { title: "Easy returns", description: "30-day no-fuss returns" },
        { title: "Secure checkout", description: "Safe and encrypted payment" },
      ],
    },
    contentSchema: [
      text("heading", "Heading"),
      repeater("items", "Benefits", "Benefit", [text("title", "Title"), text("description", "Description")], 6),
    ],
    defaultLayout: {
      alignment: "center", imagePosition: "none", columns: 4,
      contentWidth: "wide", itemCount: 4, mobileStacking: "default",
    },
    defaultStyle: {
      background: "muted", backgroundColor: null, textColor: null, accentColor: null,
      border: "none", spacing: "compact", cardRadius: "medium", buttonStyle: "solid",
    },
    responsiveSettings: { stackOnMobile: true, mobileColumns: 2, hideOnMobile: false },
  }),
];

// ---------------------------------------------------------------------------
// Social proof
// ---------------------------------------------------------------------------

const testimonialFields: SectionFieldDefinition[] = [
  textarea("quote", "Quote"),
  text("author", "Author"),
  text("role", "Role or location"),
];

const socialProof: SectionTemplate[] = [
  defineSection({
    id: "testimonial-cards",
    name: "Testimonial Cards",
    category: "social-proof",
    description: "A set of customer quotes displayed as cards.",
    variations: [
      { id: "default", name: "Three cards" },
      { id: "two-cards", name: "Two cards" },
      { id: "masonry", name: "Masonry" },
    ],
    defaultContent: {
      eyebrow: "Testimonials",
      heading: "What our customers say",
      items: [
        { quote: "Outstanding quality and service from start to finish.", author: "Jordan P.", role: "Verified customer" },
        { quote: "Exactly what we were looking for. Highly recommended.", author: "Sarah K.", role: "Verified customer" },
        { quote: "The team went above and beyond for us.", author: "Liam D.", role: "Verified customer" },
      ],
    },
    contentSchema: [
      text("eyebrow", "Eyebrow"),
      text("heading", "Heading"),
      repeater("items", "Testimonials", "Testimonial", testimonialFields, 8),
    ],
    defaultLayout: {
      alignment: "center", imagePosition: "none", columns: 3,
      contentWidth: "wide", itemCount: 3, mobileStacking: "default",
    },
  }),
  defineSection({
    id: "testimonial-featured",
    name: "Featured Testimonial",
    category: "social-proof",
    description: "One large, standout quote from a key customer.",
    variations: [
      { id: "default", name: "Centered" },
      { id: "with-photo", name: "With photo" },
    ],
    defaultContent: {
      quote: "Working with this team transformed how our customers see us online.",
      author: "Alex Rivera",
      role: "Founder, Example Co.",
    },
    contentSchema: testimonialFields,
    defaultLayout: {
      alignment: "center", imagePosition: "none", columns: 1,
      contentWidth: "narrow", itemCount: 1, mobileStacking: "default",
    },
    defaultStyle: {
      background: "muted", backgroundColor: null, textColor: null, accentColor: null,
      border: "none", spacing: "spacious", cardRadius: "medium", buttonStyle: "solid",
    },
  }),
  defineSection({
    id: "logo-row",
    name: "Customer Logo Row",
    category: "social-proof",
    description: "A quiet row of client or press logos.",
    variations: [
      { id: "default", name: "Single row" },
      { id: "with-heading", name: "With heading" },
    ],
    defaultContent: {
      heading: "Trusted by teams like",
      items: [
        { name: "Logo one" }, { name: "Logo two" }, { name: "Logo three" },
        { name: "Logo four" }, { name: "Logo five" },
      ],
    },
    contentSchema: [
      text("heading", "Heading"),
      repeater("items", "Logos", "Logo", [text("name", "Company name")], 8),
    ],
    defaultLayout: {
      alignment: "center", imagePosition: "none", columns: 5,
      contentWidth: "wide", itemCount: 5, mobileStacking: "default",
    },
    responsiveSettings: { stackOnMobile: true, mobileColumns: 3, hideOnMobile: false },
  }),
  defineSection({
    id: "review-summary",
    name: "Review Summary",
    category: "social-proof",
    description: "An aggregate rating with highlights from reviews.",
    supportedPageTypes: ["homepage", "product", "collection", "testimonials", "landing", "custom"],
    variations: [
      { id: "default", name: "Rating with quotes" },
      { id: "compact", name: "Compact bar" },
    ],
    defaultContent: {
      rating: "4.9",
      ratingLabel: "from 2,300+ reviews",
      heading: "Rated excellent by our customers",
      items: [
        { quote: "Fast delivery and beautiful quality.", author: "Verified buyer" },
        { quote: "Customer support was brilliant.", author: "Verified buyer" },
      ],
    },
    contentSchema: [
      text("rating", "Rating value"),
      text("ratingLabel", "Rating label"),
      text("heading", "Heading"),
      repeater("items", "Highlighted reviews", "Review", [textarea("quote", "Quote"), text("author", "Author")], 4),
    ],
    defaultLayout: {
      alignment: "center", imagePosition: "none", columns: 2,
      contentWidth: "normal", itemCount: 2, mobileStacking: "default",
    },
  }),
  defineSection({
    id: "case-study-cards",
    name: "Case Study Cards",
    category: "social-proof",
    description: "Cards linking to detailed customer success stories.",
    supportedPageTypes: ["homepage", "services", "portfolio", "case-study", "about", "custom"],
    variations: [
      { id: "default", name: "Three cards" },
      { id: "featured", name: "One featured + two" },
    ],
    defaultContent: {
      eyebrow: "Case studies",
      heading: "Results we're proud of",
      items: [
        { title: "Case study one", description: "A one-line summary of the outcome.", result: "+120% enquiries" },
        { title: "Case study two", description: "A one-line summary of the outcome.", result: "2x conversion" },
        { title: "Case study three", description: "A one-line summary of the outcome.", result: "-40% bounce rate" },
      ],
    },
    contentSchema: [
      text("eyebrow", "Eyebrow"),
      text("heading", "Heading"),
      repeater("items", "Case studies", "Case study", [
        text("title", "Title"), textarea("description", "Summary"), text("result", "Key result"),
      ], 6),
    ],
    defaultLayout: {
      alignment: "left", imagePosition: "top", columns: 3,
      contentWidth: "wide", itemCount: 3, mobileStacking: "default",
    },
  }),
];

// ---------------------------------------------------------------------------
// Conversion and information
// ---------------------------------------------------------------------------

const conversion: SectionTemplate[] = [
  defineSection({
    id: "faq-accordion",
    name: "FAQ Accordion",
    category: "conversion",
    description: "Expandable questions and answers.",
    variations: [
      { id: "default", name: "Single column" },
      { id: "two-column", name: "Two columns" },
      { id: "with-contact", name: "With contact aside" },
    ],
    defaultContent: {
      eyebrow: "FAQ",
      heading: "Frequently asked questions",
      items: [
        { question: "How long does delivery take?", answer: "Most orders arrive within 3–5 business days." },
        { question: "What is your returns policy?", answer: "You can return any item within 30 days." },
        { question: "Do you offer support?", answer: "Yes — our team is available on weekdays." },
        { question: "Where are you based?", answer: "We operate from our studio and workshop." },
      ],
    },
    contentSchema: [
      text("eyebrow", "Eyebrow"),
      text("heading", "Heading"),
      repeater("items", "Questions", "Question", [
        text("question", "Question"), textarea("answer", "Answer"),
      ], 12),
    ],
    defaultLayout: {
      alignment: "center", imagePosition: "none", columns: 1,
      contentWidth: "narrow", itemCount: 4, mobileStacking: "default",
    },
  }),
  defineSection({
    id: "newsletter-signup",
    name: "Newsletter Signup",
    category: "conversion",
    description: "An email capture band with a short pitch.",
    variations: [
      { id: "default", name: "Centered" },
      { id: "split", name: "Split layout" },
    ],
    defaultContent: {
      heading: "Stay in the loop",
      description: "Sign up for new arrivals, offers, and helpful guides.",
      buttonLabel: "Subscribe",
      placeholder: "Enter your email",
    },
    contentSchema: [
      text("heading", "Heading"),
      textarea("description", "Description"),
      text("buttonLabel", "Button label"),
      text("placeholder", "Input placeholder"),
    ],
    defaultLayout: {
      alignment: "center", imagePosition: "none", columns: 1,
      contentWidth: "narrow", itemCount: 1, mobileStacking: "default",
    },
    defaultStyle: {
      background: "brand", backgroundColor: null, textColor: null, accentColor: null,
      border: "none", spacing: "normal", cardRadius: "medium", buttonStyle: "solid",
    },
  }),
  defineSection({
    id: "consultation-cta",
    name: "Consultation CTA",
    category: "conversion",
    description: "A strong call-to-action band inviting visitors to get in touch.",
    variations: [
      { id: "default", name: "Centered" },
      { id: "split", name: "Text + button split" },
    ],
    defaultContent: {
      eyebrow: "Ready to start?",
      heading: "Book a free consultation",
      description: "Tell us about your goals and we'll map out the right approach together.",
      buttonLabel: "Book a call",
      buttonUrl: "/contact",
      secondaryButtonLabel: "See pricing",
      secondaryButtonUrl: "/pricing",
    },
    contentSchema: [...eyebrowHeadingDescription, ...primaryButton, ...secondaryButton],
    defaultLayout: {
      alignment: "center", imagePosition: "none", columns: 1,
      contentWidth: "narrow", itemCount: 1, mobileStacking: "default",
    },
    defaultStyle: {
      background: "dark", backgroundColor: null, textColor: null, accentColor: null,
      border: "none", spacing: "spacious", cardRadius: "medium", buttonStyle: "solid",
    },
  }),
  defineSection({
    id: "contact-form",
    name: "Contact Form",
    category: "conversion",
    description: "A contact form with supporting business details.",
    supportedPageTypes: ["homepage", "contact", "booking", "landing", "custom"],
    variations: [
      { id: "default", name: "Form + details" },
      { id: "form-only", name: "Form only" },
      { id: "with-map", name: "With map placeholder" },
    ],
    defaultContent: {
      eyebrow: "Contact",
      heading: "Get in touch",
      description: "We usually reply within one business day.",
      buttonLabel: "Send message",
      fields: [{ label: "Name" }, { label: "Email" }, { label: "Phone" }, { label: "Message" }],
      details: [
        { label: "Email", value: "hello@example.com" },
        { label: "Phone", value: "(555) 000-1234" },
        { label: "Address", value: "123 Example Street" },
      ],
    },
    contentSchema: [
      ...eyebrowHeadingDescription,
      text("buttonLabel", "Submit button label"),
      repeater("fields", "Form fields", "Field", [text("label", "Field label")], 8),
      repeater("details", "Contact details", "Detail", [text("label", "Label"), text("value", "Value")], 5),
    ],
    defaultLayout: {
      alignment: "left", imagePosition: "right", columns: 2,
      contentWidth: "wide", itemCount: 1, mobileStacking: "default",
    },
  }),
  defineSection({
    id: "blog-cards",
    name: "Blog Cards",
    category: "conversion",
    description: "Recent articles or guides displayed as cards.",
    supportedPageTypes: ["homepage", "blog", "blog-article", "about", "custom"],
    variations: [
      { id: "default", name: "Three cards" },
      { id: "featured", name: "One featured + list" },
    ],
    defaultContent: {
      eyebrow: "From the journal",
      heading: "Latest articles",
      buttonLabel: "View all articles",
      buttonUrl: "/blog",
      items: [
        { title: "Article title one", category: "Guides" },
        { title: "Article title two", category: "News" },
        { title: "Article title three", category: "Inspiration" },
      ],
    },
    contentSchema: [
      text("eyebrow", "Eyebrow"),
      text("heading", "Heading"),
      ...primaryButton,
      repeater("items", "Articles", "Article", [text("title", "Title"), text("category", "Category")], 6),
    ],
    defaultLayout: {
      alignment: "left", imagePosition: "top", columns: 3,
      contentWidth: "wide", itemCount: 3, mobileStacking: "default",
    },
  }),
  defineSection({
    id: "team-grid",
    name: "Team Grid",
    category: "conversion",
    description: "Photos, names, and roles for your team members.",
    supportedPageTypes: ["homepage", "about", "team", "custom"],
    variations: [
      { id: "default", name: "Four across" },
      { id: "three-large", name: "Three large" },
    ],
    defaultContent: {
      eyebrow: "Our team",
      heading: "The people behind the work",
      items: [
        { name: "Team member", role: "Role title" },
        { name: "Team member", role: "Role title" },
        { name: "Team member", role: "Role title" },
        { name: "Team member", role: "Role title" },
      ],
    },
    contentSchema: [
      text("eyebrow", "Eyebrow"),
      text("heading", "Heading"),
      repeater("items", "Team members", "Team member", [text("name", "Name"), text("role", "Role")], 12),
    ],
    defaultLayout: {
      alignment: "center", imagePosition: "top", columns: 4,
      contentWidth: "wide", itemCount: 4, mobileStacking: "default",
    },
    responsiveSettings: { stackOnMobile: true, mobileColumns: 2, hideOnMobile: false },
  }),
];

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

const footer: SectionTemplate[] = [
  defineSection({
    id: "footer-standard",
    name: "Footer",
    category: "footer",
    description: "A multi-column footer with link groups and legal line.",
    variations: [
      { id: "default", name: "Four columns" },
      { id: "simple", name: "Simple centered" },
      { id: "with-newsletter", name: "With newsletter" },
    ],
    defaultContent: {
      logoText: "Your Brand",
      tagline: "A short line about your business.",
      columns: [
        { title: "Shop", links: "New in, Best sellers, Sale" },
        { title: "Company", links: "About, Journal, Careers" },
        { title: "Support", links: "Contact, FAQ, Shipping" },
      ],
      legalText: "© 2026 Your Brand. All rights reserved.",
    },
    contentSchema: [
      text("logoText", "Logo text"),
      text("tagline", "Tagline"),
      repeater("columns", "Link columns", "Column", [
        text("title", "Column title"),
        text("links", "Links (comma separated)"),
      ], 5),
      text("legalText", "Legal text"),
    ],
    defaultLayout: {
      alignment: "left", imagePosition: "none", columns: 4,
      contentWidth: "wide", itemCount: 3, mobileStacking: "default",
    },
    defaultStyle: {
      background: "dark", backgroundColor: null, textColor: null, accentColor: null,
      border: "none", spacing: "normal", cardRadius: "none", buttonStyle: "solid",
    },
    responsiveSettings: { stackOnMobile: true, mobileColumns: 2, hideOnMobile: false },
  }),
];

export const SECTION_TEMPLATES: SectionTemplate[] = [
  ...navigation,
  ...hero,
  ...content,
  ...services,
  ...ecommerce,
  ...socialProof,
  ...conversion,
  ...footer,
];

export function getSectionTemplate(id: string): SectionTemplate | undefined {
  return SECTION_TEMPLATES.find((t) => t.id === id);
}
