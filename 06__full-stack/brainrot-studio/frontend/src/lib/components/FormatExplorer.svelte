<script lang="ts">
	import { onMount } from 'svelte';
	import { BookOpen, Sparkles, FileText, Flame, MessageSquare, ChevronRight, Eye, Heart, Zap } from 'lucide-svelte';
	import { gsap } from 'gsap';

	interface FormatItem {
		id: string;
		title: string;
		description: string;
		badge: string;
		sampleTitle: string;
		sampleText: string;
		author: string;
		statViews: string;
	}

	const formats: FormatItem[] = [
		{
			id: 'reddit',
			title: 'Reddit Chronicles',
			description: 'Narrate top community threads & drama over 60fps gameplay loops — the classic algorithm engine.',
			badge: 'VIRAL CLASSIC',
			sampleTitle: 'r/relationship_advice · u/throwaway_confused92',
			sampleText: 'I think my roommate is secretly a billionaire. I found 5 cold wallets hidden inside a hollowed-out toaster...',
			author: 'Reddit Engine AI',
			statViews: '2.4M Views'
		},
		{
			id: 'brainrot',
			title: 'Brainrot Lore',
			description: 'Tralalero Tralala, Skibidi, and the whole surreal character roster. Instant chaotic energy.',
			badge: 'CHAOS MODE',
			sampleTitle: 'CHAPTER 4: THE FINAL SHOWDOWN',
			sampleText: 'Tralalero: "You fool! You thought you could out-mew the Sigma Council?!"',
			author: 'Brainrot AI',
			statViews: '5.1M Views'
		},
		{
			id: 'explainer',
			title: 'Deep Dive Explainers',
			description: 'Turn PDFs, articles, or complex topics into bite-sized visual explainers with voiceover.',
			badge: 'KNOWLEDGE',
			sampleTitle: 'HOW QUANTUM COMPUTING WORKS',
			sampleText: 'Key Point #1: Superposition allows qubits to exist in multiple states at once...',
			author: 'Explainer AI',
			statViews: '980K Views'
		},
		{
			id: 'gameplay',
			title: 'Satisfying Gameplay',
			description: 'Dramatic narration tuned for endless scrolling over ASMR fruit slicing and soap cutting.',
			badge: 'ASMR SATISFYING',
			sampleTitle: 'TOP 5 UNRESOLVED MYSTERIES',
			sampleText: 'In 1977, a radio signal was received from deep space that lasted exactly 72 seconds...',
			author: 'Dopamine AI',
			statViews: '3.8M Views'
		},
		{
			id: 'texting',
			title: 'AI Texting Dramas',
			description: 'Suspenseful SMS story threads that hook viewers in the first second with realistic voice actors.',
			badge: 'CHAT DRAMA',
			sampleTitle: 'TEXTING STORY · EPISODE 12',
			sampleText: 'Mom: "DO NOT OPEN THE BASEMENT DOOR!" \nMe: "Why? I hear tapping..."',
			author: 'Text Drama AI',
			statViews: '1.7M Views'
		}
	];

	let activeFormat = $state<FormatItem>(formats[0]);
	let phoneCardEl = $state<HTMLDivElement | null>(null);

	function selectFormat(fmt: FormatItem) {
		activeFormat = fmt;
		if (phoneCardEl) {
			gsap.fromTo(
				phoneCardEl,
				{ scale: 0.94, opacity: 0.6 },
				{ scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' }
			);
		}
	}
</script>

<section id="formats" class="py-20 px-4 sm:px-6 mx-auto max-w-7xl">
	<div class="text-center mb-12">
		<div class="inline-flex items-center gap-2 mb-3">
			<span class="badge-amber">
				<Zap class="h-3.5 w-3.5 fill-black stroke-black" />
				<span>One Studio, Unlimited Formats</span>
			</span>
		</div>
		<h2 class="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
			Master Every <span class="gradient-emerald-cyan">Short-Form Format</span>
		</h2>
		<p class="text-gray-400 mt-3 text-sm sm:text-base max-w-xl mx-auto">
			Pick a format template to preview live. Each includes automated captions, natural AI voiceovers, and algorithmic background loops.
		</p>
	</div>

	<!-- Grid Container: Format Selector List (Left) + Phone Mockup Preview (Right) -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
		<!-- Left: Format Cards List -->
		<div class="lg:col-span-7 space-y-4">
			{#each formats as fmt (fmt.id)}
				<button
					type="button"
					onclick={() => selectFormat(fmt)}
					class="w-full text-left p-5 rounded-2xl transition-all duration-300 border flex items-start justify-between gap-4 cursor-pointer {
						activeFormat.id === fmt.id
							? 'bg-gradient-to-r from-emerald-950/60 to-cyan-950/40 border-emerald-500/50 shadow-xl shadow-emerald-500/10 scale-[1.01]'
							: 'bg-obsidian-card border-white/10 hover:border-white/20 hover:bg-white/[0.03]'
					}"
				>
					<div class="flex items-start gap-4">
						<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-emerald-400">
							{#if fmt.id === 'reddit'}
								<BookOpen class="h-6 w-6" />
							{:else if fmt.id === 'brainrot'}
								<Sparkles class="h-6 w-6 text-amber-400" />
							{:else if fmt.id === 'explainer'}
								<FileText class="h-6 w-6 text-cyan-400" />
							{:else if fmt.id === 'gameplay'}
								<Flame class="h-6 w-6 text-emerald-400" />
							{:else}
								<MessageSquare class="h-6 w-6 text-purple-400" />
							{/if}
						</div>
						<div>
							<div class="flex items-center gap-2">
								<h3 class="font-heading text-lg font-bold text-white">{fmt.title}</h3>
								<span class="text-[10px] font-extrabold tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
									{fmt.badge}
								</span>
							</div>
							<p class="text-xs text-gray-400 mt-1 leading-relaxed">{fmt.description}</p>
						</div>
					</div>

					<div class="shrink-0 text-gray-500 mt-1">
						<ChevronRight class="h-5 w-5 {activeFormat.id === fmt.id ? 'text-emerald-400 translate-x-1' : ''} transition-transform" />
					</div>
				</button>
			{/each}
		</div>

		<!-- Right: 9:16 Live Phone Preview -->
		<div class="lg:col-span-5 flex justify-center">
			<div class="phone-mockup-frame w-full max-w-[310px] shadow-2xl relative">
				<div class="phone-mockup-notch"></div>

				<!-- Phone Screen Content -->
				<div class="p-4 flex flex-col justify-between h-[calc(100%-20px)] relative overflow-hidden bg-gradient-to-b from-gray-900 via-gray-950 to-black">
					<!-- Top Live Preview Badge -->
					<div class="flex items-center justify-between z-10">
						<span class="badge badge-xs bg-red-500/80 text-white font-bold tracking-wider px-2 py-1 border-none flex items-center gap-1 animate-pulse">
							<span class="h-1.5 w-1.5 rounded-full bg-white"></span> LIVE PREVIEW
						</span>
						<span class="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
							<Eye class="h-3 w-3" /> {activeFormat.statViews}
						</span>
					</div>

					<!-- Middle Animated Visual Card -->
					<div bind:this={phoneCardEl} class="my-auto z-10 space-y-3">
						<div class="glass-card p-4 rounded-xl border border-white/10 shadow-2xl bg-black/70 backdrop-blur-md">
							<p class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
								{activeFormat.sampleTitle}
							</p>
							<p class="text-xs text-gray-100 font-medium leading-relaxed">
								"{activeFormat.sampleText}"
							</p>
						</div>

						<!-- Auto Caption Simulation Pill -->
						<div class="mx-auto w-max bg-yellow-400 text-black text-[11px] font-black tracking-wide px-3 py-1 rounded-md shadow-lg transform -rotate-1">
							AUTOMATED CAPTIONS
						</div>
					</div>

					<!-- Bottom Player Controls Simulation -->
					<div class="z-10 pt-3 border-t border-white/10 flex items-center justify-between text-gray-400 text-[11px]">
						<div class="flex items-center gap-2">
							<span class="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
							<span class="text-white font-medium">{activeFormat.author}</span>
						</div>
						<div class="flex items-center gap-2">
							<span class="flex items-center gap-1 text-pink-400"><Heart class="h-3 w-3 fill-pink-400" /> 142.8K</span>
							<span>💬 1.2K</span>
						</div>
					</div>

					<!-- Background Simulation Wallpaper -->
					<div class="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>
				</div>
			</div>
		</div>
	</div>
</section>
```...
