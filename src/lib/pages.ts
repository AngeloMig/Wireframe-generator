import type { PageStatus, PageType, ProjectPage } from "@/types";
import { createId, nowIso } from "@/utils/id";
import { normalisePageOrder } from "./project-utils";

export interface PageFormValues {
  name: string;
  navLabel: string;
  type: PageType;
  status: PageStatus;
  parentId: string | null;
  inMainNav: boolean;
  footerOnly: boolean;
}

/** Build a full ProjectPage record from form values. */
export function buildPage(
  projectId: string,
  values: PageFormValues,
  order: number,
): ProjectPage {
  const now = nowIso();
  return {
    id: createId(),
    projectId,
    name: values.name,
    navLabel: values.navLabel || values.name,
    type: values.type,
    status: values.status,
    isHomepage: false,
    inMainNav: values.footerOnly ? false : values.inMainNav,
    footerOnly: values.footerOnly,
    parentId: values.footerOnly ? null : values.parentId,
    order,
    sections: [],
    createdAt: now,
    updatedAt: now,
  };
}

/** Deep-copy a page (and its sections) with fresh IDs. Never a homepage. */
export function duplicatePage(page: ProjectPage): ProjectPage {
  const now = nowIso();
  return {
    ...structuredClone(page),
    id: createId(),
    name: `${page.name} (Copy)`,
    navLabel: `${page.navLabel} (Copy)`,
    isHomepage: false,
    status: "draft",
    order: page.order + 1,
    sections: page.sections.map((section) => ({
      ...structuredClone(section),
      id: createId(),
    })),
    createdAt: now,
    updatedAt: now,
  };
}

/** Remove a page; its children are promoted to the top level. */
export function removePage(pages: ProjectPage[], pageId: string): ProjectPage[] {
  const remaining = pages
    .filter((p) => p.id !== pageId)
    .map((p) => (p.parentId === pageId ? { ...p, parentId: null } : p));
  return normalisePageOrder(remaining);
}

/** Make the given page the homepage (top level, first, in main nav). */
export function markAsHomepage(pages: ProjectPage[], pageId: string): ProjectPage[] {
  const next = pages.map((p) => {
    if (p.id === pageId) {
      return {
        ...p,
        isHomepage: true,
        parentId: null,
        footerOnly: false,
        inMainNav: true,
        order: -1,
      };
    }
    // Children of the new homepage stay put; only one homepage at a time.
    return p.isHomepage ? { ...p, isHomepage: false } : p;
  });
  return normalisePageOrder(next);
}

export interface SitemapNodeData {
  page: ProjectPage;
  depth: 0 | 1;
}

/** Flatten the two-level page tree (children directly after their parent). */
export function flattenSitemap(pages: ProjectPage[]): SitemapNodeData[] {
  const tree = normalisePageOrder(pages.filter((p) => !p.footerOnly));
  const nodes: SitemapNodeData[] = [];
  tree
    .filter((p) => !p.parentId)
    .forEach((page) => {
      nodes.push({ page, depth: 0 });
      tree
        .filter((p) => p.parentId === page.id)
        .forEach((child) => nodes.push({ page: child, depth: 1 }));
    });
  return nodes;
}

export function footerPages(pages: ProjectPage[]): ProjectPage[] {
  return pages.filter((p) => p.footerOnly).sort((a, b) => a.order - b.order);
}

/**
 * Rebuild parentId/order from a flattened node list after a drag or a
 * keyboard move, then merge the untouched footer-only pages back in.
 */
export function rebuildFromFlattened(
  nodes: SitemapNodeData[],
  allPages: ProjectPage[],
): ProjectPage[] {
  let lastTopLevelId: string | null = null;
  let topOrder = 0;
  let childOrder = 0;
  const rebuilt = nodes.map((node) => {
    if (node.depth === 0) {
      lastTopLevelId = node.page.id;
      childOrder = 0;
      return { ...node.page, parentId: null, order: topOrder++ };
    }
    return { ...node.page, parentId: lastTopLevelId, order: childOrder++ };
  });
  return normalisePageOrder([...rebuilt, ...footerPages(allPages)]);
}
