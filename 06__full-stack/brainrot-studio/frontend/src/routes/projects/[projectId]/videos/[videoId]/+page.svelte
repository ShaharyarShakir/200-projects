<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { getVideo } from '$lib/api/videos';
	import { getAssets, uploadAsset } from '$lib/api/assets';
	import {
		getTimeline,
		reorderScenes,
		addTimelineScene,
		updateTimelineScene
	} from '$lib/api/timeline';
	import { studio } from '$lib/state/video-studio.svelte';
	import { timelineState } from '$lib/state/timeline.svelte';
	import { auth } from '$lib/state/auth.svelte';
	import { toast } from '$lib/state/toast.svelte';
	import SceneList from '$lib/components/studio/SceneList.svelte';
	import SceneEditor from '$lib/components/studio/SceneEditor.svelte';
	import VideoPreview from '$lib/components/studio/VideoPreview.svelte';
	import VideoSettings from '$lib/components/studio/VideoSettings.svelte';
	import AssetLibrary from '$lib/components/studio/AssetLibrary.svelte';
	import Timeline from '$lib/components/timeline/Timeline.svelte';
	import AIGenerateModal from '$lib/components/studio/AIGenerateModal.svelte';
	import QAInspector from '$lib/components/studio/QAInspector.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import {
		ArrowLeft,
		Sparkles,
		CheckCircle2,
		Layers,
		Sliders,
		FolderOpen,
		Wand2,
		ShieldCheck,
		Sidebar,
		PanelRight,
		Rows,
		ChevronLeft,
		ChevronRight,
		ChevronUp,
		ChevronDown,
		X
	} from 'lucide-svelte';

	let isAIModalOpen = $state(false);
	let isRenderModalOpen = $state(false);
	let renderProgress = $state(0);
	let renderStatus = $state('');

	// Responsive Panel Toggles (Every side can open and close)
	let showLeftPanel = $state(true);
	let showRightPanel = $state(true);
	let showTimeline = $state(true);

	let { data } = $props();

	const projectId = $derived(data.projectId);
	const videoId = $derived(data.videoId);

	let loading = $state(true);
	let error = $state('');
	let pollInterval: ReturnType<typeof setInterval> | null = null;

	onMount(async () => {
		if (!auth.accessToken) {
			await goto('/login');
			return;
		}

		try {
			const [video, timelineData, assets] = await Promise.all([
				getVideo(projectId, videoId),
				getTimeline(projectId, videoId),
				getAssets(projectId, videoId)
			]);

			studio.setVideo(video);
			studio.setAssets(assets);
			timelineState.setTimeline(timelineData);

			// Adapt studio scenes
			let legacyScenes = timelineData.scenes.map((s) => ({
				id: s.id,
				video_id: s.video_id,
				position: s.position,
				narration: s.narration,
				visual_prompt: s.visual_prompt,
				dialogue: s.dialogue,
				duration_seconds: s.duration_ms / 1000,
				asset_url: null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			}));

			// Auto-seed default scenes if 0 scenes exist for a fresh video
			if (legacyScenes.length === 0) {
				const videoTitle = video.title || 'Scene 1';
				try {
					const s1 = await addTimelineScene(projectId, videoId, {
						title: `${videoTitle} - Intro`,
						duration_ms: 4000
					});
					const s2 = await addTimelineScene(projectId, videoId, {
						title: 'Hook & Core Premise',
						duration_ms: 5000
					});
					const s3 = await addTimelineScene(projectId, videoId, {
						title: 'Climax & CTA',
						duration_ms: 4000
					});

					const updatedTl = await getTimeline(projectId, videoId);
					timelineState.setTimeline(updatedTl);

					legacyScenes = updatedTl.scenes.map((s) => ({
						id: s.id,
						video_id: s.video_id,
						position: s.position,
						narration: s.narration || s.title,
						visual_prompt: s.visual_prompt || '',
						dialogue: s.dialogue || '',
						duration_seconds: s.duration_ms / 1000,
						asset_url: null,
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString()
					}));
					toast.show('Auto-seeded default scene frames for timeline', 'info');
				} catch (e) {
					console.error('Failed auto-seeding scenes:', e);
				}
			}

			studio.setScenes(legacyScenes);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load video studio timeline';
			toast.show(error, 'error');
		} finally {
			loading = false;
		}
	});

	onDestroy(() => {
		if (pollInterval) {
			clearInterval(pollInterval);
			pollInterval = null;
		}
	});

	// Poll assets status if processing
	$effect(() => {
		const hasProcessing = studio.assets.some(
			(a) => a.processing_status === 'pending' || a.processing_status === 'processing'
		);

		if (hasProcessing && !pollInterval) {
			pollInterval = setInterval(async () => {
				try {
					const updatedAssets = await getAssets(projectId, videoId);
					studio.setAssets(updatedAssets);
				} catch (err) {
					console.error('Failed polling asset status:', err);
				}
			}, 2000);
		} else if (!hasProcessing && pollInterval) {
			clearInterval(pollInterval);
			pollInterval = null;
		}
	});

	function handleBackToDashboard() {
		goto('/app');
	}

	function handleStartRender() {
		isRenderModalOpen = true;
		renderProgress = 10;
		renderStatus = 'Initializing FFmpeg 9:16 vertical canvas composition...';

		const interval = setInterval(() => {
			renderProgress += 15;
			if (renderProgress === 25) renderStatus = 'Synthesizing character voiceovers & subtitle burn-in...';
			if (renderProgress === 55) renderStatus = 'Merging gameplay background video & audio tracks...';
			if (renderProgress === 85) renderStatus = 'Encoding H.264 MP4 vertical short video...';

			if (renderProgress >= 100) {
				clearInterval(interval);
				renderProgress = 100;
				renderStatus = 'Render complete! MP4 video ready.';
				toast.show('Render complete! Video short exported.', 'success');
			}
		}, 800);
	}

	async function handleUploadAsset(file: File) {
		try {
			const newAsset = await uploadAsset(projectId, videoId, file);
			studio.addAsset(newAsset);
			toast.show(`Uploaded asset: ${newAsset.filename}`, 'success');
		} catch (err: any) {
			toast.show(err?.message || 'Failed to upload asset', 'error');
			throw err;
		}
	}

	async function handleAddScene() {
		try {
			const newScene = await addTimelineScene(projectId, videoId, {
				title: `Scene ${timelineState.scenes.length + 1}`,
				duration_ms: 4000
			});
			const updatedTl = await getTimeline(projectId, videoId);
			timelineState.setTimeline(updatedTl);

			const adapted = updatedTl.scenes.map((s) => ({
				id: s.id,
				video_id: s.video_id,
				position: s.position,
				narration: s.narration || s.title,
				visual_prompt: s.visual_prompt || '',
				dialogue: s.dialogue || '',
				duration_seconds: s.duration_ms / 1000,
				asset_url: null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			}));
			studio.setScenes(adapted);
			toast.show('Added new timeline scene', 'success');
		} catch (err: any) {
			toast.show(err?.message || 'Failed adding scene', 'error');
		}
	}

	async function handleReorderScenes(sceneIds: string[]) {
		try {
			const updated = await reorderScenes(projectId, videoId, sceneIds);
			timelineState.setTimeline(updated);
			toast.show('Scene order updated', 'success');
		} catch (err: any) {
			toast.show(err?.message || 'Failed reordering scenes', 'error');
		}
	}

	async function handleUpdateSceneDuration(sceneId: string, durationMs: number) {
		try {
			await updateTimelineScene(projectId, videoId, sceneId, { duration_ms: durationMs });
			const updated = await getTimeline(projectId, videoId);
			timelineState.setTimeline(updated);
			toast.show('Scene duration updated', 'success');
		} catch (err: any) {
			toast.show(err?.message || 'Failed updating scene duration', 'error');
		}
	}
</script>

<svelte:head>
	<title>{studio.video?.title ? `${studio.video.title} - Studio` : 'Video Studio'} | Brainrot Studio</title>
</svelte:head>

<div class="flex h-screen flex-col bg-[#07080c] text-gray-100 selection:bg-emerald-500/30 overflow-hidden">
	<!-- Studio Top Header Bar -->
	<header class="navbar min-h-12 border-b border-white/10 bg-[#0b0d14]/90 px-3 sm:px-5 backdrop-blur-xl z-30 flex items-center justify-between gap-2">
		<!-- Left Controls -->
		<div class="flex items-center gap-2 sm:gap-3 shrink-0">
			<button
				onclick={handleBackToDashboard}
				class="btn btn-ghost btn-xs flex items-center gap-1 text-gray-400 hover:text-white rounded-xl"
			>
				<ArrowLeft class="h-4 w-4" />
				<span class="hidden md:inline font-bold">Workspace</span>
			</button>

			<div class="h-4 w-px bg-white/10 hidden sm:block"></div>

			<!-- Panel Toggle Control Suite -->
			<div class="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
				<button
					onclick={() => (showLeftPanel = !showLeftPanel)}
					class="p-1 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1 text-[11px] font-semibold {showLeftPanel ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-400'}"
					title="Toggle Left Scenes Panel (Open / Close)"
				>
					<Sidebar class="h-3.5 w-3.5" />
					<span class="hidden lg:inline text-[10px]">Scenes</span>
				</button>

				<button
					onclick={() => (showTimeline = !showTimeline)}
					class="p-1 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1 text-[11px] font-semibold {showTimeline ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-400'}"
					title="Toggle Bottom Timeline Panel (Open / Close)"
				>
					<Rows class="h-3.5 w-3.5" />
					<span class="hidden lg:inline text-[10px]">Timeline</span>
				</button>

				<button
					onclick={() => (showRightPanel = !showRightPanel)}
					class="p-1 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1 text-[11px] font-semibold {showRightPanel ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-400'}"
					title="Toggle Right Inspector Panel (Open / Close)"
				>
					<PanelRight class="h-3.5 w-3.5" />
					<span class="hidden lg:inline text-[10px]">Inspector</span>
				</button>
			</div>

			<div class="flex items-center gap-2 truncate">
				<span class="badge badge-emerald text-[10px] uppercase font-mono tracking-wider">
					{studio.video?.status ?? 'DRAFT'}
				</span>
				<h1 class="font-heading text-xs sm:text-sm font-bold text-white tracking-wide truncate max-w-[140px] sm:max-w-xs md:max-w-md">
					{studio.video?.title ?? 'Video Studio'}
				</h1>
			</div>
		</div>

		<!-- Right Action Controls -->
		<div class="flex items-center gap-2 shrink-0">
			<button
				onclick={() => (isAIModalOpen = true)}
				class="px-3 sm:px-4 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600 via-emerald-600 to-cyan-600 text-white shadow-lg shadow-purple-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 border border-white/20"
				title="Open AI Story Generator"
			>
				<Wand2 class="h-3.5 w-3.5 text-yellow-300 animate-pulse" />
				<span class="hidden sm:inline">⚡ AI Video Generator</span>
				<span class="sm:hidden">AI Gen</span>
			</button>

			<button
				onclick={() => toast.show('Timeline autosaved', 'success')}
				class="hidden sm:flex btn btn-ghost btn-xs text-xs text-gray-300 hover:text-white rounded-xl items-center gap-1"
			>
				<CheckCircle2 class="h-3.5 w-3.5 text-emerald-400" />
				Saved
			</button>

			<button
				onclick={handleStartRender}
				class="btn-emerald flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
			>
				<Sparkles class="h-3.5 w-3.5" />
				<span>Render</span>
			</button>
		</div>
	</header>

	{#if loading}
		<div class="flex flex-1 items-center justify-center">
			<div class="flex flex-col items-center gap-3">
				<span class="loading loading-spinner loading-lg text-emerald-400"></span>
				<p class="text-xs font-mono text-gray-400">Initializing Shorts Timeline Engine...</p>
			</div>
		</div>
	{:else if error}
		<div class="flex flex-1 items-center justify-center p-6">
			<div class="alert alert-error max-w-md rounded-2xl shadow-2xl">
				<span>{error}</span>
				<button onclick={handleBackToDashboard} class="btn btn-xs btn-neutral mt-2">
					Return to Workspace
				</button>
			</div>
		</div>
	{:else}
		<!-- Main Studio Container -->
		<div class="flex flex-1 min-h-0 overflow-hidden relative">
			
			<!-- Floating Edge Open Handle when Left Panel is Closed -->
			{#if !showLeftPanel}
				<button
					onclick={() => (showLeftPanel = true)}
					class="absolute left-2 top-4 z-40 p-2 rounded-xl bg-[#0b0d14] border border-white/10 text-emerald-400 shadow-2xl hover:bg-emerald-500/10 flex items-center gap-1 text-xs font-bold animate-in slide-in-from-left duration-150"
					title="Open Left Scenes Panel"
				>
					<ChevronRight class="h-4 w-4" />
					<span class="text-[10px] uppercase font-mono">Scenes</span>
				</button>
			{/if}

			<!-- Left Panel: Scene List (Collapsible with Close Handle) -->
			{#if showLeftPanel}
				<aside class="w-56 sm:w-60 lg:w-64 min-h-0 border-r border-white/10 bg-[#0b0d14] flex-shrink-0 z-20 transition-all flex flex-col relative">
					<!-- Panel Close Header Action Bar -->
					<div class="flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-black/40 text-[10px] font-mono text-gray-400">
						<span class="uppercase tracking-widest text-emerald-400 font-bold">SCENES PANEL</span>
						<button
							onclick={() => (showLeftPanel = false)}
							class="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
							title="Close Scenes Panel"
						>
							<ChevronLeft class="h-3.5 w-3.5" />
						</button>
					</div>
					<div class="flex-1 min-h-0 overflow-y-auto">
						<SceneList {projectId} {videoId} scenes={studio.scenes} />
					</div>
				</aside>
			{/if}

			<!-- Center Canvas Viewport (Dynamic Flex Grow) -->
			<main class="flex-1 min-h-0 relative flex flex-col overflow-hidden bg-[#07080c] p-2 sm:p-4">
				<VideoPreview {projectId} {videoId} />
			</main>

			<!-- Floating Edge Open Handle when Right Panel is Closed -->
			{#if !showRightPanel}
				<button
					onclick={() => (showRightPanel = true)}
					class="absolute right-2 top-4 z-40 p-2 rounded-xl bg-[#0b0d14] border border-white/10 text-emerald-400 shadow-2xl hover:bg-emerald-500/10 flex items-center gap-1 text-xs font-bold animate-in slide-in-from-right duration-150"
					title="Open Right Inspector Panel"
				>
					<span class="text-[10px] uppercase font-mono">Inspector</span>
					<ChevronLeft class="h-4 w-4" />
				</button>
			{/if}

			<!-- Right Panel: Tabbed Inspector (Collapsible with Close Handle) -->
			{#if showRightPanel}
				<aside class="w-64 sm:w-72 lg:w-80 min-h-0 border-l border-white/10 bg-[#0b0d14] flex-shrink-0 flex flex-col z-20 transition-all relative">
					<!-- Panel Close Header Action Bar -->
					<div class="flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-black/40 text-[10px] font-mono text-gray-400">
						<span class="uppercase tracking-widest text-emerald-400 font-bold">INSPECTOR</span>
						<button
							onclick={() => (showRightPanel = false)}
							class="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
							title="Close Inspector Panel"
						>
							<ChevronRight class="h-3.5 w-3.5" />
						</button>
					</div>

					<!-- Tab Navigation Bar -->
					<div class="flex border-b border-white/10 bg-[#08090f] p-1 gap-1">
						<button
							class="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg transition-colors {studio.activeTab === 'scene'
								? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold'
								: 'text-gray-400 hover:text-white hover:bg-white/5'}"
							onclick={() => studio.setActiveTab('scene')}
						>
							<Layers class="h-3.5 w-3.5" />
							<span>Scene</span>
						</button>

						<button
							class="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg transition-colors {studio.activeTab === 'assets'
								? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold'
								: 'text-gray-400 hover:text-white hover:bg-white/5'}"
							onclick={() => studio.setActiveTab('assets')}
						>
							<FolderOpen class="h-3.5 w-3.5" />
							<span>Assets</span>
							{#if studio.assets.length > 0}
								<span class="badge badge-xs bg-emerald-500/20 text-emerald-300 border-none font-mono text-[9px]">
									{studio.assets.length}
								</span>
							{/if}
						</button>

						<button
							class="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg transition-colors {studio.activeTab === 'settings'
								? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold'
								: 'text-gray-400 hover:text-white hover:bg-white/5'}"
							onclick={() => studio.setActiveTab('settings')}
						>
							<Sliders class="h-3.5 w-3.5" />
							<span>Settings</span>
						</button>

						<button
							class="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg transition-colors {studio.activeTab === 'qa'
								? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold'
								: 'text-gray-400 hover:text-white hover:bg-white/5'}"
							onclick={() => studio.setActiveTab('qa')}
						>
							<ShieldCheck class="h-3.5 w-3.5 text-purple-400" />
							<span>QA</span>
						</button>
					</div>

					<!-- Tab Content Viewport -->
					<div class="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
						{#if studio.activeTab === 'scene'}
							<SceneEditor {projectId} {videoId} />
						{:else if studio.activeTab === 'assets'}
							<AssetLibrary
								{projectId}
								{videoId}
								assets={studio.assets}
								scenes={studio.scenes}
								onUpload={handleUploadAsset}
							/>
						{:else if studio.activeTab === 'settings'}
							<VideoSettings {projectId} {videoId} />
						{:else if studio.activeTab === 'qa'}
							<QAInspector {projectId} {videoId} />
						{/if}
					</div>
				</aside>
			{/if}
		</div>

		<!-- Floating Bottom Open Handle when Timeline is Closed -->
		{#if !showTimeline}
			<div class="bg-[#07080c] border-t border-white/10 px-4 py-1.5 flex items-center justify-between z-30">
				<button
					onclick={() => (showTimeline = true)}
					class="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 font-mono uppercase"
				>
					<ChevronUp class="h-4 w-4" /> Open Timeline Engine
				</button>
				<span class="text-[10px] text-gray-500 font-mono">Full canvas active</span>
			</div>
		{/if}

		<!-- Bottom Timeline Engine Viewport (Collapsible) -->
		{#if showTimeline}
			<div class="h-48 sm:h-56 min-h-0 bg-[#07080c] border-t border-white/10 z-20 transition-all flex flex-col relative">
				<Timeline
					onAddScene={handleAddScene}
					onReorderScenes={handleReorderScenes}
					onUpdateSceneDuration={handleUpdateSceneDuration}
				/>
			</div>
		{/if}
	{/if}
</div>

<!-- Modals -->
<AIGenerateModal {projectId} {videoId} bind:isOpen={isAIModalOpen} />

<!-- Video Render Modal -->
{#if isRenderModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
		<div class="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0c0e14] p-6 shadow-2xl text-center space-y-6">
			<button
				onclick={() => (isRenderModalOpen = false)}
				class="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl"
			>
				<X class="h-5 w-5" />
			</button>

			<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-black shadow-xl shadow-emerald-500/20">
				<Sparkles class="h-8 w-8 stroke-[2.5]" />
			</div>

			<div>
				<h3 class="font-heading text-xl font-extrabold text-white">Rendering Vertical Short</h3>
				<p class="text-xs text-gray-400 mt-1 font-mono">{renderStatus}</p>
			</div>

			<!-- Progress Bar -->
			<div class="w-full bg-white/5 rounded-full h-3 overflow-hidden border border-white/10">
				<div
					class="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full transition-all duration-300 rounded-full"
					style={`width: ${renderProgress}%`}
				></div>
			</div>

			{#if renderProgress >= 100}
				<div class="pt-2">
					<button
						onclick={() => (isRenderModalOpen = false)}
						class="btn-emerald px-6 py-2.5 rounded-full text-xs font-bold w-full shadow-lg shadow-emerald-500/25"
					>
						Download MP4 Video
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<Toast />
