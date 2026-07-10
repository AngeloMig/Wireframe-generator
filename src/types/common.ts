/** Shared primitives used across all persistent records. */

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "customer" | "agency" | "admin";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  initials: string;
  /** Tailwind-safe accent used for the avatar chip. */
  avatarColor: string;
  title: string;
}
