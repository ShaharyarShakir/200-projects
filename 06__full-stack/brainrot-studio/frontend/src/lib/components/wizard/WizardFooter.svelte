<script lang="ts">
	import { ArrowRight, Sparkles } from 'lucide-svelte';

	let {
		currentStep = $bindable(1),
		loading = false,
		onClose,
		onNext,
		onFinalCreate
	}: {
		currentStep: number;
		loading: boolean;
		onClose: () => void;
		onNext: () => void;
		onFinalCreate: () => void;
	} = $props();
</script>

<div class="p-6 bg-[#131624] border-t border-white/10 flex items-center justify-between">
	{#if currentStep === 1}
		<button
			onclick={onClose}
			class="btn btn-ghost text-xs text-gray-400 hover:text-white rounded-xl"
		>
			&larr; Back to hub
		</button>

		<button
			onclick={onNext}
			disabled={loading}
			class="btn-emerald text-xs font-bold px-6 py-2.5 rounded-full flex items-center gap-2 shadow-lg shadow-emerald-500/25"
		>
			<span>Next: Pick Niche</span>
			<ArrowRight class="h-4 w-4" />
		</button>
	{:else if currentStep === 2}
		<button
			onclick={() => (currentStep = 1)}
			class="btn btn-ghost text-xs text-gray-400 hover:text-white rounded-xl"
		>
			&larr; Back
		</button>

		<button
			onclick={onNext}
			disabled={loading}
			class="btn-emerald text-xs font-bold px-6 py-2.5 rounded-full flex items-center gap-2 shadow-lg shadow-emerald-500/25"
		>
			<span>{loading ? 'Generating Topics...' : 'Generate AI Topics'}</span>
			<Sparkles class="h-4 w-4" />
		</button>
	{:else if currentStep === 3}
		<button
			onclick={() => (currentStep = 2)}
			class="btn btn-ghost text-xs text-gray-400 hover:text-white rounded-xl"
		>
			&larr; Back
		</button>

		<button
			onclick={onNext}
			disabled={loading}
			class="btn-emerald text-xs font-bold px-6 py-2.5 rounded-full flex items-center gap-2 shadow-lg shadow-emerald-500/25"
		>
			<span>{loading ? 'Generating Script...' : 'Generate Script'}</span>
			<Sparkles class="h-4 w-4" />
		</button>
	{:else if currentStep === 4}
		<button
			onclick={() => (currentStep = 3)}
			class="btn btn-ghost text-xs text-gray-400 hover:text-white rounded-xl"
		>
			&larr; Back
		</button>

		<button
			onclick={onFinalCreate}
			disabled={loading}
			class="btn-emerald text-xs font-bold px-6 py-2.5 rounded-full flex items-center gap-2 shadow-lg shadow-emerald-500/25"
		>
			<span>{loading ? 'Building Timeline...' : 'Launch Studio & Render'}</span>
			<Sparkles class="h-4 w-4" />
		</button>
	{/if}
</div>
