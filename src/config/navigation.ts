import {
  Activity,
  Building2,
  FolderKanban,
  LayoutDashboard,
  LayoutTemplate,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
}

export const MAIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["customer", "agency", "admin"] },
  { label: "Projects", href: "/projects", icon: FolderKanban, roles: ["customer", "agency", "admin"] },
  { label: "Templates", href: "/templates", icon: LayoutTemplate, roles: ["customer", "agency", "admin"] },
  { label: "Activity", href: "/activity", icon: Activity, roles: ["customer", "agency", "admin"] },
  { label: "Settings", href: "/settings", icon: Settings, roles: ["customer", "agency", "admin"] },
];

export const ADMIN_NAV: NavItem[] = [
  { label: "Template Management", href: "/admin/templates", icon: ShieldCheck, roles: ["admin"] },
  { label: "Users", href: "/admin/users", icon: Users, roles: ["admin"] },
  { label: "Organizations", href: "/admin/organizations", icon: Building2, roles: ["admin"] },
];
