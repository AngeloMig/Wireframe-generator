"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderX } from "lucide-react";
import { projectCompletion } from "@/lib/project-utils";
import { useProject } from "@/hooks/use-project";
import { cn } from "@/utils/cn";
import { ProjectStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress";
import { PageSkeleton } from "@/components/ui/skeleton";
import { SaveIndicator } from "./save-indicator";

const PROJECT_TABS = [
  { segment: "overview", label: "Overview" },
  { segment: "questionnaire", label: "Questionnaire" },
  { segment: "sitemap", label: "Pages & Sitemap" },
  { segment: "editor", label: "Editor" },
  { segment: "assets", label: "Assets" },
  { segment: "activity", label: "Activity" },
  { segment: "review", label: "Review" },
] as const;

/**
 * Shared frame for all /projects/[projectId]/* routes: project header,
 * autosave status, and tab navigation. Handles loading and unknown IDs.
 */
export function ProjectShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { project, projectId, hydrated } = useProject();

  if (!hydrated) return <PageSkeleton />;

  if (!project) {
    return (
      <EmptyState
        icon={FolderX}
        title="Project not found"
        description="This project doesn't exist in your browser — it may have been deleted or the link is incorrect."
        action={
          <Link href="/projects">
            <Button>Back to projects</Button>
          </Link>
        }
      />
    );
  }

  const completion = projectCompletion(project);
  const activeSegment = pathname.split("/")[3] ?? "overview";

  // The editor brings its own toolbar and uses the full viewport.
  if (activeSegment === "editor") {
    return <>{children}</>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900">
              {project.name}
            </h1>
            <ProjectStatusBadge status={project.status} />
            <SaveIndicator />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {project.companyName} · {project.websiteType}
          </p>
        </div>
        <div className="w-full max-w-45">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-slate-500">Completion</span>
            <span className="font-medium text-slate-700">{completion}%</span>
          </div>
          <ProgressBar value={completion} label={`${project.name} completion`} />
        </div>
      </div>

      <nav aria-label="Project sections" className="-mx-1 overflow-x-auto">
        <ul className="flex min-w-max items-center gap-1 border-b border-slate-200 px-1">
          {PROJECT_TABS.map((tab) => {
            const isActive = activeSegment === tab.segment;
            return (
              <li key={tab.segment}>
                <Link
                  href={`/projects/${projectId}/${tab.segment}`}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "inline-block border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "border-indigo-600 text-indigo-700"
                      : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900",
                  )}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div>{children}</div>
    </div>
  );
}
