import type {
  PageStatus,
  PageType,
  ProjectStatus,
  SectionCategory,
  UserRole,
} from "@/types";

interface StatusMeta {
  label: string;
  /** Tailwind classes for the badge. */
  badgeClass: string;
  description: string;
}

export const PROJECT_STATUS_META: Record<ProjectStatus, StatusMeta> = {
  draft: {
    label: "Draft",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    description: "Setup has started but the blueprint is not underway yet.",
  },
  "customer-editing": {
    label: "Customer Editing",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    description: "You are actively building this blueprint.",
  },
  "ready-for-review": {
    label: "Ready for Agency Review",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    description: "Submitted and waiting for the agency to start reviewing.",
  },
  "agency-reviewing": {
    label: "Agency Reviewing",
    badgeClass: "bg-violet-50 text-violet-700 border-violet-200",
    description: "The agency team is reviewing your blueprint.",
  },
  "revisions-requested": {
    label: "Revisions Requested",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    description: "The agency has asked for changes before approval.",
  },
  "awaiting-approval": {
    label: "Awaiting Customer Approval",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
    description: "The blueprint is ready for your final approval.",
  },
  approved: {
    label: "Approved",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "The blueprint has been approved.",
  },
  "in-development": {
    label: "In Development",
    badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
    description: "The agency is building the real website.",
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-green-50 text-green-700 border-green-200",
    description: "The project is finished.",
  },
  archived: {
    label: "Archived",
    badgeClass: "bg-slate-100 text-slate-500 border-slate-200",
    description: "This project has been archived.",
  },
};

export const PAGE_STATUS_META: Record<PageStatus, StatusMeta> = {
  draft: {
    label: "Draft",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
    description: "Not started yet.",
  },
  "in-progress": {
    label: "In Progress",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    description: "Being built.",
  },
  "ready-for-review": {
    label: "Ready for Review",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    description: "Submitted for agency review.",
  },
  "in-review": {
    label: "In Review",
    badgeClass: "bg-violet-50 text-violet-700 border-violet-200",
    description: "Being reviewed by the agency.",
  },
  "revisions-requested": {
    label: "Revisions Requested",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    description: "Changes requested.",
  },
  approved: {
    label: "Approved",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "Approved by the customer.",
  },
};

export const PAGE_TYPE_LABELS: Record<PageType, string> = {
  homepage: "Homepage",
  about: "About",
  services: "Services",
  service: "Individual Service",
  product: "Product",
  collection: "Collection",
  contact: "Contact",
  faq: "FAQ",
  portfolio: "Portfolio",
  "case-study": "Case Study",
  blog: "Blog",
  "blog-article": "Blog Article",
  landing: "Landing Page",
  pricing: "Pricing",
  team: "Team",
  testimonials: "Testimonials",
  booking: "Booking",
  custom: "Custom Page",
};

export const SECTION_CATEGORY_LABELS: Record<SectionCategory, string> = {
  navigation: "Navigation",
  hero: "Hero",
  content: "Introduction & Content",
  services: "Services",
  ecommerce: "Ecommerce",
  "social-proof": "Social Proof",
  conversion: "Conversion & Information",
  footer: "Footer",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: "Customer",
  agency: "Agency Team",
  admin: "Administrator",
};
