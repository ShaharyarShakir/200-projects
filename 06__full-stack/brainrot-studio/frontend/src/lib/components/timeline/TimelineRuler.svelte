<script lang="ts">
	import { timelineState } from '$lib/state/timeline.svelte';

	const totalWidth = $derived(
		Math.max(
			timelineState.timeToPixels(Math.max(timelineState.durationMs + 5000, 20000)),
			1200
		)
	);

	// Generate ticks every 1000ms (1 sec) and major labels every 5000ms
	const ticks = $derived.by(() => {
		const result: { timeMs: number; isMajor: boolean; label: string; x: number }[] = [];
		const maxTime = Math.max(timelineState.durationMs + 10000, 30000);

		for (let t = 0; t <= maxTime; t += 1000) {
			const isMajor = t % 5000 === 0;
			const totalSec = Math.floor(t / 1000);
			const mins = Math.floor(totalSec / 60);
			const secs = totalSec % 60;
			const label = `${mins}:${secs.toString().padStart(2, '0')}s`;
			result.push({
				timeMs: t,
				isMajor,
				label,
				x: timelineState.timeToPixels(t)
			});
		}
		return result;
	});

	function handleRulerClick(e: MouseEvent) {
		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const relativeX = e.clientX - rect.left;
		const clickTimeMs = timelineState.pixelsToTime(relativeX);
		timelineState.setCurrentTime(clickTimeMs);
	}
</script>

<!-- Ruler track -->
<div
	id="timeline-ruler-track"
	role="button"
	tabindex="0"
	onclick={handleRulerClick}
	onkeydown={(e) => e.key === 'Enter' && timelineState.setCurrentTime(0)}
	class="relative h-8 border-b border-white/10 bg-[#08090f] select-none cursor-pointer overflow-hidden"
	style={`width: ${totalWidth}px;`}
>
	{#each ticks as tick}
		<div class="absolute top-0 bottom-0 flex flex-col" style={`left: ${tick.x}px;`}>
			<div
				class="w-px bg-white/20 {tick.isMajor ? 'h-4 bg-white/40' : 'h-2'}"
			></div>
			{#if tick.isMajor}
				<span class="text-[10px] font-mono text-gray-400 -ml-3 mt-0.5 pointer-events-none">
					{tick.label}
				</span>
			{/if}
		</div>
	{/each}
</div>
