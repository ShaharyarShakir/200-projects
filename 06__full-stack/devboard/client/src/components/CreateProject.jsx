import { useState, useEffect } from "react";
import { X, Briefcase, Info } from "lucide-react";
import useWorkspaceStore from "../store/workspace.store";
import { createProject, updateProject } from "../services/project.service";
import Button from "./ui/Button";
import toast from "react-hot-toast";

export default function CreateProject({ isOpen, onClose, projectToEdit, onSuccess }) {
  const { currentWorkspace } = useWorkspaceStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name || "");
      setDescription(projectToEdit.description || "");
      setStatus(projectToEdit.status || "ACTIVE");
    } else {
      setName("");
      setDescription("");
      setStatus("ACTIVE");
    }
  }, [projectToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }

    if (!currentWorkspace) {
      toast.error("No active workspace selected. Please select or create a workspace first.");
      return;
    }

    setLoading(true);
    try {
      if (projectToEdit) {
        // Edit existing project
        const response = await updateProject(projectToEdit._id, {
          name: name.trim(),
          description: description.trim(),
          status
        });
        if (response && response.success) {
          toast.success("Project updated successfully!");
          onSuccess();
          onClose();
        }
      } else {
        // Create new project
        const response = await createProject({
          name: name.trim(),
          description: description.trim(),
          workspace: currentWorkspace._id
        });
        if (response && response.success) {
          toast.success("Project created successfully!");
          onSuccess();
          onClose();
        }
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.error || error.response?.data?.message || "Operation failed";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-105 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-650 dark:text-indigo-400">
              <Briefcase className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {projectToEdit ? "Edit Project" : "Create New Project"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            type="button"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="project-name"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              id="project-name"
              type="text"
              required
              placeholder="e.g. Mobile Application, API Redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="project-desc"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Description
            </label>
            <textarea
              id="project-desc"
              rows={4}
              placeholder="Provide a brief summary of the goals, timeline, and scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-sm resize-none"
            />
          </div>

          {projectToEdit && (
            <div>
              <label
                htmlFor="project-status"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Status
              </label>
              <select
                id="project-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-sm"
              >
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          )}

          {!projectToEdit && (
            <div className="flex gap-2.5 p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-850 dark:text-indigo-305 border border-indigo-100/50 dark:border-indigo-950/30 text-xs">
              <Info className="w-4 h-4 shrink-0 text-indigo-500 mt-0.5" />
              <span>
                New projects will automatically be associated with the selected workspace:{" "}
                <span className="font-semibold">{currentWorkspace?.name}</span>.
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-105 dark:border-slate-800 mt-2">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              type="button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? "Saving..." : projectToEdit ? "Save Changes" : "Create Project"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
