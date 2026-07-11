"use client";

import { useEffect, useRef } from "react";
import { FileText, MessageSquarePlus } from "lucide-react";

export interface ContextMenuState {
  /** Section under the cursor, or null when the page background was clicked. */
  sectionId: string | null;
  sectionName: string | null;
  x: number;
  y: number;
}

/**
 * Right-click menu on the canvas, review-tool style: start a comment on the
 * section under the cursor (or the whole page) from anywhere.
 */
export function ContextCommentMenu({
  menu,
  onCommentSection,
  onCommentPage,
  onClose,
}: {
  menu: ContextMenuState;
  onCommentSection: (sectionId: string) => void;
  onCommentPage: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("scroll", onClose, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("scroll", onClose, true);
    };
  }, [onClose]);

  // Keep the menu inside the viewport.
  const left = Math.min(menu.x, (typeof window !== "undefined" ? window.innerWidth : 1600) - 248);
  const top = Math.min(menu.y, (typeof window !== "undefined" ? window.innerHeight : 900) - 110);

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Comment options"
      className="fixed z-[60] w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-[var(--shadow-panel)]"
      style={{ left, top }}
    >
      {menu.sectionId && (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onCommentSection(menu.sectionId as string);
            onClose();
          }}
          className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-slate-700 hover:bg-slate-100 hover:text-slate-900"
        >
          <MessageSquarePlus className="size-4 shrink-0 text-slate-400" aria-hidden />
          <span className="min-w-0 flex-1 truncate">
            Comment on {menu.sectionName ?? "this section"}
          </span>
        </button>
      )}
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onCommentPage();
          onClose();
        }}
        className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-slate-700 hover:bg-slate-100 hover:text-slate-900"
      >
        <FileText className="size-4 shrink-0 text-slate-400" aria-hidden />
        Comment on this page
      </button>
    </div>
  );
}
