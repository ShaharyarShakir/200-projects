<script lang="ts">
	import {
		ChevronDown,
		MessageCircle,
		Send,
		AtSign,
		FileText,
		Image as ImageIcon,
		MessageSquare,
		Video
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
		<span>Tools</span>
		<ChevronDown class="h-4 w-4 opacity-70 transition-transform {isOpen ? 'rotate-180' : ''}" />
	</button>

	{#if isOpen}
		<div class="absolute left-[-50px] top-full mt-2 w-[600px] rounded-3xl bg-[#0f121d] border border-white/10 shadow-2xl p-6 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
			<div class="grid grid-cols-3 gap-6">
				<!-- Fake Chats -->
				<div>
					<div class="text-[10px] font-bold tracking-widest text-emerald-400 uppercase mb-3 px-1">FAKE CHATS</div>
					<div class="space-y-1.5 text-xs text-gray-300">
						<a href="/app" onclick={onClose} class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 hover:text-emerald-400">
							<MessageCircle class="h-3.5 w-3.5 text-emerald-400" /> Fake Text
						</a>
						<a href="/app" onclick={onClose} class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 hover:text-emerald-400">
							<MessageCircle class="h-3.5 w-3.5 text-green-400" /> Fake WhatsApp
						</a>
						<a href="/app" onclick={onClose} class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 hover:text-emerald-400">
							<Send class="h-3.5 w-3.5 text-indigo-400" /> Fake Discord
						</a>
						<a href="/app" onclick={onClose} class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 hover:text-emerald-400">
							<AtSign class="h-3.5 w-3.5 text-pink-400" /> Fake Instagram DM
						</a>
					</div>
				</div>

				<!-- Fake Posts -->
				<div>
					<div class="text-[10px] font-bold tracking-widest text-cyan-400 uppercase mb-3 px-1">FAKE POSTS</div>
					<div class="space-y-1.5 text-xs text-gray-300">
						<a href="/app" onclick={onClose} class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 hover:text-cyan-400">
							<Send class="h-3.5 w-3.5 text-sky-400" /> Fake Tweet
						</a>
						<a href="/app" onclick={onClose} class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 hover:text-cyan-400">
							<FileText class="h-3.5 w-3.5 text-orange-400" /> Reddit Post
						</a>
						<a href="/app" onclick={onClose} class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 hover:text-cyan-400">
							<ImageIcon class="h-3.5 w-3.5 text-purple-400" /> Fake IG Story
						</a>
						<a href="/app" onclick={onClose} class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 hover:text-cyan-400">
							<FileText class="h-3.5 w-3.5 text-yellow-400" /> Fake Notes
						</a>
					</div>
				</div>

				<!-- Fake Comments -->
				<div>
					<div class="text-[10px] font-bold tracking-widest text-purple-400 uppercase mb-3 px-1">FAKE COMMENTS</div>
					<div class="space-y-1.5 text-xs text-gray-300">
						<a href="/app" onclick={onClose} class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 hover:text-purple-400">
							<MessageSquare class="h-3.5 w-3.5 text-red-400" /> TikTok Comments
						</a>
						<a href="/app" onclick={onClose} class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 hover:text-purple-400">
							<Video class="h-3.5 w-3.5 text-red-500" /> YouTube Comments
						</a>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
