import { useEffect, useRef, useState } from "react";
import { useDownload } from "../hooks/useDownload";
import { useMetricsStore } from "../stores/download-metrics.store";
import DownloadInput from "../components/download/DownloadInput";
import DownloadTable from "../components/download/DownloadTable";
import SpeedGraph, { formatSpeed } from "../components/download/SpeedGraph";
import PlaylistDownloadDialog from "../components/playlist/PlaylistDownloadDialog";

export default function DownloadsPage() {
  const {
    downloads,
    setDownloads,
    start,
    pause,
    resume,
    cancel,
  } = useDownload();

  const [loadingPlaylist, setLoadingPlaylist] = useState(false);
  const [playlistData, setPlaylistData] = useState<any>(null);
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartDownload = async (url: string, format = "mp4") => {
    setError(null);
    const isPlaylist = url.includes("list=") || url.includes("playlist");
    if (isPlaylist) {
      setLoadingPlaylist(true);
      try {
        const metadata = await window.api.getPlaylist(url);
        if (metadata && metadata.entries && metadata.entries.length > 0) {
          setPlaylistData(metadata);
          setShowPlaylistDialog(true);
        } else {
          throw new Error("No download entries found in this playlist.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to fetch playlist metadata. Verify the URL.");
        setTimeout(() => setError(null), 5000);
      } finally {
        setLoadingPlaylist(false);
      }
    } else {
      start(url, format);
    }
  };

  const handlePlaylistDownload = async (
    selectedVideos: any[],
    options: any
  ) => {
    setShowPlaylistDialog(false);
    
    // Add all selected videos in sequence to avoid DB lock
    for (const video of selectedVideos) {
      await window.api.startDownload(
        video.url,
        options.format,
        playlistData.id,
        playlistData.title,
        video.index,
        video.title,
        options.quality
      );
    }

    // Refresh queue
    const updated = await window.api.getDownloads();
    setDownloads(updated);
  };

  const addPoint = useMetricsStore((state) => state.addPoint);
  const activeSpeedsRef = useRef<{ [id: string]: number }>({});

  // Sync active speeds map with current downloads list to purge stopped streams
  useEffect(() => {
    const activeIds = new Set(
      downloads.filter((d) => d.status === "downloading").map((d) => d.id)
    );
    let changed = false;
    for (const key of Object.keys(activeSpeedsRef.current)) {
      if (!activeIds.has(key)) {
        delete activeSpeedsRef.current[key];
        changed = true;
      }
    }
    // If an active stream disappeared, push a new total speed point (typically 0 or lower)
    if (changed) {
      const totalSpeed = Object.values(activeSpeedsRef.current).reduce((a, b) => a + b, 0);
      addPoint({
        timestamp: Date.now(),
        speed: totalSpeed,
      });
    }
  }, [downloads, addPoint]);

  // Subscribe to real-time metrics and compute aggregated speed
  useEffect(() => {
    const unsubscribe = window.api.onMetrics((data: any) => {
      activeSpeedsRef.current[data.id] = data.speed || 0;
      const totalSpeed = Object.values(activeSpeedsRef.current).reduce((a, b) => a + b, 0);

      addPoint({
        timestamp: data.timestamp,
        speed: totalSpeed,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [addPoint]);

  // Compute live metrics values for cards
  const activeCount = downloads.filter(
    (d) => d.status === "downloading" || d.status === "converting"
  ).length;

  const queueCount = downloads.filter((d) => d.status === "queued").length;

  const totalSpeed = downloads.reduce(
    (sum, d) => sum + (d.status === "downloading" ? d.speed || 0 : 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Real-time Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Streams Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex items-center justify-between transition hover:shadow-md">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Active Downloads
            </p>
            <h3 className="text-2xl font-bold text-slate-850 dark:text-slate-105">
              {activeCount}
            </h3>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>

        {/* Total Aggregated Speed Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex items-center justify-between transition hover:shadow-md">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Total Speed
            </p>
            <h3 className="text-2xl font-bold text-slate-850 dark:text-slate-105 font-mono">
              {formatSpeed(totalSpeed)}
            </h3>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11V4M4 9h-2m2 0a9 9 0 100 9m18-9a9 9 0 11-18 0" />
            </svg>
          </div>
        </div>

        {/* Queue Length Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex items-center justify-between transition hover:shadow-md">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Queue Length
            </p>
            <h3 className="text-2xl font-bold text-slate-850 dark:text-slate-105">
              {queueCount}
            </h3>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Real-time speed graph */}
      <SpeedGraph />

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/35 p-4 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-250 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Start new download */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-display">
            Add New Download
          </h3>
          <p className="text-xs text-slate-400">
            Enter a video or playlist URL to add targets to the download queue.
          </p>
        </div>
        <DownloadInput onDownload={handleStartDownload} />
      </div>

      {/* Downloads list / queue */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200 pl-1 font-display">
          Download Queue
        </h3>
        <DownloadTable
          downloads={downloads}
          setDownloads={setDownloads}
          onPause={pause}
          onResume={resume}
          onCancel={cancel}
        />
      </div>

      {/* Playlist Dialog */}
      {showPlaylistDialog && playlistData && (
        <PlaylistDownloadDialog
          playlist={playlistData}
          onClose={() => setShowPlaylistDialog(false)}
          onDownload={handlePlaylistDownload}
        />
      )}

      {/* Loading Overlay */}
      {loadingPlaylist && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4 text-white">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-sm font-semibold tracking-wide animate-pulse">Parsing playlist metadata, please wait...</div>
        </div>
      )}
    </div>
  );
}