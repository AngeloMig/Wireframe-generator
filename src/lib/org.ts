import type { AppUser, Project } from "@/types";

/**
 * Multi-tenant scoping (prototype preview). Each project belongs to one
 * agency (project.organization); agency staff see only their agency's
 * projects, customers only their own, and the platform admin sees all.
 * In Phase 5 these rules become Supabase Row-Level Security policies.
 */

/** Projects the given user is allowed to see. */
export function projectsForUser(projects: Project[], user: AppUser): Project[] {
  if (user.role === "admin") return projects;
  if (user.role === "customer") {
    return projects.filter((p) => p.ownerId === user.id);
  }
  return projects.filter((p) => p.organization === user.organization);
}

/** Whether the user may open this specific project at all. */
export function canAccessProject(project: Project, user: AppUser): boolean {
  if (user.role === "admin") return true;
  if (user.role === "customer") return project.ownerId === user.id;
  return project.organization === user.organization;
}
