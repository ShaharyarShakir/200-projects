import { useSocketStore } from "../lib/socket";
import { formatTime } from "../lib/utils";
import type { Chat } from "../types";

export function ChatListItem({ chat, isActive, onClick }: { chat: Chat, isActive: boolean, onClick: () => void; }) {
    const { onlineUsers, typingUsers } = useSocketStore();
    const isOnline = onlineUsers.has(chat.participant?._id);
    const isTyping = !!typingUsers.get(chat._id);

    return (
        <button
            onClick={onClick}
            className={`btn btn-ghost justify-start gap-3 px-4 py-8 rounded-xl w-full normal-case ${isActive ? "bg-white/10" : ""
                }`}
        >
            <div className="relative">
                <img src={chat.participant?.avatar} className="bg-base-300/40 rounded-full w-11 h-11" />
                {isOnline && (
                    <span className="right-0 bottom-0 absolute bg-success border-2 border-base-200 rounded-full w-3 h-3" />
                )}
            </div>
            <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-center">
                    <span className="font-medium text-sm truncate">
                        {chat.participant?.name || "Unknown"}
                    </span>
                    {chat.lastMessageAt && (
                        <span className="text-xs text-base-content/60">{formatTime(chat.lastMessageAt)}</span>
                    )}
                </div>
                <p className="mt-0.5 text-xs text-base-content/70 truncate">
                    {isTyping ? "typing..." : chat.lastMessage?.text || "No messages yet"}
                </p>
            </div>
        </button>
    );
}