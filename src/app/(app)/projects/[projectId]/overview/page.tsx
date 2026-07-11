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
import { CollaborationPanel } from "@/components/collab/collaboration-panel";
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
  const pages = [...project.pages].sort(
    (a, b) => Number(b.isHomepage) - Number(a.isHomepage) || a.order - b.order,
  );

  return (
    <div className="space-y-6">
      {/* Next recommended action */}
      <Card className="border-indigo-200 bg-indigo-50/50">
        <CardBody className="flex flex-wrap items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium tracking-wide text-indigo-600 uppercase">
              Recommended next step
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{action.label}</p>
            <p className="mt-0.5 text-sm text-slate-600">{action.description}</p>
          </div>
          <Link href={action.href}>
            <Button>
              {action.label}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </Link>
        </CardBody>
      </Card>

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
          <span className="text-xs text-amber-700">
            See the collaboration panel below
          </span>
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
            className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <item.icon className="size-5 text-indigo-600" aria-hidden />
            <p className="mt-2.5 text-sm font-semibold text-slate-900 group-hover:text-indigo-700">
              {item.label}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{item.hint}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
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

          {/* Collaboration */}
          <Card>
            <CardBody>
              <CollaborationPanel project={project} defaultScope="project" />
            </CardBody>
          </Card>
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
