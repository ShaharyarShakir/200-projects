import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useProjectStore from "../store/project.store";
import { getProject } from "../services/project.service";
import { getProjectActivities } from "../services/projectMember.service";
import ProjectHeader from "../components/ProjectHeader";
import StatsCard from "../components/StatsCard";
import TeamMembers from "../components/TeamMembers";
import ActivityTimeline from "../components/ActivityTimeline";
import CreateProject from "../components/CreateProject";
import Loader from "../components/ui/Loader";
import Button from "../components/ui/Button";
import toast from "react-hot-toast";
import { 
  Users, 
  Clock, 
  Calendar,
  AlertCircle
} from "lucide-react";

export default function ProjectDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProject, setCurrentProject } = useProjectStore();
  
  const [loading, setLoading] = useState(false);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
      navigate("/projects");
    }
  }, [id, setCurrentProject, navigate]);

  // Fetch project activities
  const fetchActivities = useCallback(async () => {
    if (!id) return;
    setActivitiesLoading(true);
    try {
      const response = await getProjectActivities(id);
      if (response && response.success) {
        setActivities(response.activities || []);
      }
    } catch (error) {
      console.error(error);
      // Fail silently for activities to not block main page render
    } finally {
      setActivitiesLoading(false);
    }
  }, [id]);

  // Initial load
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchProjectDetails(), fetchActivities()]);
      setLoading(false);
    };
    initData();
  }, [id, fetchProjectDetails, fetchActivities]);

  // Handle member list updates or project status changes
  const handleUpdate = async () => {
    await Promise.all([fetchProjectDetails(), fetchActivities()]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 bg-slate-50/50 dark:bg-slate-955/20 rounded-2xl">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 text-indigo-600" />
          <p className="text-slate-550 dark:text-slate-400 text-sm font-medium">Loading project dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Project not found</h2>
        <Button onClick={() => navigate("/projects")} variant="secondary">
          Back to Projects
        </Button>
      </div>
    );
  }

  // Calculate project age
  const getProjectAge = () => {
    if (!currentProject.createdAt) return "0 days";
    const created = new Date(currentProject.createdAt);
    const today = new Date();
    const diffTime = Math.abs(today - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} ${diffDays === 1 ? "day" : "days"}`;
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <ProjectHeader
        project={currentProject}
        onManageTeam={() => {
          const teamSection = document.getElementById("team-section");
          if (teamSection) {
            teamSection.scrollIntoView({ behavior: "smooth" });
          }
        }}
        onSettings={() => setSettingsOpen(true)}
      />

      {/* Grid of Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatsCard
          title="Team Size"
          value={currentProject.members?.length || 1}
          icon={Users}
          color="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30"
        />
        <StatsCard
          title="Project Age"
          value={getProjectAge()}
          icon={Calendar}
          color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
        />
        <StatsCard
          title="Project Status"
          value={currentProject.status || "ACTIVE"}
          icon={Clock}
          color="text-amber-600 bg-amber-50 dark:bg-amber-950/30"
        />
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle: Activity Timeline */}
        <div className="lg:col-span-2">
          <ActivityTimeline 
            activities={activities} 
            loading={activitiesLoading} 
          />
        </div>

        {/* Right: Team Members */}
        <div id="team-section">
          <TeamMembers 
            project={currentProject} 
            onUpdate={handleUpdate} 
          />
        </div>
      </div>

      {/* Project Settings / Edit Modal */}
      <CreateProject
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        projectToEdit={currentProject}
        onSuccess={handleUpdate}
      />
    </div>
  );
}
