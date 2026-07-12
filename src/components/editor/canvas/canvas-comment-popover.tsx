"use client";

import { useEffect, useReducer } from "react";
import { MessageSquare, X } from "lucide-react";
import { useCommentsStore, selectProjectComments } from "@/stores/comments-store";
import { useMembersStore, selectProjectMembers } from "@/stores/members-store";
import { useCollabUiStore } from "@/stores/collab-ui-store";
import type { Project } from "@/types";
import { CommentCard } from "@/components/collab/comment-card";
import { CommentComposer } from "@/components/collab/comment-composer";

/** Live screen position of a `point:fx:fy` anchor, from its section's rect. */
function anchorPosition(
  sectionId: string | null | undefined,
  anchorKey: string | null | undefined,
  fallback: { x: number; y: number },
): { x: number; y: number } {
  const parts = anchorKey?.split(":") ?? [];
  if (parts[0] !== "point" || !sectionId) return fallback;
  const fx = Number(parts[1]);
  const fy = Number(parts[2]);
  if (!Number.isFinite(fx) || !Number.isFinite(fy)) return fallback;
  const el =
    typeof document === "undefined"
      ? null
      : document.querySelector(`[data-canvas-section="${sectionId}"]`);
  if (!el) return fallback;
  const rect = el.getBoundingClientRect();
  const isFraction = Math.abs(fx) <= 1 && Math.abs(fy) <= 1;
  return {
    x: isFraction ? rect.left + fx * rect.width : fx,
    y: isFraction ? rect.top + fy * rect.height : fy,
  };
}

export function CanvasCommentPopover({ project }: { project: Project }) {
  const comments = useCommentsStore((state) => selectProjectComments(state, project.id));
  const members = useMembersStore((state) => selectProjectMembers(state, project.id));
  const pageId = useCollabUiStore((state) => state.composerPageId);
  const sectionId = useCollabUiStore((state) => state.composerSectionId);
  const anchorKey = useCollabUiStore((state) => state.composerAnchorKey);
  const anchorLabel = useCollabUiStore((state) => state.composerAnchorLabel);
  const position = useCollabUiStore((state) => state.composerPosition);
  const close = useCollabUiStore((state) => state.closeComposer);

  // Keep the popover pinned beside its marker as the canvas scrolls/zooms.
  const [, reflow] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    if (!position) return;
    let frame = 0;
    const onChange = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => reflow());
    };
    document.addEventListener("scroll", onChange, true);
    window.addEventListener("resize", onChange);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("scroll", onChange, true);
      window.removeEventListener("resize", onChange);
    };
  }, [position]);

  if (!position) return null;

  const thread = comments.filter(
    (comment) =>
      comment.pageId === pageId &&
      comment.sectionId === sectionId &&
      (comment.anchorKey ?? null) === (anchorKey ?? null),
  );
  const anchor = anchorPosition(sectionId, anchorKey, position);
  const viewportWidth = typeof window === "undefined" ? 1200 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 800 : window.innerHeight;
  const left = Math.min(anchor.x + 14, viewportWidth - 380);
  const top = Math.min(anchor.y + 14, viewportHeight - 330);

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
