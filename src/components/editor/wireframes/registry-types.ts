import type { PageSection, SectionVariation } from "@/types";

/** Props every section design component receives from the renderer. */
export interface SectionComponentProps {
  section: PageSection;
  variation: SectionVariation;
}

export type SectionComponent = React.ComponentType<SectionComponentProps>;
