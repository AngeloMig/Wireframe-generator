"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useProjectsStore } from "@/stores/projects-store";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  new: "New Project",
  overview: "Overview",
  questionnaire: "Questionnaire",
  sitemap: "Sitemap",
  editor: "Editor",
  assets: "Assets",
  activity: "Activity",
  review: "Review",
  templates: "Templates",
  settings: "Settings",
  admin: "Admin",
  users: "Users",
  organizations: "Organizations",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const projects = useProjectsStore((s) => s.projects);

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const project = projects.find((p) => p.id === segment);
    const label = project?.name ?? SEGMENT_LABELS[segment] ?? segment;
    return { href, label };
  });

  if (crumbs.length <= 1) {
    return (
      <span className="truncate text-sm font-medium text-slate-900">
        {crumbs[0]?.label ?? "Dashboard"}
      </span>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex min-w-0 items-center gap-1.5">
              {index > 0 && <ChevronRight className="size-3.5 shrink-0 text-slate-300" aria-hidden />}
              {isLast ? (
                <span aria-current="page" className="truncate font-medium text-slate-900">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hidden truncate text-slate-500 hover:text-slate-900 sm:block"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
