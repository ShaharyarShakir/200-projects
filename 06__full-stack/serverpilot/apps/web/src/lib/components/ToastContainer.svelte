<script lang="ts">
	import { toast } from '../toast.svelte';
	import { X, CheckCircle2, AlertCircle, Info } from 'lucide-svelte';
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
</script>

<div
	class="pointer-events-none fixed right-5 bottom-5 z-50 flex w-[calc(100%-2.5rem)] max-w-md flex-col gap-3"
>
	{#each toast.toasts as t (t.id)}
		<div
			transition:fly={{ x: 200, duration: 250 }}
			animate:flip={{ duration: 200 }}
			class="pointer-events-auto flex items-start gap-3.5 rounded-xl border glass-panel p-4 shadow-2xl transition-all
			{t.type === 'success' ? 'border-green-550/30 bg-green-950/25 text-green-200' : ''}
			{t.type === 'error' ? 'border-red-550/30 bg-red-950/25 text-red-200' : ''}
			{t.type === 'info' ? 'border-indigo-550/30 bg-indigo-950/25 text-indigo-200' : ''}"
		>
			<div class="mt-0.5 shrink-0">
				{#if t.type === 'success'}
					<CheckCircle2 class="h-5 w-5 text-green-400" />
				{:else if t.type === 'error'}
					<AlertCircle class="h-5 w-5 text-red-400" />
				{:else}
					<Info class="h-5 w-5 text-indigo-400" />
				{/if}
			</div>

			<div class="flex-1 text-sm leading-5 font-medium">
				{t.message}
			</div>

			<button
				onclick={() => toast.dismiss(t.id)}
				class="shrink-0 cursor-pointer text-zinc-400 transition-colors hover:text-zinc-200"
				aria-label="Dismiss notification"
			>
				<X class="h-4 w-4" />
			</button>
		</div>
	{/each}
</div>
