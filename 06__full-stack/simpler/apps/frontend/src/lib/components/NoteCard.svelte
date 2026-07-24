<script lang="ts">
	import type { Note } from 'shared-types';

	let { note, onFavoriteToggle, onSelect } = $props<{
		note: Note;
		onFavoriteToggle: (id: string) => void;
		onSelect: (note: Note) => void;
	}>();

	function handleFavorite(e: MouseEvent) {
		e.stopPropagation();
		onFavoriteToggle(note.id);
	}
</script>

<div
	role="button"
	tabindex="0"
	onclick={() => onSelect(note)}
	onkeydown={(e) => e.key === 'Enter' && onSelect(note)}
	class="flex cursor-pointer flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
>
	<div class="flex items-center justify-between">
		<h3 class="truncate font-semibold text-slate-900 dark:text-slate-100">
			{note.title || 'Untitled Note'}
		</h3>
		<button
			onclick={handleFavorite}
			class="text-xl transition hover:scale-110"
			aria-label="Toggle Favorite"
		>
			{note.favorite ? '★' : '☆'}
		</button>
	</div>

	<p class="line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
		{note.content || 'No additional text...'}
	</p>

	{#if note.tags && note.tags.length > 0}
		<div class="mt-2 flex flex-wrap gap-1">
			{#each note.tags as tag}
				<span
					class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-300"
				>
					#{tag.name}
				</span>
			{/each}
		</div>
		,
	{/if}

	<span class="mt-2 text-xs text-slate-400">
		Updated {new Date(note.updatedAt).toLocaleDateString()}
	</span>
</div>
