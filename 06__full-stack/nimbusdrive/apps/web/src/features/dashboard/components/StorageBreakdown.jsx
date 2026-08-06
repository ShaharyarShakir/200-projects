import React from "react";
import { Image, FileText, Film, FolderArchive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../lib/component/ui/Card";

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export default function StorageBreakdown({ user, files }) {
  const storageUsed = user?.storageUsed || 0;
  const storageQuota = user?.storageQuota || 5368709120;

  // Categorize files
  const activeFiles = files ? files.filter((f) => !f.isDeleted) : [];

  let images = { count: 0, size: 0 };
  let docs = { count: 0, size: 0 };
  let media = { count: 0, size: 0 };
  let others = { count: 0, size: 0 };

  activeFiles.forEach((f) => {
    const mime = f.mimeType?.toLowerCase() || "";
    const size = f.size || 0;

    if (mime.startsWith("image/")) {
      images.count++;
      images.size += size;
    } else if (
      mime.startsWith("text/") ||
      mime.includes("pdf") ||
      mime.includes("document") ||
      mime.includes("sheet") ||
      mime.includes("presentation") ||
      mime.includes("msword") ||
      mime.includes("json") ||
      mime.includes("xml")
    ) {
      docs.count++;
      docs.size += size;
    } else if (mime.startsWith("video/") || mime.startsWith("audio/")) {
      media.count++;
      media.size += size;
    } else {
      others.count++;
      others.size += size;
    }
  });

  const categories = [
    {
      name: "Images",
      icon: Image,
      color: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-500/10",
      barBg: "bg-blue-500",
      count: images.count,
      size: images.size,
    },
    {
      name: "Documents",
      icon: FileText,
      color: "text-teal-500 dark:text-teal-400",
      bg: "bg-teal-500/10",
      barBg: "bg-teal-500",
      count: docs.count,
      size: docs.size,
    },
    {
      name: "Multimedia",
      icon: Film,
      color: "text-amber-500 dark:text-amber-400",
      bg: "bg-amber-500/10",
      barBg: "bg-amber-500",
      count: media.count,
      size: media.size,
    },
    {
      name: "Others",
      icon: FolderArchive,
      color: "text-purple-500 dark:text-purple-400",
      bg: "bg-purple-500/10",
      barBg: "bg-purple-500",
      count: others.count,
      size: others.size,
    },
  ];

  return (
    <Card className="bg-white dark:bg-[#0b0f0e]/40 shadow-sm p-6 border-slate-200 dark:border-slate-850">
      <CardHeader className="p-0 mb-6">
        <CardTitle className="font-bold text-slate-800 dark:text-white text-lg">
          Storage Allocation
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 space-y-6">
        {/* Main Linear progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
            <span>{formatBytes(storageUsed)} Used</span>
            <span>{formatBytes(storageQuota)} Max Quota</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex">
            {categories.map((cat, idx) => {
              const catPercent = storageUsed > 0 ? (cat.size / storageQuota) * 100 : 0;
              if (catPercent === 0) return null;
              return (
                <div
                  key={idx}
                  className={`${cat.barBg} h-full first:rounded-l-full last:rounded-r-full transition-all duration-305`}
                  style={{ width: `${catPercent}%` }}
                  title={`${cat.name}: ${formatBytes(cat.size)}`}
                />
              );
            })}
            {storageUsed === 0 && <div className="bg-slate-200 dark:bg-slate-800 h-full w-full" />}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
            {categories.map((cat, idx) => {
              const catPercent = storageUsed > 0 ? (cat.size / storageUsed) * 100 : 0;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400"
                >
                  <span className={`w-2 h-2 rounded-full ${cat.barBg}`} />
                  <span>
                    {cat.name} ({catPercent.toFixed(1)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed categories grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-850/60 bg-slate-50/50 dark:bg-[#0b0f0e]/20"
              >
                <div className={`p-3 rounded-xl ${cat.bg} ${cat.color} shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                    {cat.name}
                  </span>
                  <span className="block font-bold text-sm text-slate-800 dark:text-white mt-0.5">
                    {formatBytes(cat.size)}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">{cat.count} files</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
