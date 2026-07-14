"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CheckSquare,
  CheckCircle2,
  FolderOpen,
  Lightbulb,
  Mail,
  PenLine,
  RefreshCcw,
  ShieldCheck,
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
import type { ActivityEntry, Project, ProjectStatus } from "@/types";
import { nextRecommendedAction, projectCompletion } from "@/lib/project-utils";
import { formatRelative } from "@/utils/dates";
import { cn } from "@/utils/cn";
import { SheetPreview } from "@/components/project/sheet-preview";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/ui/skeleton";

/**
 * Customer landing: no dashboard — just the way back into the work.
 * Zero projects → friendly empty state. One → straight to its editor.
 * Several → a picker where every card answers the client's three questions:
 * where is my project, whose turn is it, and what should I do next?
 */
type AttentionItem = {
  key: string;
  priority: number;
  label: string;
  detail: string;
  icon: LucideIcon;
  iconClass: string;
  onClick: () => void;
};

/**
 * The blueprint's journey in the customer's language. Each project sits at
 * exactly one stop; the rail on every card shows how far it has travelled
 * and whose turn it is to move it.
 */
const JOURNEY: {
  id: string;
  label: string;
  statuses: ProjectStatus[];
  owner: "you" | "agency" | "done";
  note: string;
}[] = [
  {
    id: "drafting",
    label: "Drafting",
    statuses: ["draft", "customer-editing"],
    owner: "you",
    note: "build the blueprint and submit it when it feels right",
  },
  {
    id: "submitted",
    label: "Submitted",
    statuses: ["ready-for-review"],
    owner: "agency",
    note: "queued for their first pass",
  },
  {
    id: "review",
    label: "Agency review",
    statuses: ["agency-reviewing"],
    owner: "agency",
    note: "they're going through your blueprint now",
  },
  {
    id: "revisions",
    label: "Revisions",
    statuses: ["revisions-requested", "customer-revising"],
    owner: "you",
    note: "changes are waiting for you",
  },
  {
    id: "approval",
    label: "Your approval",
    statuses: ["awaiting-approval", "partially-approved"],
    owner: "you",
    note: "give it a final look and sign off",
  },
  {
    id: "approved",
    label: "Approved",
    statuses: ["approved", "in-development", "completed"],
    owner: "done",
    note: "your agency is building from this blueprint",
  },
];

function journeyStage(status: ProjectStatus) {
  const index = JOURNEY.findIndex((stage) => stage.statuses.includes(status));
  return index === -1 ? null : { index, stage: JOURNEY[index] };
}

const contactHref = `mailto:${APP_CONFIG.agencyEmail}?subject=${encodeURIComponent(
  `Question about my ${APP_CONFIG.name} project`,
)}`;

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

  const loadComments = useCommentsStore((s) => s.load);
  const loadSuggestions = useSuggestionsStore((s) => s.load);
  const commentsByProject = useCommentsStore((s) => s.byProject);
  const suggestionsByProject = useSuggestionsStore((s) => s.byProject);

  // The header sentence and attention strip need every project's signals,
  // not just the ones whose cards have mounted.
  useEffect(() => {
    for (const project of assigned) {
      void loadComments(project.id);
      void loadSuggestions(project.id);
    }
  }, [assigned, loadComments, loadSuggestions]);

  const { attention, summary } = useMemo(() => {
    const items: AttentionItem[] = [];
    const approvals: Project[] = [];
    const revisions: Project[] = [];
    let taskTotal = 0;
    for (const project of assigned) {
      const needsApproval =
        project.status === "awaiting-approval" || project.status === "partially-approved";
      const needsRevisions =
        project.status === "revisions-requested" || project.status === "customer-revising";
      const visible = (commentsByProject[project.id] ?? []).filter(
        (c) => c.visibility === "customer",
      );
      const tasks = visible.filter(
        (c) => c.isActionItem && !c.completedAt && c.assignedToId === user.id,
      );
      const ideas = (suggestionsByProject[project.id] ?? []).filter(
        (s) => s.status === "pending",
      );
      taskTotal += tasks.length;
      if (needsApproval) {
        approvals.push(project);
        items.push({
          key: `${project.id}-approve`,
          priority: 0,
          label: "Review & approve",
          detail: project.name,
          icon: ShieldCheck,
          iconClass: "bg-emerald-50 text-emerald-700",
          onClick: () => router.push(`/projects/${project.id}/review`),
        });
      }
      if (needsRevisions) {
        revisions.push(project);
        items.push({
          key: `${project.id}-revise`,
          priority: 1,
          label: "Continue revisions",
          detail: project.name,
          icon: RefreshCcw,
          iconClass: "bg-rose-50 text-rose-700",
          onClick: () => router.push(`/projects/${project.id}/revisions`),
        });
      }
      if (tasks.length > 0) {
        items.push({
          key: `${project.id}-tasks`,
          priority: 2,
          label: `${tasks.length} task${tasks.length === 1 ? "" : "s"} for you`,
          detail: project.name,
          icon: CheckSquare,
          iconClass: "bg-amber-50 text-amber-700",
          onClick: () => router.push(`/projects/${project.id}/revisions`),
        });
      }
      if (ideas.length > 0) {
        items.push({
          key: `${project.id}-ideas`,
          priority: 3,
          label: `${ideas.length} design idea${ideas.length === 1 ? "" : "s"} to review`,
          detail: project.name,
          icon: Lightbulb,
          iconClass: "bg-violet-50 text-violet-700",
          onClick: () => router.push(customerEditorPath(project.id)),
        });
      }
    }
    items.sort((a, b) => a.priority - b.priority);

    const parts: string[] = [];
    if (approvals.length === 1) parts.push(`${approvals[0].name} is ready for your approval`);
    else if (approvals.length > 1)
      parts.push(`${approvals.length} blueprints are ready for your approval`);
    if (taskTotal > 0)
      parts.push(`${taskTotal} ${taskTotal === 1 ? "task is" : "tasks are"} waiting on you`);
    if (parts.length === 0 && revisions.length > 0)
      parts.push(
        revisions.length === 1
          ? `revisions are underway on ${revisions[0].name}`
          : `revisions are underway on ${revisions.length} projects`,
      );
    const sentence =
      parts.length > 0
        ? `${parts.join(", and ")}.`
        : `Nothing needs your attention right now. ${APP_CONFIG.agencyName} is working on the next round.`;
    return {
      attention: items.slice(0, 4),
      summary: sentence.charAt(0).toUpperCase() + sentence.slice(1),
    };
  }, [assigned, commentsByProject, suggestionsByProject, user.id, router]);

  // What the agency did while the customer was away, newest first.
  const agencyActivity = useMemo(() => {
    const entries: { project: Project; entry: ActivityEntry }[] = [];
    for (const project of assigned) {
      for (const entry of project.activity) {
        if (entry.actorRole !== "customer") entries.push({ project, entry });
      }
    }
    return entries
      .sort((a, b) => b.entry.createdAt.localeCompare(a.entry.createdAt))
      .slice(0, 4);
  }, [assigned]);

  if (!hydrated || redirecting) return <PageSkeleton />;

  if (assigned.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="Your agency hasn't shared a project with you yet"
        description="As soon as a website blueprint is ready for your input, it will appear here. If you were expecting one, get in touch with your agency."
        action={
          <a href={contactHref}>
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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-12">
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            {greeting}, {user.name.split(" ")[0]}.
          </h1>
          <p className="mt-2.5 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
            {summary}
          </p>
        </div>
        {/* A question should never have to wait for an email hunt. */}
        <a
          href={contactHref}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-[var(--border-default)] bg-white px-3 text-[13px] font-medium text-[var(--text-primary)] transition-[background-color,border-color] duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface-secondary)]"
        >
          <Mail className="size-4 text-[var(--text-muted)]" aria-hidden />
          Message {APP_CONFIG.agencyName}
        </a>
      </header>

      {attention.length > 0 && (
        <section aria-label="Waiting on you">
          <p className="inline-flex items-center gap-2 font-mono text-[10px] font-medium tracking-[0.18em] text-[var(--text-muted)] uppercase">
            <span className="size-1.5 rounded-full bg-[#e0492c]" aria-hidden />
            Waiting on you
          </p>
          <div className="mt-2.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {attention.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={item.onClick}
                  className="group flex cursor-pointer items-center gap-3 rounded-[12px] border border-[var(--border-default)] bg-white px-4 py-3.5 text-left transition-[border-color,box-shadow] duration-200 hover:border-[var(--border-strong)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                >
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${item.iconClass}`}>
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{item.label}</span>
                    <span className="block truncate text-xs text-[var(--text-secondary)]">{item.detail}</span>
                  </span>
                  <ArrowRight className="ml-auto size-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-500" aria-hidden />
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="rounded-[12px] border border-[var(--border-default)] bg-[#FBFBFA] bg-[linear-gradient(rgba(0,0,0,0.022)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.022)_1px,transparent_1px)] bg-[size:26px_26px] p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 px-1">
          <h2 className="font-display text-xl font-semibold tracking-tight text-[var(--text-primary)]">
            Your drafting table
          </h2>
          <span className="text-xs text-[var(--text-muted)]">Changes save automatically</span>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
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
                onNavigate={(href) => router.push(href)}
              />
            </li>
          ))}
        </ul>
      </section>

      {agencyActivity.length > 0 && (
        <section
          aria-labelledby="agency-activity-heading"
          className="overflow-hidden rounded-[12px] border border-[var(--border-default)] bg-white"
        >
          <div className="border-b border-[var(--border-default)] px-5 py-4">
            <h2
              id="agency-activity-heading"
              className="text-sm font-semibold tracking-tight text-[var(--text-primary)]"
            >
              While you were away
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              The latest from {APP_CONFIG.agencyName} on your blueprints.
            </p>
          </div>
          <ul className="divide-y divide-[var(--border-default)]">
            {agencyActivity.map(({ project, entry }) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => router.push(customerEditorPath(project.id))}
                  className="flex min-h-14 w-full cursor-pointer items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-[var(--surface-secondary)]"
                >
                  <span
                    aria-hidden
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[10px] font-semibold text-[var(--text-secondary)]"
                  >
                    {entry.actorName
                      .split(" ")
                      .map((word) => word[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-[var(--text-primary)]">{entry.message}</span>
                    <span className="mt-0.5 block truncate text-xs text-[var(--text-muted)]">
                      {entry.actorName} · {project.name} · {formatRelative(entry.createdAt)}
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-slate-300" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ProjectPickerCard({
  project,
  userId,
  featured,
  continueHint,
  onOpen,
  onNavigate,
}: {
  project: Project;
  userId: string;
  featured: boolean;
  continueHint: boolean;
  onOpen: () => void;
  onNavigate: (href: string) => void;
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
  const journey = journeyStage(project.status);
  const isDrafting = project.status === "draft" || project.status === "customer-editing";

  // The single most important thing to do on this project, straight from the
  // status machine. Editor destinations keep the "continue where you left
  // off" page memory; everything else navigates directly.
  const goesToEditor = nextAction.href.endsWith("/editor");
  const primaryLabel = goesToEditor
    ? continueHint
      ? "Continue editing"
      : (nextAction.cta ?? "Open the editor")
    : (nextAction.cta ?? nextAction.label);
  const PrimaryIcon = goesToEditor
    ? PenLine
    : nextAction.href.endsWith("/revisions")
      ? RefreshCcw
      : project.status === "awaiting-approval" || project.status === "partially-approved"
        ? ShieldCheck
        : ArrowRight;

  const quietCounts = [
    myTasks.length > 0 && `${myTasks.length} task${myTasks.length === 1 ? "" : "s"} for you`,
    pendingSuggestions.length > 0 &&
      `${pendingSuggestions.length} design idea${pendingSuggestions.length === 1 ? "" : "s"}`,
    openFeedback.length > 0 &&
      `${openFeedback.length} open comment${openFeedback.length === 1 ? "" : "s"}`,
  ].filter(Boolean) as string[];

  return (
    <div
      className={
        "group flex h-full w-full overflow-hidden rounded-[12px] border border-[var(--border-default)] bg-white text-left transition-[border-color,box-shadow] duration-200 hover:border-[var(--border-strong)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] " +
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
            {project.companyName} · {project.pages.length} sheet{project.pages.length === 1 ? "" : "s"}
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
          className="flex w-full cursor-pointer items-center gap-3 text-left"
        >
          <span
            className={
              "font-display min-w-0 truncate font-semibold tracking-tight text-[var(--text-primary)] " +
              (featured ? "text-xl" : "text-base")
            }
          >
            {project.name}
          </span>
        </button>

        {/* Journey rail: where the blueprint is and whose turn it is. */}
        {journey && (
          <div className="border-t border-[var(--border-default)] pt-2.5">
            <div
              role="img"
              aria-label={`Stage ${journey.index + 1} of ${JOURNEY.length}: ${journey.stage.label}`}
              className="flex items-center gap-1"
            >
              {JOURNEY.map((stage, index) => (
                <span
                  key={stage.id}
                  className={cn(
                    "h-1 flex-1 rounded-full",
                    index < journey.index && "bg-[var(--text-primary)]/25",
                    index === journey.index &&
                      (journey.stage.owner === "you"
                        ? "bg-[var(--shopify-danger)]"
                        : journey.stage.owner === "agency"
                          ? "bg-[var(--info)]"
                          : "bg-[var(--success)]"),
                    index > journey.index && "bg-[var(--border-default)]",
                  )}
                />
              ))}
            </div>
            <p className="mt-2 flex min-w-0 items-baseline gap-1.5 text-xs">
              <span
                aria-hidden
                className={cn(
                  "size-1.5 shrink-0 translate-y-[-1px] rounded-full",
                  journey.stage.owner === "you"
                    ? "bg-[var(--shopify-danger)]"
                    : journey.stage.owner === "agency"
                      ? "bg-[var(--info)]"
                      : "bg-[var(--success)]",
                )}
              />
              <span className="shrink-0 font-semibold text-[var(--text-primary)]">
                {journey.stage.owner === "you"
                  ? "Your turn"
                  : journey.stage.owner === "agency"
                    ? `With ${APP_CONFIG.agencyName}`
                    : "Approved"}
              </span>
              <span className="truncate text-[var(--text-secondary)]">— {journey.stage.note}</span>
            </p>
          </div>
        )}

        {/* Setup progress only means something while drafting. */}
        {isDrafting && (
          <div className="mt-1 rounded-lg bg-[var(--surface-secondary)] p-2.5">
            <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1.5 font-medium text-[var(--text-secondary)]">
                <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden />
                {nextAction.label}
              </span>
              <span className="font-semibold tabular-nums text-[var(--text-muted)]">
                {completion}% set up
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-[var(--text-primary)] transition-all" style={{ width: `${completion}%` }} />
            </div>
          </div>
        )}

        {quietCounts.length > 0 && (
          <p className="text-xs text-[var(--text-muted)]">{quietCounts.join(" · ")}</p>
        )}

        {/* One primary action per project; the editor stays a step away. */}
        <div className="mt-auto flex items-center gap-2 pt-3">
          <button
            type="button"
            onClick={() => (goesToEditor ? onOpen() : onNavigate(nextAction.href))}
            aria-label={`${primaryLabel} — ${project.name}`}
            className="group/cta flex min-h-11 min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 rounded-full bg-[var(--primary)] py-2 pr-2 pl-4 text-sm font-semibold text-white transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[var(--primary-hover)] active:scale-[0.98]"
          >
            <span className="truncate">{primaryLabel}</span>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/cta:bg-white/25 group-hover/cta:-rotate-6">
              <PrimaryIcon className="size-4" aria-hidden />
            </span>
          </button>
          {!goesToEditor && (
            <button
              type="button"
              onClick={onOpen}
              aria-label={`Open ${project.name} in the editor`}
              className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-white px-4 text-sm font-medium text-[var(--text-primary)] transition-[background-color,border-color,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-secondary)] active:scale-[0.98]"
            >
              <PenLine className="size-3.5 text-[var(--text-muted)]" aria-hidden />
              Editor
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
