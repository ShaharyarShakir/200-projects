export default function ProgressBar({
  value,
}: {
  value: number;
}) {
  const percentage = Math.round(value || 0);

  return (
    <div className="w-full space-y-1.5">
      <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400">
        <span>{percentage}%</span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800">
        <div
          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(59,130,246,0.3)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}