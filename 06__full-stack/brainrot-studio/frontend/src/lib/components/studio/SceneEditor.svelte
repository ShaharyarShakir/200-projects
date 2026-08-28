<script lang="ts">
	import { studio } from '$lib/state/video-studio.svelte';
	import { updateScene, deleteScene } from '$lib/api/videos';
	import { regenerateScene } from '$lib/api/generation';
	import { toast } from '$lib/state/toast.svelte';
	import SceneRegenModal from '$lib/components/studio/SceneRegenModal.svelte';
	import { Edit3, Trash2, Save, Sparkles, Eye, Clock, Wand2, MessageSquare } from 'lucide-svelte';

	interface Props {
		projectId: string;
		videoId: string;
	}

	let { projectId, videoId }: Props = $props();

	let narration = $state('');
	let visualPrompt = $state('');
	let dialogue = $state('');
	let durationSeconds = $state<number | string>('');
	let saving = $state(false);

	let showRegenModal = $state(false);
	let regenInstruction = $state('');
	let isRegenerating = $state(false);

	// Sync local form state when selected scene changes
	$effect(() => {
		const sc = studio.selectedScene;
		if (sc) {
			narration = sc.narration ?? '';
			visualPrompt = sc.visual_prompt ?? '';
			dialogue = sc.dialogue ?? '';
			durationSeconds = sc.duration_seconds ?? '';
		}
	});

	async function handleSaveScene() {
		const sc = studio.selectedScene;
		if (!sc || saving) return;
		saving = true;

		try {
			const updated = await updateScene(projectId, videoId, sc.id, {
				narration: narration || undefined,
				visual_prompt: visualPrompt || undefined,
				dialogue: dialogue || undefined,
				duration_seconds: durationSeconds === '' ? undefined : Number(durationSeconds)
			});

			studio.updateSceneInState(sc.id, updated);
			toast.show(`Scene ${sc.position + 1} updated`, 'success');
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to update scene';
			toast.show(msg, 'error');
		} finally {
			saving = false;
		}
	}

	async function handleDeleteScene() {
		const sc = studio.selectedScene;
		if (!sc) return;
		if (!confirm(`Are you sure you want to delete Scene ${sc.position + 1}?`)) return;

		try {
			await deleteScene(projectId, videoId, sc.id);
			studio.removeSceneFromState(sc.id);
			toast.show(`Scene removed`, 'success');
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to delete scene';
			toast.show(msg, 'error');
		}
	}

	async function handleRegenerateScene() {
		const sc = studio.selectedScene;
		if (!sc || isRegenerating) return;
		if (!regenInstruction.trim()) {
			toast.show('Please provide a regeneration instruction', 'error');
			return;
		}

		isRegenerating = true;
		try {
			const timeline = await regenerateScene(projectId, videoId, sc.id, regenInstruction);
			if (timeline.scenes) {
				const mappedScenes = timeline.scenes.map((s) => ({
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
				studio.setScenes(mappedScenes);
			}

			toast.show(`Scene ${sc.position + 1} regenerated with AI`, 'success');
			showRegenModal = false;
			regenInstruction = '';
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to regenerate scene';
			toast.show(msg, 'error');
		} finally {
			isRegenerating = false;
		}
	}
</script>

{#if studio.selectedScene}
	<div class="space-y-5 p-5 bg-[#0b0d14]">
		<!-- Scene Title Header -->
		<div class="flex items-center justify-between border-b border-white/10 pb-4">
			<div class="flex items-center gap-2">
				<div class="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
					<Edit3 class="h-4 w-4" />
				</div>
				<div>
					<h2 class="font-heading text-sm font-bold text-white tracking-wide">
						Scene {studio.selectedScene.position + 1} Editor
					</h2>
					<p class="text-[10px] text-gray-400">
						Edit narration, dialogue, & visual prompts
					</p>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<button
					onclick={() => (showRegenModal = true)}
					class="btn-purple flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 transition-all"
					title="Regenerate this scene with AI"
				>
					<Wand2 class="h-3.5 w-3.5" />
					<span>AI Regen</span>
				</button>
				<button
					onclick={handleSaveScene}
					disabled={saving}
					class="btn-emerald flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl"
				>
					<Save class="h-3.5 w-3.5" />
					<span>{saving ? 'Saving...' : 'Save'}</span>
				</button>
				<button
					onclick={handleDeleteScene}
					class="btn btn-ghost btn-xs btn-square text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg"
					title="Delete scene"
				>
					<Trash2 class="h-4 w-4" />
				</button>
			</div>
		</div>


		<!-- Narration Field -->
		<div class="space-y-1.5">
			<label for="scene-narration" class="flex items-center gap-1.5 text-xs font-semibold text-gray-300 uppercase tracking-wider">
				<Sparkles class="h-3.5 w-3.5 text-emerald-400" />
				Narration / Script
			</label>
			<textarea
				id="scene-narration"
				bind:value={narration}
				placeholder="Enter narration spoken by the voiceover AI..."
				class="textarea textarea-bordered w-full bg-white/5 border-white/10 focus:border-emerald-500 text-xs text-white placeholder:text-gray-600 rounded-xl h-24 focus:outline-none transition-colors"
			></textarea>
		</div>

		<!-- Visual Prompt Field -->
		<div class="space-y-1.5">
			<label for="scene-visual-prompt" class="flex items-center gap-1.5 text-xs font-semibold text-gray-300 uppercase tracking-wider">
				<Eye class="h-3.5 w-3.5 text-cyan-400" />
				Visual Prompt
			</label>
			<textarea
				id="scene-visual-prompt"
				bind:value={visualPrompt}
				placeholder="Describe camera, background, character motion for image generator..."
				class="textarea textarea-bordered w-full bg-white/5 border-white/10 focus:border-cyan-500 text-xs text-white placeholder:text-gray-600 rounded-xl h-24 focus:outline-none transition-colors"
			></textarea>
		</div>

		<!-- Dialogue Field -->
		<div class="space-y-1.5">
			<label for="scene-dialogue" class="flex items-center gap-1.5 text-xs font-semibold text-gray-300 uppercase tracking-wider">
				<MessageSquare class="h-3.5 w-3.5 text-pink-400" />
				Dialogue
			</label>
			<textarea
				id="scene-dialogue"
				bind:value={dialogue}
				placeholder="On-screen dialogue overlay text..."
				class="textarea textarea-bordered w-full bg-white/5 border-white/10 focus:border-pink-500 text-xs text-white placeholder:text-gray-600 rounded-xl h-20 focus:outline-none transition-colors"
			></textarea>
		</div>

		<!-- Duration Field -->
		<div class="space-y-1.5">
			<label for="scene-duration" class="flex items-center gap-1.5 text-xs font-semibold text-gray-300 uppercase tracking-wider">
				<Clock class="h-3.5 w-3.5 text-amber-400" />
				Duration (Seconds)
			</label>
			<input
				id="scene-duration"
				type="number"
				min="0"
				step="0.1"
				bind:value={durationSeconds}
				placeholder="5.0"
				class="input input-bordered w-full bg-white/5 border-white/10 focus:border-amber-500 text-xs text-white placeholder:text-gray-600 rounded-xl focus:outline-none transition-colors"
			/>
		</div>
	</div>
{/if}

{#if studio.selectedScene}
	<SceneRegenModal
		isOpen={showRegenModal}
		sceneNumber={studio.selectedScene.position + 1}
		{isRegenerating}
		onClose={() => (showRegenModal = false)}
		onRegenerate={async (inst) => {
			regenInstruction = inst;
			await handleRegenerateScene();
		}}
	/>
{/if}


