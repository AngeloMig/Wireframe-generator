"use client";

import { useState } from "react";
import { Plus, RefreshCcw, X } from "lucide-react";
import { SECTION_TYPE_LABELS } from "@/config/labels";
import { getVariation } from "@/data/section-variations";
import { requestRevisions } from "@/lib/collab-service";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import type { CommentPriority, Project } from "@/types";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

/**
 * Agency revision request: summary, message, affected pages, optional
 * sections, priority, optional due date, and requested action items.
 * Creates a version snapshot and notifies the customer.
 */
export function RevisionRequestDialog({
  project,
  open,
  onClose,
  onRequested,
}: {
  project: Project;
  open: boolean;
  onClose: () => void;
  onRequested?: () => void;
}) {
  const user = useSessionStore((s) => s.user);
  const [summary, setSummary] = useState("");
  const [message, setMessage] = useState("");
  const [pageIds, setPageIds] = useState<string[]>([]);
  const [sectionIds, setSectionIds] = useState<string[]>([]);
  const [priority, setPriority] = useState<CommentPriority>("normal");
  const [dueDate, setDueDate] = useState("");
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [actionDraft, setActionDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const contentPages = project.pages.filter((p) => p.sections.length > 0);
  const selectedPages = contentPages.filter((p) => pageIds.includes(p.id));

  const togglePage = (id: string) => {
    setPageIds((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      // Drop section picks that belong to a deselected page.
      const validSections = new Set(
        contentPages
          .filter((p) => next.includes(p.id))
          .flatMap((p) => p.sections.map((s) => s.id)),
      );
      setSectionIds((secs) => secs.filter((s) => validSections.has(s)));
      return next;
    });
  };

  const addActionItem = () => {
    const trimmed = actionDraft.trim();
    if (!trimmed) return;
    setActionItems((prev) => [...prev, trimmed]);
    setActionDraft("");
  };

  const handleSubmit = async () => {
    if (!summary.trim() || !message.trim() || pageIds.length === 0 || busy) return;
    setBusy(true);
    try {
      await requestRevisions(project, user, {
        summary: summary.trim(),
        message: message.trim(),
        pageIds,
        sectionIds,
        priority,
        dueDate: dueDate || undefined,
        actionItems,
      });
      toast("Revisions requested", "success", "The customer has been notified.");
      onRequested?.();
      onClose();
      setSummary("");
      setMessage("");
      setPageIds([]);
      setSectionIds([]);
      setActionItems([]);
      setDueDate("");
      setPriority("normal");
    } catch {
      toast("Could not request revisions", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Request revisions"
      description="Tell the customer what needs to change. A version snapshot is saved and the affected pages move to “Revisions Requested”."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            disabled={!summary.trim() || !message.trim() || pageIds.length === 0 || busy}
            onClick={() => void handleSubmit()}
          >
            <RefreshCcw className="size-4" aria-hidden />
            Request revisions
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="revision-summary">Revision summary</Label>
          <Input
            id="revision-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="e.g. Hero photography and navigation cleanup"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="revision-message">Message to the customer</Label>
          <Textarea
            id="revision-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="mt-1.5"
            placeholder="Explain what you need and why…"
          />
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-slate-700">
            Pages requiring revision
          </legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {contentPages.map((page) => (
              <button
                key={page.id}
                type="button"
                aria-pressed={pageIds.includes(page.id)}
                onClick={() => togglePage(page.id)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  pageIds.includes(page.id)
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                    : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
                )}
              >
                {page.name}
              </button>
            ))}
          </div>
          {contentPages.length === 0 && (
            <p className="mt-1.5 text-xs text-slate-500">No pages with sections yet.</p>
          )}
        </fieldset>

        {selectedPages.length > 0 && (
          <fieldset>
            <legend className="text-sm font-medium text-slate-700">
              Specific sections (optional)
            </legend>
            <div className="mt-1.5 max-h-36 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
              {selectedPages.map((page) =>
                page.sections.map((section) => {
                  const name =
                    getVariation(section.variationId)?.name ??
                    SECTION_TYPE_LABELS[section.sectionType];
                  return (
                    <label
                      key={section.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        className="size-3.5 accent-indigo-600"
                        checked={sectionIds.includes(section.id)}
                        onChange={(e) =>
                          setSectionIds((prev) =>
                            e.target.checked
                              ? [...prev, section.id]
                              : prev.filter((id) => id !== section.id),
                          )
                        }
                      />
                      {page.name} › {name}
                    </label>
                  );
                }),
              )}
            </div>
          </fieldset>
        )}

        <div>
          <Label htmlFor="revision-actions">Requested actions</Label>
          <div className="mt-1.5 flex gap-2">
            <Input
              id="revision-actions"
              value={actionDraft}
              onChange={(e) => setActionDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addActionItem();
                }
              }}
              placeholder="e.g. Upload final hero photography"
            />
            <Button variant="outline" onClick={addActionItem} disabled={!actionDraft.trim()}>
              <Plus className="size-4" aria-hidden />
              Add
            </Button>
          </div>
          {actionItems.length > 0 && (
            <ul className="mt-2 space-y-1">
              {actionItems.map((item, index) => (
                <li
                  key={`${item}-${index}`}
                  className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
                >
                  <span className="min-w-0 flex-1">{item}</span>
                  <button
                    type="button"
                    aria-label={`Remove action: ${item}`}
                    className="cursor-pointer rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                    onClick={() =>
                      setActionItems((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-1.5 text-xs text-slate-500">
            Each action becomes an assigned to-do on the customer&apos;s dashboard.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <Label htmlFor="revision-priority">Priority</Label>
            <Select
              id="revision-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as CommentPriority)}
              className="mt-1.5"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor="revision-due" optional>
              Due date
            </Label>
            <Input
              id="revision-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
