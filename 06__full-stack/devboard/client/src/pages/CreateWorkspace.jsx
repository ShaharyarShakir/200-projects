import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createWorkspace, getWorkspaces } from "../services/workspace.service";
import useWorkspaceStore from "../store/workspace.store";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import toast from "react-hot-toast";
import { Briefcase, ArrowLeft } from "lucide-react";

export default function CreateWorkspace() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const { setWorkspaces, setCurrentWorkspace } = useWorkspaceStore();

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Workspace name is required");
      return;
    }

    setLoading(true);
    try {
      const response = await createWorkspace({
        name: name.trim(),
        description: description.trim()
      });

      if (response && response.success) {
        toast.success("Workspace created successfully!");
        
        // Refetch workspaces and set this one as current
        const fetchResponse = await getWorkspaces();
        if (fetchResponse && fetchResponse.workspaces) {
          setWorkspaces(fetchResponse.workspaces);
          // Find the newly created workspace
          const newWS = fetchResponse.workspaces.find(w => w._id === response.workspace._id) || response.workspace;
          setCurrentWorkspace(newWS);
        } else {
          setCurrentWorkspace(response.workspace);
        }

        navigate("/dashboard");
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Failed to create workspace";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10">
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm font-medium mb-6 transition cursor-pointer bg-transparent border-0"
        type="button"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      <Card className="shadow-md border border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-650 dark:text-indigo-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Create New Workspace
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Set up a shared environment for your projects and team.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label
              htmlFor="ws-name"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Workspace Name <span className="text-red-500">*</span>
            </label>
            <input
              id="ws-name"
              type="text"
              required
              placeholder="e.g. Acme Engineering, Marketing Team"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="ws-desc"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Description
            </label>
            <textarea
              id="ws-desc"
              rows={3}
              placeholder="Describe the purpose of this workspace..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-sm resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => navigate("/dashboard")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Workspace"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
