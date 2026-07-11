"use client";

import { useMemo, useState } from "react";
import { Layers, LayoutTemplate, Search, SearchX, SlidersHorizontal, Sparkles } from "lucide-react";
import { PAGE_TEMPLATES } from "@/data/page-templates";
import { SECTION_TYPE_ORDER, SECTION_VARIATIONS, getVariation } from "@/data/section-variations";
import { PAGE_TYPE_LABELS, SECTION_TYPE_LABELS } from "@/config/labels";
import type { SectionType } from "@/types";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";

const CATEGORY_FILTERS: (SectionType | "all")[] = ["all", ...SECTION_TYPE_ORDER];

/** Read-only browser for the built-in page and section templates. */
export default function TemplatesPage() {
  const [tab, setTab] = useState<"sections" | "pages">("sections");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SectionType | "all">("all");

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SECTION_VARIATIONS.filter((t) => t.isActive)
      .filter((t) => category === "all" || t.sectionType === category)
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
    <div className="space-y-7">
      <div className="overflow-hidden rounded-[1.5rem] border border-[var(--border-default)] bg-[#173f36] px-6 py-7 text-white shadow-[var(--shadow-card)] sm:px-8">
        <div className="flex max-w-2xl items-start gap-4">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10"><Sparkles className="size-5 text-[#f3b96c]" aria-hidden /></span>
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.03em] sm:text-3xl">Find a confident starting point</h1>
            <p className="mt-2 text-sm leading-6 text-emerald-50/75">Explore complete page structures or individual section designs. Everything can be changed after you add it.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div
          role="tablist"
          aria-label="Template type"
          className="inline-flex rounded-xl border border-[var(--border-default)] bg-white p-1 shadow-[var(--shadow-subtle)]"
        >
          {(
            [
              { id: "sections", label: `Section designs (${SECTION_VARIATIONS.length})` },
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
                "cursor-pointer rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
                tab === t.id ? "bg-[var(--primary)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]",
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
          <div className="flex items-center gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by category">
            <span className="flex shrink-0 items-center gap-1.5 pr-1 text-xs font-semibold text-[var(--text-secondary)]"><SlidersHorizontal className="size-3.5" aria-hidden /> Filter</span>
            {CATEGORY_FILTERS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={cn(
                  "shrink-0 cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                  category === c
                    ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                    : "border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]",
                )}
              >
                {c === "all" ? "All categories" : SECTION_TYPE_LABELS[c]}
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
                  <Card className="group h-full overflow-hidden transition-[transform,box-shadow,border-color] hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-panel)]">
                    <TemplateVisual kind={template.sectionType} />
                    <CardBody className="flex h-full flex-col gap-3 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--primary-soft)]">
                          <Layers className="size-4.5 text-[var(--primary)]" aria-hidden />
                        </span>
                        <Badge className="border-slate-200 bg-slate-50 text-slate-600">
                          {SECTION_TYPE_LABELS[template.sectionType]}
                        </Badge>
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-slate-900">{template.name}</h2>
                        <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">
                          {template.description}
                        </p>
                      </div>
                      <p className="mt-auto pt-1 text-xs text-slate-400">
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
                  <Card className="group h-full overflow-hidden transition-[transform,box-shadow,border-color] hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-panel)]">
                  <TemplateVisual kind="page" />
                  <CardBody className="flex h-full flex-col gap-3 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--primary-soft)]">
                        <LayoutTemplate className="size-4.5 text-[var(--primary)]" aria-hidden />
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
                        {template.sections.map((section, index) => (
                          <li
                            key={`${section.variationId}-${index}`}
                            className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600"
                          >
                            {getVariation(section.variationId)?.name ?? section.variationId}
                          </li>
                        ))}
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

function TemplateVisual({ kind }: { kind: SectionType | "page" }) {
  const isPage = kind === "page";
  return (
    <div className="relative h-36 overflow-hidden border-b border-[var(--border-default)] bg-[#eef1ec] p-4" aria-hidden>
      <div className="h-full rounded-lg border border-[#d3dad5] bg-white p-3 shadow-[0_5px_15px_rgb(23_32_29/0.06)] transition-transform duration-300 group-hover:scale-[1.015]">
        <div className="mb-3 flex items-center justify-between">
          <div className="h-1.5 w-10 rounded-full bg-[#315f53]" />
          <div className="flex gap-1"><div className="size-1.5 rounded-full bg-[#bdc9c4]" /><div className="size-1.5 rounded-full bg-[#bdc9c4]" /><div className="size-1.5 rounded-full bg-[#bdc9c4]" /></div>
        </div>
        {isPage ? (
          <div className="space-y-2">
            <div className="grid grid-cols-[1.25fr_.75fr] gap-2"><div className="space-y-1.5 rounded bg-[#edf5f1] p-2"><div className="h-1.5 w-3/4 rounded bg-[#7da699]" /><div className="h-1 w-full rounded bg-[#cad8d2]" /><div className="h-3 w-10 rounded bg-[#e5a65f]" /></div><div className="rounded bg-[#e4e6e2]" /></div>
            <div className="grid grid-cols-3 gap-1.5"><div className="h-5 rounded bg-[#f2eee7]" /><div className="h-5 rounded bg-[#f2eee7]" /><div className="h-5 rounded bg-[#f2eee7]" /></div>
          </div>
        ) : (
          <div className="grid h-[76px] grid-cols-[1.15fr_.85fr] gap-3 rounded bg-[#f7f4ed] p-3">
            <div className="space-y-2"><div className="h-2 w-4/5 rounded bg-[#6f8f85]" /><div className="h-1.5 w-full rounded bg-[#c4cfcb]" /><div className="h-1.5 w-2/3 rounded bg-[#d4ddda]" /><div className="h-3 w-11 rounded bg-[#e5a65f]" /></div>
            <div className="rounded bg-[#dce5e1]" />
          </div>
        )}
      </div>
    </div>
  );
}
