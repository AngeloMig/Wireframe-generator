"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Search,
  SearchX,
  Sparkles,
  Star,
} from "lucide-react";
import { SECTION_TYPE_LABELS } from "@/config/labels";
import { getSectionTypeDefinition } from "@/data/section-schemas";
import { SECTION_TYPE_ORDER, SECTION_VARIATIONS } from "@/data/section-variations";
import {
  activeVariations,
  recentlyUsedVariationIds,
  recommendedVariations,
} from "@/lib/editor-utils";
import { useFavoritesStore } from "@/stores/favorites-store";
import type { ProjectPage, SectionType, SectionVariation, WebsiteGoal } from "@/types";
import { cn } from "@/utils/cn";
import { Input } from "@/components/ui/input";
import { LibraryItem } from "./library-item";
import { SectionThumbnail } from "./section-thumbnail";

/**
 * Left panel: the prebuilt section design library. Customers browse
 * categories first, then the design variations inside a category. Search
 * spans all categories; favorites, recommended, and recently used designs
 * surface on the category overview.
 */
export function SectionLibrary({
  page,
  goals,
  onAdd,
  onPreview,
}: {
  page: ProjectPage;
  goals: WebsiteGoal[];
  onAdd: (variation: SectionVariation) => void;
  onPreview: (variation: SectionVariation) => void;
}) {
  const [query, setQuery] = useState("");
  const [openType, setOpenType] = useState<SectionType | null>(null);
  const [pageTypeOnly, setPageTypeOnly] = useState(true);

  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const hydrateFavorites = useFavoritesStore((s) => s.hydrate);
  useEffect(() => hydrateFavorites(), [hydrateFavorites]);

  // Start from the static list (identical on server and client), then apply
  // locally-stored admin overrides after mount to avoid hydration mismatches.
  const [variations, setVariations] = useState<SectionVariation[]>(() =>
    SECTION_VARIATIONS.filter((v) => v.isActive),
  );
  useEffect(() => setVariations(activeVariations()), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return variations
      .filter((v) => !pageTypeOnly || v.supportedPageTypes.includes(page.type))
      .filter(
        (v) =>
          !q ||
          v.name.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q) ||
          v.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          SECTION_TYPE_LABELS[v.sectionType].toLowerCase().includes(q),
      );
  }, [variations, query, pageTypeOnly, page.type]);

  const isSearching = query.trim() !== "";

  const recommended = useMemo(
    () => (!isSearching && !openType ? recommendedVariations(filtered, page.type, goals, 4) : []),
    [filtered, page.type, goals, isSearching, openType],
  );

  const recentlyUsed = useMemo(() => {
    if (isSearching || openType) return [];
    const ids = recentlyUsedVariationIds(
      [...page.sections].sort((a, b) => a.order - b.order).map((s) => s.variationId),
      3,
    );
    return ids
      .map((id) => filtered.find((v) => v.id === id))
      .filter((v): v is SectionVariation => Boolean(v));
  }, [page.sections, filtered, isSearching, openType]);

  const favorites = useMemo(
    () =>
      !isSearching && !openType
        ? favoriteIds
            .map((id) => filtered.find((v) => v.id === id))
            .filter((v): v is SectionVariation => Boolean(v))
        : [],
    [favoriteIds, filtered, isSearching, openType],
  );

  const renderItem = (variation: SectionVariation, keyPrefix = "") => (
    <LibraryItem
      key={`${keyPrefix}${variation.id}`}
      variation={variation}
      isFavorite={favoriteIds.includes(variation.id)}
      onAdd={onAdd}
      onPreview={onPreview}
      onToggleFavorite={(v) => toggleFavorite(v.id)}
    />
  );

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2.5 border-b border-[var(--border-default)] bg-[#fbfcfa] p-4">
        <div>
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Add a section</h2>
          <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-secondary)]">Choose a category, then click a design to add it.</p>
        </div>
        <div className="rounded-xl border border-[#cfe3d9] bg-[var(--primary-soft)] px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--primary)]"><Sparkles className="size-3.5" aria-hidden /> Recommended for this page</p>
          <p className="mt-1 text-[11px] leading-4 text-[var(--text-secondary)]">Start with a design that fits your page type and goals.</p>
        </div>
        <div className="relative">
          <Search
            className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search section designs…"
            className="h-8 pl-8 text-xs"
            aria-label="Search section designs"
          />
        </div>
        <label className="flex items-center gap-2 text-[11px] text-slate-500">
          <input
            type="checkbox"
            checked={pageTypeOnly}
            onChange={(e) => setPageTypeOnly(e.target.checked)}
            className="size-3.5 rounded border-slate-300 accent-[var(--primary)]"
          />
          Only designs that suit this page type
        </label>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-3">
        {/* Search results across all categories */}
        {isSearching &&
          (filtered.length === 0 ? (
            <EmptyResult />
          ) : (
            SECTION_TYPE_ORDER.map((type) => {
              const group = filtered.filter((v) => v.sectionType === type);
              if (group.length === 0) return null;
              return (
                <LibraryGroup key={type} title={SECTION_TYPE_LABELS[type]}>
                  {group.map((v) => renderItem(v))}
                </LibraryGroup>
              );
            })
          ))}

        {/* Inside one category */}
        {!isSearching && openType && (
          <div>
            <button
              type="button"
              onClick={() => setOpenType(null)}
              className="mb-3 flex cursor-pointer items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)]"
            >
              <ChevronLeft className="size-3.5" aria-hidden />
              All categories
            </button>
            <h3 className="mb-1 text-sm font-semibold text-slate-900">
              {SECTION_TYPE_LABELS[openType]}
            </h3>
            <p className="mb-3 text-[11px] text-slate-500">
              {getSectionTypeDefinition(openType).description}
            </p>
            <div className="space-y-2">
              {filtered.filter((v) => v.sectionType === openType).map((v) => renderItem(v))}
              {filtered.filter((v) => v.sectionType === openType).length === 0 && (
                <p className="py-4 text-center text-xs text-slate-500">
                  No designs in this category suit the current page type. Untick the
                  page-type filter to see all of them.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Category overview */}
        {!isSearching && !openType && (
          <>
            {favorites.length > 0 && (
              <LibraryGroup
                title="Favorites"
                icon={<Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />}
              >
                {favorites.map((v) => renderItem(v, "fav-"))}
              </LibraryGroup>
            )}

            {recommended.length > 0 && (
              <LibraryGroup
                title="Recommended for this page"
                icon={<Sparkles className="size-3.5 text-[var(--primary)]" aria-hidden />}
              >
                {recommended.map((v) => renderItem(v, "rec-"))}
              </LibraryGroup>
            )}

            {recentlyUsed.length > 0 && (
              <LibraryGroup
                title="Recently used"
                icon={<Clock className="size-3.5 text-slate-400" aria-hidden />}
              >
                {recentlyUsed.map((v) => renderItem(v, "recent-"))}
              </LibraryGroup>
            )}

            <LibraryGroup title="Categories">
              {SECTION_TYPE_ORDER.map((type) => {
                const count = filtered.filter((v) => v.sectionType === type).length;
                const sample = variations.find((v) => v.sectionType === type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setOpenType(type)}
                    disabled={count === 0}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--border-default)] bg-white p-2.5 text-left shadow-[var(--shadow-subtle)] transition-[border-color,box-shadow] hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-card)]",
                      count === 0 && "cursor-not-allowed opacity-50",
                    )}
                  >
                    {sample && <SectionThumbnail variation={sample} />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-slate-900">
                        {SECTION_TYPE_LABELS[type]}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        {count} {count === 1 ? "design" : "designs"}
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-slate-300" aria-hidden />
                  </button>
                );
              })}
            </LibraryGroup>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyResult() {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <SearchX className="size-6 text-slate-300" aria-hidden />
      <p className="text-xs text-slate-500">
        No designs match. Try another search or untick the page-type filter.
      </p>
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
      <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-[0.08em] text-[var(--text-muted)] uppercase">
        {icon}
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
