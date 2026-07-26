<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { authClient } from '$lib/auth/client.js';
	import { goto, invalidateAll } from '$app/navigation';
	import Navbar from '../components/Navbar.svelte';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { queryClient } from '$lib/api.js';

	let { children, data } = $props();
	let user = $derived(data?.user);
	let loggingOut = $state(false);

	async function handleLogout() {
		loggingOut = true;
		try {
			await authClient.signOut();
			await goto('/login');
			await invalidateAll();
		} catch (error) {
			console.error('Logout failed:', error);
		} finally {
			loggingOut = false;
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<!-- Custom font styling -->
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap"
		rel="stylesheet"
	/>
	<style>
		body {
			font-family:
				'Outfit',
				-apple-system,
				BlinkMacSystemFont,
				'Segoe UI',
				Roboto,
				Oxygen,
				Ubuntu,
				Cantarell,
				'Open Sans',
				'Helvetica Neue',
				sans-serif;
		}
	</style>
</svelte:head>

<QueryClientProvider client={queryClient}>
	<div class="relative flex min-h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
		<!-- Navbar component -->
		<Navbar {user} {loggingOut} onlogout={handleLogout} />

		<!-- Main Content Area -->
		<main class="relative z-10 flex flex-grow flex-col">
			{@render children()}
		</main>
	</div>
</QueryClientProvider>

