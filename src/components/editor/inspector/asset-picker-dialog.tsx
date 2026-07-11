"use client";

import { ImageIcon } from "lucide-react";
import type { ProjectAsset } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";

/** Pick an uploaded project asset for an image field. */
export function AssetPickerDialog({
  assets,
  open,
  onClose,
  onPick,
}: {
  assets: ProjectAsset[];
  open: boolean;
  onClose: () => void;
  onPick: (asset: ProjectAsset) => void;
}) {
  const imageAssets = assets.filter((a) => a.kind === "image" || a.kind === "logo");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Choose from your uploads"
      description="Images and logos uploaded to this project."
      size="md"
      footer={
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      }
    >
      {imageAssets.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No uploads yet"
          description="Images added to the project's content library will appear here. You can still upload directly or paste a URL."
        />
      ) : (
        <div className="grid max-h-80 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
          {imageAssets.map((asset) => (
            <button
              key={asset.id}
              type="button"
              className="group cursor-pointer overflow-hidden rounded-lg border border-slate-200 text-left transition-colors hover:border-[var(--primary)]"
              onClick={() => {
                onPick(asset);
                onClose();
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- local previews */}
              <img
                src={asset.url}
                alt={asset.name}
                className="h-24 w-full bg-slate-100 object-cover"
              />
              <span className="block truncate px-2 py-1.5 text-xs font-medium text-slate-700 group-hover:text-[var(--primary)]">
                {asset.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </Dialog>
  );
}
