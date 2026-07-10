"use client";

import { useMemo, useState } from "react";
import { Clock, Search, SearchX, Sparkles } from "lucide-react";
import { SECTION_CATEGORY_LABELS } from "@/config/labels";
import { activeTemplates, recentlyUsedTemplateIds, recommendedTemplates } from "@/lib/editor-utils";
import type { ProjectPage, SectionCategory, SectionTemplate, WebsiteGoal } from "@/types";
import { cn } from "@/utils/cn";
import { Input } from "@/components/ui/input";
import { LibraryItem } from "./library-item";

const CATEGORY_ORDER: SectionCategory[] = [
  "navigation",
  "hero",
  "content",
  "services",
  "ecommerce",
  "social-proof",
  "conversion",
  "footer",
];

/** Left panel: searchable, filterable section template library. */
export function SectionLibrary({
  page,
  goals,
  onAdd,
}: {
  page: ProjectPage;
  goals: WebsiteGoal[];
  onAdd: (template: SectionTemplate) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SectionCategory | "all">("all");
  const [pageTypeOnly, setPageTypeOnly] = useState(true);

  const templates = useMemo(() => activeTemplates(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates
      .filter((t) => !pageTypeOnly || t.supportedPageTypes.includes(page.type))
      .filter((t) => category === "all" || t.category === category)
      .filter(
        (t) =>
          !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
      );
  }, [templates, query, category, pageTypeOnly, page.type]);

  const isBrowsing = query.trim() === "" && category === "all";

  const recommended = useMemo(
    () => (isBrowsing ? recommendedTemplates(filtered, page.type, goals, 4) : []),
    [filtered, page.type, goals, isBrowsing],
  );

  const recentlyUsed = useMemo(() => {
    if (!isBrowsing) return [];
    const ids = recentlyUsedTemplateIds(
      [...page.sections].sort((a, b) => a.order - b.order).map((s) => s.templateId),
      3,
    );
    return ids
      .map((id) => filtered.find((t) => t.id === id))
      .filter((t): t is SectionTemplate => Boolean(t));
  }, [page.sections, filtered, isBrowsing]);

  const grouped = useMemo(
    () =>
      CATEGORY_ORDER.map((cat) => ({
        category: cat,
        templates: filtered.filter((t) => t.category === cat),
      })).filter((group) => group.templates.length > 0),
    [filtered],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2.5 border-b border-slate-200 p-3">
        <div className="relative">
          <Search
            className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sections…"
            className="h-8 pl-8 text-xs"
            aria-label="Search section templates"
          />
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by category">
          {(["all", ...CATEGORY_ORDER] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              aria-pressed={category === cat}
              className={cn(
                "cursor-pointer rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
                category === cat
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-200 bg-white text-slate-500 hover:text-slate-800",
              )}
            >
              {cat === "all" ? "All" : SECTION_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[11px] text-slate-500">
          <input
            type="checkbox"
            checked={pageTypeOnly}
            onChange={(e) => setPageTypeOnly(e.target.checked)}
            className="size-3.5 rounded border-slate-300 accent-indigo-600"
          />
          Only sections that suit this page type
        </label>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-3">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <SearchX className="size-6 text-slate-300" aria-hidden />
            <p className="text-xs text-slate-500">
              No sections match. Try another search, category, or untick the page-type
              filter.
            </p>
          </div>
        )}

        {recommended.length > 0 && (
          <LibraryGroup
            title="Recommended for this page"
            icon={<Sparkles className="size-3.5 text-indigo-500" aria-hidden />}
          >
            {recommended.map((template) => (
              <LibraryItem key={`rec-${template.id}`} template={template} onAdd={onAdd} />
            ))}
          </LibraryGroup>
        )}

        {recentlyUsed.length > 0 && (
          <LibraryGroup
            title="Recently used"
            icon={<Clock className="size-3.5 text-slate-400" aria-hidden />}
          >
            {recentlyUsed.map((template) => (
              <LibraryItem key={`recent-${template.id}`} template={template} onAdd={onAdd} />
            ))}
          </LibraryGroup>
        )}

        {grouped.map((group) => (
          <LibraryGroup key={group.category} title={SECTION_CATEGORY_LABELS[group.category]}>
            {group.templates.map((template) => (
              <LibraryItem key={template.id} template={template} onAdd={onAdd} />
            ))}
          </LibraryGroup>
        ))}
      </div>
    </div>
  );
}

function LibraryGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
        {icon}
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
