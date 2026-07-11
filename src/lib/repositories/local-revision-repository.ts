import type { RevisionRequest } from "@/types";
import { createId, nowIso } from "@/utils/id";
import { STORAGE_KEYS } from "../storage/local-storage";
import { readCollection, writeCollection } from "./local-collection";
import type { RevisionRequestRepository } from "./types";

export class LocalRevisionRequestRepository implements RevisionRequestRepository {
  private read(): RevisionRequest[] {
    return readCollection<RevisionRequest>(STORAGE_KEYS.revisionRequests);
  }

  async getProjectRevisionRequests(projectId: string): Promise<RevisionRequest[]> {
    return this.read()
      .filter((r) => r.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createRevisionRequest(
    input: Omit<RevisionRequest, "id" | "createdAt">,
  ): Promise<RevisionRequest> {
    const request: RevisionRequest = {
      ...input,
      id: createId(),
      createdAt: nowIso(),
    };
    const requests = this.read();
    requests.push(request);
    writeCollection(STORAGE_KEYS.revisionRequests, requests);
    return request;
  }

  async updateRevisionRequest(
    id: string,
    updates: Partial<RevisionRequest>,
  ): Promise<RevisionRequest> {
    const requests = this.read();
    const index = requests.findIndex((r) => r.id === id);
    if (index === -1) throw new Error("Revision request not found.");
    requests[index] = { ...requests[index], ...updates, id: requests[index].id };
    writeCollection(STORAGE_KEYS.revisionRequests, requests);
    return requests[index];
  }
}

export const revisionRequestRepository: LocalRevisionRequestRepository =
  new LocalRevisionRequestRepository();
