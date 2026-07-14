"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookmarkPlus, Eye, Search, SearchX, SlidersHorizontal, Star, Trash2, Wand2 } from "lucide-react";
import { PAGE_TEMPLATES } from "@/data/page-templates";
import { SECTION_TYPE_ORDER, SECTION_VARIATIONS, getVariation, variationsOfType } from "@/data/section-variations";
import { PAGE_TYPE_LABELS, SECTION_TYPE_LABELS } from "@/config/labels";
import { createSectionByVariationId, createSectionFromVariation } from "@/lib/sections";
import { withActivity } from "@/lib/project-utils";
import {
  recommendTemplates,
  hasRecommendationSignal,
  TEMPLATE_COLLECTIONS,
  matchesCollection,
  type CollectionId,
} from "@/lib/template-match";
import { useCustomTemplatesStore } from "@/stores/custom-templates-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import type { PageSection, PageTemplate, Project, SectionType, SectionVariation, VisualStyle } from "@/types";
import { DEVICE_WIDTHS } from "@/stores/editor-store";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label, Textarea } from "@/components/ui/input";
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

/**
 * The ten design directions the library is organized around. `tags` matches
 * section variations; `styles` + `templateId` match page templates.
 */
type DesignPath = {
  id: string;
  label: string;
  hint: string;
  tags: string[];
  styles: VisualStyle[];
  templateId: string;
};

const DESIGN_PATHS: DesignPath[] = [
  { id: "saas", label: "Modern SaaS", hint: "Bento grids, product-first", tags: ["saas"], styles: ["technical"], templateId: "tpl-path-saas" },
  { id: "minimal", label: "Swiss Minimal", hint: "Whitespace and hairlines", tags: ["minimal", "swiss"], styles: ["minimal"], templateId: "tpl-path-minimal" },
  { id: "editorial", label: "Editorial", hint: "Columns and drop caps", tags: ["editorial", "magazine", "blog"], styles: ["editorial"], templateId: "tpl-path-editorial" },
  { id: "bold", label: "Brutalist", hint: "Giant type, raw blocks", tags: ["bold", "brutalist"], styles: ["bold"], templateId: "tpl-path-bold" },
  { id: "animated", label: "Animated", hint: "Motion and scroll stories", tags: ["animated", "motion"], styles: [], templateId: "tpl-path-animated" },
  { id: "luxury", label: "Luxury", hint: "Lookbooks, quiet serif calm", tags: ["luxury", "premium", "elegant"], styles: ["luxury"], templateId: "tpl-path-luxury" },
  { id: "playful", label: "Playful", hint: "Stickers and bubbles", tags: ["playful"], styles: ["playful"], templateId: "tpl-path-playful" },
  { id: "corporate", label: "Corporate", hint: "Proof, stats, and trust", tags: ["corporate", "trust"], styles: ["corporate"], templateId: "tpl-path-corporate" },
  { id: "organic", label: "Organic", hint: "Arches and soft rhythm", tags: ["organic", "wellness"], styles: ["organic"], templateId: "tpl-path-organic" },
  { id: "tech", label: "Dark / Tech", hint: "Terminals and code", tags: ["technical", "dark", "developer"], styles: [], templateId: "tpl-path-tech" },
];

/** How many active plates each direction surfaces — shown on the shelf cards. */
const PATH_PLATE_COUNTS: Record<string, number> = Object.fromEntries(
  DESIGN_PATHS.map((path) => [
    path.id,
    SECTION_VARIATIONS.filter((v) => v.isActive && v.tags.some((tag) => path.tags.includes(tag))).length,
  ]),
);

// Catalog numbering: sections are numbered plates, built-in pages are sheets.
// Position in the source arrays is the stable catalog order.
const PLATE_NUMBERS = new Map(SECTION_VARIATIONS.map((v, index) => [v.id, String(index + 1).padStart(3, "0")]));
const SHEET_NUMBERS = new Map(PAGE_TEMPLATES.map((t, index) => [t.id, String(index + 1).padStart(2, "0")]));

/** Tiny abstract sketch of a design direction's layout DNA. */
function PathFingerprint({ id }: { id: string }) {
  switch (id) {
    case "saas":
      return (
        <div className="grid h-full grid-cols-3 grid-rows-2 gap-1 p-1.5" aria-hidden>
          <span className="col-span-2 row-span-2 rounded-[5px] bg-white ring-1 ring-[#c9dded]" />
          <span className="rounded-[5px] bg-[#2879a8]/20 ring-1 ring-[#c9dded]" />
          <span className="rounded-[5px] bg-white ring-1 ring-[#c9dded]" />
        </div>
      );
    case "minimal":
      return (
        <div className="relative h-full" aria-hidden>
          <span className="absolute left-2.5 top-2.5 size-1.5 bg-[#26394a]" />
          <span className="absolute bottom-3.5 left-2.5 right-8 h-px bg-[#26394a]" />
        </div>
      );
    case "editorial":
      return (
        <div className="flex h-full gap-1.5 p-2" aria-hidden>
          <span className="h-5 w-4 shrink-0 bg-[#26394a]" />
          <span className="flex flex-1 flex-col gap-[3px] pt-0.5">
            <i className="h-[2px] w-full bg-slate-400" />
            <i className="h-[2px] w-full bg-slate-400" />
            <i className="h-[2px] w-full bg-slate-400" />
            <i className="h-[2px] w-3/4 bg-slate-400" />
          </span>
          <span className="flex flex-1 flex-col gap-[3px] pt-0.5">
            <i className="h-[2px] w-full bg-slate-400" />
            <i className="h-[2px] w-full bg-slate-400" />
            <i className="h-[2px] w-2/3 bg-slate-400" />
          </span>
        </div>
      );
    case "bold":
      return (
        <div className="flex h-full items-stretch gap-1 p-1.5" aria-hidden>
          <span className="w-[62%] bg-[#26394a]" />
          <span className="flex flex-1 flex-col justify-end">
            <i className="block h-2/5 w-full bg-[#e0492c]" />
          </span>
        </div>
      );
    case "animated":
      return (
        <div className="flex h-full items-center gap-1 px-2" aria-hidden>
          <span className="h-6 flex-1 rounded-[4px] bg-white ring-1 ring-[#c9dded]" />
          <span className="h-6 flex-1 -translate-y-1 rotate-3 rounded-[4px] bg-white ring-1 ring-[#2879a8]/50" />
          <span className="h-6 flex-1 translate-y-0.5 rounded-[4px] bg-white ring-1 ring-[#c9dded]" />
        </div>
      );
    case "luxury":
      return (
        <div className="relative h-full" aria-hidden>
          <span className="absolute left-4 top-2 h-9 w-7 border border-[#26394a] bg-white" />
          <span className="absolute left-9 top-3.5 h-9 w-7 border border-[#2879a8] bg-white" />
          <span className="absolute right-3 top-1/2 h-px w-5 -translate-y-1/2 bg-[#26394a]" />
        </div>
      );
    case "playful":
      return (
        <div className="relative h-full" aria-hidden>
          <span className="absolute left-3 top-3 size-6 rounded-full bg-[#2879a8]/25" />
          <span className="absolute left-8 top-6 size-3 rounded-full bg-[#e0492c]/70" />
          <span className="absolute right-4 top-2.5 size-5 rotate-12 rounded-[4px] bg-white ring-1 ring-[#26394a]" />
          <span className="absolute bottom-2.5 left-3 right-8 border-b-2 border-dashed border-[#26394a]/40" />
        </div>
      );
    case "corporate":
      return (
        <div className="flex h-full items-end gap-1 px-3 pb-2 pt-3" aria-hidden>
          <span className="h-1/3 flex-1 bg-slate-300" />
          <span className="h-1/2 flex-1 bg-slate-300" />
          <span className="h-2/3 flex-1 bg-slate-400" />
          <span className="h-full flex-1 bg-[#26394a]" />
        </div>
      );
    case "organic":
      return (
        <div className="flex h-full items-end justify-center gap-1.5 px-3" aria-hidden>
          <span className="h-9 w-7 rounded-t-full bg-[#2879a8]/20 ring-1 ring-[#2879a8]/40" />
          <span className="h-6 w-5 rounded-t-full bg-white ring-1 ring-[#c9dded]" />
        </div>
      );
    case "tech":
      return (
        <div className="m-1.5 flex h-[calc(100%-12px)] flex-col gap-[3px] rounded-[6px] bg-[#16222e] p-2" aria-hidden>
          <i className="h-[2px] w-2/3 bg-[#5ec1f0]/80" />
          <i className="h-[2px] w-1/2 bg-white/30" />
          <i className="h-[2px] w-3/4 bg-white/30" />
          <i className="h-[2px] w-1/3 bg-[#e0492c]/80" />
        </div>
      );
    default:
      return null;
  }
}

/** Read-only browser for the built-in page and section templates. */
export default function TemplatesPage() {
  const router = useRouter();
  const projects = useProjectsStore((state) => state.projects);
  const updateProject = useProjectsStore((state) => state.updateProject);
  const user = useSessionStore((state) => state.user);
  const customTemplates = useCustomTemplatesStore((state) => state.templates);
  const hydrateCustom = useCustomTemplatesStore((state) => state.hydrate);
  const removeCustomTemplate = useCustomTemplatesStore((state) => state.removeTemplate);
  const [tab, setTab] = useState<"sections" | "pages">("sections");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SectionType | "all">("all");
  const [previewVariation, setPreviewVariation] = useState<SectionVariation | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<PageTemplate | null>(null);
  const [applyTemplate, setApplyTemplate] = useState<PageTemplate | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [, setRecentIds] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [styleFilter, setStyleFilter] = useState("all");
  const [goalFilter, setGoalFilter] = useState("all");
  const [collection, setCollection] = useState<CollectionId | null>(null);
  const [recProjectId, setRecProjectId] = useState("");
  const [pathId, setPathId] = useState<string | null>(null);
  const activePath = DESIGN_PATHS.find((p) => p.id === pathId) ?? null;

  useEffect(() => {
    hydrateCustom();
    try {
      setFavorites(JSON.parse(localStorage.getItem("wb-template-favorites") ?? "[]"));
      setRecentIds(JSON.parse(localStorage.getItem("wb-template-recent") ?? "[]"));
    } catch { /* use defaults */ }
  }, [hydrateCustom]);

  // Every page template available to browse: the user's saved ones first.
  const allPageTemplates = useMemo(
    () => [...customTemplates, ...PAGE_TEMPLATES],
    [customTemplates],
  );

  // Recommendations run against a chosen project's questionnaire. Default to the
  // most recent non-archived project that actually has some signal to match on.
  const candidateProjects = useMemo(
    () => projects.filter((p) => p.status !== "archived"),
    [projects],
  );
  const recProject = useMemo<Project | undefined>(() => {
    if (recProjectId) return candidateProjects.find((p) => p.id === recProjectId);
    return (
      candidateProjects.find((p) => hasRecommendationSignal(p.questionnaire)) ??
      candidateProjects[0]
    );
  }, [candidateProjects, recProjectId]);

  const recommendations = useMemo(() => {
    if (!recProject || !hasRecommendationSignal(recProject.questionnaire)) return [];
    return recommendTemplates(allPageTemplates, recProject.questionnaire, 3);
  }, [recProject, allPageTemplates]);
  const recommendedIds = useMemo(
    () => new Set(recommendations.map((match) => match.template.id)),
    [recommendations],
  );

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [id, ...current];
      localStorage.setItem("wb-template-favorites", JSON.stringify(next));
      return next;
    });
  };

  const remember = (id: string) => {
    setRecentIds((current) => {
      const next = [id, ...current.filter((item) => item !== id)].slice(0, 8);
      localStorage.setItem("wb-template-recent", JSON.stringify(next));
      return next;
    });
  };

  const openVariation = (variation: SectionVariation) => {
    remember(variation.id);
    setPreviewVariation(variation);
  };
  const openTemplate = (template: PageTemplate) => {
    remember(template.id);
    setPreviewTemplate(template);
  };

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SECTION_VARIATIONS.filter((t) => t.isActive)
      .filter((t) => category === "all" || t.sectionType === category)
      .filter((t) => !favoritesOnly || favorites.includes(t.id))
      .filter((t) => !activePath || t.tags.some((tag) => activePath.tags.includes(tag)))
      .filter(
        (t) =>
          !q ||
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q),
      );
  }, [query, category, favoritesOnly, favorites, activePath]);

  const pageTemplates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allPageTemplates.filter((t) => t.isActive).filter(
      (t) =>
        (!favoritesOnly || favorites.includes(t.id)) &&
        (styleFilter === "all" || t.styles.includes(styleFilter as typeof t.styles[number])) &&
        (goalFilter === "all" || t.goals.includes(goalFilter as typeof t.goals[number])) &&
        (!collection || matchesCollection(t, collection)) &&
        (!activePath || t.id === activePath.templateId || activePath.styles.some((style) => t.styles.includes(style))) &&
        (!q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)),
    );
  }, [allPageTemplates, query, favoritesOnly, favorites, styleFilter, goalFilter, collection, activePath]);

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[var(--info)] uppercase">
            Pattern library · {SECTION_VARIATIONS.length} plates · {allPageTemplates.length} sheets
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Every page starts as a pattern.
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            Section designs are numbered plates; assembled pages are sheets. Browse by design
            direction, preview anything, then use it in a blueprint.
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-9" onClick={() => setSaveOpen(true)} disabled={projects.length === 0}>
          <BookmarkPlus className="size-3.5" aria-hidden /> Save a page as template
        </Button>
      </header>

      <section aria-label="Browse by design direction">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)] uppercase">Browse by design direction</p>
          {activePath && (
            <button type="button" onClick={() => setPathId(null)} className="text-xs font-medium text-[var(--focus-ring)] hover:underline">
              Clear · showing {activePath.label}
            </button>
          )}
        </div>
        <div className="mt-2.5 flex gap-2.5 overflow-x-auto pb-1.5" role="group" aria-label="Design directions">
          {DESIGN_PATHS.map((p) => {
            const active = pathId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={active}
                title={p.hint}
                onClick={() => setPathId(active ? null : p.id)}
                className={cn(
                  "group w-[128px] shrink-0 cursor-pointer rounded-[14px] border bg-white p-1.5 text-left transition-[border-color,box-shadow,transform] hover:-translate-y-0.5",
                  active
                    ? "border-[#e0492c] shadow-[0_10px_22px_rgb(224_73_44/0.14)]"
                    : "border-[var(--border-default)] shadow-[var(--shadow-subtle)] hover:border-[var(--border-strong)]",
                )}
              >
                <div className="relative h-14 overflow-hidden rounded-[9px] border border-[#dbe9f4] bg-[#eef6fd] bg-[linear-gradient(#dcebf7_1px,transparent_1px),linear-gradient(90deg,#dcebf7_1px,transparent_1px)] bg-[size:12px_12px]">
                  <PathFingerprint id={p.id} />
                  {active && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#e0492c] ring-2 ring-white" />}
                </div>
                <p className="mt-1.5 truncate px-1 text-xs font-semibold text-[var(--text-primary)]">{p.label}</p>
                <p className="truncate px-1 pb-0.5 font-mono text-[9px] tracking-[0.08em] text-[var(--text-muted)] uppercase">
                  {PATH_PLATE_COUNTS[p.id]} plates
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <div
          role="tablist"
          aria-label="Template type"
          className="inline-flex rounded-xl border border-[var(--border-default)] bg-white p-1 shadow-[var(--shadow-subtle)]"
        >
          {(
            [
              { id: "sections", label: `Section plates (${SECTION_VARIATIONS.length})` },
              { id: "pages", label: `Page sheets (${allPageTemplates.length})` },
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
        <button type="button" onClick={() => setFavoritesOnly((value) => !value)} className={cn("inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold", favoritesOnly ? "border-amber-300 bg-amber-50 text-amber-700" : "border-[var(--border-default)] bg-white text-[var(--text-secondary)]")}>
          <Star className="size-3.5" fill={favoritesOnly ? "currentColor" : "none"} aria-hidden /> Favorites
        </button>
      </div>

      {tab === "pages" && recProject && recommendations.length > 0 && (
        <section className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[14px] border border-[#d7e5f0] bg-[#f3f9fd] px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.14em] text-[var(--info)] uppercase">
            <Wand2 className="size-3" aria-hidden /> Recommended for
          </span>
          {candidateProjects.length > 1 ? (
            <select
              value={recProject.id}
              onChange={(event) => setRecProjectId(event.target.value)}
              aria-label="Recommend for project"
              className="h-7 max-w-44 rounded-md border border-[#c9dded] bg-white px-2 text-[11px] font-semibold text-[var(--text-primary)]"
            >
              {candidateProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          ) : (
            <span className="text-xs font-semibold text-[var(--text-primary)]">{recProject.name}</span>
          )}
          <span className="hidden h-4 w-px bg-[#c9dded] sm:block" aria-hidden />
          <div className="flex flex-wrap items-center gap-1.5">
            {recommendations.map((match) => (
              <button
                key={match.template.id}
                type="button"
                onClick={() => openTemplate(match.template)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#c9dded] bg-white px-3 py-1 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--info)]"
              >
                {match.template.name}
                <span className="font-mono text-[10px] font-bold text-[var(--info)]">{Math.round(match.score * 100)}%</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {tab === "pages" && (
        <div className="flex flex-wrap items-center gap-2 rounded-[14px] border border-[var(--border-default)] bg-white px-4 py-3">
          <span className="mr-1 font-mono text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)] uppercase">Curated collections</span>
          {TEMPLATE_COLLECTIONS.map((item) => {
            const active = collection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setCollection(active ? null : item.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                    : "border-[var(--border-default)] bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]",
                )}
              >
                {item.label}
              </button>
            );
          })}
          {collection && (
            <button type="button" onClick={() => setCollection(null)} className="text-xs font-medium text-[var(--focus-ring)] hover:underline">
              Clear
            </button>
          )}
        </div>
      )}

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
          <div className="flex items-end justify-between gap-3"><div><p className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)] uppercase">Plates{activePath ? ` · ${activePath.label}` : ""}</p><h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-[var(--text-primary)]">Choose the building block</h2></div><span className="font-mono text-[11px] text-[var(--text-muted)]">{sections.length} of {SECTION_VARIATIONS.length}</span></div>

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
                    setPathId(null);
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
                    <div role="button" tabIndex={0} onClick={() => openVariation(template)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") openVariation(template); }} className="block w-full cursor-pointer text-left">
                      <ActualSectionVisual variation={template} />
                    </div>
                    <CardBody className="flex h-full flex-col gap-3 p-5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)] uppercase">
                          Plate {PLATE_NUMBERS.get(template.id) ?? "—"}
                        </span>
                        <div className="flex items-center gap-2"><Badge className="border-slate-200 bg-slate-50 text-slate-600">{SECTION_TYPE_LABELS[template.sectionType]}</Badge><button type="button" onClick={() => toggleFavorite(template.id)} aria-label={favorites.includes(template.id) ? "Remove favorite" : "Add favorite"} className="rounded-md p-1 text-amber-500 hover:bg-amber-50"><Star className="size-4" fill={favorites.includes(template.id) ? "currentColor" : "none"} aria-hidden /></button></div>
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
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => openVariation(template)}>
                          <Eye className="size-3.5" aria-hidden /> Preview
                        </Button>
                        <Button size="sm" className="flex-1" onClick={() => openVariation(template)}>
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
        (<>
          <div className="flex flex-wrap gap-2">
            <select value={styleFilter} onChange={(event) => setStyleFilter(event.target.value)} className="h-9 rounded-lg border border-[var(--border-default)] bg-white px-3 text-xs font-medium text-[var(--text-secondary)]"><option value="all">All styles</option>{[...new Set(PAGE_TEMPLATES.flatMap((template) => template.styles))].map((style) => <option key={style} value={style}>{style}</option>)}</select>
            <select value={goalFilter} onChange={(event) => setGoalFilter(event.target.value)} className="h-9 rounded-lg border border-[var(--border-default)] bg-white px-3 text-xs font-medium text-[var(--text-secondary)]"><option value="all">All goals</option>{[...new Set(PAGE_TEMPLATES.flatMap((template) => template.goals))].map((goal) => <option key={goal} value={goal}>{goal.replaceAll("-", " ")}</option>)}</select>
          </div>
        {pageTemplates.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No matching page templates"
            description="Try a different search term."
            action={
              <Button variant="outline" onClick={() => { setQuery(""); setPathId(null); setCollection(null); setStyleFilter("all"); setGoalFilter("all"); }}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
          <div className="flex items-end justify-between gap-3"><div><p className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)] uppercase">Sheets{activePath ? ` · ${activePath.label}` : ""}</p><h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-[var(--text-primary)]">Start with a complete direction</h2></div><span className="font-mono text-[11px] text-[var(--text-muted)]">{pageTemplates.length} of {allPageTemplates.length}</span></div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {pageTemplates.map((template, templateIndex) => (
              <li key={template.id}>
                  <Card className="group h-full overflow-hidden transition-[transform,box-shadow,border-color] hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-panel)]">
                  <div role="button" tabIndex={0} onClick={() => openTemplate(template)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") openTemplate(template); }} className="block w-full cursor-pointer text-left">
                    <ActualPageVisual template={template} />
                  </div>
                  <CardBody className="flex h-full flex-col gap-3 p-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)] uppercase">
                        {template.isCustom ? "Your sheet" : `Sheet ${SHEET_NUMBERS.get(template.id) ?? "—"}`}
                      </span>
                      <div className="flex items-center gap-2">{recommendedIds.has(template.id) && <Badge className="bg-[#fdece7] font-mono text-[10px] tracking-[0.08em] text-[#b03a20] uppercase">Recommended</Badge>}<Badge className="border-slate-200 bg-slate-50 text-slate-600">{PAGE_TYPE_LABELS[template.pageType]}</Badge>{template.isCustom ? <Badge className="bg-[#e0f0ff] text-[var(--info-text)]">Yours</Badge> : templateIndex === 0 && <Badge className="bg-[#fff4da] text-[#93651e]">Popular</Badge>}<button type="button" onClick={() => toggleFavorite(template.id)} aria-label={favorites.includes(template.id) ? "Remove favorite" : "Add favorite"} className="rounded-md p-1 text-amber-500 hover:bg-amber-50"><Star className="size-4" fill={favorites.includes(template.id) ? "currentColor" : "none"} aria-hidden /></button></div>
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
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openTemplate(template)}>
                        <Eye className="size-3.5" aria-hidden /> Preview full page
                      </Button>
                      {template.isCustom && (
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label={`Delete ${template.name}`}
                          onClick={() => {
                            removeCustomTemplate(template.id);
                            toast("Template deleted", "info");
                          }}
                        >
                          <Trash2 className="size-3.5 text-rose-500" aria-hidden />
                        </Button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
          </>
        )}
        </>
      )}
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
        <PageTemplatePreview
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onUse={() => {
            setPreviewTemplate(null);
            if (projects.length > 0) setApplyTemplate(previewTemplate);
            else router.push(`/projects/new?template=${encodeURIComponent(previewTemplate.id)}`);
          }}
        />
      )}
      {applyTemplate && (
        <ApplyTemplateDialog
          template={applyTemplate}
          projects={projects.filter((project) => project.status !== "archived")}
          onClose={() => setApplyTemplate(null)}
          onApply={(projectId, pageId, mode) => {
            updateProject(projectId, (project) => {
              const page = project.pages.find((item) => item.id === pageId);
              const templateSections = buildTemplateSections(applyTemplate);
              return withActivity(
                {
                  ...project,
                  pages: project.pages.map((item) => {
                    if (item.id !== pageId) return item;
                    // Append keeps existing sections and continues their order;
                    // replace swaps the page's structure entirely.
                    const sections =
                      mode === "append"
                        ? [
                            ...item.sections,
                            ...templateSections.map((section, index) => ({
                              ...section,
                              order: item.sections.length + index,
                            })),
                          ]
                        : templateSections;
                    return { ...item, sections, updatedAt: new Date().toISOString() };
                  }),
                },
                "page-updated",
                `${mode === "append" ? "Added" : "Applied"} ${applyTemplate.name} ${mode === "append" ? "to" : "to"} ${page?.name ?? "page"}`,
                user,
              );
            }, { immediate: true });
            toast(mode === "append" ? "Template sections added" : "Template applied to project", "success");
            setApplyTemplate(null);
          }}
        />
      )}
      {saveOpen && (
        <SaveTemplateDialog
          projects={projects.filter((project) => project.status !== "archived")}
          onClose={() => setSaveOpen(false)}
          onSaved={() => {
            setSaveOpen(false);
            setTab("pages");
          }}
        />
      )}
    </div>
  );
}

function buildTemplateSections(template: PageTemplate): PageSection[] {
  return template.sections.flatMap((entry, index) => {
    const section = createSectionByVariationId(entry.variationId, { contentOverrides: entry.contentOverrides, order: index });
    return section ? [{ ...section, layout: { ...section.layout, ...entry.layoutOverrides }, style: { ...section.style, ...entry.styleOverrides } }] : [];
  });
}

function ApplyTemplateDialog({
  template,
  projects,
  onClose,
  onApply,
}: {
  template: PageTemplate;
  projects: import("@/types").Project[];
  onClose: () => void;
  onApply: (projectId: string, pageId: string, mode: "replace" | "append") => void;
}) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const project = projects.find((item) => item.id === projectId) ?? projects[0];
  const [pageId, setPageId] = useState(project?.pages.find((page) => page.isHomepage)?.id ?? project?.pages[0]?.id ?? "");
  const [mode, setMode] = useState<"replace" | "append">("append");
  useEffect(() => {
    setPageId(project?.pages.find((page) => page.isHomepage)?.id ?? project?.pages[0]?.id ?? "");
  }, [projectId, project]);
  const targetPage = project?.pages.find((page) => page.id === pageId);
  const existingCount = targetPage?.sections.length ?? 0;
  return (
    <Dialog open onClose={onClose} title={`Use ${template.name}`} description="Choose a project and page, then decide how to apply it." size="md" footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={!project || !pageId} onClick={() => onApply(project.id, pageId, mode)}>{mode === "append" ? "Add sections" : "Replace page"} <ArrowRight className="size-3.5" aria-hidden /></Button></>}>
      <div className="space-y-4">
        <label className="block text-sm font-medium text-[var(--text-primary)]">Project<select value={project?.id ?? ""} onChange={(event) => setProjectId(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[var(--border-default)] bg-white px-3 text-sm"><option value="" disabled>Select a project</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="block text-sm font-medium text-[var(--text-primary)]">Page<select value={pageId} onChange={(event) => setPageId(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[var(--border-default)] bg-white px-3 text-sm">{project?.pages.map((page) => <option key={page.id} value={page.id}>{page.name}{page.isHomepage ? " · Homepage" : ""}</option>)}</select></label>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-[var(--text-primary)]">How should it apply?</legend>
          {([
            { value: "append", title: "Add to the end", body: existingCount > 0 ? `Keep the ${existingCount} existing section${existingCount === 1 ? "" : "s"} and append this template's sections.` : "Add this template's sections to the page." },
            { value: "replace", title: "Replace everything", body: existingCount > 0 ? `Remove the ${existingCount} existing section${existingCount === 1 ? "" : "s"} and start fresh from this template.` : "Use this template as the page's structure." },
          ] as const).map((option) => {
            const selected = mode === option.value;
            return (
              <label key={option.value} className={cn("flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors", selected ? "border-[var(--focus-ring)] bg-[var(--info-soft)]/60" : "border-[var(--border-default)] hover:bg-[var(--surface-secondary)]")}>
                <input type="radio" name="apply-mode" value={option.value} checked={selected} onChange={() => setMode(option.value)} className="mt-0.5" />
                <span>
                  <span className="block text-sm font-medium text-[var(--text-primary)]">{option.title}</span>
                  <span className="mt-0.5 block text-xs text-[var(--text-secondary)]">{option.body}</span>
                </span>
              </label>
            );
          })}
        </fieldset>
        {mode === "replace" && existingCount > 0 && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">This removes the current sections on “{targetPage?.name}”. The change is recorded in project activity and can be undone in the editor.</p>
        )}
      </div>
    </Dialog>
  );
}

function SaveTemplateDialog({
  projects,
  onClose,
  onSaved,
}: {
  projects: Project[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const addTemplate = useCustomTemplatesStore((s) => s.addTemplate);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const project = projects.find((item) => item.id === projectId) ?? projects[0];
  const [pageId, setPageId] = useState(
    project?.pages.find((page) => page.isHomepage)?.id ?? project?.pages[0]?.id ?? "",
  );
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  useEffect(() => {
    setPageId(project?.pages.find((page) => page.isHomepage)?.id ?? project?.pages[0]?.id ?? "");
  }, [projectId, project]);
  const page = project?.pages.find((item) => item.id === pageId);
  const sectionCount = page?.sections.length ?? 0;
  const canSave = Boolean(project && page && sectionCount > 0);

  const save = () => {
    if (!project || !page || sectionCount === 0) return;
    addTemplate({
      name: name.trim() || `${project.name} — ${page.name}`,
      description: description.trim() || `Saved from ${project.name}.`,
      pageType: page.type,
      industries: project.questionnaire.industry ? [project.questionnaire.industry] : [],
      goals: project.questionnaire.goals,
      styles: project.questionnaire.visualStyles,
      sections: page.sections,
    });
    toast("Saved to your templates", "success", "Find it under Page templates.");
    onSaved();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Save a page as a template"
      description="Freeze a page you've built into a reusable template — its section structure and content become a fresh starting point."
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!canSave} onClick={save}>
            <BookmarkPlus className="size-3.5" aria-hidden /> Save template
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block text-sm font-medium text-[var(--text-primary)]">Project<select value={project?.id ?? ""} onChange={(event) => setProjectId(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[var(--border-default)] bg-white px-3 text-sm"><option value="" disabled>Select a project</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="block text-sm font-medium text-[var(--text-primary)]">Page<select value={pageId} onChange={(event) => setPageId(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[var(--border-default)] bg-white px-3 text-sm">{project?.pages.map((page) => <option key={page.id} value={page.id}>{page.name}{page.isHomepage ? " · Homepage" : ""} · {page.sections.length} sections</option>)}</select></label>
        <div>
          <Label htmlFor="save-template-name">Template name</Label>
          <Input id="save-template-name" value={name} onChange={(event) => setName(event.target.value)} placeholder={project && page ? `${project.name} — ${page.name}` : "Template name"} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="save-template-desc">Description</Label>
          <Textarea id="save-template-desc" value={description} onChange={(event) => setDescription(event.target.value)} rows={2} placeholder="What is this template good for?" className="mt-1.5" />
        </div>
        {canSave ? (
          <p className="text-xs text-[var(--text-secondary)]">Captures <span className="font-semibold text-[var(--text-primary)]">{sectionCount}</span> section{sectionCount === 1 ? "" : "s"}, plus their content, from “{page?.name}”.</p>
        ) : (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">This page has no sections yet — add some in the editor before saving it as a template.</p>
        )}
      </div>
    </Dialog>
  );
}

function PageTemplatePreview({
  template,
  onClose,
  onUse,
}: {
  template: PageTemplate;
  onClose: () => void;
  onUse: () => void;
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
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={onUse}>Use this template <ArrowRight className="size-3.5" aria-hidden /></Button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="max-h-[68vh] overflow-y-auto rounded-[14px] border border-[#dce6ee] bg-[#eef4f8] p-3 sm:p-5">
          <WireProvider value={{ styled: false, theme: TEMPLATE_THEME, device: "desktop", sectionIsDark: false }}>
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

function PreviewFrame({ children, height = 180, scale = 0.31 }: { children: React.ReactNode; height?: number; scale?: number }) {
  return (
    <div className="relative overflow-hidden border-b border-[#dce6ee] bg-[#eef4f8] p-3" style={{ height }} aria-hidden>
      <div className="pointer-events-none absolute top-3 left-1/2 origin-top rounded-[10px] bg-white shadow-[0_8px_18px_rgb(38_57_74/0.08)] ring-1 ring-[#d3e0e9]" style={{ width: DEVICE_WIDTHS.desktop, transform: `translateX(-50%) scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

function ActualSectionVisual({ variation }: { variation: SectionVariation }) {
  const section = createSectionFromVariation(variation);
  return (
    <PreviewFrame>
      <WireProvider value={{ styled: false, theme: TEMPLATE_THEME, device: "desktop", sectionIsDark: false }}>
        <SectionRenderer section={section} />
      </WireProvider>
    </PreviewFrame>
  );
}

function ActualPageVisual({ template }: { template: PageTemplate }) {
  const sections = template.sections.flatMap((entry, index) => {
    const section = createSectionByVariationId(entry.variationId, { contentOverrides: entry.contentOverrides, order: index });
    return section ? [{ ...section, layout: { ...section.layout, ...entry.layoutOverrides }, style: { ...section.style, ...entry.styleOverrides } }] : [];
  });
  return (
    <PreviewFrame height={220} scale={0.19}>
      <WireProvider value={{ styled: false, theme: TEMPLATE_THEME, device: "desktop", sectionIsDark: false }}>
        <div className="overflow-hidden rounded-[10px] bg-white">
          {sections.slice(0, 5).map((section) => <SectionRenderer key={section.id} section={section} />)}
        </div>
      </WireProvider>
    </PreviewFrame>
  );
}
