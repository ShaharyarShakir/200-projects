<script lang="ts">
	import type { PageData } from './$types';
	import { browser } from '$app/environment';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Activity, TrendingUp, Layers, Star, Calendar, Percent } from 'lucide-svelte';
	import * as echarts from 'echarts';

	let { data }: { data: PageData } = $props();

	// Derived aggregates from page database statistics
	let totalRepos = $derived(data.repositories?.length || 0);
	let totalStars = $derived(data.repositories?.reduce((acc, r) => acc + (r.stars || 0), 0) || 0);
	let totalForks = $derived(data.repositories?.reduce((acc, r) => acc + (r.forks || 0), 0) || 0);
	let totalCommits = $derived(data.commits?.length || 0);

	// 1. Commits per Month dataset
	const commitsPerMonth = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const c of data.commits || []) {
			if (!c.commitDate) continue;
			const date = new Date(c.commitDate);
			const monthStr = date.toLocaleString('en-US', { year: 'numeric', month: 'short' });
			counts[monthStr] = (counts[monthStr] || 0) + 1;
		}
		const sortedMonths = Object.keys(counts).sort(
			(a, b) => new Date(a).getTime() - new Date(b).getTime()
		);
		return {
			labels: sortedMonths,
			data: sortedMonths.map((m) => counts[m])
		};
	});

	// 2. Repository Growth dataset (cumulative line)
	const repositoryGrowth = $derived.by(() => {
		const sorted = [...(data.repositories || [])].sort((a, b) => {
			const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
			const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
			return da - db;
		});
		const labels: string[] = [];
		const values: number[] = [];
		let cumulative = 0;
		for (const r of sorted) {
			if (!r.createdAt) continue;
			cumulative++;
			const dateStr = new Date(r.createdAt).toLocaleDateString([], {
				year: 'numeric',
				month: 'short'
			});
			labels.push(dateStr);
			values.push(cumulative);
		}
		return { labels, data: values };
	});

	// 3. Language Usage dataset
	const languageUsage = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const r of data.repositories || []) {
			const lang = r.language || 'Unknown';
			counts[lang] = (counts[lang] || 0) + 1;
		}
		return Object.entries(counts).map(([name, value]) => ({ name, value }));
	});

	// 4. Weekly Contribution Trend dataset
	const weeklyCommitsTrend = $derived.by(() => {
		const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		const counts = Array(7).fill(0);
		for (const c of data.commits || []) {
			if (!c.commitDate) continue;
			const dayIdx = new Date(c.commitDate).getDay();
			counts[dayIdx]++;
		}
		return { labels: days, data: counts };
	});

	// 5. Repository Size Comparison dataset
	const repositorySizes = $derived.by(() => {
		const sorted = [...(data.repositories || [])]
			.sort((a, b) => (b.size || 0) - (a.size || 0))
			.slice(0, 8);
		return {
			labels: sorted.map((r) => r.name),
			data: sorted.map((r) => parseFloat(((r.size || 0) / 1024).toFixed(2))) // Size in MB
		};
	});

	// 6. Stars & Fork Growth Bubble chart dataset
	const starsVsForks = $derived.by(() => {
		return (data.repositories || []).map((r) => ({
			name: r.name,
			value: [r.forks || 0, r.stars || 0, r.openIssues || 0]
		}));
	});

	// DOM chart element bindings
	let commitsChartDom: HTMLDivElement | null = $state(null);
	let growthChartDom: HTMLDivElement | null = $state(null);
	let langChartDom: HTMLDivElement | null = $state(null);
	let trendChartDom: HTMLDivElement | null = $state(null);
	let sizeChartDom: HTMLDivElement | null = $state(null);
	let bubbleChartDom: HTMLDivElement | null = $state(null);

	// Safe browser ECharts initialization
	$effect(() => {
		let chartsList: echarts.ECharts[] = [];

		if (browser) {
			// Commits per Month Chart
			if (commitsChartDom && commitsPerMonth.labels.length > 0) {
				const c1 = echarts.init(commitsChartDom);
				c1.setOption({
					tooltip: {
						trigger: 'axis',
						backgroundColor: 'rgba(15, 23, 42, 0.9)',
						textStyle: { color: '#fff' }
					},
					grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
					xAxis: {
						type: 'category',
						data: commitsPerMonth.labels,
						axisLabel: { color: '#94a3b8' },
						axisLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } }
					},
					yAxis: {
						type: 'value',
						axisLabel: { color: '#94a3b8' },
						splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } }
					},
					series: [
						{
							data: commitsPerMonth.data,
							type: 'bar',
							barWidth: '40%',
							itemStyle: {
								color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
									{ offset: 0, color: '#3b82f6' },
									{ offset: 1, color: '#60a5fa' }
								]),
								borderRadius: [4, 4, 0, 0]
							}
						}
					]
				});
				chartsList.push(c1);
			}

			// Repository Growth Chart
			if (growthChartDom && repositoryGrowth.labels.length > 0) {
				const c2 = echarts.init(growthChartDom);
				c2.setOption({
					tooltip: {
						trigger: 'axis',
						backgroundColor: 'rgba(15, 23, 42, 0.9)',
						textStyle: { color: '#fff' }
					},
					grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
					xAxis: {
						type: 'category',
						data: repositoryGrowth.labels,
						axisLabel: { color: '#94a3b8' },
						axisLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } }
					},
					yAxis: {
						type: 'value',
						axisLabel: { color: '#94a3b8' },
						splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } }
					},
					series: [
						{
							data: repositoryGrowth.data,
							type: 'line',
							smooth: true,
							lineStyle: { color: '#10b981', width: 3 },
							areaStyle: {
								color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
									{ offset: 0, color: 'rgba(16, 185, 129, 0.2)' },
									{ offset: 1, color: 'rgba(16, 185, 129, 0)' }
								])
							}
						}
					]
				});
				chartsList.push(c2);
			}

			// Language Usage Pie Chart
			if (langChartDom && languageUsage.length > 0) {
				const c3 = echarts.init(langChartDom);
				c3.setOption({
					tooltip: {
						trigger: 'item',
						backgroundColor: 'rgba(15, 23, 42, 0.9)',
						textStyle: { color: '#fff' }
					},
					legend: { bottom: '0', textStyle: { color: '#94a3b8' } },
					series: [
						{
							name: 'Repositories',
							type: 'pie',
							radius: ['35%', '60%'],
							center: ['50%', '42%'],
							avoidLabelOverlap: false,
							itemStyle: { borderRadius: 8, borderColor: 'rgba(255,255,255,0.05)', borderWidth: 2 },
							label: { show: false },
							emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
							data: languageUsage
						}
					],
					color: [
						'#3b82f6',
						'#10b981',
						'#f59e0b',
						'#ef4444',
						'#8b5cf6',
						'#06b6d4',
						'#ec4899',
						'#f97316',
						'#14b8a6',
						'#a855f7',
						'#6366f1',
						'#84cc16'
					]
				});
				chartsList.push(c3);
			}

			// Weekly Contribution Trend Chart
			if (trendChartDom && weeklyCommitsTrend.data.some((c) => c > 0)) {
				const c4 = echarts.init(trendChartDom);
				c4.setOption({
					tooltip: {
						trigger: 'axis',
						backgroundColor: 'rgba(15, 23, 42, 0.9)',
						textStyle: { color: '#fff' }
					},
					grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
					xAxis: {
						type: 'category',
						data: weeklyCommitsTrend.labels,
						axisLabel: { color: '#94a3b8' },
						axisLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } }
					},
					yAxis: {
						type: 'value',
						axisLabel: { color: '#94a3b8' },
						splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } }
					},
					series: [
						{
							data: weeklyCommitsTrend.data,
							type: 'line',
							smooth: true,
							symbolSize: 8,
							lineStyle: { color: '#8b5cf6', width: 3 },
							itemStyle: { color: '#8b5cf6' }
						}
					]
				});
				chartsList.push(c4);
			}

			// Repository Size Chart
			if (sizeChartDom && repositorySizes.labels.length > 0) {
				const c5 = echarts.init(sizeChartDom);
				c5.setOption({
					tooltip: {
						trigger: 'axis',
						backgroundColor: 'rgba(15, 23, 42, 0.9)',
						textStyle: { color: '#fff' }
					},
					grid: { left: '3%', right: '6%', bottom: '3%', top: '5%', containLabel: true },
					xAxis: {
						type: 'value',
						name: 'MB',
						axisLabel: { color: '#94a3b8' },
						splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } }
					},
					yAxis: {
						type: 'category',
						data: [...repositorySizes.labels].reverse(),
						axisLabel: { color: '#94a3b8' },
						axisTick: { show: false }
					},
					series: [
						{
							data: [...repositorySizes.data].reverse(),
							type: 'bar',
							itemStyle: {
								color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
									{ offset: 0, color: '#f59e0b' },
									{ offset: 1, color: '#d97706' }
								]),
								borderRadius: [0, 4, 4, 0]
							}
						}
					]
				});
				chartsList.push(c5);
			}

			// Star/Fork scatter distribution (Stars & Fork Growth visualization)
			if (bubbleChartDom && starsVsForks.length > 0) {
				const c6 = echarts.init(bubbleChartDom);
				c6.setOption({
					tooltip: {
						trigger: 'item',
						backgroundColor: 'rgba(15, 23, 42, 0.9)',
						textStyle: { color: '#fff' },
						formatter: (params: any) => {
							return `<strong>${params.data.name}</strong><br/>Forks: ${params.data.value[0]}<br/>Stars: ${params.data.value[1]}<br/>Issues: ${params.data.value[2]}`;
						}
					},
					grid: { left: '4%', right: '5%', bottom: '3%', top: '10%', containLabel: true },
					xAxis: {
						type: 'value',
						name: 'Forks',
						axisLabel: { color: '#94a3b8' },
						splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } }
					},
					yAxis: {
						type: 'value',
						name: 'Stars',
						axisLabel: { color: '#94a3b8' },
						splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } }
					},
					series: [
						{
							data: starsVsForks,
							type: 'scatter',
							symbolSize: (data: any) => Math.max(10, Math.min(40, data[2] * 2)),
							label: {
								show: true,
								formatter: '{b}',
								position: 'top',
								fontSize: 10,
								color: '#94a3b8'
							},
							itemStyle: {
								color: 'rgba(59, 130, 246, 0.65)',
								borderColor: '#3b82f6',
								borderWidth: 1.5
							}
						}
					]
				});
				chartsList.push(c6);
			}
		}

		// Resize event handler
		const resizeHandler = () => {
			chartsList.forEach((c) => c.resize());
		};
		window.addEventListener('resize', resizeHandler);

		return () => {
			chartsList.forEach((c) => c.dispose());
			window.removeEventListener('resize', resizeHandler);
		};
	});
</script>

<div class="space-y-8 pb-12 select-none">
	<!-- Page Heading -->
	<div class="flex flex-col gap-1.5">
		<h2
			class="from-foreground to-foreground/80 bg-gradient-to-r bg-clip-text text-3xl font-extrabold tracking-tight"
		>
			Repository Analytics
		</h2>
		<p class="text-muted-foreground text-sm font-light">
			Interactive charts to track codebase growth, language distribution, size profiles, and
			development trends.
		</p>
	</div>

	<!-- Core Stats Cards -->
	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
		<Card.Root class="bg-card border-border border shadow-sm">
			<Card.Header class="pb-2">
				<span class="text-muted-foreground text-[10px] font-bold tracking-wider uppercase"
					>Total Repositories</span
				>
			</Card.Header>
			<Card.Content>
				<div class="flex items-baseline gap-2">
					<span class="text-foreground text-3xl font-extrabold">{totalRepos}</span>
					<span class="text-xs font-semibold text-blue-500">Local Tracked</span>
				</div>
				<p class="text-muted-foreground mt-1 text-[10px]">active on your dashboard</p>
			</Card.Content>
		</Card.Root>

		<Card.Root class="bg-card border-border border shadow-sm">
			<Card.Header class="pb-2">
				<span class="text-muted-foreground text-[10px] font-bold tracking-wider uppercase"
					>Total Commits Synced</span
				>
			</Card.Header>
			<Card.Content>
				<div class="flex items-baseline gap-2">
					<span class="text-foreground text-3xl font-extrabold">{totalCommits}</span>
					<span class="text-xs font-semibold text-purple-500">Commits volume</span>
				</div>
				<p class="text-muted-foreground mt-1 text-[10px]">across all branches synced</p>
			</Card.Content>
		</Card.Root>

		<Card.Root class="bg-card border-border border shadow-sm">
			<Card.Header class="pb-2">
				<span class="text-muted-foreground text-[10px] font-bold tracking-wider uppercase"
					>Stars Accumulated</span
				>
			</Card.Header>
			<Card.Content>
				<div class="flex items-baseline gap-2">
					<span class="text-foreground text-3xl font-extrabold">{totalStars}</span>
					<span class="text-xs font-semibold text-amber-500">Stars count</span>
				</div>
				<p class="text-muted-foreground mt-1 text-[10px]">accumulated star index</p>
			</Card.Content>
		</Card.Root>

		<Card.Root class="bg-card border-border border shadow-sm">
			<Card.Header class="pb-2">
				<span class="text-muted-foreground text-[10px] font-bold tracking-wider uppercase"
					>Forks Volume</span
				>
			</Card.Header>
			<Card.Content>
				<div class="flex items-baseline gap-2">
					<span class="text-foreground text-3xl font-extrabold">{totalForks}</span>
					<span class="text-xs font-semibold text-cyan-500">Forks index</span>
				</div>
				<p class="text-muted-foreground mt-1 text-[10px]">repos shared and cloned</p>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Charts Grid -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- 1. Commits per Month -->
		<Card.Root class="bg-card border-border shadow-sm">
			<Card.Header class="pb-2">
				<Card.Title class="flex items-center gap-2 text-base font-bold">
					<Activity class="h-4 w-4 text-blue-500" />
					<span>Commits per Month</span>
				</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if commitsPerMonth.labels.length === 0}
					<div
						class="text-muted-foreground flex h-64 items-center justify-center text-sm font-light"
					>
						No commits historical records to display. Run sync.
					</div>
				{:else}
					<div bind:this={commitsChartDom} class="h-64 w-full"></div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- 2. Repository Growth -->
		<Card.Root class="bg-card border-border shadow-sm">
			<Card.Header class="pb-2">
				<Card.Title class="flex items-center gap-2 text-base font-bold">
					<TrendingUp class="h-4 w-4 text-emerald-500" />
					<span>Repository Growth Timeline</span>
				</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if repositoryGrowth.labels.length === 0}
					<div
						class="text-muted-foreground flex h-64 items-center justify-center text-sm font-light"
					>
						No repositories tracked in database.
					</div>
				{:else}
					<div bind:this={growthChartDom} class="h-64 w-full"></div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- 3. Language Usage -->
		<Card.Root class="bg-card border-border shadow-sm">
			<Card.Header class="pb-2">
				<Card.Title class="flex items-center gap-2 text-base font-bold">
					<Percent class="h-4 w-4 text-yellow-500" />
					<span>Primary Language Breakdown</span>
				</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if languageUsage.length === 0}
					<div
						class="text-muted-foreground flex h-64 items-center justify-center text-sm font-light"
					>
						No language statistics found.
					</div>
				{:else}
					<div bind:this={langChartDom} class="h-64 w-full"></div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- 4. Contribution Trend -->
		<Card.Root class="bg-card border-border shadow-sm">
			<Card.Header class="pb-2">
				<Card.Title class="flex items-center gap-2 text-base font-bold">
					<Calendar class="h-4 w-4 text-purple-500" />
					<span>Weekly Activity intensity</span>
				</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if !weeklyCommitsTrend.data.some((c) => c > 0)}
					<div
						class="text-muted-foreground flex h-64 items-center justify-center text-sm font-light"
					>
						No contribution events synced.
					</div>
				{:else}
					<div bind:this={trendChartDom} class="h-64 w-full"></div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- 5. Repository Size Comparison -->
		<Card.Root class="bg-card border-border shadow-sm">
			<Card.Header class="pb-2">
				<Card.Title class="flex items-center gap-2 text-base font-bold">
					<Layers class="h-4 w-4 text-orange-500" />
					<span>Top Repositories by Size</span>
				</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if repositorySizes.labels.length === 0}
					<div
						class="text-muted-foreground flex h-64 items-center justify-center text-sm font-light"
					>
						No repositories tracked in database.
					</div>
				{:else}
					<div bind:this={sizeChartDom} class="h-64 w-full"></div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- 6. Stars & Fork Growth Bubble chart -->
		<Card.Root class="bg-card border-border shadow-sm">
			<Card.Header class="pb-2">
				<Card.Title class="flex items-center gap-2 text-base font-bold">
					<Star class="h-4 w-4 text-blue-500" />
					<span>Stars & Forks Growth Matrix</span>
				</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if starsVsForks.length === 0}
					<div
						class="text-muted-foreground flex h-64 items-center justify-center text-sm font-light"
					>
						No repository coordinates.
					</div>
				{:else}
					<div bind:this={bubbleChartDom} class="h-64 w-full"></div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>
