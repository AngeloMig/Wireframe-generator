import type {
  SectionFieldDefinition,
  SectionType,
  SectionTypeDefinition,
} from "@/types";

/**
 * One shared content schema per section type. Every design variation of a
 * type renders (a subset of) this content, which is what makes switching
 * designs lossless: the content object always keeps the full shape.
 */

// ---------------------------------------------------------------------------
// Field helpers keep the schema definitions compact and consistent.
// ---------------------------------------------------------------------------

export const text = (key: string, label: string, placeholder?: string): SectionFieldDefinition => ({
  key, label, type: "text", placeholder,
});
export const textarea = (key: string, label: string, placeholder?: string): SectionFieldDefinition => ({
  key, label, type: "textarea", placeholder,
});
export const url = (key: string, label: string): SectionFieldDefinition => ({
  key, label, type: "url", placeholder: "/page or https://…",
});
export const image = (key: string, label: string): SectionFieldDefinition => ({
  key, label, type: "image",
});
export const toggle = (key: string, label: string): SectionFieldDefinition => ({
  key, label, type: "toggle",
});
export const select = (
  key: string,
  label: string,
  options: { value: string; label: string }[],
): SectionFieldDefinition => ({ key, label, type: "select", options });
export const repeater = (
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

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

const navigation: SectionTypeDefinition = {
  type: "navigation",
  label: "Navigation",
  description: "Headers, nav bars, and announcement bars that top every page.",
  contentSchema: [
    text("logoText", "Logo text"),
    repeater("links", "Navigation links", "Link", [text("label", "Label")], 8),
    text("ctaLabel", "CTA button label"),
    url("ctaUrl", "CTA button URL"),
    text("announcementText", "Announcement text"),
    toggle("showSearch", "Show search"),
    toggle("showAccount", "Show account icon"),
    toggle("showCart", "Show cart icon"),
    text("loginLabel", "Login link label"),
    text("contactPhone", "Contact phone"),
    text("contactEmail", "Contact email"),
    text("languageLabel", "Language / region label"),
    select("overlayTone", "Overlay content tone", [
      { value: "dark", label: "Dark text (light hero)" },
      { value: "light", label: "Light text (dark hero)" },
    ]),
    select("mobileMenuStyle", "Mobile menu style", [
      { value: "drawer-right", label: "Slide-in drawer (right)" },
      { value: "drawer-left", label: "Slide-in drawer (left)" },
      { value: "fullscreen", label: "Full-screen takeover" },
      { value: "bottom-sheet", label: "Bottom sheet" },
      { value: "dropdown", label: "Inline dropdown" },
      { value: "bottom-tabs", label: "Persistent bottom tabs" },
    ]),
  ],
  defaultContent: {
    logoText: "Your Brand",
    links: [{ label: "Home" }, { label: "About" }, { label: "Services" }, { label: "Contact" }],
    ctaLabel: "Get in touch",
    ctaUrl: "/contact",
    announcementText: "Free shipping on orders over $100",
    showSearch: true,
    showAccount: true,
    showCart: true,
    loginLabel: "Log in",
    contactPhone: "(555) 000-1234",
    contactEmail: "hello@example.com",
    languageLabel: "EN / USD",
    overlayTone: "light",
    mobileMenuStyle: "drawer-right",
  },
};

const hero: SectionTypeDefinition = {
  type: "hero",
  label: "Hero",
  description: "The opening statement of a page: headline, message, action.",
  contentSchema: [
    ...eyebrowHeadingDescription,
    ...primaryButton,
    ...secondaryButton,
    image("image", "Hero image"),
    text("price", "Price"),
    text("badge", "Promo badge"),
    text("videoUrl", "Video URL"),
    text("formTitle", "Form title"),
    repeater("fields", "Form fields", "Field", [text("label", "Field label")], 6),
    repeater("stats", "Statistics", "Statistic", [text("value", "Value"), text("label", "Label")], 4),
    repeater("logos", "Logos", "Logo", [text("name", "Company name")], 8),
    repeater("items", "Cards", "Card", [text("title", "Title"), textarea("description", "Description")], 4),
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
    price: "$129",
    badge: "Limited offer",
    videoUrl: "",
    formTitle: "Request a callback",
    fields: [{ label: "Name" }, { label: "Email" }, { label: "Message" }],
    stats: [
      { value: "250+", label: "Projects delivered" },
      { value: "98%", label: "Client satisfaction" },
      { value: "12 yrs", label: "In business" },
    ],
    logos: [
      { name: "Logo one" }, { name: "Logo two" }, { name: "Logo three" },
      { name: "Logo four" }, { name: "Logo five" },
    ],
    items: [
      { title: "Feature one", description: "A short supporting point." },
      { title: "Feature two", description: "A short supporting point." },
      { title: "Feature three", description: "A short supporting point." },
    ],
  },
};

const faq: SectionTypeDefinition = {
  type: "faq",
  label: "FAQ",
  description: "Questions and answers, from accordions to searchable lists.",
  contentSchema: [
    ...eyebrowHeadingDescription,
    repeater("categories", "Categories", "Category", [text("name", "Category name")], 6),
    repeater("questions", "Questions", "Question", [
      text("question", "Question"),
      textarea("answer", "Answer"),
      // categoryId is edited via the FAQ inspector panel, which offers the
      // section's categories as options.
      text("categoryId", "Category"),
    ], 16),
    text("ctaHeading", "CTA heading"),
    textarea("ctaDescription", "CTA description"),
    text("ctaButtonLabel", "CTA button label"),
    url("ctaButtonUrl", "CTA button URL"),
    text("searchPlaceholder", "Search placeholder"),
  ],
  defaultContent: {
    eyebrow: "FAQ",
    heading: "Frequently asked questions",
    description: "Everything you need to know before getting started.",
    categories: [
      { id: "cat-general", name: "General" },
      { id: "cat-orders", name: "Orders & delivery" },
    ],
    questions: [
      { question: "How long does delivery take?", answer: "Most orders arrive within 3–5 business days.", categoryId: "cat-orders" },
      { question: "What is your returns policy?", answer: "You can return any item within 30 days for a full refund.", categoryId: "cat-orders" },
      { question: "Do you offer support?", answer: "Yes — our team is available on weekdays from 9am to 5pm.", categoryId: "cat-general" },
      { question: "Where are you based?", answer: "We operate from our studio and workshop in the city centre.", categoryId: "cat-general" },
      { question: "Can I change my order?", answer: "Contact us within 24 hours and we'll update it before dispatch.", categoryId: "cat-orders" },
    ],
    ctaHeading: "Still have questions?",
    ctaDescription: "Our team is happy to help with anything not covered here.",
    ctaButtonLabel: "Contact support",
    ctaButtonUrl: "/contact",
    searchPlaceholder: "Search questions…",
  },
};

const marquee: SectionTypeDefinition = {
  type: "marquee",
  label: "Marquee & Ticker",
  description: "Scrolling rows of logos, statements, categories, or reviews.",
  contentSchema: [
    text("heading", "Heading (optional)"),
    repeater("items", "Items", "Item", [
      select("type", "Item type", [
        { value: "logo", label: "Logo" },
        { value: "text", label: "Text" },
        { value: "category", label: "Category" },
        { value: "review", label: "Review" },
        { value: "image", label: "Image card" },
      ]),
      text("label", "Label"),
      text("description", "Supporting text"),
    ], 16),
    toggle("animation", "Animate automatically"),
    select("direction", "Direction", [
      { value: "left", label: "Right to left" },
      { value: "right", label: "Left to right" },
    ]),
    select("speed", "Speed", [
      { value: "slow", label: "Slow" },
      { value: "medium", label: "Medium" },
      { value: "fast", label: "Fast" },
    ]),
    toggle("pauseOnHover", "Pause on hover / focus"),
    toggle("fadeEdges", "Fade edges"),
    toggle("showLabels", "Show item labels"),
    select("itemSpacing", "Item spacing", [
      { value: "compact", label: "Compact" },
      { value: "normal", label: "Normal" },
      { value: "spacious", label: "Spacious" },
    ]),
  ],
  defaultContent: {
    heading: "",
    items: [
      { type: "logo", label: "Northwind", description: "" },
      { type: "logo", label: "Acme Co", description: "" },
      { type: "logo", label: "Globex", description: "" },
      { type: "logo", label: "Initech", description: "" },
      { type: "logo", label: "Umbrella", description: "" },
      { type: "logo", label: "Stark & Co", description: "" },
    ],
    animation: true,
    direction: "left",
    speed: "medium",
    pauseOnHover: true,
    fadeEdges: true,
    showLabels: true,
    itemSpacing: "normal",
  },
};

const testimonials: SectionTypeDefinition = {
  type: "testimonials",
  label: "Testimonials & Social Proof",
  description: "Customer quotes, ratings, and success stories.",
  contentSchema: [
    ...eyebrowHeadingDescription,
    repeater("quotes", "Testimonials", "Testimonial", [
      textarea("quote", "Quote"),
      text("author", "Author"),
      text("role", "Role or location"),
    ], 8),
    text("rating", "Rating value"),
    text("ratingLabel", "Rating label"),
    repeater("caseStudies", "Case studies", "Case study", [
      text("title", "Title"),
      textarea("description", "Summary"),
      text("result", "Key result"),
    ], 6),
    ...primaryButton,
  ],
  defaultContent: {
    eyebrow: "Testimonials",
    heading: "What our customers say",
    description: "",
    quotes: [
      { quote: "Outstanding quality and service from start to finish.", author: "Jordan P.", role: "Verified customer" },
      { quote: "Exactly what we were looking for. Highly recommended.", author: "Sarah K.", role: "Verified customer" },
      { quote: "The team went above and beyond for us.", author: "Liam D.", role: "Verified customer" },
    ],
    rating: "4.9",
    ratingLabel: "from 2,300+ reviews",
    caseStudies: [
      { title: "Case study one", description: "A one-line summary of the outcome.", result: "+120% enquiries" },
      { title: "Case study two", description: "A one-line summary of the outcome.", result: "2x conversion" },
      { title: "Case study three", description: "A one-line summary of the outcome.", result: "-40% bounce rate" },
    ],
    buttonLabel: "",
    buttonUrl: "",
  },
};

const services: SectionTypeDefinition = {
  type: "services",
  label: "Services",
  description: "Present what you offer: cards, lists, processes, pricing.",
  contentSchema: [
    ...eyebrowHeadingDescription,
    repeater("items", "Services", "Service", [
      text("title", "Title"),
      textarea("description", "Description"),
      text("linkLabel", "Link label"),
      text("price", "Price (optional)"),
    ], 14),
    ...primaryButton,
  ],
  defaultContent: {
    eyebrow: "What we do",
    heading: "Services built around you",
    description: "",
    items: [
      { title: "Service one", description: "A short description of this service and its outcome.", linkLabel: "Learn more", price: "" },
      { title: "Service two", description: "A short description of this service and its outcome.", linkLabel: "Learn more", price: "" },
      { title: "Service three", description: "A short description of this service and its outcome.", linkLabel: "Learn more", price: "" },
    ],
    buttonLabel: "",
    buttonUrl: "",
  },
};

const cta: SectionTypeDefinition = {
  type: "cta",
  label: "Calls to Action",
  description: "Conversion moments: CTA bands, newsletter signups, contact forms.",
  contentSchema: [
    ...eyebrowHeadingDescription,
    ...primaryButton,
    ...secondaryButton,
    text("placeholder", "Input placeholder"),
    text("formTitle", "Form title"),
    repeater("fields", "Form fields", "Field", [text("label", "Field label")], 8),
    repeater("details", "Contact details", "Detail", [text("label", "Label"), text("value", "Value")], 5),
    image("image", "Supporting image"),
    text("note", "Small print"),
  ],
  defaultContent: {
    eyebrow: "Ready to start?",
    heading: "Book a free consultation",
    description: "Tell us about your goals and we'll map out the right approach together.",
    buttonLabel: "Book a call",
    buttonUrl: "/contact",
    secondaryButtonLabel: "",
    secondaryButtonUrl: "",
    placeholder: "Enter your email",
    formTitle: "Get in touch",
    fields: [{ label: "Name" }, { label: "Email" }, { label: "Message" }],
    details: [
      { label: "Email", value: "hello@example.com" },
      { label: "Phone", value: "(555) 000-1234" },
      { label: "Address", value: "123 Example Street" },
    ],
    image: null,
    note: "No spam — unsubscribe any time.",
  },
};

const footer: SectionTypeDefinition = {
  type: "footer",
  label: "Footer",
  description: "The closing block: link columns, contact, legal, newsletter.",
  contentSchema: [
    text("logoText", "Logo text"),
    text("tagline", "Tagline"),
    repeater("columns", "Link columns", "Column", [
      text("title", "Column title"),
      text("links", "Links (comma separated)"),
    ], 5),
    text("legalText", "Legal text"),
    text("newsletterHeading", "Newsletter heading"),
    text("newsletterPlaceholder", "Newsletter placeholder"),
    text("contactEmail", "Contact email"),
    text("contactPhone", "Contact phone"),
    repeater("socials", "Social links", "Social link", [text("label", "Network")], 6),
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
    newsletterHeading: "Stay in the loop",
    newsletterPlaceholder: "Enter your email",
    contactEmail: "hello@example.com",
    contactPhone: "(555) 000-1234",
    socials: [{ label: "Instagram" }, { label: "LinkedIn" }, { label: "YouTube" }],
  },
};

const content: SectionTypeDefinition = {
  type: "content",
  label: "Introduction & Content",
  description: "Story-telling blocks: intros, image & text, values, stats, teams.",
  contentSchema: [
    ...eyebrowHeadingDescription,
    ...primaryButton,
    image("image", "Image"),
    text("attribution", "Attribution"),
    repeater("items", "Items", "Item", [
      text("title", "Title"),
      textarea("description", "Description"),
    ], 8),
    repeater("stats", "Statistics", "Statistic", [text("value", "Value"), text("label", "Label")], 6),
    repeater("posts", "Articles", "Article", [text("title", "Title"), text("category", "Category")], 6),
    repeater("people", "Team members", "Team member", [text("name", "Name"), text("role", "Role")], 12),
  ],
  defaultContent: {
    eyebrow: "About us",
    heading: "Crafted with care, made to last",
    description: "Share a short paragraph about your brand story, your craft, and the people behind it.",
    buttonLabel: "Read our story",
    buttonUrl: "/about",
    image: null,
    attribution: "The Founding Team",
    items: [
      { title: "Quality first", description: "We never cut corners on materials or process." },
      { title: "Honest pricing", description: "Fair, transparent pricing with no surprises." },
      { title: "Built to last", description: "Designed for years of everyday use." },
    ],
    stats: [
      { value: "10k+", label: "Happy customers" },
      { value: "4.9★", label: "Average rating" },
      { value: "30-day", label: "Return policy" },
      { value: "24/7", label: "Support" },
    ],
    posts: [
      { title: "Article title one", category: "Guides" },
      { title: "Article title two", category: "News" },
      { title: "Article title three", category: "Inspiration" },
    ],
    people: [
      { name: "Team member", role: "Role title" },
      { name: "Team member", role: "Role title" },
      { name: "Team member", role: "Role title" },
      { name: "Team member", role: "Role title" },
    ],
  },
};

const ecommerce: SectionTypeDefinition = {
  type: "ecommerce",
  label: "Ecommerce",
  description: "Product grids, collections, and store benefit strips.",
  contentSchema: [
    text("eyebrow", "Eyebrow"),
    text("heading", "Heading"),
    text("price", "Price"),
    textarea("description", "Description"),
    text("rating", "Aggregate rating"),
    text("ratingLabel", "Rating label"),
    ...primaryButton,
    repeater("items", "Items", "Item", [
      text("title", "Title"),
      text("price", "Price"),
      text("description", "Description"),
      text("rating", "Rating (0–5)"),
    ], 12),
  ],
  defaultContent: {
    eyebrow: "Featured",
    heading: "Customer favourites",
    price: "",
    description: "",
    rating: "",
    ratingLabel: "",
    buttonLabel: "View all products",
    buttonUrl: "/collections/all",
    items: [
      { title: "Product one", price: "$89", description: "", rating: "" },
      { title: "Product two", price: "$129", description: "", rating: "" },
      { title: "Product three", price: "$59", description: "", rating: "" },
      { title: "Product four", price: "$210", description: "", rating: "" },
    ],
  },
};

export const SECTION_TYPE_DEFINITIONS: Record<SectionType, SectionTypeDefinition> = {
  navigation,
  hero,
  faq,
  marquee,
  testimonials,
  services,
  cta,
  footer,
  content,
  ecommerce,
};

export function getSectionTypeDefinition(type: SectionType): SectionTypeDefinition {
  return SECTION_TYPE_DEFINITIONS[type];
}

/** The schema fields a specific variation actually shows, in schema order. */
export function effectiveContentSchema(
  definition: SectionTypeDefinition,
  contentKeys?: string[],
): SectionFieldDefinition[] {
  if (!contentKeys) return definition.contentSchema;
  const keys = new Set(contentKeys);
  return definition.contentSchema.filter((field) => keys.has(field.key));
}
