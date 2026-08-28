<script lang="ts">
	import { Zap, Check, X } from 'lucide-svelte';

	let {
		currentStep,
		onClose
	}: {
		currentStep: number;
		onClose: () => void;
	} = $props();

	const steps = [
		{ id: 1, label: 'CHARACTERS' },
		{ id: 2, label: 'NICHE' },
		{ id: 3, label: 'TOPICS' },
		{ id: 4, label: 'SCRIPTS' }
	];
</script>

<div class="p-6 bg-[#131624] border-b border-white/10 flex items-center justify-between gap-4">
	<div class="flex items-center gap-3">
		<div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-black shadow-lg shadow-emerald-500/25">
			<Zap class="h-6 w-6 fill-black stroke-black" />
		</div>
		<div>
			<h2 class="font-heading text-xl font-black text-white tracking-tight">AI Content Wizard</h2>
			<p class="text-xs text-gray-400">Generate viral shorts from character concepts</p>
		</div>
	</div>

	<!-- Step Indicator Dots & Line -->
	<div class="flex items-center gap-4 text-xs font-bold">
		{#each steps as step, i}
			<div class="flex flex-col items-center gap-1">
				<div class="flex h-8 w-8 items-center justify-center rounded-full border-2 {currentStep >= step.id ? 'border-emerald-500 bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 font-black' : 'border-gray-700 bg-gray-800 text-gray-400'} transition-all">
					{#if currentStep > step.id}
						<Check class="h-4 w-4 stroke-[3]" />
					{:else}
						{step.id}
					{/if}
				</div>
				<span class="text-[10px] tracking-wider uppercase {currentStep === step.id ? 'text-white font-bold' : 'text-gray-500'}">
					{step.label}
				</span>
			</div>

			{#if i < steps.length - 1}
				<div class="h-0.5 w-8 bg-white/10 mb-4"></div>
			{/if}
		{/each}
	</div>

	<!-- Close Button -->
	<button
		onclick={onClose}
		class="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
		aria-label="Close"
	>
		<X class="h-5 w-5" />
	</button>
</div>
