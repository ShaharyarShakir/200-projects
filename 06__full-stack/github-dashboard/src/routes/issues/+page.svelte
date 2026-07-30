<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Bug, Clock, ChevronRight, User } from 'lucide-svelte';

	// Mock issues list
	const issues = [
		{
			id: '#1024',
			title: 'Database connection leak under peak memory loads',
			repo: 'gitdash-core',
			status: 'open',
			priority: 'high',
			assignee: 'Jane Smith',
			date: '2 hours ago'
		},
		{
			id: '#1021',
			title: 'GitHub OAuth token refresh loop on browser close',
			repo: 'gitdash-auth',
			status: 'open',
			priority: 'high',
			assignee: 'John Doe',
			date: '5 hours ago'
		},
		{
			id: '#988',
			title: 'Tailwind styling regression on mobile sidebar component',
			repo: 'gitdash-ui',
			status: 'in-progress',
			priority: 'medium',
			assignee: 'Alex Johnson',
			date: '1 day ago'
		},
		{
			id: '#940',
			title: 'Analytics query optimization for large repository sets',
			repo: 'gitdash-core',
			status: 'open',
			priority: 'low',
			assignee: 'Jane Smith',
			date: '3 days ago'
		},
		{
			id: '#890',
			title: 'Resolve ESLint warnings inside server routing hooks',
			repo: 'gitdash-core',
			status: 'closed',
			priority: 'low',
			assignee: 'Unassigned',
			date: '1 week ago'
		}
	];

	const priorityColors: Record<string, string> = {
		high: 'border-red-500/20 text-red-500 bg-red-500/5',
		medium: 'border-amber-500/20 text-amber-500 bg-amber-500/5',
		low: 'border-blue-500/20 text-blue-500 bg-blue-500/5'
	};

	const statusColors: Record<string, string> = {
		open: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
		'in-progress': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
		closed: 'bg-slate-500/10 text-slate-500 border-slate-500/20'
	};
</script>

<div class="space-y-8 select-none">
	<!-- Page Heading -->
	<div class="flex flex-col gap-1.5">
		<h2
			class="from-foreground to-foreground/80 bg-gradient-to-r bg-clip-text text-3xl font-extrabold tracking-tight"
		>
			Issues
		</h2>
		<p class="text-muted-foreground text-sm font-light">
			Monitor active error reports, developer action tasks, and status resolutions.
		</p>
	</div>

	<!-- Stats Overview -->
	<div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Title class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
					>Open Issues</Card.Title
				>
			</Card.Header>
			<Card.Content>
				<div class="text-3xl font-bold text-emerald-500">3</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Title class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
					>In Progress</Card.Title
				>
			</Card.Header>
			<Card.Content>
				<div class="text-3xl font-bold text-blue-500">1</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Title class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
					>Resolved (7d)</Card.Title
				>
			</Card.Header>
			<Card.Content>
				<div class="text-3xl font-bold text-slate-500">12</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Issues List -->
	<Card.Root class="bg-card">
		<Card.Header>
			<Card.Title class="text-lg font-bold">Tracked Issues</Card.Title>
		</Card.Header>
		<Card.Content class="p-0">
			<div class="divide-border/60 divide-y">
				{#each issues as issue (issue.id)}
					<div
						class="hover:bg-muted/30 flex items-center justify-between gap-4 p-4 transition duration-150 md:px-6"
					>
						<div class="flex min-w-0 items-start gap-3">
							<div class="bg-muted text-muted-foreground mt-0.5 shrink-0 rounded-lg p-1.5">
								<Bug class="h-4 w-4" />
							</div>
							<div class="min-w-0 space-y-1">
								<div class="flex flex-wrap items-center gap-2">
									<span class="text-muted-foreground text-xs font-bold">{issue.id}</span>
									<span class="text-xs text-slate-500">•</span>
									<span class="text-foreground max-w-[120px] truncate text-xs font-semibold"
										>{issue.repo}</span
									>
								</div>
								<h4 class="text-foreground truncate pr-4 text-sm leading-snug font-semibold">
									{issue.title}
								</h4>
								<div class="text-muted-foreground flex items-center gap-2 text-xs font-light">
									<Clock class="h-3.5 w-3.5" />
									<span>Reported {issue.date}</span>
									<span class="text-[10px]">•</span>
									<div class="flex items-center gap-1">
										<User class="h-3.5 w-3.5 text-slate-500" />
										<span>{issue.assignee}</span>
									</div>
								</div>
							</div>
						</div>

						<div class="flex shrink-0 items-center gap-3">
							<!-- Priority Badge -->
							<Badge
								variant="outline"
								class="hidden px-2 py-0.5 text-[10px] font-medium capitalize sm:inline-flex {priorityColors[
									issue.priority
								]}"
							>
								{issue.priority}
							</Badge>

							<!-- Status Badge -->
							<Badge
								variant="outline"
								class="px-2 py-0.5 text-[10px] font-medium capitalize {statusColors[issue.status]}"
							>
								{issue.status}
							</Badge>

							<ChevronRight class="text-muted-foreground h-4 w-4" />
						</div>
					</div>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>
</div>
