"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  Circle,
  History,
  MessageSquare,
  Send,
  ShieldCheck,
  Undo2,
} from "lucide-react";
import { PROJECT_STATUS_META } from "@/config/labels";
import { approvePage, approveProject, unlockPage } from "@/lib/collab-service";
import { canApprove, canUnlockApproved } from "@/lib/permissions";
import { withActivity, projectChecklist } from "@/lib/project-utils";
import { useProject } from "@/hooks/use-project";
import { activeApprovalFor, selectProjectApprovals, useApprovalsStore } from "@/stores/approvals-store";
import { selectProjectComments, useCommentsStore } from "@/stores/comments-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import { cn } from "@/utils/cn";
import type { ProjectPage } from "@/types";
import { PageStatusBadge, ProjectStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Label, Textarea } from "@/components/ui/input";
import { SubmissionDialog } from "@/components/collab/submission-dialog";
import { RequestChangesDialog } from "@/components/collab/request-changes-dialog";

const SUBMITTED_STATUSES = new Set([
  "ready-for-review",
  "agency-reviewing",
  "awaiting-approval",
  "partially-approved",
  "approved",
  "in-development",
  "completed",
]);

const APPROVAL_STATUSES = new Set(["awaiting-approval", "partially-approved"]);

export default function ReviewPage() {
  const { project, projectId } = useProject();
  const updateProject = useProjectsStore((s) => s.updateProject);
  const user = useSessionStore((s) => s.user);
  const loadComments = useCommentsStore((s) => s.load);
  const loadApprovals = useApprovalsStore((s) => s.load);
  const comments = useCommentsStore((s) => selectProjectComments(s, projectId));
  const approvals = useApprovalsStore((s) => selectProjectApprovals(s, projectId));
  const [submitOpen, setSubmitOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<ProjectPage | null>(null);
  const [changesTarget, setChangesTarget] = useState<ProjectPage | null>(null);
  const [unlockTarget, setUnlockTarget] = useState<ProjectPage | null>(null);
  const [projectApproveOpen, setProjectApproveOpen] = useState(false);

  useEffect(() => {
    if (projectId) {
      void loadComments(projectId);
      void loadApprovals(projectId);
    }
  }, [projectId, loadComments, loadApprovals]);

  if (!project) return null; // ProjectShell handles loading and not-found.

  const checklist = projectChecklist(project);
  const isSubmitted = SUBMITTED_STATUSES.has(project.status);
  const inApproval = APPROVAL_STATUSES.has(project.status);
  const statusMeta = PROJECT_STATUS_META[project.status];
  const visibleComments = comments.filter(
    (c) => user.role !== "customer" || c.visibility === "customer",
  );
  const openComments = visibleComments.filter(
    (c) => c.status === "open" || c.status === "reopened",
  );
  const isRevising =
    project.status === "revisions-requested" || project.status === "customer-revising";

  const handleWithdraw = () => {
    updateProject(
      projectId,
      (p) =>
        withActivity(
          {
            ...p,
            status: "customer-editing" as const,
            pages: p.pages.map((page) =>
              page.status === "ready-for-review"
                ? { ...page, status: "content-needed" as const }
                : page,
            ),
          },
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

          {!isSubmitted && !isRevising && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-900">
                Pre-submission checklist
              </h3>
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
          )}

          {isRevising && (
            <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800">
              The agency has requested revisions.{" "}
              <Link
                href={`/projects/${projectId}/revisions`}
                className="font-medium underline underline-offset-2"
              >
                Open the revision summary
              </Link>{" "}
              to see what they need, then submit your revisions from there.
            </div>
          )}

          {isSubmitted && !inApproval ? (
            <div className="flex flex-wrap items-center gap-3 rounded-lg bg-emerald-50 px-4 py-3">
              <Check className="size-4 text-emerald-600" aria-hidden />
              <p className="flex-1 text-sm text-emerald-800">
                Your blueprint has been submitted.
                {project.status === "ready-for-review" &&
                  " You can withdraw it if you want to keep editing."}
              </p>
              {project.status === "ready-for-review" && user.role === "customer" && (
                <Button variant="outline" size="sm" onClick={handleWithdraw}>
                  <Undo2 className="size-3.5" aria-hidden />
                  Withdraw & keep editing
                </Button>
              )}
            </div>
          ) : !isSubmitted && !isRevising ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <p className="text-sm text-slate-500">
                A version snapshot is saved with every submission.
              </p>
              <Button className="ml-auto" onClick={() => setSubmitOpen(true)}>
                <Send className="size-4" aria-hidden />
                Submit for Review
              </Button>
            </div>
          ) : null}
        </CardBody>
      </Card>

      {inApproval && (
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="size-4 text-slate-400" aria-hidden />
                Approvals
              </span>
            }
            description="Approve each page, then approve the whole blueprint. Approved pages are locked against accidental changes."
          />
          <CardBody className="space-y-3">
            {project.pages
              .filter((p) => p.sections.length > 0)
              .map((page) => {
                const pageApproval = activeApprovalFor(approvals, {
                  scope: "page",
                  pageId: page.id,
                });
                const openOnPage = openComments.filter((c) => c.pageId === page.id).length;
                const approvedSections = page.sections.filter(
                  (s) => s.reviewStatus === "approved",
                ).length;
                const isApproved = page.status === "approved" || page.status === "locked";
                return (
                  <div
                    key={page.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">{page.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {approvedSections}/{page.sections.length} sections approved
                        {openOnPage > 0 && ` · ${openOnPage} open comment${openOnPage === 1 ? "" : "s"}`}
                      </p>
                    </div>
                    <PageStatusBadge status={page.status} />
                    {!isApproved && page.status === "ready-for-approval" && canApprove(user.role) && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setChangesTarget(page)}>
                          Request changes
                        </Button>
                        <Button size="sm" onClick={() => setApproveTarget(page)}>
                          <CheckCircle2 className="size-3.5" aria-hidden />
                          Approve page
                        </Button>
                      </div>
                    )}
                    {isApproved && pageApproval && (
                      <span className="text-xs text-emerald-700">
                        Approved {new Date(pageApproval.approvedAt).toLocaleDateString()}
                      </span>
                    )}
                    {isApproved && canUnlockApproved(user.role) && (
                      <Button size="sm" variant="outline" onClick={() => setUnlockTarget(page)}>
                        Unlock
                      </Button>
                    )}
                  </div>
                );
              })}

            <ProjectApprovalFooter
              onApprove={() => setProjectApproveOpen(true)}
              projectStatus={project.status}
              pages={project.pages}
              openCommentCount={openComments.filter((c) => c.priority === "urgent").length}
              openActionItems={
                visibleComments.filter((c) => c.isActionItem && !c.completedAt && c.priority === "urgent").length
              }
              canAct={canApprove(user.role)}
            />
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <MessageSquare className="size-4 text-slate-400" aria-hidden />
              Feedback ({openComments.length} open)
            </span>
          }
          description="The full conversation lives on the project overview — this is the latest feedback."
          action={
            <Link
              href={`/projects/${projectId}/overview`}
              className="text-sm font-medium whitespace-nowrap text-indigo-600 hover:text-indigo-800"
            >
              Open collaboration
            </Link>
          }
        />
        <CardBody className="divide-y divide-slate-100 p-0">
          {visibleComments.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">
              No feedback yet — comments from the agency will appear here after review
              starts.
            </p>
          ) : (
            visibleComments.slice(0, 5).map((comment) => (
              <div key={comment.id} className="px-5 py-3.5">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span
                    className={cn(
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
        {" · "}
        <Link
          href={`/projects/${projectId}/versions`}
          className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-800"
        >
          <History className="size-3" aria-hidden />
          Version history
        </Link>
      </p>

      <SubmissionDialog
        project={project}
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        mode="review"
      />

      <PageApprovalDialog
        page={approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={async (note) => {
          if (!approveTarget) return;
          await approvePage(project, approveTarget, user, note);
          setApproveTarget(null);
          toast(`${approveTarget.name} approved`, "success");
        }}
      />

      {changesTarget && (
        <RequestChangesDialog
          project={project}
          page={changesTarget}
          open
          onClose={() => setChangesTarget(null)}
        />
      )}

      <UnlockPageDialog
        page={unlockTarget}
        onClose={() => setUnlockTarget(null)}
        onConfirm={async (reason) => {
          if (!unlockTarget) return;
          await unlockPage(project, unlockTarget, user, reason);
          setUnlockTarget(null);
          toast(`${unlockTarget.name} unlocked`, "success", "The approval was revoked and a version saved.");
        }}
      />

      <ProjectApprovalDialog
        open={projectApproveOpen}
        project={project}
        onClose={() => setProjectApproveOpen(false)}
        onConfirm={async (note) => {
          await approveProject(project, user, note);
          setProjectApproveOpen(false);
          toast("Blueprint approved 🎉", "success", "The agency has been notified.");
        }}
      />
    </div>
  );
}

function ProjectApprovalFooter({
  onApprove,
  projectStatus,
  pages,
  openCommentCount,
  openActionItems,
  canAct,
}: {
  onApprove: () => void;
  projectStatus: string;
  pages: ProjectPage[];
  openCommentCount: number;
  openActionItems: number;
  canAct: boolean;
}) {
  const contentPages = pages.filter((p) => p.sections.length > 0);
  const homepage = pages.find((p) => p.isHomepage);
  const homepageApproved =
    homepage && (homepage.status === "approved" || homepage.status === "locked");
  const allApproved = contentPages.every(
    (p) => p.status === "approved" || p.status === "locked",
  );
  const blockers: string[] = [];
  if (!homepageApproved) blockers.push("The homepage must be approved first.");
  if (!allApproved) blockers.push("All submitted pages must be approved (or reopened).");
  if (openCommentCount > 0) blockers.push("Resolve urgent comments first.");
  if (openActionItems > 0) blockers.push("Complete urgent action items first.");

  if (projectStatus === "approved") return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
      <div className="text-xs text-slate-500">
        {blockers.length > 0 ? (
          <ul className="list-disc space-y-0.5 pl-4">
            {blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        ) : (
          "Everything is approved — you can now approve the complete blueprint."
        )}
      </div>
      <Button disabled={blockers.length > 0 || !canAct} onClick={onApprove}>
        <ShieldCheck className="size-4" aria-hidden />
        Approve blueprint
      </Button>
    </div>
  );
}

function UnlockPageDialog({
  page,
  onClose,
  onConfirm,
}: {
  page: ProjectPage | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog
      open={page !== null}
      onClose={onClose}
      title={page ? `Unlock ${page.name}?` : "Unlock page"}
      description="Unlocking removes the approval, saves a version snapshot, and notifies the project members. A reason is required."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={!reason.trim() || busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm(reason.trim());
                setReason("");
              } finally {
                setBusy(false);
              }
            }}
          >
            Unlock page
          </Button>
        </>
      }
    >
      <Label htmlFor="unlock-reason">Why is this being unlocked?</Label>
      <Textarea
        id="unlock-reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        className="mt-1.5"
        autoFocus
      />
    </Dialog>
  );
}

function PageApprovalDialog({
  page,
  onClose,
  onConfirm,
}: {
  page: ProjectPage | null;
  onClose: () => void;
  onConfirm: (note?: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog
      open={page !== null}
      onClose={onClose}
      title={page ? `Approve ${page.name}?` : "Approve page"}
      description="Approving locks this page against accidental changes. The agency can unlock it later if something needs to change."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm(note.trim() || undefined);
                setNote("");
              } finally {
                setBusy(false);
              }
            }}
          >
            <CheckCircle2 className="size-4" aria-hidden />
            Approve page
          </Button>
        </>
      }
    >
      <Label htmlFor="page-approval-note">Approval note (optional)</Label>
      <Textarea
        id="page-approval-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        className="mt-1.5"
        placeholder="Anything to note about this approval…"
      />
    </Dialog>
  );
}

function ProjectApprovalDialog({
  open,
  project,
  onClose,
  onConfirm,
}: {
  open: boolean;
  project: { pages: ProjectPage[]; questionnaire: { visualStyles: string[] } };
  onClose: () => void;
  onConfirm: (note?: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const approvedPages = project.pages.filter(
    (p) => p.status === "approved" || p.status === "locked",
  );
  const excludedPages = project.pages.filter((p) => p.sections.length === 0);
  const missingContent = project.pages.reduce(
    (sum, p) =>
      sum + p.sections.filter((s) => s.notes.contentStatus === "not-started").length,
    0,
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Approve the complete blueprint?"
      description="This confirms the planned structure and content direction of your website."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            disabled={!acknowledged || busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm(note.trim() || undefined);
                setNote("");
                setAcknowledged(false);
              } finally {
                setBusy(false);
              }
            }}
          >
            <ShieldCheck className="size-4" aria-hidden />
            Approve blueprint
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">
              Approved pages
            </p>
            <ul className="mt-1.5 space-y-1 text-sm text-emerald-900">
              {approvedPages.map((p) => (
                <li key={p.id}>{p.name}</li>
              ))}
              {approvedPages.length === 0 && <li className="text-emerald-700">None yet</li>}
            </ul>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Not included
            </p>
            <ul className="mt-1.5 space-y-1 text-sm text-slate-700">
              {excludedPages.map((p) => (
                <li key={p.id}>{p.name} (no sections)</li>
              ))}
              {excludedPages.length === 0 && <li className="text-slate-500">Nothing excluded</li>}
            </ul>
          </div>
        </div>

        {missingContent > 0 && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {missingContent} section{missingContent === 1 ? "" : "s"} still use placeholder
            content — the agency will source or request this during development.
          </p>
        )}

        <p className="text-sm text-slate-600">
          After approval the agency prepares the development handoff. Design direction:{" "}
          {project.questionnaire.visualStyles.join(", ") || "as discussed"}.
        </p>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-0.5 size-4 accent-indigo-600"
          />
          <span>
            I understand that this approved blueprint defines the planned website structure
            and content direction. Final design and development details may still be refined
            during implementation.
          </span>
        </label>

        <div>
          <Label htmlFor="project-approval-note">Approval note (optional)</Label>
          <Textarea
            id="project-approval-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="mt-1.5"
          />
        </div>
      </div>
    </Dialog>
  );
}
