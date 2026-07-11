"use client";

import { useEffect, useRef, useState } from "react";
import { MessagesSquare, X } from "lucide-react";
import { canViewInternalNotes } from "@/lib/permissions";
import { selectProjectComments, useCommentsStore } from "@/stores/comments-store";
import { useSessionStore } from "@/stores/session-store";
import type { Project } from "@/types";
import { Button } from "@/components/ui/button";
import { CollaborationPanel } from "./collaboration-panel";

/**
 * Small-screen comments: a floating button that opens the collaboration
 * panel as a full-screen drawer (the inline panel is desktop-only).
 */
export function CollabDrawer({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const user = useSessionStore((s) => s.user);
  const comments = useCommentsStore((s) => selectProjectComments(s, project.id));
  const openCount = comments.filter(
    (c) =>
      (canViewInternalNotes(user.role) || c.visibility === "customer") &&
      (c.status === "open" || c.status === "reopened"),
  ).length;

  // Focus management + body scroll lock while the drawer is open.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={
          openCount > 0 ? `Open comments, ${openCount} open` : "Open comments"
        }
        className="fixed right-4 bottom-4 z-40 flex cursor-pointer items-center gap-2 rounded-full bg-[var(--primary,#1a1a1a)] px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
      >
        <MessagesSquare className="size-4.5" aria-hidden />
        Comments
        {openCount > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-white/25 text-xs">
            {openCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Project comments"
          className="fixed inset-0 z-50 flex flex-col bg-white"
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-4">
            <p className="text-sm font-semibold text-slate-900">Comments</p>
            <Button
              ref={closeRef}
              variant="ghost"
              size="icon-sm"
              aria-label="Close comments"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" aria-hidden />
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3">
            <CollaborationPanel project={project} compact className="h-full" />
          </div>
        </div>
      )}
    </div>
  );
}
