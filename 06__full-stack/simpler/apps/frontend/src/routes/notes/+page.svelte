<script lang="ts">
	import type { Note } from 'shared-types';
	import NoteCard from '$lib/components/NoteCard.svelte';
	import NoteEditor from '$lib/components/NoteEditor.svelte';

	// State runes
	let notes = $state<Note[]>([]);
	let selectedNote = $state<Partial<Note> | null>(null);
	let search = $state('');
	let selectedTag = $state<string | null>(null);
	let onlyFavorites = $state(false);

	// Fetch Notes
	async function loadNotes() {
		const params = new URLSearchParams();
		if (search) params.append('search', search);
		if (onlyFavorites) params.append('favorite', 'true');
		if (selectedTag) params.append('tag', selectedTag);

		const res = await fetch(`/api/notes?${params.toString()}`);
		if (res.ok) {
			const result = await res.json();
			notes = result.data;
		}
	}

	$effect(() => {
		loadNotes();
	});

	async function handleSave(noteData: Partial<Note>) {
		if (selectedNote?.id) {
			await fetch(`/api/notes/${selectedNote.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(noteData)
			});
		} else {
			await fetch('/api/notes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(noteData)
			});
		}
		selectedNote = null;
		loadNotes();
	}

	async function handleFavoriteToggle(id: string) {
		await fetch(`/api/notes/${id}/favorite`, { method: 'PATCH' });
		loadNotes();
	}

	async function handleDelete(id: string) {
		await fetch(`/api/notes/${id}`, { method: 'DELETE' });
		selectedNote = null;
		loadNotes();
	}

	async function handleConvertToTask(id: string) {
		await fetch(`/api/notes/${id}/convert-to-task`, { method: 'POST' });
		selectedNote = null;
		loadNotes();
	}
</script>

<div class="flex h-screen flex-col gap-4 bg-slate-100 p-4 md:flex-row dark:bg-slate-950">
	<!-- Filter & Search Sidebar -->
	<aside
		class="flex w-full flex-col gap-4 rounded-lg border bg-white p-4 md:w-64 dark:bg-slate-900"
	>
		<button
			onclick={() => (selectedNote = { title: '', content: '' })}
			class="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white transition hover:bg-blue-700"
		>
			+ New Note
		</button>

		<input
			type="text"
			bind:value={search}
			placeholder="Search notes..."
			class="rounded-md border p-2 text-sm dark:bg-slate-800 dark:text-white"
		/>

		<div class="flex flex-col gap-1 text-sm font-medium">
			<button
				onclick={() => {
					onlyFavorites = false;
					selectedTag = null;
				}}
				class="rounded p-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
			>
				All Notes
			</button>
			<button
				onclick={() => {
					onlyFavorites = true;
				}}
				class="rounded p-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
			>
				★ Favorites
			</button>
		</div>
	</aside>

	<!-- Notes Grid / List -->
	<main class="flex flex-grow flex-col gap-4 overflow-hidden md:flex-row">
		<div class="grid w-full grid-cols-1 gap-3 overflow-y-auto md:w-1/2">
			{#if notes.length === 0}
				<div class="rounded-lg border bg-white p-8 text-center text-slate-500 dark:bg-slate-900">
					No notes found. Start writing your first note!
				</div>
			{:else}
				{#each notes as note}
					<NoteCard
						{note}
						onSelect={(n) => (selectedNote = n)}
						onFavoriteToggle={handleFavoriteToggle}
					/>
				{/each}
			{/if}
		</div>

		<!-- Active Editor / Preview Drawer -->
		{#if selectedNote}
			<div class="h-full w-full md:w-1/2">
				<NoteEditor
					note={selectedNote}
					onSave={handleSave}
					onDelete={handleDelete}
					onConvertToTask={handleConvertToTask}
				/>
			</div>
		{/if}
	</main>
</div>
