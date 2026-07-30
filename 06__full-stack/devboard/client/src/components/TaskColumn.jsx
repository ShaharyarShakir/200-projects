import TaskCard from "./TaskCard";

export default function TaskColumn({ title, tasks, onStatusChange, onDelete }) {
  // Styles for different column headers
  const headerStyles = {
    TODO: {
      border: "border-t-4 border-t-slate-400",
      dot: "bg-slate-400",
      bg: "bg-slate-50/50 dark:bg-slate-900/10",
      text: "To Do"
    },
    IN_PROGRESS: {
      border: "border-t-4 border-t-indigo-500",
      dot: "bg-indigo-500",
      bg: "bg-indigo-50/10 dark:bg-indigo-950/5",
      text: "In Progress"
    },
    REVIEW: {
      border: "border-t-4 border-t-amber-500",
      dot: "bg-amber-500",
      bg: "bg-amber-50/10 dark:bg-amber-955/5",
      text: "In Review"
    },
    DONE: {
      border: "border-t-4 border-t-emerald-500",
      dot: "bg-emerald-500",
      bg: "bg-emerald-50/10 dark:bg-emerald-950/5",
      text: "Done"
    }
  };

  const style = headerStyles[title] || headerStyles.TODO;

  return (
    <div 
      className={`rounded-2xl border border-slate-205 dark:border-slate-805 p-4 flex flex-col gap-4 min-h-[500px] ${style.bg} ${style.border} transition-colors duration-300`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`}></span>
          <h3 className="font-bold text-slate-850 dark:text-slate-200 text-sm">
            {style.text}
          </h3>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-full border border-slate-200/50 dark:border-slate-700/50">
          {tasks.length}
        </span>
      </div>

      {/* Cards Scroll Container */}
      <div className="flex-1 flex flex-col gap-3.5 overflow-y-auto max-h-[600px] pr-0.5 scrollbar-thin">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-2 text-center text-xs text-slate-400 italic flex-1 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/20 dark:bg-transparent">
            No tasks in this stage
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
