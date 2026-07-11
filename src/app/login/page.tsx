"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ClipboardList,
  Code2,
  PencilRuler,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { APP_CONFIG } from "@/config/app";
import { ROLE_LABELS } from "@/config/labels";
import { MOCK_USERS } from "@/data/users";
import { useSessionStore } from "@/stores/session-store";
import type { UserRole } from "@/types";

const ROLE_ICONS: Record<UserRole, typeof UserRound> = {
  customer: UserRound,
  "agency-designer": Users,
  "agency-developer": Code2,
  "agency-pm": ClipboardList,
  admin: ShieldCheck,
};

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  customer: "Plan your website, build wireframes, and submit them for review.",
  "agency-designer": "Review customer blueprints, leave feedback, and request revisions.",
  "agency-developer": "Add technical notes and mark sections as technically reviewed.",
  "agency-pm": "Assign work, manage statuses, send blueprints for approval, export handoffs.",
  admin: "Manage section templates, users, statuses, and platform settings.",
};

export default function LoginPage() {
  const router = useRouter();
  const hydrate = useSessionStore((s) => s.hydrate);
  const hydrated = useSessionStore((s) => s.hydrated);
  const isLoggedIn = useSessionStore((s) => s.isLoggedIn);
  const login = useSessionStore((s) => s.login);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && isLoggedIn) router.replace("/dashboard");
  }, [hydrated, isLoggedIn, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
          <PencilRuler className="size-6" aria-hidden />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{APP_CONFIG.name}</h1>
          <p className="text-sm text-slate-500">{APP_CONFIG.tagline}</p>
        </div>
      </div>

      <div className="mt-10 w-full max-w-md">
        <h2 className="text-center text-sm font-medium text-slate-500">
          This is a prototype — choose a role to explore
        </h2>
        <div className="mt-4 space-y-3">
          {MOCK_USERS.map((user) => {
            const Icon = ROLE_ICONS[user.role];
            return (
              <button
                key={user.id}
                type="button"
                className="group flex w-full cursor-pointer items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
                onClick={() => {
                  login(user.role);
                  router.push("/dashboard");
                }}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600">
                  <Icon className="size-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {ROLE_LABELS[user.role]}
                    <span className="ml-2 font-normal text-slate-400">{user.name}</span>
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">{ROLE_DESCRIPTIONS[user.role]}</p>
                </div>
                <ArrowRight
                  className="size-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500"
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          No account needed — data is stored locally in your browser.
        </p>
      </div>
    </div>
  );
}
