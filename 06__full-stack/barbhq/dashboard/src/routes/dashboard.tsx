import { createFileRoute, Link } from "@tanstack/react-router";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { SectionCard } from "../components/ui/SectionCard";
import { Button } from "../components/ui/button";
import { useDashboard } from "../features/dashboard";
import { useShop } from "../features/shop";
import {
  DollarSign,
  Receipt,
  Users,
  AlertTriangle,
  ShoppingBag,
  TrendingUp,
  RefreshCw,
  Plus,
  Package,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import toast from "react-hot-toast";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

const SALES_CHART_DATA = [
  { time: "09:00", sales: 5000 },
  { time: "11:00", sales: 14000 },
  { time: "13:00", sales: 28000 },
  { time: "15:00", sales: 41000 },
  { time: "17:00", sales: 54000 },
  { time: "19:00", sales: 65000 },
];

function DashboardPage() {
  const { data, isLoading, refetch, isRefetching } = useDashboard();
  const { shop } = useShop();

  const currencySymbol = shop?.currency === "PKR" ? "₨" : "$";

  const handleRefresh = async () => {
    await refetch();
    toast.success("Dashboard data refreshed");
  };

  if (isLoading) {
    return (
      <PageContainer className="space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted/60 rounded-xl" />
          ))}
        </div>
        <div className="h-80 bg-muted/60 rounded-xl" />
      </PageContainer>
    );
  }

  const { sales, expenses, attendance, inventory, recentSales } = data;

  return (
    <PageContainer className="space-y-8">
      <PageHeader
        title="Shop Dashboard"
        description={`Real-time overview of business performance, attendance, and inventory for ${shop?.name || "your shop"}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefetching}
              className="flex items-center gap-1.5 cursor-pointer font-semibold"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => toast.success("New transaction shortcut")}
              className="flex items-center gap-1.5 cursor-pointer font-semibold"
            >
              <Plus className="h-4 w-4" />
              New Sale
            </Button>
          </div>
        }
      />

      {/* Top Level Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 select-none">
        <StatCard
          title="Today's Sales"
          value={`${currencySymbol}${sales?.today?.toLocaleString() || "65,000"}`}
          icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
          trend={{ value: sales?.transactions || 42, isPositive: true, label: `${sales?.transactions || 42} transactions today` }}
        />
        <StatCard
          title="Today's Expenses"
          value={`${currencySymbol}${expenses?.today?.toLocaleString() || "12,000"}`}
          icon={<Receipt className="h-5 w-5 text-rose-500" />}
          trend={{ value: 5, isPositive: false, label: "Operational overhead" }}
        />
        <StatCard
          title="Employees Present"
          value={`${attendance?.present || 8} / ${attendance?.total || 12}`}
          icon={<Users className="h-5 w-5 text-blue-500" />}
          trend={{ value: 100, isPositive: true, label: "View workforce attendance" }}
        />
        <StatCard
          title="Low Stock Items"
          value={`${inventory?.lowStock || 4}`}
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
          trend={{ value: inventory?.outOfStock || 1, isPositive: false, label: `${inventory?.outOfStock || 1} item out of stock` }}
        />
      </div>

      {/* Sales Overview Chart */}
      <SectionCard
        title="Sales Overview"
        description="Cumulative revenue trajectory throughout today's business hours"
        headerActions={
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-md">
            <TrendingUp className="h-3.5 w-3.5" />
            +18% vs yesterday
          </div>
        }
      >
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={SALES_CHART_DATA}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary, #6366f1)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-primary, #6366f1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="time" stroke="currentColor" className="text-[11px] text-muted-foreground" />
              <YAxis
                stroke="currentColor"
                className="text-[11px] text-muted-foreground"
                tickFormatter={(v) => `${currencySymbol}${v / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card, #1e1e2d)",
                  borderColor: "var(--border, #2d2d3d)",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
                formatter={(val: any) => [`${currencySymbol}${Number(val).toLocaleString()}`, "Sales"]}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="var(--color-primary, #6366f1)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#salesGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* Grid for Recent Sales & Low Stock Items */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Sales Widget */}
        <SectionCard
          title="Recent Sales"
          description="Latest processed customer POS receipts"
        >
          <div className="space-y-3">
            {recentSales && recentSales.length > 0 ? (
              recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-all select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{sale.customerName}</p>
                      <p className="text-xs text-muted-foreground font-medium">
                        Receipt: {sale.id} • {sale.items} item(s)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-sm text-foreground">
                      {currencySymbol}{sale.amount.toLocaleString()}
                    </span>
                    <p className="text-[10px] text-muted-foreground font-semibold">Completed</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground font-semibold">
                No recent sales recorded today.
              </div>
            )}
          </div>
        </SectionCard>

        {/* Low Stock Widget */}
        <SectionCard
          title="Low Stock Items"
          description="Products requiring inventory reorder"
          headerActions={
            <Link
              to="/app/inventory"
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View Inventory</span>
              <span>→</span>
            </Link>
          }
        >
          <div className="space-y-3">
            {inventory?.items && inventory.items.length > 0 ? (
              inventory.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-all select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 font-bold">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground font-medium">
                        Reorder Threshold: {item.minimumQuantity} {item.unit}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      {item.currentQuantity} {item.unit} left
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground font-semibold">
                All inventory items are well stocked.
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Attendance Summary Widget */}
      <SectionCard
        title="Today's Attendance"
        description="Daily workforce status overview"
        headerActions={
          <Link
            to="/app/attendance"
            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View Attendance</span>
            <span>→</span>
          </Link>
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
            <span className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">
              Present
            </span>
            <div className="text-2xl font-black text-foreground">
              {attendance?.present || 8}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
            <span className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400">
              Late
            </span>
            <div className="text-2xl font-black text-foreground">
              {attendance?.late || 2}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1">
            <span className="text-xs font-bold uppercase text-rose-600 dark:text-rose-400">
              Absent
            </span>
            <div className="text-2xl font-black text-foreground">
              {attendance?.absent || 2}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1">
            <span className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400">
              Clocked Out
            </span>
            <div className="text-2xl font-black text-foreground">
              {attendance?.clockedOut || 3}
            </div>
          </div>
        </div>
      </SectionCard>
    </PageContainer>
  );
}

export default DashboardPage;
