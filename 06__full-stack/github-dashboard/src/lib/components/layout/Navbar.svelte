<script lang="ts">
	import { page } from '$app/stores';
	import { navigation } from '$lib/constants/navigation';
	import { Menu, Sun, Moon, LogOut, User, Settings } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { toggleMode } from 'mode-watcher';
	import { authClient } from '$lib/auth-client';

	let { onMenuClick } = $props<{ onMenuClick?: () => void }>();

	// Svelte 5 reactive derivation for the title based on the active path
	const activeTitle = $derived(
		navigation.find(
			(nav) =>
				nav.href === $page.url.pathname ||
				(nav.href !== '/dashboard' && $page.url.pathname.startsWith(nav.href))
		)?.title ?? 'GitHub Dashboard'
	);

	// Handle client-side log out using Better Auth client
	async function handleSignOut() {
		try {
			await authClient.signOut({
				fetchOptions: {
					onSuccess: () => {
						window.location.href = '/';
					}
				}
			});
		} catch (error) {
			console.error('Logout failed:', error);
		}
	}
</script>

<header
	class="border-border bg-card text-card-foreground sticky top-0 z-40 flex h-16 items-center justify-between border-b px-6 shadow-sm select-none"
>
	<div class="flex items-center gap-4">
		<!-- Mobile Menu Trigger -->
		<Button
			variant="ghost"
			size="icon"
			class="lg:hidden"
			onclick={onMenuClick}
			aria-label="Toggle Menu"
		>
			<Menu class="h-5 w-5" />
		</Button>

		<!-- Dynamic Title -->
		<h1 class="text-foreground text-lg font-semibold tracking-tight transition-all duration-200">
			{activeTitle}
		</h1>
	</div>

	<div class="flex items-center gap-3">
		<!-- Theme Toggle Button -->
		<Button
			variant="ghost"
			size="icon"
			onclick={toggleMode}
			class="relative h-9 w-9 rounded-full transition-colors"
			aria-label="Toggle Theme"
		>
			<Sun class="h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
			<Moon
				class="absolute h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
			/>
		</Button>

		{#if $page.data.user}
			<!-- User Dropdown Menu for Authenticated Users -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="ghost"
							class="border-border relative h-8 w-8 overflow-hidden rounded-full border p-0 transition hover:opacity-95"
							aria-label="User Menu"
						>
							<Avatar.Root class="h-8 w-8">
								<Avatar.Image src={$page.data.user.image} alt={$page.data.user.name} />
								<Avatar.Fallback
									class="bg-gradient-to-tr from-blue-600 to-purple-600 text-xs font-semibold text-white"
								>
									{$page.data.user.name ? $page.data.user.name.charAt(0).toUpperCase() : 'U'}
								</Avatar.Fallback>
							</Avatar.Root>
						</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content
					align="end"
					class="border-border bg-card mt-1 w-56 rounded-xl border p-1.5 shadow-lg"
				>
					<DropdownMenu.Label class="flex flex-col px-2 py-1.5">
						<span class="text-foreground truncate text-sm font-semibold"
							>{$page.data.user.name}</span
						>
						{#if $page.data.user.username}
							<span class="text-muted-foreground truncate text-[10px]"
								>@{$page.data.user.username}</span
							>
						{:else}
							<span class="text-muted-foreground truncate text-[10px]">{$page.data.user.email}</span
							>
						{/if}
					</DropdownMenu.Label>
					<DropdownMenu.Separator class="border-border my-1 border-t" />
					<DropdownMenu.Item class="rounded-md">
						<a
							href="/profile"
							class="hover:bg-muted flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition duration-150"
						>
							<User class="text-muted-foreground h-4 w-4" />
							<span>Profile</span>
						</a>
					</DropdownMenu.Item>
					<DropdownMenu.Item class="rounded-md">
						<a
							href="/settings"
							class="hover:bg-muted flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition duration-150"
						>
							<Settings class="text-muted-foreground h-4 w-4" />
							<span>Settings</span>
						</a>
					</DropdownMenu.Item>
					<DropdownMenu.Separator class="border-border my-1 border-t" />
					<DropdownMenu.Item class="rounded-md">
						<button
							onclick={handleSignOut}
							class="text-destructive hover:bg-destructive/10 flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm font-medium transition duration-150"
						>
							<LogOut class="h-4 w-4" />
							<span>Log out</span>
						</button>
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		{:else}
			<!-- Sign In Button for Unauthenticated Users -->
			<Button href="/login" size="sm" class="rounded-lg font-medium shadow-sm">Sign In</Button>
		{/if}
	</div>
</header>
