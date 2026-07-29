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
		['/dashboard', '/repositories', '/issues', '/pull-requests', '/analytics', '/profile', '/settings'].some(
			(route) => $page.url.pathname === route || $page.url.pathname.startsWith(route + '/')
		)
	);
</script>

{#if isAppRoute}
	<div class="min-h-screen bg-background text-foreground flex flex-col">
		<!-- Desktop Sidebar (Hidden on mobile) -->
		<Sidebar class="fixed inset-y-0 left-0 z-30 hidden lg:flex" />

		<!-- Mobile Sidebar Drawer -->
		<Sheet.Root bind:open={isMobileMenuOpen}>
			<Sheet.Content side="left" class="p-0 w-64 border-r-0">
				<Sidebar class="h-full border-r-0" />
			</Sheet.Content>
		</Sheet.Root>

		<!-- Main Content Wrapper (shifted left on desktop to accommodate Sidebar) -->
		<div class="flex-1 flex flex-col lg:pl-64 min-w-0 transition-all duration-300">
			<Navbar onMenuClick={() => (isMobileMenuOpen = true)} />
			
			<main class="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
				{@render children()}
			</main>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-background text-foreground flex flex-col">
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
