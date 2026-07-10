"use client";

import { FileStack, LayoutTemplate, Sparkles, SquareDashed } from "lucide-react";
import { getSectionTemplate } from "@/data/section-templates";
import { recommendPageTemplates } from "@/lib/recommendations";
import type { PageTemplate, VisualStyle, WebsiteGoal } from "@/types";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/badge";
import type { StartingPointMode } from "./wizard-types";

function TemplateSectionList({ template }: { template: PageTemplate }) {
  return (
    <ol className="mt-3 space-y-1">
      {template.sections.map((section, index) => {
        const sectionTemplate = getSectionTemplate(section.templateId);
        return (
          <li
            key={`${section.templateId}-${index}`}
            className="flex items-center gap-2 text-xs text-slate-500"
          >
            <span className="flex size-4 shrink-0 items-center justify-center rounded bg-slate-100 text-[10px] font-medium text-slate-500">
              {index + 1}
            </span>
            {sectionTemplate?.name ?? section.templateId}
          </li>
        );
      })}
    </ol>
  );
}

export function StepStartingPoint({
  industry,
  goals,
  styles,
  mode,
  templateId,
  onChange,
}: {
  industry: string;
  goals: WebsiteGoal[];
  styles: VisualStyle[];
  mode: StartingPointMode;
  templateId: string | null;
  onChange: (mode: StartingPointMode, templateId: string | null) => void;
}) {
  const ranked = recommendPageTemplates(industry, goals);
  const recommended = ranked[0];
  const others = ranked.slice(1);
  void styles;

  const cardClass = (selected: boolean) =>
    cn(
      "flex w-full cursor-pointer flex-col rounded-xl border bg-white p-4 text-left shadow-sm transition-all",
      selected
        ? "border-indigo-500 ring-2 ring-indigo-100"
        : "border-slate-200 hover:border-slate-300 hover:shadow-md",
    );

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        Choose how your homepage starts. Every option can be fully customised afterwards in the
        wireframe editor.
      </p>

      {recommended && (
        <button
          type="button"
          role="radio"
          aria-checked={mode === "recommended"}
          className={cardClass(mode === "recommended")}
          onClick={() => onChange("recommended", recommended.id)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Sparkles className="size-4.5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Recommended: {recommended.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Based on your industry and goals
                </p>
              </div>
            </div>
            <Badge className="border-indigo-200 bg-indigo-50 text-indigo-700">Best match</Badge>
          </div>
          <p className="mt-3 text-sm text-slate-600">{recommended.description}</p>
          <TemplateSectionList template={recommended} />
        </button>
      )}

      <div>
        <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
          <LayoutTemplate className="size-4 text-slate-400" aria-hidden />
          Or pick another homepage template
        </h3>
        <div
          role="radiogroup"
          aria-label="Homepage templates"
          className="grid gap-3 sm:grid-cols-2"
        >
          {others.map((template) => {
            const selected = mode === "template" && templateId === template.id;
            return (
              <button
                key={template.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={cardClass(selected)}
                onClick={() => onChange("template", template.id)}
              >
                <div className="flex items-center gap-2">
                  <FileStack className="size-4 shrink-0 text-slate-400" aria-hidden />
                  <span className="text-sm font-semibold text-slate-900">{template.name}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{template.description}</p>
                <p className="mt-2 text-xs font-medium text-slate-400">
                  {template.sections.length} sections
                </p>
              </button>
            );
          })}

          <button
            type="button"
            role="radio"
            aria-checked={mode === "blank"}
            className={cardClass(mode === "blank")}
            onClick={() => onChange("blank", null)}
          >
            <div className="flex items-center gap-2">
              <SquareDashed className="size-4 shrink-0 text-slate-400" aria-hidden />
              <span className="text-sm font-semibold text-slate-900">Start blank</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Begin with an empty homepage and add sections yourself from the library.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
