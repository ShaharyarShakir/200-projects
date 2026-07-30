<script lang="ts">
	import type { Snippet } from 'svelte';
	import Sidebar from './Sidebar.svelte';
	import Navbar from './Navbar.svelte';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { page } from '$app/stores';

	let { children } = $props<{ children: Snippet }>();
	let isMobileMenuOpen = $state(false);

	// Check if the current route is one of the dashboard application paths
	const isAppRoute = $derived(
		[
			'/dashboard',
			'/repositories',
			'/issues',
			'/pull-requests',
			'/analytics',
			'/profile',
			'/settings'
		].some((route) => $page.url.pathname === route || $page.url.pathname.startsWith(route + '/'))
	);
</script>

{#if isAppRoute}
	<div class="bg-background text-foreground flex min-h-screen flex-col">
		<!-- Desktop Sidebar (Hidden on mobile) -->
		<Sidebar class="fixed inset-y-0 left-0 z-30 hidden lg:flex" />

		<!-- Mobile Sidebar Drawer -->
		<Sheet.Root bind:open={isMobileMenuOpen}>
			<Sheet.Content side="left" class="w-64 border-r-0 p-0">
				<Sidebar class="h-full border-r-0" />
			</Sheet.Content>
		</Sheet.Root>

		<!-- Main Content Wrapper (shifted left on desktop to accommodate Sidebar) -->
		<div class="flex min-w-0 flex-1 flex-col transition-all duration-300 lg:pl-64">
			<Navbar onMenuClick={() => (isMobileMenuOpen = true)} />

			<main class="animate-fade-in mx-auto w-full max-w-7xl flex-1 p-6 md:p-8">
				{@render children()}
			</main>
		</div>
	</div>
{:else}
	<div class="bg-background text-foreground flex min-h-screen flex-col">
		<main class="flex-1">
			{@render children()}
		</main>
	</div>
{/if}

<style>
	:global(.animate-fade-in) {
		animation: fadeIn 0.3s ease-out forwards;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
