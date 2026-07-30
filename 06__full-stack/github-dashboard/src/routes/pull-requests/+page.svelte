<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { GitPullRequest, GitMerge, FileCode, Check, ChevronRight } from 'lucide-svelte';

	// Mock pull requests list
	const pulls = [
		{
			id: '#420',
			title: 'feat: Add Better Auth social providers mapping configurations',
			repo: 'gitdash-auth',
			branch: 'feat/better-auth-providers',
			additions: 180,
			deletions: 12,
			author: 'Shaharyar Shakir',
			status: 'approved',
			date: '3 hours ago'
		},
		{
			id: '#419',
			title: 'fix: Resolve connection pool exhaustion on concurrent request bursts',
			repo: 'gitdash-core',
			branch: 'fix/db-pool-exhaustion',
			additions: 45,
			deletions: 8,
			author: 'Jane Smith',
			status: 'changes-requested',
			date: '5 hours ago'
		},
		{
			id: '#412',
			title: 'docs: Update installation guide with OAuth credentials configuration',
			repo: 'gitdash-docs',
			branch: 'docs/oauth-instructions',
			additions: 12,
			deletions: 1,
			author: 'Alex Johnson',
			status: 'pending',
			date: '1 day ago'
		},
		{
			id: '#399',
			title: 'refactor: Migrate sidebar layout to utilize Svelte 5 snippets',
			repo: 'gitdash-ui',
			branch: 'refactor/svelte5-snippets',
			additions: 310,
			deletions: 245,
			author: 'Jane Smith',
			status: 'merged',
			date: '4 days ago'
		}
	];

	const statusColors: Record<string, string> = {
		approved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
		'changes-requested': 'bg-rose-500/10 text-rose-500 border-rose-500/20',
		pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
		merged: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
	};
</script>

<div class="space-y-8 select-none">
	<!-- Page Heading -->
	<div class="flex flex-col gap-1.5">
		<h2
			class="from-foreground to-foreground/80 bg-gradient-to-r bg-clip-text text-3xl font-extrabold tracking-tight"
		>
			Pull Requests
		</h2>
		<p class="text-muted-foreground text-sm font-light">
			Monitor open branches, review code additions, and verify merges.
		</p>
	</div>

	<!-- Stats Overview -->
	<div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Title class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
					>Open PRs</Card.Title
				>
			</Card.Header>
			<Card.Content class="flex items-center justify-between">
				<div class="text-3xl font-bold text-blue-500">3</div>
				<GitPullRequest class="h-5 w-5 text-blue-500/40" />
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Title class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
					>Approved</Card.Title
				>
			</Card.Header>
			<Card.Content class="flex items-center justify-between">
				<div class="text-3xl font-bold text-emerald-500">1</div>
				<Check class="h-5 w-5 text-emerald-500/40" />
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Title class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
					>Merged (7d)</Card.Title
				>
			</Card.Header>
			<Card.Content class="flex items-center justify-between">
				<div class="text-3xl font-bold text-purple-500">14</div>
				<GitMerge class="h-5 w-5 text-purple-500/40" />
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Pull Requests List -->
	<Card.Root class="bg-card">
		<Card.Header>
			<Card.Title class="text-lg font-bold">Active Pull Requests</Card.Title>
		</Card.Header>
		<Card.Content class="p-0">
			<div class="divide-border/60 divide-y">
				{#each pulls as pull (pull.id)}
					<div
						class="hover:bg-muted/30 flex items-center justify-between gap-4 p-4 transition duration-150 md:px-6"
					>
						<div class="flex min-w-0 items-start gap-3">
							<!-- Icon depending on merged/open status -->
							<div class="bg-muted mt-0.5 shrink-0 rounded-lg p-1.5">
								{#if pull.status === 'merged'}
									<GitMerge class="h-4 w-4 text-purple-500" />
								{:else}
									<GitPullRequest class="h-4 w-4 text-blue-500" />
								{/if}
							</div>

							<div class="min-w-0 space-y-1">
								<div class="flex flex-wrap items-center gap-2">
									<span class="text-muted-foreground text-xs font-bold">{pull.id}</span>
									<span class="text-xs text-slate-500">•</span>
									<span class="text-foreground max-w-[120px] truncate text-xs font-semibold"
										>{pull.repo}</span
									>
								</div>

								<h4 class="text-foreground truncate pr-4 text-sm leading-snug font-semibold">
									{pull.title}
								</h4>

								<div
									class="text-muted-foreground flex flex-wrap items-center gap-2 text-xs font-light"
								>
									<FileCode class="h-3.5 w-3.5 shrink-0 text-slate-400" />
									<code class="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-[10px]"
										>{pull.branch}</code
									>
									<span class="text-slate-500">•</span>
									<span>by {pull.author}</span>
									<span class="text-slate-500">•</span>
									<span>{pull.date}</span>
								</div>
							</div>
						</div>

						<div class="flex shrink-0 items-center gap-4">
							<!-- Addition/Deletion Count -->
							<div class="hidden items-center gap-1.5 text-xs font-semibold md:flex">
								<span class="text-emerald-500">+{pull.additions}</span>
								<span class="text-rose-500">-{pull.deletions}</span>
							</div>

							<!-- Status Badge -->
							<Badge
								variant="outline"
								class="px-2 py-0.5 text-[10px] font-medium capitalize {statusColors[pull.status]}"
							>
								{pull.status}
							</Badge>

							<ChevronRight class="text-muted-foreground h-4 w-4" />
						</div>
					</div>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>
</div>
