<script lang="ts">
	import './layout.css';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/auth.svelte';
	import ToastContainer from '$lib/components/ToastContainer.svelte';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';

	let { children } = $props();

	// Initialize TanStack Query Client
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				refetchOnWindowFocus: false,
				retry: false
			}
		}
	});

	onMount(async () => {
		await authStore.init();
	});
</script>

<QueryClientProvider client={queryClient}>
	{#if authStore.loading}
		<!-- Premium glassmorphic startup screen -->
		<div class="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-5 bg-zinc-950">
			<div class="relative flex items-center justify-center">
				<div
					class="h-16 w-16 animate-spin rounded-full border-2 border-indigo-500/10 border-t-indigo-500"
				></div>
				<div class="absolute font-display text-xs font-bold tracking-wider text-indigo-400">SP</div>
			</div>
			<div
				class="animate-pulse font-display text-xs font-bold tracking-widest text-zinc-400 uppercase"
			>
				Initializing ServerPilot...
			</div>
		</div>
	{:else}
		{@render children()}
	{/if}

	<ToastContainer />
</QueryClientProvider>
