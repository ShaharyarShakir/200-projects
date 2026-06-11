import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useSocketStore } from '../lib/socket'
import { useSocketConnection } from '../hooks/useSocketConnection'
import { useChats, useGetOrCreateChat } from '../hooks/useChats'
import { useMessages } from '../hooks/useMessages'
import Header from '../components/Header'
import ChatList from '../components/ChatList'
import { ChatHeader } from '../components/ChatHeader'
import { MessageBubble } from '../components/MessageBubble'
import { ChatInput } from '../components/ChatInput'
import NoMessagesUI from '../components/ui/NoMessagesUI'
import { NewChatModal } from '../components/NewChatModal'
import NoChatSelectedUI from '../components/ui/NoChatSelectedUI'
import { useCurrentUser } from '../hooks/useCurrentUser'
import type { Chat, Message } from '../types'


function ChatPage() {
    const { data: currentUser } = useCurrentUser();

    const [searchParams, setSearchParams] = useSearchParams();
    const activeChatId = searchParams.get("chat");

    const [messageInput, setMessageInput] = useState("");
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const { socket, sendTyping, sendMessage } = useSocketStore();

    useSocketConnection(activeChatId);


    const { data: chats = [] } = useChats();
    const { data: messages = [], isLoading: messagesLoading } = useMessages(activeChatId);
    const startChatMutation = useGetOrCreateChat();

    // scroll to bottom when chat or messages changes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeChatId, messages]);

    const handleStartChat = (participantId: string) => {
        startChatMutation.mutate(participantId, {
            onSuccess: (chat) => setSearchParams({ chat: chat._id }),
        });
    };

    const handleSend = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !activeChatId || !socket || !currentUser) return;

        const text = messageInput.trim();
        sendMessage(activeChatId, text, currentUser);
        setMessageInput("");
        sendTyping(activeChatId, false);
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessageInput(e.target.value);
        if (!activeChatId) return;

        sendTyping(activeChatId, true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            sendTyping(activeChatId, false);
        }, 2000);
    };

    const activeChat = chats.find((c: Chat) => c._id === activeChatId);

    return (
        <div className="flex bg-base-100 h-screen text-base-content">
            {/* Sidebar */}
            <div className="flex flex-col bg-base-200 border-base-300 border-r w-80">
                <Header onNewChat={() => setIsNewChatModalOpen(true)} />
                <ChatList activeChatId={activeChatId} />
            </div>

            {/* main chat area */}
            <div className="flex flex-col flex-1">
                    {activeChatId && activeChat ? (
                        <>
                            <ChatHeader participant={activeChat.participant} chatId={activeChatId} />

                            {/* messages */}
                            <div className="flex-1 space-y-4 p-6 overflow-y-auto">
                                {messagesLoading && (
                                    <div className="flex justify-center items-center h-full">
                                        <span className="text-amber-400 loading loading-spinner loading-md" />
                                    </div>
                                )}

                                {messages.length === 0 && !messagesLoading && <NoMessagesUI />}

                                {messages.length > 0 &&
                                    messages.map((msg: Message) => (
                                        <MessageBubble key={msg._id} message={msg} currentUser={currentUser} />
                                    ))}

                                <div ref={messagesEndRef} />
                            </div>

                            <ChatInput
                                value={messageInput}
                                onChange={handleTyping}
                                onSubmit={handleSend}
                                disabled={!messageInput.trim()}
                            />
                        </>
                    ) : (
                        <NoChatSelectedUI />
                    )}
            </div>

            <NewChatModal
                onStartChat={handleStartChat}
                isPending={startChatMutation.isPending}
                isOpen={isNewChatModalOpen}
                onClose={() => setIsNewChatModalOpen(false)}
            />
        </div>
    )
}

export default ChatPage
