<script lang="ts">
	import { onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { apiFetch } from '$lib/api';
	import { toast } from '$lib/toast.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import { Chart } from 'chart.js/auto';
	import {
		Cpu,
		HardDrive,
		Activity,
		Network,
		RefreshCw,
		Plus,
		ArrowRight,
		AlertTriangle,
		CheckCircle2,
		Info,
		Clock
	} from 'lucide-svelte';

	const queryClient = useQueryClient();
	let isRefreshing = $state(false);

	// Query: Dashboard Metrics
	const dashboardQuery = createQuery(() => ({
		queryKey: ['dashboard'],
		queryFn: () => apiFetch<any>('/api/dashboard'),
		refetchInterval: 10000 // auto-refresh every 10s
	}));

	// Query: Servers (used to list quick nodes)
	const serversQuery = createQuery(() => ({
		queryKey: ['servers'],
		queryFn: () => apiFetch<any[]>('/api/servers')
	}));

	// Query: Activities
	const activityQuery = createQuery(() => ({
		queryKey: ['activity'],
		queryFn: () => apiFetch<any[]>('/api/activity')
	}));

	// Refresh function
	async function refreshTelemetry() {
		isRefreshing = true;
		try {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
				queryClient.invalidateQueries({ queryKey: ['servers'] }),
				queryClient.invalidateQueries({ queryKey: ['activity'] })
			]);
			toast.success('Telemetry and node logs updated');
		} catch (e: any) {
			toast.error('Telemetry update failed: ' + e.message);
		} finally {
			isRefreshing = false;
		}
	}

	// Chart.js instance ref
	let chartCanvas = $state<HTMLCanvasElement | null>(null);
	let chartInstance: Chart | null = null;

	// Redraw chart when dashboard statistics change
	$effect(() => {
		if (chartCanvas && dashboardQuery.data) {
			const ctx = chartCanvas.getContext('2d');
			if (!ctx) return;

			if (chartInstance) {
				chartInstance.destroy();
			}

			const stats = dashboardQuery.data;
			const labels = stats.cpu_history.map((h: any) => h.timestamp);
			const cpuData = stats.cpu_history.map((h: any) => h.value);
			const memData = stats.memory_history.map((h: any) => h.value);

			chartInstance = new Chart(chartCanvas, {
				type: 'line',
				data: {
					labels,
					datasets: [
						{
							label: 'Average CPU %',
							data: cpuData,
							borderColor: '#6366f1',
							backgroundColor: 'rgba(99, 102, 241, 0.05)',
							tension: 0.35,
							fill: true,
							borderWidth: 2,
							pointRadius: 3,
							pointHoverRadius: 6
						},
						{
							label: 'Memory Used %',
							data: memData,
							borderColor: '#06b6d4',
							backgroundColor: 'rgba(6, 182, 212, 0.05)',
							tension: 0.35,
							fill: true,
							borderWidth: 2,
							pointRadius: 3,
							pointHoverRadius: 6
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					interaction: {
						intersect: false,
						mode: 'index'
					},
					plugins: {
						legend: {
							display: true,
							position: 'top',
							labels: {
								color: '#a1a1aa',
								font: { family: 'Inter', weight: 'bold', size: 11 }
							}
						},
						tooltip: {
							padding: 12,
							backgroundColor: '#09090b',
							borderColor: '#27272a',
							borderWidth: 1,
							titleFont: { family: 'Inter', size: 11, weight: 'bold' },
							bodyFont: { family: 'Inter', size: 12 }
						}
					},
					scales: {
						x: {
							grid: { color: 'rgba(63, 63, 70, 0.15)' },
							ticks: { color: '#71717a', font: { family: 'Inter', size: 10 } }
						},
						y: {
							min: 0,
							max: 100,
							grid: { color: 'rgba(63, 63, 70, 0.15)' },
							ticks: {
								color: '#71717a',
								font: { family: 'Inter', size: 10 },
								callback: (val) => `${val}%`
							}
						}
					}
				}
			});
		}
	});

	onDestroy(() => {
		if (chartInstance) {
			chartInstance.destroy();
		}
	});
</script>

<svelte:head>
	<title>Infrastructure Overview | ServerPilot</title>
	<meta
		name="description"
		content="Global cluster diagnostics, cluster loads and telemetry plots."
	/>
</svelte:head>

<div class="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
	<!-- Dashboard Header -->
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1
				class="light:text-zinc-800 font-display text-2xl font-extrabold tracking-tight text-zinc-100 md:text-3xl dark:text-zinc-100"
			>
				Infrastructure Telemetry
			</h1>
			<p class="text-zinc-450 mt-1 text-xs">
				Real-time monitoring diagnostics and cluster health statistics.
			</p>
		</div>

		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				onclick={refreshTelemetry}
				disabled={isRefreshing || dashboardQuery.isFetching}
			>
				<RefreshCw
					class="h-3.5 w-3.5 {isRefreshing || dashboardQuery.isFetching ? 'animate-spin' : ''}"
				/>
				<span>Refresh Metrics</span>
			</Button>
			<Button size="sm" href="/servers?add=true">
				<Plus class="h-4 w-4" />
				<span>Add Server</span>
			</Button>
		</div>
	</div>

	{#if dashboardQuery.isPending}
		<!-- Loading skeletons -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each Array(4) as _, i (i)}
				<div class="h-32 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/30"></div>
			{/each}
		</div>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div
				class="h-96 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/30 lg:col-span-2"
			></div>
			<div class="h-96 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/30"></div>
		</div>
	{:else if dashboardQuery.isError}
		<div class="rounded-2xl border border-red-900/30 bg-red-950/20 p-6 text-center text-red-200">
			<AlertTriangle class="mx-auto mb-2 h-10 w-10 text-red-400" />
			<h3 class="font-semibold">Failed to fetch server statistics</h3>
			<p class="mt-1 text-xs text-red-400">{dashboardQuery.error?.message}</p>
			<Button
				variant="outline"
				size="sm"
				class="mt-4 border-red-800 text-red-300 hover:bg-red-900/20"
				onclick={refreshTelemetry}
			>
				Retry Connection
			</Button>
		</div>
	{:else}
		<!-- Statistics Cards Grid -->
		{@const stats = dashboardQuery.data}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" in:fade>
			<!-- CPU Stats -->
			<Card>
				<div class="mb-3 flex items-center justify-between">
					<span
						class="light:text-zinc-400 text-xs font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-500"
						>CPU Utilization</span
					>
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10"
					>
						<Cpu class="h-4 w-4 text-indigo-400" />
					</div>
				</div>
				<div class="flex items-baseline gap-2">
					<span class="text-zinc-150 font-display text-2xl font-bold tracking-tight"
						>{stats.avg_cpu_usage}%</span
					>
					<span class="text-[10px] font-semibold text-green-400">Avg load</span>
				</div>
				<div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
					<div
						class="h-1.5 rounded-full bg-indigo-500 transition-all duration-500"
						style="width: {stats.avg_cpu_usage}%"
					></div>
				</div>
			</Card>

			<!-- Memory Allocation -->
			<Card>
				<div class="mb-3 flex items-center justify-between">
					<span
						class="light:text-zinc-400 text-xs font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-500"
						>Memory Allocation</span
					>
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10"
					>
						<Activity class="h-4 w-4 text-cyan-400" />
					</div>
				</div>
				<div class="flex items-baseline gap-2">
					<span class="text-zinc-150 font-display text-2xl font-bold tracking-tight"
						>{stats.avg_memory_usage}%</span
					>
					<span class="text-[10px] text-zinc-400">Avg consumption</span>
				</div>
				<div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
					<div
						class="h-1.5 rounded-full bg-cyan-500 transition-all duration-500"
						style="width: {stats.avg_memory_usage}%"
					></div>
				</div>
			</Card>

			<!-- Disk Storage -->
			<Card>
				<div class="mb-3 flex items-center justify-between">
					<span
						class="light:text-zinc-400 text-xs font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-500"
						>Cluster Storage</span
					>
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10"
					>
						<HardDrive class="h-4 w-4 text-emerald-400" />
					</div>
				</div>
				<div class="flex items-baseline gap-2">
					<span class="text-zinc-150 font-display text-2xl font-bold tracking-tight">
						{Math.round((stats.total_disk_used / stats.total_disk_capacity) * 100)}%
					</span>
					<span class="text-[10px] text-zinc-400">
						{Math.round(stats.total_disk_capacity - stats.total_disk_used)} GB free
					</span>
				</div>
				<div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
					<div
						class="h-1.5 rounded-full bg-emerald-500 transition-all duration-500"
						style="width: {(stats.total_disk_used / stats.total_disk_capacity) * 100}%"
					></div>
				</div>
			</Card>

			<!-- Network Bandwidth -->
			<Card>
				<div class="mb-3 flex items-center justify-between">
					<span
						class="light:text-zinc-400 text-xs font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-500"
						>Active Nodes</span
					>
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10"
					>
						<Network class="h-4 w-4 text-amber-400" />
					</div>
				</div>
				<div class="flex items-baseline gap-2">
					<span class="text-zinc-150 font-display text-2xl font-bold tracking-tight"
						>{stats.online_servers} / {stats.total_servers}</span
					>
					<span class="text-[10px] text-zinc-400">Nodes online</span>
				</div>
				<div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
					<div
						class="h-1.5 rounded-full bg-amber-500 transition-all duration-500"
						style="width: {(stats.online_servers / stats.total_servers) * 100}%"
					></div>
				</div>
			</Card>
		</div>

		<!-- Diagnostics Layout: Chart & Activity logs -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<!-- Telemetry Chart -->
			<div class="lg:col-span-2">
				<Card
					title="Cluster Resource Trends"
					description="Aggregated resource consumption logs over the past 7 hours."
				>
					<div class="relative mt-2 h-[300px] w-full">
						<canvas bind:this={chartCanvas}></canvas>
					</div>
				</Card>
			</div>

			<!-- Recent Activity logs -->
			<div class="flex h-full flex-col">
				<Card
					title="Audit Event Logs"
					description="Recent cluster deployments, alerts, and management tasks."
				>
					<div class="mt-2 max-h-[300px] divide-y divide-zinc-900 overflow-y-auto pr-1">
						{#if activityQuery.isPending}
							<div class="flex items-center justify-center py-10 text-xs text-zinc-500">
								Loading activity logs...
							</div>
						{:else if !activityQuery.data || activityQuery.data.length === 0}
							<div class="py-10 text-center text-xs text-zinc-500">No activity records found</div>
						{:else}
							{#each activityQuery.data.slice(0, 8) as act (act.id)}
								<div class="flex items-start gap-3 py-3">
									<div class="mt-0.5">
										{#if act.type === 'success'}
											<CheckCircle2 class="h-4 w-4 text-emerald-400" />
										{:else if act.type === 'warning'}
											<AlertTriangle class="h-4 w-4 text-amber-400" />
										{:else if act.type === 'error'}
											<AlertTriangle class="h-4 w-4 text-red-400" />
										{:else}
											<Info class="h-4 w-4 text-indigo-400" />
										{/if}
									</div>
									<div class="min-w-0 flex-1">
										<p class="text-xs leading-relaxed font-medium text-zinc-300">
											{act.message}
										</p>
										<div class="mt-1 flex items-center gap-2 text-[10px] text-zinc-500">
											<span class="font-semibold text-zinc-400">{act.user}</span>
											<span>•</span>
											<span class="flex items-center gap-0.5"
												><Clock class="h-3 w-3" />
												{new Date(act.created_at).toLocaleTimeString([], {
													hour: '2-digit',
													minute: '2-digit'
												})}</span
											>
										</div>
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</Card>
			</div>
		</div>

		<!-- Quick Server Node Status -->
		<Card
			title="Active Cluster Nodes"
			description="Virtual cluster hardware states. Click nodes to run actions."
		>
			<div class="mt-2 w-full overflow-x-auto">
				{#if serversQuery.isPending}
					<div class="flex items-center justify-center py-12">
						<div
							class="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600/10 border-t-indigo-500"
						></div>
					</div>
				{:else if !serversQuery.data || serversQuery.data.length === 0}
					<div class="py-12 text-center text-zinc-500">
						<p class="text-sm">No servers found.</p>
						<Button size="sm" class="mt-3" href="/servers?add=true">Add Server</Button>
					</div>
				{:else}
					<table class="w-full min-w-[700px] border-collapse text-left text-sm">
						<thead>
							<tr
								class="border-b border-zinc-900 text-xs font-bold tracking-wider text-zinc-500 uppercase"
							>
								<th class="pr-4 pb-3">Node Name</th>
								<th class="px-4 pb-3">Status</th>
								<th class="px-4 pb-3">OS & Provider</th>
								<th class="px-4 pb-3">IP Address</th>
								<th class="px-4 pb-3">CPU Core Load</th>
								<th class="px-4 pb-3">Uptime</th>
								<th class="pb-3 text-right">Settings</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-zinc-900">
							{#each serversQuery.data.slice(0, 5) as server (server.id)}
								<tr class="group transition-colors hover:bg-zinc-900/30">
									<td class="py-3.5 pr-4 font-semibold text-zinc-200 group-hover:text-white">
										{server.name}
									</td>
									<td class="px-4 py-3.5">
										{#if server.status === 'online'}
											<span
												class="inline-flex items-center gap-1.5 rounded-full border border-green-500/10 bg-green-500/5 px-2 py-0.5 text-[11px] font-bold text-green-400"
											>
												<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500"></span>
												Online
											</span>
										{:else if server.status === 'offline'}
											<span
												class="inline-flex items-center gap-1.5 rounded-full border border-red-500/10 bg-red-500/5 px-2 py-0.5 text-[11px] font-bold text-red-400"
											>
												<span class="h-1.5 w-1.5 rounded-full bg-red-500"></span>
												Offline
											</span>
										{:else}
											<span
												class="inline-flex items-center gap-1.5 rounded-full border border-amber-500/10 bg-amber-500/5 px-2 py-0.5 text-[11px] font-bold text-amber-400"
											>
												<span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
												Maintenance
											</span>
										{/if}
									</td>
									<td class="px-4 py-3.5 text-xs text-zinc-400">
										{server.os} • <span class="font-semibold text-zinc-500">{server.provider}</span>
									</td>
									<td class="px-4 py-3.5 font-mono text-xs text-zinc-400">
										{server.ip}
									</td>
									<td class="px-4 py-3.5">
										<div class="flex items-center gap-2">
											<div class="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-900">
												<div
													class="h-1.5 rounded-full bg-indigo-500 transition-all duration-500"
													style="width: {server.cpu_usage}%"
												></div>
											</div>
											<span class="w-8 text-xs font-semibold text-zinc-300"
												>{Math.round(server.cpu_usage)}%</span
											>
										</div>
									</td>
									<td class="text-zinc-450 px-4 py-3.5 text-xs">
										{#if server.status === 'online'}
											{Math.floor(server.uptime / 86400)}d {Math.floor(
												(server.uptime % 86400) / 3600
											)}h
										{:else}
											—
										{/if}
									</td>
									<td class="py-3.5 text-right">
										<a
											href="/servers?search={server.name}"
											class="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 transition-colors hover:text-indigo-400"
										>
											Configure <ArrowRight class="h-3 w-3" />
										</a>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
					{#if serversQuery.data.length > 5}
						<div class="flex justify-end border-t border-zinc-900 pt-4">
							<a
								href="/servers"
								class="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300"
							>
								View all {serversQuery.data.length} servers <ArrowRight class="h-3.5 w-3.5" />
							</a>
						</div>
					{/if}
				{/if}
			</div>
		</Card>
	{/if}
</div>
