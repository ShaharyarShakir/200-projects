<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';

	let { children } = $props();

	// Check if this route should use the centered card-based styling
	let isCenteredRoute = $derived(
		['/login', '/register'].includes($page.url.pathname)
	);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if isCenteredRoute}
	<div class="flex min-h-screen flex-col items-center justify-center p-4">
		{@render children()}
	</div>
{:else}
	<div class="flex min-h-screen flex-col bg-slate-950 text-slate-100 antialiased">
		{@render children()}
	</div>
{/if}
