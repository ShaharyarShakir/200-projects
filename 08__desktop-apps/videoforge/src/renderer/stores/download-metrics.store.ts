import { create } from "zustand";

export interface MetricsPoint {
  timestamp: number;
  speed: number;
}

interface State {
  points: MetricsPoint[];
  addPoint: (point: MetricsPoint) => void;
  clearPoints: () => void;
}

export const useMetricsStore = create<State>((set) => ({
  points: [],
  addPoint: (point) =>
    set((state) => ({
      points: [
        ...state.points.slice(-99), // Keep only the last 100 points
        point,
      ],
    })),
  clearPoints: () => set({ points: [] }),
}));
