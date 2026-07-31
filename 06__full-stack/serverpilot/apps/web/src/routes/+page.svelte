<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/auth.svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		if (authStore.isAuthenticated) {
			goto('/dashboard');
		} else {
			goto('/login');
		}
	});
</script>

<svelte:head>
	<title>ServerPilot</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-zinc-950">
	<div
		class="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500/10 border-t-indigo-500"
	></div>
</div>
