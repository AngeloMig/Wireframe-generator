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
    <div className="flex min-h-screen flex-col bg-[var(--app-background)] lg:flex-row">
      {/* Identity panel: the drafting table. */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-[var(--drafting-ink)] px-8 py-8 text-white lg:w-[46%] lg:px-12 lg:py-10">
        {/* Drafting grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/25">
            <PencilRuler className="size-4.5" aria-hidden />
          </div>
          <div>
            <p className="font-display text-sm font-semibold tracking-tight">
              {APP_CONFIG.name}
            </p>
            <p className="font-mono text-[10px] tracking-[0.18em] text-white/50 uppercase">
              by {APP_CONFIG.agencyName}
            </p>
          </div>
        </div>

        {/* The blueprint assembles itself. */}
        <div className="relative mx-auto my-10 w-full max-w-sm lg:my-0" aria-hidden>
          <div className="rounded-lg bg-white p-4 shadow-[0_24px_60px_rgb(0_0_0/0.35)]">
            {/* nav */}
            <div
              className="animate-draft-rise flex items-center justify-between"
              style={{ animationDelay: "200ms" }}
            >
              <div className="h-2.5 w-12 rounded-full bg-slate-800" />
              <div className="flex gap-1.5">
                <div className="h-2 w-8 rounded-full bg-slate-200" />
                <div className="h-2 w-8 rounded-full bg-slate-200" />
                <div className="h-2 w-8 rounded-full bg-slate-200" />
              </div>
            </div>
            {/* hero */}
            <div
              className="animate-draft-rise mt-5 flex items-center gap-4"
              style={{ animationDelay: "420ms" }}
            >
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-full rounded-full bg-slate-300" />
                <div className="h-3.5 w-3/4 rounded-full bg-slate-300" />
                <div className="mt-3 h-2 w-5/6 rounded-full bg-slate-200" />
                <div className="h-2 w-2/3 rounded-full bg-slate-200" />
                <div className="mt-3 h-5 w-16 rounded bg-slate-800" />
              </div>
              <div className="relative h-20 w-24 shrink-0 rounded bg-slate-100 ring-1 ring-slate-200">
                <svg className="absolute inset-0 h-full w-full text-slate-300" aria-hidden>
                  <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" />
                  <line x1="100%" y1="0" x2="0" y2="100%" stroke="currentColor" />
                </svg>
              </div>
            </div>
            {/* cards */}
            <div
              className="animate-draft-rise mt-5 grid grid-cols-3 gap-2"
              style={{ animationDelay: "640ms" }}
            >
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-1.5 rounded border border-slate-200 p-2">
                  <div className="h-8 rounded-sm bg-slate-100" />
                  <div className="h-1.5 w-4/5 rounded-full bg-slate-300" />
                  <div className="h-1.5 w-3/5 rounded-full bg-slate-200" />
                </div>
              ))}
            </div>
            {/* footer */}
            <div
              className="animate-draft-rise mt-5 h-6 rounded-sm bg-slate-100"
              style={{ animationDelay: "860ms" }}
            />
          </div>

          {/* Redline annotation pin */}
          <div
            className="animate-pin-drop absolute -top-3 right-6 flex items-center gap-1.5"
            style={{ animationDelay: "1150ms" }}
          >
            <span className="flex size-7 items-center justify-center rounded-full rounded-br-none bg-[#e0492c] text-[11px] font-bold text-white shadow-lg">
              1
            </span>
            <span className="rounded bg-white/95 px-2 py-1 font-mono text-[10px] text-slate-700 shadow-md">
              love this — keep it
            </span>
          </div>
        </div>

        {/* Title block, like the corner of an engineering drawing. */}
        <div className="relative hidden border-t border-white/15 pt-4 lg:block">
          <dl className="flex gap-8 font-mono text-[10px] tracking-[0.14em] uppercase">
            <div>
              <dt className="text-white/40">Project</dt>
              <dd className="mt-0.5 text-white/85">Your website</dd>
            </div>
            <div>
              <dt className="text-white/40">Medium</dt>
              <dd className="mt-0.5 text-white/85">Wireframe</dd>
            </div>
            <div>
              <dt className="text-white/40">Rev</dt>
              <dd className="mt-0.5 text-white/85">Draft A</dd>
            </div>
            <div>
              <dt className="text-white/40">Scale</dt>
              <dd className="mt-0.5 text-white/85">1 : 1</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Seat picker */}
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <p className="font-mono text-[11px] tracking-[0.18em] text-[var(--text-muted)] uppercase">
            Prototype — no account needed
          </p>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
            Pull up a seat at the drafting table
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Choose a role to explore. Everything you draw is stored in this browser.
          </p>

          <div className="mt-7 space-y-2.5">
            {MOCK_USERS.map((user) => {
              const Icon = ROLE_ICONS[user.role];
              return (
                <button
                  key={user.id}
                  type="button"
                  className="group flex w-full cursor-pointer items-center gap-4 rounded-xl border border-[var(--border-default)] bg-white p-4 text-left shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-strong)]"
                  onClick={() => {
                    login(user.role);
                    router.push("/dashboard");
                  }}
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-secondary)] text-[var(--text-secondary)] transition-colors group-hover:bg-[var(--drafting-ink)] group-hover:text-white">
                    <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {ROLE_LABELS[user.role]}
                      <span className="ml-2 font-normal text-[var(--text-muted)]">
                        {user.name}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[13px] leading-snug text-[var(--text-secondary)]">
                      {ROLE_DESCRIPTIONS[user.role]}
                    </p>
                  </div>
                  <ArrowRight
                    className="size-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>

          <p className="mt-7 font-mono text-[10px] tracking-[0.14em] text-[var(--text-muted)] uppercase">
            Drawn by you · Reviewed by {APP_CONFIG.agencyName}
          </p>
        </div>
      </div>
    </div>
  );
}
