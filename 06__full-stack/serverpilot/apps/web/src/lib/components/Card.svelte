<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		header,
		footer,
		title = '',
		description = '',
		class: className = ''
	} = $props<{
		children: Snippet;
		header?: Snippet;
		footer?: Snippet;
		title?: string;
		description?: string;
		class?: string;
	}>();
</script>

<div class="overflow-hidden rounded-2xl glass-panel shadow-2xl shadow-black/40 {className}">
	{#if header || title || description}
		<div class="border-zinc-850 border-b px-6 py-5">
			{#if header}
				{@render header()}
			{:else}
				{#if title}
					<h3 class="text-zinc-150 font-display text-lg font-bold">{title}</h3>
				{/if}
				{#if description}
					<p class="mt-1 text-xs text-zinc-400">{description}</p>
				{/if}
			{/if}
		</div>
	{/if}

	<div class="px-6 py-5">
		{@render children()}
	</div>

	{#if footer}
		<div class="border-zinc-850 border-t bg-zinc-950/40 px-6 py-4">
			{@render footer()}
		</div>
	{/if}
</div>
