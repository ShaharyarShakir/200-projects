<script lang="ts">
	import { timelineState } from '$lib/state/timeline.svelte';

	let { onDragStart }: { onDragStart?: () => void } = $props();

	const playheadX = $derived(timelineState.timeToPixels(timelineState.currentTimeMs));

	let dragging = $state(false);

	function handleMouseDown(e: MouseEvent) {
		dragging = true;
		onDragStart?.();
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	}

	function handleMouseMove(e: MouseEvent) {
		if (!dragging) return;
		const trackEl = document.getElementById('timeline-ruler-track');
		if (!trackEl) return;
		const rect = trackEl.getBoundingClientRect();
		const relativeX = e.clientX - rect.left;
		const timeMs = timelineState.pixelsToTime(relativeX);
		timelineState.setCurrentTime(timeMs);
	}

	function handleMouseUp() {
		dragging = false;
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('mouseup', handleMouseUp);
	}
</script>

<div
	class="absolute top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center"
	style={`transform: translateX(${playheadX}px);`}
>
	<!-- Scrubber Head -->
	<div
		role="slider"
		aria-label="Timeline playhead"
		aria-valuenow={timelineState.currentTimeMs}
		tabindex="0"
		onmousedown={handleMouseDown}
		class="pointer-events-auto cursor-ew-resize -mt-1 w-4 h-5 bg-rose-500 rounded-b-md shadow-lg shadow-rose-500/50 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
	>
		<div class="w-1 h-2 bg-white/80 rounded-full"></div>
	</div>

	<!-- Playhead Vertical Line -->
	<div class="w-0.5 flex-1 bg-gradient-to-b from-rose-500 via-rose-500/80 to-transparent"></div>
</div>
