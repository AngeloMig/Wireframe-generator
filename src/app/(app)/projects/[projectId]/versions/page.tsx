"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArchiveRestore,
  Eye,
  GitCompareArrows,
  History,
  Pencil,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { restoreVersion } from "@/lib/collab-service";
import { snapshotOf } from "@/lib/collab-service";
import { canCreateManualVersion, canRestoreVersion } from "@/lib/permissions";
import { compareSnapshots } from "@/lib/version-compare";
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
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label, Textarea } from "@/components/ui/input";

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
          description="A snapshot is saved at every review milestone. Pick two versions to compare them."
          action={
            canCreateManualVersion(user.role) ? (
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus className="size-3.5" aria-hidden />
                Save version
              </Button>
            ) : undefined
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
            <ol className="divide-y divide-slate-100">
              {versions.map((version) => {
                const isApprovedVersion = project.approvedVersionId === version.id;
                const hasApproval = approvals.some(
                  (a) => a.versionId === version.id && !a.revokedAt,
                );
                const selected =
                  compareFromId === version.id || compareToId === version.id;
                return (
                  <li
                    key={version.id}
                    className={cn(
                      "flex flex-wrap items-center gap-3 px-5 py-3.5",
                      selected && "bg-indigo-50/60",
                    )}
                  >
                    <label className="flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        className="size-4 accent-indigo-600"
                        checked={selected}
                        onChange={() => toggleCompare(version)}
                        aria-label={`Select version ${version.versionNumber} for comparison`}
                      />
                    </label>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-900">
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
                        {TRIGGER_LABELS[version.trigger]} · {memberName(version.createdById)}{" "}
                        · {formatRelative(version.createdAt)}
                        {version.description && ` · ${version.description}`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`View version ${version.versionNumber}`}
                        onClick={() => setViewing(version)}
                      >
                        <Eye className="size-4" aria-hidden />
                      </Button>
                      {version.trigger === "manual" && canCreateManualVersion(user.role) && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Rename version ${version.versionNumber}`}
                          onClick={() => setRenaming(version)}
                        >
                          <Pencil className="size-4" aria-hidden />
                        </Button>
                      )}
                      {canRestoreVersion(user.role) && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Restore version ${version.versionNumber}`}
                          onClick={() => setRestoring(version)}
                        >
                          <ArchiveRestore className="size-4" aria-hidden />
                        </Button>
                      )}
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
              <Button variant="ghost" size="sm" onClick={() => setCompare(null, null)}>
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
            />
          </CardBody>
        </Card>
      )}
      {(compareFrom || compareTo) && !comparison && (
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

function ChangedPagesList({ pages }: { pages: ReturnType<typeof compareSnapshots>["pages"] }) {
  const [changedOnly, setChangedOnly] = useState(true);
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
      {visible.map((page) => (
        <div key={page.pageName + page.kind} className="rounded-lg border border-slate-200">
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
        </div>
      ))}
    </div>
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
