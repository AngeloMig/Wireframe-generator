"use client";

import { AlertTriangle } from "lucide-react";
import { getVariation } from "@/data/section-variations";
import type { PageSection } from "@/types";
import { SectionFrame } from "./primitives";
import { resolveSectionComponent } from "./registry";

/**
 * Renders a page section by resolving its design variation from the registry.
 * Unknown variations or component keys degrade to a helpful error card
 * instead of crashing the canvas.
 */
export function SectionRenderer({ section }: { section: PageSection }) {
  const variation = getVariation(section.variationId);
  if (!variation) {
    return (
      <MissingSectionCard
        title="Unknown section design"
        detail={`No design with id “${section.variationId}” exists in the library. The section's content is safe — pick a new design from the Layout tab.`}
      />
    );
  }

  const Component = resolveSectionComponent(section.sectionType, variation.componentKey);
  if (!Component) {
    return (
      <MissingSectionCard
        title="Design not renderable"
        detail={`“${variation.name}” points at component “${variation.componentKey}” which is not registered for ${section.sectionType} sections.`}
      />
    );
  }

  return (
    <SectionFrame section={section}>
      <Component section={section} variation={variation} />
    </SectionFrame>
  );
}

function MissingSectionCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 border-y border-dashed border-amber-300 bg-amber-50 px-10 py-6">
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-500" aria-hidden />
      <div>
        <p className="text-sm font-semibold text-amber-800">{title}</p>
        <p className="mt-1 max-w-xl text-xs text-amber-700">{detail}</p>
      </div>
    </div>
  );
}
