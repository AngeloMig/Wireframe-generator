"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckSquare,
  FolderOpen,
  Lightbulb,
  Mail,
  MessageSquare,
  RefreshCcw,
} from "lucide-react";
import { APP_CONFIG } from "@/config/app";
import {
  customerEditorPath,
  customerProjects,
  readLastOpened,
} from "@/lib/customer-workspace";
import { useCommentsStore } from "@/stores/comments-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useSessionStore } from "@/stores/session-store";
import { useSuggestionsStore } from "@/stores/suggestions-store";
import type { Project } from "@/types";
import { ProjectStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/ui/skeleton";

/**
 * Customer landing: no dashboard — just the way into the editor.
 * Zero projects → friendly empty state. One → straight to its editor.
 * Several → a simple picker with "what's waiting on you" signals.
 */
export function CustomerHome() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const projects = useProjectsStore((s) => s.projects);
  const hydrated = useProjectsStore((s) => s.hydrated);
  const [redirecting, setRedirecting] = useState(false);

  const assigned = useMemo(
    () => customerProjects(projects, user.id),
    [projects, user.id],
  );

  const lastOpened = useMemo(() => {
    const last = readLastOpened();
    if (!last) return null;
    return assigned.find((p) => p.id === last.projectId) ? last : null;
  }, [assigned]);

  useEffect(() => {
    if (!hydrated || assigned.length !== 1) return;
    setRedirecting(true);
    const only = assigned[0];
    const pageId = lastOpened?.projectId === only.id ? lastOpened.pageId : undefined;
    router.replace(customerEditorPath(only.id, pageId));
  }, [hydrated, assigned, lastOpened, router]);

  if (!hydrated || redirecting) return <PageSkeleton />;

  if (assigned.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="Your agency hasn't shared a project with you yet"
        description="As soon as a website blueprint is ready for your input, it will appear here. If you were expecting one, get in touch with your agency."
        action={
          <a href={`mailto:${APP_CONFIG.agencyEmail}?subject=${encodeURIComponent(`Question about my ${APP_CONFIG.name} project`)}`}>
            <Button>
              <Mail className="size-3.5" aria-hidden />
              Contact your agency
            </Button>
          </a>
        }
        className="mt-10"
      />
    );
  }

  const ordered = lastOpened
    ? [
        ...assigned.filter((p) => p.id === lastOpened.projectId),
        ...assigned.filter((p) => p.id !== lastOpened.projectId),
      ]
    : assigned;

  return (
    <div className="mt-6">
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">
        Welcome back, {user.name.split(" ")[0]}
      </h1>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Choose a project to continue working on its wireframe.
      </p>
      <ul className="mt-6 space-y-3">
        {ordered.map((project, index) => (
          <li key={project.id}>
            <ProjectPickerCard
              project={project}
              userId={user.id}
              continueHint={lastOpened?.projectId === project.id && index === 0}
              onOpen={() =>
                router.push(
                  customerEditorPath(
                    project.id,
                    lastOpened?.projectId === project.id ? lastOpened?.pageId : undefined,
                  ),
                )
              }
              onOpenRevisions={() => router.push(`/projects/${project.id}/revisions`)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProjectPickerCard({
  project,
  userId,
  continueHint,
  onOpen,
  onOpenRevisions,
}: {
  project: Project;
  userId: string;
  continueHint: boolean;
  onOpen: () => void;
  onOpenRevisions: () => void;
}) {
  const loadComments = useCommentsStore((s) => s.load);
  const loadSuggestions = useSuggestionsStore((s) => s.load);
  const comments = useCommentsStore((s) => s.byProject[project.id]);
  const suggestions = useSuggestionsStore((s) => s.byProject[project.id]);

  useEffect(() => {
    void loadComments(project.id);
    void loadSuggestions(project.id);
  }, [project.id, loadComments, loadSuggestions]);

  const visible = (comments ?? []).filter((c) => c.visibility === "customer");
  const myTasks = visible.filter(
    (c) => c.isActionItem && !c.completedAt && c.assignedToId === userId,
  );
  const openFeedback = visible.filter(
    (c) => !c.isActionItem && (c.status === "open" || c.status === "reopened"),
  );
  const pendingSuggestions = (suggestions ?? []).filter((s) => s.status === "pending");
  const needsRevisions =
    project.status === "revisions-requested" || project.status === "customer-revising";

  return (
    <div className="group flex w-full flex-col gap-3 rounded-xl border border-[var(--border-default)] bg-white p-4 text-left shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-strong)]">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-4 text-left"
        onClick={onOpen}
      >
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            {project.name}
            <ProjectStatusBadge status={project.status} />
            {continueHint && (
              <span className="text-xs font-medium text-[var(--text-muted)]">
                Continue where you left off
              </span>
            )}
          </p>
          <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">
            {project.companyName} · {project.pages.length}{" "}
            {project.pages.length === 1 ? "page" : "pages"}
          </p>
        </div>
        <ArrowRight
          className="size-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-500"
          aria-hidden
        />
      </button>

      {(needsRevisions ||
        myTasks.length > 0 ||
        pendingSuggestions.length > 0 ||
        openFeedback.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border-default)] pt-3">
          {needsRevisions && (
            <button
              type="button"
              onClick={onOpenRevisions}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-100"
            >
              <RefreshCcw className="size-3" aria-hidden />
              Continue revisions
            </button>
          )}
          {myTasks.length > 0 && (
            <button
              type="button"
              onClick={onOpenRevisions}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
            >
              <CheckSquare className="size-3" aria-hidden />
              {myTasks.length} task{myTasks.length === 1 ? "" : "s"} for you
            </button>
          )}
          {pendingSuggestions.length > 0 && (
            <button
              type="button"
              onClick={onOpen}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100"
            >
              <Lightbulb className="size-3" aria-hidden />
              {pendingSuggestions.length} design suggestion
              {pendingSuggestions.length === 1 ? "" : "s"}
            </button>
          )}
          {openFeedback.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              <MessageSquare className="size-3" aria-hidden />
              {openFeedback.length} open comment{openFeedback.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
