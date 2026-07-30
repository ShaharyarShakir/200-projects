<script lang="ts">
	import { toasts } from '$lib/stores/toast';
	import { X, CheckCircle2, ShieldAlert, Info } from 'lucide-svelte';
	import { flip } from 'svelte/animate';
	import { fade, fly } from 'svelte/transition';
</script>

<div
	class="pointer-events-none fixed right-6 bottom-6 z-50 flex w-full max-w-sm flex-col gap-3 select-none"
>
	{#each $toasts as toast (toast.id)}
		<div
			animate:flip={{ duration: 250 }}
			in:fly={{ y: 20, opacity: 0, duration: 300 }}
			out:fade={{ duration: 200 }}
			class="bg-card text-card-foreground border-border pointer-events-auto flex items-start justify-between gap-3 rounded-xl border p-4 shadow-lg"
		>
			<div class="flex items-start gap-2.5">
				{#if toast.type === 'success'}
					<CheckCircle2 class="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
				{:else if toast.type === 'error'}
					<ShieldAlert class="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
				{:else}
					<Info class="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
				{/if}

				<div class="flex flex-col gap-0.5">
					<span class="text-xs leading-none font-semibold capitalize">{toast.type}</span>
					<p class="text-muted-foreground mt-1 pr-2 text-xs leading-normal">{toast.message}</p>
				</div>
			</div>

			<button
				onclick={() => toasts.remove(toast.id)}
				class="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg border border-transparent p-0.5 transition"
				aria-label="Close Toast"
			>
				<X class="h-3.5 w-3.5" />
			</button>
		</div>
	{/each}
</div>
