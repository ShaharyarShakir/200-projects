<script lang="ts">
	import { Wand2, X } from 'lucide-svelte';

	interface Props {
		isOpen: boolean;
		sceneNumber: number;
		isRegenerating?: boolean;
		onClose: () => void;
		onRegenerate: (instruction: string) => Promise<void>;
	}

	let { isOpen, sceneNumber, isRegenerating = false, onClose, onRegenerate }: Props = $props();

	let instruction = $state('');

	async function handleSubmit() {
		if (!instruction.trim() || isRegenerating) return;
		await onRegenerate(instruction);
		instruction = '';
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
		<div class="w-full max-w-md bg-[#0e111a] border border-purple-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
			<div class="flex items-center justify-between border-b border-white/10 pb-3">
				<div class="flex items-center gap-2">
					<Wand2 class="h-5 w-5 text-purple-400" />
					<h3 class="font-bold text-white text-sm">Regenerate Scene {sceneNumber}</h3>
				</div>
				<button onclick={onClose} class="text-gray-400 hover:text-white transition-colors">
					<X class="h-4 w-4" />
				</button>
			</div>

			<p class="text-xs text-gray-300">
				Describe how you want the AI to rewrite or tweak this scene. Surrounding timeline timing will be preserved.
			</p>

			<textarea
				bind:value={instruction}
				placeholder="e.g. Make this scene much more chaotic with fast dialogue and brainrot humor..."
				rows="3"
				class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
			></textarea>

			<div class="flex justify-end gap-2 pt-2">
				<button
					onclick={onClose}
					class="px-3 py-1.5 text-xs text-gray-400 hover:text-white rounded-lg transition-colors"
				>
					Cancel
				</button>
				<button
					onclick={handleSubmit}
					disabled={isRegenerating || !instruction.trim()}
					class="px-4 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl flex items-center gap-1.5 disabled:opacity-50 transition-all"
				>
					<Wand2 class="h-3.5 w-3.5" />
					<span>{isRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
				</button>
			</div>
		</div>
	</div>
{/if}
