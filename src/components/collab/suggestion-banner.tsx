"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Lightbulb, X } from "lucide-react";
import { getVariation } from "@/data/section-variations";
import { brandTheme } from "@/lib/editor-utils";
import { respondToSuggestion } from "@/lib/collab-service";
import { switchSectionVariation } from "@/lib/sections";
import { selectProjectMembers, useMembersStore } from "@/stores/members-store";
import {
  selectProjectSuggestions,
  useSuggestionsStore,
} from "@/stores/suggestions-store";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import type { Project, ProjectPage, SectionVariationSuggestion } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label, Textarea } from "@/components/ui/input";
import { ScaledPreview } from "@/components/collab/scaled-preview";
import { WireProvider } from "@/components/editor/wireframes/primitives";
import { SectionRenderer } from "@/components/editor/wireframes/section-renderer";

/**
 * Banner over the editor canvas when the current page has pending design
 * suggestions from the agency. Customers can preview side-by-side, accept
 * (content preserved), decline, and leave a reply.
 */
export function SuggestionBanner({
  project,
  page,
}: {
  project: Project;
  page: ProjectPage;
}) {
  const load = useSuggestionsStore((s) => s.load);
  const suggestions = useSuggestionsStore((s) => selectProjectSuggestions(s, project.id));
  const loadMembers = useMembersStore((s) => s.load);
  const members = useMembersStore((s) => selectProjectMembers(s, project.id));
  const [reviewing, setReviewing] = useState<SectionVariationSuggestion | null>(null);

  useEffect(() => {
    void load(project.id);
    void loadMembers(project.id);
  }, [project.id, load, loadMembers]);

  const pending = suggestions.filter(
    (s) => s.status === "pending" && s.pageId === page.id,
  );
  if (pending.length === 0) return null;

  const first = pending[0];
  const author = members.find((m) => m.userId === first.createdById);
  const suggested = getVariation(first.suggestedVariationId);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-violet-200 bg-violet-50 px-4 py-2">
        <Lightbulb className="size-4 shrink-0 text-violet-500" aria-hidden />
        <p className="min-w-0 flex-1 text-xs text-violet-900">
          <span className="font-semibold">{author?.name ?? "The agency"}</span> suggested
          the <span className="font-semibold">{suggested?.name ?? "a different"}</span>{" "}
          design for a section on this page
          {pending.length > 1 && ` (+${pending.length - 1} more)`}.
        </p>
        <Button size="sm" variant="outline" onClick={() => setReviewing(first)}>
          Review suggestion
        </Button>
      </div>

      {reviewing && (
        <SuggestionDialog
          project={project}
          page={page}
          suggestion={reviewing}
          authorName={author?.name ?? "The agency"}
          onClose={() => setReviewing(null)}
        />
      )}
    </>
  );
}

export function SuggestionDialog({
  project,
  page,
  suggestion,
  authorName,
  onClose,
}: {
  project: Project;
  page: ProjectPage;
  suggestion: SectionVariationSuggestion;
  authorName: string;
  onClose: () => void;
}) {
  const user = useSessionStore((s) => s.user);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const section = page.sections.find((s) => s.id === suggestion.sectionId);
  const current = getVariation(suggestion.currentVariationId);
  const suggested = getVariation(suggestion.suggestedVariationId);
  const theme = useMemo(() => brandTheme(project), [project]);

  const previewSection = useMemo(() => {
    if (!section || !suggested) return null;
    return switchSectionVariation(structuredClone(section), suggested);
  }, [section, suggested]);

  const respond = async (status: "accepted" | "declined") => {
    if (busy) return;
    setBusy(true);
    try {
      const { accepted } = await respondToSuggestion(project, suggestion, user, {
        status,
        message: reply.trim() || undefined,
      });
      toast(
        accepted ? "Suggestion applied" : "Suggestion declined",
        accepted ? "success" : "info",
        accepted ? "Your content was preserved — only the design changed." : undefined,
      );
      onClose();
    } catch {
      toast("Could not respond to the suggestion", "error");
    } finally {
      setBusy(false);
    }
  };

  const canRespond = user.role === "customer" || user.role === "admin";

  return (
    <Dialog
      open
      onClose={onClose}
      title={`${authorName} suggests: ${suggested?.name ?? "a new design"}`}
      description={suggestion.message || "Compare the current design with the suggestion."}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Close
          </Button>
          {canRespond && (
            <>
              <Button variant="outline" disabled={busy} onClick={() => void respond("declined")}>
                <X className="size-4" aria-hidden />
                Decline
              </Button>
              <Button disabled={busy} onClick={() => void respond("accepted")}>
                <Check className="size-4" aria-hidden />
                Accept suggestion
              </Button>
            </>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <figure>
            <figcaption className="mb-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Current — {current?.name ?? "your design"}
            </figcaption>
            <ScaledPreview className="rounded-lg border border-slate-200">
              {section && (
                <WireProvider value={{ styled: false, theme, device: "desktop" }}>
                  <SectionRenderer section={section} />
                </WireProvider>
              )}
            </ScaledPreview>
          </figure>
          <figure>
            <figcaption className="mb-1.5 text-xs font-semibold tracking-wide text-violet-600 uppercase">
              Suggested — {suggested?.name ?? "new design"}
            </figcaption>
            <ScaledPreview className="rounded-lg border-2 border-violet-300">
              {previewSection && (
                <WireProvider value={{ styled: false, theme, device: "desktop" }}>
                  <SectionRenderer section={previewSection} />
                </WireProvider>
              )}
            </ScaledPreview>
          </figure>
        </div>

        <p className="text-xs text-slate-500">
          Accepting keeps everything you&apos;ve written — the shared content works with
          both designs. You can undo afterwards.
        </p>

        {canRespond && (
          <div>
            <Label htmlFor="suggestion-reply">Reply (optional)</Label>
            <Textarea
              id="suggestion-reply"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={2}
              className="mt-1.5"
              placeholder={`Let ${authorName} know what you think…`}
            />
          </div>
        )}
      </div>
    </Dialog>
  );
}
