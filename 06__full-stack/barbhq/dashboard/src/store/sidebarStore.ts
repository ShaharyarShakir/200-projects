import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  collapsed: boolean;
  mobileOpen: boolean;
  toggleCollapsed: () => void;
  toggleMobileOpen: () => void;
  setMobileOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      mobileOpen: false,
      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
      toggleMobileOpen: () =>
        set((state) => ({ mobileOpen: !state.mobileOpen })),
      setMobileOpen: (open) => set({ mobileOpen: open }),
    }),
    {
      name: "barbhq-sidebar-state",
      partialize: (state) => ({ collapsed: state.collapsed }),
    },
  ),
);
