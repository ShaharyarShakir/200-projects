import React from "react";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { useSidebarStore } from "../../store/sidebarStore";
import { Breadcrumbs } from "./Breadcrumbs";
import { SearchCommand } from "./SearchCommand";
import { NotificationMenu } from "./NotificationMenu";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { ProfileMenu } from "./ProfileMenu";

export interface TopNavbarProps {
  onMenuToggle: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onMenuToggle }) => {
  const { collapsed, toggleCollapsed } = useSidebarStore();

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-border bg-card/65 backdrop-blur-md px-4 md:px-6 z-30 shrink-0 select-none">
      {/* Left: Collapsed Trigger & Breadcrumbs */}
      <div className="flex items-center gap-4">
        {/* Toggle desktop sidebar */}
        <button
          onClick={toggleCollapsed}
          className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer focus:outline-none"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>

        {/* Toggle mobile sidebar */}
        <button
          onClick={onMenuToggle}
          className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer focus:outline-none"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumb component */}
        <div className="hidden sm:flex items-center">
          <Breadcrumbs />
        </div>
      </div>

      {/* Center: Global Search Command Trigger */}
      <div className="flex justify-center flex-1 mx-2 sm:mx-4">
        <SearchCommand />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeSwitcher />
        <NotificationMenu />
        <ProfileMenu />
      </div>
    </header>
  );
};
export default TopNavbar;
