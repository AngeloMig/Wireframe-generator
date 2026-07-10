"use client";

import { MousePointerClick } from "lucide-react";
import type { InspectorTab } from "@/stores/editor-store";
import { useEditorStore } from "@/stores/editor-store";
import type { PageSection, SectionTemplate } from "@/types";
import { cn } from "@/utils/cn";
import { ContentTab } from "./content-tab";
import type { SectionMutator } from "./inspector-types";
import { LayoutTab } from "./layout-tab";
import { NotesTab } from "./notes-tab";
import { StyleTab } from "./style-tab";

const TABS: { id: InspectorTab; label: string }[] = [
  { id: "content", label: "Content" },
  { id: "layout", label: "Layout" },
  { id: "style", label: "Style" },
  { id: "notes", label: "Notes" },
];

/** Right panel: edit the selected section via Content/Layout/Style/Notes. */
export function SectionInspector({
  section,
  template,
  onChange,
}: {
  section: PageSection | null;
  template: SectionTemplate | null;
  onChange: SectionMutator;
}) {
  const inspectorTab = useEditorStore((s) => s.inspectorTab);
  const setInspectorTab = useEditorStore((s) => s.setInspectorTab);

  if (!section || !template) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-slate-100">
          <MousePointerClick className="size-5 text-slate-400" aria-hidden />
        </div>
        <p className="text-sm font-semibold text-slate-700">No section selected</p>
        <p className="max-w-48 text-xs text-slate-500">
          Click a section on the canvas to edit its content, layout, style, and notes.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-4 pt-3 pb-0">
        <p className="truncate text-sm font-semibold text-slate-900">{template.name}</p>
        <p className="mb-2 truncate text-[11px] text-slate-400">{template.description}</p>
        <div role="tablist" aria-label="Inspector tabs" className="-mb-px flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={inspectorTab === tab.id}
              onClick={() => setInspectorTab(tab.id)}
              className={cn(
                "cursor-pointer border-b-2 px-2.5 py-2 text-xs font-medium transition-colors",
                inspectorTab === tab.id
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-800",
              )}
            >
              {tab.label}
              {tab.id === "notes" &&
                (section.notes.customerNote ||
                  section.notes.quickNotes.length > 0 ||
                  section.notes.agencyQuestion) && (
                  <span className="ml-1 inline-block size-1.5 rounded-full bg-indigo-500 align-middle" />
                )}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {inspectorTab === "content" && (
          <ContentTab section={section} template={template} onChange={onChange} />
        )}
        {inspectorTab === "layout" && (
          <LayoutTab section={section} template={template} onChange={onChange} />
        )}
        {inspectorTab === "style" && <StyleTab section={section} onChange={onChange} />}
        {inspectorTab === "notes" && <NotesTab section={section} onChange={onChange} />}
      </div>
    </div>
  );
}
