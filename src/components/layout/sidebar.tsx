"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, PencilRuler } from "lucide-react";
import { APP_CONFIG } from "@/config/app";
import { ADMIN_NAV, MAIN_NAV, type NavItem } from "@/config/navigation";
import { useSessionStore } from "@/stores/session-store";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/utils/cn";

function NavLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group flex min-h-8 items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] font-medium transition-colors",
        active
          ? "bg-[var(--surface-pressed)] font-semibold text-[var(--text-primary)]"
          : "text-[var(--text-secondary)] hover:bg-[#ebebeb] hover:text-[var(--text-primary)]",
        collapsed && "justify-center px-2",
      )}
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {collapsed && <span className="sr-only">{item.label}</span>}
    </Link>
  );
}

export function SidebarContent({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const role = useSessionStore((s) => s.user.role);
  const items = MAIN_NAV.filter((item) => item.roles.includes(role));
  const adminItems = ADMIN_NAV.filter((item) => item.roles.includes(role));

  return (
    <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-0.5 p-3">
      {items.map((item) => (
        <NavLink
          key={`${item.label}:${item.href}`}
          item={item}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      ))}
      {adminItems.length > 0 && (
        <>
          <div className={cn("mt-4 mb-1 px-2 text-[11px] font-semibold tracking-wide text-slate-400 uppercase", collapsed && "sr-only")}>
            Admin
          </div>
          {adminItems.map((item) => (
            <NavLink
              key={`${item.label}:${item.href}`}
              item={item}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </>
      )}
    </nav>
  );
}

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[var(--border-default)] bg-[var(--surface-secondary)] transition-[width] duration-200 lg:flex",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className={cn("flex h-14 items-center gap-2.5 border-b border-[var(--border-default)] px-4", collapsed && "justify-center px-2")}>
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
          <PencilRuler className="size-4" aria-hidden />
        </div>
        {!collapsed && (
          <span className="truncate text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]">{APP_CONFIG.name}</span>
        )}
      </div>
      <SidebarContent collapsed={collapsed} />
      <div className="border-t border-[var(--border-default)] p-3">
        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(
            "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:bg-[#ebebeb] hover:text-slate-900",
            collapsed && "justify-center px-2",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4.5" aria-hidden />
          ) : (
            <>
              <PanelLeftClose className="size-4.5" aria-hidden />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
