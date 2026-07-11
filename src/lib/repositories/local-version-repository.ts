import type { ProjectVersion } from "@/types";
import { createId, nowIso } from "@/utils/id";
import { STORAGE_KEYS } from "../storage/local-storage";
import { readCollection, writeCollection } from "./local-collection";
import type { VersionRepository } from "./types";

export class LocalVersionRepository implements VersionRepository {
  private read(): ProjectVersion[] {
    return readCollection<ProjectVersion>(STORAGE_KEYS.versions);
  }

  async getProjectVersions(projectId: string): Promise<ProjectVersion[]> {
    return this.read()
      .filter((v) => v.projectId === projectId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }

  async getVersion(id: string): Promise<ProjectVersion | null> {
    return this.read().find((v) => v.id === id) ?? null;
  }

  async createVersion(input: {
    projectId: string;
    label: string;
    description?: string;
    createdById: string;
    trigger: ProjectVersion["trigger"];
    snapshot: ProjectVersion["snapshot"];
  }): Promise<ProjectVersion> {
    const versions = this.read();
    const projectVersions = versions.filter((v) => v.projectId === input.projectId);
    const versionNumber =
      projectVersions.reduce((max, v) => Math.max(max, v.versionNumber), 0) + 1;
    const version: ProjectVersion = {
      id: createId(),
      projectId: input.projectId,
      versionNumber,
      label: input.label,
      description: input.description,
      createdById: input.createdById,
      createdAt: nowIso(),
      trigger: input.trigger,
      snapshot: structuredClone(input.snapshot),
    };
    versions.push(version);
    writeCollection(STORAGE_KEYS.versions, versions);
    return version;
  }

  async updateVersion(
    id: string,
    updates: Partial<Pick<ProjectVersion, "label" | "description">>,
  ): Promise<ProjectVersion> {
    const versions = this.read();
    const index = versions.findIndex((v) => v.id === id);
    if (index === -1) throw new Error("Version not found.");
    versions[index] = { ...versions[index], ...updates };
    writeCollection(STORAGE_KEYS.versions, versions);
    return versions[index];
  }
}

export const versionRepository: LocalVersionRepository = new LocalVersionRepository();
