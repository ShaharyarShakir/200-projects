<script lang="ts">
	import { page } from '$app/stores';
	import { navigation } from '$lib/constants/navigation';
	import { Github } from 'lucide-svelte';
	import { cn } from '$lib/utils.js';

	let { class: className } = $props<{ class?: string }>();
</script>

<aside class={cn("flex flex-col h-full bg-card border-r border-border text-card-foreground w-64 select-none", className)}>
	<!-- Brand/Logo Section -->
	<div class="flex items-center gap-3 px-6 py-5 border-b border-border">
		<div class="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground shadow-md transition-all duration-300 hover:scale-105">
			<Github class="w-5 h-5" />
		</div>
		<div class="flex flex-col">
			<span class="font-bold text-lg tracking-tight leading-none bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">GitDash</span>
			<span class="text-xs text-muted-foreground mt-0.5 font-medium">GitHub Insights</span>
		</div>
	</div>

	<!-- Navigation Menu Section -->
	<nav class="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
		{#each navigation as item}
			{@const isActive = $page.url.pathname === item.href || $page.url.pathname.startsWith(item.href + '/')}
			<a
				href={item.href}
				class={cn(
					"flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative",
					isActive 
						? "bg-secondary text-secondary-foreground font-semibold shadow-sm" 
						: "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
				)}
			>
				{#if isActive}
					<div class="absolute left-0 w-1 h-5 bg-primary rounded-r-md"></div>
				{/if}
				<item.icon class={cn("w-5 h-5 transition-transform duration-200 group-hover:scale-105", isActive ? "text-primary animate-pulse" : "text-muted-foreground group-hover:text-foreground")} />
				<span>{item.title}</span>
			</a>
		{/each}
	</nav>

	<!-- Footer Section -->
	<div class="p-4 border-t border-border bg-muted/20">
		<div class="flex items-center gap-3 px-2 py-2">
			<div class="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
				G
			</div>
			<div class="flex flex-col overflow-hidden">
				<span class="text-xs font-semibold text-foreground truncate">Guest User</span>
				<span class="text-[10px] text-muted-foreground truncate font-medium">guest@example.com</span>
			</div>
		</div>
	</div>
</aside>
