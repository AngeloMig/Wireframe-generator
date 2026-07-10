"use client";

import { useState } from "react";
import { Globe, Plus, Trash2 } from "lucide-react";
import type { InspirationSite } from "@/types";
import { createId } from "@/utils/id";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";

export function StepInspiration({
  inspirations,
  onChange,
}: {
  inspirations: InspirationSite[];
  onChange: (inspirations: InspirationSite[]) => void;
}) {
  const [draft, setDraft] = useState({ url: "", likes: "", dislikes: "", sectionsToReference: "" });
  const [error, setError] = useState<string | undefined>();

  const addInspiration = () => {
    const url = draft.url.trim();
    if (!url) {
      setError("Enter the website URL first.");
      return;
    }
    const normalised = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    try {
      new URL(normalised);
    } catch {
      setError("That doesn't look like a valid URL.");
      return;
    }
    setError(undefined);
    onChange([
      ...inspirations,
      { id: createId(), url: normalised, likes: draft.likes.trim(), dislikes: draft.dislikes.trim(), sectionsToReference: draft.sectionsToReference.trim() },
    ]);
    setDraft({ url: "", likes: "", dislikes: "", sectionsToReference: "" });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        Share websites you admire (competitors or otherwise). This step is optional but very
        helpful for the agency.
      </p>

      {inspirations.length > 0 && (
        <ul className="space-y-3">
          {inspirations.map((site) => (
            <li
              key={site.id}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <Globe className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-sm font-medium text-slate-900">{site.url}</p>
                {site.likes && (
                  <p className="text-sm text-slate-600">
                    <span className="font-medium text-emerald-600">Likes:</span> {site.likes}
                  </p>
                )}
                {site.dislikes && (
                  <p className="text-sm text-slate-600">
                    <span className="font-medium text-rose-600">Dislikes:</span> {site.dislikes}
                  </p>
                )}
                {site.sectionsToReference && (
                  <p className="text-sm text-slate-600">
                    <span className="font-medium text-slate-700">Sections to reference:</span>{" "}
                    {site.sectionsToReference}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${site.url}`}
                onClick={() => onChange(inspirations.filter((s) => s.id !== site.id))}
              >
                <Trash2 className="size-4 text-slate-400" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Add an inspiration website</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="insp-url">Website URL</Label>
            <Input
              id="insp-url"
              placeholder="https://example.com"
              value={draft.url}
              onChange={(e) => setDraft({ ...draft, url: e.target.value })}
              aria-invalid={Boolean(error)}
            />
            <FieldError message={error} />
          </div>
          <div>
            <Label htmlFor="insp-likes" optional>
              What do you like about it?
            </Label>
            <Textarea
              id="insp-likes"
              rows={2}
              value={draft.likes}
              onChange={(e) => setDraft({ ...draft, likes: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="insp-dislikes" optional>
              What do you not like?
            </Label>
            <Textarea
              id="insp-dislikes"
              rows={2}
              value={draft.dislikes}
              onChange={(e) => setDraft({ ...draft, dislikes: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="insp-sections" optional>
              Sections you want to reference
            </Label>
            <Input
              id="insp-sections"
              placeholder="e.g. Their hero and testimonial section"
              value={draft.sectionsToReference}
              onChange={(e) => setDraft({ ...draft, sectionsToReference: e.target.value })}
            />
          </div>
        </div>
        <Button variant="outline" className="mt-4" onClick={addInspiration}>
          <Plus className="size-4" aria-hidden />
          Add website
        </Button>
      </div>
    </div>
  );
}
