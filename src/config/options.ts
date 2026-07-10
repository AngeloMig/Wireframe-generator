import type {
  PlatformPreference,
  VisualStyle,
  WebsiteGoal,
} from "@/types";

export const INDUSTRY_OPTIONS = [
  "Ecommerce & Retail",
  "Professional Services",
  "Health & Wellness",
  "Technology & SaaS",
  "Creative & Design",
  "Hospitality & Food",
  "Real Estate",
  "Education",
  "Construction & Trades",
  "Finance & Legal",
  "Nonprofit",
  "Other",
] as const;

export const PLATFORM_OPTIONS: { value: PlatformPreference; label: string; hint: string }[] = [
  { value: "shopify", label: "Shopify", hint: "Best for online stores" },
  { value: "wordpress", label: "WordPress", hint: "Flexible content-driven sites" },
  { value: "webflow", label: "Webflow", hint: "Design-forward marketing sites" },
  { value: "statamic", label: "Statamic", hint: "Developer-friendly CMS" },
  { value: "custom", label: "Custom website", hint: "Fully bespoke build" },
  { value: "not-sure", label: "Not sure yet", hint: "We'll recommend one" },
];

export const GOAL_OPTIONS: { value: WebsiteGoal; label: string; description: string; icon: string }[] = [
  { value: "sell-products", label: "Sell products", description: "Run an online store with product pages and checkout.", icon: "shopping-bag" },
  { value: "generate-leads", label: "Generate leads", description: "Capture enquiries from potential customers.", icon: "magnet" },
  { value: "book-appointments", label: "Book appointments", description: "Let visitors schedule time with you.", icon: "calendar" },
  { value: "showcase-services", label: "Showcase services", description: "Explain what you do and why it matters.", icon: "briefcase" },
  { value: "brand-awareness", label: "Build brand awareness", description: "Tell your story and grow recognition.", icon: "megaphone" },
  { value: "display-portfolio", label: "Display a portfolio", description: "Show off your best work.", icon: "image" },
  { value: "educational-content", label: "Publish educational content", description: "Share articles, guides, and resources.", icon: "book-open" },
  { value: "promote-events", label: "Promote events", description: "Announce and drive signups for events.", icon: "ticket" },
  { value: "collect-subscribers", label: "Collect email subscribers", description: "Grow a newsletter or mailing list.", icon: "mail" },
  { value: "membership", label: "Create a membership experience", description: "Offer gated content or a community.", icon: "users" },
];

export const VISUAL_STYLE_OPTIONS: { value: VisualStyle; label: string; description: string }[] = [
  { value: "minimal", label: "Minimal", description: "Whitespace, restraint, focus" },
  { value: "modern", label: "Modern", description: "Clean, current, confident" },
  { value: "editorial", label: "Editorial", description: "Type-led, magazine feel" },
  { value: "premium", label: "Premium", description: "Refined and high-end" },
  { value: "playful", label: "Playful", description: "Friendly shapes and color" },
  { value: "corporate", label: "Corporate", description: "Structured and trustworthy" },
  { value: "bold", label: "Bold", description: "Big statements, strong contrast" },
  { value: "elegant", label: "Elegant", description: "Graceful, understated detail" },
  { value: "technical", label: "Technical", description: "Precise, data-friendly" },
  { value: "luxury", label: "Luxury", description: "Exclusive, rich materials" },
  { value: "organic", label: "Organic", description: "Natural tones and softness" },
  { value: "ecommerce", label: "Ecommerce-focused", description: "Built to convert shoppers" },
];

export const ESTIMATED_PAGES_OPTIONS = [
  "1-3 pages",
  "4-6 pages",
  "7-10 pages",
  "11-20 pages",
  "20+ pages",
] as const;

export const QUICK_NOTE_OPTIONS = [
  "Content still needed",
  "Image still needed",
  "Agency recommendation needed",
  "Keep this section simple",
  "Use our brand photography",
  "Not sure about this section",
] as const;
