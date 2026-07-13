"use client";

import { useEffect, useMemo, useState } from "react";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  HelpCircle,
  Images,
  LayoutGrid,
  Lock,
  Megaphone,
  MessageSquareQuote,
  Navigation,
  PanelBottom,
  Plus,
  ShoppingBag,
  Sparkles,
  Text,
  type LucideIcon,
} from "lucide-react";
import { SECTION_TYPE_LABELS } from "@/config/labels";
import { getVariation } from "@/data/section-variations";
import type { PageSection, SectionType } from "@/types";
import { cn } from "@/utils/cn";
import type { CanvasSectionActions } from "./canvas/canvas-section";

/** Rail drag ids are namespaced so they never collide with canvas sortables. */
export const RAIL_DRAG_PREFIX = "rail:";

const TYPE_ICONS: Record<SectionType, LucideIcon> = {
  navigation: Navigation,
  hero: Sparkles,
  faq: HelpCircle,
  marquee: Megaphone,
  testimonials: MessageSquareQuote,
  services: LayoutGrid,
  cta: Images,
  footer: PanelBottom,
  content: Text,
  ecommerce: ShoppingBag,
};

/**
 * Shopify-theme-editor-style left rail: the page's structure as a grouped
 * list (Header / Template / Footer). Click selects + scrolls the canvas;
 * Template rows drag to reorder; hover reveals move and hide controls.
 */
export function StructurePanel({
  sections,
  selectedId,
  actions,
  readOnly,
  onAddSection,
  attentionIds,
}: {
  sections: PageSection[];
  selectedId: string | null;
  actions: CanvasSectionActions;
  readOnly: boolean;
  onAddSection: () => void;
  /** Sections with open feedback/tasks/content flags — shown as amber dots. */
  attentionIds?: Set<string>;
}) {
  const ordered = useMemo(
    () => [...sections].sort((a, b) => a.order - b.order),
    [sections],
  );

  const groups = useMemo(() => {
    const header = ordered.filter((s) => s.sectionType === "navigation");
    const footer = ordered.filter((s) => s.sectionType === "footer");
    const template = ordered.filter(
      (s) => s.sectionType !== "navigation" && s.sectionType !== "footer",
    );
    return [
      { label: "Header", items: header, addable: false, sortable: false },
      { label: "Template", items: template, addable: true, sortable: true },
      { label: "Footer", items: footer, addable: false, sortable: false },
    ];
  }, [ordered]);

  // Scroll-sync: softly mark the rail row for the section nearest the middle
  // of the viewport as the canvas scrolls.
  const [inViewId, setInViewId] = useState<string | null>(null);
  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>("[data-canvas-section]"),
    );
    if (els.length === 0) return;
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.canvasSection;
          if (!id) continue;
          if (entry.isIntersecting) {
            const rect = entry.boundingClientRect;
            visible.set(id, Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2));
          } else {
            visible.delete(id);
          }
        }
        let best: string | null = null;
        let bestDistance = Infinity;
        for (const [id, distance] of visible) {
          if (distance < bestDistance) {
            bestDistance = distance;
            best = id;
          }
        }
        setInViewId(best);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ordered]);

  return (
    <nav aria-label="Page structure" className="flex h-full flex-col overflow-y-auto pb-4">
      {groups.map((group) => {
        const rows = group.items.map((section, index) => (
          <StructureRow
            key={section.id}
            section={section}
            index={index}
            count={group.items.length}
            isSelected={section.id === selectedId}
            isInView={section.id === inViewId}
            needsAttention={attentionIds?.has(section.id) ?? false}
            readOnly={readOnly}
            sortable={group.sortable && !readOnly}
            actions={actions}
          />
        ));
        return (
          <div key={group.label} className="px-2 pb-3">
            <p className="px-3 pb-2 text-[10px] font-bold tracking-[0.12em] text-[var(--text-muted)] uppercase">
              {group.label}
            </p>
            {group.items.length === 0 && !group.addable && (
              <p className="px-2 py-1 text-xs text-slate-400">
                No {group.label.toLowerCase()} yet
              </p>
            )}
            {group.sortable && !readOnly ? (
              <SortableContext
                items={group.items.map((s) => `${RAIL_DRAG_PREFIX}${s.id}`)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-0.5">{rows}</ul>
              </SortableContext>
            ) : (
              <ul className="space-y-0.5">{rows}</ul>
            )}
            {group.addable && !readOnly && (
              <button
                type="button"
                onClick={onAddSection}
                className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]"
              >
                <Plus className="size-4" aria-hidden />
                Add section
              </button>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function StructureRow({
  section,
  index,
  count,
  isSelected,
  isInView,
  needsAttention,
  readOnly,
  sortable,
  actions,
}: {
  section: PageSection;
  index: number;
  count: number;
  isSelected: boolean;
  isInView: boolean;
  needsAttention: boolean;
  readOnly: boolean;
  sortable: boolean;
  actions: CanvasSectionActions;
}) {
  const locked = Boolean(section.approvalLocked || section.isLocked);
  const canDrag = sortable && !locked;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${RAIL_DRAG_PREFIX}${section.id}`,
    data: { type: "rail-section" },
    disabled: !canDrag,
  });

  const variation = getVariation(section.variationId);
  const Icon = TYPE_ICONS[section.sectionType] ?? LayoutGrid;

  const select = () => {
    actions.onSelect(section.id);
    document
      .querySelector(`[data-canvas-section="${section.id}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("group/row relative", isDragging && "z-10 opacity-60")}
      // Drag props only on rows that actually sort — dnd-kit would otherwise
      // mark Header/Footer rows aria-disabled and break their click targets.
      {...(canDrag ? attributes : {})}
      {...(canDrag ? listeners : {})}
    >
      <button
        type="button"
        onClick={select}
        aria-current={isSelected ? "true" : undefined}
        className={cn(
          "flex w-full cursor-pointer items-center gap-2 rounded-lg py-1.5 pr-1 pl-2 text-left text-[13px] transition-colors",
          isSelected
            ? "bg-[#f7d34e]/30 font-medium text-[#5c4600]"
            : cn("text-slate-700 hover:bg-black/[0.05]", isInView && "bg-black/[0.05]"),
          section.isHidden && "opacity-50",
        )}
      >
        <Icon
          className={cn("size-4 shrink-0", isSelected ? "text-[#a07800]" : "text-slate-400")}
          strokeWidth={1.75}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate">
          {variation?.name ?? SECTION_TYPE_LABELS[section.sectionType]}
        </span>
        {needsAttention && (
          <span
            className="size-1.5 shrink-0 rounded-full bg-amber-500"
            role="img"
            aria-label="Needs your input"
            title="Needs your input"
          />
        )}
        {locked && <Lock className="size-3 shrink-0 text-slate-400" aria-label="Locked" />}
        {section.isHidden && (
          <EyeOff className="size-3.5 shrink-0 text-slate-400" aria-label="Hidden" />
        )}
      </button>
      {!readOnly && !locked && (
        <span className="absolute top-1/2 right-1 hidden -translate-y-1/2 items-center gap-0 rounded-md bg-white shadow-[var(--shadow-subtle)] ring-1 ring-slate-200 group-focus-within/row:flex group-hover/row:flex">
          <RowAction
            label="Move up"
            disabled={index === 0}
            onClick={() => actions.onMoveUp(section.id)}
          >
            <ChevronUp className="size-3.5" aria-hidden />
          </RowAction>
          <RowAction
            label="Move down"
            disabled={index === count - 1}
            onClick={() => actions.onMoveDown(section.id)}
          >
            <ChevronDown className="size-3.5" aria-hidden />
          </RowAction>
          <RowAction
            label={section.isHidden ? "Show section" : "Hide section"}
            onClick={() => actions.onToggleHidden(section.id)}
          >
            {section.isHidden ? (
              <Eye className="size-3.5" aria-hidden />
            ) : (
              <EyeOff className="size-3.5" aria-hidden />
            )}
          </RowAction>
        </span>
      )}
    </li>
  );
}

function RowAction({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex size-6 cursor-pointer items-center justify-center text-slate-500 first:rounded-l-md last:rounded-r-md hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}
