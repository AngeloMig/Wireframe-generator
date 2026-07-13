/**
 * Central application configuration.
 * Change the product name here and it updates everywhere.
 */

export const APP_CONFIG = {
  name: "Website Blueprint Builder",
  shortName: "Blueprint",
  tagline: "Plan your website, section by section",
  agencyName: "Northshore Web Studio",
  agencyEmail: "hello@northshoreweb.studio",
  /** Bumped when the shape of locally stored data changes. */
  storageSchemaVersion: 6,
  storageKeyPrefix: "wbb",
  autosaveDebounceMs: 900,
} as const;
