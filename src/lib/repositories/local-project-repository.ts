import { APP_CONFIG } from "@/config/app";
import type { CreateProjectInput, Project } from "@/types";
import { createId, nowIso } from "@/utils/id";
import { readJson, STORAGE_KEYS, writeJson } from "../storage/local-storage";
import { ensureSeeded } from "../storage/seed";
import type { ProjectRepository } from "./types";

/**
 * localStorage-backed ProjectRepository. Later replaced by
 * SupabaseProjectRepository with the identical interface.
 */
export class LocalProjectRepository implements ProjectRepository {
  private read(): Project[] {
    ensureSeeded();
    const projects = readJson<Project[]>(STORAGE_KEYS.projects, []);
    return Array.isArray(projects) ? projects : [];
  }

  private write(projects: Project[]): boolean {
    return writeJson(STORAGE_KEYS.projects, projects);
  }

  async getProjects(): Promise<Project[]> {
    return this.read();
  }

  async getProject(id: string): Promise<Project | null> {
    return this.read().find((p) => p.id === id) ?? null;
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    const now = nowIso();
    const id = createId();
    const project: Project = {
      id,
      name: input.name,
      companyName: input.companyName,
      websiteType: input.websiteType,
      status: "draft",
      organization: input.organization ?? APP_CONFIG.agencyName,
      ownerId: input.ownerId ?? "user-customer-1",
      questionnaire: input.questionnaire,
      pages: input.pages.map((page) => ({
        ...page,
        projectId: id,
        createdAt: now,
        updatedAt: now,
      })),
      activity: [],
      assets: [],
      createdAt: now,
      updatedAt: now,
      lastEditedAt: now,
    };
    const projects = this.read();
    projects.unshift(project);
    if (!this.write(projects)) {
      throw new Error("Could not save the project to local storage.");
    }
    return project;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const projects = this.read();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error("Project not found.");
    }
    const updated: Project = {
      ...projects[index],
      ...updates,
      id,
      updatedAt: nowIso(),
    };
    projects[index] = updated;
    if (!this.write(projects)) {
      throw new Error("Could not save changes to local storage.");
    }
    return updated;
  }

  async deleteProject(id: string): Promise<void> {
    const projects = this.read().filter((p) => p.id !== id);
    this.write(projects);
  }
}

export const projectRepository: LocalProjectRepository = new LocalProjectRepository();
