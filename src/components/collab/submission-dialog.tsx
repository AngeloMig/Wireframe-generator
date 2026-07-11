"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, Send, XCircle } from "lucide-react";
import { submitForReview, submitRevisions } from "@/lib/collab-service";
import { buildSubmissionReport } from "@/lib/submission";
import { selectProjectComments, useCommentsStore } from "@/stores/comments-store";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import type { Project } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label, Textarea } from "@/components/ui/input";

/**
 * Review-submission modal: shows what's being submitted, missing-content
 * warnings, open action items — warnings inform, only structural problems
 * block. Used for both first submission and revision submission.
 */
export function SubmissionDialog({
  project,
  open,
  onClose,
  mode,
}: {
  project: Project;
  open: boolean;
  onClose: () => void;
  mode: "review" | "revisions";
}) {
  const user = useSessionStore((s) => s.user);
  const comments = useCommentsStore((s) => selectProjectComments(s, project.id));
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const report = useMemo(
    () => buildSubmissionReport(project, comments),
    [project, comments],
  );

  const handleSubmit = async () => {
    if (report.blocked || submitting) return;
    setSubmitting(true);
    try {
      if (mode === "review") {
        await submitForReview(project, user, {
          note: note.trim() || undefined,
          pageIds: report.includedPages.map((p) => p.id),
        });
        toast("Submitted for review", "success", "The agency will take it from here.");
      } else {
        await submitRevisions(project, user, note.trim() || undefined);
        toast("Revisions submitted", "success", "The agency has been notified.");
      }
      onClose();
      setNote("");
    } catch {
      toast("Something went wrong while submitting", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const blockers = report.issues.filter((i) => i.blocking);
  const warnings = report.issues.filter((i) => !i.blocking);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={mode === "review" ? "Submit for agency review?" : "Submit your revisions?"}
      description={
        mode === "review"
          ? "The agency team will be notified and a snapshot of this version will be saved."
          : "The agency will re-review the pages you changed. A snapshot of this version will be saved."
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={report.blocked || submitting}>
            <Send className="size-4" aria-hidden />
            {submitting ? "Submitting…" : mode === "review" ? "Submit" : "Submit revisions"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">What&apos;s included</h3>
          <ul className="mt-2 space-y-1.5">
            {report.includedPages.map((page) => (
              <li key={page.id} className="flex items-center gap-2 text-sm text-slate-700">
                <FileText className="size-3.5 text-slate-400" aria-hidden />
                {page.name}
                <span className="text-xs text-slate-400">
                  {page.sections.length} section{page.sections.length === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
          {report.excludedPages.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              Left out (no sections yet):{" "}
              {report.excludedPages.map((p) => p.name).join(", ")}
            </p>
          )}
        </div>

        {blockers.length > 0 && (
          <div
            className="rounded-lg border border-rose-200 bg-rose-50 p-4"
            role="alert"
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold text-rose-800">
              <XCircle className="size-4" aria-hidden />
              Fix these before submitting
            </h3>
            <ul className="mt-2 space-y-1.5">
              {blockers.map((issue) => (
                <li key={issue.id} className="text-sm text-rose-700">
                  {issue.label}
                  {issue.detail && (
                    <span className="block text-xs text-rose-600">{issue.detail}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-800">
              <AlertTriangle className="size-4" aria-hidden />
              Worth knowing — you can still submit
            </h3>
            <ul className="mt-2 space-y-1.5">
              {warnings.map((issue) => (
                <li key={issue.id} className="text-sm text-amber-700">
                  {issue.label}
                  {issue.detail && (
                    <span className="block text-xs text-amber-600">{issue.detail}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {blockers.length === 0 && warnings.length === 0 && (
          <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <CheckCircle2 className="size-4" aria-hidden />
            Everything looks ready to go.
          </p>
        )}

        <div>
          <Label htmlFor="submission-note">
            Note for the {mode === "review" ? "agency" : "reviewers"} (optional)
          </Label>
          <Textarea
            id="submission-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              mode === "review"
                ? "Anything the agency should know about this blueprint…"
                : "Summarise what you changed…"
            }
            rows={3}
            className="mt-1.5"
          />
        </div>
      </div>
    </Dialog>
  );
}
