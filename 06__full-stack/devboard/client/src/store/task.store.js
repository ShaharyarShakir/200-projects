import { create } from "zustand";

const useTaskStore = create((set) => ({
  tasks: [],

  setTasks: (tasks) => set({ tasks }),

  updateLocalTask: (task) =>
    set((state) => ({
      tasks: state.tasks.map((item) =>
        item._id === task._id ? task : item
      )
    }))
}));

export default useTaskStore;
