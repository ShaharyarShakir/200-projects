<script lang="ts">
	import { ChevronDown, Video, Music, UserCheck, Bot } from 'lucide-svelte';

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
		<span>Assets</span>
		<ChevronDown class="h-4 w-4 opacity-70 transition-transform {isOpen ? 'rotate-180' : ''}" />
	</button>

	{#if isOpen}
		<div class="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-[#0f121d] border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
			<a href="/app" onclick={onClose} class="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group">
				<div class="p-2 rounded-lg bg-white/5 text-emerald-400 group-hover:bg-emerald-500/10">
					<Video class="h-4 w-4" />
				</div>
				<div>
					<div class="text-xs font-bold text-white group-hover:text-emerald-400">Gameplay Library</div>
					<div class="text-[11px] text-gray-400 font-normal">Minecraft, GTA, Subway Surfers, Satisfying</div>
				</div>
			</a>

			<a href="/app" onclick={onClose} class="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group">
				<div class="p-2 rounded-lg bg-white/5 text-purple-400 group-hover:bg-purple-500/10">
					<Music class="h-4 w-4" />
				</div>
				<div>
					<div class="text-xs font-bold text-white group-hover:text-purple-400">Background Audio</div>
					<div class="text-[11px] text-gray-400 font-normal">Copyright-free viral music tracks</div>
				</div>
			</a>

			<a href="/app" onclick={onClose} class="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group">
				<div class="p-2 rounded-lg bg-white/5 text-cyan-400 group-hover:bg-cyan-500/10">
					<UserCheck class="h-4 w-4" />
				</div>
				<div>
					<div class="text-xs font-bold text-white group-hover:text-cyan-400">AI Voices & Presets</div>
					<div class="text-[11px] text-gray-400 font-normal">ElevenLabs & Piper voice models</div>
				</div>
			</a>

			<a href="/app" onclick={onClose} class="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group">
				<div class="p-2 rounded-lg bg-white/5 text-amber-400 group-hover:bg-amber-500/10">
					<Bot class="h-4 w-4" />
				</div>
				<div>
					<div class="text-xs font-bold text-white group-hover:text-amber-400">Saved Characters</div>
					<div class="text-[11px] text-gray-400 font-normal">Custom avatars & voice maps</div>
				</div>
			</a>
		</div>
	{/if}
</div>
