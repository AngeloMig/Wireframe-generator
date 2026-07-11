import { APP_CONFIG } from "@/config/app";
import {
  buildDemoCollaboration,
  buildDemoNotifications,
  buildDemoProjects,
} from "@/data/demo-projects";
import type {
  AppNotification,
  PageStatus,
  Project,
  ProjectComment,
  UserRole,
} from "@/types";
import { createId } from "@/utils/id";
import { migrateProjectsV1toV2 } from "./legacy-sections";
import { readJson, removeKey, STORAGE_KEYS, writeJson } from "./local-storage";

interface StorageMeta {
  schemaVersion: number;
  seededAt: string;
}

/** Shape of pre-v3 comments that lived embedded on the project record. */
interface LegacyComment {
  id: string;
  projectId: string;
  target: "project" | "page" | "section";
  pageId: string | null;
  sectionId: string | null;
  authorId: string;
  authorName?: string;
  authorRole?: string;
  message: string;
  status: "open" | "resolved";
  replies?: {
    id: string;
    authorId: string;
    message: string;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

function normalizeRole(role: string | undefined): UserRole {
  if (role === "agency") return "agency-designer";
  if (
    role === "customer" ||
    role === "agency-designer" ||
    role === "agency-developer" ||
    role === "agency-pm" ||
    role === "admin"
  ) {
    return role;
  }
  return "customer";
}

const LEGACY_PAGE_STATUS: Record<string, PageStatus> = {
  "in-progress": "content-needed",
};

/**
 * v3: collaboration phase.
 * - Comments move out of the project record into their own collection, in the
 *   richer scope/visibility/priority shape.
 * - Sections gain reviewStatus; pages keep their status (renamed values map).
 * - Notifications become per-user (assigned to the customer by default).
 * - Roles expand from "agency" to designer/developer/pm.
 * - Members/versions/approvals/suggestions collections start empty (members
 *   get seeded for demo projects only on reseed).
 */
function migrateV2toV3(): void {
  type LooseProject = Project & {
    comments?: LegacyComment[];
    activity?: { actorRole?: string }[];
  };
  const projects = readJson<LooseProject[]>(STORAGE_KEYS.projects, []);
  const extractedComments: ProjectComment[] = [];

  const migrated = projects.map((project) => {
    const { comments, ...rest } = project;
    for (const legacy of comments ?? []) {
      extractedComments.push({
        id: legacy.id,
        projectId: legacy.projectId,
        pageId: legacy.pageId ?? undefined,
        sectionId: legacy.sectionId ?? undefined,
        scope: legacy.target,
        visibility: "customer",
        authorId: legacy.authorId,
        message: legacy.message,
        mentions: [],
        status: legacy.status,
        priority: "normal",
        replies: (legacy.replies ?? []).map((r) => ({
          id: r.id,
          commentId: legacy.id,
          authorId: r.authorId,
          message: r.message,
          mentions: [],
          attachments: [],
          createdAt: r.createdAt,
          updatedAt: r.createdAt,
        })),
        attachments: [],
        isActionItem: false,
        createdAt: legacy.createdAt,
        updatedAt: legacy.updatedAt,
      });
    }

    return {
      ...rest,
      pages: rest.pages.map((page) => ({
        ...page,
        status: LEGACY_PAGE_STATUS[page.status as string] ?? page.status,
        sections: page.sections.map((section) => ({
          ...section,
          reviewStatus: section.reviewStatus ?? "draft",
        })),
      })),
      activity: (rest.activity ?? []).map((entry) => ({
        ...entry,
        actorRole: normalizeRole(entry.actorRole),
      })),
    } as Project;
  });

  writeJson(STORAGE_KEYS.projects, migrated);
  writeJson(STORAGE_KEYS.comments, extractedComments);

  // Notifications become per-user; anything existing belonged to the customer.
  type LegacyNotification = AppNotification & { href?: string | null };
  const notifications = readJson<LegacyNotification[]>(STORAGE_KEYS.notifications, []);
  writeJson(
    STORAGE_KEYS.notifications,
    notifications.map((n) => ({
      id: n.id ?? createId(),
      userId: n.userId ?? "user-customer-1",
      projectId: n.projectId ?? undefined,
      pageId: n.pageId,
      sectionId: n.sectionId,
      type: n.type ?? "general",
      title: n.title,
      message: n.message,
      isRead: n.isRead ?? false,
      createdAt: n.createdAt,
      actionUrl: n.actionUrl ?? n.href ?? undefined,
    })),
  );

  // New collections start empty — safe defaults, nothing destroyed.
  for (const key of [
    STORAGE_KEYS.members,
    STORAGE_KEYS.versions,
    STORAGE_KEYS.approvals,
    STORAGE_KEYS.suggestions,
    STORAGE_KEYS.revisionRequests,
  ]) {
    if (readJson<unknown[] | null>(key, null) === null) {
      writeJson(key, []);
    }
  }
}

/**
 * Schema versioning + migration hook. When the local data shape changes,
 * bump APP_CONFIG.storageSchemaVersion and add a migration step here.
 */
function migrate(meta: StorageMeta): StorageMeta {
  const current = { ...meta };

  if (current.schemaVersion === 1) {
    // v2: sections moved from templateId to sectionType + design variationId.
    const projects = readJson<Project[]>(STORAGE_KEYS.projects, []);
    writeJson(STORAGE_KEYS.projects, migrateProjectsV1toV2(projects));
    // Template overrides referenced ids that no longer exist.
    removeKey("section-template-overrides");
    writeJson(STORAGE_KEYS.sectionVariationOverrides, {});
    current.schemaVersion = 2;
  }

  if (current.schemaVersion === 2) {
    migrateV2toV3();
    current.schemaVersion = 3;
  }

  current.schemaVersion = APP_CONFIG.storageSchemaVersion;
  writeJson(STORAGE_KEYS.meta, current);
  return current;
}

/** Ensure demo data exists and the schema is current. Safe to call often. */
export function ensureSeeded(): void {
  const meta = readJson<StorageMeta | null>(STORAGE_KEYS.meta, null);
  const projects = readJson<Project[] | null>(STORAGE_KEYS.projects, null);

  if (meta && Array.isArray(projects)) {
    if (meta.schemaVersion !== APP_CONFIG.storageSchemaVersion) {
      migrate(meta);
    }
    return;
  }

  seedDemoData();
}

/** Wipe all locally stored app data and reseed the demo content. */
export function seedDemoData(): { projects: Project[]; notifications: AppNotification[] } {
  const projects = buildDemoProjects();
  const notifications = buildDemoNotifications(projects);
  const collaboration = buildDemoCollaboration(projects);
  writeJson(STORAGE_KEYS.projects, projects);
  writeJson(STORAGE_KEYS.notifications, notifications);
  writeJson(STORAGE_KEYS.comments, collaboration.comments);
  writeJson(STORAGE_KEYS.members, collaboration.members);
  writeJson(STORAGE_KEYS.versions, collaboration.versions);
  writeJson(STORAGE_KEYS.suggestions, collaboration.suggestions);
  writeJson(STORAGE_KEYS.approvals, []);
  writeJson(STORAGE_KEYS.revisionRequests, []);
  writeJson(STORAGE_KEYS.sectionVariationOverrides, {});
  removeKey(STORAGE_KEYS.wizardDraft);
  removeKey(STORAGE_KEYS.favoriteVariations);
  writeJson(STORAGE_KEYS.meta, {
    schemaVersion: APP_CONFIG.storageSchemaVersion,
    seededAt: new Date().toISOString(),
  } satisfies StorageMeta);
  return { projects, notifications };
}
