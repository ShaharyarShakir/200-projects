<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		icon?: Snippet;
		children?: Snippet;
		class?: string;
	}

	let { title, icon, children, class: customClass = '' }: Props = $props();
</script>

<div
	class="glass-panel-glow group relative flex flex-col justify-between overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 {customClass}"
>
	<!-- Top glowing bar -->
	<div
		class="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-violet-500/50 via-indigo-500/50 to-fuchsia-500/50 opacity-50 transition-opacity duration-300 group-hover:opacity-100"
	></div>

	<!-- Header -->
	<div class="mb-4 flex items-center gap-2">
		{#if icon}
			<div class="text-violet-400">
				{@render icon()}
			</div>
		{/if}
		<h3 class="text-lg font-bold tracking-wide text-white">
			{title}
		</h3>
	</div>

	<!-- Content -->
	<div class="flex-grow">
		{#if children}
			{@render children()}
		{/if}
	</div>
</div>
