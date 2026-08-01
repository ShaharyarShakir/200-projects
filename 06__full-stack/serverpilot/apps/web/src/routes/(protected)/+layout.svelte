<script lang="ts">
	import { onMount } from 'svelte';
	import { fly, slide } from 'svelte/transition';
	import { authStore } from '$lib/auth.svelte';
	import { toast } from '$lib/toast.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { apiFetch } from '$lib/api';
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import {
		Server,
		LogOut,
		User,
		Search,
		Bell,
		Sun,
		Moon,
		Command,
		X,
		Check,
		Menu,
		Cpu,
		ArrowRight
	} from 'lucide-svelte';

	let { children } = $props();
	const queryClient = useQueryClient();

	// Svelte 5 state management
	let isSidebarOpen = $state(false);
	let isNotificationsOpen = $state(false);
	let isCommandPaletteOpen = $state(false);
	let commandQuery = $state('');
	let theme = $state<'dark' | 'light'>('dark');

	// Redirect if unauthenticated
	onMount(() => {
		if (!authStore.isAuthenticated) {
			goto('/login');
		}

		// Read and configure theme
		const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
		if (savedTheme) {
			theme = savedTheme;
		} else {
			theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
		}
		applyTheme();

		// Set up global shortcut (Cmd+K / Ctrl+K) for Command Palette
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				isCommandPaletteOpen = !isCommandPaletteOpen;
				if (isCommandPaletteOpen) {
					commandQuery = '';
				}
			}
			if (e.key === 'Escape') {
				isCommandPaletteOpen = false;
				isNotificationsOpen = false;
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	});

	// Theme management
	function applyTheme() {
		if (theme === 'dark') {
			document.documentElement.classList.add('dark');
			document.documentElement.style.colorScheme = 'dark';
		} else {
			document.documentElement.classList.remove('dark');
			document.documentElement.style.colorScheme = 'light';
		}
		localStorage.setItem('theme', theme);
	}

	function toggleTheme() {
		theme = theme === 'dark' ? 'light' : 'dark';
		applyTheme();
		toast.success(`Theme switched to ${theme} mode`);
	}

	// Fetch Notifications using TanStack Query
	const notificationsQuery = createQuery(() => ({
		queryKey: ['notifications'],
		queryFn: () => apiFetch<any[]>('/api/notifications'),
		refetchInterval: 15000 // Poll notifications every 15s
	}));

	// Fetch Servers list directly to feed into Command Palette
	const serversQuery = createQuery(() => ({
		queryKey: ['servers'],
		queryFn: () => apiFetch<any[]>('/api/servers')
	}));

	// Mark notifications as read mutation
	const markReadMutation = createMutation(() => ({
		mutationFn: () => apiFetch('/api/notifications/read', { method: 'POST' }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['notifications'] });
			toast.success('All alerts marked as read');
		}
	}));

	// Derived states
	const currentPath = $derived($page.url.pathname);
	const unreadCount = $derived(notificationsQuery.data?.filter((n) => !n.read).length || 0);

	// Command Palette options search
	const filteredCommands = $derived.by(() => {
		const q = commandQuery.toLowerCase().trim();
		const actions = [
			{
				name: 'Go to Dashboard',
				shortcut: 'G D',
				action: () => {
					goto('/dashboard');
					isCommandPaletteOpen = false;
				}
			},
			{
				name: 'Go to Servers',
				shortcut: 'G S',
				action: () => {
					goto('/servers');
					isCommandPaletteOpen = false;
				}
			},
			{
				name: 'Add New Server',
				shortcut: 'A S',
				action: () => {
					triggerAddServer();
					isCommandPaletteOpen = false;
				}
			},
			{
				name: 'Toggle Theme Mode',
				shortcut: 'T T',
				action: () => {
					toggleTheme();
					isCommandPaletteOpen = false;
				}
			},
			{
				name: 'Sign Out Account',
				shortcut: 'L O',
				action: () => {
					handleLogout();
					isCommandPaletteOpen = false;
				}
			}
		];

		const serverResults = (serversQuery.data || [])
			.filter((s) => s.name.toLowerCase().includes(q) || s.ip.includes(q))
			.map((s) => ({
				name: `Manage Server: ${s.name} (${s.ip})`,
				shortcut: s.status.toUpperCase(),
				action: () => {
					goto(`/servers?search=${s.name}`);
					isCommandPaletteOpen = false;
				}
			}));

		const all = [...actions, ...serverResults];
		if (!q) return all;
		return all.filter((item) => item.name.toLowerCase().includes(q));
	});

	function triggerAddServer() {
		// Custom dispatch or route query parameter to trigger creation modal
		goto('/servers?add=true');
	}

	async function handleLogout() {
		try {
			await authStore.logout();
			toast.success('Signed out successfully.');
			goto('/login');
		} catch (err: any) {
			toast.error('Sign out failed: ' + err.message);
		}
	}
</script>

{#if authStore.isAuthenticated}
	<div
		class="light:bg-zinc-50 light:text-zinc-900 flex h-screen overflow-hidden bg-zinc-950 font-sans text-zinc-100 transition-colors duration-200 dark:bg-zinc-950 dark:text-zinc-100"
	>
		<!-- SIDEBAR (Desktop) -->
		<aside
			class="light:border-zinc-200 light:bg-white hidden w-64 shrink-0 flex-col justify-between border-r border-zinc-800 bg-zinc-950/80 backdrop-blur-md md:flex dark:border-zinc-800 dark:bg-zinc-950/80"
		>
			<div>
				<!-- Logo -->
				<div
					class="light:border-zinc-200 flex h-16 items-center gap-3 border-b border-zinc-800 px-6 dark:border-zinc-800"
				>
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-md shadow-indigo-500/20"
					>
						<span class="text-sm font-black text-white">SP</span>
					</div>
					<span
						class="light:text-zinc-800 font-display text-lg font-extrabold tracking-tight text-zinc-100 dark:text-zinc-100"
					>
						ServerPilot
					</span>
				</div>

				<!-- Nav Links -->
				<nav class="flex flex-col gap-1 p-4">
					<a
						href="/dashboard"
						class="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 {currentPath ===
						'/dashboard'
							? 'border border-indigo-500/15 bg-indigo-600/10 text-indigo-400'
							: 'border border-transparent text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200'}"
					>
						<Cpu class="h-4 w-4" />
						Dashboard
					</a>
					<a
						href="/servers"
						class="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 {currentPath ===
						'/servers'
							? 'border border-indigo-500/15 bg-indigo-600/10 text-indigo-400'
							: 'border border-transparent text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200'}"
					>
						<Server class="h-4 w-4" />
						Servers
					</a>
				</nav>
			</div>

			<!-- User Section -->
			<div class="light:border-zinc-200 border-t border-zinc-800 p-4 dark:border-zinc-800">
				<div
					class="flex items-center justify-between gap-3 rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-2"
				>
					<div class="flex min-w-0 items-center gap-2.5">
						<div
							class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400"
						>
							<User class="h-4 w-4" />
						</div>
						<div class="flex min-w-0 flex-col">
							<span class="truncate text-xs font-bold text-zinc-300">Administrator</span>
							<span class="truncate text-[10px] text-zinc-500" title={authStore.user?.email}>
								{authStore.user?.email}
							</span>
						</div>
					</div>
					<button
						onclick={handleLogout}
						class="cursor-pointer rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800/60 hover:text-red-400"
						title="Sign Out"
					>
						<LogOut class="h-4 w-4" />
					</button>
				</div>
			</div>
		</aside>

		<!-- MOBILE HEADER & DRAWER -->
		{#if isSidebarOpen}
			<!-- Backdrop -->
			<button
				onclick={() => (isSidebarOpen = false)}
				class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
				aria-label="Close sidebar"
			></button>

			<!-- Drawer -->
			<div
				transition:fly={{ x: -260, duration: 250 }}
				class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-zinc-800 bg-zinc-950 p-4 md:hidden"
			>
				<div>
					<div class="mb-4 flex items-center justify-between border-b border-zinc-900 pb-4">
						<div class="flex items-center gap-3">
							<div
								class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500"
							>
								<span class="text-sm font-black text-white">SP</span>
							</div>
							<span class="font-display text-lg font-bold">ServerPilot</span>
						</div>
						<button
							onclick={() => (isSidebarOpen = false)}
							class="rounded-lg p-1.5 hover:bg-zinc-900"
						>
							<X class="h-5 w-5 text-zinc-400" />
						</button>
					</div>

					<nav class="flex flex-col gap-1">
						<a
							href="/dashboard"
							onclick={() => (isSidebarOpen = false)}
							class="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold {currentPath ===
							'/dashboard'
								? 'border border-indigo-500/15 bg-indigo-600/10 text-indigo-400'
								: 'text-zinc-400 hover:bg-zinc-900/40'}"
						>
							<Cpu class="h-4 w-4" />
							Dashboard
						</a>
						<a
							href="/servers"
							onclick={() => (isSidebarOpen = false)}
							class="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold {currentPath ===
							'/servers'
								? 'border border-indigo-500/15 bg-indigo-600/10 text-indigo-400'
								: 'text-zinc-400 hover:bg-zinc-900/40'}"
						>
							<Server class="h-4 w-4" />
							Servers
						</a>
					</nav>
				</div>

				<div class="flex flex-col gap-2 border-t border-zinc-900 pt-4">
					<div class="flex items-center gap-3 px-2">
						<User class="h-5 w-5 text-zinc-500" />
						<div class="min-w-0">
							<p class="truncate text-xs font-bold text-zinc-300">{authStore.user?.email}</p>
						</div>
					</div>
					<button
						onclick={handleLogout}
						class="flex w-full items-center justify-center gap-2 rounded-lg border border-red-900/40 bg-red-950/40 py-2 text-sm font-semibold text-red-200"
					>
						<LogOut class="h-4 w-4" />
						Sign Out
					</button>
				</div>
			</div>
		{/if}

		<!-- WORKSPACE AREA -->
		<div class="flex flex-1 flex-col overflow-hidden">
			<!-- TOP NAVBAR -->
			<header
				class="light:border-zinc-200 light:bg-white/70 flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950/40 px-4 backdrop-blur-md md:px-8 dark:border-zinc-800 dark:bg-zinc-950/40"
			>
				<!-- Left items: hamburger & route breadcrumbs -->
				<div class="flex items-center gap-4">
					<button
						onclick={() => (isSidebarOpen = true)}
						class="rounded-lg p-1.5 hover:bg-zinc-900 md:hidden"
						aria-label="Open navigation"
					>
						<Menu class="h-5 w-5 text-zinc-400" />
					</button>

					<div class="hidden items-center gap-2 text-xs font-semibold text-zinc-400 sm:flex">
						<span class="hover:text-zinc-200">ServerPilot</span>
						<span class="text-zinc-600">/</span>
						<span class="text-indigo-400 capitalize"
							>{currentPath.replace('/', '') || 'overview'}</span
						>
					</div>
				</div>

				<!-- Right items: shortcuts, searches, bells, themes, logs -->
				<div class="flex items-center gap-2 sm:gap-3">
					<!-- Command search launcher button -->
					<button
						onclick={() => {
							isCommandPaletteOpen = true;
							commandQuery = '';
						}}
						class="flex items-center gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/30 px-3 py-1.5 text-xs text-zinc-400 transition-all hover:border-zinc-700 hover:bg-zinc-900/60 hover:text-zinc-200"
					>
						<Search class="h-3.5 w-3.5" />
						<span class="hidden sm:inline">Search console...</span>
						<kbd
							class="hidden h-4 items-center gap-0.5 rounded border border-zinc-800 bg-zinc-950 px-1.5 font-mono text-[9px] font-bold text-zinc-500 md:inline-flex"
						>
							⌘K
						</kbd>
					</button>

					<!-- Theme Switcher -->
					<button
						onclick={toggleTheme}
						class="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-900/50 hover:text-zinc-200"
						title="Switch Theme"
					>
						{#if theme === 'dark'}
							<Sun class="h-4 w-4 text-amber-400" />
						{:else}
							<Moon class="h-4 w-4 text-zinc-500" />
						{/if}
					</button>

					<!-- Notifications dropdown activator -->
					<div class="relative">
						<button
							onclick={() => {
								isNotificationsOpen = !isNotificationsOpen;
							}}
							class="relative rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-900/50 hover:text-zinc-200"
							title="View Alerts"
						>
							<Bell class="h-4 w-4" />
							{#if unreadCount > 0}
								<span class="absolute top-1 right-1 flex h-2 w-2">
									<span
										class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"
									></span>
									<span class="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
								</span>
							{/if}
						</button>

						<!-- NOTIFICATIONS POPOVER -->
						{#if isNotificationsOpen}
							<button
								onclick={() => (isNotificationsOpen = false)}
								class="fixed inset-0 z-30 cursor-default"
								aria-label="Dismiss notifications"
							></button>
							<div
								transition:slide={{ duration: 150 }}
								class="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-zinc-800 bg-zinc-950 p-1 shadow-2xl"
							>
								<div class="flex items-center justify-between border-b border-zinc-900 px-4 py-2.5">
									<span class="text-xs font-extrabold text-zinc-200">System Notifications</span>
									{#if unreadCount > 0}
										<button
											onclick={() => markReadMutation.mutate()}
											class="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline"
										>
											Clear all
										</button>
									{/if}
								</div>

								<div class="max-h-64 divide-y divide-zinc-900 overflow-y-auto">
									{#if notificationsQuery.isPending}
										<div class="flex items-center justify-center py-6 text-xs text-zinc-500">
											Loading notifications...
										</div>
									{:else if !notificationsQuery.data || notificationsQuery.data.length === 0}
										<div
											class="flex flex-col items-center justify-center py-8 text-center text-zinc-500"
										>
											<Check class="mb-1 h-6 w-6 text-zinc-600" />
											<p class="text-xs">All clear! No alerts</p>
										</div>
									{:else}
										{#each notificationsQuery.data as notif (notif.id)}
											<div
												class="flex flex-col p-3 transition-colors hover:bg-zinc-900/40 {!notif.read
													? 'bg-indigo-600/5'
													: ''}"
											>
												<div class="flex items-start justify-between gap-2">
													<span class="text-xs font-semibold text-zinc-200">{notif.title}</span>
													<span class="text-[9px] text-zinc-500">
														{new Date(notif.created_at).toLocaleTimeString([], {
															hour: '2-digit',
															minute: '2-digit'
														})}
													</span>
												</div>
												<p class="mt-1 text-xs text-zinc-400">{notif.message}</p>
												<div class="mt-1.5 flex items-center gap-1.5">
													<span
														class="h-1.5 w-1.5 rounded-full {notif.type === 'error'
															? 'bg-red-500'
															: notif.type === 'warning'
																? 'bg-amber-400'
																: 'bg-green-400'}"
													></span>
													<span class="text-[9px] font-bold tracking-wider text-zinc-500 uppercase"
														>{notif.type}</span
													>
												</div>
											</div>
										{/each}
									{/if}
								</div>
							</div>
						{/if}
					</div>
				</div>
			</header>

			<!-- CORE CONTENT ROUTING AREA -->
			<main class="flex-1 overflow-y-auto bg-zinc-950/20">
				{@render children()}
			</main>
		</div>
	</div>

	<!-- COMMAND PALETTE OVERLAY -->
	{#if isCommandPaletteOpen}
		<!-- Backdrop -->
		<button
			onclick={() => (isCommandPaletteOpen = false)}
			class="fixed inset-0 z-[9998] bg-black/75 backdrop-blur-sm"
			aria-label="Close command palette"
		></button>

		<!-- Dialog Modal -->
		<div
			transition:fly={{ y: -40, duration: 180 }}
			class="fixed top-[20%] left-1/2 z-[9999] w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
		>
			<div class="flex items-center border-b border-zinc-900 px-4 py-3.5">
				<Search class="mr-3 h-4.5 w-4.5 text-zinc-500" />
				<input
					type="text"
					bind:value={commandQuery}
					placeholder="Type a command or server name..."
					class="w-full border-none bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none"
					autoFocus
				/>
				<kbd
					class="border-zinc-850 flex h-5 shrink-0 items-center rounded border bg-zinc-900 px-1.5 font-mono text-[9px] font-bold text-zinc-500 select-none"
				>
					ESC
				</kbd>
			</div>

			<!-- Search Results -->
			<div class="max-h-72 overflow-y-auto p-2">
				<div class="px-3 py-1.5 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
					Suggestions & Commands
				</div>
				<div class="mt-1 flex flex-col gap-0.5">
					{#each filteredCommands as item (item.name)}
						<button
							onclick={item.action}
							class="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-zinc-300 transition-all hover:bg-indigo-600 hover:text-white"
						>
							<div class="flex items-center gap-2.5">
								<Command class="h-3.5 w-3.5 text-zinc-500 group-hover:text-white" />
								<span>{item.name}</span>
							</div>
							<span
								class="rounded bg-zinc-900 px-2 py-0.5 font-mono text-[9px] font-semibold text-zinc-400 group-hover:bg-indigo-700 group-hover:text-white"
							>
								{item.shortcut}
							</span>
						</button>
					{:else}
						<div class="py-6 text-center text-xs text-zinc-500">No matching actions found.</div>
					{/each}
				</div>
			</div>

			<div
				class="flex items-center justify-between border-t border-zinc-900 bg-zinc-900/10 px-4 py-2.5 text-[10px] text-zinc-500"
			>
				<span class="flex items-center gap-1"><Command class="h-3 w-3" /> Navigation shortcuts</span
				>
				<span class="flex items-center gap-1"
					>↑↓ Navigate <ArrowRight class="h-2.5 w-2.5" /> Enter to select</span
				>
			</div>
		</div>
	{/if}
{/if}
