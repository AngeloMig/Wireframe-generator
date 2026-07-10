import type { AppUser } from "@/types";

/** Mock users for simulated role switching — no real authentication. */
export const MOCK_USERS: AppUser[] = [
  {
    id: "user-customer-1",
    name: "Angelo Bermejo",
    email: "angelobmig@gmail.com",
    role: "customer",
    initials: "AB",
    avatarColor: "bg-indigo-500",
    title: "Customer",
  },
  {
    id: "user-agency-1",
    name: "Maya Lindqvist",
    email: "maya@northshore.studio",
    role: "agency",
    initials: "ML",
    avatarColor: "bg-emerald-500",
    title: "Project Lead, Northshore Web Studio",
  },
  {
    id: "user-admin-1",
    name: "Sam Okafor",
    email: "sam@northshore.studio",
    role: "admin",
    initials: "SO",
    avatarColor: "bg-slate-700",
    title: "Platform Administrator",
  },
];

export function getUserForRole(role: AppUser["role"]): AppUser {
  return MOCK_USERS.find((u) => u.role === role) ?? MOCK_USERS[0];
}
