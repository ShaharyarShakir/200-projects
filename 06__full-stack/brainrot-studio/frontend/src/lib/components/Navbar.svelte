<script lang="ts">
	import { auth } from '$lib/state/auth.svelte';
	import NavBrand from './nav/NavBrand.svelte';
	import NavDropdownCreate from './nav/NavDropdownCreate.svelte';
	import NavDropdownStudios from './nav/NavDropdownStudios.svelte';
	import NavDropdownTools from './nav/NavDropdownTools.svelte';
	import NavDropdownAssets from './nav/NavDropdownAssets.svelte';
	import NavUserMenu from './nav/NavUserMenu.svelte';
	import { Menu, X } from 'lucide-svelte';

	let {
		onOpenCreateModal = () => {}
	}: {
		onOpenCreateModal?: () => void;
	} = $props();

	// Dropdown Open States
	let activeDropdown = $state<'create' | 'studios' | 'tools' | 'assets' | null>(null);
	let isMobileMenuOpen = $state(false);

	function toggleDropdown(menu: 'create' | 'studios' | 'tools' | 'assets') {
		activeDropdown = activeDropdown === menu ? null : menu;
	}

	function closeDropdowns() {
		activeDropdown = null;
	}
</script>

<svelte:window onclick={(e) => {
	const target = e.target as HTMLElement;
	if (!target.closest('nav')) {
		closeDropdowns();
	}
}} />

<header class="sticky top-0 z-40 w-full border-b border-white/10 bg-[#08090d]/80 backdrop-blur-xl transition-all">
	<div class="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-8">
		
		<!-- Brand Logo -->
		<NavBrand />

		<!-- Desktop Navigation Menu -->
		{#if auth.user}
			<nav class="hidden lg:flex items-center gap-1 text-xs font-semibold text-gray-300">
				<a href="/app" class="px-3.5 py-1.5 rounded-xl hover:bg-white/5 hover:text-emerald-400 transition-colors">
					Home
				</a>

				<NavDropdownCreate
					isOpen={activeDropdown === 'create'}
					onToggle={() => toggleDropdown('create')}
					onClose={closeDropdowns}
				/>

				<NavDropdownStudios
					isOpen={activeDropdown === 'studios'}
					onToggle={() => toggleDropdown('studios')}
					onClose={closeDropdowns}
				/>

				<NavDropdownTools
					isOpen={activeDropdown === 'tools'}
					onToggle={() => toggleDropdown('tools')}
					onClose={closeDropdowns}
				/>

				<a href="/app" class="px-3.5 py-1.5 rounded-xl hover:bg-white/5 hover:text-emerald-400 transition-colors">
					Creations
				</a>

				<NavDropdownAssets
					isOpen={activeDropdown === 'assets'}
					onToggle={() => toggleDropdown('assets')}
					onClose={closeDropdowns}
				/>
			</nav>
		{/if}

		<!-- Right Side User Actions -->
		{#if auth.user}
			<NavUserMenu {onOpenCreateModal} />
		{:else}
			<div class="flex items-center gap-3">
				<a href="/login" class="text-xs font-semibold text-gray-300 hover:text-white px-3 py-2">
					Sign In
				</a>
				<a href="/login" class="btn-emerald text-xs px-4 py-2 rounded-xl font-bold">
					Get Started
				</a>
			</div>
		{/if}

		<!-- Mobile Menu Button -->
		<button
			onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
			class="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5"
			aria-label="Toggle mobile menu"
		>
			{#if isMobileMenuOpen}
				<X class="h-6 w-6" />
			{:else}
				<Menu class="h-6 w-6" />
			{/if}
		</button>
	</div>
</header>
