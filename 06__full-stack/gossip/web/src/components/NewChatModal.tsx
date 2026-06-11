import { useState } from "react";
import { UsersIcon, SearchIcon } from "lucide-react";
import { useSocketStore } from "../lib/socket";
import { useUsers } from "../hooks/useUsers";
import type { User } from "../types";

interface NewChatModalProps {
    onStartChat: (participantId: string) => void;
    isPending: boolean;
    isOpen: boolean;
    onClose: () => void;
}

export function NewChatModal({
    onStartChat,
    isPending,
    isOpen,
    onClose
}: NewChatModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const { onlineUsers } = useSocketStore();
    const { data: allUsers = [] } = useUsers();
    const isOnline = (id: string) => onlineUsers.has(id);

    const handleStartChat = (participantId: string) => {
        onStartChat(participantId);
        setSearchQuery("");
        onClose();
    };

    const searchResults = allUsers.filter((u: User) => {
        if (!searchQuery.trim()) return false;
        const query = searchQuery.toLowerCase();
        return u.name?.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query);
    });

    return (
        <dialog className={`modal ${isOpen ? "modal-open" : ""}`}>
            <div className="modal-box">
                <h3 className="flex items-center gap-2 mb-4 font-semibold">
                    <UsersIcon className="size-5 text-primary" />
                    New Chat
                </h3>
                <div className="relative mb-4">
                    <SearchIcon className="top-1/2 left-3 z-10 absolute w-4 h-4 text-base-content/60 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search users by name or email..."
                        className="pl-10 w-full input input-bordered"
                        autoFocus
                    />
                </div>
                <div className="max-h-72 overflow-y-auto">
                    {searchResults.length === 0 ? (
                        <div className="py-8 text-sm text-base-content/60 text-center">
                            {searchQuery ? "No users found" : "Start typing to search"}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {searchResults.map((u: User) => (
                                <button
                                    key={u._id}
                                    onClick={() => handleStartChat(u._id)}
                                    disabled={isPending}
                                    className="justify-start gap-3 w-full normal-case btn btn-ghost"
                                >
                                    <div className="relative">
                                        <img src={u.avatar} className="rounded-full w-10 h-10" />
                                        {isOnline(u._id) && (
                                            <span className="right-0 bottom-0 absolute bg-success border-2 border-base-200 rounded-full w-2.5 h-2.5" />
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-sm">{u.name}</p>
                                        <p className="text-xs text-base-content/70">{u.email}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="modal-action">
                    <form method="dialog">
                        <button
                            className="btn"
                            onClick={() => {
                                setSearchQuery("");
                                onClose();
                            }}
                        >
                            Close
                        </button>
                    </form>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop" onClick={onClose}>
                <button>close</button>
            </form>
        </dialog>
    );
}