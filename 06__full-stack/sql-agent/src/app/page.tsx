"use client";

import { ChatHeader } from "@/components/chat-header";
import { ChatInput } from "@/components/chat-input";
import { EmptyState } from "@/components/empty-state";
import { MessageBubble } from "@/components/message-bubble";
import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";

export default function Chat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div
      className="flex flex-col mx-auto max-w-215 h-dvh"
      style={{ background: "var(--color-bg)" }}>
      <ChatHeader />

      <main className="flex-1 overflow-hidden">
        <div className="px-6 pt-8 pb-4 scrollbar-thumb-border h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent">
          {messages.length === 0 ? (
            <EmptyState onSuggestion={(text: string) => setInput(text)} />
          ) : (
            <div className="flex flex-col gap-7">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </main>

      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
      />
    </div>
  );
}