"use client";

import { useRef, useState } from "react";
import { FileText, ImageIcon, ImagePlus, Trash2, Upload } from "lucide-react";
import { withActivity } from "@/lib/project-utils";
import { useProject } from "@/hooks/use-project";
import { useProjectsStore } from "@/stores/projects-store";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import type { AssetKind, ProjectAsset } from "@/types";
import { createId, nowIso } from "@/utils/id";
import { formatRelative } from "@/utils/dates";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

const MAX_UPLOAD_BYTES = 1_500_000; // Keep localStorage well under quota.

export default function AssetsPage() {
  const { project, projectId } = useProject();
  const updateProject = useProjectsStore((s) => s.updateProject);
  const user = useSessionStore((s) => s.user);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectAsset | null>(null);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<AssetKind>("image");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  if (!project) return null; // ProjectShell handles loading and not-found.

  const resetForm = () => {
    setName("");
    setKind("image");
    setUrl("");
    setNote("");
    setDataUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      toast("File too large for the prototype", "error", "Please pick an image under ~1.5 MB or paste a URL instead.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDataUrl(typeof reader.result === "string" ? reader.result : null);
      if (!name) setName(file.name.replace(/\.[^.]+$/, ""));
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast("Give the asset a name", "error");
      return;
    }
    const asset: ProjectAsset = {
      id: createId(),
      projectId,
      name: trimmed,
      kind,
      url: dataUrl ?? url.trim(),
      note: note.trim(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    updateProject(projectId, (p) =>
      withActivity(
        { ...p, assets: [asset, ...p.assets] },
        "asset-added",
        `Asset “${asset.name}” added`,
        user,
      ),
    );
    setDialogOpen(false);
    resetForm();
    toast("Asset added", "success");
  };

  const handleDelete = (asset: ProjectAsset) => {
    updateProject(projectId, (p) => ({
      ...p,
      assets: p.assets.filter((a) => a.id !== asset.id),
    }));
    toast("Asset removed", "info");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Assets</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Logos, photography, and documents the agency should use. Uploads here are
            stored in your browser for preview only.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <ImagePlus className="size-4" aria-hidden />
          Add asset
        </Button>
      </div>

      {project.assets.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No uploaded assets"
          description="Add your logo and any brand photography so the agency can reference the real materials."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Upload className="size-4" aria-hidden />
              Add your first asset
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {project.assets.map((asset) => (
            <li
              key={asset.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex h-36 items-center justify-center bg-slate-100">
                {asset.url && asset.kind !== "document" ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local data/object URLs
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <FileText className="size-8 text-slate-300" aria-hidden />
                )}
              </div>
              <div className="flex items-start gap-2 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{asset.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500 capitalize">
                    {asset.kind} · added {formatRelative(asset.createdAt)}
                  </p>
                  {asset.note && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{asset.note}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${asset.name}`}
                  onClick={() => setDeleteTarget(asset)}
                >
                  <Trash2 className="size-4 text-slate-400" aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Add an asset"
        description="Upload a small file for preview, or paste a link to where it lives."
        footer={
          <>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add asset</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="asset-name">Name</Label>
            <Input
              id="asset-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Primary logo"
            />
          </div>
          <div>
            <Label htmlFor="asset-kind">Type</Label>
            <Select
              id="asset-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as AssetKind)}
            >
              <option value="image">Image</option>
              <option value="logo">Logo</option>
              <option value="document">Document</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="asset-file" optional>
              Upload file (preview only)
            </Label>
            <input
              ref={fileInputRef}
              id="asset-file"
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="block w-full text-sm text-slate-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
            />
            {dataUrl && (
              <p className="mt-1.5 text-xs text-emerald-600">File ready for preview.</p>
            )}
          </div>
          <div>
            <Label htmlFor="asset-url" optional>
              Or paste a URL
            </Label>
            <Input
              id="asset-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              disabled={dataUrl !== null}
            />
          </div>
          <div>
            <Label htmlFor="asset-note" optional>
              Note for the agency
            </Label>
            <Textarea
              id="asset-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Use this version on dark backgrounds"
            />
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        title={`Remove “${deleteTarget?.name ?? ""}”?`}
        description="The asset will be removed from this blueprint."
        confirmLabel="Remove asset"
      />
    </div>
  );
}
