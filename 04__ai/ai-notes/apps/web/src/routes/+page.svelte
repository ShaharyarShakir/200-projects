<script lang="ts">
	import { APP_NAME } from '@repo/shared';
	import GlowBg from '../components/GlowBg.svelte';
	import Button from '../components/Button.svelte';

	let { data } = $props();
	let user = $derived(data?.user);
</script>

<svelte:head>
	<title>AI Notes | Intelligent Note Taking</title>
	<meta
		name="description"
		content="Organize your thoughts with the power of artificial intelligence."
	/>
</svelte:head>

<div
	class="relative flex flex-grow flex-col items-center justify-center bg-slate-950 px-6 py-20 text-center"
>
	<!-- Background Orbs Component -->
	<GlowBg />

	<div class="relative z-10 mx-auto max-w-3xl space-y-8">
		<span
			class="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-400 shadow-inner"
		>
			✨ Powered by Groq & LangChain
		</span>

		<h1 class="text-5xl leading-tight font-extrabold tracking-tight text-white md:text-7xl">
			Note-taking, <br />
			<span
				class="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-sm"
			>
				re-imagined with AI
			</span>
		</h1>

		<p class="mx-auto max-w-2xl text-lg leading-relaxed font-light text-slate-400 md:text-xl">
			Capture ideas, draft documents, and organize your knowledge with real-time AI assistance,
			auto-formatting, translations, and intelligent search.
		</p>

		<div
			class="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-4 pt-4 sm:flex-row"
		>
			{#if user}
				<Button
					variant="primary"
					class="w-full px-8 py-3.5 text-base sm:w-auto"
					onclick={() => (window.location.href = '/dashboard')}
				>
					Go to Dashboard
				</Button>
			{:else}
				<Button
					variant="primary"
					class="w-full px-8 py-3.5 text-base sm:w-auto"
					onclick={() => (window.location.href = '/register')}
				>
					Get Started Free
				</Button>
				<Button
					variant="secondary"
					class="w-full px-8 py-3.5 text-base sm:w-auto"
					onclick={() => (window.location.href = '/login')}
				>
					Sign In
				</Button>
			{/if}
		</div>
	</div>
</div>
