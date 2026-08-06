import { create } from "zustand";

export const useDriveStore = create((set) => ({
  activeTab: "all", // "all", "starred", "trash"
  setActiveTab: (tab) => set({ activeTab: tab }),

  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),

  selectedFile: null,
  setSelectedFile: (file) => set({ selectedFile: file }),

  previewFile: null,
  setPreviewFile: (file) => set({ previewFile: file }),
}));
