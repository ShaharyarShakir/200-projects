import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient, ROUTES } from '@bms/shared';
import { useAuthStore } from '../../stores/auth.store';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIAssistant() {
  const { tokens } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const chatMutation = useMutation({
    mutationFn: (userMessage: string) => {
      const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
      return apiClient.post<{ reply: string }>(
        ROUTES.AI.CHAT,
        { messages: newMessages },
        tokens?.accessToken
      );
    },
    onSuccess: (data, variables) => {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: variables },
        { role: 'assistant', content: data.reply },
      ]);
    },
  });

  const handleSend = () => {
    if (!input.trim()) return;
    chatMutation.mutate(input);
    setInput('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-indigo-700"
      >
        🤖
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col border">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-semibold">AI Assistant</h3>
        <button onClick={() => setIsOpen(false)}>✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-400 text-center text-sm mt-8">
            Ask me about inventory, attendance patterns, or customer insights.
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {chatMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-2xl text-sm text-gray-500">Thinking...</div>
          </div>
        )}
      </div>

      <div className="p-4 border-t flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask anything..."
          className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleSend}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-indigo-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
