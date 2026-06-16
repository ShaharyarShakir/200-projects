<script lang="ts">
	import '@drop-in/graffiti';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main class="layout-readable center">{@render children()}</main>
