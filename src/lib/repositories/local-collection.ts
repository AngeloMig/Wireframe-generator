import { readJson, writeJson } from "../storage/local-storage";
import { ensureSeeded } from "../storage/seed";

/**
 * Shared plumbing for the list-shaped Local* repositories: one storage key
 * holding an array of records across all projects.
 */
export function readCollection<T>(key: string): T[] {
  ensureSeeded();
  const items = readJson<T[]>(key, []);
  return Array.isArray(items) ? items : [];
}

export function writeCollection<T>(key: string, items: T[]): void {
  if (!writeJson(key, items)) {
    throw new Error("Could not save to local storage — it may be full.");
  }
}
