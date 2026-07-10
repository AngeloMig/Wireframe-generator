"use client";

import { useId } from "react";
import { QUICK_NOTE_OPTIONS } from "@/config/options";
import type { PageSection, SectionNotes } from "@/types";
import { cn } from "@/utils/cn";
import { Label, Select, Textarea } from "@/components/ui/input";
import type { SectionMutator } from "./inspector-types";

/** Customer guidance for the agency: notes, statuses, and quick flags. */
export function NotesTab({
  section,
  onChange,
}: {
  section: PageSection;
  onChange: SectionMutator;
}) {
  const noteId = useId();
  const statusId = useId();
  const imageId = useId();
  const questionId = useId();

  const setNotes = (patch: Partial<SectionNotes>, editKey?: string) =>
    onChange((s) => ({ ...s, notes: { ...s.notes, ...patch } }), editKey);

  const toggleQuickNote = (note: string) => {
    const active = section.notes.quickNotes.includes(note);
    setNotes({
      quickNotes: active
        ? section.notes.quickNotes.filter((n) => n !== note)
        : [...section.notes.quickNotes, note],
    });
  };

  return (
    <div className="space-y-4 p-4">
      <div>
        <Label htmlFor={noteId} className="mb-1.5 text-xs">
          Note for the agency
        </Label>
        <Textarea
          id={noteId}
          rows={3}
          value={section.notes.customerNote}
          placeholder="Anything the agency should know about this section…"
          onChange={(e) =>
            setNotes({ customerNote: e.target.value }, `notes:${section.id}:customerNote`)
          }
          className="text-xs"
        />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-slate-700">Quick notes</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_NOTE_OPTIONS.map((note) => {
            const active = section.notes.quickNotes.includes(note);
            return (
              <button
                key={note}
                type="button"
                aria-pressed={active}
                onClick={() => toggleQuickNote(note)}
                className={cn(
                  "cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  active
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800",
                )}
              >
                {note}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label htmlFor={statusId} className="mb-1.5 text-xs">
          Content status
        </Label>
        <Select
          id={statusId}
          value={section.notes.contentStatus}
          onChange={(e) =>
            setNotes({ contentStatus: e.target.value as SectionNotes["contentStatus"] })
          }
          className="h-8 text-xs"
        >
          <option value="not-started">Not started</option>
          <option value="draft">Draft copy</option>
          <option value="needs-review">Needs review</option>
          <option value="final">Final</option>
        </Select>
      </div>

      <div>
        <Label htmlFor={imageId} className="mb-1.5 text-xs">
          Image requirement
        </Label>
        <Select
          id={imageId}
          value={section.notes.imageRequirement}
          onChange={(e) =>
            setNotes({ imageRequirement: e.target.value as SectionNotes["imageRequirement"] })
          }
          className="h-8 text-xs"
        >
          <option value="none">No image needed</option>
          <option value="customer-provides">We&apos;ll provide the image</option>
          <option value="agency-sources">Agency sources the image</option>
          <option value="stock-ok">Stock photography is fine</option>
        </Select>
      </div>

      <div>
        <Label htmlFor={questionId} className="mb-1.5 text-xs">
          Question for the agency
        </Label>
        <Textarea
          id={questionId}
          rows={2}
          value={section.notes.agencyQuestion}
          placeholder="e.g. Would a video work better here?"
          onChange={(e) =>
            setNotes({ agencyQuestion: e.target.value }, `notes:${section.id}:agencyQuestion`)
          }
          className="text-xs"
        />
      </div>
    </div>
  );
}
