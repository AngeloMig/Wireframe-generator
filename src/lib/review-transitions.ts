import type {
  PageStatus,
  ProjectStatus,
  SectionReviewStatus,
  UserRole,
} from "@/types";

/**
 * Centralised review-status transition rules. The UI never sets status
 * strings directly — it asks this module which transitions are available for
 * the current role and applies one. The same tables can later back
 * server-side checks in Supabase.
 */

export interface StatusTransition<S extends string> {
  from: S;
  to: S;
  allowedRoles: UserRole[];
  /** Verb shown on the button, e.g. "Submit for agency review". */
  label: string;
  requiresMessage?: boolean;
  createsVersion?: boolean;
  locksEditing?: boolean;
}

const CUSTOMER: UserRole[] = ["customer"];
const DESIGN_PM: UserRole[] = ["agency-designer", "agency-pm"];
const AGENCY_ALL: UserRole[] = ["agency-designer", "agency-developer", "agency-pm"];
const PM: UserRole[] = ["agency-pm"];

// ---------------------------------------------------------------------------
// Project transitions
// ---------------------------------------------------------------------------

export const PROJECT_TRANSITIONS: StatusTransition<ProjectStatus>[] = [
  { from: "draft", to: "customer-editing", allowedRoles: CUSTOMER, label: "Start building" },
  {
    from: "draft",
    to: "ready-for-review",
    allowedRoles: CUSTOMER,
    label: "Submit for agency review",
    createsVersion: true,
    locksEditing: true,
  },
  {
    from: "customer-editing",
    to: "ready-for-review",
    allowedRoles: CUSTOMER,
    label: "Submit for agency review",
    createsVersion: true,
    locksEditing: true,
  },
  {
    from: "ready-for-review",
    to: "agency-reviewing",
    allowedRoles: AGENCY_ALL,
    label: "Start review",
  },
  {
    from: "agency-reviewing",
    to: "revisions-requested",
    allowedRoles: DESIGN_PM,
    label: "Request revisions",
    requiresMessage: true,
    createsVersion: true,
  },
  {
    from: "revisions-requested",
    to: "customer-revising",
    allowedRoles: CUSTOMER,
    label: "Start revisions",
  },
  {
    from: "revisions-requested",
    to: "ready-for-review",
    allowedRoles: CUSTOMER,
    label: "Submit revisions",
    createsVersion: true,
    locksEditing: true,
  },
  {
    from: "customer-revising",
    to: "ready-for-review",
    allowedRoles: CUSTOMER,
    label: "Submit revisions",
    createsVersion: true,
    locksEditing: true,
  },
  {
    from: "agency-reviewing",
    to: "awaiting-approval",
    allowedRoles: PM,
    label: "Send for customer approval",
  },
  {
    from: "awaiting-approval",
    to: "partially-approved",
    allowedRoles: CUSTOMER,
    label: "Approve some pages",
  },
  {
    from: "awaiting-approval",
    to: "revisions-requested",
    allowedRoles: CUSTOMER,
    label: "Request changes",
    requiresMessage: true,
  },
  {
    from: "partially-approved",
    to: "revisions-requested",
    allowedRoles: CUSTOMER,
    label: "Request changes",
    requiresMessage: true,
  },
  {
    from: "awaiting-approval",
    to: "approved",
    allowedRoles: CUSTOMER,
    label: "Approve blueprint",
    createsVersion: true,
    locksEditing: true,
  },
  {
    from: "partially-approved",
    to: "approved",
    allowedRoles: CUSTOMER,
    label: "Approve blueprint",
    createsVersion: true,
    locksEditing: true,
  },
  {
    from: "approved",
    to: "in-development",
    allowedRoles: PM,
    label: "Start development",
  },
  {
    from: "approved",
    to: "awaiting-approval",
    allowedRoles: PM,
    label: "Reopen approval",
    requiresMessage: true,
    createsVersion: true,
  },
  { from: "in-development", to: "completed", allowedRoles: PM, label: "Mark completed" },
  { from: "approved", to: "archived", allowedRoles: PM, label: "Archive" },
  { from: "completed", to: "archived", allowedRoles: PM, label: "Archive" },
  { from: "draft", to: "archived", allowedRoles: PM, label: "Archive" },
  { from: "archived", to: "draft", allowedRoles: PM, label: "Restore from archive" },
];

// ---------------------------------------------------------------------------
// Page transitions
// ---------------------------------------------------------------------------

export const PAGE_TRANSITIONS: StatusTransition<PageStatus>[] = [
  { from: "draft", to: "content-needed", allowedRoles: CUSTOMER, label: "Mark content needed" },
  { from: "content-needed", to: "draft", allowedRoles: CUSTOMER, label: "Back to draft" },
  {
    from: "draft",
    to: "ready-for-review",
    allowedRoles: CUSTOMER,
    label: "Submit for agency review",
    createsVersion: true,
    locksEditing: true,
  },
  {
    from: "content-needed",
    to: "ready-for-review",
    allowedRoles: CUSTOMER,
    label: "Submit for agency review",
    createsVersion: true,
    locksEditing: true,
  },
  {
    from: "ready-for-review",
    to: "in-review",
    allowedRoles: AGENCY_ALL,
    label: "Start review",
  },
  {
    from: "in-review",
    to: "revisions-requested",
    allowedRoles: DESIGN_PM,
    label: "Request revisions",
    requiresMessage: true,
    createsVersion: true,
  },
  {
    from: "revisions-requested",
    to: "customer-revising",
    allowedRoles: CUSTOMER,
    label: "Start revisions",
  },
  {
    from: "revisions-requested",
    to: "ready-for-review",
    allowedRoles: CUSTOMER,
    label: "Submit revisions",
    createsVersion: true,
    locksEditing: true,
  },
  {
    from: "customer-revising",
    to: "ready-for-review",
    allowedRoles: CUSTOMER,
    label: "Submit revisions",
    createsVersion: true,
    locksEditing: true,
  },
  {
    from: "in-review",
    to: "ready-for-approval",
    allowedRoles: DESIGN_PM,
    label: "Mark ready for customer approval",
  },
  {
    from: "ready-for-approval",
    to: "approved",
    allowedRoles: CUSTOMER,
    label: "Approve page",
    createsVersion: true,
    locksEditing: true,
  },
  {
    from: "ready-for-approval",
    to: "revisions-requested",
    allowedRoles: CUSTOMER,
    label: "Request page changes",
    requiresMessage: true,
  },
  { from: "approved", to: "locked", allowedRoles: PM, label: "Lock page" },
  {
    from: "approved",
    to: "customer-revising",
    allowedRoles: PM,
    label: "Reopen for changes",
    requiresMessage: true,
    createsVersion: true,
  },
  {
    from: "locked",
    to: "customer-revising",
    allowedRoles: PM,
    label: "Unlock and reopen",
    requiresMessage: true,
    createsVersion: true,
  },
];

// ---------------------------------------------------------------------------
// Section transitions
// ---------------------------------------------------------------------------

const EDITORS: UserRole[] = ["customer", "agency-designer", "agency-pm"];

export const SECTION_TRANSITIONS: StatusTransition<SectionReviewStatus>[] = [
  { from: "draft", to: "content-needed", allowedRoles: EDITORS, label: "Mark content needed" },
  { from: "draft", to: "image-needed", allowedRoles: EDITORS, label: "Mark image needed" },
  { from: "content-needed", to: "draft", allowedRoles: EDITORS, label: "Back to draft" },
  { from: "image-needed", to: "draft", allowedRoles: EDITORS, label: "Back to draft" },
  {
    from: "draft",
    to: "agency-review-needed",
    allowedRoles: EDITORS,
    label: "Request agency review",
  },
  {
    from: "content-needed",
    to: "agency-review-needed",
    allowedRoles: EDITORS,
    label: "Request agency review",
  },
  {
    from: "image-needed",
    to: "agency-review-needed",
    allowedRoles: EDITORS,
    label: "Request agency review",
  },
  {
    from: "agency-review-needed",
    to: "revisions-requested",
    allowedRoles: DESIGN_PM,
    label: "Request section revision",
    requiresMessage: true,
  },
  {
    from: "revisions-requested",
    to: "agency-review-needed",
    allowedRoles: CUSTOMER,
    label: "Resubmit for review",
  },
  {
    from: "agency-review-needed",
    to: "ready-for-approval",
    allowedRoles: DESIGN_PM,
    label: "Mark ready for customer approval",
  },
  {
    from: "draft",
    to: "ready-for-approval",
    allowedRoles: DESIGN_PM,
    label: "Mark ready for customer approval",
  },
  {
    from: "agency-review-needed",
    to: "technically-reviewed",
    allowedRoles: ["agency-developer"],
    label: "Mark technically reviewed",
  },
  {
    from: "technically-reviewed",
    to: "ready-for-approval",
    allowedRoles: DESIGN_PM,
    label: "Mark ready for customer approval",
  },
  {
    from: "ready-for-approval",
    to: "approved",
    allowedRoles: CUSTOMER,
    label: "Approve section",
    locksEditing: true,
  },
  {
    from: "ready-for-approval",
    to: "revisions-requested",
    allowedRoles: CUSTOMER,
    label: "Request changes",
    requiresMessage: true,
  },
  {
    from: "approved",
    to: "technically-reviewed",
    allowedRoles: ["agency-developer"],
    label: "Mark technically reviewed",
  },
  {
    from: "approved",
    to: "revisions-requested",
    allowedRoles: PM,
    label: "Unlock section",
    requiresMessage: true,
    createsVersion: true,
  },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

function roleAllowed(transition: StatusTransition<string>, role: UserRole): boolean {
  // Admins may perform every defined transition.
  return role === "admin" || transition.allowedRoles.includes(role);
}

export function availableTransitions<S extends string>(
  table: StatusTransition<S>[],
  from: S,
  role: UserRole,
): StatusTransition<S>[] {
  return table.filter((t) => t.from === from && roleAllowed(t, role));
}

export function findTransition<S extends string>(
  table: StatusTransition<S>[],
  from: S,
  to: S,
): StatusTransition<S> | undefined {
  return table.find((t) => t.from === from && t.to === to);
}

export interface TransitionCheck {
  allowed: boolean;
  /** Human explanation when not allowed. */
  reason?: string;
}

export function checkTransition<S extends string>(
  table: StatusTransition<S>[],
  from: S,
  to: S,
  role: UserRole,
  labels: Record<S, { label: string }>,
): TransitionCheck {
  if (from === to) return { allowed: false, reason: "Already in that status." };
  const transition = findTransition(table, from, to);
  if (!transition) {
    return {
      allowed: false,
      reason: `Moving from “${labels[from].label}” to “${labels[to].label}” isn't part of the review workflow.`,
    };
  }
  if (!roleAllowed(transition, role)) {
    return {
      allowed: false,
      reason: `Only ${transition.allowedRoles.map((r) => ROLE_NAMES[r]).join(" or ")} can do this.`,
    };
  }
  return { allowed: true };
}

const ROLE_NAMES: Record<UserRole, string> = {
  customer: "the customer",
  "agency-designer": "an agency designer",
  "agency-developer": "an agency developer",
  "agency-pm": "the project manager",
  admin: "an administrator",
};
