<script lang="ts">
	import type { PageData } from './$types';
	import { browser } from '$app/environment';
	import {
		FolderGit2,
		Star,
		GitFork,
		Eye,
		BookOpen,
		Shield,
		Link2,
		Copy,
		Check,
		Clock,
		Layers,
		ShieldCheck,
		GitBranch,
		ArrowLeft,
		ArrowUpRight,
		Users2,
		Code2,
		Tag,
		ChevronLeft,
		ChevronRight,
		Activity
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { toasts } from '$lib/stores/toast';
	import * as echarts from 'echarts';

	let { data }: { data: PageData } = $props();

	// Active tab state
	let activeTab = $state<
		'overview' | 'commits' | 'branches' | 'contributors' | 'languages' | 'releases' | 'readme'
	>('overview');

	// Local copy status state
	let copySuccess = $state(false);

	// Derived fields from loader data
	let repo = $derived(data.repository);
	let languages = $derived(data.languages || []);
	let contributors = $derived(data.contributors || []);
	let branches = $derived(data.branches || []);
	let commits = $derived(data.commits || []);
	let releases = $derived(data.releases || []);
	let topics = $derived(data.topics || []);
	let readme = $derived(data.readme);

	// Pagination state for commits tab
	let commitPage = $state(1);
	const commitsPerPage = 10;
	let totalCommitPages = $derived(Math.ceil(commits.length / commitsPerPage));
	let paginatedCommits = $derived(
		commits.slice((commitPage - 1) * commitsPerPage, commitPage * commitsPerPage)
	);

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
		if (diffDays < 30) return `${diffDays}d ago`;
		return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
	}

	// Size converter
	function formatRepoSize(sizeKb: number | null): string {
		if (sizeKb === null) return 'Unknown';
		if (sizeKb < 1024) return `${sizeKb} KB`;
		return `${(sizeKb / 1024).toFixed(1)} MB`;
	}

	// Code copier helper
	function handleCopyCloneUrl() {
		const cloneUrl = `https://github.com/${repo.fullName}.git`;
		navigator.clipboard
			.writeText(cloneUrl)
			.then(() => {
				copySuccess = true;
				toasts.add('Clone URL copied to clipboard!', 'success');
				setTimeout(() => (copySuccess = false), 2000);
			})
			.catch(() => {
				toasts.add('Failed to copy to clipboard.', 'error');
			});
	}

	// ECharts Initialization for Language Chart in Overview
	let langChartDom: HTMLDivElement | null = $state(null);

	$effect(() => {
		if (browser && langChartDom && activeTab === 'overview' && languages.length > 0) {
			// Total bytes for percentage calculation (safeguard against division by zero)
			const totalBytes = languages.reduce((acc, curr) => acc + curr.bytes, 0) || 1;

			const chartData = languages.map((l) => ({
				name: l.language || 'Unknown',
				value: l.bytes,
				percentage: ((l.bytes / totalBytes) * 100).toFixed(1)
			}));

			// Safe ECharts initialization
			let chartInstance = echarts.getInstanceByDom(langChartDom);
			if (!chartInstance) {
				chartInstance = echarts.init(langChartDom);
			}

			const option = {
				tooltip: {
					trigger: 'item',
					formatter: '{b}: {c} bytes ({d}%)',
					backgroundColor: 'rgba(15, 23, 42, 0.9)',
					borderColor: 'rgba(255, 255, 255, 0.1)',
					borderWidth: 1,
					textStyle: {
						color: '#f8fafc',
						fontSize: 12
					}
				},
				legend: {
					orient: 'horizontal',
					bottom: '0',
					left: 'center',
					textStyle: {
						color: '#94a3b8',
						fontSize: 11
					},
					formatter: (name: string) => {
						const found = chartData.find((d) => d.name === name);
						return found ? `${name} (${found.percentage}%)` : name;
					}
				},
				series: [
					{
						name: 'Languages',
						type: 'pie',
						radius: ['35%', '60%'],
						center: ['50%', '42%'],
						avoidLabelOverlap: false,
						itemStyle: {
							borderRadius: 8,
							borderColor: 'rgba(255, 255, 255, 0.05)',
							borderWidth: 2
						},
						label: {
							show: false
						},
						emphasis: {
							label: {
								show: false
							}
						},
						data: chartData
					}
				],
				color: [
					'#3b82f6',
					'#f97316',
					'#06b6d4',
					'#10b981',
					'#ef4444',
					'#eab308',
					'#a855f7',
					'#64748b'
				]
			};

			chartInstance.setOption(option);
		}

		return () => {
			if (langChartDom) {
				const chartInstance = echarts.getInstanceByDom(langChartDom);
				if (chartInstance) {
					chartInstance.dispose();
				}
			}
		};
	});

	// ECharts breakdown for Languages tab
	let detailLangChartDom: HTMLDivElement | null = $state(null);
	let detailLangChart: echarts.ECharts | null = null;

	$effect(() => {
		if (browser && detailLangChartDom && activeTab === 'languages' && languages.length > 0) {
			detailLangChart = echarts.init(detailLangChartDom);

			const yData = [...languages].reverse().map((l) => l.language);
			const xData = [...languages].reverse().map((l) => l.bytes);

			const option = {
				tooltip: {
					trigger: 'axis',
					axisPointer: {
						type: 'shadow'
					},
					backgroundColor: 'rgba(15, 23, 42, 0.9)',
					borderColor: 'rgba(255, 255, 255, 0.1)',
					borderWidth: 1,
					textStyle: {
						color: '#f8fafc',
						fontSize: 12
					}
				},
				grid: {
					left: '3%',
					right: '8%',
					bottom: '3%',
					top: '3%',
					containLabel: true
				},
				xAxis: {
					type: 'value',
					name: 'Bytes',
					axisLabel: {
						color: '#94a3b8'
					},
					splitLine: {
						lineStyle: {
							color: 'rgba(148, 163, 184, 0.1)'
						}
					}
				},
				yAxis: {
					type: 'category',
					data: yData,
					axisLabel: {
						color: '#94a3b8'
					},
					axisTick: { show: false }
				},
				series: [
					{
						name: 'Size (Bytes)',
						type: 'bar',
						data: xData,
						barWidth: '50%',
						itemStyle: {
							color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
								{ offset: 0, color: '#3b82f6' },
								{ offset: 1, color: '#06b6d4' }
							]),
							borderRadius: [0, 4, 4, 0]
						}
					}
				]
			};

			detailLangChart.setOption(option);
		}

		return () => {
			if (detailLangChart) {
				detailLangChart.dispose();
				detailLangChart = null;
			}
		};
	});

	// Trigger manual redraw when window resizes
	if (browser) {
		window.addEventListener('resize', () => {
			if (langChartDom) {
				const chartInstance = echarts.getInstanceByDom(langChartDom);
				if (chartInstance) chartInstance.resize();
			}
			if (detailLangChart) detailLangChart.resize();
		});
	}
</script>

<div class="space-y-6 pb-12 select-none">
	<!-- Back Button and Quick Info -->
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<Button variant="ghost" class="gap-2 self-start rounded-xl" href="/repositories">
			<ArrowLeft class="h-4 w-4" />
			<span>Back to Repositories</span>
		</Button>

		{#if repo.pushedAt}
			<span class="text-muted-foreground flex items-center gap-1.5 self-end text-xs font-light">
				<Clock class="h-3.5 w-3.5 text-slate-500" />
				Last pushed:
				<span class="text-foreground font-semibold">{formatRelativeTime(repo.pushedAt)}</span>
			</span>
		{/if}
	</div>

	<!-- Top Details Header banner -->
	<div
		class="border-border from-card to-muted/20 space-y-6 rounded-2xl border bg-gradient-to-r p-6 shadow-sm"
	>
		<div class="flex flex-col justify-between gap-6 md:flex-row md:items-center">
			<!-- Title, Owner, Badges -->
			<div class="flex items-start gap-4">
				{#if repo.ownerAvatar}
					<img
						src={repo.ownerAvatar}
						alt={repo.owner || ''}
						class="border-border h-16 w-16 shrink-0 rounded-xl border shadow-md"
					/>
				{:else}
					<div class="shrink-0 rounded-xl bg-blue-500/10 p-4 text-blue-500 shadow-md">
						<FolderGit2 class="h-8 w-8" />
					</div>
				{/if}

				<div class="space-y-1.5">
					<div class="flex flex-wrap items-center gap-2">
						<h1 class="text-foreground text-2xl font-extrabold tracking-tight md:text-3xl">
							{repo.name}
						</h1>
						{#if repo.private}
							<Badge
								variant="outline"
								class="rounded-full border-rose-500/20 bg-rose-500/5 px-2 py-0 text-[10px] font-semibold text-rose-500"
							>
								<Shield class="mr-1 h-3 w-3" /> Private
							</Badge>
						{:else}
							<Badge
								variant="outline"
								class="rounded-full border-emerald-500/20 bg-emerald-500/5 px-2 py-0 text-[10px] font-semibold text-emerald-500"
							>
								<Eye class="mr-1 h-3 w-3" /> Public
							</Badge>
						{/if}

						{#if repo.license}
							<Badge
								variant="outline"
								class="border-border text-muted-foreground bg-muted/30 rounded-full px-2 py-0 text-[10px] font-medium"
							>
								{repo.license}
							</Badge>
						{/if}
					</div>
					<p class="text-muted-foreground text-sm font-light">
						Owner: <a
							href="https://github.com/{repo.owner}"
							target="_blank"
							rel="noopener noreferrer"
							class="text-primary font-medium hover:underline">@{repo.owner}</a
						>
					</p>
				</div>
			</div>

			<!-- Actions: Github page & Clone -->
			<div class="flex shrink-0 flex-wrap items-center gap-3">
				<div class="border-border bg-background flex items-center rounded-xl border p-1 shadow-sm">
					<span
						class="text-muted-foreground max-w-[200px] truncate px-3 font-mono text-xs select-all sm:max-w-xs"
					>
						git clone https://github.com/{repo.fullName}.git
					</span>
					<Button
						size="icon"
						variant="ghost"
						class="h-8 w-8 shrink-0 rounded-lg"
						onclick={handleCopyCloneUrl}
					>
						{#if copySuccess}
							<Check class="h-3.5 w-3.5 text-emerald-500" />
						{:else}
							<Copy class="text-muted-foreground h-3.5 w-3.5" />
						{/if}
					</Button>
				</div>

				<Button
					class="gap-2 rounded-xl shadow-sm"
					href="https://github.com/{repo.fullName}"
					target="_blank"
					rel="noopener noreferrer"
				>
					<span>View on GitHub</span>
					<ArrowUpRight class="h-4 w-4" />
				</Button>
			</div>
		</div>

		<!-- Quick stats tags bar -->
		<div
			class="border-border/50 text-muted-foreground grid grid-cols-2 gap-4 border-t pt-6 text-xs font-medium sm:grid-cols-3 md:grid-cols-6"
		>
			<div
				class="border-border bg-card/45 flex flex-col gap-1 rounded-xl border p-3 backdrop-blur-sm"
			>
				<span class="font-light text-slate-400">Language</span>
				<div class="text-foreground mt-0.5 flex items-center gap-1.5 font-bold">
					<Code2 class="h-4 w-4 text-blue-500" />
					<span>{repo.language || 'Unknown'}</span>
				</div>
			</div>

			<div
				class="border-border bg-card/45 flex flex-col gap-1 rounded-xl border p-3 backdrop-blur-sm"
			>
				<span class="font-light text-slate-400">Stars</span>
				<div class="text-foreground mt-0.5 flex items-center gap-1.5 font-bold">
					<Star class="h-4 w-4 fill-amber-500/10 text-amber-500" />
					<span>{repo.stars || 0}</span>
				</div>
			</div>

			<div
				class="border-border bg-card/45 flex flex-col gap-1 rounded-xl border p-3 backdrop-blur-sm"
			>
				<span class="font-light text-slate-400">Forks</span>
				<div class="text-foreground mt-0.5 flex items-center gap-1.5 font-bold">
					<GitFork class="h-4 w-4 text-sky-500" />
					<span>{repo.forks || 0}</span>
				</div>
			</div>

			<div
				class="border-border bg-card/45 flex flex-col gap-1 rounded-xl border p-3 backdrop-blur-sm"
			>
				<span class="font-light text-slate-400">Watchers</span>
				<div class="text-foreground mt-0.5 flex items-center gap-1.5 font-bold">
					<Eye class="h-4 w-4 text-purple-500" />
					<span>{repo.watchers || 0}</span>
				</div>
			</div>

			<div
				class="border-border bg-card/45 flex flex-col gap-1 rounded-xl border p-3 backdrop-blur-sm"
			>
				<span class="font-light text-slate-400">Size</span>
				<div class="text-foreground mt-0.5 flex items-center gap-1.5 font-bold">
					<Layers class="h-4 w-4 text-emerald-500" />
					<span>{formatRepoSize(repo.size)}</span>
				</div>
			</div>

			<div
				class="border-border bg-card/45 flex flex-col gap-1 rounded-xl border p-3 backdrop-blur-sm"
			>
				<span class="font-light text-slate-400">Default Branch</span>
				<div class="text-foreground mt-0.5 flex items-center gap-1.5 font-mono font-bold">
					<GitBranch class="h-4 w-4 text-amber-600" />
					<span>{repo.defaultBranch || 'main'}</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Custom styled Tabs Navigation -->
	<div class="border-border border-b">
		<nav class="flex space-x-1 overflow-x-auto sm:space-x-4" aria-label="Tabs">
			{#each [{ id: 'overview', label: 'Overview', icon: Activity }, { id: 'readme', label: 'README', icon: BookOpen }, { id: 'commits', label: 'Commits', icon: Clock }, { id: 'branches', label: 'Branches', icon: GitBranch }, { id: 'contributors', label: 'Contributors', icon: Users2 }, { id: 'languages', label: 'Languages', icon: Code2 }, { id: 'releases', label: 'Releases', icon: Tag }] as tab (tab.id)}
				{@const Icon = tab.icon}
				<button
					onclick={() => (activeTab = tab.id as any)}
					class="group flex shrink-0 items-center gap-2 border-b-2 px-3 py-4 text-sm font-semibold transition sm:px-4 {activeTab ===
					tab.id
						? 'border-primary text-primary'
						: 'text-muted-foreground hover:text-foreground hover:border-border border-transparent'}"
				>
					<Icon
						class="h-4 w-4 shrink-0 transition-colors {activeTab === tab.id
							? 'text-primary'
							: 'text-muted-foreground group-hover:text-foreground'}"
					/>
					<span>{tab.label}</span>
				</button>
			{/each}
		</nav>
	</div>

	<!-- Tab Panels -->
	<div class="mt-4">
		<!-- 1. OVERVIEW TAB -->
		{#if activeTab === 'overview'}
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<!-- Left columns (2/3 width) -->
				<div class="space-y-6 lg:col-span-2">
					<!-- Description -->
					<Card.Root>
						<Card.Header class="pb-3">
							<Card.Title class="text-lg font-bold">Repository Description</Card.Title>
						</Card.Header>
						<Card.Content>
							<p class="text-foreground/80 text-sm leading-relaxed font-light">
								{repo.description || 'No description provided for this repository.'}
							</p>
							{#if repo.homepage}
								<div class="text-primary mt-4 flex items-center gap-2 text-sm">
									<Link2 class="h-4 w-4" />
									<a
										href={repo.homepage}
										target="_blank"
										rel="noopener noreferrer"
										class="font-medium break-all hover:underline">{repo.homepage}</a
									>
								</div>
							{/if}
						</Card.Content>
					</Card.Root>

					<!-- Recent Commits -->
					<Card.Root>
						<Card.Header class="flex flex-row items-center justify-between pb-3">
							<Card.Title class="text-lg font-bold">Recent Commits</Card.Title>
							<Button
								variant="ghost"
								class="text-primary text-xs"
								onclick={() => (activeTab = 'commits')}>View all</Button
							>
						</Card.Header>
						<Card.Content class="p-0">
							{#if commits.length === 0}
								<div class="text-muted-foreground p-8 text-center text-sm font-light">
									No commits synced yet.
								</div>
							{:else}
								<div class="divide-border/60 divide-y">
									{#each commits.slice(0, 5) as commit (commit.sha)}
										<div class="hover:bg-muted/10 flex items-start gap-4 p-4 transition">
											<Avatar.Root class="border-border h-8 w-8 rounded-full border">
												<Avatar.Image src={commit.avatarUrl} alt={commit.author} />
												<Avatar.Fallback class="bg-primary/10 text-primary text-xs font-bold">
													{commit.author.charAt(0).toUpperCase()}
												</Avatar.Fallback>
											</Avatar.Root>

											<div class="min-w-0 flex-1 space-y-1">
												<div class="flex items-center justify-between gap-4">
													<p class="text-foreground truncate text-sm font-semibold">
														{commit.message}
													</p>
													<span
														class="text-muted-foreground bg-muted border-border shrink-0 rounded border px-2 py-0.5 font-mono text-xs"
														>{commit.sha.substring(0, 7)}</span
													>
												</div>
												<div
													class="text-muted-foreground flex items-center gap-2 text-xs font-light"
												>
													<span class="text-foreground font-medium">{commit.author}</span>
													<span>•</span>
													<span>{formatRelativeTime(commit.commitDate)}</span>
													<span>in</span>
													<span class="font-mono font-semibold text-slate-500">{commit.branch}</span
													>
												</div>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</Card.Content>
					</Card.Root>
				</div>

				<!-- Right column (1/3 width) -->
				<div class="space-y-6">
					<!-- Languages Pie Chart -->
					<Card.Root>
						<Card.Header class="pb-2">
							<Card.Title class="text-base font-bold">Languages</Card.Title>
						</Card.Header>
						<Card.Content>
							{#if languages.length === 0}
								<div
									class="text-muted-foreground flex h-48 items-center justify-center text-sm font-light"
								>
									No languages breakdown found.
								</div>
							{:else}
								<div bind:this={langChartDom} class="h-56 w-full"></div>
							{/if}
						</Card.Content>
					</Card.Root>

					<!-- Topics / Tags -->
					<Card.Root>
						<Card.Header class="pb-2">
							<Card.Title class="text-base font-bold">Topics</Card.Title>
						</Card.Header>
						<Card.Content>
							{#if topics.length === 0}
								<p class="text-muted-foreground text-sm font-light">
									No topics associated with this repository.
								</p>
							{:else}
								<div class="flex flex-wrap gap-2">
									{#each topics as topic (topic)}
										<Badge
											variant="outline"
											class="border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 rounded-lg px-2.5 py-1 text-xs transition-colors"
										>
											{topic}
										</Badge>
									{/each}
								</div>
							{/if}
						</Card.Content>
					</Card.Root>

					<!-- Top Contributors Overview -->
					<Card.Root>
						<Card.Header class="flex flex-row items-center justify-between pb-2">
							<Card.Title class="text-base font-bold">Top Contributors</Card.Title>
							<Button
								variant="ghost"
								class="text-primary text-xs"
								onclick={() => (activeTab = 'contributors')}>View all</Button
							>
						</Card.Header>
						<Card.Content class="space-y-4">
							{#if contributors.length === 0}
								<p class="text-muted-foreground text-sm font-light">No contributors synced.</p>
							{:else}
								{#each contributors.slice(0, 3) as c (c.username)}
									<div class="flex items-center justify-between text-sm">
										<div class="flex items-center gap-2">
											<Avatar.Root class="border-border h-8 w-8 border">
												<Avatar.Image src={c.avatarUrl} alt={c.username} />
												<Avatar.Fallback class="bg-primary/5 text-primary text-xs font-bold"
													>{c.username.charAt(0).toUpperCase()}</Avatar.Fallback
												>
											</Avatar.Root>
											<a
												href={c.profileLink}
												target="_blank"
												rel="noopener noreferrer"
												class="text-foreground font-semibold hover:underline">@{c.username}</a
											>
										</div>
										<span
											class="text-muted-foreground bg-muted border-border/50 rounded-full border px-2.5 py-1 text-xs font-medium"
											>{c.contributions} commits</span
										>
									</div>
								{/each}
							{/if}
						</Card.Content>
					</Card.Root>

					<!-- Latest Release -->
					<Card.Root>
						<Card.Header class="flex flex-row items-center justify-between pb-2">
							<Card.Title class="text-base font-bold">Latest Release</Card.Title>
							<Button
								variant="ghost"
								class="text-primary text-xs"
								onclick={() => (activeTab = 'releases')}>View all</Button
							>
						</Card.Header>
						<Card.Content>
							{#if releases.length === 0}
								<p class="text-muted-foreground text-xs font-light">No releases tracked.</p>
							{:else}
								{@const lr = releases[0]}
								<div class="space-y-2">
									<div class="flex items-center gap-2">
										<Badge
											variant="default"
											class="rounded-lg bg-emerald-600 font-mono text-xs font-bold text-white hover:bg-emerald-500"
											>{lr.tagName}</Badge
										>
										{#if lr.isPrerelease}
											<Badge
												variant="outline"
												class="rounded-full border-rose-400/20 bg-rose-500/5 text-[10px] font-semibold text-rose-500"
												>Pre-release</Badge
											>
										{/if}
									</div>
									<h4 class="text-foreground truncate text-sm font-bold">
										{lr.name || lr.tagName}
									</h4>
									<p class="text-muted-foreground text-xs font-light">
										Published {formatRelativeTime(lr.publishedAt)}
									</p>
								</div>
							{/if}
						</Card.Content>
					</Card.Root>
				</div>
			</div>
		{/if}

		<!-- 2. COMMITS TAB -->
		{#if activeTab === 'commits'}
			<Card.Root class="bg-card border-border shadow-md">
				<Card.Header class="flex flex-col justify-between gap-4 pb-3 sm:flex-row sm:items-center">
					<div>
						<Card.Title class="text-lg font-bold">Latest Commits ({commits.length})</Card.Title>
						<p class="text-muted-foreground text-xs font-light">
							Historical records for the repository default branch.
						</p>
					</div>
				</Card.Header>
				<Card.Content class="p-0">
					{#if commits.length === 0}
						<div class="text-muted-foreground p-12 text-center text-sm font-light">
							No commits available in database.
						</div>
					{:else}
						<div class="overflow-x-auto">
							<table class="w-full border-collapse text-left text-sm">
								<thead>
									<tr
										class="border-border/80 text-muted-foreground bg-muted/20 border-b text-xs font-semibold"
									>
										<th class="p-4 pl-6">Commit Info</th>
										<th class="p-4">Message</th>
										<th class="p-4">Author</th>
										<th class="p-4">Date</th>
										<th class="p-4 pr-6 text-right">SHA</th>
									</tr>
								</thead>
								<tbody class="divide-border/60 divide-y">
									{#each paginatedCommits as commit (commit.sha)}
										<tr class="hover:bg-muted/10 transition">
											<!-- Branch Badge & Avatar -->
											<td class="p-4 pl-6 font-medium">
												<div class="flex items-center gap-2">
													<Badge
														variant="outline"
														class="bg-muted/40 shrink-0 rounded-full px-2 font-mono text-[9px] font-semibold text-slate-500"
													>
														{commit.branch}
													</Badge>
												</div>
											</td>

											<!-- Commit message -->
											<td class="text-foreground max-w-sm truncate p-4 font-semibold">
												{commit.message}
											</td>

											<!-- Author info -->
											<td class="p-4">
												<div class="flex items-center gap-2.5">
													<Avatar.Root class="border-border h-6 w-6 shrink-0 rounded-full border">
														<Avatar.Image src={commit.avatarUrl} alt={commit.author} />
														<Avatar.Fallback
															class="bg-primary/5 text-primary text-[10px] font-bold"
														>
															{commit.author.charAt(0).toUpperCase()}
														</Avatar.Fallback>
													</Avatar.Root>
													<span class="text-foreground max-w-[120px] truncate font-medium"
														>{commit.author}</span
													>
												</div>
											</td>

											<!-- Date -->
											<td class="text-muted-foreground p-4 text-xs font-light">
												{new Date(commit.commitDate).toLocaleString([], {
													dateStyle: 'medium',
													timeStyle: 'short'
												})}
											</td>

											<!-- SHA code -->
											<td
												class="p-4 pr-6 text-right font-mono text-xs font-semibold text-slate-500 select-all"
											>
												{commit.sha.substring(0, 7)}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>

						<!-- Pagination Footer -->
						{#if totalCommitPages > 1}
							<div
								class="border-border text-muted-foreground flex items-center justify-between border-t p-4 px-6 text-xs font-semibold"
							>
								<span
									>Showing {(commitPage - 1) * commitsPerPage + 1} - {Math.min(
										commitPage * commitsPerPage,
										commits.length
									)} of {commits.length} commits</span
								>

								<div class="flex items-center gap-2">
									<Button
										variant="outline"
										size="icon"
										class="h-8 w-8 rounded-lg"
										disabled={commitPage === 1}
										onclick={() => commitPage--}
									>
										<ChevronLeft class="h-4 w-4" />
									</Button>

									<span class="font-medium">Page {commitPage} of {totalCommitPages}</span>

									<Button
										variant="outline"
										size="icon"
										class="h-8 w-8 rounded-lg"
										disabled={commitPage === totalCommitPages}
										onclick={() => commitPage++}
									>
										<ChevronRight class="h-4 w-4" />
									</Button>
								</div>
							</div>
						{/if}
					{/if}
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- 3. BRANCHES TAB -->
		{#if activeTab === 'branches'}
			<Card.Root>
				<Card.Header class="pb-3">
					<Card.Title class="text-lg font-bold">Branches ({branches.length})</Card.Title>
					<p class="text-muted-foreground text-xs font-light">
						Branch protection flags and synced configurations.
					</p>
				</Card.Header>
				<Card.Content class="p-0">
					{#if branches.length === 0}
						<div class="text-muted-foreground p-12 text-center text-sm font-light">
							No branch records synced.
						</div>
					{:else}
						<div class="overflow-x-auto">
							<table class="w-full border-collapse text-left text-sm">
								<thead>
									<tr
										class="border-border/80 text-muted-foreground bg-muted/20 border-b text-xs font-semibold"
									>
										<th class="p-4 pl-6">Branch Name</th>
										<th class="p-4">Type</th>
										<th class="p-4">Protection</th>
										<th class="p-4">Last Commit SHA</th>
										<th class="p-4 pr-6 text-right">Ahead/Behind</th>
									</tr>
								</thead>
								<tbody class="divide-border/60 divide-y">
									{#each branches as branch (branch.name)}
										<tr class="hover:bg-muted/10 transition">
											<td class="text-foreground p-4 pl-6 font-mono font-bold">
												{branch.name}
											</td>

											<!-- Type Default or Feature -->
											<td class="p-4">
												{#if branch.isDefault}
													<Badge
														class="rounded-lg bg-amber-600 px-2 font-mono text-[10px] text-white hover:bg-amber-500"
														>Default Branch</Badge
													>
												{:else}
													<Badge
														variant="outline"
														class="border-border text-muted-foreground bg-muted/20 rounded-lg px-2 text-[10px]"
														>Feature</Badge
													>
												{/if}
											</td>

											<!-- Protected -->
											<td class="p-4">
												{#if branch.protected}
													<Badge
														variant="outline"
														class="rounded-full border-emerald-500/20 bg-emerald-500/5 text-[10px] font-semibold text-emerald-500"
													>
														<ShieldCheck class="mr-1 h-3.5 w-3.5" /> Protected
													</Badge>
												{:else}
													<Badge
														variant="outline"
														class="bg-muted/40 rounded-full border-slate-500/20 text-[10px] text-slate-400"
													>
														None
													</Badge>
												{/if}
											</td>

											<!-- Last Commit SHA -->
											<td class="p-4 font-mono text-xs font-semibold text-slate-500">
												{branch.lastCommitSha.substring(0, 7)}
											</td>

											<!-- Ahead/Behind Placeholder -->
											<td class="text-muted-foreground p-4 pr-6 text-right text-xs font-light">
												<span
													class="bg-muted/50 border-border/40 inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[10px]"
												>
													0 ahead / 0 behind
												</span>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- 4. CONTRIBUTORS TAB -->
		{#if activeTab === 'contributors'}
			<Card.Root>
				<Card.Header class="pb-4">
					<Card.Title class="text-lg font-bold">Contributors ({contributors.length})</Card.Title>
					<p class="text-muted-foreground text-xs font-light">
						List of authors contributing to the repository commits.
					</p>
				</Card.Header>
				<Card.Content>
					{#if contributors.length === 0}
						<div class="text-muted-foreground p-12 text-center text-sm font-light">
							No contributors synced.
						</div>
					{:else}
						<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
							{#each contributors as c (c.username)}
								<div
									class="border-border bg-card/45 hover:border-primary/20 flex items-center gap-4 rounded-xl border p-4 shadow-sm transition-all duration-300 hover:shadow-md"
								>
									<Avatar.Root class="border-border h-12 w-12 shrink-0 rounded-lg border shadow-sm">
										<Avatar.Image src={c.avatarUrl} alt={c.username} />
										<Avatar.Fallback class="bg-primary/5 text-primary rounded-lg text-sm font-bold">
											{c.username.charAt(0).toUpperCase()}
										</Avatar.Fallback>
									</Avatar.Root>

									<div class="min-w-0 space-y-1">
										<h4 class="text-foreground truncate text-sm font-bold">
											<a
												href={c.profileLink}
												target="_blank"
												rel="noopener noreferrer"
												class="hover:underline">@{c.username}</a
											>
										</h4>
										<p class="text-muted-foreground text-xs font-medium">
											{c.contributions} contributions
										</p>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- 5. LANGUAGES TAB -->
		{#if activeTab === 'languages'}
			<Card.Root>
				<Card.Header class="pb-3">
					<Card.Title class="text-lg font-bold">Languages breakdown</Card.Title>
					<p class="text-muted-foreground text-xs font-light">
						Bytes usage breakdown compiled by GitHub API.
					</p>
				</Card.Header>
				<Card.Content class="space-y-8">
					{#if languages.length === 0}
						<div class="text-muted-foreground p-12 text-center text-sm font-light">
							No language data found.
						</div>
					{:else}
						<!-- Horizontal Stacked Percentages Bar -->
						{@const totalBytes = languages.reduce((acc, curr) => acc + curr.bytes, 0)}
						<div class="space-y-3">
							<div class="bg-muted flex h-4 w-full overflow-hidden rounded-full shadow-inner">
								{#each languages as l, idx (l.language)}
									{@const pct = (l.bytes / totalBytes) * 100}
									<div
										class="h-full transition-opacity first:rounded-l-full last:rounded-r-full hover:opacity-90"
										style="width: {pct}%; background-color: {idx === 0
											? '#3b82f6'
											: idx === 1
												? '#f97316'
												: idx === 2
													? '#06b6d4'
													: idx === 3
														? '#10b981'
														: idx === 4
															? '#ef4444'
															: idx === 5
																? '#eab308'
																: '#64748b'}"
										title="{l.language}: {pct.toFixed(1)}%"
									></div>
								{/each}
							</div>

							<div class="text-muted-foreground flex flex-wrap gap-4 text-xs font-semibold">
								{#each languages as l, idx (l.language)}
									{@const pct = (l.bytes / totalBytes) * 100}
									<div class="flex items-center gap-1.5">
										<span
											class="h-2.5 w-2.5 shrink-0 rounded-full"
											style="background-color: {idx === 0
												? '#3b82f6'
												: idx === 1
													? '#f97316'
													: idx === 2
														? '#06b6d4'
														: idx === 3
															? '#10b981'
															: idx === 4
																? '#ef4444'
																: idx === 5
																	? '#eab308'
																	: '#64748b'}"
										></span>
										<span class="text-foreground">{l.language}</span>
										<span class="text-[11px] font-light">({pct.toFixed(1)}%)</span>
									</div>
								{/each}
							</div>
						</div>

						<!-- ECharts Bar Chart Visualization -->
						<div class="border-border border-t pt-6">
							<h4 class="text-foreground mb-4 text-sm font-bold">Volume Distribution (Bytes)</h4>
							<div bind:this={detailLangChartDom} class="h-80 w-full"></div>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- 6. RELEASES TAB -->
		{#if activeTab === 'releases'}
			<Card.Root>
				<Card.Header class="pb-3">
					<Card.Title class="text-lg font-bold">Repository Releases ({releases.length})</Card.Title>
					<p class="text-muted-foreground text-xs font-light">
						Version milestones and notes synced from GitHub.
					</p>
				</Card.Header>
				<Card.Content class="space-y-6">
					{#if releases.length === 0}
						<div class="text-muted-foreground p-12 text-center text-sm font-light">
							No releases recorded.
						</div>
					{:else}
						{#each releases as r (r.id)}
							<div
								class="border-border bg-card/45 hover:border-primary/20 space-y-4 rounded-xl border p-6 shadow-sm transition-all duration-300"
							>
								<div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
									<div class="flex items-center gap-2">
										<h4 class="text-foreground text-base font-extrabold">{r.name || r.tagName}</h4>
										<Badge class="rounded-lg bg-blue-600 font-mono text-xs font-bold text-white"
											>{r.tagName}</Badge
										>
										{#if r.isDraft}
											<Badge
												variant="outline"
												class="rounded-full border-amber-400/20 bg-amber-500/5 text-[10px] font-semibold text-amber-500"
												>Draft</Badge
											>
										{/if}
										{#if r.isPrerelease}
											<Badge
												variant="outline"
												class="rounded-full border-rose-400/20 bg-rose-500/5 text-[10px] font-semibold text-rose-500"
												>Pre-release</Badge
											>
										{/if}
									</div>

									{#if r.publishedAt}
										<span class="text-muted-foreground shrink-0 text-xs font-light">
											Published {new Date(r.publishedAt).toLocaleDateString([], {
												dateStyle: 'long'
											})}
										</span>
									{/if}
								</div>

								{#if r.body}
									<div
										class="text-foreground/80 bg-muted/30 border-border/50 max-h-48 overflow-y-auto rounded-lg border p-4 font-mono text-sm text-xs leading-relaxed font-light whitespace-pre-wrap"
									>
										{r.body}
									</div>
								{:else}
									<p class="text-muted-foreground text-xs font-light italic">
										No release notes provided.
									</p>
								{/if}
							</div>
						{/each}
					{/if}
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- 7. README TAB -->
		{#if activeTab === 'readme'}
			<Card.Root>
				<Card.Content class="p-6 md:p-10">
					{#if !readme || !readme.html}
						<div class="text-muted-foreground p-12 text-center text-sm font-light">
							No README.md content cached. Try running sync.
						</div>
					{:else}
						<!-- GitHub Markdown Styled Container -->
						<article
							class="readme-content prose dark:prose-invert text-foreground max-w-none leading-relaxed"
						>
							<!-- Inject parsed HTML safely -->
							{@html readme.html}
						</article>
					{/if}
				</Card.Content>
			</Card.Root>
		{/if}
	</div>
</div>

<style>
	/* Premium styling for Markdown Readme rendering */
	:global(.readme-content) {
		font-family:
			ui-sans-serif,
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			Roboto,
			'Helvetica Neue',
			Arial,
			sans-serif;
		font-size: 0.95rem;
	}
	:global(.readme-content h1) {
		font-size: 1.85rem;
		font-weight: 800;
		border-bottom: 1px solid rgba(148, 163, 184, 0.25);
		padding-bottom: 0.5rem;
		margin-top: 1.5rem;
		margin-bottom: 1rem;
		color: hsl(var(--foreground));
	}
	:global(.readme-content h2) {
		font-size: 1.45rem;
		font-weight: 700;
		border-bottom: 1px solid rgba(148, 163, 184, 0.2);
		padding-bottom: 0.4rem;
		margin-top: 1.5rem;
		margin-bottom: 0.8rem;
		color: hsl(var(--foreground));
	}
	:global(.readme-content h3) {
		font-size: 1.2rem;
		font-weight: 600;
		margin-top: 1.25rem;
		margin-bottom: 0.6rem;
		color: hsl(var(--foreground));
	}
	:global(.readme-content p) {
		margin-bottom: 1rem;
		line-height: 1.7;
		color: hsl(var(--foreground) / 0.85);
		font-weight: 300;
	}
	:global(.readme-content code) {
		font-family:
			ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
			monospace;
		font-size: 0.85em;
		background-color: rgba(148, 163, 184, 0.15);
		padding: 0.2em 0.4em;
		border-radius: 4px;
		color: hsl(var(--foreground));
	}
	:global(.readme-content pre) {
		background-color: rgba(15, 23, 42, 0.03);
		border: 1px solid rgba(148, 163, 184, 0.2);
		padding: 1rem;
		border-radius: 8px;
		overflow-x: auto;
		margin-bottom: 1rem;
	}
	:global(html.dark .readme-content pre) {
		background-color: rgba(15, 23, 42, 0.55);
	}
	:global(.readme-content pre code) {
		background-color: transparent;
		padding: 0;
		border-radius: 0;
		color: inherit;
	}
	:global(.readme-content ul, .readme-content ol) {
		margin-bottom: 1rem;
		padding-left: 1.5rem;
		color: hsl(var(--foreground) / 0.85);
	}
	:global(.readme-content ul) {
		list-style-type: disc;
	}
	:global(.readme-content ol) {
		list-style-type: decimal;
	}
	:global(.readme-content li) {
		margin-bottom: 0.25rem;
		font-weight: 300;
	}
	:global(.readme-content img) {
		max-width: 100%;
		height: auto;
		border-radius: 8px;
		margin-top: 1rem;
		margin-bottom: 1rem;
		border: 1px solid rgba(148, 163, 184, 0.25);
	}
	:global(.readme-content table) {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 1rem;
		font-size: 0.9em;
	}
	:global(.readme-content th, .readme-content td) {
		border: 1px solid rgba(148, 163, 184, 0.3);
		padding: 0.5rem 0.75rem;
	}
	:global(.readme-content th) {
		background-color: rgba(148, 163, 184, 0.1);
		font-weight: 600;
	}
	:global(.readme-content blockquote) {
		border-left: 4px solid rgba(59, 130, 246, 0.6);
		padding-left: 1rem;
		color: hsl(var(--muted-foreground));
		font-style: italic;
		margin-bottom: 1rem;
	}
</style>
