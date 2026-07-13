import {
  Activity,
  Building2,
  FolderKanban,
  LayoutDashboard,
  LayoutTemplate,
  Settings,
  ShieldCheck,
  Users,
  CheckSquare,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
}

const AGENCY_AND_ADMIN: UserRole[] = [
  "agency-designer",
  "agency-developer",
  "agency-pm",
  "admin",
];

export const MAIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: AGENCY_AND_ADMIN },
  { label: "Projects", href: "/projects", icon: FolderKanban, roles: AGENCY_AND_ADMIN },
  { label: "Templates", href: "/templates", icon: LayoutTemplate, roles: AGENCY_AND_ADMIN },
  { label: "Tasks", href: "/tasks", icon: CheckSquare, roles: AGENCY_AND_ADMIN },
  { label: "Activity", href: "/activity", icon: Activity, roles: AGENCY_AND_ADMIN },
  { label: "Inbox", href: "/inbox", icon: MessageSquare, roles: AGENCY_AND_ADMIN },
  { label: "Customers", href: "/admin/users", icon: Users, roles: ["agency-pm"] },
];

export const ADMIN_NAV: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: Activity, roles: ["admin"] },
  { label: "Template Management", href: "/admin/templates", icon: ShieldCheck, roles: ["admin"] },
  { label: "Users", href: "/admin/users", icon: Users, roles: ["admin"] },
  { label: "Organizations", href: "/admin/organizations", icon: Building2, roles: ["admin"] },
  { label: "System Settings", href: "/settings", icon: Settings, roles: ["admin"] },
];
