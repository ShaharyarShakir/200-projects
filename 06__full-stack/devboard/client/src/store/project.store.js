import { create } from "zustand";

const useProjectStore = create((set) => ({
  projects: [],
  currentProject: null,

  setProjects: (projects) => set({ projects }),

  setCurrentProject: (project) => set({ currentProject: project })
}));

export default useProjectStore;
