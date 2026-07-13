"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Bookmark, History, MousePointerClick, Plus, Trash2 } from "lucide-react";
import { getSectionTypeDefinition } from "@/data/section-schemas";
import { getVariation } from "@/data/section-variations";
import { SECTION_TYPE_LABELS } from "@/config/labels";
import { findLastApprovedSection } from "@/lib/collab-service";
import { canRequestRevisions, canRestoreVersion } from "@/lib/permissions";
import { compareSections } from "@/lib/version-compare";
import type { InspectorTab } from "@/stores/editor-store";
import { useEditorStore } from "@/stores/editor-store";
import { useSessionStore } from "@/stores/session-store";
import type { PageSection, PendingSectionRemoval, ProjectPage } from "@/types";
import { formatRelative } from "@/utils/dates";
import { cn } from "@/utils/cn";
import { PageStatusBadge } from "@/components/ui/badge";
import { ContentTab } from "./content-tab";
import type { SectionMutator } from "./inspector-types";
import { LayoutTab } from "./layout-tab";
import { NotesTab } from "./notes-tab";
import { StyleTab } from "./style-tab";

const TABS: { id: InspectorTab; label: string }[] = [
  { id: "content", label: "Content" },
  { id: "layout", label: "Design" },
  { id: "style", label: "Settings" },
  { id: "notes", label: "Notes" },
];

/**
 * Right panel: edit the selected section via Content/Layout/Style/Notes.
 * With nothing selected it shows the page at a glance instead of a dead end:
 * what still needs attention, plus quick ways in.
 */
export function SectionInspector({
  section,
  onChange,
  page,
  projectId,
  attentionReasons,
  onSelectSection,
  onAddSection,
  onSaveToLibrary,
  onRevertSection,
  onRestoreRemoval,
  onDismissRemoval,
}: {
  section: PageSection | null;
  onChange: SectionMutator;
  page?: ProjectPage;
  /** Needed to look up the last approved snapshot for the "what changed" diff. */
  projectId?: string;
  attentionReasons?: Map<string, string[]>;
  onSelectSection?: (sectionId: string) => void;
  onAddSection?: () => void;
  /** Agency-side: freeze this section into the reusable pattern library. */
  onSaveToLibrary?: (section: PageSection) => void;
  /** Agency-side: restore this section to its last approved version. */
  onRevertSection?: (sectionId: string) => void;
  /** Agency-side: bring a customer-removed section back onto the page. */
  onRestoreRemoval?: (removalId: string) => void;
  /** Agency-side: dismiss a removal trace without restoring the section. */
  onDismissRemoval?: (removalId: string) => void;
}) {
  const inspectorTab = useEditorStore((s) => s.inspectorTab);
  const setInspectorTab = useEditorStore((s) => s.setInspectorTab);
  const role = useSessionStore((s) => s.user.role);
  const isCustomer = role === "customer";

  // Customers edit words and pick designs; the technical Settings tab is
  // agency-only. If a customer lands on it (persisted state), snap to Content.
  const tabs = isCustomer ? TABS.filter((t) => t.id !== "style") : TABS;
  const activeTab =
    isCustomer && inspectorTab === "style" ? "content" : inspectorTab;

  // Field-level "what changed" summary for a flagged, edited (not new)
  // section — compares the live content against the last approved snapshot.
  const [diff, setDiff] = useState<string[] | null>(null);
  useEffect(() => {
    setDiff(null);
    if (
      isCustomer ||
      !projectId ||
      !page ||
      !section ||
      section.reviewStatus !== "agency-review-needed" ||
      section.pendingChange !== "edited"
    ) {
      return;
    }
    let cancelled = false;
    findLastApprovedSection(projectId, page.id, section.id).then((approved) => {
      if (cancelled || !approved) return;
      // "Review status changed" is trivially true for every flagged section
      // (approved → agency-review-needed) — the banner already says that.
      setDiff(compareSections(approved, section).filter((line) => line !== "Review status changed"));
    });
    return () => {
      cancelled = true;
    };
  }, [isCustomer, projectId, page, section]);

  if (!section) {
    if (page) {
      return (
        <PageOverviewPanel
          page={page}
          isCustomer={isCustomer}
          attentionReasons={attentionReasons}
          onSelectSection={onSelectSection}
          onAddSection={onAddSection}
          onRestoreRemoval={onRestoreRemoval}
          onDismissRemoval={onDismissRemoval}
        />
      );
    }
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-[var(--primary-soft)]">
          <MousePointerClick className="size-5 text-[var(--primary)]" aria-hidden />
        </div>
        <p className="text-sm font-semibold text-slate-700">No section selected</p>
        <p className="max-w-48 text-xs text-slate-500">
          Choose a section on the page to edit its words, design, settings, and notes.
        </p>
      </div>
    );
  }

  const definition = getSectionTypeDefinition(section.sectionType);
  const variation = getVariation(section.variationId) ?? null;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--border-default)] bg-[#fbfcfa] px-4 pt-4 pb-0">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-bold text-[var(--text-primary)]">
            {variation?.name ?? definition.label}
          </p>
          {onSaveToLibrary && (
            <button
              type="button"
              onClick={() => onSaveToLibrary(section)}
              title="Save this section to your pattern library"
              aria-label="Save this section to your pattern library"
              className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-400 hover:bg-black/[0.05] hover:text-slate-700"
            >
              <Bookmark className="size-3.5" aria-hidden />
            </button>
          )}
        </div>
        <p className="mb-2 truncate text-[11px] text-slate-400">
          {definition.label}
          {variation ? ` · ${variation.description}` : ""}
        </p>
        <div role="tablist" aria-label="Inspector tabs" className="-mb-px flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setInspectorTab(tab.id)}
              className={cn(
                "cursor-pointer border-b-2 px-2.5 py-2.5 text-xs font-semibold transition-colors",
                activeTab === tab.id
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              )}
            >
              {tab.label}
              {tab.id === "notes" &&
                (section.notes.customerNote ||
                  section.notes.quickNotes.length > 0 ||
                  section.notes.agencyQuestion) && (
                  <span className="ml-1 inline-block size-1.5 rounded-full bg-[var(--primary)] align-middle" />
                )}
            </button>
          ))}
        </div>
      </div>
      {!isCustomer && section.reviewStatus === "agency-review-needed" && (
        <div className="flex flex-wrap items-start gap-2 border-b border-amber-200/70 bg-amber-50/60 px-4 py-2.5">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-700" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] leading-4 text-amber-800">
              {section.pendingChange === "added"
                ? "New section — added by the customer."
                : "The customer edited this since it was last approved."}
            </p>
            {diff && diff.length > 0 && (
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] leading-4 text-amber-700">
                {diff.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex shrink-0 gap-1.5">
            {canRestoreVersion(role) && onRevertSection && (
              <button
                type="button"
                onClick={() => onRevertSection(section.id)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-amber-300 bg-white px-2 py-1 text-[11px] font-semibold text-amber-800 transition-colors hover:bg-amber-100"
              >
                <History className="size-3" aria-hidden />
                Revert
              </button>
            )}
            {canRequestRevisions(role) && (
              <button
                type="button"
                onClick={() =>
                  onChange((s) => ({ ...s, reviewStatus: "approved", approvalLocked: true }))
                }
                className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-amber-800 px-2 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-amber-900"
              >
                Approve change
              </button>
            )}
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "content" && (
          <ContentTab
            section={section}
            definition={definition}
            variation={variation}
            onChange={onChange}
          />
        )}
        {activeTab === "layout" && <LayoutTab section={section} onChange={onChange} />}
        {activeTab === "style" && <StyleTab section={section} onChange={onChange} />}
        {activeTab === "notes" && <NotesTab section={section} onChange={onChange} />}
      </div>
    </div>
  );
}

function PageOverviewPanel({
  page,
  isCustomer,
  attentionReasons,
  onSelectSection,
  onAddSection,
  onRestoreRemoval,
  onDismissRemoval,
}: {
  page: ProjectPage;
  isCustomer: boolean;
  attentionReasons?: Map<string, string[]>;
  onSelectSection?: (sectionId: string) => void;
  onAddSection?: () => void;
  onRestoreRemoval?: (removalId: string) => void;
  onDismissRemoval?: (removalId: string) => void;
}) {
  const ordered = [...page.sections].sort((a, b) => a.order - b.order);
  const attention = ordered.filter((s) => (attentionReasons?.get(s.id)?.length ?? 0) > 0);
  const removals = isCustomer ? [] : (page.pendingRemovals ?? []);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--border-default)] bg-[#fbfcfa] px-4 py-4">
        <p className="truncate text-sm font-bold text-[var(--text-primary)]">{page.name}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
          <span>
            {ordered.length} section{ordered.length === 1 ? "" : "s"}
          </span>
          <PageStatusBadge status={page.status} />
        </div>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {removals.length > 0 && (
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-[0.08em] text-rose-700 uppercase">
              <Trash2 className="size-3.5" aria-hidden />
              Removed by the customer
            </h3>
            <ul className="space-y-1.5">
              {removals.map((removal: PendingSectionRemoval) => {
                const variation = getVariation(removal.snapshot.variationId);
                return (
                  <li
                    key={removal.id}
                    className="rounded-lg border border-rose-200/70 bg-rose-50/60 px-2.5 py-2"
                  >
                    <span className="block truncate text-xs font-semibold text-slate-800">
                      {variation?.name ?? SECTION_TYPE_LABELS[removal.snapshot.sectionType]}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-rose-800/80">
                      Removed {formatRelative(removal.removedAt)}
                    </span>
                    <span className="mt-1.5 flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => onRestoreRemoval?.(removal.id)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-rose-300 bg-white px-2 py-1 text-[11px] font-semibold text-rose-800 transition-colors hover:bg-rose-100"
                      >
                        <History className="size-3" aria-hidden />
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => onDismissRemoval?.(removal.id)}
                        className="inline-flex cursor-pointer items-center rounded-md px-2 py-1 text-[11px] font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                      >
                        Dismiss
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        {attention.length > 0 ? (
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-[0.08em] text-amber-700 uppercase">
              <AlertCircle className="size-3.5" aria-hidden />
              Needs attention
            </h3>
            <ul className="space-y-1.5">
              {attention.map((s) => {
                const variation = getVariation(s.variationId);
                const reasons = attentionReasons?.get(s.id) ?? [];
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => onSelectSection?.(s.id)}
                      className="w-full cursor-pointer rounded-lg border border-amber-200/70 bg-amber-50/60 px-2.5 py-2 text-left transition-colors hover:bg-amber-50"
                    >
                      <span className="block truncate text-xs font-semibold text-slate-800">
                        {variation?.name ?? SECTION_TYPE_LABELS[s.sectionType]}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-amber-800/80">
                        {reasons.join(" · ")}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : (
          <section className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 px-3 py-2.5">
            <p className="text-xs font-semibold text-emerald-800">Nothing needs attention</p>
            <p className="mt-0.5 text-[11px] leading-4 text-emerald-700/80">
              Every section on this page has content and no open requests.
            </p>
          </section>
        )}

        <section>
          <h3 className="mb-2 text-[11px] font-bold tracking-[0.08em] text-[var(--text-muted)] uppercase">
            Edit this page
          </h3>
          <p className="text-xs leading-5 text-slate-500">
            Click any section on the canvas, or pick one from the structure list, to edit
            its words, design, and notes here.
          </p>
          {onAddSection && (
            <button
              type="button"
              onClick={onAddSection}
              className="mt-2.5 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--border-strong)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              <Plus className="size-3.5" aria-hidden />
              Add a section
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
