import { useAuthStore } from "../store/authStore";
import { FolderKanban, Edit2, Trash2, Calendar, Users } from "lucide-react";
import Card from "./ui/Card";
import Button from "./ui/Button";

export default function ProjectCard({ project, onEdit, onDelete, onClick }) {
  const user = useAuthStore((state) => state.user);
  const isOwner = user && project.owner && (project.owner._id === user._id || project.owner === user._id);

  // Status badge colors
  const statusStyles = {
    ACTIVE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450 border-emerald-250",
    ARCHIVED: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-450 border-amber-250",
    COMPLETED: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-450 border-indigo-250"
  };

  const statusText = {
    ACTIVE: "Active",
    ARCHIVED: "Archived",
    COMPLETED: "Completed"
  };

  const handleCardClick = (e) => {
    // Prevent triggering click when clicking action buttons
    if (e.target.closest("button")) return;
    if (onClick) onClick();
  };

  return (
    <Card 
      className="group relative flex flex-col justify-between hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-900 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      <div onClick={handleCardClick} className="flex-1">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300 shrink-0">
            <FolderKanban className="w-5 h-5" />
          </div>

          <span 
            className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
              statusStyles[project.status] || statusStyles.ACTIVE
            }`}
          >
            {statusText[project.status] || "Active"}
          </span>
        </div>

        {/* Name & Description */}
        <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
          {project.name}
        </h3>

        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 mb-6 line-clamp-2 min-h-[40px]">
          {project.description || "No description provided."}
        </p>
      </div>

      {/* Card Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-450" />
            <span>{project.members?.length || 1} {project.members?.length === 1 ? "member" : "members"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-450" />
            <span>{new Date(project.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Actions (Only for project owner) */}
        {isOwner && (
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => onEdit(project)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-650 hover:bg-indigo-50 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/40 transition cursor-pointer"
              title="Edit Project"
              type="button"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(project)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-650 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition cursor-pointer"
              title="Delete Project"
              type="button"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
