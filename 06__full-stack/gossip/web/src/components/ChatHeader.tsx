import type { User } from "../types";
import { useSocketStore } from "../lib/socket";

export function ChatHeader({ participant, chatId }: { participant: User; chatId: string }) {
    const { onlineUsers, typingUsers } = useSocketStore();
    const isOnline = onlineUsers.has(participant?._id);
    // const isTyping = !!typingUsers.get(chatId);
    const typingUserId = typingUsers.get(chatId);
    const isTyping = typingUserId && typingUserId === participant?._id;

    return (
        <div className="flex items-center gap-4 bg-base-200/80 px-6 border-base-300 border-b h-16">
            <div className="relative">
                <img src={participant?.avatar} className="bg-base-300/40 rounded-full w-10 h-10" alt="" />
                {isOnline && (
                    <span className="right-0 bottom-0 absolute bg-success border-2 border-base-200 rounded-full w-2.5 h-2.5" />
                )}
            </div>
            <div>
                <h2 className="font-semibold">{participant?.name}</h2>
                <p className="text-xs text-base-content/70">
                    {isTyping ? "typing..." : isOnline ? "Online" : "Offline"}
                </p>
            </div>
        </div>
    );
}