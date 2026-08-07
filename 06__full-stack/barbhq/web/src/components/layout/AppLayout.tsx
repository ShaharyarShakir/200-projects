import React from "react";
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";
import { Footer } from "./Footer";
import { Drawer } from "../ui/drawer";
import { useSidebarStore } from "../../store/sidebarStore";
import { cn } from "../../lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebarStore();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
      {/* 1. Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-full bg-card border-r border-border transition-all duration-300 z-20 shrink-0",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <Sidebar />
      </aside>

      {/* 2. Mobile Sidebar Drawer */}
      <Drawer
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        position="left"
        title="BarbHQ Navigation"
        className="max-w-[280px]"
      >
        <div className="h-full -mx-6 -mt-5">
          <Sidebar onItemClick={() => setMobileOpen(false)} />
        </div>
      </Drawer>

      {/* 3. Main content body */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar Header */}
        <TopNavbar onMenuToggle={() => setMobileOpen(true)} />

        {/* Content Viewer Body */}
        <main className="flex-1 overflow-y-auto bg-background/35 flex flex-col justify-between">
          <div className="flex-1">{children}</div>
          <Footer />
        </main>
      </div>
    </div>
  );
};
export default AppLayout;
