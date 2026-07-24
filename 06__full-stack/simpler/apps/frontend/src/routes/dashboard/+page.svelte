<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';

	async function handleLogout() {
		await auth.logout();
		goto('/login');
	}
</script>

<div
	class="w-full max-w-2xl rounded-2xl border border-slate-700/50 bg-slate-800/60 p-8 shadow-2xl backdrop-blur-md"
>
	<div class="flex items-center justify-between border-b border-slate-700/60 pb-6">
		<div>
			<h1 class="text-2xl font-bold text-white">Dashboard</h1>
		</div>

		<button
			onclick={handleLogout}
			class="rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-slate-700 hover:text-white focus:ring-2 focus:ring-slate-500/50 focus:outline-none"
		>
			Sign Out
		</button>
	</div>

	<div class="mt-8 rounded-xl border border-slate-700/40 bg-slate-900/40 p-6">
		{#if auth.user}
			<div class="flex items-center gap-4">
				<div
					class="flex h-12 w-12 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-600/20 text-lg font-semibold text-indigo-400"
				>
					{auth.user.email[0].toUpperCase()}
				</div>
				<div>
					<p class="text-xs font-medium tracking-wider text-slate-400 uppercase">Signed in as</p>
					<p class="text-lg font-semibold text-white">{auth.user.email}</p>
				</div>
			</div>
		{/if}
	</div>
</div>
