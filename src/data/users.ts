import { APP_CONFIG } from "@/config/app";
import type { AppUser, UserRole } from "@/types";

/**
 * Demo organizations (agencies). Multi-tenant preview: each agency has its
 * own staff and customers; only the platform admin sees across them.
 */
export const AGENCY_ORGS = {
  northshore: APP_CONFIG.agencyName,
  southpaw: "Southpaw Studio",
} as const;

/** Mock users for simulated sign-in — no real authentication. */
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
    name: "Alo",
    email: "alo@northshore.studio",
    role: "agency-designer",
    initials: "AL",
    avatarColor: "bg-emerald-500",
    title: "Designer",
    organization: APP_CONFIG.agencyName,
  },
  {
    id: "user-agency-2",
    name: "Macky",
    email: "macky@northshore.studio",
    role: "agency-developer",
    initials: "MK",
    avatarColor: "bg-sky-500",
    title: "Developer",
    organization: APP_CONFIG.agencyName,
  },
  {
    id: "user-agency-3",
    name: "Noel",
    email: "noel@northshore.studio",
    role: "agency-pm",
    initials: "NO",
    avatarColor: "bg-amber-500",
    title: "Project Manager",
    organization: APP_CONFIG.agencyName,
  },
  {
    id: "user-agency-6",
    name: "Grant",
    email: "grant@northshore.studio",
    role: "agency-pm",
    initials: "GR",
    avatarColor: "bg-rose-500",
    title: "Project Manager",
    organization: APP_CONFIG.agencyName,
  },
  {
    id: "user-agency-7",
    name: "Phia",
    email: "phia@northshore.studio",
    role: "agency-designer",
    initials: "PH",
    avatarColor: "bg-violet-500",
    title: "Designer",
    organization: APP_CONFIG.agencyName,
  },
  {
    id: "user-agency-8",
    name: "Pokyo",
    email: "pokyo@northshore.studio",
    role: "agency-developer",
    initials: "PO",
    avatarColor: "bg-teal-500",
    title: "Developer",
    organization: APP_CONFIG.agencyName,
  },
  {
    id: "user-agency-9",
    name: "Kier",
    email: "kier@northshore.studio",
    role: "agency-designer",
    initials: "KI",
    avatarColor: "bg-fuchsia-500",
    title: "Designer",
    organization: APP_CONFIG.agencyName,
  },
  {
    id: "user-agency-10",
    name: "Kajebe",
    email: "kajebe@northshore.studio",
    role: "agency-developer",
    initials: "KA",
    avatarColor: "bg-orange-500",
    title: "Developer",
    organization: APP_CONFIG.agencyName,
  },
  // --- Southpaw Studio (second demo agency) --------------------------------
  {
    id: "user-sp-designer",
    name: "Noa Kimura",
    email: "noa@southpaw.studio",
    role: "agency-designer",
    initials: "NK",
    avatarColor: "bg-fuchsia-500",
    title: "Design Lead",
    organization: AGENCY_ORGS.southpaw,
  },
  {
    id: "user-sp-developer",
    name: "Ruben Alvarez",
    email: "ruben@southpaw.studio",
    role: "agency-developer",
    initials: "RA",
    avatarColor: "bg-cyan-600",
    title: "Developer",
    organization: AGENCY_ORGS.southpaw,
  },
  {
    id: "user-sp-pm",
    name: "Greta Volkova",
    email: "greta@southpaw.studio",
    role: "agency-pm",
    initials: "GV",
    avatarColor: "bg-orange-500",
    title: "Project Manager",
    organization: AGENCY_ORGS.southpaw,
  },
  {
    id: "user-sp-customer",
    name: "Owen Reyes",
    email: "owen@summitpeak.example.com",
    role: "customer",
    initials: "OR",
    avatarColor: "bg-lime-600",
    title: "Owner, Summit Peak Outfitters",
    organization: "Summit Peak Outfitters",
  },
  // --- Platform -------------------------------------------------------------
  {
    id: "user-admin-1",
    name: "Sam Okafor",
    email: "sam@blueprintbuilder.app",
    role: "admin",
    initials: "SO",
    avatarColor: "bg-slate-700",
    title: "Platform Administrator",
    organization: "Blueprint Builder",
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
