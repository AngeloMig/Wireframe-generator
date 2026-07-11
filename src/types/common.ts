/** Shared primitives used across all persistent records. */

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export type UserRole =
  | "customer"
  | "agency-designer"
  | "agency-developer"
  | "agency-pm"
  | "admin";

export const AGENCY_ROLES: UserRole[] = [
  "agency-designer",
  "agency-developer",
  "agency-pm",
];

export const ALL_ROLES: UserRole[] = ["customer", ...AGENCY_ROLES, "admin"];

/** Agency staff or platform admin — sees internal notes and agency tools. */
export function isAgencyUser(role: UserRole): boolean {
  return role !== "customer";
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  initials: string;
  /** Tailwind-safe accent used for the avatar chip. */
  avatarColor: string;
  title: string;
  organization: string;
}
