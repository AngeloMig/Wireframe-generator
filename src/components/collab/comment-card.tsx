"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArchiveRestore,
  CheckCircle2,
  CheckSquare,
  Clock3,
  EyeOff,
  Link2,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Reply,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { COMMENT_PRIORITY_META, COMMENT_STATUS_META, SECTION_TYPE_LABELS } from "@/config/labels";
import { getVariation } from "@/data/section-variations";
import { commentDeepLink, notifyUsers } from "@/lib/collab-service";
import {
  canAssignComments,
  canChangeCommentPriority,
  canCompleteActionItem,
  canDeleteComment,
  canEditComment,
  canResolveComment,
} from "@/lib/permissions";

import { withActivity } from "@/lib/project-utils";
import { conversationStatusLabel } from "@/lib/conversation-status";
import { nowIso } from "@/utils/id";
import { useCommentsStore } from "@/stores/comments-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import type {
  CommentPriority,
  Project,
  ProjectComment,
  ProjectMember,
} from "@/types";
import { cn } from "@/utils/cn";
import { formatRelative } from "@/utils/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import {
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
  DropdownSeparator,
} from "@/components/ui/dropdown-menu";
import { Select, Textarea } from "@/components/ui/input";
import { MentionTextarea } from "./mention-textarea";

function MemberChip({ member, fallback }: { member?: ProjectMember; fallback?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className={cn(
          "flex size-5 items-center justify-center rounded-full text-[9px] font-semibold text-white",
          member?.avatarColor ?? "bg-slate-400",
        )}
      >
        {member?.initials ?? "?"}
      </span>
      <span className="text-xs font-medium text-slate-700">
        {member?.name ?? fallback ?? "Team member"}
      </span>
    </span>
  );
}


/**
 * One comment conversation: message, badges, replies, and every
 * permission-gated action (reply, edit, delete, resolve, assign, priority,
 * copy link, jump to section, complete action item, restore deleted section).
 */
export function CommentCard({
  project,
  comment,
  members,
  onNavigate,
}: {
  project: Project;
  comment: ProjectComment;
  members: ProjectMember[];
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const store = useCommentsStore();
  const updateProject = useProjectsStore((s) => s.updateProject);

  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyMentions, setReplyMentions] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.message);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  const author = members.find((m) => m.userId === comment.authorId);
  const assignee = members.find((m) => m.userId === comment.assignedToId);
  const page = comment.pageId
    ? project.pages.find((p) => p.id === comment.pageId)
    : undefined;
  const section =
    comment.sectionId && page
      ? page.sections.find((s) => s.id === comment.sectionId)
      : undefined;
  const sectionLabel = section
    ? (getVariation(section.variationId)?.name ?? SECTION_TYPE_LABELS[section.sectionType])
    : undefined;

  const statusMeta = COMMENT_STATUS_META[comment.status];
  const statusLabel = conversationStatusLabel(comment.status, author?.role);
  const priorityMeta = COMMENT_PRIORITY_META[comment.priority];
  const isInternal = comment.visibility === "agency";
  const isResolved = comment.status === "resolved";
  const isOpenActionItem = comment.isActionItem && !comment.completedAt;
  const reactionOptions = ["👍", "✅", "❤️", "👀"];
  const toggleReaction = (emoji: string) => {
    const current = comment.reactions?.[emoji] ?? [];
    const next = current.includes(user.id)
      ? current.filter((id) => id !== user.id)
      : [...current, user.id];
    void store.updateComment(project.id, comment.id, {
      reactions: { ...(comment.reactions ?? {}), [emoji]: next },
    });
  };

  const handleReply = async () => {
    const trimmed = replyText.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await store.addReply(project.id, comment.id, {
        authorId: user.id,
        message: trimmed,
        mentions: replyMentions,
      });
      await store.updateComment(project.id, comment.id, {
        status: user.role === "customer" ? "open" : "in-progress",
      });
      updateProject(
        project.id,
        (p) => withActivity(p, "comment-replied", "Replied to a comment", user),
        { immediate: true },
      );
      // Per-recipient links: agency → the thread in the review queue,
      // customers → the editor (they can't open agency routes).
      const notifyIds = [comment.authorId, ...replyMentions];
      for (const id of new Set(notifyIds)) {
        await notifyUsers([id], user.id, {
          projectId: project.id,
          pageId: comment.pageId,
          sectionId: comment.sectionId,
          type: "comment-reply",
          title: "New reply",
          message: `${user.name} replied: ${trimmed.slice(0, 80)}`,
          actionUrl: commentDeepLink(
            members.find((m) => m.userId === id)?.role ?? "customer",
            project.id,
            { commentId: comment.id, pageId: comment.pageId, sectionId: comment.sectionId },
          ),
        });
      }
      setReplyText("");
      setReplyMentions([]);
      setReplying(false);
    } finally {
      setBusy(false);
    }
  };

  const handleResolveToggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (isResolved) {
        await store.reopenComment(project.id, comment.id);
        updateProject(
          project.id,
          (p) => withActivity(p, "comment-reopened", "Reopened a comment", user),
          { immediate: true },
        );
        toast("Conversation reopened", "info");
      } else {
        await store.resolveComment(project.id, comment.id, user.id);
        updateProject(
          project.id,
          (p) => withActivity(p, "comment-resolved", "Resolved a comment", user),
          { immediate: true },
        );
        toast("Marked as resolved", "success");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCompleteActionItem = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (comment.completedAt) {
        await store.updateComment(project.id, comment.id, {
          completedAt: undefined,
          completedById: undefined,
          status: "reopened",
        });
        toast("Action item reopened", "info");
      } else {
        await store.updateComment(project.id, comment.id, {
          completedAt: nowIso(),
          completedById: user.id,
          status: "resolved",
          resolvedAt: nowIso(),
          resolvedById: user.id,
        });
        updateProject(
          project.id,
          (p) => withActivity(p, "action-item-completed", "Completed an action item", user),
          { immediate: true },
        );
        await notifyUsers([comment.authorId], user.id, {
          projectId: project.id,
          type: "general",
          title: "Action item completed",
          message: `${user.name} completed: ${comment.message.slice(0, 80)}`,
          actionUrl: commentDeepLink(
            members.find((m) => m.userId === comment.authorId)?.role ?? "customer",
            project.id,
            { commentId: comment.id, pageId: comment.pageId, sectionId: comment.sectionId },
          ),
        });
        toast("Action item completed", "success");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRestoreSection = () => {
    const ctx = comment.deletedSection;
    if (!ctx?.sectionSnapshot || !comment.pageId) return;
    updateProject(
      project.id,
      (p) =>
        withActivity(
          {
            ...p,
            pages: p.pages.map((pg) => {
              if (pg.id !== comment.pageId) return pg;
              const restored = structuredClone(
                ctx.sectionSnapshot,
              ) as unknown as (typeof pg.sections)[number];
              return {
                ...pg,
                sections: [...pg.sections, { ...restored, order: pg.sections.length }],
              };
            }),
          },
          "section-added",
          `Restored the ${ctx.sectionName} section from a comment`,
          user,
        ),
      { immediate: true },
    );
    void store.updateComment(project.id, comment.id, { deletedSection: undefined });
    toast("Section restored", "success", "It was added to the end of the page.");
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/projects/${project.id}/overview?comment=${comment.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied", "success");
    } catch {
      toast("Could not copy the link", "error");
    }
  };

  const goToTarget = () => {
    if (comment.pageId) {
      const params = new URLSearchParams({ page: comment.pageId });
      if (comment.sectionId && !comment.deletedSection) {
        params.set("section", comment.sectionId);
      }
      router.push(`/projects/${project.id}/editor?${params.toString()}`);
      onNavigate?.();
    }
  };

  return (
    <article
      className={cn(
        "rounded-xl border p-4",
        isInternal
          ? "border-amber-200 bg-amber-50/60"
          : "border-slate-200 bg-white",
        isResolved && "opacity-75",
      )}
      aria-label={`Comment by ${author?.name ?? "team member"}`}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <MemberChip member={author} />
          <span className="text-xs text-slate-400">
            {formatRelative(comment.createdAt)}
          </span>
          {isInternal && (
            <Badge className="border-amber-300 bg-amber-100 text-amber-800">
              <EyeOff className="mr-1 size-3" aria-hidden />
              Agency only
            </Badge>
          )}
          {comment.isActionItem && (
            <Badge
              className={cn(
                comment.completedAt
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-indigo-200 bg-indigo-50 text-indigo-700",
              )}
            >
              <CheckSquare className="mr-1 size-3" aria-hidden />
              {comment.completedAt ? "Done" : "Action item"}
            </Badge>
          )}
          <Badge className={statusMeta.badgeClass}>{statusLabel}</Badge>
          {comment.priority !== "normal" && (
            <Badge className={priorityMeta.badgeClass}>{priorityMeta.label}</Badge>
          )}
          <Select
            aria-label="Conversation status"
            value={comment.status}
            className="h-7 w-auto min-w-28 text-[11px]"
            onChange={(event) => {
              void store.updateComment(project.id, comment.id, {
                status: event.target.value as ProjectComment["status"],
                ...(event.target.value === "resolved" ? { resolvedAt: nowIso(), resolvedById: user.id } : {}),
              });
            }}
          >
            <option value="open">{user.role === "customer" ? "Open" : "Waiting for agency"}</option>
            <option value="in-progress">{user.role === "customer" ? "Waiting for customer" : "In progress"}</option>
            <option value="reopened">Reopened</option>
            <option value="resolved">Resolved</option>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReplying(true)}
            className="hidden sm:inline-flex"
          >
            <Reply className="size-3.5" aria-hidden />
            Reply
          </Button>
        <DropdownMenu
          align="end"
          className="w-56"
          trigger={(props) => (
            <button
              type="button"
              {...props}
              aria-label="Comment actions"
              className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </button>
          )}
        >
          {canResolveComment(user.role, comment, user.id) && (
            <DropdownItem onSelect={() => void handleResolveToggle()}>
              {isResolved ? (
                <>
                  <RotateCcw className="size-4 text-slate-400" aria-hidden /> Reopen
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4 text-slate-400" aria-hidden /> Resolve
                </>
              )}
            </DropdownItem>
          )}
          {comment.isActionItem && canCompleteActionItem(user.role, comment, user.id) && (
            <DropdownItem onSelect={() => void handleCompleteActionItem()}>
              <CheckSquare className="size-4 text-slate-400" aria-hidden />
              {comment.completedAt ? "Reopen action item" : "Mark complete"}
            </DropdownItem>
          )}
          {canEditComment(user.role, comment, user.id) && (
            <DropdownItem
              onSelect={() => {
                setEditText(comment.message);
                setEditing(true);
              }}
            >
              <Pencil className="size-4 text-slate-400" aria-hidden /> Edit
            </DropdownItem>
          )}
          <DropdownItem onSelect={() => void copyLink()}>
            <Link2 className="size-4 text-slate-400" aria-hidden /> Copy link
          </DropdownItem>
          {page && (
            <DropdownItem onSelect={goToTarget}>
              <Reply className="size-4 rotate-180 text-slate-400" aria-hidden />
              {comment.sectionId ? "View section" : "View page"}
            </DropdownItem>
          )}
          {canAssignComments(user.role) && (
            <>
              <DropdownSeparator />
              <DropdownLabel>Assign to</DropdownLabel>
              <div className="px-2 pb-1.5">
                <Select
                  aria-label="Assign comment"
                  value={comment.assignedToId ?? ""}
                  className="h-8 text-xs"
                  onChange={(e) => {
                    const value = e.target.value || undefined;
                    void store
                      .updateComment(project.id, comment.id, { assignedToId: value })
                      .then(() => {
                        if (value) {
                          void notifyUsers([value], user.id, {
                            projectId: project.id,
                            type: "comment-assigned",
                            title: "Comment assigned to you",
                            message: `${user.name} assigned you: ${comment.message.slice(0, 80)}`,
                            actionUrl: commentDeepLink(
                              members.find((m) => m.userId === value)?.role ?? "customer",
                              project.id,
                              { commentId: comment.id, pageId: comment.pageId, sectionId: comment.sectionId },
                            ),
                          });
                        }
                      });
                  }}
                >
                  <option value="">No one</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.userId}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              </div>
            </>
          )}
          {canChangeCommentPriority(user.role) && (
            <>
              <DropdownLabel>Priority</DropdownLabel>
              <div className="px-2 pb-1.5">
                <Select
                  aria-label="Comment priority"
                  value={comment.priority}
                  className="h-8 text-xs"
                  onChange={(e) =>
                    void store.updateComment(project.id, comment.id, {
                      priority: e.target.value as CommentPriority,
                    })
                  }
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </Select>
              </div>
            </>
          )}
          {canDeleteComment(user.role, comment, user.id) && (
            <>
              <DropdownSeparator />
              <DropdownItem onSelect={() => setConfirmDelete(true)}>
                <Trash2 className="size-4 text-rose-400" aria-hidden />
                <span className="text-rose-600">Delete</span>
              </DropdownItem>
            </>
          )}
        </DropdownMenu>
        </div>
      </header>

      {(page || comment.deletedSection) && (
        <p className="mt-1.5 text-xs text-slate-500">
          On{" "}
          {comment.deletedSection ? (
            <span className="font-medium text-slate-600">
              {comment.deletedSection.sectionName}
              <span className="ml-1 rounded bg-slate-200 px-1 py-px text-[10px] text-slate-600">
                section deleted
              </span>
            </span>
          ) : (
            <button
              type="button"
              onClick={goToTarget}
              className="cursor-pointer font-medium text-indigo-600 underline-offset-2 hover:underline"
            >
              {page?.name}
              {sectionLabel ? ` › ${sectionLabel}` : ""}
            </button>
          )}
        </p>
      )}

      {editing ? (
        <div className="mt-2 space-y-2">
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            aria-label="Edit comment"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!editText.trim()}
              onClick={() => {
                void store
                  .updateComment(project.id, comment.id, { message: editText.trim() })
                  .then(() => setEditing(false));
              }}
            >
              Save
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm whitespace-pre-wrap text-slate-800">{comment.message}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Comment reactions">
        {reactionOptions.map((emoji) => {
          const users = comment.reactions?.[emoji] ?? [];
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => toggleReaction(emoji)}
              aria-label={`${emoji} reaction${users.length ? `, ${users.length}` : ""}`}
              aria-pressed={users.includes(user.id)}
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs transition-colors",
                users.includes(user.id)
                  ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                  : "border-slate-200 bg-white hover:bg-slate-50",
              )}
            >
              {emoji}{users.length > 0 && <span className="ml-1 text-[10px] text-slate-500">{users.length}</span>}
            </button>
          );
        })}
      </div>

      {comment.attachments.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {comment.attachments.map((att) => (
            <li key={att.id}>
              {att.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={att.previewUrl}
                  alt={att.name}
                  className="h-16 rounded-lg border border-slate-200 object-cover"
                />
              ) : (
                <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
                  <Paperclip className="size-3" aria-hidden />
                  {att.name}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        {assignee && (
          <span className="inline-flex items-center gap-1">
            Assigned to <MemberChip member={assignee} />
          </span>
        )}
        {comment.dueDate && isOpenActionItem && (
          <span
            className={cn(
              new Date(comment.dueDate) < new Date() && "font-medium text-rose-600",
            )}
          >
            Due {new Date(comment.dueDate).toLocaleDateString()}
          </span>
        )}
        {comment.deletedSection && comment.deletedSection.sectionSnapshot && (
          <button
            type="button"
            onClick={handleRestoreSection}
            className="inline-flex cursor-pointer items-center gap-1 font-medium text-indigo-600 hover:text-indigo-800"
          >
            <ArchiveRestore className="size-3.5" aria-hidden />
            Restore section
          </button>
        )}
      </div>

      {comment.replies.length > 0 && (
        <ol className="mt-3 space-y-2.5 border-l-2 border-slate-100 pl-3">
          {comment.replies.map((reply) => {
            const replyAuthor = members.find((m) => m.userId === reply.authorId);
            return (
              <li key={reply.id}>
                <div className="flex items-center gap-2">
                  <MemberChip member={replyAuthor} />
                  <span className="text-xs text-slate-400">
                    {formatRelative(reply.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm whitespace-pre-wrap text-slate-700">
                  {reply.message}
                </p>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-3 border-t border-slate-100 pt-2.5">
        <button
          type="button"
          onClick={() => setShowTimeline((value) => !value)}
          className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
          aria-expanded={showTimeline}
        >
          <Clock3 className="size-3.5" aria-hidden />
          {showTimeline ? "Hide activity" : "View activity"}
        </button>
        {showTimeline && (
          <ol className="mt-2 space-y-2 border-l border-slate-200 pl-3 text-xs text-slate-500">
            <li><span className="font-medium text-slate-700">Conversation created</span> · {formatRelative(comment.createdAt)}</li>
            {comment.replies.map((reply) => (
              <li key={`timeline-${reply.id}`}><span className="font-medium text-slate-700">Reply added</span> · {formatRelative(reply.createdAt)}</li>
            ))}
            <li><span className="font-medium text-slate-700">Status: {statusLabel}</span> · {formatRelative(comment.updatedAt)}</li>
          </ol>
        )}
      </div>

      {replying ? (
        <div className="mt-3 space-y-2">
          <MentionTextarea
            value={replyText}
            onChange={setReplyText}
            mentions={replyMentions}
            onMentionsChange={setReplyMentions}
            members={members.filter((m) => m.userId !== user.id)}
            rows={2}
            placeholder="Write a reply… Type @ to mention someone."
            autoFocus
            ariaLabel="Reply message"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setReplying(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={!replyText.trim() || busy} onClick={() => void handleReply()}>
              Reply
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <Button variant="ghost" size="sm" onClick={() => setReplying(true)}>
            <Reply className="size-3.5" aria-hidden />
            Reply
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this comment?"
        description="The whole conversation, including replies, will be removed. This can't be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          void store.deleteComment(project.id, comment.id);
          setConfirmDelete(false);
          toast("Comment deleted", "info");
        }}
      />
    </article>
  );
}
