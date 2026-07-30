<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import * as Card from '$lib/components/ui/card/index.js';
	import { FolderGit2, Bug, GitFork, Star, Github, RefreshCw } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';

	import { toasts } from '$lib/stores/toast';

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

	// Trigger live SvelteKit database repository synchronization
	async function handleSync() {
		isSyncing = true;
		try {
			const response = await fetch('/api/repositories/sync', { method: 'POST' });
			const result = await response.json();

			if (response.ok && result.success) {
				toasts.add(`Successfully synchronized ${result.imported} repositories!`, 'success');
				await invalidateAll();
			} else {
				toasts.add(result.error || 'Sync failed.', 'error');
			}
		} catch (error: any) {
			toasts.add(error.message || 'Connection error. Please try again.', 'error');
		} finally {
			isSyncing = false;
		}
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
	<div
		class="border-border from-muted/50 to-muted/20 flex flex-col justify-between gap-4 rounded-2xl border bg-gradient-to-r p-6 shadow-sm backdrop-blur-sm md:flex-row md:items-center"
	>
		<div class="space-y-1">
			<div class="flex items-center gap-2">
				<span class="text-muted-foreground text-xs">•</span>
				<span class="text-muted-foreground text-xs font-medium">Database Synced</span>
			</div>
			<h2
				class="from-foreground to-foreground/80 bg-gradient-to-r bg-clip-text text-2xl font-bold tracking-tight"
			>
				Welcome to GitDash
			</h2>
			<p class="text-muted-foreground text-sm font-light">
				Manage and monitor your tracked repositories. Sync to pull in latest numbers directly from
				the database.
			</p>
		</div>
		<div class="flex items-center gap-3">
			<Button
				variant="outline"
				class="gap-2 shadow-sm"
				href="https://github.com"
				target="_blank"
				rel="noopener noreferrer"
			>
				<Github class="h-4 w-4" />
				<span>GitHub</span>
			</Button>
			<Button class="relative gap-2 shadow-md" disabled={isSyncing} onclick={handleSync}>
				<RefreshCw class="h-4 w-4 {isSyncing ? 'animate-spin' : ''}" />
				<span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
			</Button>
		</div>
	</div>

	<!-- 4 Metrics Cards Grid -->
	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
		<!-- Repositories Card -->
		<Card.Root
			class="hover:border-primary/30 bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
		>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-muted-foreground text-sm font-semibold">Repositories</Card.Title>
				<div class="rounded-lg bg-blue-500/10 p-2 text-blue-500">
					<FolderGit2 class="h-5 w-5" />
				</div>
			</Card.Header>
			<Card.Content class="space-y-1">
				<div class="text-3xl font-bold tracking-tight">{totalRepos}</div>
				<p class="text-muted-foreground text-xs">Connected to local database</p>
			</Card.Content>
		</Card.Root>

		<!-- Open Issues Card -->
		<Card.Root
			class="hover:border-primary/30 bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
		>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-muted-foreground text-sm font-semibold">Open Issues</Card.Title>
				<div class="rounded-lg bg-red-500/10 p-2 text-red-500">
					<Bug class="h-5 w-5" />
				</div>
			</Card.Header>
			<Card.Content class="space-y-1">
				<div class="text-3xl font-bold tracking-tight">{totalOpenIssues}</div>
				<p class="text-muted-foreground text-xs">Total unresolved bugs & issues</p>
			</Card.Content>
		</Card.Root>

		<!-- Forks Card -->
		<Card.Root
			class="hover:border-primary/30 bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
		>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-muted-foreground text-sm font-semibold">Forks</Card.Title>
				<div class="rounded-lg bg-green-500/10 p-2 text-green-500">
					<GitFork class="h-5 w-5" />
				</div>
			</Card.Header>
			<Card.Content class="space-y-1">
				<div class="text-3xl font-bold tracking-tight">{totalForks}</div>
				<p class="text-muted-foreground text-xs">Total downstream splits</p>
			</Card.Content>
		</Card.Root>

		<!-- Stars Card -->
		<Card.Root
			class="hover:border-primary/30 bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
		>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-muted-foreground text-sm font-semibold">Total Stars</Card.Title>
				<div class="rounded-lg bg-amber-500/10 p-2 text-amber-500">
					<Star class="h-5 w-5" />
				</div>
			</Card.Header>
			<Card.Content class="space-y-1">
				<div class="text-3xl font-bold tracking-tight">{totalStars}</div>
				<p class="text-muted-foreground text-xs">Across all codebases</p>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Repositories Grid Section -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<h3 class="from-foreground to-foreground/80 bg-gradient-to-r bg-clip-text text-lg font-bold">
				Tracked Codebases
			</h3>
			{#if !isSyncing && totalRepos > 0}
				<span class="text-muted-foreground bg-muted rounded-md px-2 py-1 text-xs font-medium">
					Showing {totalRepos} items
				</span>
			{/if}
		</div>

		{#if isSyncing}
			<!-- Loading State: Pulse skeleton cards -->
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each [0, 1, 2, 3, 4, 5] as index (index)}
					<Card.Root class="border-border/80 animate-pulse" data-index={index}>
						<Card.Header class="pb-3">
							<div class="flex items-start justify-between">
								<div class="w-full space-y-2">
									<div class="bg-muted h-5 w-2/3 rounded-md"></div>
									<div class="bg-muted h-3 w-1/3 rounded-md"></div>
								</div>
								<div class="bg-muted h-8 w-8 rounded"></div>
							</div>
						</Card.Header>
						<Card.Content class="space-y-2 pb-4">
							<div class="bg-muted h-3.5 w-full rounded-md"></div>
							<div class="bg-muted h-3.5 w-5/6 rounded-md"></div>
						</Card.Content>
						<Card.Footer class="border-border/50 flex gap-4 border-t pt-4">
							<div class="bg-muted h-4 w-12 rounded-md"></div>
							<div class="bg-muted h-4 w-12 rounded-md"></div>
							<div class="bg-muted h-4 w-12 rounded-md"></div>
						</Card.Footer>
					</Card.Root>
				{/each}
			</div>
		{:else if totalRepos === 0}
			<!-- Empty State -->
			<Card.Root class="border-border/80 bg-card/60 border backdrop-blur-sm">
				<Card.Content class="flex flex-col items-center justify-center space-y-4 py-16 text-center">
					<div
						class="bg-muted text-muted-foreground flex h-14 w-14 items-center justify-center rounded-full"
					>
						<FolderGit2 class="h-7 w-7" />
					</div>
					<div class="space-y-1">
						<h4 class="text-lg font-semibold">No repositories found.</h4>
						<p class="text-muted-foreground max-w-sm text-sm font-light">
							Your local database does not have any repositories yet. Run the seed script to
							populate mock repositories.
						</p>
					</div>
					<div class="pt-2">
						<Button variant="outline" size="sm" onclick={handleSync} class="gap-2">
							<RefreshCw class="h-3.5 w-3.5" />
							<span>Reload Data</span>
						</Button>
					</div>
				</Card.Content>
			</Card.Root>
		{:else}
			<!-- Main Repositories Grid (Desktop: 3 columns, Tablet: 2, Mobile: 1) -->
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each repos as repo (repo.id)}
					<Card.Root
						class="hover:border-primary/40 bg-card flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
					>
						<div>
							<Card.Header class="pb-3">
								<div class="flex items-start justify-between gap-2">
									<div class="space-y-1">
										<Card.Title
											class="text-foreground max-w-[200px] truncate text-base font-bold tracking-tight"
										>
											{repo.name}
										</Card.Title>
										{#if repo.owner}
											<span class="text-muted-foreground text-xs font-light">
												by {repo.owner}
											</span>
										{/if}
									</div>
									<div class="flex items-center gap-1.5 self-start">
										<Badge
											variant="outline"
											class="bg-muted/40 px-2 py-0.5 text-[11px] font-normal"
										>
											<span
												class="h-2 w-2 rounded-full {getLanguageColor(
													repo.language
												)} mr-1.5 inline-block"
											></span>
											{repo.language || 'Unknown'}
										</Badge>
									</div>
								</div>
							</Card.Header>

							<Card.Content class="pb-4">
								<p
									class="text-muted-foreground line-clamp-3 min-h-[48px] text-xs leading-relaxed font-light"
								>
									{repo.description || 'No description provided.'}
								</p>
							</Card.Content>
						</div>

						<Card.Footer
							class="border-border/50 text-muted-foreground flex items-center justify-between border-t pt-4 pb-4 text-xs"
						>
							<div class="flex items-center gap-4">
								<!-- Stars -->
								<div
									class="flex items-center gap-1.5 transition-colors hover:text-amber-500"
									title="Stars"
								>
									<Star class="h-3.5 w-3.5 fill-amber-500/10" />
									<span class="font-medium">{repo.stars ?? 0}</span>
								</div>

								<!-- Forks -->
								<div
									class="flex items-center gap-1.5 transition-colors hover:text-green-500"
									title="Forks"
								>
									<GitFork class="h-3.5 w-3.5" />
									<span class="font-medium">{repo.forks ?? 0}</span>
								</div>

								<!-- Issues -->
								<div
									class="flex items-center gap-1.5 transition-colors hover:text-red-500"
									title="Open Issues"
								>
									<Bug class="h-3.5 w-3.5" />
									<span class="font-medium">{repo.openIssues ?? 0}</span>
								</div>
							</div>

							{#if repo.githubId}
								<span class="text-muted-foreground/60 font-mono text-[10px]">
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
