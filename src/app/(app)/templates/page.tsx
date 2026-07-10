"use client";

import { useMemo, useState } from "react";
import { Layers, LayoutTemplate, Search, SearchX } from "lucide-react";
import { PAGE_TEMPLATES } from "@/data/page-templates";
import { SECTION_TEMPLATES } from "@/data/section-templates";
import { PAGE_TYPE_LABELS, SECTION_CATEGORY_LABELS } from "@/config/labels";
import type { SectionCategory } from "@/types";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";

const CATEGORY_FILTERS: (SectionCategory | "all")[] = [
  "all",
  "navigation",
  "hero",
  "content",
  "services",
  "ecommerce",
  "social-proof",
  "conversion",
  "footer",
];

/** Read-only browser for the built-in page and section templates. */
export default function TemplatesPage() {
  const [tab, setTab] = useState<"sections" | "pages">("sections");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SectionCategory | "all">("all");

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SECTION_TEMPLATES.filter((t) => t.isActive)
      .filter((t) => category === "all" || t.category === category)
      .filter(
        (t) =>
          !q ||
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q),
      );
  }, [query, category]);

  const pageTemplates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PAGE_TEMPLATES.filter((t) => t.isActive).filter(
      (t) =>
        !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Templates</h1>
        <p className="mt-1 text-sm text-slate-500">
          The building blocks available in the wireframe editor — browse what you can use
          on your pages.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div
          role="tablist"
          aria-label="Template type"
          className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm"
        >
          {(
            [
              { id: "sections", label: `Sections (${SECTION_TEMPLATES.length})` },
              { id: "pages", label: `Page templates (${PAGE_TEMPLATES.length})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === t.id ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-slate-900",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative min-w-52 flex-1">
          <Search
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates…"
            className="pl-9"
            aria-label="Search templates"
          />
        </div>
      </div>

      {tab === "sections" && (
        <>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
            {CATEGORY_FILTERS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  category === c
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
                )}
              >
                {c === "all" ? "All categories" : SECTION_CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>

          {sections.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No matching sections"
              description="Try a different search term or category."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery("");
                    setCategory("all");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sections.map((template) => (
                <li key={template.id}>
                  <Card className="h-full">
                    <CardBody className="flex h-full flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100">
                          <Layers className="size-4.5 text-slate-500" aria-hidden />
                        </span>
                        <Badge className="border-slate-200 bg-slate-50 text-slate-600">
                          {SECTION_CATEGORY_LABELS[template.category]}
                        </Badge>
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-slate-900">{template.name}</h2>
                        <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">
                          {template.description}
                        </p>
                      </div>
                      <p className="mt-auto pt-1 text-xs text-slate-400">
                        {template.variations.length}{" "}
                        {template.variations.length === 1 ? "variation" : "variations"}
                        {" · "}
                        {template.supportedPageTypes.length >= 10
                          ? "All page types"
                          : template.supportedPageTypes
                              .slice(0, 3)
                              .map((t) => PAGE_TYPE_LABELS[t])
                              .join(", ") +
                            (template.supportedPageTypes.length > 3
                              ? ` +${template.supportedPageTypes.length - 3}`
                              : "")}
                      </p>
                    </CardBody>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {tab === "pages" &&
        (pageTemplates.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No matching page templates"
            description="Try a different search term."
            action={
              <Button variant="outline" onClick={() => setQuery("")}>
                Clear search
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {pageTemplates.map((template) => (
              <li key={template.id}>
                <Card className="h-full">
                  <CardBody className="flex h-full flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-indigo-50">
                        <LayoutTemplate className="size-4.5 text-indigo-600" aria-hidden />
                      </span>
                      <Badge className="border-slate-200 bg-slate-50 text-slate-600">
                        {PAGE_TYPE_LABELS[template.pageType]}
                      </Badge>
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">{template.name}</h2>
                      <p className="mt-0.5 text-sm text-slate-500">{template.description}</p>
                    </div>
                    <div className="mt-auto pt-2">
                      <p className="text-xs font-medium text-slate-500">
                        {template.sections.length} sections included
                      </p>
                      <ol className="mt-1.5 flex flex-wrap gap-1">
                        {template.sections.map((section, index) => {
                          const sectionTemplate = SECTION_TEMPLATES.find(
                            (t) => t.id === section.templateId,
                          );
                          return (
                            <li
                              key={`${section.templateId}-${index}`}
                              className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600"
                            >
                              {sectionTemplate?.name ?? section.templateId}
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
