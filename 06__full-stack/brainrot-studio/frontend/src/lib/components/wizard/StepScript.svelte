<script lang="ts">
	import { Bot, Sparkles, RefreshCw } from 'lucide-svelte';
	import type { GeneratedScript } from '$lib/api/wizard';

	let {
		script = $bindable(null),
		onRegenerateScene
	}: {
		script: GeneratedScript | null;
		onRegenerateScene?: (sceneIdx: number, instruction: string) => Promise<void>;
	} = $props();

	let sceneInstructions = $state<Record<number, string>>({});
	let regeneratingIdx = $state<number | null>(null);

	async function handleRegen(idx: number) {
		const inst = sceneInstructions[idx];
		if (!inst || !onRegenerateScene) return;
		regeneratingIdx = idx;
		try {
			await onRegenerateScene(idx, inst);
			sceneInstructions[idx] = '';
		} finally {
			regeneratingIdx = null;
		}
	}
</script>

<div class="space-y-6 animate-in fade-in duration-200">
	<div>
		<h3 class="font-heading text-2xl font-black text-white">Generated Video Script</h3>
		<p class="text-xs text-gray-400 mt-1">
			Review structured scenes, edit dialogue, or regenerate specific scenes before launching the studio.
		</p>
	</div>

	{#if !script || !script.scenes || script.scenes.length === 0}
		<div class="p-8 rounded-2xl bg-[#131624] border border-white/10 text-center space-y-3">
			<div class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-gray-400">
				<Sparkles class="h-6 w-6" />
			</div>
			<p class="text-sm text-gray-300">No script generated yet. Click "Generate Script" to create structured scenes.</p>
		</div>
	{:else}
		<div class="space-y-4 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
			{#each script.scenes as scene, i}
				<div class="p-4 rounded-2xl bg-[#131624] border border-white/10 space-y-3">
					<div class="flex items-center justify-between">
						<span class="font-heading text-xs font-bold text-emerald-400 uppercase tracking-wider">
							SCENE {scene.scene_number || i + 1} ({scene.duration_seconds || 6}s)
						</span>
					</div>

					<!-- Visual Description -->
					<div class="p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-300 space-y-1">
						<span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">VISUAL DIRECTION</span>
						<p class="italic text-gray-300">{scene.visual_description}</p>
					</div>

					<!-- Dialogue Lines -->
					<div class="space-y-2">
						{#each scene.dialogue as line}
							<div class="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
								<span class="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
									<Bot class="h-3.5 w-3.5" /> {line.character_id}
								</span>
								<input
									type="text"
									bind:value={line.text}
									class="input input-xs w-full bg-transparent border-0 focus:outline-none text-xs text-white p-0"
								/>
							</div>
						{/each}
					</div>

					<!-- Single Scene AI Regeneration Input -->
					<div class="flex items-center gap-2 pt-2 border-t border-white/5">
						<input
							type="text"
							bind:value={sceneInstructions[i]}
							placeholder="Make Scene {i + 1} more absurd or chaotic..."
							class="input input-xs w-full bg-black/30 border-white/10 text-xs text-white placeholder:text-gray-500 rounded-lg"
						/>
						<button
							onclick={() => handleRegen(i)}
							disabled={regeneratingIdx === i || !sceneInstructions[i]}
							class="btn btn-xs btn-ghost text-xs text-emerald-400 hover:bg-emerald-500/10 rounded-lg flex items-center gap-1 shrink-0"
						>
							<RefreshCw class="h-3 w-3 {regeneratingIdx === i ? 'animate-spin' : ''}" />
							<span>Regen</span>
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
