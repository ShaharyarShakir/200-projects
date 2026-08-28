<script lang="ts">
	import { onDestroy } from 'svelte';
	import { timelineState } from '$lib/state/timeline.svelte';
	import TimelineHeader from './TimelineHeader.svelte';
	import TimelineRuler from './TimelineRuler.svelte';
	import TimelineTrack from './TimelineTrack.svelte';
	import TimelineClip from './TimelineClip.svelte';
	import Playhead from './Playhead.svelte';
	import { Film, Mic, Music, MessageSquarePlus } from 'lucide-svelte';

	let {
		onAddScene,
		onReorderScenes,
		onUpdateSceneDuration
	}: {
		onAddScene?: () => void;
		onReorderScenes?: (sceneIds: string[]) => void;
		onUpdateSceneDuration?: (sceneId: string, durationMs: number) => void;
	} = $props();

	let animFrame: number | null = null;
	let lastTime = 0;

	// Playhead playback loop
	$effect(() => {
		if (timelineState.isPlaying) {
			lastTime = performance.now();
			const loop = (now: number) => {
				const delta = now - lastTime;
				lastTime = now;
				const nextTime = timelineState.currentTimeMs + delta;

				if (nextTime >= timelineState.durationMs) {
					timelineState.setCurrentTime(0);
					timelineState.isPlaying = false;
				} else {
					timelineState.setCurrentTime(nextTime);
					animFrame = requestAnimationFrame(loop);
				}
			};
			animFrame = requestAnimationFrame(loop);
		} else if (animFrame) {
			cancelAnimationFrame(animFrame);
			animFrame = null;
		}
	});

	onDestroy(() => {
		if (animFrame) cancelAnimationFrame(animFrame);
	});

	function handleReorder(sceneId: string, direction: 'left' | 'right') {
		const index = timelineState.scenes.findIndex((s) => s.id === sceneId);
		if (index === -1) return;

		const targetIndex = direction === 'left' ? index - 1 : index + 1;
		if (targetIndex < 0 || targetIndex >= timelineState.scenes.length) return;

		const updated = [...timelineState.scenes];
		const [moved] = updated.splice(index, 1);
		updated.splice(targetIndex, 0, moved);

		const newOrderIds = updated.map((s) => s.id);
		timelineState.optimisticReorder(newOrderIds);
		onReorderScenes?.(newOrderIds);
	}
</script>

<div class="flex flex-col h-full bg-[#07080c] border-t border-white/10 select-none">
	<!-- Top Controls Toolbar -->
	<TimelineHeader {onAddScene} />

	<!-- Timeline Scrollable Canvas -->
	<div class="flex-1 overflow-x-auto overflow-y-hidden relative custom-scrollbar flex flex-col">
		<!-- Header Ruler & Track Left Alignment -->
		<div class="flex">
			<div class="w-44 flex-shrink-0 border-r border-b border-white/10 bg-[#08090f] px-3 py-1 text-[11px] font-mono text-gray-400 flex items-center justify-between z-20">
				<span>TRACKS</span>
				<span class="text-[9px] text-emerald-400">9:16 SHORTS</span>
			</div>
			<TimelineRuler />
		</div>

		<!-- Tracks Viewport -->
		<div class="relative flex-1 bg-[#090b12]">
			<Playhead />

			<!-- Video Scene Clips Track -->
			<TimelineTrack label="Video / Scenes">
				{#snippet icon()}
					<Film class="h-3.5 w-3.5 text-emerald-400" />
				{/snippet}

				{#each timelineState.scenes as scene (scene.id)}
					<TimelineClip
						{scene}
						onReorder={handleReorder}
						onDurationChange={onUpdateSceneDuration}
					/>
				{/each}
			</TimelineTrack>

			<!-- Voice Track -->
			<TimelineTrack label="Voiceover">
				{#snippet icon()}
					<Mic class="h-3.5 w-3.5 text-cyan-400" />
				{/snippet}

				<!-- Voice track items placeholder/rendered clips -->
				<div class="absolute inset-0 flex items-center px-4">
					{#each timelineState.scenes as scene}
						{#if scene.narration}
							<div
								class="absolute top-1.5 bottom-1.5 bg-cyan-500/20 border border-cyan-400/40 rounded-lg px-2 text-[10px] font-mono text-cyan-300 flex items-center truncate"
								style={`left: ${timelineState.timeToPixels(scene.start_ms)}px; width: ${timelineState.timeToPixels(scene.duration_ms)}px;`}
							>
								🎤 {scene.narration}
							</div>
						{/if}
					{/each}
				</div>
			</TimelineTrack>

			<!-- Music Track -->
			<TimelineTrack label="Music">
				{#snippet icon()}
					<Music class="h-3.5 w-3.5 text-amber-400" />
				{/snippet}
			</TimelineTrack>

			<!-- Captions Track -->
			<TimelineTrack label="Captions">
				{#snippet icon()}
					<MessageSquarePlus class="h-3.5 w-3.5 text-purple-400" />
				{/snippet}

				{#each timelineState.captions as cap}
					<div
						class="absolute top-1.5 bottom-1.5 bg-purple-500/20 border border-purple-400/40 rounded-lg px-2 text-[10px] font-mono text-purple-300 flex items-center truncate"
						style={`left: ${timelineState.timeToPixels(cap.start_ms)}px; width: ${timelineState.timeToPixels(cap.end_ms - cap.start_ms)}px;`}
					>
						💬 {cap.text}
					</div>
				{/each}
			</TimelineTrack>
		</div>
	</div>
</div>
