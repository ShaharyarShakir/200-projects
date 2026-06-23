import React, { useEffect, useState } from "react";
import MediaToolbar, { FilterType, SortField, SortOrder } from "../components/library/MediaToolbar";
import MediaGrid from "../components/library/MediaGrid";
import MediaPreview from "../components/library/MediaPreview";
import { MediaItem } from "../components/library/MediaCard";

export default function LibraryPage() {
    const [items, setItems] = useState<MediaItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

    // Search, Filter, Sort State
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<FilterType>("all");
    const [sortBy, setSortBy] = useState<SortField>("created_at");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    // Fetch library items on mount and listen to updates
    useEffect(() => {
        // Get initial items from SQLite
        window.api.getLibrary().then((data) => {
            setItems(data);
        });

        // Listen for updates from main process (real-time reactive updates)
        const unsubscribe = window.api.onLibraryUpdate((data: any) => {
            if (data && data.deleted) {
                setItems((prev) => prev.filter((item) => item.id !== data.id));
                setSelectedItem((prev) => (prev && prev.id === data.id ? null : prev));
            } else if (data) {
                setItems((prev) => {
                    const exists = prev.some((item) => item.id === data.id);
                    if (exists) {
                        return prev.map((item) => (item.id === data.id ? data : item));
                    }
                    return [data, ...prev];
                });
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);

    // Sync selectedItem if the items array gets updated (e.g. metadata reload, delete, etc.)
    useEffect(() => {
        if (selectedItem) {
            const currentItem = items.find((item) => item.id === selectedItem.id);
            if (currentItem) {
                setSelectedItem(currentItem);
            } else {
                setSelectedItem(null);
            }
        }
    }, [items]);

    const handleDelete = async (id: string, deleteFileFromDisk: boolean) => {
        try {
            await window.api.deleteLibraryItem(id, deleteFileFromDisk);
            // State is updated automatically by onLibraryUpdate callback trigger
        } catch (err) {
            console.error("Failed to delete media item:", err);
        }
    };

    const handleReconvert = async (id: string, format: string) => {
        return window.api.reconvertLibraryItem(id, format);
    };

    // Client-side filtering
    const filteredItems = items
        .filter((item) => {
            if (!search.trim()) return true;
            const term = search.toLowerCase();
            return (
                item.title.toLowerCase().includes(term) ||
                item.file_path.toLowerCase().includes(term)
            );
        })
        .filter((item) => {
            if (filter === "all") return true;
            if (filter === "video") return item.media_type === "video";
            if (filter === "audio") return item.media_type === "audio";
            if (filter === "converted") return Boolean(item.is_converted);
            return true;
        });

    // Client-side sorting
    const sortedItems = [...filteredItems].sort((a: any, b: any) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (sortBy === "title") {
            valA = (valA || "").toLowerCase();
            valB = (valB || "").toLowerCase();
            if (valA < valB) return sortOrder === "asc" ? -1 : 1;
            if (valA > valB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        }

        if (sortBy === "created_at") {
            const timeA = new Date(valA || 0).getTime();
            const timeB = new Date(valB || 0).getTime();
            return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
        }

        // Numbers (file_size, duration)
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
        return sortOrder === "asc" ? valA - valB : valB - valA;
    });

    return (
        <div className="flex flex-col lg:flex-row gap-6 items-start h-full pb-8">
            {/* Library Grid Area */}
            <div className="flex-1 w-full space-y-6">
                <MediaToolbar
                    search={search}
                    setSearch={setSearch}
                    filter={filter}
                    setFilter={setFilter}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                />
                
                <MediaGrid
                    items={sortedItems}
                    selectedId={selectedItem?.id || null}
                    onSelect={setSelectedItem}
                />
            </div>

            {/* Sidebar Details / Preview Area */}
            <div className="w-full lg:w-96 shrink-0 h-full self-stretch lg:sticky lg:top-0">
                <MediaPreview
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onDelete={handleDelete}
                    onReconvert={handleReconvert}
                />
            </div>
        </div>
    );
}
