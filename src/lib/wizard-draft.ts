import type { WizardData } from "@/components/project/wizard/wizard-types";
import { readJson, removeKey, STORAGE_KEYS, writeJson } from "./storage/local-storage";

/** Persist in-progress wizard answers so Save & Exit / refresh keeps them. */

export function readWizardDraft(): WizardData | null {
  const draft = readJson<WizardData | null>(STORAGE_KEYS.wizardDraft, null);
  if (!draft || typeof draft !== "object" || !draft.info) return null;
  return draft;
}

export function writeWizardDraft(data: WizardData): void {
  writeJson(STORAGE_KEYS.wizardDraft, data);
}

export function clearWizardDraft(): void {
  removeKey(STORAGE_KEYS.wizardDraft);
}
