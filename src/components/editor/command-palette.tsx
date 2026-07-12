"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Eye,
  FileText,
  LayoutGrid,
  Monitor,
  MousePointerClick,
  Paintbrush,
  PencilRuler,
  Plus,
  Redo2,
  Search,
  Smartphone,
  Tablet,
  Undo2,
} from "lucide-react";
import { getVariation } from "@/data/section-variations";
import { SECTION_TYPE_LABELS } from "@/config/labels";
import { useCollabUiStore } from "@/stores/collab-ui-store";
import { useEditorStore } from "@/stores/editor-store";
import type { Project, ProjectPage } from "@/types";
import { cn } from "@/utils/cn";

interface Command {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
}

/** Fuzzy subsequence match; returns a score (lower = better) or -1. */
function score(query: string, text: string): number {
  if (!query) return 0;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return t.indexOf(q); // contiguous match ranks best
  let qi = 0;
  let first = -1;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      if (first === -1) first = ti;
      qi++;
    }
  }
  return qi === q.length ? 1000 + first : -1;
}

/**
 * ⌘K command palette for the editor: jump to any page or section, add a
 * section, and run any toolbar action from one search box. Makes every
 * feature discoverable without hunting the toolbar.
 */
export function CommandPalette({
  project,
  page,
  onSelectPage,
  onAddSection,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  canEdit,
}: {
  project: Project;
  page: ProjectPage;
  onSelectPage: (pageId: string) => void;
  onAddSection: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const select = useEditorStore((s) => s.select);
  const setDevice = useEditorStore((s) => s.setDevice);
  const setMode = useEditorStore((s) => s.setMode);
  const setPreview = useEditorStore((s) => s.setPreview);
  const setZoom = useEditorStore((s) => s.setZoom);
  const fitZoom = useEditorStore((s) => s.fitZoom);
  const setCommentMode = useCollabUiStore((s) => s.setCommentMode);

  // ⌘K / Ctrl+K toggles the palette from anywhere in the editor.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const goToSection = (sectionId: string) => {
    select(sectionId);
    document
      .querySelector(`[data-canvas-section="${sectionId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const commands = useMemo<Command[]>(() => {
    const ordered = [...page.sections].sort((a, b) => a.order - b.order);
    const list: Command[] = [];

    if (canEdit) {
      list.push({
        id: "add-section",
        label: "Add section",
        group: "Actions",
        icon: Plus,
        run: onAddSection,
      });
    }
    list.push(
      { id: "preview", label: "Toggle preview", group: "Actions", icon: Eye, run: () => setPreview(!useEditorStore.getState().isPreview) },
      { id: "comment", label: "Toggle comment mode", group: "Actions", icon: MousePointerClick, run: () => setCommentMode(!useCollabUiStore.getState().commentMode) },
      { id: "mode-wire", label: "Show wireframe", group: "View", icon: PencilRuler, run: () => setMode("wireframe") },
      { id: "mode-styled", label: "Show styled preview", group: "View", icon: Paintbrush, run: () => setMode("styled") },
      { id: "dev-desktop", label: "Preview desktop", group: "View", icon: Monitor, run: () => setDevice("desktop") },
      { id: "dev-tablet", label: "Preview tablet", group: "View", icon: Tablet, run: () => setDevice("tablet") },
      { id: "dev-mobile", label: "Preview mobile", group: "View", icon: Smartphone, run: () => setDevice("mobile") },
      { id: "zoom-fit", label: "Zoom to fit", group: "View", icon: LayoutGrid, run: () => setZoom(fitZoom) },
    );
    if (canUndo) list.push({ id: "undo", label: "Undo", group: "Actions", icon: Undo2, run: onUndo });
    if (canRedo) list.push({ id: "redo", label: "Redo", group: "Actions", icon: Redo2, run: onRedo });

    for (const p of [...project.pages].sort(
      (a, b) => Number(b.isHomepage) - Number(a.isHomepage) || a.order - b.order,
    )) {
      list.push({
        id: `page-${p.id}`,
        label: p.name,
        hint: p.id === page.id ? "current page" : "go to page",
        group: "Pages",
        icon: FileText,
        run: () => onSelectPage(p.id),
      });
    }
    for (const s of ordered) {
      const variation = getVariation(s.variationId);
      list.push({
        id: `section-${s.id}`,
        label: variation?.name ?? SECTION_TYPE_LABELS[s.sectionType],
        hint: "go to section",
        group: "Sections on this page",
        icon: ArrowRight,
        run: () => goToSection(s.id),
      });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, page, canEdit, canUndo, canRedo]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    return commands
      .map((c) => ({ c, s: score(query.trim(), `${c.label} ${c.group}`) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => a.s - b.s)
      .map((x) => x.c);
  }, [commands, query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-cmd-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  const run = (cmd: Command) => {
    cmd.run();
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center p-4 pt-[12vh]"
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
        else if (e.key === "ArrowDown") {
          e.preventDefault();
          setActive((a) => Math.min(a + 1, filtered.length - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setActive((a) => Math.max(a - 1, 0));
        } else if (e.key === "Enter" && filtered[active]) {
          e.preventDefault();
          run(filtered[active]);
        }
      }}
    >
      <button
        type="button"
        aria-label="Close command palette"
        tabIndex={-1}
        className="absolute inset-0 animate-fade-in cursor-default bg-slate-900/40"
        onClick={() => setOpen(false)}
      />
      <div
        role="dialog"
        aria-label="Command palette"
        className="animate-scale-in relative w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[var(--shadow-overlay)]"
      >
        <div className="flex items-center gap-2 border-b border-slate-200 px-3">
          <Search className="size-4 shrink-0 text-slate-400" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to a page or section, or run a command…"
            aria-label="Command palette search"
            className="h-11 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
          <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
            ESC
          </kbd>
        </div>
        <div ref={listRef} className="max-h-80 overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-slate-400">No matches.</p>
          ) : (
            filtered.map((cmd, i) => {
              const showGroup = i === 0 || filtered[i - 1].group !== cmd.group;
              const Icon = cmd.icon;
              return (
                <div key={cmd.id}>
                  {showGroup && (
                    <p className="px-2 pt-2 pb-1 font-mono text-[10px] font-medium tracking-[0.16em] text-slate-400 uppercase">
                      {cmd.group}
                    </p>
                  )}
                  <button
                    type="button"
                    data-cmd-index={i}
                    onMouseMove={() => setActive(i)}
                    onClick={() => run(cmd)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px]",
                      i === active ? "bg-[var(--surface-secondary)] text-slate-900" : "text-slate-700",
                    )}
                  >
                    <Icon className="size-4 shrink-0 text-slate-400" />
                    <span className="min-w-0 flex-1 truncate">{cmd.label}</span>
                    {cmd.hint && (
                      <span className="shrink-0 text-[11px] text-slate-400">{cmd.hint}</span>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
