import { useState } from "react";
import { Clock, Star, FileText, Image, Film, FolderArchive, ArrowRight, Eye } from "lucide-react";
import { Card, CardContent, CardHeader } from "../../../lib/component/ui/Card";

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const getFileIcon = (mimeType = "") => {
  const mime = mimeType.toLowerCase();
  if (mime.startsWith("image/")) return { icon: Image, color: "text-blue-500 bg-blue-500/10" };
  if (mime.startsWith("video/") || mime.startsWith("audio/"))
    return { icon: Film, color: "text-amber-500 bg-amber-500/10" };
  if (
    mime.startsWith("text/") ||
    mime.includes("pdf") ||
    mime.includes("document") ||
    mime.includes("sheet") ||
    mime.includes("presentation") ||
    mime.includes("msword")
  )
    return { icon: FileText, color: "text-teal-500 bg-teal-500/10" };
  return { icon: FolderArchive, color: "text-purple-500 bg-purple-500/10" };
};

export default function RecentActivity({ files = [], handleShortcutClick }) {
  const [activeTab, setActiveTab] = useState("recent"); // "recent" or "starred"

  const activeFiles = files ? files.filter((f) => !f.isDeleted) : [];

  const recentFiles = [...activeFiles]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const starredFiles = activeFiles.filter((f) => f.isStarred).slice(0, 5);

  const currentList = activeTab === "recent" ? recentFiles : starredFiles;

  return (
    <Card className="bg-white dark:bg-[#0b0f0e]/40 shadow-sm p-6 border-slate-200 dark:border-slate-850 flex flex-col h-[400px]">
      <CardHeader className="flex-row justify-between items-center space-y-0 mb-6 p-0 shrink-0">
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
          <button
            onClick={() => setActiveTab("recent")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "recent"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Recent
          </button>
          <button
            onClick={() => setActiveTab("starred")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "starred"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200"
            }`}
          >
            <Star className="w-3.5 h-3.5" /> Starred
          </button>
        </div>

        <button
          onClick={() => handleShortcutClick(activeTab === "recent" ? "all" : "starred")}
          className="flex items-center gap-0.5 font-bold text-teal-600 dark:text-teal-400 text-xs hover:underline cursor-pointer"
        >
          Manage All <ArrowRight className="w-3 h-3" />
        </button>
      </CardHeader>

      <CardContent className="p-0 overflow-y-auto flex-1 min-h-0">
        {currentList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 space-y-2">
            {activeTab === "recent" ? (
              <>
                <Clock className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                <p className="text-xs">No recent uploads found.</p>
              </>
            ) : (
              <>
                <Star className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                <p className="text-xs">No starred files.</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2.5 pr-1">
            {currentList.map((file) => {
              const { icon: Icon, color } = getFileIcon(file.mimeType);
              return (
                <div
                  key={file._id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/40 dark:bg-[#0b0f0e]/10 hover:border-teal-500/20 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl ${color} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-slate-850 dark:text-white truncate max-w-[200px] sm:max-w-[320px]">
                        {file.name}
                      </span>
                      <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {new Date(file.createdAt).toLocaleDateString()} &bull;{" "}
                        {formatBytes(file.size)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleShortcutClick("all")}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-400 dark:text-slate-500 hover:text-teal-500 dark:hover:text-teal-400 transition-all cursor-pointer"
                    title="Open in Drive Explorer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
