"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Circle, MessageSquare, Send, Undo2 } from "lucide-react";
import { PROJECT_STATUS_META } from "@/config/labels";
import { canSubmitProject, projectChecklist, withActivity } from "@/lib/project-utils";
import { useProject } from "@/hooks/use-project";
import { useNotificationsStore } from "@/stores/notifications-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import { cn } from "@/utils/cn";
import { formatRelative } from "@/utils/dates";
import { ProjectStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";

const SUBMITTED_STATUSES = new Set([
  "ready-for-review",
  "agency-reviewing",
  "awaiting-approval",
  "approved",
  "in-development",
  "completed",
]);

export default function ReviewPage() {
  const { project, projectId } = useProject();
  const updateProject = useProjectsStore((s) => s.updateProject);
  const addNotification = useNotificationsStore((s) => s.add);
  const user = useSessionStore((s) => s.user);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!project) return null; // ProjectShell handles loading and not-found.

  const checklist = projectChecklist(project);
  const canSubmit = canSubmitProject(project);
  const isSubmitted = SUBMITTED_STATUSES.has(project.status);
  const statusMeta = PROJECT_STATUS_META[project.status];
  const openComments = project.comments.filter((c) => c.status === "open");

  const handleSubmit = () => {
    updateProject(
      projectId,
      (p) =>
        withActivity(
          { ...p, status: "ready-for-review" as const },
          "project-submitted",
          "Blueprint submitted for agency review",
          user,
        ),
      { immediate: true },
    );
    void addNotification({
      title: "Blueprint submitted",
      message: `“${project.name}” was sent to the agency for review.`,
      projectId,
      href: `/projects/${projectId}/review`,
    });
    setConfirmOpen(false);
    toast("Submitted for review", "success", "The agency will take it from here.");
  };

  const handleWithdraw = () => {
    updateProject(
      projectId,
      (p) =>
        withActivity(
          { ...p, status: "customer-editing" as const },
          "status-changed",
          "Submission withdrawn — back to editing",
          user,
        ),
      { immediate: true },
    );
    toast("Back to editing", "info");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader
          title="Review & submission"
          description="When your blueprint is ready, submit it and the agency team will review every page."
          action={<ProjectStatusBadge status={project.status} />}
        />
        <CardBody className="space-y-5">
          <p className="text-sm text-slate-600">{statusMeta.description}</p>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Pre-submission checklist</h3>
            <ul className="space-y-2.5">
              {checklist.map((item) => (
                <li key={item.id} className="flex items-start gap-2.5 text-sm">
                  {item.done ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden />
                  ) : (
                    <Circle className="mt-0.5 size-4 shrink-0 text-slate-300" aria-hidden />
                  )}
                  <div>
                    <span className={cn(item.done ? "text-slate-500" : "text-slate-800")}>
                      {item.label}
                      {!item.required && (
                        <span className="ml-1.5 text-xs text-slate-400">optional</span>
                      )}
                    </span>
                    {!item.done && <p className="text-xs text-slate-500">{item.hint}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {isSubmitted ? (
            <div className="flex flex-wrap items-center gap-3 rounded-lg bg-emerald-50 px-4 py-3">
              <Check className="size-4 text-emerald-600" aria-hidden />
              <p className="flex-1 text-sm text-emerald-800">
                Your blueprint has been submitted.
                {project.status === "ready-for-review" &&
                  " You can withdraw it if you want to keep editing."}
              </p>
              {project.status === "ready-for-review" && (
                <Button variant="outline" size="sm" onClick={handleWithdraw}>
                  <Undo2 className="size-3.5" aria-hidden />
                  Withdraw & keep editing
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
              {!canSubmit && (
                <p className="text-sm text-amber-700">
                  Complete the required checklist items before submitting.
                </p>
              )}
              <Button
                className="ml-auto"
                disabled={!canSubmit}
                onClick={() => setConfirmOpen(true)}
              >
                <Send className="size-4" aria-hidden />
                Submit for Review
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <MessageSquare className="size-4 text-slate-400" aria-hidden />
              Feedback ({openComments.length} open)
            </span>
          }
          description="Agency comments, replies, and approvals arrive in the next phase of this prototype."
        />
        <CardBody className="divide-y divide-slate-100 p-0">
          {project.comments.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">
              No feedback yet — comments from the agency will appear here after review
              starts.
            </p>
          ) : (
            project.comments.map((comment) => (
              <div key={comment.id} className="px-5 py-3.5">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">{comment.authorName}</span>
                  <span>·</span>
                  <span>{formatRelative(comment.createdAt)}</span>
                  <span
                    className={cn(
                      "ml-auto",
                      comment.status === "resolved" ? "text-emerald-600" : "text-amber-600",
                    )}
                  >
                    {comment.status === "resolved" ? "Resolved" : "Open"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-700">{comment.message}</p>
                {comment.replies.length > 0 && (
                  <p className="mt-1 text-xs text-slate-400">
                    {comment.replies.length}{" "}
                    {comment.replies.length === 1 ? "reply" : "replies"}
                  </p>
                )}
              </div>
            ))
          )}
        </CardBody>
      </Card>

      <p className="text-center text-xs text-slate-400">
        Need to change something first?{" "}
        <Link
          href={`/projects/${projectId}/sitemap`}
          className="font-medium text-indigo-600 hover:text-indigo-800"
        >
          Back to your pages
        </Link>
      </p>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Submit this blueprint for review?"
        description="The agency team will be notified and will start reviewing your pages. You can withdraw the submission while it's still waiting for review."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              <Send className="size-4" aria-hidden />
              Submit
            </Button>
          </>
        }
      />
    </div>
  );
}
