"use client";

import { useRef, useState } from "react";
import { CheckSquare, Eye, EyeOff, Paperclip, Send, X } from "lucide-react";
import { canCreateComment } from "@/lib/permissions";
import { notifyNewComment, notifyUsers } from "@/lib/collab-service";
import { withActivity } from "@/lib/project-utils";
import { useCommentsStore } from "@/stores/comments-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import type {
  CommentAttachment,
  CommentPriority,
  CommentVisibility,
  Project,
  ProjectMember,
} from "@/types";
import { isAgencyUser } from "@/types";
import { createId } from "@/utils/id";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { MentionTextarea } from "./mention-textarea";

const PRIORITIES: { value: CommentPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

/**
 * Comment composer with mentions, visibility (agency only), priority,
 * assignee, optional action item + due date, and temporary attachments.
 */
export function CommentComposer({
  project,
  members,
  scope,
  pageId,
  sectionId,
  anchorKey,
  anchorLabel,
  onSubmitted,
  onCancel,
  autoFocus,
}: {
  project: Project;
  members: ProjectMember[];
  scope: "project" | "page" | "section";
  pageId?: string;
  sectionId?: string;
  anchorKey?: string;
  anchorLabel?: string;
  onSubmitted?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}) {
  const user = useSessionStore((s) => s.user);
  const createComment = useCommentsStore((s) => s.createComment);
  const updateProject = useProjectsStore((s) => s.updateProject);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [message, setMessage] = useState("");
  const [mentions, setMentions] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<CommentVisibility>("customer");
  const [priority, setPriority] = useState<CommentPriority>("normal");
  const [assignedToId, setAssignedToId] = useState("");
  const [isActionItem, setIsActionItem] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [attachments, setAttachments] = useState<CommentAttachment[]>([]);
  const [busy, setBusy] = useState(false);

  const agency = isAgencyUser(user.role);
  const page = pageId ? project.pages.find((p) => p.id === pageId) : undefined;

  const handleAttach = (files: FileList | null) => {
    if (!files) return;
    const next: CommentAttachment[] = [];
    for (const file of Array.from(files).slice(0, 3 - attachments.length)) {
      next.push({
        id: createId(),
        name: file.name,
        type: file.type,
        size: file.size,
        // Temporary browser preview only — no permanent storage yet.
        previewUrl: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined,
      });
    }
    setAttachments((prev) => [...prev, ...next]);
  };

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed || busy) return;
    if (!canCreateComment(user.role, visibility)) return;
    setBusy(true);
    try {
      // Only keep mentions whose names still appear in the message.
      const activeMentions = mentions.filter((id) => {
        const member = members.find((m) => m.userId === id);
        return member ? message.includes(`@${member.name}`) : false;
      });

      await createComment({
        projectId: project.id,
        pageId,
        sectionId,
        anchorKey,
        anchorLabel,
        scope,
        visibility,
        authorId: user.id,
        assignedToId: assignedToId || undefined,
        message: trimmed,
        mentions: activeMentions,
        priority,
        attachments,
        isActionItem,
        dueDate: dueDate || undefined,
      });

      updateProject(
        project.id,
        (p) =>
          withActivity(
            p,
            isActionItem ? "action-item-assigned" : "comment-created",
            isActionItem
              ? `Action item created${page ? ` on ${page.name}` : ""}`
              : `Comment added${page ? ` on ${page.name}` : ""}`,
            user,
          ),
        { immediate: true },
      );

      // Notify mentioned members + assignee.
      if (activeMentions.length > 0) {
        await notifyUsers(activeMentions, user.id, {
          projectId: project.id,
          pageId,
          sectionId,
          type: "mention",
          title: "You were mentioned",
          message: `${user.name} mentioned you on “${project.name}”: ${trimmed.slice(0, 80)}`,
          actionUrl: `/projects/${project.id}/overview`,
        });
      }
      if (assignedToId) {
        await notifyUsers([assignedToId], user.id, {
          projectId: project.id,
          pageId,
          sectionId,
          type: "comment-assigned",
          title: isActionItem ? "Action item assigned to you" : "Comment assigned to you",
          message: `${user.name} assigned you: ${trimmed.slice(0, 80)}`,
          actionUrl: `/projects/${project.id}/overview`,
        });
      }

      // Notify the other side so a plain comment (no @mention, no assignee)
      // still reaches someone. Mentions/assignees may double-up — minor
      // redundancy, not a miss.
      await notifyNewComment(project, user, {
        visibility,
        message: trimmed,
        pageId,
        sectionId,
      });

      toast(isActionItem ? "Action item created" : "Comment added", "success");
      setMessage("");
      setMentions([]);
      setAttachments([]);
      setIsActionItem(false);
      setDueDate("");
      setAssignedToId("");
      setPriority("normal");
      onSubmitted?.();
    } catch {
      toast("Could not save the comment", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <MentionTextarea
        value={message}
        onChange={setMessage}
        mentions={mentions}
        onMentionsChange={setMentions}
        members={members.filter((m) => m.userId !== user.id)}
        placeholder={
          scope === "project"
            ? "Ask a question or leave feedback… Type @ to mention someone."
            : "Leave feedback on this " + scope + "… Type @ to mention someone."
        }
        rows={3}
        autoFocus={autoFocus}
        ariaLabel="Comment message"
      />

      {attachments.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {attachments.map((att) => (
            <li
              key={att.id}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-1 pr-1 pl-2 text-xs text-slate-600"
            >
              {att.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={att.previewUrl}
                  alt=""
                  className="size-6 rounded object-cover"
                />
              ) : (
                <Paperclip className="size-3.5" aria-hidden />
              )}
              <span className="max-w-32 truncate">{att.name}</span>
              <button
                type="button"
                aria-label={`Remove attachment ${att.name}`}
                className="cursor-pointer rounded p-0.5 hover:bg-slate-200"
                onClick={() =>
                  setAttachments((prev) => prev.filter((a) => a.id !== att.id))
                }
              >
                <X className="size-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-end gap-2">
        {agency && (
          <div>
            <Label htmlFor={`composer-visibility-${scope}`} className="text-xs">
              Visibility
            </Label>
            <Select
              id={`composer-visibility-${scope}`}
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as CommentVisibility)}
              className="mt-1 h-8 text-xs"
            >
              <option value="customer">Customer visible</option>
              <option value="agency">Agency only</option>
            </Select>
          </div>
        )}
        <div>
          <Label htmlFor={`composer-priority-${scope}`} className="text-xs">
            Priority
          </Label>
          <Select
            id={`composer-priority-${scope}`}
            value={priority}
            onChange={(e) => setPriority(e.target.value as CommentPriority)}
            className="mt-1 h-8 text-xs"
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor={`composer-assignee-${scope}`} className="text-xs">
            Assign to
          </Label>
          <Select
            id={`composer-assignee-${scope}`}
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            className="mt-1 h-8 text-xs"
          >
            <option value="">No one</option>
            {members.map((m) => (
              <option key={m.id} value={m.userId}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>
        <button
          type="button"
          aria-pressed={isActionItem}
          onClick={() => setIsActionItem((v) => !v)}
          className={cn(
            "flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors",
            isActionItem
              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
              : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
          )}
        >
          <CheckSquare className="size-3.5" aria-hidden />
          Action item
        </button>
        {isActionItem && (
          <div>
            <Label htmlFor={`composer-due-${scope}`} className="text-xs">
              Due date
            </Label>
            <Input
              id={`composer-due-${scope}`}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 h-8 text-xs"
            />
          </div>
        )}
      </div>

      {agency && (
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          {visibility === "agency" ? (
            <>
              <EyeOff className="size-3.5 text-amber-500" aria-hidden />
              Internal note — the customer will not see this.
            </>
          ) : (
            <>
              <Eye className="size-3.5 text-slate-400" aria-hidden />
              Visible to the customer.
            </>
          )}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            hidden
            onChange={(e) => {
              handleAttach(e.target.files);
              e.target.value = "";
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={attachments.length >= 3}
          >
            <Paperclip className="size-3.5" aria-hidden />
            Attach
          </Button>
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel} disabled={busy}>
              Cancel
            </Button>
          )}
          <Button size="sm" onClick={() => void handleSubmit()} disabled={!message.trim() || busy}>
            <Send className="size-3.5" aria-hidden />
            Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
