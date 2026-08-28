<script lang="ts">
	import { FileText, HelpCircle, ArrowRight, Sparkles, Cpu } from 'lucide-svelte';

	let { onGetStarted }: { onGetStarted: () => void } = $props();
</script>

<section id="features" class="py-20 px-4 sm:px-6 mx-auto max-w-7xl relative z-10">
	<div class="text-center mb-16">
		<div class="inline-flex items-center gap-2 mb-3">
			<span class="badge-amber">
				<Cpu class="h-3.5 w-3.5 fill-black stroke-black" />
				<span>Powered by Ollama & Local AI</span>
			</span>
		</div>
		<h2 class="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
			Brainrot Hooks Them. <br class="hidden sm:block" />
			<span class="gradient-emerald-cyan">Knowledge Keeps Them.</span>
		</h2>
		<p class="text-gray-400 mt-3 text-sm sm:text-base max-w-xl mx-auto">
			Turn raw documents, script ideas, or topics into viral narrated shorts in minutes.
		</p>
	</div>

	<!-- 2x2 Feature Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
		<!-- Feature 1: Document to Explainer -->
		<div class="bg-obsidian-card rounded-3xl p-8 border border-white/10 hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden group">
			<div class="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full mb-4 border border-cyan-500/20">
				<FileText class="h-3.5 w-3.5" />
				<span>DOC-TO-SHORT EXPLAINER</span>
			</div>
			<h3 class="font-heading text-2xl font-bold text-white group-hover:text-emerald-300 transition-colors">
				Turn Any Document Into an Explainer
			</h3>
			<p class="text-sm text-gray-400 mt-2 leading-relaxed">
				Upload a PDF, slide deck, or notes — or type a one-line idea. AI distills it, storyboards the scenes, and narrates it with custom captions.
			</p>

			<div class="mt-6 flex flex-wrap gap-2 text-xs">
				<span class="px-3 py-1 rounded-lg bg-white/5 text-gray-300 border border-white/10">PDF · TXT · MD</span>
				<span class="px-3 py-1 rounded-lg bg-white/5 text-gray-300 border border-white/10">Auto Storyboards</span>
				<span class="px-3 py-1 rounded-lg bg-white/5 text-gray-300 border border-white/10">10+ AI Voices</span>
			</div>
		</div>

		<!-- Feature 2: Trivia & Quiz Engine -->
		<div class="bg-obsidian-card rounded-3xl p-8 border border-white/10 hover:border-cyan-500/30 transition-all duration-300 relative overflow-hidden group">
			<div class="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full mb-4 border border-amber-500/20">
				<HelpCircle class="h-3.5 w-3.5" />
				<span>TRIVIA & QUIZ ENGINE</span>
			</div>
			<h3 class="font-heading text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
				Trivia Shorts That Farm Comments
			</h3>
			<p class="text-sm text-gray-400 mt-2 leading-relaxed">
				Give it a topic or document and get a narrated quiz with countdown reveals. Perfect for generating endless comment debate.
			</p>

			<div class="mt-6 flex flex-wrap gap-2 text-xs">
				<span class="px-3 py-1 rounded-lg bg-white/5 text-gray-300 border border-white/10">Multiple Choice</span>
				<span class="px-3 py-1 rounded-lg bg-white/5 text-gray-300 border border-white/10">Countdown Reveal</span>
				<span class="px-3 py-1 rounded-lg bg-white/5 text-gray-300 border border-white/10">Instant Export</span>
			</div>
		</div>
	</div>

	<!-- Call to Action Card -->
	<div id="pricing" class="mt-12 bg-gradient-to-r from-emerald-950/80 via-obsidian-card to-cyan-950/80 rounded-3xl p-8 md:p-12 border border-emerald-500/30 text-center relative overflow-hidden">
		<h3 class="font-heading text-2xl sm:text-4xl font-extrabold text-white">
			Ready to Launch Your Faceless Channel?
		</h3>
		<p class="text-gray-300 mt-2 text-sm sm:text-base max-w-lg mx-auto">
			Join creators automating their TikTok, Shorts, and Reels content pipeline.
		</p>
		<button
			onclick={onGetStarted}
			class="btn-emerald btn-lg mt-6 px-8 py-3 rounded-full text-sm font-bold tracking-wide inline-flex items-center gap-2"
		>
			<Sparkles class="h-4 w-4" />
			<span>Start Generating Free</span>
			<ArrowRight class="h-4 w-4" />
		</button>
	</div>
</section>
```...
