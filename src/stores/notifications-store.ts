"use client";

import { create } from "zustand";
import { notificationRepository } from "@/lib/repositories/local-notification-repository";
import { useSessionStore } from "@/stores/session-store";
import type { AppNotification } from "@/types";

/**
 * Notifications for the CURRENT (simulated) user. Call refresh() after a
 * role switch so the list reflects the new user's inbox.
 */

interface NotificationsState {
  notifications: AppNotification[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  add: (input: Omit<AppNotification, "id" | "createdAt" | "isRead">) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clear: (id: string) => Promise<void>;
}

function currentUserId(): string {
  return useSessionStore.getState().user.id;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const notifications = await notificationRepository.getNotifications(currentUserId());
    set({ notifications, hydrated: true });
  },

  refresh: async () => {
    const notifications = await notificationRepository.getNotifications(currentUserId());
    set({ notifications, hydrated: true });
  },

  add: async (input) => {
    await notificationRepository.addNotification(input);
    // Only refresh if the notification targets the current user's inbox.
    if (input.userId === currentUserId()) {
      await get().refresh();
    }
  },

  markRead: async (id) => {
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    }));
    await notificationRepository.markRead(id);
  },

  markAllRead: async () => {
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, isRead: true })) }));
    await notificationRepository.markAllRead(currentUserId());
  },

  clear: async (id) => {
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
    await notificationRepository.clearNotification(id);
  },
}));
