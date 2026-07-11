"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useProjectsStore } from "@/stores/projects-store";
import { ActivityFeed } from "@/components/project/activity-feed";
import { Input, Select } from "@/components/ui/input";

/** Global activity feed aggregated across all projects. */
export default function ActivityPage() {
  const projects = useProjectsStore((s) => s.projects);
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");

  const projectNames = useMemo(
    () => new Map(projects.map((p) => [p.id, p.name])),
    [projects],
  );

  const entries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects
      .filter((p) => projectFilter === "all" || p.id === projectFilter)
      .flatMap((p) => p.activity)
      .filter(
        (e) =>
          !q ||
          e.message.toLowerCase().includes(q) ||
          e.actorName.toLowerCase().includes(q) ||
          (projectNames.get(e.projectId) ?? "").toLowerCase().includes(q),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 100);
  }, [projects, projectFilter, query, projectNames]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">Activity</h1>
        <p className="mt-1 text-sm text-slate-500">
          Recent actions across all of your projects.
        </p>
      </div>

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
        <div className="w-56">
          <Select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            aria-label="Filter by project"
          >
            <option value="all">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <ActivityFeed
        entries={entries}
        showProjectName
        projectNames={projectNames}
        emptyDescription="Create or edit a project and its actions will show up here."
      />
    </div>
  );
}
