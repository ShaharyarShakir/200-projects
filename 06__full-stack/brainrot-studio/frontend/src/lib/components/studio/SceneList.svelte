<script lang="ts">
	import type { Scene } from '$lib/types/video';
	import { studio } from '$lib/state/video-studio.svelte';
	import { createScene } from '$lib/api/videos';
	import { toast } from '$lib/state/toast.svelte';
	import { Plus, Layers, Clock, FileText } from 'lucide-svelte';

	interface Props {
		projectId: string;
		videoId: string;
		scenes: Scene[];
	}

	let { projectId, videoId, scenes }: Props = $props();
	let adding = $state(false);

	async function handleAddScene() {
		if (adding) return;
		adding = true;
		try {
			const newScene = await createScene(projectId, videoId, {
				narration: `New Scene ${scenes.length + 1}`,
				visual_prompt: '',
				dialogue: '',
				duration_seconds: 5.0
			});
			studio.addScene(newScene);
			toast.show(`Scene ${newScene.position + 1} added`, 'success');
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to add scene';
			toast.show(msg, 'error');
		} finally {
			adding = false;
		}
	}
</script>

<div class="flex h-full flex-col bg-[#0b0d14] border-r border-white/10">
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-white/10 p-4 bg-white/5 backdrop-blur-md">
		<div class="flex items-center gap-2">
			<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
				<Layers class="h-4 w-4" />
			</div>
			<div>
				<h2 class="font-heading text-sm font-bold text-white tracking-wide">
					Scenes
				</h2>
				<p class="text-[10px] text-gray-400 font-mono">
					{scenes.length} {scenes.length === 1 ? 'scene' : 'scenes'} total
				</p>
			</div>
		</div>

		<button
			onclick={handleAddScene}
			disabled={adding}
			class="btn-emerald flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 transition-all"
		>
			<Plus class="h-3.5 w-3.5" />
			<span>{adding ? '...' : 'Add'}</span>
		</button>
	</div>

	<!-- Scene Cards List -->
	<div class="flex-1 space-y-2.5 overflow-y-auto p-3 custom-scrollbar">
		{#if scenes.length === 0}
			<div class="my-8 text-center border border-dashed border-white/10 rounded-2xl p-6">
				<FileText class="mx-auto h-8 w-8 text-gray-600 mb-2" />
				<p class="text-xs font-medium text-gray-400">No scenes in video</p>
				<p class="text-[11px] text-gray-600 mt-1">Click + Add to create your first scene frame.</p>
				<button
					onclick={handleAddScene}
					class="btn-emerald mt-4 text-xs px-4 py-1.5 rounded-xl font-medium"
				>
					+ Add Scene
				</button>
			</div>
		{:else}
			{#each scenes as scene (scene.id)}
				<button
					type="button"
					class={[
						'w-full text-left rounded-2xl p-3.5 transition-all border duration-200 group relative',
						studio.selectedSceneId === scene.id
							? 'border-emerald-500/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
							: 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]'
					]}
					onclick={() => studio.selectScene(scene.id)}
				>
					<div class="flex items-center justify-between mb-1.5">
						<span class="font-heading text-xs font-bold text-gray-200 flex items-center gap-1.5">
							<span class="h-2 w-2 rounded-full {studio.selectedSceneId === scene.id ? 'bg-emerald-400' : 'bg-gray-600'}"></span>
							Scene {scene.position + 1}
						</span>

						<span class="text-[10px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded-md flex items-center gap-1">
							<Clock class="h-2.5 w-2.5 text-gray-500" />
							{scene.duration_seconds ?? 0}s
						</span>
					</div>

					<p class="line-clamp-2 text-xs text-gray-400 leading-relaxed font-sans">
						{scene.narration || 'Empty scene description'}
					</p>
				</button>
			{/each}
		{/if}
	</div>
</div>
