import { readJson, STORAGE_KEYS, writeJson } from "@/lib/storage/local-storage";
import type { Project } from "@/types";

/**
 * Helpers for the focused customer workspace: customers live inside the
 * wireframe editor and never see the agency/admin chrome. Route allowances
 * and "continue where you left off" persistence live here so the shell,
 * dashboard, and editor all agree on the rules.
 */

/** Projects a customer is assigned to (owner of, in the current data model). */
export function customerProjects(projects: Project[], userId: string): Project[] {
  return projects.filter((p) => p.ownerId === userId);
}

/** Project sub-routes a customer may open directly. Everything else redirects. */
const CUSTOMER_PROJECT_SEGMENTS = new Set(["editor", "review", "revisions"]);

/** Whether a customer may stay on this path; false triggers a redirect home. */
export function isCustomerAllowedPath(pathname: string): boolean {
  if (pathname === "/dashboard") return true;
  const match = pathname.match(/^\/projects\/([^/]+)\/([^/]+)/);
  if (!match) return false;
  return CUSTOMER_PROJECT_SEGMENTS.has(match[2]);
}

export function customerEditorPath(projectId: string, pageId?: string | null): string {
  return pageId
    ? `/projects/${projectId}/editor?page=${encodeURIComponent(pageId)}`
    : `/projects/${projectId}/editor`;
}

interface LastOpened {
  projectId: string;
  pageId?: string;
}

export function readLastOpened(): LastOpened | null {
  return readJson<LastOpened | null>(STORAGE_KEYS.customerLastOpened, null);
}

export function writeLastOpened(projectId: string, pageId?: string): void {
  writeJson(STORAGE_KEYS.customerLastOpened, { projectId, pageId } satisfies LastOpened);
}
