"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  ClipboardCheck,
  Lightbulb,
  MessageSquarePlus,
  Palette,
  PencilRuler,
  Play,
  RefreshCcw,
  Send,
  Wrench,
} from "lucide-react";
import {
  PAGE_TYPE_LABELS,
  SECTION_REVIEW_STATUS_META,
  SECTION_TYPE_LABELS,
} from "@/config/labels";
import { getVariation } from "@/data/section-variations";
import { brandTheme } from "@/lib/editor-utils";
import {
  sendForCustomerApproval,
  startAgencyReview,
  unlockSection,
} from "@/lib/collab-service";
import {
  canRequestRevisions,
  canReviewAsAgency,
  canSendForCustomerApproval,
} from "@/lib/permissions";
import { withActivity } from "@/lib/project-utils";
import {
  availableTransitions,
  SECTION_TRANSITIONS,
} from "@/lib/review-transitions";
import { useProject } from "@/hooks/use-project";
import { useCollabUiStore } from "@/stores/collab-ui-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import type { PageSection, SectionReviewStatus } from "@/types";
import { cn } from "@/utils/cn";
import { Badge, PageStatusBadge, ProjectStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import {
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "@/components/ui/dropdown-menu";
import { Label, Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { CollaborationPanel } from "@/components/collab/collaboration-panel";
import { RevisionRequestDialog } from "@/components/collab/revision-request-dialog";
import { ScaledPreview } from "@/components/collab/scaled-preview";
import { SuggestVariationDialog } from "@/components/collab/suggest-variation-dialog";
import { WireProvider } from "@/components/editor/wireframes/primitives";
import { SectionRenderer } from "@/components/editor/wireframes/section-renderer";

/**
 * Agency Review Mode: everything the agency needs to review a submitted
 * blueprint — read-only wireframes, per-section review controls, customer
 * context, and the review workflow actions. Direct edits go through the
 * explicit "Edit Wireframe" action.
 */
export default function AgencyReviewPage() {
  const { project, projectId } = useProject();
  const user = useSessionStore((s) => s.user);
  const updateProject = useProjectsStore((s) => s.updateProject);
  const openComposer = useCollabUiStore((s) => s.openComposer);

  const [pageId, setPageId] = useState<string | null>(null);
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const [suggestTarget, setSuggestTarget] = useState<PageSection | null>(null);
  const [statusPrompt, setStatusPrompt] = useState<{
    section: PageSection;
    to: SectionReviewStatus;
    label: string;
  } | null>(null);

  const page = useMemo(() => {
    if (!project) return null;
    return (
      project.pages.find((p) => p.id === pageId) ??
      project.pages.find((p) => p.isHomepage) ??
      project.pages[0] ??
      null
    );
  }, [project, pageId]);

  const theme = useMemo(() => (project ? brandTheme(project) : null), [project]);

  useEffect(() => {
    if (project && user.role === "customer") {
      // Customers land on their own review page instead.
      window.location.replace(`/projects/${project.id}/review`);
    }
  }, [project, user.role]);

  if (!project) return null;
  if (!canReviewAsAgency(user.role)) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="Agency review is for the agency team"
        description="Switch to an agency role from the user menu to review this blueprint."
      />
    );
  }

  const q = project.questionnaire;
  const ordered = page ? [...page.sections].sort((a, b) => a.order - b.order) : [];
  const contentWarnings = ordered.filter(
    (s) => s.notes.contentStatus === "not-started" || s.notes.contentStatus === "draft",
  ).length;

  const applySectionStatus = (
    section: PageSection,
    to: SectionReviewStatus,
    note?: string,
  ) => {
    if (!page) return;
    const name =
      getVariation(section.variationId)?.name ?? SECTION_TYPE_LABELS[section.sectionType];
    updateProject(
      projectId,
      (p) =>
        withActivity(
          {
            ...p,
            pages: p.pages.map((pg) =>
              pg.id === page.id
                ? {
                    ...pg,
                    sections: pg.sections.map((s) =>
                      s.id === section.id ? { ...s, reviewStatus: to } : s,
                    ),
                  }
                : pg,
            ),
          },
          "status-changed",
          `${name} on ${page.name} → ${SECTION_REVIEW_STATUS_META[to].label}${note ? ` — ${note}` : ""}`,
          user,
        ),
      { immediate: true },
    );
    toast(`Section marked ${SECTION_REVIEW_STATUS_META[to].label}`, "success");
  };

  return (
    <div className="space-y-6">
      {/* Header: status + workflow actions */}
      <Card>
        <CardBody className="flex flex-wrap items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-base font-semibold tracking-tight text-slate-900">Agency Review</h1>
              <ProjectStatusBadge status={project.status} />
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {project.companyName} · {project.websiteType} ·{" "}
              {q.platform === "not-sure" ? "Platform TBD" : q.platform}
            </p>
            {project.latestSubmissionNote && (
              <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span className="font-medium">Submission note:</span>{" "}
                {project.latestSubmissionNote}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {project.status === "ready-for-review" && (
              <Button
                onClick={() =>
                  void startAgencyReview(project, user).then(() =>
                    toast("Review started", "success"),
                  )
                }
              >
                <Play className="size-4" aria-hidden />
                Start review
              </Button>
            )}
            {canRequestRevisions(user.role) &&
              (project.status === "agency-reviewing" ||
                project.status === "ready-for-review") && (
                <Button variant="outline" onClick={() => setRevisionsOpen(true)}>
                  <RefreshCcw className="size-4" aria-hidden />
                  Request revisions
                </Button>
              )}
            {canSendForCustomerApproval(user.role) &&
              project.status === "agency-reviewing" && (
                <Button
                  onClick={() =>
                    void sendForCustomerApproval(project, user).then(() =>
                      toast("Sent for customer approval", "success"),
                    )
                  }
                >
                  <Send className="size-4" aria-hidden />
                  Send for approval
                </Button>
              )}
            <Link href={`/projects/${projectId}/editor${page ? `?page=${page.id}` : ""}`}>
              <Button variant="outline">
                <PencilRuler className="size-4" aria-hidden />
                Edit Wireframe
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Left: page review */}
        <div className="space-y-4 xl:col-span-2">
          {/* Page tabs */}
          <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Pages">
            {[...project.pages]
              .sort((a, b) => Number(b.isHomepage) - Number(a.isHomepage) || a.order - b.order)
              .map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={page?.id === p.id}
                  onClick={() => setPageId(p.id)}
                  className={cn(
                    "flex shrink-0 cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                    page?.id === p.id
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50",
                  )}
                >
                  {p.name}
                  <span
                    className={cn(
                      "text-xs",
                      page?.id === p.id ? "text-indigo-200" : "text-slate-400",
                    )}
                  >
                    {p.sections.length}
                  </span>
                </button>
              ))}
          </div>

          {page && (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <PageStatusBadge status={page.status} />
              <span className="text-slate-500">
                {PAGE_TYPE_LABELS[page.type]} · {ordered.length} sections
              </span>
              {contentWarnings > 0 && (
                <span className="inline-flex items-center gap-1 text-amber-700">
                  <AlertTriangle className="size-3.5" aria-hidden />
                  {contentWarnings} section{contentWarnings === 1 ? "" : "s"} with
                  incomplete content
                </span>
              )}
            </div>
          )}

          {/* Sections with review controls */}
          {page && theme && ordered.length > 0 ? (
            <div className="space-y-4">
              {ordered.map((section) => {
                const variation = getVariation(section.variationId);
                const name =
                  variation?.name ?? SECTION_TYPE_LABELS[section.sectionType];
                const statusMeta = SECTION_REVIEW_STATUS_META[section.reviewStatus];
                const transitions = availableTransitions(
                  SECTION_TRANSITIONS,
                  section.reviewStatus,
                  user.role,
                );
                return (
                  <div
                    key={section.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-2.5">
                      <span className="text-sm font-semibold text-slate-800">{name}</span>
                      <Badge className={statusMeta.badgeClass}>{statusMeta.label}</Badge>
                      {section.notes.customerNote && (
                        <span className="text-xs text-slate-500">Customer note ↓</span>
                      )}
                      <div className="ml-auto flex flex-wrap items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Add feedback on ${name}`}
                          title="Add feedback"
                          onClick={() =>
                            openComposer({ pageId: page.id, sectionId: section.id })
                          }
                        >
                          <MessageSquarePlus className="size-4" aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Suggest a different design for ${name}`}
                          title="Suggest a different design"
                          onClick={() => setSuggestTarget(section)}
                        >
                          <Lightbulb className="size-4" aria-hidden />
                        </Button>
                        {transitions.length > 0 && (
                          <DropdownMenu
                            align="end"
                            className="w-64"
                            trigger={(props) => (
                              <Button variant="outline" size="sm" {...props}>
                                Set status
                                <ChevronDown className="size-3.5" aria-hidden />
                              </Button>
                            )}
                          >
                            <DropdownLabel>Move to</DropdownLabel>
                            {transitions.map((t) => (
                              <DropdownItem
                                key={t.to}
                                onSelect={() => {
                                  if (t.requiresMessage) {
                                    setStatusPrompt({ section, to: t.to, label: t.label });
                                  } else {
                                    applySectionStatus(section, t.to);
                                  }
                                }}
                              >
                                {t.to === "technically-reviewed" ? (
                                  <Wrench className="size-4 text-slate-400" aria-hidden />
                                ) : t.to === "approved" ? (
                                  <BadgeCheck className="size-4 text-emerald-500" aria-hidden />
                                ) : (
                                  <ArrowRight className="size-4 text-slate-400" aria-hidden />
                                )}
                                <span className="flex-1">{t.label}</span>
                              </DropdownItem>
                            ))}
                          </DropdownMenu>
                        )}
                      </div>
                    </div>

                    {section.notes.customerNote && (
                      <p className="border-b border-amber-100 bg-amber-50/70 px-4 py-2 text-xs text-amber-900">
                        <span className="font-medium">Customer note:</span>{" "}
                        {section.notes.customerNote}
                      </p>
                    )}

                    <ScaledPreview scale={0.65} className="pointer-events-none max-h-80">
                      <WireProvider value={{ styled: false, theme, device: "desktop" }}>
                        <SectionRenderer section={section} />
                      </WireProvider>
                    </ScaledPreview>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={ClipboardCheck}
              title="Nothing to review on this page"
              description="This page has no sections yet."
            />
          )}
        </div>

        {/* Right: context + comments */}
        <div className="space-y-6">
          <Card>
            <CardBody>
              <CollaborationPanel
                project={project}
                currentPageId={page?.id}
                compact
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={
                <span className="inline-flex items-center gap-2">
                  <Palette className="size-4 text-slate-400" aria-hidden />
                  Design direction
                </span>
              }
            />
            <CardBody className="space-y-3 text-sm">
              {q.brand ? (
                <div className="flex items-center gap-2">
                  {[q.brand.primaryColor, q.brand.secondaryColor, q.brand.accentColor].map(
                    (color) => (
                      <span
                        key={color}
                        className="size-7 rounded-full border border-slate-200"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ),
                  )}
                  <span className="text-xs text-slate-500">
                    {q.brand.headingStyle} headings · {q.brand.buttonStyle} buttons ·{" "}
                    {q.brand.spacing} spacing
                  </span>
                </div>
              ) : (
                <p className="text-slate-500">No brand preferences provided.</p>
              )}
              {q.visualStyles.length > 0 && (
                <p className="text-slate-700">
                  <span className="text-xs text-slate-500">Styles:</span>{" "}
                  {q.visualStyles.join(", ")}
                </p>
              )}
              {q.mainGoal && (
                <p className="text-slate-700">
                  <span className="text-xs text-slate-500">Main goal:</span> {q.mainGoal}
                </p>
              )}
              {q.targetAudience && (
                <p className="text-slate-700">
                  <span className="text-xs text-slate-500">Audience:</span>{" "}
                  {q.targetAudience}
                </p>
              )}
              <Link
                href={`/projects/${projectId}/questionnaire`}
                className="inline-block text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                Full questionnaire →
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Sitemap" />
            <CardBody>
              <ul className="space-y-1.5 text-sm">
                {[...project.pages]
                  .sort(
                    (a, b) =>
                      Number(b.isHomepage) - Number(a.isHomepage) || a.order - b.order,
                  )
                  .map((p) => (
                    <li key={p.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        className="cursor-pointer truncate text-slate-700 hover:text-indigo-700"
                        onClick={() => setPageId(p.id)}
                      >
                        {p.name}
                      </button>
                      <span className="ml-auto">
                        <PageStatusBadge status={p.status} />
                      </span>
                    </li>
                  ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>

      <RevisionRequestDialog
        project={project}
        open={revisionsOpen}
        onClose={() => setRevisionsOpen(false)}
      />

      {suggestTarget && page && (
        <SuggestVariationDialog
          project={project}
          page={page}
          section={suggestTarget}
          open
          onClose={() => setSuggestTarget(null)}
        />
      )}

      <SectionStatusPromptDialog
        prompt={statusPrompt}
        onClose={() => setStatusPrompt(null)}
        onConfirm={(note) => {
          if (statusPrompt && page) {
            const unlocking =
              statusPrompt.section.reviewStatus === "approved" &&
              statusPrompt.to === "revisions-requested";
            if (unlocking) {
              // Unlocking an approved section revokes its approval, creates a
              // version, and notifies the customer — the full controlled flow.
              void unlockSection(project, page, statusPrompt.section.id, user, note).then(
                () => toast("Section unlocked", "success"),
              );
            } else {
              applySectionStatus(statusPrompt.section, statusPrompt.to, note);
              // File the explanation as a section comment so it's discussable.
              openComposer({ pageId: page.id, sectionId: statusPrompt.section.id });
            }
          }
          setStatusPrompt(null);
        }}
      />
    </div>
  );
}

function SectionStatusPromptDialog({
  prompt,
  onClose,
  onConfirm,
}: {
  prompt: { section: PageSection; to: SectionReviewStatus; label: string } | null;
  onClose: () => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  return (
    <Dialog
      open={prompt !== null}
      onClose={onClose}
      title={prompt?.label ?? "Update status"}
      description="A short explanation is required so the customer knows what to change."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!note.trim()}
            onClick={() => {
              onConfirm(note.trim());
              setNote("");
            }}
          >
            Confirm
          </Button>
        </>
      }
    >
      <Label htmlFor="section-status-note">What needs to change?</Label>
      <Textarea
        id="section-status-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        className="mt-1.5"
        autoFocus
      />
    </Dialog>
  );
}
