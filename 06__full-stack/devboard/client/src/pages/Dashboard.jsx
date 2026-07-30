import Card from "../components/ui/Card";
import { useAuth } from "../hooks/useAuth";
import { Briefcase, ClipboardList, CheckCircle2, Users } from "lucide-react";

const stats = [
  {
    title: "Projects",
    value: 12,
    icon: Briefcase,
    color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
  },
  {
    title: "Tasks",
    value: 86,
    icon: ClipboardList,
    color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30"
  },
  {
    title: "Completed",
    value: 42,
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
  },
  {
    title: "Team Members",
    value: 8,
    icon: Users,
    color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30"
  }
];

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Welcome back, <span className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</span>! Here is your workspace overview.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {stat.title}
                  </p>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                    {stat.value}
                  </h2>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
