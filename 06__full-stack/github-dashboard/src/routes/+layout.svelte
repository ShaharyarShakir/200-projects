<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import AppLayout from '$lib/components/layout/AppLayout.svelte';
	import { ModeWatcher } from 'mode-watcher';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>GitDash - GitHub Dashboard</title>
</svelte:head>

<ModeWatcher />

<AppLayout>
	{@render children()}
</AppLayout>
