<script lang="ts">
	import { page } from '$app/stores';
	import { navigation } from '$lib/constants/navigation';
	import { Github } from 'lucide-svelte';
	import { cn } from '$lib/utils.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';

	let { class: className } = $props<{ class?: string }>();
</script>

<aside
	class={cn(
		'bg-card border-border text-card-foreground flex h-full w-64 flex-col border-r select-none',
		className
	)}
>
	<!-- Brand/Logo Section -->
	<div class="border-border flex items-center gap-3 border-b px-6 py-5">
		<div
			class="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-lg shadow-md transition-all duration-300 hover:scale-105"
		>
			<Github class="h-5 w-5" />
		</div>
		<div class="flex flex-col">
			<span
				class="from-foreground to-foreground/70 bg-gradient-to-r bg-clip-text text-lg leading-none font-bold tracking-tight"
				>GitDash</span
			>
			<span class="text-muted-foreground mt-0.5 text-xs font-medium">GitHub Insights</span>
		</div>
	</div>

	<!-- Navigation Menu Section -->
	<nav class="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
		{#each navigation as item (item.href)}
			{@const isActive =
				$page.url.pathname === item.href || $page.url.pathname.startsWith(item.href + '/')}
			<a
				href={item.href}
				class={cn(
					'group relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
					isActive
						? 'bg-secondary text-secondary-foreground font-semibold shadow-sm'
						: 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
				)}
			>
				{#if isActive}
					<div class="bg-primary absolute left-0 h-5 w-1 rounded-r-md"></div>
				{/if}
				<item.icon
					class={cn(
						'h-5 w-5 transition-transform duration-200 group-hover:scale-105',
						isActive
							? 'text-primary animate-pulse'
							: 'text-muted-foreground group-hover:text-foreground'
					)}
				/>
				<span>{item.title}</span>
			</a>
		{/each}
	</nav>

	<!-- Footer Section showing logged-in user or Guest -->
	<div class="border-border bg-muted/20 border-t p-4">
		<div class="flex items-center gap-3 px-2 py-2">
			{#if $page.data.user}
				<Avatar.Root class="border-border h-8 w-8 rounded-full border">
					<Avatar.Image src={$page.data.user.image} alt={$page.data.user.name} />
					<Avatar.Fallback
						class="bg-gradient-to-tr from-purple-500 to-blue-500 text-xs font-bold text-white"
					>
						{$page.data.user.name ? $page.data.user.name.charAt(0).toUpperCase() : 'U'}
					</Avatar.Fallback>
				</Avatar.Root>
				<div class="flex flex-col overflow-hidden">
					<span class="text-foreground truncate text-xs font-semibold">{$page.data.user.name}</span>
					{#if $page.data.user.username}
						<span class="text-muted-foreground truncate text-[10px] font-medium"
							>@{$page.data.user.username}</span
						>
					{:else}
						<span class="text-muted-foreground truncate text-[10px] font-medium"
							>{$page.data.user.email}</span
						>
					{/if}
				</div>
			{:else}
				<div
					class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 text-sm font-bold text-white shadow-inner"
				>
					G
				</div>
				<div class="flex flex-col overflow-hidden">
					<span class="text-foreground truncate text-xs font-semibold">Guest User</span>
					<span class="text-muted-foreground truncate text-[10px] font-medium"
						>guest@example.com</span
					>
				</div>
			{/if}
		</div>
	</div>
</aside>
