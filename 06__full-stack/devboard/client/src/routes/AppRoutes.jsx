import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import CreateWorkspace from "../pages/CreateWorkspace";
import Projects from "../pages/Projects";
import ProjectDashboard from "../pages/ProjectDashboard";
import Board from "../pages/Board";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes inside AuthLayout wrapper */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected workspace routes inside DashboardLayout wrapper */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-workspace" element={<CreateWorkspace />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDashboard />} />
          <Route path="/projects/:id/board" element={<Board />} />
        </Route>

        {/* Redirect base path to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Fallback route - redirect any other path to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
