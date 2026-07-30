<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import type { ActionData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Github, ShieldAlert, KeyRound } from 'lucide-svelte';

	let { form }: { form: ActionData } = $props();

	// Read error query parameters for friendly messaging
	const errorParam = $derived($page.url.searchParams.get('error'));
	const messageParam = $derived($page.url.searchParams.get('message'));

	// Determine custom friendly error message
	const errorMessage = $derived.by(() => {
		if (form?.message) return form.message;
		if (errorParam === 'session_expired') return 'Session expired. Please log in again.';
		if (errorParam === 'access_denied')
			return 'Access denied. You do not have permission to view that page.';
		if (errorParam === 'auth_failed') return 'Authentication failed. Please try again.';
		if (messageParam) return messageParam;
		return null;
	});
</script>

<div
	class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 p-6 font-sans text-slate-100 select-none"
>
	<!-- Background Glows -->
	<div
		class="pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[120px]"
	></div>

	<!-- Login Card Wrapper -->
	<div
		class="z-10 flex w-full max-w-md flex-col items-center rounded-2xl border border-slate-900 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-md transition duration-300 hover:border-slate-800"
	>
		<!-- Brand & Logo -->
		<div
			class="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-600/10 text-blue-500 shadow-inner"
		>
			<Github class="h-7 w-7" />
		</div>

		<h2 class="mb-1 text-2xl font-bold tracking-tight text-white">Welcome to GitDash</h2>
		<p class="mb-8 max-w-[280px] text-center text-sm font-light text-slate-400">
			Manage and analyze all your GitHub repositories in one place.
		</p>

		<!-- Error Alerts -->
		{#if errorMessage}
			<div
				class="animate-fade-in mb-6 flex w-full items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3.5 text-xs text-red-400"
			>
				<ShieldAlert class="mt-0.5 h-4 w-4 shrink-0" />
				<div class="flex flex-col gap-0.5">
					<span class="font-semibold">Authentication Alert</span>
					<span class="leading-normal text-slate-400">{errorMessage}</span>
				</div>
			</div>
		{/if}

		<!-- OAuth Login Form -->
		<form method="post" action="?/signInSocial" use:enhance class="w-full">
			<input type="hidden" name="provider" value="github" />
			<Button
				type="submit"
				class="flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-white font-semibold text-slate-950 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100"
			>
				<Github class="h-5 w-5 text-slate-950" />
				<span>Continue with GitHub</span>
			</Button>
		</form>

		<!-- Additional Footer info -->
		<div class="mt-8 flex items-center gap-1.5 text-[10px] font-medium text-slate-600">
			<KeyRound class="h-3.5 w-3.5" />
			<span>Secured via Better Auth cookie sessions</span>
		</div>
	</div>

	<!-- Bottom Link to Home -->
	<a href="/" class="mt-6 text-xs text-slate-500 transition duration-150 hover:text-slate-300">
		&larr; Back to landing page
	</a>
</div>
