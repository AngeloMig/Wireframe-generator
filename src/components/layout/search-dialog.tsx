"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, LayoutTemplate, Search, SearchX } from "lucide-react";
import { SECTION_TEMPLATES } from "@/data/section-templates";
import { SECTION_CATEGORY_LABELS } from "@/config/labels";
import { useProjectsStore } from "@/stores/projects-store";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function SearchButton() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const projects = useProjectsStore((s) => s.projects);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { projects: [], templates: [] };
    return {
      projects: projects
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) || p.companyName.toLowerCase().includes(q),
        )
        .slice(0, 5),
      templates: SECTION_TEMPLATES.filter(
        (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
      ).slice(0, 5),
    };
  }, [query, projects]);

  const hasQuery = query.trim().length > 0;
  const hasResults = results.projects.length > 0 || results.templates.length > 0;

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Search">
        <Search className="size-4.5" aria-hidden />
      </Button>
      <Dialog open={open} onClose={close} title="Search" size="lg">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects and sections…"
            className="pl-9"
            aria-label="Search projects and sections"
          />
        </div>
        <div className="mt-4 min-h-40">
          {!hasQuery && (
            <p className="py-8 text-center text-sm text-slate-500">
              Start typing to search your projects and the section library.
            </p>
          )}
          {hasQuery && !hasResults && (
            <div className="flex flex-col items-center py-8 text-center">
              <SearchX className="size-6 text-slate-300" aria-hidden />
              <p className="mt-2 text-sm font-medium text-slate-700">No results for “{query}”</p>
              <p className="mt-0.5 text-sm text-slate-500">
                Try a different term, or browse the template library.
              </p>
            </div>
          )}
          {results.projects.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                Projects
              </h3>
              {results.projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50"
                  onClick={() => {
                    close();
                    router.push(`/projects/${project.id}/overview`);
                  }}
                >
                  <FolderKanban className="size-4 text-slate-400" aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-900">
                      {project.name}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {project.companyName}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {results.templates.length > 0 && (
            <div>
              <h3 className="mb-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                Section templates
              </h3>
              {results.templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50"
                  onClick={() => {
                    close();
                    router.push("/templates");
                  }}
                >
                  <LayoutTemplate className="size-4 text-slate-400" aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-900">
                      {template.name}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {SECTION_CATEGORY_LABELS[template.category]}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}
