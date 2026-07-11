import { createSectionByVariationId } from "@/lib/sections";
import type {
  ActivityEntry,
  ActivityType,
  AppNotification,
  PageSection,
  Project,
  ProjectComment,
  ProjectMember,
  ProjectPage,
  ProjectQuestionnaire,
  ProjectVersion,
  SectionReviewStatus,
  SectionVariationSuggestion,
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
  entries: {
    variationId: string;
    content?: Record<string, unknown>;
    reviewStatus?: SectionReviewStatus;
  }[],
): PageSection[] {
  const sections: PageSection[] = [];
  entries.forEach((entry, index) => {
    const section = createSectionByVariationId(entry.variationId, {
      contentOverrides: entry.content,
      order: index,
    });
    if (section) {
      if (entry.reviewStatus) section.reviewStatus = entry.reviewStatus;
      sections.push(section);
    }
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
  refs?: { pageId?: string; sectionId?: string },
): ActivityEntry {
  return {
    id: createId(),
    projectId,
    type,
    message,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    pageId: refs?.pageId,
    sectionId: refs?.sectionId,
    createdAt,
  };
}

const CUSTOMER = { id: "user-customer-1", name: "Angelo Bermejo", role: "customer" as const };
const DESIGNER = { id: "user-agency-1", name: "Maya Lindqvist", role: "agency-designer" as const };
const DEVELOPER = { id: "user-agency-2", name: "Devon Carter", role: "agency-developer" as const };
const PM = { id: "user-agency-3", name: "Priya Raman", role: "agency-pm" as const };

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
      status: "content-needed",
      isHomepage: true,
      order: 0,
      sections: buildSections([
        { variationId: "nav-announcement-bar", content: { announcementText: "Summer sale — up to 30% off selected pieces", ctaLabel: "Shop the sale", ctaUrl: "/collections/sale" } },
        { variationId: "nav-ecommerce", content: { logoText: "Nordhaus", links: [{ label: "New In" }, { label: "Living" }, { label: "Bedroom" }, { label: "Dining" }, { label: "Sale" }], announcementText: "" } },
        { variationId: "hero-split", reviewStatus: "image-needed", content: { eyebrow: "New collection", heading: "Furniture for slow living", description: "Scandinavian-inspired pieces made from sustainably sourced oak and walnut.", buttonLabel: "Shop new arrivals", secondaryButtonLabel: "Our story" } },
        { variationId: "ecom-collections", content: { eyebrow: "Collections", heading: "Shop by room", items: [{ title: "Living room" }, { title: "Bedroom" }, { title: "Dining" }] } },
        { variationId: "content-intro", content: { eyebrow: "The Nordhaus way", heading: "Designed in Copenhagen, built to last a lifetime", description: "Every Nordhaus piece is designed by our in-house studio and made in small batches by partner workshops across Europe." } },
        { variationId: "ecom-featured", content: { heading: "Customer favourites", items: [{ title: "Aria lounge chair", price: "$890" }, { title: "Fjord dining table", price: "$1,450" }, { title: "Nook side table", price: "$320" }, { title: "Haven sofa", price: "$2,100" }] } },
        { variationId: "ecom-benefits" },
        { variationId: "marquee-reviews" },
        { variationId: "testi-cards", reviewStatus: "ready-for-approval", content: { heading: "Loved in thousands of homes" } },
        { variationId: "faq-accordion", reviewStatus: "content-needed" },
        { variationId: "cta-newsletter", content: { heading: "Join the Nordhaus list", description: "New arrivals, care guides, and members-only offers." } },
        { variationId: "footer-columns", content: { logoText: "Nordhaus", tagline: "Furniture for slow living." } },
      ]),
      createdAt: created,
      updatedAt: daysAgo(0, 4),
    },
    created,
  );

  const about = buildPage(
    id,
    { name: "About", type: "about", status: "revisions-requested", order: 1 },
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
    activity: [
      activity(id, "section-added", "Newsletter Signup section added to Homepage", CUSTOMER, daysAgo(1)),
      activity(id, "page-added", "Contact page added", CUSTOMER, daysAgo(7)),
      activity(id, "page-added", "About page added", CUSTOMER, daysAgo(7)),
      activity(id, "page-added", "Homepage added from the Ecommerce Brand template", CUSTOMER, created),
      activity(id, "project-created", "Project created", CUSTOMER, created),
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
        { variationId: "nav-standard", content: { logoText: "Pixelforge" } },
        { variationId: "hero-stats", reviewStatus: "revisions-requested", content: { heading: "Digital products that move the numbers", description: "We design and build websites and apps for ambitious brands." } },
        { variationId: "marquee-logo-static" },
        { variationId: "svc-icon-cards", content: { heading: "How we help", items: [{ title: "Web design", description: "Conversion-focused marketing sites.", linkLabel: "Learn more" }, { title: "Product design", description: "UX and UI for digital products.", linkLabel: "Learn more" }, { title: "Development", description: "Fast, accessible builds.", linkLabel: "Learn more" }] } },
        { variationId: "testi-case-studies" },
        { variationId: "cta-centered", content: { heading: "Let's talk about your next project" } },
        { variationId: "footer-columns", content: { logoText: "Pixelforge" } },
      ]),
      createdAt: created,
      updatedAt: daysAgo(2),
    },
    created,
  );

  const services = buildPage(
    id,
    { name: "Services", type: "services", status: "content-needed", order: 1 },
    daysAgo(18),
  );
  const work = buildPage(
    id,
    { name: "Work", type: "portfolio", status: "draft", order: 2 },
    daysAgo(18),
  );

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
    activity: [
      activity(id, "revisions-requested", "Revisions requested on Homepage", DESIGNER, daysAgo(2), { pageId: homepage.id }),
      activity(id, "comment-created", "Maya left feedback on the Homepage hero", DESIGNER, daysAgo(2), { pageId: homepage.id }),
      activity(id, "project-submitted", "Project submitted for agency review", CUSTOMER, daysAgo(4)),
      activity(id, "project-created", "Project created", CUSTOMER, created),
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
        { variationId: "nav-standard", content: { logoText: "Willow Wellness" } },
        { variationId: "hero-split", content: { eyebrow: "Holistic care", heading: "Feel like yourself again", description: "Physiotherapy, massage, and nutrition support under one calm roof." } },
        { variationId: "svc-icon-cards", content: { heading: "Our treatments", items: [{ title: "Physiotherapy", description: "Assessment and hands-on treatment.", linkLabel: "Learn more" }, { title: "Remedial massage", description: "Targeted relief for tension and pain.", linkLabel: "Learn more" }, { title: "Nutrition coaching", description: "Sustainable, personalised plans.", linkLabel: "Learn more" }] } },
        { variationId: "testi-review-summary", content: { heading: "Rated excellent by our clients" } },
        { variationId: "faq-accordion" },
        { variationId: "cta-contact-form", content: { heading: "Book your first visit" } },
        { variationId: "footer-contact", content: { logoText: "Willow Wellness" } },
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
    activity: [
      activity(id, "project-submitted", "Project submitted for agency review", CUSTOMER, daysAgo(1)),
      activity(id, "page-added", "Book Online page added", CUSTOMER, daysAgo(10)),
      activity(id, "project-created", "Project created", CUSTOMER, created),
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

// ---------------------------------------------------------------------------
// Collaboration demo data
// ---------------------------------------------------------------------------

export interface DemoCollaborationData {
  members: ProjectMember[];
  comments: ProjectComment[];
  versions: ProjectVersion[];
  suggestions: SectionVariationSuggestion[];
}

function member(
  projectId: string,
  user: {
    id: string;
    name: string;
    role: UserRole;
  },
  details: {
    email: string;
    initials: string;
    avatarColor: string;
    organization: string;
    accessLevel: ProjectMember["accessLevel"];
    isPrimaryContact?: boolean;
  },
  addedAt: string,
): ProjectMember {
  return {
    id: createId(),
    projectId,
    userId: user.id,
    name: user.name,
    email: details.email,
    initials: details.initials,
    avatarColor: details.avatarColor,
    role: user.role,
    organization: details.organization,
    accessLevel: details.accessLevel,
    status: "active",
    isPrimaryContact: details.isPrimaryContact ?? false,
    addedAt,
  };
}

function findSection(page: ProjectPage | undefined, variationId: string) {
  return page?.sections.find((s) => s.variationId === variationId);
}

const AGENCY_ORG = "Northshore Web Studio";

export function buildDemoCollaboration(projects: Project[]): DemoCollaborationData {
  const members: ProjectMember[] = [];
  const comments: ProjectComment[] = [];
  const versions: ProjectVersion[] = [];
  const suggestions: SectionVariationSuggestion[] = [];

  // Every project gets the standard cast of members.
  for (const project of projects) {
    const added = project.createdAt;
    members.push(
      member(project.id, CUSTOMER, {
        email: "angelobmig@gmail.com",
        initials: "AB",
        avatarColor: "bg-indigo-500",
        organization: project.companyName,
        accessLevel: "edit",
      }, added),
      member(project.id, DESIGNER, {
        email: "maya@northshore.studio",
        initials: "ML",
        avatarColor: "bg-emerald-500",
        organization: AGENCY_ORG,
        accessLevel: "edit",
        isPrimaryContact: true,
      }, added),
      member(project.id, DEVELOPER, {
        email: "devon@northshore.studio",
        initials: "DC",
        avatarColor: "bg-sky-500",
        organization: AGENCY_ORG,
        accessLevel: "comment",
      }, added),
      member(project.id, PM, {
        email: "priya@northshore.studio",
        initials: "PR",
        avatarColor: "bg-amber-500",
        organization: AGENCY_ORG,
        accessLevel: "edit",
      }, added),
    );
  }

  // --- Nordhaus (furniture) — the rich collaboration example -----------------
  const nordhaus = projects.find((p) => p.companyName === "Nordhaus Furniture");
  if (nordhaus) {
    const homepage = nordhaus.pages.find((p) => p.isHomepage);
    const about = nordhaus.pages.find((p) => p.type === "about");
    const hero = findSection(homepage, "hero-split");
    const faq = findSection(homepage, "faq-accordion");
    const featured = findSection(homepage, "ecom-featured");
    const testimonials = findSection(homepage, "testi-cards");
    const collections = findSection(homepage, "ecom-collections");

    // 1. Project-level customer question.
    comments.push({
      id: createId(),
      projectId: nordhaus.id,
      scope: "project",
      visibility: "customer",
      authorId: CUSTOMER.id,
      message:
        "Quick question on the homepage CTA — should the main button say “Shop new arrivals” or “Explore collections”? We want first-time visitors to browse, not bounce.",
      mentions: [DESIGNER.id],
      status: "open",
      priority: "normal",
      replies: [],
      attachments: [],
      isActionItem: false,
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    });

    // 2. Page comments (2).
    if (homepage) {
      comments.push({
        id: createId(),
        projectId: nordhaus.id,
        pageId: homepage.id,
        scope: "page",
        visibility: "customer",
        authorId: DESIGNER.id,
        message:
          "Recommendation: simplify the main navigation to five top-level links. “New In” and “Sale” can live inside the announcement bar so the header breathes more on mobile.",
        mentions: [],
        status: "open",
        priority: "normal",
        replies: [],
        attachments: [],
        isActionItem: false,
        createdAt: daysAgo(2, 6),
        updatedAt: daysAgo(2, 6),
      });
    }
    if (about) {
      comments.push({
        id: createId(),
        projectId: nordhaus.id,
        pageId: about.id,
        scope: "page",
        visibility: "customer",
        authorId: DESIGNER.id,
        message:
          "The About page still has no sections. Could you outline the story you want to tell (workshop, materials, team) so we can propose a structure?",
        mentions: [CUSTOMER.id],
        status: "open",
        priority: "high",
        replies: [],
        attachments: [],
        isActionItem: false,
        createdAt: daysAgo(2, 4),
        updatedAt: daysAgo(2, 4),
      });
    }

    // 3. Section comments (4) — incl. high-priority action item + resolved.
    if (homepage && hero) {
      comments.push({
        id: createId(),
        projectId: nordhaus.id,
        pageId: homepage.id,
        sectionId: hero.id,
        scope: "section",
        visibility: "customer",
        authorId: DESIGNER.id,
        assignedToId: CUSTOMER.id,
        message:
          "Please upload the final hero photography — the current placeholder is a low-res mockup. We need a landscape shot of the Aria lounge chair at 2400px wide or larger.",
        mentions: [CUSTOMER.id],
        status: "open",
        priority: "high",
        replies: [],
        attachments: [],
        isActionItem: true,
        dueDate: daysAgo(-3),
        createdAt: daysAgo(2, 3),
        updatedAt: daysAgo(2, 3),
      });
    }
    if (homepage && faq) {
      comments.push({
        id: createId(),
        projectId: nordhaus.id,
        pageId: homepage.id,
        sectionId: faq.id,
        scope: "section",
        visibility: "customer",
        authorId: CUSTOMER.id,
        message:
          "The “How long does EU shipping take?” question is missing its answer — we're confirming times with the new carrier this week.",
        mentions: [],
        status: "open",
        priority: "normal",
        replies: [],
        attachments: [],
        isActionItem: false,
        createdAt: daysAgo(1, 8),
        updatedAt: daysAgo(1, 8),
      });
    }
    if (homepage && featured) {
      comments.push({
        id: createId(),
        projectId: nordhaus.id,
        pageId: homepage.id,
        sectionId: featured.id,
        scope: "section",
        visibility: "customer",
        authorId: DESIGNER.id,
        message:
          "Mobile layout concern: four featured products stack into a very tall column on phones. A two-up grid keeps the section scannable — see the variation suggestion I've sent.",
        mentions: [],
        status: "open",
        priority: "normal",
        replies: [],
        attachments: [],
        isActionItem: false,
        createdAt: daysAgo(1, 5),
        updatedAt: daysAgo(1, 5),
      });
    }
    if (homepage && testimonials) {
      comments.push({
        id: createId(),
        projectId: nordhaus.id,
        pageId: homepage.id,
        sectionId: testimonials.id,
        scope: "section",
        visibility: "customer",
        authorId: CUSTOMER.id,
        message: "Can we lead with the review that mentions delivery experience?",
        mentions: [],
        status: "resolved",
        priority: "low",
        replies: [
          {
            id: createId(),
            commentId: "",
            authorId: DESIGNER.id,
            message: "Done — reordered so the delivery review shows first.",
            mentions: [],
            attachments: [],
            createdAt: daysAgo(1, 2),
            updatedAt: daysAgo(1, 2),
          },
        ],
        attachments: [],
        isActionItem: false,
        resolvedAt: daysAgo(1, 1),
        resolvedById: DESIGNER.id,
        createdAt: daysAgo(2, 1),
        updatedAt: daysAgo(1, 1),
      });
    }

    // 4. Agency-only internal note.
    if (homepage && collections) {
      comments.push({
        id: createId(),
        projectId: nordhaus.id,
        pageId: homepage.id,
        sectionId: collections.id,
        scope: "section",
        visibility: "agency",
        authorId: DEVELOPER.id,
        message:
          "Internal: collection tiles will map to Shopify collection handles. Confirm the client's collection structure before build — “Shop by room” implies room-based collections that don't exist in their current store.",
        mentions: [PM.id],
        status: "open",
        priority: "normal",
        replies: [],
        attachments: [],
        isActionItem: false,
        createdAt: daysAgo(1, 4),
        updatedAt: daysAgo(1, 4),
      });
    }

    // 5. Pending variation suggestion (product grid).
    if (homepage && featured) {
      suggestions.push({
        id: createId(),
        projectId: nordhaus.id,
        pageId: homepage.id,
        sectionId: featured.id,
        currentVariationId: "ecom-featured",
        suggestedVariationId: "ecom-grid",
        message:
          "A tighter product grid handles four or more products much better on mobile — worth a look before you add more favourites.",
        createdById: DESIGNER.id,
        status: "pending",
        createdAt: daysAgo(1, 5),
      });
    }

    // 6. Two project versions. v1 predates the FAQ/newsletter sections so
    // version comparison has real differences to show.
    const snapshot = (): ProjectVersion["snapshot"] => ({
      name: nordhaus.name,
      companyName: nordhaus.companyName,
      websiteType: nordhaus.websiteType,
      status: nordhaus.status,
      questionnaire: structuredClone(nordhaus.questionnaire),
      pages: structuredClone(nordhaus.pages),
    });
    const v1Snapshot = snapshot();
    v1Snapshot.pages = v1Snapshot.pages.map((p) =>
      p.isHomepage ? { ...p, sections: p.sections.slice(0, 8) } : p,
    );
    versions.push(
      {
        id: createId(),
        projectId: nordhaus.id,
        versionNumber: 1,
        label: "Initial homepage draft",
        description: "First pass at the homepage structure from the ecommerce template.",
        createdById: CUSTOMER.id,
        createdAt: daysAgo(6),
        trigger: "manual",
        snapshot: v1Snapshot,
      },
      {
        id: createId(),
        projectId: nordhaus.id,
        versionNumber: 2,
        label: "Homepage content pass",
        description: "Product favourites, FAQ, and newsletter signup added.",
        createdById: CUSTOMER.id,
        createdAt: daysAgo(2),
        trigger: "manual",
        snapshot: snapshot(),
      },
    );
  }

  // --- Pixelforge — migrate its two review comments to the new model ---------
  const pixelforge = projects.find((p) => p.companyName === "Pixelforge Digital");
  if (pixelforge) {
    const homepage = pixelforge.pages.find((p) => p.isHomepage);
    const heroStats = findSection(homepage, "hero-stats");
    if (homepage && heroStats) {
      comments.push({
        id: createId(),
        projectId: pixelforge.id,
        pageId: homepage.id,
        sectionId: heroStats.id,
        scope: "section",
        visibility: "customer",
        authorId: DESIGNER.id,
        message:
          "The hero statistics feel generic — could you replace them with real agency metrics (projects shipped, average uplift, years active)?",
        mentions: [],
        status: "open",
        priority: "high",
        replies: [],
        attachments: [],
        isActionItem: false,
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2),
      });
    }
    if (homepage) {
      comments.push({
        id: createId(),
        projectId: pixelforge.id,
        pageId: homepage.id,
        scope: "page",
        visibility: "customer",
        authorId: DESIGNER.id,
        message:
          "Overall structure looks strong. Consider adding a testimonial before the final CTA.",
        mentions: [],
        status: "open",
        priority: "normal",
        replies: [],
        attachments: [],
        isActionItem: false,
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2),
      });
    }
  }

  return { members, comments, versions, suggestions };
}

export function buildDemoNotifications(projects: Project[]): AppNotification[] {
  const nordhaus = projects.find((p) => p.companyName === "Nordhaus Furniture");
  const pixelforge = projects.find((p) => p.companyName.includes("Pixelforge"));
  const willow = projects.find((p) => p.companyName.includes("Willow"));
  const notifications: AppNotification[] = [];

  if (nordhaus) {
    notifications.push(
      {
        id: createId(),
        userId: CUSTOMER.id,
        projectId: nordhaus.id,
        type: "comment-assigned",
        title: "Action item assigned to you",
        message: "Maya asked you to upload the final hero photography for Nordhaus.",
        isRead: false,
        createdAt: daysAgo(2, 3),
        actionUrl: `/projects/${nordhaus.id}/overview`,
      },
      {
        id: createId(),
        userId: CUSTOMER.id,
        projectId: nordhaus.id,
        type: "suggestion-received",
        title: "Design suggestion received",
        message: "Maya suggested a different product grid layout for your homepage.",
        isRead: false,
        createdAt: daysAgo(1, 5),
        actionUrl: `/projects/${nordhaus.id}/editor`,
      },
      {
        id: createId(),
        userId: DESIGNER.id,
        projectId: nordhaus.id,
        type: "mention",
        title: "You were mentioned",
        message: "Angelo asked about the homepage CTA wording on Nordhaus.",
        isRead: false,
        createdAt: daysAgo(3),
        actionUrl: `/projects/${nordhaus.id}/overview`,
      },
      {
        id: createId(),
        userId: PM.id,
        projectId: nordhaus.id,
        type: "mention",
        title: "You were mentioned",
        message: "Devon flagged a Shopify collection question on Nordhaus (internal).",
        isRead: false,
        createdAt: daysAgo(1, 4),
        actionUrl: `/projects/${nordhaus.id}/overview`,
      },
    );
  }
  if (pixelforge) {
    notifications.push({
      id: createId(),
      userId: CUSTOMER.id,
      projectId: pixelforge.id,
      type: "revisions-requested",
      title: "Revisions requested",
      message: "Maya requested revisions on the Pixelforge homepage.",
      isRead: false,
      createdAt: daysAgo(2),
      actionUrl: `/projects/${pixelforge.id}/overview`,
    });
  }
  if (willow) {
    notifications.push({
      id: createId(),
      userId: DESIGNER.id,
      projectId: willow.id,
      type: "review-submitted",
      title: "Ready for review",
      message: "Willow Wellness Website was submitted for agency review.",
      isRead: true,
      createdAt: daysAgo(1),
      actionUrl: `/projects/${willow.id}/overview`,
    });
  }
  return notifications;
}
