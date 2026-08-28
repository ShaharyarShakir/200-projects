<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getVideos } from '$lib/api/videos';
	import { toast } from '$lib/state/toast.svelte';
	import type { Project } from '$lib/types/project';
	import type { Video } from '$lib/types/video';
	import { Video as VideoIcon, Plus, X, Film, Clock, ExternalLink, Sparkles } from 'lucide-svelte';


	let {
		project,
		isOpen,
		onClose,
		onOpenAddVideo
	}: {
		project: Project | null;
		isOpen: boolean;
		onClose: () => void;
		onOpenAddVideo: () => void;
	} = $props();

	let videos = $state<Video[]>([]);
	let loading = $state(false);

	$effect(() => {
		if (isOpen && project) {
			loadVideos();
		}
	});

	async function loadVideos() {
		if (!project) return;
		loading = true;

		try {
			videos = await getVideos(project.id);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to load videos';
			toast.show(msg, 'error');
		} finally {
			loading = false;
		}
	}

	function getStatusBadge(status: string) {
		switch (status.toLowerCase()) {
			case 'completed':
				return 'badge-success text-black font-semibold';
			case 'processing':
				return 'badge-warning text-black font-semibold';
			case 'failed':
				return 'badge-error text-white font-semibold';
			default:
				return 'badge-ghost text-gray-300';
		}
	}

	async function handleOpenStudio(video: Video) {
		if (!project) return;
		onClose();
		await goto(`/projects/${project.id}/videos/${video.id}`);
	}
</script>

{#if isOpen && project}
	<div class="fixed inset-0 z-50 flex items-center justify-end">
		<!-- Backdrop -->
		<button
			tabindex="-1"
			class="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
			onclick={onClose}
			aria-label="Close Drawer"
		></button>

		<!-- Slide-over Drawer Panel -->
		<div class="relative flex h-full w-full max-w-md flex-col border-l border-white/10 bg-obsidian-card p-6 shadow-2xl backdrop-blur-2xl animate-fade-in z-10">
			<!-- Drawer Header -->
			<div class="flex items-center justify-between border-b border-white/10 pb-4">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30">
						<VideoIcon class="h-5 w-5" />
					</div>
					<div>
						<h2 class="font-heading text-lg font-bold text-white">{project.name}</h2>
						<p class="text-xs text-gray-400">Video Pipelines ({videos.length})</p>
					</div>
				</div>

				<button
					onclick={onClose}
					class="btn btn-ghost btn-xs btn-square text-gray-400 hover:text-white"
					aria-label="Close"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Drawer Body -->
			<div class="my-4 flex-1 overflow-y-auto pr-1 space-y-4">
				{#if loading}
					<div class="space-y-3">
						{#each Array(3) as _}
							<div class="h-20 rounded-2xl bg-white/5 animate-pulse"></div>
						{/each}
					</div>
				{:else if videos.length === 0}
					<div class="py-12 text-center border border-dashed border-white/10 rounded-2xl">
						<Film class="mx-auto h-10 w-10 text-gray-500 mb-2" />
						<p class="text-xs font-semibold text-gray-300">No Videos Rendered</p>
						<p class="text-[11px] text-gray-500 mt-1">Add a video title to start processing scenes.</p>
					</div>
				{:else}
					{#each videos as video (video.id)}
						<button
							type="button"
							onclick={() => handleOpenStudio(video)}
							class="w-full text-left rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:border-emerald-500/50 hover:bg-white/[0.08] cursor-pointer group"
						>
							<div class="flex items-start justify-between gap-2">
								<h3 class="font-heading text-sm font-bold text-white group-hover:text-emerald-400 flex items-center gap-1.5 transition-colors">
									{video.title}
									<ExternalLink class="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
								</h3>
								<span class="badge badge-xs {getStatusBadge(video.status)} px-2 py-0.5 uppercase tracking-wider">
									{video.status}
								</span>
							</div>

							{#if video.description}
								<p class="mt-1 text-xs text-gray-400 line-clamp-2">{video.description}</p>
							{/if}

							<div class="mt-3 flex items-center justify-between border-t border-white/10 pt-2 text-[10px] text-gray-500 font-mono">
								<span class="flex items-center gap-1">
									<Clock class="h-3 w-3" />
									{new Date(video.created_at).toLocaleDateString()}
								</span>
								<span class="text-emerald-400 font-semibold flex items-center gap-1 group-hover:underline">
									<Sparkles class="h-3 w-3 text-purple-400 animate-pulse" />
									<span>AI Studio & Generate →</span>
								</span>
							</div>
						</button>

					{/each}
				{/if}
			</div>

			<!-- Drawer Footer Action -->
			<div class="border-t border-white/10 pt-4">
				<button
					onclick={() => {
						onClose();
						onOpenAddVideo();
					}}
					class="btn-emerald w-full py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2"
				>
					<Plus class="h-4 w-4" />
					Add New Video to {project.name}
				</button>
			</div>
		</div>
	</div>
{/if}
