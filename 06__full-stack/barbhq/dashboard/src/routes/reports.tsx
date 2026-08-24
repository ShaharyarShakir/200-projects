import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { SectionCard } from "../components/ui/SectionCard";
import { Button } from "../components/ui/button";
import { TrendingUp, Award, Calendar, DollarSign, Star } from "lucide-react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const topBarbers = [
    {
      name: "Marcus Vance",
      revenue: "$3,840.00",
      appointments: 96,
      rating: "4.95",
    },
    {
      name: "Elena Rossi",
      revenue: "$3,210.00",
      appointments: 74,
      rating: "4.92",
    },
    {
      name: "Sam Harris",
      revenue: "$2,990.00",
      appointments: 68,
      rating: "4.88",
    },
  ];

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Track salon earnings, productivity stats, and performance metrics"
        actions={
          <Button
            onClick={() => toast.success("Export report triggered")}
            variant="outline"
            size="sm"
            className="cursor-pointer font-semibold"
          >
            Export CSV Summary
          </Button>
        }
      />

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-3 select-none">
        <StatCard
          title="Gross Income (MTD)"
          value="$18,450.00"
          icon={<DollarSign className="h-5 w-5" />}
          trend={{ value: 14, isPositive: true, label: "from last month" }}
        />
        <StatCard
          title="Total Bookings (MTD)"
          value="412 Cuts"
          icon={<Calendar className="h-5 w-5" />}
          trend={{ value: 9, isPositive: true, label: "from last month" }}
        />
        <StatCard
          title="Average Ticket Size"
          value="$44.78"
          icon={<TrendingUp className="h-5 w-5" />}
          trend={{ value: 2, isPositive: true, label: "stable ticket size" }}
        />
      </div>

      {/* Staff Leaderboard */}
      <SectionCard
        title="Staff Performance (This Month)"
        description="Roster breakdown by volume, revenue contributions, and user reviews"
        headerActions={<Award className="h-5 w-5 text-primary animate-pulse" />}
      >
        <div className="space-y-4">
          {topBarbers.map((barber, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between border-b border-border/20 pb-4 last:border-0 last:pb-0"
            >
              <div>
                <h4 className="font-bold text-sm text-foreground">
                  {barber.name}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 font-semibold">
                  <span>{barber.appointments} Appointments</span>
                  <span className="text-border">|</span>
                  <span className="flex items-center gap-0.5 text-amber-500">
                    <Star className="h-3 w-3 fill-amber-500" />
                    {barber.rating}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <span className="font-bold text-sm text-primary">
                  {barber.revenue}
                </span>
                <p className="text-[9px] text-muted-foreground uppercase font-extrabold tracking-wider mt-0.5">
                  Revenue
                </p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </PageContainer>
  );
}
export default ReportsPage;
