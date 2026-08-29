<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getProjects, deleteProject } from '$lib/api/projects';
	import { getCurrentUser } from '$lib/api/auth';
	import { auth } from '$lib/state/auth.svelte';
	import { toast } from '$lib/state/toast.svelte';

	import Navbar from '$lib/components/Navbar.svelte';
	import FormatCardGrid from '$lib/components/dashboard/FormatCardGrid.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import CreateProjectModal from '$lib/components/CreateProjectModal.svelte';
	import CreateVideoModal from '$lib/components/CreateVideoModal.svelte';
	import VideoDrawerModal from '$lib/components/VideoDrawerModal.svelte';
	import Toast from '$lib/components/Toast.svelte';

	import { Plus, Search, Sparkles, Folder } from 'lucide-svelte';
	import type { Project } from '$lib/types/project';

	let projects = $state<Project[]>([]);
	let searchQuery = $state('');
	let loading = $state(true);
	let error = $state('');

	// Modal States
	let isCreateProjectOpen = $state(false);
	let isCreateVideoOpen = $state(false);
	let isVideoDrawerOpen = $state(false);
	let selectedProject = $state<Project | null>(null);

	onMount(async () => {
		if (!auth.accessToken) {
			await goto('/login');
			return;
		}

		try {
			if (!auth.user) {
				const user = await getCurrentUser();
				auth.user = user;
			}
			projects = await getProjects();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load workspace projects';
			if (error.includes('Could not validate credentials') || error.includes('401')) {
				auth.logout();
				await goto('/login');
			}
		} finally {
			loading = false;
		}
	});

	const filteredProjects = $derived(
		projects.filter(
			(p) =>
				p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
		)
	);

	function handleProjectCreated(newProject: Project) {
		projects = [newProject, ...projects];
	}

	function handleOpenViewVideos(project: Project) {
		selectedProject = project;
		isVideoDrawerOpen = true;
	}

	function handleOpenCreateVideo(project: Project) {
		selectedProject = project;
		isCreateVideoOpen = true;
	}

	function handleStartFormat(formatTitle: string) {
		if (projects.length > 0) {
			selectedProject = projects[0];
			isCreateVideoOpen = true;
		} else {
			isCreateProjectOpen = true;
		}
		toast.show(`Selected format: ${formatTitle}`, 'info');
	}

	async function handleDeleteProject(project: Project) {
		if (!confirm(`Are you sure you want to delete "${project.name}"?`)) return;

		try {
			await deleteProject(project.id);
			projects = projects.filter((p) => p.id !== project.id);
			toast.show('Project deleted successfully', 'success');
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to delete project';
			toast.show(msg, 'error');
		}
	}
</script>

<svelte:head>
	<title>Brainrot Shorts - Studio Dashboard</title>
</svelte:head>

<div class="relative min-h-screen bg-[#08090d] text-gray-100 selection:bg-emerald-500/30">
	<!-- Background Ambient Glowing Orbs -->
	<div class="pointer-events-none absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-emerald-600/10 blur-[140px] animate-ambient-1"></div>
	<div class="pointer-events-none absolute top-1/3 right-1/4 h-[400px] w-[400px] rounded-full bg-cyan-600/10 blur-[140px] animate-ambient-2"></div>

	<!-- Top Navigation Bar -->
	<Navbar onOpenCreateModal={() => (isCreateProjectOpen = true)} />

	<main class="mx-auto max-w-[1400px] px-4 sm:px-8 py-10 relative z-10 space-y-12">
		
		<!-- Hero Banner & Format Explorer Grid Component -->
		<FormatCardGrid
			onStartFormat={handleStartFormat}
			onOpenCreateProject={() => (isCreateProjectOpen = true)}
		/>

		<!-- WORKSPACE PROJECTS SECTION -->
		<div class="pt-6 space-y-6">
			<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-4">
				<div>
					<h2 class="font-heading text-2xl font-bold text-white flex items-center gap-2">
						<Folder class="h-6 w-6 text-emerald-400" />
						Your Projects
					</h2>
					<p class="text-xs text-gray-400">
						Manage existing video channels, multi-scene compositions, and renders.
					</p>
				</div>

				<div class="flex items-center gap-3">
					<div class="relative w-full sm:w-72">
						<Search class="absolute left-3.5 top-2.5 h-4 w-4 text-gray-500" />
						<input
							type="text"
							bind:value={searchQuery}
							placeholder="Search projects..."
							class="input input-sm w-full pl-9 bg-[#0f121d] border-white/10 focus:border-emerald-500 text-xs text-white rounded-xl"
						/>
					</div>

					<button
						onclick={() => (isCreateProjectOpen = true)}
						class="btn-emerald px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-lg shadow-emerald-500/20"
					>
						<Plus class="h-4 w-4" />
						<span>New Project</span>
					</button>
				</div>
			</div>

			<!-- Dashboard Stat Widgets -->
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<StatCard
					title="Total Projects"
					value={projects.length}
					subtext="Active channels"
					icon="folder"
					color="emerald"
				/>
				<StatCard
					title="AI Engine Status"
					value="Ready"
					subtext="Ollama & Pipeline active"
					icon="bot"
					color="emerald"
				/>
				<StatCard
					title="Video Queue"
					value="Idle"
					subtext="0 background renders"
					icon="video"
					color="blue"
				/>
				<StatCard
					title="Storage Tier"
					value="Postgres"
					subtext="pgvector enabled"
					icon="zap"
					color="pink"
				/>
			</div>

			<!-- Projects Content Grid -->
			{#if loading}
				<div class="grid gap-6 md:grid-cols-3">
					{#each Array(3) as _}
						<div class="bg-[#0f121d] rounded-2xl p-6 space-y-4 animate-pulse border border-white/10">
							<div class="h-10 w-10 rounded-xl bg-white/10"></div>
							<div class="h-6 w-3/4 rounded-lg bg-white/10"></div>
							<div class="h-4 w-full rounded bg-white/5"></div>
						</div>
					{/each}
				</div>
			{:else if error}
				<div class="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
					{error}
				</div>
			{:else if projects.length === 0}
				<div class="bg-[#0f121d] rounded-3xl p-12 text-center border border-dashed border-white/10 my-4">
					<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-4 shadow-xl">
						<Sparkles class="h-8 w-8" />
					</div>
					<h3 class="font-heading text-xl font-bold text-white">No Projects Created Yet</h3>
					<p class="mt-1 text-xs text-gray-400 max-w-sm mx-auto">
						Start by picking a format above or creating a project folder to organize your video renders.
					</p>
					<button
						onclick={() => (isCreateProjectOpen = true)}
						class="mt-6 btn-emerald text-xs px-6 py-2.5 rounded-full inline-flex items-center gap-2 shadow-lg shadow-emerald-500/25 font-bold"
					>
						<Plus class="h-4 w-4" />
						Create First Project
					</button>
				</div>
			{:else if filteredProjects.length === 0}
				<div class="bg-[#0f121d] rounded-2xl p-8 text-center border border-white/10">
					<p class="text-xs text-gray-400">No projects match "{searchQuery}"</p>
				</div>
			{:else}
				<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{#each filteredProjects as project (project.id)}
						<ProjectCard
							{project}
							onViewVideos={handleOpenViewVideos}
							onCreateVideo={handleOpenCreateVideo}
							onDelete={handleDeleteProject}
						/>
					{/each}
				</div>
			{/if}
		</div>
	</main>
</div>

<!-- Modals & Toasts -->
<CreateProjectModal
	isOpen={isCreateProjectOpen}
	onClose={() => (isCreateProjectOpen = false)}
	onCreated={handleProjectCreated}
/>

<CreateVideoModal
	project={selectedProject}
	isOpen={isCreateVideoOpen}
	onClose={() => (isCreateVideoOpen = false)}
	onCreated={() => {
		if (selectedProject) handleOpenViewVideos(selectedProject);
	}}
/>

<VideoDrawerModal
	project={selectedProject}
	isOpen={isVideoDrawerOpen}
	onClose={() => (isVideoDrawerOpen = false)}
	onOpenAddVideo={() => (isCreateVideoOpen = true)}
/>

<Toast />
