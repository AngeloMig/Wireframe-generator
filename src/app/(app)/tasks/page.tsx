"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, CheckSquare, RotateCcw } from "lucide-react";
import { COMMENT_PRIORITY_META } from "@/config/labels";
import { canCompleteActionItem } from "@/lib/permissions";
import { useCommentsStore } from "@/stores/comments-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import type { Project, ProjectComment } from "@/types";
import { isAgencyUser } from "@/types";
import { nowIso } from "@/utils/id";
import { cn } from "@/utils/cn";
import { formatRelative } from "@/utils/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

type TaskFilter = "open" | "mine" | "done";

/** Cross-project action items for the current user. */
export default function TasksPage() {
  const projects = useProjectsStore((s) => s.projects);
  const user = useSessionStore((s) => s.user);
  const load = useCommentsStore((s) => s.load);
  const byProject = useCommentsStore((s) => s.byProject);
  const updateComment = useCommentsStore((s) => s.updateComment);
  const [filter, setFilter] = useState<TaskFilter>("open");

  const visible = useMemo(
    () => projects.filter((p) => p.status !== "archived"),
    [projects],
  );

  useEffect(() => {
    for (const project of visible) void load(project.id);
  }, [visible, load]);

  const tasks = useMemo(() => {
    const all: { project: Project; comment: ProjectComment }[] = [];
    for (const project of visible) {
      for (const comment of byProject[project.id] ?? []) {
        if (!comment.isActionItem) continue;
        if (!isAgencyUser(user.role) && comment.visibility === "agency") continue;
        all.push({ project, comment });
      }
    }
    const filtered = all.filter(({ comment }) => {
      if (filter === "done") return Boolean(comment.completedAt);
      if (filter === "mine") return !comment.completedAt && comment.assignedToId === user.id;
      return !comment.completedAt;
    });
    // Overdue first, then due date, then newest.
    return filtered.sort((a, b) => {
      const aDue = a.comment.dueDate ?? "9999";
      const bDue = b.comment.dueDate ?? "9999";
      return aDue.localeCompare(bDue) || b.comment.createdAt.localeCompare(a.comment.createdAt);
    });
  }, [visible, byProject, user, filter]);

  const toggleDone = async (project: Project, comment: ProjectComment) => {
    if (comment.completedAt) {
      await updateComment(project.id, comment.id, {
        completedAt: undefined,
        completedById: undefined,
        status: "reopened",
      });
      toast("Task reopened", "info");
    } else {
      await updateComment(project.id, comment.id, {
        completedAt: nowIso(),
        completedById: user.id,
        status: "resolved",
        resolvedAt: nowIso(),
        resolvedById: user.id,
      });
      toast("Task completed", "success");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <CheckSquare className="size-4 text-slate-400" aria-hidden />
              Tasks
            </span>
          }
          description="Action items across all projects — assigned in comments and revision requests."
          action={
            <div className="flex gap-1">
              {(
                [
                  ["open", "Open"],
                  ["mine", "Assigned to me"],
                  ["done", "Done"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                  className={cn(
                    "cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors",
                    filter === value
                      ? "bg-[var(--primary)] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          }
        />
        <CardBody className="divide-y divide-slate-100 p-0">
          {tasks.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={CheckSquare}
                title={filter === "done" ? "Nothing completed yet" : "No open tasks"}
                description={
                  filter === "done"
                    ? "Completed action items will be listed here."
                    : "Action items assigned in comments and revision requests will appear here."
                }
              />
            </div>
          ) : (
            tasks.map(({ project, comment }) => {
              const overdue =
                !comment.completedAt &&
                comment.dueDate &&
                new Date(comment.dueDate) < new Date();
              const canToggle = canCompleteActionItem(user.role, comment, user.id);
              return (
                <div key={comment.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  {canToggle && (
                    <button
                      type="button"
                      aria-label={comment.completedAt ? "Reopen task" : "Mark task complete"}
                      onClick={() => void toggleDone(project, comment)}
                      className={cn(
                        "flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors",
                        comment.completedAt
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-slate-300 text-transparent hover:border-emerald-400 hover:text-emerald-400",
                      )}
                    >
                      {comment.completedAt ? (
                        <CheckCircle2 className="size-3.5" aria-hidden />
                      ) : (
                        <RotateCcw className="size-3" aria-hidden />
                      )}
                    </button>
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm text-slate-800",
                        comment.completedAt && "text-slate-400 line-through",
                      )}
                    >
                      {comment.message}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {project.name}
                      {comment.dueDate && (
                        <span className={cn(overdue && "font-medium text-rose-600")}>
                          {" "}· due {new Date(comment.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {" "}· {formatRelative(comment.createdAt)}
                    </p>
                  </div>
                  {comment.priority !== "normal" && (
                    <Badge className={COMMENT_PRIORITY_META[comment.priority].badgeClass}>
                      {COMMENT_PRIORITY_META[comment.priority].label}
                    </Badge>
                  )}
                  <Link href={`/projects/${project.id}/overview?comment=${comment.id}`}>
                    <Button variant="ghost" size="sm">
                      Open
                      <ArrowRight className="size-3.5" aria-hidden />
                    </Button>
                  </Link>
                </div>
              );
            })
          )}
        </CardBody>
      </Card>
    </div>
  );
}
