<script lang="ts">
	import MarkdownPreview from './MarkdownPreview.svelte';

	let { note, onSave, onDelete, onConvertToTask } = $props<{
		note: Partial<Note>;
		onSave: (updated: Partial<Note>) => void;
		onDelete?: (id: string) => void;
		onConvertToTask?: (id: string) => void;
	}>();

	let title = $state('');
	let content = $state('');
	let activeTab = $state<'edit' | 'preview'>('edit');

	$effect(() => {
		title = note.title ?? '';
		content = note.content ?? '';
	});

	function handleSubmit() {
		onSave({ title, content });
	}
</script>

<div class="flex h-full flex-col overflow-hidden rounded-lg border bg-white dark:bg-slate-900">
	<div
		class="flex items-center justify-between border-b border-slate-200 p-3 dark:border-slate-800"
	>
		<!-- Responsive tab switcher -->
		<div class="flex gap-2">
			<button
				class="rounded px-3 py-1 text-sm font-medium {activeTab === 'edit'
					? 'bg-blue-100 text-blue-700'
					: 'text-slate-600'}"
				onclick={() => (activeTab = 'edit')}
			>
				Editor
			</button>
			<button
				class="rounded px-3 py-1 text-sm font-medium {activeTab === 'preview'
					? 'bg-blue-100 text-blue-700'
					: 'text-slate-600'}"
				onclick={() => (activeTab = 'preview')}
			>
				Preview
			</button>
		</div>

		<div class="flex gap-2">
			{#if note.id && onConvertToTask}
				<button
					onclick={() => onConvertToTask(note.id!)}
					class="rounded bg-amber-500 px-2 py-1 text-xs text-white hover:bg-amber-600"
				>
					Convert to Task
				</button>
			{/if}
			{#if note.id && onDelete}
				<button
					onclick={() => onDelete(note.id!)}
					class="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
				>
					Delete
				</button>
			{/if}
			<button
				onclick={handleSubmit}
				class="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
			>
				Save
			</button>
		</div>
	</div>

	<div class="grid flex-grow grid-cols-1 overflow-hidden md:grid-cols-2">
		<!-- Editor Pane -->
		<div
			class="flex flex-col gap-3 border-r border-slate-200 p-4 dark:border-slate-800 {activeTab ===
			'preview'
				? 'hidden md:flex'
				: 'flex'}"
		>
			<input
				type="text"
				bind:value={title}
				placeholder="Note Title..."
				class="border-b bg-transparent pb-2 text-xl font-bold outline-none dark:text-white"
			/>
			<textarea
				bind:value={content}
				placeholder="Write markdown here..."
				class="w-full flex-grow resize-none bg-transparent font-mono text-sm outline-none dark:text-slate-200"
			></textarea>
		</div>

		<!-- Preview Pane -->
		<div class="overflow-y-auto {activeTab === 'edit' ? 'hidden md:block' : 'block'}">
			<MarkdownPreview {content} />
		</div>
	</div>
</div>
