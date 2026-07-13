"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown, FolderX } from "lucide-react";
import { canAccessProject } from "@/lib/org";
import { projectCompletion } from "@/lib/project-utils";
import { useProject } from "@/hooks/use-project";
import { useSessionStore } from "@/stores/session-store";
import { isAgencyUser, type UserRole } from "@/types";
import { cn } from "@/utils/cn";
import { ProjectStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownItem, DropdownMenu } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress";
import { PageSkeleton } from "@/components/ui/skeleton";
import { SaveIndicator } from "./save-indicator";

interface ProjectTab {
  segment: string;
  label: string;
  /** Restrict a tab to a role group; omit = everyone. */
  show?: (role: UserRole) => boolean;
}

const PROJECT_TABS: ProjectTab[] = [
  { segment: "overview", label: "Overview" },
  { segment: "sitemap", label: "Pages" },
  { segment: "editor", label: "Editor" },
  { segment: "assets", label: "Content" },
  { segment: "activity", label: "Feedback" },
  { segment: "review", label: "Review" },
];

const MORE_TABS: ProjectTab[] = [
  { segment: "questionnaire", label: "Project brief" },
  { segment: "members", label: "People & access" },
  { segment: "versions", label: "Version history" },
  { segment: "revisions", label: "Revision requests", show: (role) => role === "customer" || role === "admin" },
  { segment: "agency-review", label: "Agency review", show: isAgencyUser },
  { segment: "handoff", label: "Export handoff", show: isAgencyUser },
];

/**
 * Shared frame for all /projects/[projectId]/* routes: project header,
 * autosave status, and tab navigation. Handles loading and unknown IDs.
 */
export function ProjectShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { project, projectId, hydrated } = useProject();
  const user = useSessionStore((s) => s.user);

  if (!hydrated) return <PageSkeleton />;

  const isCustomer = user.role === "customer";

  // Multi-tenant wall: customers see their own projects, agency staff their
  // agency's, the platform admin everything.
  const accessible = project && canAccessProject(project, user);

  if (!project || !accessible) {
    return (
      <EmptyState
        icon={FolderX}
        title="Project not found"
        description={
          isCustomer
            ? "This project isn't shared with you. If you think it should be, get in touch with your agency."
            : "This project doesn't exist in your browser — it may have been deleted or the link is incorrect."
        }
        action={
          <Link href={isCustomer ? "/dashboard" : "/projects"}>
            <Button>{isCustomer ? "Back to your projects" : "Back to projects"}</Button>
          </Link>
        }
        className="mt-10"
      />
    );
  }

  const completion = projectCompletion(project);
  const activeSegment = pathname.split("/")[3] ?? "overview";

  // The editor brings its own toolbar and uses the full viewport.
  if (activeSegment === "editor") {
    return <>{children}</>;
  }

  // Customers see review/revisions as simple status screens hanging off the
  // editor — a slim header instead of the full project-management frame.
  if (isCustomer) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <h1 className="font-display truncate text-lg font-semibold tracking-tight text-[var(--text-primary)]">
              {project.name}
            </h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          <Link href={`/projects/${projectId}/editor`}>
            <Button variant="outline" size="sm">Back to the editor</Button>
          </Link>
        </div>
        <div>{children}</div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className="rounded-[18px] border border-[var(--border-default)] bg-white px-5 py-6 shadow-[var(--shadow-card)] sm:px-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-2 font-mono text-[10px] font-medium tracking-[0.16em] text-[var(--text-muted)] uppercase">Project workspace</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display truncate text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
              {project.name}
            </h1>
            <ProjectStatusBadge status={project.status} />
            <SaveIndicator />
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
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
      </div>

      <nav
        aria-label="Project sections"
        className="-mx-1 flex items-center gap-2 border-b border-[var(--border-default)] px-1"
      >
        {/* Only the tab list scrolls; the More menu lives outside the
            overflow container so its popover never clips. */}
        <div className="min-w-0 flex-1 overflow-x-auto">
          <ul className="flex min-w-max items-center gap-1">
            {PROJECT_TABS.filter((tab) => !tab.show || tab.show(user.role)).map((tab) => {
              const isActive = activeSegment === tab.segment;
              return (
                <li key={tab.segment}>
                  <Link
                    href={`/projects/${projectId}/${tab.segment}`}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "inline-block border-b-2 px-3 py-3 text-sm font-semibold transition-colors",
                      isActive
                        ? "border-[var(--primary)] text-[var(--primary)]"
                        : "border-transparent text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]",
                    )}
                  >
                    {tab.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="shrink-0 pb-1">
          <DropdownMenu
            align="end"
            className="w-52"
            trigger={(props) => (
              <button
                type="button"
                {...props}
                className={cn(
                  "flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  MORE_TABS.some((tab) => tab.segment === activeSegment)
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-white hover:text-[var(--text-primary)]",
                )}
              >
                More
                <ChevronDown
                  className={cn("size-4 transition-transform", props["aria-expanded"] && "rotate-180")}
                  aria-hidden
                />
              </button>
            )}
          >
            {MORE_TABS.filter((tab) => !tab.show || tab.show(user.role)).map((tab) => (
              <DropdownItem
                key={tab.segment}
                onSelect={() => router.push(`/projects/${projectId}/${tab.segment}`)}
              >
                <span
                  className={cn(
                    "flex-1",
                    activeSegment === tab.segment && "font-semibold text-[var(--text-primary)]",
                  )}
                >
                  {tab.label}
                </span>
                {activeSegment === tab.segment && (
                  <Check className="size-4 text-indigo-600" aria-hidden />
                )}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </div>
      </nav>

      <div>{children}</div>
    </div>
  );
}
