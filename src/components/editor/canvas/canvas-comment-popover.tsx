"use client";

import { MessageSquare, X } from "lucide-react";
import { useCommentsStore, selectProjectComments } from "@/stores/comments-store";
import { useMembersStore, selectProjectMembers } from "@/stores/members-store";
import { useCollabUiStore } from "@/stores/collab-ui-store";
import type { Project } from "@/types";
import { CommentCard } from "@/components/collab/comment-card";
import { CommentComposer } from "@/components/collab/comment-composer";

export function CanvasCommentPopover({ project }: { project: Project }) {
  const comments = useCommentsStore((state) => selectProjectComments(state, project.id));
  const members = useMembersStore((state) => selectProjectMembers(state, project.id));
  const pageId = useCollabUiStore((state) => state.composerPageId);
  const sectionId = useCollabUiStore((state) => state.composerSectionId);
  const anchorKey = useCollabUiStore((state) => state.composerAnchorKey);
  const anchorLabel = useCollabUiStore((state) => state.composerAnchorLabel);
  const position = useCollabUiStore((state) => state.composerPosition);
  const close = useCollabUiStore((state) => state.closeComposer);

  if (!position) return null;

  const thread = comments.filter(
    (comment) =>
      comment.pageId === pageId &&
      comment.sectionId === sectionId &&
      (comment.anchorKey ?? null) === (anchorKey ?? null),
  );
  const viewportWidth = typeof window === "undefined" ? 1200 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 800 : window.innerHeight;
  const left = Math.min(position.x + 14, viewportWidth - 380);
  const top = Math.min(position.y + 14, viewportHeight - 330);

  return (
    <div
      className="fixed z-[80] w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-[var(--border-default)] bg-white shadow-[var(--shadow-overlay)]"
      style={{ left: Math.max(12, left), top: Math.max(12, top) }}
      role="dialog"
      aria-label={`Comment on ${anchorLabel ?? "this section"}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-[var(--border-default)] bg-[#fbfcfa] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]"><MessageSquare className="size-3.5" aria-hidden /></span>
          <div className="min-w-0"><p className="text-xs font-bold text-[var(--text-primary)]">{anchorLabel ?? "Comment on this section"}</p><p className="text-[11px] text-[var(--text-muted)]">{thread.length ? `${thread.length} comment${thread.length === 1 ? "" : "s"}` : "New conversation"}</p></div>
        </div>
        <button type="button" onClick={close} aria-label="Close comment" className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"><X className="size-4" aria-hidden /></button>
      </div>
      {thread.length > 0 && <div className="max-h-52 space-y-2 overflow-y-auto p-3">{thread.map((comment) => <CommentCard key={comment.id} project={project} comment={comment} members={members} />)}</div>}
      <div className="border-t border-[var(--border-default)] p-3"><CommentComposer project={project} members={members} scope="section" pageId={pageId ?? undefined} sectionId={sectionId ?? undefined} anchorKey={anchorKey ?? undefined} anchorLabel={anchorLabel ?? undefined} onSubmitted={close} autoFocus /></div>
    </div>
  );
}
