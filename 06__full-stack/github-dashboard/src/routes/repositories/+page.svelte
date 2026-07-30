<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll, goto } from '$app/navigation';
	import { page } from '$app/stores';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { toasts } from '$lib/stores/toast';
	import {
		FolderGit2,
		Star,
		GitFork,
		Bug,
		RefreshCw,
		Search,
		Shield,
		Archive,
		Eye,
		ArrowUpRight,
		Clock,
		LayoutGrid,
		ListCollapse
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	// Reactive filtering states
	let searchQuery = $state('');
	let selectedOwner = $state('');
	let selectedLanguage = $state('');
	let viewMode = $state<'grid' | 'list'>('grid');

	// Synchronize filter values when SvelteKit page data updates
	$effect(() => {
		searchQuery = data.filters?.search || '';
		selectedOwner = data.filters?.owner || '';
		selectedLanguage = data.filters?.language || '';
	});

	// Sync status states
	let isSyncing = $state(false);
	let lastSynced = $derived.by(() => {
		const repos = data.repositories || [];
		if (repos.length === 0) return null;
		// Find the most recent syncedAt date
		const dates = repos.map((r) => new Date(r.syncedAt).getTime());
		const maxDate = new Date(Math.max(...dates));
		return maxDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	});

	// Derived metrics
	let repos = $derived(data.repositories || []);
	let totalCount = $derived(repos.length);

	// Apply search and dropdown filters through URL queries reactively
	function handleFilterChange() {
		const url = new URL($page.url);

		if (searchQuery) url.searchParams.set('search', searchQuery);
		else url.searchParams.delete('search');

		if (selectedOwner) url.searchParams.set('owner', selectedOwner);
		else url.searchParams.delete('owner');

		if (selectedLanguage) url.searchParams.set('language', selectedLanguage);
		else url.searchParams.delete('language');

		goto(url, { keepFocus: true, replaceState: true });
	}

	// Trigger GitHub synchronization
	async function handleSync() {
		isSyncing = true;
		try {
			const response = await fetch('/api/repositories/sync', { method: 'POST' });
			const result = await response.json();

			if (response.ok && result.success) {
				importedCount = result.imported;
				toasts.add(`Successfully synchronized ${result.imported} repositories!`, 'success');
				await invalidateAll(); // Force SvelteKit to reload page loader data
			} else {
				toasts.add(result.error || 'Synchronization failed.', 'error');
			}
		} catch (error: any) {
			toasts.add(error.message || 'Connection error. Please try again.', 'error');
		} finally {
			isSyncing = false;
		}
	}

	// Language badge color mapper
	const languageColors: Record<string, string> = {
		TypeScript: 'bg-blue-600 dark:bg-blue-500',
		Rust: 'bg-orange-600 dark:bg-orange-500',
		Go: 'bg-cyan-600 dark:bg-cyan-500',
		Python: 'bg-emerald-600 dark:bg-emerald-500',
		Svelte: 'bg-red-600 dark:bg-red-500',
		JavaScript: 'bg-yellow-600 dark:bg-yellow-500',
		HTML: 'bg-orange-500',
		CSS: 'bg-purple-500',
		Shell: 'bg-green-700'
	};

	function getLanguageColor(lang: string | null): string {
		if (!lang) return 'bg-muted-foreground/40';
		return languageColors[lang] || 'bg-primary/50';
	}

	// Relative time helper
	function formatRelativeTime(dateInput: Date | string | null): string {
		if (!dateInput) return 'Never';
		const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMins / 60);
		const diffDays = Math.floor(diffHours / 24);

		if (diffMins < 1) return 'just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays === 1) return 'yesterday';
		return `${diffDays}d ago`;
	}
</script>

<div class="space-y-8 select-none">
	<!-- Page Header -->
	<div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
		<div class="flex flex-col gap-1">
			<h2
				class="from-foreground to-foreground/80 bg-gradient-to-r bg-clip-text text-3xl font-extrabold tracking-tight"
			>
				Repositories
			</h2>
			<p class="text-muted-foreground text-sm font-light">
				Browse, search, and synchronize your linked GitHub repositories.
			</p>
		</div>

		<div class="flex items-center gap-3">
			{#if lastSynced}
				<span class="text-muted-foreground hidden text-xs font-light sm:inline">
					Last synced: <span class="font-semibold">{lastSynced}</span>
				</span>
			{/if}

			<Button
				onclick={handleSync}
				disabled={isSyncing}
				class="gap-2 rounded-xl shadow-md transition-all duration-200 hover:-translate-y-0.5"
			>
				<RefreshCw class="h-4 w-4 {isSyncing ? 'animate-spin' : ''}" />
				<span>{isSyncing ? 'Syncing...' : 'Sync Repositories'}</span>
			</Button>
		</div>
	</div>

	<!-- Top Toolbar Search & Filter panel -->
	<div
		class="border-border bg-card flex flex-col items-center justify-between gap-4 rounded-xl border p-4 shadow-sm md:flex-row"
	>
		<div class="flex w-full flex-col items-center gap-3 sm:flex-row md:max-w-2xl">
			<!-- Search Input -->
			<div class="relative w-full">
				<Search class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
				<input
					type="text"
					bind:value={searchQuery}
					oninput={handleFilterChange}
					placeholder="Search repositories..."
					class="border-border bg-background focus:ring-primary/20 focus:border-primary h-10 w-full rounded-lg border pr-4 pl-9 text-sm transition focus:ring-2 focus:outline-none"
				/>
			</div>

			<!-- Owner Filter -->
			<select
				bind:value={selectedOwner}
				onchange={handleFilterChange}
				class="border-border bg-background text-foreground focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition focus:ring-2 focus:outline-none sm:w-44"
			>
				<option value="">All Owners</option>
				{#each data.owners || [] as owner (owner)}
					<option value={owner}>{owner}</option>
				{/each}
			</select>

			<!-- Language Filter -->
			<select
				bind:value={selectedLanguage}
				onchange={handleFilterChange}
				class="border-border bg-background text-foreground focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition focus:ring-2 focus:outline-none sm:w-44"
			>
				<option value="">All Languages</option>
				{#each data.languages || [] as language (language)}
					<option value={language}>{language}</option>
				{/each}
			</select>
		</div>

		<!-- Grid/List layout toggle + Repo Count -->
		<div class="flex shrink-0 items-center gap-4">
			<span class="text-muted-foreground bg-muted/60 rounded-full px-3 py-1 text-xs font-semibold">
				{totalCount}
				{totalCount === 1 ? 'repository' : 'repositories'}
			</span>

			<div class="border-border flex overflow-hidden rounded-lg border">
				<button
					onclick={() => (viewMode = 'grid')}
					class="p-2 transition {viewMode === 'grid'
						? 'bg-secondary text-secondary-foreground'
						: 'bg-background hover:bg-muted text-muted-foreground'}"
					aria-label="Grid View"
				>
					<LayoutGrid class="h-4 w-4" />
				</button>
				<button
					onclick={() => (viewMode = 'list')}
					class="p-2 transition {viewMode === 'list'
						? 'bg-secondary text-secondary-foreground'
						: 'bg-background hover:bg-muted text-muted-foreground'}"
					aria-label="List View"
				>
					<ListCollapse class="h-4 w-4" />
				</button>
			</div>
		</div>
	</div>

	<!-- Repositories Content Layout -->
	{#if repos.length > 0}
		{#if viewMode === 'grid'}
			<!-- Grid Mode -->
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each repos as repo (repo.id)}
					<Card.Root
						class="group hover:border-primary/30 bg-card flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
					>
						<Card.Header class="pb-3">
							<div class="flex items-start justify-between gap-4">
								<div class="flex items-center gap-3">
									<!-- Owner Avatar -->
									{#if repo.ownerAvatar}
										<img
											src={repo.ownerAvatar}
											alt={repo.owner || ''}
											class="border-border h-9 w-9 rounded-lg border shadow-sm"
										/>
									{:else}
										<div class="rounded-lg bg-blue-500/10 p-2 text-blue-500">
											<FolderGit2 class="h-5 w-5" />
										</div>
									{/if}

									<div class="flex flex-col overflow-hidden">
										<h4
											class="text-foreground group-hover:text-primary max-w-[150px] truncate text-base font-bold tracking-tight transition-colors"
										>
											<a href="/repositories/{repo.owner}/{repo.name}">{repo.name}</a>
										</h4>
										<span class="text-muted-foreground max-w-[150px] truncate text-xs"
											>@{repo.owner || 'unknown'}</span
										>
									</div>
								</div>

								<!-- Link out -->
								<a
									href={`https://github.com/${repo.fullName}`}
									target="_blank"
									rel="noopener noreferrer"
									class="border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 rounded-lg border p-1.5 transition duration-150"
									aria-label="View on GitHub"
								>
									<ArrowUpRight class="h-3.5 w-3.5" />
								</a>
							</div>
						</Card.Header>

						<Card.Content class="flex-1 space-y-3 py-3">
							<p class="text-muted-foreground line-clamp-2 h-8 text-xs leading-relaxed font-light">
								{repo.description || 'No description provided.'}
							</p>

							<!-- Visibility and Status Badges -->
							<div class="flex flex-wrap gap-1.5">
								{#if repo.private}
									<Badge
										variant="outline"
										class="rounded-full border-rose-500/20 bg-rose-500/5 px-2 py-0 text-[9px] font-medium text-rose-500"
									>
										<Shield class="mr-1 h-3 w-3" /> Private
									</Badge>
								{:else}
									<Badge
										variant="outline"
										class="rounded-full border-emerald-500/20 bg-emerald-500/5 px-2 py-0 text-[9px] font-medium text-emerald-500"
									>
										<Eye class="mr-1 h-3 w-3" /> Public
									</Badge>
								{/if}

								{#if repo.archived}
									<Badge
										variant="outline"
										class="rounded-full border-slate-500/20 bg-slate-500/5 px-2 py-0 text-[9px] font-medium text-slate-500"
									>
										<Archive class="mr-1 h-3 w-3" /> Archived
									</Badge>
								{/if}

								{#if repo.defaultBranch}
									<Badge
										variant="outline"
										class="border-border text-muted-foreground bg-muted/20 rounded-full px-2 py-0 font-mono text-[9px]"
									>
										{repo.defaultBranch}
									</Badge>
								{/if}
							</div>
						</Card.Content>

						<Card.Footer
							class="border-border/50 text-muted-foreground bg-muted/5 flex items-center justify-between border-t pt-3 pb-4 text-xs font-medium"
						>
							<!-- Language -->
							<div class="flex items-center gap-2">
								<span class="h-2 w-2 rounded-full {getLanguageColor(repo.language)}"></span>
								<span>{repo.language || 'Unknown'}</span>
							</div>

							<!-- Metrics -->
							<div class="flex items-center gap-3">
								<div class="flex items-center gap-1">
									<Star class="h-3.5 w-3.5 text-amber-500" />
									<span>{repo.stars || 0}</span>
								</div>
								<div class="flex items-center gap-1">
									<GitFork class="h-3.5 w-3.5 text-sky-500" />
									<span>{repo.forks || 0}</span>
								</div>
								<div class="flex items-center gap-1">
									<Bug class="h-3.5 w-3.5 text-rose-500" />
									<span>{repo.openIssues || 0}</span>
								</div>
							</div>
						</Card.Footer>
					</Card.Root>
				{/each}
			</div>
		{:else}
			<!-- List Mode -->
			<div class="border-border bg-card overflow-hidden rounded-xl border">
				<div class="divide-border/60 divide-y">
					{#each repos as repo (repo.id)}
						<div
							class="hover:bg-muted/20 flex flex-col justify-between gap-4 p-4 px-6 transition sm:flex-row sm:items-center"
						>
							<div class="flex min-w-0 items-center gap-3">
								{#if repo.ownerAvatar}
									<img
										src={repo.ownerAvatar}
										alt={repo.owner || ''}
										class="border-border h-8 w-8 rounded-lg border"
									/>
								{:else}
									<div class="shrink-0 rounded-lg bg-blue-500/10 p-2 text-blue-500">
										<FolderGit2 class="h-4 w-4" />
									</div>
								{/if}

								<div class="min-w-0 space-y-0.5">
									<div class="flex items-center gap-2">
										<h4
											class="text-foreground hover:text-primary truncate pr-2 text-sm font-bold transition-colors"
										>
											<a href="/repositories/{repo.owner}/{repo.name}">{repo.name}</a>
										</h4>
										{#if repo.private}
											<Badge
												variant="outline"
												class="rounded-full border-rose-500/20 bg-rose-500/5 px-1.5 py-0 text-[8px] font-medium text-rose-500"
												>Private</Badge
											>
										{/if}
										{#if repo.archived}
											<Badge
												variant="outline"
												class="rounded-full border-slate-500/20 bg-slate-500/5 px-1.5 py-0 text-[8px] font-medium text-slate-500"
												>Archived</Badge
											>
										{/if}
									</div>
									<p
										class="text-muted-foreground max-w-lg truncate text-xs leading-normal font-light"
									>
										{repo.description || 'No description provided.'}
									</p>
								</div>
							</div>

							<div
								class="text-muted-foreground flex shrink-0 items-center justify-between gap-6 text-xs font-medium sm:justify-start"
							>
								<!-- Language -->
								<div class="flex items-center gap-2">
									<span class="h-2 w-2 rounded-full {getLanguageColor(repo.language)}"></span>
									<span>{repo.language || 'Unknown'}</span>
								</div>

								<!-- Stats -->
								<div class="flex items-center gap-4">
									<div class="flex items-center gap-1.5">
										<Star class="h-3.5 w-3.5 text-amber-500" />
										<span>{repo.stars || 0}</span>
									</div>
									<div class="flex items-center gap-1.5">
										<GitFork class="h-3.5 w-3.5 text-sky-500" />
										<span>{repo.forks || 0}</span>
									</div>
								</div>

								<!-- Date Pushed -->
								<div class="flex items-center gap-1 text-[11px] font-light text-slate-500">
									<Clock class="h-3.5 w-3.5 shrink-0" />
									<span>Pushed {formatRelativeTime(repo.pushedAt)}</span>
								</div>

								<!-- Link out -->
								<a
									href={`https://github.com/${repo.fullName}`}
									target="_blank"
									rel="noopener noreferrer"
									class="border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded border p-1 transition"
									aria-label="View on GitHub"
								>
									<ArrowUpRight class="h-3.5 w-3.5" />
								</a>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{:else}
		<!-- Empty State Layout -->
		<div
			class="border-border bg-card/20 flex flex-col items-center justify-center rounded-2xl border border-dashed p-20 text-center backdrop-blur-sm"
		>
			<div
				class="mb-6 rounded-full border border-blue-500/10 bg-blue-500/5 p-4 text-blue-500 shadow-inner"
			>
				<FolderGit2 class="h-12 w-12" />
			</div>

			<h3 class="text-foreground text-xl font-bold tracking-tight">
				Synchronize your GitHub account
			</h3>
			<p class="text-muted-foreground mt-2 mb-8 max-w-sm text-sm leading-relaxed font-light">
				We couldn't find any repositories matching your search filters in the local database. Sync
				now to import them directly from GitHub.
			</p>

			<Button
				onclick={handleSync}
				disabled={isSyncing}
				class="hover:shadow-primary/10 h-11 gap-2 rounded-xl px-6 shadow-md transition-all duration-200 hover:-translate-y-0.5"
			>
				<RefreshCw class="h-4 w-4 {isSyncing ? 'animate-spin' : ''}" />
				<span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
			</Button>
		</div>
	{/if}
</div>
