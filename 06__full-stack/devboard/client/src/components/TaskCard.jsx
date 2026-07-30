import { Calendar, Tag, Trash2, ArrowRight } from "lucide-react";
import Avatar from "./ui/Avatar";
import { useAuthStore } from "../store/authStore";

export default function TaskCard({ task, onStatusChange, onDelete }) {
  const user = useAuthStore((state) => state.user);

  // Styling maps
  const priorityStyles = {
    LOW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200",
    MEDIUM: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200",
    HIGH: "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border-orange-200",
    URGENT: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200"
  };

  const priorityText = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    URGENT: "Urgent"
  };

  const columns = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
  const columnText = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    REVIEW: "In Review",
    DONE: "Done"
  };

  // Due date warnings
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
  const formattedDate = task.dueDate 
    ? new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : null;

  return (
    <div 
      className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col gap-3"
    >
      {/* Card Header: Priority & Actions */}
      <div className="flex items-center justify-between gap-2">
        <span 
          className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
            priorityStyles[task.priority] || priorityStyles.MEDIUM
          }`}
        >
          {priorityText[task.priority] || "Medium"}
        </span>

        <button
          onClick={() => onDelete(task._id)}
          className="p-1 rounded-lg text-slate-400 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-955/20 transition opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
          title="Delete Task"
          type="button"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Task Details */}
      <div>
        <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-sm line-clamp-2">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-slate-500 dark:text-slate-450 text-xs mt-1 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Labels / Tags */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.labels.map((label, idx) => (
            <span 
              key={idx} 
              className="text-[10px] px-1.5 py-0.2 bg-indigo-50/50 text-indigo-650 dark:bg-indigo-950/20 dark:text-indigo-400 rounded-md border border-indigo-100/30 font-medium"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Card Footer: Assignee & Date & Status Selector */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-1.5 flex-wrap gap-3">
        {/* Left Side: Assignee / Date */}
        <div className="flex items-center gap-3">
          {task.assignedTo ? (
            <div className="flex items-center gap-1.5">
              <Avatar name={task.assignedTo.name} className="w-6 h-6 border-2 border-white dark:border-slate-900" />
              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 max-w-[80px] truncate">
                {task.assignedTo.name.split(" ")[0]}
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-400 italic">Unassigned</span>
          )}

          {formattedDate && (
            <div 
              className={`flex items-center gap-1 text-[10px] font-medium ${
                isOverdue ? "text-red-500" : "text-slate-450"
              }`}
              title={isOverdue ? "Overdue!" : "Due Date"}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>

        {/* Right Side: Status Selector */}
        <div>
          <label htmlFor={`status-${task._id}`} className="sr-only">Move Task</label>
          <select
            id={`status-${task._id}`}
            value={task.status}
            onChange={(e) => onStatusChange(task._id, e.target.value)}
            className="text-[11px] font-medium bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-705 border border-slate-205 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-350 focus:outline-none transition cursor-pointer"
          >
            {columns.map((col) => (
              <option key={col} value={col}>
                {columnText[col]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
