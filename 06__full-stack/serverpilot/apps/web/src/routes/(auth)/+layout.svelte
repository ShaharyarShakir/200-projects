<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/auth.svelte';
	import { goto } from '$app/navigation';

	let { children } = $props();

	onMount(() => {
		if (authStore.isAuthenticated) {
			goto('/dashboard');
		}
	});
</script>

{#if !authStore.isAuthenticated}
	{@render children()}
{/if}
