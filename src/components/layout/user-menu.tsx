"use client";

import { useRouter } from "next/navigation";
import { Check, LogOut, RotateCcw, UserRound } from "lucide-react";
import { ROLE_LABELS } from "@/config/labels";
import { useProjectsStore } from "@/stores/projects-store";
import { useSessionStore } from "@/stores/session-store";
import { useNotificationsStore } from "@/stores/notifications-store";
import { toast } from "@/stores/ui-store";
import type { UserRole } from "@/types";
import { cn } from "@/utils/cn";
import {
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
  DropdownSeparator,
} from "@/components/ui/dropdown-menu";

const ROLES: UserRole[] = ["customer", "agency-designer", "agency-developer", "agency-pm", "admin"];

export function UserMenu() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const switchRole = useSessionStore((s) => s.switchRole);
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
      <DropdownLabel>Switch role (dev only)</DropdownLabel>
      {ROLES.map((role) => (
        <DropdownItem
          key={role}
          onSelect={() => {
            switchRole(role);
            toast(`Now viewing as ${ROLE_LABELS[role]}`, "info");
            router.push("/dashboard");
          }}
        >
          <UserRound className="size-4 text-slate-400" aria-hidden />
          <span className="flex-1">{ROLE_LABELS[role]}</span>
          {user.role === role && <Check className="size-4 text-indigo-600" aria-hidden />}
        </DropdownItem>
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
