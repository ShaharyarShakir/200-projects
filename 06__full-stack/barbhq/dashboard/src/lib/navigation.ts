import React from "react";
import {
  LayoutDashboard,
  Users,
  Clock,
  Wallet,
  DollarSign,
  Package,
  ShoppingCart,
  Scissors,
  BarChart3,
  Bell,
  Settings,
  User as UserIcon,
} from "lucide-react";
import type { Permission } from "./permissions";

export interface NavigationItem {
  label: string;
  path: string;
  iconName: string;
  permission?: Permission;
}

export interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

export const navigationConfig: (NavigationItem | NavigationGroup)[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    iconName: "LayoutDashboard",
    permission: "dashboard.view",
  },
  {
    label: "Employees",
    path: "/employees",
    iconName: "Users",
    permission: "employees.view",
  },
  {
    label: "My Attendance",
    path: "/app/my-attendance",
    iconName: "Clock",
    permission: "attendance.view",
  },
  {
    label: "Attendance",
    path: "/app/attendance",
    iconName: "Clock",
    permission: "attendance.view",
  },
  {
    label: "Payroll",
    path: "/payroll",
    iconName: "Wallet",
    permission: "payroll.view",
  },
  {
    label: "Finance",
    path: "/finance",
    iconName: "DollarSign",
    permission: "finance.view",
  },
  {
    label: "Inventory",
    path: "/app/inventory",
    iconName: "Package",
    permission: "inventory.view",
  },
  {
    label: "POS",
    path: "/pos",
    iconName: "ShoppingCart",
    permission: "pos.view",
  },
  {
    label: "Services",
    path: "/services",
    iconName: "Scissors",
    permission: "services.view",
  },
  {
    label: "Reports",
    path: "/reports",
    iconName: "BarChart3",
    permission: "reports.view",
  },
  {
    label: "Notifications",
    path: "/notifications",
    iconName: "Bell",
    permission: "notifications.view",
  },
  {
    label: "Settings",
    path: "/settings",
    iconName: "Settings",
    permission: "settings.manage",
  },
];

export const getIconByName = (
  name: string,
): React.ComponentType<{ className?: string }> => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutDashboard,
    Users,
    Clock,
    Wallet,
    DollarSign,
    Package,
    ShoppingCart,
    Scissors,
    BarChart3,
    Bell,
    Settings,
    UserIcon,
  };
  return iconMap[name] || LayoutDashboard;
};

export const renderIcon = (name: string, className?: string) => {
  const IconComponent = getIconByName(name);
  return React.createElement(IconComponent, { className });
};
