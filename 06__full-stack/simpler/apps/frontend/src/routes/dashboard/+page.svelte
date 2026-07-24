<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { tasksApi } from '$lib/api/tasks';
	import type { Task } from '$lib/types/task';
	import type { Note } from 'shared-types';

	let tasks = $state<Task[]>([]);
	let notes = $state<Note[]>([]);
	let loading = $state(true);

	// Stats
	let pendingTasksCount = $derived(tasks.filter((t) => t.status !== 'DONE').length);
	let completedTasksCount = $derived(tasks.filter((t) => t.status === 'DONE').length);

	async function loadDashboardData() {
		loading = true;
		try {
			// Fetch tasks
			const tasksRes = await tasksApi.getTasks();
			tasks = tasksRes.data;

			// Fetch notes
			const notesRes = await fetch('/api/notes');
			if (notesRes.ok) {
				const notesData = await notesRes.json();
				notes = notesData.data;
			}
		} catch (err) {
			console.error('Failed to load dashboard data:', err);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadDashboardData();
	});

	async function handleToggleTask(id: string) {
		try {
			await tasksApi.toggleTask(id);
			await loadDashboardData();
		} catch (err) {
			console.error('Failed to toggle task:', err);
		}
	}

	async function handleLogout() {
		await auth.logout();
		goto('/login');
	}
</script>

<svelte:head>
	<title>Dashboard | Simpler</title>
</svelte:head>

<div class="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
	<!-- Dashboard Header -->
	<header
		class="flex flex-col gap-4 border-b border-slate-800/60 pb-6 sm:flex-row sm:items-center sm:justify-between"
	>
		<div>
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md"
				>
					<svg
						class="h-5.5 w-5.5 text-white"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2.5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
						/>
					</svg>
				</div>
				<div>
					<h1 class="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
					<p class="text-xs text-slate-400">Welcome back, {auth.user?.email || 'User'}</p>
				</div>
			</div>
		</div>

		<!-- Nav actions -->
		<div class="flex items-center gap-3">
			<a
				href="/dashboard/tasks"
				class="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
			>
				Tasks
			</a>
			<a
				href="/notes"
				class="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
			>
				Notes
			</a>
			<button
				onclick={handleLogout}
				class="rounded-xl border border-slate-800/80 bg-red-950/20 px-4 py-2 text-sm font-semibold text-red-400 transition-colors hover:bg-red-900/20 hover:text-red-300"
			>
				Sign Out
			</button>
		</div>
	</header>

	<!-- Welcome Stats Grid -->
	<section class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
		<!-- Active Tasks -->
		<a
			href="/dashboard/tasks"
			class="group rounded-2xl border border-slate-800/80 bg-slate-900/30 p-6 transition-all hover:border-slate-700 hover:bg-slate-900/50"
		>
			<div class="flex items-center justify-between">
				<span class="text-sm font-semibold text-slate-400">Pending Tasks</span>
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-400"
				>
					<svg
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
			</div>
			<div class="mt-4 flex items-baseline gap-2">
				<span class="text-3xl font-bold text-white">{loading ? '...' : pendingTasksCount}</span>
				<span class="text-xs text-slate-500">remaining</span>
			</div>
		</a>

		<!-- Completed Tasks -->
		<a
			href="/dashboard/tasks"
			class="group rounded-2xl border border-slate-800/80 bg-slate-900/30 p-6 transition-all hover:border-slate-700 hover:bg-slate-900/50"
		>
			<div class="flex items-center justify-between">
				<span class="text-sm font-semibold text-slate-400">Completed Tasks</span>
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-400"
				>
					<svg
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
				</div>
			</div>
			<div class="mt-4 flex items-baseline gap-2">
				<span class="text-3xl font-bold text-white">{loading ? '...' : completedTasksCount}</span>
				<span class="text-xs text-slate-500">completed</span>
			</div>
		</a>

		<!-- Notes Drafts -->
		<a
			href="/notes"
			class="group rounded-2xl border border-slate-800/80 bg-slate-900/30 p-6 transition-all hover:border-slate-700 hover:bg-slate-900/50"
		>
			<div class="flex items-center justify-between">
				<span class="text-sm font-semibold text-slate-400">Total Notes</span>
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400"
				>
					<svg
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
						/>
					</svg>
				</div>
			</div>
			<div class="mt-4 flex items-baseline gap-2">
				<span class="text-3xl font-bold text-white">{loading ? '...' : notes.length}</span>
				<span class="text-xs text-slate-500">authored</span>
			</div>
		</a>

		<!-- Quick actions panel -->
		<div
			class="flex flex-col justify-center gap-2.5 rounded-2xl border border-slate-800 bg-slate-950 p-6"
		>
			<a
				href="/dashboard/tasks"
				class="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-xs font-semibold text-white shadow-md shadow-indigo-600/15 transition-all hover:bg-indigo-500 hover:shadow-indigo-600/25"
			>
				<svg
					class="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2.5"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
				</svg>
				New Task
			</a>
			<a
				href="/notes"
				class="text-slate-350 flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 py-2.5 text-center text-xs font-semibold transition-all hover:bg-slate-800 hover:text-white"
			>
				<svg
					class="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2.5"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
				</svg>
				New Note
			</a>
		</div>
	</section>

	<!-- Main Dashboard Panels -->
	<section class="grid grid-cols-1 gap-8 lg:grid-cols-2">
		<!-- Tasks Column -->
		<div
			class="flex flex-col justify-between space-y-6 rounded-2xl border border-slate-800/80 bg-slate-900/15 p-6"
		>
			<div>
				<div class="flex items-center justify-between border-b border-slate-800/60 pb-4">
					<h3 class="text-lg font-bold text-white">Recent Tasks</h3>
					<a href="/dashboard/tasks" class="text-xs font-semibold text-indigo-400 hover:underline">
						View All
					</a>
				</div>

				<!-- Tasks List -->
				<div class="mt-4 space-y-3">
					{#if loading}
						{#each Array(3) as _}
							<div
								class="h-16 animate-pulse rounded-xl border border-slate-800/40 bg-slate-900/40"
							></div>
						{/each}
					{:else if tasks.length === 0}
						<div class="py-8 text-center text-sm text-slate-500">
							No tasks yet. Get started by creating your first task!
						</div>
					{:else}
						{#each tasks.slice(0, 5) as task}
							<div
								class="flex items-center justify-between gap-3 rounded-xl border border-slate-800/50 bg-slate-900/20 p-4 transition-all hover:bg-slate-900/45"
							>
								<div class="flex items-center gap-3">
									<button
										onclick={() => handleToggleTask(task.id)}
										aria-label="Toggle task completion status"
										class="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-slate-700 transition-colors hover:border-indigo-500 {task.status ===
										'DONE'
											? 'border-indigo-500 bg-indigo-600 text-white'
											: 'bg-slate-950 text-transparent'}"
									>
										<svg
											class="h-3.5 w-3.5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											stroke-width="3"
										>
											<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
										</svg>
									</button>
									<span
										class="text-sm font-semibold transition-colors {task.status === 'DONE'
											? 'text-slate-500 line-through'
											: 'text-slate-200'}"
									>
										{task.title}
									</span>
								</div>

								<!-- Priority Badge -->
								{#if task.status !== 'DONE'}
									<span
										class="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase {task.priority ===
										'HIGH'
											? 'bg-red-500/10 text-red-400'
											: task.priority === 'MEDIUM'
												? 'bg-yellow-500/10 text-yellow-400'
												: 'bg-green-500/10 text-green-400'}"
									>
										{task.priority}
									</span>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>

		<!-- Notes Column -->
		<div
			class="flex flex-col justify-between space-y-6 rounded-2xl border border-slate-800/80 bg-slate-900/15 p-6"
		>
			<div>
				<div class="flex items-center justify-between border-b border-slate-800/60 pb-4">
					<h3 class="text-lg font-bold text-white">Recent Notes</h3>
					<a href="/notes" class="text-xs font-semibold text-indigo-400 hover:underline">
						View All
					</a>
				</div>

				<!-- Notes List -->
				<div class="mt-4 space-y-3">
					{#if loading}
						{#each Array(3) as _}
							<div
								class="h-16 animate-pulse rounded-xl border border-slate-800/40 bg-slate-900/40"
							></div>
						{/each}
					{:else if notes.length === 0}
						<div class="py-8 text-center text-sm text-slate-500">
							No notes yet. Capture your ideas by writing a new note!
						</div>
					{:else}
						{#each notes.slice(0, 5) as note}
							<a
								href="/notes"
								class="flex items-center justify-between gap-3 rounded-xl border border-slate-800/50 bg-slate-900/20 p-4 text-left transition-all hover:bg-slate-900/45"
							>
								<div class="space-y-1">
									<h4
										class="text-sm font-semibold text-slate-200 transition-colors group-hover:text-indigo-400"
									>
										{note.title || 'Untitled Note'}
									</h4>
									<p class="line-clamp-1 text-xs text-slate-500">
										{note.content ? note.content.replace(/[#*`_-]/g, '') : 'No content'}
									</p>
								</div>

								<!-- Star Icon -->
								{#if note.favorite}
									<span class="shrink-0 text-sm text-yellow-500">★</span>
								{/if}
							</a>
						{/each}
					{/if}
				</div>
			</div>
		</div>
	</section>
</div>
