import React, { useState, useRef } from "react";
import { UploadCloud, Loader2, ChevronRight, Cloud } from "lucide-react";
import { Button } from "../../../lib/component/ui/Button";

// Circular Progress Dial component
const CircularProgress = ({ percentage, size = 110, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full transform -rotate-90">
        <circle
          className="text-slate-100 dark:text-slate-800/40"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-teal-500 transition-all duration-500 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="url(#mintGradient)"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <defs>
          <linearGradient id="mintGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold font-mono text-slate-800 dark:text-white leading-none">
          {percentage.toFixed(0)}%
        </span>
        <span className="text-[9px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider mt-1">
          Used
        </span>
      </div>
    </div>
  );
};

export default function StorageHero({
  user,
  files,
  usedPercentage,
  handleShortcutClick,
  handleUpload,
  uploadProgress,
  uploadPending,
  successMsg,
  errorMsg,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

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

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative bg-gradient-to-br from-teal-500/10 via-teal-950/5 to-transparent shadow-md p-6 md:p-8 border rounded-3xl overflow-hidden backdrop-blur-xs transition-all duration-300 ${
        isDragging
          ? "border-teal-500 ring-2 ring-teal-500/20 bg-teal-500/15"
          : "border-teal-500/10 dark:border-teal-500/5 bg-white/5 dark:bg-[#0b0f0e]/30"
      }`}
    >
      <div className="absolute top-0 right-0 bottom-0 bg-radial-to-l from-teal-500/10 to-transparent w-1/3 pointer-events-none" />

      {isDragging ? (
        <div className="flex flex-col items-center justify-center py-8 text-teal-500 gap-2 select-none animate-pulse">
          <UploadCloud className="w-12 h-12" />
          <h3 className="text-lg font-bold">Drop files here to upload instantly</h3>
          <p className="text-xs text-slate-400">
            Directly targets your active Garage S3 bucket prefix
          </p>
        </div>
      ) : (
        <div className="z-10 relative flex flex-col lg:flex-row justify-between items-stretch gap-8">
          <div className="flex-1 flex flex-col justify-between space-y-6">
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white text-3xl tracking-tight">
                Welcome,{" "}
                <span className="bg-clip-text bg-gradient-to-r from-teal-600 dark:from-teal-400 to-emerald-400 dark:to-emerald-300 text-transparent font-extrabold">
                  {user.name}
                </span>
              </h1>
              <p className="mt-2 text-slate-500 dark:text-slate-400 text-xs md:text-sm leading-relaxed max-w-lg">
                Nimbus distributed S3 dashboard. Drag & drop files anywhere in this banner to stream
                them directly to your cluster.
              </p>
            </div>

            <div className="flex flex-col gap-3 max-w-md">
              {uploadPending ? (
                <div className="p-3 bg-teal-500/5 border border-teal-500/20 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-teal-600 dark:text-teal-400">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Uploading {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-teal-600 to-emerald-500 h-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button onClick={() => fileInputRef.current?.click()} className="font-bold gap-2">
                    <UploadCloud className="w-4 h-4" /> Upload file
                  </Button>
                  <div className="hidden sm:flex items-center text-xs text-slate-400 dark:text-slate-500 px-3 border border-dashed border-slate-850 rounded-xl bg-slate-50/50 dark:bg-[#0b0f0e]/30">
                    Drag & Drop files here
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 px-3 py-1.5 rounded-lg text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {successMsg}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 justify-end lg:w-96 shrink-0 lg:border-l border-slate-200/50 dark:border-slate-800/40 lg:pl-8">
            <CircularProgress percentage={usedPercentage} />

            <div className="flex flex-col gap-2.5 w-full sm:w-auto flex-1 sm:max-w-[200px]">
              <button
                onClick={() => handleShortcutClick("all")}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#0b0f0e]/50 border border-slate-150 dark:border-slate-850 hover:border-teal-500/30 transition-all text-left cursor-pointer"
              >
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Objects
                  </span>
                  <span className="block text-sm font-bold text-slate-800 dark:text-white">
                    {files?.length || 0}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => handleShortcutClick("starred")}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#0b0f0e]/50 border border-slate-150 dark:border-slate-850 hover:border-teal-500/30 transition-all text-left cursor-pointer"
              >
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Starred
                  </span>
                  <span className="block text-sm font-bold text-slate-800 dark:text-white">
                    {files ? files.filter((f) => f.isStarred).length : 0}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => handleShortcutClick("trash")}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#0b0f0e]/50 border border-slate-150 dark:border-slate-850 hover:border-teal-500/30 transition-all text-left cursor-pointer"
              >
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    In Trash
                  </span>
                  <span className="block text-sm font-bold text-slate-800 dark:text-white">
                    {files ? files.filter((f) => f.isDeleted).length : 0}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
