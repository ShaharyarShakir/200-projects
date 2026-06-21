import React from "react";
import MediaCard, { MediaItem } from "./MediaCard";

interface MediaGridProps {
    items: MediaItem[];
    selectedId: string | null;
    onSelect: (item: MediaItem) => void;
}

export default function MediaGrid({ items, selectedId, onSelect }: MediaGridProps) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl min-h-[350px] shadow-sm select-none transition-colors duration-300">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 rounded-2xl mb-4 border border-slate-100 dark:border-slate-850">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">
                    No media items found
                </h3>
                <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm mt-1">
                    Try adjusting your filters, searching for something else, or start a new download to populate your library.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {items.map((item) => (
                <MediaCard
                    key={item.id}
                    item={item}
                    selected={selectedId === item.id}
                    onClick={() => onSelect(item)}
                />
            ))}
        </div>
    );
}
