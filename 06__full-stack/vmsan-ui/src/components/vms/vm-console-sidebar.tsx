"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Terminal,
  HardDrive,
  Network,
  Folder,
  Camera,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItemConfig {
  id: string;
  label: string;
  pathSuffix: string;
  icon: LucideIcon;
  exact?: boolean;
}

export const CONSOLE_NAV_ITEMS: NavItemConfig[] = [
  {
    id: "overview",
    label: "Overview",
    pathSuffix: "",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    id: "terminal",
    label: "Terminal",
    pathSuffix: "/terminal",
    icon: Terminal,
  },
  {
    id: "storage",
    label: "Storage",
    pathSuffix: "/storage",
    icon: HardDrive,
  },
  {
    id: "networking",
    label: "Networking",
    pathSuffix: "/networking",
    icon: Network,
  },
  {
    id: "files",
    label: "Files",
    pathSuffix: "/files",
    icon: Folder,
  },
  {
    id: "snapshots",
    label: "Snapshots",
    pathSuffix: "/snapshots",
    icon: Camera,
  },
  {
    id: "settings",
    label: "Settings",
    pathSuffix: "/settings",
    icon: Settings,
  },
];

export interface VmConsoleSidebarProps extends React.ComponentProps<"nav"> {
  vmId: string;
  currentPath?: string;
  className?: string;
}

export function VmConsoleSidebar({
  vmId,
  currentPath,
  className,
  ...props
}: VmConsoleSidebarProps) {
  let routerPathname: string | null = null;
  try {
    // Next.js hook - safe fallback when rendered outside Router
    // eslint-disable-next-line react-hooks/rules-of-hooks
    routerPathname = usePathname();
  } catch {
    routerPathname = null;
  }

  const activePath = currentPath ?? routerPathname ?? `/vms/${vmId}`;

  const getHref = (suffix: string) => {
    return `/vms/${vmId}${suffix}`;
  };

  const isItemActive = (item: NavItemConfig) => {
    const itemHref = getHref(item.pathSuffix);
    if (item.exact) {
      return activePath === itemHref || activePath === `${itemHref}/`;
    }
    return activePath === itemHref || activePath.startsWith(`${itemHref}/`);
  };

  return (
    <nav
      aria-label="VM Console Navigation"
      className={cn(
        "flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible p-1 md:p-0 md:w-56 shrink-0",
        className
      )}
      {...props}
    >
      {CONSOLE_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const href = getHref(item.pathSuffix);
        const isActive = isItemActive(item);

        return (
          <Link
            key={item.id}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
              isActive
                ? "bg-primary/10 text-primary dark:bg-primary/20 font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground/80"
              )}
              aria-hidden="true"
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
