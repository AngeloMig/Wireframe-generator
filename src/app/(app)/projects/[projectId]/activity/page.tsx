"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useProject } from "@/hooks/use-project";
import { ActivityFeed } from "@/components/project/activity-feed";
import { Input, Select } from "@/components/ui/input";
import type { ActivityType } from "@/types";

const TYPE_FILTERS: { value: ActivityType | "all"; label: string }[] = [
  { value: "all", label: "All activity" },
  { value: "page-added", label: "Pages added" },
  { value: "page-updated", label: "Pages updated" },
  { value: "page-deleted", label: "Pages deleted" },
  { value: "project-submitted", label: "Submissions" },
  { value: "comment-created", label: "Comments" },
  { value: "status-changed", label: "Status changes" },
  { value: "asset-added", label: "Assets" },
];

export default function ProjectActivityPage() {
  const { project } = useProject();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ActivityType | "all">("all");

  const entries = useMemo(() => {
    if (!project) return [];
    const q = query.trim().toLowerCase();
    return project.activity
      .filter((e) => typeFilter === "all" || e.type === typeFilter)
      .filter(
        (e) =>
          !q ||
          e.message.toLowerCase().includes(q) ||
          e.actorName.toLowerCase().includes(q),
      );
  }, [project, query, typeFilter]);

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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ActivityType | "all")}
              aria-label="Filter by activity type"
            >
              {TYPE_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
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
