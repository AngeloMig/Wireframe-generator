"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
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
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import type { Project } from "@/types";
import { formatRelative } from "@/utils/dates";
import { ProjectStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import {
  DropdownItem,
  DropdownMenu,
  DropdownSeparator,
} from "@/components/ui/dropdown-menu";
import { ProgressBar } from "@/components/ui/progress";

export function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const createProject = useProjectsStore((s) => s.createProject);
  const updateProject = useProjectsStore((s) => s.updateProject);
  const deleteProject = useProjectsStore((s) => s.deleteProject);
  const user = useSessionStore((s) => s.user);

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
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={overviewHref}
            className="block truncate text-sm font-semibold text-slate-900 hover:text-indigo-700"
          >
            {project.name}
          </Link>
          <p className="mt-0.5 truncate text-sm text-slate-500">{project.companyName}</p>
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

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>{project.websiteType}</span>
        <span className="inline-flex items-center gap-1">
          <FileStack className="size-3.5" aria-hidden />
          {project.pages.length} {project.pages.length === 1 ? "page" : "pages"}
        </span>
        <span>Edited {formatRelative(project.lastEditedAt)}</span>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-600">{completion}% complete</span>
          <ProjectStatusBadge status={project.status} />
        </div>
        <ProgressBar value={completion} label={`${project.name} completion`} />
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push(overviewHref)}>
          Continue Editing
        </Button>
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
