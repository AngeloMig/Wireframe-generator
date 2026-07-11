"use client";

import { useMemo, useState } from "react";
import { Lightbulb } from "lucide-react";
import { getVariation, variationsOfType } from "@/data/section-variations";
import { suggestVariation } from "@/lib/collab-service";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import type { PageSection, Project, ProjectPage } from "@/types";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label, Textarea } from "@/components/ui/input";
import { SectionThumbnail } from "@/components/editor/library/section-thumbnail";

/**
 * Agency: recommend a different design for a section without changing the
 * customer's work. The customer accepts or declines from the editor.
 */
export function SuggestVariationDialog({
  project,
  page,
  section,
  open,
  onClose,
}: {
  project: Project;
  page: ProjectPage;
  section: PageSection;
  open: boolean;
  onClose: () => void;
}) {
  const user = useSessionStore((s) => s.user);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const alternatives = useMemo(
    () =>
      variationsOfType(section.sectionType).filter(
        (v) => v.id !== section.variationId && v.isActive,
      ),
    [section.sectionType, section.variationId],
  );
  const current = getVariation(section.variationId);

  const handleSubmit = async () => {
    if (!selectedId || busy) return;
    setBusy(true);
    try {
      await suggestVariation(project, page, section.id, selectedId, user, message.trim() || undefined);
      toast("Suggestion sent", "success", "The customer can preview and accept it.");
      onClose();
      setSelectedId(null);
      setMessage("");
    } catch {
      toast("Could not send the suggestion", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Suggest a different design"
      description={`Currently using “${current?.name ?? section.variationId}”. Pick an alternative — the customer's content is preserved either way.`}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button disabled={!selectedId || busy} onClick={() => void handleSubmit()}>
            <Lightbulb className="size-4" aria-hidden />
            Send suggestion
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div
          className="grid max-h-72 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3"
          role="radiogroup"
          aria-label="Alternative designs"
        >
          {alternatives.map((variation) => (
            <button
              key={variation.id}
              type="button"
              role="radio"
              aria-checked={selectedId === variation.id}
              onClick={() => setSelectedId(variation.id)}
              className={cn(
                "cursor-pointer rounded-lg border-2 p-2 text-left transition-colors",
                selectedId === variation.id
                  ? "border-indigo-500 bg-indigo-50/50"
                  : "border-slate-200 hover:border-slate-300",
              )}
            >
              <SectionThumbnail variation={variation} />
              <p className="mt-1.5 truncate text-xs font-medium text-slate-800">
                {variation.name}
              </p>
            </button>
          ))}
          {alternatives.length === 0 && (
            <p className="col-span-full py-6 text-center text-sm text-slate-500">
              No alternative designs available for this section type.
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="suggestion-message" optional>
            Why this design?
          </Label>
          <Textarea
            id="suggestion-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            className="mt-1.5"
            placeholder="A short note helps the customer decide…"
          />
        </div>
      </div>
    </Dialog>
  );
}
