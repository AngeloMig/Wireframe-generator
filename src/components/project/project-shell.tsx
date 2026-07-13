"use client";

import { Fragment, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown, FolderX } from "lucide-react";
import { canAccessProject } from "@/lib/org";
import { projectCompletion } from "@/lib/project-utils";
import { PROJECT_STAGE_STEPS, stageIndexOf, stageOf, type ProjectStage } from "@/lib/project-stages";
import { useProject } from "@/hooks/use-project";
import { selectProjectComments, useCommentsStore } from "@/stores/comments-store";
import { useSessionStore } from "@/stores/session-store";
import { type ProjectStatus, type UserRole } from "@/types";
import { cn } from "@/utils/cn";
import { ProjectStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
  DropdownSeparator,
} from "@/components/ui/dropdown-menu";
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

// Only agency staff and admins see this frame (customers get the slim
// editor-first one), so the tabs follow the AGENCY workflow: the review queue
// is their daily surface and earns a first-class tab; the customer-facing
// approval screen sits beside it; assets move under More.
const PROJECT_TABS: ProjectTab[] = [
  { segment: "overview", label: "Overview" },
  { segment: "sitemap", label: "Pages" },
  { segment: "editor", label: "Editor" },
  { segment: "agency-review", label: "Review queue" },
  { segment: "review", label: "Approval" },
  { segment: "activity", label: "Feedback" },
];

// The More menu is grouped by intent instead of being a flat junk drawer.
const MORE_GROUPS: { label: string; tabs: ProjectTab[] }[] = [
  {
    label: "Setup",
    tabs: [
      { segment: "assets", label: "Assets" },
      { segment: "questionnaire", label: "Project brief" },
      { segment: "members", label: "People & access" },
    ],
  },
  {
    label: "History",
    tabs: [
      { segment: "versions", label: "Version history" },
      { segment: "revisions", label: "Revision requests", show: (role) => role === "admin" },
    ],
  },
  {
    label: "Deliver",
    tabs: [{ segment: "handoff", label: "Export handoff" }],
  },
];

/**
 * Which tab carries the stage signal, and what kind: red = the agency's own
 * next action lives there; grey = the other side is acting, but that's the
 * tab to watch while you wait.
 */
const STAGE_SIGNAL: Record<ProjectStage, { segment: string; kind: "action" | "waiting" }> = {
  drafting: { segment: "activity", kind: "waiting" },
  review: { segment: "agency-review", kind: "action" },
  revisions: { segment: "activity", kind: "waiting" },
  approval: { segment: "review", kind: "waiting" },
  approved: { segment: "handoff", kind: "action" },
};

/**
 * Shared frame for all /projects/[projectId]/* routes: project header,
 * autosave status, and tab navigation. Handles loading and unknown IDs.
 */
export function ProjectShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { project, projectId, hydrated } = useProject();
  const user = useSessionStore((s) => s.user);
  // Tab signals: open feedback threads surface as a count on the tab, so the
  // navigation itself says where attention is needed. Loaded here (not per
  // page) because the badge must be correct on every subpage.
  const loadComments = useCommentsStore((s) => s.load);
  const comments = useCommentsStore((s) => selectProjectComments(s, projectId));
  useEffect(() => {
    if (projectId) void loadComments(projectId);
  }, [projectId, loadComments]);

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
  const stageIdx = stageIndexOf(project.status);
  const stage = stageOf(project.status);
  const context = stageContext(activeSegment, project.status, user.role);

  // Smart-tab signals: counts where something waits, a red dot on the tab
  // hosting the current stage's action, and Handoff promoted to a first-class
  // tab once the blueprint is approved.
  const openFeedback = comments.filter(
    (c) => c.status === "open" || c.status === "reopened",
  ).length;
  const badgeFor = (segment: string): number =>
    segment === "activity"
      ? openFeedback
      : segment === "agency-review" && project.status === "ready-for-review"
        ? 1
        : 0;
  const stageSignal = stage ? STAGE_SIGNAL[stage] : null;
  const mainTabs: ProjectTab[] =
    stage === "approved"
      ? [...PROJECT_TABS, { segment: "handoff", label: "Handoff" }]
      : PROJECT_TABS;
  const moreGroups = MORE_GROUPS.map((group) => ({
    ...group,
    tabs: group.tabs.filter(
      (tab) =>
        (!tab.show || tab.show(user.role)) &&
        !mainTabs.some((main) => main.segment === tab.segment),
    ),
  })).filter((group) => group.tabs.length > 0);
  const moreActive =
    moreGroups.some((group) => group.tabs.some((tab) => tab.segment === activeSegment));

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

      {/* The journey: every stage a clickable station, the current one lit. */}
      {stageIdx >= 0 && (
        <nav aria-label="Project stage" className="mt-6 flex items-center">
          {PROJECT_STAGE_STEPS.map((step, index) => {
            const state =
              index < stageIdx ? "done" : index === stageIdx ? "current" : "upcoming";
            return (
              <Fragment key={step.id}>
                {index > 0 && (
                  <span
                    aria-hidden
                    className={cn(
                      "mx-2 h-px min-w-4 flex-1",
                      index <= stageIdx ? "bg-[var(--text-primary)]" : "bg-[var(--border-default)]",
                    )}
                  />
                )}
                <Link
                  href={step.href(projectId, user.role)}
                  aria-current={state === "current" ? "step" : undefined}
                  className="group flex shrink-0 items-center gap-1.5"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "size-2.5 rounded-full transition-colors",
                      state === "current"
                        ? "bg-[#e0492c] ring-4 ring-[#e0492c]/15"
                        : state === "done"
                          ? "bg-[var(--text-primary)]"
                          : "border border-[var(--border-strong)] bg-white",
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs transition-colors group-hover:text-[var(--text-primary)]",
                      state === "current"
                        ? "font-semibold text-[var(--text-primary)]"
                        : state === "done"
                          ? "font-medium text-[var(--text-secondary)]"
                          : "text-[var(--text-muted)]",
                    )}
                  >
                    {step.label}
                  </span>
                </Link>
              </Fragment>
            );
          })}
        </nav>
      )}
      </div>

      <nav
        aria-label="Project sections"
        className="-mx-1 flex items-center gap-2 border-b border-[var(--border-default)] px-1"
      >
        {/* Only the tab list scrolls; the More menu lives outside the
            overflow container so its popover never clips. */}
        <div className="min-w-0 flex-1 overflow-x-auto">
          <ul className="flex min-w-max items-center gap-1">
            {mainTabs.filter((tab) => !tab.show || tab.show(user.role)).map((tab) => {
              const isActive = activeSegment === tab.segment;
              const count = badgeFor(tab.segment);
              const signal =
                stageSignal && stageSignal.segment === tab.segment && count === 0
                  ? stageSignal.kind
                  : null;
              return (
                <li key={tab.segment}>
                  <Link
                    href={`/projects/${projectId}/${tab.segment}`}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "inline-flex items-center border-b-2 px-3 py-3 text-sm font-semibold transition-colors",
                      isActive
                        ? "border-[var(--primary)] text-[var(--primary)]"
                        : "border-transparent text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]",
                    )}
                  >
                    {tab.label}
                    {count > 0 && (
                      <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e0492c] px-1 text-[10px] font-bold text-white">
                        {count}
                        <span className="sr-only"> waiting</span>
                      </span>
                    )}
                    {signal && (
                      <span
                        className={cn(
                          "ml-1.5 inline-block size-1.5 rounded-full",
                          signal === "action" ? "bg-[#e0492c]" : "bg-slate-400",
                        )}
                        role="img"
                        aria-label={
                          signal === "action"
                            ? "Your next action lives here"
                            : "Waiting on the customer — watch here"
                        }
                        title={
                          signal === "action"
                            ? "Your next action lives here"
                            : "Waiting on the customer — watch here"
                        }
                      />
                    )}
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
                  moreActive
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
            {moreGroups.map((group, groupIndex) => (
              <Fragment key={group.label}>
                {groupIndex > 0 && <DropdownSeparator />}
                <DropdownLabel>{group.label}</DropdownLabel>
                {group.tabs.map((tab) => (
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
                      <Check className="size-4 text-[var(--focus-ring)]" aria-hidden />
                    )}
                  </DropdownItem>
                ))}
              </Fragment>
            ))}
          </DropdownMenu>
        </div>
      </nav>

      {context && (
        <p className="rounded-xl bg-[var(--surface-secondary)] px-4 py-2.5 text-sm text-[var(--text-secondary)] ring-1 ring-black/[0.04]">
          {context}
        </p>
      )}

      <div>{children}</div>
    </div>
  );
}

/**
 * One quiet line under the tabs explaining what THIS page means for the
 * project's CURRENT stage — only when there's a real mismatch worth flagging
 * (e.g. opening Approval while the customer is still drafting). Agency-voiced:
 * customers never see this frame.
 */
function stageContext(
  segment: string,
  status: ProjectStatus,
  role: UserRole,
): string | null {
  void role; // frame is agency/admin-only today; kept for future customer tabs
  const stage: ProjectStage | null = stageOf(status);
  if (!stage) return null; // archived projects explain themselves

  if (segment === "review") {
    if (stage === "drafting")
      return "Nothing to approve yet — the customer is still drafting. You'll be notified when they submit.";
    if (stage === "review")
      return "Run the review in the Review queue first, then send the blueprint here for customer approval.";
    if (stage === "revisions")
      return "Changes are with the customer — approval resumes when they resubmit.";
    if (stage === "approved")
      return "Approved — the Export handoff has everything the build team needs.";
  }
  if (segment === "agency-review") {
    if (stage === "drafting")
      return "The queue is empty until the customer submits their blueprint for review.";
    if (stage === "revisions")
      return "You requested changes — the customer is revising now. Their updates land back here.";
    if (stage === "approval")
      return "Sent for customer approval — nothing left to review here for now.";
    if (stage === "approved")
      return "Review complete — this blueprint is approved.";
  }
  if (segment === "handoff" && stage !== "approved") {
    return "The handoff is strongest after approval — this blueprint hasn't been signed off yet.";
  }
  if (segment === "revisions" && stage !== "revisions") {
    return "No revision round is open right now.";
  }
  return null;
}
