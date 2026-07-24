<script lang="ts">
	import type { Note } from 'shared-types';

	let { notes, onAttach, onDetach } = $props<{
		notes: Note[];
		onAttach: () => void;
		onDetach: (noteId: string) => void;
	}>();
</script>

<div
	class="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
>
	<div class="flex items-center justify-between">
		<h4 class="text-sm font-bold text-slate-700 dark:text-slate-300">Attached Notes</h4>
		<button onclick={onAttach} class="text-xs font-semibold text-blue-600 hover:underline">
			+ Add Note
		</button>
	</div>

	{#if notes.length === 0}
		<p class="text-xs text-slate-500">No notes linked to this task.</p>
	{:else}
		<ul class="space-y-2">
			{#each notes as note}
				<li
					class="flex items-center justify-between rounded border bg-white p-2 text-xs dark:bg-slate-800"
				>
					<span class="truncate font-medium">{note.title}</span>
					<button onclick={() => onDetach(note.id)} class="text-red-500 hover:text-red-700">
						✕
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
