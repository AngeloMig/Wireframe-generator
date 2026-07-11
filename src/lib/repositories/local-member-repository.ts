import type { ProjectMember } from "@/types";
import { createId, nowIso } from "@/utils/id";
import { STORAGE_KEYS } from "../storage/local-storage";
import { readCollection, writeCollection } from "./local-collection";
import type { ProjectMemberRepository } from "./types";

export class LocalProjectMemberRepository implements ProjectMemberRepository {
  private read(): ProjectMember[] {
    return readCollection<ProjectMember>(STORAGE_KEYS.members);
  }

  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    return this.read().filter(
      (m) => m.projectId === projectId && m.status !== "removed",
    );
  }

  async addMember(
    input: Omit<ProjectMember, "id" | "addedAt" | "status">,
  ): Promise<ProjectMember> {
    const member: ProjectMember = {
      ...input,
      id: createId(),
      status: "active",
      addedAt: nowIso(),
    };
    const members = this.read();
    members.push(member);
    writeCollection(STORAGE_KEYS.members, members);
    return member;
  }

  async updateMember(
    id: string,
    updates: Partial<ProjectMember>,
  ): Promise<ProjectMember> {
    const members = this.read();
    const index = members.findIndex((m) => m.id === id);
    if (index === -1) throw new Error("Project member not found.");
    const updated: ProjectMember = {
      ...members[index],
      ...updates,
      id: members[index].id,
      projectId: members[index].projectId,
    };
    members[index] = updated;
    writeCollection(STORAGE_KEYS.members, members);
    return updated;
  }

  async removeMember(id: string): Promise<void> {
    writeCollection(
      STORAGE_KEYS.members,
      this.read().filter((m) => m.id !== id),
    );
  }
}

export const memberRepository: LocalProjectMemberRepository =
  new LocalProjectMemberRepository();
