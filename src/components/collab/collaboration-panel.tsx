"use client";

import { useEffect, useMemo, useState } from "react";
import { ListFilter, MessageSquarePlus, MessagesSquare, SlidersHorizontal } from "lucide-react";
import { canViewInternalNotes } from "@/lib/permissions";
import { selectProjectComments, useCommentsStore } from "@/stores/comments-store";
import { selectProjectMembers, useMembersStore } from "@/stores/members-store";
import { useCollabUiStore, type CommentQuickFilter, type CommentSort } from "@/stores/collab-ui-store";
import { useSessionStore } from "@/stores/session-store";
import type { Project, ProjectComment } from "@/types";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/input";
import { CommentCard } from "./comment-card";
import { CommentComposer } from "./comment-composer";

const QUICK_FILTERS: { id: CommentQuickFilter; label: string; agencyOnly?: boolean }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "assigned-to-me", label: "Assigned to me" },
  { id: "mentions", label: "Mentions" },
  { id: "action-items", label: "Action items" },
  { id: "resolved", label: "Resolved" },
  { id: "internal", label: "Internal", agencyOnly: true },
];

const SORTS: { value: CommentSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "priority", label: "Priority" },
  { value: "recently-updated", label: "Recently updated" },
  { value: "page-order", label: "Page order" },
];

const PRIORITY_RANK: Record<ProjectComment["priority"], number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

/**
 * The collaboration panel: quick filters, detailed filters, sorting, the
 * composer, and the comment list. Reused on the project overview, the page
 * editor, and review screens via the scope props.
 */
export function CollaborationPanel({
  project,
  currentPageId,
  currentSectionId,
  defaultScope,
  className,
  compact,
}: {
  project: Project;
  /** When rendered inside the editor, the page being edited. */
  currentPageId?: string;
  /** Section targeted by comment mode, if any. */
  currentSectionId?: string;
  defaultScope?: "project" | "page" | "section";
  className?: string;
  compact?: boolean;
}) {
  const user = useSessionStore((s) => s.user);
  const loadComments = useCommentsStore((s) => s.load);
  const loadMembers = useMembersStore((s) => s.load);
  const comments = useCommentsStore((s) => selectProjectComments(s, project.id));
  const members = useMembersStore((s) => selectProjectMembers(s, project.id));

  const quickFilter = useCollabUiStore((s) => s.quickFilter);
  const setQuickFilter = useCollabUiStore((s) => s.setQuickFilter);
  const filters = useCollabUiStore((s) => s.filters);
  const setFilters = useCollabUiStore((s) => s.setFilters);
  const sort = useCollabUiStore((s) => s.sort);
  const setSort = useCollabUiStore((s) => s.setSort);
  const selectedCommentId = useCollabUiStore((s) => s.selectedCommentId);
  const selectComment = useCollabUiStore((s) => s.selectComment);
  const composerOpen = useCollabUiStore((s) => s.composerOpen);
  const composerSectionId = useCollabUiStore((s) => s.composerSectionId);
  const composerPageId = useCollabUiStore((s) => s.composerPageId);
  const closeComposer = useCollabUiStore((s) => s.closeComposer);

  const [showFilters, setShowFilters] = useState(false);
  const [composing, setComposing] = useState(false);

  // Comment-mode section clicks open a targeted composer through the store.
  const targetSectionId = composerOpen ? (composerSectionId ?? undefined) : currentSectionId;
  const targetPageId = composerOpen ? (composerPageId ?? currentPageId) : currentPageId;
  const isComposing = composing || composerOpen;
  const stopComposing = () => {
    setComposing(false);
    closeComposer();
  };

  useEffect(() => {
    void loadComments(project.id);
    void loadMembers(project.id);
  }, [project.id, loadComments, loadMembers]);

  const pageOrder = useMemo(() => {
    const order = new Map<string, number>();
    [...project.pages]
      .sort((a, b) => Number(b.isHomepage) - Number(a.isHomepage) || a.order - b.order)
      .forEach((p, i) => order.set(p.id, i));
    return order;
  }, [project.pages]);

  const visible = useMemo(() => {
    let list = comments;

    // Customers never see internal agency notes.
    if (!canViewInternalNotes(user.role)) {
      list = list.filter((c) => c.visibility === "customer");
    }

    switch (quickFilter) {
      case "open":
        list = list.filter((c) => c.status === "open" || c.status === "reopened" || c.status === "in-progress");
        break;
      case "assigned-to-me":
        list = list.filter((c) => c.assignedToId === user.id);
        break;
      case "mentions":
        list = list.filter(
          (c) =>
            c.mentions.includes(user.id) ||
            c.replies.some((r) => r.mentions.includes(user.id)),
        );
        break;
      case "action-items":
        list = list.filter((c) => c.isActionItem && !c.completedAt);
        break;
      case "resolved":
        list = list.filter((c) => c.status === "resolved");
        break;
      case "internal":
        list = list.filter((c) => c.visibility === "agency");
        break;
    }

    if (filters.status !== "all") list = list.filter((c) => c.status === filters.status);
    if (filters.priority !== "all") list = list.filter((c) => c.priority === filters.priority);
    if (filters.assigneeId !== "all") list = list.filter((c) => c.assignedToId === filters.assigneeId);
    if (filters.authorId !== "all") list = list.filter((c) => c.authorId === filters.authorId);
    if (filters.visibility !== "all") list = list.filter((c) => c.visibility === filters.visibility);
    if (filters.currentPageOnly && currentPageId) {
      list = list.filter((c) => c.pageId === currentPageId || c.scope === "project");
    }
    if (filters.currentSectionOnly && currentSectionId) {
      list = list.filter((c) => c.sectionId === currentSectionId);
    }

    const sorted = [...list];
    switch (sort) {
      case "newest":
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
      case "oldest":
        sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        break;
      case "priority":
        sorted.sort(
          (a, b) =>
            PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
            b.createdAt.localeCompare(a.createdAt),
        );
        break;
      case "recently-updated":
        sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        break;
      case "page-order":
        sorted.sort((a, b) => {
          const ap = a.pageId ? (pageOrder.get(a.pageId) ?? 99) : -1;
          const bp = b.pageId ? (pageOrder.get(b.pageId) ?? 99) : -1;
          return ap - bp || b.createdAt.localeCompare(a.createdAt);
        });
        break;
    }
    return sorted;
  }, [comments, quickFilter, filters, sort, user, currentPageId, currentSectionId, pageOrder]);

  const availableQuickFilters = QUICK_FILTERS.filter(
    (f) => !f.agencyOnly || canViewInternalNotes(user.role),
  );

  return (
    <section
      className={cn("flex min-h-0 flex-col", className)}
      aria-label="Collaboration"
    >
      <div className="flex items-center justify-between gap-2 pb-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <MessagesSquare className="size-4 text-slate-400" aria-hidden />
          Comments
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">
            {visible.length}
          </span>
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Toggle filters"
            aria-pressed={showFilters}
            onClick={() => setShowFilters((v) => !v)}
            className={cn(showFilters && "bg-slate-100 text-slate-900")}
          >
            <SlidersHorizontal className="size-4" aria-hidden />
          </Button>
          <Button
            size="sm"
            onClick={() => (isComposing ? stopComposing() : setComposing(true))}
          >
            <MessageSquarePlus className="size-3.5" aria-hidden />
            {compact ? "New" : "New comment"}
          </Button>
        </div>
      </div>

      <div
        className="flex gap-1 overflow-x-auto pb-2"
        role="tablist"
        aria-label="Comment filters"
      >
        {availableQuickFilters.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={quickFilter === f.id}
            onClick={() => setQuickFilter(f.id)}
            className={cn(
              "shrink-0 cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors",
              quickFilter === f.id
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {showFilters && (
        <div className="mb-3 grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <label className="text-xs text-slate-600">
            Status
            <Select
              value={filters.status}
              className="mt-1 h-8 text-xs"
              onChange={(e) =>
                setFilters({ status: e.target.value as typeof filters.status })
              }
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="in-progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="reopened">Reopened</option>
            </Select>
          </label>
          <label className="text-xs text-slate-600">
            Priority
            <Select
              value={filters.priority}
              className="mt-1 h-8 text-xs"
              onChange={(e) =>
                setFilters({ priority: e.target.value as typeof filters.priority })
              }
            >
              <option value="all">All priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </Select>
          </label>
          <label className="text-xs text-slate-600">
            Assignee
            <Select
              value={filters.assigneeId}
              className="mt-1 h-8 text-xs"
              onChange={(e) => setFilters({ assigneeId: e.target.value })}
            >
              <option value="all">Anyone</option>
              {members.map((m) => (
                <option key={m.id} value={m.userId}>
                  {m.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-xs text-slate-600">
            Author
            <Select
              value={filters.authorId}
              className="mt-1 h-8 text-xs"
              onChange={(e) => setFilters({ authorId: e.target.value })}
            >
              <option value="all">Anyone</option>
              {members.map((m) => (
                <option key={m.id} value={m.userId}>
                  {m.name}
                </option>
              ))}
            </Select>
          </label>
          {canViewInternalNotes(user.role) && (
            <label className="text-xs text-slate-600">
              Visibility
              <Select
                value={filters.visibility}
                className="mt-1 h-8 text-xs"
                onChange={(e) =>
                  setFilters({ visibility: e.target.value as typeof filters.visibility })
                }
              >
                <option value="all">All</option>
                <option value="customer">Customer visible</option>
                <option value="agency">Agency only</option>
              </Select>
            </label>
          )}
          <label className="text-xs text-slate-600">
            Sort
            <Select
              value={sort}
              className="mt-1 h-8 text-xs"
              onChange={(e) => setSort(e.target.value as CommentSort)}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </label>
          {currentPageId && (
            <label className="col-span-2 flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={filters.currentPageOnly}
                onChange={(e) => setFilters({ currentPageOnly: e.target.checked })}
                className="size-3.5 accent-indigo-600"
              />
              Only this page
            </label>
          )}
        </div>
      )}

      {isComposing && (
        <div className="mb-3 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
          <CommentComposer
            project={project}
            members={members}
            scope={
              targetSectionId
                ? "section"
                : (defaultScope ?? (targetPageId ? "page" : "project"))
            }
            pageId={targetPageId}
            sectionId={targetSectionId}
            autoFocus
            onSubmitted={stopComposing}
            onCancel={stopComposing}
          />
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-4">
        {visible.length === 0 ? (
          <EmptyState
            icon={ListFilter}
            title={
              comments.length === 0 ? "No comments yet" : "Nothing matches these filters"
            }
            description={
              comments.length === 0
                ? "Questions, feedback, and requested actions will appear here as your team collaborates."
                : "Try a different quick filter, or clear the detailed filters."
            }
          />
        ) : (
          visible.map((comment) => (
            <div
              key={comment.id}
              className={cn(
                selectedCommentId === comment.id &&
                  "rounded-xl ring-2 ring-indigo-400 ring-offset-2",
              )}
              onClick={() => selectComment(comment.id)}
            >
              <CommentCard project={project} comment={comment} members={members} />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
