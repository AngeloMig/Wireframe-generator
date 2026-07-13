import type { AppNotification } from "@/types";
import { createId, nowIso } from "@/utils/id";
import { STORAGE_KEYS, writeJson } from "../storage/local-storage";
import { readCollection } from "./local-collection";
import type { NotificationRepository } from "./types";

export class LocalNotificationRepository implements NotificationRepository {
  private read(): AppNotification[] {
    return readCollection<AppNotification>(STORAGE_KEYS.notifications);
  }

  async getNotifications(userId: string): Promise<AppNotification[]> {
    return this.read()
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async addNotification(
    input: Omit<AppNotification, "id" | "createdAt" | "isRead">,
  ): Promise<AppNotification> {
    const notification: AppNotification = {
      ...input,
      id: createId(),
      isRead: false,
      createdAt: nowIso(),
    };
    const items = this.read();
    items.unshift(notification);
    writeJson(STORAGE_KEYS.notifications, items);
    return notification;
  }

  async upsertNotification(
    input: Omit<AppNotification, "id" | "createdAt" | "isRead">,
  ): Promise<AppNotification> {
    const items = this.read();
    const existingIndex = items.findIndex(
      (n) =>
        !n.isRead &&
        n.userId === input.userId &&
        n.projectId === input.projectId &&
        n.type === input.type &&
        n.title === input.title,
    );
    if (existingIndex === -1) return this.addNotification(input);

    const updated: AppNotification = { ...items[existingIndex], ...input, createdAt: nowIso() };
    items[existingIndex] = updated;
    writeJson(STORAGE_KEYS.notifications, items);
    return updated;
  }

  async markRead(id: string): Promise<void> {
    const items = this.read().map((n) => (n.id === id ? { ...n, isRead: true } : n));
    writeJson(STORAGE_KEYS.notifications, items);
  }

  async markAllRead(userId: string): Promise<void> {
    const items = this.read().map((n) =>
      n.userId === userId ? { ...n, isRead: true } : n,
    );
    writeJson(STORAGE_KEYS.notifications, items);
  }

  async clearNotification(id: string): Promise<void> {
    writeJson(
      STORAGE_KEYS.notifications,
      this.read().filter((n) => n.id !== id),
    );
  }
}

export const notificationRepository: LocalNotificationRepository =
  new LocalNotificationRepository();
