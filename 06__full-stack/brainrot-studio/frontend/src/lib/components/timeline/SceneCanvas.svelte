<script lang="ts">
	import { timelineState } from '$lib/state/timeline.svelte';
	import type { Asset } from '$lib/types/asset';
	import { studio } from '$lib/state/video-studio.svelte';
	import {
		Sparkles,
		ShieldAlert,
		Play,
		Pause,
		Volume2,
		Bot,
		MessageSquare
	} from 'lucide-svelte';

	let {
		onUpdateAssetTransform
	}: {
		onUpdateAssetTransform?: (assetId: string, x: number, y: number) => void;
	} = $props();

	const activeScene = $derived(timelineState.activeScene);
	const sortedAssets = $derived(
		activeScene?.assets ? [...activeScene.assets].sort((a, b) => a.z_index - b.z_index) : []
	);

	const activeCaption = $derived(
		timelineState.captions.find(
			(c) =>
				timelineState.currentTimeMs >= c.start_ms &&
				timelineState.currentTimeMs <= c.end_ms
		)
	);

	let showSafeArea = $state(true);
	let canvasEl = $state<HTMLDivElement | null>(null);
	let isHovering = $state(false);

	let draggingAssetId = $state<string | null>(null);

	function getAssetMediaUrl(assetId: string): string {
		const found = studio.assets.find((a) => a.id === assetId);
		return found?.url ?? found?.thumbnail_url ?? '';
	}

	function handleTogglePlay() {
		timelineState.togglePlay();
	}

	function handleMouseDown(e: MouseEvent, sceneAssetId: string) {
		e.preventDefault();
		e.stopPropagation();
		timelineState.selectAsset(sceneAssetId);
		draggingAssetId = sceneAssetId;

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	}

	function handleMouseMove(e: MouseEvent) {
		if (!draggingAssetId || !canvasEl) return;
		const rect = canvasEl.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;

		const normX = Math.max(0, Math.min(1, mouseX / rect.width));
		const normY = Math.max(0, Math.min(1, mouseY / rect.height));

		const roundedX = Math.round(normX * 100) / 100;
		const roundedY = Math.round(normY * 100) / 100;

		timelineState.optimisticUpdateAssetTransform(draggingAssetId, {
			x: roundedX,
			y: roundedY
		});
	}

	function handleMouseUp() {
		if (draggingAssetId) {
			const targetId = draggingAssetId;
			draggingAssetId = null;
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);

			for (const scene of timelineState.scenes) {
				const sa = scene.assets.find((a) => a.id === targetId);
				if (sa) {
					onUpdateAssetTransform?.(targetId, sa.x, sa.y);
					break;
				}
			}
		}
	}
</script>

<div class="flex flex-col items-center justify-center h-full w-full bg-[#07080c] relative p-4 select-none">
	<!-- Canvas Toolbar Header -->
	<div class="absolute top-3 left-4 right-4 flex items-center justify-between z-20">
		<div class="flex items-center gap-2">
			<span class="badge badge-emerald text-[10px] uppercase font-mono tracking-wider">
				9:16 CANV (1080×1920)
			</span>
			{#if activeScene}
				<span class="text-xs font-mono text-gray-400 truncate max-w-[240px]">
					S{activeScene.order + 1}: {activeScene.title || 'Untitled'}
				</span>
			{/if}
		</div>

		<div class="flex items-center gap-2">
			<button
				onclick={() => (showSafeArea = !showSafeArea)}
				class="btn btn-ghost btn-xs text-xs text-gray-400 hover:text-white rounded-lg flex items-center gap-1 bg-white/5"
				title="Toggle Shorts Safe Area Overlays"
			>
				<ShieldAlert class="h-3.5 w-3.5 text-amber-400" />
				<span>Safe Area</span>
			</button>
		</div>
	</div>

	<!-- 9:16 Video Stage (Interactive Video Player Container) -->
	<div
		bind:this={canvasEl}
		role="button"
		tabindex="0"
		onmouseenter={() => (isHovering = true)}
		onmouseleave={() => (isHovering = false)}
		onclick={handleTogglePlay}
		onkeydown={(e: KeyboardEvent) => e.key === ' ' && handleTogglePlay()}
		class="relative aspect-[9/16] h-full max-h-[680px] bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl ring-1 ring-white/10 flex items-center justify-center cursor-pointer group"
	>
		<!-- Background Gameplay / Motion Simulation -->
		<div class="absolute inset-0 bg-gradient-to-b from-emerald-950/40 via-gray-950 to-black z-0">
			{#if timelineState.isPlaying}
				<!-- Simulated Background Gameplay Motion Effect -->
				<div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.2),transparent_70%)] animate-pulse"></div>
				<div class="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#10b98115_1px,transparent_1px),linear-gradient(to_bottom,#10b98115_1px,transparent_1px)] bg-[size:24px_24px]"></div>
			{/if}
		</div>

		{#if activeScene && sortedAssets.length > 0}
			{#each sortedAssets as sa (sa.id)}
				{@const mediaUrl = getAssetMediaUrl(sa.asset_id)}
				{@const isSelected = timelineState.selectedAssetId === sa.id}

				<div
					role="button"
					tabindex="0"
					onmousedown={(e) => handleMouseDown(e, sa.id)}
					class="absolute transform transition-shadow cursor-move {isSelected ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-black z-40' : ''}"
					style={`
						left: ${sa.x * 100}%;
						top: ${sa.y * 100}%;
						transform: translate(-50%, -50%) scale(${sa.scale}) rotate(${sa.rotation}deg);
						opacity: ${sa.opacity};
						z-index: ${sa.z_index};
					`}
				>
					{#if mediaUrl}
						<img
							src={mediaUrl}
							alt={sa.role}
							class="max-w-none max-h-none pointer-events-none rounded object-contain"
							style="max-width: 320px; max-height: 480px;"
						/>
					{:else}
						<div class="px-4 py-2 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-xs font-mono text-emerald-300 backdrop-blur-md">
							📦 [{sa.role.toUpperCase()}] Asset
						</div>
					{/if}
				</div>
			{/each}
		{:else if activeScene}
			<!-- Clean Spacious Video Stage (Subtitles Only) -->
			<div class="relative z-10 w-full h-full flex flex-col justify-end p-6">
				<!-- Subtitles / Captions Banner Overlay at Bottom -->
				<div class="pb-6 text-center pointer-events-none">
					<span class="inline-block px-4 py-2 bg-black/95 text-yellow-300 font-black text-sm sm:text-base rounded-2xl border border-yellow-400/40 shadow-2xl font-mono uppercase tracking-wider">
						{activeCaption ? activeCaption.text : (timelineState.isPlaying ? '🔥 PUBLICISTS LEAK STORIES ON PURPOSE!' : '▶ PRESS PLAY TO START')}
					</span>
				</div>
			</div>
		{:else}
			<div class="text-xs font-mono text-gray-500">No active scene selected</div>
		{/if}

		<!-- Center Hover Play/Pause Overlay Button -->
		<div class="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-40 pointer-events-none">
			<div class="h-16 w-16 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-2xl shadow-emerald-500/50 transform scale-90 group-hover:scale-100 transition-transform">
				{#if timelineState.isPlaying}
					<Pause class="h-8 w-8 fill-black" />
				{:else}
					<Play class="h-8 w-8 fill-black ml-1" />
				{/if}
			</div>
		</div>

		<!-- Progress Bar at bottom of 9:16 stage -->
		<div class="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10 z-40">
			<div
				class="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
				style={`width: ${timelineState.durationMs > 0 ? (timelineState.currentTimeMs / timelineState.durationMs) * 100 : 0}%`}
			></div>
		</div>

		<!-- Social Media Safe Area Guide Lines -->
		{#if showSafeArea}
			<div class="absolute inset-0 border-2 border-dashed border-emerald-500/20 pointer-events-none z-30 m-4 rounded-2xl flex flex-col justify-between p-3">
				<div class="text-[9px] font-mono text-emerald-500/40 uppercase">Top Safe Zone</div>
				<div class="text-[9px] font-mono text-emerald-500/40 uppercase text-right">Caption Safe Area</div>
			</div>
		{/if}
	</div>
</div>
