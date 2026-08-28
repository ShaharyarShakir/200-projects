<script lang="ts">
	import {
		ChevronDown,
		MessageSquare,
		FileText,
		Smartphone,
		Sparkles,
		Tv,
		HelpCircle,
		Bot,
		Flame,
		Mic,
		Subtitles,
		Split,
		ExternalLink
	} from 'lucide-svelte';

	let {
		isOpen,
		onToggle,
		onClose
	}: {
		isOpen: boolean;
		onToggle: () => void;
		onClose: () => void;
	} = $props();
</script>

<div class="relative">
	<button
		onclick={onToggle}
		class="px-3.5 py-1.5 rounded-xl hover:bg-white/5 hover:text-emerald-400 transition-colors flex items-center gap-1.5 {isOpen ? 'bg-white/10 text-emerald-400' : ''}"
	>
		<span>Studios</span>
		<ChevronDown class="h-4 w-4 opacity-70 transition-transform {isOpen ? 'rotate-180' : ''}" />
	</button>

	{#if isOpen}
		<div class="absolute left-[-100px] top-full mt-2 w-[760px] rounded-3xl bg-[#0f121d] border border-white/10 shadow-2xl p-6 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
			<div class="grid grid-cols-3 gap-6">
				<!-- Column 1: Start with Topic -->
				<div>
					<div class="text-[10px] font-bold tracking-widest text-emerald-400 uppercase mb-3 px-1">START WITH A TOPIC</div>
					<div class="space-y-1">
						<a href="/app" onclick={onClose} class="flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group">
							<div class="h-8 w-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
								<MessageSquare class="h-4 w-4" />
							</div>
							<div>
								<div class="text-xs font-bold text-white group-hover:text-emerald-400">Brainrot</div>
								<div class="text-[10px] text-gray-400">AI characters over gameplay</div>
							</div>
						</a>

						<a href="/app" onclick={onClose} class="flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group">
							<div class="h-8 w-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
								<FileText class="h-4 w-4" />
							</div>
							<div>
								<div class="text-xs font-bold text-white group-hover:text-emerald-400">Reddit Story</div>
								<div class="text-[10px] text-gray-400">Narrate a Reddit thread over ga...</div>
							</div>
						</a>

						<a href="/app" onclick={onClose} class="flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group">
							<div class="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
								<Smartphone class="h-4 w-4" />
							</div>
							<div>
								<div class="text-xs font-bold text-white group-hover:text-emerald-400">Text Story</div>
								<div class="text-[10px] text-gray-400">iMessage-style chat dramatizat...</div>
							</div>
						</a>

						<a href="/app" onclick={onClose} class="flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group">
							<div class="h-8 w-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
								<Sparkles class="h-4 w-4" />
							</div>
							<div>
								<div class="text-xs font-bold text-white group-hover:text-cyan-400">Prompt to Video</div>
								<div class="text-[10px] text-gray-400">Turn one prompt into a finished ...</div>
							</div>
						</a>
					</div>
				</div>

				<!-- Column 2: Explainers & Personas -->
				<div>
					<div class="text-[10px] font-bold tracking-widest text-cyan-400 uppercase mb-3 px-1">EXPLAINERS & PERSONAS</div>
					<div class="space-y-1">
						<a href="/app" onclick={onClose} class="flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group">
							<div class="h-8 w-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
								<Tv class="h-4 w-4" />
							</div>
							<div>
								<div class="text-xs font-bold text-white group-hover:text-cyan-400">Explainer</div>
								<div class="text-[10px] text-gray-400">Document-to-video explainers</div>
							</div>
						</a>

						<a href="/app" onclick={onClose} class="flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group">
							<div class="h-8 w-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
								<HelpCircle class="h-4 w-4" />
							</div>
							<div>
								<div class="text-xs font-bold text-white group-hover:text-purple-400">Quiz</div>
								<div class="text-[10px] text-gray-400">Trivia & quiz shorts</div>
							</div>
						</a>

						<a href="/app" onclick={onClose} class="flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group">
							<div class="h-8 w-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
								<Bot class="h-4 w-4" />
							</div>
							<div>
								<div class="text-xs font-bold text-white group-hover:text-rose-400">AI Influencer</div>
								<div class="text-[10px] text-gray-400">Design a persistent AI persona</div>
							</div>
						</a>

						<a href="/app" onclick={onClose} class="flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group">
							<div class="h-8 w-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
								<Flame class="h-4 w-4" />
							</div>
							<div>
								<div class="text-xs font-bold text-white group-hover:text-pink-400">Lip Sync (Deepfakes)</div>
								<div class="text-[10px] text-gray-400">Make any face say anything</div>
							</div>
						</a>
					</div>
				</div>

				<!-- Column 3: Edit & Meme Formats -->
				<div>
					<div class="text-[10px] font-bold tracking-widest text-purple-400 uppercase mb-3 px-1">MEME & FOOTAGE</div>
					<div class="space-y-1">
						<a href="/app" onclick={onClose} class="flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group">
							<div class="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
								<Mic class="h-4 w-4" />
							</div>
							<div>
								<div class="text-xs font-bold text-white group-hover:text-emerald-400">Voice Over</div>
								<div class="text-[10px] text-gray-400">One voice, scenes, captions</div>
							</div>
						</a>

						<a href="/app" onclick={onClose} class="flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group">
							<div class="h-8 w-8 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center shrink-0">
								<Subtitles class="h-4 w-4" />
							</div>
							<div>
								<div class="text-xs font-bold text-white group-hover:text-yellow-400">AI Captions</div>
								<div class="text-[10px] text-gray-400">Burn captions on existing foota...</div>
							</div>
						</a>

						<a href="/app" onclick={onClose} class="flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group">
							<div class="h-8 w-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
								<Split class="h-4 w-4" />
							</div>
							<div>
								<div class="text-xs font-bold text-white group-hover:text-indigo-400">Split Video</div>
								<div class="text-[10px] text-gray-400">Stacked dual-clip format</div>
							</div>
						</a>
					</div>
				</div>
			</div>

			<!-- Mega Dropdown Footer -->
			<div class="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-400 font-semibold">
				<span>Explore all 20+ viral short formats</span>
				<a href="/app" onclick={onClose} class="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold">
					View all formats <ExternalLink class="h-3.5 w-3.5" />
				</a>
			</div>
		</div>
	{/if}
</div>
