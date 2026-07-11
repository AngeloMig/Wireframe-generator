import type {
  CommentPriority,
  CommentStatus,
  PageStatus,
  PageType,
  ProjectAccessLevel,
  ProjectStatus,
  SectionReviewStatus,
  SectionType,
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
    badgeClass: "bg-slate-100 text-slate-700",
    description: "Setup has started but the blueprint is not underway yet.",
  },
  "customer-editing": {
    label: "Customer Editing",
    badgeClass: "bg-blue-100 text-blue-800",
    description: "You are actively building this blueprint.",
  },
  "ready-for-review": {
    label: "Ready for Agency Review",
    badgeClass: "bg-amber-100 text-amber-700",
    description: "Submitted and waiting for the agency to start reviewing.",
  },
  "agency-reviewing": {
    label: "Agency Reviewing",
    badgeClass: "bg-violet-50 text-violet-700",
    description: "The agency team is reviewing your blueprint.",
  },
  "revisions-requested": {
    label: "Revisions Requested",
    badgeClass: "bg-rose-100 text-rose-800",
    description: "The agency has asked for changes before approval.",
  },
  "customer-revising": {
    label: "Customer Revising",
    badgeClass: "bg-blue-100 text-blue-800",
    description: "You are working through the requested revisions.",
  },
  "awaiting-approval": {
    label: "Ready for Customer Approval",
    badgeClass: "bg-orange-50 text-orange-700",
    description: "The blueprint is ready for your final approval.",
  },
  "partially-approved": {
    label: "Partially Approved",
    badgeClass: "bg-lime-50 text-lime-700",
    description: "Some pages are approved; others still need attention.",
  },
  approved: {
    label: "Approved",
    badgeClass: "bg-emerald-100 text-emerald-800",
    description: "The blueprint has been approved.",
  },
  "in-development": {
    label: "In Development",
    badgeClass: "bg-cyan-50 text-cyan-700",
    description: "The agency is building the real website.",
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-emerald-100 text-emerald-800",
    description: "The project is finished.",
  },
  archived: {
    label: "Archived",
    badgeClass: "bg-slate-100 text-slate-500",
    description: "This project has been archived.",
  },
};

export const PAGE_STATUS_META: Record<PageStatus, StatusMeta> = {
  draft: {
    label: "Draft",
    badgeClass: "bg-slate-100 text-slate-600",
    description: "Not started yet.",
  },
  "content-needed": {
    label: "Content Needed",
    badgeClass: "bg-blue-100 text-blue-800",
    description: "Being built — content still missing.",
  },
  "ready-for-review": {
    label: "Ready for Agency Review",
    badgeClass: "bg-amber-100 text-amber-700",
    description: "Submitted for agency review.",
  },
  "in-review": {
    label: "Agency Reviewing",
    badgeClass: "bg-violet-50 text-violet-700",
    description: "Being reviewed by the agency.",
  },
  "revisions-requested": {
    label: "Revisions Requested",
    badgeClass: "bg-rose-100 text-rose-800",
    description: "Changes requested.",
  },
  "customer-revising": {
    label: "Customer Revising",
    badgeClass: "bg-blue-100 text-blue-800",
    description: "The customer is making the requested changes.",
  },
  "ready-for-approval": {
    label: "Ready for Approval",
    badgeClass: "bg-orange-50 text-orange-700",
    description: "Waiting for customer approval.",
  },
  approved: {
    label: "Approved",
    badgeClass: "bg-emerald-100 text-emerald-800",
    description: "Approved by the customer.",
  },
  locked: {
    label: "Locked",
    badgeClass: "bg-emerald-100 text-emerald-900",
    description: "Approved and locked against changes.",
  },
};

export const SECTION_REVIEW_STATUS_META: Record<SectionReviewStatus, StatusMeta> = {
  draft: {
    label: "Draft",
    badgeClass: "bg-slate-100 text-slate-600",
    description: "Not reviewed yet.",
  },
  "content-needed": {
    label: "Content Needed",
    badgeClass: "bg-blue-100 text-blue-800",
    description: "Waiting on content.",
  },
  "image-needed": {
    label: "Image Needed",
    badgeClass: "bg-sky-50 text-sky-700",
    description: "Waiting on imagery.",
  },
  "agency-review-needed": {
    label: "Agency Review Needed",
    badgeClass: "bg-amber-100 text-amber-700",
    description: "Needs a design review.",
  },
  "revisions-requested": {
    label: "Revisions Requested",
    badgeClass: "bg-rose-100 text-rose-800",
    description: "Changes requested on this section.",
  },
  "ready-for-approval": {
    label: "Ready for Approval",
    badgeClass: "bg-orange-50 text-orange-700",
    description: "Waiting for customer approval.",
  },
  approved: {
    label: "Approved",
    badgeClass: "bg-emerald-100 text-emerald-800",
    description: "Approved by the customer.",
  },
  "technically-reviewed": {
    label: "Technically Reviewed",
    badgeClass: "bg-cyan-50 text-cyan-700",
    description: "Checked by a developer for feasibility.",
  },
};

export const COMMENT_STATUS_META: Record<CommentStatus, StatusMeta> = {
  open: {
    label: "Open",
    badgeClass: "bg-amber-100 text-amber-700",
    description: "Waiting for a response.",
  },
  "in-progress": {
    label: "In Progress",
    badgeClass: "bg-blue-100 text-blue-800",
    description: "Being worked on.",
  },
  resolved: {
    label: "Resolved",
    badgeClass: "bg-emerald-100 text-emerald-800",
    description: "This conversation is settled.",
  },
  reopened: {
    label: "Reopened",
    badgeClass: "bg-rose-100 text-rose-800",
    description: "Brought back for more discussion.",
  },
};

export const COMMENT_PRIORITY_META: Record<CommentPriority, StatusMeta> = {
  low: {
    label: "Low",
    badgeClass: "bg-slate-100 text-slate-600",
    description: "Nice to have.",
  },
  normal: {
    label: "Normal",
    badgeClass: "bg-blue-100 text-blue-800",
    description: "Standard priority.",
  },
  high: {
    label: "High",
    badgeClass: "bg-amber-100 text-amber-700",
    description: "Needs attention soon.",
  },
  urgent: {
    label: "Urgent",
    badgeClass: "bg-rose-100 text-rose-800",
    description: "Blocking — handle first.",
  },
};

export const ACCESS_LEVEL_LABELS: Record<ProjectAccessLevel, string> = {
  view: "View",
  comment: "Comment",
  edit: "Edit",
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

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  navigation: "Navigation",
  hero: "Hero",
  faq: "FAQ",
  marquee: "Marquee & Ticker",
  testimonials: "Testimonials",
  services: "Services",
  cta: "Calls to Action",
  footer: "Footer",
  content: "Introduction & Content",
  ecommerce: "Ecommerce",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: "Customer",
  "agency-designer": "Agency Designer",
  "agency-developer": "Agency Developer",
  "agency-pm": "Agency Project Manager",
  admin: "Administrator",
};
