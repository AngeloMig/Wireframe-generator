"use client";

import { useRouter } from "next/navigation";
import { Check, LogOut, RotateCcw } from "lucide-react";
import { ROLE_LABELS } from "@/config/labels";
import { AGENCY_ORGS, MOCK_USERS } from "@/data/users";
import { useProjectsStore } from "@/stores/projects-store";
import { useSessionStore } from "@/stores/session-store";
import { useNotificationsStore } from "@/stores/notifications-store";
import { toast } from "@/stores/ui-store";
import { cn } from "@/utils/cn";
import {
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
  DropdownSeparator,
} from "@/components/ui/dropdown-menu";

/** Dev-only switcher, grouped so the two demo agencies stay distinguishable. */
const SWITCHER_GROUPS = [
  {
    label: AGENCY_ORGS.northshore,
    users: MOCK_USERS.filter(
      (u) =>
        (u.organization === AGENCY_ORGS.northshore && u.role !== "admin") ||
        u.id === "user-customer-1",
    ),
  },
  {
    label: AGENCY_ORGS.southpaw,
    users: MOCK_USERS.filter(
      (u) => u.organization === AGENCY_ORGS.southpaw || u.id === "user-sp-customer",
    ),
  },
  {
    label: "Platform",
    users: MOCK_USERS.filter((u) => u.role === "admin"),
  },
];

export function UserMenu() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const switchUser = useSessionStore((s) => s.switchUser);
  const logout = useSessionStore((s) => s.logout);
  const resetDemoData = useProjectsStore((s) => s.resetDemoData);
  const refreshNotifications = useNotificationsStore((s) => s.refresh);

  return (
    <DropdownMenu
      align="end"
      className="w-64"
      trigger={(props) => (
        <button
          type="button"
          {...props}
          className="flex cursor-pointer items-center gap-2 rounded-full p-0.5 hover:bg-slate-100"
          aria-label={`User menu — signed in as ${user.name}`}
        >
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-full text-xs font-semibold text-white",
              user.avatarColor,
            )}
            aria-hidden
          >
            {user.initials}
          </span>
        </button>
      )}
    >
      <div className="px-3 py-2">
        <p className="text-sm font-medium text-slate-900">{user.name}</p>
        <p className="truncate text-xs text-slate-500">{user.email}</p>
      </div>
      <DropdownSeparator />
      {SWITCHER_GROUPS.map((group) => (
        <div key={group.label}>
          <DropdownLabel>{group.label}</DropdownLabel>
          {group.users.map((mockUser) => (
            <DropdownItem
              key={mockUser.id}
              onSelect={async () => {
                switchUser(mockUser.id);
                // Notifications are per-user and only hydrate once, so the new
                // user's inbox must be re-read — otherwise the panel keeps
                // showing the previous user's list (and misses ones delivered
                // to this user while another role was active).
                await refreshNotifications();
                toast(`Now viewing as ${mockUser.name}`, "info");
                router.push("/dashboard");
              }}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white",
                  mockUser.avatarColor,
                )}
              >
                {mockUser.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate">{mockUser.name}</span>
                <span className="block truncate text-[11px] text-slate-400">
                  {ROLE_LABELS[mockUser.role]}
                </span>
              </span>
              {user.id === mockUser.id && (
                <Check className="size-4 text-[var(--primary)]" aria-hidden />
              )}
            </DropdownItem>
          ))}
        </div>
      ))}
      <DropdownSeparator />
      <DropdownItem
        onSelect={async () => {
          await resetDemoData();
          await refreshNotifications();
          toast("Demo data has been reset", "success");
          router.push("/dashboard");
        }}
      >
        <RotateCcw className="size-4 text-slate-400" aria-hidden />
        Reset demo data
      </DropdownItem>
      <DropdownItem
        onSelect={() => {
          logout();
          router.push("/login");
        }}
      >
        <LogOut className="size-4 text-slate-400" aria-hidden />
        Sign out
      </DropdownItem>
    </DropdownMenu>
  );
}
