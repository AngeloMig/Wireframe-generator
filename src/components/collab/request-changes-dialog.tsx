"use client";

import { useState } from "react";
import { RefreshCcw } from "lucide-react";
import { notifyAgency } from "@/lib/collab-service";
import { withActivity } from "@/lib/project-utils";
import { useCommentsStore } from "@/stores/comments-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import type { Project, ProjectPage } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label, Textarea } from "@/components/ui/input";

/**
 * Customer "Request page changes" during approval — requires a message,
 * moves the page back to revisions-requested, and files the message as a
 * page comment so the conversation is preserved.
 */
export function RequestChangesDialog({
  project,
  page,
  open,
  onClose,
}: {
  project: Project;
  page: ProjectPage;
  open: boolean;
  onClose: () => void;
}) {
  const user = useSessionStore((s) => s.user);
  const updateProject = useProjectsStore((s) => s.updateProject);
  const createComment = useCommentsStore((s) => s.createComment);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    const trimmed = message.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await createComment({
        projectId: project.id,
        pageId: page.id,
        scope: "page",
        visibility: "customer",
        authorId: user.id,
        message: trimmed,
        mentions: [],
        priority: "high",
      });
      updateProject(
        project.id,
        (p) =>
          withActivity(
            {
              ...p,
              pages: p.pages.map((pg) =>
                pg.id === page.id ? { ...pg, status: "revisions-requested" as const } : pg,
              ),
            },
            "status-changed",
            `Changes requested on ${page.name}`,
            user,
          ),
        { immediate: true },
      );
      await notifyAgency(project, user.id, {
        projectId: project.id,
        pageId: page.id,
        type: "general",
        title: "Page changes requested",
        message: `${user.name} requested changes on ${page.name}: ${trimmed.slice(0, 80)}`,
        actionUrl: `/projects/${project.id}/agency-review`,
      });
      toast("Change request sent", "success");
      setMessage("");
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Request changes on ${page.name}`}
      description="Tell the agency what needs to change. Your note is added to the page conversation."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button disabled={!message.trim() || busy} onClick={() => void handleConfirm()}>
            <RefreshCcw className="size-4" aria-hidden />
            Send request
          </Button>
        </>
      }
    >
      <Label htmlFor="request-changes-message">What needs to change?</Label>
      <Textarea
        id="request-changes-message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        className="mt-1.5"
        placeholder="Describe the changes you'd like on this page…"
        autoFocus
      />
    </Dialog>
  );
}
