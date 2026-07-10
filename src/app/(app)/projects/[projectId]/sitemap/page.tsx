"use client";

import { SitemapBuilder } from "@/components/project/sitemap/sitemap-builder";
import { useProject } from "@/hooks/use-project";

export default function SitemapPage() {
  const { project } = useProject();
  if (!project) return null; // ProjectShell handles loading and not-found.
  return <SitemapBuilder project={project} />;
}
