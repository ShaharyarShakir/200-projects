<script lang="ts">
	import { Minus, Plus, Lock, Check } from 'lucide-svelte';
	import { toast } from '$lib/state/toast.svelte';

	interface Character {
		id: string;
		name: string;
		selected?: boolean;
		tier: string;
		avatar: string;
		imageUrl?: string;
	}

	let {
		numCharacters = $bindable(2),
		scriptLanguage = $bindable('English'),
		availableCharacters = $bindable([])
	}: {
		numCharacters: number;
		scriptLanguage: string;
		availableCharacters: Character[];
	} = $props();

	let selectedCharactersCount = $derived(availableCharacters.filter((c) => c.selected).length);

	function toggleCharacterSelect(characterId: string) {
		const char = availableCharacters.find((c) => c.id === characterId);
		if (!char) return;

		if (!char.selected && selectedCharactersCount >= numCharacters) {
			toast.show(`You can only select up to ${numCharacters} characters.`, 'info');
			return;
		}

		char.selected = !char.selected;
	}
</script>

<div class="space-y-6 animate-in fade-in duration-200">
	<div>
		<h3 class="font-heading text-2xl font-black text-white">Configure characters</h3>
		<p class="text-xs text-gray-400 mt-1">
			Select real character voice actors and portraits for your automated brainrot script.
		</p>
	</div>

	<!-- Controls Bar -->
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-2xl bg-[#131624] border border-white/10">
		<!-- Number of Characters Stepper -->
		<div>
			<span class="block text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">NUMBER OF CHARACTERS</span>
			<div class="flex items-center gap-3">
				<button
					onclick={() => (numCharacters = Math.max(1, numCharacters - 1))}
					class="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10"
				>
					<Minus class="h-3.5 w-3.5" />
				</button>
				<span class="font-heading text-base font-bold text-white px-2">{numCharacters}</span>
				<button
					onclick={() => (numCharacters = Math.min(4, numCharacters + 1))}
					class="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10"
				>
					<Plus class="h-3.5 w-3.5" />
				</button>
			</div>
		</div>

		<!-- Language Selection -->
		<div>
			<span class="block text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">SCRIPT LANGUAGE</span>
			<select
				bind:value={scriptLanguage}
				class="select select-sm w-full bg-white/5 border-white/10 text-xs text-white rounded-xl focus:border-emerald-500"
			>
				<option value="English">🌐 English</option>
				<option value="Spanish">🇪🇸 Spanish</option>
				<option value="French">🇫🇷 French</option>
				<option value="German">🇩🇪 German</option>
			</select>
			<p class="text-[10px] text-gray-500 mt-1">Matching your voice. Change it here to write in a different language.</p>
		</div>
	</div>

	<!-- Choose Characters Grid with Real Pictures -->
	<div>
		<div class="flex items-center justify-between mb-3">
			<span class="text-xs font-bold text-gray-300 uppercase tracking-wider">
				CHOOSE CHARACTERS ({selectedCharactersCount}/{numCharacters})
			</span>
		</div>

		<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
			{#each availableCharacters as char}
				<button
					onclick={() => toggleCharacterSelect(char.id)}
					class="relative group rounded-2xl p-3 border text-center transition-all flex flex-col items-center justify-center gap-2 overflow-hidden {char.selected ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500/50' : 'border-white/10 bg-[#131624] hover:border-white/30'}"
				>
					{#if char.selected}
						<div class="absolute top-2 right-2 z-10 h-5 w-5 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-md">
							<Check class="h-3 w-3 stroke-[3]" />
						</div>
					{/if}

					{#if char.tier !== 'FREE'}
						<div class="absolute top-2 left-2 z-10 flex items-center gap-1 text-[9px] font-bold text-amber-300 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-amber-500/30">
							<Lock class="h-2.5 w-2.5" /> LITE+
						</div>
					{/if}

					<!-- Real Character Picture Avatar -->
					<div class="relative h-16 w-16 rounded-2xl overflow-hidden bg-black/40 border border-white/10 shadow-inner group-hover:scale-105 transition-transform flex items-center justify-center">
						{#if char.imageUrl}
							<img
								src={char.imageUrl}
								alt={char.name}
								class="h-full w-full object-cover object-top"
								onerror={(e) => {
									const target = e.currentTarget as HTMLElement;
									target.style.display = 'none';
									const fallback = target.nextElementSibling as HTMLElement;
									if (fallback) fallback.style.display = 'block';
								}}
							/>
							<span class="text-3xl hidden">{char.avatar}</span>
						{:else}
							<span class="text-3xl">{char.avatar}</span>
						{/if}
					</div>

					<span class="text-xs font-bold text-white tracking-tight truncate w-full">{char.name}</span>
				</button>
			{/each}
		</div>
	</div>
</div>
