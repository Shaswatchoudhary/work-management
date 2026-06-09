import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Notification, NotificationState, Role } from "../types";

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (n: Omit<Notification, "id" | "read" | "at">) =>
        set((s) => ({
          notifications: [
            {
              id: "n-" + Date.now() + Math.random().toString(36).slice(2, 6),
              at: new Date().toISOString(),
              read: false,
              ...n,
            },
            ...s.notifications,
          ].slice(0, 100), // max 100 notifications rakho
        })),

      markRead: (id: string) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        })),

      markAllRead: (forRole?: Role) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            !forRole || n.forRole === forRole || n.forRole === "all"
              ? { ...n, read: true }
              : n,
          ),
        })),

      unreadCount: (forRole?: Role) =>
        get().notifications.filter(
          (n) =>
            !n.read &&
            (!forRole || n.forRole === forRole || n.forRole === "all"),
        ).length,
    }),
    {
      name: "ticketms-notifications",
    },
  ),
);