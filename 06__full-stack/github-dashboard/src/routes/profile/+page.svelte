<script lang="ts">
	import type { PageData } from './$types';
	import { browser } from '$app/environment';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import {
		Github,
		Shield,
		Flame,
		Award,
		CalendarDays,
		BarChart4,
		Building2,
		Sparkles
	} from 'lucide-svelte';
	import * as echarts from 'echarts';
	import { SvelteSet, SvelteMap } from 'svelte/reactivity';

	let { data }: { data: PageData } = $props();

	// Format account creation date
	const createdDate = $derived.by(() => {
		const rawDate = data.githubProfile?.createdAt || data.user?.createdAt;
		if (!rawDate) return 'Unknown';
		try {
			return new Intl.DateTimeFormat('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			}).format(new Date(rawDate));
		} catch {
			return 'Unknown';
		}
	});

	// State for chosen contribution calendar year
	let selectedYear = $state(new Date().getFullYear());

	// Derive available years from contributions database history
	const availableYears = $derived.by(() => {
		const yearsSet = new SvelteSet<number>();
		yearsSet.add(new Date().getFullYear());
		if (data.streakStats?.contributions) {
			for (const c of data.streakStats.contributions) {
				try {
					const yr = new Date(c.date).getFullYear();
					if (!isNaN(yr)) {
						yearsSet.add(yr);
					}
				} catch {
					// Ignore invalid dates
				}
			}
		}
		return [...yearsSet].sort((a, b) => b - a);
	});

	// Heatmap array compiler for the selected year (from Jan 1st to Dec 31st)
	const contributionDays = $derived.by(() => {
		const days = [];
		const start = new Date(selectedYear, 0, 1);
		const end = new Date(selectedYear, 11, 31);

		// Quick map O(1) lookup
		const countMap = new SvelteMap<string, number>();
		if (data.streakStats?.contributions) {
			for (const c of data.streakStats.contributions) {
				countMap.set(c.date, c.count);
			}
		}

		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		let current = new Date(start);
		while (current <= end) {
			const yearStr = current.getFullYear();
			const monthStr = String(current.getMonth() + 1).padStart(2, '0');
			const dayStr = String(current.getDate()).padStart(2, '0');
			const dateKey = `${yearStr}-${monthStr}-${dayStr}`;

			const count = countMap.get(dateKey) || 0;
			days.push({
				date: new Date(current),
				dateStr: dateKey,
				count
			});
			current.setDate(current.getDate() + 1);
		}
		return days;
	});

	// Total contribution count in the selected year
	const totalYearContributions = $derived.by(() => {
		return contributionDays.reduce((acc, curr) => acc + curr.count, 0);
	});

	// Chunk days list into 53 columns (weeks of 7 days) padded relative to Sunday
	const heatmapWeeks = $derived.by(() => {
		const days = [...contributionDays];
		const firstDayOfWeek = days[0].date.getDay(); // 0 is Sunday, 6 is Saturday

		const padding = Array(firstDayOfWeek).fill(null);
		const paddedDays = [...padding, ...days];

		const weeks: ((typeof days)[0] | null)[][] = [];
		for (let i = 0; i < paddedDays.length; i += 7) {
			weeks.push(paddedDays.slice(i, i + 7));
		}
		return weeks;
	});

	// GitHub green color palette for contribution calendar squares
	function getHeatmapColorClass(count: number | null): string {
		if (count === null) return 'bg-transparent';
		if (count === 0)
			return 'bg-slate-100 dark:bg-[#161b22] border border-slate-200/20 dark:border-slate-800/30';
		if (count <= 2) return 'bg-[#9be9a8] dark:bg-[#0e4429]';
		if (count <= 5) return 'bg-[#40c463] dark:bg-[#006d32]';
		if (count <= 9) return 'bg-[#30a14e] dark:bg-[#26a641]';
		return 'bg-[#216e39] dark:bg-[#39d353]';
	}

	// Dynamic months label row for calendar header
	const monthLabels = $derived.by(() => {
		const months = [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec'
		];
		const labels: { text: string; index: number }[] = [];
		let lastMonthName = '';

		heatmapWeeks.forEach((week, weekIdx) => {
			const validDay = week.find((d) => d !== null);
			if (validDay) {
				const monthName = months[validDay.date.getMonth()];
				if (monthName !== lastMonthName) {
					labels.push({ text: monthName, index: weekIdx });
					lastMonthName = monthName;
				}
			}
		});

		return labels;
	});

	// Group user contributions by month chronologically for the line trend chart
	const monthlyTrendData = $derived.by(() => {
		const months = [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec'
		];
		const monthlyCounts = Array(12).fill(0);
		const today = new Date();
		const currentMonth = today.getMonth();

		contributionDays.forEach((day) => {
			const m = day.date.getMonth();
			monthlyCounts[m] += day.count;
		});

		// Align data starting 11 months ago up to current month
		const alignedMonths = [];
		const alignedCounts = [];
		for (let i = 0; i < 12; i++) {
			const idx = (currentMonth + 1 + i) % 12;
			alignedMonths.push(months[idx]);
			alignedCounts.push(monthlyCounts[idx]);
		}

		return {
			months: alignedMonths,
			counts: alignedCounts
		};
	});

	// ECharts Initialization for Contribution Trend Chart
	let trendChartDom: HTMLDivElement | null = $state(null);
	let trendChart: echarts.ECharts | null = null;

	$effect(() => {
		if (browser && trendChartDom && data.streakStats) {
			trendChart = echarts.init(trendChartDom);

			const option = {
				tooltip: {
					trigger: 'axis',
					backgroundColor: 'rgba(15, 23, 42, 0.95)',
					borderColor: 'rgba(255, 255, 255, 0.1)',
					borderWidth: 1,
					borderRadius: 12,
					textStyle: {
						color: '#f8fafc',
						fontSize: 12,
						fontFamily: 'Inter, sans-serif'
					},
					formatter: '{b}: <span style="font-weight: 700; color: #3b82f6;">{c}</span> contributions'
				},
				grid: {
					left: '3%',
					right: '3%',
					bottom: '3%',
					top: '10%',
					containLabel: true
				},
				xAxis: {
					type: 'category',
					data: monthlyTrendData.months,
					axisLabel: {
						color: '#64748b',
						fontFamily: 'Inter, sans-serif'
					},
					axisTick: { show: false },
					axisLine: {
						lineStyle: {
							color: 'rgba(148, 163, 184, 0.1)'
						}
					}
				},
				yAxis: {
					type: 'value',
					axisLabel: {
						color: '#64748b',
						fontFamily: 'Inter, sans-serif'
					},
					splitLine: {
						lineStyle: {
							color: 'rgba(148, 163, 184, 0.08)'
						}
					}
				},
				series: [
					{
						name: 'Contributions',
						type: 'line',
						data: monthlyTrendData.counts,
						smooth: true,
						showSymbol: false,
						lineStyle: {
							color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
								{ offset: 0, color: '#3b82f6' },
								{ offset: 0.5, color: '#8b5cf6' },
								{ offset: 1, color: '#ec4899' }
							]),
							width: 4
						},
						areaStyle: {
							color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
								{ offset: 0, color: 'rgba(139, 92, 246, 0.25)' },
								{ offset: 1, color: 'rgba(139, 92, 246, 0)' }
							])
						}
					}
				]
			};

			trendChart.setOption(option);
		}

		return () => {
			if (trendChart) {
				trendChart.dispose();
				trendChart = null;
			}
		};
	});

	if (browser) {
		window.addEventListener('resize', () => {
			if (trendChart) trendChart.resize();
		});
	}
</script>

<div class="mx-auto max-w-6xl space-y-8 pb-16 font-sans select-none">
	<!-- Hero Accent Glow Background -->
	<div
		class="pointer-events-none absolute top-0 left-1/2 -z-10 h-[350px] w-full max-w-7xl -translate-x-1/2 rounded-full bg-gradient-to-tr from-blue-600/5 via-violet-600/5 to-fuchsia-600/5 blur-[120px]"
	></div>

	<!-- Top Title Panel -->
	<div class="flex items-center justify-between gap-4">
		<div class="space-y-1">
			<div class="flex items-center gap-2">
				<Badge
					variant="outline"
					class="rounded-full border-violet-500/30 bg-violet-500/5 px-2.5 py-0.5 text-xs font-semibold text-violet-500"
				>
					<Sparkles class="mr-1 h-3.5 w-3.5 animate-pulse" /> Developer Engine
				</Badge>
			</div>
			<h2
				class="text-foreground from-foreground to-foreground/80 bg-gradient-to-r bg-clip-text text-3xl font-black tracking-tight"
			>
				Profile Hub
			</h2>
			<p class="text-muted-foreground max-w-xl text-sm leading-relaxed font-light">
				Monitor active streaks, commit aggregates, and synchronize your authenticated public
				information.
			</p>
		</div>
	</div>

	<!-- Premium Responsive Profile Layout Grid -->
	<div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
		<!-- LEFT SECTION: Glassmorphic Cards (4 Columns) -->
		<div class="space-y-6 lg:col-span-4">
			{#if data.user}
				<!-- Profile Card -->
				<Card.Root
					class="bg-card/45 border-border/80 hover:border-border relative overflow-hidden rounded-3xl border shadow-xl backdrop-blur-md transition-all duration-300"
				>
					<!-- Color Ribbon Accent -->
					<div
						class="absolute top-0 left-0 h-[6px] w-full bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500"
					></div>

					<!-- Hero Ambient Header Cover -->
					<div
						class="border-border/40 relative flex h-24 items-center justify-center overflow-hidden border-b bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 dark:from-slate-950 dark:via-zinc-950 dark:to-slate-950"
					>
						<div class="bg-grid-pattern absolute inset-0 opacity-10"></div>
						<div class="absolute h-24 w-24 rounded-full bg-blue-500/10 blur-xl"></div>
					</div>

					<Card.Content class="relative space-y-6 px-6 pt-0 pb-6">
						<!-- Centered Floating Avatar -->
						<div class="-mt-10 flex justify-center">
							<Avatar.Root
								class="border-card bg-card h-20 w-20 rounded-2xl border-4 shadow-2xl transition-transform duration-300 hover:scale-105"
							>
								<Avatar.Image
									src={data.githubProfile?.avatarUrl || data.user.image}
									alt={data.user.name}
								/>
								<Avatar.Fallback
									class="rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 text-2xl font-black text-white"
								>
									{data.user.name ? data.user.name.charAt(0).toUpperCase() : 'U'}
								</Avatar.Fallback>
							</Avatar.Root>
						</div>

						<!-- Name and Tag -->
						<div class="space-y-1 text-center">
							<h3 class="text-foreground text-xl leading-tight font-black tracking-tight">
								{data.user.name}
							</h3>
							{#if data.user.username}
								<a
									href="https://github.com/{data.user.username}"
									target="_blank"
									rel="noopener noreferrer"
									class="inline-flex items-center text-xs font-bold text-blue-500 hover:underline"
								>
									<Github class="mr-1 h-3.5 w-3.5" />
									<span>@{data.user.username}</span>
								</a>
							{/if}
						</div>

						<!-- Social Metrics Grid (Followers, Following, Repos) -->
						{#if data.githubProfile}
							<div
								class="border-border/40 bg-muted/20 grid grid-cols-3 gap-2 rounded-2xl border-y py-4 text-center"
							>
								<div class="space-y-0.5">
									<div class="text-foreground text-lg font-black tracking-tight">
										{data.githubProfile.followers}
									</div>
									<div class="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
										Followers
									</div>
								</div>
								<div class="space-y-0.5">
									<div class="text-foreground text-lg font-black tracking-tight">
										{data.githubProfile.following}
									</div>
									<div class="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
										Following
									</div>
								</div>
								<div class="space-y-0.5">
									<div class="text-foreground text-lg font-black tracking-tight">
										{data.githubProfile.publicRepos}
									</div>
									<div class="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
										Repos
									</div>
								</div>
							</div>
						{/if}

						<!-- Detail Attributes Rows -->
						<div class="space-y-3.5 text-sm font-medium">
							<div class="border-border/20 flex items-center justify-between border-b py-1">
								<span class="text-muted-foreground font-light">Role</span>
								<span class="text-foreground font-bold">Contributor</span>
							</div>

							<div class="border-border/20 flex items-center justify-between border-b py-1">
								<span class="text-muted-foreground font-light">Email</span>
								<span
									class="text-foreground max-w-[170px] truncate font-semibold"
									title={data.user.email}>{data.user.email}</span
								>
							</div>

							<div class="flex items-center justify-between py-1">
								<span class="text-muted-foreground font-light">Registered</span>
								<span class="text-foreground font-bold">{createdDate}</span>
							</div>
						</div>

						<!-- Security Status Badge -->
						<div
							class="flex gap-2.5 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-3 text-xs leading-relaxed font-light text-emerald-600 dark:text-emerald-500"
						>
							<Shield class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
							<span>Active OAuth access token. Safe encryption protocols engaged.</span>
						</div>
					</Card.Content>
				</Card.Root>
			{/if}

			<!-- Organizations Card -->
			{#if data.githubProfile?.organizations && data.githubProfile.organizations.length > 0}
				<Card.Root
					class="bg-card/45 border-border/80 hover:border-border overflow-hidden rounded-3xl border shadow-md backdrop-blur-md transition duration-300"
				>
					<Card.Header class="border-border/40 border-b pb-3">
						<Card.Title class="text-foreground/90 flex items-center gap-2 text-sm font-bold">
							<Building2 class="text-muted-foreground h-4.5 w-4.5" />
							<span>Linked Organizations ({data.githubProfile.organizations.length})</span>
						</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-3.5 p-4">
						{#each data.githubProfile.organizations as org (org.name)}
							<div class="hover:bg-muted/30 flex items-center gap-3 rounded-xl p-2 transition">
								<img
									src={org.avatarUrl}
									alt={org.name}
									class="border-border h-9 w-9 shrink-0 rounded-lg border shadow-sm"
								/>
								<div class="min-w-0">
									<h4 class="text-foreground truncate text-sm font-bold">@{org.name}</h4>
									{#if org.description}
										<p class="text-muted-foreground truncate text-xs leading-relaxed font-light">
											{org.description}
										</p>
									{/if}
								</div>
							</div>
						{/each}
					</Card.Content>
				</Card.Root>
			{/if}
		</div>

		<!-- RIGHT SECTION: Streak Dashboard & Heatmap (8 Columns) -->
		<div class="min-w-0 space-y-6 lg:col-span-8">
			<!-- Premium Streaks Dashboard Grid -->
			<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
				<!-- Total Contributions -->
				<div
					class="group border-border/80 bg-card/45 relative flex h-[110px] flex-col justify-between rounded-3xl border p-4 shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40"
				>
					<div class="text-muted-foreground flex items-center justify-between">
						<span class="text-[9px] font-black tracking-wider uppercase">Total Commit Volume</span>
						<CalendarDays
							class="h-4 w-4 text-blue-500 transition-transform group-hover:scale-110"
						/>
					</div>
					<div>
						<div class="text-foreground text-2xl font-black tracking-tight">
							{data.streakStats?.totalContributions || 0}
						</div>
						<p class="text-muted-foreground/80 mt-0.5 text-[9px] font-light">
							365-day cumulative sum
						</p>
					</div>
				</div>

				<!-- Contribution Days -->
				<div
					class="group border-border/80 bg-card/45 relative flex h-[110px] flex-col justify-between rounded-3xl border p-4 shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/40"
				>
					<div class="text-muted-foreground flex items-center justify-between">
						<span class="text-[9px] font-black tracking-wider uppercase">Active Calendar Days</span>
						<Award class="h-4 w-4 text-purple-500 transition-transform group-hover:scale-110" />
					</div>
					<div>
						<div class="text-foreground text-2xl font-black tracking-tight">
							{data.streakStats?.contributionDays || 0}
						</div>
						<p class="text-muted-foreground/80 mt-0.5 text-[9px] font-light">
							individual days with commits
						</p>
					</div>
				</div>

				<!-- Current Streak -->
				<div
					class="group border-border/80 bg-card/45 relative flex h-[110px] flex-col justify-between rounded-3xl border p-4 shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/40"
				>
					<div
						class="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
					></div>
					<div class="text-muted-foreground relative z-10 flex items-center justify-between">
						<span class="text-[9px] font-black tracking-wider uppercase">Current Streak</span>
						<Flame
							class="h-4 w-4 fill-orange-500/10 text-orange-500 transition-transform group-hover:scale-110"
						/>
					</div>
					<div class="relative z-10">
						<div class="text-2xl font-black tracking-tight text-orange-600 dark:text-orange-500">
							{data.streakStats?.currentStreak || 0} days
						</div>
						<p class="text-muted-foreground/80 mt-0.5 text-[9px] font-light">
							active continuous streak
						</p>
					</div>
				</div>

				<!-- Longest Streak -->
				<div
					class="group border-border/80 bg-card/45 relative flex h-[110px] flex-col justify-between rounded-3xl border p-4 shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-rose-500/40"
				>
					<div
						class="absolute inset-0 rounded-3xl bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
					></div>
					<div class="text-muted-foreground relative z-10 flex items-center justify-between">
						<span class="text-[9px] font-black tracking-wider uppercase">Longest Streak</span>
						<Flame
							class="h-4 w-4 fill-rose-500/10 text-rose-500 transition-transform group-hover:scale-110"
						/>
					</div>
					<div class="relative z-10">
						<div class="text-2xl font-black tracking-tight text-rose-600 dark:text-rose-500">
							{data.streakStats?.longestStreak || 0} days
						</div>
						<p class="text-muted-foreground/80 mt-0.5 text-[9px] font-light">
							historical record index
						</p>
					</div>
				</div>
			</div>

			<!-- Year Selector and Heatmap Container -->
			<div class="flex w-full min-w-0 flex-col items-start gap-6 md:flex-row">
				<div class="w-full min-w-0 flex-1 space-y-3">
					<!-- Title and Settings Header (Outside card) -->
					<div class="flex items-center justify-between px-1">
						<h3 class="text-foreground text-sm font-medium">
							{totalYearContributions.toLocaleString()} contributions in {selectedYear}
						</h3>
						<div
							class="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1.5 text-xs transition"
						>
							<span>Contribution settings</span>
							<span class="text-[9px]">▼</span>
						</div>
					</div>

					<!-- Heatmap Card -->
					<Card.Root class="bg-card border-border/80 overflow-hidden rounded-xl border shadow-sm">
						<Card.Content class="p-6">
							<div class="w-full scrollbar-none overflow-x-auto pt-2 select-none">
								<div class="flex min-w-[730px] flex-col gap-1.5">
									<!-- Month labels row -->
									<div class="text-muted-foreground/80 relative flex h-4 text-[10px] font-normal">
										<div class="w-8 shrink-0"></div>
										<div class="relative flex h-full flex-1">
											{#each monthLabels as month (month.index)}
												<div class="absolute" style="left: calc({month.index} * 14px)">
													{month.text}
												</div>
											{/each}
										</div>
									</div>

									<!-- Calendar Days Grid -->
									<div class="flex items-start gap-1">
										<!-- Days Labels column (Mon, Wed, Fri) -->
										<div
											class="text-muted-foreground/80 grid w-8 shrink-0 grid-rows-7 gap-1 pr-2 text-right text-[10px] leading-[10px]"
										>
											<span class="flex h-[10px] items-center justify-end"></span>
											<span class="flex h-[10px] items-center justify-end">Mon</span>
											<span class="flex h-[10px] items-center justify-end"></span>
											<span class="flex h-[10px] items-center justify-end">Wed</span>
											<span class="flex h-[10px] items-center justify-end"></span>
											<span class="flex h-[10px] items-center justify-end">Fri</span>
											<span class="flex h-[10px] items-center justify-end"></span>
										</div>

										<!-- Weeks Columns grid container -->
										<div class="flex flex-1 gap-1">
											{#each heatmapWeeks as week, weekIdx (weekIdx)}
												<div class="grid grid-rows-7 gap-1">
													{#each week as day, dayIdx (day ? day.dateStr : dayIdx)}
														{#if day === null}
															<div class="h-[10px] w-[10px] bg-transparent"></div>
														{:else}
															<div
																class="h-[10px] w-[10px] rounded-[2px] transition-all duration-300 hover:z-10 hover:scale-125 {getHeatmapColorClass(
																	day.count
																)}"
																title="{day.count} contributions on {new Date(
																	day.date
																).toLocaleDateString([], { dateStyle: 'medium' })}"
															></div>
														{/if}
													{/each}
												</div>
											{/each}
										</div>
									</div>

									<!-- Heatmap Legend -->
									<div
										class="text-muted-foreground/80 border-border/20 mt-4 flex items-center justify-between border-t px-2 pt-2 text-[11px]"
									>
										<a
											href="https://docs.github.com/en/github/setting-up-and-managing-your-github-profile/managing-contribution-graphs-on-your-profile/why-are-my-contributions-not-showing-up-on-my-profile"
											target="_blank"
											rel="noopener noreferrer"
											class="hover:text-primary transition hover:underline"
										>
											Learn how we count contributions
										</a>
										<div class="flex items-center gap-1">
											<span class="mr-1">Less</span>
											<div
												class="h-2.5 w-2.5 rounded-[2px] border border-slate-200/20 bg-slate-100 dark:border-slate-800/30 dark:bg-[#161b22]"
											></div>
											<div class="h-2.5 w-2.5 rounded-[2px] bg-[#9be9a8] dark:bg-[#0e4429]"></div>
											<div class="h-2.5 w-2.5 rounded-[2px] bg-[#40c463] dark:bg-[#006d32]"></div>
											<div class="h-2.5 w-2.5 rounded-[2px] bg-[#30a14e] dark:bg-[#26a641]"></div>
											<div class="h-2.5 w-2.5 rounded-[2px] bg-[#216e39] dark:bg-[#39d353]"></div>
											<span class="ml-1">More</span>
										</div>
									</div>
								</div>
							</div>
						</Card.Content>
					</Card.Root>
				</div>

				<!-- Year Selector Sidebar -->
				<div
					class="flex w-full shrink-0 flex-row gap-1 overflow-x-auto pb-2 md:w-28 md:flex-col md:overflow-x-visible md:pt-8 md:pb-0"
				>
					{#each availableYears as year (year)}
						<button
							onclick={() => (selectedYear = year)}
							class="w-full shrink-0 rounded-lg px-4 py-1.5 text-center text-xs font-normal transition duration-200 md:text-left {selectedYear ===
							year
								? 'bg-blue-600 font-semibold text-white shadow-sm'
								: 'text-muted-foreground hover:text-foreground hover:bg-muted/40'}"
						>
							{year}
						</button>
					{/each}
				</div>
			</div>

			<!-- Contribution Trend Line Chart Card -->
			<Card.Root
				class="bg-card/45 border-border/80 hover:border-border overflow-hidden rounded-3xl border shadow-xl backdrop-blur-md transition-all duration-300"
			>
				<Card.Header class="border-border/40 bg-muted/10 border-b pb-2">
					<Card.Title class="text-foreground/90 flex items-center gap-2 text-base font-extrabold">
						<BarChart4 class="h-4.5 w-4.5 text-blue-500" />
						<span>Contribution Velocity</span>
					</Card.Title>
					<p class="text-muted-foreground text-xs font-light">
						Interactive curve indicating the development tempo sorted by month.
					</p>
				</Card.Header>
				<Card.Content class="pt-6">
					<div bind:this={trendChartDom} class="h-64 w-full"></div>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>

<style>
	/* Background grid patterns and scroll bars settings */
	.bg-grid-pattern {
		background-image: radial-gradient(rgba(148, 163, 184, 0.15) 1px, transparent 0);
		background-size: 16px 16px;
	}
	.scrollbar-none::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-none {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
