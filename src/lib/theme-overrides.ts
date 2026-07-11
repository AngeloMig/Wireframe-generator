import type { BrandTheme } from "@/lib/editor-utils";
import { readJson, STORAGE_KEYS, writeJson } from "@/lib/storage/local-storage";

/**
 * Per-project styled-mode theme tweaks made in the editor's Theme panel.
 * Layered over the wizard-derived brand theme; stored locally like all
 * other prototype state.
 */

export type ThemeOverrides = Partial<BrandTheme>;

type OverridesByProject = Record<string, ThemeOverrides>;

export function readThemeOverrides(projectId: string): ThemeOverrides {
  const all = readJson<OverridesByProject>(STORAGE_KEYS.themeOverrides, {});
  return all[projectId] ?? {};
}

export function writeThemeOverrides(projectId: string, overrides: ThemeOverrides): void {
  const all = readJson<OverridesByProject>(STORAGE_KEYS.themeOverrides, {});
  if (Object.keys(overrides).length === 0) delete all[projectId];
  else all[projectId] = overrides;
  writeJson(STORAGE_KEYS.themeOverrides, all);
}
