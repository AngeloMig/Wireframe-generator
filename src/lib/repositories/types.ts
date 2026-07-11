import type {
  AppNotification,
  ApprovalRecord,
  CommentReply,
  CreateCommentInput,
  CreateProjectInput,
  CreateReplyInput,
  PageTemplate,
  Project,
  ProjectComment,
  ProjectMember,
  ProjectVersion,
  RevisionRequest,
  SectionVariation,
  SectionVariationSuggestion,
  VersionTrigger,
} from "@/types";

/**
 * Repository contracts. Components and stores only ever talk to these
 * interfaces, so the Local* implementations can later be replaced with
 * Supabase* implementations without touching the UI.
 */

export interface ProjectRepository {
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  createProject(input: CreateProjectInput): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
}

export interface TemplateRepository {
  getSectionVariations(): Promise<SectionVariation[]>;
  getPageTemplates(): Promise<PageTemplate[]>;
  updateSectionVariation(
    id: string,
    updates: Partial<SectionVariation>,
  ): Promise<SectionVariation | null>;
}

export interface NotificationRepository {
  /** All notifications for one user (recipient). */
  getNotifications(userId: string): Promise<AppNotification[]>;
  addNotification(
    input: Omit<AppNotification, "id" | "createdAt" | "isRead">,
  ): Promise<AppNotification>;
  markRead(id: string): Promise<void>;
  markAllRead(userId: string): Promise<void>;
  clearNotification(id: string): Promise<void>;
}

export interface CommentRepository {
  getProjectComments(projectId: string): Promise<ProjectComment[]>;
  createComment(input: CreateCommentInput): Promise<ProjectComment>;
  updateComment(
    id: string,
    updates: Partial<ProjectComment>,
  ): Promise<ProjectComment>;
  deleteComment(id: string): Promise<void>;
  addReply(commentId: string, input: CreateReplyInput): Promise<CommentReply>;
  resolveComment(commentId: string, userId: string): Promise<ProjectComment>;
  reopenComment(commentId: string): Promise<ProjectComment>;
}

export interface ProjectMemberRepository {
  getProjectMembers(projectId: string): Promise<ProjectMember[]>;
  addMember(
    input: Omit<ProjectMember, "id" | "addedAt" | "status">,
  ): Promise<ProjectMember>;
  updateMember(
    id: string,
    updates: Partial<ProjectMember>,
  ): Promise<ProjectMember>;
  removeMember(id: string): Promise<void>;
}

export interface VersionRepository {
  getProjectVersions(projectId: string): Promise<ProjectVersion[]>;
  getVersion(id: string): Promise<ProjectVersion | null>;
  createVersion(input: {
    projectId: string;
    label: string;
    description?: string;
    createdById: string;
    trigger: VersionTrigger;
    snapshot: ProjectVersion["snapshot"];
  }): Promise<ProjectVersion>;
  updateVersion(
    id: string,
    updates: Partial<Pick<ProjectVersion, "label" | "description">>,
  ): Promise<ProjectVersion>;
}

export interface ApprovalRepository {
  getProjectApprovals(projectId: string): Promise<ApprovalRecord[]>;
  addApproval(
    input: Omit<ApprovalRecord, "id" | "approvedAt">,
  ): Promise<ApprovalRecord>;
  revokeApproval(
    id: string,
    revokedById: string,
    reason: string,
  ): Promise<ApprovalRecord>;
}

export interface SuggestionRepository {
  getProjectSuggestions(projectId: string): Promise<SectionVariationSuggestion[]>;
  createSuggestion(
    input: Omit<SectionVariationSuggestion, "id" | "createdAt" | "status">,
  ): Promise<SectionVariationSuggestion>;
  respondToSuggestion(
    id: string,
    response: {
      status: "accepted" | "declined";
      respondedById: string;
      responseMessage?: string;
    },
  ): Promise<SectionVariationSuggestion>;
}

export interface RevisionRequestRepository {
  getProjectRevisionRequests(projectId: string): Promise<RevisionRequest[]>;
  createRevisionRequest(
    input: Omit<RevisionRequest, "id" | "createdAt">,
  ): Promise<RevisionRequest>;
  updateRevisionRequest(
    id: string,
    updates: Partial<RevisionRequest>,
  ): Promise<RevisionRequest>;
}
