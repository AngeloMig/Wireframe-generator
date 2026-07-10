"use client";

import { useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Network, PanelBottom, Plus } from "lucide-react";
import {
  buildPage,
  duplicatePage,
  flattenSitemap,
  footerPages,
  markAsHomepage,
  rebuildFromFlattened,
  removePage,
  type PageFormValues,
  type SitemapNodeData,
} from "@/lib/pages";
import { normalisePageOrder, withActivity } from "@/lib/project-utils";
import { useProjectsStore } from "@/stores/projects-store";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import type { Project, ProjectPage } from "@/types";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageDialog } from "./page-dialog";
import {
  SitemapNode,
  SitemapNodeCard,
  type SitemapNodeActions,
  type SitemapNodeFlags,
} from "./sitemap-node";

/** Horizontal drag distance that toggles nesting under the page above. */
const NEST_OFFSET_PX = 32;

export function SitemapBuilder({ project }: { project: Project }) {
  const updateProject = useProjectsStore((s) => s.updateProject);
  const user = useSessionStore((s) => s.user);

  const [dialogPage, setDialogPage] = useState<ProjectPage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectPage | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [projectedDepth, setProjectedDepth] = useState<0 | 1 | null>(null);
  const projectedDepthRef = useRef<0 | 1>(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const nodes = useMemo(() => flattenSitemap(project.pages), [project.pages]);
  const footer = useMemo(() => footerPages(project.pages), [project.pages]);
  const activeNode = nodes.find((n) => n.page.id === activeId) ?? null;

  const childCount = (pageId: string) =>
    project.pages.filter((p) => p.parentId === pageId).length;

  const applyPages = (
    pages: ProjectPage[],
    activityMessage: string | null,
    activityType: "page-added" | "page-updated" | "page-deleted" = "page-updated",
  ) => {
    updateProject(project.id, (p) => {
      const next = { ...p, pages: normalisePageOrder(pages) };
      return activityMessage
        ? withActivity(next, activityType, activityMessage, user)
        : { ...next, lastEditedAt: new Date().toISOString() };
    });
  };

  // ----- Drag and drop ----------------------------------------------------

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    const node = nodes.find((n) => n.page.id === String(event.active.id));
    projectedDepthRef.current = node?.depth ?? 0;
    setProjectedDepth(node?.depth ?? 0);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const id = String(event.active.id);
    const node = nodes.find((n) => n.page.id === id);
    if (!node) return;
    // Homepage and pages with children stay at the top level.
    const nestable = !node.page.isHomepage && childCount(id) === 0;
    const base = node.depth === 1 ? NEST_OFFSET_PX * -1 : 0;
    const wantsNest = nestable && event.delta.x + base > NEST_OFFSET_PX / 2;
    const depth: 0 | 1 = wantsNest ? 1 : 0;
    if (depth !== projectedDepthRef.current) {
      projectedDepthRef.current = depth;
      setProjectedDepth(depth);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const depth = projectedDepthRef.current;
    setActiveId(null);
    setProjectedDepth(null);
    if (!over) return;

    const activeIndex = nodes.findIndex((n) => n.page.id === String(active.id));
    if (activeIndex === -1) return;
    const dragged = nodes[activeIndex];

    // The dragged block is the page plus (for top-level pages) its children.
    const blockIds = new Set([dragged.page.id]);
    if (dragged.depth === 0) {
      project.pages
        .filter((p) => p.parentId === dragged.page.id)
        .forEach((p) => blockIds.add(p.id));
    }
    if (blockIds.has(String(over.id)) && depth === dragged.depth) return;

    const block = nodes.filter((n) => blockIds.has(n.page.id));
    const rest = nodes.filter((n) => !blockIds.has(n.page.id));

    let insertAt: number;
    if (blockIds.has(String(over.id))) {
      insertAt = Math.min(activeIndex, rest.length);
    } else {
      const overIndexRest = rest.findIndex((n) => n.page.id === String(over.id));
      const overIndexAll = nodes.findIndex((n) => n.page.id === String(over.id));
      // Moving down inserts after the target, moving up inserts before it.
      insertAt = overIndexAll > activeIndex ? overIndexRest + 1 : overIndexRest;
    }

    const newBlock: SitemapNodeData[] = block.map((n, i) =>
      i === 0 ? { ...n, depth } : n,
    );
    // A child can't be the first item in the list.
    if (insertAt === 0 && newBlock[0].depth === 1) newBlock[0] = { ...newBlock[0], depth: 0 };

    const nextNodes = [...rest.slice(0, insertAt), ...newBlock, ...rest.slice(insertAt)];
    applyPages(rebuildFromFlattened(nextNodes, project.pages), null);
  };

  // ----- Page actions -----------------------------------------------------

  const handleDialogSubmit = (values: PageFormValues) => {
    if (dialogPage) {
      const pages = project.pages.map((p) =>
        p.id === dialogPage.id
          ? {
              ...p,
              ...values,
              navLabel: values.navLabel || values.name,
              parentId: values.footerOnly ? null : values.parentId,
              inMainNav: values.footerOnly ? false : values.inMainNav,
              updatedAt: new Date().toISOString(),
            }
          : p,
      );
      applyPages(pages, `Page “${values.name}” updated`);
      toast("Page updated", "success");
    } else {
      const page = buildPage(project.id, values, project.pages.length);
      applyPages([...project.pages, page], `Page “${page.name}” added`, "page-added");
      toast("Page added", "success", "Open it in the editor to add sections.");
    }
  };

  const actions: SitemapNodeActions = {
    onEdit: (page) => {
      setDialogPage(page);
      setDialogOpen(true);
    },
    onDuplicate: (page) => {
      const copy = duplicatePage(page);
      const index = project.pages.findIndex((p) => p.id === page.id);
      const pages = [...project.pages];
      pages.splice(index + 1, 0, copy);
      applyPages(pages, `Page “${page.name}” duplicated`, "page-added");
      toast("Page duplicated", "success");
    },
    onDelete: (page) => setDeleteTarget(page),
    onMakeHomepage: (page) => {
      applyPages(markAsHomepage(project.pages, page.id), `“${page.name}” marked as homepage`);
      toast("Homepage updated", "success");
    },
    onMoveUp: (page) => movePage(page, -1),
    onMoveDown: (page) => movePage(page, 1),
    onNest: (page) => {
      const index = nodes.findIndex((n) => n.page.id === page.id);
      const above = nodes
        .slice(0, index)
        .reverse()
        .find((n) => n.depth === 0 && n.page.id !== page.id);
      if (!above) return;
      const pages = project.pages.map((p) =>
        p.id === page.id ? { ...p, parentId: above.page.id, order: childCount(above.page.id) } : p,
      );
      applyPages(pages, null);
    },
    onUnnest: (page) => {
      const pages = project.pages.map((p) =>
        p.id === page.id ? { ...p, parentId: null, order: project.pages.length } : p,
      );
      applyPages(pages, null);
    },
  };

  const movePage = (page: ProjectPage, direction: -1 | 1) => {
    const siblings = project.pages
      .filter(
        (p) =>
          p.footerOnly === page.footerOnly &&
          (p.parentId ?? null) === (page.parentId ?? null),
      )
      .sort((a, b) => a.order - b.order);
    const index = siblings.findIndex((p) => p.id === page.id);
    const swapWith = siblings[index + direction];
    if (!swapWith) return;
    const pages = project.pages.map((p) => {
      if (p.id === page.id) return { ...p, order: swapWith.order };
      if (p.id === swapWith.id) return { ...p, order: page.order };
      return p;
    });
    applyPages(pages, null);
  };

  const flagsFor = (node: SitemapNodeData): SitemapNodeFlags => {
    const siblings = nodes.filter(
      (n) => n.depth === node.depth && (n.page.parentId ?? null) === (node.page.parentId ?? null),
    );
    const index = siblings.findIndex((n) => n.page.id === node.page.id);
    const nodeIndex = nodes.findIndex((n) => n.page.id === node.page.id);
    const hasPossibleParentAbove = nodes
      .slice(0, nodeIndex)
      .some((n) => n.depth === 0 && n.page.id !== node.page.id);
    return {
      canMoveUp: index > 0,
      canMoveDown: index < siblings.length - 1,
      canNest:
        node.depth === 0 &&
        !node.page.isHomepage &&
        childCount(node.page.id) === 0 &&
        hasPossibleParentAbove,
      canUnnest: node.depth === 1,
    };
  };

  const footerFlagsFor = (page: ProjectPage): SitemapNodeFlags => {
    const index = footer.findIndex((p) => p.id === page.id);
    return {
      canMoveUp: index > 0,
      canMoveDown: index < footer.length - 1,
      canNest: false,
      canUnnest: false,
    };
  };

  // ----- Render -----------------------------------------------------------

  if (project.pages.length === 0) {
    return (
      <>
        <EmptyState
          icon={Network}
          title="No pages yet"
          description="Start your sitemap by adding a homepage — every website blueprint needs one."
          action={
            <Button
              onClick={() => {
                setDialogPage(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" aria-hidden />
              Add your first page
            </Button>
          }
        />
        <PageDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleDialogSubmit}
          page={dialogPage}
          pages={project.pages}
        />
      </>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Site structure</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Drag pages to reorder them, or drag a page slightly to the right to nest it
            beneath the page above. Keyboard users can reorder from each page&apos;s menu.
          </p>
        </div>
        <Button
          onClick={() => {
            setDialogPage(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden />
          Add page
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveId(null);
          setProjectedDepth(null);
        }}
      >
        <SortableContext
          items={nodes.map((n) => n.page.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-2" aria-label="Main navigation pages">
            {nodes.map((node) => (
              <SitemapNode
                key={node.page.id}
                page={node.page}
                depth={node.depth}
                projectedDepth={node.page.id === activeId ? projectedDepth : null}
                childCount={childCount(node.page.id)}
                actions={actions}
                flags={flagsFor(node)}
                editorHref={`/projects/${project.id}/editor?page=${node.page.id}`}
              />
            ))}
          </ul>
        </SortableContext>
        <DragOverlay>
          {activeNode && (
            <SitemapNodeCard
              page={activeNode.page}
              childCount={childCount(activeNode.page.id)}
              className={cnOverlay(projectedDepth)}
            />
          )}
        </DragOverlay>
      </DndContext>

      <section aria-labelledby="footer-pages-heading" className="space-y-2">
        <h3
          id="footer-pages-heading"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900"
        >
          <PanelBottom className="size-4 text-slate-400" aria-hidden />
          Footer-only pages
        </h3>
        {footer.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500">
            No footer-only pages yet. Legal pages like a privacy policy usually live here —
            add one with “Add page” and tick “Footer-only page”.
          </p>
        ) : (
          <ul className="space-y-2">
            {footer.map((page) => (
              <li key={page.id} className="list-none">
                <SitemapNodeCard
                  page={page}
                  childCount={0}
                  actions={actions}
                  flags={footerFlagsFor(page)}
                  editorHref={`/projects/${project.id}/editor?page=${page.id}`}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <PageDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setDialogPage(null);
        }}
        onSubmit={handleDialogSubmit}
        page={dialogPage}
        pages={project.pages}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          const isHome = deleteTarget.isHomepage;
          applyPages(
            removePage(project.pages, deleteTarget.id),
            `Page “${deleteTarget.name}” deleted`,
            "page-deleted",
          );
          toast(
            "Page deleted",
            "info",
            isHome ? "You'll need to mark another page as the homepage." : undefined,
          );
        }}
        title={`Delete “${deleteTarget?.name ?? ""}”?`}
        description={
          deleteTarget && childCount(deleteTarget.id) > 0
            ? "Its child pages will be kept and moved to the top level. The page's sections will be removed. This cannot be undone."
            : deleteTarget?.isHomepage
              ? "This is your homepage — deleting it removes its sections too. This cannot be undone."
              : "The page and its sections will be removed from this blueprint. This cannot be undone."
        }
        confirmLabel="Delete page"
      />
    </div>
  );
}

function cnOverlay(projectedDepth: 0 | 1 | null): string {
  return projectedDepth === 1
    ? "ml-8 border-indigo-400 shadow-lg sm:ml-10"
    : "border-indigo-400 shadow-lg";
}
