import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ProgressBar from "./ProgressBar";
import StatusBadge from "./StatusBadge";
import { formatSpeed } from "./SpeedGraph";

export default function DownloadRow({
    download,
    dragEnabled = true,
    onPause,
    onResume,
    onCancel,
}: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: download.id, disabled: !dragEnabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors duration-200"
        >
            {dragEnabled && (
                <td 
                    {...attributes} 
                    {...listeners} 
                    className="pl-4 py-4 w-10 text-center cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 6a1 1 0 100-2 1 1 0 000 2zM7 11a1 1 0 100-2 1 1 0 000 2zM7 16a1 1 0 100-2 1 1 0 000 2zM13 6a1 1 0 100-2 1 1 0 000 2zM13 11a1 1 0 100-2 1 1 0 000 2zM13 16a1 1 0 100-2 1 1 0 000 2z" />
                    </svg>
                </td>
            )}

            <td className="px-4 py-4 max-w-xs truncate">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate max-w-[280px]" title={download.title || `Video ${download.id}`}>
                        {download.title || `Video ${download.id}`}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 border border-slate-200/60 dark:border-slate-700/60">
                        {download.format || "mp4"}
                    </span>
                </div>
                <div className="text-xs text-slate-400 truncate mt-0.5" title={download.url}>
                    {download.url}
                </div>
            </td>

            <td className="px-4 py-4">
                <StatusBadge status={download.status} />
            </td>

            <td className="px-4 py-4 w-56">
                <div className="flex flex-col gap-1">
                    <ProgressBar value={download.progress} />
                    {download.status === "downloading" && download.speed !== undefined && (
                        <div className="text-[10px] text-slate-400 font-semibold flex items-center justify-between select-none">
                            <span>{formatSpeed(download.speed)}</span>
                            <span>{download.progress.toFixed(1)}%</span>
                        </div>
                    )}
                </div>
            </td>

            <td className="px-4 py-4 text-right pr-6 space-x-2">
                {download.status === "downloading" && onPause && (
                    <button
                        onClick={() => onPause(download.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg transition-colors"
                    >
                        Pause
                    </button>
                )}

                {download.status === "paused" && onResume && (
                    <button
                        onClick={() => onResume(download.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-455 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-colors"
                    >
                        Resume
                    </button>
                )}

                {onCancel && (
                    <button
                        onClick={() => onCancel(download.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-455 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg transition-colors"
                    >
                        {download.status === "completed" || download.status === "failed" ? "Remove" : "Cancel"}
                    </button>
                )}
            </td>
        </tr>
    );
}