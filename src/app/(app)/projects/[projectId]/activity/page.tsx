"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useProject } from "@/hooks/use-project";
import { ActivityFeed } from "@/components/project/activity-feed";
import { Input, Select } from "@/components/ui/input";
import type { ActivityType } from "@/types";

const CATEGORY_FILTERS: { value: string; label: string; types: ActivityType[] | null }[] = [
  { value: "all", label: "All activity", types: null },
  {
    value: "comments",
    label: "Comments",
    types: [
      "comment-created",
      "comment-replied",
      "comment-resolved",
      "comment-reopened",
      "action-item-assigned",
      "action-item-completed",
    ],
  },
  {
    value: "revisions",
    label: "Revisions",
    types: ["revisions-requested", "revisions-submitted", "project-submitted", "page-submitted"],
  },
  {
    value: "approvals",
    label: "Approvals",
    types: [
      "section-approved",
      "page-approved",
      "project-approved",
      "approval-revoked",
      "section-unlocked",
      "page-unlocked",
    ],
  },
  {
    value: "versions",
    label: "Versions",
    types: ["version-created", "version-restored"],
  },
  {
    value: "suggestions",
    label: "Design suggestions",
    types: ["suggestion-created", "suggestion-accepted", "suggestion-declined"],
  },
  {
    value: "membership",
    label: "Membership",
    types: ["member-added", "member-removed", "member-role-changed"],
  },
  {
    value: "editing",
    label: "Pages & sections",
    types: [
      "page-added",
      "page-updated",
      "page-deleted",
      "section-added",
      "section-removed",
      "asset-added",
    ],
  },
];

export default function ProjectActivityPage() {
  const { project } = useProject();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [pageFilter, setPageFilter] = useState<string>("all");

  const entries = useMemo(() => {
    if (!project) return [];
    const q = query.trim().toLowerCase();
    const categoryTypes = CATEGORY_FILTERS.find((c) => c.value === category)?.types ?? null;
    return project.activity
      .filter((e) => !categoryTypes || categoryTypes.includes(e.type))
      .filter((e) => pageFilter === "all" || e.pageId === pageFilter)
      .filter(
        (e) =>
          !q ||
          e.message.toLowerCase().includes(q) ||
          e.actorName.toLowerCase().includes(q),
      );
  }, [project, query, category, pageFilter]);

  if (!project) return null; // ProjectShell handles loading and not-found.

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Project activity</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Everything that has happened on this blueprint.
        </p>
      </div>

      {project.activity.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-48 flex-1">
            <Search
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search activity…"
              className="pl-9"
              aria-label="Search activity"
            />
          </div>
          <div className="w-48">
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter by activity category"
            >
              {CATEGORY_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-44">
            <Select
              value={pageFilter}
              onChange={(e) => setPageFilter(e.target.value)}
              aria-label="Filter by page"
            >
              <option value="all">All pages</option>
              {project.pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}

      <ActivityFeed
        entries={entries}
        emptyDescription={
          project.activity.length === 0
            ? "Actions like adding pages, editing sections, and submitting for review will show up here."
            : "Nothing matches your search — try different keywords or another filter."
        }
      />
    </div>
  );
}
