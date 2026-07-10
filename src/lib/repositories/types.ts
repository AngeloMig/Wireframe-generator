import type {
  AppNotification,
  CreateProjectInput,
  PageTemplate,
  Project,
  SectionTemplate,
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
  getSectionTemplates(): Promise<SectionTemplate[]>;
  getPageTemplates(): Promise<PageTemplate[]>;
  updateSectionTemplate(
    id: string,
    updates: Partial<SectionTemplate>,
  ): Promise<SectionTemplate | null>;
}

export interface NotificationRepository {
  getNotifications(): Promise<AppNotification[]>;
  addNotification(
    input: Omit<AppNotification, "id" | "createdAt" | "isRead">,
  ): Promise<AppNotification>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}
