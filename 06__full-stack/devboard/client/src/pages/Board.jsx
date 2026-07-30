import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import useProjectStore from "../store/project.store";
import useTaskStore from "../store/task.store";
import { getProject } from "../services/project.service";
import { getTasks, updateTask, deleteTask } from "../services/task.service";
import KanbanBoard from "../components/KanbanBoard";
import CreateTask from "../components/CreateTask";
import Button from "../components/ui/Button";
import Loader from "../components/ui/Loader";
import toast from "react-hot-toast";
import { ArrowLeft, Plus, Search, Filter, FolderKanban } from "lucide-react";

export default function Board() {
  const { id } = useParams();
  const { currentProject, setCurrentProject } = useProjectStore();
  const { tasks, setTasks, updateLocalTask } = useTaskStore();

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // Fetch project details
  const fetchProjectDetails = useCallback(async () => {
    if (!id) return;
    try {
      const response = await getProject(id);
      if (response && response.success) {
        setCurrentProject(response.project);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load project details");
    }
  }, [id, setCurrentProject]);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!id) return;
    try {
      const response = await getTasks(id);
      if (response && response.success) {
        setTasks(response.tasks || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load tasks");
    }
  }, [id, setTasks]);

  // Initial data load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchProjectDetails(), fetchTasks()]);
      setLoading(false);
    };
    init();
  }, [id, fetchProjectDetails, fetchTasks]);

  // Handle status update
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const response = await updateTask(taskId, { status: newStatus });
      if (response && response.success) {
        updateLocalTask(response.task);
        toast.success(`Task moved to ${newStatus.replace("_", " ")}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to move task");
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId) => {
    const confirm = window.confirm("Are you sure you want to delete this task? This action is permanent.");
    if (!confirm) return;

    try {
      const response = await deleteTask(taskId);
      if (response && response.success) {
        toast.success("Task deleted successfully");
        fetchTasks(); // Refetch
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete task");
    }
  };

  // Filter tasks based on search query and priority
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.labels?.some(lbl => lbl.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPriority = priorityFilter === "" || task.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchQuery, priorityFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 text-indigo-650" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading project board...</p>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Project not found</h2>
        <Link to="/projects" className="text-indigo-600 hover:underline">
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div>
        <Link
          to={`/projects/${currentProject._id}`}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-450 dark:hover:text-slate-200 text-sm font-medium mb-3 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {currentProject.name} Board
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kanban task workflows and sprint tracking
              </p>
            </div>
          </div>

          <Button
            onClick={() => setModalOpen(true)}
            variant="primary"
            className="flex items-center gap-2 self-start sm:self-auto shadow-md shadow-indigo-650/10"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-205 dark:border-slate-800 shadow-xs">
        {/* Search */}
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks by title, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <label htmlFor="priority-filter" className="sr-only">Priority Filter</label>
          <select
            id="priority-filter"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        tasks={filteredTasks}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteTask}
      />

      {/* Create Task Modal */}
      <CreateTask
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        project={currentProject}
        onSuccess={fetchTasks}
      />
    </div>
  );
}
