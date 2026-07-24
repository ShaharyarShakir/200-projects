<script lang="ts">
	import { tasksApi } from '$lib/api/tasks';
	import type { Task } from '$lib/types/task';
	import TaskCard from '$lib/components/TaskCard.svelte';
	import TaskFilters from '$lib/components/TaskFilters.svelte';
	import TaskModal from '$lib/components/TaskModal.svelte';

	let tasks = $state<Task[]>([]);
	let loading = $state(true);
	let search = $state('');
	let status = $state('');
	let priority = $state('');

	let isModalOpen = $state(false);
	let selectedTask = $state<Task | null>(null);

	async function loadTasks() {
		loading = true;
		try {
			const res = await tasksApi.getTasks({
				search,
				status: (status as any) || undefined,
				priority: (priority as any) || undefined
			});
			tasks = res.data;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		// Automatically re-fetch on filter changes
		search;
		status;
		priority;
		loadTasks();
	});

	async function handleToggle(id: string) {
		await tasksApi.toggleTask(id);
		await loadTasks();
	}

	async function handleDelete(id: string) {
		if (confirm('Are you sure you want to delete this task?')) {
			await tasksApi.deleteTask(id);
			await loadTasks();
		}
	}

	function handleEdit(task: Task) {
		selectedTask = task;
		isModalOpen = true;
	}

	function handleCreateNew() {
		selectedTask = null;
		isModalOpen = true;
	}

	async function handleSaveTask(data: Partial<Task>) {
		if (selectedTask) {
			await tasksApi.updateTask(selectedTask.id, data);
		} else {
			await tasksApi.createTask(data);
		}
		await loadTasks();
	}
</script>

<div class="mx-auto w-full max-w-4xl space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-white">Tasks</h1>
			<p class="mt-1 text-sm text-slate-400">Manage and organize your workload</p>
		</div>

		<button
			onclick={handleCreateNew}
			class="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			New Task
		</button>
	</div>

	<TaskFilters bind:search bind:status bind:priority />

	{#if loading}
		<div class="space-y-3">
			{#each Array(3) as _}
				<div class="h-20 animate-pulse rounded-xl border border-slate-700/30 bg-slate-800/40"></div>
			{/each}
		</div>
	{:else if tasks.length === 0}
		<div class="rounded-2xl border border-slate-700/40 bg-slate-800/30 py-16 text-center">
			<p class="text-base text-slate-400">No tasks found.</p>
			<button onclick={handleCreateNew} class="mt-3 text-sm text-indigo-400 hover:underline">
				Create your first task
			</button>
		</div>
	{:else}
		<div class="space-y-3">
			{#each tasks as task (task.id)}
				<TaskCard {task} onToggle={handleToggle} onEdit={handleEdit} onDelete={handleDelete} />
			{/each}
		</div>
	{/if}

	<TaskModal
		isOpen={isModalOpen}
		task={selectedTask}
		onClose={() => (isModalOpen = false)}
		onSave={handleSaveTask}
	/>
</div>
