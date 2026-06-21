import React from "react";

export type MediaItem = {
    id: string;
    title: string;
    file_path: string;
    thumbnail_path: string;
    duration: number;
    format: string;
    resolution: string;
    file_size: number;
    media_type: string;
    file_hash: string;
    created_at?: string;
    is_converted?: number | boolean;
};

interface MediaCardProps {
    item: MediaItem;
    selected: boolean;
    onClick: () => void;
}

export function formatSize(bytes: number): string {
    if (!bytes || isNaN(bytes)) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function formatDuration(seconds: number): string {
    if (!seconds || isNaN(seconds)) return "0:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function MediaCard({ item, selected, onClick }: MediaCardProps) {
    const isVideo = item.media_type === "video";
    const normalThumbnail = item.thumbnail_path 
        ? `media://${item.thumbnail_path.replace(/\\/g, "/")}`
        : null;

    return (
        <div
            onClick={onClick}
            className={`group flex flex-col bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                selected
                    ? "border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/10 shadow-blue-500/5 shadow-md"
                    : "border-slate-200/60 dark:border-slate-800/80 shadow-sm"
            }`}
        >
            {/* Visual Preview / Thumbnail Area */}
            <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-100 dark:border-slate-850">
                {isVideo && normalThumbnail ? (
                    <img
                        src={normalThumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                    />
                ) : isVideo ? (
                    /* Video Fallback */
                    <div className="flex flex-col items-center gap-1 text-slate-600 dark:text-slate-500 select-none">
                        <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Video</span>
                    </div>
                ) : (
                    /* Audio Fallback Illustration (Gradient waveform style) */
                    <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-slate-950 to-blue-900 flex flex-col items-center justify-center relative p-3">
                        {/* Waveform graphic */}
                        <div className="flex items-end gap-1 mb-2 h-10">
                            <span className="w-1.5 bg-indigo-500/70 h-4 rounded-full group-hover:h-7 transition-all duration-300" />
                            <span className="w-1.5 bg-indigo-400/80 h-7 rounded-full group-hover:h-5 transition-all duration-300" />
                            <span className="w-1.5 bg-blue-400 h-9 rounded-full group-hover:h-8 transition-all duration-300" />
                            <span className="w-1.5 bg-blue-300 h-5 rounded-full group-hover:h-9 transition-all duration-300" />
                            <span className="w-1.5 bg-indigo-400/80 h-8 rounded-full group-hover:h-4 transition-all duration-300" />
                            <span className="w-1.5 bg-indigo-500/70 h-3 rounded-full group-hover:h-6 transition-all duration-300" />
                        </div>
                        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                    </div>
                )}

                {/* Duration Badge */}
                {item.duration > 0 && (
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[10px] font-extrabold bg-slate-900/80 backdrop-blur-md text-white rounded-md tracking-wide select-none">
                        {formatDuration(item.duration)}
                    </span>
                )}

                {/* Media Type Indicator Icon (top left) */}
                <span className="absolute top-2 left-2 p-1.5 rounded-lg bg-slate-900/70 backdrop-blur-md text-slate-300 shadow-sm border border-slate-800/40 select-none">
                    {isVideo ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                    )}
                </span>
            </div>

            {/* Content Info Area */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white dark:bg-slate-900 transition-colors duration-300">
                <div className="space-y-1">
                    <h3 className="font-bold text-sm text-slate-850 dark:text-slate-105 leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={item.title}>
                        {item.title}
                    </h3>
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-350 border border-slate-200/40 dark:border-slate-800/40">
                            {item.format}
                        </span>
                        {item.resolution && (
                            <span className="font-mono text-[10px]">
                                {item.resolution}
                            </span>
                        )}
                        {item.is_converted ? (
                            <span className="px-1 py-0.25 rounded text-[9px] font-black bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20 uppercase tracking-wide">
                                Converted
                            </span>
                        ) : null}
                    </div>
                    
                    <span className="font-mono">
                        {formatSize(item.file_size)}
                    </span>
                </div>
            </div>
        </div>
    );
}
