<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		label,
		icon,
		children
	}: {
		label: string;
		icon?: Snippet;
		children?: Snippet;
	} = $props();
</script>

<div class="flex h-12 border-b border-white/5 bg-[#0b0d14]/60">
	<!-- Track Header Label -->
	<div class="w-44 flex-shrink-0 border-r border-white/10 px-3 flex items-center gap-2 bg-[#08090f] z-10 select-none">
		{#if icon}
			{@render icon()}
		{/if}
		<span class="text-xs font-semibold text-gray-300 tracking-wide uppercase font-mono">
			{label}
		</span>
	</div>

	<!-- Track Body Viewport -->
	<div class="relative flex-1 min-w-0 overflow-hidden">
		{#if children}
			{@render children()}
		{/if}
	</div>
</div>
