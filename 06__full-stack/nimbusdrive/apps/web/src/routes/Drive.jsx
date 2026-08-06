import { useState, useRef, useEffect } from "react";
import { Navigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Folder,
  FileText,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle,
  LayoutGrid,
  List,
  Search,
  Star,
  Trash2,
  Download,
  Eye,
  RotateCcw,
  Copy,
  Check,
  Edit2,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  X,
  ZoomIn,
  ZoomOut,
  Maximize,
  Info,
} from "lucide-react";
import client from "../api/client";
import { Button } from "../lib/component/ui/Button";
import { Card } from "../lib/component/ui/Card";
import { useAuthStore } from "../features/auth/authStore";
import { useDriveStore } from "../features/drive/driveStore";

// Bytes Formatter
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

// File type icon resolver
const getFileIconInfo = (mimeType) => {
  if (!mimeType)
    return {
      icon: <FileText className="w-5 h-5" />,
      color: "text-slate-500 bg-slate-500/10",
      type: "document",
    };
  const type = mimeType.toLowerCase();
  if (type.startsWith("image/")) {
    return {
      icon: <FileImage className="w-5 h-5 text-emerald-500" />,
      color: "text-emerald-500 bg-emerald-500/10",
      type: "image",
    };
  }
  if (type.startsWith("video/")) {
    return {
      icon: <FileVideo className="w-5 h-5 text-blue-500" />,
      color: "text-blue-500 bg-blue-500/10",
      type: "video",
    };
  }
  if (type.startsWith("audio/")) {
    return {
      icon: <FileAudio className="w-5 h-5 text-pink-500" />,
      color: "text-pink-500 bg-pink-500/10",
      type: "audio",
    };
  }
  if (type === "application/pdf") {
    return {
      icon: <FileText className="w-5 h-5 text-red-500" />,
      color: "text-red-500 bg-red-500/10",
      type: "pdf",
    };
  }
  if (
    type.includes("javascript") ||
    type.includes("json") ||
    type.includes("html") ||
    type.includes("css") ||
    type.includes("xml") ||
    type.startsWith("text/")
  ) {
    return {
      icon: <FileCode className="w-5 h-5 text-amber-500" />,
      color: "text-amber-500 bg-amber-500/10",
      type: "code",
    };
  }
  if (
    type.includes("zip") ||
    type.includes("tar") ||
    type.includes("gzip") ||
    type.includes("rar")
  ) {
    return {
      icon: <Folder className="w-5 h-5 text-indigo-500" />,
      color: "text-indigo-500 bg-indigo-500/10",
      type: "archive",
    };
  }
  return {
    icon: <FileText className="w-5 h-5 text-slate-500" />,
    color: "text-slate-500 bg-slate-500/10",
    type: "binary",
  };
};

export default function Drive() {
  const { user, token, setUser } = useAuthStore();
  const {
    activeTab,
    searchQuery,
    setSearchQuery,
    selectedFile,
    setSelectedFile,
    previewFile,
    setPreviewFile,
  } = useDriveStore();

  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [copiedField, setCopiedField] = useState(""); // "s3" | "direct"

  // Text preview states
  const [previewText, setPreviewText] = useState("");
  const [loadingPreviewText, setLoadingPreviewText] = useState(false);

  // Image zoom state
  const [zoomScale, setZoomScale] = useState(1);

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

  // Fetch files based on activeTab
  const {
    data: files,
    refetch: refetchFiles,
    isPending: filesPending,
  } = useQuery({
    queryKey: ["files", activeTab],
    queryFn: async () => {
      let endpoint = "/api/files";
      if (activeTab === "starred") endpoint = "/api/files/starred";
      if (activeTab === "trash") endpoint = "/api/files/trash";
      const response = await client.get(endpoint);
      return response.data.data;
    },
    enabled: !!token,
  });

  // Mutate Star Toggle
  const starMutation = useMutation({
    mutationFn: async (id) => {
      const response = await client.patch(`/api/files/${id}/star`);
      return response.data;
    },
    onSuccess: (data) => {
      refetchFiles();
      if (selectedFile && selectedFile._id === data.data._id) {
        setSelectedFile(data.data);
      }
    },
  });

  // Mutate Inline Rename
  const renameMutation = useMutation({
    mutationFn: async ({ id, name }) => {
      const response = await client.patch(`/api/files/${id}/rename`, { name });
      return response.data;
    },
    onSuccess: (data) => {
      refetchFiles();
      if (selectedFile && selectedFile._id === data.data._id) {
        setSelectedFile(data.data);
      }
      setSuccessMsg("File renamed successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || "Rename failed");
      setTimeout(() => setErrorMsg(""), 4000);
    },
  });

  // Mutate Soft Delete
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await client.delete(`/api/files/${id}`);
      return response.data;
    },
    onSuccess: () => {
      refetchFiles();
      refetchMe();
      setSelectedFile(null);
      setSuccessMsg("File moved to Trash Bin");
      setTimeout(() => setSuccessMsg(""), 3000);
    },
  });

  // Mutate Restore
  const restoreMutation = useMutation({
    mutationFn: async (id) => {
      const response = await client.post(`/api/files/${id}/restore`);
      return response.data;
    },
    onSuccess: () => {
      refetchFiles();
      refetchMe();
      setSelectedFile(null);
      setSuccessMsg("File restored successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || "Restore failed");
      setTimeout(() => setErrorMsg(""), 4000);
    },
  });

  // Mutate Permanent Delete
  const permanentDeleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await client.delete(`/api/files/${id}/permanent`);
      return response.data;
    },
    onSuccess: () => {
      refetchFiles();
      refetchMe();
      setSelectedFile(null);
      setSuccessMsg("File permanently deleted");
      setTimeout(() => setSuccessMsg(""), 3000);
    },
  });

  // Upload Mutation
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

  // Trigger file upload execution
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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleUpload(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Copy helper
  const handleCopyText = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  };

  // Drag and Drop global listeners
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  // Load preview text content inline
  useEffect(() => {
    if (previewFile) {
      const typeInfo = getFileIconInfo(previewFile.mimeType);
      if (typeInfo.type === "code" || typeInfo.type === "document") {
        setLoadingPreviewText(true);
        setPreviewText("");
        client
          .get(`/api/files/${previewFile._id}/preview`, { responseType: "text" })
          .then((res) => {
            setPreviewText(res.data);
          })
          .catch(() => {
            setPreviewText("Failed to load text preview content.");
          })
          .finally(() => {
            setLoadingPreviewText(false);
          });
      }
    } else {
      setZoomScale(1);
    }
  }, [previewFile]);

  // Filter files matching search query
  const filteredFiles = files
    ? files.filter((f) => f.originalName.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const getDirectUrl = (file) =>
    `${client.defaults.baseURL || "http://localhost:3000"}/api/files/${file._id}/preview?token=${token}`;
  const getDownloadUrl = (file) =>
    `${client.defaults.baseURL || "http://localhost:3000"}/api/files/${file._id}/download?token=${token}`;

  if (!token || !user) {
    return <Navigate to="/login" />;
  }

  return (
    <div
      className="space-y-6 animate-fade-in relative min-h-[calc(100vh-10rem)]"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Global Drag and Drop Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-teal-600/10 dark:bg-teal-950/20 border-4 border-dashed border-teal-500 backdrop-blur-xs p-6 transition-all animate-pulse">
          <Upload className="w-16 h-16 text-teal-500 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Drop your files here
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Upload directly into your Nimbus workspace prefix
          </p>
        </div>
      )}

      {/* Top Banner Filter Headers */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/60">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            {activeTab === "all" && "My Drive"}
            {activeTab === "starred" && "Starred Files"}
            {activeTab === "trash" && "Trash Bin"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {activeTab === "all" && "All active objects hosted in your personal bucket prefix."}
            {activeTab === "starred" && "Keep important shortcuts and starred items bookmarked."}
            {activeTab === "trash" && "Recover soft-deleted files or delete them permanently."}
          </p>
        </div>

        {/* Upload Trigger button */}
        {activeTab !== "trash" && (
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
              className="font-semibold flex items-center gap-2 px-5 py-2.5"
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
        )}
      </div>

      {/* Status Messages */}
      {uploadMutation.isPending && (
        <Card className="p-4 border-teal-500/20 bg-teal-500/5">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-teal-600 dark:text-teal-400">
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Uploading S3 object...
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-600 to-emerald-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </Card>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-sm font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl text-sm font-medium">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter and View toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-[#0b0c10]/40 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl shadow-xs">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-hidden focus:border-teal-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />
        </div>

        {/* View Layout Switcher */}
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-all duration-200 ${viewMode === "grid"
                ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-all duration-200 ${viewMode === "list"
                ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Explorer Workspace */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Main files area */}
        <div className="flex-1 w-full">
          {filesPending ? (
            <div className="flex flex-col justify-center items-center py-24 text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
              <span className="text-sm font-medium">Querying distributed metadata...</span>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-[#0b0c10]/20 border border-slate-200 dark:border-slate-850 rounded-3xl space-y-4">
              <Folder className="w-16 h-16 mx-auto text-slate-200 dark:text-slate-800 animate-pulse" />
              <div className="space-y-1">
                <p className="text-base font-semibold text-slate-600 dark:text-slate-400">
                  Empty View
                </p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  No files match your query. Drag and drop a file or click upload.
                </p>
              </div>
            </div>
          ) : viewMode === "grid" ? (
            /* GRID VIEW LAYOUT */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {filteredFiles.map((file) => {
                const info = getFileIconInfo(file.mimeType);
                const isSelected = selectedFile && selectedFile._id === file._id;

                return (
                  <div
                    key={file._id}
                    onClick={() => setSelectedFile(file)}
                    className={`group relative rounded-2xl border bg-white dark:bg-[#0b0f0e]/40 p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer select-none ${isSelected
                        ? "border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/10 dark:bg-teal-950/5"
                        : "border-slate-200 dark:border-slate-855"
                      }`}
                  >
                    {/* File card preview header */}
                    <div className="h-32 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 flex items-center justify-center mb-3 relative overflow-hidden">
                      {info.type === "image" ? (
                        <img
                          src={getDirectUrl(file)}
                          alt={file.originalName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className={`p-4 rounded-full ${info.color}`}>{info.icon}</div>
                      )}

                      {/* Floating actions menu */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity duration-200">
                        {activeTab !== "trash" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              starMutation.mutate(file._id);
                            }}
                            className={`p-1.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${file.isStarred
                                ? "text-amber-500"
                                : "text-slate-400 hover:text-amber-500"
                              }`}
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${file.isStarred ? "fill-amber-500" : ""}`}
                            />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewFile(file);
                          }}
                          className="p-1.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-teal-500 shadow-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* File card title */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span
                          className="block text-xs font-semibold text-slate-800 dark:text-slate-200 truncate pr-2"
                          title={file.originalName}
                        >
                          {file.originalName}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                          {formatBytes(file.size)}
                        </span>
                      </div>

                      {/* Star marker indicator */}
                      {file.isStarred && activeTab !== "trash" && (
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* LIST VIEW LAYOUT */
            <Card className="border-slate-200 dark:border-slate-850 bg-white dark:bg-[#0b0c10]/40 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[11px] font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-transparent">
                      <th className="py-3 pl-4">Name</th>
                      <th className="py-3">Size</th>
                      <th className="py-3">Mimetype</th>
                      <th className="py-3">Created</th>
                      <th className="py-3 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                    {filteredFiles.map((file) => {
                      const info = getFileIconInfo(file.mimeType);
                      const isSelected = selectedFile && selectedFile._id === file._id;

                      return (
                        <tr
                          key={file._id}
                          onClick={() => setSelectedFile(file)}
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/10 cursor-pointer transition-colors ${isSelected ? "bg-teal-50/20 dark:bg-teal-950/5" : ""
                            }`}
                        >
                          <td className="py-3 pl-4 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-3 pr-4 truncate max-w-[240px]">
                            <div className={`p-1.5 rounded-lg flex-shrink-0 ${info.color}`}>
                              {info.icon}
                            </div>
                            <span className="truncate" title={file.originalName}>
                              {file.originalName}
                            </span>
                          </td>
                          <td className="py-3 text-slate-500 font-mono">
                            {formatBytes(file.size)}
                          </td>
                          <td className="py-3 text-slate-400 font-mono truncate max-w-[120px]">
                            {file.mimeType}
                          </td>
                          <td className="py-3 text-slate-400">
                            {new Date(file.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex gap-1">
                              {activeTab !== "trash" && (
                                <button
                                  onClick={() => starMutation.mutate(file._id)}
                                  className={`p-1.5 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${file.isStarred
                                      ? "text-amber-500"
                                      : "text-slate-400 hover:text-amber-500"
                                    }`}
                                >
                                  <Star
                                    className={`w-3.5 h-3.5 ${file.isStarred ? "fill-amber-500" : ""}`}
                                  />
                                </button>
                              )}
                              <button
                                onClick={() => setPreviewFile(file)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-teal-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Preview"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        {/* AWS S3 / Azure Property Inspector Panel */}
        {selectedFile && (
          <Card className="w-full lg:w-80 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f0e]/60 p-5 shrink-0 shadow-md sticky top-24 self-start space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-900 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-teal-500" /> Object Inspector
              </h3>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Display icon / details */}
            <div className="space-y-4">
              <div className="h-28 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-900 flex items-center justify-center overflow-hidden">
                {getFileIconInfo(selectedFile.mimeType).type === "image" ? (
                  <img
                    src={getDirectUrl(selectedFile)}
                    alt=""
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div
                    className={`p-4 rounded-full ${getFileIconInfo(selectedFile.mimeType).color}`}
                  >
                    {getFileIconInfo(selectedFile.mimeType).icon}
                  </div>
                )}
              </div>

              {/* Editable Name (Rename) */}
              {activeTab !== "trash" ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Name
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-900 rounded-xl px-2 py-1.5 focus-within:border-teal-500">
                    <input
                      type="text"
                      defaultValue={selectedFile.originalName}
                      onBlur={(e) => {
                        if (
                          e.target.value.trim() &&
                          e.target.value.trim() !== selectedFile.originalName
                        ) {
                          renameMutation.mutate({
                            id: selectedFile._id,
                            name: e.target.value.trim(),
                          });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.target.value.trim()) {
                          renameMutation.mutate({
                            id: selectedFile._id,
                            name: e.target.value.trim(),
                          });
                          e.target.blur();
                        }
                      }}
                      className="w-full bg-transparent outline-hidden text-xs font-semibold text-slate-800 dark:text-slate-200"
                    />
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Name
                  </label>
                  <p className="text-xs font-semibold select-all break-all">
                    {selectedFile.originalName}
                  </p>
                </div>
              )}

              {/* Metadata Details (S3 Style) */}
              <div className="space-y-3 pt-2 text-[11px] border-t border-slate-100 dark:border-slate-900">
                <div className="flex justify-between">
                  <span className="text-slate-400">Size</span>
                  <span className="font-semibold">
                    {formatBytes(selectedFile.size)} ({selectedFile.size.toLocaleString()} B)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mimetype</span>
                  <span className="font-semibold font-mono">{selectedFile.mimeType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">S3 Bucket</span>
                  <span className="font-semibold font-mono">{selectedFile.bucket}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block">S3 Object Key</span>
                  <p className="font-semibold font-mono bg-slate-50 dark:bg-slate-950/40 p-2 rounded-lg border border-slate-150 dark:border-slate-900 text-[10px] select-all break-all leading-relaxed">
                    {selectedFile.objectKey}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block">S3 URI Path</span>
                  <div className="flex gap-2 items-center bg-slate-50 dark:bg-slate-950/40 p-2 rounded-lg border border-slate-150 dark:border-slate-900 text-[10px]">
                    <span className="font-semibold font-mono select-all truncate flex-1">
                      s3://{selectedFile.bucket}/{selectedFile.objectKey}
                    </span>
                    <button
                      onClick={() =>
                        handleCopyText(
                          `s3://${selectedFile.bucket}/${selectedFile.objectKey}`,
                          "s3"
                        )
                      }
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white flex-shrink-0"
                    >
                      {copiedField === "s3" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Uploaded</span>
                  <span className="font-semibold">
                    {new Date(selectedFile.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-900 grid grid-cols-2 gap-2">
                {activeTab !== "trash" ? (
                  <>
                    <a href={getDownloadUrl(selectedFile)} className="w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs font-semibold flex items-center gap-1.5 justify-center py-2 h-auto rounded-xl"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </Button>
                    </a>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate(selectedFile._id)}
                      disabled={deleteMutation.isPending}
                      className="w-full text-xs font-semibold flex items-center gap-1.5 justify-center py-2 h-auto rounded-xl"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => restoreMutation.mutate(selectedFile._id)}
                      disabled={restoreMutation.isPending}
                      className="w-full text-xs font-semibold flex items-center gap-1.5 justify-center py-2 h-auto rounded-xl"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Restore
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => permanentDeleteMutation.mutate(selectedFile._id)}
                      disabled={permanentDeleteMutation.isPending}
                      className="w-full text-xs font-semibold flex items-center gap-1.5 justify-center py-2 h-auto rounded-xl"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Perm
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Modern Overlay Preview Modal (Full screen overlay dialog) */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 md:p-8">
          <div className="relative w-full max-w-4xl h-[80vh] flex flex-col bg-white dark:bg-[#0b0c10] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-900 px-6 py-4 flex-shrink-0">
              <div className="min-w-0 pr-4">
                <h3
                  className="font-bold text-sm text-slate-800 dark:text-white truncate"
                  title={previewFile.originalName}
                >
                  {previewFile.originalName}
                </h3>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5 uppercase tracking-wider">
                  {previewFile.mimeType} • {formatBytes(previewFile.size)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={getDownloadUrl(previewFile)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-slate-600 dark:text-slate-300"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
                  title="Close Preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Custom Viewports depending on type */}
            <div className="flex-1 bg-slate-50 dark:bg-slate-950/40 overflow-auto flex items-center justify-center p-6 relative">
              {/* IMAGE PREVIEW */}
              {getFileIconInfo(previewFile.mimeType).type === "image" && (
                <div className="flex flex-col items-center gap-4 max-h-full">
                  <div className="overflow-auto border border-slate-100 dark:border-slate-900/60 rounded-xl bg-slate-900">
                    <img
                      src={getDirectUrl(previewFile)}
                      alt=""
                      style={{ transform: `scale(${zoomScale})` }}
                      className="max-h-[50vh] object-contain transition-transform duration-200 rounded-lg"
                    />
                  </div>
                  <div className="flex gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-full shadow-xs">
                    <button
                      onClick={() => setZoomScale(Math.max(0.5, zoomScale - 0.25))}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-semibold self-center px-2 font-mono text-slate-600 dark:text-slate-300">
                      {(zoomScale * 100).toFixed(0)}%
                    </span>
                    <button
                      onClick={() => setZoomScale(Math.min(3, zoomScale + 0.25))}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setZoomScale(1)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Maximize className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* VIDEO PREVIEW */}
              {getFileIconInfo(previewFile.mimeType).type === "video" && (
                <div className="w-full max-w-2xl bg-black rounded-2xl overflow-hidden shadow-xl border border-slate-900">
                  <video
                    src={getDirectUrl(previewFile)}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* AUDIO PREVIEW */}
              {getFileIconInfo(previewFile.mimeType).type === "audio" && (
                <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 mb-2">
                    <FileAudio className="w-8 h-8" />
                  </div>
                  <span className="text-xs text-slate-400 text-center truncate max-w-full font-mono">
                    {previewFile.originalName}
                  </span>
                  <audio
                    src={getDirectUrl(previewFile)}
                    controls
                    autoPlay
                    className="w-full focus:outline-hidden"
                  />
                </div>
              )}

              {/* PDF PREVIEW */}
              {getFileIconInfo(previewFile.mimeType).type === "pdf" && (
                <iframe
                  src={getDirectUrl(previewFile)}
                  title="PDF Preview"
                  className="w-full h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white"
                />
              )}

              {/* CODE / TEXT FILE PREVIEW */}
              {(getFileIconInfo(previewFile.mimeType).type === "code" ||
                getFileIconInfo(previewFile.mimeType).type === "document") && (
                  <div className="w-full h-full bg-slate-950 dark:bg-black border border-slate-900 rounded-2xl p-6 overflow-auto text-left flex flex-col">
                    {loadingPreviewText ? (
                      <div className="flex flex-col justify-center items-center py-20 text-slate-400 gap-2 flex-1">
                        <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
                        <span className="text-xs font-semibold">Streaming text buffer...</span>
                      </div>
                    ) : (
                      <pre className="font-mono text-xs text-emerald-400 dark:text-emerald-300 leading-relaxed select-text whitespace-pre-wrap">
                        {previewText}
                      </pre>
                    )}
                  </div>
                )}

              {/* OTHER / BINARY FALLBACK FILE */}
              {getFileIconInfo(previewFile.mimeType).type === "binary" && (
                <div className="text-center space-y-4 max-w-xs">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600">
                    <FileText className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                      No preview available
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      This file type ({previewFile.mimeType}) cannot be rendered directly in the
                      browser.
                    </p>
                  </div>
                  <a href={getDownloadUrl(previewFile)} className="inline-block pt-2">
                    <Button className="font-semibold px-6 flex items-center gap-2">
                      <Download className="w-4 h-4" /> Download File
                    </Button>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
