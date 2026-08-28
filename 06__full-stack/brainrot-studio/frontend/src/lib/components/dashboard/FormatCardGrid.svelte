<script lang="ts">
	import { Sparkles, ArrowRight, Play } from 'lucide-svelte';

	let {
		onStartFormat = (formatTitle: string) => {},
		onOpenCreateProject = () => {}
	}: {
		onStartFormat?: (formatTitle: string) => void;
		onOpenCreateProject?: () => void;
	} = $props();
</script>

<!-- Hero Banner Header -->
<div class="text-center max-w-3xl mx-auto space-y-3 pt-2">
	<div class="text-[11px] font-bold tracking-[0.2em] text-emerald-400 uppercase">
		NEW PROJECT
	</div>
	<h1 class="font-heading text-4xl sm:text-5xl font-black text-white tracking-tight">
		What are you creating?
	</h1>
	<p class="text-sm text-gray-400 font-normal leading-relaxed">
		Hover any tile to see what it makes. Most people start with <span class="text-emerald-400 font-semibold">Brainrot with Gameplay</span> — you can switch any time.
	</p>
</div>

<!-- START HERE Section Header -->
<div class="space-y-4">
	<div class="flex items-center justify-between border-b border-white/10 pb-3">
		<div class="text-xs font-bold tracking-[0.15em] text-gray-400 uppercase flex items-center gap-2">
			<Sparkles class="h-3.5 w-3.5 text-emerald-400" /> START HERE
		</div>
		<button
			onclick={onOpenCreateProject}
			class="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
		>
			View all formats <ArrowRight class="h-3.5 w-3.5" />
		</button>
	</div>

	<!-- Format Cards Grid -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<!-- Card 1: Brainrot with Gameplay -->
		<button
			onclick={() => onStartFormat('Brainrot with Gameplay')}
			class="group relative text-left rounded-3xl bg-[#0f121d] border border-white/10 hover:border-emerald-500/50 p-5 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 overflow-hidden"
		>
			<div class="relative h-48 w-full rounded-2xl bg-gradient-to-br from-emerald-900/40 via-cyan-900/30 to-black border border-white/10 overflow-hidden flex items-center justify-center mb-4">
				<div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15),transparent_70%)]"></div>
				
				<div class="relative z-10 flex flex-col items-center text-center p-4">
					<div class="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-amber-400 uppercase tracking-widest border border-amber-500/30 mb-2">
						IT LASTED
					</div>
					<div class="flex items-center gap-2 text-2xl font-black text-white tracking-tighter drop-shadow-md">
						<span>PETER</span>
						<span class="text-emerald-400">VS</span>
						<span>STEWIE</span>
					</div>
				</div>

				<div class="absolute bottom-3 left-3 bg-amber-500 text-black font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
					POPULAR
				</div>
				
				<div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
					<div class="h-12 w-12 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg shadow-emerald-500/50 scale-90 group-hover:scale-100 transition-transform">
						<Play class="h-6 w-6 fill-black ml-0.5" />
					</div>
				</div>
			</div>

			<div class="space-y-1.5">
				<h3 class="font-heading text-lg font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
					Brainrot with Gameplay
					<span class="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold">AI</span>
				</h3>
				<p class="text-xs text-gray-400 leading-relaxed">
					Drop a topic — AI writes the script, picks voices, and lays it over background gameplay.
				</p>
			</div>
		</button>

		<!-- Card 2: Reddit Story -->
		<button
			onclick={() => onStartFormat('Reddit Story')}
			class="group relative text-left rounded-3xl bg-[#0f121d] border border-white/10 hover:border-emerald-500/50 p-5 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 overflow-hidden"
		>
			<div class="relative h-48 w-full rounded-2xl bg-gradient-to-br from-orange-900/40 via-red-900/30 to-black border border-white/10 overflow-hidden flex items-center justify-center mb-4 p-4">
				<div class="w-full bg-[#181c2b] rounded-xl border border-white/10 p-3 shadow-xl space-y-2">
					<div class="flex items-center gap-2">
						<div class="h-5 w-5 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white">r/</div>
						<span class="text-[11px] font-bold text-gray-300">r/relationship_advice</span>
					</div>
					<p class="text-[11px] text-gray-200 font-semibold line-clamp-2 leading-snug">
						I think my girlfriend is cheating on me, but the way I found out...
					</p>
				</div>

				<div class="absolute bottom-3 left-3 bg-red-500 text-white font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
					VIRAL
				</div>

				<div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
					<div class="h-12 w-12 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg shadow-emerald-500/50 scale-90 group-hover:scale-100 transition-transform">
						<Play class="h-6 w-6 fill-black ml-0.5" />
					</div>
				</div>
			</div>

			<div class="space-y-1.5">
				<h3 class="font-heading text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
					Reddit Story
				</h3>
				<p class="text-xs text-gray-400 leading-relaxed">
					Narrate a Reddit thread over gameplay with animated caption overlays and AI narration.
				</p>
			</div>
		</button>

		<!-- Card 3: Text Story -->
		<button
			onclick={() => onStartFormat('Text Story')}
			class="group relative text-left rounded-3xl bg-[#0f121d] border border-white/10 hover:border-emerald-500/50 p-5 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 overflow-hidden"
		>
			<div class="relative h-48 w-full rounded-2xl bg-gradient-to-br from-blue-900/40 via-cyan-900/30 to-black border border-white/10 overflow-hidden flex flex-col justify-end p-4 mb-4 space-y-2">
				<div class="self-start max-w-[80%] bg-gray-800 text-gray-200 text-[11px] px-3 py-1.5 rounded-2xl rounded-bl-none font-medium shadow-md">
					Bro are you seeing this right now??
				</div>
				<div class="self-end max-w-[80%] bg-cyan-600 text-white text-[11px] px-3 py-1.5 rounded-2xl rounded-br-none font-medium shadow-md">
					WHAT HAPPENED 💀💀
				</div>

				<div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
					<div class="h-12 w-12 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg shadow-emerald-500/50 scale-90 group-hover:scale-100 transition-transform">
						<Play class="h-6 w-6 fill-black ml-0.5" />
					</div>
				</div>
			</div>

			<div class="space-y-1.5">
				<h3 class="font-heading text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
					Text Story
				</h3>
				<p class="text-xs text-gray-400 leading-relaxed">
					iMessage-style chat dramatization with AI text messages and sound effects.
				</p>
			</div>
		</button>
	</div>
</div>
