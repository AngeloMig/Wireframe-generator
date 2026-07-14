"use client";

import { brandTheme } from "@/lib/editor-utils";
import type { Project } from "@/types";
import { cn } from "@/utils/cn";
import { ScaledPreview } from "@/components/collab/scaled-preview";
import { WireProvider } from "@/components/editor/wireframes/primitives";
import { SectionRenderer } from "@/components/editor/wireframes/section-renderer";

/**
 * A project's homepage wireframe rendered small, like a sheet pulled from the
 * flat file. Decorative: always aria-hidden and pointer-inert — wireframe
 * sections contain real interactive elements that must never be reachable
 * from a card. Give it a height via className.
 */
export function SheetPreview({
  project,
  className,
}: {
  project: Project;
  className?: string;
}) {
  const homepage =
    project.pages.find((p) => p.isHomepage) ?? project.pages[0] ?? null;
  const sections = homepage
    ? [...homepage.sections]
        .sort((a, b) => a.order - b.order)
        .filter((section) => !section.isHidden)
        .slice(0, 6)
    : [];

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none relative shrink-0 overflow-hidden bg-white select-none",
        className ?? "h-40",
      )}
    >
      {sections.length > 0 ? (
        <ScaledPreview scale={0.28}>
          <WireProvider
            value={{ styled: false, theme: brandTheme(project), device: "desktop", sectionIsDark: false }}
          >
            {sections.map((section) => (
              <SectionRenderer key={section.id} section={section} />
            ))}
          </WireProvider>
        </ScaledPreview>
      ) : (
        <div className="flex h-full items-center justify-center font-mono text-[10px] tracking-[0.18em] text-slate-400 uppercase">
          Blank sheet
        </div>
      )}
      {/* paper fade so the crop reads as a sheet, not a bug */}
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
}
