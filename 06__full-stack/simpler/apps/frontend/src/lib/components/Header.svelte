<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';

	let isMobileMenuOpen = $state(false);

	async function handleLogout() {
		await auth.logout();
		goto('/login');
	}
</script>

<header
	class="sticky top-0 z-50 w-full border-b border-slate-800/60 bg-slate-950/75 backdrop-blur-md transition-all duration-300"
>
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between">
			<!-- Logo -->
			<div class="flex items-center">
				<a href="/" class="flex items-center gap-2.5 transition-opacity hover:opacity-90">
					<div
						class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25"
					>
						<!-- Minimal checkmark + document icon -->
						<svg
							class="h-5 w-5 text-white"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2.5"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
							/>
						</svg>
					</div>
					<span class="text-xl font-bold tracking-tight text-white">Simpler</span>
				</a>
			</div>

			<!-- Desktop Nav links -->
			<nav class="hidden items-center gap-8 md:flex">
				<a
					href="#features"
					class="text-sm font-medium text-slate-400 transition-colors duration-150 hover:text-white"
					>Features</a
				>
				<a
					href="#pricing"
					class="text-sm font-medium text-slate-400 transition-colors duration-150 hover:text-white"
					>Pricing</a
				>
				<a
					href="https://github.com"
					target="_blank"
					rel="noopener noreferrer"
					class="text-sm font-medium text-slate-400 transition-colors duration-150 hover:text-white"
					>Documentation</a
				>
			</nav>

			<!-- Authentication / Action items -->
			<div class="hidden items-center gap-4 md:flex">
				{#if auth.isAuthenticated}
					<a
						href="/dashboard"
						class="text-sm font-medium text-slate-300 transition-colors duration-150 hover:text-white"
					>
						Go to Dashboard
					</a>
					<button
						onclick={handleLogout}
						class="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-300 transition-all hover:bg-slate-800 hover:text-white focus:ring-2 focus:ring-slate-700 focus:outline-none"
					>
						Sign Out
					</button>
				{:else}
					<a
						href="/login"
						class="text-sm font-medium text-slate-400 transition-colors duration-150 hover:text-white"
					>
						Sign In
					</a>
					<a
						href="/register"
						class="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-600/35 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none active:scale-[0.98]"
					>
						Get Started
					</a>
				{/if}
			</div>

			<!-- Mobile Menu Button -->
			<div class="flex md:hidden">
				<button
					onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
					type="button"
					class="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white focus:ring-2 focus:ring-slate-700 focus:outline-none"
					aria-controls="mobile-menu"
					aria-expanded={isMobileMenuOpen}
				>
					<span class="sr-only">Open main menu</span>
					{#if !isMobileMenuOpen}
						<svg
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
							/>
						</svg>
					{:else}
						<svg
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					{/if}
				</button>
			</div>
		</div>
	</div>

	<!-- Mobile Menu Panel -->
	{#if isMobileMenuOpen}
		<div
			class="border-b border-slate-800/80 bg-slate-950 px-4 pt-2 pb-4 md:hidden"
			id="mobile-menu"
		>
			<div class="space-y-1.5">
				<a
					href="#features"
					onclick={() => (isMobileMenuOpen = false)}
					class="block rounded-lg px-3 py-2 text-base font-medium text-slate-300 hover:bg-slate-900 hover:text-white"
					>Features</a
				>
				<a
					href="#pricing"
					onclick={() => (isMobileMenuOpen = false)}
					class="block rounded-lg px-3 py-2 text-base font-medium text-slate-300 hover:bg-slate-900 hover:text-white"
					>Pricing</a
				>
				<a
					href="https://github.com"
					target="_blank"
					rel="noopener noreferrer"
					onclick={() => (isMobileMenuOpen = false)}
					class="block rounded-lg px-3 py-2 text-base font-medium text-slate-300 hover:bg-slate-900 hover:text-white"
					>Documentation</a
				>
			</div>
			<div class="mt-4 flex flex-col gap-3 border-t border-slate-800/80 pt-4">
				{#if auth.isAuthenticated}
					<a
						href="/dashboard"
						onclick={() => (isMobileMenuOpen = false)}
						class="w-full rounded-lg px-3 py-2 text-center text-base font-medium text-slate-300 hover:bg-slate-900 hover:text-white"
					>
						Go to Dashboard
					</a>
					<button
						onclick={() => {
							isMobileMenuOpen = false;
							handleLogout();
						}}
						class="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 text-center text-base font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
					>
						Sign Out
					</button>
				{:else}
					<a
						href="/login"
						onclick={() => (isMobileMenuOpen = false)}
						class="w-full rounded-lg py-2 text-center text-base font-medium text-slate-300 hover:bg-slate-900 hover:text-white"
					>
						Sign In
					</a>
					<a
						href="/register"
						onclick={() => (isMobileMenuOpen = false)}
						class="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 text-center text-base font-semibold text-white shadow-md shadow-indigo-600/10 hover:from-indigo-500 hover:to-purple-500"
					>
						Get Started
					</a>
				{/if}
			</div>
		</div>
	{/if}
</header>
