import React, { useEffect } from "react";
import { Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Database, HardDrive, ChevronRight, FileText, Upload, AlertCircle } from "lucide-react";
import client from "../api/client";
import { Button } from "../lib/component/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../lib/component/ui/Card";
import { useAuthStore } from "../features/auth/authStore";

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export default function Dashboard() {
  const { user, token, setUser } = useAuthStore();

  if (!token || !user) {
    return <Navigate to="/login" />;
  }

  // Ping backend status
  const { data: pingData, status: pingStatus, error: pingError } = useQuery({
    queryKey: ["ping"],
    queryFn: async () => {
      const response = await client.get("/api/ping");
      return response.data;
    },
    refetchInterval: 10000,
    retry: 1,
  });

  // Fetch updated user info
  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const response = await client.get("/api/auth/me");
      return response.data.user;
    },
    refetchInterval: 15000,
    enabled: !!token,
  });

  // Update store when meData changes
  useEffect(() => {
    if (meData) {
      setUser(meData);
    }
  }, [meData, setUser]);

  // Fetch recent files
  const { data: files } = useQuery({
    queryKey: ["files"],
    queryFn: async () => {
      const response = await client.get("/api/files");
      return response.data.data;
    },
    enabled: !!token,
  });

  const storageUsed = user.storageUsed || 0;
  const storageQuota = user.storageQuota || 5368709120;
  const usedPercentage = Math.min((storageUsed / storageQuota) * 100, 100);

  const recentFiles = files ? files.slice(0, 5) : [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Welcome */}
      <Card className="flex md:flex-row flex-col justify-between items-center gap-6 bg-linear-to-r from-purple-900/20 to-indigo-900/20 p-6 md:p-8 border-purple-500/10">
        <div>
          <h1 className="bg-clip-text bg-linear-to-r from-white via-slate-100 to-purple-300 font-bold text-transparent text-3xl md:text-4xl tracking-tight">
            Welcome, {user.name}
          </h1>
          <p className="mt-2 max-w-xl text-slate-400 text-sm">
            Your personal, secure cloud storage space is ready. Upload files and manage your data with decentralized privacy.
          </p>
        </div>
        <div className="flex gap-4">
          <Link to="/drive">
            <Button className="font-semibold flex items-center gap-2">
              <Upload className="w-4 h-4" /> Go to Drive
            </Button>
          </Link>
        </div>
      </Card>

      {/* Status Indicators Grid */}
      <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
        {/* API Connection Card */}
        <Card className="flex flex-col justify-between p-5 border-slate-800/80 bg-slate-950/40">
          <CardHeader className="flex-row justify-between items-center space-y-0 p-0">
            <span className="font-semibold text-slate-400 text-sm">API Connection</span>
            <Activity className="w-5 h-5 text-purple-400" />
          </CardHeader>
          <CardContent className="flex flex-col justify-between mt-4 p-0 h-full">
            <div className="flex items-center gap-3">
              {pingStatus === "pending" && (
                <>
                  <div className="bg-yellow-500 rounded-full w-3.5 h-3.5 animate-pulse" />
                  <span className="font-semibold text-yellow-500 text-lg">Connecting...</span>
                </>
              )}
              {pingStatus === "success" && (
                <>
                  <div className="bg-emerald-500 shadow-emerald-500/50 shadow-md rounded-full w-3.5 h-3.5" />
                  <span className="font-semibold text-emerald-400 text-lg">Connected ✅</span>
                </>
              )}
              {pingStatus === "error" && (
                <>
                  <div className="bg-rose-500 shadow-md shadow-rose-500/50 rounded-full w-3.5 h-3.5" />
                  <span className="font-semibold text-rose-400 text-lg">Disconnected ❌</span>
                </>
              )}
            </div>
            <div className="mt-4 font-mono text-slate-500 text-xs">
              {pingStatus === "success"
                ? `Server: "${pingData?.message || 'Active'}"`
                : pingError
                  ? `Error: ${pingError.message}`
                  : "Locating endpoint..."}
            </div>
          </CardContent>
        </Card>

        {/* Database Status Card */}
        <Card className="flex flex-col justify-between p-5 border-slate-800/80 bg-slate-950/40">
          <CardHeader className="flex-row justify-between items-center space-y-0 p-0">
            <span className="font-semibold text-slate-400 text-sm">Database (MongoDB)</span>
            <Database className="w-5 h-5 text-blue-400" />
          </CardHeader>
          <CardContent className="flex flex-col justify-between mt-4 p-0 h-full">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500 shadow-emerald-500/50 shadow-md rounded-full w-3.5 h-3.5" />
              <span className="font-semibold text-emerald-400 text-lg">Active</span>
            </div>
            <div className="mt-4 font-mono text-slate-500 text-xs">User: {user.email}</div>
          </CardContent>
        </Card>

        {/* Garage Object Storage Card */}
        <Card className="flex flex-col justify-between p-5 border-slate-800/80 bg-slate-950/40">
          <CardHeader className="flex-row justify-between items-center space-y-0 p-0">
            <span className="font-semibold text-slate-400 text-sm">Storage (Garage S3)</span>
            <HardDrive className="w-5 h-5 text-indigo-400" />
          </CardHeader>
          <CardContent className="flex flex-col justify-between mt-4 p-0 h-full">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500 shadow-emerald-500/50 shadow-md rounded-full w-3.5 h-3.5" />
              <span className="font-semibold text-emerald-400 text-lg">Ready</span>
            </div>
            <div className="mt-4 font-mono text-slate-500 text-xs">Prefix: {user._id}/</div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Allocation & Quick Links */}
      <div className="gap-6 grid grid-cols-1 lg:grid-cols-3">
        {/* Storage Progress */}
        <Card className="lg:col-span-2 p-6 flex flex-col justify-between border-slate-800/80 bg-slate-950/40">
          <div>
            <CardHeader className="mb-4 p-0">
              <CardTitle className="text-lg text-white">Storage Allocation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="bg-slate-850 p-0.5 border border-slate-800 rounded-full w-full h-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full h-full transition-all duration-500 ease-out" 
                  style={{ width: `${usedPercentage}%` }}
                />
              </div>
              <div className="flex justify-between font-mono text-slate-400 text-xs">
                <span>{formatBytes(storageUsed)} Used</span>
                <span>{formatBytes(storageQuota)} Max Quota</span>
              </div>
            </CardContent>
          </div>
          
          <div className="mt-8 border-t border-slate-800/60 pt-4 flex gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-slate-200">Files count:</span> {files?.length || 0}
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700 self-center" />
            <div className="flex items-center gap-1">
              <span className="font-semibold text-slate-200">Usage:</span> {usedPercentage.toFixed(2)}%
            </div>
          </div>
        </Card>

        {/* Quick Links */}
        <Card className="flex flex-col justify-between p-6 border-slate-800/80 bg-slate-950/40">
          <CardHeader className="mb-4 p-0">
            <CardTitle className="text-lg text-white">Quick Resources</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="space-y-3">
              <li>
                <Link to="/drive" className="flex justify-between items-center text-slate-300 hover:text-purple-400 text-sm transition-colors">
                  <span>Open Drive Interface</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </li>
              <li>
                <a
                  href="http://localhost:3909"
                  target="_blank"
                  rel="noreferrer"
                  className="flex justify-between items-center text-slate-300 hover:text-purple-400 text-sm transition-colors"
                >
                  <span>Garage UI (Port 3909)</span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:3000/health"
                  target="_blank"
                  rel="noreferrer"
                  className="flex justify-between items-center text-slate-300 hover:text-purple-400 text-sm transition-colors"
                >
                  <span>API Health Check</span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Recent Files Table */}
      <Card className="p-6 border-slate-800/80 bg-slate-950/40">
        <CardHeader className="flex-row justify-between items-center space-y-0 p-0 mb-6">
          <CardTitle className="text-xl font-bold text-white">Recent Files</CardTitle>
          {files && files.length > 0 && (
            <Link to="/drive">
              <Button variant="link" className="text-purple-400 flex items-center gap-1 p-0 text-sm">
                View all files <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {recentFiles.length === 0 ? (
            <div className="text-center py-8 text-slate-500 space-y-3">
              <FileText className="w-12 h-12 mx-auto text-slate-700" />
              <p className="text-sm">No files uploaded yet.</p>
              <Link to="/drive">
                <Button size="sm" variant="secondary">Upload your first file</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="pb-3 pl-4">Filename</th>
                    <th className="pb-3">Size</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3 pr-4">Uploaded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-sm">
                  {recentFiles.map((file) => (
                    <tr key={file._id} className="hover:bg-slate-900/20 group transition-colors">
                      <td className="py-3.5 pl-4 font-medium text-slate-200 flex items-center gap-3">
                        <FileText className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                        <span className="truncate max-w-xs">{file.originalName}</span>
                      </td>
                      <td className="py-3.5 text-slate-300 font-mono">{formatBytes(file.size)}</td>
                      <td className="py-3.5 text-slate-400 text-xs">{file.mimeType}</td>
                      <td className="py-3.5 text-slate-400 text-xs pr-4">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
