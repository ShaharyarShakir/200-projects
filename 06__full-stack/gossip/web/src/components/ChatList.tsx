import React from 'react'
import { useSearchParams } from 'react-router'
import { useChats } from '../hooks/useChats';
import NoConversationsUI from './ui/NoConversationUI';
import { ChatListItem } from './ChatListItem';
import type { Chat } from '../types';

function ChatList({ activeChatId }: { activeChatId: string | null }) {
    const [, setSearchParams] = useSearchParams();
    const { data: chats = [], isLoading: chatsLoading } = useChats();
    return (
        <div className="flex-1 overflow-y-auto">
            {chatsLoading && (
                <div className="flex justify-center items-center py-8">
                    <span className="text-amber-400 loading loading-spinner loading-sm" />
                </div>
            )}

            {chats.length === 0 && !chatsLoading && <NoConversationsUI />}

            <div className="flex flex-col gap-1">
                {chats.map((chat: Chat) => (
                    <ChatListItem
                        key={chat._id}
                        chat={chat}
                        isActive={activeChatId === chat._id}
                        onClick={() => setSearchParams({ chat: chat._id })}
                    />
                ))}
            </div>
        </div>

    )
}

export default ChatList
