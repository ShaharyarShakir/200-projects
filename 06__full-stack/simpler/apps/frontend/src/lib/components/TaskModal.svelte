<script lang="ts">
	import type { Task } from '$lib/types/task';

	let {
		isOpen,
		task = null,
		onClose,
		onSave
	} = $props<{
		isOpen: boolean;
		task?: Task | null;
		onClose: () => void;
		onSave: (data: Partial<Task>) => Promise<void>;
	}>();

	let title = $state('');
	let description = $state('');
	let priority = $state<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
	let dueDate = $state('');
	let loading = $state(false);

	$effect(() => {
		if (task) {
			title = task.title;
			description = task.description || '';
			priority = task.priority;
			dueDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
		} else {
			title = '';
			description = '';
			priority = 'MEDIUM';
			dueDate = '';
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		try {
			await onSave({
				title,
				description: description || undefined,
				priority,
				dueDate: dueDate || undefined
			});
			onClose();
		} finally {
			loading = false;
		}
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
	>
		<div
			class="w-full max-w-lg space-y-6 rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-2xl"
		>
			<div class="flex items-center justify-between border-b border-slate-700/60 pb-4">
				<h2 class="text-xl font-semibold text-white">{task ? 'Edit Task' : 'Create Task'}</h2>
				<button onclick={onClose} class="text-slate-400 hover:text-white">&times;</button>
			</div>

			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<label for="title" class="mb-1 block text-sm font-medium text-slate-300">Title</label>
					<input
						id="title"
						type="text"
						bind:value={title}
						required
						maxlength="120"
						placeholder="e.g. Implement auth guard"
						class="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
					/>
				</div>

				<div>
					<label for="desc" class="mb-1 block text-sm font-medium text-slate-300">Description</label
					>
					<textarea
						id="desc"
						bind:value={description}
						rows="3"
						placeholder="Add relevant notes or sub-tasks..."
						class="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
					></textarea>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="priority" class="mb-1 block text-sm font-medium text-slate-300"
							>Priority</label
						>
						<select
							id="priority"
							bind:value={priority}
							class="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
						>
							<option value="LOW">Low</option>
							<option value="MEDIUM">Medium</option>
							<option value="HIGH">High</option>
						</select>
					</div>

					<div>
						<label for="dueDate" class="mb-1 block text-sm font-medium text-slate-300"
							>Due Date</label
						>
						<input
							id="dueDate"
							type="date"
							bind:value={dueDate}
							class="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
						/>
					</div>
				</div>

				<div class="flex items-center justify-end gap-3 border-t border-slate-700/60 pt-4">
					<button
						type="button"
						onclick={onClose}
						class="rounded-xl px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700/50"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={loading}
						class="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
					>
						{loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
