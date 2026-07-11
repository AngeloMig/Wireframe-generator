"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  Clock,
  FolderKanban,
  MessageSquare,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PROJECT_STATUS_META, ROLE_LABELS } from "@/config/labels";
import { nextRecommendedAction, projectCompletion } from "@/lib/project-utils";
import { useCommentsStore } from "@/stores/comments-store";
import { useNotificationsStore } from "@/stores/notifications-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useSessionStore } from "@/stores/session-store";
import type { Project, ProjectComment, ProjectStatus } from "@/types";
import { formatRelative } from "@/utils/dates";
import { CustomerHome } from "@/components/customer/customer-home";
import { ProjectCard } from "@/components/project/project-card";
import { ProjectStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/input";

const ACTION_STATUSES: ProjectStatus[] = [
  "revisions-requested",
  "customer-revising",
  "awaiting-approval",
  "partially-approved",
];

function StatusSummary({ projects }: { projects: Project[] }) {
  const counts = new Map<ProjectStatus, number>();
  projects.forEach((p) => counts.set(p.status, (counts.get(p.status) ?? 0) + 1));
  const entries = Array.from(counts.entries());
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([status, count]) => (
        <span
          key={status}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm"
        >
          <span className="font-semibold text-slate-900">{count}</span>
          <span className="text-slate-500">{PROJECT_STATUS_META[status].label}</span>
        </span>
      ))}
    </div>
  );
}

/** Cross-project collaboration signals for the current user. */
function useCollabSignals(projects: Project[], userId: string, isAgency: boolean) {
  const load = useCommentsStore((s) => s.load);
  const byProject = useCommentsStore((s) => s.byProject);

  useEffect(() => {
    for (const project of projects) void load(project.id);
  }, [projects, load]);

  return useMemo(() => {
    const all: { project: Project; comment: ProjectComment }[] = [];
    for (const project of projects) {
      for (const comment of byProject[project.id] ?? []) {
        if (!isAgency && comment.visibility === "agency") continue;
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
    const upcoming = all
      .filter(
        ({ comment }) =>
          comment.isActionItem &&
          !comment.completedAt &&
          comment.dueDate &&
          new Date(comment.dueDate) >= new Date(),
      )
      .sort((a, b) => (a.comment.dueDate ?? "").localeCompare(b.comment.dueDate ?? ""));
    return { myActionItems, urgent, overdue, upcoming };
  }, [projects, byProject, userId, isAgency]);
}

export default function DashboardPage() {
  const isCustomer = useSessionStore((s) => s.user.role === "customer");
  // Customers get the focused workspace entry, never the dashboard.
  if (isCustomer) return <CustomerHome />;
  return <AgencyDashboard />;
}

function AgencyDashboard() {
  const projects = useProjectsStore((s) => s.projects);
  const user = useSessionStore((s) => s.user);
  const notifications = useNotificationsStore((s) => s.notifications);
  const isAgencySide = user.role !== "customer";

  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const visible = useMemo(
    () => projects.filter((p) => p.status !== "archived"),
    [projects],
  );

  const signals = useCollabSignals(visible, user.id, isAgencySide);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const websiteTypes = useMemo(
    () => [...new Set(visible.map((p) => p.websiteType))].sort(),
    [visible],
  );

  const filtered = useMemo(
    () =>
      visible.filter(
        (p) =>
          (statusFilter === "all" || p.status === statusFilter) &&
          (typeFilter === "all" || p.websiteType === typeFilter),
      ),
    [visible, statusFilter, typeFilter],
  );

  const recent = useMemo(
    () =>
      [...filtered]
        .sort((a, b) => b.lastEditedAt.localeCompare(a.lastEditedAt))
        .slice(0, 6),
    [filtered],
  );

  const firstName = user.name.split(" ")[0];

  // Role-specific queues.
  const agencyQueues = useMemo(() => {
    if (!isAgencySide) return null;
    return {
      readyForReview: visible.filter((p) => p.status === "ready-for-review"),
      reviewing: visible.filter((p) => p.status === "agency-reviewing"),
      awaitingRevisions: visible.filter(
        (p) => p.status === "revisions-requested" || p.status === "customer-revising",
      ),
      awaitingApproval: visible.filter(
        (p) => p.status === "awaiting-approval" || p.status === "partially-approved",
      ),
      recentlyApproved: visible.filter(
        (p) =>
          p.status === "approved" ||
          p.status === "in-development" ||
          p.status === "completed",
      ),
    };
  }, [visible, isAgencySide]);

  const customerNeedsAction = useMemo(
    () => visible.filter((p) => ACTION_STATUSES.includes(p.status)),
    [visible],
  );
  const focusProject = customerNeedsAction[0] ?? recent[0] ?? null;
  const focusAction = focusProject ? nextRecommendedAction(focusProject) : null;

  return (
    <div className="space-y-9">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-bold tracking-[0.12em] text-[var(--primary)] uppercase">Your workspace</p>
          <h1 className="text-3xl font-bold tracking-[-0.035em] text-[var(--text-primary)]">
            {isAgencySide ? `Good to see you, ${firstName}` : `Welcome back, ${firstName}`}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isAgencySide
              ? `You're viewing as ${ROLE_LABELS[user.role]} — review customer blueprints and keep projects moving.`
              : "Let’s keep your website moving—one clear step at a time."}
          </p>
        </div>
        <Link href="/projects/new">
          <Button size="lg">
            <Plus className="size-4.5" aria-hidden />
            Start a new project
          </Button>
        </Link>
      </div>

      {!isAgencySide && focusProject && focusAction && (
        <section className="relative overflow-hidden rounded-[1.5rem] border border-[#cadeD6] bg-[#173f36] px-6 py-7 text-white shadow-[0_22px_55px_rgb(23_63_54/0.18)] sm:px-8 sm:py-9" aria-labelledby="next-step-heading">
          <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_center,rgb(229_180_111/0.22),transparent_65%)]" aria-hidden />
          <div className="relative max-w-2xl">
            <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-emerald-100">
              <span className="flex size-7 items-center justify-center rounded-full bg-white/10"><Sparkles className="size-3.5" aria-hidden /></span>
              Recommended next step
            </div>
            <h2 id="next-step-heading" className="text-2xl font-bold tracking-[-0.025em] sm:text-3xl">{focusAction.label}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50/80 sm:text-base">{focusAction.description}</p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link href={focusAction.href}><Button size="lg" className="bg-[#f3b96c] text-[#24332e] shadow-none hover:bg-[#ffc77d]">{focusAction.label}<ArrowRight className="size-4" aria-hidden /></Button></Link>
              <Link href={`/projects/${focusProject.id}/overview`} className="text-sm font-semibold text-white/80 hover:text-white">View project overview</Link>
            </div>
            <div className="mt-7 flex max-w-lg items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#f3b96c]" style={{ width: `${projectCompletion(focusProject)}%` }} /></div>
              <span className="text-xs font-semibold text-white/70">{projectCompletion(focusProject)}% complete</span>
            </div>
          </div>
        </section>
      )}

      {/* Agency signals stay compact; customer signals live in the guided action area. */}
      {isAgencySide && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SignalTile
          icon={CheckSquare}
          label="Action items for you"
          value={signals.myActionItems.length}
          tone={signals.myActionItems.length > 0 ? "amber" : "slate"}
        />
        <SignalTile
          icon={MessageSquare}
          label="Unread notifications"
          value={unreadCount}
          tone={unreadCount > 0 ? "indigo" : "slate"}
        />
        <SignalTile
          icon={AlertCircle}
          label={isAgencySide ? "Urgent comments" : "Overdue actions"}
          value={isAgencySide ? signals.urgent.length : signals.overdue.length}
          tone={
            (isAgencySide ? signals.urgent.length : signals.overdue.length) > 0
              ? "rose"
              : "slate"
          }
        />
        <SignalTile
          icon={ShieldCheck}
          label={isAgencySide ? "Awaiting customer approval" : "Ready for your approval"}
          value={
            isAgencySide
              ? (agencyQueues?.awaitingApproval.length ?? 0)
              : visible.filter(
                  (p) =>
                    p.status === "awaiting-approval" || p.status === "partially-approved",
                ).length
          }
          tone="emerald"
        />
      </div>}

      {isAgencySide && <StatusSummary projects={visible} />}

      {/* Customer: priority actions */}
      {!isAgencySide && (customerNeedsAction.length > 0 || signals.myActionItems.length > 0) && (
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <AlertCircle className="size-4 text-amber-500" aria-hidden />
                Needs your attention
              </span>
            }
            description="Revisions, approvals, and action items waiting for you."
          />
          <CardBody className="divide-y divide-slate-100 p-0">
            {customerNeedsAction.map((project) => {
              const action = nextRecommendedAction(project);
              return (
                <div key={project.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/projects/${project.id}/overview`}
                      className="text-sm font-medium text-slate-900 hover:text-indigo-700"
                    >
                      {project.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-500">{action.description}</p>
                  </div>
                  <ProjectStatusBadge status={project.status} />
                  <Link href={action.href}>
                    <Button variant="outline" size="sm">
                      {action.label}
                      <ArrowRight className="size-3.5" aria-hidden />
                    </Button>
                  </Link>
                </div>
              );
            })}
            {signals.myActionItems.slice(0, 4).map(({ project, comment }) => (
              <div key={comment.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <CheckSquare className="size-4 shrink-0 text-indigo-500" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-800">{comment.message}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {project.name}
                    {comment.dueDate &&
                      ` · due ${new Date(comment.dueDate).toLocaleDateString()}`}
                  </p>
                </div>
                <Link href={`/projects/${project.id}/revisions`}>
                  <Button variant="outline" size="sm">
                    Open
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Button>
                </Link>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* Agency: work queues */}
      {isAgencySide && agencyQueues && (
        <div className="grid gap-4 lg:grid-cols-2">
          <QueueCard
            title="Ready for review"
            description="Submitted by customers — start here."
            projects={agencyQueues.readyForReview}
            cta="Start review"
            href={(p) => `/projects/${p.id}/agency-review`}
          />
          <QueueCard
            title="In review"
            description="Reviews in progress."
            projects={agencyQueues.reviewing}
            cta="Continue review"
            href={(p) => `/projects/${p.id}/agency-review`}
          />
          <QueueCard
            title="Waiting on customer revisions"
            description="Customers are working through your feedback."
            projects={agencyQueues.awaitingRevisions}
            cta="View project"
            href={(p) => `/projects/${p.id}/overview`}
          />
          <QueueCard
            title="Awaiting customer approval"
            description="Sent for approval — nudge if needed."
            projects={agencyQueues.awaitingApproval}
            cta="View status"
            href={(p) => `/projects/${p.id}/review`}
          />
        </div>
      )}

      {/* Agency: urgent comments + overdue items */}
      {isAgencySide && (signals.urgent.length > 0 || signals.overdue.length > 0) && (
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <AlertCircle className="size-4 text-rose-500" aria-hidden />
                Urgent & overdue
              </span>
            }
          />
          <CardBody className="divide-y divide-slate-100 p-0">
            {[...signals.urgent, ...signals.overdue].slice(0, 6).map(({ project, comment }) => (
              <div key={comment.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-800">{comment.message}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {project.name} · {formatRelative(comment.createdAt)}
                    {comment.dueDate &&
                      ` · due ${new Date(comment.dueDate).toLocaleDateString()}`}
                  </p>
                </div>
                <Link href={`/projects/${project.id}/overview`}>
                  <Button variant="outline" size="sm">
                    Open
                  </Button>
                </Link>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      <section aria-labelledby="recent-projects-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2
            id="recent-projects-heading"
            className="inline-flex items-center gap-2 text-base font-semibold text-slate-900"
          >
            <Clock className="size-4 text-slate-400" aria-hidden />
            {isAgencySide ? "Projects" : "Recently edited"}
          </h2>
          <div className="flex items-center gap-2">
            {isAgencySide && (
              <>
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
              </>
            )}
            <Link
              href="/projects"
              className="text-sm font-medium whitespace-nowrap text-indigo-600 hover:text-indigo-800"
            >
              View all
            </Link>
          </div>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title={visible.length === 0 ? "No projects yet" : "Nothing matches these filters"}
            description={
              visible.length === 0
                ? "Create your first website blueprint — a guided wizard will walk you through it in a few minutes."
                : "Try different filters."
            }
            action={
              visible.length === 0 ? (
                <Link href="/projects/new">
                  <Button>
                    <Sparkles className="size-4" aria-hidden />
                    Create your first blueprint
                  </Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recent.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      {!isAgencySide && visible.length > 0 && (
        <Card>
          <CardBody className="flex flex-wrap items-center gap-3">
            <CheckCircle2 className="size-5 text-emerald-500" aria-hidden />
            <p className="flex-1 text-sm text-slate-600">
              Everything you build is saved automatically in this browser. When you&apos;re
              happy with a blueprint, submit it from the project&apos;s review page.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function SignalTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CheckSquare;
  label: string;
  value: number;
  tone: "slate" | "amber" | "indigo" | "rose" | "emerald";
}) {
  const tones: Record<string, string> = {
    slate: "text-slate-400",
    amber: "text-amber-500",
    indigo: "text-indigo-500",
    rose: "text-rose-500",
    emerald: "text-emerald-500",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <Icon className={`size-5 ${tones[tone]}`} aria-hidden />
      <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function QueueCard({
  title,
  description,
  projects,
  cta,
  href,
}: {
  title: string;
  description: string;
  projects: Project[];
  cta: string;
  href: (p: Project) => string;
}) {
  return (
    <Card>
      <CardHeader title={`${title} (${projects.length})`} description={description} />
      <CardBody className="divide-y divide-slate-100 p-0">
        {projects.length === 0 ? (
          <p className="px-5 py-5 text-sm text-slate-500">Nothing here right now.</p>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="flex items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{project.name}</p>
                <p className="text-xs text-slate-500">
                  {project.companyName} · updated {formatRelative(project.lastEditedAt)}
                </p>
              </div>
              <Link href={href(project)}>
                <Button variant="outline" size="sm">
                  {cta}
                </Button>
              </Link>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
}
