import React from "react";

export type FilterType = "all" | "video" | "audio" | "converted";
export type SortField = "title" | "file_size" | "duration" | "created_at";
export type SortOrder = "asc" | "desc";

interface MediaToolbarProps {
    search: string;
    setSearch: (s: string) => void;
    filter: FilterType;
    setFilter: (f: FilterType) => void;
    sortBy: SortField;
    setSortBy: (field: SortField) => void;
    sortOrder: SortOrder;
    setSortOrder: (order: SortOrder) => void;
}

export default function MediaToolbar({
    search,
    setSearch,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
}: MediaToolbarProps) {
    const filters: { id: FilterType; label: string }[] = [
        { id: "all", label: "All Media" },
        { id: "video", label: "Videos" },
        { id: "audio", label: "Audio" },
        { id: "converted", label: "Converted" },
    ];

    const sortFields: { id: SortField; label: string }[] = [
        { id: "title", label: "Title" },
        { id: "file_size", label: "File Size" },
        { id: "duration", label: "Duration" },
        { id: "created_at", label: "Date Added" },
    ];

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4 transition-colors duration-300">
            {/* Search and Category Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Search media..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200/65 dark:border-slate-800/70 rounded-xl text-slate-850 dark:text-slate-105 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 transition-all font-semibold"
                    />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-1 border border-slate-200/40 dark:border-slate-800/45 rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
                    {filters.map((f) => {
                        const active = filter === f.id;
                        return (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                                    active
                                        ? "bg-white dark:bg-slate-850 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-800"
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                }`}
                            >
                                {f.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Sorting controls */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none">
                    Sort By:
                </span>
                
                <div className="relative">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortField)}
                        className="appearance-none pl-3.5 pr-8 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200/65 dark:border-slate-800/70 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                    >
                        {sortFields.map((field) => (
                            <option key={field.id} value={field.id}>
                                {field.label}
                            </option>
                        ))}
                    </select>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </span>
                </div>

                <button
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-950 border border-slate-200/65 dark:border-slate-800/70 rounded-xl transition-all"
                    title={sortOrder === "asc" ? "Sort Ascending" : "Sort Descending"}
                >
                    {sortOrder === "asc" ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
}
