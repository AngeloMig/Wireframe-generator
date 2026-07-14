"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArchiveRestore,
  ChevronDown,
  Eye,
  GitCompareArrows,
  History,
  ListChecks,
  Pencil,
  Plus,
  ShieldCheck,
  X,
} from "lucide-react";
import { restoreVersion } from "@/lib/collab-service";
import { snapshotOf } from "@/lib/collab-service";
import { brandTheme, type BrandTheme } from "@/lib/editor-utils";
import { canCreateManualVersion, canRestoreVersion } from "@/lib/permissions";
import { compareSnapshots, type VersionComparison } from "@/lib/version-compare";
import { useProject } from "@/hooks/use-project";
import { selectProjectApprovals, useApprovalsStore } from "@/stores/approvals-store";
import { selectProjectMembers, useMembersStore } from "@/stores/members-store";
import { useCollabUiStore } from "@/stores/collab-ui-store";
import { useSessionStore } from "@/stores/session-store";
import { selectProjectVersions, useVersionsStore } from "@/stores/versions-store";
import { toast } from "@/stores/ui-store";
import type { ProjectVersion, VersionTrigger } from "@/types";
import { cn } from "@/utils/cn";
import { formatRelative } from "@/utils/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { DropdownItem, DropdownMenu } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label, Textarea } from "@/components/ui/input";
import { ScaledPreview } from "@/components/collab/scaled-preview";
import { WireProvider } from "@/components/editor/wireframes/primitives";
import { SectionRenderer } from "@/components/editor/wireframes/section-renderer";

/** One plain-language line describing a version's change vs. the one before it. */
function summarizeChange(result: VersionComparison): string {
  if (result.totalChanges === 0) return "No differences from the version before it";
  const changedPages = result.pages.filter((p) => p.kind !== "unchanged");
  const sectionChanges = changedPages.reduce((sum, p) => sum + p.sections.length, 0);
  const parts = [...result.summary];
  if (sectionChanges > 0) {
    parts.push(
      `${sectionChanges} section${sectionChanges === 1 ? "" : "s"} changed across ${changedPages.length} page${changedPages.length === 1 ? "" : "s"}`,
    );
  }
  return (
    parts.slice(0, 2).join(" · ") ||
    `${result.totalChanges} change${result.totalChanges === 1 ? "" : "s"}`
  );
}

const TRIGGER_LABELS: Record<VersionTrigger, string> = {
  manual: "Manual save",
  "review-submission": "Submitted for review",
  "revision-request": "Revisions requested",
  "revision-submission": "Revisions submitted",
  "revision-backup": "Backup",
  "page-approval": "Page approved",
  "project-approval": "Blueprint approved",
  unlock: "Unlocked for changes",
  "restore-backup": "Backup before restore",
};

/** Version history: view, compare, restore, create + rename manual versions. */
export default function VersionsPage() {
  const { project, projectId } = useProject();
  const user = useSessionStore((s) => s.user);
  const loadVersions = useVersionsStore((s) => s.load);
  const versions = useVersionsStore((s) => selectProjectVersions(s, projectId));
  const createVersionInStore = useVersionsStore((s) => s.createVersion);
  const renameVersion = useVersionsStore((s) => s.renameVersion);
  const loadMembers = useMembersStore((s) => s.load);
  const members = useMembersStore((s) => selectProjectMembers(s, projectId));
  const loadApprovals = useApprovalsStore((s) => s.load);
  const approvals = useApprovalsStore((s) => selectProjectApprovals(s, projectId));
  const compareFromId = useCollabUiStore((s) => s.compareFromId);
  const compareToId = useCollabUiStore((s) => s.compareToId);
  const setCompare = useCollabUiStore((s) => s.setCompare);

  const [viewing, setViewing] = useState<ProjectVersion | null>(null);
  const [renaming, setRenaming] = useState<ProjectVersion | null>(null);
  const [restoring, setRestoring] = useState<ProjectVersion | null>(null);
  const [creating, setCreating] = useState(false);
  // Two ways to compare: a one-click "vs. the version right before it" (the
  // common case, always available), or picking any two versions by hand —
  // that mode is opt-in so the list reads as a plain timeline by default.
  const [picking, setPicking] = useState(false);

  const sortedAsc = useMemo(
    () => [...versions].sort((a, b) => a.versionNumber - b.versionNumber),
    [versions],
  );
  // What changed vs. the previous version, computed once per pair so every
  // row can say what happened without anyone opening the compare view.
  const changeSummaries = useMemo(() => {
    const map = new Map<string, string>();
    sortedAsc.forEach((version, index) => {
      if (index === 0) return;
      const previous = sortedAsc[index - 1];
      map.set(version.id, summarizeChange(compareSnapshots(previous.snapshot, version.snapshot)));
    });
    return map;
  }, [sortedAsc]);
  const previousVersionOf = useMemo(() => {
    const map = new Map<string, ProjectVersion>();
    sortedAsc.forEach((version, index) => {
      if (index > 0) map.set(version.id, sortedAsc[index - 1]);
    });
    return map;
  }, [sortedAsc]);
  const sortedDesc = useMemo(() => [...sortedAsc].reverse(), [sortedAsc]);

  useEffect(() => {
    if (!projectId) return;
    void loadVersions(projectId);
    void loadMembers(projectId);
    void loadApprovals(projectId);
  }, [projectId, loadVersions, loadMembers, loadApprovals]);

  const compareFrom = versions.find((v) => v.id === compareFromId) ?? null;
  const compareTo = versions.find((v) => v.id === compareToId) ?? null;
  const comparison = useMemo(() => {
    if (!compareFrom || !compareTo) return null;
    const [older, newer] =
      compareFrom.versionNumber <= compareTo.versionNumber
        ? [compareFrom, compareTo]
        : [compareTo, compareFrom];
    return { older, newer, result: compareSnapshots(older.snapshot, newer.snapshot) };
  }, [compareFrom, compareTo]);

  if (!project) return null;

  const memberName = (id: string) =>
    members.find((m) => m.userId === id)?.name ?? "Team member";

  const toggleCompare = (version: ProjectVersion) => {
    if (compareFromId === version.id) return setCompare(compareToId, null);
    if (compareToId === version.id) return setCompare(compareFromId, null);
    if (!compareFromId) return setCompare(version.id, compareToId);
    if (!compareToId) return setCompare(compareFromId, version.id);
    setCompare(compareToId, version.id);
  };
  const exitPicking = () => {
    setPicking(false);
    setCompare(null, null);
  };
  const pickedCount = [compareFromId, compareToId].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <History className="size-4 text-slate-400" aria-hidden />
              Version history
            </span>
          }
          description={
            picking
              ? pickedCount === 0
                ? "Select the first of two versions to compare."
                : pickedCount === 1
                  ? "Select the second version to compare."
                  : "Both versions selected — see the comparison below."
              : "A snapshot is saved at every review milestone, newest first. Every version shows what changed since the one before it."
          }
          action={
            <div className="flex items-center gap-2">
              {picking ? (
                <Button variant="outline" size="sm" onClick={exitPicking}>
                  <X className="size-3.5" aria-hidden />
                  Cancel
                </Button>
              ) : (
                versions.length > 1 && (
                  <Button variant="outline" size="sm" onClick={() => setPicking(true)}>
                    <ListChecks className="size-3.5" aria-hidden />
                    Compare two versions
                  </Button>
                )
              )}
              {canCreateManualVersion(user.role) && (
                <Button size="sm" onClick={() => setCreating(true)}>
                  <Plus className="size-3.5" aria-hidden />
                  Save version
                </Button>
              )}
            </div>
          }
        />
        <CardBody className="p-0">
          {versions.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={History}
                title="No versions yet"
                description="Versions are created automatically when you submit for review, when revisions are requested or submitted, and on approvals. Agency members can also save one manually."
              />
            </div>
          ) : (
            <ol className="px-5 py-4">
              {sortedDesc.map((version, index) => {
                const isApprovedVersion = project.approvedVersionId === version.id;
                const hasApproval = approvals.some(
                  (a) => a.versionId === version.id && !a.revokedAt,
                );
                const selected = compareFromId === version.id || compareToId === version.id;
                const previous = previousVersionOf.get(version.id);
                const isLastRow = index === sortedDesc.length - 1;
                return (
                  <li key={version.id} className="relative flex gap-3">
                    {/* Timeline rail: a dot per version, connected top to bottom —
                        the same "book of work" visual language as the dashboard
                        pipeline, so history reads as a trail, not a table. */}
                    <div className="flex shrink-0 flex-col items-center">
                      <span
                        aria-hidden
                        className={cn(
                          "z-10 mt-1.5 size-2.5 shrink-0 rounded-full ring-[3px] ring-white",
                          isApprovedVersion ? "bg-emerald-500" : "bg-slate-300",
                        )}
                      />
                      {!isLastRow && <span aria-hidden className="w-px flex-1 bg-slate-200" />}
                    </div>
                    <div
                      className={cn(
                        "min-w-0 flex-1 rounded-xl px-3 py-3 pb-5 transition-colors",
                        selected && "bg-indigo-50/60 ring-1 ring-indigo-200",
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                            v{version.versionNumber} — {version.label}
                            {isApprovedVersion && (
                              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                                <ShieldCheck className="mr-0.5 size-3" aria-hidden />
                                Approved version
                              </Badge>
                            )}
                            {!isApprovedVersion && hasApproval && (
                              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                                Has approvals
                              </Badge>
                            )}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {TRIGGER_LABELS[version.trigger]} · {memberName(version.createdById)} ·{" "}
                            {formatRelative(version.createdAt)}
                          </p>
                          {/* The whole point: what changed, in plain language, with
                              no need to enter compare mode to find out. */}
                          <p className="mt-1.5 text-sm text-slate-700">
                            {changeSummaries.get(version.id) ?? "Starting point — nothing to compare it with yet."}
                          </p>
                          {version.description && (
                            <p className="mt-1 text-xs text-slate-500">{version.description}</p>
                          )}
                        </div>

                        {picking ? (
                          <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600">
                            <input
                              type="checkbox"
                              className="size-3.5 accent-indigo-600"
                              checked={selected}
                              onChange={() => toggleCompare(version)}
                              aria-label={`Select version ${version.versionNumber} for comparison`}
                            />
                            Select
                          </label>
                        ) : (
                          <div className="flex shrink-0 items-center gap-1.5">
                            {previous && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCompare(previous.id, version.id)}
                              >
                                <GitCompareArrows className="size-3.5" aria-hidden />
                                Compare with previous
                              </Button>
                            )}
                            <DropdownMenu
                              trigger={(props) => (
                                <Button variant="ghost" size="icon-sm" aria-label="More actions" {...props}>
                                  <ChevronDown className="size-4" aria-hidden />
                                </Button>
                              )}
                            >
                              <DropdownItem onSelect={() => setViewing(version)}>
                                <Eye className="size-3.5 text-slate-400" aria-hidden />
                                View pages
                              </DropdownItem>
                              {version.trigger === "manual" && canCreateManualVersion(user.role) && (
                                <DropdownItem onSelect={() => setRenaming(version)}>
                                  <Pencil className="size-3.5 text-slate-400" aria-hidden />
                                  Rename
                                </DropdownItem>
                              )}
                              {canRestoreVersion(user.role) && (
                                <DropdownItem onSelect={() => setRestoring(version)}>
                                  <ArchiveRestore className="size-3.5 text-slate-400" aria-hidden />
                                  Restore this version
                                </DropdownItem>
                              )}
                            </DropdownMenu>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </CardBody>
      </Card>

      {/* Comparison */}
      {comparison && (
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <GitCompareArrows className="size-4 text-slate-400" aria-hidden />
                Comparing v{comparison.older.versionNumber} → v
                {comparison.newer.versionNumber}
              </span>
            }
            description={
              comparison.result.totalChanges === 0
                ? "No differences found between these versions."
                : `${comparison.result.totalChanges} change${comparison.result.totalChanges === 1 ? "" : "s"} found.`
            }
            action={
              <Button variant="ghost" size="sm" onClick={exitPicking}>
                <X className="size-3.5" aria-hidden />
                Clear
              </Button>
            }
          />
          <CardBody className="space-y-4">
            {comparison.result.summary.length > 0 && (
              <ul className="space-y-1 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {comparison.result.summary.map((line) => (
                  <li key={line}>• {line}</li>
                ))}
              </ul>
            )}
            <ChangedPagesList
              pages={comparison.result.pages}
              older={comparison.older}
              newer={comparison.newer}
              theme={brandTheme(project)}
            />
          </CardBody>
        </Card>
      )}
      {picking && (compareFrom || compareTo) && !comparison && (
        <p className="text-center text-sm text-slate-500">
          Select one more version to compare.
        </p>
      )}

      {/* View dialog */}
      <Dialog
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title={viewing ? `v${viewing.versionNumber} — ${viewing.label}` : ""}
        description={
          viewing
            ? `${TRIGGER_LABELS[viewing.trigger]} · ${formatRelative(viewing.createdAt)}`
            : undefined
        }
        size="md"
      >
        {viewing && (
          <div className="space-y-3">
            {viewing.description && (
              <p className="text-sm text-slate-600">{viewing.description}</p>
            )}
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {viewing.snapshot.pages.map((page) => (
                <li key={page.id} className="flex items-center gap-2 px-4 py-2.5 text-sm">
                  <span className="min-w-0 flex-1 font-medium text-slate-800">
                    {page.name}
                    {page.isHomepage && (
                      <span className="ml-2 text-xs font-normal text-slate-400">
                        Homepage
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-slate-500">
                    {page.sections.length} section{page.sections.length === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500">
              To inspect this version in detail, compare it with the current state or
              restore it (a backup of the current state is saved first).
            </p>
          </div>
        )}
      </Dialog>

      {/* Rename dialog */}
      {renaming && (
        <RenameVersionDialog
          version={renaming}
          onClose={() => setRenaming(null)}
          onSave={async (label, description) => {
            await renameVersion(projectId, renaming.id, label, description);
            setRenaming(null);
            toast("Version renamed", "success");
          }}
        />
      )}

      {/* Create manual version */}
      {creating && (
        <CreateVersionDialog
          onClose={() => setCreating(false)}
          onSave={async (label, description) => {
            await createVersionInStore({
              projectId,
              label,
              description: description || undefined,
              createdById: user.id,
              trigger: "manual",
              snapshot: snapshotOf(project),
            });
            setCreating(false);
            toast("Version saved", "success");
          }}
        />
      )}

      {/* Restore confirmation */}
      <ConfirmDialog
        open={restoring !== null}
        onClose={() => setRestoring(null)}
        title={restoring ? `Restore v${restoring.versionNumber}?` : ""}
        description="The current state is saved as a backup version first, then the project is replaced with this snapshot. Project members are notified."
        confirmLabel="Restore version"
        variant="primary"
        onConfirm={() => {
          if (!restoring) return;
          void restoreVersion(project, restoring, user).then(() => {
            toast(`Version ${restoring.versionNumber} restored`, "success");
          });
          setRestoring(null);
        }}
      />
    </div>
  );
}

function ChangedPagesList({
  pages,
  older,
  newer,
  theme,
}: {
  pages: ReturnType<typeof compareSnapshots>["pages"];
  older: ProjectVersion;
  newer: ProjectVersion;
  theme: BrandTheme;
}) {
  const [changedOnly, setChangedOnly] = useState(true);
  const [previewPageId, setPreviewPageId] = useState<string | null>(null);
  const visible = changedOnly ? pages.filter((p) => p.kind !== "unchanged") : pages;
  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          className="size-3.5 accent-indigo-600"
          checked={changedOnly}
          onChange={(e) => setChangedOnly(e.target.checked)}
        />
        Changed pages only
      </label>
      {visible.length === 0 && (
        <p className="text-sm text-slate-500">No page-level changes.</p>
      )}
      {visible.map((page) => {
        const olderPage = older.snapshot.pages.find((p) => p.id === page.pageId);
        const newerPage = newer.snapshot.pages.find((p) => p.id === page.pageId);
        const canPreview = Boolean(olderPage || newerPage);
        const previewing = previewPageId === page.pageId;
        return (
          <div key={(page.pageId ?? page.pageName) + page.kind} className="rounded-lg border border-slate-200">
            <p className="flex items-center gap-2 border-b border-slate-100 px-4 py-2 text-sm font-semibold text-slate-800">
              {page.pageName}
              {page.kind === "added" && (
                <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Added</Badge>
              )}
              {page.kind === "removed" && (
                <Badge className="border-rose-200 bg-rose-50 text-rose-700">Removed</Badge>
              )}
              {page.kind === "unchanged" && (
                <Badge className="border-slate-200 bg-slate-50 text-slate-500">Unchanged</Badge>
              )}
              {canPreview && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  aria-expanded={previewing}
                  onClick={() =>
                    setPreviewPageId(previewing ? null : (page.pageId ?? null))
                  }
                >
                  <Eye className="size-3.5" aria-hidden />
                  {previewing ? "Hide preview" : "Preview side by side"}
                </Button>
              )}
            </p>
            {(page.notes.length > 0 || page.sections.length > 0) && (
              <div className="space-y-2 px-4 py-3">
                {page.notes.map((note) => (
                  <p key={note} className="text-sm text-slate-600">
                    • {note}
                  </p>
                ))}
                {page.sections.map((section) => (
                  <div key={section.sectionName + section.kind}>
                    <p className="text-sm font-medium text-slate-700">
                      {section.sectionName}
                    </p>
                    <ul className="mt-0.5 space-y-0.5 pl-4 text-sm text-slate-600">
                      {section.details.map((detail) => (
                        <li key={detail}>– {detail}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            {previewing && (
              <div className="grid gap-3 border-t border-slate-100 p-4 lg:grid-cols-2">
                <SnapshotPagePreview
                  label={`v${older.versionNumber}`}
                  page={olderPage}
                  theme={theme}
                />
                <SnapshotPagePreview
                  label={`v${newer.versionNumber}`}
                  page={newerPage}
                  theme={theme}
                  highlight
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SnapshotPagePreview({
  label,
  page,
  theme,
  highlight,
}: {
  label: string;
  page: ProjectVersion["snapshot"]["pages"][number] | undefined;
  theme: BrandTheme;
  highlight?: boolean;
}) {
  return (
    <figure className="min-w-0">
      <figcaption
        className={cn(
          "mb-1.5 text-xs font-semibold tracking-wide uppercase",
          highlight ? "text-indigo-600" : "text-slate-500",
        )}
      >
        {label}
        {!page && " — page not in this version"}
      </figcaption>
      {page ? (
        <ScaledPreview
          scale={0.3}
          className="pointer-events-none max-h-96 rounded-lg border border-slate-200"
        >
          <WireProvider value={{ styled: false, theme, device: "desktop", sectionIsDark: false }}>
            <div style={{ width: 1200 }}>
              {[...page.sections]
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <SectionRenderer key={section.id} section={section} />
                ))}
            </div>
          </WireProvider>
        </ScaledPreview>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">
          Not present
        </div>
      )}
    </figure>
  );
}

function RenameVersionDialog({
  version,
  onClose,
  onSave,
}: {
  version: ProjectVersion;
  onClose: () => void;
  onSave: (label: string, description: string) => Promise<void>;
}) {
  const [label, setLabel] = useState(version.label);
  const [description, setDescription] = useState(version.description ?? "");
  return (
    <Dialog
      open
      onClose={onClose}
      title={`Rename v${version.versionNumber}`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!label.trim()} onClick={() => void onSave(label.trim(), description.trim())}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <Label htmlFor="version-label">Label</Label>
          <Input
            id="version-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="version-description" optional>
            Description
          </Label>
          <Textarea
            id="version-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-1.5"
          />
        </div>
      </div>
    </Dialog>
  );
}

function CreateVersionDialog({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (label: string, description: string) => Promise<void>;
}) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  return (
    <Dialog
      open
      onClose={onClose}
      title="Save a version"
      description="Captures the current pages, sections, content, and settings."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!label.trim()} onClick={() => void onSave(label.trim(), description.trim())}>
            <Plus className="size-4" aria-hidden />
            Save version
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <Label htmlFor="new-version-label">Label</Label>
          <Input
            id="new-version-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Before the homepage restructure"
            className="mt-1.5"
            autoFocus
          />
        </div>
        <div>
          <Label htmlFor="new-version-description" optional>
            Description
          </Label>
          <Textarea
            id="new-version-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-1.5"
          />
        </div>
      </div>
    </Dialog>
  );
}
