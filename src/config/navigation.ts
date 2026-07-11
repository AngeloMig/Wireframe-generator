import {
  Activity,
  Building2,
  FolderKanban,
  LayoutDashboard,
  LayoutTemplate,
  Settings,
  ShieldCheck,
  Users,
  Bell,
  CheckSquare,
  MessageSquareText,
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
  { label: "Home", href: "/dashboard", icon: LayoutDashboard, roles: ["customer"] },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["agency-designer", "agency-developer", "agency-pm", "admin"] },
  { label: "Projects", href: "/projects", icon: FolderKanban, roles: ["customer", "agency-designer", "agency-developer", "agency-pm", "admin"] },
  { label: "Templates", href: "/templates", icon: LayoutTemplate, roles: ["customer", "agency-designer", "agency-developer", "agency-pm", "admin"] },
  { label: "Tasks", href: "/activity", icon: CheckSquare, roles: ["customer", "agency-designer", "agency-developer", "agency-pm"] },
  { label: "Notifications", href: "/activity", icon: Bell, roles: ["customer"] },
  { label: "Reviews", href: "/activity", icon: MessageSquareText, roles: ["agency-designer", "agency-developer", "agency-pm"] },
  { label: "Customers", href: "/admin/users", icon: Users, roles: ["agency-pm"] },
];

export const ADMIN_NAV: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: Activity, roles: ["admin"] },
  { label: "Template Management", href: "/admin/templates", icon: ShieldCheck, roles: ["admin"] },
  { label: "Users", href: "/admin/users", icon: Users, roles: ["admin"] },
  { label: "Organizations", href: "/admin/organizations", icon: Building2, roles: ["admin"] },
  { label: "System Settings", href: "/settings", icon: Settings, roles: ["admin"] },
];
