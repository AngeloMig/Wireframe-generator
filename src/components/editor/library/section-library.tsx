"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  Clock,
  LayoutGrid,
  Plus,
  Search,
  SearchX,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { SECTION_TYPE_LABELS } from "@/config/labels";
import { getSectionTypeDefinition } from "@/data/section-schemas";
import { getVariation, SECTION_TYPE_ORDER, SECTION_VARIATIONS } from "@/data/section-variations";
import {
  activeVariations,
  recentlyUsedVariationIds,
  recommendedVariations,
} from "@/lib/editor-utils";
import { useCustomSectionsStore, type SavedSection } from "@/stores/custom-sections-store";
import { useFavoritesStore } from "@/stores/favorites-store";
import type { ProjectPage, SectionType, SectionVariation, WebsiteGoal } from "@/types";
import { cn } from "@/utils/cn";
import { Input } from "@/components/ui/input";
import { LibraryItem } from "./library-item";
import { SectionThumbnail } from "./section-thumbnail";

type Filter = "all" | "favorites" | "recommended" | "recent" | "saved" | SectionType;

/**
 * The prebuilt section design library. A left rail lets customers jump
 * straight to a category or a curated filter (favorites, recommended,
 * recently used, saved sections); the main pane shows a design grid for
 * whatever is selected. Search spans every category regardless of filter.
 */
export function SectionLibrary({
  page,
  goals,
  onAdd,
  onPreview,
  onInsertSaved,
}: {
  page: ProjectPage;
  goals: WebsiteGoal[];
  onAdd: (variation: SectionVariation) => void;
  onPreview: (variation: SectionVariation) => void;
  /** Insert a section saved to the team's pattern library. */
  onInsertSaved?: (saved: SavedSection) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [pageTypeOnly, setPageTypeOnly] = useState(true);

  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const hydrateFavorites = useFavoritesStore((s) => s.hydrate);
  useEffect(() => hydrateFavorites(), [hydrateFavorites]);

  const savedSections = useCustomSectionsStore((s) => s.sections);
  const hydrateSaved = useCustomSectionsStore((s) => s.hydrate);
  const removeSaved = useCustomSectionsStore((s) => s.removeSection);
  useEffect(() => hydrateSaved(), [hydrateSaved]);

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
    () => recommendedVariations(filtered, page.type, goals, 4),
    [filtered, page.type, goals],
  );

  const recentlyUsed = useMemo(() => {
    const ids = recentlyUsedVariationIds(
      [...page.sections].sort((a, b) => a.order - b.order).map((s) => s.variationId),
      3,
    );
    return ids
      .map((id) => filtered.find((v) => v.id === id))
      .filter((v): v is SectionVariation => Boolean(v));
  }, [page.sections, filtered]);

  const favorites = useMemo(
    () =>
      favoriteIds
        .map((id) => filtered.find((v) => v.id === id))
        .filter((v): v is SectionVariation => Boolean(v)),
    [favoriteIds, filtered],
  );

  const showSaved = Boolean(onInsertSaved) && savedSections.length > 0;
  const hasCurated = showSaved || favorites.length > 0 || recommended.length > 0 || recentlyUsed.length > 0;

  const byType = (type: SectionType) => filtered.filter((v) => v.sectionType === type);

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

  const savedSectionCard = (saved: SavedSection) => {
    const variation = getVariation(saved.variationId);
    return (
      <div
        key={saved.id}
        className="flex items-center gap-2.5 rounded-xl border border-[var(--border-default)] bg-white p-2.5 shadow-[var(--shadow-subtle)]"
      >
        {variation && <SectionThumbnail variation={variation} />}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-slate-900">{saved.name}</span>
          <span className="block text-[11px] text-slate-400">
            {SECTION_TYPE_LABELS[saved.sectionType]} · saved with content
          </span>
        </span>
        <button
          type="button"
          aria-label={`Delete ${saved.name} from your sections`}
          title="Remove from your sections"
          onClick={() => removeSaved(saved.id)}
          className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
        >
          <Trash2 className="size-3.5" aria-hidden />
        </button>
        {onInsertSaved && (
          <button
            type="button"
            aria-label={`Insert ${saved.name}`}
            onClick={() => onInsertSaved(saved)}
            className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md bg-[var(--primary-soft)] text-[var(--primary)] transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[var(--primary)] hover:text-white active:scale-90"
          >
            <Plus className="size-3.5" aria-hidden />
          </button>
        )}
      </div>
    );
  };

  const sidebarItems: { key: Filter; label: string; count: number; icon: typeof Star }[] = [
    { key: "all", label: "All designs", count: filtered.length, icon: LayoutGrid },
    ...(showSaved ? [{ key: "saved" as Filter, label: "Your sections", count: savedSections.length, icon: Bookmark }] : []),
    ...(favorites.length > 0 ? [{ key: "favorites" as Filter, label: "Favorites", count: favorites.length, icon: Star }] : []),
    ...(recommended.length > 0 ? [{ key: "recommended" as Filter, label: "Recommended", count: recommended.length, icon: Sparkles }] : []),
    ...(recentlyUsed.length > 0 ? [{ key: "recent" as Filter, label: "Recently used", count: recentlyUsed.length, icon: Clock }] : []),
  ];

  return (
    <div className="flex h-full min-h-0 flex-col sm:flex-row">
      <div className="flex shrink-0 flex-col border-b border-[var(--border-default)] bg-[#fbfcfa] sm:w-52 sm:border-r sm:border-b-0">
        <nav className="flex gap-1 overflow-x-auto p-3 sm:flex-col sm:overflow-visible">
          {sidebarItems.map((item) => (
            <SidebarButton
              key={item.key}
              active={filter === item.key}
              onClick={() => setFilter(item.key)}
              icon={item.icon}
              label={item.label}
              count={item.count}
            />
          ))}
          <div className="my-1 hidden border-t border-[var(--border-default)] sm:block" />
          {SECTION_TYPE_ORDER.map((type) => {
            const count = byType(type).length;
            return (
              <SidebarButton
                key={type}
                active={filter === type}
                disabled={count === 0}
                onClick={() => setFilter(type)}
                label={SECTION_TYPE_LABELS[type]}
                count={count}
              />
            );
          })}
        </nav>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-default)] p-3">
          <div className="relative min-w-[180px] flex-1">
            <Search
              className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search all designs…"
              className="h-8 pl-8 text-xs"
              aria-label="Search section designs"
            />
          </div>
          <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border-default)] px-2.5 py-[7px] text-[11px] font-medium whitespace-nowrap text-slate-500">
            <input
              type="checkbox"
              checked={pageTypeOnly}
              onChange={(e) => setPageTypeOnly(e.target.checked)}
              className="size-3.5 rounded border-slate-300 accent-[var(--primary)]"
            />
            Suits this page
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {isSearching ? (
            filtered.length === 0 ? (
              <EmptyResult />
            ) : (
              <div className="space-y-6">
                {SECTION_TYPE_ORDER.map((type) => {
                  const group = filtered.filter((v) => v.sectionType === type);
                  if (group.length === 0) return null;
                  return (
                    <LibraryGroup key={type} title={SECTION_TYPE_LABELS[type]}>
                      {group.map((v) => renderItem(v))}
                    </LibraryGroup>
                  );
                })}
              </div>
            )
          ) : filter === "all" ? (
            <div className="space-y-6">
              {showSaved && (
                <LibraryGroup title="Your sections" icon={<Bookmark className="size-3.5 text-[var(--info)]" aria-hidden />}>
                  {savedSections.map(savedSectionCard)}
                </LibraryGroup>
              )}
              {favorites.length > 0 && (
                <LibraryGroup title="Favorites" icon={<Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />}>
                  {favorites.map((v) => renderItem(v, "fav-"))}
                </LibraryGroup>
              )}
              {recommended.length > 0 && (
                <LibraryGroup title="Recommended for this page" icon={<Sparkles className="size-3.5 text-[var(--primary)]" aria-hidden />}>
                  {recommended.map((v) => renderItem(v, "rec-"))}
                </LibraryGroup>
              )}
              {recentlyUsed.length > 0 && (
                <LibraryGroup title="Recently used" icon={<Clock className="size-3.5 text-slate-400" aria-hidden />}>
                  {recentlyUsed.map((v) => renderItem(v, "recent-"))}
                </LibraryGroup>
              )}
              {!hasCurated &&
                (filtered.length === 0 ? (
                  <EmptyResult />
                ) : (
                  SECTION_TYPE_ORDER.map((type) => {
                    const group = byType(type);
                    if (group.length === 0) return null;
                    return (
                      <LibraryGroup key={type} title={SECTION_TYPE_LABELS[type]}>
                        {group.map((v) => renderItem(v))}
                      </LibraryGroup>
                    );
                  })
                ))}
            </div>
          ) : filter === "saved" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {savedSections.map(savedSectionCard)}
            </div>
          ) : filter === "favorites" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {favorites.map((v) => renderItem(v))}
            </div>
          ) : filter === "recommended" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {recommended.map((v) => renderItem(v))}
            </div>
          ) : filter === "recent" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {recentlyUsed.map((v) => renderItem(v))}
            </div>
          ) : (
            <div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">{SECTION_TYPE_LABELS[filter]}</h3>
              <p className="mb-3 text-[11px] text-slate-500">{getSectionTypeDefinition(filter).description}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {byType(filter).map((v) => renderItem(v))}
              </div>
              {byType(filter).length === 0 && (
                <p className="py-4 text-center text-xs text-slate-500">
                  No designs in this category suit the current page type. Untick &ldquo;Suits this
                  page&rdquo; to see all of them.
                </p>
              )}
            </div>
          )}
        </div>
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
    </section>
  );
}

function SidebarButton({
  active,
  disabled,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon?: typeof Star;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "flex shrink-0 cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] font-medium whitespace-nowrap transition-colors duration-150 sm:w-full sm:whitespace-normal",
        active ? "bg-[var(--primary)] text-white" : "text-slate-600 hover:bg-black/[0.05]",
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
      )}
    >
      {Icon && <Icon className={cn("size-3.5 shrink-0", active ? "text-white" : "text-slate-400")} aria-hidden />}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span
        className={cn(
          "shrink-0 rounded-full px-1.5 py-px text-[10px] tabular-nums",
          active ? "bg-white/20 text-white" : "bg-black/[0.05] text-slate-400",
        )}
      >
        {count}
      </span>
    </button>
  );
}
