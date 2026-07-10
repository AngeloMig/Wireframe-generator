import { createSectionByTemplateId } from "@/lib/sections";
import type {
  ActivityEntry,
  ActivityType,
  AppNotification,
  PageSection,
  Project,
  ProjectPage,
  ProjectQuestionnaire,
  UserRole,
} from "@/types";
import { createId } from "@/utils/id";

/**
 * Demo projects seeded into local storage on first run (and via Reset Demo
 * Data). Built as a factory so each seed gets fresh UUIDs.
 */

const daysAgo = (n: number, hours = 0) =>
  new Date(Date.now() - n * 86_400_000 - hours * 3_600_000).toISOString();

function buildSections(
  entries: { templateId: string; content?: Record<string, unknown> }[],
): PageSection[] {
  const sections: PageSection[] = [];
  entries.forEach((entry, index) => {
    const section = createSectionByTemplateId(entry.templateId, {
      contentOverrides: entry.content,
      order: index,
    });
    if (section) sections.push(section);
  });
  return sections;
}

function buildPage(
  projectId: string,
  input: Partial<ProjectPage> & Pick<ProjectPage, "name" | "type">,
  createdAt: string,
): ProjectPage {
  return {
    id: createId(),
    projectId,
    navLabel: input.name,
    status: "draft",
    isHomepage: false,
    inMainNav: true,
    footerOnly: false,
    parentId: null,
    order: 0,
    sections: [],
    createdAt,
    updatedAt: createdAt,
    ...input,
  };
}

function activity(
  projectId: string,
  type: ActivityType,
  message: string,
  actor: { id: string; name: string; role: UserRole },
  createdAt: string,
): ActivityEntry {
  return {
    id: createId(),
    projectId,
    type,
    message,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    createdAt,
  };
}

const CUSTOMER = { id: "user-customer-1", name: "Angelo Bermejo", role: "customer" as const };
const AGENCY = { id: "user-agency-1", name: "Maya Lindqvist", role: "agency" as const };

const emptyQuestionnaire: ProjectQuestionnaire = {
  companyName: "",
  existingUrl: "",
  industry: "",
  businessDescription: "",
  mainGoal: "",
  targetAudience: "",
  estimatedPages: "4-6 pages",
  platform: "not-sure",
  goals: [],
  visualStyles: [],
  brand: null,
  inspirations: [],
};

// ---------------------------------------------------------------------------
// 1. Nordhaus — modern furniture ecommerce (partially built homepage)
// ---------------------------------------------------------------------------

function buildFurnitureProject(): Project {
  const id = createId();
  const created = daysAgo(9);

  const homepage = buildPage(
    id,
    {
      name: "Homepage",
      type: "homepage",
      status: "in-progress",
      isHomepage: true,
      order: 0,
      sections: buildSections([
        { templateId: "announcement-bar", content: { message: "Summer sale — up to 30% off selected pieces", linkLabel: "Shop the sale", linkUrl: "/collections/sale" } },
        { templateId: "header-ecommerce", content: { logoText: "Nordhaus", links: [{ label: "New In" }, { label: "Living" }, { label: "Bedroom" }, { label: "Dining" }, { label: "Sale" }] } },
        { templateId: "hero-split", content: { eyebrow: "New collection", heading: "Furniture for slow living", description: "Scandinavian-inspired pieces made from sustainably sourced oak and walnut.", buttonLabel: "Shop new arrivals", secondaryButtonLabel: "Our story" } },
        { templateId: "collection-cards", content: { eyebrow: "Collections", heading: "Shop by room", items: [{ title: "Living room" }, { title: "Bedroom" }, { title: "Dining" }] } },
        { templateId: "brand-intro", content: { eyebrow: "The Nordhaus way", heading: "Designed in Copenhagen, built to last a lifetime", description: "Every Nordhaus piece is designed by our in-house studio and made in small batches by partner workshops across Europe." } },
        { templateId: "featured-products", content: { heading: "Customer favourites", items: [{ title: "Aria lounge chair", price: "$890" }, { title: "Fjord dining table", price: "$1,450" }, { title: "Nook side table", price: "$320" }, { title: "Haven sofa", price: "$2,100" }] } },
        { templateId: "product-benefits" },
        { templateId: "testimonial-cards", content: { heading: "Loved in thousands of homes" } },
        { templateId: "faq-accordion" },
        { templateId: "newsletter-signup", content: { heading: "Join the Nordhaus list", description: "New arrivals, care guides, and members-only offers." } },
        { templateId: "footer-standard", content: { logoText: "Nordhaus", tagline: "Furniture for slow living." } },
      ]),
      createdAt: created,
      updatedAt: daysAgo(0, 4),
    },
    created,
  );

  const about = buildPage(
    id,
    { name: "About", type: "about", status: "draft", order: 1 },
    daysAgo(7),
  );
  const contact = buildPage(
    id,
    { name: "Contact", type: "contact", status: "draft", order: 2 },
    daysAgo(7),
  );

  return {
    id,
    name: "Nordhaus Website Redesign",
    companyName: "Nordhaus Furniture",
    status: "customer-editing",
    websiteType: "Ecommerce & Retail",
    ownerId: CUSTOMER.id,
    questionnaire: {
      ...emptyQuestionnaire,
      companyName: "Nordhaus Furniture",
      existingUrl: "https://nordhaus.example.com",
      industry: "Ecommerce & Retail",
      businessDescription:
        "We design and sell Scandinavian-inspired furniture made from sustainable hardwoods, sold online and in our Copenhagen showroom.",
      mainGoal: "Increase online sales and showcase the new seasonal collections.",
      targetAudience: "Design-conscious homeowners aged 28–55.",
      estimatedPages: "7-10 pages",
      platform: "shopify",
      goals: ["sell-products", "collect-subscribers", "brand-awareness"],
      visualStyles: ["minimal", "premium", "organic"],
      brand: {
        primaryColor: "#1f3a34",
        secondaryColor: "#e8e2d9",
        accentColor: "#c47f45",
        headingStyle: "serif",
        buttonStyle: "rounded",
        borderRadius: "subtle",
        spacing: "airy",
      },
      inspirations: [
        {
          id: createId(),
          url: "https://hay.dk",
          likes: "Clean product photography and calm colour palette.",
          dislikes: "Navigation feels a little hidden.",
          sectionsToReference: "Collection grid, product pages",
        },
      ],
    },
    pages: [homepage, about, contact],
    comments: [],
    activity: [
      activity(id, "project-created", "Project created", CUSTOMER, created),
      activity(id, "page-added", "Homepage added from the Ecommerce Brand template", CUSTOMER, created),
      activity(id, "page-added", "About page added", CUSTOMER, daysAgo(7)),
      activity(id, "page-added", "Contact page added", CUSTOMER, daysAgo(7)),
      activity(id, "section-added", "Newsletter Signup section added to Homepage", CUSTOMER, daysAgo(1)),
    ],
    assets: [],
    createdAt: created,
    updatedAt: daysAgo(0, 4),
    lastEditedAt: daysAgo(0, 4),
  };
}

// ---------------------------------------------------------------------------
// 2. Pixelforge — digital agency (revisions requested)
// ---------------------------------------------------------------------------

function buildAgencyProject(): Project {
  const id = createId();
  const created = daysAgo(21);

  const homepage = buildPage(
    id,
    {
      name: "Homepage",
      type: "homepage",
      status: "revisions-requested",
      isHomepage: true,
      order: 0,
      sections: buildSections([
        { templateId: "header-standard", content: { logoText: "Pixelforge" } },
        { templateId: "hero-stats", content: { heading: "Digital products that move the numbers", description: "We design and build websites and apps for ambitious brands." } },
        { templateId: "logo-row" },
        { templateId: "services-cards", content: { heading: "How we help", items: [{ title: "Web design", description: "Conversion-focused marketing sites.", linkLabel: "Learn more" }, { title: "Product design", description: "UX and UI for digital products.", linkLabel: "Learn more" }, { title: "Development", description: "Fast, accessible builds.", linkLabel: "Learn more" }] } },
        { templateId: "case-study-cards" },
        { templateId: "consultation-cta", content: { heading: "Let's talk about your next project" } },
        { templateId: "footer-standard", content: { logoText: "Pixelforge" } },
      ]),
      createdAt: created,
      updatedAt: daysAgo(2),
    },
    created,
  );

  const services = buildPage(
    id,
    { name: "Services", type: "services", status: "in-progress", order: 1 },
    daysAgo(18),
  );
  const work = buildPage(
    id,
    { name: "Work", type: "portfolio", status: "draft", order: 2 },
    daysAgo(18),
  );

  const heroSectionId = homepage.sections[1]?.id ?? null;

  return {
    id,
    name: "Pixelforge Site Refresh",
    companyName: "Pixelforge Digital",
    status: "revisions-requested",
    websiteType: "Creative & Design",
    ownerId: CUSTOMER.id,
    questionnaire: {
      ...emptyQuestionnaire,
      companyName: "Pixelforge Digital",
      industry: "Creative & Design",
      businessDescription: "A digital agency crafting websites and products for growth-stage companies.",
      mainGoal: "Generate qualified leads from mid-size companies.",
      targetAudience: "Marketing directors and founders.",
      estimatedPages: "7-10 pages",
      platform: "webflow",
      goals: ["generate-leads", "display-portfolio", "showcase-services"],
      visualStyles: ["bold", "modern", "editorial"],
      brand: null,
      inspirations: [],
    },
    pages: [homepage, services, work],
    comments: [
      {
        id: createId(),
        projectId: id,
        target: "section",
        pageId: homepage.id,
        sectionId: heroSectionId,
        authorId: AGENCY.id,
        authorName: AGENCY.name,
        authorRole: "agency",
        message:
          "The hero statistics feel generic — could you replace them with real agency metrics (projects shipped, average uplift, years active)?",
        status: "open",
        replies: [],
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2),
      },
      {
        id: createId(),
        projectId: id,
        target: "page",
        pageId: homepage.id,
        sectionId: null,
        authorId: AGENCY.id,
        authorName: AGENCY.name,
        authorRole: "agency",
        message: "Overall structure looks strong. Consider adding a testimonial before the final CTA.",
        status: "open",
        replies: [],
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2),
      },
    ],
    activity: [
      activity(id, "project-created", "Project created", CUSTOMER, created),
      activity(id, "project-submitted", "Project submitted for agency review", CUSTOMER, daysAgo(4)),
      activity(id, "comment-created", "Maya left feedback on the Homepage hero", AGENCY, daysAgo(2)),
      activity(id, "revisions-requested", "Revisions requested on Homepage", AGENCY, daysAgo(2)),
    ],
    assets: [],
    createdAt: created,
    updatedAt: daysAgo(2),
    lastEditedAt: daysAgo(2),
  };
}

// ---------------------------------------------------------------------------
// 3. Willow — health & wellness service (ready for review)
// ---------------------------------------------------------------------------

function buildWellnessProject(): Project {
  const id = createId();
  const created = daysAgo(14);

  const homepage = buildPage(
    id,
    {
      name: "Homepage",
      type: "homepage",
      status: "ready-for-review",
      isHomepage: true,
      order: 0,
      sections: buildSections([
        { templateId: "header-standard", content: { logoText: "Willow Wellness" } },
        { templateId: "hero-split", content: { eyebrow: "Holistic care", heading: "Feel like yourself again", description: "Physiotherapy, massage, and nutrition support under one calm roof." } },
        { templateId: "services-cards", content: { heading: "Our treatments", items: [{ title: "Physiotherapy", description: "Assessment and hands-on treatment.", linkLabel: "Learn more" }, { title: "Remedial massage", description: "Targeted relief for tension and pain.", linkLabel: "Learn more" }, { title: "Nutrition coaching", description: "Sustainable, personalised plans.", linkLabel: "Learn more" }] } },
        { templateId: "review-summary", content: { heading: "Rated excellent by our clients" } },
        { templateId: "faq-accordion" },
        { templateId: "contact-form", content: { heading: "Book your first visit" } },
        { templateId: "footer-standard", content: { logoText: "Willow Wellness" } },
      ]),
      createdAt: created,
      updatedAt: daysAgo(1),
    },
    created,
  );

  const booking = buildPage(
    id,
    { name: "Book Online", type: "booking", status: "draft", order: 1 },
    daysAgo(10),
  );

  return {
    id,
    name: "Willow Wellness Website",
    companyName: "Willow Wellness Studio",
    status: "ready-for-review",
    websiteType: "Health & Wellness",
    ownerId: CUSTOMER.id,
    questionnaire: {
      ...emptyQuestionnaire,
      companyName: "Willow Wellness Studio",
      industry: "Health & Wellness",
      businessDescription: "A wellness clinic offering physiotherapy, massage, and nutrition coaching.",
      mainGoal: "Get more online bookings for first appointments.",
      targetAudience: "Local adults 25–65 seeking ongoing care.",
      estimatedPages: "4-6 pages",
      platform: "wordpress",
      goals: ["book-appointments", "generate-leads"],
      visualStyles: ["organic", "minimal", "elegant"],
      brand: {
        primaryColor: "#3e5c50",
        secondaryColor: "#f4efe8",
        accentColor: "#d99a6c",
        headingStyle: "sans-serif",
        buttonStyle: "pill",
        borderRadius: "rounded",
        spacing: "airy",
      },
      inspirations: [],
    },
    pages: [homepage, booking],
    comments: [],
    activity: [
      activity(id, "project-created", "Project created", CUSTOMER, created),
      activity(id, "page-added", "Book Online page added", CUSTOMER, daysAgo(10)),
      activity(id, "project-submitted", "Project submitted for agency review", CUSTOMER, daysAgo(1)),
    ],
    assets: [],
    createdAt: created,
    updatedAt: daysAgo(1),
    lastEditedAt: daysAgo(1),
  };
}

export function buildDemoProjects(): Project[] {
  return [buildFurnitureProject(), buildAgencyProject(), buildWellnessProject()];
}

export function buildDemoNotifications(projects: Project[]): AppNotification[] {
  const pixelforge = projects.find((p) => p.companyName.includes("Pixelforge"));
  const willow = projects.find((p) => p.companyName.includes("Willow"));
  return [
    {
      id: createId(),
      title: "Revisions requested",
      message: "Maya requested revisions on the Pixelforge homepage.",
      isRead: false,
      projectId: pixelforge?.id ?? null,
      href: pixelforge ? `/projects/${pixelforge.id}/overview` : null,
      createdAt: daysAgo(2),
    },
    {
      id: createId(),
      title: "New comment",
      message: "The agency left a comment on your Pixelforge hero section.",
      isRead: false,
      projectId: pixelforge?.id ?? null,
      href: pixelforge ? `/projects/${pixelforge.id}/review` : null,
      createdAt: daysAgo(2),
    },
    {
      id: createId(),
      title: "Project submitted",
      message: "Willow Wellness Website was submitted for agency review.",
      isRead: true,
      projectId: willow?.id ?? null,
      href: willow ? `/projects/${willow.id}/overview` : null,
      createdAt: daysAgo(1),
    },
  ];
}
