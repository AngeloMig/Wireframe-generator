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
import { useProject } from "@/hooks/use-project";
import { useCollabUiStore } from "@/stores/collab-ui-store";
import { selectProjectComments, useCommentsStore } from "@/stores/comments-store";
import { useSessionStore } from "@/stores/session-store";
import { CollabDrawer } from "@/components/collab/collab-drawer";
import { PageSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";
import { PageStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const action = nextRecommendedAction(project);
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
      {/* Project command center */}
      <section className="relative overflow-hidden rounded-[1.5rem] border border-[#285d4f] bg-[#173f36] px-6 py-7 text-white shadow-[0_22px_55px_rgb(23_63_54/0.18)] sm:px-8 sm:py-8">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgb(229_180_111/0.2),transparent_65%)]" aria-hidden />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_280px] lg:items-end">
          <div>
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-100"><span className="flex size-7 items-center justify-center rounded-full bg-white/10"><Sparkles className="size-3.5" aria-hidden /></span>Project workspace</div>
            <h2 className="max-w-2xl text-3xl font-bold tracking-[-0.04em] sm:text-4xl">{action.label}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50/80 sm:text-base">{action.description}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3"><Link href={action.href}><Button size="lg" className="bg-[#f3b96c] text-[#24332e] shadow-none hover:bg-[#ffc77d]">{action.label}<ArrowRight className="size-4" aria-hidden /></Button></Link><span className="text-sm text-white/70">{statusMeta.label}</span></div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm"><div className="flex items-center justify-between text-xs text-emerald-50/80"><span>Blueprint progress</span><span className="font-bold text-white">{completion}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#f3b96c]" style={{ width: `${completion}%` }} /></div><p className="mt-3 text-xs leading-5 text-emerald-50/70">{missing.length ? `${missing.length} checklist item${missing.length === 1 ? "" : "s"} still need attention.` : "Everything is ready for the next step."}</p></div>
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

      {/* Primary actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            href: `${base}/editor`,
            icon: LayoutGrid,
            label: "Continue Building",
            hint: "Open the wireframe editor",
          },
          {
            href: `${base}/sitemap`,
            icon: Network,
            label: "View Sitemap",
            hint: "Manage pages and structure",
          },
          {
            href: `${base}/review`,
            icon: Send,
            label: "Submit for Review",
            hint: "Send the blueprint to the agency",
          },
          {
            href: `${base}/questionnaire`,
            icon: Settings2,
            label: "Project Settings",
            hint: "Update the questionnaire",
          },
        ].map((item) => (
          <Link
            key={item.href + item.label}
            href={item.href}
            className="group rounded-[var(--radius-large)] border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)] transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-panel)]"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--primary-soft)]"><item.icon className="size-4.5 text-[var(--primary)]" aria-hidden /></span>
            <p className="mt-3 text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)]">
              {item.label}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{item.hint}</p>
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
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
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
                          <span className="ml-2 rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] font-medium text-indigo-600">
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
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
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
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
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
