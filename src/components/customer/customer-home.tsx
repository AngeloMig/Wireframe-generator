"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FolderOpen, Mail } from "lucide-react";
import { APP_CONFIG } from "@/config/app";
import {
  customerEditorPath,
  customerProjects,
  readLastOpened,
} from "@/lib/customer-workspace";
import { useProjectsStore } from "@/stores/projects-store";
import { useSessionStore } from "@/stores/session-store";
import { ProjectStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/ui/skeleton";

/**
 * Customer landing: no dashboard — just the way into the editor.
 * Zero projects → friendly empty state. One → straight to its editor.
 * Several → a simple picker, with "continue where you left off" first.
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
        {ordered.map((project, index) => {
          const isLast = lastOpened?.projectId === project.id;
          const pageId = isLast ? lastOpened?.pageId : undefined;
          return (
            <li key={project.id}>
              <button
                type="button"
                className="group flex w-full cursor-pointer items-center gap-4 rounded-xl border border-[var(--border-default)] bg-white p-4 text-left shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-strong)]"
                onClick={() => router.push(customerEditorPath(project.id, pageId))}
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                    {project.name}
                    <ProjectStatusBadge status={project.status} />
                    {isLast && index === 0 && (
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
            </li>
          );
        })}
      </ul>
    </div>
  );
}
