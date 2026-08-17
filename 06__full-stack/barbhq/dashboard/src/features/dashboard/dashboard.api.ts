import { api } from "../../lib/api";
import type { DashboardOverview } from "./dashboard.types";

export const dashboardApi = {
  getOverview: async (): Promise<DashboardOverview> => {
    return api.get<DashboardOverview>("/dashboard");
  },
};
