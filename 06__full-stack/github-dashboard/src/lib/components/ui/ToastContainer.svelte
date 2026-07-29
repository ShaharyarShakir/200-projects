<script lang="ts">
	import { toasts } from '$lib/stores/toast';
	import { X, CheckCircle2, ShieldAlert, Info } from 'lucide-svelte';
	import { flip } from 'svelte/animate';
	import { fade, fly } from 'svelte/transition';
</script>

<div class="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none select-none">
	{#each $toasts as toast (toast.id)}
		<div
			animate:flip={{ duration: 250 }}
			in:fly={{ y: 20, opacity: 0, duration: 300 }}
			out:fade={{ duration: 200 }}
			class="flex items-start justify-between gap-3 p-4 rounded-xl border bg-card text-card-foreground shadow-lg pointer-events-auto border-border"
		>
			<div class="flex gap-2.5 items-start">
				{#if toast.type === 'success'}
					<CheckCircle2 class="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
				{:else if toast.type === 'error'}
					<ShieldAlert class="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
				{:else}
					<Info class="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
				{/if}
				
				<div class="flex flex-col gap-0.5">
					<span class="text-xs font-semibold leading-none capitalize">{toast.type}</span>
					<p class="text-xs text-muted-foreground leading-normal mt-1 pr-2">{toast.message}</p>
				</div>
			</div>
			
			<button
				onclick={() => toasts.remove(toast.id)}
				class="text-muted-foreground hover:text-foreground transition p-0.5 rounded-lg border border-transparent hover:bg-muted"
				aria-label="Close Toast"
			>
				<X class="w-3.5 h-3.5" />
			</button>
		</div>
	{/each}
</div>
