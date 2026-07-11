import { APP_CONFIG } from "@/config/app";
import type { AppUser, UserRole } from "@/types";

/** Mock users for simulated role switching — no real authentication. */
export const MOCK_USERS: AppUser[] = [
  {
    id: "user-customer-1",
    name: "Angelo Miguel",
    email: "angelobmig@gmail.com",
    role: "customer",
    initials: "AM",
    avatarColor: "bg-indigo-500",
    title: "Founder, Nordhaus Furniture",
    organization: "Nordhaus Furniture",
  },
  {
    id: "user-agency-1",
    name: "Maya Lindqvist",
    email: "maya@northshore.studio",
    role: "agency-designer",
    initials: "ML",
    avatarColor: "bg-emerald-500",
    title: "Lead Designer",
    organization: APP_CONFIG.agencyName,
  },
  {
    id: "user-agency-2",
    name: "Devon Carter",
    email: "devon@northshore.studio",
    role: "agency-developer",
    initials: "DC",
    avatarColor: "bg-sky-500",
    title: "Senior Developer",
    organization: APP_CONFIG.agencyName,
  },
  {
    id: "user-agency-3",
    name: "Priya Raman",
    email: "priya@northshore.studio",
    role: "agency-pm",
    initials: "PR",
    avatarColor: "bg-amber-500",
    title: "Project Manager",
    organization: APP_CONFIG.agencyName,
  },
  {
    id: "user-admin-1",
    name: "Sam Okafor",
    email: "sam@northshore.studio",
    role: "admin",
    initials: "SO",
    avatarColor: "bg-slate-700",
    title: "Platform Administrator",
    organization: APP_CONFIG.agencyName,
  },
];

/** Extra mock people available to add as project members. */
export const MOCK_MEMBER_POOL: AppUser[] = [
  {
    id: "user-customer-2",
    name: "Lena Ortiz",
    email: "lena@nordhaus.example.com",
    role: "customer",
    initials: "LO",
    avatarColor: "bg-rose-500",
    title: "Marketing Lead, Nordhaus",
    organization: "Nordhaus Furniture",
  },
  {
    id: "user-agency-4",
    name: "Tom Becker",
    email: "tom@northshore.studio",
    role: "agency-designer",
    initials: "TB",
    avatarColor: "bg-violet-500",
    title: "UI Designer",
    organization: APP_CONFIG.agencyName,
  },
  {
    id: "user-agency-5",
    name: "Ines Fournier",
    email: "ines@northshore.studio",
    role: "agency-developer",
    initials: "IF",
    avatarColor: "bg-teal-500",
    title: "Frontend Developer",
    organization: APP_CONFIG.agencyName,
  },
];

export const ALL_MOCK_USERS: AppUser[] = [...MOCK_USERS, ...MOCK_MEMBER_POOL];

export function getUserForRole(role: UserRole): AppUser {
  return MOCK_USERS.find((u) => u.role === role) ?? MOCK_USERS[0];
}

export function getUserById(id: string): AppUser | undefined {
  return ALL_MOCK_USERS.find((u) => u.id === id);
}

/** Maps pre-v3 stored roles ("agency") onto the expanded role set. */
export function normalizeLegacyRole(role: string): UserRole {
  if (role === "agency") return "agency-designer";
  if (MOCK_USERS.some((u) => u.role === role)) return role as UserRole;
  return "customer";
}
