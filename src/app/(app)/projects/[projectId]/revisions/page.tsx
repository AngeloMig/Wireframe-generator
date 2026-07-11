"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  ClipboardList,
  PencilRuler,
  Send,
} from "lucide-react";
import { COMMENT_PRIORITY_META, SECTION_TYPE_LABELS } from "@/config/labels";
import { getVariation } from "@/data/section-variations";
import { fetchRevisionRequests } from "@/lib/collab-service";
import { buildRevisionWarnings } from "@/lib/submission";
import { withActivity } from "@/lib/project-utils";
import { useProject } from "@/hooks/use-project";
import { selectProjectComments, useCommentsStore } from "@/stores/comments-store";
import { selectProjectMembers, useMembersStore } from "@/stores/members-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useSessionStore } from "@/stores/session-store";
import type { RevisionRequest } from "@/types";
import { formatRelative } from "@/utils/dates";
import { Badge, PageStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress";
import { CommentCard } from "@/components/collab/comment-card";
import { SubmissionDialog } from "@/components/collab/submission-dialog";

/**
 * Customer Revision Mode: a focused view of what the agency asked for —
 * required pages, requested sections, action items, progress, and the
 * submit-revisions flow.
 */
export default function RevisionsPage() {
  const { project, projectId } = useProject();
  const user = useSessionStore((s) => s.user);
  const updateProject = useProjectsStore((s) => s.updateProject);
  const loadComments = useCommentsStore((s) => s.load);
  const loadMembers = useMembersStore((s) => s.load);
  const comments = useCommentsStore((s) => selectProjectComments(s, projectId));
  const members = useMembersStore((s) => selectProjectMembers(s, projectId));

  const [requests, setRequests] = useState<RevisionRequest[]>([]);
  const [submitOpen, setSubmitOpen] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    void loadComments(projectId);
    void loadMembers(projectId);
    void fetchRevisionRequests(projectId).then(setRequests);
  }, [projectId, loadComments, loadMembers]);

  const activeRequest = useMemo(
    () => requests.find((r) => !r.submittedAt) ?? requests[0] ?? null,
    [requests],
  );

  if (!project) return null;

  const isRevising =
    project.status === "revisions-requested" || project.status === "customer-revising";

  const visibleComments = comments.filter(
    (c) => user.role !== "customer" || c.visibility === "customer",
  );
  const actionItems = visibleComments.filter((c) => c.isActionItem);
  const openActionItems = actionItems.filter((c) => !c.completedAt);
  const doneActionItems = actionItems.filter((c) => c.completedAt);
  const progress =
    actionItems.length === 0
      ? 100
      : Math.round((doneActionItems.length / actionItems.length) * 100);
  const openFeedback = visibleComments.filter(
    (c) => !c.isActionItem && (c.status === "open" || c.status === "reopened"),
  );
  const warnings = buildRevisionWarnings(project, visibleComments);
  const requester = members.find((m) => m.userId === activeRequest?.createdById);

  const requiredPages = activeRequest
    ? project.pages.filter((p) => activeRequest.pageIds.includes(p.id))
    : project.pages.filter((p) => p.status === "revisions-requested");

  const requestedSections = activeRequest
    ? project.pages.flatMap((p) =>
        p.sections
          .filter((s) => activeRequest.sectionIds.includes(s.id))
          .map((s) => ({ page: p, section: s })),
      )
    : [];

  const startRevising = () => {
    if (project.status !== "revisions-requested") return;
    updateProject(
      projectId,
      (p) =>
        withActivity(
          {
            ...p,
            status: "customer-revising" as const,
            pages: p.pages.map((pg) =>
              pg.status === "revisions-requested"
                ? { ...pg, status: "customer-revising" as const }
                : pg,
            ),
          },
          "status-changed",
          "Started working on revisions",
          user,
        ),
      { immediate: true },
    );
  };

  if (!isRevising && !activeRequest) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No revision requests"
        description="When the agency asks for changes, everything they need will be listed here."
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Summary */}
      <Card className={isRevising ? "border-rose-200" : undefined}>
        <CardHeader
          title={
            activeRequest && !activeRequest.submittedAt
              ? `Revisions requested: ${activeRequest.summary}`
              : "Revisions"
          }
          description={
            activeRequest && !activeRequest.submittedAt
              ? `Requested by ${requester?.name ?? "the agency"} ${formatRelative(activeRequest.createdAt)}`
              : "The latest revision round has been submitted."
          }
          action={
            activeRequest && (
              <Badge className={COMMENT_PRIORITY_META[activeRequest.priority].badgeClass}>
                {COMMENT_PRIORITY_META[activeRequest.priority].label} priority
              </Badge>
            )
          }
        />
        <CardBody className="space-y-4">
          {activeRequest && (
            <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm whitespace-pre-wrap text-slate-700">
              {activeRequest.message}
            </p>
          )}
          {activeRequest?.dueDate && !activeRequest.submittedAt && (
            <p className="text-sm text-slate-600">
              Requested by{" "}
              <span className="font-medium">
                {new Date(activeRequest.dueDate).toLocaleDateString()}
              </span>
            </p>
          )}

          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Action items: {doneActionItems.length}/{actionItems.length} complete
              </span>
              <span className="font-medium text-slate-700">{progress}%</span>
            </div>
            <ProgressBar value={progress} />
          </div>

          {isRevising && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              {project.status === "revisions-requested" ? (
                <Button variant="outline" onClick={startRevising}>
                  <PencilRuler className="size-4" aria-hidden />
                  Start revisions
                </Button>
              ) : (
                <span className="text-sm text-slate-500">
                  You&apos;re working on revisions.
                </span>
              )}
              <Button onClick={() => setSubmitOpen(true)}>
                <Send className="size-4" aria-hidden />
                Submit Revisions
              </Button>
            </div>
          )}

          {(warnings.openRequiredActionItems.length > 0 ||
            warnings.unresolvedHighPriority.length > 0) &&
            isRevising && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <p className="flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="size-4" aria-hidden />
                  Before you submit
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
                  {warnings.openRequiredActionItems.length > 0 && (
                    <li>
                      {warnings.openRequiredActionItems.length} open action item
                      {warnings.openRequiredActionItems.length === 1 ? "" : "s"}
                    </li>
                  )}
                  {warnings.unresolvedHighPriority.length > 0 && (
                    <li>
                      {warnings.unresolvedHighPriority.length} unresolved high-priority
                      comment{warnings.unresolvedHighPriority.length === 1 ? "" : "s"}
                    </li>
                  )}
                </ul>
              </div>
            )}
        </CardBody>
      </Card>

      {/* Required pages */}
      {requiredPages.length > 0 && (
        <Card>
          <CardHeader title="Pages requiring changes" />
          <CardBody className="divide-y divide-slate-100 p-0">
            {requiredPages.map((page) => (
              <div key={page.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{page.name}</p>
                  <p className="text-xs text-slate-500">
                    {page.sections.length} section{page.sections.length === 1 ? "" : "s"}
                  </p>
                </div>
                <PageStatusBadge status={page.status} />
                <Link href={`/projects/${projectId}/editor?page=${page.id}`}>
                  <Button variant="outline" size="sm">
                    Open page
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Button>
                </Link>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* Requested sections */}
      {requestedSections.length > 0 && (
        <Card>
          <CardHeader title="Specific sections to revisit" />
          <CardBody className="divide-y divide-slate-100 p-0">
            {requestedSections.map(({ page, section }) => {
              const name =
                getVariation(section.variationId)?.name ??
                SECTION_TYPE_LABELS[section.sectionType];
              return (
                <div key={section.id} className="flex items-center gap-3 px-5 py-3">
                  <p className="min-w-0 flex-1 text-sm text-slate-800">
                    {page.name} › <span className="font-medium">{name}</span>
                  </p>
                  <Link
                    href={`/projects/${projectId}/editor?page=${page.id}&section=${section.id}`}
                  >
                    <Button variant="ghost" size="sm">
                      Jump to section
                      <ArrowRight className="size-3.5" aria-hidden />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </CardBody>
        </Card>
      )}

      {/* Action items */}
      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <CheckSquare className="size-4 text-slate-400" aria-hidden />
              Action items ({openActionItems.length} open)
            </span>
          }
        />
        <CardBody className="space-y-3">
          {actionItems.length === 0 ? (
            <p className="text-sm text-slate-500">
              No action items — the agency hasn&apos;t assigned specific to-dos.
            </p>
          ) : (
            [...openActionItems, ...doneActionItems].map((comment) => (
              <CommentCard
                key={comment.id}
                project={project}
                comment={comment}
                members={members}
              />
            ))
          )}
        </CardBody>
      </Card>

      {/* Open feedback */}
      {openFeedback.length > 0 && (
        <Card>
          <CardHeader
            title={`Open feedback (${openFeedback.length})`}
            description="Reply directly, or jump to the related section to make the change."
          />
          <CardBody className="space-y-3">
            {openFeedback.map((comment) => (
              <CommentCard
                key={comment.id}
                project={project}
                comment={comment}
                members={members}
              />
            ))}
          </CardBody>
        </Card>
      )}

      {!isRevising && activeRequest?.submittedAt && (
        <p className="flex items-center justify-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="size-4" aria-hidden />
          Revisions submitted {formatRelative(activeRequest.submittedAt)} — waiting for the
          agency.
        </p>
      )}

      <SubmissionDialog
        project={project}
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        mode="revisions"
      />
    </div>
  );
}
