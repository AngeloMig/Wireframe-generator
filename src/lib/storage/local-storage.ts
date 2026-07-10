import { APP_CONFIG } from "@/config/app";

/**
 * Low-level, guarded localStorage access. Nothing outside src/lib should
 * touch localStorage directly — components go through repositories/stores.
 */

function storageKey(key: string): string {
  return `${APP_CONFIG.storageKeyPrefix}:${key}`;
}

export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(storageKey(key));
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    // Malformed data — drop it rather than crash the app.
    try {
      window.localStorage.removeItem(storageKey(key));
    } catch {
      /* ignore */
    }
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(storageKey(key), JSON.stringify(value));
    return true;
  } catch {
    // Quota exceeded or storage unavailable.
    return false;
  }
}

export function removeKey(key: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(storageKey(key));
  } catch {
    /* ignore */
  }
}

export const STORAGE_KEYS = {
  meta: "meta",
  projects: "projects",
  notifications: "notifications",
  sectionTemplateOverrides: "section-template-overrides",
  session: "session",
  wizardDraft: "wizard-draft",
} as const;
