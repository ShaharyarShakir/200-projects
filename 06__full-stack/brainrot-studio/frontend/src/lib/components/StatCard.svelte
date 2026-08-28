<script lang="ts">
	import { Folder, Bot, Video, Zap, Layers, Sparkles } from 'lucide-svelte';

	let {
		title,
		value,
		subtext,
		icon,
		color = 'purple'
	}: {
		title: string;
		value: number | string;
		subtext?: string;
		icon: 'folder' | 'bot' | 'video' | 'zap' | 'layers' | 'sparkles' | string;
		color?: 'purple' | 'pink' | 'blue' | 'emerald';
	} = $props();

	const colorClasses = {
		purple: 'from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/20',
		pink: 'from-pink-500/20 to-pink-600/5 text-pink-400 border-pink-500/20',
		blue: 'from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/20',
		emerald: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/20'
	};
</script>

<div class="glass-card glass-card-hover rounded-2xl p-5 border bg-gradient-to-br {colorClasses[color]} relative overflow-hidden group">
	<div class="flex items-center justify-between">
		<div>
			<p class="text-xs font-semibold tracking-wider text-gray-400 uppercase">{title}</p>
			<h3 class="font-heading text-3xl font-extrabold text-white mt-1 group-hover:scale-105 transition-transform duration-300">
				{value}
			</h3>
			{#if subtext}
				<p class="text-xs text-gray-400 mt-1 flex items-center gap-1">
					<span class="inline-block h-1.5 w-1.5 rounded-full bg-current"></span>
					{subtext}
				</p>
			{/if}
		</div>
		<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 shadow-inner group-hover:rotate-6 transition-transform duration-300">
			{#if icon === 'folder' || icon === '📁'}
				<Folder class="h-6 w-6 text-emerald-400" />
			{:else if icon === 'bot' || icon === '🤖'}
				<Bot class="h-6 w-6 text-emerald-400" />
			{:else if icon === 'video' || icon === '🎬'}
				<Video class="h-6 w-6 text-blue-400" />
			{:else if icon === 'zap' || icon === '⚡'}
				<Zap class="h-6 w-6 text-pink-400" />
			{:else}
				<Sparkles class="h-6 w-6 text-purple-400" />
			{/if}
		</div>
	</div>
</div>
