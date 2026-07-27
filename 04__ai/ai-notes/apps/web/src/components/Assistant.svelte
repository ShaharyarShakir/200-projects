<script lang="ts">
  import { onMount } from "svelte";

  interface Message {
    id: string;
    sender: "user" | "assistant";
    text: string;
    timestamp: string;
  }

  interface Props {
    activeNoteTitle?: string;
    activeNoteContent?: string;
  }

  let { activeTab = "notes", activeNoteTitle = "", activeNoteContent = "" }: { activeTab?: string; activeNoteTitle?: string; activeNoteContent?: string } = $props();

  let inputVal = $state("");
  let isThinking = $state(false);

  let messages = $state<Message[]>([
    {
      id: "1",
      sender: "assistant",
      text: "Hello! I am your Notelify AI assistant. You can ask me to write templates, rewrite, or summarize your notes.",
      timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const promptSuggestions = [
    "Summarize current note",
    "Change tone to professional",
    "Fix grammar & typos",
    "Brainstorm title ideas",
  ];

  function handleSend(textToSend: string) {
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    };
    messages = [...messages, userMsg];
    inputVal = "";
    isThinking = true;

    // Simulate AI response delay
    setTimeout(() => {
      let aiResponseText = "";
      const lower = textToSend.toLowerCase();

      if (lower.includes("summarize") || lower.includes("summary")) {
        aiResponseText = `Here is a concise summary of **${activeNoteTitle || "this document"}**:\n\n*   **Focus**: The note details strategic goals and execution plans.\n*   **Impact**: Focuses on user-centric product flows, clean spacing, and modern design aesthetics to improve engagement.\n*   **Action Items**: Complete monorepo builds and finalize layout checks.`;
      } else if (lower.includes("professional") || lower.includes("rewrite")) {
        aiResponseText = `Here is a professional draft for **${activeNoteTitle || "your section"}**:\n\n> "We should focus our product design strategy on solving genuine user pain points. By reducing visual friction and optimizing spacing, we ensure that critical functions remain intuitive and accessible to everyone."`;
      } else if (lower.includes("grammar") || lower.includes("typo")) {
        aiResponseText = "Checked your note! The text is grammatically correct and flows nicely. No typos were found.";
      } else {
        aiResponseText = `I would be happy to help with that! Regarding **${activeNoteTitle || "your current note"}**, you can ask me to:\n\n1.  **Summarize** the document.\n2.  **Rewrite** sections to change tone.\n3.  **Generate** bullet action points.\n\nWhat would you like to explore first?`;
      }

      const aiMsg: Message = {
        id: Math.random().toString(),
        sender: "assistant",
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      };
      messages = [...messages, aiMsg];
      isThinking = false;

      // Scroll to bottom
      setTimeout(() => {
        const chatContainer = document.getElementById("chat-container");
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 50);
    }, 1000);
  }

  // Handle suggestion pill click
  function handleSuggestionClick(suggestion: string) {
    handleSend(suggestion);
  }

  // Format simple markdown bold syntax
  function formatMessageText(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/> "(.*?)"/g, '<blockquote class="border-l-4 border-violet-400 pl-3 italic text-slate-650 my-1">$1</blockquote>')
      .replace(/\* (.*?)\n/g, '<li class="ml-4 list-disc text-xs">$1</li>')
      .replace(/\n\n/g, '<br/>');
  }
</script>

<div class="w-80 bg-white border-l border-slate-200 flex flex-col h-full shrink-0 select-none shadow-sm relative z-10">
  <!-- Header -->
  <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <span class="text-violet-600 text-sm">✨</span>
      <span class="text-xs font-bold text-slate-800 uppercase tracking-wider">Assistant</span>
    </div>
    <!-- Clean Slate Menu Icon -->
    <button
      class="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
      aria-label="Menu"
      title="Menu"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    </button>
  </div>

  <!-- Messages scroll area -->
  <div
    id="chat-container"
    class="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-thin"
  >
    {#each messages as msg}
      <div class="flex flex-col space-y-1 {msg.sender === 'user' ? 'items-end' : 'items-start'}">
        <!-- Message bubble -->
        <div
          class="max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed transition-all shadow-sm"
          class:bg-violet-600={msg.sender === "user"}
          class:text-white={msg.sender === "user"}
          class:bg-slate-100={msg.sender === "assistant"}
          class:text-slate-800={msg.sender === "assistant"}
        >
          {#if msg.sender === "assistant"}
            {@html formatMessageText(msg.text)}
          {:else}
            {msg.text}
          {/if}
        </div>
        <!-- Time stamp -->
        <span class="text-[9px] text-slate-400 px-1">{msg.timestamp}</span>
      </div>
    {/each}

    <!-- Thinking indicator loader -->
    {#if isThinking}
      <div class="flex flex-col space-y-1 items-start">
        <div class="bg-slate-100 text-slate-500 rounded-2xl px-4 py-3 text-xs flex items-center gap-1.5 shadow-sm">
          <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
          <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
          <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
        </div>
      </div>
    {/if}
  </div>

  <!-- Bottom actions and Input text box -->
  <div class="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
    <!-- Suggestions Pills list -->
    <div class="flex flex-wrap gap-1.5">
      {#each promptSuggestions as suggestion}
        <button
          onclick={() => handleSuggestionClick(suggestion)}
          class="text-[10px] bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors duration-150 active:scale-95 whitespace-nowrap"
        >
          {suggestion}
        </button>
      {/each}
    </div>

    <!-- Message text field input -->
    <div class="flex items-center gap-2 relative">
      <input
        type="text"
        placeholder="Ask me anything..."
        bind:value={inputVal}
        onkeydown={(e) => e.key === "Enter" && handleSend(inputVal)}
        class="w-full light-input rounded-xl pl-4 pr-10 py-2.5 text-xs outline-none bg-white placeholder:text-slate-400"
      />
      <!-- Send Button -->
      <button
        onclick={() => handleSend(inputVal)}
        class="absolute right-2.5 top-1/2 -translate-y-1/2 text-violet-600 hover:text-violet-700 cursor-pointer p-1 rounded-md"
        aria-label="Send message"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
          <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
        </svg>
      </button>
    </div>
  </div>
</div>
