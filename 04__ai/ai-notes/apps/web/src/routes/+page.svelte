<script lang="ts">
    import { APP_NAME } from "@repo/shared";
	let { data } = $props();
	let user = $derived(data?.user);
</script>

<svelte:head>
	<title>AI Notes | Intelligent Note Taking</title>
	<meta name="description" content="Organize your thoughts with the power of artificial intelligence." />
</svelte:head>

<div class="flex-grow flex flex-col items-center justify-center bg-radial from-slate-900 to-black px-6 py-20 text-center relative overflow-hidden">
	<!-- Background glow circles -->
	<div class="absolute w-[500px] h-[500px] rounded-full bg-violet-600/5 blur-3xl -top-20 -left-20 pointer-events-none"></div>
	<div class="absolute w-[500px] h-[500px] rounded-full bg-indigo-600/5 blur-3xl -bottom-20 -right-20 pointer-events-none"></div>

	<div class="max-w-3xl mx-auto space-y-8 relative z-10">
		<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
			✨ Powered by Groq & LangChain
		</span>
		
		<h1 class="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
			Note-taking, <br />
			<span class="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
				re-imagined with AI
			</span>
		</h1>

		<p class="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
			Capture ideas, draft documents, and organize your knowledge with real-time AI assistance, auto-formatting, translations, and intelligent search.
		</p>

		<div class="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
			{#if user}
				<a 
					href="/dashboard" 
					class="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-xl px-8 py-3.5 text-base shadow-lg shadow-violet-950/20 active:scale-[0.98] transition-all duration-200"
				>
					Go to Dashboard
				</a>
			{:else}
				<a 
					href="/register" 
					class="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-xl px-8 py-3.5 text-base shadow-lg shadow-violet-950/20 active:scale-[0.98] transition-all duration-200"
				>
					Get Started Free
				</a>
				<a 
					href="/login" 
					class="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-medium rounded-xl px-8 py-3.5 text-base active:scale-[0.98] transition-all duration-200"
				>
					Sign In
				</a>
			{/if}
		</div>
	</div>
</div>