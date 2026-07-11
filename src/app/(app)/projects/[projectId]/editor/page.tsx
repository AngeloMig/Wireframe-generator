"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, LifeBuoy, MessageSquare, MonitorSmartphone, Send } from "lucide-react";
import { writeLastOpened } from "@/lib/customer-workspace";
import { brandTheme, setContentValue } from "@/lib/editor-utils";
import { canEditProjectContent } from "@/lib/permissions";
import { useProject } from "@/hooks/use-project";
import { useEditorStore } from "@/stores/editor-store";
import { useSessionStore } from "@/stores/session-store";
import { AskAgencyDialog } from "@/components/customer/ask-agency-dialog";
import { CollaborationPanel } from "@/components/collab/collaboration-panel";
import { SubmissionDialog } from "@/components/collab/submission-dialog";
import { Editor } from "@/components/editor/editor";
import { SectionRenderer } from "@/components/editor/wireframes/section-renderer";
import { InlineEditProvider, WireProvider } from "@/components/editor/wireframes/primitives";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/input";
import { PageSkeleton } from "@/components/ui/skeleton";
import { SaveIndicator } from "@/components/project/save-indicator";

export default function EditorPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <EditorRoute />
    </Suspense>
  );
}

function EditorRoute() {
  const { project, projectId } = useProject();
  const searchParams = useSearchParams();
  const pageParam = searchParams.get("page");
  const isCustomer = useSessionStore((s) => s.user.role === "customer");

  const page = useMemo(() => {
    if (!project) return null;
    return (
      project.pages.find((p) => p.id === pageParam) ??
      project.pages.find((p) => p.isHomepage) ??
      project.pages[0] ??
      null
    );
  }, [project, pageParam]);

  // "Continue where you left off" for the focused customer workspace.
  useEffect(() => {
    if (isCustomer && project && page) writeLastOpened(project.id, page.id);
  }, [isCustomer, project, page]);

  if (!project) return null; // ProjectShell handles loading and not-found.

  if (!page) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm font-semibold text-slate-700">This project has no pages yet</p>
        {isCustomer ? (
          <p className="max-w-sm text-sm text-slate-500">
            Your agency is still setting this project up. Check back soon, or get in
            touch with them if you think something is missing.
          </p>
        ) : (
          <>
            <p className="max-w-sm text-sm text-slate-500">
              Add a homepage from the sitemap first, then come back to build its wireframe.
            </p>
            <Link href={`/projects/${projectId}/sitemap`}>
              <Button>Go to the sitemap</Button>
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Full editor: desktop and large screens */}
      <div className="hidden lg:block">
        <Editor
          project={project}
          page={page}
          initialSectionId={searchParams.get("section")}
        />
      </div>

      {/* Small screens: toolbar + preview with tap-to-edit text */}
      <MobileEditor project={project} page={page} projectId={projectId} isCustomer={isCustomer} />
    </>
  );
}

/**
 * Phone-sized editing: review, tap text to edit, comment, ask, and submit.
 * Section rearrangement stays desktop-only — the notice says so.
 */
function MobileEditor({
  project,
  page,
  projectId,
  isCustomer,
}: {
  project: NonNullable<ReturnType<typeof useProject>["project"]>;
  page: NonNullable<ReturnType<typeof useProject>["project"]>["pages"][number];
  projectId: string;
  isCustomer: boolean;
}) {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const applySections = useEditorStore((s) => s.applySections);
  const [commentOpen, setCommentOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);

  const canEdit = canEditProjectContent(user.role, project.status);
  const submissionMode =
    project.status === "revisions-requested" || project.status === "customer-revising"
      ? ("revisions" as const)
      : ("review" as const);

  return (
    <div className="lg:hidden">
      <div className="sticky top-0 z-30 space-y-2 border-b border-[var(--border-default)] bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Select
            value={page.id}
            onChange={(e) =>
              router.replace(`/projects/${projectId}/editor?page=${e.target.value}`, {
                scroll: false,
              })
            }
            aria-label="Current page"
            className="h-8 flex-1 text-xs"
          >
            {[...project.pages]
              .sort((a, b) => Number(b.isHomepage) - Number(a.isHomepage) || a.order - b.order)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </Select>
          <SaveIndicator />
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={() => setCommentOpen(true)}>
            <MessageSquare className="size-3.5" aria-hidden />
            Comments
          </Button>
          {isCustomer && canEdit && (
            <Button size="sm" onClick={() => setSubmitOpen(true)}>
              <Send className="size-3.5" aria-hidden />
              {submissionMode === "revisions" ? "Submit changes" : "Submit for review"}
            </Button>
          )}
          {isCustomer && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setAskOpen(true)}
              aria-label="Ask the agency for help"
            >
              <LifeBuoy className="size-4" aria-hidden />
            </Button>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <MonitorSmartphone className="mt-0.5 size-5 shrink-0 text-indigo-600" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Best edited on desktop
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              {canEdit
                ? "Here you can review, tap any text to edit it, comment, and submit. To rearrange or add sections, open this project on a larger screen."
                : "You can review the wireframe and comment below. Editing is currently paused."}
            </p>
            {!isCustomer && (
              <Link
                href={`/projects/${projectId}/overview`}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700"
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                Back to the project overview
              </Link>
            )}
          </div>
        </div>
        <p className="mb-2 text-xs font-medium text-slate-500">
          {page.name} · {page.sections.length}{" "}
          {page.sections.length === 1 ? "section" : "sections"}
        </p>
        <WireProvider value={{ styled: false, theme: brandTheme(project), device: "mobile" }}>
          <div className="overflow-hidden rounded-xl bg-white shadow ring-1 ring-slate-200">
            {[...page.sections]
              .sort((a, b) => a.order - b.order)
              .filter((s) => !s.isHidden)
              .map((section) => (
                <InlineEditProvider
                  key={section.id}
                  value={
                    canEdit && !section.isLocked && !section.approvalLocked
                      ? {
                          onEdit: (path, value) =>
                            applySections(project.id, (sections) =>
                              sections.map((s) =>
                                s.id === section.id
                                  ? { ...s, content: setContentValue(s.content, path, value) }
                                  : s,
                              ),
                            ),
                        }
                      : null
                  }
                >
                  <SectionRenderer section={section} />
                </InlineEditProvider>
              ))}
          </div>
        </WireProvider>
      </div>

      <Dialog
        open={commentOpen}
        onClose={() => setCommentOpen(false)}
        title="Comments"
        size="lg"
      >
        <CollaborationPanel project={project} currentPageId={page.id} compact />
      </Dialog>
      {isCustomer && (
        <>
          <SubmissionDialog
            project={project}
            open={submitOpen}
            onClose={() => setSubmitOpen(false)}
            mode={submissionMode}
          />
          <AskAgencyDialog
            project={project}
            page={page}
            open={askOpen}
            onClose={() => setAskOpen(false)}
          />
        </>
      )}
    </div>
  );
}
