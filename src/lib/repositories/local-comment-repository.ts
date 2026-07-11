import type {
  CommentReply,
  CreateCommentInput,
  CreateReplyInput,
  ProjectComment,
} from "@/types";
import { createId, nowIso } from "@/utils/id";
import { STORAGE_KEYS } from "../storage/local-storage";
import { readCollection, writeCollection } from "./local-collection";
import type { CommentRepository } from "./types";

export class LocalCommentRepository implements CommentRepository {
  private read(): ProjectComment[] {
    return readCollection<ProjectComment>(STORAGE_KEYS.comments);
  }

  private write(comments: ProjectComment[]): void {
    writeCollection(STORAGE_KEYS.comments, comments);
  }

  private mutate(
    id: string,
    change: (comment: ProjectComment) => ProjectComment,
  ): ProjectComment {
    const comments = this.read();
    const index = comments.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Comment not found.");
    const updated = change(comments[index]);
    comments[index] = updated;
    this.write(comments);
    return updated;
  }

  async getProjectComments(projectId: string): Promise<ProjectComment[]> {
    return this.read().filter((c) => c.projectId === projectId);
  }

  async createComment(input: CreateCommentInput): Promise<ProjectComment> {
    const now = nowIso();
    const comment: ProjectComment = {
      id: createId(),
      projectId: input.projectId,
      pageId: input.pageId,
      sectionId: input.sectionId,
      scope: input.scope,
      visibility: input.visibility,
      authorId: input.authorId,
      assignedToId: input.assignedToId,
      message: input.message,
      mentions: input.mentions,
      status: "open",
      priority: input.priority,
      replies: [],
      attachments: input.attachments ?? [],
      isActionItem: input.isActionItem ?? false,
      dueDate: input.dueDate,
      createdAt: now,
      updatedAt: now,
    };
    const comments = this.read();
    comments.push(comment);
    this.write(comments);
    return comment;
  }

  async updateComment(
    id: string,
    updates: Partial<ProjectComment>,
  ): Promise<ProjectComment> {
    return this.mutate(id, (comment) => ({
      ...comment,
      ...updates,
      id: comment.id,
      projectId: comment.projectId,
      updatedAt: nowIso(),
    }));
  }

  async deleteComment(id: string): Promise<void> {
    this.write(this.read().filter((c) => c.id !== id));
  }

  async addReply(
    commentId: string,
    input: CreateReplyInput,
  ): Promise<CommentReply> {
    const now = nowIso();
    const reply: CommentReply = {
      id: createId(),
      commentId,
      authorId: input.authorId,
      message: input.message,
      mentions: input.mentions,
      attachments: input.attachments ?? [],
      createdAt: now,
      updatedAt: now,
    };
    this.mutate(commentId, (comment) => ({
      ...comment,
      replies: [...comment.replies, reply],
      updatedAt: now,
    }));
    return reply;
  }

  async resolveComment(
    commentId: string,
    userId: string,
  ): Promise<ProjectComment> {
    const now = nowIso();
    return this.mutate(commentId, (comment) => ({
      ...comment,
      status: "resolved",
      resolvedAt: now,
      resolvedById: userId,
      updatedAt: now,
    }));
  }

  async reopenComment(commentId: string): Promise<ProjectComment> {
    return this.mutate(commentId, (comment) => ({
      ...comment,
      status: "reopened",
      resolvedAt: undefined,
      resolvedById: undefined,
      updatedAt: nowIso(),
    }));
  }
}

export const commentRepository: LocalCommentRepository = new LocalCommentRepository();
