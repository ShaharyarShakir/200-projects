import React, { useState, useEffect, useRef } from "react";

interface ConversionJob {
  id: string;
  input_path: string;
  output_path: string;
  format: string;
  progress: number;
  status: "queued" | "processing" | "completed" | "failed";
  created_at?: string;
}

export default function ConverterPage() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    path: string;
    size: number;
  } | null>(null);
  const [targetFormat, setTargetFormat] = useState("mp3");
  const [conversions, setConversions] = useState<ConversionJob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load conversions on mount and subscribe to progress events
  useEffect(() => {
    fetchConversions();

    const unsubscribe = window.api.onConversionProgress((data: any) => {
      setConversions((prev) => {
        const index = prev.findIndex((c) => c.id === data.id);
        if (index > -1) {
          return prev.map((c) =>
            c.id === data.id
              ? { ...c, progress: data.progress, status: data.status }
              : c
          );
        } else {
          // If not in state, trigger complete fetch to get full row details
          fetchConversions();
          return prev;
        }
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const fetchConversions = async () => {
    try {
      const list = await window.api.getConversions();
      // Sort newest first
      list.sort((a, b) => b.id.localeCompare(a.id));
      setConversions(list);
    } catch (err) {
      console.error("Failed to load conversions:", err);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile({
        name: file.name,
        path: (file as any).path || file.name,
        size: file.size,
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile({
        name: file.name,
        path: (file as any).path || file.name,
        size: file.size,
      });
    }
  };

  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  const startConversion = async () => {
    if (!selectedFile) return;

    try {
      await window.api.startConversion(selectedFile.path, targetFormat);
      setSelectedFile(null);
      // Wait a moment then reload conversions
      setTimeout(fetchConversions, 100);
    } catch (err) {
      console.error("Failed to start conversion:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await window.api.deleteConversion(id);
      setConversions((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Failed to delete conversion:", err);
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const getFileNameFromPath = (filePath: string) => {
    return filePath.split(/[\\/]/).pop() || filePath;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Transcoder Interface Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 font-display">
            Convert Video or Audio File
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Drag and drop a file or click to select from your system.
          </p>
        </div>

        {/* Drag and Drop Zone */}
        {!selectedFile ? (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={handleSelectClick}
            className={`relative group border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
              dragActive
                ? "border-blue-500 bg-blue-50/30 dark:bg-blue-950/20"
                : "border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-700 bg-slate-50/30 dark:bg-slate-950/20"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept="video/*,audio/*"
              className="hidden"
            />
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4 group-hover:scale-110 transition duration-300 text-slate-500 dark:text-slate-400 group-hover:text-blue-500">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-350">
              Drag & Drop file here
            </p>
            <p className="text-xs text-slate-400 mt-1">
              or click to browse local files
            </p>
          </div>
        ) : (
          /* File Selected Details & Configuration */
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col md:flex-row items-center justify-between gap-5 transition duration-300">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-250 truncate max-w-xs md:max-w-md" title={selectedFile.name}>
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-xs md:max-w-md" title={selectedFile.path}>
                  {selectedFile.path}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold mt-1">
                  {formatBytes(selectedFile.size)}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              {/* Select Format */}
              <div className="relative">
                <select
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value)}
                  className="appearance-none w-full pl-4 pr-10 py-2.5 border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 text-slate-750 dark:text-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition cursor-pointer"
                >
                  <option value="mp3">MP3 Audio</option>
                  <option value="mp4">MP4 Video</option>
                  <option value="mkv">MKV Video</option>
                  <option value="hls">HLS Stream</option>
                  <option value="webm">WEBM Video</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedFile(null)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={startConversion}
                  className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
                  </svg>
                  Convert
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Conversion Queue Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 pl-1 font-display">
          Conversion History & Queue
        </h3>

        {conversions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-10 text-center shadow-sm">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-950 text-slate-400 rounded-xl flex items-center justify-center mx-auto mb-4 border border-slate-200/40 dark:border-slate-800/40">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-sm text-slate-400 font-semibold">No conversion jobs recorded.</p>
            <p className="text-xs text-slate-500 mt-1">Start by dropping a file above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {conversions.map((job) => {
              const fileName = getFileNameFromPath(job.input_path);
              const isConverting = job.status === "processing";
              const isQueued = job.status === "queued";
              const isCompleted = job.status === "completed";
              const isFailed = job.status === "failed";

              return (
                <div
                  key={job.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition hover:shadow-md duration-300"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-250 truncate max-w-xs md:max-w-md">
                        {fileName}
                      </span>
                      <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-450 border border-blue-100/50 dark:border-blue-900/30 text-[10px] font-bold rounded-md uppercase tracking-wider">
                        {job.format}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 font-mono mt-1 truncate max-w-xs md:max-w-md" title={job.input_path}>
                      Source: {job.input_path}
                    </div>

                    {/* Progress Bar */}
                    {(isConverting || isCompleted) && (
                      <div className="w-full sm:max-w-md bg-slate-100 dark:bg-slate-950 rounded-full h-1.5 mt-3 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            isCompleted
                              ? "bg-emerald-500"
                              : "bg-gradient-to-r from-blue-500 to-indigo-500"
                          }`}
                          style={{ width: `${job.progress || 0}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
                    {/* Status Badge */}
                    <div>
                      {isQueued && (
                        <span className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-450 border border-slate-100 dark:border-slate-850 text-xs font-semibold rounded-full flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Queued
                        </span>
                      )}
                      {isConverting && (
                        <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 text-xs font-semibold rounded-full flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          {job.progress}%
                        </span>
                      )}
                      {isCompleted && (
                        <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30 text-xs font-semibold rounded-full flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Done
                        </span>
                      )}
                      {isFailed && (
                        <span className="px-3 py-1.5 bg-red-50 dark:bg-red-950/45 text-red-650 dark:text-red-400 border border-red-100 dark:border-red-900/30 text-xs font-semibold rounded-full flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Failed
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      {isCompleted && (
                        <>
                          <button
                            onClick={() => window.api.openFile(job.output_path)}
                            title="Play Converted File"
                            className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 rounded-xl transition"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => window.api.openFolder(job.output_path)}
                            title="Show in Folder"
                            className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 rounded-xl transition"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(job.id)}
                        title="Delete from list"
                        className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-200 hover:text-red-650 dark:hover:text-red-400 text-slate-400 rounded-xl transition"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
