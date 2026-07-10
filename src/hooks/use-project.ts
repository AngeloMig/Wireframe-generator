"use client";

import { useParams } from "next/navigation";
import { useProjectsStore } from "@/stores/projects-store";
import type { Project } from "@/types";

/** Resolve the current route's project from the store. */
export function useProject(): {
  project: Project | null;
  projectId: string;
  hydrated: boolean;
} {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId ?? "";
  const hydrated = useProjectsStore((s) => s.hydrated);
  const project = useProjectsStore(
    (s) => s.projects.find((p) => p.id === projectId) ?? null,
  );
  return { project, projectId, hydrated };
}
