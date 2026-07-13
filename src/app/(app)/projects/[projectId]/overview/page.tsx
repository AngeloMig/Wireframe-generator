"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  Circle,
  ClipboardList,
  FileStack,
  ImageIcon,
  LayoutGrid,
  MessageSquare,
  Network,
  Send,
  Settings2,
  Sparkles,
} from "lucide-react";
import { PLATFORM_OPTIONS } from "@/config/options";
import { PROJECT_STATUS_META } from "@/config/labels";
import {
  nextRecommendedAction,
  projectChecklist,
  projectCompletion,
} from "@/lib/project-utils";
import { stageOf } from "@/lib/project-stages";
import { useProject } from "@/hooks/use-project";
import { useCollabUiStore } from "@/stores/collab-ui-store";
import { selectProjectComments, useCommentsStore } from "@/stores/comments-store";
import { useSessionStore } from "@/stores/session-store";
import { CollabDrawer } from "@/components/collab/collab-drawer";
import { PageSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";
import { PageStatusBadge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";

export default function ProjectOverviewPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProjectOverview />
    </Suspense>
  );
}

function ProjectOverview() {
  const { project, projectId } = useProject();
  const user = useSessionStore((s) => s.user);
  const loadComments = useCommentsStore((s) => s.load);
  const allComments = useCommentsStore((s) => selectProjectComments(s, projectId));
  const selectComment = useCollabUiStore((s) => s.selectComment);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (projectId) void loadComments(projectId);
  }, [projectId, loadComments]);

  // Deep links from copied comment URLs and search results.
  const commentParam = searchParams.get("comment");
  useEffect(() => {
    if (commentParam) selectComment(commentParam);
  }, [commentParam, selectComment]);

  if (!project) return null; // ProjectShell handles loading and not-found.

  const base = `/projects/${projectId}`;
  const checklist = projectChecklist(project);
  const completion = projectCompletion(project);
  const missing = checklist.filter((i) => !i.done);
  const action = nextRecommendedAction(project, user.role);
  const stage = stageOf(project.status);
  const statusMeta = PROJECT_STATUS_META[project.status];
  const q = project.questionnaire;
  const platformLabel =
    PLATFORM_OPTIONS.find((p) => p.value === q.platform)?.label ?? "Not sure yet";
  const visibleComments = allComments.filter(
    (c) => user.role !== "customer" || c.visibility === "customer",
  );
  const openActionItems = visibleComments.filter((c) => c.isActionItem && !c.completedAt);
  const myActionItems = openActionItems.filter((c) => c.assignedToId === user.id);
  const openThreads = visibleComments.filter(
    (c) => !c.isActionItem && (c.status === "open" || c.status === "reopened"),
  );
  const urgentOpen = visibleComments.filter(
    (c) => (c.status === "open" || c.status === "reopened") && c.priority === "urgent",
  );
  const resolvedCount = visibleComments.filter((c) => c.status === "resolved").length;
  const pages = [...project.pages].sort(
    (a, b) => Number(b.isHomepage) - Number(a.isHomepage) || a.order - b.order,
  );

  return (
    <div className="space-y-8">
      {/* The next recommended action, as machined hardware — silver tray
          cradling a white plate, matching the dashboard's "Next up". */}
      <section className="rounded-[1.75rem] bg-[var(--surface-secondary)] p-1.5 shadow-[var(--shadow-panel)] ring-1 ring-black/[0.04]">
        <div className="grid gap-8 rounded-[1.45rem] bg-white p-6 sm:p-8 lg:grid-cols-[1fr_300px] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e0492c]/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.16em] text-[#e0492c] uppercase">
              <Sparkles className="size-3" aria-hidden /> Next step
            </span>
            <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              {action.label}
            </h2>
            <p className="mt-2.5 max-w-xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
              {action.description}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href={action.href}
                className="group inline-flex items-center gap-3 rounded-full bg-[#e0492c] py-2.5 pr-2.5 pl-5 text-sm font-semibold text-white shadow-[0_4px_16px_rgb(224_73_44/0.28)] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_8px_24px_rgb(224_73_44/0.38)] active:scale-[0.98]"
              >
                {action.cta ?? action.label}
                <span className="flex size-8 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                  <ArrowRight className="size-4" aria-hidden />
                </span>
              </Link>
              <span className="text-sm text-[var(--text-muted)]">{statusMeta.label}</span>
            </div>
          </div>
          <div className="rounded-[1.1rem] bg-[var(--surface-secondary)] p-4 ring-1 ring-black/[0.05]">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span className="font-medium">Blueprint progress</span>
              <span className="font-bold text-[var(--text-primary)]">{completion}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/[0.06]">
              <div className="h-full rounded-full bg-[var(--text-primary)] transition-all duration-500" style={{ width: `${completion}%` }} />
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">
              {missing.length ? `${missing.length} checklist ${missing.length === 1 ? "item still needs" : "items still need"} attention.` : "Everything is ready for the next step."}
            </p>
          </div>
        </div>
      </section>

      {/* Open action items */}
      {openActionItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <MessageSquare className="size-4 shrink-0 text-amber-600" aria-hidden />
          <p className="min-w-0 flex-1 text-sm text-amber-900">
            {openActionItems.length} open action item
            {openActionItems.length === 1 ? "" : "s"}
            {myActionItems.length > 0 && (
              <span className="font-semibold"> — {myActionItems.length} assigned to you</span>
            )}
          </p>
          <Link
            href={`${base}/activity`}
            className="text-xs font-medium text-amber-800 hover:underline"
          >
            Review in Feedback →
          </Link>
        </div>
      )}

      {/* Primary actions — the third card follows the project's stage, so the
          workflow action here always matches what the agency should do next. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            href: `${base}/editor`,
            icon: LayoutGrid,
            label: "Open the Editor",
            hint: "View and edit the wireframes",
          },
          {
            href: `${base}/sitemap`,
            icon: Network,
            label: "Manage Pages",
            hint: "Pages, structure, and sitemap",
          },
          stage === "review"
            ? {
                href: `${base}/agency-review`,
                icon: Send,
                label: "Review Queue",
                hint: "The submitted blueprint awaits review",
              }
            : stage === "revisions"
              ? {
                  href: `${base}/activity`,
                  icon: Send,
                  label: "Track Revisions",
                  hint: "The customer is making your changes",
                }
              : stage === "approval"
                ? {
                    href: `${base}/review`,
                    icon: Send,
                    label: "Approval Status",
                    hint: "Waiting on the customer's sign-off",
                  }
                : stage === "approved"
                  ? {
                      href: `${base}/handoff`,
                      icon: Send,
                      label: "Export Handoff",
                      hint: "Package the blueprint for the build",
                    }
                  : {
                      href: `${base}/activity`,
                      icon: Send,
                      label: "Customer Activity",
                      hint: "Follow the drafting progress",
                    },
          {
            href: `${base}/questionnaire`,
            icon: Settings2,
            label: "Project Brief",
            hint: "Questionnaire and goals",
          },
        ].map((item) => (
          <Link
            key={item.href + item.label}
            href={item.href}
            className="group rounded-[1.25rem] bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-[var(--shadow-panel)]"
          >
            <span className="flex size-10 items-center justify-center rounded-[0.9rem] bg-[var(--surface-secondary)] ring-1 ring-black/[0.04] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5"><item.icon className="size-5 text-[var(--text-primary)]" aria-hidden /></span>
            <p className="mt-3.5 text-sm font-semibold text-[var(--text-primary)]">
              {item.label}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{item.hint}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.75fr)]">
        <div className="space-y-6 lg:col-span-2">
          {/* Pages */}
          <Card>
            <CardHeader
              title={
                <span className="inline-flex items-center gap-2">
                  <FileStack className="size-4 text-slate-400" aria-hidden />
                  Pages ({project.pages.length})
                </span>
              }
              action={
                <Link
                  href={`${base}/sitemap`}
                  className="text-sm font-medium text-[var(--focus-ring)] hover:underline"
                >
                  Manage pages
                </Link>
              }
            />
            <CardBody className="divide-y divide-slate-100 p-0">
              {pages.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-500">
                  No pages yet — add your homepage from the sitemap.
                </p>
              ) : (
                pages.slice(0, 6).map((page) => (
                  <div key={page.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {page.name}
                        {page.isHomepage && (
                          <span className="ml-2 rounded-full bg-[var(--info-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--info-text)]">
                            Homepage
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500">
                        {page.sections.length}{" "}
                        {page.sections.length === 1 ? "section" : "sections"}
                      </p>
                    </div>
                    <PageStatusBadge status={page.status} />
                  </div>
                ))
              )}
              {pages.length > 6 && (
                <p className="px-5 py-3 text-xs text-slate-500">
                  + {pages.length - 6} more in the sitemap
                </p>
              )}
            </CardBody>
          </Card>

          {/* Feedback triage — a summary that links out, not the full thread wall */}
          <Card>
            <CardHeader
              title="Feedback"
              action={
                <Link
                  href={`/projects/${projectId}/activity`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-[var(--focus-ring)] hover:underline"
                >
                  Open feedback
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              }
            />
            <CardBody>
              {visibleComments.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  No feedback yet. Comments and requested changes will show up here.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <TriageStat label="Open threads" value={openThreads.length} />
                    <TriageStat
                      label={myActionItems.length > 0 ? "Tasks for you" : "Action items"}
                      value={myActionItems.length > 0 ? myActionItems.length : openActionItems.length}
                      tone={myActionItems.length > 0 ? "attention" : "default"}
                    />
                    <TriageStat
                      label="Urgent"
                      value={urgentOpen.length}
                      tone={urgentOpen.length > 0 ? "urgent" : "default"}
                    />
                    <TriageStat label="Resolved" value={resolvedCount} tone="muted" />
                  </div>
                  {(urgentOpen.length > 0 || myActionItems.length > 0) && (
                    <p className="mt-3 text-sm text-[var(--text-secondary)]">
                      {urgentOpen.length > 0
                        ? `${urgentOpen.length} urgent ${urgentOpen.length === 1 ? "item needs" : "items need"} attention.`
                        : `${myActionItems.length} ${myActionItems.length === 1 ? "task is" : "tasks are"} assigned to you.`}{" "}
                      <Link
                        href={`/projects/${projectId}/activity`}
                        className="font-medium text-[var(--focus-ring)] hover:underline"
                      >
                        Review in Feedback →
                      </Link>
                    </p>
                  )}
                </>
              )}
            </CardBody>
          </Card>
          <CollabDrawer project={project} />
        </div>

        <div className="space-y-6">
          {/* Status + completion */}
          <Card>
            <CardHeader title="Status" />
            <CardBody className="space-y-4">
              <p className="text-sm text-slate-600">{statusMeta.description}</p>
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Completion</span>
                  <span className="font-medium text-slate-700">{completion}%</span>
                </div>
                <ProgressBar value={completion} />
              </div>
              <ul className="space-y-2">
                {checklist.map((item) => (
                  <li key={item.id} className="flex items-start gap-2 text-sm">
                    {item.done ? (
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden />
                    ) : (
                      <Circle className="mt-0.5 size-4 shrink-0 text-slate-300" aria-hidden />
                    )}
                    <span className={cn(item.done ? "text-slate-500" : "text-slate-800")}>
                      {item.label}
                      {!item.required && (
                        <span className="ml-1 text-xs text-slate-400">optional</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              {missing.filter((i) => i.required).length > 0 && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  {missing.filter((i) => i.required).length} required{" "}
                  {missing.filter((i) => i.required).length === 1 ? "item" : "items"} left
                  before you can submit for review.
                </p>
              )}
            </CardBody>
          </Card>

          {/* Project information */}
          <Card>
            <CardHeader
              title={
                <span className="inline-flex items-center gap-2">
                  <ClipboardList className="size-4 text-slate-400" aria-hidden />
                  Project information
                </span>
              }
              action={
                <Link
                  href={`${base}/questionnaire`}
                  className="text-sm font-medium text-[var(--focus-ring)] hover:underline"
                >
                  Edit
                </Link>
              }
            />
            <CardBody>
              <dl className="space-y-3 text-sm">
                {[
                  ["Company", project.companyName],
                  ["Industry", q.industry || "—"],
                  ["Platform", platformLabel],
                  ["Estimated pages", q.estimatedPages || "—"],
                  ["Target audience", q.targetAudience || "—"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-slate-500">{label}</dt>
                    <dd className="mt-0.5 text-slate-800">{value}</dd>
                  </div>
                ))}
                {q.mainGoal && (
                  <div>
                    <dt className="text-xs text-slate-500">Main goal</dt>
                    <dd className="mt-0.5 text-slate-800">{q.mainGoal}</dd>
                  </div>
                )}
              </dl>
            </CardBody>
          </Card>

          {/* Assets */}
          <Card>
            <CardHeader
              title={
                <span className="inline-flex items-center gap-2">
                  <ImageIcon className="size-4 text-slate-400" aria-hidden />
                  Assets ({project.assets.length})
                </span>
              }
              action={
                <Link
                  href={`${base}/assets`}
                  className="text-sm font-medium text-[var(--focus-ring)] hover:underline"
                >
                  View all
                </Link>
              }
            />
            <CardBody>
              {project.assets.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No uploads yet. Add logos and brand imagery so the agency can reference
                  them.
                </p>
              ) : (
                <ul className="space-y-2 text-sm text-slate-700">
                  {project.assets.slice(0, 4).map((asset) => (
                    <li key={asset.id} className="flex items-center gap-2">
                      <ImageIcon className="size-4 shrink-0 text-slate-400" aria-hidden />
                      <span className="truncate">{asset.name}</span>
                      <span className="ml-auto text-xs text-slate-400 capitalize">
                        {asset.kind}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TriageStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "attention" | "urgent" | "muted";
}) {
  const valueColor =
    value === 0
      ? "text-[var(--text-muted)]"
      : tone === "urgent"
        ? "text-[var(--danger)]"
        : tone === "attention"
          ? "text-[var(--warning-text)]"
          : tone === "muted"
            ? "text-[var(--text-secondary)]"
            : "text-[var(--text-primary)]";
  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary)] px-3 py-2.5">
      <p className={cn("font-display text-2xl font-semibold tracking-tight tabular-nums", valueColor)}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{label}</p>
    </div>
  );
}
