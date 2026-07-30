import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useEffect } from "react";
import useWorkspaceStore from "../store/workspace.store";
import { getWorkspaces } from "../services/workspace.service";

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();
  const { setWorkspaces, currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();

  useEffect(() => {
    if (user) {
      const fetchWorkspaces = async () => {
        try {
          const response = await getWorkspaces();
          if (response && response.success && response.workspaces) {
            setWorkspaces(response.workspaces);
            if (response.workspaces.length > 0) {
              const stillExists = response.workspaces.some(w => w._id === currentWorkspace?._id);
              if (!currentWorkspace || !stillExists) {
                setCurrentWorkspace(response.workspaces[0]);
              }
            } else {
              setCurrentWorkspace(null);
            }
          }
        } catch (error) {
          console.error("Failed to fetch workspaces:", error);
        }
      };
      fetchWorkspaces();
    }
  }, [user, setWorkspaces, setCurrentWorkspace, currentWorkspace]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar />
        <main className="p-6 flex-1">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
