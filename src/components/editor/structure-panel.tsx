"use client";

import { useMemo } from "react";
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
 * hover reveals reorder, hide, duplicate, and delete — the same actions the
 * canvas toolbar offers, in keyboard-friendly button form.
 */
export function StructurePanel({
  sections,
  selectedId,
  actions,
  readOnly,
  onAddSection,
}: {
  sections: PageSection[];
  selectedId: string | null;
  actions: CanvasSectionActions;
  readOnly: boolean;
  onAddSection: () => void;
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
      { label: "Header", items: header, addable: false },
      { label: "Template", items: template, addable: true },
      { label: "Footer", items: footer, addable: false },
    ];
  }, [ordered]);

  const select = (id: string) => {
    actions.onSelect(id);
    document
      .querySelector(`[data-canvas-section="${id}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <nav aria-label="Page structure" className="flex h-full flex-col overflow-y-auto py-3">
      {groups.map((group) => (
        <div key={group.label} className="px-2 pb-3">
          <p className="px-2 pb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
            {group.label}
          </p>
          {group.items.length === 0 && !group.addable && (
            <p className="px-2 py-1 text-xs text-slate-400">No {group.label.toLowerCase()} yet</p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((section, index) => {
              const variation = getVariation(section.variationId);
              const Icon = TYPE_ICONS[section.sectionType] ?? LayoutGrid;
              const isSelected = section.id === selectedId;
              const locked = section.approvalLocked || section.isLocked;
              return (
                <li key={section.id} className="group/row relative">
                  <button
                    type="button"
                    onClick={() => select(section.id)}
                    aria-current={isSelected ? "true" : undefined}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2 rounded-lg py-1.5 pl-2 pr-1 text-left text-[13px] transition-colors",
                      isSelected
                        ? "bg-indigo-50 font-medium text-indigo-900"
                        : "text-slate-700 hover:bg-slate-100",
                      section.isHidden && "opacity-50",
                    )}
                  >
                    <Icon
                      className={cn("size-4 shrink-0", isSelected ? "text-indigo-600" : "text-slate-400")}
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {variation?.name ?? SECTION_TYPE_LABELS[section.sectionType]}
                    </span>
                    {locked && (
                      <Lock className="size-3 shrink-0 text-slate-400" aria-label="Locked" />
                    )}
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
                        disabled={index === group.items.length - 1}
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
            })}
          </ul>
          {group.addable && !readOnly && (
            <button
              type="button"
              onClick={onAddSection}
              className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
            >
              <Plus className="size-4" aria-hidden />
              Add section
            </button>
          )}
        </div>
      ))}
    </nav>
  );
}

function RowAction({
  label,
  onClick,
  disabled,
  destructive,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
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
      className={cn(
        "flex size-6 cursor-pointer items-center justify-center first:rounded-l-md last:rounded-r-md disabled:cursor-not-allowed disabled:opacity-30",
        destructive
          ? "text-rose-600 hover:bg-rose-50"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
      )}
    >
      {children}
    </button>
  );
}
