<script lang="ts">
	import { authClient } from "$lib/auth/client.js";
	import { goto } from "$app/navigation";

	let { data } = $props();
	let user = $derived(data.user);
	let loggingOut = $state(false);

	async function handleLogout() {
		loggingOut = true;
		try {
			await authClient.signOut();
			await goto("/login");
		} catch (error) {
			console.error("Logout failed:", error);
		} finally {
			loggingOut = false;
		}
	}
</script>

<svelte:head>
	<title>Dashboard | AI Notes</title>
</svelte:head>

<div class="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 relative overflow-hidden">
	<!-- Background glow circles -->
	<div class="absolute w-96 h-96 rounded-full bg-violet-600/5 blur-3xl -top-12 -left-12 pointer-events-none"></div>
	<div class="absolute w-96 h-96 rounded-full bg-indigo-600/5 blur-3xl -bottom-12 -right-12 pointer-events-none"></div>

	<div class="max-w-6xl mx-auto space-y-8 relative z-10">
		<!-- Header -->
		<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-6">
			<div>
				<h1 class="text-3xl font-extrabold tracking-tight text-white">Dashboard</h1>
				<p class="text-slate-400 mt-1">Hello, <span class="text-violet-400 font-medium">{user?.name || 'User'}</span></p>
			</div>
			
			<button 
				onclick={handleLogout} 
				disabled={loggingOut}
				class="bg-slate-900 border border-slate-800 hover:bg-slate-800/80 hover:text-white text-slate-300 font-medium px-4 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer active:scale-[0.98]"
			>
				{#if loggingOut}
					Logging out...
				{:else}
					Sign Out
				{/if}
			</button>
		</div>

		<!-- Grid Layout -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<!-- AI Usage Card -->
			<div class="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl p-6 space-y-4">
				<h2 class="text-lg font-bold text-white flex items-center gap-2">
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-violet-400"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
					AI Usage
				</h2>
				
				<div class="space-y-3">
					<div class="flex justify-between text-xs text-slate-400">
						<span>API Queries</span>
						<span>12 / 100</span>
					</div>
					<div class="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-850">
						<div class="bg-gradient-to-r from-violet-500 to-indigo-500 h-full rounded-full" style="width: 12%"></div>
					</div>
					
					<div class="flex justify-between text-xs text-slate-400 mt-2">
						<span>Tokens Consumed</span>
						<span>45,210 / 500k</span>
					</div>
					<div class="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-850">
						<div class="bg-gradient-to-r from-violet-500 to-indigo-500 h-full rounded-full" style="width: 9%"></div>
					</div>
				</div>
			</div>

			<!-- Quick Action Card -->
			<div class="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl p-6 flex flex-col justify-between space-y-4">
				<div>
					<h2 class="text-lg font-bold text-white">Create New Note</h2>
					<p class="text-slate-400 text-sm mt-1">Start writing with real-time AI assistance, auto-formatting, and translation.</p>
				</div>
				
				<button class="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-lg px-4 py-2.5 text-sm shadow-lg shadow-violet-950/20 active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
					Create Note
				</button>
			</div>

			<!-- Quick Profile Summary -->
			<div class="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl p-6 space-y-4">
				<h2 class="text-lg font-bold text-white">User Profile</h2>
				<div class="flex items-center gap-4">
					<div class="w-12 h-12 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
						{user?.name?.charAt(0).toUpperCase() || 'U'}
					</div>
					<div>
						<div class="text-sm font-semibold text-white">{user?.name}</div>
						<div class="text-xs text-slate-400">{user?.email}</div>
					</div>
				</div>
				<div class="text-xs text-slate-500 pt-2 border-t border-slate-800/50">
					Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
				</div>
			</div>
		</div>

		<!-- Recent Notes Section -->
		<div class="space-y-4">
			<h2 class="text-xl font-extrabold tracking-tight text-white">Recent Notes</h2>
			
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<!-- Note Placeholder 1 -->
				<div class="group bg-slate-900/20 hover:bg-slate-900/40 border border-slate-800/50 hover:border-violet-500/30 rounded-xl p-6 transition-all duration-200 space-y-3 cursor-pointer">
					<div class="flex justify-between items-start">
						<span class="bg-violet-500/10 text-violet-400 text-xs px-2.5 py-1 rounded-full font-medium">Idea</span>
						<span class="text-xs text-slate-500">2 hours ago</span>
					</div>
					<h3 class="text-base font-bold text-white group-hover:text-violet-400 transition-colors">💡 Project Ideas for Groq API</h3>
					<p class="text-slate-400 text-sm line-clamp-3 leading-relaxed">
						Explore combining LangChain agents with the ultra-fast Groq llama3-70b model. We can build real-time voice translation and note summarizers...
					</p>
				</div>

				<!-- Note Placeholder 2 -->
				<div class="group bg-slate-900/20 hover:bg-slate-900/40 border border-slate-800/50 hover:border-violet-500/30 rounded-xl p-6 transition-all duration-200 space-y-3 cursor-pointer">
					<div class="flex justify-between items-start">
						<span class="bg-indigo-500/10 text-indigo-400 text-xs px-2.5 py-1 rounded-full font-medium">Work</span>
						<span class="text-xs text-slate-500">Yesterday</span>
					</div>
					<h3 class="text-base font-bold text-white group-hover:text-violet-400 transition-colors">📝 SvelteKit 5 Migration Guide</h3>
					<p class="text-slate-400 text-sm line-clamp-3 leading-relaxed">
						Runes ($state, $derived, $effect) simplify state management. Layouts and server loads map directly to page endpoints. Make sure to check library compatibility...
					</p>
				</div>

				<!-- Note Placeholder 3 -->
				<div class="group bg-slate-900/20 hover:bg-slate-900/40 border border-slate-800/50 hover:border-violet-500/30 rounded-xl p-6 transition-all duration-200 space-y-3 cursor-pointer">
					<div class="flex justify-between items-start">
						<span class="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-medium">Personal</span>
						<span class="text-xs text-slate-500">3 days ago</span>
					</div>
					<h3 class="text-base font-bold text-white group-hover:text-violet-400 transition-colors">🛒 Weekly Grocery List</h3>
					<p class="text-slate-400 text-sm line-clamp-3 leading-relaxed">
						Organic avocados, Greek yogurt, coffee beans (medium roast), fresh spinach, high-protein oats, and almond milk. Check local farmer market prices.
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
