"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  History,
  LifeBuoy,
  Keyboard,
  Maximize,
  MessageSquare,
  Monitor,
  MoreHorizontal,
  PencilRuler,
  Plus,
  Redo2,
  Send,
  Smartphone,
  Tablet,
  Undo2,
  ZoomIn,
  ZoomOut,
  Paintbrush,
  Share2,
} from "lucide-react";
import type { BrandTheme } from "@/lib/editor-utils";
import { canEditProjectContent } from "@/lib/permissions";
import type { ThemeOverrides } from "@/lib/theme-overrides";
import { useCollabUiStore } from "@/stores/collab-ui-store";
import {
  useEditorStore,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  type DeviceKind,
} from "@/stores/editor-store";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import type { Project, ProjectPage } from "@/types";
import { cn } from "@/utils/cn";
import { AskAgencyDialog } from "@/components/customer/ask-agency-dialog";
import { SubmissionDialog } from "@/components/collab/submission-dialog";
import { AccessRequestDialog } from "@/components/collab/access-request-dialog";
import { PageStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSelector } from "./page-selector";
import { ThemePanelButton } from "./theme-panel";
import { UserMenu } from "@/components/layout/user-menu";
import { SaveIndicator } from "@/components/project/save-indicator";

const DEVICES: { id: DeviceKind; label: string; icon: typeof Monitor }[] = [
  { id: "desktop", label: "Desktop preview", icon: Monitor },
  { id: "tablet", label: "Tablet preview", icon: Tablet },
  { id: "mobile", label: "Mobile preview", icon: Smartphone },
];

export function EditorToolbar({
  project,
  page,
  onSelectPage,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  selectedSectionId,
  libraryOpen,
  onToggleLibrary,
  theme,
  themeHasOverrides,
  onThemeChange,
  onThemeReset,
  canEditOverride,
  canBuildSections,
  canManagePages,
}: {
  project: Project;
  page: ProjectPage;
  onSelectPage: (pageId: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  selectedSectionId?: string | null;
  libraryOpen?: boolean;
  onToggleLibrary?: () => void;
  theme?: BrandTheme;
  themeHasOverrides?: boolean;
  onThemeChange?: (patch: ThemeOverrides) => void;
  onThemeReset?: () => void;
  canEditOverride?: boolean;
  /** May add/arrange sections — gates the "Add section" affordance. */
  canBuildSections?: boolean;
  /** Holds the `page` capability — may add pages from the page switcher. */
  canManagePages?: boolean;
}) {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const isCustomer = user.role === "customer";
  const customerCanEdit = canEditOverride ?? canEditProjectContent(user.role, project.status);
  // Falls back to the blanket edit flag when the granular one isn't supplied
  // (e.g. agency toolbars that don't pass capabilities).
  const canAddSections = canBuildSections ?? customerCanEdit;
  const submissionMode =
    project.status === "revisions-requested" || project.status === "customer-revising"
      ? ("revisions" as const)
      : ("review" as const);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [accessRequestOpen, setAccessRequestOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const device = useEditorStore((s) => s.device);
  const setDevice = useEditorStore((s) => s.setDevice);
  const mode = useEditorStore((s) => s.mode);
  const setMode = useEditorStore((s) => s.setMode);
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const fitZoom = useEditorStore((s) => s.fitZoom);
  const isPreview = useEditorStore((s) => s.isPreview);
  const setPreview = useEditorStore((s) => s.setPreview);
  const commentMode = useCollabUiStore((s) => s.commentMode);
  const setCommentMode = useCollabUiStore((s) => s.setCommentMode);

  // Floating-panel "spatial UI": squircle buttons, yellow marks the active tool.
  const iconButton = (active?: boolean) =>
    cn(
      "flex size-8 cursor-pointer items-center justify-center rounded-xl transition-[background-color,color,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.94] disabled:cursor-not-allowed disabled:opacity-30",
      active
        ? "bg-[#f7d34e] text-[#5c4600] shadow-[0_1px_3px_rgb(0_0_0/0.10)]"
        : "text-[var(--text-secondary)] hover:bg-black/[0.05] hover:text-[var(--text-primary)]",
    );

  // Frosted island that groups related controls into a soft rounded cluster.
  const island = "flex items-center gap-0.5 rounded-[0.9rem] bg-white/70 p-1 shadow-[inset_0_1px_0_rgb(255_255_255/0.7),0_1px_2px_rgb(0_0_0/0.04)] ring-1 ring-black/[0.04] backdrop-blur";

  return (
    // z-30: backdrop-blur makes this bar a stacking context, which would trap
    // its dropdowns (user menu, shortcuts) *below* the workspace panels that
    // come later in the DOM — so the whole bar must sit above the workspace.
    <div className="relative z-30 flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 border-b border-black/[0.04] bg-[var(--surface-secondary)]/80 px-3 py-2 backdrop-blur-xl">
      {/* Left: project / page context */}
      <div className="flex min-w-0 items-center gap-2">
        <Link
          href={isCustomer ? "/dashboard" : `/projects/${project.id}/overview`}
          className="flex size-8 shrink-0 items-center justify-center rounded-xl text-[var(--text-secondary)] transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-black/[0.05] hover:text-[var(--text-primary)] active:scale-[0.94]"
          aria-label={isCustomer ? "Back to your projects" : "Back to project overview"}
        >
          <ArrowLeft className="size-4" aria-hidden />
        </Link>
        <span className="hidden max-w-36 truncate text-sm font-semibold text-slate-900 xl:block">
          {project.name}
        </span>
        <PageSelector
          project={project}
          page={page}
          onSelectPage={onSelectPage}
          canManagePages={canManagePages ?? !isCustomer}
          onAddPage={() => router.push(`/projects/${project.id}/sitemap`)}
          onRequestPageAccess={
            isCustomer ? () => setAccessRequestOpen(true) : undefined
          }
        />
        <div className="hidden lg:block">
          <PageStatusBadge status={page.status} />
        </div>
        <SaveIndicator />
        {isCustomer && onToggleLibrary && canAddSections && (
          <Button
            variant={libraryOpen ? "secondary" : "outline"}
            size="sm"
            onClick={onToggleLibrary}
            aria-pressed={libraryOpen}
            aria-label={libraryOpen ? "Close the section list" : "Add a section to this page"}
          >
            <Plus className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">Add section</span>
          </Button>
        )}
      </div>

      <div className="order-3 mx-auto flex w-full items-center justify-center gap-2 pt-2 lg:order-none lg:w-auto lg:pt-0">
        {/* Undo / redo */}
        <div className={island}>
          <button
            type="button"
            className={iconButton()}
            disabled={!canUndo}
            onClick={onUndo}
            aria-label="Undo"
          >
            <Undo2 className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            className={iconButton()}
            disabled={!canRedo}
            onClick={onRedo}
            aria-label="Redo"
          >
            <Redo2 className="size-4" aria-hidden />
          </button>
        </div>

        {/* Device preview */}
        <div className={island} role="group" aria-label="Device preview">
          {DEVICES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={iconButton(device === id)}
              aria-label={label}
              aria-pressed={device === id}
              onClick={() => setDevice(id)}
            >
              <Icon className="size-4" aria-hidden />
            </button>
          ))}
        </div>

        {/* Mode toggle */}
        <div
          className="flex rounded-[0.9rem] bg-white/70 p-1 shadow-[inset_0_1px_0_rgb(255_255_255/0.7),0_1px_2px_rgb(0_0_0/0.04)] ring-1 ring-black/[0.04] backdrop-blur"
          role="group"
          aria-label="Display mode"
        >
          <button
            type="button"
            aria-pressed={mode === "wireframe"}
            onClick={() => setMode("wireframe")}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-[background-color,color,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96]",
              mode === "wireframe" ? "bg-[#f7d34e] text-[#5c4600] shadow-[0_1px_3px_rgb(0_0_0/0.10)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            )}
          >
            <PencilRuler className="size-3.5" aria-hidden />
            <span className="hidden xl:inline">Wireframe</span>
            <span className="sr-only xl:hidden">Wireframe</span>
          </button>
          <button
            type="button"
            aria-pressed={mode === "styled"}
            onClick={() => setMode("styled")}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-[background-color,color,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96]",
              mode === "styled" ? "bg-[#f7d34e] text-[#5c4600] shadow-[0_1px_3px_rgb(0_0_0/0.10)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            )}
          >
            <Paintbrush className="size-3.5" aria-hidden />
            <span className="hidden xl:inline">Styled</span>
            <span className="sr-only xl:hidden">Styled</span>
          </button>
        </div>

        {mode === "styled" && theme && onThemeChange && onThemeReset && (
          <ThemePanelButton
            theme={theme}
            hasOverrides={themeHasOverrides ?? false}
            onChange={onThemeChange}
            onReset={onThemeReset}
            buttonClass={iconButton()}
          />
        )}

        {/* Zoom */}
        <div className={cn(island, "hidden xl:flex")}>
          <button
            type="button"
            className={iconButton()}
            disabled={zoom <= ZOOM_MIN + 0.001}
            onClick={() => setZoom(zoom - ZOOM_STEP)}
            aria-label="Zoom out"
          >
            <ZoomOut className="size-4" aria-hidden />
          </button>
          <span className="w-10 text-center text-xs tabular-nums text-[var(--text-secondary)]">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            className={iconButton()}
            disabled={zoom >= ZOOM_MAX - 0.001}
            onClick={() => setZoom(zoom + ZOOM_STEP)}
            aria-label="Zoom in"
          >
            <ZoomIn className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            className={iconButton()}
            onClick={() => setZoom(fitZoom)}
            aria-label="Fit page to canvas"
          >
            <Maximize className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* Right: comment mode + preview + submit */}
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="More editor options"
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            onClick={() => setMoreOpen((open) => !open)}
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </Button>
          {moreOpen && (
            <>
              <button
                type="button"
                aria-label="Close menu"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setMoreOpen(false)}
              />
              <div
                role="menu"
                aria-label="More editor options"
                className="absolute top-9 right-0 z-50 w-56 rounded-xl border border-[var(--border-default)] bg-white p-1 shadow-[var(--shadow-panel)]"
              >
                <Link
                  href={`/projects/${project.id}/versions`}
                  role="menuitem"
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-slate-700 hover:bg-black/[0.05]"
                  onClick={() => setMoreOpen(false)}
                >
                  <History className="size-4 text-slate-400" aria-hidden />
                  Version history
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-slate-700 hover:bg-black/[0.05]"
                  onClick={() => {
                    void navigator.clipboard?.writeText(window.location.href);
                    toast("Preview link copied", "success");
                    setMoreOpen(false);
                  }}
                >
                  <Share2 className="size-4 text-slate-400" aria-hidden />
                  Copy preview link
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-slate-700 hover:bg-black/[0.05]"
                  onClick={() => {
                    setMoreOpen(false);
                    setShortcutsOpen(true);
                  }}
                >
                  <Keyboard className="size-4 text-slate-400" aria-hidden />
                  Keyboard shortcuts
                </button>
              </div>
            </>
          )}
        </div>
        <Button
          variant={commentMode ? "secondary" : "outline"}
          size="sm"
          onClick={() => setCommentMode(!commentMode)}
          aria-pressed={commentMode}
        >
          <MessageSquare className="size-3.5" aria-hidden />
          <span className="hidden xl:inline">{commentMode ? "Exit comments" : "Comment"}</span>
          <span className="sr-only xl:hidden">{commentMode ? "Exit comments" : "Comment"}</span>
        </Button>
        <Button
          variant={isPreview ? "secondary" : "outline"}
          size="sm"
          onClick={() => setPreview(!isPreview)}
          aria-pressed={isPreview}
        >
          <Eye className="size-3.5" aria-hidden />
          <span className="hidden xl:inline">{isPreview ? "Exit preview" : "Preview"}</span>
          <span className="sr-only xl:hidden">{isPreview ? "Exit preview" : "Preview"}</span>
        </Button>
        {isCustomer ? (
          <>
            {customerCanEdit && (
              <Button size="sm" data-tour="submit" onClick={() => setSubmitOpen(true)}>
                <Send className="size-3.5" aria-hidden />
                <span className="hidden xl:inline">
                  {submissionMode === "revisions" ? "Submit changes" : "Submit for review"}
                </span>
                <span className="xl:hidden">Submit</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAskOpen(true)}
              aria-label="Ask the agency for help"
            >
              <LifeBuoy className="size-4" aria-hidden />
              <span className="hidden xl:inline">Ask the agency</span>
            </Button>
            {!customerCanEdit && (
              <Button variant="ghost" size="sm" onClick={() => setAccessRequestOpen(true)} aria-label="Request editor access">
                <Plus className="size-4" aria-hidden />
                <span className="hidden xl:inline">Request access</span>
              </Button>
            )}
            <UserMenu />
          </>
        ) : (
          <Button size="sm" onClick={() => router.push(`/projects/${project.id}/review`)}>
            <Send className="size-3.5" aria-hidden />
            Submit
          </Button>
        )}
      </div>

      {shortcutsOpen && (
        <div className="absolute top-14 right-3 z-50 w-64 rounded-xl border border-[var(--border-default)] bg-white p-4 shadow-[var(--shadow-panel)]">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold text-[var(--text-primary)]">Keyboard shortcuts</h2><button type="button" className="text-xs text-[var(--text-muted)]" onClick={() => setShortcutsOpen(false)}>Close</button></div>
          <dl className="space-y-2 text-xs text-[var(--text-secondary)]">
            {[['Undo', '⌘/Ctrl + Z'], ['Redo', '⌘/Ctrl + Shift + Z'], ['Delete section', 'Delete'], ['Comment mode', 'Right-click canvas'], ['Preview', 'Toolbar button']].map(([label, key]) => <div key={label} className="flex items-center justify-between gap-3"><dt>{label}</dt><dd className="rounded bg-[var(--surface-secondary)] px-1.5 py-0.5 font-mono text-[10px]">{key}</dd></div>)}
          </dl>
        </div>
      )}

      {isCustomer && (
        <>
          <SubmissionDialog
            project={project}
            open={submitOpen}
            onClose={() => setSubmitOpen(false)}
            mode={submissionMode}
          />
          <AskAgencyDialog
            project={project}
            page={page}
            sectionId={selectedSectionId}
            open={askOpen}
            onClose={() => setAskOpen(false)}
          />
          <AccessRequestDialog project={project} page={page} open={accessRequestOpen} onClose={() => setAccessRequestOpen(false)} />
        </>
      )}
    </div>
  );
}
