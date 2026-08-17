import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "./dashboard.api";
import type { DashboardOverview } from "./dashboard.types";

export const DASHBOARD_QUERY_KEY = ["dashboard", "overview"];

const DEFAULT_OVERVIEW: DashboardOverview = {
  sales: { today: 65000, transactions: 42 },
  expenses: { today: 12000 },
  attendance: { present: 8, total: 12 },
  inventory: {
    lowStock: 4,
    outOfStock: 1,
    items: [
      { id: "inv-1", name: "Hair Wax (Matte)", currentQuantity: 4, minimumQuantity: 10, unit: "BOTTLE" },
      { id: "inv-2", name: "Shampoo (Anti-dandruff)", currentQuantity: 2, minimumQuantity: 5, unit: "BOTTLE" },
      { id: "inv-3", name: "Nitrile Gloves (Box)", currentQuantity: 1, minimumQuantity: 5, unit: "BOX" },
      { id: "inv-4", name: "Beard Oil (Vanilla)", currentQuantity: 3, minimumQuantity: 8, unit: "BOTTLE" },
    ],
  },
  recentSales: [
    { id: "REC-001", customerName: "Ali Raza", amount: 800, items: 2, timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
    { id: "REC-002", customerName: "Usman Khan", amount: 1500, items: 3, timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
    { id: "REC-003", customerName: "Hamza Tariq", amount: 700, items: 1, timestamp: new Date(Date.now() - 1000 * 60 * 110).toISOString() },
    { id: "REC-004", customerName: "Bilal Ahmed", amount: 1200, items: 2, timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
  ],
  alerts: [
    {
      id: "alt-1",
      title: "Hair Wax is low",
      message: "Reorder threshold reached",
      type: "INVENTORY",
      priority: "HIGH",
      createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    },
  ],
};

export function useDashboard() {
  const query = useQuery<DashboardOverview>({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: dashboardApi.getOverview,
    staleTime: 1000 * 60 * 2,
  });

  return {
    ...query,
    data: query.data || DEFAULT_OVERVIEW,
  };
}
