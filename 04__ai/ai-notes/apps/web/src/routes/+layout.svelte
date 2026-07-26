<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { authClient } from "$lib/auth/client.js";
	import { goto } from "$app/navigation";

	let { children, data } = $props();
	let user = $derived(data?.user);
	let loggingOut = $state(false);

	async function handleLogout() {
		loggingOut = true;
		try {
			await authClient.signOut();
			await goto("/login");
		} catch (error) {
			console.error("Logout failed:", error);
		} finally {
			loggingOut = false;
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<!-- Custom font styling -->
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
	<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
	<style>
		body {
			font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
		}
	</style>
</svelte:head>

<div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
	<!-- Glassmorphic Navbar -->
	<nav class="bg-slate-950/60 backdrop-blur-md border-b border-slate-900 sticky top-0 z-50 px-6 py-4">
		<div class="max-w-6xl mx-auto flex items-center justify-between">
			<!-- Logo -->
			<a href={user ? "/dashboard" : "/"} class="flex items-center gap-2 group">
				<span class="text-xl font-bold tracking-tight text-white bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent group-hover:from-violet-300 group-hover:to-indigo-300 transition duration-200">
					🧠 AI Notes
				</span>
			</a>

			<!-- Auth Actions / Nav links -->
			<div class="flex items-center gap-4">
				{#if user}
					<a href="/dashboard" class="text-sm font-medium text-slate-300 hover:text-white transition duration-200">Dashboard</a>
					<div class="h-4 w-px bg-slate-800"></div>
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
							{user.name.charAt(0).toUpperCase()}
						</div>
						<span class="hidden sm:inline text-sm text-slate-300 font-medium">{user.name}</span>
						<button 
							onclick={handleLogout}
							disabled={loggingOut}
							class="text-xs font-semibold text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-md transition duration-200 cursor-pointer"
						>
							Logout
						</button>
					</div>
				{:else}
					<a href="/login" class="text-sm font-medium text-slate-300 hover:text-white transition duration-200">Sign In</a>
					<a 
						href="/register" 
						class="text-sm font-medium bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-violet-950/20 active:scale-[0.98] transition-all duration-200"
					>
						Register
					</a>
				{/if}
			</div>
		</div>
	</nav>

	<!-- Main Content Area -->
	<main class="flex-grow flex flex-col">
		{@render children()}
	</main>
</div>
