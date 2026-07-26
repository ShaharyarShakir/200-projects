<script lang="ts">
	interface Props {
		title: string;
		content: string;
		tag?: string;
		timeAgo: string;
		onclick?: () => void;
	}

	let { title, content, tag = 'Note', timeAgo, onclick }: Props = $props();

	// Computed colors based on tag category
	let tagClasses = $derived.by(() => {
		const lower = tag.toLowerCase();
		if (lower.includes('work') || lower.includes('job')) {
			return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
		} else if (lower.includes('personal') || lower.includes('life')) {
			return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
		} else if (lower.includes('idea') || lower.includes('creative')) {
			return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
		} else {
			return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
		}
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	{onclick}
	class="group relative cursor-pointer space-y-4 overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/20 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/40 hover:bg-slate-900/40 hover:shadow-xl hover:shadow-violet-950/10"
>
	<!-- Card Glow Highlight -->
	<div
		class="pointer-events-none absolute inset-0 bg-linear-to-br from-violet-600/0 via-transparent to-indigo-600/0 transition-colors duration-300 group-hover:from-violet-600/5 group-hover:to-indigo-600/5"
	></div>

	<!-- Top Row -->
	<div class="relative z-10 flex items-center justify-between">
		<span class="rounded-full border px-2.5 py-1 text-xs font-semibold {tagClasses} tracking-wide">
			{tag}
		</span>
		<span class="text-xs font-medium text-slate-500">
			{timeAgo}
		</span>
	</div>

	<!-- Title -->
	<h3
		class="relative z-10 line-clamp-1 text-base font-bold text-white transition-colors duration-300 group-hover:text-violet-400"
	>
		{title}
	</h3>

	<!-- Body Text -->
	<p class="relative z-10 line-clamp-3 text-sm leading-relaxed text-slate-400">
		{content}
	</p>
</div>
