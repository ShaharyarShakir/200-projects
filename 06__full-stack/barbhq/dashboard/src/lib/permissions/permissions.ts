export type Permission =
  | "dashboard.view"
  | "employees.view"
  | "employees.manage"
  | "attendance.view"
  | "attendance.manage"
  | "payroll.view"
  | "payroll.manage"
  | "finance.view"
  | "finance.manage"
  | "inventory.view"
  | "inventory.manage"
  | "pos.view"
  | "pos.create"
  | "services.view"
  | "services.manage"
  | "reports.view"
  | "notifications.view"
  | "settings.manage";

export type Role = "OWNER" | "MANAGER" | "RECEPTIONIST" | "BARBER";
