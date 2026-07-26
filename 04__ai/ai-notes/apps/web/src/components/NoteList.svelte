<script lang="ts">
	import Button from './Button.svelte';

	interface Note {
		id: string;
		title: string;
		content?: any;
		isFavorite: boolean;
		isPinned: boolean;
		isArchived: boolean;
		deletedAt?: string | null;
		updatedAt: string;
	}

	interface Props {
		notes: Note[];
		selectedNoteId: string | null;
		currentView: 'all' | 'favorites' | 'trash' | 'notebook';
		searchQuery: string;
		onselectNote: (id: string) => void;
		oncreateNote: () => void;
		ontoggleFavorite: (id: string) => void;
		ontogglePin: (id: string) => void;
		onsoftDelete: (id: string) => void;
		onpermanentDelete: (id: string) => void;
		onrestore: (id: string) => void;
		onsearchQueryChange: (q: string) => void;
	}

	let {
		notes = [],
		selectedNoteId,
		currentView,
		searchQuery = $bindable(''),
		onselectNote,
		oncreateNote,
		ontoggleFavorite,
		ontogglePin,
		onsoftDelete,
		onpermanentDelete,
		onrestore,
		onsearchQueryChange
	}: Props = $props();

	// Helper to strip HTML tags from TipTap content for preview snippets
	function getPreviewSnippet(content: any): string {
		if (!content) return 'No content';
		try {
			if (typeof content === 'string') {
				return content.substring(0, 80);
			}

			// Simple recursive search for text nodes in TipTap JSON
			let text = '';
			function extractText(node: any) {
				if (!node) return;
				if (node.type === 'text' && node.text) {
					text += node.text + ' ';
				}
				if (node.content && Array.isArray(node.content)) {
					node.content.forEach(extractText);
				}
			}
			extractText(content);
			return text.trim().substring(0, 80) || 'Empty note';
		} catch {
			return 'Empty note';
		}
	}

	function handleSearchInput(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		onsearchQueryChange(val);
	}
</script>

<div
	class="relative z-10 flex h-full w-full shrink-0 flex-col border-r border-slate-900 bg-slate-950/10 md:w-80"
>
	<!-- Header / Search -->
	<div class="space-y-3 border-b border-slate-900/60 p-4">
		<div class="flex items-center justify-between">
			<h2 class="text-sm font-bold tracking-wide text-white uppercase">
				{#if currentView === 'all'}
					All Notes
				{:else}
					<span class="capitalize">{currentView}</span>
				{/if}
			</h2>

			{#if currentView !== 'trash'}
				<button
					onclick={oncreateNote}
					class="hover:bg-slate-850 cursor-pointer rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition-all duration-200 hover:text-white active:scale-95"
					title="New Note (Ctrl+N)"
				>
					➕ New
				</button>
			{/if}
		</div>

		<!-- Search Input -->
		<div class="relative">
			<span
				class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xs text-slate-500"
				>🔍</span
			>
			<input
				type="text"
				placeholder="Search notes..."
				value={searchQuery}
				oninput={handleSearchInput}
				class="glass-input placeholder:text-slate-650 w-full rounded-xl py-2.5 pr-4 pl-9 text-xs text-white outline-none focus:outline-none"
			/>
		</div>
	</div>

	<!-- Notes List Scroll Container -->
	<div class="flex-grow scrollbar-thin space-y-2.5 overflow-y-auto p-3.5">
		{#if notes.length === 0}
			<div class="flex flex-col items-center justify-center space-y-2 py-16 text-center">
				<span class="text-3xl opacity-50">📝</span>
				<p class="text-xs text-slate-500 italic">No notes found</p>
			</div>
		{:else}
			{#each notes as n (n.id)}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					onclick={() => onselectNote(n.id)}
					class="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border p-4 transition-all duration-250 {selectedNoteId ===
					n.id
						? 'border-violet-500/40 bg-slate-900/55'
						: 'border-slate-900 bg-slate-900/10 hover:border-slate-800'}"
				>
					<!-- Pin and Favorites Status Badges -->
					<div class="mb-2 flex items-center justify-between">
						<span class="text-[10px] font-medium text-slate-500">
							{new Date(n.updatedAt).toLocaleDateString(undefined, {
								month: 'short',
								day: 'numeric'
							})}
						</span>

						<div class="relative z-20 flex items-center gap-1.5">
							{#if n.isPinned}
								<span class="text-[10px]" title="Pinned">📌</span>
							{/if}
							{#if n.isFavorite}
								<span class="text-[10px]" title="Favorite">⭐</span>
							{/if}
						</div>
					</div>

					<!-- Note Title -->
					<h3
						class="truncate text-sm font-semibold transition-colors duration-200"
						class:text-violet-400={selectedNoteId === n.id}
						class:text-white={selectedNoteId !== n.id}
					>
						{n.title || 'Untitled Note'}
					</h3>

					<!-- Note Content Snippet -->
					<p class="mt-1 line-clamp-2 text-xs leading-relaxed font-light text-slate-400">
						{getPreviewSnippet(n.content)}
					</p>

					<!-- List Row Hover Action Icons -->
					<div
						class="relative z-20 mt-3.5 flex justify-end gap-2 border-t border-slate-900/40 pt-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
					>
						{#if currentView === 'trash'}
							<button
								onclick={(e) => {
									e.stopPropagation();
									onrestore(n.id);
								}}
								class="cursor-pointer text-[10px] font-medium text-emerald-400 hover:text-emerald-300"
								title="Restore note"
							>
								Restore
							</button>
							<button
								onclick={(e) => {
									e.stopPropagation();
									if (
										confirm(
											'Are you sure you want to permanently delete this note? This action cannot be undone.'
										)
									) {
										onpermanentDelete(n.id);
									}
								}}
								class="cursor-pointer text-[10px] font-medium text-red-400 hover:text-red-300"
								title="Delete permanently"
							>
								Delete
							</button>
						{:else}
							<button
								onclick={(e) => {
									e.stopPropagation();
									ontogglePin(n.id);
								}}
								class="cursor-pointer text-xs hover:scale-110"
								title={n.isPinned ? 'Unpin note' : 'Pin note'}
							>
								📌
							</button>
							<button
								onclick={(e) => {
									e.stopPropagation();
									ontoggleFavorite(n.id);
								}}
								class="cursor-pointer text-xs hover:scale-110"
								title={n.isFavorite ? 'Remove favorite' : 'Mark favorite'}
							>
								⭐
							</button>
							<button
								onclick={(e) => {
									e.stopPropagation();
									onsoftDelete(n.id);
								}}
								class="cursor-pointer text-xs text-red-500 hover:scale-110 hover:text-red-400"
								title="Trash note"
							>
								🗑
							</button>
						{/if}
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
