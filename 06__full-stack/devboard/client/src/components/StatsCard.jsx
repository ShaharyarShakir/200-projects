import Card from "./ui/Card";

export default function StatsCard({ title, value, icon: Icon, color = "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30" }) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-405 dark:text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <h4 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5 tracking-tight">
            {value}
          </h4>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
}
