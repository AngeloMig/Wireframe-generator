import { APP_CONFIG } from "@/config/app";
import { buildDemoNotifications, buildDemoProjects } from "@/data/demo-projects";
import type { AppNotification, Project } from "@/types";
import { readJson, removeKey, STORAGE_KEYS, writeJson } from "./local-storage";

interface StorageMeta {
  schemaVersion: number;
  seededAt: string;
}

/**
 * Schema versioning + migration hook. When the local data shape changes,
 * bump APP_CONFIG.storageSchemaVersion and add a migration step here.
 */
function migrate(meta: StorageMeta): StorageMeta {
  const current = { ...meta };
  // Future migrations run in order, e.g.:
  // if (current.schemaVersion === 1) { ...transform data...; current.schemaVersion = 2; }
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
  writeJson(STORAGE_KEYS.projects, projects);
  writeJson(STORAGE_KEYS.notifications, notifications);
  writeJson(STORAGE_KEYS.sectionTemplateOverrides, {});
  removeKey(STORAGE_KEYS.wizardDraft);
  writeJson(STORAGE_KEYS.meta, {
    schemaVersion: APP_CONFIG.storageSchemaVersion,
    seededAt: new Date().toISOString(),
  } satisfies StorageMeta);
  return { projects, notifications };
}
