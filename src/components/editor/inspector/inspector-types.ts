import type { PageSection } from "@/types";

/**
 * Applies a mutation to the selected section. `editKey` groups rapid edits
 * (e.g. keystrokes in one field) into a single undo history entry.
 */
export type SectionMutator = (
  mutate: (section: PageSection) => PageSection,
  editKey?: string,
) => void;
