"use client";

import { useState } from "react";
import { LifeBuoy, Send } from "lucide-react";
import { APP_CONFIG } from "@/config/app";
import { useCommentsStore } from "@/stores/comments-store";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import type { Project, ProjectPage } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label, Textarea } from "@/components/ui/input";

/**
 * "Ask the agency" — a friendly help channel for customers. Posts a
 * customer-visible comment on the current page (or selected section) so the
 * question lands in the same feedback stream the agency already watches.
 */
export function AskAgencyDialog({
  project,
  page,
  sectionId,
  open,
  onClose,
}: {
  project: Project;
  page: ProjectPage;
  sectionId?: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const user = useSessionStore((s) => s.user);
  const createComment = useCommentsStore((s) => s.createComment);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await createComment({
        projectId: project.id,
        pageId: page.id,
        sectionId: sectionId ?? undefined,
        scope: sectionId ? "section" : "page",
        visibility: "customer",
        authorId: user.id,
        message: `[Question for ${APP_CONFIG.agencyName}] ${trimmed}`,
        mentions: [],
        priority: "normal",
      });
      toast("Message sent", "success", "Your agency will get back to you here.");
      setMessage("");
      onClose();
    } catch {
      toast("Your message couldn't be sent", "error", "Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Ask the agency"
      description={
        sectionId
          ? "Your question will be attached to the selected section so the agency sees exactly what you mean."
          : `Your question will be attached to the “${page.name}” page.`
      }
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void handleSend()} disabled={!message.trim()} isLoading={sending}>
            <Send className="size-3.5" aria-hidden />
            Send to {APP_CONFIG.agencyName}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
          <LifeBuoy className="size-4 text-slate-500" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <Label htmlFor="ask-agency-message">What do you need help with?</Label>
          <Textarea
            id="ask-agency-message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Not sure what to write here? Wondering how something will look? Ask away — there are no silly questions."
          />
        </div>
      </div>
    </Dialog>
  );
}
