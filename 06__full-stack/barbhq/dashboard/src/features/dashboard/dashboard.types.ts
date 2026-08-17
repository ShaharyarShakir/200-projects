export interface DashboardOverview {
  sales: {
    today: number;
    transactions: number;
  };
  expenses: {
    today: number;
  };
  attendance: {
    present: number;
    total: number;
    late?: number;
    absent?: number;
    clockedOut?: number;
  };
  inventory: {
    lowStock: number;
    outOfStock: number;
    items?: Array<{
      id: string;
      name: string;
      currentQuantity: number;
      minimumQuantity: number;
      unit: string;
    }>;
  };
  recentSales: Array<{
    id: string;
    customerName: string;
    amount: number;
    items: number;
    timestamp: string;
  }>;
  alerts: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    priority: string;
    createdAt: string;
  }>;
}
