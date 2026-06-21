import React, { useState } from "react";
import { MediaItem, formatSize, formatDuration } from "./MediaCard";

interface MediaPreviewProps {
    item: MediaItem | null;
    onClose: () => void;
    onDelete: (id: string, deleteFileFromDisk: boolean) => Promise<void>;
    onReconvert: (id: string, format: string) => Promise<string>;
}

export default function MediaPreview({ item, onClose, onDelete, onReconvert }: MediaPreviewProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteFromDisk, setDeleteFromDisk] = useState(true);
    const [showReconvertDropdown, setShowReconvertDropdown] = useState(false);
    const [reconvertStatus, setReconvertStatus] = useState<string | null>(null);

    if (!item) {
        return (
            <div className="hidden lg:flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl h-full shadow-sm select-none transition-colors duration-300">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 text-slate-350 dark:text-slate-600 rounded-full mb-3 border border-slate-100 dark:border-slate-850">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                </div>
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                    No media selected
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[200px] mt-1 leading-normal">
                    Click a card in your library grid to inspect metadata details and play.
                </p>
            </div>
        );
    }

    const isVideo = item.media_type === "video";
    const mediaUrl = `media://${item.file_path.replace(/\\/g, "/")}`;

    const handleOpen = () => {
        window.api.openFile(item.file_path);
    };

    const handleOpenFolder = () => {
        window.api.openFolder(item.file_path);
    };

    const handleReconvertTrigger = async (targetFormat: string) => {
        try {
            setShowReconvertDropdown(false);
            setReconvertStatus("Starting reconversion...");
            await onReconvert(item.id, targetFormat);
            setReconvertStatus("Reconversion added to queue!");
            setTimeout(() => setReconvertStatus(null), 3000);
        } catch (err: any) {
            setReconvertStatus(`Error: ${err.message || "Failed"}`);
            setTimeout(() => setReconvertStatus(null), 5000);
        }
    };

    const handleDeleteTrigger = async () => {
        await onDelete(item.id, deleteFromDisk);
        setShowDeleteConfirm(false);
    };

    return (
        <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl h-full shadow-lg overflow-hidden transition-colors duration-300">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between select-none">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Details Inspector
                </span>
                <button
                    onClick={onClose}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Embedded Player */}
                <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-100/5 dark:border-slate-800 shadow-md">
                    {isVideo ? (
                        <video
                            key={item.id}
                            controls
                            src={mediaUrl}
                            className="w-full aspect-video object-contain"
                            poster={item.thumbnail_path ? `media://${item.thumbnail_path.replace(/\\/g, "/")}` : undefined}
                        />
                    ) : (
                        <div className="p-6 flex flex-col items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950">
                            {/* Graphic waveform disk */}
                            <div className="relative w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700/80 shadow-lg flex items-center justify-center mb-6 overflow-hidden">
                                <span className="absolute inset-2 border-4 border-dotted border-indigo-500/30 rounded-full animate-spin [animation-duration:12s]" />
                                <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                </svg>
                            </div>
                            <audio key={item.id} controls src={mediaUrl} className="w-full" />
                        </div>
                    )}
                </div>

                {/* Status toast if conversions occur */}
                {reconvertStatus && (
                    <div className={`p-3 text-xs font-bold rounded-xl text-center border shadow-sm ${
                        reconvertStatus.startsWith("Error")
                            ? "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/20 text-rose-600 dark:text-rose-455"
                            : "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/20 text-blue-600 dark:text-blue-400"
                    }`}>
                        {reconvertStatus}
                    </div>
                )}

                {/* Title */}
                <div>
                    <h3 className="font-bold text-slate-850 dark:text-slate-100 leading-snug text-base break-words">
                        {item.title}
                    </h3>
                </div>

                {/* Actions Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <button
                        onClick={handleOpen}
                        className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors active:scale-[0.98] flex items-center justify-center gap-1.5"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Play Externally
                    </button>
                    
                    <button
                        onClick={handleOpenFolder}
                        className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200/40 dark:border-slate-800/40 transition-colors active:scale-[0.98] flex items-center justify-center gap-1.5"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        Show in Folder
                    </button>
                </div>

                {/* Metadata List */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl space-y-3.5 select-none transition-colors">
                    <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Metadata Details
                    </h4>
                    
                    <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-450 leading-relaxed font-semibold">
                        <div className="flex justify-between items-start gap-4">
                            <span className="text-slate-400 dark:text-slate-500 whitespace-nowrap">File Path</span>
                            <span className="font-mono text-[10px] text-right break-all cursor-pointer hover:underline text-slate-700 dark:text-slate-300" onClick={() => navigator.clipboard.writeText(item.file_path)} title="Click to copy path">
                                {item.file_path}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 dark:text-slate-500">Format</span>
                            <span className="font-bold text-slate-800 dark:text-slate-250 uppercase px-1.5 py-0.5 rounded text-[10px] bg-white dark:bg-slate-850 border border-slate-200/40 dark:border-slate-800/45">
                                {item.format}
                            </span>
                        </div>
                        {item.resolution && (
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 dark:text-slate-500">Resolution</span>
                                <span className="font-mono text-slate-800 dark:text-slate-300">{item.resolution}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 dark:text-slate-500">Duration</span>
                            <span className="font-mono text-slate-800 dark:text-slate-300">{formatDuration(item.duration)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 dark:text-slate-500">File Size</span>
                            <span className="font-mono text-slate-800 dark:text-slate-300">{formatSize(item.file_size)}</span>
                        </div>
                        {item.created_at && (
                            <div className="flex justify-between items-start gap-4">
                                <span className="text-slate-400 dark:text-slate-500 whitespace-nowrap">Added On</span>
                                <span className="text-right text-slate-850 dark:text-slate-300">
                                    {new Date(item.created_at).toLocaleString()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Operations Area (Reconvert and Delete) */}
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-850 pt-5 select-none">
                    {/* Reconversion Button */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowReconvertDropdown(!showReconvertDropdown);
                                setShowDeleteConfirm(false);
                            }}
                            className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800/60 text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-between"
                        >
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2" />
                                </svg>
                                Reconvert Format
                            </span>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showReconvertDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 rounded-xl shadow-lg z-20 overflow-hidden text-xs font-bold text-slate-700 dark:text-slate-300">
                                {["mp4", "webm", "mp3"].map((fmt) => {
                                    const disabled = item.format.toLowerCase() === fmt;
                                    return (
                                        <button
                                            key={fmt}
                                            disabled={disabled}
                                            onClick={() => handleReconvertTrigger(fmt)}
                                            className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-850 border-b border-slate-100 dark:border-slate-800/40 last:border-b-0 flex justify-between items-center ${
                                                disabled ? "opacity-40 cursor-not-allowed" : ""
                                            }`}
                                        >
                                            <span className="uppercase">{fmt} Format</span>
                                            {fmt === "mp3" ? (
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Audio Only</span>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Video/Audio</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Delete Toggle / Inline confirmation */}
                    {showDeleteConfirm ? (
                        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/20 rounded-2xl p-4 space-y-3">
                            <h4 className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                                Confirm Deletion
                            </h4>
                            <p className="text-xs text-rose-600/90 dark:text-rose-455 font-semibold leading-relaxed">
                                Are you sure you want to remove <span className="font-bold break-all">"{item.title}"</span> from your library? This action is permanent.
                            </p>
                            
                            {/* Disk Deletion Checkbox */}
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={deleteFromDisk}
                                    onChange={(e) => setDeleteFromDisk(e.target.checked)}
                                    className="w-3.5 h-3.5 accent-rose-600 dark:accent-rose-500 rounded border-slate-300 dark:border-slate-800 cursor-pointer"
                                />
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                    Also delete the actual file from disk
                                </span>
                            </label>

                            <div className="flex items-center gap-2 pt-1.5 text-xs font-bold">
                                <button
                                    onClick={handleDeleteTrigger}
                                    className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shadow-sm"
                                >
                                    Yes, Delete
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl transition-colors border border-slate-200/40 dark:border-slate-800/40"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                setShowDeleteConfirm(true);
                                setShowReconvertDropdown(false);
                            }}
                            className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/10 text-rose-600 dark:text-rose-455 border border-rose-100 dark:border-rose-900/20 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 justify-center"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete Media Item
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
