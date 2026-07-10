"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  Maximize,
  Monitor,
  PencilRuler,
  Redo2,
  Send,
  Smartphone,
  Tablet,
  Undo2,
  ZoomIn,
  ZoomOut,
  Paintbrush,
} from "lucide-react";
import {
  useEditorStore,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  type DeviceKind,
} from "@/stores/editor-store";
import type { Project, ProjectPage } from "@/types";
import { cn } from "@/utils/cn";
import { PageStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
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
}: {
  project: Project;
  page: ProjectPage;
  onSelectPage: (pageId: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}) {
  const router = useRouter();
  const device = useEditorStore((s) => s.device);
  const setDevice = useEditorStore((s) => s.setDevice);
  const mode = useEditorStore((s) => s.mode);
  const setMode = useEditorStore((s) => s.setMode);
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const fitZoom = useEditorStore((s) => s.fitZoom);
  const isPreview = useEditorStore((s) => s.isPreview);
  const setPreview = useEditorStore((s) => s.setPreview);

  const iconButton = (active?: boolean) =>
    cn(
      "flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-30",
      active ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
    );

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-200 bg-white px-3 py-2">
      {/* Left: project / page context */}
      <div className="flex min-w-0 items-center gap-2">
        <Link
          href={`/projects/${project.id}/overview`}
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          aria-label="Back to project overview"
        >
          <ArrowLeft className="size-4" aria-hidden />
        </Link>
        <span className="hidden max-w-36 truncate text-sm font-semibold text-slate-900 xl:block">
          {project.name}
        </span>
        <Select
          value={page.id}
          onChange={(e) => onSelectPage(e.target.value)}
          aria-label="Current page"
          className="h-8 w-40 text-xs"
        >
          {[...project.pages]
            .sort((a, b) => Number(b.isHomepage) - Number(a.isHomepage) || a.order - b.order)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </Select>
        <div className="hidden lg:block">
          <PageStatusBadge status={page.status} />
        </div>
        <SaveIndicator />
      </div>

      <div className="mx-auto flex items-center gap-3">
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
          className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5"
          role="group"
          aria-label="Display mode"
        >
          <button
            type="button"
            aria-pressed={mode === "wireframe"}
            onClick={() => setMode("wireframe")}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              mode === "wireframe" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500",
            )}
          >
            <PencilRuler className="size-3.5" aria-hidden />
            Wireframe
          </button>
          <button
            type="button"
            aria-pressed={mode === "styled"}
            onClick={() => setMode("styled")}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              mode === "styled" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500",
            )}
          >
            <Paintbrush className="size-3.5" aria-hidden />
            Styled
          </button>
        </div>

        <Divider />

        {/* Zoom */}
        <div className="flex items-center gap-0.5">
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

      {/* Right: preview + submit */}
      <div className="flex items-center gap-2">
        <Button
          variant={isPreview ? "secondary" : "outline"}
          size="sm"
          onClick={() => setPreview(!isPreview)}
          aria-pressed={isPreview}
        >
          <Eye className="size-3.5" aria-hidden />
          {isPreview ? "Exit preview" : "Preview"}
        </Button>
        <Button size="sm" onClick={() => router.push(`/projects/${project.id}/review`)}>
          <Send className="size-3.5" aria-hidden />
          Submit
        </Button>
      </div>
    </div>
  );
}

function Divider() {
  return <span className="hidden h-5 w-px bg-slate-200 sm:block" aria-hidden />;
}
