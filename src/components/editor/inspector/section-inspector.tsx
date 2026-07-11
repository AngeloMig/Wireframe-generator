"use client";

import { MousePointerClick } from "lucide-react";
import { getSectionTypeDefinition } from "@/data/section-schemas";
import { getVariation } from "@/data/section-variations";
import type { InspectorTab } from "@/stores/editor-store";
import { useEditorStore } from "@/stores/editor-store";
import { useSessionStore } from "@/stores/session-store";
import type { PageSection } from "@/types";
import { cn } from "@/utils/cn";
import { ContentTab } from "./content-tab";
import type { SectionMutator } from "./inspector-types";
import { LayoutTab } from "./layout-tab";
import { NotesTab } from "./notes-tab";
import { StyleTab } from "./style-tab";

const TABS: { id: InspectorTab; label: string }[] = [
  { id: "content", label: "Content" },
  { id: "layout", label: "Design" },
  { id: "style", label: "Settings" },
  { id: "notes", label: "Notes" },
];

/** Right panel: edit the selected section via Content/Layout/Style/Notes. */
export function SectionInspector({
  section,
  onChange,
}: {
  section: PageSection | null;
  onChange: SectionMutator;
}) {
  const inspectorTab = useEditorStore((s) => s.inspectorTab);
  const setInspectorTab = useEditorStore((s) => s.setInspectorTab);
  const isCustomer = useSessionStore((s) => s.user.role === "customer");

  // Customers edit words and pick designs; the technical Settings tab is
  // agency-only. If a customer lands on it (persisted state), snap to Content.
  const tabs = isCustomer ? TABS.filter((t) => t.id !== "style") : TABS;
  const activeTab =
    isCustomer && inspectorTab === "style" ? "content" : inspectorTab;

  if (!section) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-[var(--primary-soft)]">
          <MousePointerClick className="size-5 text-[var(--primary)]" aria-hidden />
        </div>
        <p className="text-sm font-semibold text-slate-700">No section selected</p>
        <p className="max-w-48 text-xs text-slate-500">
          Choose a section on the page to edit its words, design, settings, and notes.
        </p>
      </div>
    );
  }

  const definition = getSectionTypeDefinition(section.sectionType);
  const variation = getVariation(section.variationId) ?? null;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--border-default)] bg-[#fbfcfa] px-4 pt-4 pb-0">
        <p className="truncate text-sm font-bold text-[var(--text-primary)]">
          {variation?.name ?? definition.label}
        </p>
        <p className="mb-2 truncate text-[11px] text-slate-400">
          {definition.label}
          {variation ? ` · ${variation.description}` : ""}
        </p>
        <div role="tablist" aria-label="Inspector tabs" className="-mb-px flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setInspectorTab(tab.id)}
              className={cn(
                "cursor-pointer border-b-2 px-2.5 py-2.5 text-xs font-semibold transition-colors",
                activeTab === tab.id
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              )}
            >
              {tab.label}
              {tab.id === "notes" &&
                (section.notes.customerNote ||
                  section.notes.quickNotes.length > 0 ||
                  section.notes.agencyQuestion) && (
                  <span className="ml-1 inline-block size-1.5 rounded-full bg-[var(--primary)] align-middle" />
                )}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeTab === "content" && (
          <ContentTab
            section={section}
            definition={definition}
            variation={variation}
            onChange={onChange}
          />
        )}
        {activeTab === "layout" && <LayoutTab section={section} onChange={onChange} />}
        {activeTab === "style" && <StyleTab section={section} onChange={onChange} />}
        {activeTab === "notes" && <NotesTab section={section} onChange={onChange} />}
      </div>
    </div>
  );
}
