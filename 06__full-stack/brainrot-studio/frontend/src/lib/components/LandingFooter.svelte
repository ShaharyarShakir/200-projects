<script lang="ts">
	import { Zap, Send, Globe, Share2, Video, Heart } from 'lucide-svelte';
	import { toast } from '$lib/state/toast.svelte';

	let newsletterEmail = $state('');

	function handleSubscribe() {
		if (!newsletterEmail.trim()) return;
		toast.show('Subscribed to Brainrot Studio updates!', 'success');
		newsletterEmail = '';
	}
</script>

<footer class="border-t border-white/10 pt-16 pb-12 px-4 sm:px-6 bg-[#050608] text-gray-400 text-xs">
	<div class="mx-auto max-w-7xl">
		<div class="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/10">
			<!-- Column 1: Brand & Bio -->
			<div class="md:col-span-4 space-y-4">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-black shadow-lg shadow-emerald-500/20">
						<Zap class="h-5 w-5 fill-black stroke-black" />
					</div>
					<span class="font-heading text-xl font-extrabold text-white tracking-tight">
						Brainrot Studio
					</span>
				</div>
				<p class="text-xs text-gray-400 leading-relaxed max-w-sm">
					The automated AI video pipeline for faceless creators. Generate high-dopamine vertical shorts for TikTok, Reels, and YouTube Shorts in minutes.
				</p>

				<!-- Social Links -->
				<div class="flex items-center gap-3 pt-2">
					<a href="#community" class="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors" title="Global Community">
						<Globe class="h-4 w-4" />
					</a>
					<a href="#socials" class="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors" title="Social Channels">
						<Share2 class="h-4 w-4" />
					</a>
					<a href="#videos" class="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors" title="Video Showcase">
						<Video class="h-4 w-4" />
					</a>
				</div>
			</div>

			<!-- Column 2: Formats -->
			<div class="md:col-span-2 space-y-3">
				<h4 class="font-heading text-xs font-extrabold uppercase tracking-wider text-white">Formats</h4>
				<ul class="space-y-2">
					<li><a href="/#formats" class="hover:text-emerald-400 transition-colors">Reddit Chronicles</a></li>
					<li><a href="/#formats" class="hover:text-emerald-400 transition-colors">Brainrot Lore</a></li>
					<li><a href="/#formats" class="hover:text-emerald-400 transition-colors">Deep Dive Explainers</a></li>
					<li><a href="/#formats" class="hover:text-emerald-400 transition-colors">Satisfying Gameplay</a></li>
					<li><a href="/#formats" class="hover:text-emerald-400 transition-colors">AI Texting Dramas</a></li>
				</ul>
			</div>

			<!-- Column 3: Platform -->
			<div class="md:col-span-2 space-y-3">
				<h4 class="font-heading text-xs font-extrabold uppercase tracking-wider text-white">Platform</h4>
				<ul class="space-y-2">
					<li><a href="/app" class="hover:text-emerald-400 transition-colors">Studio Workspace</a></li>
					<li><a href="/login" class="hover:text-emerald-400 transition-colors">Sign In</a></li>
					<li><a href="/register" class="hover:text-emerald-400 transition-colors">Create Account</a></li>
					<li><a href="/#features" class="hover:text-emerald-400 transition-colors">Feature Roadmap</a></li>
				</ul>
			</div>

			<!-- Column 4: Newsletter Input -->
			<div class="md:col-span-4 space-y-3">
				<h4 class="font-heading text-xs font-extrabold uppercase tracking-wider text-white">Stay In The Loop</h4>
				<p class="text-xs text-gray-400">Get the latest AI video templates, viral prompts, and feature drops directly in your inbox.</p>
				
				<form onsubmit={(e) => { e.preventDefault(); handleSubscribe(); }} class="flex items-center gap-2">
					<input
						type="email"
						bind:value={newsletterEmail}
						placeholder="creator@domain.com"
						class="input input-bordered input-sm bg-white/5 border-white/10 focus:border-emerald-500 focus:outline-none text-xs text-white placeholder:text-gray-600 rounded-xl w-full"
						required
					/>
					<button type="submit" class="btn-emerald btn-sm px-3 rounded-xl flex items-center justify-center" aria-label="Subscribe">
						<Send class="h-3.5 w-3.5" />
					</button>
				</form>
			</div>
		</div>

		<!-- Bottom Copyright Row -->
		<div class="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
			<p>© {new Date().getFullYear()} Brainrot Studio. All rights reserved.</p>
			<p class="flex items-center gap-1">
				Built with <Heart class="h-3 w-3 text-red-500 fill-red-500 inline" /> for algorithm creators.
			</p>
		</div>
	</div>
</footer>
