<script lang="ts">
  import { onDestroy, untrack } from "svelte";
  import { Editor } from "@tiptap/core";
  import StarterKit from "@tiptap/starter-kit";
  import Placeholder from "@tiptap/extension-placeholder";
  import Link from "@tiptap/extension-link";
  import CodeBlock from "@tiptap/extension-code-block";
  import Image from "@tiptap/extension-image";
  import { queryClient } from "../lib/api.js";
  import { summarize, explain, rewrite } from "../lib/api/ai.js";

  interface Notebook {
    id: string;
    name: string;
  }

  interface Note {
    id: string;
    title: string;
    content?: any;
    notebookId?: string | null;
    summary?: string | null;
  }

  interface Props {
    note: Note | null | undefined;
    notebooks: Notebook[];
    saveStatus: "saved" | "saving" | "offline";
    onsave: (
      id: string,
      updates: { title?: string; content?: any; notebookId?: string | null; summary?: string | null }
    ) => void;
  }

  let { note, notebooks = [], saveStatus = "saved", onsave }: Props = $props();

  let element = $state<HTMLDivElement | null>(null);
  let editor = $state<Editor | null>(null);
  let localTitle = $state("");
  let localSummary = $state("");
  let localNotebookId = $state<string | null>(null);

  // Formatting state selections
  let activeFont = $state("Inter");
  let activeSize = $state("14");

  // AI states
  let aiLoading = $state(false);
  let aiError = $state("");
  let aiExplanation = $state("");
  let showExplanationPanel = $state(false);
  let showBubbleMenu = $state(false);
  let bubbleMenuCoords = $state({ top: 0, left: 0 });
  let selectedText = $state("");
  let showRewriteDropdown = $state(false);

  // Debounced auto-save logic
  let saveTimeout: number;
  function triggerSave(
    updatedTitle: string,
    updatedContent: any,
    updatedNotebookId: string | null,
    updatedSummary: string | null
  ) {
    if (!note) return;
    window.clearTimeout(saveTimeout);
    saveTimeout = window.setTimeout(() => {
      onsave(note!.id, {
        title: updatedTitle,
        content: updatedContent,
        notebookId: updatedNotebookId,
        summary: updatedSummary,
      });
    }, 1000); // 1-second debounce delay
  }

  // Effect to load note metadata when the selected note changes
  $effect(() => {
    if (note) {
      localTitle = note.title;
      localSummary = note.summary || "";
      localNotebookId = note.notebookId || "";
      aiError = "";
      aiExplanation = "";
      showExplanationPanel = false;
      showBubbleMenu = false;
    }
  });

  // Effect to synchronize editor content when the active note changes
  $effect(() => {
    if (editor && note) {
      const incomingContent = note.content || { type: "doc", content: [] };
      const currentJSON = editor.getJSON();

      if (JSON.stringify(currentJSON) !== JSON.stringify(incomingContent)) {
        editor.commands.setContent(incomingContent, { emitUpdate: false });
      }
    }
  });

  // Initialize editor reactively when container element is bound
  $effect(() => {
    if (element && !editor) {
      const initialContent = untrack(() => note?.content) || { type: "doc", content: [] };

      editor = new Editor({
        element,
        extensions: [
          StarterKit.configure({
            codeBlock: false, // Disable built-in codeblock to use custom CodeBlock extension
          }),
          Placeholder.configure({
            placeholder: "Start typing your thoughts here...",
          }),
          Link.configure({
            openOnClick: false,
            HTMLAttributes: {
              class: "text-violet-650 dark:text-violet-400 underline cursor-pointer",
            },
          }),
          CodeBlock.configure({
            HTMLAttributes: {
              class: "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 font-mono text-xs my-4 text-violet-700 dark:text-violet-400 overflow-x-auto",
            },
          }),
          Image.configure({
            HTMLAttributes: {
              class: "rounded-xl border border-slate-200 dark:border-slate-850 max-w-full my-4",
            },
          }),
        ],
        editorProps: {
          attributes: {
            class: "prose prose-slate dark:prose-invert focus:outline-none max-w-none min-h-[400px] text-slate-800 dark:text-slate-200 text-sm leading-relaxed font-sans",
          },
        },
        content: initialContent,
        onUpdate: ({ editor }) => {
          const currentNote = untrack(() => note);
          if (!currentNote) return;
          const currentJSON = editor.getJSON();
          const title = untrack(() => localTitle);
          const summary = untrack(() => localSummary);
          const notebookId = untrack(() => localNotebookId);
          triggerSave(title, currentJSON, notebookId ? notebookId : null, summary ? summary : null);
        },
        onSelectionUpdate: ({ editor }) => {
          const { from, to } = editor.state.selection;
          if (from === to) {
            showBubbleMenu = false;
            selectedText = "";
            return;
          }
          selectedText = editor.state.doc.textBetween(from, to, " ");
          if (selectedText.trim().length < 3) {
            showBubbleMenu = false;
            return;
          }
          try {
            const { view } = editor;
            const start = view.coordsAtPos(from);
            const end = view.coordsAtPos(to);
            const container = element?.getBoundingClientRect();
            if (container) {
              // Position selection menu above selection center
              const left = (start.left + end.left) / 2 - container.left;
              const top = start.top - container.top;
              bubbleMenuCoords = { top, left };
              showBubbleMenu = true;
            }
          } catch (e) {
            showBubbleMenu = false;
          }
        },
      });

      return () => {
        if (editor) {
          editor.destroy();
          editor = null;
        }
      };
    }
  });

  onDestroy(() => {
    window.clearTimeout(saveTimeout);
  });

  function handleTitleChange(e: Event) {
    if (!note) return;
    localTitle = (e.target as HTMLInputElement).value;
    triggerSave(localTitle, editor?.getJSON() || {}, localNotebookId ? localNotebookId : null, localSummary ? localSummary : null);
  }

  function handleSummaryChange(e: Event) {
    if (!note) return;
    localSummary = (e.target as HTMLInputElement).value;
    triggerSave(localTitle, editor?.getJSON() || {}, localNotebookId ? localNotebookId : null, localSummary ? localSummary : null);
  }

  // Type annotations
  function handleNotebookChange(e: Event) {
    if (!note) return;
    const val = (e.target as HTMLSelectElement).value;
    localNotebookId = val === "" ? null : val;
    triggerSave(localTitle, editor?.getJSON() || {}, localNotebookId, localSummary ? localSummary : null);
  }

  function formatSummary(text: string): string {
    if (!text) return "";
    return text
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
          return `<li class="ml-4 list-disc text-slate-650 dark:text-slate-400 py-0.5">${trimmed.substring(1).trim()}</li>`;
        }
        return trimmed ? `<p class="py-1 text-slate-705 dark:text-slate-300 font-light">${trimmed}</p>` : "";
      })
      .join("");
  }

  async function handleSummarize() {
    if (!note || !editor) return;
    const content = editor.getText();
    if (content.length < 10) {
      aiError = "Note content must be at least 10 characters to summarize.";
      return;
    }
    try {
      aiLoading = true;
      aiError = "";
      const result = await summarize(content, note.id);
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["notes"] });
      } else {
        aiError = result.error || "Failed to generate summary";
      }
    } catch (err: any) {
      aiError = err.message || "AI request failed";
    } finally {
      aiLoading = false;
    }
  }

  async function handleExplain() {
    if (!selectedText) return;
    try {
      aiLoading = true;
      aiError = "";
      showExplanationPanel = true;
      showBubbleMenu = false;
      const result = await explain(selectedText);
      if (result.success) {
        aiExplanation = result.data;
      } else {
        aiError = result.error || "Failed to explain selection";
      }
    } catch (err: any) {
      aiError = err.message || "AI request failed";
    } finally {
      aiLoading = false;
    }
  }

  async function handleRewrite(style: string) {
    if (!selectedText || !editor) return;
    try {
      aiLoading = true;
      aiError = "";
      showBubbleMenu = false;
      const result = await rewrite(selectedText, style);
      if (result.success) {
        editor.chain().focus().insertContent(result.data).run();
      } else {
        aiError = result.error || "Failed to rewrite selection";
      }
    } catch (err: any) {
      aiError = err.message || "AI request failed";
    } finally {
      aiLoading = false;
    }
  }
</script>

<div class="relative z-10 flex h-full flex-grow flex-col bg-white dark:bg-slate-950 transition-colors duration-200 select-none">
  {#if !note}
    <div class="flex flex-grow flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-600">
      <span class="mb-4 text-5xl opacity-40">🖊</span>
      <p class="text-sm italic font-light">Select or create a note to begin writing</p>
    </div>
  {:else}
    <!-- Top Bar: Autosave Indicator, Notebook Select, Title & Subtitle Group -->
    <div class="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-850 px-8 py-5 bg-white dark:bg-slate-950 transition-colors duration-200">
      <div class="flex flex-col flex-grow max-w-xl">
        <div class="flex items-center gap-3">
          <!-- Notebook Dropdown Selector -->
          <select
            value={localNotebookId || ""}
            onchange={handleNotebookChange}
            class="cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-550 dark:text-slate-400 outline-none focus:border-violet-500 transition-colors"
          >
            <option value="">No Project</option>
            {#each notebooks as n}
              <option value={n.id}>{n.name}</option>
            {/each}
          </select>

          <!-- Document Title -->
          <input
            type="text"
            value={localTitle}
            oninput={handleTitleChange}
            placeholder="Untitled Note"
            class="flex-grow border-none bg-transparent text-lg font-bold text-slate-800 dark:text-white outline-none placeholder:text-slate-350 dark:placeholder:text-slate-700"
          />
        </div>
        <!-- Subtitle/Metadata Field -->
        <input
          type="text"
          value={localSummary}
          oninput={handleSummaryChange}
          placeholder="Add description/metadata..."
          class="w-full border-none bg-transparent text-xs text-slate-400 dark:text-slate-550 focus:outline-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 font-light mt-1 ml-[94px]"
        />
      </div>

      <!-- Autosave Status Indicator -->
      <div class="flex shrink-0 items-center gap-2 text-xs">
        {#if saveStatus === "saving"}
          <span class="h-2 w-2 animate-ping rounded-full bg-yellow-500"></span>
          <span class="font-light text-slate-400 dark:text-slate-500">Saving...</span>
        {:else}
          <span class="h-2 w-2 rounded-full" class:bg-emerald-500={saveStatus === "saved"} class:bg-red-500={saveStatus === "offline"}></span>
          <span class="font-light text-slate-400 dark:text-slate-500">{saveStatus === "saved" ? "Saved" : "Offline"}</span>
        {/if}
      </div>
    </div>

    <!-- Formatting Toolbar (Obsidian/Notelify Premium look) -->
    {#if editor}
      <div class="flex flex-wrap items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 bg-slate-50/40 dark:bg-slate-900/20 px-8 py-2 transition-colors">
        <!-- Font Selection dropdown -->
        <select
          bind:value={activeFont}
          class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-650 dark:text-slate-300 rounded-lg px-2 py-1 cursor-pointer focus:border-violet-500 outline-none"
        >
          <option value="Inter">Inter</option>
          <option value="Outfit">Outfit</option>
          <option value="Georgia">Serif</option>
          <option value="Mono">Monospace</option>
        </select>

        <!-- Font Size dropdown -->
        <select
          bind:value={activeSize}
          class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-650 dark:text-slate-300 rounded-lg px-2 py-1 cursor-pointer focus:border-violet-500 outline-none"
        >
          <option value="12">12</option>
          <option value="14">14</option>
          <option value="16">16</option>
          <option value="18">18</option>
        </select>

        <div class="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1.5"></div>

        <button
          onclick={() => editor!.chain().focus().toggleBold().run()}
          class="cursor-pointer rounded-lg p-2 text-xs font-semibold transition-all {editor.isActive('bold') ? 'bg-violet-100 text-violet-750 dark:bg-violet-950/40 dark:text-violet-400' : 'text-slate-500 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'}"
        >
          B
        </button>
        <button
          onclick={() => editor!.chain().focus().toggleItalic().run()}
          class="cursor-pointer rounded-lg p-2 text-xs italic transition-all {editor.isActive('italic') ? 'bg-violet-100 text-violet-750 dark:bg-violet-950/40 dark:text-violet-400' : 'text-slate-500 dark:text-slate-455 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'}"
        >
          I
        </button>
        <button
          onclick={() => editor!.chain().focus().toggleHeading({ level: 1 }).run()}
          class="cursor-pointer rounded-lg p-2 text-xs font-bold transition-all {editor.isActive('heading', { level: 1 }) ? 'bg-violet-100 text-violet-750 dark:bg-violet-950/40 dark:text-violet-400' : 'text-slate-500 dark:text-slate-455 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'}"
        >
          H1
        </button>
        <button
          onclick={() => editor!.chain().focus().toggleHeading({ level: 2 }).run()}
          class="cursor-pointer rounded-lg p-2 text-xs font-bold transition-all {editor.isActive('heading', { level: 2 }) ? 'bg-violet-100 text-violet-750 dark:bg-violet-950/40 dark:text-violet-400' : 'text-slate-500 dark:text-slate-455 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'}"
        >
          H2
        </button>

        <div class="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1.5"></div>

        <button
          onclick={() => editor!.chain().focus().toggleBulletList().run()}
          class="cursor-pointer rounded-lg p-2 text-xs transition-all {editor.isActive('bulletList') ? 'bg-violet-100 text-violet-755 dark:bg-violet-950/40 dark:text-violet-400' : 'text-slate-500 dark:text-slate-455 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'}"
        >
          • List
        </button>
        <button
          onclick={() => editor!.chain().focus().toggleOrderedList().run()}
          class="cursor-pointer rounded-lg p-2 text-xs transition-all {editor.isActive('orderedList') ? 'bg-violet-100 text-violet-755 dark:bg-violet-950/40 dark:text-violet-400' : 'text-slate-500 dark:text-slate-455 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'}"
        >
          1. List
        </button>
        <button
          onclick={() => editor!.chain().focus().toggleBlockquote().run()}
          class="cursor-pointer rounded-lg p-2 font-serif text-xs transition-all {editor.isActive('blockquote') ? 'bg-violet-100 text-violet-755 dark:bg-violet-950/40 dark:text-violet-400' : 'text-slate-500 dark:text-slate-455 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'}"
        >
          “ Quote
        </button>

        <div class="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1.5"></div>

        <button
          onclick={() => editor!.chain().focus().undo().run()}
          class="cursor-pointer rounded-lg p-2 text-xs text-slate-500 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          ↶ Undo
        </button>
        <button
          onclick={() => editor!.chain().focus().redo().run()}
          class="cursor-pointer rounded-lg p-2 text-xs text-slate-500 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          ↷ Redo
        </button>

        <div class="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1.5"></div>

        <!-- AI Assistant actions trigger -->
        <button
          onclick={handleSummarize}
          disabled={aiLoading}
          class="cursor-pointer rounded-xl bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900 border border-violet-100 dark:border-violet-850 px-3 py-1.5 text-xs font-bold text-violet-700 dark:text-violet-400 transition-all disabled:opacity-50 flex items-center gap-1 active:scale-95"
          title="Summarize Note"
        >
          ✨ Summarize
        </button>
      </div>
    {/if}

    <!-- Error Banner -->
    {#if aiError}
      <div class="mx-8 mt-4 flex items-center justify-between rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20 px-5 py-3 text-xs text-red-700 dark:text-red-400 shadow-sm">
        <div class="flex items-center gap-2">
          <span>⚠️</span>
          <span>{aiError}</span>
        </div>
        <button onclick={() => (aiError = "")} class="cursor-pointer text-red-500 hover:text-red-400 font-bold ml-4">✕</button>
      </div>
    {/if}

    <!-- Workspace Main Editor Canvas & Floating selections -->
    <div class="flex flex-grow overflow-hidden relative bg-white dark:bg-slate-950 transition-colors">
      
      <!-- Content Canvas -->
      <div class="flex-grow scrollbar-thin overflow-y-auto px-8 py-6 bg-white dark:bg-slate-950">
        <div bind:this={element} class="w-full"></div>
      </div>

      <!-- AI Selection Floating Tooltip (Bubble Menu) -->
      {#if showBubbleMenu && editor}
        <div
          class="absolute z-50 flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 dark:bg-slate-950 shadow-xl px-3 py-2 transition-all duration-200"
          style="top: {bubbleMenuCoords.top}px; left: {bubbleMenuCoords.left}px; transform: translate(-50%, -125%);"
        >
          <span class="px-1 text-[10px] font-extrabold tracking-wider text-violet-300 dark:text-violet-400 uppercase">✨ Assistant</span>
          <div class="h-4 w-px bg-slate-700 dark:bg-slate-800"></div>

          <button
            onclick={handleExplain}
            disabled={aiLoading}
            class="cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-slate-200 dark:text-slate-350 hover:bg-slate-800 dark:hover:bg-slate-900 transition-colors"
          >
            🔍 Explain
          </button>

          <div class="relative">
            <button
              onclick={() => (showRewriteDropdown = !showRewriteDropdown)}
              disabled={aiLoading}
              class="cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-slate-200 dark:text-slate-350 hover:bg-slate-800 dark:hover:bg-slate-900 transition-colors flex items-center gap-1"
            >
              ✍️ Rewrite
            </button>
            {#if showRewriteDropdown}
              <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl flex flex-col gap-0.5 z-55">
                {#each ["professional", "friendly", "shorter", "longer", "grammar"] as style}
                  <button
                    type="button"
                    onclick={() => {
                      handleRewrite(style);
                      showRewriteDropdown = false;
                    }}
                    class="cursor-pointer w-full text-left px-2 py-1.5 text-xs text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-violet-705 dark:hover:text-violet-400 rounded-lg capitalize transition-colors"
                  >
                    {style}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- AI Side Panel for selection explanations -->
      {#if showExplanationPanel}
        <div class="w-80 shrink-0 border-l border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/10 p-6 flex flex-col justify-between overflow-y-auto scrollbar-thin transition-colors">
          <div class="space-y-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-violet-650 dark:text-violet-400">✨</span>
                <h3 class="text-xs font-bold tracking-wider text-slate-800 dark:text-white uppercase">AI Explanation</h3>
              </div>
              <button
                onclick={() => {
                  showExplanationPanel = false;
                  aiExplanation = "";
                }}
                class="cursor-pointer text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                ✕
              </button>
            </div>

            <!-- Context snippet -->
            <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-sm">
              <span class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Selection</span>
              <p class="text-xs text-slate-650 dark:text-slate-400 italic line-clamp-3">"{selectedText}"</p>
            </div>

            <!-- Content -->
            <div class="space-y-2">
              <span class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Explanation</span>
              {#if aiLoading}
                <div class="space-y-2.5 animate-pulse">
                  <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                  <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-11/12"></div>
                  <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
                </div>
              {:else}
                <div class="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-light">
                  {aiExplanation || "No explanation generated yet."}
                </div>
              {/if}
            </div>
          </div>

          <div class="pt-4 border-t border-slate-200 dark:border-slate-800 text-[9px] text-slate-400 dark:text-slate-500 text-center select-none font-light">
            AI responses are generated by Groq (Llama 3).
          </div>
        </div>
      {/if}

    </div>
  {/if}
</div>

<style>
  /* TipTap placeholder styling */
  :global(.tiptap p.is-editor-empty:first-child::before) {
    color: rgba(148, 163, 184, 0.3);
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
</style>
