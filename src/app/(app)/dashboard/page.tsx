"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckSquare,
  Clock3,
  FolderKanban,
  MessageSquare,
  Plus,
  Sparkles,
} from "lucide-react";
import { PROJECT_STATUS_META } from "@/config/labels";
import { projectsForUser } from "@/lib/org";
import { useCommentsStore } from "@/stores/comments-store";
import { useNotificationsStore } from "@/stores/notifications-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useSessionStore } from "@/stores/session-store";
import type { Project, ProjectComment, ProjectStatus } from "@/types";
import { cn } from "@/utils/cn";
import { formatRelative } from "@/utils/dates";
import { CustomerHome } from "@/components/customer/customer-home";
import { ProjectCard } from "@/components/project/project-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/input";

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
        href: `/projects/${project.id}/agency-review`,
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
            (typeFilter === "all" || p.websiteType === typeFilter),
        )
        .sort((a, b) => b.lastEditedAt.localeCompare(a.lastEditedAt)),
    [visible, statusFilter, typeFilter],
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
    unreadCount > 0 && { label: `${unreadCount} unread`, href: "/activity" },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <div className="animate-fade-in space-y-10">
      {/* Header: the greeting leads; the board below is the show. */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-[2rem] font-semibold leading-[1.1] tracking-tight text-[var(--text-primary)] md:text-[2.5rem]">
            Good to see you, {user.name.split(" ")[0]}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
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
                    className="inline-flex items-center rounded-full border border-[var(--border-default)] bg-white px-3 py-1 text-xs font-semibold text-[var(--text-primary)] shadow-[var(--shadow-subtle)] transition-[transform,border-color] hover:-translate-y-px hover:border-[var(--border-strong)] active:translate-y-0"
                  >
                    {item.label}
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>
        <Link href="/projects/new">
          <Button variant="outline">
            <Plus className="size-4" aria-hidden />
            New project
          </Button>
        </Link>
      </header>

      {/* Next up: the single primary action, presented as machined hardware —
          silver tray (outer shell) cradling a white plate (inner core). */}
      {nextUp && (
        <section
          aria-labelledby="next-up-heading"
          className="rounded-[1.6rem] bg-[var(--surface-secondary)] p-1.5 shadow-[var(--shadow-panel)] ring-1 ring-black/[0.04]"
        >
          <div className="flex flex-wrap items-center gap-5 rounded-[1.2rem] bg-white px-5 py-4 sm:px-6">
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-full rounded-br-none bg-[#e0492c] text-sm font-bold text-white shadow-[0_4px_14px_rgb(224_73_44/0.35)]"
            >
              1
            </span>
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center rounded-full bg-[#e0492c]/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.16em] text-[#e0492c] uppercase">
                Next up
              </span>
              <h2 id="next-up-heading" className="mt-1.5 text-base font-semibold tracking-tight text-[var(--text-primary)]">
                {nextUp.verb} — {nextUp.subject}
              </h2>
              <p className="mt-0.5 truncate text-[13px] text-[var(--text-secondary)]">
                {nextUp.detail}
              </p>
            </div>
            <Link
              href={nextUp.href}
              className="group inline-flex items-center gap-3 rounded-full bg-[#e0492c] py-2.5 pr-2.5 pl-5 text-sm font-semibold text-white shadow-[0_4px_16px_rgb(224_73_44/0.28)] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_8px_24px_rgb(224_73_44/0.38)] active:scale-[0.98]"
            >
              {nextUp.cta}
              <span className="flex size-8 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </Link>
          </div>
        </section>
      )}

      {/* Pulse: the book of work at a glance. Red marks the two metrics that
          actually demand action (waiting on you, and overdue). */}
      {visible.length > 0 && (
        <section aria-label="Pipeline pulse" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
              className="rounded-[1.25rem] bg-white px-5 py-4 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-panel)]"
            >
              <span
                className={cn(
                  "font-display text-3xl font-semibold tabular-nums tracking-tight",
                  stat.value === 0
                    ? "text-[var(--text-muted)]"
                    : stat.action
                      ? "text-[#e0492c]"
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

      {/* At risk: anything that has sat in an actionable stage too long. */}
      {atRisk.length > 0 && (
        <section
          aria-label="At risk"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[1.25rem] border-l-[3px] border-l-[#e0492c] bg-white px-5 py-3.5 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04]"
        >
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#e0492c]">
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
        className="scroll-mt-6 rounded-[1.6rem] bg-[var(--surface-secondary)] p-1.5 shadow-[var(--shadow-panel)] ring-1 ring-black/[0.04]"
      >
        <div className="rounded-[1.2rem] bg-white px-5 pt-5 pb-6 sm:px-7">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
              Review pipeline
            </h2>
            <span className="text-xs text-[var(--text-muted)]">
              {visible.length} project{visible.length === 1 ? "" : "s"}
            </span>
          </div>
          {visible.length === 0 ? (
            <p className="mt-6 pb-2 text-sm text-[var(--text-secondary)]">
              No projects on the board yet — start one and it appears here, moving
              station by station from draft to approved.
            </p>
          ) : (
            <div className="mt-6 overflow-x-auto">
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
                            active ? "bg-[#e0492c]" : "bg-[var(--border-strong)]",
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
                                className="group block rounded-xl bg-white px-3 py-2.5 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-panel)] active:translate-y-0"
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
                                        "font-semibold text-[#e0492c]",
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
          )}
        </div>
      </section>

      {/* Needs a response: urgent threads, overdue and assigned tasks. */}
      {attention.length > 0 && (
        <section
          id="attention"
          aria-labelledby="attention-heading"
          className="overflow-hidden rounded-[1.6rem] bg-[var(--surface-secondary)] p-1.5 shadow-[var(--shadow-panel)] ring-1 ring-black/[0.04]"
        >
          <div className="overflow-hidden rounded-[1.2rem] bg-white">
          <h2
            id="attention-heading"
            className="flex items-center gap-2 px-6 py-4 text-base font-semibold tracking-tight text-[var(--text-primary)]"
          >
            <AlertCircle className="size-4 text-[#e0492c]" aria-hidden />
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
                        kind === "urgent" ? "text-[#e0492c]" : "text-amber-500",
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

      {/* All projects */}
      <section aria-labelledby="all-projects-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="all-projects-heading"
            className="text-base font-semibold tracking-tight text-[var(--text-primary)]"
          >
            All projects
          </h2>
          <div className="flex items-center gap-2">
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
                <Link href="/projects/new">
                  <Button>
                    <Sparkles className="size-4" aria-hidden />
                    Create a blueprint
                  </Button>
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
