<script lang="ts">
	import { page } from '$app/stores';
	import { navigation } from '$lib/constants/navigation';
	import { Menu, Sun, Moon, LogOut, User, Settings } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { toggleMode } from 'mode-watcher';

	let { onMenuClick } = $props<{ onMenuClick?: () => void }>();

	// Svelte 5 reactive derivation for the title based on the active path
	const activeTitle = $derived(
		navigation.find(nav => 
			nav.href === $page.url.pathname || 
			(nav.href !== '/dashboard' && $page.url.pathname.startsWith(nav.href))
		)?.title ?? 'GitHub Dashboard'
	);
</script>

<header class="flex items-center justify-between h-16 px-6 border-b border-border bg-card text-card-foreground shadow-sm sticky top-0 z-40 select-none">
	<div class="flex items-center gap-4">
		<!-- Mobile Menu Trigger -->
		<Button variant="ghost" size="icon" class="lg:hidden" onclick={onMenuClick} aria-label="Toggle Menu">
			<Menu class="w-5 h-5" />
		</Button>
		
		<!-- Dynamic Title -->
		<h1 class="text-lg font-semibold tracking-tight text-foreground transition-all duration-200">
			{activeTitle}
		</h1>
	</div>

	<div class="flex items-center gap-3">
		<!-- Theme Toggle Button -->
		<Button variant="ghost" size="icon" onclick={toggleMode} class="rounded-full w-9 h-9 transition-colors relative" aria-label="Toggle Theme">
			<Sun class="w-5 h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
			<Moon class="absolute w-5 h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
		</Button>

		<!-- User Dropdown Menu -->
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button 
						{...props}
						variant="ghost" 
						class="relative w-8 h-8 rounded-full p-0 border border-border overflow-hidden hover:opacity-95 transition" 
						aria-label="User Menu"
					>
						<Avatar.Root class="w-8 h-8">
							<Avatar.Fallback class="bg-gradient-to-tr from-blue-600 to-purple-600 text-white font-semibold text-xs">G</Avatar.Fallback>
						</Avatar.Root>
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" class="w-56 mt-1 border border-border bg-card shadow-lg rounded-xl p-1.5">
				<DropdownMenu.Label class="px-2 py-1.5 text-xs font-semibold text-muted-foreground">My Account</DropdownMenu.Label>
				<DropdownMenu.Separator class="my-1 border-t border-border" />
				<DropdownMenu.Item class="rounded-md">
					<a href="/profile" class="flex w-full items-center gap-2.5 px-2 py-1.5 text-sm hover:bg-muted rounded-md transition duration-150">
						<User class="w-4 h-4 text-muted-foreground" />
						<span>Profile</span>
					</a>
				</DropdownMenu.Item>
				<DropdownMenu.Item class="rounded-md">
					<a href="/settings" class="flex w-full items-center gap-2.5 px-2 py-1.5 text-sm hover:bg-muted rounded-md transition duration-150">
						<Settings class="w-4 h-4 text-muted-foreground" />
						<span>Settings</span>
					</a>
				</DropdownMenu.Item>
				<DropdownMenu.Separator class="my-1 border-t border-border" />
				<DropdownMenu.Item class="rounded-md">
					<button onclick={() => console.log('Sign Out clicked')} class="flex w-full items-center gap-2.5 px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded-md transition duration-150 font-medium w-full text-left">
						<LogOut class="w-4 h-4" />
						<span>Log out</span>
					</button>
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</header>
