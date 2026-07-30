import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useWorkspaceStore from "../store/workspace.store";
import useProjectStore from "../store/project.store";
import { getProjects, deleteProject } from "../services/project.service";
import ProjectCard from "../components/ProjectCard";
import CreateProject from "../components/CreateProject";
import Button from "../components/ui/Button";
import Loader from "../components/ui/Loader";
import toast from "react-hot-toast";
import { Plus, Briefcase, LayoutGrid, Info, HelpCircle } from "lucide-react";

export default function Projects() {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspaceStore();
  const { projects, setProjects, setCurrentProject } = useProjectStore();

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);

  // Fetch projects for the active workspace
  const fetchProjects = useCallback(async () => {
    if (!currentWorkspace?._id) return;
    setLoading(true);
    try {
      const response = await getProjects(currentWorkspace._id);
      if (response && response.success) {
        setProjects(response.projects || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?._id, setProjects]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateOpen = () => {
    setProjectToEdit(null);
    setModalOpen(true);
  };

  const handleEditOpen = (project) => {
    setProjectToEdit(project);
    setModalOpen(true);
  };

  const handleDelete = async (project) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the project "${project.name}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      const response = await deleteProject(project._id);
      if (response && response.success) {
        toast.success("Project deleted successfully");
        fetchProjects();
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.error || error.response?.data?.message || "Failed to delete project";
      toast.error(errMsg);
    }
  };

  const handleProjectClick = (project) => {
    setCurrentProject(project);
    navigate(`/projects/${project._id}`);
  };

  // If no workspace is selected
  if (!currentWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 shadow-sm border border-indigo-100/50 dark:border-indigo-950/20">
          <LayoutGrid className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-905 dark:text-white mb-2">No Workspace Selected</h2>
        <p className="text-slate-500 dark:text-slate-450 max-w-md mb-6">
          Please select or create a workspace using the switcher in the navigation bar to manage your projects.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Projects
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            Managing projects for <span className="font-semibold text-slate-700 dark:text-slate-350">{currentWorkspace.name}</span>
          </p>
        </div>

        <Button
          onClick={handleCreateOpen}
          variant="primary"
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Button>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-8 h-8 text-indigo-600" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">Loading projects...</p>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/20 transition-all duration-300">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-5 border border-slate-200/50 dark:border-slate-800/50">
            <Briefcase className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No projects yet</h3>
          <p className="text-slate-500 dark:text-slate-450 max-w-sm mb-6 text-sm">
            Create a project to start planning sprints, tracking issues, and building tasks with your team.
          </p>
          <Button
            onClick={handleCreateOpen}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Project</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onEdit={handleEditOpen}
              onDelete={handleDelete}
              onClick={() => handleProjectClick(project)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      <CreateProject
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        projectToEdit={projectToEdit}
        onSuccess={fetchProjects}
      />
    </div>
  );
}
