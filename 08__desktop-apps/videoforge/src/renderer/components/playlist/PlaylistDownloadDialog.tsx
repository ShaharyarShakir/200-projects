import React, { useState, useEffect } from "react";

interface PlaylistItem {
  id: string;
  title: string;
  url: string;
  duration?: number;
}

interface PlaylistData {
  id: string;
  title: string;
  uploader: string;
  thumbnail?: string;
  entries: PlaylistItem[];
}

interface PlaylistDownloadDialogProps {
  playlist: PlaylistData;
  onClose: () => void;
  onDownload: (
    selectedVideos: { url: string; title: string; index: number }[],
    options: { format: string; quality: string; prefixNumber: boolean }
  ) => void;
}

function sanitizeFolderName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "").trim();
}

export default function PlaylistDownloadDialog({
  playlist,
  onClose,
  onDownload,
}: PlaylistDownloadDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quality, setQuality] = useState("best");
  const [format, setFormat] = useState("mp4");
  const [prefixNumber, setPrefixNumber] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [rangeFrom, setRangeFrom] = useState("1");
  const [rangeTo, setRangeTo] = useState(String(playlist.entries.length));
  const [libraryItems, setLibraryItems] = useState<any[]>([]);

  // Load media library to detect duplicates
  useEffect(() => {
    window.api.getLibrary().then((items) => {
      setLibraryItems(items || []);
    });
  }, []);

  const isDownloaded = (videoTitle: string) => {
    const cleanTitle = videoTitle.replace(/[\\/:*?"<>|]/g, "").trim().toLowerCase();
    return libraryItems.some((item) => {
      const cleanLibTitle = item.title.replace(/[\\/:*?"<>|]/g, "").trim().toLowerCase();
      return (
        cleanLibTitle === cleanTitle ||
        cleanLibTitle.includes(cleanTitle) ||
        cleanTitle.includes(cleanLibTitle)
      );
    });
  };

  // Default select missing/new episodes on load
  useEffect(() => {
    const newSelected = new Set<string>();
    playlist.entries.forEach((video) => {
      if (!isDownloaded(video.title)) {
        newSelected.add(video.id);
      }
    });
    setSelectedIds(newSelected);
  }, [playlist, libraryItems]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(playlist.entries.map((v) => v.id)));
  };

  const handleSelectNone = () => {
    setSelectedIds(new Set());
  };

  const handleSelectMissing = () => {
    const next = new Set<string>();
    playlist.entries.forEach((video) => {
      if (!isDownloaded(video.title)) {
        next.add(video.id);
      }
    });
    setSelectedIds(next);
  };

  const applyRange = () => {
    const from = Math.max(1, parseInt(rangeFrom, 10) || 1);
    const to = Math.min(playlist.entries.length, parseInt(rangeTo, 10) || playlist.entries.length);

    if (from > to) return;

    const next = new Set(selectedIds);
    playlist.entries.forEach((video, index) => {
      const playlistIndex = index + 1;
      if (playlistIndex >= from && playlistIndex <= to) {
        next.add(video.id);
      } else {
        next.delete(video.id);
      }
    });
    setSelectedIds(next);
  };

  const handleSubmit = () => {
    if (selectedIds.size === 0) return;

    const videosToDownload = playlist.entries
      .map((video, index) => {
        const orderIndex = index + 1;
        const totalPadding = String(playlist.entries.length).length;
        const indexPrefix = String(orderIndex).padStart(Math.max(2, totalPadding), "0");
        const formattedTitle = prefixNumber ? `${indexPrefix} - ${video.title}` : video.title;

        return {
          id: video.id,
          title: formattedTitle,
          url: video.url,
          index: orderIndex,
        };
      })
      .filter((v) => selectedIds.has(v.id));

    onDownload(videosToDownload, {
      format,
      quality,
      prefixNumber,
    });
  };

  const filteredEntries = playlist.entries.filter((v) =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const missingCount = playlist.entries.filter((v) => !isDownloaded(v.title)).length;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95">
        
        {/* Header Section */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-850 flex gap-5 items-start bg-slate-50/50 dark:bg-slate-950/20">
          {playlist.thumbnail ? (
            <img
              src={playlist.thumbnail}
              alt={playlist.title}
              className="w-32 h-20 object-cover rounded-xl shadow-md border border-slate-200 dark:border-slate-800"
            />
          ) : (
            <div className="w-32 h-20 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-850 dark:text-slate-100 truncate font-display">
                {playlist.title}
              </h2>
              {missingCount > 0 && (
                <span className="px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40 rounded-full border border-emerald-100 dark:border-emerald-900/30 shadow-sm animate-pulse">
                  ✨ {missingCount} new
                </span>
              )}
            </div>
            
            <p className="text-xs text-slate-400 mt-0.5">
              Uploader: <span className="text-slate-650 dark:text-slate-350 font-semibold">{playlist.uploader}</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Total tracks: <span className="font-semibold text-slate-650 dark:text-slate-300">{playlist.entries.length} videos</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Section Split */}
        <div className="flex-1 flex overflow-hidden min-h-0 flex-col md:flex-row">
          
          {/* Left panel: List & Selectors */}
          <div className="flex-1 p-6 flex flex-col min-h-0 border-r border-slate-100 dark:border-slate-850">
            
            {/* Range Selection & Filtering controls */}
            <div className="space-y-4 mb-4 flex-shrink-0">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Search tracks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 min-w-[200px] px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950 transition"
                />
                
                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-slate-850">
                  <span className="font-medium">Range:</span>
                  <input
                    type="number"
                    min="1"
                    max={playlist.entries.length}
                    value={rangeFrom}
                    onChange={(e) => setRangeFrom(e.target.value)}
                    className="w-10 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1 py-0.5 text-slate-700 dark:text-slate-350"
                  />
                  <span>to</span>
                  <input
                    type="number"
                    min="1"
                    max={playlist.entries.length}
                    value={rangeTo}
                    onChange={(e) => setRangeTo(e.target.value)}
                    className="w-10 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1 py-0.5 text-slate-700 dark:text-slate-350"
                  />
                  <button
                    onClick={applyRange}
                    className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold transition"
                  >
                    Select
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  Select All
                </button>
                <button
                  onClick={handleSelectNone}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  Deselect All
                </button>
                <button
                  onClick={handleSelectMissing}
                  className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/35 rounded-lg text-xs font-semibold transition"
                >
                  Download Missing ({missingCount})
                </button>
              </div>
            </div>

            {/* Scrollable Tracks List */}
            <div className="flex-1 overflow-y-auto border border-slate-200/60 dark:border-slate-850 rounded-2xl divide-y divide-slate-50 dark:divide-slate-800/40 bg-slate-50/20 dark:bg-slate-950/10">
              {filteredEntries.length > 0 ? (
                filteredEntries.map((video, index) => {
                  const selected = selectedIds.has(video.id);
                  const isAlreadyLibrary = isDownloaded(video.title);
                  
                  return (
                    <div
                      key={video.id}
                      onClick={() => toggleSelect(video.id)}
                      className={`flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer select-none ${selected ? "bg-blue-50/20 dark:bg-blue-950/10" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => {}} // toggled by parent div
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                      />
                      <span className="text-xs font-mono font-bold text-slate-400 w-6">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${selected ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"}`}>
                          {video.title}
                        </p>
                      </div>
                      
                      {isAlreadyLibrary && (
                        <span className="px-2 py-0.5 text-[9px] font-bold text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800 rounded border border-slate-200/60 dark:border-slate-700/60 flex-shrink-0">
                          Already Downloaded
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                  <svg className="w-10 h-10 mb-2 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <span className="text-xs">No tracks match your search</span>
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Download Options */}
          <div className="w-full md:w-80 p-6 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col gap-6 flex-shrink-0 border-t md:border-t-0 border-slate-100 dark:border-slate-850 justify-between">
            <div className="space-y-6">
              
              {/* Quality Settings */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Video Quality
                </label>
                <div className="flex flex-col gap-2">
                  {[
                    { id: "best", label: "Best Available", desc: "Downloads highest quality" },
                    { id: "1080p", label: "1080p HD", desc: "Limits bandwidth usage" },
                    { id: "720p", label: "720p HD", desc: "Faster, compressed files" },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-2.5 p-2.5 border rounded-xl cursor-pointer select-none transition ${quality === opt.id ? "border-blue-500/80 bg-blue-50/30 dark:bg-blue-950/15" : "border-slate-200 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-900/30"}`}
                    >
                      <input
                        type="radio"
                        name="quality"
                        checked={quality === opt.id}
                        onChange={() => setQuality(opt.id)}
                        className="mt-1 w-4 h-4 text-blue-600 bg-slate-100 border-slate-350 focus:ring-blue-500 accent-blue-600"
                      />
                      <div>
                        <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200 leading-none">
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">
                          {opt.desc}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Format / Audio Extraction */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Target Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full pl-3 pr-8 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-250 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
                >
                  <option value="mp4">MP4 Video</option>
                  <option value="webm">WEBM Video</option>
                  <option value="mkv">MKV Video</option>
                  <option value="hls">HLS Playlist Stream</option>
                  <option value="mp3_320">MP3 Audio (High - 320 kbps)</option>
                  <option value="mp3_192">MP3 Audio (Standard - 192 kbps)</option>
                </select>
              </div>

              {/* Naming Conventions */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Naming Convention
                </label>
                <label className="flex items-center gap-2.5 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-850">
                  <input
                    type="checkbox"
                    checked={prefixNumber}
                    onChange={(e) => setPrefixNumber(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-350 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                  />
                  <div className="leading-tight">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Prefix playlist index
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      e.g., "01 - Introduction.mp4"
                    </span>
                  </div>
                </label>
              </div>

              {/* Output Directory Demo */}
              <div className="p-3 bg-blue-50/30 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/20 rounded-xl text-xs space-y-1">
                <span className="font-bold text-blue-700 dark:text-blue-400 block uppercase tracking-wider text-[9px]">
                  Output Location
                </span>
                <p className="text-slate-550 dark:text-slate-400 leading-tight font-mono text-[10px] break-all">
                  downloads/{sanitizeFolderName(playlist.title)}/
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition select-none cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={selectedIds.size === 0}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-200 disabled:to-slate-300 dark:disabled:from-slate-800 dark:disabled:to-slate-850 disabled:text-slate-400 dark:disabled:text-slate-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition select-none cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download ({selectedIds.size})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
