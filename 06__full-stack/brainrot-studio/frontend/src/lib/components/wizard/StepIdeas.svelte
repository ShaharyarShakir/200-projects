<script lang="ts">
	import { RotateCw } from 'lucide-svelte';
	import { toast } from '$lib/state/toast.svelte';

	interface Idea {
		id: string | number;
		numericId?: number;
		title: string;
		description: string;
	}

	let {
		selectedNiche,
		generatedIdeas = [],
		selectedIdeaId = $bindable(''),
		editedIdeaText = $bindable('')
	}: {
		selectedNiche: string;
		generatedIdeas: Idea[];
		selectedIdeaId: string | number;
		editedIdeaText: string;
	} = $props();

	function handleSelectIdea(idea: Idea) {
		selectedIdeaId = idea.id;
		editedIdeaText = `${idea.title} — ${idea.description}`;
	}
</script>

<div class="space-y-6 animate-in fade-in duration-200">
	<div class="flex items-start justify-between">
		<div>
			<h3 class="font-heading text-2xl font-black text-white">Choose your video topic</h3>
			<p class="text-xs text-gray-400 mt-1">
				AI generated topics for <span class="text-white font-bold">{selectedNiche}</span>. Pick one to generate scenes and script.
			</p>
		</div>
	</div>

	<!-- Ideas List -->
	<div class="space-y-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
		{#each generatedIdeas as idea, idx}
			<div class="space-y-3">
				<button
					onclick={() => handleSelectIdea(idea)}
					class="w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-4 {selectedIdeaId === idea.id ? 'border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/10' : 'border-white/10 bg-[#131624] hover:border-white/20'}"
				>
					<div class="flex h-7 w-7 items-center justify-center rounded-full font-bold text-xs shrink-0 {selectedIdeaId === idea.id ? 'bg-emerald-500 text-black' : 'bg-white/10 text-gray-400'}">
						{idea.numericId || idx + 1}
					</div>
					<div class="space-y-1">
						<h4 class="font-heading text-sm font-bold text-white">{idea.title}</h4>
						<p class="text-xs text-gray-400">{idea.description}</p>
					</div>
				</button>

				<!-- Edit Area for Selected Idea -->
				{#if selectedIdeaId === idea.id}
					<div class="pl-11 pr-2 pt-1 pb-3 space-y-1.5 animate-in fade-in">
						<div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">EDIT TOPIC PREMISE (OPTIONAL)</div>
						<textarea
							bind:value={editedIdeaText}
							class="textarea w-full bg-[#131624] border-white/10 focus:border-emerald-500 text-xs text-white rounded-xl h-20"
						></textarea>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>
