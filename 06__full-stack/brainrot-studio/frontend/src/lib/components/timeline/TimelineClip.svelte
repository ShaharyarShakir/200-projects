<script lang="ts">
	import type { SceneWithAssets } from '$lib/types/timeline';
	import { timelineState } from '$lib/state/timeline.svelte';
	import { GripVertical, Layers, ChevronLeft, ChevronRight } from 'lucide-svelte';

	let {
		scene,
		onDurationChange,
		onReorder
	}: {
		scene: SceneWithAssets;
		onDurationChange?: (sceneId: string, newDurationMs: number) => void;
		onReorder?: (sceneId: string, direction: 'left' | 'right') => void;
	} = $props();

	const isSelected = $derived(timelineState.selectedSceneId === scene.id);
	const clipWidth = $derived(timelineState.timeToPixels(scene.duration_ms));
	const clipLeft = $derived(timelineState.timeToPixels(scene.start_ms));

	let isResizing = $state(false);
	let startX = $state(0);
	let startDurationMs = $state(0);

	function handleClick(e: MouseEvent) {
		e.stopPropagation();
		timelineState.selectScene(scene.id);
	}

	function handleResizeMouseDown(e: MouseEvent) {
		e.stopPropagation();
		isResizing = true;
		startX = e.clientX;
		startDurationMs = scene.duration_ms;

		window.addEventListener('mousemove', handleResizeMouseMove);
		window.addEventListener('mouseup', handleResizeMouseUp);
	}

	function handleResizeMouseMove(e: MouseEvent) {
		if (!isResizing) return;
		const deltaX = e.clientX - startX;
		const deltaMs = timelineState.pixelsToTime(deltaX);
		const newDuration = Math.max(500, Math.round(startDurationMs + deltaMs));

		timelineState.optimisticUpdateSceneDuration(scene.id, newDuration);
	}

	function handleResizeMouseUp() {
		if (isResizing) {
			isResizing = false;
			window.removeEventListener('mousemove', handleResizeMouseMove);
			window.removeEventListener('mouseup', handleResizeMouseUp);
			onDurationChange?.(scene.id, scene.duration_ms);
		}
	}
</script>

<div
	role="button"
	tabindex="0"
	onclick={handleClick}
	onkeydown={(e) => e.key === 'Enter' && timelineState.selectScene(scene.id)}
	class="absolute top-1 bottom-1 rounded-xl border select-none transition-all flex items-center justify-between group px-2 overflow-hidden shadow-sm cursor-pointer {isSelected
		? 'bg-emerald-500/20 border-emerald-400 text-white ring-2 ring-emerald-500/40 shadow-emerald-500/10'
		: 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'}"
	style={`left: ${clipLeft}px; width: ${clipWidth}px;`}
>
	<!-- Left Clip Content -->
	<div class="flex items-center gap-2 truncate min-w-0 pointer-events-none">
		<span class="badge badge-xs font-mono bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
			S{scene.order + 1}
		</span>

		<span class="text-xs font-medium truncate">
			{scene.title || `Scene ${scene.order + 1}`}
		</span>

		{#if scene.assets.length > 0}
			<span class="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
				<Layers class="h-3 w-3 text-emerald-400" />
				{scene.assets.length}
			</span>
		{/if}
	</div>

	<!-- Center/Right Clip Controls -->
	<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
		{#if scene.order > 0}
			<button
				onclick={(e) => {
					e.stopPropagation();
					onReorder?.(scene.id, 'left');
				}}
				class="p-0.5 hover:bg-white/20 rounded text-gray-300 hover:text-white"
				title="Move scene left"
			>
				<ChevronLeft class="h-3.5 w-3.5" />
			</button>
		{/if}

		{#if scene.order < timelineState.scenes.length - 1}
			<button
				onclick={(e) => {
					e.stopPropagation();
					onReorder?.(scene.id, 'right');
				}}
				class="p-0.5 hover:bg-white/20 rounded text-gray-300 hover:text-white"
				title="Move scene right"
			>
				<ChevronRight class="h-3.5 w-3.5" />
			</button>
		{/if}

		<span class="text-[10px] font-mono text-emerald-400/90 ml-1">
			{(scene.duration_ms / 1000).toFixed(1)}s
		</span>
	</div>

	<!-- Right Resize Handle -->
	<button
		type="button"
		aria-label="Resize clip duration"
		onmousedown={handleResizeMouseDown}
		class="absolute top-0 right-0 bottom-0 w-2 cursor-ew-resize hover:bg-emerald-400/50 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors border-none p-0 bg-transparent"
	>
		<div class="w-0.5 h-3 bg-white/40 rounded-full"></div>
	</button>
</div>
