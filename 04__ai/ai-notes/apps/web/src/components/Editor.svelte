<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Placeholder from '@tiptap/extension-placeholder';
	import Link from '@tiptap/extension-link';
	import CodeBlock from '@tiptap/extension-code-block';
	import Image from '@tiptap/extension-image';

	interface Notebook {
		id: string;
		name: string;
	}

	interface Note {
		id: string;
		title: string;
		content?: any;
		notebookId?: string | null;
	}

	interface Props {
		note: Note | null | undefined;
		notebooks: Notebook[];
		saveStatus: 'saved' | 'saving' | 'offline';
		onsave: (
			id: string,
			updates: { title?: string; content?: any; notebookId?: string | null }
		) => void;
	}

	let { note, notebooks = [], saveStatus = 'saved', onsave }: Props = $props();

	let element = $state<HTMLDivElement | null>(null);
	let editor = $state<Editor | null>(null);
	let localTitle = $state('');
	let localNotebookId = $state<string | null>(null);

	// Debounced auto-save logic
	let saveTimeout: number;
	function triggerSave(
		updatedTitle: string,
		updatedContent: any,
		updatedNotebookId: string | null
	) {
		if (!note) return;
		window.clearTimeout(saveTimeout);
		saveTimeout = window.setTimeout(() => {
			onsave(note!.id, {
				title: updatedTitle,
				content: updatedContent,
				notebookId: updatedNotebookId
			});
		}, 1000); // 1-second debounce delay
	}

	// Effect to load note metadata when the selected note changes
	$effect(() => {
		if (note) {
			localTitle = note.title;
			localNotebookId = note.notebookId || '';
		}
	});

	// Effect to synchronize editor content when the active note changes
	$effect(() => {
		if (editor && note) {
			const incomingContent = note.content || { type: 'doc', content: [] };
			const currentJSON = editor.getJSON();

			if (JSON.stringify(currentJSON) !== JSON.stringify(incomingContent)) {
				editor.commands.setContent(incomingContent, { emitUpdate: false });
			}
		}
	});

	onMount(() => {
		if (!element) return;

		editor = new Editor({
			element,
			extensions: [
				StarterKit.configure({
					codeBlock: false // Disable built-in codeblock to use custom CodeBlock extension
				}),
				Placeholder.configure({
					placeholder: 'Start typing your thoughts here...'
				}),
				Link.configure({
					openOnClick: false,
					HTMLAttributes: {
						class: 'text-violet-400 underline cursor-pointer'
					}
				}),
				CodeBlock.configure({
					HTMLAttributes: {
						class:
							'bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs my-4 text-violet-300 overflow-x-auto'
					}
				}),
				Image.configure({
					HTMLAttributes: {
						class: 'rounded-xl border border-slate-900 max-w-full my-4'
					}
				})
			],
			editorProps: {
				attributes: {
					class:
						'prose prose-invert focus:outline-none max-w-none min-h-[400px] text-slate-200 text-sm leading-relaxed'
				}
			},
			content: note?.content || { type: 'doc', content: [] },
			onUpdate: ({ editor }) => {
				if (!note) return;
				const currentJSON = editor.getJSON();
				triggerSave(localTitle, currentJSON, localNotebookId ? localNotebookId : null);
			}
		});
	});

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
		window.clearTimeout(saveTimeout);
	});

	function handleTitleChange(e: Event) {
		if (!note) return;
		localTitle = (e.target as HTMLInputElement).value;
		triggerSave(localTitle, editor?.getJSON() || {}, localNotebookId ? localNotebookId : null);
	}

	function handleNotebookChange(e: Event) {
		if (!note) return;
		const val = (e.target as HTMLSelectElement).value;
		localNotebookId = val === '' ? null : val;
		triggerSave(localTitle, editor?.getJSON() || {}, localNotebookId);
	}
</script>

<div class="relative z-10 flex h-full flex-grow flex-col bg-slate-950/20">
	{#if !note}
		<div class="flex flex-grow flex-col items-center justify-center p-8 text-center text-slate-500">
			<span class="mb-3 text-4xl opacity-50">🖊</span>
			<p class="text-sm italic">Select or create a note to begin writing</p>
		</div>
	{:else}
		<!-- Top Bar: Autosave Indicator, Notebook Select, Document Title -->
		<div class="flex items-center justify-between gap-4 border-b border-slate-900/60 px-6 py-4">
			<div class="flex max-w-lg flex-grow items-center gap-3">
				<!-- Notebook Dropdown Selector -->
				<select
					value={localNotebookId || ''}
					onchange={handleNotebookChange}
					class="cursor-pointer rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-violet-500"
				>
					<option value="">No Notebook</option>
					{#each notebooks as n}
						<option value={n.id}>{n.name}</option>
					{/each}
				</select>

				<input
					type="text"
					value={localTitle}
					oninput={handleTitleChange}
					placeholder="Untitled Note"
					class="flex-grow border-none bg-transparent text-base font-bold text-white outline-none placeholder:text-slate-700"
				/>
			</div>

			<!-- Autosave Status Indicator -->
			<div class="flex shrink-0 items-center gap-2 text-xs">
				{#if saveStatus === 'saving'}
					<span class="h-2 w-2 animate-ping rounded-full bg-yellow-500"></span>
					<span class="font-light text-slate-400">Saving...</span>
				{:else if saveStatus === 'offline'}
					<span class="h-2 w-2 rounded-full bg-red-500"></span>
					<span class="font-medium text-red-400">Offline</span>
				{:else}
					<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
					<span class="font-light text-slate-500">Saved</span>
				{/if}
			</div>
		</div>

		<!-- Formatting Toolbar -->
		{#if editor}
			<div
				class="flex flex-wrap items-center gap-1.5 border-b border-slate-900/40 bg-slate-950/40 px-6 py-2"
			>
				<button
					onclick={() => editor!.chain().focus().toggleBold().run()}
					class="cursor-pointer rounded-lg p-2 text-xs font-semibold transition-colors duration-200"
					class:bg-violet-600={editor.isActive('bold')}
					class:text-white={editor.isActive('bold')}
					class:text-slate-400={!editor.isActive('bold')}
					class:hover:bg-slate-900={!editor.isActive('bold')}
				>
					B
				</button>
				<button
					onclick={() => editor!.chain().focus().toggleItalic().run()}
					class="cursor-pointer rounded-lg p-2 text-xs italic transition-colors duration-200"
					class:bg-violet-600={editor.isActive('italic')}
					class:text-white={editor.isActive('italic')}
					class:text-slate-400={!editor.isActive('italic')}
					class:hover:bg-slate-900={!editor.isActive('italic')}
				>
					I
				</button>
				<button
					onclick={() => editor!.chain().focus().toggleHeading({ level: 1 }).run()}
					class="cursor-pointer rounded-lg p-2 text-xs font-bold transition-colors duration-200"
					class:bg-violet-600={editor.isActive('heading', { level: 1 })}
					class:text-white={editor.isActive('heading', { level: 1 })}
					class:text-slate-400={!editor.isActive('heading', { level: 1 })}
					class:hover:bg-slate-900={!editor.isActive('heading', { level: 1 })}
				>
					H1
				</button>
				<button
					onclick={() => editor!.chain().focus().toggleHeading({ level: 2 }).run()}
					class="cursor-pointer rounded-lg p-2 text-xs font-bold transition-colors duration-200"
					class:bg-violet-600={editor.isActive('heading', { level: 2 })}
					class:text-white={editor.isActive('heading', { level: 2 })}
					class:text-slate-400={!editor.isActive('heading', { level: 2 })}
					class:hover:bg-slate-900={!editor.isActive('heading', { level: 2 })}
				>
					H2
				</button>
				<div class="mx-1 h-4 w-px bg-slate-900"></div>
				<button
					onclick={() => editor!.chain().focus().toggleBulletList().run()}
					class="cursor-pointer rounded-lg p-2 text-xs transition-colors duration-200"
					class:bg-violet-600={editor.isActive('bulletList')}
					class:text-white={editor.isActive('bulletList')}
					class:text-slate-400={!editor.isActive('bulletList')}
					class:hover:bg-slate-900={!editor.isActive('bulletList')}
				>
					• List
				</button>
				<button
					onclick={() => editor!.chain().focus().toggleOrderedList().run()}
					class="cursor-pointer rounded-lg p-2 text-xs transition-colors duration-200"
					class:bg-violet-600={editor.isActive('orderedList')}
					class:text-white={editor.isActive('orderedList')}
					class:text-slate-400={!editor.isActive('orderedList')}
					class:hover:bg-slate-900={!editor.isActive('orderedList')}
				>
					1. List
				</button>
				<button
					onclick={() => editor!.chain().focus().toggleBlockquote().run()}
					class="cursor-pointer rounded-lg p-2 font-serif text-xs transition-colors duration-200"
					class:bg-violet-600={editor.isActive('blockquote')}
					class:text-white={editor.isActive('blockquote')}
					class:text-slate-400={!editor.isActive('blockquote')}
					class:hover:bg-slate-900={!editor.isActive('blockquote')}
				>
					“ Quote
				</button>
				<button
					onclick={() => editor!.chain().focus().toggleCodeBlock().run()}
					class="cursor-pointer rounded-lg p-2 font-mono text-xs transition-colors duration-200"
					class:bg-violet-600={editor.isActive('codeBlock')}
					class:text-white={editor.isActive('codeBlock')}
					class:text-slate-400={!editor.isActive('codeBlock')}
					class:hover:bg-slate-900={!editor.isActive('codeBlock')}
				>
					&lt;/&gt;
				</button>
				<div class="mx-1 h-4 w-px bg-slate-900"></div>
				<button
					onclick={() => editor!.chain().focus().undo().run()}
					class="cursor-pointer rounded-lg p-2 text-xs text-slate-400 hover:bg-slate-900 hover:text-white"
				>
					↶ Undo
				</button>
				<button
					onclick={() => editor!.chain().focus().redo().run()}
					class="cursor-pointer rounded-lg p-2 text-xs text-slate-400 hover:bg-slate-900 hover:text-white"
				>
					↷ Redo
				</button>
			</div>
		{/if}

		<!-- Content Workspace -->
		<div class="flex-grow scrollbar-thin overflow-y-auto p-6">
			<div bind:this={element} class="w-full"></div>
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
