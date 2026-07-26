<script lang="ts">
	import Button from './Button.svelte';

	interface Notebook {
		id: string;
		name: string;
		icon?: string | null;
		color?: string | null;
	}

	interface Props {
		notebooks: Notebook[];
		currentView: 'all' | 'favorites' | 'trash' | 'notebook';
		selectedNotebookId: string | null;
		onselectView: (
			view: 'all' | 'favorites' | 'trash' | 'notebook',
			notebookId: string | null
		) => void;
		oncreateNotebook: (name: string, color: string, icon: string) => void;
		ondeleteNotebook: (id: string) => void;
	}

	let {
		notebooks = [],
		currentView,
		selectedNotebookId,
		onselectView,
		oncreateNotebook,
		ondeleteNotebook
	}: Props = $props();

	let showAddNotebook = $state(false);
	let newNotebookName = $state('');
	let newNotebookColor = $state('violet');
	let newNotebookIcon = $state('📁');

	const colors = [
		{ name: 'violet', class: 'bg-violet-500' },
		{ name: 'indigo', class: 'bg-indigo-500' },
		{ name: 'fuchsia', class: 'bg-fuchsia-500' },
		{ name: 'emerald', class: 'bg-emerald-500' },
		{ name: 'amber', class: 'bg-amber-500' },
		{ name: 'rose', class: 'bg-rose-500' }
	];

	function handleCreateNotebook(e: Event) {
		e.preventDefault();
		if (!newNotebookName.trim()) return;
		oncreateNotebook(newNotebookName.trim(), newNotebookColor, newNotebookIcon);
		newNotebookName = '';
		showAddNotebook = false;
	}
</script>

<div
	class="relative z-10 flex h-full w-full shrink-0 flex-col border-r border-slate-900 bg-slate-950/20 md:w-64"
>
	<!-- Sidebar Menu Header -->
	<div class="border-b border-slate-900/60 px-6 py-5">
		<h2 class="text-sm font-semibold tracking-wider text-slate-500 uppercase">Workspace</h2>
	</div>

	<!-- Quick Views -->
	<div class="flex-grow scrollbar-thin space-y-1.5 overflow-y-auto p-4">
		<button
			onclick={() => onselectView('all', null)}
			class="flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 {currentView ===
			'all'
				? 'bg-slate-900 text-white'
				: 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'}"
		>
			<span class="flex items-center gap-3">
				<span class="text-base">🏠</span> All Notes
			</span>
		</button>

		<button
			onclick={() => onselectView('favorites', null)}
			class="flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 {currentView ===
			'favorites'
				? 'bg-slate-900 text-white'
				: 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'}"
		>
			<span class="flex items-center gap-3">
				<span class="text-base text-yellow-500">⭐</span> Favorites
			</span>
		</button>

		<button
			onclick={() => onselectView('trash', null)}
			class="flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 {currentView ===
			'trash'
				? 'bg-slate-900 text-white'
				: 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'}"
		>
			<span class="flex items-center gap-3">
				<span class="text-base">🗑</span> Trash
			</span>
		</button>

		<div class="my-4 h-px bg-slate-900/60"></div>

		<!-- Notebooks Section -->
		<div class="mb-2 flex items-center justify-between px-3.5 py-1">
			<span class="text-xs font-bold tracking-wider text-slate-500 uppercase"> Notebooks </span>
			<button
				onclick={() => (showAddNotebook = !showAddNotebook)}
				class="cursor-pointer rounded-md p-0.5 text-sm text-slate-400 transition-colors hover:bg-slate-900/40 hover:text-white"
				title="Add Notebook"
			>
				➕
			</button>
		</div>

		<!-- Add Notebook Input Form -->
		{#if showAddNotebook}
			<form
				onsubmit={handleCreateNotebook}
				class="animate-fade-in mb-3 space-y-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5"
			>
				<input
					type="text"
					placeholder="Notebook title..."
					bind:value={newNotebookName}
					required
					class="border-slate-850 w-full rounded-lg border bg-slate-950/45 px-2.5 py-1.5 text-xs text-white outline-none focus:border-violet-500"
				/>

				<div class="flex items-center justify-between">
					<!-- Color Picker -->
					<div class="flex items-center gap-1">
						{#each colors as c}
							<button
								type="button"
								onclick={() => (newNotebookColor = c.name)}
								class="h-3.5 w-3.5 cursor-pointer rounded-full border transition-transform duration-200 {c.class}"
								class:scale-125={newNotebookColor === c.name}
								class:border-white={newNotebookColor === c.name}
								class:border-transparent={newNotebookColor !== c.name}
								aria-label={c.name}
								title={c.name}
							></button>
						{/each}
					</div>

					<div class="flex gap-1.5">
						<button
							type="button"
							onclick={() => (showAddNotebook = false)}
							class="cursor-pointer rounded px-2 py-1 text-[10px] text-slate-400 hover:text-white"
						>
							Cancel
						</button>
						<button
							type="submit"
							class="cursor-pointer rounded bg-violet-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-violet-500"
						>
							Create
						</button>
					</div>
				</div>
			</form>
		{/if}

		<!-- Notebooks List -->
		<div class="space-y-1">
			{#if notebooks.length === 0}
				<div class="px-3.5 py-2 text-xs text-slate-600 italic">No notebooks created</div>
			{:else}
				{#each notebooks as n}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						onclick={() => onselectView('notebook', n.id)}
						class="group flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 {currentView ===
							'notebook' && selectedNotebookId === n.id
							? 'bg-slate-900 text-white'
							: 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'}"
					>
						<span class="flex items-center gap-3 truncate">
							<span
								class="h-2.5 w-2.5 shrink-0 rounded-full"
								class:bg-violet-500={n.color === 'violet'}
								class:bg-indigo-500={n.color === 'indigo'}
								class:bg-fuchsia-500={n.color === 'fuchsia'}
								class:bg-emerald-500={n.color === 'emerald'}
								class:bg-amber-500={n.color === 'amber'}
								class:bg-rose-500={n.color === 'rose'}
							></span>
							<span class="truncate">{n.name}</span>
						</span>

						<button
							onclick={(e) => {
								e.stopPropagation();
								if (
									confirm(
										`Delete notebook "${n.name}"? This deletes the notebook only; notes will be preserved.`
									)
								) {
									ondeleteNotebook(n.id);
								}
							}}
							class="ml-2 cursor-pointer p-0.5 text-xs opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
							title="Delete Notebook"
						>
							🗑
						</button>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>
