<script lang="ts">
	import { timelineState } from '$lib/state/timeline.svelte';
	import { Play, Pause, RotateCcw, Plus, ZoomIn, ZoomOut, Film, Sparkles } from 'lucide-svelte';

	let {
		onAddScene
	}: {
		onAddScene?: () => void;
	} = $props();

	function formatTimecode(timeMs: number): string {
		const totalSeconds = timeMs / 1000;
		const mins = Math.floor(totalSeconds / 60);
		const secs = Math.floor(totalSeconds % 60);
		const ms = Math.floor((timeMs % 1000) / 10);

		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
	}

	const currentTimeFormatted = $derived(formatTimecode(timelineState.currentTimeMs));
	const totalTimeFormatted = $derived(formatTimecode(timelineState.durationMs));

	function handleReset() {
		timelineState.setCurrentTime(0);
	}

	function handleZoom(delta: number) {
		timelineState.setPixelsPerSecond(timelineState.pixelsPerSecond + delta);
	}
</script>

<div class="h-12 border-b border-white/10 bg-[#08090f] px-4 flex items-center justify-between select-none">
	<!-- Left Controls: Playback & Timecode -->
	<div class="flex items-center gap-3">
		<button
			onclick={() => timelineState.togglePlay()}
			class="btn btn-sm btn-circle bg-emerald-500 hover:bg-emerald-400 text-black border-none shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
			title={timelineState.isPlaying ? 'Pause' : 'Play'}
		>
			{#if timelineState.isPlaying}
				<Pause class="h-4 w-4 fill-black" />
			{:else}
				<Play class="h-4 w-4 fill-black ml-0.5" />
			{/if}
		</button>

		<button
			onclick={handleReset}
			class="btn btn-ghost btn-xs text-gray-400 hover:text-white rounded-lg"
			title="Rewind to start"
		>
			<RotateCcw class="h-3.5 w-3.5" />
		</button>

		<div class="h-4 w-px bg-white/10"></div>

		<!-- Timecode Readout -->
		<div class="flex items-center gap-1.5 font-mono text-xs">
			<span class="text-emerald-400 font-bold tracking-wider">{currentTimeFormatted}</span>
			<span class="text-gray-500">/</span>
			<span class="text-gray-400">{totalTimeFormatted}</span>
		</div>
	</div>

	<!-- Center Controls: Action buttons -->
	<div class="flex items-center gap-2">
		<button
			onclick={onAddScene}
			class="btn btn-xs bg-white/10 hover:bg-white/20 text-white border-white/10 rounded-lg flex items-center gap-1"
		>
			<Plus class="h-3.5 w-3.5 text-emerald-400" />
			<span>Add Scene</span>
		</button>
	</div>

	<!-- Right Controls: Zoom & Scale -->
	<div class="flex items-center gap-2 text-xs text-gray-400 font-mono">
		<button
			onclick={() => handleZoom(-20)}
			class="btn btn-ghost btn-xs p-1 text-gray-400 hover:text-white"
			title="Zoom Out"
		>
			<ZoomOut class="h-3.5 w-3.5" />
		</button>

		<input
			type="range"
			min="30"
			max="300"
			value={timelineState.pixelsPerSecond}
			oninput={(e) => timelineState.setPixelsPerSecond(Number(e.currentTarget.value))}
			class="range range-xs range-emerald w-20"
		/>

		<button
			onclick={() => handleZoom(20)}
			class="btn btn-ghost btn-xs p-1 text-gray-400 hover:text-white"
			title="Zoom In"
		>
			<ZoomIn class="h-3.5 w-3.5" />
		</button>

		<span class="w-10 text-right">{timelineState.pixelsPerSecond}px/s</span>
	</div>
</div>
