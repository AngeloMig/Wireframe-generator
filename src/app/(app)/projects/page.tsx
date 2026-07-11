"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FolderKanban, Plus, Search, SearchX } from "lucide-react";
import { PROJECT_STATUS_META } from "@/config/labels";
import { useProjectsStore } from "@/stores/projects-store";
import type { ProjectStatus } from "@/types";
import { ProjectCard } from "@/components/project/project-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";

const STATUS_FILTERS: (ProjectStatus | "all" | "active")[] = [
  "active",
  "all",
  "draft",
  "customer-editing",
  "ready-for-review",
  "agency-reviewing",
  "revisions-requested",
  "awaiting-approval",
  "approved",
  "in-development",
  "completed",
  "archived",
];

export default function ProjectsPage() {
  const projects = useProjectsStore((s) => s.projects);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("active");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects
      .filter((p) => {
        if (statusFilter === "active") return p.status !== "archived";
        if (statusFilter === "all") return true;
        return p.status === statusFilter;
      })
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.companyName.toLowerCase().includes(q) ||
          p.websiteType.toLowerCase().includes(q),
      )
      .sort((a, b) => b.lastEditedAt.localeCompare(a.lastEditedAt));
  }, [projects, query, statusFilter]);

  const hasProjects = projects.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">
            All of your website blueprints in one place.
          </p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="size-4" aria-hidden />
            New Blueprint
          </Button>
        </Link>
      </div>

      {hasProjects && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-56 flex-1">
            <Search
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, company, or type…"
              className="pl-9"
              aria-label="Search projects"
            />
          </div>
          <div className="w-56">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_FILTERS)[number])}
              aria-label="Filter by status"
            >
              <option value="active">All active</option>
              <option value="all">All (including archived)</option>
              {STATUS_FILTERS.filter((s) => s !== "all" && s !== "active").map((status) => (
                <option key={status} value={status}>
                  {PROJECT_STATUS_META[status as ProjectStatus].label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}

      {!hasProjects ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first website blueprint to start planning pages and sections."
          action={
            <Link href="/projects/new">
              <Button>
                <Plus className="size-4" aria-hidden />
                Create New Blueprint
              </Button>
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No matching projects"
          description="Try a different search term or change the status filter."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setStatusFilter("active");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
