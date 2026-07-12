"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Eye, Layers, LayoutTemplate, Search, SearchX, SlidersHorizontal, Sparkles } from "lucide-react";
import { PAGE_TEMPLATES } from "@/data/page-templates";
import { SECTION_TYPE_ORDER, SECTION_VARIATIONS, getVariation, variationsOfType } from "@/data/section-variations";
import { PAGE_TYPE_LABELS, SECTION_TYPE_LABELS } from "@/config/labels";
import { createSectionByVariationId, createSectionFromVariation } from "@/lib/sections";
import type { PageSection, PageTemplate, SectionType, SectionVariation } from "@/types";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { WireProvider } from "@/components/editor/wireframes/primitives";
import { SectionRenderer } from "@/components/editor/wireframes/section-renderer";
import { VariationPreview } from "@/components/editor/library/variation-preview";
import type { BrandTheme } from "@/lib/editor-utils";

const TEMPLATE_THEME: BrandTheme = {
  primary: "#2879a8",
  secondary: "#172b3b",
  accent: "#efb765",
  cardRadius: "rounded-xl",
  buttonRadius: "rounded-lg",
  headingFont: "font-sans",
};

const CATEGORY_FILTERS: (SectionType | "all")[] = ["all", ...SECTION_TYPE_ORDER];

/** Read-only browser for the built-in page and section templates. */
export default function TemplatesPage() {
  const [tab, setTab] = useState<"sections" | "pages">("sections");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SectionType | "all">("all");
  const [previewVariation, setPreviewVariation] = useState<SectionVariation | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<PageTemplate | null>(null);

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
      <div className="overflow-hidden rounded-[18px] border border-[#d7e5f0] bg-[#e7f3fc] px-6 py-7 text-[var(--text-primary)] shadow-[0_12px_30px_rgb(58_92_120/0.08)] sm:px-8">
        <div className="flex max-w-2xl items-start gap-4">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/75"><Sparkles className="size-5 text-[var(--info)]" aria-hidden /></span>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Find a confident starting point</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Explore complete page structures or individual section designs. Preview everything before you use it in a blueprint.</p>
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
                    <button type="button" onClick={() => setPreviewVariation(template)} className="block w-full cursor-pointer text-left">
                      <TemplateVisual kind={template.sectionType} />
                    </button>
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
                      <div className="mt-2 flex gap-2 border-t border-[var(--border-default)] pt-3">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => setPreviewVariation(template)}>
                          <Eye className="size-3.5" aria-hidden /> Preview
                        </Button>
                        <Button size="sm" className="flex-1" onClick={() => setPreviewVariation(template)}>
                          View design <ArrowRight className="size-3.5" aria-hidden />
                        </Button>
                      </div>
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
                  <button type="button" onClick={() => setPreviewTemplate(template)} className="block w-full cursor-pointer text-left">
                    <TemplateVisual kind="page" />
                  </button>
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
                    <div className="mt-1 flex gap-2 border-t border-[var(--border-default)] pt-3">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setPreviewTemplate(template)}>
                        <Eye className="size-3.5" aria-hidden /> Preview full page
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        ))}
      {previewVariation && (
        <VariationPreview
          variation={previewVariation}
          theme={TEMPLATE_THEME}
          fullscreen
          variantOptions={variationsOfType(previewVariation.sectionType).filter((item) => item.isActive)}
          onSelectVariation={setPreviewVariation}
          onClose={() => setPreviewVariation(null)}
          onAdd={() => setPreviewVariation(null)}
        />
      )}
      {previewTemplate && (
        <PageTemplatePreview template={previewTemplate} onClose={() => setPreviewTemplate(null)} />
      )}
    </div>
  );
}

function PageTemplatePreview({
  template,
  onClose,
}: {
  template: PageTemplate;
  onClose: () => void;
}) {
  const initialSections = useMemo(() => {
    return template.sections.flatMap((entry, index) => {
      const section = createSectionByVariationId(entry.variationId, {
        contentOverrides: entry.contentOverrides,
        order: index,
      });
      return section
        ? [{ ...section, layout: { ...section.layout, ...entry.layoutOverrides }, style: { ...section.style, ...entry.styleOverrides } }]
        : [];
    });
  }, [template]);
  const [sections, setSections] = useState<PageSection[]>(initialSections);

  useEffect(() => setSections(initialSections), [initialSections]);

  const swapVariation = (index: number, variationId: string) => {
    const variation = getVariation(variationId);
    if (!variation) return;
    setSections((current) => current.map((section, sectionIndex) => {
      if (sectionIndex !== index) return section;
      const next = createSectionFromVariation(variation);
      return {
        ...next,
        id: section.id,
        order: section.order,
        content: { ...next.content, ...section.content },
      };
    }));
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={template.name}
      description={`${template.description} Preview the complete wireframe and try alternative section designs.`}
      size="full"
      footer={<Button onClick={onClose}>Done</Button>}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="max-h-[68vh] overflow-y-auto rounded-[14px] border border-[#dce6ee] bg-[#eef4f8] p-3 sm:p-5">
          <WireProvider value={{ styled: false, theme: TEMPLATE_THEME, device: "desktop" }}>
            <div className="mx-auto max-w-[1080px] overflow-hidden rounded-[14px] bg-white shadow-[0_16px_35px_rgb(38_57_74/0.12)] ring-1 ring-[#d8e2e9]">
              {sections.map((section) => (
                <SectionRenderer key={section.id} section={section} />
              ))}
            </div>
          </WireProvider>
        </div>
        <aside className="rounded-[14px] border border-[var(--border-default)] bg-white p-4">
          <p className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)] uppercase">Customize preview</p>
          <p className="mt-2 text-sm leading-5 text-[var(--text-secondary)]">Try another design for any section. This only changes the preview until you choose it in a project.</p>
          <div className="mt-4 space-y-3">
            {sections.map((section, index) => {
              const variation = getVariation(section.variationId);
              const alternatives = variationsOfType(section.sectionType).filter((item) => item.isActive);
              return (
                <label key={section.id} className="block text-xs font-medium text-[var(--text-secondary)]">
                  <span className="mb-1 block truncate">{index + 1}. {variation?.name ?? section.sectionType}</span>
                  <select
                    value={section.variationId}
                    onChange={(event) => swapVariation(index, event.target.value)}
                    className="h-9 w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary)] px-2 text-xs text-[var(--text-primary)]"
                  >
                    {alternatives.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label>
              );
            })}
          </div>
        </aside>
      </div>
    </Dialog>
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
