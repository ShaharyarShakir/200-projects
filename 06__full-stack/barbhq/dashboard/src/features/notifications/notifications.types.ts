export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type NotificationType = "SYSTEM" | "INVENTORY" | "ATTENDANCE" | "PAYROLL" | "APPOINTMENT";

export interface NotificationItem {
  id: string;
  _id?: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: string;
  recipientId?: string;
}
