export default function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    downloading: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30",
    paused: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30",
    completed: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30",
    failed: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-450 border-rose-200 dark:border-rose-900/30",
    queued: "bg-slate-100 dark:bg-slate-800/40 text-slate-700 dark:text-slate-350 border-slate-200 dark:border-slate-700/60",
  };

  const labels: Record<string, string> = {
    downloading: "Downloading",
    paused: "Paused",
    completed: "Completed",
    failed: "Failed",
    queued: "Queued",
  };

  const defaultStyle = "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-305 border-gray-200 dark:border-gray-700";

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || defaultStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === "downloading" ? "bg-blue-500 animate-pulse" :
        status === "paused" ? "bg-amber-500" :
        status === "completed" ? "bg-emerald-500" :
        status === "failed" ? "bg-rose-500" : "bg-slate-400"
      }`} />
      {labels[status] || status}
    </span>
  );
}