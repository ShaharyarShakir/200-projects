<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly, slide } from 'svelte/transition';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { apiFetch } from '$lib/api';
	import { toast } from '$lib/toast.svelte';
	import Button from '$lib/components/Button.svelte';
	import {
		Search,
		Plus,
		LayoutGrid,
		List,
		RotateCw,
		Play,
		Square,
		Trash2,
		X,
		MapPin,
		Terminal,
		Cpu,
		Activity,
		HardDrive,
		ChevronLeft,
		ChevronRight,
		Server,
		AlertOctagon
	} from 'lucide-svelte';

	const queryClient = useQueryClient();

	// Component UI state
	let viewMode = $state<'table' | 'grid'>('table');
	let isAddModalOpen = $state(false);
	let selectedServerIDs = $state<string[]>([]);

	// Query filters
	let searchQuery = $state('');
	let statusFilter = $state('');
	let providerFilter = $state('');

	// Pagination state
	let currentPage = $state(1);
	const itemsPerPage = 5;

	// Add Server Form variables
	let newServerName = $state('');
	let newServerIP = $state('');
	let newServerOS = $state('Ubuntu 22.04 LTS');
	let newServerProvider = $state('AWS');
	let newServerLocation = $state('Virginia, USA');
	let newServerTagsInput = $state('');

	// SSH credentials state
	let newServerSSHPort = $state(22);
	let newServerSSHUser = $state('root');
	let newServerSSHAuthMethod = $state<'password' | 'private_key'>('password');
	let newServerSSHPassword = $state('');
	let newServerSSHPrivateKey = $state('');
	let newServerSSHPassphrase = $state('');
	let isTestingConnection = $state(false);

	// Sync filter parameters with URL search query
	onMount(() => {
		const searchParam = $page.url.searchParams.get('search');
		if (searchParam) {
			searchQuery = searchParam;
		}
		const addParam = $page.url.searchParams.get('add');
		if (addParam === 'true') {
			isAddModalOpen = true;
			// Clean URL parameter
			goto('/servers', { replaceState: true });
		}
	});

	// Reactively close modal and reset fields
	function closeModal() {
		isAddModalOpen = false;
		newServerName = '';
		newServerIP = '';
		newServerOS = 'Ubuntu 22.04 LTS';
		newServerProvider = 'AWS';
		newServerLocation = 'Virginia, USA';
		newServerTagsInput = '';
		newServerSSHPort = 22;
		newServerSSHUser = 'root';
		newServerSSHAuthMethod = 'password';
		newServerSSHPassword = '';
		newServerSSHPrivateKey = '';
		newServerSSHPassphrase = '';
	}

	async function handleTestConnection() {
		if (!newServerIP) {
			toast.error('Please input IP address before testing connection');
			return;
		}
		isTestingConnection = true;
		try {
			const res = await apiFetch<{ success: boolean; message: string; system_info?: any }>(
				'/api/servers/test-connection',
				{
					method: 'POST',
					body: JSON.stringify({
						ip: newServerIP,
						ssh_port: newServerSSHPort,
						ssh_user: newServerSSHUser,
						ssh_auth_method: newServerSSHAuthMethod,
						ssh_password: newServerSSHPassword,
						ssh_private_key: newServerSSHPrivateKey,
						ssh_passphrase: newServerSSHPassphrase
					})
				}
			);
			if (res.success) {
				toast.success(`SSH Connection successful! OS: ${res.system_info?.os_name || 'Linux'}`);
			} else {
				toast.error(`SSH Connection failed: ${res.message}`);
			}
		} catch (err: any) {
			toast.error(`SSH Connection error: ${err.message}`);
		} finally {
			isTestingConnection = false;
		}
	}

	interface ServerNode {
		id: string;
		name: string;
		ip: string;
		status: 'online' | 'offline' | 'maintenance';
		os: string;
		cpu_usage: number;
		memory_usage: number;
		memory_total: number;
		disk_usage: number;
		disk_total: number;
		network_in: number;
		network_out: number;
		uptime: number;
		location: string;
		provider: string;
		tags: string[];
	}

	// Fetch Servers with filtering parameters
	const serversQuery = createQuery(() => {
		const params = new SvelteURLSearchParams();
		if (searchQuery) params.append('search', searchQuery);
		if (statusFilter) params.append('status', statusFilter);
		if (providerFilter) params.append('provider', providerFilter);
		return {
			queryKey: ['servers', searchQuery, statusFilter, providerFilter],
			queryFn: () => apiFetch<ServerNode[]>(`/api/servers?${params.toString()}`)
		};
	});

	// Mutation: Add Server
	const addServerMutation = createMutation(() => ({
		mutationFn: (newServer: {
			name: string;
			ip: string;
			os: string;
			provider: string;
			location: string;
			tags: string[];
			ssh_port: number;
			ssh_user: string;
			ssh_auth_method: string;
			ssh_password?: string;
			ssh_private_key?: string;
			ssh_passphrase?: string;
		}) =>
			apiFetch<ServerNode>('/api/servers/create', {
				method: 'POST',
				body: JSON.stringify(newServer)
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['servers'] });
			queryClient.invalidateQueries({ queryKey: ['dashboard'] });
			queryClient.invalidateQueries({ queryKey: ['activity'] });
			toast.success('New node added to virtual cluster');
			closeModal();
		},
		onError: (err: any) => {
			toast.error('Failed to create server: ' + err.message);
		}
	}));

	// Mutation: Power Operations (Reboot, Shutdown, Start)
	const powerMutation = createMutation(() => ({
		mutationFn: (payload: { ids: string[]; action: string }) =>
			apiFetch<{ message: string }>('/api/servers/power', {
				method: 'POST',
				body: JSON.stringify(payload)
			}),
		onSuccess: (_: any, variables: { ids: string[]; action: string }) => {
			queryClient.invalidateQueries({ queryKey: ['servers'] });
			queryClient.invalidateQueries({ queryKey: ['dashboard'] });
			queryClient.invalidateQueries({ queryKey: ['activity'] });
			toast.success(`Power operation (${variables.action}) completed`);
			selectedServerIDs = [];
		},
		onError: (err: any) => {
			toast.error('Power action failed: ' + err.message);
		}
	}));

	// Mutation: Bulk Delete
	const deleteMutation = createMutation(() => ({
		mutationFn: (payload: { ids: string[] }) =>
			apiFetch<{ message: string }>('/api/servers/delete', {
				method: 'POST',
				body: JSON.stringify(payload)
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['servers'] });
			queryClient.invalidateQueries({ queryKey: ['dashboard'] });
			queryClient.invalidateQueries({ queryKey: ['activity'] });
			toast.success('Selected nodes removed from account');
			selectedServerIDs = [];
		},
		onError: (err: any) => {
			toast.error('Deletion failed: ' + err.message);
		}
	}));

	// Derived items list
	const servers = $derived(serversQuery.data || []);
	const totalServersCount = $derived(servers.length);

	// Paginated subset
	const paginatedServers = $derived.by(() => {
		const start = (currentPage - 1) * itemsPerPage;
		const end = start + itemsPerPage;
		return servers.slice(start, end);
	});

	const totalPages = $derived(Math.ceil(totalServersCount / itemsPerPage) || 1);

	// Handle checking all items on current page
	const isAllCheckedOnPage = $derived.by(() => {
		if (paginatedServers.length === 0) return false;
		return paginatedServers.every((s: ServerNode) => selectedServerIDs.includes(s.id));
	});

	function toggleSelectAll() {
		const pageIDs = paginatedServers.map((s: ServerNode) => s.id);
		if (isAllCheckedOnPage) {
			// Uncheck all page items
			selectedServerIDs = selectedServerIDs.filter((id) => !pageIDs.includes(id));
		} else {
			// Check all page items, keeping existing selection
			const union = new Set([...selectedServerIDs, ...pageIDs]);
			selectedServerIDs = Array.from(union);
		}
	}

	function toggleSelectServer(id: string) {
		if (selectedServerIDs.includes(id)) {
			selectedServerIDs = selectedServerIDs.filter((sid) => sid !== id);
		} else {
			selectedServerIDs = [...selectedServerIDs, id];
		}
	}

	// Actions execution handlers
	function executePowerAction(action: 'start' | 'stop' | 'restart') {
		if (selectedServerIDs.length === 0) return;
		powerMutation.mutate({ ids: selectedServerIDs, action });
	}

	function executeDeleteAction() {
		if (selectedServerIDs.length === 0) return;
		if (confirm(`Are you sure you want to remove ${selectedServerIDs.length} servers?`)) {
			deleteMutation.mutate({ ids: selectedServerIDs });
		}
	}

	function handleAddServerSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!newServerName || !newServerIP) {
			toast.error('Please fill in server Name and IP address');
			return;
		}

		const tags = newServerTagsInput
			.split(',')
			.map((t) => t.trim().toLowerCase())
			.filter((t) => t.length > 0);

		addServerMutation.mutate({
			name: newServerName,
			ip: newServerIP,
			os: newServerOS,
			provider: newServerProvider,
			location: newServerLocation,
			tags
		});
	}
</script>

<svelte:head>
	<title>Manage Servers | ServerPilot</title>
	<meta
		name="description"
		content="View cluster hardware nodes, perform server power management, and configure integrations."
	/>
</svelte:head>

<div class="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
	<!-- Page Header -->
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1
				class="light:text-zinc-800 font-display text-2xl font-extrabold tracking-tight text-zinc-100 md:text-3xl dark:text-zinc-100"
			>
				Manage Cluster Nodes
			</h1>
			<p class="text-zinc-450 mt-1 text-xs">
				Provision new nodes, monitor usage levels, and trigger server orchestration actions.
			</p>
		</div>

		<Button size="sm" onclick={() => (isAddModalOpen = true)}>
			<Plus class="h-4 w-4" />
			<span>Connect Server</span>
		</Button>
	</div>

	<!-- Control bar: Search, Filter, Mode switch, Actions -->
	<div
		class="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4 backdrop-blur-md lg:flex-row lg:items-center"
	>
		<!-- Left: Filters & Search query -->
		<div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
			<!-- Text Search -->
			<div class="relative w-full max-w-xs shrink-0">
				<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
				<input
					type="text"
					placeholder="Search by name, IP, tag..."
					bind:value={searchQuery}
					class="text-zinc-150 w-full rounded-lg border border-zinc-800 bg-zinc-900/60 py-1.5 pr-4 pl-9 text-xs transition-all outline-none placeholder:text-zinc-500 hover:border-zinc-700 hover:bg-zinc-900 focus:border-indigo-500"
				/>
			</div>

			<!-- Status Filter -->
			<select
				bind:value={statusFilter}
				class="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 transition-colors outline-none hover:bg-zinc-900"
			>
				<option value="">All Statuses</option>
				<option value="online">Online</option>
				<option value="offline">Offline</option>
				<option value="maintenance">Maintenance</option>
			</select>

			<!-- Cloud Provider Filter -->
			<select
				bind:value={providerFilter}
				class="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 transition-colors outline-none hover:bg-zinc-900"
			>
				<option value="">All Providers</option>
				<option value="AWS">AWS</option>
				<option value="GCP">GCP</option>
				<option value="Hetzner">Hetzner</option>
				<option value="DigitalOcean">DigitalOcean</option>
				<option value="Scaleway">Scaleway</option>
			</select>
		</div>

		<!-- Right: Grid/Table toggles and Bulk actions -->
		<div class="flex shrink-0 items-center gap-3">
			<!-- Bulk Action Panel -->
			{#if selectedServerIDs.length > 0}
				<div
					transition:slide={{ axis: 'x', duration: 150 }}
					class="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 p-1"
				>
					<span class="px-2 text-[10px] font-bold text-zinc-400">
						{selectedServerIDs.length} selected
					</span>

					<button
						onclick={() => executePowerAction('start')}
						class="rounded p-1 text-green-400 transition-colors hover:bg-green-500/10"
						title="Power On Selected"
					>
						<Play class="h-3.5 w-3.5" />
					</button>
					<button
						onclick={() => executePowerAction('stop')}
						class="rounded p-1 text-amber-500 transition-colors hover:bg-amber-500/10"
						title="Power Off Selected"
					>
						<Square class="h-3.5 w-3.5" />
					</button>
					<button
						onclick={() => executePowerAction('restart')}
						class="rounded p-1 text-indigo-400 transition-colors hover:bg-indigo-500/10"
						title="Reboot Selected"
					>
						<RotateCw class="h-3.5 w-3.5" />
					</button>
					<div class="h-4 w-px bg-zinc-800"></div>
					<button
						onclick={executeDeleteAction}
						class="rounded p-1 text-red-400 transition-colors hover:bg-red-500/10"
						title="Delete Selected"
					>
						<Trash2 class="h-3.5 w-3.5" />
					</button>
				</div>
			{/if}

			<!-- Toggle Views buttons -->
			<div class="flex rounded-lg border border-zinc-800 bg-zinc-900/30 p-1">
				<button
					onclick={() => (viewMode = 'table')}
					class="rounded-md p-1.5 transition-colors {viewMode === 'table'
						? 'bg-zinc-800 text-indigo-400'
						: 'text-zinc-500 hover:text-zinc-300'}"
					title="Table View"
				>
					<List class="h-4 w-4" />
				</button>
				<button
					onclick={() => (viewMode = 'grid')}
					class="rounded-md p-1.5 transition-colors {viewMode === 'grid'
						? 'bg-zinc-800 text-indigo-400'
						: 'text-zinc-500 hover:text-zinc-300'}"
					title="Grid View"
				>
					<LayoutGrid class="h-4 w-4" />
				</button>
			</div>
		</div>
	</div>

	<!-- SERVERS LIST CONTENT -->
	{#if serversQuery.isPending}
		<div class="flex flex-col items-center justify-center gap-4 py-24">
			<div
				class="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600/15 border-t-indigo-500"
			></div>
			<p class="animate-pulse text-xs font-bold tracking-wider text-zinc-500 uppercase">
				Loading infrastructure states...
			</p>
		</div>
	{:else if serversQuery.isError}
		<div class="rounded-2xl border border-red-900/30 bg-red-950/20 p-6 text-center text-red-200">
			<AlertOctagon class="mx-auto mb-2 h-10 w-10 text-red-400" />
			<h3 class="font-semibold">Query Execution Failed</h3>
			<p class="mt-1 text-xs text-red-400">{serversQuery.error?.message}</p>
		</div>
	{:else if totalServersCount === 0}
		<div class="rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
			<Server class="mx-auto mb-3 h-12 w-12 text-zinc-600" />
			<h3 class="text-sm font-bold text-zinc-300">No servers found</h3>
			<p class="mt-1 text-xs text-zinc-500">
				Try tweaking your search terms or filter constraints.
			</p>
			<Button
				size="sm"
				class="mt-4"
				onclick={() => {
					searchQuery = '';
					statusFilter = '';
					providerFilter = '';
				}}
			>
				Clear Filters
			</Button>
		</div>
	{:else}
		<div in:fade>
			<!-- VIEW MODE: TABLE -->
			{#if viewMode === 'table'}
				<div class="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950/25">
					<table class="w-full min-w-[900px] border-collapse text-left text-sm">
						<thead>
							<tr
								class="border-b border-zinc-800 bg-zinc-900/20 text-xs font-bold tracking-wider text-zinc-500 uppercase"
							>
								<th class="w-10 px-4 py-4">
									<input
										type="checkbox"
										checked={isAllCheckedOnPage}
										onclick={toggleSelectAll}
										class="h-4 w-4 cursor-pointer rounded border-zinc-800 bg-zinc-900 text-indigo-600 outline-none focus:ring-0"
									/>
								</th>
								<th class="px-4 py-4">Server Node</th>
								<th class="px-4 py-4">Status</th>
								<th class="px-4 py-4">IP Address</th>
								<th class="px-4 py-4">Region</th>
								<th class="px-4 py-4">Providers</th>
								<th class="px-4 py-4">CPU Core</th>
								<th class="px-4 py-4">RAM Allocation</th>
								<th class="px-4 py-4">Disk Space</th>
								<th class="px-4 py-4">Tags</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-zinc-900">
							{#each paginatedServers as server (server.id)}
								<tr
									class="group transition-colors hover:bg-zinc-900/30 {selectedServerIDs.includes(
										server.id
									)
										? 'bg-indigo-600/5'
										: ''}"
								>
									<!-- Selection Checkbox -->
									<td class="px-4 py-3">
										<input
											type="checkbox"
											checked={selectedServerIDs.includes(server.id)}
											onclick={() => toggleSelectServer(server.id)}
											class="h-4 w-4 cursor-pointer rounded border-zinc-800 bg-zinc-900 text-indigo-600 outline-none focus:ring-0"
										/>
									</td>

									<!-- Server details -->
									<td class="px-4 py-3">
										<div class="flex flex-col">
											<span class="font-bold text-zinc-200 transition-colors group-hover:text-white"
												>{server.name}</span
											>
											<span class="text-[10px] font-medium text-zinc-500">{server.os}</span>
										</div>
									</td>

									<!-- Status -->
									<td class="px-4 py-3">
										{#if server.status === 'online'}
											<span
												class="inline-flex items-center gap-1.5 rounded-full border border-green-500/10 bg-green-500/5 px-2.5 py-0.5 text-xs font-bold text-green-400"
											>
												<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400"></span>
												Online
											</span>
										{:else if server.status === 'offline'}
											<span
												class="inline-flex items-center gap-1.5 rounded-full border border-red-500/10 bg-red-500/5 px-2.5 py-0.5 text-xs font-bold text-red-400"
											>
												<span class="h-1.5 w-1.5 rounded-full bg-red-500"></span>
												Offline
											</span>
										{:else}
											<span
												class="inline-flex items-center gap-1.5 rounded-full border border-amber-500/10 bg-amber-500/5 px-2.5 py-0.5 text-xs font-bold text-amber-400"
											>
												<span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
												Maintenance
											</span>
										{/if}
									</td>

									<!-- IP Address -->
									<td class="px-4 py-3 font-mono text-xs text-zinc-400">{server.ip}</td>

									<!-- Location -->
									<td class="px-4 py-3 text-xs text-zinc-400">
										<div class="flex items-center gap-1">
											<MapPin class="h-3.5 w-3.5 text-zinc-500" />
											<span>{server.location}</span>
										</div>
									</td>

									<!-- Provider -->
									<td class="px-4 py-3 text-xs font-semibold text-zinc-400">{server.provider}</td>

									<!-- CPU -->
									<td class="px-4 py-3">
										<div class="flex items-center gap-2">
											<div class="h-1.5 w-12 overflow-hidden rounded-full bg-zinc-900">
												<div
													class="h-1.5 rounded-full bg-indigo-500 transition-all duration-300"
													style="width: {server.cpu_usage}%"
												></div>
											</div>
											<span class="text-xs font-bold text-zinc-400"
												>{Math.round(server.cpu_usage)}%</span
											>
										</div>
									</td>

									<!-- RAM -->
									<td class="px-4 py-3">
										<div class="flex items-center gap-2">
											<div class="h-1.5 w-12 overflow-hidden rounded-full bg-zinc-900">
												<div
													class="h-1.5 rounded-full bg-cyan-500 transition-all duration-300"
													style="width: {server.memory_usage}%"
												></div>
											</div>
											<span class="text-xs font-bold text-zinc-400"
												>{Math.round(server.memory_usage)}%</span
											>
										</div>
									</td>

									<!-- Disk -->
									<td class="px-4 py-3">
										<div class="flex items-center gap-2">
											<div class="h-1.5 w-12 overflow-hidden rounded-full bg-zinc-900">
												<div
													class="h-1.5 rounded-full bg-emerald-500 transition-all duration-300"
													style="width: {server.disk_usage}%"
												></div>
											</div>
											<span class="text-xs font-bold text-zinc-400"
												>{Math.round(server.disk_usage)}%</span
											>
										</div>
									</td>

									<!-- Tags -->
									<td class="px-4 py-3">
										<div class="flex flex-wrap gap-1">
											{#each server.tags.slice(0, 2) as tag (tag)}
												<span
													class="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[9px] font-bold tracking-wide text-zinc-400 uppercase"
												>
													{tag}
												</span>
											{/each}
											{#if server.tags.length > 2}
												<span
													class="rounded border border-zinc-800/50 bg-zinc-900/50 px-1.5 py-0.5 text-[9px] font-bold text-zinc-500"
												>
													+{server.tags.length - 2}
												</span>
											{/if}
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<!-- VIEW MODE: GRID -->
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each paginatedServers as server (server.id)}
						<div
							class="relative overflow-hidden rounded-2xl border transition-all duration-200 {selectedServerIDs.includes(
								server.id
							)
								? 'border-indigo-500 bg-indigo-950/5'
								: 'border-zinc-800 bg-zinc-950/20 hover:border-zinc-700'}"
						>
							<!-- Selection Toggle -->
							<input
								type="checkbox"
								checked={selectedServerIDs.includes(server.id)}
								onclick={() => toggleSelectServer(server.id)}
								class="absolute top-4 right-4 z-10 h-4.5 w-4.5 cursor-pointer rounded border-zinc-800 bg-zinc-900 text-indigo-600 outline-none focus:ring-0"
							/>

							<div class="flex flex-col gap-4 p-5">
								<div>
									<div class="flex items-center gap-2">
										<h3 class="font-display text-base font-bold text-zinc-200">{server.name}</h3>
										{#if server.status === 'online'}
											<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500"></span>
										{:else if server.status === 'offline'}
											<span class="h-1.5 w-1.5 rounded-full bg-red-500"></span>
										{:else}
											<span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
										{/if}
									</div>
									<div class="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
										<span>{server.provider}</span>
										<span>•</span>
										<span>{server.location}</span>
									</div>
								</div>

								<div class="grid grid-cols-3 gap-2 border-y border-zinc-900 py-3">
									<div class="flex flex-col items-center justify-center text-center">
										<Cpu class="mb-1 h-4 w-4 text-indigo-400" />
										<span class="text-[10px] font-bold text-zinc-500 uppercase">CPU</span>
										<span class="mt-0.5 text-xs font-bold text-zinc-300"
											>{Math.round(server.cpu_usage)}%</span
										>
									</div>
									<div
										class="flex flex-col items-center justify-center border-x border-zinc-900 text-center"
									>
										<Activity class="mb-1 h-4 w-4 text-cyan-400" />
										<span class="text-[10px] font-bold text-zinc-500 uppercase">RAM</span>
										<span class="mt-0.5 text-xs font-bold text-zinc-300"
											>{Math.round(server.memory_usage)}%</span
										>
									</div>
									<div class="flex flex-col items-center justify-center text-center">
										<HardDrive class="mb-1 h-4 w-4 text-emerald-400" />
										<span class="text-[10px] font-bold text-zinc-500 uppercase">DISK</span>
										<span class="mt-0.5 text-xs font-bold text-zinc-300"
											>{Math.round(server.disk_usage)}%</span
										>
									</div>
								</div>

								<div class="flex items-center justify-between text-xs text-zinc-400">
									<span class="font-mono">{server.ip}</span>
									<span
										>Uptime: {server.status === 'online'
											? `${Math.floor(server.uptime / 86400)}d`
											: 'Offline'}</span
									>
								</div>

								<div class="mt-1 flex flex-wrap gap-1">
									{#each server.tags as tag (tag)}
										<span
											class="border-zinc-850 rounded border bg-zinc-900 px-2 py-0.5 text-[8px] font-bold tracking-wide text-zinc-400 uppercase"
										>
											{tag}
										</span>
									{/each}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<!-- PAGINATION CONTROLS -->
			{#if totalPages > 1}
				<div
					class="flex items-center justify-between border-t border-zinc-900 pt-4 text-xs font-semibold text-zinc-500"
				>
					<span>
						Showing <strong class="text-zinc-300">{(currentPage - 1) * itemsPerPage + 1}</strong> to
						<strong class="text-zinc-300"
							>{Math.min(currentPage * itemsPerPage, totalServersCount)}</strong
						>
						of
						<strong class="text-zinc-300">{totalServersCount}</strong> nodes
					</span>

					<div class="flex items-center gap-1.5">
						<Button
							variant="outline"
							size="sm"
							class="px-2"
							onclick={() => (currentPage = Math.max(1, currentPage - 1))}
							disabled={currentPage === 1}
						>
							<ChevronLeft class="h-4 w-4" />
						</Button>
						{#each Array(totalPages) as _, idx (idx)}
							<button
								onclick={() => (currentPage = idx + 1)}
								class="h-8 w-8 rounded-lg border transition-all {currentPage === idx + 1
									? 'border-indigo-500 bg-indigo-600/10 text-indigo-400'
									: 'text-zinc-450 border-zinc-800 hover:bg-zinc-900/60 hover:text-zinc-200'}"
							>
								{idx + 1}
							</button>
						{/each}
						<Button
							variant="outline"
							size="sm"
							class="px-2"
							onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
							disabled={currentPage === totalPages}
						>
							<ChevronRight class="h-4 w-4" />
						</Button>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- CONNECT SERVER DIALOG / DRAWER OVERLAY -->
{#if isAddModalOpen}
	<!-- Backdrop -->
	<button
		onclick={closeModal}
		class="fixed inset-0 z-[9998] bg-black/75 backdrop-blur-sm"
		aria-label="Close dialog"
	></button>

	<!-- Modal -->
	<div
		transition:fly={{ y: 30, duration: 200 }}
		class="fixed top-1/2 left-1/2 z-[9999] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
	>
		<div class="mb-4 flex items-center justify-between border-b border-zinc-900 pb-4">
			<h2 class="flex items-center gap-2 font-display text-lg font-extrabold text-zinc-200">
				<Server class="h-5 w-5 text-indigo-400" /> Connect Virtual Node
			</h2>
			<button
				onclick={closeModal}
				class="rounded-lg p-1 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
			>
				<X class="h-5 w-5" />
			</button>
		</div>

		<form onsubmit={handleAddServerSubmit} class="space-y-4">
			<div>
				<label
					for="serverName"
					class="mb-1.5 block text-xs font-bold tracking-wider text-zinc-400 uppercase"
					>Server Name</label
				>
				<input
					id="serverName"
					type="text"
					bind:value={newServerName}
					placeholder="api-cluster-node-01"
					class="border-zinc-850 text-zinc-150 w-full rounded-lg border bg-zinc-900 px-3 py-2 text-xs transition-colors outline-none focus:border-indigo-500"
					required
				/>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label
						for="serverIP"
						class="mb-1.5 block text-xs font-bold tracking-wider text-zinc-400 uppercase"
						>IP Address</label
					>
					<input
						id="serverIP"
						type="text"
						bind:value={newServerIP}
						placeholder="10.0.1.45"
						class="border-zinc-850 text-zinc-150 w-full rounded-lg border bg-zinc-900 px-3 py-2 text-xs transition-colors outline-none focus:border-indigo-500"
						required
					/>
				</div>
				<div>
					<label
						for="serverOS"
						class="mb-1.5 block text-xs font-bold tracking-wider text-zinc-400 uppercase"
						>Operating System</label
					>
					<select
						id="serverOS"
						bind:value={newServerOS}
						class="border-zinc-850 text-zinc-150 w-full rounded-lg border bg-zinc-900 px-3 py-2 text-xs transition-colors outline-none focus:border-indigo-500"
					>
						<option value="Ubuntu 22.04 LTS">Ubuntu 22.04</option>
						<option value="Ubuntu 20.04 LTS">Ubuntu 20.04</option>
						<option value="Debian 12 Bookworm">Debian 12</option>
						<option value="Rocky Linux 9">Rocky Linux 9</option>
					</select>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label
						for="serverProvider"
						class="mb-1.5 block text-xs font-bold tracking-wider text-zinc-400 uppercase"
						>Cloud Provider</label
					>
					<select
						id="serverProvider"
						bind:value={newServerProvider}
						class="border-zinc-850 text-zinc-150 w-full rounded-lg border bg-zinc-900 px-3 py-2 text-xs transition-colors outline-none focus:border-indigo-500"
					>
						<option value="AWS">AWS</option>
						<option value="GCP">GCP</option>
						<option value="Hetzner">Hetzner</option>
						<option value="DigitalOcean">DigitalOcean</option>
						<option value="Scaleway">Scaleway</option>
					</select>
				</div>
				<div>
					<label
						for="serverLocation"
						class="mb-1.5 block text-xs font-bold tracking-wider text-zinc-400 uppercase"
						>Geo Region</label
					>
					<input
						id="serverLocation"
						type="text"
						bind:value={newServerLocation}
						placeholder="Frankfurt, DE"
						class="border-zinc-850 text-zinc-150 w-full rounded-lg border bg-zinc-900 px-3 py-2 text-xs transition-colors outline-none focus:border-indigo-500"
					/>
				</div>
			</div>

			<div>
				<label
					for="serverTags"
					class="mb-1.5 block text-xs font-bold tracking-wider text-zinc-400 uppercase"
					>Tags (comma separated)</label
				>
				<input
					id="serverTags"
					type="text"
					bind:value={newServerTagsInput}
					placeholder="production, proxy, database"
					class="border-zinc-850 text-zinc-150 w-full rounded-lg border bg-zinc-900 px-3 py-2 text-xs transition-colors outline-none focus:border-indigo-500"
				/>
			</div>

			<!-- SSH Connection Credentials -->
			<div class="mt-4 space-y-4 border-t border-zinc-900 pt-4">
				<h3 class="text-xs font-extrabold tracking-widest text-indigo-400 uppercase">
					SSH Connection Info
				</h3>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label
							for="sshUser"
							class="mb-1.5 block text-[10px] font-bold tracking-wider text-zinc-400 uppercase"
							>SSH Username</label
						>
						<input
							id="sshUser"
							type="text"
							bind:value={newServerSSHUser}
							placeholder="root"
							class="border-zinc-850 text-zinc-150 w-full rounded-lg border bg-zinc-900 px-3 py-2 text-xs transition-colors outline-none focus:border-indigo-500"
							required
						/>
					</div>
					<div>
						<label
							for="sshPort"
							class="mb-1.5 block text-[10px] font-bold tracking-wider text-zinc-400 uppercase"
							>SSH Port</label
						>
						<input
							id="sshPort"
							type="number"
							bind:value={newServerSSHPort}
							placeholder="22"
							class="border-zinc-850 text-zinc-150 w-full rounded-lg border bg-zinc-900 px-3 py-2 text-xs transition-colors outline-none focus:border-indigo-500"
							required
						/>
					</div>
				</div>

				<div>
					<label
						for="sshAuthMethod"
						class="mb-1.5 block text-[10px] font-bold tracking-wider text-zinc-400 uppercase"
						>Authentication Method</label
					>
					<select
						id="sshAuthMethod"
						bind:value={newServerSSHAuthMethod}
						class="border-zinc-850 text-zinc-150 w-full rounded-lg border bg-zinc-900 px-3 py-2 text-xs transition-colors outline-none focus:border-indigo-500"
					>
						<option value="password">Password</option>
						<option value="private_key">SSH Private Key</option>
					</select>
				</div>

				{#if newServerSSHAuthMethod === 'password'}
					<div>
						<label
							for="sshPassword"
							class="mb-1.5 block text-[10px] font-bold tracking-wider text-zinc-400 uppercase"
							>SSH Password</label
						>
						<input
							id="sshPassword"
							type="password"
							bind:value={newServerSSHPassword}
							placeholder="••••••••"
							class="border-zinc-850 text-zinc-150 w-full rounded-lg border bg-zinc-900 px-3 py-2 text-xs transition-colors outline-none focus:border-indigo-500"
							required
						/>
					</div>
				{:else}
					<div class="space-y-4">
						<div>
							<label
								for="sshPrivateKey"
								class="mb-1.5 block text-[10px] font-bold tracking-wider text-zinc-400 uppercase"
								>Private Key PEM</label
							>
							<textarea
								id="sshPrivateKey"
								bind:value={newServerSSHPrivateKey}
								placeholder="-----BEGIN OPENSSH PRIVATE KEY-----..."
								rows="3"
								class="border-zinc-850 text-zinc-150 w-full rounded-lg border bg-zinc-900 px-3 py-2 font-mono text-[10px] transition-colors outline-none focus:border-indigo-500"
								required></textarea>
						</div>
						<div>
							<label
								for="sshPassphrase"
								class="mb-1.5 block text-[10px] font-bold tracking-wider text-zinc-400 uppercase"
								>Key Passphrase (optional)</label
							>
							<input
								id="sshPassphrase"
								type="password"
								bind:value={newServerSSHPassphrase}
								placeholder="Decryption passphrase"
								class="border-zinc-850 text-zinc-150 w-full rounded-lg border bg-zinc-900 px-3 py-2 text-xs transition-colors outline-none focus:border-indigo-500"
							/>
						</div>
					</div>
				{/if}
			</div>

			<div class="mt-6 flex items-center justify-between gap-2 border-t border-zinc-900 pt-4">
				<Button
					type="button"
					variant="outline"
					size="sm"
					class="px-3"
					onclick={handleTestConnection}
					loading={isTestingConnection}
				>
					<Terminal class="mr-1.5 h-3.5 w-3.5" /> Test Connection
				</Button>
				<div class="flex gap-2">
					<Button variant="ghost" size="sm" onclick={closeModal}>Cancel</Button>
					<Button type="submit" size="sm" loading={addServerMutation.isPending}>
						Connect Node
					</Button>
				</div>
			</div>
		</form>
	</div>
{/if}
