"use client";

import { useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  CornerDownRight,
  Copy,
  FileText,
  GripVertical,
  Home,
  IndentDecrease,
  IndentIncrease,
  LayoutGrid,
  MoreHorizontal,
  PanelBottom,
  PencilLine,
  Star,
  Trash2,
} from "lucide-react";
import { PAGE_TYPE_LABELS } from "@/config/labels";
import type { ProjectPage } from "@/types";
import { cn } from "@/utils/cn";
import { PageStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownItem,
  DropdownMenu,
  DropdownSeparator,
} from "@/components/ui/dropdown-menu";

export interface SitemapNodeActions {
  onEdit: (page: ProjectPage) => void;
  onDuplicate: (page: ProjectPage) => void;
  onDelete: (page: ProjectPage) => void;
  onMakeHomepage: (page: ProjectPage) => void;
  onMoveUp: (page: ProjectPage) => void;
  onMoveDown: (page: ProjectPage) => void;
  onNest: (page: ProjectPage) => void;
  onUnnest: (page: ProjectPage) => void;
}

export interface SitemapNodeFlags {
  canMoveUp: boolean;
  canMoveDown: boolean;
  canNest: boolean;
  canUnnest: boolean;
}

/** Shared row content so the DragOverlay can render an identical card. */
export function SitemapNodeCard({
  page,
  childCount,
  actions,
  flags,
  editorHref,
  dragHandle,
  className,
}: {
  page: ProjectPage;
  childCount: number;
  actions?: SitemapNodeActions;
  flags?: SitemapNodeFlags;
  editorHref?: string;
  dragHandle?: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const Icon = page.isHomepage ? Home : page.footerOnly ? PanelBottom : FileText;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 pr-2.5 pl-2 shadow-sm",
        className,
      )}
    >
      {dragHandle}
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          page.isHomepage ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-500",
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-slate-900">{page.name}</span>
          {page.isHomepage && (
            <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Homepage" />
          )}
        </div>
        <p className="truncate text-xs text-slate-500">
          {PAGE_TYPE_LABELS[page.type]}
          {" · "}
          {page.sections.length} {page.sections.length === 1 ? "section" : "sections"}
          {childCount > 0 && ` · ${childCount} child ${childCount === 1 ? "page" : "pages"}`}
          {!page.footerOnly && !page.inMainNav && " · Hidden from nav"}
        </p>
      </div>
      <div className="hidden sm:block">
        <PageStatusBadge status={page.status} />
      </div>
      {actions && flags && (
        <DropdownMenu
          trigger={(props) => (
            <Button
              variant="ghost"
              size="icon-sm"
              {...props}
              aria-label={`Actions for ${page.name}`}
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </Button>
          )}
        >
          {editorHref && (
            <DropdownItem onSelect={() => router.push(editorHref)}>
              <LayoutGrid className="size-4 text-slate-400" aria-hidden />
              Open in editor
            </DropdownItem>
          )}
          <DropdownItem onSelect={() => actions.onEdit(page)}>
            <PencilLine className="size-4 text-slate-400" aria-hidden />
            Page settings
          </DropdownItem>
          <DropdownItem onSelect={() => actions.onDuplicate(page)}>
            <Copy className="size-4 text-slate-400" aria-hidden />
            Duplicate
          </DropdownItem>
          {!page.isHomepage && !page.footerOnly && (
            <DropdownItem onSelect={() => actions.onMakeHomepage(page)}>
              <Home className="size-4 text-slate-400" aria-hidden />
              Mark as homepage
            </DropdownItem>
          )}
          <DropdownSeparator />
          <DropdownItem disabled={!flags.canMoveUp} onSelect={() => actions.onMoveUp(page)}>
            <ArrowUp className="size-4 text-slate-400" aria-hidden />
            Move up
          </DropdownItem>
          <DropdownItem disabled={!flags.canMoveDown} onSelect={() => actions.onMoveDown(page)}>
            <ArrowDown className="size-4 text-slate-400" aria-hidden />
            Move down
          </DropdownItem>
          {flags.canNest && (
            <DropdownItem onSelect={() => actions.onNest(page)}>
              <IndentIncrease className="size-4 text-slate-400" aria-hidden />
              Nest under page above
            </DropdownItem>
          )}
          {flags.canUnnest && (
            <DropdownItem onSelect={() => actions.onUnnest(page)}>
              <IndentDecrease className="size-4 text-slate-400" aria-hidden />
              Move to top level
            </DropdownItem>
          )}
          <DropdownSeparator />
          <DropdownItem destructive onSelect={() => actions.onDelete(page)}>
            <Trash2 className="size-4" aria-hidden />
            Delete
          </DropdownItem>
        </DropdownMenu>
      )}
    </div>
  );
}

/** Sortable sitemap row with indentation for child pages. */
export function SitemapNode({
  page,
  depth,
  projectedDepth,
  childCount,
  actions,
  flags,
  editorHref,
}: {
  page: ProjectPage;
  depth: 0 | 1;
  /** Depth preview while this node is being dragged. */
  projectedDepth: 0 | 1 | null;
  childCount: number;
  actions: SitemapNodeActions;
  flags: SitemapNodeFlags;
  editorHref: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: page.id });

  const effectiveDepth = isDragging && projectedDepth !== null ? projectedDepth : depth;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative list-none", effectiveDepth === 1 && "ml-8 sm:ml-10")}
    >
      {effectiveDepth === 1 && (
        <CornerDownRight
          className="absolute top-1/2 -left-6 size-4 -translate-y-1/2 text-slate-300"
          aria-hidden
        />
      )}
      <SitemapNodeCard
        page={page}
        childCount={childCount}
        actions={actions}
        flags={flags}
        editorHref={editorHref}
        className={cn(isDragging && "border-indigo-300 opacity-40")}
        dragHandle={
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${page.name}. Use the menu for keyboard reordering.`}
            className="flex h-8 w-6 shrink-0 cursor-grab items-center justify-center rounded text-slate-300 hover:text-slate-500 active:cursor-grabbing"
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
        }
      />
    </li>
  );
}
