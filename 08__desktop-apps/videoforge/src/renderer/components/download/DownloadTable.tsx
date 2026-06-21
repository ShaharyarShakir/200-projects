import React, { Fragment } from "react";
import {
    DndContext,
    closestCenter,
} from "@dnd-kit/core";

import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import DownloadRow from "./DownloadRow";

export default function DownloadTable({
    downloads,
    setDownloads,
    onPause,
    onResume,
    onCancel,
}: any) {
    function handleDragEnd(event: any) {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = downloads.findIndex(
            (d: any) => d.id === active.id
        );

        const newIndex = downloads.findIndex(
            (d: any) => d.id === over.id
        );

        const reordered = arrayMove(
            downloads,
            oldIndex,
            newIndex
        );

        if (setDownloads) {
            setDownloads(reordered);
            // 🔥 persist to SQLite via IPC
            window.api.reorderDownloads(
                reordered.map((d: any) => d.id)
            );
        }
    }

    const isDragEnabled = Boolean(setDownloads);

    const TableContent = (
        <div className="overflow-hidden border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50/75 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {isDragEnabled && <th className="w-10 pl-4 py-4 text-center"></th>}
                        <th className="px-4 py-4">File</th>
                        <th className="px-4 py-4">Status</th>
                        <th className="px-4 py-4">Progress</th>
                        <th className="px-4 py-4 text-right pr-6">Actions</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                    {(() => {
                        let lastPlaylistId = "";
                        return downloads.map((d: any) => {
                            const showHeader = d.playlist_id && d.playlist_id !== lastPlaylistId;
                            if (d.playlist_id) {
                                lastPlaylistId = d.playlist_id;
                            } else {
                                lastPlaylistId = "";
                            }
                            
                            return (
                                <Fragment key={d.id}>
                                    {showHeader && (
                                        <tr className="bg-slate-50/75 dark:bg-slate-950/40 select-none">
                                            <td colSpan={isDragEnabled ? 5 : 4} className="px-6 py-2.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-slate-50/20 dark:bg-slate-900/40 font-display uppercase tracking-wider">
                                                📚 Playlist: {d.playlist_title || "Untitled Playlist"}
                                            </td>
                                        </tr>
                                    )}
                                    <DownloadRow
                                        download={d}
                                        dragEnabled={isDragEnabled}
                                        onPause={onPause}
                                        onResume={onResume}
                                        onCancel={onCancel}
                                    />
                                </Fragment>
                            );
                        });
                    })()}
                </tbody>
            </table>
        </div>
    );

    if (!isDragEnabled) {
        return TableContent;
    }

    return (
        <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={downloads.map((d: any) => d.id)}
                strategy={verticalListSortingStrategy}
            >
                {TableContent}
            </SortableContext>
        </DndContext>
    );
}