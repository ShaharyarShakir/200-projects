import { Link } from "react-router-dom";
import { ArrowLeft, FolderKanban, Users, Settings, LayoutGrid } from "lucide-react";
import Button from "./ui/Button";
import { useAuthStore } from "../store/authStore";

export default function ProjectHeader({ project, onManageTeam, onSettings }) {
  const user = useAuthStore((state) => state.user);
  const isOwner = user && project.owner && (project.owner._id === user._id || project.owner === user._id);
  const requesterMember = project.members?.find(m => m.user?._id === user?._id || m.user === user?._id);
  const isAuthorized = isOwner || (requesterMember && ["OWNER", "ADMIN"].includes(requesterMember.role));

  const statusStyles = {
    ACTIVE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-250",
    ARCHIVED: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-250",
    COMPLETED: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-250"
  };

  const statusText = {
    ACTIVE: "Active",
    ARCHIVED: "Archived",
    COMPLETED: "Completed"
  };

  return (
    <div>
      {/* Back button */}
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-455 dark:hover:text-slate-205 text-sm font-medium mb-4 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Projects</span>
      </Link>

      {/* Main header row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-650 dark:text-indigo-400 shrink-0 shadow-xs border border-indigo-100/50 dark:border-indigo-950/20">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {project.name}
              </h1>
              <span 
                className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                  statusStyles[project.status] || statusStyles.ACTIVE
                }`}
              >
                {statusText[project.status] || "Active"}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-2xl">
              {project.description || "No description provided for this project."}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <Link to={`/projects/${project._id}/board`}>
            <Button 
              variant="primary" 
              className="flex items-center gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Kanban Board</span>
            </Button>
          </Link>
          
          {isAuthorized && (
            <>
              <Button 
                variant="secondary" 
                onClick={onManageTeam}
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                <span>Manage Team</span>
              </Button>
              {isOwner && (
                <Button 
                  variant="secondary" 
                  onClick={onSettings}
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
