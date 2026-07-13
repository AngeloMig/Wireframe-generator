"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  ArrowUpRight,
  Copy,
  FileStack,
  MoreHorizontal,
  Network,
  PencilLine,
  Trash2,
} from "lucide-react";
import {
  cloneProjectAsInput,
  projectCompletion,
  withActivity,
} from "@/lib/project-utils";
import { useProjectsStore } from "@/stores/projects-store";
import { useCommentsStore } from "@/stores/comments-store";
import { isInboxRead } from "@/lib/inbox-read-state";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import type { Project } from "@/types";
import { formatRelative } from "@/utils/dates";
import { SheetPreview } from "./sheet-preview";
import { ProjectStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import {
  DropdownItem,
  DropdownMenu,
  DropdownSeparator,
} from "@/components/ui/dropdown-menu";
import { ProgressBar } from "@/components/ui/progress";

/** Stable fallback so the comments selector never mints a fresh array. */
const NO_COMMENTS: never[] = [];

export function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const createProject = useProjectsStore((s) => s.createProject);
  const updateProject = useProjectsStore((s) => s.updateProject);
  const deleteProject = useProjectsStore((s) => s.deleteProject);
  const user = useSessionStore((s) => s.user);
  const [readVersion, setReadVersion] = useState(0);
  const loadComments = useCommentsStore((s) => s.load);
  // Zustand pitfall: `?? []` would mint a new array every snapshot and loop
  // the render — fall back to a stable module-level constant instead.
  const comments = useCommentsStore((s) => s.byProject[project.id]) ?? NO_COMMENTS;
  useEffect(() => { void loadComments(project.id); }, [project.id, loadComments]);
  const unreadMessages = comments.filter((comment) => comment.status !== "resolved" && comment.authorId !== user.id && !isInboxRead(user.id, comment.id)).length;
  useEffect(() => {
    const onReadStateChange = () => setReadVersion((value) => value + 1);
    window.addEventListener("inbox-read-state-changed", onReadStateChange);
    return () => window.removeEventListener("inbox-read-state-changed", onReadStateChange);
  }, []);
  void readVersion;

  const completion = projectCompletion(project);
  const overviewHref = `/projects/${project.id}/overview`;
  const isArchived = project.status === "archived";

  const handleDuplicate = async () => {
    const copy = await createProject(cloneProjectAsInput(project));
    toast("Project duplicated", "success");
    router.push(`/projects/${copy.id}/overview`);
  };

  const handleArchiveToggle = () => {
    updateProject(
      project.id,
      (p) =>
        withActivity(
          { ...p, status: isArchived ? "draft" : "archived" },
          "status-changed",
          isArchived ? "Project restored from archive" : "Project archived",
          user,
        ),
      { immediate: true },
    );
    toast(isArchived ? "Project restored" : "Project archived", "info");
  };

  return (
    <article className="group flex flex-col rounded-[1.25rem] bg-white shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-[var(--shadow-panel)]">
      {/* Decorative sheet preview nested in its own inset frame (a plate in the
          card) so it reads as machined hardware, not a flat image. The title
          link below is the accessible way in — the card itself must NOT use
          overflow-hidden, or the actions dropdown gets cut off. */}
      <div
        aria-hidden
        onClick={() => router.push(overviewHref)}
        className="relative cursor-pointer p-2 pb-0"
      >
        <div className="overflow-hidden rounded-[0.85rem] bg-[var(--surface-secondary)] ring-1 ring-black/[0.05]">
          <SheetPreview project={project} className="h-40" />
        </div>
        {/* Status floats on the preview so the body stays about the project. */}
        <div className="pointer-events-none absolute top-3.5 right-3.5 rounded-full bg-white/85 p-[3px] shadow-[0_2px_10px_rgb(38_57_74/0.16)] ring-1 ring-black/[0.06] backdrop-blur-sm">
          <ProjectStatusBadge status={project.status} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4 pt-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-0.5 truncate text-xs font-medium text-[var(--text-muted)]">
            {project.companyName}
          </p>
          <Link
            href={overviewHref}
            className="font-display block truncate text-lg font-semibold tracking-tight text-slate-900 decoration-[var(--border-strong)] underline-offset-4 transition-colors group-hover:underline"
          >
            {project.name}
          </Link>
        </div>
        <DropdownMenu
          trigger={(props) => (
            <Button
              variant="ghost"
              size="icon-sm"
              {...props}
              aria-label={`Project actions for ${project.name}`}
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </Button>
          )}
        >
          <DropdownItem onSelect={() => router.push(overviewHref)}>
            <PencilLine className="size-4 text-slate-400" aria-hidden />
            Open project
          </DropdownItem>
          <DropdownItem onSelect={() => router.push(`/projects/${project.id}/sitemap`)}>
            <Network className="size-4 text-slate-400" aria-hidden />
            View sitemap
          </DropdownItem>
          <DropdownItem onSelect={() => void handleDuplicate()}>
            <Copy className="size-4 text-slate-400" aria-hidden />
            Duplicate
          </DropdownItem>
          <DropdownItem onSelect={handleArchiveToggle}>
            {isArchived ? (
              <ArchiveRestore className="size-4 text-slate-400" aria-hidden />
            ) : (
              <Archive className="size-4 text-slate-400" aria-hidden />
            )}
            {isArchived ? "Restore" : "Archive"}
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem destructive onSelect={() => setConfirmDelete(true)}>
            <Trash2 className="size-4" aria-hidden />
            Delete
          </DropdownItem>
        </DropdownMenu>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-secondary)]">
        <span className="font-medium text-[var(--text-primary)]">{project.websiteType}</span>
        {unreadMessages > 0 && (
          <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--info)]">
            <span className="size-1.5 rounded-full bg-[var(--info)]" />
            {unreadMessages} unread
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
          <FileStack className="size-3.5" aria-hidden />
          {project.pages.length} {project.pages.length === 1 ? "sheet" : "sheets"}
        </span>
        <span className="text-[var(--text-muted)]">Edited {formatRelative(project.lastEditedAt)}</span>
      </div>

      <div className="mt-auto pt-4">
        <div className="flex items-center gap-3">
          <ProgressBar value={completion} label={`${project.name} completion`} className="h-1.5 flex-1" />
          <span className="shrink-0 text-xs font-semibold tabular-nums text-[var(--text-primary)]">
            {completion}%
          </span>
        </div>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => router.push(overviewHref)}
          className="group/cta flex w-full items-center justify-between rounded-full bg-[var(--text-primary)] py-2 pr-2 pl-5 text-sm font-semibold text-white shadow-[0_2px_10px_rgb(26_26_26/0.14)] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_6px_18px_rgb(26_26_26/0.22)] active:scale-[0.98]"
        >
          Continue editing
          <span className="flex size-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-[1px]">
            <ArrowUpRight className="size-4" aria-hidden />
          </span>
        </button>
      </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          void deleteProject(project.id).then(() => toast("Project deleted", "info"));
        }}
        title="Delete this project?"
        description={`“${project.name}” and all of its pages will be permanently removed from this browser. This cannot be undone.`}
        confirmLabel="Delete project"
      />
    </article>
  );
}
