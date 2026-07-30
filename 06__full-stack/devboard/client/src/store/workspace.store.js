import { create } from "zustand";

const useWorkspaceStore = create((set) => ({
  workspaces: [],
  currentWorkspace: null,

  setWorkspaces: (workspaces) => set({ workspaces }),

  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace })
}));

export default useWorkspaceStore;
