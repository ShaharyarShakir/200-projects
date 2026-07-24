<script lang="ts">
	let {
		search = $bindable(),
		status = $bindable(),
		priority = $bindable()
	} = $props<{
		search: string;
		status: string;
		priority: string;
	}>();
</script>

<div class="mb-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
	<div class="relative w-full sm:w-72">
		<svg
			class="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
			/>
		</svg>
		<input
			type="text"
			placeholder="Search tasks..."
			bind:value={search}
			class="w-full rounded-xl border border-slate-700/60 bg-slate-800/60 py-2 pr-4 pl-10 text-sm text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
		/>
	</div>

	<div class="flex w-full items-center gap-2 sm:w-auto">
		<select
			bind:value={status}
			class="w-1/2 rounded-xl border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none sm:w-auto"
		>
			<option value="">All Statuses</option>
			<option value="TODO">To Do</option>
			<option value="IN_PROGRESS">In Progress</option>
			<option value="DONE">Done</option>
		</select>

		<select
			bind:value={priority}
			class="w-1/2 rounded-xl border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none sm:w-auto"
		>
			<option value="">All Priorities</option>
			<option value="LOW">Low</option>
			<option value="MEDIUM">Medium</option>
			<option value="HIGH">High</option>
		</select>
	</div>
</div>
