import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import client from "../api/client";
import { useAuthStore } from "../features/auth/authStore";
import { useDriveStore } from "../features/drive/driveStore";

// Modular Dashboard subcomponents
import StorageHero from "../features/dashboard/components/StorageHero";
import ClusterStatusGrid from "../features/dashboard/components/ClusterStatusGrid";
import StorageBreakdown from "../features/dashboard/components/StorageBreakdown";
import RecentActivity from "../features/dashboard/components/RecentActivity";

export default function Dashboard() {
  const { user, token, setUser } = useAuthStore();
  const { setActiveTab } = useDriveStore();
  const navigate = useNavigate();

  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Ping backend status
  const {
    data: pingData,
    status: pingStatus,
    error: pingError,
  } = useQuery({
    queryKey: ["ping"],
    queryFn: async () => {
      const response = await client.get("/api/ping");
      return response.data;
    },
    refetchInterval: 10000,
    retry: 1,
  });

  // Fetch updated user info
  const { data: meData, refetch: refetchMe } = useQuery({
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
  const { data: files, refetch: refetchFiles } = useQuery({
    queryKey: ["files"],
    queryFn: async () => {
      const response = await client.get("/api/files");
      return response.data.data;
    },
    enabled: !!token,
  });

  const handleShortcutClick = (tab) => {
    setActiveTab(tab);
    navigate({ to: "/drive" });
  };

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await client.post("/api/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });
      return response.data;
    },
    onSuccess: () => {
      setUploadProgress(0);
      setSuccessMsg("File uploaded successfully!");
      refetchFiles();
      refetchMe();
      setTimeout(() => setSuccessMsg(""), 4000);
    },
    onError: (err) => {
      setUploadProgress(0);
      setErrorMsg(err.response?.data?.message || "File upload failed");
      setTimeout(() => setErrorMsg(""), 5000);
    },
  });

  const handleUpload = (file) => {
    setErrorMsg("");
    setSuccessMsg("");

    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMsg("File size exceeds 50 MB limit");
      return;
    }

    if (user.storageUsed + file.size > user.storageQuota) {
      setErrorMsg("Insufficient storage quota remaining");
      return;
    }

    uploadMutation.mutate(file);
  };

  if (!token || !user) return <Navigate to="/login" />;

  const storageUsed = user.storageUsed || 0;
  const storageQuota = user.storageQuota || 5368709120;
  const usedPercentage = Math.min((storageUsed / storageQuota) * 100, 100);

  return (
    <div className="space-y-8 text-slate-800 dark:text-slate-200 animate-fade-in">
      {/* Redesigned Storage & Uploader Hero */}
      <StorageHero
        user={user}
        files={files}
        usedPercentage={usedPercentage}
        handleShortcutClick={handleShortcutClick}
        handleUpload={handleUpload}
        uploadProgress={uploadProgress}
        uploadPending={uploadMutation.isPending}
        successMsg={successMsg}
        errorMsg={errorMsg}
      />

      {/* Cloud Stack Node Statuses */}
      <ClusterStatusGrid
        pingStatus={pingStatus}
        pingData={pingData}
        pingError={pingError}
        user={user}
      />

      {/* Storage Breakdown Widget */}
      <StorageBreakdown user={user} files={files} />

      {/* Recent Activity List */}
      <RecentActivity files={files} handleShortcutClick={handleShortcutClick} />
    </div>
  );
}
