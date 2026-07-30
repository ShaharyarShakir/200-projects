import { useState, useEffect } from "react";
import { X, ClipboardList, Info } from "lucide-react";
import { createTask } from "../services/task.service";
import Button from "./ui/Button";
import toast from "react-hot-toast";

export default function CreateTask({ isOpen, onClose, project, onSuccess }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [labelsInput, setLabelsInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setPriority("MEDIUM");
      setDueDate("");
      setLabelsInput("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }

    if (!project?._id) {
      toast.error("Invalid project reference");
      return;
    }

    // Process labels: split by comma, trim, filter out empty ones
    const labels = labelsInput
      ? labelsInput.split(",").map(lbl => lbl.trim()).filter(lbl => lbl.length > 0)
      : [];

    setLoading(true);
    try {
      const response = await createTask({
        title: title.trim(),
        description: description.trim(),
        project: project._id,
        assignedTo: assignedTo || undefined,
        priority,
        labels,
        dueDate: dueDate || undefined
      });

      if (response && response.success) {
        toast.success("Task created successfully!");
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.error || error.response?.data?.message || "Failed to create task";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-205 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-105 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-650 dark:text-indigo-400">
              <ClipboardList className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Create New Task
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-205 hover:bg-slate-101 dark:hover:bg-slate-800 transition cursor-pointer"
            type="button"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label
              htmlFor="task-title"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              required
              placeholder="e.g. Implement user login API, Design card buttons"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="task-desc"
              className="block text-sm font-medium text-slate-705 dark:text-slate-300 mb-1.5"
            >
              Description
            </label>
            <textarea
              id="task-desc"
              rows={3}
              placeholder="Provide a detailed description of the task requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Assignee */}
            <div>
              <label
                htmlFor="task-assignee"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Assignee
              </label>
              <select
                id="task-assignee"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-909 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-sm"
              >
                <option value="">Unassigned</option>
                {project?.members?.map((m) => {
                  const u = m.user || {};
                  return (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label
                htmlFor="task-priority"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Priority
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-905 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-sm"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Due Date */}
            <div>
              <label
                htmlFor="task-date"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Due Date
              </label>
              <input
                id="task-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-sm"
              />
            </div>

            {/* Labels / Tags */}
            <div>
              <label
                htmlFor="task-labels"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Labels (comma separated)
              </label>
              <input
                id="task-labels"
                type="text"
                placeholder="e.g. backend, bug, ui"
                value={labelsInput}
                onChange={(e) => setLabelsInput(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-sm"
              />
            </div>
          </div>

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
              {loading ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
