<script lang="ts">
	import { onMount } from 'svelte';
	import { Zap, ArrowRight, Sparkles, Play, ShieldCheck } from 'lucide-svelte';
	import { gsap } from 'gsap';

	let { onGetStarted }: { onGetStarted: () => void } = $props();

	let heroContainer: HTMLDivElement;

	onMount(() => {
		if (heroContainer) {
			gsap.from(heroContainer.children, {
				y: 30,
				opacity: 0,
				duration: 0.8,
				stagger: 0.15,
				ease: 'power3.out'
			});
		}
	});
</script>

<section class="relative overflow-hidden pt-16 pb-20 text-center">
	<div bind:this={heroContainer} class="mx-auto max-w-4xl px-4">
		<!-- Top Pill Badge -->
		<div class="inline-flex items-center gap-2 mb-8">
			<span class="badge-amber">
				<Zap class="h-3.5 w-3.5 fill-black stroke-black" />
				<span>Next-Gen Faceless Video Engine</span>
			</span>
		</div>

		<!-- Main Title Banner -->
		<div>
			<h1 class="font-heading text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-none">
				AI <span class="sticker-accent mx-2 text-2xl sm:text-5xl md:text-6xl">VIRAL SHORTS</span> Studio
			</h1>
			<p class="font-heading text-3xl sm:text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 mt-3">
				Turn Ideas Into Faceless Content
			</p>
		</div>

		<!-- Subtitle -->
		<p class="mt-6 text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
			Reddit chronicles · brainrot lore · document explainers · gameplay loops · texting dramas.
			One automated pipeline for every high-dopamine vertical video format.
		</p>

		<!-- Action Buttons -->
		<div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
			<button
				onclick={onGetStarted}
				class="btn-emerald btn-lg px-8 py-4 rounded-full text-base tracking-wide flex items-center gap-3 group"
			>
				<Sparkles class="h-5 w-5" />
				<span>Launch Studio Free</span>
				<ArrowRight class="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
			</button>

			<a
				href="#formats"
				class="btn btn-ghost text-gray-300 hover:text-white rounded-full px-6 text-sm flex items-center gap-2"
			>
				<Play class="h-4 w-4 text-emerald-400 fill-emerald-400" />
				<span>Explore Formats</span>
			</a>
		</div>

		<!-- Trust Micro-Badges -->
		<div class="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500 font-medium">
			<div class="flex items-center gap-1.5">
				<ShieldCheck class="h-4 w-4 text-emerald-400" />
				<span>No Watermark</span>
			</div>
			<div class="flex items-center gap-1.5">
				<Zap class="h-4 w-4 text-amber-400" />
				<span>Full 1080x1920 HD</span>
			</div>
			<div class="flex items-center gap-1.5">
				<Sparkles class="h-4 w-4 text-cyan-400" />
				<span>AI Voice & Captions</span>
			</div>
		</div>
	</div>
</section>
