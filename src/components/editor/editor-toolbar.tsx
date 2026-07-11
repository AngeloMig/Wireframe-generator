"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  LifeBuoy,
  Keyboard,
  Maximize,
  MessageSquare,
  Monitor,
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
}) {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const isCustomer = user.role === "customer";
  const customerCanEdit = canEditProjectContent(user.role, project.status);
  const submissionMode =
    project.status === "revisions-requested" || project.status === "customer-revising"
      ? ("revisions" as const)
      : ("review" as const);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [accessRequestOpen, setAccessRequestOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
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

  const iconButton = (active?: boolean) =>
    cn(
      "flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-30",
      active ? "bg-[var(--primary-soft)] text-[var(--primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]",
    );

  return (
    <div className="relative flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--border-default)] bg-white px-3 py-2 shadow-[var(--shadow-subtle)]">
      {/* Left: project / page context */}
      <div className="flex min-w-0 items-center gap-2">
        <Link
          href={isCustomer ? "/dashboard" : `/projects/${project.id}/overview`}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
          aria-label={isCustomer ? "Back to your projects" : "Back to project overview"}
        >
          <ArrowLeft className="size-4" aria-hidden />
        </Link>
        <span className="hidden max-w-36 truncate text-sm font-semibold text-slate-900 xl:block">
          {project.name}
        </span>
        <PageSelector project={project} page={page} onSelectPage={onSelectPage} />
        <div className="hidden lg:block">
          <PageStatusBadge status={page.status} />
        </div>
        <SaveIndicator />
        {isCustomer && onToggleLibrary && customerCanEdit && (
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

      <div className="order-3 mx-auto flex w-full items-center justify-center gap-2 border-t border-[var(--border-default)] pt-2 lg:order-none lg:w-auto lg:border-0 lg:pt-0">
        {/* Undo / redo */}
        <div className="flex items-center gap-0.5">
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

        <Divider />

        {/* Device preview */}
        <div className="flex items-center gap-0.5" role="group" aria-label="Device preview">
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

        <Divider />

        {/* Mode toggle */}
        <div
          className="flex rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary)] p-0.5"
          role="group"
          aria-label="Display mode"
        >
          <button
            type="button"
            aria-pressed={mode === "wireframe"}
            onClick={() => setMode("wireframe")}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              mode === "wireframe" ? "bg-white text-[var(--primary)] shadow-sm" : "text-[var(--text-secondary)]",
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
              "flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              mode === "styled" ? "bg-white text-[var(--primary)] shadow-sm" : "text-[var(--text-secondary)]",
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

        <Divider />

        {/* Zoom */}
        <div className="hidden items-center gap-0.5 xl:flex">
          <button
            type="button"
            className={iconButton()}
            disabled={zoom <= ZOOM_MIN + 0.001}
            onClick={() => setZoom(zoom - ZOOM_STEP)}
            aria-label="Zoom out"
          >
            <ZoomOut className="size-4" aria-hidden />
          </button>
          <span className="w-10 text-center text-xs tabular-nums text-slate-600">
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
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Keyboard shortcuts"
          onClick={() => setShortcutsOpen((open) => !open)}
        >
          <Keyboard className="size-4" aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Copy preview link"
          onClick={() => {
            void navigator.clipboard?.writeText(window.location.href);
            toast("Preview link copied", "success");
          }}
        >
          <Share2 className="size-4" aria-hidden />
        </Button>
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

function Divider() {
  return <span className="hidden h-5 w-px bg-slate-200 sm:block" aria-hidden />;
}
