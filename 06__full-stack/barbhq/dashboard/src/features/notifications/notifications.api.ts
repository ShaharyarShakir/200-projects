import { api } from "../../lib/api";
import type { NotificationItem } from "./notifications.types";

export const notificationsApi = {
  list: async (): Promise<NotificationItem[]> => {
    const res = await api.get<any>("/notifications");
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.notifications)) return res.notifications;
    return [
      {
        id: "notif-1",
        title: "Hair Wax low stock",
        message: "Current stock (4) reached minimum threshold level.",
        type: "INVENTORY",
        priority: "HIGH",
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      },
      {
        id: "notif-2",
        title: "Payroll processed",
        message: "Monthly payroll batch for August has been calculated.",
        type: "PAYROLL",
        priority: "MEDIUM",
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
      {
        id: "notif-3",
        title: "Ahmed clocked in late",
        message: "Clocked in at 10:15 AM (Scheduled: 09:00 AM).",
        type: "ATTENDANCE",
        priority: "MEDIUM",
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
    ];
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch("/notifications/read-all");
  },
};
