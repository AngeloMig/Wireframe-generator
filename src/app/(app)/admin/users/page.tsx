"use client";

import { ShieldAlert } from "lucide-react";
import { MOCK_USERS } from "@/data/users";
import { ROLE_LABELS } from "@/config/labels";
import { useSessionStore } from "@/stores/session-store";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

/** Read-only mock user list; real user management arrives with Supabase. */
export default function AdminUsersPage() {
  const user = useSessionStore((s) => s.user);

  if (user.role !== "admin") {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Administrator access required"
        description="Switch to the Administrator role from the user menu or Settings to view users."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">Users</h1>
        <p className="mt-1 text-sm text-slate-500">
          Mock accounts used by the prototype&apos;s role switcher. Real accounts arrive
          with the backend integration.
        </p>
      </div>

      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
        {MOCK_USERS.map((mockUser) => (
          <li key={mockUser.id} className="flex items-center gap-3 px-5 py-3.5">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
                mockUser.avatarColor,
              )}
            >
              {mockUser.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{mockUser.name}</p>
              <p className="truncate text-xs text-slate-500">
                {mockUser.title} · {mockUser.email}
              </p>
            </div>
            <Badge className="border-slate-200 bg-slate-50 text-slate-600">
              {ROLE_LABELS[mockUser.role]}
            </Badge>
            {mockUser.id === user.id && (
              <Badge className="border-indigo-200 bg-indigo-50 text-indigo-700">You</Badge>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
