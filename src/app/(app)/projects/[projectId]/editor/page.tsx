"use client";

import { Suspense, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, MonitorSmartphone } from "lucide-react";
import { writeLastOpened } from "@/lib/customer-workspace";
import { brandTheme } from "@/lib/editor-utils";
import { useProject } from "@/hooks/use-project";
import { useSessionStore } from "@/stores/session-store";
import { Editor } from "@/components/editor/editor";
import { SectionRenderer } from "@/components/editor/wireframes/section-renderer";
import { WireProvider } from "@/components/editor/wireframes/primitives";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/skeleton";

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

      {/* Small screens: read-only preview with a friendly notice */}
      <div className="p-4 lg:hidden">
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <MonitorSmartphone className="mt-0.5 size-5 shrink-0 text-indigo-600" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Page arrangement works best on desktop
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              You can review the wireframe below. To drag sections and edit content,
              open this project on a larger screen.
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
                <SectionRenderer key={section.id} section={section} />
              ))}
          </div>
        </WireProvider>
      </div>
    </>
  );
}
