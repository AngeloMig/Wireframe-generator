"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FolderKanban,
  Plus,
  Sparkles,
} from "lucide-react";
import { PROJECT_STATUS_META, ROLE_LABELS } from "@/config/labels";
import { nextRecommendedAction } from "@/lib/project-utils";
import { useProjectsStore } from "@/stores/projects-store";
import { useSessionStore } from "@/stores/session-store";
import type { Project, ProjectStatus } from "@/types";
import { ProjectCard } from "@/components/project/project-card";
import { ProjectStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

const ACTION_STATUSES: ProjectStatus[] = ["revisions-requested", "awaiting-approval"];
const AGENCY_ACTION_STATUSES: ProjectStatus[] = ["ready-for-review", "agency-reviewing"];

function StatusSummary({ projects }: { projects: Project[] }) {
  const counts = new Map<ProjectStatus, number>();
  projects.forEach((p) => counts.set(p.status, (counts.get(p.status) ?? 0) + 1));
  const entries = Array.from(counts.entries());
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([status, count]) => (
        <span
          key={status}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm"
        >
          <span className="font-semibold text-slate-900">{count}</span>
          <span className="text-slate-500">{PROJECT_STATUS_META[status].label}</span>
        </span>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const projects = useProjectsStore((s) => s.projects);
  const user = useSessionStore((s) => s.user);
  const isAgencySide = user.role !== "customer";

  const visible = useMemo(
    () => projects.filter((p) => p.status !== "archived"),
    [projects],
  );

  const needsAction = useMemo(() => {
    const statuses = isAgencySide ? AGENCY_ACTION_STATUSES : ACTION_STATUSES;
    return visible.filter((p) => statuses.includes(p.status));
  }, [visible, isAgencySide]);

  const recent = useMemo(
    () =>
      [...visible].sort((a, b) => b.lastEditedAt.localeCompare(a.lastEditedAt)).slice(0, 6),
    [visible],
  );

  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isAgencySide
              ? `You're viewing as ${ROLE_LABELS[user.role]} — review customer blueprints and keep projects moving.`
              : "Plan your website section by section, then send it to the agency for review."}
          </p>
        </div>
        <Link href="/projects/new">
          <Button size="lg">
            <Plus className="size-4.5" aria-hidden />
            Create New Blueprint
          </Button>
        </Link>
      </div>

      <StatusSummary projects={visible} />

      {needsAction.length > 0 && (
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <AlertCircle className="size-4 text-amber-500" aria-hidden />
                {isAgencySide ? "Waiting on the agency" : "Needs your attention"}
              </span>
            }
            description={
              isAgencySide
                ? "Projects submitted by customers and awaiting review."
                : "Projects with feedback or approvals waiting for you."
            }
          />
          <CardBody className="divide-y divide-slate-100 p-0">
            {needsAction.map((project) => {
              const action = nextRecommendedAction(project);
              return (
                <div
                  key={project.id}
                  className="flex flex-wrap items-center gap-3 px-5 py-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/projects/${project.id}/overview`}
                      className="text-sm font-medium text-slate-900 hover:text-indigo-700"
                    >
                      {project.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-500">{action.description}</p>
                  </div>
                  <ProjectStatusBadge status={project.status} />
                  <Link href={action.href}>
                    <Button variant="outline" size="sm">
                      {isAgencySide ? "Open project" : action.label}
                      <ArrowRight className="size-3.5" aria-hidden />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </CardBody>
        </Card>
      )}

      <section aria-labelledby="recent-projects-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="recent-projects-heading"
            className="inline-flex items-center gap-2 text-base font-semibold text-slate-900"
          >
            <Clock className="size-4 text-slate-400" aria-hidden />
            Recently edited
          </h2>
          {visible.length > 0 && (
            <Link
              href="/projects"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              View all projects
            </Link>
          )}
        </div>
        {recent.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create your first website blueprint — a guided wizard will walk you through it in a few minutes."
            action={
              <Link href="/projects/new">
                <Button>
                  <Sparkles className="size-4" aria-hidden />
                  Create your first blueprint
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recent.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      {!isAgencySide && visible.length > 0 && (
        <Card>
          <CardBody className="flex flex-wrap items-center gap-3">
            <CheckCircle2 className="size-5 text-emerald-500" aria-hidden />
            <p className="flex-1 text-sm text-slate-600">
              Everything you build is saved automatically in this browser. When you&apos;re
              happy with a blueprint, submit it from the project&apos;s review page.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
