<script lang="ts">
	import type { Task } from '$lib/types/task';

	let { task, onToggle, onEdit, onDelete } = $props<{
		task: Task;
		onToggle: (id: string) => void;
		onEdit: (task: Task) => void;
		onDelete: (id: string) => void;
	}>();

	const isDone = $derived(task.status === 'DONE');

	const priorityColors = {
		LOW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
		MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
		HIGH: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
	};
</script>

<div
	class="group relative flex items-start justify-between gap-4 rounded-xl border border-slate-700/50 bg-slate-800/60 p-4 shadow-sm transition-all hover:border-slate-600/80"
>
	<div class="flex min-w-0 items-start gap-3.5">
		<button
			onclick={() => onToggle(task.id)}
			class="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border border-slate-600 transition-colors focus:ring-2 focus:ring-indigo-500/50 focus:outline-none {isDone
				? 'border-indigo-600 bg-indigo-600 text-white'
				: 'hover:border-slate-400'}"
		>
			{#if isDone}
				<svg
					class="h-3.5 w-3.5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="3"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
				</svg>
			{/if}
		</button>

		<div class="min-w-0">
			<h3
				class="truncate text-sm font-medium text-slate-100 {isDone
					? 'text-slate-500 line-through'
					: ''}"
			>
				{task.title}
			</h3>

			{#if task.description}
				<p class="mt-1 line-clamp-2 text-xs text-slate-400">{task.description}</p>
			{/if}

			<div class="mt-3 flex items-center gap-2 text-xs">
				<span
					class="rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase {priorityColors[
						task.priority
					]}"
				>
					{task.priority}
				</span>

				{#if task.dueDate}
					<span class="flex items-center gap-1 text-slate-400">
						<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
						{new Date(task.dueDate).toLocaleDateString()}
					</span>
				{/if}
			</div>
		</div>
	</div>

	<div class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
		<button
			onclick={() => onEdit(task)}
			class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-white"
			title="Edit"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
				/>
			</svg>
		</button>
		<button
			onclick={() => onDelete(task.id)}
			class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
			title="Delete"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
				/>
			</svg>
		</button>
	</div>
</div>
