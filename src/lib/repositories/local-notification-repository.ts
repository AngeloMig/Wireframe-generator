import type { AppNotification } from "@/types";
import { createId, nowIso } from "@/utils/id";
import { readJson, STORAGE_KEYS, writeJson } from "../storage/local-storage";
import { ensureSeeded } from "../storage/seed";
import type { NotificationRepository } from "./types";

export class LocalNotificationRepository implements NotificationRepository {
  private read(): AppNotification[] {
    ensureSeeded();
    const items = readJson<AppNotification[]>(STORAGE_KEYS.notifications, []);
    return Array.isArray(items) ? items : [];
  }

  async getNotifications(): Promise<AppNotification[]> {
    return this.read().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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

  async markRead(id: string): Promise<void> {
    const items = this.read().map((n) => (n.id === id ? { ...n, isRead: true } : n));
    writeJson(STORAGE_KEYS.notifications, items);
  }

  async markAllRead(): Promise<void> {
    const items = this.read().map((n) => ({ ...n, isRead: true }));
    writeJson(STORAGE_KEYS.notifications, items);
  }
}

export const notificationRepository: LocalNotificationRepository =
  new LocalNotificationRepository();
