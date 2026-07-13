"use client";

import { useEffect, useState } from "react";
import { LifeBuoy, Send } from "lucide-react";
import { APP_CONFIG } from "@/config/app";
import { commentDeepLink, notifyNewComment, notifyUsers } from "@/lib/collab-service";
import { useCommentsStore } from "@/stores/comments-store";
import { selectProjectMembers, useMembersStore } from "@/stores/members-store";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import type { Project, ProjectPage } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/input";
import { MentionTextarea } from "@/components/collab/mention-textarea";

/**
 * "Ask the agency" — a friendly help channel for customers. Posts a
 * customer-visible comment on the current page (or selected section) so the
 * question lands in the same feedback stream the agency already watches.
 * Supports @mentions so the customer can direct the question at a specific
 * person on the agency team.
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
  const refreshMembers = useMembersStore((s) => s.refresh);
  const members = useMembersStore((s) => selectProjectMembers(s, project.id));
  const [message, setMessage] = useState("");
  const [mentions, setMentions] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  // Make sure the team roster is loaded so @mentions have someone to offer.
  useEffect(() => {
    if (open) void refreshMembers(project.id);
  }, [open, project.id, refreshMembers]);

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      // Keep only mentions whose names still appear in the text.
      const activeMentions = mentions.filter((id) => {
        const member = members.find((m) => m.userId === id);
        return member ? message.includes(`@${member.name}`) : false;
      });
      const fullMessage = `[Question for ${APP_CONFIG.agencyName}] ${trimmed}`;
      const created = await createComment({
        projectId: project.id,
        pageId: page.id,
        sectionId: sectionId ?? undefined,
        scope: sectionId ? "section" : "page",
        visibility: "customer",
        authorId: user.id,
        message: fullMessage,
        mentions: activeMentions,
        priority: "normal",
      });
      await notifyNewComment(project, user, {
        visibility: "customer",
        message: fullMessage,
        commentId: created.id,
        pageId: page.id,
        sectionId: sectionId ?? undefined,
      });
      for (const id of new Set(activeMentions)) {
        await notifyUsers([id], user.id, {
          projectId: project.id,
          pageId: page.id,
          sectionId: sectionId ?? undefined,
          type: "mention",
          title: "You were mentioned",
          message: `${user.name} mentioned you on “${project.name}”: ${trimmed.slice(0, 80)}`,
          actionUrl: commentDeepLink(
            members.find((m) => m.userId === id)?.role ?? "customer",
            project.id,
            { commentId: created.id, pageId: page.id, sectionId: sectionId ?? undefined },
          ),
        });
      }
      toast("Message sent", "success", "Your agency will get back to you here.");
      setMessage("");
      setMentions([]);
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
          <Label>What do you need help with?</Label>
          <MentionTextarea
            value={message}
            onChange={setMessage}
            mentions={mentions}
            onMentionsChange={setMentions}
            members={members.filter((m) => m.userId !== user.id)}
            rows={4}
            autoFocus={open}
            ariaLabel="Your question for the agency"
            placeholder="Not sure what to write? Wondering how something will look? Ask away — type @ to reach a specific person."
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Type <span className="font-medium">@</span> to mention someone on the agency team.
          </p>
        </div>
      </div>
    </Dialog>
  );
}
