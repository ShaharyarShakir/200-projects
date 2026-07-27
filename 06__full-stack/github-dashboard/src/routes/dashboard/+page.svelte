<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import * as Card from "$lib/components/ui/card/index.js";
	import { FolderGit2, Bug, GitFork, Star, ArrowUpRight, Github, Activity, RefreshCw } from "lucide-svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";

	// Receive page data containing the list of repositories from the load function
	let { data }: { data: PageData } = $props();

	// Reactive loading state for manual database synchronizations
	let isSyncing = $state(false);

	// Derived metrics from repositories list
	let repos = $derived(data.repositories || []);
	let totalRepos = $derived(repos.length);
	let totalStars = $derived(repos.reduce((acc, r) => acc + (r.stars || 0), 0));
	let totalForks = $derived(repos.reduce((acc, r) => acc + (r.forks || 0), 0));
	let totalOpenIssues = $derived(repos.reduce((acc, r) => acc + (r.openIssues || 0), 0));

	// Trigger SvelteKit validation and reload of server load data
	async function handleSync() {
		isSyncing = true;
		// Add a realistic delay for UI transition feedback
		await new Promise(resolve => setTimeout(resolve, 800));
		await invalidateAll();
		isSyncing = false;
	}

	// Map repository languages to beautiful color badges
	const languageColors: Record<string, string> = {
		TypeScript: 'bg-blue-600 dark:bg-blue-500',
		Rust: 'bg-orange-600 dark:bg-orange-500',
		Go: 'bg-cyan-600 dark:bg-cyan-500',
		Python: 'bg-emerald-600 dark:bg-emerald-500',
		Svelte: 'bg-red-600 dark:bg-red-500',
		JavaScript: 'bg-yellow-600 dark:bg-yellow-500'
	};

	function getLanguageColor(lang: string | null): string {
		if (!lang) return 'bg-muted-foreground/40';
		return languageColors[lang] || 'bg-primary/50';
	}
</script>

<div class="space-y-8 select-none">
	<!-- Welcome Banner & Action Button -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-border bg-gradient-to-r from-muted/50 to-muted/20 backdrop-blur-sm shadow-sm">
		<div class="space-y-1">
			<div class="flex items-center gap-2">
				<Badge variant="outline" class="border-primary/30 text-primary bg-primary/5 font-medium px-2 py-0.5 text-xs">
					Sprint 1 - Phase 3
				</Badge>
				<span class="text-xs text-muted-foreground">•</span>
				<span class="text-xs text-muted-foreground font-medium">Database Synced</span>
			</div>
			<h2 class="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">Welcome to GitDash</h2>
			<p class="text-sm text-muted-foreground font-light">
				Manage and monitor your tracked repositories. Sync to pull in latest numbers directly from the database.
			</p>
		</div>
		<div class="flex items-center gap-3">
			<Button variant="outline" class="gap-2 shadow-sm" href="https://github.com" target="_blank" rel="noopener noreferrer">
				<Github class="w-4 h-4" />
				<span>GitHub</span>
			</Button>
			<Button class="gap-2 shadow-md relative" disabled={isSyncing} onclick={handleSync}>
				<RefreshCw class="w-4 h-4 {isSyncing ? 'animate-spin' : ''}" />
				<span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
			</Button>
		</div>
	</div>

	<!-- 4 Metrics Cards Grid -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
		<!-- Repositories Card -->
		<Card.Root class="hover:shadow-md hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5 bg-card">
			<Card.Header class="flex flex-row items-center justify-between pb-2 space-y-0">
				<Card.Title class="text-sm font-semibold text-muted-foreground">Repositories</Card.Title>
				<div class="p-2 rounded-lg bg-blue-500/10 text-blue-500">
					<FolderGit2 class="w-5 h-5" />
				</div>
			</Card.Header>
			<Card.Content class="space-y-1">
				<div class="text-3xl font-bold tracking-tight">{totalRepos}</div>
				<p class="text-xs text-muted-foreground">Connected to local database</p>
			</Card.Content>
		</Card.Root>

		<!-- Open Issues Card -->
		<Card.Root class="hover:shadow-md hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5 bg-card">
			<Card.Header class="flex flex-row items-center justify-between pb-2 space-y-0">
				<Card.Title class="text-sm font-semibold text-muted-foreground">Open Issues</Card.Title>
				<div class="p-2 rounded-lg bg-red-500/10 text-red-500">
					<Bug class="w-5 h-5" />
				</div>
			</Card.Header>
			<Card.Content class="space-y-1">
				<div class="text-3xl font-bold tracking-tight">{totalOpenIssues}</div>
				<p class="text-xs text-muted-foreground">Total unresolved bugs & issues</p>
			</Card.Content>
		</Card.Root>

		<!-- Forks Card -->
		<Card.Root class="hover:shadow-md hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5 bg-card">
			<Card.Header class="flex flex-row items-center justify-between pb-2 space-y-0">
				<Card.Title class="text-sm font-semibold text-muted-foreground">Forks</Card.Title>
				<div class="p-2 rounded-lg bg-green-500/10 text-green-500">
					<GitFork class="w-5 h-5" />
				</div>
			</Card.Header>
			<Card.Content class="space-y-1">
				<div class="text-3xl font-bold tracking-tight">{totalForks}</div>
				<p class="text-xs text-muted-foreground">Total downstream splits</p>
			</Card.Content>
		</Card.Root>

		<!-- Stars Card -->
		<Card.Root class="hover:shadow-md hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5 bg-card">
			<Card.Header class="flex flex-row items-center justify-between pb-2 space-y-0">
				<Card.Title class="text-sm font-semibold text-muted-foreground">Total Stars</Card.Title>
				<div class="p-2 rounded-lg bg-amber-500/10 text-amber-500">
					<Star class="w-5 h-5" />
				</div>
			</Card.Header>
			<Card.Content class="space-y-1">
				<div class="text-3xl font-bold tracking-tight">{totalStars}</div>
				<p class="text-xs text-muted-foreground">Across all codebases</p>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Repositories Grid Section -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<h3 class="font-bold text-lg bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">Tracked Codebases</h3>
			{#if !isSyncing && totalRepos > 0}
				<span class="text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded-md">
					Showing {totalRepos} items
				</span>
			{/if}
		</div>

		{#if isSyncing}
			<!-- Loading State: Pulse skeleton cards -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each Array(6) as _, i}
					<Card.Root class="animate-pulse border-border/80">
						<Card.Header class="pb-3">
							<div class="flex items-start justify-between">
								<div class="space-y-2 w-full">
									<div class="h-5 bg-muted rounded-md w-2/3"></div>
									<div class="h-3 bg-muted rounded-md w-1/3"></div>
								</div>
								<div class="w-8 h-8 rounded bg-muted"></div>
							</div>
						</Card.Header>
						<Card.Content class="pb-4 space-y-2">
							<div class="h-3.5 bg-muted rounded-md w-full"></div>
							<div class="h-3.5 bg-muted rounded-md w-5/6"></div>
						</Card.Content>
						<Card.Footer class="border-t border-border/50 pt-4 flex gap-4">
							<div class="h-4 bg-muted rounded-md w-12"></div>
							<div class="h-4 bg-muted rounded-md w-12"></div>
							<div class="h-4 bg-muted rounded-md w-12"></div>
						</Card.Footer>
					</Card.Root>
				{/each}
			</div>
		{:else if totalRepos === 0}
			<!-- Empty State -->
			<Card.Root class="border border-border/80 bg-card/60 backdrop-blur-sm">
				<Card.Content class="flex flex-col items-center justify-center py-16 text-center space-y-4">
					<div class="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
						<FolderGit2 class="w-7 h-7" />
					</div>
					<div class="space-y-1">
						<h4 class="font-semibold text-lg">No repositories found.</h4>
						<p class="text-sm text-muted-foreground max-w-sm font-light">
							Your local database does not have any repositories yet. Run the seed script to populate mock repositories.
						</p>
					</div>
					<div class="pt-2">
						<Button variant="outline" size="sm" onclick={handleSync} class="gap-2">
							<RefreshCw class="w-3.5 h-3.5" />
							<span>Reload Data</span>
						</Button>
					</div>
				</Card.Content>
			</Card.Root>
		{:else}
			<!-- Main Repositories Grid (Desktop: 3 columns, Tablet: 2, Mobile: 1) -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each repos as repo (repo.id)}
					<Card.Root class="hover:shadow-md hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 bg-card flex flex-col justify-between">
						<div>
							<Card.Header class="pb-3">
								<div class="flex items-start justify-between gap-2">
									<div class="space-y-1">
										<Card.Title class="text-base font-bold tracking-tight text-foreground truncate max-w-[200px]">
											{repo.name}
										</Card.Title>
										{#if repo.owner}
											<span class="text-xs text-muted-foreground font-light">
												by {repo.owner}
											</span>
										{/if}
									</div>
									<div class="flex items-center gap-1.5 self-start">
										<Badge variant="outline" class="font-normal text-[11px] px-2 py-0.5 bg-muted/40">
											<span class="w-2 h-2 rounded-full {getLanguageColor(repo.language)} mr-1.5 inline-block"></span>
											{repo.language || 'Unknown'}
										</Badge>
									</div>
								</div>
							</Card.Header>

							<Card.Content class="pb-4">
								<p class="text-xs text-muted-foreground line-clamp-3 font-light leading-relaxed min-h-[48px]">
									{repo.description || 'No description provided.'}
								</p>
							</Card.Content>
						</div>

						<Card.Footer class="border-t border-border/50 pt-4 pb-4 flex items-center justify-between text-muted-foreground text-xs">
							<div class="flex items-center gap-4">
								<!-- Stars -->
								<div class="flex items-center gap-1.5 hover:text-amber-500 transition-colors" title="Stars">
									<Star class="w-3.5 h-3.5 fill-amber-500/10" />
									<span class="font-medium">{repo.stars ?? 0}</span>
								</div>

								<!-- Forks -->
								<div class="flex items-center gap-1.5 hover:text-green-500 transition-colors" title="Forks">
									<GitFork class="w-3.5 h-3.5" />
									<span class="font-medium">{repo.forks ?? 0}</span>
								</div>

								<!-- Issues -->
								<div class="flex items-center gap-1.5 hover:text-red-500 transition-colors" title="Open Issues">
									<Bug class="w-3.5 h-3.5" />
									<span class="font-medium">{repo.openIssues ?? 0}</span>
								</div>
							</div>

							{#if repo.githubId}
								<span class="text-[10px] text-muted-foreground/60 font-mono">
									ID: {repo.githubId}
								</span>
							{/if}
						</Card.Footer>
					</Card.Root>
				{/each}
			</div>
		{/if}
	</div>
</div>
