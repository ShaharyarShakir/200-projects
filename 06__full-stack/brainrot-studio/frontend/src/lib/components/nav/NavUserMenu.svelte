<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/state/auth.svelte';
	import { toast } from '$lib/state/toast.svelte';
	import {
		Plus,
		MessageSquare,
		Sparkles,
		Zap,
		ChevronDown,
		User,
		Settings,
		LogOut
	} from 'lucide-svelte';

	let {
		onOpenCreateModal
	}: {
		onOpenCreateModal: () => void;
	} = $props();

	let isProfileOpen = $state(false);

	function handleLogout() {
		auth.logout();
		toast.show('Logged out successfully', 'info');
		goto('/login');
	}
</script>

<div class="flex items-center gap-3">
	<!-- Feedback Button -->
	<button
		onclick={() => toast.show('Feedback modal opened', 'info')}
		class="hidden md:flex p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors border border-white/5"
		title="Send Feedback"
	>
		<MessageSquare class="h-4 w-4" />
	</button>

	<!-- + New Video CTA Button -->
	<button
		onclick={onOpenCreateModal}
		class="btn-emerald text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 font-bold shadow-lg shadow-emerald-500/20"
	>
		<Plus class="h-4 w-4" />
		<span>New video</span>
	</button>

	<!-- Credits Widget Badge -->
	<div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold">
		<span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">PLAN</span>
		<div class="flex items-center gap-1 text-emerald-400 font-bold">
			<Zap class="h-3.5 w-3.5 fill-emerald-400" />
			<span>Free</span>
		</div>
		<span class="text-gray-500">•</span>
		<span class="text-gray-300">230 credits</span>
		<button
			onclick={() => toast.show('Upgrade plan modal', 'info')}
			class="text-xs font-extrabold text-amber-400 hover:text-amber-300 ml-1"
		>
			Upgrade
		</button>
	</div>

	<!-- Profile Avatar Dropdown -->
	<div class="relative">
		<button
			onclick={() => (isProfileOpen = !isProfileOpen)}
			class="flex items-center gap-2 p-1 rounded-xl hover:bg-white/5 transition-colors"
		>
			<div class="h-8 w-8 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-500 p-0.5 shadow-md">
				<div class="h-full w-full rounded-full bg-[#08090d] flex items-center justify-center text-xs font-bold text-white uppercase">
					{auth.user?.full_name ? auth.user.full_name[0] : auth.user?.email ? auth.user.email[0] : 'U'}
				</div>
			</div>
			<ChevronDown class="h-3.5 w-3.5 text-gray-400" />
		</button>

		{#if isProfileOpen}
			<div class="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[#0f121d] border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
				<div class="p-3 border-b border-white/10">
					<p class="text-xs font-bold text-white truncate">{auth.user?.full_name || 'Creator User'}</p>
					<p class="text-[11px] text-gray-400 truncate">{auth.user?.email || 'user@brainrot.ai'}</p>
				</div>

				<div class="p-1 space-y-0.5">
					<a href="/app" onclick={() => (isProfileOpen = false)} class="flex items-center gap-2 p-2 rounded-xl text-xs text-gray-300 hover:bg-white/5 hover:text-white">
						<User class="h-4 w-4 text-emerald-400" /> Profile & Account
					</a>
					<a href="/app" onclick={() => (isProfileOpen = false)} class="flex items-center gap-2 p-2 rounded-xl text-xs text-gray-300 hover:bg-white/5 hover:text-white">
						<Settings class="h-4 w-4 text-cyan-400" /> Settings
					</a>
					<button
						onclick={handleLogout}
						class="w-full flex items-center gap-2 p-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 text-left font-semibold"
					>
						<LogOut class="h-4 w-4" /> Sign Out
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
