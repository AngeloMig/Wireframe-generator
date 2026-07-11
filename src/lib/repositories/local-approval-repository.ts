import type { ApprovalRecord } from "@/types";
import { createId, nowIso } from "@/utils/id";
import { STORAGE_KEYS } from "../storage/local-storage";
import { readCollection, writeCollection } from "./local-collection";
import type { ApprovalRepository } from "./types";

export class LocalApprovalRepository implements ApprovalRepository {
  private read(): ApprovalRecord[] {
    return readCollection<ApprovalRecord>(STORAGE_KEYS.approvals);
  }

  async getProjectApprovals(projectId: string): Promise<ApprovalRecord[]> {
    return this.read().filter((a) => a.projectId === projectId);
  }

  async addApproval(
    input: Omit<ApprovalRecord, "id" | "approvedAt">,
  ): Promise<ApprovalRecord> {
    const approval: ApprovalRecord = {
      ...input,
      id: createId(),
      approvedAt: nowIso(),
    };
    const approvals = this.read();
    approvals.push(approval);
    writeCollection(STORAGE_KEYS.approvals, approvals);
    return approval;
  }

  /** Marks the record revoked — approval history is never deleted. */
  async revokeApproval(
    id: string,
    revokedById: string,
    reason: string,
  ): Promise<ApprovalRecord> {
    const approvals = this.read();
    const index = approvals.findIndex((a) => a.id === id);
    if (index === -1) throw new Error("Approval record not found.");
    approvals[index] = {
      ...approvals[index],
      revokedAt: nowIso(),
      revokedById,
      revokeReason: reason,
    };
    writeCollection(STORAGE_KEYS.approvals, approvals);
    return approvals[index];
  }
}

export const approvalRepository: LocalApprovalRepository = new LocalApprovalRepository();
