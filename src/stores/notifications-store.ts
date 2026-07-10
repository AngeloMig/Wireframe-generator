"use client";

import { create } from "zustand";
import { notificationRepository } from "@/lib/repositories/local-notification-repository";
import type { AppNotification } from "@/types";

interface NotificationsState {
  notifications: AppNotification[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  add: (input: Omit<AppNotification, "id" | "createdAt" | "isRead">) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const notifications = await notificationRepository.getNotifications();
    set({ notifications, hydrated: true });
  },

  refresh: async () => {
    const notifications = await notificationRepository.getNotifications();
    set({ notifications, hydrated: true });
  },

  add: async (input) => {
    await notificationRepository.addNotification(input);
    await get().refresh();
  },

  markRead: async (id) => {
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    }));
    await notificationRepository.markRead(id);
  },

  markAllRead: async () => {
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, isRead: true })) }));
    await notificationRepository.markAllRead();
  },
}));
