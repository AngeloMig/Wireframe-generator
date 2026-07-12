"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckSquare,
  CheckCircle2,
  FolderOpen,
  Lightbulb,
  Mail,
  MessageSquare,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
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
import { nextRecommendedAction, projectCompletion } from "@/lib/project-utils";
import { SheetPreview } from "@/components/project/sheet-preview";
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
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[18px] border border-[#d7e5f0] bg-[#e7f3fc] px-6 py-7 text-[var(--text-primary)] shadow-[0_12px_30px_rgb(58_92_120/0.08)] sm:px-8 sm:py-8">
        <div className="absolute -right-10 -top-16 size-64 rounded-full bg-white/70 blur-2xl" aria-hidden />
        <div className="relative max-w-2xl">
          <p className="mb-3 inline-flex items-center gap-2 font-mono text-[10px] font-medium tracking-[0.18em] text-[var(--info)] uppercase">
            <Sparkles className="size-3.5" aria-hidden />
            Your client workspace
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
            Pick up where you left off, review feedback, and keep your website blueprint moving.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-[var(--text-secondary)]">
            <span className="rounded-full bg-white/75 px-3 py-1.5">{assigned.length} project{assigned.length === 1 ? "" : "s"} shared</span>
            {lastOpened && <span className="rounded-full bg-white/75 px-3 py-1.5">Last opened recently</span>}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 font-mono text-[10px] font-medium tracking-[0.18em] text-[var(--text-muted)] uppercase">Your drafting table</p>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Projects to continue</h2>
        </div>
        <span className="text-sm text-[var(--text-secondary)]">Changes save automatically</span>
      </div>
      <ul className="grid gap-5 sm:grid-cols-2">
        {ordered.map((project, index) => (
          <li key={project.id} className={index === 0 ? "sm:col-span-2" : undefined}>
            <ProjectPickerCard
              project={project}
              userId={user.id}
              featured={index === 0}
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
              onOpenReview={() => router.push(`/projects/${project.id}/review`)}
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
  featured,
  continueHint,
  onOpen,
  onOpenRevisions,
  onOpenReview,
}: {
  project: Project;
  userId: string;
  featured: boolean;
  continueHint: boolean;
  onOpen: () => void;
  onOpenRevisions: () => void;
  onOpenReview: () => void;
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
  const completion = projectCompletion(project);
  const nextAction = nextRecommendedAction(project);
  const needsRevisions =
    project.status === "revisions-requested" || project.status === "customer-revising";
  const needsApproval =
    project.status === "awaiting-approval" || project.status === "partially-approved";

  const hasSignals =
    needsApproval ||
    needsRevisions ||
    myTasks.length > 0 ||
    pendingSuggestions.length > 0 ||
    openFeedback.length > 0;

  return (
    <div
      className={
        "group flex h-full w-full overflow-hidden rounded-[14px] border border-[var(--border-default)] bg-white text-left shadow-[var(--shadow-card)] transition-[border-color,box-shadow] hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-panel)] " +
        (featured ? "flex-col sm:flex-row" : "flex-col")
      }
    >
      {/* Decorative sheet preview — wireframe sections render real buttons,
          so this must not be a <button> itself. The title below is the
          accessible way in; this is a pointer shortcut. */}
      <div
        aria-hidden
        onClick={onOpen}
        className={
          "cursor-pointer border-[var(--border-default)] " +
          (featured ? "border-b sm:w-[46%] sm:border-r sm:border-b-0" : "border-b")
        }
      >
        <SheetPreview project={project} className={featured ? "h-56 sm:h-72" : "h-40"} />
      </div>

      {/* Title block */}
      <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-mono text-[10px] font-medium tracking-[0.18em] text-[var(--text-muted)] uppercase">
            {project.companyName}
          </p>
          {continueHint && (
            <span className="shrink-0 rounded-sm bg-[var(--surface-secondary)] px-1.5 py-0.5 font-mono text-[9px] tracking-[0.14em] text-[var(--text-secondary)] uppercase">
              Last opened
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="flex w-full cursor-pointer items-center justify-between gap-3 text-left"
        >
          <span
            className={
              "font-display min-w-0 truncate font-semibold tracking-tight text-[var(--text-primary)] " +
              (featured ? "text-xl" : "text-base")
            }
          >
            {project.name}
          </span>
          <ArrowRight
            className="size-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-500"
            aria-hidden
          />
        </button>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-[var(--border-default)] pt-2.5 font-mono text-[10px] tracking-[0.14em] text-[var(--text-muted)] uppercase">
          <span>
            <span className="text-[var(--text-muted)]/70">Sheets</span>{" "}
            <span className="text-[var(--text-secondary)]">{project.pages.length}</span>
          </span>
          <span className="normal-case">
            <ProjectStatusBadge status={project.status} />
          </span>
        </div>

        <div className="mt-1 rounded-lg bg-[var(--surface-secondary)] p-2.5">
          <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1.5 font-medium text-[var(--text-secondary)]">
              <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden />
              {nextAction.label}
            </span>
            <span className="font-semibold tabular-nums text-[var(--text-muted)]">{completion}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-[var(--accent-primary)] transition-all" style={{ width: `${completion}%` }} />
          </div>
        </div>

      {hasSignals && (
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          {needsApproval && (
            <button
              type="button"
              onClick={onOpenReview}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <ShieldCheck className="size-3" aria-hidden />
              Review & approve
            </button>
          )}
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
    </div>
  );
}
