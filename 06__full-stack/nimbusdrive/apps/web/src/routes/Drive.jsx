import React, { useState, useRef, useEffect } from "react";
import { Link, Navigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Folder, ChevronRight, FileText, Upload, Loader2, AlertCircle, CheckCircle } from "lucide-react";
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

export default function Drive() {
  const { user, token, setUser } = useAuthStore();
  const fileInputRef = useRef(null);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!token || !user) {
    return <Navigate to="/login" />;
  }

  // Fetch updated user info
  const { data: meData, refetch: refetchMe } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const response = await client.get("/api/auth/me");
      return response.data.user;
    },
    enabled: !!token,
  });

  useEffect(() => {
    if (meData) {
      setUser(meData);
    }
  }, [meData, setUser]);

  // Fetch files
  const { data: files, refetch: refetchFiles, isPending: filesPending } = useQuery({
    queryKey: ["files"],
    queryFn: async () => {
      const response = await client.get("/api/files");
      return response.data.data;
    },
    enabled: !!token,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await client.post("/api/files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg("");
    setSuccessMsg("");

    // Front-end size check (50 MB limit)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMsg("File size exceeds 50 MB limit");
      return;
    }

    // Quota check
    if (user.storageUsed + file.size > user.storageQuota) {
      setErrorMsg("Insufficient storage quota remaining");
      return;
    }

    uploadMutation.mutate(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const storageUsed = user.storageUsed || 0;
  const storageQuota = user.storageQuota || 5368709120;
  const usedPercentage = Math.min((storageUsed / storageQuota) * 100, 100);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-400">
            Files Manager
          </h1>
          <p className="text-slate-400 text-sm mt-1">Upload and manage files inside your personal prefix.</p>
        </div>
        
        {/* Upload Trigger */}
        <div className="relative">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            disabled={uploadMutation.isPending}
          />
          <Button 
            onClick={triggerFileSelect}
            disabled={uploadMutation.isPending}
            className="font-semibold flex items-center gap-2 px-6 py-2.5 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload File
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Messages & Upload Progress */}
      {uploadMutation.isPending && (
        <Card className="p-4 border-purple-500/20 bg-purple-500/5">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-purple-300">
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Uploading to Garage...
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-850 rounded-full h-2 overflow-hidden border border-slate-800">
              <div 
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </Card>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm font-medium">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Storage & Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Storage Bar Card */}
        <Card className="p-6 border-slate-800/80 bg-slate-950/40">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-base text-slate-300">Storage Usage</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-3">
            <div className="bg-slate-850 p-0.5 border border-slate-800 rounded-full w-full h-3.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full h-full transition-all duration-500 ease-out" 
                style={{ width: `${usedPercentage}%` }}
              />
            </div>
            <div className="flex justify-between font-mono text-slate-400 text-xs">
              <span>{formatBytes(storageUsed)} Used</span>
              <span>{usedPercentage.toFixed(1)}%</span>
            </div>
            <p className="text-xs text-slate-500 pt-2 border-t border-slate-900">
              Total Limit: {formatBytes(storageQuota)}.
            </p>
          </CardContent>
        </Card>

        {/* Directory Info Card */}
        <Card className="p-6 border-slate-800/80 bg-slate-950/40 lg:col-span-2">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-base text-slate-300">Personal Namespace Prefix</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800/50 p-4 rounded-xl">
              <Folder className="w-8 h-8 text-purple-400 flex-shrink-0" />
              <div className="font-mono text-xs text-slate-400 select-all truncate">
                <span className="text-slate-500">nimbus-drive/</span>
                <span className="text-purple-300">{user._id}/</span>
                <span className="text-slate-500">[uuid]/[filename]</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Every file is uploaded inside an isolated user namespace in the Garage cluster.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Files List Card */}
      <Card className="p-6 border-slate-800/80 bg-slate-950/40">
        <CardHeader className="p-0 mb-6">
          <CardTitle className="text-xl font-bold text-white">All Files</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filesPending ? (
            <div className="flex justify-center items-center py-16 text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Fetching files...</span>
            </div>
          ) : !files || files.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-4">
              <Folder className="w-16 h-16 mx-auto text-slate-800 animate-pulse" />
              <div className="space-y-1">
                <p className="text-base font-semibold text-slate-400">Your drive is empty</p>
                <p className="text-xs max-w-xs mx-auto">Click "Upload File" at the top right to store your first document.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="pb-3 pl-4">Filename</th>
                    <th className="pb-3">Size</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">S3 Key Path</th>
                    <th className="pb-3 pr-4 text-right">Uploaded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-sm">
                  {files.map((file) => (
                    <tr key={file._id} className="hover:bg-slate-900/20 group transition-colors">
                      <td className="py-3.5 pl-4 font-medium text-slate-200 flex items-center gap-3">
                        <FileText className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                        <span className="truncate max-w-xs" title={file.originalName}>{file.originalName}</span>
                      </td>
                      <td className="py-3.5 text-slate-300 font-mono">{formatBytes(file.size)}</td>
                      <td className="py-3.5 text-slate-400 text-xs">{file.mimeType}</td>
                      <td className="py-3.5 text-slate-500 text-xs font-mono select-all max-w-[180px] truncate" title={file.objectKey}>
                        {file.objectKey}
                      </td>
                      <td className="py-3.5 text-slate-400 text-xs pr-4 text-right">
                        {new Date(file.createdAt).toLocaleString()}
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
