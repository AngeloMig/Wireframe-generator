"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, FileText, Lock, Plus } from "lucide-react";
import type { Project, ProjectPage } from "@/types";
import { cn } from "@/utils/cn";
import { PageStatusBadge } from "@/components/ui/badge";

/**
 * Toolbar page switcher: a popover instead of a bare <select>, so each page
 * can show its status and what still needs doing at a glance. The footer is
 * the editor surface for the `page` capability: holders can add pages,
 * customers without it can request that access.
 */
export function PageSelector({
  project,
  page,
  onSelectPage,
  canManagePages,
  onAddPage,
  onRequestPageAccess,
}: {
  project: Project;
  page: ProjectPage;
  onSelectPage: (pageId: string) => void;
  /** Holds the `page` capability — may add pages / change page settings. */
  canManagePages?: boolean;
  onAddPage?: () => void;
  /** Customer without the `page` capability — offer to request it. */
  onRequestPageAccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const pages = [...project.pages].sort(
    (a, b) => Number(b.isHomepage) - Number(a.isHomepage) || a.order - b.order,
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Current page"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-44 cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border-input)] bg-white px-2.5 text-xs text-[var(--text-primary)] shadow-[inset_0_1px_0_rgb(0_0_0/0.04)] hover:border-[var(--text-primary)]"
      >
        <FileText className="size-3.5 shrink-0 text-slate-400" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-left font-medium">{page.name}</span>
        <ChevronDown className="size-3.5 shrink-0 text-slate-400" aria-hidden />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Pages"
          className="absolute top-9 left-0 z-40 w-72 rounded-xl border border-slate-200 bg-white p-1 shadow-[var(--shadow-panel)]"
        >
          {pages.map((p) => {
            const isCurrent = p.id === page.id;
            const emptySections = p.sections.filter(
              (s) =>
                s.reviewStatus === "content-needed" || s.reviewStatus === "image-needed",
            ).length;
            return (
              <button
                key={p.id}
                type="button"
                role="option"
                aria-selected={isCurrent}
                onClick={() => {
                  setOpen(false);
                  if (!isCurrent) onSelectPage(p.id);
                }}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
                  isCurrent ? "bg-[#f7d34e]/25" : "hover:bg-black/[0.05]",
                )}
              >
                <span className="flex size-4 shrink-0 items-center justify-center">
                  {isCurrent && <Check className="size-3.5 text-[#a07800]" aria-hidden />}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate text-[13px]",
                      isCurrent ? "font-semibold text-[#5c4600]" : "font-medium text-slate-700",
                    )}
                  >
                    {p.name}
                    {p.isHomepage && (
                      <span className="ml-1.5 text-[11px] font-normal text-slate-400">Homepage</span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-slate-400">
                    {p.sections.length} {p.sections.length === 1 ? "section" : "sections"}
                    {emptySections > 0 && (
                      <span className="text-amber-600">
                        {" "}
                        · {emptySections} need{emptySections === 1 ? "s" : ""} content
                      </span>
                    )}
                  </span>
                </span>
                <PageStatusBadge status={p.status} />
              </button>
            );
          })}
          {(canManagePages && onAddPage) || onRequestPageAccess ? (
            <div className="mt-1 border-t border-slate-100 pt-1">
              {canManagePages && onAddPage ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onAddPage();
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] font-semibold text-[var(--primary)] hover:bg-[var(--primary-soft)]"
                >
                  <Plus className="size-4" aria-hidden />
                  Add a page
                </button>
              ) : (
                onRequestPageAccess && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onRequestPageAccess();
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] font-medium text-slate-500 hover:bg-black/[0.05]"
                  >
                    <Lock className="size-3.5" aria-hidden />
                    Adding pages needs agency access
                    <span className="ml-auto text-[11px] font-semibold text-[var(--focus-ring)]">Request</span>
                  </button>
                )
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
