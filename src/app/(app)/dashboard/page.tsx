"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckSquare,
  CheckCircle2,
  CircleDashed,
  Clock3,
  FolderKanban,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { PROJECT_STATUS_META } from "@/config/labels";
import { projectsForUser } from "@/lib/org";
import { useCommentsStore } from "@/stores/comments-store";
import { useNotificationsStore } from "@/stores/notifications-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useSessionStore } from "@/stores/session-store";
import type { ActivityEntry, Project, ProjectComment, ProjectStatus } from "@/types";
import { cn } from "@/utils/cn";
import { formatDate, formatRelative } from "@/utils/dates";
import { CustomerHome } from "@/components/customer/customer-home";
import { ProjectCard } from "@/components/project/project-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";

/** Cross-project collaboration signals for the current user. */
function useCollabSignals(projects: Project[], userId: string) {
  const load = useCommentsStore((s) => s.load);
  const byProject = useCommentsStore((s) => s.byProject);

  useEffect(() => {
    for (const project of projects) void load(project.id);
  }, [projects, load]);

  return useMemo(() => {
    const all: { project: Project; comment: ProjectComment }[] = [];
    for (const project of projects) {
      for (const comment of byProject[project.id] ?? []) {
        all.push({ project, comment });
      }
    }
    const myActionItems = all.filter(
      ({ comment }) =>
        comment.isActionItem && !comment.completedAt && comment.assignedToId === userId,
    );
    const urgent = all.filter(
      ({ comment }) =>
        comment.priority === "urgent" &&
        (comment.status === "open" || comment.status === "reopened"),
    );
    const overdue = all.filter(
      ({ comment }) =>
        comment.isActionItem &&
        !comment.completedAt &&
        comment.dueDate &&
        new Date(comment.dueDate) < new Date(),
    );
    const customerQuestions = all.filter(
      ({ comment }) =>
        comment.message.startsWith("[Question for") &&
        (comment.status === "open" || comment.status === "reopened"),
    );
    return { myActionItems, urgent, overdue, customerQuestions };
  }, [projects, byProject, userId]);
}

export default function DashboardPage() {
  const isCustomer = useSessionStore((s) => s.user.role === "customer");
  // Customers get the focused workspace entry, never the dashboard.
  if (isCustomer) return <CustomerHome />;
  return <AgencyDashboard />;
}

// ---------------------------------------------------------------------------
// The pipeline board: the whole book of work as one annotated drawing.
// ---------------------------------------------------------------------------

interface PipelineStage {
  id: string;
  label: string;
  statuses: ProjectStatus[];
  /** Where clicking a project chip in this stage should land. */
  href: (p: Project) => string;
}

const PIPELINE: PipelineStage[] = [
  {
    id: "drafting",
    label: "Drafting",
    statuses: ["draft", "customer-editing"],
    href: (p) => `/projects/${p.id}/overview`,
  },
  {
    id: "submitted",
    label: "Submitted",
    statuses: ["ready-for-review"],
    href: (p) => `/projects/${p.id}/agency-review`,
  },
  {
    id: "in-review",
    label: "In review",
    statuses: ["agency-reviewing"],
    href: (p) => `/projects/${p.id}/agency-review`,
  },
  {
    id: "revisions",
    label: "Revisions",
    statuses: ["revisions-requested", "customer-revising"],
    href: (p) => `/projects/${p.id}/overview`,
  },
  {
    id: "approval",
    label: "Approval",
    statuses: ["awaiting-approval", "partially-approved"],
    href: (p) => `/projects/${p.id}/review`,
  },
  {
    id: "approved",
    label: "Approved",
    statuses: ["approved", "in-development", "completed"],
    href: (p) => `/projects/${p.id}/handoff`,
  },
];

function daysWaiting(project: Project): number {
  return Math.floor((Date.now() - new Date(project.lastEditedAt).getTime()) / 86_400_000);
}

function AgencyDashboard() {
  const allProjects = useProjectsStore((s) => s.projects);
  const user = useSessionStore((s) => s.user);
  const notifications = useNotificationsStore((s) => s.notifications);

  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const visible = useMemo(
    () => projectsForUser(allProjects, user).filter((p) => p.status !== "archived"),
    [allProjects, user],
  );

  const signals = useCollabSignals(visible, user.id);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const stages = useMemo(
    () =>
      PIPELINE.map((stage) => ({
        ...stage,
        projects: visible
          .filter((p) => stage.statuses.includes(p.status))
          .sort((a, b) => a.lastEditedAt.localeCompare(b.lastEditedAt)),
      })),
    [visible],
  );

  // The one action the agency should take next, as a redline annotation.
  const nextUp = useMemo(() => {
    const submitted = stages.find((s) => s.id === "submitted")?.projects[0];
    if (submitted) {
      return {
        verb: "Start the review",
        subject: submitted.name,
        detail: `Submitted by ${submitted.companyName} — waiting ${formatRelative(submitted.lastEditedAt)}.`,
        href: `/projects/${submitted.id}/agency-review`,
        cta: "Start review",
      };
    }
    if (signals.urgent.length > 0) {
      const { project, comment } = signals.urgent[0];
      return {
        verb: "Respond to an urgent comment",
        subject: project.name,
        detail: comment.message,
        href: `/projects/${project.id}/overview?comment=${comment.id}`,
        cta: "Open comment",
      };
    }
    if (signals.customerQuestions.length > 0) {
      const { project, comment } = signals.customerQuestions[0];
      return {
        verb: "Answer a customer question",
        subject: project.name,
        detail: comment.message.replace(/^\[Question for .*?\]\s*/, ""),
        href: `/projects/${project.id}/agency-review?comment=${comment.id}`,
        cta: "Open feedback",
      };
    }
    const reviewing = stages.find((s) => s.id === "in-review")?.projects[0];
    if (reviewing) {
      return {
        verb: "Continue the review",
        subject: reviewing.name,
        detail: "Pick up where the team left off.",
        href: `/projects/${reviewing.id}/agency-review`,
        cta: "Continue review",
      };
    }
    const approval = stages.find((s) => s.id === "approval")?.projects[0];
    if (approval) {
      return {
        verb: "Waiting on customer approval",
        subject: approval.name,
        detail: "A nudge might help if it's been a while.",
        href: `/projects/${approval.id}/review`,
        cta: "View approval",
      };
    }
    return null;
  }, [stages, signals.urgent, signals.customerQuestions]);

  const attention = useMemo(
    () =>
      [
        ...signals.urgent.map((item) => ({ ...item, kind: "urgent" as const })),
        ...signals.overdue.map((item) => ({ ...item, kind: "overdue" as const })),
        ...signals.customerQuestions.map((item) => ({ ...item, kind: "question" as const })),
        ...signals.myActionItems
          .filter(
            ({ comment }) =>
              !signals.overdue.some((o) => o.comment.id === comment.id),
          )
          .map((item) => ({ ...item, kind: "task" as const })),
      ].slice(0, 6),
    [signals],
  );

  // Book-of-work pulse: how much sits at each actionable stage right now.
  const stageCount = (id: string) => stages.find((s) => s.id === id)?.projects.length ?? 0;

  // At risk: projects that have sat in an actionable stage past the SLA window.
  const atRisk = useMemo(() => {
    const riskStages = new Set(["submitted", "in-review", "revisions", "approval"]);
    return stages
      .filter((stage) => riskStages.has(stage.id))
      .flatMap((stage) =>
        stage.projects.map((project) => ({ project, stage, days: daysWaiting(project) })),
      )
      .filter((entry) => entry.days >= 4)
      .sort((a, b) => b.days - a.days)
      .slice(0, 3);
  }, [stages]);

  const websiteTypes = useMemo(
    () => [...new Set(visible.map((p) => p.websiteType))].sort(),
    [visible],
  );

  const filtered = useMemo(
    () =>
      visible
        .filter(
          (p) =>
            (statusFilter === "all" || p.status === statusFilter) &&
            (typeFilter === "all" || p.websiteType === typeFilter) &&
            (!searchQuery.trim() ||
              `${p.name} ${p.companyName} ${p.websiteType}`
                .toLowerCase()
                .includes(searchQuery.trim().toLowerCase())),
        )
        .sort((a, b) => b.lastEditedAt.localeCompare(a.lastEditedAt)),
    [visible, statusFilter, typeFilter, searchQuery],
  );

  const health = useMemo(() => {
    const onTrack = new Set<ProjectStatus>(["draft", "customer-editing", "agency-reviewing", "approved", "in-development"]);
    const waiting = new Set<ProjectStatus>(["awaiting-approval", "partially-approved"]);
    const blocked = new Set<ProjectStatus>(["revisions-requested", "customer-revising"]);
    return {
      onTrack: visible.filter((project) => onTrack.has(project.status)).length,
      waiting: visible.filter((project) => waiting.has(project.status)).length,
      blocked: visible.filter((project) => blocked.has(project.status)).length,
      overdue: atRisk.length,
    };
  }, [visible, atRisk.length]);

  const workItems = useMemo(
    () =>
      [
        ...signals.customerQuestions.map(({ project, comment }) => ({
          label: "Customer question",
          detail: comment.message.replace(/^\[Question for .*?\]\s*/, ""),
          meta: project.name,
          href: `/projects/${project.id}/agency-review?comment=${comment.id}`,
          icon: MessageSquare,
          tone: "text-[var(--info)]",
        })),
        ...signals.urgent.map(({ project, comment }) => ({
          label: "Urgent comment",
          detail: comment.message,
          meta: project.name,
          href: `/projects/${project.id}/agency-review?comment=${comment.id}`,
          icon: AlertCircle,
          tone: "text-[var(--shopify-danger)]",
        })),
        ...signals.myActionItems.map(({ project, comment }) => ({
          label: "Assigned task",
          detail: comment.message,
          meta: project.name,
          href: `/projects/${project.id}/agency-review?comment=${comment.id}`,
          icon: CheckSquare,
          tone: "text-[var(--success-text)]",
        })),
      ].slice(0, 5),
    [signals],
  );

  const recentActivity = useMemo(() => {
    const entries: { project: Project; entry: ActivityEntry }[] = [];
    for (const project of visible) {
      for (const entry of project.activity) entries.push({ project, entry });
    }
    return entries.sort((a, b) => b.entry.createdAt.localeCompare(a.entry.createdAt)).slice(0, 5);
  }, [visible]);

  const waitingOnCustomer = useMemo(
    () =>
      stages
        .filter((stage) => stage.id === "approval" || stage.id === "revisions")
        .flatMap((stage) => stage.projects.map((project) => ({ project, stage })))
        .slice(0, 4),
    [stages],
  );

  const digest: { label: string; href: string }[] = [
    signals.myActionItems.length > 0 && {
      label: `${signals.myActionItems.length} task${signals.myActionItems.length === 1 ? "" : "s"} for you`,
      href: "/tasks",
    },
    signals.urgent.length > 0 && {
      label: `${signals.urgent.length} urgent`,
      href: "#attention",
    },
    unreadCount > 0 && { label: `${unreadCount} unread`, href: "/inbox" },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <div className="animate-fade-in space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-5 border-b border-[var(--border-default)] pb-6">
        <div className="min-w-0">
          <span className="mb-3 inline-flex items-center rounded-full border border-[var(--border-default)] bg-white px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            Agency control room
          </span>
          <h1 className="font-display text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.035em] text-[var(--text-primary)] md:text-[3rem]">
            Production desk
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="max-w-xl text-sm text-[var(--text-secondary)]">
              Keep the book of work moving, answer customers, and clear the next decision.
            </p>
            {digest.length === 0 ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--success-soft)] px-3 py-1 text-xs font-medium text-[var(--success-text)]">
                <span className="size-1.5 rounded-full bg-[var(--success)]" aria-hidden />
                All clear — nothing is waiting on you
              </span>
            ) : (
              <>
                <span className="text-xs font-medium text-[var(--text-muted)]">Waiting on you</span>
                {digest.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="inline-flex min-h-11 items-center rounded-full border border-[var(--border-default)] bg-white px-3 py-1 text-xs font-semibold text-[var(--text-primary)] shadow-[var(--shadow-subtle)] transition-[transform,border-color] hover:-translate-y-px hover:border-[var(--border-strong)] active:translate-y-0"
                  >
                    {item.label}
                  </Link>
                ))}
              </>
            )}
          </div>
          <time dateTime={new Date().toISOString()} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
            <CalendarDays className="size-3.5" aria-hidden />
            {formatDate(new Date().toISOString())}
          </time>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] bg-white px-3 text-[13px] font-medium text-[var(--text-primary)] transition-[background-color,border-color,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-secondary)] active:scale-[0.97]"
        >
          <Plus className="size-4" aria-hidden />
          New project
        </Link>
      </header>

      {/* The one decision that should happen next. */}
      {nextUp && (
        /* Double-bezel: a pale machined shell cradling the ink core, so the
           day's one decision reads as the dashboard's hero object. */
        <section
          aria-labelledby="next-up-heading"
          className="rounded-[1.4rem] bg-[var(--shopify-panel)] p-1.5 shadow-[0_16px_44px_rgb(28_58_48/0.14)] ring-1 ring-black/[0.05]"
        >
          <div className="flex flex-wrap items-center gap-5 rounded-[calc(1.4rem-0.375rem)] bg-[var(--drafting-ink)] px-5 py-6 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.12)] sm:px-7 sm:py-7">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full rounded-br-none bg-[var(--shopify-mint)] text-sm font-bold text-[var(--drafting-ink)]"
            >
              1
            </span>
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c1fbd4]">
                Today’s brief <span className="size-1 rounded-full bg-[#c1fbd4]" aria-hidden />
              </span>
              <h2 id="next-up-heading" className="mt-2 text-lg font-semibold tracking-tight text-white">
                {nextUp.verb} — {nextUp.subject}
              </h2>
              <p className="mt-1 max-w-2xl truncate text-[13px] text-white/70">
                {nextUp.detail}
              </p>
            </div>
            <Link
              href={nextUp.href}
              className="group inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-full bg-[var(--shopify-mint)] py-2.5 pr-2.5 pl-5 text-sm font-semibold text-[var(--drafting-ink)] transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white active:scale-[0.98] sm:w-auto"
            >
              {nextUp.cta}
              <span className="flex size-8 items-center justify-center rounded-full bg-[var(--drafting-ink)]/10 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </Link>
          </div>
        </section>
      )}

      {/* A quiet operational pulse, not a decorative metric wall. */}
      {visible.length > 0 && (
        <section aria-label="Pipeline pulse" className="grid grid-cols-2 border-y border-[var(--border-default)] sm:grid-cols-4">
          {(
            [
              { label: "Awaiting your review", value: stageCount("submitted"), href: "#pipeline", action: true },
              { label: "In review", value: stageCount("in-review"), href: "#pipeline", action: false },
              { label: "Awaiting approval", value: stageCount("approval"), href: "#pipeline", action: false },
              { label: "Overdue tasks", value: signals.overdue.length, href: "#attention", action: true },
            ] as const
          ).map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="group border-r border-b border-[var(--border-default)] px-4 py-4 transition-colors hover:bg-[var(--shopify-mint-hover)] sm:border-b-0 sm:px-5 sm:py-5 last:border-r-0 [&:nth-child(2)]:sm:border-r [&:nth-child(odd)]:border-r sm:[&:nth-child(2)]:border-r"
            >
              <span
                className={cn(
                  "font-display text-4xl font-semibold tabular-nums tracking-tight transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5",
                  stat.value === 0
                    ? "text-[var(--text-muted)]"
                    : stat.action
                      ? "text-[var(--shopify-danger)]"
                      : "text-[var(--text-primary)]",
                )}
              >
                {stat.value}
              </span>
              <span className="mt-1 block text-xs font-medium text-[var(--text-secondary)]">
                {stat.label}
              </span>
            </Link>
          ))}
        </section>
      )}

      <section aria-label="Agency workspace" className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
        <div className="overflow-hidden rounded-2xl border border-[var(--shopify-border)] bg-white shadow-[0_1px_2px_rgb(38_57_74/0.04),0_16px_40px_rgb(38_57_74/0.05)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--shopify-border)] px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">My work</h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">The conversations and tasks that need your attention.</p>
            </div>
            <Link href="/inbox" className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--shopify-mint-hover)] hover:text-[var(--text-primary)]">
              Open inbox <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          {workItems.length === 0 ? (
            <div className="flex items-center gap-3 px-5 py-7 text-sm text-[var(--text-secondary)] sm:px-6">
              <CheckCircle2 className="size-5 text-[var(--success)]" aria-hidden />
              You’re clear for now. New customer activity will appear here.
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border-default)]">
              {workItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={`${item.label}-${item.meta}-${item.detail}`}>
                    <Link href={item.href} className="flex min-h-14 items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--shopify-mint-hover)] sm:px-6">
                      <Icon className={`size-4 shrink-0 ${item.tone}`} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">{item.label}</span>
                        <span className="mt-0.5 block truncate text-sm text-[var(--text-primary)]">{item.detail}</span>
                      </span>
                      <span className="hidden max-w-32 truncate text-xs text-[var(--text-muted)] sm:block">{item.meta}</span>
                      <ArrowRight className="size-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--shopify-border)] bg-[var(--shopify-canvas)] p-5 shadow-[0_1px_2px_rgb(38_57_74/0.04),0_16px_40px_rgb(38_57_74/0.05)] sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">Project health</h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">A quick read on the book of work.</p>
            </div>
            <CircleDashed className="size-5 text-[var(--text-muted)]" aria-hidden />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {[
              { label: "On track", value: health.onTrack, tone: "text-[var(--text-primary)]" },
              { label: "Waiting", value: health.waiting, tone: "text-[var(--info)]" },
              { label: "Blocked", value: health.blocked, tone: "text-[var(--warning-text)]" },
              { label: "At risk", value: health.overdue, tone: "text-[var(--shopify-danger)]" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-[var(--shopify-border)] bg-white px-3 py-3">
                <span className={`font-display text-2xl font-semibold tabular-nums ${item.tone}`}>{item.value}</span>
                <span className="mt-0.5 block text-xs text-[var(--text-secondary)]">{item.label}</span>
              </div>
            ))}
          </div>
          <Link href="#pipeline" className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            View project flow <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </section>

      {/* At risk: anything that has sat in an actionable stage too long. */}
      {atRisk.length > 0 && (
        <section
          aria-label="At risk"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-[var(--shopify-danger-border)] bg-[var(--shopify-danger-surface)] px-5 py-3.5 shadow-[0_1px_2px_rgb(38_57_74/0.04),0_12px_32px_rgb(197_40_12/0.05)]"
        >
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--shopify-danger)]">
            <AlertCircle className="size-4" aria-hidden />
            At risk
          </span>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1.5">
            {atRisk.map(({ project, stage, days }) => (
              <Link
                key={project.id}
                href={stage.href(project)}
                className="group inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <span className="font-medium text-[var(--text-primary)] group-hover:underline">{project.name}</span>
                <span className="text-[var(--text-muted)]">· {days}d in {stage.label.toLowerCase()}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* The board: every project at its station on the review pipeline —
          same machined tray/plate as Next up, in a calm neutral register. */}
      <section
        id="pipeline"
        aria-label="Review pipeline"
        className="scroll-mt-6 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-white shadow-[0_1px_2px_rgb(38_57_74/0.04),0_16px_40px_rgb(38_57_74/0.05)]"
      >
        <div className="border-b border-[var(--border-default)] bg-[var(--shopify-canvas)] px-5 py-5 sm:px-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Book of work</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-[var(--text-primary)]">Production timeline</h2>
            </div>
            <span className="text-xs font-medium text-[var(--text-muted)]">
              {visible.length} active project{visible.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
          {visible.length === 0 ? (
            <p className="px-5 py-5 text-sm text-[var(--text-secondary)] sm:px-7">
              No projects on the board yet — start one and it appears here, moving
              station by station from draft to approved.
            </p>
          ) : (
            <>
              <div className="mt-5 hidden overflow-x-auto md:block">
              <div className="grid min-w-[880px] grid-cols-6 gap-3">
                {stages.map((stage, index) => {
                  const active = stage.projects.length > 0;
                  return (
                    <div key={stage.id} className="relative">
                      {/* Connecting line to the next station */}
                      {index < stages.length - 1 && (
                        <span
                          aria-hidden
                          className="absolute top-[7px] left-4 h-px w-full bg-[var(--border-default)]"
                        />
                      )}
                      <div className="relative flex items-center gap-2">
                        <span
                          aria-hidden
                          className={cn(
                            "size-3.5 shrink-0 rounded-full ring-4 ring-white",
                            active ? "bg-[var(--shopify-ink)]" : "bg-[var(--border-strong)]",
                          )}
                        />
                        <span
                          className={cn(
                            "text-[11px] font-semibold tracking-tight",
                            active ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]",
                          )}
                        >
                          {stage.label}
                          {active && (
                            <span className="ml-1 text-[var(--text-muted)]">{stage.projects.length}</span>
                          )}
                        </span>
                      </div>
                      <ul className="mt-3.5 space-y-2">
                        {stage.projects.slice(0, 4).map((project) => {
                          const age = daysWaiting(project);
                          return (
                            <li key={project.id}>
                              <Link
                                href={stage.href(project)}
                                className="group block rounded-lg border border-[var(--shopify-border)] bg-white px-3 py-2.5 transition-[background-color,border-color,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:border-[var(--shopify-border-hover)] hover:bg-[var(--shopify-mint-hover)] active:translate-y-0"
                              >
                                <span className="block truncate text-[13px] font-semibold text-[var(--text-primary)]">
                                  {project.name}
                                </span>
                                <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                                  <Clock3 className="size-3 shrink-0" aria-hidden />
                                  {age === 0 ? "today" : `${age}d here`}
                                  {age > 2 && (
                                    <span
                                      className={cn(
                                        "font-semibold text-[var(--shopify-danger)]",
                                        age <= 5 && "opacity-70",
                                      )}
                                    >
                                      — needs a look
                                    </span>
                                  )}
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                        {stage.projects.length > 4 && (
                          <li>
                            <Link
                              href="/projects"
                              className="block px-3 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            >
                              +{stage.projects.length - 4} more
                            </Link>
                          </li>
                        )}
                      </ul>
                    </div>
                  );
                })}
              </div>
              </div>
              <div className="mt-5 space-y-3 md:hidden">
              {stages.map((stage) => (
                <div key={stage.id} className="rounded-lg border border-[var(--shopify-border)] bg-[var(--shopify-canvas)] p-3">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className={cn(
                        "size-3 shrink-0 rounded-full",
                        stage.projects.length > 0 ? "bg-[var(--shopify-ink)]" : "bg-[var(--border-strong)]",
                      )}
                    />
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      {stage.label}
                    </h3>
                    <span className="text-xs text-[var(--text-muted)]">
                      {stage.projects.length}
                    </span>
                  </div>
                  {stage.projects.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {stage.projects.slice(0, 4).map((project) => (
                        <li key={project.id}>
                          <Link
                            href={stage.href(project)}
                            className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-[var(--shopify-border)] bg-white px-3 py-2 text-sm transition-colors active:bg-[var(--shopify-mint-hover)]"
                          >
                            <span className="min-w-0 truncate font-medium text-[var(--text-primary)]">
                              {project.name}
                            </span>
                            <span className="shrink-0 text-xs text-[var(--text-muted)]">
                              {(() => {
                                const age = daysWaiting(project);
                                return age === 0 ? "today" : `${age}d here`;
                              })()}
                            </span>
                          </Link>
                        </li>
                      ))}
                      {stage.projects.length > 4 && (
                        <li>
                          <Link
                            href="/projects"
                            className="flex min-h-11 items-center px-3 text-xs font-medium text-[var(--text-secondary)]"
                          >
                            +{stage.projects.length - 4} more
                          </Link>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              ))}
              </div>
            </>
          )}
      </section>

      {/* Needs a response: urgent threads, overdue and assigned tasks. */}
      {attention.length > 0 && (
        <section
          id="attention"
          aria-labelledby="attention-heading"
          className="overflow-hidden rounded-2xl border border-[var(--shopify-border)] bg-white shadow-[0_1px_2px_rgb(38_57_74/0.04),0_16px_40px_rgb(38_57_74/0.05)]"
        >
          <div className="overflow-hidden">
            <h2
              id="attention-heading"
              className="flex items-center gap-2 px-6 py-4 text-base font-semibold tracking-tight text-[var(--text-primary)]"
            >
              <AlertCircle className="size-4 text-[var(--shopify-danger)]" aria-hidden />
              Needs a response
            </h2>
            <ul className="divide-y divide-[var(--border-default)]">
              {attention.map(({ project, comment, kind }) => (
                <li key={comment.id}>
                  <Link
                    href={`/projects/${project.id}/agency-review?comment=${comment.id}`}
                    className="flex cursor-pointer items-center gap-3 px-6 py-3.5 transition-colors hover:bg-[var(--info-soft)] focus-visible:bg-[var(--info-soft)]"
                  >
                  {kind === "task" ? (
                    <CheckSquare className="size-4 shrink-0 text-[var(--info)]" aria-hidden />
                  ) : kind === "question" ? (
                    <MessageSquare className="size-4 shrink-0 text-[var(--info)]" aria-hidden />
                  ) : (
                    <AlertCircle
                      className={cn(
                        "size-4 shrink-0",
                        kind === "urgent" ? "text-[var(--shopify-danger)]" : "text-amber-500",
                      )}
                      aria-hidden
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-[var(--text-primary)]">
                      {comment.message.replace(/^\[Question for .*?\]\s*/, "")}
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
                      {project.name}
                      {kind === "overdue" && comment.dueDate
                        ? ` · was due ${new Date(comment.dueDate).toLocaleDateString()}`
                        : ` · ${formatRelative(comment.createdAt)}`}
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section aria-label="Customer and activity updates" className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--shopify-border)] bg-white shadow-[0_1px_2px_rgb(38_57_74/0.04),0_16px_40px_rgb(38_57_74/0.05)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--shopify-border)] px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">Waiting on customer</h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">Approvals and revisions that need a response.</p>
            </div>
            <UsersRound className="size-5 text-[var(--text-muted)]" aria-hidden />
          </div>
          {waitingOnCustomer.length === 0 ? (
            <p className="px-5 py-6 text-sm text-[var(--text-secondary)] sm:px-6">Nothing is waiting on a customer right now.</p>
          ) : (
            <ul className="divide-y divide-[var(--border-default)]">
              {waitingOnCustomer.map(({ project, stage }) => (
                <li key={project.id}>
                  <Link href={stage.href(project)} className="flex min-h-14 items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--shopify-mint-hover)] sm:px-6">
                    <CalendarDays className="size-4 shrink-0 text-[var(--info)]" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-[var(--text-primary)]">{project.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-[var(--text-muted)]">{project.companyName} · {stage.label}</span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--shopify-border)] bg-white shadow-[0_1px_2px_rgb(38_57_74/0.04),0_16px_40px_rgb(38_57_74/0.05)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--shopify-border)] px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">Recent activity</h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">The latest changes across your projects.</p>
            </div>
            <Link href="/activity" className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--shopify-mint-hover)] hover:text-[var(--text-primary)]">
              View all <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <p className="px-5 py-6 text-sm text-[var(--text-secondary)] sm:px-6">Project activity will appear here as work moves forward.</p>
          ) : (
            <ul className="divide-y divide-[var(--border-default)]">
              {recentActivity.map(({ project, entry }) => (
                <li key={entry.id}>
                  <Link href={`/projects/${project.id}/activity`} className="flex min-h-14 items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--shopify-mint-hover)] sm:px-6">
                    <Activity className="size-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-[var(--text-primary)]">{entry.message}</span>
                      <span className="mt-0.5 block truncate text-xs text-[var(--text-muted)]">{entry.actorName} · {project.name} · {formatRelative(entry.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* All projects */}
      <section aria-labelledby="all-projects-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="all-projects-heading"
              className="text-base font-semibold tracking-tight text-[var(--text-primary)]"
            >
              All projects
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">Search the book of work or narrow it by status.</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <label className="relative min-w-[220px] flex-1 sm:flex-none">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden />
              <Input
                aria-label="Search projects"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search projects"
                className="h-11 pl-9 text-sm sm:h-8 sm:text-xs"
              />
            </label>
            <Select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | "all")}
              className="h-8 w-44 text-xs"
            >
              <option value="all">All statuses</option>
              {Object.entries(PROJECT_STATUS_META).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Filter by website type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-8 w-40 text-xs"
            >
              <option value="all">All types</option>
              {websiteTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title={visible.length === 0 ? "No projects yet" : "Nothing matches these filters"}
            description={
              visible.length === 0
                ? "Create your first blueprint — the guided setup takes a few minutes."
                : "Try a different status or website type."
            }
            action={
              visible.length === 0 ? (
                <Link
                  href="/projects/new"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
                >
                  <Sparkles className="size-4" aria-hidden />
                  Create a blueprint
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.slice(0, 6).map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
        {filtered.length > 6 && (
          <p className="text-sm">
            <Link
              href="/projects"
              className="font-medium text-[var(--text-secondary)] underline decoration-[var(--border-strong)] underline-offset-4 hover:text-[var(--text-primary)]"
            >
              View all {filtered.length} projects
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
